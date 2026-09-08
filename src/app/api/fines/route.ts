import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// FR-14 — searchable / filterable fine history
export async function GET(req: NextRequest) {
  try {
    const sp = req.nextUrl.searchParams;
    const role = req.headers.get("x-user-role");
    if (!role) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const where: Record<string, unknown> = {};
    const studentId = sp.get("studentId");
    const status = sp.get("status");
    const issuedBy = sp.get("issuedBy");
    const offenceId = sp.get("offenceId");
    const q = sp.get("q");

    // FR-12 — students may only ever read their own records
    if (role === "STUDENT") {
      const roll = req.headers.get("x-user-roll");
      const student = roll ? await db.student.findUnique({ where: { rollNumber: roll } }) : null;
      if (!student) return NextResponse.json({ fines: [] });
      where.studentId = student.id;
    } else if (studentId) where.studentId = studentId;

    if (status && status !== "ALL") where.status = status;
    if (issuedBy && issuedBy !== "ALL") where.issuedById = issuedBy;
    if (offenceId && offenceId !== "ALL") where.offenceId = offenceId;
    if (q) {
      where.OR = [
        { student: { name: { contains: q } } },
        { student: { rollNumber: { contains: q.toUpperCase() } } },
        { offence: { name: { contains: q } } },
        { reason: { contains: q } },
      ];
    }

    const fines = await db.fine.findMany({
      where,
      orderBy: { issueDate: "desc" },
      include: {
        student: { select: { id: true, name: true, rollNumber: true, programme: true, photoColor: true, department: true } },
        offence: { select: { id: true, name: true, code: true, ruleRef: true, category: true } },
        issuedBy: { select: { id: true, name: true } },
      },
    });
    return NextResponse.json({ fines });
  } catch {
    return NextResponse.json({ error: "Could not load fines." }, { status: 500 });
  }
}

// FR-06/07/08/09/10 — transactional creation: one Fine row per selected offence,
// amounts re-read server-side from the active catalogue (client is never trusted, TRD §9)
export async function POST(req: NextRequest) {
  try {
    const role = req.headers.get("x-user-role");
    const actorId = req.headers.get("x-user-id");
    if ((role !== "ADMIN" && role !== "FACULTY") || !actorId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const body = await req.json();
    const { studentId, offences, dueDate } = body;
    if (!studentId || !Array.isArray(offences) || offences.length === 0) {
      return NextResponse.json({ error: "Student and at least one offence are required." }, { status: 400 });
    }
    const student = await db.student.findUnique({ where: { id: studentId } });
    if (!student) return NextResponse.json({ error: "Student not found." }, { status: 404 });

    const ids = offences.map((o: { offenceId: string }) => o.offenceId);
    if (new Set(ids).size !== ids.length) {
      return NextResponse.json({ error: "Duplicate offences are not allowed in one submission." }, { status: 409 });
    }
    const catalogue = await db.offence.findMany({ where: { id: { in: ids } } });
    const results: { fineId: string; offence: string; amount: number }[] = [];

    const created = await db.$transaction(async (tx) => {
      const rows: { fineId: string; offence: string; amount: number }[] = [];
      for (const item of offences as { offenceId: string; reason?: string }[]) {
        const offence = catalogue.find((c) => c.id === item.offenceId);
        if (!offence) throw new Error("OFFENCE_NOT_FOUND");
        if (!offence.active) throw new Error(`OFFENCE_INACTIVE:${offence.name}`);
        const fine = await tx.fine.create({
          data: {
            studentId,
            offenceId: offence.id,
            issuedById: actorId,
            amountSnapshot: offence.amount, // authoritative server-side amount
            reason: item.reason?.trim() || null,
            dueDate: dueDate ? new Date(dueDate) : new Date(Date.now() + 14 * 86400000),
            status: "PENDING",
          },
        });
        await tx.fineAudit.create({
          data: {
            fineId: fine.id,
            actorId,
            actorName: req.headers.get("x-user-name") || "Staff",
            action: "CREATED",
            newValues: JSON.stringify({ status: "PENDING", amount: offence.amount, offence: offence.name }),
            note: "Fine issued via UniFine portal.",
          },
        });
        rows.push({ fineId: fine.id, offence: offence.name, amount: offence.amount });
      }
      return rows;
    });
    results.push(...created);

    await db.notification.create({
      data: {
        audience: "USER",
        userId: student.id,
        type: "FINE_ISSUED",
        title: `New fine${results.length > 1 ? "s" : ""} issued`,
        message: `${results.length} fine${results.length > 1 ? "s" : ""} totalling ₹${results.reduce((s, r) => s + r.amount, 0)} issued for ${student.name} (${student.rollNumber}).`,
      },
    });

    return NextResponse.json({ created: results }, { status: 201 });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "";
    if (msg === "OFFENCE_NOT_FOUND") {
      return NextResponse.json({ error: "One or more selected offences no longer exist." }, { status: 404 });
    }
    if (msg.startsWith("OFFENCE_INACTIVE")) {
      return NextResponse.json({ error: `"${msg.split(":")[1]}" is inactive and cannot be assigned.` }, { status: 409 });
    }
    return NextResponse.json({ error: "Fine assignment failed. No records were created." }, { status: 500 });
  }
}
