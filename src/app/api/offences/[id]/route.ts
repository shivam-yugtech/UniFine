import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { forbidden, getAuth, unauthorized } from "@/lib/auth";

// FR-05 — Admin edits catalogue entries; amounts never auto-change existing fines (snapshot preserved)
export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const auth = await getAuth(req);
    if (!auth) return unauthorized();
    if (auth.role !== "ADMIN") return forbidden();
    const { id } = await ctx.params;
    const body = await req.json().catch(() => null);
    if (!body) return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
    const existing = await db.offence.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: "Offence not found." }, { status: 404 });

    const data: Record<string, unknown> = {};
    if (body.name !== undefined) {
      const name = String(body.name).trim();
      if (!name) return NextResponse.json({ error: "Offence name cannot be empty." }, { status: 400 });
      data.name = name;
    }
    if (body.description !== undefined) data.description = String(body.description).trim();
    if (body.ruleRef !== undefined) {
      const ruleRef = String(body.ruleRef).trim();
      if (!ruleRef) return NextResponse.json({ error: "Rule reference cannot be empty." }, { status: 400 });
      data.ruleRef = ruleRef;
    }
    if (body.category !== undefined) data.category = String(body.category).trim();
    if (body.active !== undefined) data.active = !!body.active;
    if (body.amount !== undefined) {
      const amt = Number(body.amount);
      if (!Number.isFinite(amt) || amt <= 0) {
        return NextResponse.json({ error: "Fine amount must be a positive number." }, { status: 400 });
      }
      data.amount = amt;
    }
    const offence = await db.offence.update({ where: { id }, data });
    return NextResponse.json({ offence });
  } catch {
    return NextResponse.json({ error: "Could not update offence." }, { status: 500 });
  }
}
