/* Shared client-side types for the UniFine SPA (mirrors API payloads, TRD §8). */

export type Role = "ADMIN" | "FACULTY" | "STUDENT";

export interface SessionUser {
  id: string;
  name: string;
  email: string;
  role: Role;
  rollNumber: string | null;
  department: string | null;
  designation: string | null;
}

export interface StudentT {
  id: string;
  rollNumber: string;
  name: string;
  email: string;
  photoColor: string;
  department: string;
  programme: string;
  year: string;
  status: string;
}

export interface FineT {
  id: string;
  studentId: string;
  offenceId: string;
  issuedById: string;
  amountSnapshot: number;
  reason: string | null;
  issueDate: string | Date;
  dueDate: string | Date;
  status: string; // PENDING | PAID | OVERDUE
  corrected: boolean;
  paymentDate: string | Date | null;
  student: {
    id: string;
    name: string;
    rollNumber: string;
    programme: string;
    photoColor: string;
    department: string;
  };
  offence: {
    id: string;
    name: string;
    code: string;
    ruleRef: string;
    category: string;
  };
  issuedBy: { id: string; name: string };
}

export interface OffenceT {
  id: string;
  code: string;
  name: string;
  description: string;
  ruleRef: string;
  category: string;
  amount: number;
  active: boolean;
}

export interface AuditT {
  id: string;
  fineId: string;
  actorId: string;
  actorName: string;
  action: string; // CREATED | CORRECTED | STATUS_UPDATED | MARKED_PAID
  oldValues: string | null;
  newValues: string | null;
  note: string | null;
  createdAt: string | Date;
  fine?: {
    id: string;
    student: { name: string; rollNumber: string };
    offence: { name: string; code: string };
  } | null;
}

export interface RuleEntryT {
  id: string;
  category: string;
  title: string;
  content: string;
  ruleRef: string | null;
  active: boolean;
  version: number;
}

export interface NotificationT {
  id: string;
  audience: string;
  userId: string | null;
  type: string;
  title: string;
  message: string;
  read: boolean;
  createdAt: string | Date;
}

export interface SummaryT {
  total: number;
  paidCount: number;
  pendingCount: number;
  overdueCount: number;
  collected: number;
  outstanding: number;
  totalAmount: number;
  collectionRate: number;
  studentsWithFines: number;
  byCategory: { category: string; count: number; amount: number }[];
  byMonth: { key: string; label: string; issued: number; collected: number }[];
  topOffences: { name: string; count: number; amount: number }[];
}
