"use client";

import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { StatusBadge } from "./StatusBadge";
import { Avatar } from "./Avatar";
import { motion, CountUp } from "./motion";
import { api, inr, fmtDate, fmtDateTime } from "./utils";
import type { FineT, AuditT, SessionUser } from "./types";
import {
  CalendarDays,
  Clock3,
  History,
  Inbox,
  Landmark,
  ScrollText,
  UserRound,
  FileWarning,
} from "lucide-react";

/* ---------------- KRMU logo badge ---------------- */
export function KrmuLogo({ size = 44 }: { size?: number }) {
  return (
    <div
      className="flex shrink-0 items-center justify-center rounded-full bg-white shadow-md ring-2 ring-white/60"
      style={{ width: size, height: size }}
      aria-label="KR Mangalam University"
      role="img"
    >
      <div className="text-center leading-none">
        <div
          className="bg-gradient-to-br from-brand-400 to-brand-700 bg-clip-text font-bold tracking-tight text-transparent"
          style={{ fontSize: size * 0.3 }}
        >
          KRMU
        </div>
        <div className="mt-0.5 font-semibold tracking-widest text-slate-400" style={{ fontSize: Math.max(6, size * 0.15) }}>
          UNIV
        </div>
      </div>
    </div>
  );
}

/* ---------------- Section wrapper (white rounded card) ---------------- */
export function SectionCard({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`rounded-[26px] bg-white p-5 shadow-[0_2px_12px_-4px_rgba(15,23,42,0.06)] ring-1 ring-slate-100 ${className}`}>
      {children}
    </div>
  );
}

export function SectionHeader({
  title,
  action,
  icon,
}: {
  title: string;
  action?: React.ReactNode;
  icon?: React.ReactNode;
}) {
  return (
    <div className="mb-4 flex items-center justify-between gap-3">
      <h3 className="flex items-center gap-2 text-base font-semibold text-slate-800">
        {icon}
        {title}
      </h3>
      {action}
    </div>
  );
}

/* ---------------- Stat card (grid 2x2) ---------------- */
const STAT_TONES = {
  blue: "from-brand-400 to-brand-600",
  emerald: "from-emerald-500 to-teal-600",
  amber: "from-amber-500 to-orange-500",
  rose: "from-rose-500 to-pink-600",
  violet: "from-violet-500 to-purple-600",
} as const;

export function StatCard({
  label,
  value,
  money = false,
  suffix = "",
  sub,
  icon,
  tone = "blue",
}: {
  label: string;
  /** numbers animate (count-up); use `money` to format as ₹ */
  value: string | number;
  money?: boolean;
  suffix?: string;
  sub?: string;
  icon: React.ReactNode;
  tone?: keyof typeof STAT_TONES;
}) {
  return (
    <motion.div
      whileHover={{ y: -3 }}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
      className="rounded-[22px] bg-white p-4 shadow-sm ring-1 ring-slate-100 transition-shadow hover:shadow-md"
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-slate-500">{label}</span>
        <span
          className={`flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br text-white shadow-sm ${STAT_TONES[tone]}`}
        >
          {icon}
        </span>
      </div>
      <div className="mt-2 truncate text-2xl font-bold tracking-tight text-slate-800">
        {typeof value === "number" ? (
          <CountUp value={value} format={(n) => (money ? inr(n) : Math.round(n).toLocaleString("en-IN")) + suffix} />
        ) : (
          value
        )}
      </div>
      {sub && <div className="mt-0.5 truncate text-xs text-slate-400">{sub}</div>}
    </motion.div>
  );
}

/* ---------------- Big colorful tile (theme image style) ---------------- */
export type TileTone = "rose" | "violet" | "emerald" | "sky" | "amber" | "orange";

