import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { forbidden, getAuth, unauthorized } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    // hidden (inactive) rules are only visible to admins
    const auth = await getAuth(req);
    const entries = await db.ruleBookEntry.findMany({
      where: auth?.role === "ADMIN" ? undefined : { active: true },
      orderBy: [{ category: "asc" }, { title: "asc" }],
    });
    return NextResponse.json({ entries });
  } catch {
    return NextResponse.json({ error: "Could not load rule book." }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await getAuth(req);
    if (!auth) return unauthorized();
    if (auth.role !== "ADMIN") return forbidden();
    const body = await req.json().catch(() => ({}));
    const category = String(body?.category ?? "").trim();
    const title = String(body?.title ?? "").trim();
    const content = String(body?.content ?? "").trim();
    const ruleRef = String(body?.ruleRef ?? "").trim();
    if (!category || !title || !content) {
      return NextResponse.json({ error: "Category, title and content are required." }, { status: 400 });
    }
    const entry = await db.ruleBookEntry.create({
      data: { category, title, content, ruleRef: ruleRef || null },
    });
    return NextResponse.json({ entry }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Could not create rule." }, { status: 500 });
  }
}
