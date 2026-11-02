import { createHmac, randomBytes, timingSafeEqual } from "crypto";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";

/**
 * Stateless signed session tokens (HMAC-SHA256).
 *
 * Before this, every API route trusted `x-user-role` / `x-user-id` headers sent by
 * the browser, so anyone could call the API as ADMIN by editing a header. Now the
 * server signs a token at login and derives identity + role from it on every call.
 *
 * Set AUTH_SECRET in the environment for production. Without it a random secret is
 * generated per server process (sessions then reset when the server restarts).
 */

export type Role = "ADMIN" | "FACULTY" | "STUDENT";

export interface AuthUser {
  id: string;
  name: string;
  role: Role;
  rollNumber: string | null;
}

const TOKEN_TTL_MS = 12 * 60 * 60 * 1000; // 12 hours

const g = globalThis as unknown as { __unifineSecret?: string };

function secret(): string {
  if (process.env.AUTH_SECRET && process.env.AUTH_SECRET.length >= 16) return process.env.AUTH_SECRET;
  if (!g.__unifineSecret) {
    g.__unifineSecret = randomBytes(32).toString("hex");
    if (process.env.NODE_ENV === "production") {
      console.warn("[unifine] AUTH_SECRET is not set — using a random per-process secret. Set AUTH_SECRET (16+ chars).");
    }
  }
  return g.__unifineSecret;
}

const sign = (payload: string) => createHmac("sha256", secret()).update(payload).digest("base64url");

export function issueToken(user: { id: string }): string {
  const payload = Buffer.from(JSON.stringify({ sub: user.id, exp: Date.now() + TOKEN_TTL_MS })).toString("base64url");
  return `${payload}.${sign(payload)}`;
}

function readToken(token: string): string | null {
  const [payload, sig] = token.split(".");
  if (!payload || !sig) return null;
  const expected = Buffer.from(sign(payload));
  const given = Buffer.from(sig);
  if (expected.length !== given.length || !timingSafeEqual(expected, given)) return null;
  try {
    const data = JSON.parse(Buffer.from(payload, "base64url").toString()) as { sub?: string; exp?: number };
    if (!data.sub || !data.exp || data.exp < Date.now()) return null;
    return data.sub;
  } catch {
    return null;
  }
}

/** Resolve the signed-in user from the Authorization header (re-validated against the DB). */
export async function getAuth(req: NextRequest): Promise<AuthUser | null> {
  const header = req.headers.get("authorization") ?? "";
  const token = header.startsWith("Bearer ") ? header.slice(7).trim() : "";
  if (!token) return null;
  const userId = readToken(token);
  if (!userId) return null;
  const user = await db.user.findUnique({ where: { id: userId } });
  if (!user || user.status !== "ACTIVE") return null;
  if (user.role !== "ADMIN" && user.role !== "FACULTY" && user.role !== "STUDENT") return null;
  return { id: user.id, name: user.name, role: user.role, rollNumber: user.rollNumber };
}

export const unauthorized = () =>
  NextResponse.json({ error: "Your session has expired. Please sign in again." }, { status: 401 });
export const forbidden = (msg = "You don't have permission to do that.") =>
  NextResponse.json({ error: msg }, { status: 403 });

export const isStaff = (u: AuthUser | null): u is AuthUser => !!u && (u.role === "ADMIN" || u.role === "FACULTY");

/** Marks unpaid fines whose due date has passed as OVERDUE (status was never auto-updated before). */
export async function syncOverdue(): Promise<void> {
  await db.fine.updateMany({
    where: { status: "PENDING", dueDate: { lt: new Date() } },
    data: { status: "OVERDUE" },
  });
}