// Pastel tiles with a big soft circle in the corner — the iCloudEMS "Attendance / Timetable / Fees" cards
const TILE_STYLES: Record<TileTone, { bg: string; circle: string; icon: string }> = {
  rose: { bg: "bg-[#fde4e6]", circle: "bg-[#f9b4bb]", icon: "text-rose-600" },
  violet: { bg: "bg-[#e6e4fd]", circle: "bg-[#b8b3fb]", icon: "text-indigo-600" },
  emerald: { bg: "bg-[#d9f2ea]", circle: "bg-[#a3dcc8]", icon: "text-emerald-700" },
  sky: { bg: "bg-[#dcefff]", circle: "bg-[#9fd2fb]", icon: "text-brand-700" },
  amber: { bg: "bg-[#fff1d9]", circle: "bg-[#fdd38c]", icon: "text-amber-700" },
  orange: { bg: "bg-[#ffe6d6]", circle: "bg-[#fcbc94]", icon: "text-orange-600" },
};

export function ColorTile({
  label,
  value,
  icon,
  tone,
  onClick,
  badge,
}: {
  label: string;
  value?: string;
  icon: React.ReactNode;
  tone: TileTone;
  onClick?: () => void;
  badge?: number;
}) {
  const s = TILE_STYLES[tone];
  return (
    <motion.button
      onClick={onClick}
      whileHover={{ y: -4 }}
      whileTap={{ scale: 0.96 }}
      transition={{ type: "spring", stiffness: 420, damping: 24 }}
      className={`group relative flex min-h-[104px] w-full flex-col overflow-hidden rounded-[26px] p-4 text-left shadow-sm ring-1 ring-black/[0.03] transition-shadow hover:shadow-lg sm:min-h-[124px] ${s.bg}`}
    >
      <span
        className={`absolute -bottom-12 -right-10 h-32 w-32 rounded-full transition-transform duration-500 ease-out group-hover:scale-110 sm:h-36 sm:w-36 ${s.circle}`}
      />
      <span
        className={`absolute bottom-3 right-3 transition-transform duration-300 ease-out group-hover:-rotate-6 group-hover:scale-110 [&_svg]:h-10 [&_svg]:w-10 sm:[&_svg]:h-12 sm:[&_svg]:w-12 ${s.icon}`}
      >
        {icon}
      </span>
      {badge !== undefined && badge > 0 && (
        <span className="absolute right-3 top-3 flex h-6 min-w-6 items-center justify-center rounded-full bg-rose-500 px-1.5 text-[11px] font-bold text-white shadow ring-2 ring-white">
          {badge > 99 ? "99+" : badge}
        </span>
      )}
      <span className="relative max-w-[78%] text-[17px] font-medium leading-tight text-slate-900 sm:text-xl">{label}</span>
      {value && <span className="relative mt-1 text-base font-semibold text-slate-800">{value}</span>}
    </motion.button>
  );
}

/* ---------------- White module tile (grid) — blue icon on white, like "Assignment / LMS" ---------------- */
export function ModuleTile({
  label,
  icon,
  onClick,
}: {
  label: string;
  icon: React.ReactNode;
  onClick?: () => void;
}) {
  return (
    <motion.button
      onClick={onClick}
      whileHover={{ y: -3 }}
      whileTap={{ scale: 0.93 }}
      transition={{ type: "spring", stiffness: 420, damping: 24 }}
      className="group flex flex-col items-center gap-2 rounded-[20px] border border-brand-100/80 bg-white px-1.5 py-3.5 transition-colors hover:border-brand-200 hover:bg-brand-50/40"
    >
      <span className="flex h-11 w-11 items-center justify-center text-brand-500 transition-transform duration-300 group-hover:scale-110 [&_svg]:h-8 [&_svg]:w-8">
        {icon}
      </span>
      <span className="text-center text-[12px] font-normal leading-tight text-slate-700">{label}</span>
    </motion.button>
  );
}

