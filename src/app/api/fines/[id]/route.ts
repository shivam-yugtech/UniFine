import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { forbidden, getAuth, isStaff, unauthorized } from "@/lib/auth";

const STATUSES = new Set(["PENDING", "PAID", "OVERDUE"]);

// FR-11 — Admin correction with audit trail; faculty may only mark PAID per policy.
// Students can never modify fines (previously a student could PATCH their own fine to PAID).
export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const auth = await getAuth(req);
    if (!auth) return unauthorized();
    if (!isStaff(auth)) return forbidden("Students cannot modify fine records.");

    const { id } = await ctx.params;
    const fine = await db.fine.findUnique({ where: { id }, include: { offence: true, student: true } });
    if (!fine) return NextResponse.json({ error: "Fine not found." }, { status: 404 });

    const body = await req.json().catch(() => null);
    if (!body) return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
    const { status, amount, reason } = body;
    const note = typeof body.note === "string" ? body.note.trim().slice(0, 500) : "";
    const oldValues: Record<string, unknown> = { status: fine.status, amount: fine.amountSnapshot, reason: fine.reason };
    const data: Record<string, unknown> = {};

    if (status !== undefined && status !== fine.status) {
      if (!STATUSES.has(status)) return NextResponse.json({ error: "Unknown status." }, { status: 400 });
      if (auth.role !== "ADMIN" && status !== "PAID") {
        return forbidden("Only admins can change status to something other than Paid.");
      }
      data.status = status;
      // keep paymentDate consistent with status
      data.paymentDate = status === "PAID" ? new Date() : null;
    }
    if (amount !== undefined && amount !== null && amount !== "" && Number(amount) !== fine.amountSnapshot) {
      if (auth.role !== "ADMIN") return forbidden("Only admins can correct amounts.");
      const amt = Number(amount);
      if (!Number.isFinite(amt) || amt <= 0) {
        return NextResponse.json({ error: "Amount must be a positive number." }, { status: 400 });
      }
      data.amountSnapshot = Math.round(amt * 100) / 100;
      data.corrected = true;
    }
    if (typeof reason === "string" && reason.trim() !== (fine.reason ?? "")) {
      if (auth.role !== "ADMIN") return forbidden("Only admins can edit the reason.");
      data.reason = reason.trim().slice(0, 500) || null;
      data.corrected = true;
    }

    // Note-only submissions record an accountability entry without changing the fine
    const noteOnly = Object.keys(data).length === 0 && !!note;
    if (Object.keys(data).length === 0 && !noteOnly) {
      return NextResponse.json({ error: "Nothing to update — change a field or add a note." }, { status: 400 });
    }

    const onlyPaid = data.status === "PAID" && Object.keys(data).every((k) => k === "status" || k === "paymentDate");

    const updated = await db.$transaction(async (tx) => {
      const u = noteOnly ? fine : await tx.fine.update({ where: { id }, data });
      await tx.fineAudit.create({
        data: {
          fineId: id,
          actorId: auth.id,
          actorName: auth.name,
          action: noteOnly ? "STATUS_UPDATED" : onlyPaid ? "MARKED_PAID" : "CORRECTED",
          oldValues: JSON.stringify(oldValues),
          newValues: JSON.stringify({
            status: u.status,
            amount: u.amountSnapshot,
            reason: u.reason,
          }),
          note: note || (onlyPaid ? "Marked as paid." : "Correction recorded."),
        },
      });
      return u;
    });

    if (data.status === "PAID") {
      await db.notification.create({
        data: {
          audience: "USER",
          userId: fine.studentId,
          type: "PAYMENT",
          title: "Payment received — thank you!",
          message: `Your payment of ₹${updated.amountSnapshot.toLocaleString("en-IN")} for "${fine.offence.name}" was recorded.`,
        },
      });
    } else if (!noteOnly) {
      await db.notification.create({
        data: {
          audience: "USER",
          userId: fine.studentId,
          type: "STATUS",
          title: "Fine record updated",
          message: `Your fine for "${fine.offence.name}" was corrected by the administration.${note ? ` Note: ${note}` : ""}`,
        },
      });
    }

    return NextResponse.json({ fine: updated });
  } catch {
    return NextResponse.json({ error: "Correction failed. The record is unchanged." }, { status: 500 });
  }
}
