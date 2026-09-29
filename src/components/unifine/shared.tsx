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
import { api, inr, fmtDate, fmtDateTime, STATUS_TONE } from "./utils";
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
      className="flex items-center justify-center rounded-full bg-white shadow-md shrink-0"
      style={{ width: size, height: size }}
    >
      <div className="text-center leading-none">
        <div
          className="font-extrabold tracking-tight bg-gradient-to-br from-sky-500 to-blue-700 bg-clip-text text-transparent"
          style={{ fontSize: size * 0.3 }}
        >
          KRMU
        </div>
        <div className="text-[7px] font-semibold text-slate-400 tracking-widest mt-0.5">UNIV</div>
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
    <div className={`rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-100 ${className}`}>
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
      <h3 className="flex items-center gap-2 text-base font-bold text-slate-800">
        {icon}
        {title}
      </h3>
      {action}
    </div>
  );
}

/* ---------------- Stat card (grid 2x2) ---------------- */
const STAT_TONES = {
  blue: "from-sky-500 to-blue-600",
  emerald: "from-emerald-500 to-teal-600",
  amber: "from-amber-500 to-orange-500",
  rose: "from-rose-500 to-pink-600",
  violet: "from-violet-500 to-purple-600",
} as const;

export function StatCard({
  label,
  value,
  sub,
  icon,
  tone = "blue",
}: {
  label: string;
  value: string | number;
  sub?: string;
  icon: React.ReactNode;
  tone?: keyof typeof STAT_TONES;
}) {
  return (
    <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-100">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-slate-500">{label}</span>
        <span
          className={`flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br text-white ${STAT_TONES[tone]}`}
        >
          {icon}
        </span>
      </div>
      <div className="mt-2 text-2xl font-extrabold tracking-tight text-slate-800">{value}</div>
      {sub && <div className="mt-0.5 text-xs text-slate-400">{sub}</div>}
    </div>
  );
}

/* ---------------- Big colorful tile (theme image style) ---------------- */
export type TileTone = "rose" | "violet" | "emerald" | "sky" | "amber" | "orange";

const TILE_STYLES: Record<TileTone, { bg: string; circle: string; icon: string; dark: string }> = {
  rose: { bg: "from-rose-100 to-rose-50", circle: "bg-rose-200/60", icon: "text-rose-500", dark: "text-rose-950" },
  violet: { bg: "from-violet-100 to-violet-50", circle: "bg-violet-200/60", icon: "text-violet-500", dark: "text-violet-950" },
  emerald: { bg: "from-emerald-100 to-emerald-50", circle: "bg-emerald-200/60", icon: "text-emerald-500", dark: "text-emerald-950" },
  sky: { bg: "from-sky-100 to-sky-50", circle: "bg-sky-200/60", icon: "text-sky-500", dark: "text-sky-950" },
  amber: { bg: "from-amber-100 to-amber-50", circle: "bg-amber-200/60", icon: "text-amber-500", dark: "text-amber-950" },
  orange: { bg: "from-orange-100 to-orange-50", circle: "bg-orange-200/60", icon: "text-orange-500", dark: "text-orange-950" },
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
    <button
      onClick={onClick}
      className={`group relative flex flex-col justify-between overflow-hidden rounded-3xl bg-gradient-to-br p-4 text-left shadow-sm ring-1 ring-black/[0.03] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md active:scale-[0.98] ${s.bg} min-h-[78px] sm:min-h-[96px]`}
    >
      <div className={`absolute -right-7 -bottom-10 h-28 w-28 rounded-full ${s.circle}`} />
      <div className={`absolute right-1.5 bottom-1.5 origin-bottom-right scale-[0.68] opacity-90 transition-transform duration-200 group-hover:scale-[0.76] sm:right-2 sm:bottom-2 sm:scale-90 sm:group-hover:scale-100 lg:scale-100 lg:group-hover:scale-110 ${s.icon}`}>
        {icon}
      </div>
      {badge !== undefined && badge > 0 && (
        <span className="absolute top-3 right-3 flex h-5 min-w-5 items-center justify-center rounded-full bg-rose-500 px-1.5 text-[10px] font-bold text-white shadow">
          {badge}
        </span>
      )}
      <div className={`max-w-[70%] text-[15px] font-bold leading-tight ${s.dark}`}>{label}</div>
      {value && <div className={`mt-1 text-lg font-extrabold ${s.dark}`}>{value}</div>}
    </button>
  );
}

/* ---------------- White module tile (grid) ---------------- */
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
    <button
      onClick={onClick}
      className="flex flex-col items-center gap-2 rounded-2xl border border-slate-200/80 bg-white px-2 py-3.5 transition-all duration-200 hover:-translate-y-0.5 hover:border-sky-200 hover:shadow-sm active:scale-95"
    >
      <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-sky-500 to-blue-600 text-white shadow-sm">
        {icon}
      </span>
      <span className="text-[11px] font-semibold leading-tight text-slate-600">{label}</span>
    </button>
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
    <div
      onClick={onClick}
      className={`rounded-2xl border bg-white p-4 transition-all ${onClick ? "cursor-pointer hover:border-sky-200 hover:shadow-sm" : ""} ${
        overdueish ? "border-rose-200" : "border-slate-200/80"
      }`}
    >
      <div className="flex items-start gap-3">
        {showStudent && <Avatar name={fine.student.name} color={fine.student.photoColor} size={38} />}
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <div className="truncate text-sm font-bold text-slate-800">{fine.offence.name}</div>
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
              <div className={`text-sm font-extrabold ${overdueish ? "text-rose-600" : "text-slate-800"}`}>
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
    </div>
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
            <FileWarning className="h-4 w-4 text-sky-500" /> {fine.offence.name}
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
              <div className="text-xl font-extrabold text-slate-800">{inr(fine.amountSnapshot)}</div>
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
              <Skeleton className="h-10 w-full rounded-xl" />
              <Skeleton className="h-10 w-full rounded-xl" />
            </div>
          ) : audits.length === 0 ? (
            <p className="text-xs text-slate-400">No audit entries.</p>
          ) : (
            <ol className="relative space-y-3 border-l-2 border-slate-100 pl-4">
              {audits.map((a) => (
                <li key={a.id} className="relative">
                  <span className="absolute -left-[22px] top-1.5 h-2.5 w-2.5 rounded-full bg-gradient-to-br from-sky-400 to-blue-600 ring-2 ring-white" />
                  <div className="text-xs font-bold text-slate-700">
                    {a.action.replaceAll("_", " ")} <span className="font-normal text-slate-400">· {a.actorName}</span>
                  </div>
                  <div className="text-[11px] text-slate-400">{fmtDateTime(a.createdAt)}</div>
                  {a.note && <div className="mt-0.5 text-xs text-slate-500">{a.note}</div>}
                </li>
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
export function EmptyState({ title, hint, icon }: { title: string; hint?: string; icon?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 py-10 text-center">
      <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-slate-300 shadow-sm">
        {icon ?? <Inbox className="h-6 w-6" />}
      </span>
      <div className="text-sm font-semibold text-slate-500">{title}</div>
      {hint && <div className="max-w-xs text-xs text-slate-400">{hint}</div>}
    </div>
  );
}

export function CardsSkeleton({ n = 3 }: { n?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: n }).map((_, i) => (
        <Skeleton key={i} className="h-24 w-full rounded-2xl" />
      ))}
    </div>
  );
}

export function StatSkeleton({ n = 4 }: { n?: number }) {
  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {Array.from({ length: n }).map((_, i) => (
        <Skeleton key={i} className="h-24 rounded-2xl" />
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
