import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { forbidden, getAuth, unauthorized } from "@/lib/auth";
import { audienceFilter } from "@/lib/notifications";

const AUDIENCES = new Set(["ALL", "ADMIN", "FACULTY", "STUDENT"]);
const TYPES = new Set(["GENERAL", "STATUS", "PAYMENT", "FINE_ISSUED"]);

export async function GET(req: NextRequest) {
  try {
    const auth = await getAuth(req);
    if (!auth) return unauthorized();

    // Admins can list every broadcast they've sent (scope=sent); previously broadcasts to
    // Students/Faculty vanished from the admin's "Recent Notifications" list.
    const sent = req.nextUrl.searchParams.get("scope") === "sent" && auth.role === "ADMIN";
    const where = sent ? { audience: { not: "USER" } } : await audienceFilter(auth);

    const rows = await db.notification.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 50,
      include: { reads: { where: { userId: auth.id }, select: { id: true } } },
    });
    const notifications = rows.map(({ reads, ...n }) => ({ ...n, read: reads.length > 0 }));
    return NextResponse.json({ notifications, unread: notifications.filter((n) => !n.read).length });
  } catch {
    return NextResponse.json({ error: "Could not load notifications." }, { status: 500 });
  }
}

// Admin broadcasts (FR-16)
export async function POST(req: NextRequest) {
  try {
    const auth = await getAuth(req);
    if (!auth) return unauthorized();
    if (auth.role !== "ADMIN") return forbidden("Only admins can send broadcasts.");

    const body = await req.json().catch(() => null);
    const audience = String(body?.audience ?? "");
    const type = String(body?.type ?? "GENERAL");
    const title = String(body?.title ?? "").trim();
    const message = String(body?.message ?? "").trim();
    if (!AUDIENCES.has(audience)) return NextResponse.json({ error: "Choose a valid audience." }, { status: 400 });
    if (!TYPES.has(type)) return NextResponse.json({ error: "Choose a valid notification type." }, { status: 400 });
    if (!title || !message) {
      return NextResponse.json({ error: "Title and message are required." }, { status: 400 });
    }
    if (title.length > 120 || message.length > 1000) {
      return NextResponse.json({ error: "Title (120) or message (1000) is too long." }, { status: 400 });
    }
    const notification = await db.notification.create({ data: { audience, title, message, type } });
    return NextResponse.json({ notification }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Could not send notification." }, { status: 500 });
  }
}
