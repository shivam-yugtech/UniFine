import { NextRequest, NextResponse } from "next/server";
import type { Student } from "@prisma/client";
import { db } from "@/lib/db";
import { issueToken } from "@/lib/auth";
import { verifyPassword } from "@/lib/password";

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json().catch(() => ({}));
    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required." }, { status: 400 });
    }
    const user = await db.user.findUnique({
      where: { email: String(email).trim().toLowerCase() },
    });
    if (!user || !verifyPassword(String(password), user.passwordHash)) {
      return NextResponse.json({ error: "Invalid credentials. Please check and try again." }, { status: 401 });
    }
    if (user.status !== "ACTIVE") {
      return NextResponse.json({ error: "Account is inactive. Contact the administrator." }, { status: 403 });
    }

    let student: Student | null = null;
    if (user.role === "STUDENT" && user.rollNumber) {
      student = await db.student.findUnique({ where: { rollNumber: user.rollNumber } });
    }

    // HMAC-signed session token — every API call is authorised from this, never from client headers
    return NextResponse.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        rollNumber: user.rollNumber,
        department: user.department,
        designation: user.designation,
      },
      student,
      token: issueToken(user),
    });
  } catch (e) {
    console.error("[login] failed:", e);
    const msg = e instanceof Error ? e.message : String(e);
    const setup = /no such table|did not initialize|Can't reach database|Unable to open the database|P2021/i.test(msg);
    return NextResponse.json(
      { error: setup ? "Database is not set up. On the server run: npm run db:deploy, then restart." : "Login failed. Please try again." },
      { status: 500 },
    );
  }
}
