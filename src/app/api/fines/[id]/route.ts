import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// FR-11 — Admin correction with audit trail; faculty may only mark PAID per policy
export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const role = req.headers.get("x-user-role");
    const actorId = req.headers.get("x-user-id");
    if (!role || !actorId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await ctx.params;
    const fine = await db.fine.findUnique({ where: { id }, include: { offence: true, student: true } });
    if (!fine) return NextResponse.json({ error: "Fine not found." }, { status: 404 });

    const body = await req.json();
    const { status, amount, reason, note } = body;
    const oldValues: Record<string, unknown> = { status: fine.status, amount: fine.amountSnapshot, reason: fine.reason };
    const data: Record<string, unknown> = {};

    if (status && status !== fine.status) {
      if (role !== "ADMIN" && status !== "PAID") {
        return NextResponse.json({ error: "Only admins can change status to something other than Paid." }, { status: 403 });
      }
      data.status = status;
      if (status === "PAID") data.paymentDate = new Date();
    }
    if (amount !== undefined && Number(amount) !== fine.amountSnapshot) {
      if (role !== "ADMIN") return NextResponse.json({ error: "Only admins can correct amounts." }, { status: 403 });
      const amt = Number(amount);
      if (!Number.isFinite(amt) || amt <= 0) {
        return NextResponse.json({ error: "Amount must be a positive number." }, { status: 400 });
      }
      data.amountSnapshot = amt;
      data.corrected = true;
    }
    if (typeof reason === "string" && reason.trim() && reason.trim() !== fine.reason) {
      if (role !== "ADMIN") return NextResponse.json({ error: "Only admins can edit the reason." }, { status: 403 });
      data.reason = reason.trim();
      data.corrected = true;
    }
    // Note-only submissions record an accountability entry without changing the fine
    const noteOnly = Object.keys(data).length === 0 && !!note?.trim();
    if (Object.keys(data).length === 0 && !noteOnly) {
      return NextResponse.json({ error: "Nothing to update — change a field or add a note." }, { status: 400 });
    }

    const updated = await db.$transaction(async (tx) => {
      const u = noteOnly ? fine : await tx.fine.update({ where: { id }, data });
      await tx.fineAudit.create({
        data: {
          fineId: id,
          actorId,
          actorName: req.headers.get("x-user-name") || "Staff",
          action: data.status === "PAID" && Object.keys(data).length === 1 ? "MARKED_PAID" : "CORRECTED",
          oldValues: JSON.stringify(oldValues),
          newValues: JSON.stringify({ ...oldValues, ...data }),
          note: note?.trim() || "Correction recorded.",
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
          message: `Your payment of ₹${updated.amountSnapshot} for "${fine.offence.name}" was recorded.`,
        },
      });
    }

    return NextResponse.json({ fine: updated });
  } catch {
    return NextResponse.json({ error: "Correction failed. The record is unchanged." }, { status: 500 });
  }
}
