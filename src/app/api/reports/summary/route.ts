import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { forbidden, getAuth, isStaff, syncOverdue, unauthorized } from "@/lib/auth";

// FR-15 — dashboard/report metrics (admin: global, faculty: own-issued scope)
export async function GET(req: NextRequest) {
  try {
    const auth = await getAuth(req);
    if (!auth) return unauthorized();
    if (!isStaff(auth)) return forbidden();
    await syncOverdue();
    const scope = req.nextUrl.searchParams.get("scope"); // "me" for faculty

    const fines = await db.fine.findMany({
      where: scope === "me" ? { issuedById: auth.id } : undefined,
      include: { offence: { select: { category: true, name: true } }, student: { select: { id: true } } },
    });

    const total = fines.length;
    const paid = fines.filter((f) => f.status === "PAID");
    const pending = fines.filter((f) => f.status === "PENDING");
    const overdue = fines.filter((f) => f.status === "OVERDUE");
    const collected = paid.reduce((s, f) => s + f.amountSnapshot, 0);
    const outstanding = [...pending, ...overdue].reduce((s, f) => s + f.amountSnapshot, 0);
    const totalAmount = collected + outstanding;
    const collectionRate = totalAmount > 0 ? Math.round((collected / totalAmount) * 100) : 0;

    const byCategoryMap: Record<string, { count: number; amount: number }> = {};
    for (const f of fines) {
      const cat = f.offence.category;
      byCategoryMap[cat] = byCategoryMap[cat] || { count: 0, amount: 0 };
      byCategoryMap[cat].count += 1;
      byCategoryMap[cat].amount += f.amountSnapshot;
    }
    const byCategory = Object.entries(byCategoryMap)
      .map(([category, v]) => ({ category, ...v }))
      .sort((a, b) => b.amount - a.amount);

    const months: { key: string; label: string; issued: number; collected: number }[] = [];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push({
        key: `${d.getFullYear()}-${d.getMonth()}`,
        label: d.toLocaleString("en-IN", { month: "short" }),
        issued: 0,
        collected: 0,
      });
    }
    for (const f of fines) {
      const k = `${f.issueDate.getFullYear()}-${f.issueDate.getMonth()}`;
      const m = months.find((x) => x.key === k);
      if (m) m.issued += 1;
      if (f.paymentDate) {
        const pk = `${f.paymentDate.getFullYear()}-${f.paymentDate.getMonth()}`;
        const pm = months.find((x) => x.key === pk);
        if (pm) pm.collected += f.amountSnapshot;
      }
    }

    const topOffencesMap: Record<string, { name: string; count: number; amount: number }> = {};
    for (const f of fines) {
      topOffencesMap[f.offence.name] = topOffencesMap[f.offence.name] || { name: f.offence.name, count: 0, amount: 0 };
      topOffencesMap[f.offence.name].count += 1;
      topOffencesMap[f.offence.name].amount += f.amountSnapshot;
    }
    const topOffences = Object.values(topOffencesMap).sort((a, b) => b.count - a.count).slice(0, 6);

    return NextResponse.json({
      total,
      paidCount: paid.length,
      pendingCount: pending.length,
      overdueCount: overdue.length,
      collected,
      outstanding,
      totalAmount,
      collectionRate,
      studentsWithFines: new Set(fines.map((f) => f.student.id)).size,
      byCategory,
      byMonth: months,
      topOffences,
    });
  } catch {
    return NextResponse.json({ error: "Could not compute summary." }, { status: 500 });
  }
}
