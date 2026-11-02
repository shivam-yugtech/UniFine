import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { forbidden, getAuth, isStaff, syncOverdue, unauthorized } from "@/lib/auth";

const STATUSES = new Set(["PENDING", "PAID", "OVERDUE"]);
const MAX_REASON = 500;

// FR-14 — searchable / filterable fine history
export async function GET(req: NextRequest) {
  try {
    const auth = await getAuth(req);
    if (!auth) return unauthorized();
    await syncOverdue();

    const sp = req.nextUrl.searchParams;
    const where: Record<string, unknown> = {};
    const studentId = sp.get("studentId");
    const status = sp.get("status");
    const issuedBy = sp.get("issuedBy");
    const offenceId = sp.get("offenceId");
    const q = sp.get("q")?.trim();

    // FR-12 — students may only ever read their own records
    if (auth.role === "STUDENT") {
      const student = auth.rollNumber
        ? await db.student.findUnique({ where: { rollNumber: auth.rollNumber } })
        : null;
      if (!student) return NextResponse.json({ fines: [] });
      where.studentId = student.id;
    } else if (studentId) where.studentId = studentId;

    if (status && STATUSES.has(status)) where.status = status;
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
    const auth = await getAuth(req);
    if (!auth) return unauthorized();
    if (!isStaff(auth)) return forbidden("Only faculty and admins can assign fines.");

    const body = await req.json().catch(() => null);
    if (!body) return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
    const { studentId, offences, dueDate } = body;
    if (!studentId || !Array.isArray(offences) || offences.length === 0) {
      return NextResponse.json({ error: "Student and at least one offence are required." }, { status: 400 });
    }
    if (offences.length > 20) {
      return NextResponse.json({ error: "Too many offences in one submission (max 20)." }, { status: 400 });
    }

    // Due date: must be a real date, today or later (defaults to 14 days)
    let due = new Date(Date.now() + 14 * 86400000);
    if (dueDate) {
      const parsed = new Date(`${String(dueDate).slice(0, 10)}T23:59:59`);
      if (Number.isNaN(parsed.getTime())) {
        return NextResponse.json({ error: "Due date is not a valid date." }, { status: 400 });
      }
      if (parsed.getTime() < Date.now()) {
        return NextResponse.json({ error: "Due date cannot be in the past." }, { status: 400 });
      }
      due = parsed;
    }

    const student = await db.student.findUnique({ where: { id: String(studentId) } });
    if (!student) return NextResponse.json({ error: "Student not found." }, { status: 404 });

    const items = offences as { offenceId: string; reason?: string }[];
    const ids = items.map((o) => String(o?.offenceId ?? ""));
    if (ids.some((id) => !id)) {
      return NextResponse.json({ error: "Every offence entry needs an offence id." }, { status: 400 });
    }
    if (new Set(ids).size !== ids.length) {
      return NextResponse.json({ error: "Duplicate offences are not allowed in one submission." }, { status: 409 });
    }
    const catalogue = await db.offence.findMany({ where: { id: { in: ids } } });

    const created = await db.$transaction(async (tx) => {
      const rows: { fineId: string; offence: string; amount: number }[] = [];
      for (const item of items) {
        const offence = catalogue.find((c) => c.id === item.offenceId);
        if (!offence) throw new Error("OFFENCE_NOT_FOUND");
        if (!offence.active) throw new Error(`OFFENCE_INACTIVE:${offence.name}`);
        const reason = typeof item.reason === "string" ? item.reason.trim().slice(0, MAX_REASON) : "";
        const fine = await tx.fine.create({
          data: {
            studentId: student.id,
            offenceId: offence.id,
            issuedById: auth.id,
            amountSnapshot: offence.amount, // authoritative server-side amount
            reason: reason || null,
            dueDate: due,
            status: "PENDING",
          },
        });
        await tx.fineAudit.create({
          data: {
            fineId: fine.id,
            actorId: auth.id,
            actorName: auth.name,
            action: "CREATED",
            newValues: JSON.stringify({ status: "PENDING", amount: offence.amount, offence: offence.name }),
            note: "Fine issued via UniFine portal.",
          },
        });
        rows.push({ fineId: fine.id, offence: offence.name, amount: offence.amount });
      }
      return rows;
    });

    const total = created.reduce((s, r) => s + r.amount, 0);
    await db.notification.create({
      data: {
        audience: "USER",
        userId: student.id,
        type: "FINE_ISSUED",
        title: `New fine${created.length > 1 ? "s" : ""} issued`,
        message: `${created.length} fine${created.length > 1 ? "s" : ""} totalling ₹${total.toLocaleString("en-IN")} issued for ${student.name} (${student.rollNumber}).`,
      },
    });

    return NextResponse.json({ created }, { status: 201 });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "";
    if (msg === "OFFENCE_NOT_FOUND") {
      return NextResponse.json({ error: "One or more selected offences no longer exist." }, { status: 404 });
    }
    if (msg.startsWith("OFFENCE_INACTIVE")) {
      return NextResponse.json({ error: `"${msg.slice("OFFENCE_INACTIVE:".length)}" is inactive and cannot be assigned.` }, { status: 409 });
    }
    return NextResponse.json({ error: "Fine assignment failed. No records were created." }, { status: 500 });
  }
}
