import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await ctx.params;
    const { read } = await req.json();
    const notification = await db.notification.update({
      where: { id },
      data: { read: read ?? true },
    });
    return NextResponse.json({ notification });
  } catch {
    return NextResponse.json({ error: "Could not update notification." }, { status: 500 });
  }
}
