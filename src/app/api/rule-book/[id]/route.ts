import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { forbidden, getAuth, unauthorized } from "@/lib/auth";

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const auth = await getAuth(req);
    if (!auth) return unauthorized();
    if (auth.role !== "ADMIN") return forbidden();
    const { id } = await ctx.params;
    const body = await req.json().catch(() => ({}));
    const pick = (v: unknown) => (typeof v === "string" && v.trim() ? v.trim() : undefined);
    const category = pick(body?.category);
    const title = pick(body?.title);
    const content = pick(body?.content);
    const ruleRef = typeof body?.ruleRef === "string" ? body.ruleRef.trim() || null : undefined;
    const active = typeof body?.active === "boolean" ? body.active : undefined;
    const existing = await db.ruleBookEntry.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: "Rule not found." }, { status: 404 });

    const entry = await db.ruleBookEntry.update({
      where: { id },
      data: {
        category: category ?? existing.category,
        title: title ?? existing.title,
        content: content ?? existing.content,
        ruleRef: ruleRef === undefined ? existing.ruleRef : ruleRef,
        active: active ?? existing.active,
        version: existing.version + 1,
      },
    });
    return NextResponse.json({ entry });
  } catch {
    return NextResponse.json({ error: "Could not update rule." }, { status: 500 });
  }
}