/* ---------------- Fine card (list row) ---------------- */
export function FineCard({
  fine,
  onClick,
  showStudent = false,
  actions,
}: {
  fine: FineT;
  onClick?: () => void;
  showStudent?: boolean;
  actions?: React.ReactNode;
}) {
  const overdueish = fine.status === "OVERDUE";
  return (
    <motion.div
      layout="position"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      onClick={onClick}
      onKeyDown={(e) => {
        if (onClick && (e.key === "Enter" || e.key === " ") && e.target === e.currentTarget) {
          e.preventDefault();
          onClick();
        }
      }}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      className={`rounded-[20px] border bg-white p-4 transition-all duration-200 ${onClick ? "cursor-pointer hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-md" : ""} ${
        overdueish ? "border-rose-200 bg-rose-50/30" : "border-slate-200/80"
      }`}
    >
      <div className="flex items-start gap-3">
        {showStudent && <Avatar name={fine.student.name} color={fine.student.photoColor} size={38} />}
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <div className="truncate text-sm font-semibold text-slate-800">{fine.offence.name}</div>
              <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] text-slate-400">
                <span>{fine.offence.code}</span>
                <span>·</span>
                <span>{fine.offence.ruleRef}</span>
                {showStudent && (
                  <>
                    <span>·</span>
                    <span>
                      {fine.student.name} ({fine.student.rollNumber})
                    </span>
                  </>
                )}
              </div>
            </div>
            <div className="shrink-0 text-right">
              <div className={`text-sm font-bold ${overdueish ? "text-rose-600" : "text-slate-800"}`}>
                {inr(fine.amountSnapshot)}
              </div>
            </div>
          </div>
          {fine.reason && (
            <p className="mt-1.5 line-clamp-2 text-xs leading-relaxed text-slate-500">{fine.reason}</p>
          )}
          <div className="mt-2.5 flex flex-wrap items-center gap-2">
            <StatusBadge status={fine.status} />
            {fine.corrected && (
              <Badge variant="outline" className="border-violet-200 bg-violet-50 text-[10px] text-violet-600">
                Corrected
              </Badge>
            )}
            <span className="flex items-center gap-1 text-[11px] text-slate-400">
              <CalendarDays className="h-3 w-3" /> Issued {fmtDate(fine.issueDate)}
            </span>
            <span className={`flex items-center gap-1 text-[11px] ${overdueish ? "font-semibold text-rose-500" : "text-slate-400"}`}>
              <Clock3 className="h-3 w-3" /> Due {fmtDate(fine.dueDate)}
            </span>
            {!showStudent && (
              <span className="hidden items-center gap-1 text-[11px] text-slate-400 sm:flex">
                <UserRound className="h-3 w-3" /> {fine.issuedBy.name}
              </span>
            )}
            {actions && <span className="ml-auto flex items-center gap-1.5">{actions}</span>}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

/* ---------------- Fine detail dialog with audit trail ---------------- */
export function FineDetailDialog({
  session,
  fine,
  open,
  onClose,
  footer,
}: {
  session: SessionUser | null;
  fine: FineT | null;
  open: boolean;
  onClose: () => void;
  footer?: React.ReactNode;
}) {
  const [auditState, setAuditState] = useState<{ fineId: string; audits: AuditT[] } | null>(null);

  useEffect(() => {
    if (!open || !fine) return;
    let alive = true;
    api<{ audits: AuditT[] }>(session, `/api/audit?fineId=${fine.id}`)
      .then((d) => {
        if (alive) setAuditState({ fineId: fine.id, audits: d.audits });
      })
      .catch(() => {
        if (alive) setAuditState({ fineId: fine.id, audits: [] });
      });
    return () => {
      alive = false;
    };
  }, [open, fine, session]);

  if (!fine) return null;
  const audits: AuditT[] | null = auditState && auditState.fineId === fine.id ? auditState.audits : null;
  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-h-[85vh] overflow-y-auto rounded-3xl sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-left text-base">
            <FileWarning className="h-4 w-4 text-brand-500" /> {fine.offence.name}
          </DialogTitle>
          <DialogDescription className="text-left">
            {fine.offence.code} · {fine.offence.ruleRef} · {fine.offence.category}
          </DialogDescription>
        </DialogHeader>

        <div className="rounded-2xl bg-slate-50 p-4">
          <div className="flex items-center gap-3">
            <Avatar name={fine.student.name} color={fine.student.photoColor} size={44} />
            <div>
              <div className="text-sm font-bold text-slate-800">{fine.student.name}</div>
              <div className="text-xs text-slate-500">
                {fine.student.rollNumber} · {fine.student.programme}
              </div>
            </div>
            <div className="ml-auto text-right">
              <div className="text-xl font-bold text-slate-800">{inr(fine.amountSnapshot)}</div>
              <StatusBadge status={fine.status} />
            </div>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-slate-500">
            <div>
              <span className="font-semibold text-slate-600">Issued:</span> {fmtDate(fine.issueDate)}
            </div>
            <div>
              <span className="font-semibold text-slate-600">Due:</span> {fmtDate(fine.dueDate)}
            </div>
            <div>
              <span className="font-semibold text-slate-600">Issued by:</span> {fine.issuedBy.name}
            </div>
            <div>
              <span className="font-semibold text-slate-600">Payment:</span>{" "}
              {fine.paymentDate ? fmtDate(fine.paymentDate) : "—"}
            </div>
          </div>
          {fine.reason && (
            <p className="mt-3 rounded-xl bg-white p-3 text-xs leading-relaxed text-slate-600 ring-1 ring-slate-100">
              <span className="font-semibold text-slate-700">Reason: </span>
              {fine.reason}
            </p>
          )}
        </div>

        <div>
          <h4 className="mb-2 flex items-center gap-1.5 text-sm font-bold text-slate-700">
            <History className="h-4 w-4 text-slate-400" /> Audit Trail
          </h4>
          {audits === null ? (
            <div className="space-y-2">
              <Skeleton className="shimmer h-10 w-full rounded-xl" />
              <Skeleton className="shimmer h-10 w-full rounded-xl" />
            </div>
          ) : audits.length === 0 ? (
            <p className="text-xs text-slate-400">No audit entries.</p>
          ) : (
            <ol className="relative space-y-3 border-l-2 border-slate-100 pl-4">
              {audits.map((a, i) => (
                <motion.li
                  key={a.id}
                  className="relative"
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <span className="absolute -left-[22px] top-1.5 h-2.5 w-2.5 rounded-full bg-brand-500 ring-2 ring-white" />
                  <div className="text-xs font-bold text-slate-700">
                    {a.action.replaceAll("_", " ")} <span className="font-normal text-slate-400">· {a.actorName}</span>
                  </div>
                  <div className="text-[11px] text-slate-400">{fmtDateTime(a.createdAt)}</div>
                  {a.note && <div className="mt-0.5 text-xs text-slate-500">{a.note}</div>}
                </motion.li>
              ))}
            </ol>
          )}
        </div>
        {footer}
      </DialogContent>
    </Dialog>
  );
}

