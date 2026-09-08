import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// FR-03 / FR-04 — staff-only student search for verification before fine assignment
export async function GET(req: NextRequest) {
  try {
    const role = req.headers.get("x-user-role");
    if (role !== "ADMIN" && role !== "FACULTY") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const rollNumber = req.nextUrl.searchParams.get("rollNumber")?.trim();
    if (!rollNumber) {
      return NextResponse.json({ error: "Roll number is required." }, { status: 400 });
    }
    const student = await db.student.findUnique({
      where: { rollNumber: rollNumber.toUpperCase() },
      include: {
        fines: { orderBy: { issueDate: "desc" }, include: { offence: true } },
      },
    });
    if (!student) {
      return NextResponse.json({ error: `No student found with roll number "${rollNumber}".` }, { status: 404 });
    }
    const pending = student.fines.filter((f) => f.status === "PENDING").length;
    const overdue = student.fines.filter((f) => f.status === "OVERDUE").length;
    const outstanding = student.fines
      .filter((f) => f.status !== "PAID")
      .reduce((sum, f) => sum + f.amountSnapshot, 0);
    return NextResponse.json({
      student: {
        id: student.id,
        rollNumber: student.rollNumber,
        name: student.name,
        email: student.email,
        photoColor: student.photoColor,
        department: student.department,
        programme: student.programme,
        year: student.year,
        status: student.status,
      },
      stats: { total: student.fines.length, pending, overdue, outstanding },
    });
  } catch {
    return NextResponse.json({ error: "Search failed." }, { status: 500 });
  }
}
