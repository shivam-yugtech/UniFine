import { NextRequest, NextResponse } from "next/server";
import type { Student } from "@prisma/client";
import { db } from "@/lib/db";
import { verifyPassword } from "@/lib/password";

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();
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

    // Demo token — production issues a signed JWT per TRD §10
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
      token: `demo.${Buffer.from(user.id).toString("base64url")}`,
    });
  } catch {
    return NextResponse.json({ error: "Login failed. Please try again." }, { status: 500 });
  }
}
