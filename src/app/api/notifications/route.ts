import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const role = req.headers.get("x-user-role");
    const userId = req.headers.get("x-user-id");
    if (!role || !userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // Students: personal + broadcast. Staff: role + broadcast.
    const audienceFilter =
      role === "STUDENT"
        ? await (async () => {
            const student = await db.student.findUnique({ where: { id: userId } }).catch(() => null);
            const byRoll = !student && req.headers.get("x-user-roll")
              ? await db.student.findUnique({ where: { rollNumber: req.headers.get("x-user-roll") as string } })
              : null;
            const sid = student?.id ?? byRoll?.id;
            return { OR: [{ audience: "ALL" }, { audience: "STUDENT" }, { audience: "USER", userId: sid ?? "__none__" }] };
          })()
        : { OR: [{ audience: "ALL" }, { audience: role }, { audience: "USER", userId }] };

    const notifications = await db.notification.findMany({
      where: audienceFilter,
      orderBy: { createdAt: "desc" },
      take: 50,
    });
    return NextResponse.json({ notifications });
  } catch {
    return NextResponse.json({ error: "Could not load notifications." }, { status: 500 });
  }
}

// Admin broadcasts (FR-16)
export async function POST(req: NextRequest) {
  try {
    if (req.headers.get("x-user-role") !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const { audience, title, message, type } = await req.json();
    if (!audience || !title || !message) {
      return NextResponse.json({ error: "Audience, title and message are required." }, { status: 400 });
    }
    const notification = await db.notification.create({
      data: { audience, title, message, type: type || "GENERAL" },
    });
    return NextResponse.json({ notification }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Could not send notification." }, { status: 500 });
  }
}
