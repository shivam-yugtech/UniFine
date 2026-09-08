import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    if (req.headers.get("x-user-role") !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const { id } = await ctx.params;
    const { category, title, content, ruleRef, active } = await req.json();
    const existing = await db.ruleBookEntry.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: "Rule not found." }, { status: 404 });

    const entry = await db.ruleBookEntry.update({
      where: { id },
      data: {
        category: category ?? existing.category,
        title: title ?? existing.title,
        content: content ?? existing.content,
        ruleRef: ruleRef ?? existing.ruleRef,
        active: active ?? existing.active,
        version: existing.version + 1,
      },
    });
    return NextResponse.json({ entry });
  } catch {
    return NextResponse.json({ error: "Could not update rule." }, { status: 500 });
  }
}
