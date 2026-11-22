/**
 * University email rules (shared by the signup form and the signup API).
 *  - Students: <10-digit roll number>@krmu.edu.in   e.g. 2501560006@krmu.edu.in
 *  - Faculty:  <name>@krmangalam.edu.in             e.g. rajesh.choudhary@krmangalam.edu.in
 * Existing accounts can still sign in with whatever email they were created with.
 */
export const STUDENT_EMAIL_DOMAIN = "krmu.edu.in";
export const FACULTY_EMAIL_DOMAIN = "krmangalam.edu.in";

export const ROLL_RE = /^\d{10}$/;
// letters, optionally separated by single dots: "rajesh" / "rajesh.choudhary"
export const FACULTY_LOCAL_RE = /^[a-z]+(\.[a-z]+)*$/;

export function studentEmail(roll: string): string {
  return `${roll.trim()}@${STUDENT_EMAIL_DOMAIN}`;
}

/** Suggested faculty email local part from a full name: "Dr. Rajesh Kumar" -> "rajesh.kumar" */
export function facultyLocalFromName(name: string): string {
  return name
    .toLowerCase()
    .replace(/^(dr|prof|mr|mrs|ms)\.?\s+/i, "")
    .replace(/[^a-z\s]/g, " ")
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .join(".");
}

export function isValidFacultyEmail(email: string): boolean {
  const [local, domain, ...rest] = email.trim().toLowerCase().split("@");
  return rest.length === 0 && domain === FACULTY_EMAIL_DOMAIN && FACULTY_LOCAL_RE.test(local ?? "") && local.length <= 60;
}
