import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// FR-05 — Admin edits catalogue entries; amounts never auto-change existing fines (snapshot preserved)
export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    if (req.headers.get("x-user-role") !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const { id } = await ctx.params;
    const body = await req.json();
    const existing = await db.offence.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: "Offence not found." }, { status: 404 });

    const data: Record<string, unknown> = {};
    if (body.name !== undefined) data.name = String(body.name).trim();
    if (body.description !== undefined) data.description = String(body.description).trim();
    if (body.ruleRef !== undefined) data.ruleRef = String(body.ruleRef).trim();
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
