import { NextRequest, NextResponse } from "next/server";
import type { Student } from "@prisma/client";
import { db } from "@/lib/db";
import { hashPassword } from "@/lib/password";

/**
 * Self-service registration (FR-01 extension) — STUDENT and FACULTY roles only.
 * ADMIN accounts are provisioned by the university, never via public signup.
 *
 * Students register with their 10-digit roll number:
 *  - roll exists in university records  -> account links to that Student record
 *  - roll not yet on record             -> Student record is auto-provisioned
 * One login account per roll number is enforced (User.rollNumber unique).
 */

const SCHOOLS = [
  "School of Engineering & Technology",
  "School of Management & Commerce",
  "School of Law",
  "School of Pharmacy",
  "School of Basic Sciences",
];

const YEARS = ["1st Year", "2nd Year", "3rd Year", "4th Year"];

const AVATAR_COLORS = [
  "#3b82f6", "#8b5cf6", "#f59e0b", "#10b981", "#ec4899",
  "#06b6d4", "#ef4444", "#14b8a6", "#a855f7", "#f97316", "#0ea5e9", "#22c55e",
];

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const ROLL_RE = /^\d{10}$/; // e.g. 2501560006 — YY + programme code + serial

const bad = (error: string, status = 400) => NextResponse.json({ error }, { status });

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    if (!body) return bad("Invalid request body.");

    const role = String(body.role || "").toUpperCase();
    if (role !== "STUDENT" && role !== "FACULTY") {
      return bad("Only Student and Faculty accounts can self-register. Admin accounts are provisioned by the university.", 403);
    }

    const name = String(body.name || "").trim();
    const email = String(body.email || "").trim().toLowerCase();
    const password = String(body.password || "");

    if (name.length < 3 || name.length > 80) return bad("Please enter your full name (3-80 characters).");
    if (!EMAIL_RE.test(email)) return bad("Please enter a valid email address.");
    if (password.length < 6) return bad("Password must be at least 6 characters long.");
    if (password.length > 72) return bad("Password must be at most 72 characters long.");

    const emailTaken = await db.user.findUnique({ where: { email } });
    if (emailTaken) return bad("An account with this email already exists. Please sign in instead.", 409);

    let student: Student | null = null;

    if (role === "STUDENT") {
      const rollNumber = String(body.rollNumber || "").trim();
      if (!ROLL_RE.test(rollNumber)) {
        return bad("Roll number must be exactly 10 digits (e.g. 2501560006).");
      }
      const department = String(body.department || "").trim();
      const programme = String(body.programme || "").trim();
      const year = String(body.year || "").trim();
      if (!SCHOOLS.includes(department)) return bad("Please select your school / department.");
      if (programme.length < 2) return bad("Please enter your programme (e.g. B.Tech CSE).");
      if (!YEARS.includes(year)) return bad("Please select your year of study.");

      const rollAccount = await db.user.findFirst({
        where: { rollNumber, role: "STUDENT" },
      });
      if (rollAccount) {
        return bad("An account already exists for this roll number. Please sign in instead.", 409);
      }

      // link to the university record if present, otherwise provision it
      const existing = await db.student.findUnique({ where: { rollNumber } });
      student =
        existing ??
        (await db.student.create({
          data: {
            rollNumber,
            name,
            email,
            department,
            programme,
            year,
            photoColor: AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)],
          },
        }));
    }

    const user = await db.user.create({
      data: {
        email,
        passwordHash: hashPassword(password),
        name,
        role,
        rollNumber: role === "STUDENT" ? String(body.rollNumber).trim() : null,
        department:
          role === "STUDENT"
            ? String(body.department).trim()
            : String(body.department || "").trim() || null,
        designation:
          role === "FACULTY"
            ? String(body.designation || "").trim() || "Assistant Professor"
            : null,
      },
    });

    if (role === "STUDENT" && student) {
      await db.notification.create({
        data: {
          audience: "USER",
          userId: student.id,
          type: "GENERAL",
          title: "Welcome to UniFine",
          message: `Welcome ${student.name}! Your UniFine account is ready. You can now view your fine history, the KRMU rule book and notifications any time.`,
        },
      });
    }

    return NextResponse.json(
      {
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
      },
      { status: 201 },
    );
  } catch (e) {
    const msg = e instanceof Error ? e.message : "";
    if (msg.includes("Unique constraint") && msg.includes("rollNumber")) {
      return bad("An account already exists for this roll number. Please sign in instead.", 409);
    }
    if (msg.includes("Unique constraint")) {
      return bad("An account with this email already exists. Please sign in instead.", 409);
    }
    return NextResponse.json({ error: "Registration failed. Please try again." }, { status: 500 });
  }
}
