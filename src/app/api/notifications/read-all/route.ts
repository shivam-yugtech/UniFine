import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAuth, unauthorized } from "@/lib/auth";
import { audienceFilter } from "@/lib/notifications";

// One request instead of N sequential PATCH calls from the client.
export async function POST(req: NextRequest) {
  try {
    const auth = await getAuth(req);
    if (!auth) return unauthorized();
    const unread = await db.notification.findMany({
      where: { ...(await audienceFilter(auth)), reads: { none: { userId: auth.id } } },
      select: { id: true },
    });
    if (unread.length) {
      await db.notificationRead.createMany({
        data: unread.map((n) => ({ notificationId: n.id, userId: auth.id })),
      });
    }
    return NextResponse.json({ ok: true, marked: unread.length });
  } catch {
    return NextResponse.json({ error: "Could not mark notifications as read." }, { status: 500 });
  }
}
