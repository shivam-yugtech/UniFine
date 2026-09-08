import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const role = req.headers.get("x-user-role");
    if (!role) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const fineId = req.nextUrl.searchParams.get("fineId");
    const take = Number(req.nextUrl.searchParams.get("take") || 100);
    const audits = await db.fineAudit.findMany({
      where: fineId ? { fineId } : undefined,
      orderBy: { createdAt: "desc" },
      take: Math.min(take, 200),
      include: { fine: { select: { id: true, student: { select: { name: true, rollNumber: true } }, offence: { select: { name: true, code: true } } } } },
    });
    return NextResponse.json({ audits });
  } catch {
    return NextResponse.json({ error: "Could not load audit trail." }, { status: 500 });
  }
}
