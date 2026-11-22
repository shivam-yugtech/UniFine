import { NextRequest, NextResponse } from "next/server";
import type { Student } from "@prisma/client";
import { db } from "@/lib/db";
import { issueToken } from "@/lib/auth";
import { ROLL_RE, studentEmail, isValidFacultyEmail, FACULTY_EMAIL_DOMAIN } from "@/lib/email-rules";
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
    const password = String(body.password || "");
    const rollInput = String(body.rollNumber || "").trim();

    if (name.length < 3 || name.length > 80) return bad("Please enter your full name (3-80 characters).");

    // Students: email is always <roll>@krmu.edu.in. Faculty: <name>@krmangalam.edu.in.
    let email: string;
    if (role === "STUDENT") {
      if (!ROLL_RE.test(rollInput)) return bad("Roll number must be exactly 10 digits (e.g. 2501560006).");
      email = studentEmail(rollInput);
    } else {
      email = String(body.email || "").trim().toLowerCase();
      if (!isValidFacultyEmail(email)) {
        return bad(`Faculty email must be your name @${FACULTY_EMAIL_DOMAIN} (e.g. rajesh.kumar@${FACULTY_EMAIL_DOMAIN}).`);
      }
    }
    if (password.length < 6) return bad("Password must be at least 6 characters long.");
    if (password.length > 72) return bad("Password must be at most 72 characters long.");

    const emailTaken = await db.user.findUnique({ where: { email } });
    if (emailTaken) return bad("An account with this email already exists. Please sign in instead.", 409);

    let studentData: Parameters<typeof db.student.create>[0]["data"] | null = null;
    let existingStudent: Student | null = null;

    if (role === "STUDENT") {
      const rollNumber = rollInput;
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
      existingStudent = await db.student.findUnique({ where: { rollNumber } });
      if (!existingStudent) {
        studentData = {
          rollNumber,
          name,
          email,
          department,
          programme,
          year,
          photoColor: AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)],
        };
      }
    }

    // student record + login are created together: a failure can't leave a half-registered account
    const { user, student } = await db.$transaction(async (tx) => {
      const student = studentData ? await tx.student.create({ data: studentData }) : existingStudent;
      const user = await tx.user.create({
      data: {
        email,
        passwordHash: hashPassword(password),
        name,
        role,
        rollNumber: role === "STUDENT" ? rollInput : null,
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
      return { user, student };
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
        token: issueToken(user),
      },
      { status: 201 },
    );
  } catch (e) {
    console.error("[signup] failed:", e);
    const msg = e instanceof Error ? e.message : "";
    const hint = dbHint(e);
    if (hint) return NextResponse.json({ error: hint }, { status: 500 });
    if (msg.includes("Unique constraint") && msg.includes("rollNumber")) {
      return bad("An account already exists for this roll number. Please sign in instead.", 409);
    }
    if (msg.includes("Unique constraint")) {
      return bad("An account with this email already exists. Please sign in instead.", 409);
    }
    return NextResponse.json({ error: "Registration failed. Please try again." }, { status: 500 });
  }
}

/** Turn common Prisma/SQLite setup problems into a message that says how to fix them. */
function dbHint(e: unknown): string | null {
  const code = (e as { code?: string })?.code;
  const msg = e instanceof Error ? e.message : String(e);
  if (code === "P2021" || code === "P2022" || /no such table|no such column/i.test(msg)) {
    return "Database is not set up / out of date. On the server run: npm run db:deploy, then restart.";
  }
  if (/readonly database|read-only|SQLITE_READONLY/i.test(msg)) {
    return "Database file is read-only. Restart the server (and make sure prisma/custom.db is writable).";
  }
  if (/did not initialize yet|prisma generate|PrismaClientInitializationError|Can't reach database|Unable to open the database/i.test(msg)) {
    return "Database connection failed. On the server run: npm install && npm run db:deploy, then restart.";
  }
  return null;
}
