import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { forbidden, getAuth, unauthorized } from "@/lib/auth";
import { audienceFilter } from "@/lib/notifications";

// Marks a notification read/unread for the signed-in user only.
export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const auth = await getAuth(req);
    if (!auth) return unauthorized();
    const { id } = await ctx.params;
    const body = await req.json().catch(() => ({}));
    const read = body?.read !== false;

    const visible = await db.notification.findFirst({ where: { id, ...(await audienceFilter(auth)) } });
    if (!visible) return forbidden();

    if (read) {
      await db.notificationRead.upsert({
        where: { notificationId_userId: { notificationId: id, userId: auth.id } },
        create: { notificationId: id, userId: auth.id },
        update: {},
      });
    } else {
      await db.notificationRead.deleteMany({ where: { notificationId: id, userId: auth.id } });
    }
    return NextResponse.json({ ok: true, id, read });
  } catch {
    return NextResponse.json({ error: "Could not update notification." }, { status: 500 });
  }
}
