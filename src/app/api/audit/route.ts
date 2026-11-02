import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { forbidden, getAuth, unauthorized } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const auth = await getAuth(req);
    if (!auth) return unauthorized();
    const fineId = req.nextUrl.searchParams.get("fineId");
    const takeRaw = Number(req.nextUrl.searchParams.get("take") || 100);
    const take = Number.isFinite(takeRaw) ? Math.min(Math.max(1, Math.floor(takeRaw)), 200) : 100;

    if (!fineId) {
      // full audit trail is an admin-only view
      if (auth.role !== "ADMIN") return forbidden();
    } else if (auth.role === "STUDENT") {
      // students may only see the history of their own fines
      const fine = await db.fine.findUnique({ where: { id: fineId }, include: { student: { select: { rollNumber: true } } } });
      if (!fine || fine.student.rollNumber !== auth.rollNumber) return forbidden();
    }

    const audits = await db.fineAudit.findMany({
      where: fineId ? { fineId } : undefined,
      orderBy: { createdAt: "desc" },
      take,
      include: {
        fine: {
          select: {
            id: true,
            student: { select: { name: true, rollNumber: true } },
            offence: { select: { name: true, code: true } },
          },
        },
      },
    });
    return NextResponse.json({ audits });
  } catch {
    return NextResponse.json({ error: "Could not load audit trail." }, { status: 500 });
  }
}
