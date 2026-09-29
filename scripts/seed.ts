/**
 * UniFine — KR Mangalam University seed data
 * Seeds users, students, offence catalogue, fines, audits, rule book, notifications.
 * Amounts are always server-resolved from the Offence catalogue (TRD §9).
 */
import { PrismaClient } from "@prisma/client";
import { createHash } from "crypto";

const db = new PrismaClient();

const hash = (pwd: string) => createHash("sha256").update(pwd).digest("hex");

const daysAgo = (n: number) => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(10, 30, 0, 0);
  return d;
};
const daysAhead = (n: number) => daysAgo(-n);

async function main() {
  // wipe in FK-safe order
  await db.fineAudit.deleteMany();
  await db.fine.deleteMany();
  await db.notification.deleteMany();
  await db.ruleBookEntry.deleteMany();
  await db.offence.deleteMany();
  await db.student.deleteMany();
  await db.user.deleteMany();

  /* ---------------- Users ---------------- */
  const admin = await db.user.create({
    data: {
      email: "admin@krmu.ac.in",
      passwordHash: hash("Admin@123"),
      name: "Dr. Meera Kapoor",
      role: "ADMIN",
      designation: "Dean, Student Affairs",
      department: "Administration",
    },
  });

  const faculty1 = await db.user.create({
    data: {
      email: "faculty@krmu.ac.in",
      passwordHash: hash("Faculty@123"),
      name: "Prof. Rajesh Choudhary",
      role: "FACULTY",
      designation: "Associate Professor",
      department: "School of Engineering & Technology",
    },
  });

  const faculty2 = await db.user.create({
    data: {
      email: "s.neha@krmu.ac.in",
      passwordHash: hash("Faculty@123"),
      name: "Dr. Neha Sharma",
      role: "FACULTY",
      designation: "Professor & Proctor",
      department: "School of Management & Commerce",
    },
  });

  /* ---------------- Students ---------------- */
  const studentSeed = [
    ["2201560042", "Aarav Choudhary", "School of Engineering & Technology", "B.Tech CSE", "3rd Year", "#3b82f6"],
    ["2301560117", "Priya Sharma", "School of Engineering & Technology", "B.Tech CSE", "2nd Year", "#8b5cf6"],
    ["2101400089", "Rohan Verma", "School of Engineering & Technology", "B.Tech ECE", "4th Year", "#f59e0b"],
    ["2301410034", "Kabir Singh", "School of Engineering & Technology", "B.Tech ME", "2nd Year", "#10b981"],
    ["2401620206", "Ananya Gupta", "School of Engineering & Technology", "B.Tech CSE (AI/ML)", "1st Year", "#ec4899"],
    ["2202110121", "Ishita Jain", "School of Management & Commerce", "BBA", "3rd Year", "#06b6d4"],
    ["2302160058", "Arjun Mehta", "School of Management & Commerce", "B.Com (Hons)", "2nd Year", "#ef4444"],
    ["2203010093", "Sneha Reddy", "School of Law", "BA LLB (Hons)", "3rd Year", "#14b8a6"],
    ["2103020147", "Vikas Yadav", "School of Law", "BBA LLB", "4th Year", "#a855f7"],
    ["2304010076", "Neha Kaur", "School of Pharmacy", "B.Pharm", "2nd Year", "#f97316"],
    ["2204020102", "Aditya Ranjan", "School of Pharmacy", "D.Pharm", "3rd Year", "#0ea5e9"],
    ["2405010188", "Pooja Bhatt", "School of Basic Sciences", "B.Sc (Hons) Maths", "1st Year", "#22c55e"],
  ] as const;

  const students: Record<string, string> = {};
  for (const [roll, name, dept, prog, year, color] of studentSeed) {
    const s = await db.student.create({
      data: {
        rollNumber: roll,
        name,
        email: `${roll.toLowerCase()}@krmu.ac.in`,
        department: dept,
        programme: prog,
        year,
        photoColor: color,
      },
    });
    students[roll] = s.id;
  }

  // student login for the demo student (matches the mobile mock greeting)
  await db.user.create({
    data: {
      email: "student@krmu.ac.in",
      passwordHash: hash("Student@123"),
      name: "Aarav Choudhary",
      role: "STUDENT",
      rollNumber: "2201560042",
      department: "School of Engineering & Technology",
      designation: "B.Tech CSE · 3rd Year",
    },
  });

  /* ---------------- Offence catalogue ---------------- */
  const offences = [
    ["OFF-001", "Dress Code Violation", "Not adhering to the prescribed dress code / ID dress norms on campus.", "Rule D-07", "Dress & Conduct", 200, true],
    ["OFF-002", "Late Arrival to Class", "Reporting to class after the permitted grace period.", "Rule A-03", "Academics", 100, true],
    ["OFF-003", "Mobile Phone Usage in Class", "Using mobile phones during lectures without faculty permission.", "Rule D-02", "Dress & Conduct", 300, true],
    ["OFF-004", "Littering on Campus", "Disposing waste outside designated bins in campus premises.", "Rule C-05", "Campus Discipline", 250, true],
    ["OFF-005", "Ragging (Major)", "Ragging in any form — strict action as per UGC Anti-Ragging norms.", "Rule D-11", "Major Discipline", 5000, true],
    ["OFF-006", "Library Book Overdue", "Failure to return borrowed library books within the due period.", "Rule L-04", "Library", 50, true],
    ["OFF-007", "Cafeteria Misconduct", "Indiscipline / queue jumping / misconduct inside cafeteria premises.", "Rule C-09", "Campus Discipline", 150, true],
    ["OFF-008", "Parking Violation", "Vehicle parked outside designated parking zones.", "Rule V-02", "Campus Discipline", 300, true],
    ["OFF-009", "Hostel Noise Violation", "Creating disturbance in hostel premises after quiet hours.", "Rule H-06", "Hostel", 400, true],
    ["OFF-010", "Identity Card Not Carried", "Failing to produce valid KRMU identity card on demand.", "Rule D-05", "Dress & Conduct", 100, true],
    ["OFF-011", "Low Attendance (Below 75%)", "Attendance below the mandatory 75% as per university norms.", "Rule A-08", "Academics", 500, true],
    ["OFF-012", "Vandalism / Property Damage", "Damage to university property — fine plus recovery as applicable.", "Rule P-01", "Major Discipline", 2000, true],
    ["OFF-013", "Exam Hall Misconduct", "Unauthorised material / indiscipline inside examination hall.", "Rule E-03", "Examinations", 1000, true],
    ["OFF-014", "Smoking / Tobacco on Campus", "Possession or use of tobacco products inside campus (Zero-tolerance).", "Rule H-12", "Major Discipline", 3000, true],
    ["OFF-015", "Corridor Loitering / Rowdyism", "Loitering in corridors during class hours and disturbing classes.", "Rule C-03", "Campus Discipline", 200, false],
  ] as const;

  const offenceMap: Record<string, { id: string; amount: number; name: string }> = {};
  for (const [code, name, description, ruleRef, category, amount, active] of offences) {
    const o = await db.offence.create({
      data: { code, name, description, ruleRef, category, amount, active },
    });
    offenceMap[code] = { id: o.id, amount, name };
  }

  /* ---------------- Fines (one row per offence — TRD §7) ---------------- */
  type FineSeed = {
    roll: string; code: string; by: string; reason: string;
    issued: number; due: number; status: string; corrected?: boolean;
    oldStatus?: string; auditNote?: string;
  };
  const fineSeeds: FineSeed[] = [
    // ---- Aarav (demo student): mixed history ----
    { roll: "2201560042", code: "OFF-003", by: faculty1.id, reason: "Using phone during Data Structures lecture (Block C, Room 214).", issued: 118, due: 104, status: "PAID" },
    { roll: "2201560042", code: "OFF-006", by: faculty1.id, reason: " 'Introduction to Algorithms' not returned past due date.", issued: 90, due: 76, status: "PAID" },
    { roll: "2201560042", code: "OFF-001", by: faculty2.id, reason: "Found in casuals during official university event.", issued: 47, due: 33, status: "PAID" },
    { roll: "2201560042", code: "OFF-002", by: faculty1.id, reason: "Reported 20 minutes late to OS lab session.", issued: 12, due: -2, status: "OVERDUE" },
    { roll: "2201560042", code: "OFF-010", by: faculty2.id, reason: "ID card not produced at main gate check.", issued: 6, due: 9, status: "PENDING", corrected: true, oldStatus: "PENDING", auditNote: "Reason refined after gate-register cross-check." },
    // ---- others ----
    { roll: "2301560117", code: "OFF-001", by: faculty2.id, reason: "Dress code violation at Academic Block A.", issued: 62, due: 48, status: "PAID" },
    { roll: "2301560117", code: "OFF-002", by: faculty1.id, reason: "Late to morning lecture twice in the same week.", issued: 20, due: 6, status: "PENDING" },
    { roll: "2101400089", code: "OFF-008", by: faculty2.id, reason: "Bike parked at Block-B entrance (no-parking zone).", issued: 75, due: 61, status: "PAID" },
    { roll: "2101400089", code: "OFF-004", by: faculty1.id, reason: "Littered near food court seating area.", issued: 30, due: 16, status: "PENDING" },
    { roll: "2101400089", code: "OFF-011", by: faculty1.id, reason: "Attendance 68% in Digital Signal Processing — below mandate.", issued: 15, due: 1, status: "OVERDUE" },
    { roll: "2301410034", code: "OFF-009", by: faculty2.id, reason: "Loud music in hostel Block-F after quiet hours (11 PM).", issued: 40, due: 26, status: "PAID" },
    { roll: "2401620206", code: "OFF-010", by: faculty1.id, reason: "Freshman orientation — ID not carried.", issued: 55, due: 41, status: "PAID" },
    { roll: "2401620206", code: "OFF-006", by: faculty1.id, reason: "Two library reference books overdue (Communicative English).", issued: 9, due: 12, status: "PENDING" },
    { roll: "2202110121", code: "OFF-007", by: faculty2.id, reason: "Queue jumping and argument with cafeteria staff.", issued: 66, due: 52, status: "PAID" },
    { roll: "2202110121", code: "OFF-003", by: faculty2.id, reason: "Phone usage during Business Statistics class.", issued: 25, due: 11, status: "OVERDUE" },
    { roll: "2302160058", code: "OFF-004", by: faculty1.id, reason: "Food wrappers disposed in corridor dustbin-free zone.", issued: 44, due: 30, status: "PAID" },
    { roll: "2203010093", code: "OFF-002", by: faculty2.id, reason: "Late entry to Moot Court practice session.", issued: 18, due: 4, status: "PENDING" },
    { roll: "2203010093", code: "OFF-001", by: faculty2.id, reason: "Improper uniform accessories at Law Block.", issued: 5, due: 10, status: "PENDING" },
    { roll: "2103020147", code: "OFF-013", by: faculty1.id, reason: "Found with prepared notes inside Contract Law midterm hall.", issued: 100, due: 86, status: "PAID" },
    { roll: "2103020147", code: "OFF-008", by: faculty2.id, reason: "Car parked in faculty parking bay (Bay 12) for 3 days.", issued: 34, due: 20, status: "PENDING", corrected: true, oldStatus: "PENDING", auditNote: "Amount corrected from ₹600 to ₹300 — category clarified as student violation." },
    { roll: "2304010076", code: "OFF-009", by: faculty1.id, reason: "Hostel corridor disturbance during study hours.", issued: 28, due: 14, status: "PAID" },
    { roll: "2204020102", code: "OFF-010", by: faculty1.id, reason: "ID card missing during pharmacy lab inspection.", issued: 11, due: -3, status: "OVERDUE" },
    { roll: "2405010188", code: "OFF-002", by: faculty2.id, reason: "Late to Calculus tutorial — first warning.", issued: 8, due: 13, status: "PENDING" },
  ];

  const createdFines: { id: string; seed: FineSeed; amount: number }[] = [];
  for (const f of fineSeeds) {
    const off = offenceMap[f.code];
    const actor = f.by === faculty1.id ? faculty1 : faculty2;
    const fine = await db.fine.create({
      data: {
        studentId: students[f.roll],
        offenceId: off.id,
        issuedById: f.by,
        amountSnapshot: off.amount,
        reason: f.reason,
        issueDate: daysAgo(f.issued),
        dueDate: daysAhead(f.due),
        status: f.status,
        corrected: !!f.corrected,
        paymentDate: f.status === "PAID" ? daysAgo(Math.max(f.issued - 7, 1)) : null,
      },
    });
    await db.fineAudit.create({
      data: {
        fineId: fine.id,
        actorId: actor.id,
        actorName: actor.name,
        action: "CREATED",
        newValues: JSON.stringify({ status: "PENDING", amount: off.amount, offence: off.name }),
        note: "Fine issued via UniFine portal.",
        createdAt: daysAgo(f.issued),
      },
    });
    if (f.status === "PAID") {
      await db.fineAudit.create({
        data: {
          fineId: fine.id,
          actorId: admin.id,
          actorName: admin.name,
          action: "MARKED_PAID",
          oldValues: JSON.stringify({ status: f.oldStatus ?? "PENDING" }),
          newValues: JSON.stringify({ status: "PAID" }),
          note: "Payment confirmed at accounts counter.",
          createdAt: daysAgo(Math.max(f.issued - 7, 1)),
        },
      });
    }
    if (f.status === "OVERDUE") {
      await db.fineAudit.create({
        data: {
          fineId: fine.id,
          actorId: admin.id,
          actorName: admin.name,
          action: "STATUS_UPDATED",
          oldValues: JSON.stringify({ status: "PENDING" }),
          newValues: JSON.stringify({ status: "OVERDUE" }),
          note: "Due date elapsed without payment — auto-flagged.",
          createdAt: daysAhead(f.due),
        },
      });
    }
    if (f.corrected && f.auditNote) {
      await db.fineAudit.create({
        data: {
          fineId: fine.id,
          actorId: admin.id,
          actorName: admin.name,
          action: "CORRECTED",
          oldValues: JSON.stringify({ reason: "Original entry", amount: f.code === "OFF-008" ? 600 : off.amount }),
          newValues: JSON.stringify({ reason: f.reason, amount: off.amount }),
          note: f.auditNote,
          createdAt: daysAgo(Math.max(f.issued - 2, 1)),
        },
      });
    }
    createdFines.push({ id: fine.id, seed: f, amount: off.amount });
  }

  /* ---------------- Rule book ---------------- */
  const rules = [
    ["Code of Conduct", "Dress Code & Grooming", "Students must wear the prescribed dress code on all working days and university events. Casuals (slippers, ripped jeans, graphic tees) are not permitted in academic blocks, library and administrative offices.", "Rule D-07"],
    ["Code of Conduct", "Identity Card", "The KRMU identity card must be carried at all times and produced on demand to any faculty / security / proctorial staff. Loss of card must be reported within 48 hours.", "Rule D-05"],
    ["Code of Conduct", "Mobile Phone Usage", "Mobile phones must be on silent mode inside lecture halls, labs and the library. Usage during academic sessions is prohibited without explicit faculty permission.", "Rule D-02"],
    ["Academics", "Attendance Requirement", "A minimum of 75% attendance in every course (theory + practical separately) is mandatory to appear in end-term examinations. A fine and parental notice apply below the threshold.", "Rule A-08"],
    ["Academics", "Punctuality", "Students arriving after the permitted grace period of 5 minutes may be marked absent and are liable for a late-arrival fine. Repeated instances escalate to proctorial review.", "Rule A-03"],
    ["Academics", "Examination Hall Discipline", "Only University-issued hall tickets and transparent pencil pouches are allowed inside examination halls. Possession of unauthorised material constitutes unfair means.", "Rule E-03"],
    ["Library", "Book Return & Overdue", "Borrowed books must be returned on or before the due date. An overdue fine per day per book applies as per the library schedule. Reference books are not issuable.", "Rule L-04"],
    ["Library", "Silence & Conduct", "Complete silence must be maintained in reading zones. Group discussions are permitted only in designated discussion rooms.", "Rule L-01"],
    ["Hostel", "Quiet Hours", "Quiet hours are from 10:30 PM to 6:00 AM. Loud music, speakers and gatherings are prohibited during this window in all hostel blocks.", "Rule H-06"],
    ["Hostel", "Zero-Tolerance Substances", "Possession or consumption of alcohol, tobacco, or psychotropic substances inside campus and hostels leads to a heavy fine and disciplinary committee referral.", "Rule H-12"],
    ["Campus & Facilities", "Waste Management", "Waste must be disposed only in designated bins. Littering anywhere within the campus is a punishable offence under the campus cleanliness policy.", "Rule C-05"],
    ["Campus & Facilities", "Vehicle Parking", "Two-wheelers and four-wheelers must be parked only in marked zones with a valid campus vehicle sticker. Blocking driveways, gates or green zones attracts towing plus fine.", "Rule V-02"],
    ["Anti-Ragging", "UGC Anti-Ragging Norms", "Ragging in any form is strictly prohibited as per UGC regulations and Supreme Court directives. Complaints are acted upon within 24 hours by the Anti-Ragging Committee.", "Rule D-11"],
    ["Anti-Ragging", "Reporting Channels", "Incidents may be reported to the proctor's office, anti-ragging helpline, or the UniFine grievance module. Complainant identity is kept confidential.", "Rule D-12"],
  ] as const;

  for (const [category, title, content, ruleRef] of rules) {
    await db.ruleBookEntry.create({ data: { category, title, content, ruleRef } });
  }

  /* ---------------- Notifications ---------------- */
  const aaravNotifs = [
    ["FINE_ISSUED", "New fine issued — Late Arrival", "A fine of ₹100 (Rule A-03) was issued by Prof. Rajesh Choudhary. Due date: " + daysAhead(-2).toDateString() + "."],
    ["FINE_ISSUED", "New fine issued — Identity Card", "A fine of ₹100 (Rule D-05) was issued by Dr. Neha Sharma. Please clear before due date."],
    ["STATUS", "Fine marked OVERDUE", "Your fine for 'Late Arrival to Class' crossed its due date. Clear it at the accounts counter to avoid escalation."],
    ["PAYMENT", "Payment received — thank you!", "Your payment of ₹200 for 'Dress Code Violation' was received successfully."],
  ] as const;
  for (const [type, title, message] of aaravNotifs) {
    await db.notification.create({
      data: { audience: "USER", userId: students["2201560042"], type, title, message, read: false },
    });
  }

  await db.notification.create({
    data: { audience: "FACULTY", type: "GENERAL", title: "Semester fine drive", message: "Proctorial office: please review pending fines for your assigned classes before mid-terms begin." },
  });
  await db.notification.create({
    data: { audience: "ADMIN", type: "GENERAL", title: "Monthly reconciliation due", message: "Accounts reconciliation for last month is due. Please export the summary report from Reports." },
  });
  await db.notification.create({
    data: { audience: "ALL", type: "GENERAL", title: "Rule book updated", message: "The KRMU discipline rule book has been updated with the latest Anti-Ragging norms (Rule D-11, D-12)." },
  });
  await db.notification.create({
    data: { audience: "FACULTY", type: "STATUS", title: "Overdue fines escalation", message: "3 fines have crossed their due dates this week. Check the Fine History → Overdue filter." },
  });

  const counts = {
    users: await db.user.count(),
    students: await db.student.count(),
    offences: await db.offence.count(),
    fines: await db.fine.count(),
    audits: await db.fineAudit.count(),
    rules: await db.ruleBookEntry.count(),
    notifications: await db.notification.count(),
  };
  console.log("✅ UniFine KRMU seed complete:", counts);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
