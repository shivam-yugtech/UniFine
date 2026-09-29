import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const activeOnly = req.nextUrl.searchParams.get("active") === "true";
    const offences = await db.offence.findMany({
      where: activeOnly ? { active: true } : undefined,
      orderBy: { code: "asc" },
    });
    return NextResponse.json({ offences });
  } catch {
    return NextResponse.json({ error: "Could not load offences." }, { status: 500 });
  }
}

// FR-05 — Admin manages the offence catalogue
export async function POST(req: NextRequest) {
  try {
    if (req.headers.get("x-user-role") !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const body = await req.json();
    const { code, name, description, ruleRef, category, amount, active } = body;
    if (!code || !name || !ruleRef || !category || amount === undefined || amount === null) {
      return NextResponse.json({ error: "Code, name, rule reference, category and amount are required." }, { status: 400 });
    }
    const amt = Number(amount);
    if (!Number.isFinite(amt) || amt <= 0) {
      return NextResponse.json({ error: "Fine amount must be a positive number." }, { status: 400 });
    }
    const exists = await db.offence.findUnique({ where: { code: String(code).trim().toUpperCase() } });
    if (exists) {
      return NextResponse.json({ error: `Offence code ${code} already exists.` }, { status: 409 });
    }
    const offence = await db.offence.create({
      data: {
        code: String(code).trim().toUpperCase(),
        name: String(name).trim(),
        description: String(description ?? "").trim(),
        ruleRef: String(ruleRef).trim(),
        category: String(category).trim(),
        amount: amt,
        active: active ?? true,
      },
    });
    return NextResponse.json({ offence }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Could not create offence." }, { status: 500 });
  }
}
