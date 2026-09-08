"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  SectionCard,
  SectionHeader,
  ColorTile,
  ModuleTile,
  FineCard,
  FineDetailDialog,
  EmptyState,
  CardsSkeleton,
} from "./shared";
import { RuleBookView, NotificationsView } from "./common-views";
import { Avatar } from "./Avatar";
import { api, inr, fmtDate, daysLeft } from "./utils";
import type { FineT, SessionUser, StudentT } from "./types";
import {
  BadgeAlert,
  BadgeCheck,
  Bell,
  BookOpenText,
  CalendarClock,
  FileWarning,
  ScanLine,
  ScrollText,
  UserRound,
  Wallet,
  Clock3,
} from "lucide-react";

/* ================= Student portal (FR-12: read-only, own records) ================= */
export function StudentApp({
  session,
  student,
  view,
  onView,
}: {
  session: SessionUser;
  student: StudentT | null;
  view: string;
  onView: (v: string) => void;
}) {
  const [fines, setFines] = useState<FineT[] | null>(null);
  const [tab, setTab] = useState("ALL");
  const [selected, setSelected] = useState<FineT | null>(null);
  const [notifs, setNotifs] = useState<{ count: number }>({ count: 0 });

  useEffect(() => {
    api<{ fines: FineT[] }>(session, "/api/fines")
      .then((d) => setFines(d.fines))
      .catch(() => setFines([]));
    api<{ notifications: { read: boolean }[] }>(session, "/api/notifications")
      .then((d) => setNotifs({ count: d.notifications.filter((n) => !n.read).length }))
      .catch(() => {});
  }, [session, view]);

  const stats = useMemo(() => {
    const all = fines ?? [];
    const outstanding = all.filter((f) => f.status !== "PAID").reduce((s, f) => s + f.amountSnapshot, 0);
    const paid = all.filter((f) => f.status === "PAID");
    return {
      outstanding,
      active: all.filter((f) => f.status === "PENDING").length,
      overdue: all.filter((f) => f.status === "OVERDUE").length,
      paidCount: paid.length,
      paidAmount: paid.reduce((s, f) => s + f.amountSnapshot, 0),
    };
  }, [fines]);

  const filtered = useMemo(() => {
    const all = fines ?? [];
    return tab === "ALL" ? all : all.filter((f) => f.status === tab);
  }, [fines, tab]);

  const nearestDue = useMemo(() => {
    const upcoming = (fines ?? [])
      .filter((f) => f.status !== "PAID")
      .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
    return upcoming[0] ?? null;
  }, [fines]);

  return (
    <div className="space-y-4">
      {view === "home" && (
        <>
          {/* Balance hero */}
          <SectionCard className="!p-0 overflow-hidden">
            <div className="relative overflow-hidden bg-gradient-to-br from-sky-500 via-blue-500 to-blue-600 p-5 text-white">
              <div className="absolute -right-8 -top-10 h-36 w-36 rounded-full bg-white/10" />
              <div className="absolute -bottom-12 right-16 h-28 w-28 rounded-full bg-white/10" />
              <div className="relative flex items-start justify-between">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-sky-100">Outstanding balance</p>
                  <p className="mt-1 text-4xl font-extrabold tracking-tight">{inr(stats.outstanding)}</p>
                  <p className="mt-1.5 text-xs text-sky-100">
                    {stats.active} pending · {stats.overdue} overdue · {stats.paidCount} cleared
                  </p>
                </div>
                <Badge className="rounded-full bg-white/20 px-3 py-1 text-[10px] font-bold text-white backdrop-blur hover:bg-white/20">
                  {student?.status === "ACTIVE" ? "Account Active" : "Account " + (student?.status ?? "—")}
                </Badge>
              </div>
              <div className="relative mt-4 grid grid-cols-3 gap-2">
                <MiniStat label="Total fines" value={String(fines?.length ?? 0)} />
                <MiniStat label="Total paid" value={inr(stats.paidAmount)} />
                <MiniStat
                  label="Next due"
                  value={nearestDue ? fmtDate(nearestDue.dueDate) : "—"}
                  warn={nearestDue ? daysLeft(nearestDue.dueDate) < 0 : false}
                />
              </div>
            </div>
          </SectionCard>

          {/* Colorful quick tiles */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <ColorTile label="My Fines" icon={<FileWarning className="h-11 w-11" />} tone="rose" badge={stats.active + stats.overdue} onClick={() => onView("fines")} />
            <ColorTile label="Payments" icon={<Wallet className="h-11 w-11" />} tone="emerald" onClick={() => onView("fines")} />
            <ColorTile label="Rule Book" icon={<BookOpenText className="h-11 w-11" />} tone="violet" onClick={() => onView("rulebook")} />
            <ColorTile label="Alerts" icon={<Bell className="h-11 w-11" />} tone="amber" badge={notifs.count} onClick={() => onView("notifications")} />
          </div>

          {/* Module grid */}
          <SectionCard>
            <SectionHeader title="Quick Access" />
            <div className="grid grid-cols-4 gap-2.5 sm:grid-cols-4">
              <ModuleTile label="My Fines" icon={<FileWarning className="h-5 w-5" />} onClick={() => onView("fines")} />
              <ModuleTile label="Rule Book" icon={<ScrollText className="h-5 w-5" />} onClick={() => onView("rulebook")} />
              <ModuleTile label="Alerts" icon={<Bell className="h-5 w-5" />} onClick={() => onView("notifications")} />
              <ModuleTile label="Profile" icon={<UserRound className="h-5 w-5" />} onClick={() => onView("profile")} />
            </div>
          </SectionCard>

          {/* Recent fines */}
          <SectionCard>
            <SectionHeader
              title="Recent Fines"
              icon={<BadgeAlert className="h-4 w-4 text-sky-500" />}
              action={
                <Button variant="ghost" size="sm" className="h-8 rounded-lg text-xs font-bold text-sky-600 hover:bg-sky-50" onClick={() => onView("fines")}>
                  View all
                </Button>
              }
            />
            {fines === null ? (
              <CardsSkeleton n={3} />
            ) : fines.length === 0 ? (
              <EmptyState title="No fines on record" hint="You're all clear. Keep following the university rule book!" icon={<BadgeCheck className="h-6 w-6" />} />
            ) : (
              <div className="space-y-2.5">
                {fines.slice(0, 3).map((f) => (
                  <FineCard key={f.id} fine={f} onClick={() => setSelected(f)} />
                ))}
              </div>
            )}
          </SectionCard>

          {/* Deadline hint */}
          {nearestDue && (
            <div className={`flex items-center gap-3 rounded-2xl p-4 ring-1 ${daysLeft(nearestDue.dueDate) < 0 ? "bg-rose-50 ring-rose-200" : "bg-amber-50 ring-amber-200"}`}>
              <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${daysLeft(nearestDue.dueDate) < 0 ? "bg-rose-500" : "bg-amber-500"} text-white`}>
                <CalendarClock className="h-5 w-5" />
              </span>
              <div>
                <p className={`text-sm font-bold ${daysLeft(nearestDue.dueDate) < 0 ? "text-rose-700" : "text-amber-700"}`}>
                  {daysLeft(nearestDue.dueDate) < 0
                    ? `Overdue: ${nearestDue.offence.name}`
                    : `Due in ${daysLeft(nearestDue.dueDate)} day(s)`}
                </p>
                <p className="text-xs text-slate-500">
                  {nearestDue.offence.name} · {inr(nearestDue.amountSnapshot)} · clear at accounts counter
                </p>
              </div>
            </div>
          )}
        </>
      )}

      {view === "fines" && (
        <SectionCard>
          <SectionHeader title="My Fine Records" icon={<FileWarning className="h-4 w-4 text-sky-500" />} />
          <Tabs value={tab} onValueChange={setTab} className="mb-4">
            <TabsList className="grid w-full grid-cols-4 rounded-2xl bg-slate-100 p-1">
              <TabsTrigger value="ALL" className="rounded-xl text-xs font-bold">All</TabsTrigger>
              <TabsTrigger value="PENDING" className="rounded-xl text-xs font-bold">Pending</TabsTrigger>
              <TabsTrigger value="PAID" className="rounded-xl text-xs font-bold">Paid</TabsTrigger>
              <TabsTrigger value="OVERDUE" className="rounded-xl text-xs font-bold">Overdue</TabsTrigger>
            </TabsList>
          </Tabs>
          {fines === null ? (
            <CardsSkeleton n={4} />
          ) : filtered.length === 0 ? (
            <EmptyState title="Nothing here" hint="No fines under this filter." icon={<ScanLine className="h-6 w-6" />} />
          ) : (
            <div className="space-y-2.5">
              {filtered.map((f) => (
                <FineCard key={f.id} fine={f} onClick={() => setSelected(f)} />
              ))}
            </div>
          )}
          <p className="mt-4 flex items-center gap-1.5 rounded-xl bg-slate-50 px-3 py-2.5 text-[11px] text-slate-500 ring-1 ring-slate-100">
            <Clock3 className="h-3.5 w-3.5 shrink-0 text-slate-400" />
            Payments are accepted at the University accounts counter. Records shown here are read-only.
          </p>
        </SectionCard>
      )}

      {view === "rulebook" && <RuleBookView session={session} />}
      {view === "notifications" && <NotificationsView session={session} />}

      {view === "profile" && (
        <SectionCard>
          <div className="flex flex-col items-center py-2 text-center">
            <Avatar name={student?.name ?? session.name} color={student?.photoColor ?? "#3b82f6"} size={84} ring />
            <h2 className="mt-3 text-lg font-extrabold text-slate-800">{student?.name ?? session.name}</h2>
            <p className="text-xs text-slate-500">{student?.programme ?? session.designation}</p>
            <Badge className="mt-2 rounded-full bg-emerald-100 px-3 py-1 text-[10px] font-bold text-emerald-700 hover:bg-emerald-100">
              {student?.status ?? "ACTIVE"}
            </Badge>
          </div>
          <div className="mt-4 space-y-2">
            <InfoRow label="Roll Number" value={student?.rollNumber ?? "—"} />
            <InfoRow label="University Email" value={student?.email ?? session.email} />
            <InfoRow label="School / Department" value={student?.department ?? session.department ?? "—"} />
            <InfoRow label="Year" value={student?.year ?? "—"} />
            <InfoRow label="Portal Role" value="Student (read-only)" />
          </div>
          <p className="mt-4 rounded-xl bg-sky-50 px-3 py-2.5 text-[11px] leading-relaxed text-sky-700 ring-1 ring-sky-100">
            Students can view their own fine records and the rule book. Editing fine records is not permitted.
          </p>
        </SectionCard>
      )}

      <FineDetailDialog session={session} fine={selected} open={!!selected} onClose={() => setSelected(null)} />
    </div>
  );
}

function MiniStat({ label, value, warn }: { label: string; value: string; warn?: boolean }) {
  return (
    <div className="rounded-2xl bg-white/12 px-3 py-2.5 backdrop-blur">
      <p className="text-[10px] font-semibold text-sky-100">{label}</p>
      <p className={`mt-0.5 truncate text-sm font-extrabold ${warn ? "text-amber-300" : "text-white"}`}>{value}</p>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl bg-slate-50 px-3.5 py-2.5 ring-1 ring-slate-100">
      <span className="text-xs font-semibold text-slate-500">{label}</span>
      <span className="text-right text-xs font-bold text-slate-700">{value}</span>
    </div>
  );
}
