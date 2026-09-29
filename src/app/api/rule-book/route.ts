import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const entries = await db.ruleBookEntry.findMany({ orderBy: [{ category: "asc" }, { title: "asc" }] });
    return NextResponse.json({ entries });
  } catch {
    return NextResponse.json({ error: "Could not load rule book." }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    if (req.headers.get("x-user-role") !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const { category, title, content, ruleRef } = await req.json();
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
