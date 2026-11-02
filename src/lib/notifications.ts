import { db } from "@/lib/db";
import type { AuthUser } from "@/lib/auth";

/** Which notifications a user is allowed to see. Shared by the notification routes. */
export async function audienceFilter(auth: AuthUser) {
  if (auth.role === "STUDENT") {
    // personal notifications are keyed by Student.id (linked via roll number)
    const student = auth.rollNumber ? await db.student.findUnique({ where: { rollNumber: auth.rollNumber } }) : null;
    return {
      OR: [{ audience: "ALL" }, { audience: "STUDENT" }, { audience: "USER", userId: student?.id ?? "__none__" }],
    };
  }
  return { OR: [{ audience: "ALL" }, { audience: auth.role }, { audience: "USER", userId: auth.id }] };
}