/* ---------------- Empty & loading states ---------------- */
export function EmptyState({
  title,
  hint,
  icon,
  action,
}: {
  title: string;
  hint?: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 px-4 py-10 text-center"
    >
      <span className="float-slow flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-brand-300 shadow-sm">
        {icon ?? <Inbox className="h-6 w-6" />}
      </span>
      <div className="text-sm font-semibold text-slate-500">{title}</div>
      {hint && <div className="max-w-xs text-xs text-slate-400">{hint}</div>}
      {action}
    </motion.div>
  );
}

export function CardsSkeleton({ n = 3 }: { n?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: n }).map((_, i) => (
        <Skeleton key={i} className="shimmer h-24 w-full rounded-2xl" />
      ))}
    </div>
  );
}

export function StatSkeleton({ n = 4 }: { n?: number }) {
  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {Array.from({ length: n }).map((_, i) => (
        <Skeleton key={i} className="shimmer h-24 rounded-2xl" />
      ))}
    </div>
  );
}

/* ---------------- Legend chip (used in charts) ---------------- */
export function LegendChip({ color, label }: { color: string; label: string }) {
  return (
    <span className="flex items-center gap-1.5 text-[11px] font-medium text-slate-500">
      <span className="h-2.5 w-2.5 rounded-full" style={{ background: color }} />
      {label}
    </span>
  );
}

export const BRAND_ICONS = {
  landmark: <Landmark className="h-4 w-4" />,
  rulebook: <ScrollText className="h-4 w-4" />,
};

/* ---------------- Error state with retry ---------------- */
export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-rose-100 bg-rose-50/50 px-4 py-8 text-center">
      <div className="text-sm font-semibold text-rose-600">Something went wrong</div>
      <div className="max-w-xs text-xs text-rose-500/80">{message}</div>
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-1 rounded-xl bg-white px-4 py-2 text-xs font-semibold text-rose-600 ring-1 ring-rose-200 transition hover:bg-rose-50 active:scale-95"
        >
          Try again
        </button>
      )}
    </div>
  );
}
