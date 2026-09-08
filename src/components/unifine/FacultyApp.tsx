"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  SectionCard,
  SectionHeader,
  StatCard,
  ColorTile,
  FineCard,
  FineDetailDialog,
  EmptyState,
  CardsSkeleton,
  StatSkeleton,
} from "./shared";
import { NotificationsView } from "./common-views";
import { Avatar } from "./Avatar";
import { api, inr, fmtDate, toCsv, downloadCsv } from "./utils";
import type { FineT, OffenceT, SessionUser, StudentT, SummaryT } from "./types";
import {
  AlertTriangle,
  BadgeCheck,
  BadgeIndianRupee,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  CircleAlert,
  FileDown,
  FilePlus2,
  FileWarning,
  Loader2,
  PlusCircle,
  Search,
  ShieldCheck,
  UserRound,
  Users,
  Wallet,
  History,
} from "lucide-react";

type Nav = "home" | "assign" | "history" | "notifications";

/* ================= Faculty portal ================= */
export function FacultyApp({
  session,
  view,
  onView,
}: {
  session: SessionUser;
  view: string;
  onView: (v: string) => void;
}) {
  return (
    <div className="space-y-4">
      {view === "home" && <FacultyHome session={session} onView={onView} />}
      {view === "assign" && <AssignFine session={session} onDone={() => onView("home")} />}
      {view === "history" && <FineHistory session={session} />}
      {view === "notifications" && <NotificationsView session={session} />}
    </div>
  );
}

/* ---------------- Home ---------------- */
function FacultyHome({ session, onView }: { session: SessionUser; onView: (v: string) => void }) {
  const [summary, setSummary] = useState<SummaryT | null>(null);
  const [recent, setRecent] = useState<FineT[] | null>(null);

  useEffect(() => {
    api<SummaryT>(session, "/api/reports/summary?scope=me").then(setSummary).catch(() => setSummary(undefined as never));
    api<{ fines: FineT[] }>(session, `/api/fines?issuedBy=${session.id}`)
      .then((d) => setRecent(d.fines))
      .catch(() => setRecent([]));
  }, [session]);

  const awaiting = (summary?.pendingCount ?? 0) + (summary?.overdueCount ?? 0);

  return (
    <>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {summary === null ? (
          <StatSkeleton />
        ) : summary ? (
          <>
            <StatCard label="Fines Issued" value={summary.total} sub="by you, all time" tone="blue" icon={<FilePlus2 className="h-4 w-4" />} />
            <StatCard label="Awaiting Payment" value={awaiting} sub={`${summary.overdueCount} overdue`} tone="amber" icon={<AlertTriangle className="h-4 w-4" />} />
            <StatCard label="Resolved" value={summary.paidCount} sub={inr(summary.collected) + " collected"} tone="emerald" icon={<CheckCircle2 className="h-4 w-4" />} />
            <StatCard label="Students Impacted" value={summary.studentsWithFines} sub="unique students" tone="violet" icon={<Users className="h-4 w-4" />} />
          </>
        ) : null}
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <ColorTile label="Assign Fine" icon={<PlusCircle className="h-12 w-12" />} tone="rose" onClick={() => onView("assign")} />
        <ColorTile label="Fine History" icon={<History className="h-11 w-11" />} tone="violet" onClick={() => onView("history")} />
        <ColorTile label="My Collection" value={summary ? inr(summary.collected) : "—"} icon={<BadgeIndianRupee className="h-11 w-11" />} tone="emerald" onClick={() => onView("history")} />
        <ColorTile label="Alerts" icon={<Wallet className="h-11 w-11" />} tone="amber" onClick={() => onView("notifications")} />
      </div>

      <SectionCard>
        <SectionHeader
          title="My Recent Activity"
          icon={<History className="h-4 w-4 text-sky-500" />}
          action={
            <Button variant="ghost" size="sm" className="h-8 rounded-lg text-xs font-bold text-sky-600 hover:bg-sky-50" onClick={() => onView("history")}>
              View all
            </Button>
          }
        />
        {recent === null ? (
          <CardsSkeleton n={3} />
        ) : recent.length === 0 ? (
          <EmptyState
            title="No fines issued yet"
            hint="Use the Assign Fine action to issue your first fine after verifying a student."
            icon={<FilePlus2 className="h-6 w-6" />}
          />
        ) : (
          <div className="space-y-2.5">
            {recent.slice(0, 4).map((f) => (
              <FineCard key={f.id} fine={f} showStudent onClick={() => onView("history")} />
            ))}
          </div>
        )}
      </SectionCard>
    </>
  );
}

/* ---------------- Assign Fine workflow (PRD §7) ---------------- */
type Verified = { student: StudentT; stats: { total: number; pending: number; overdue: number; outstanding: number } };

function AssignFine({ session, onDone }: { session: SessionUser; onDone: () => void }) {
  const [step, setStep] = useState(1);
  const [roll, setRoll] = useState("");
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState("");
  const [found, setFound] = useState<Verified | null>(null);
  const [verified, setVerified] = useState(false);

  const [offences, setOffences] = useState<OffenceT[] | null>(null);
  const [selected, setSelected] = useState<Record<string, { reason: string }>>({});
  const [dueDate, setDueDate] = useState(() => {
    const d = new Date(Date.now() + 14 * 86400000);
    return d.toISOString().slice(0, 10);
  });

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [success, setSuccess] = useState<{ fineId: string; offence: string; amount: number }[] | null>(null);

  useEffect(() => {
    if (step >= 2 && !offences) {
      api<{ offences: OffenceT[] }>(session, "/api/offences?active=true")
        .then((d) => setOffences(d.offences))
        .catch(() => setOffences([]));
    }
  }, [step, offences, session]);

  const search = async () => {
    setSearchError("");
    setFound(null);
    setVerified(false);
    if (!roll.trim()) {
      setSearchError("Please enter a roll number or student ID.");
      return;
    }
    setSearching(true);
    try {
      const data = await api<Verified>(session, `/api/students/search?rollNumber=${encodeURIComponent(roll.trim())}`);
      setFound(data);
    } catch (e) {
      setSearchError(e instanceof Error ? e.message : "Search failed.");
    } finally {
      setSearching(false);
    }
  };

  const toggleOffence = (id: string) => {
    setSelected((prev) => {
      const next = { ...prev };
      if (next[id]) delete next[id];
      else next[id] = { reason: "" };
      return next;
    });
  };

  const selectedList = useMemo(() => {
    if (!offences) return [];
    return Object.keys(selected)
      .map((id) => offences.find((o) => o.id === id)!)
      .filter(Boolean);
  }, [offences, selected]);

  const total = selectedList.reduce((s, o) => s + o.amount, 0);

  const submit = async () => {
    if (!found) return;
    setSubmitting(true);
    setSubmitError("");
    try {
      const data = await api<{ created: { fineId: string; offence: string; amount: number }[] }>(session, "/api/fines", {
        method: "POST",
        body: JSON.stringify({
          studentId: found.student.id,
          offences: selectedList.map((o) => ({ offenceId: o.id, reason: selected[o.id]?.reason })),
          dueDate,
        }),
      });
      setSuccess(data.created);
    } catch (e) {
      setSubmitError(e instanceof Error ? e.message : "Submission failed.");
      setConfirmOpen(false);
    } finally {
      setSubmitting(false);
    }
  };

  const reset = () => {
    setStep(1);
    setRoll("");
    setFound(null);
    setVerified(false);
    setSelected({});
    setSuccess(null);
    setSubmitError("");
  };

  if (success) {
    return (
      <SectionCard className="fade-up">
        <div className="flex flex-col items-center py-4 text-center">
          <span className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
            <CheckCircle2 className="h-9 w-9" />
          </span>
          <h2 className="mt-4 text-xl font-extrabold text-slate-800">Fine{success.length > 1 ? "s" : ""} assigned successfully</h2>
          <p className="mt-1 max-w-sm text-sm text-slate-500">
            {success.length} separate record{success.length > 1 ? "s" : ""} created for{" "}
            <b>{found?.student.name}</b> ({found?.student.rollNumber}). The student has been notified.
          </p>
        </div>
        <div className="space-y-2">
          {success.map((r) => (
            <div key={r.fineId} className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3 ring-1 ring-slate-100">
              <span className="text-sm font-semibold text-slate-700">{r.offence}</span>
              <span className="text-sm font-extrabold text-slate-800">{inr(r.amount)}</span>
            </div>
          ))}
          <div className="flex items-center justify-between rounded-2xl bg-gradient-to-r from-sky-500 to-blue-600 px-4 py-3 text-white">
            <span className="text-sm font-bold">Total</span>
            <span className="text-base font-extrabold">{inr(success.reduce((s, r) => s + r.amount, 0))}</span>
          </div>
        </div>
        <div className="mt-5 flex gap-3">
          <Button onClick={reset} variant="outline" className="flex-1 rounded-xl font-bold">
            <PlusCircle className="mr-1.5 h-4 w-4" /> Assign another
          </Button>
          <Button onClick={onDone} className="flex-1 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 font-bold">
            Back to dashboard
          </Button>
        </div>
      </SectionCard>
    );
  }

  return (
    <div className="space-y-4">
      {/* Stepper */}
      <div className="flex items-center gap-2 rounded-2xl bg-white p-3 shadow-sm ring-1 ring-slate-100">
        {[
          { n: 1, label: "Find Student" },
          { n: 2, label: "Select Offences" },
          { n: 3, label: "Review & Submit" },
        ].map((s, i) => (
          <div key={s.n} className="flex flex-1 items-center gap-2">
            <span
              className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-extrabold transition ${
                step > s.n
                  ? "bg-emerald-500 text-white"
                  : step === s.n
                    ? "bg-gradient-to-br from-sky-500 to-blue-600 text-white shadow-md shadow-blue-500/30"
                    : "bg-slate-100 text-slate-400"
              }`}
            >
              {step > s.n ? <BadgeCheck className="h-4 w-4" /> : s.n}
            </span>
            <span className={`hidden text-xs font-bold sm:block ${step >= s.n ? "text-slate-700" : "text-slate-400"}`}>
              {s.label}
            </span>
            {i < 2 && <div className={`h-0.5 flex-1 rounded-full ${step > s.n ? "bg-emerald-400" : "bg-slate-100"}`} />}
          </div>
        ))}
      </div>

      {/* STEP 1 — search & verify (FR-03, FR-04) */}
      {step === 1 && (
        <SectionCard className="fade-up">
          <SectionHeader title="Find Student" icon={<Search className="h-4 w-4 text-sky-500" />} />
          <Label className="text-xs font-bold text-slate-600">Roll number / Student ID</Label>
          <div className="mt-1.5 flex gap-2">
            <div className="relative flex-1">
              <UserRound className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                value={roll}
                onChange={(e) => setRoll(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && search()}
                placeholder="e.g. KRMU22CSE0042"
                className="h-11 rounded-xl border-slate-200 bg-slate-50/70 pl-9 uppercase tracking-wide text-sm"
              />
            </div>
            <Button
              onClick={search}
              disabled={searching}
              className="h-11 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 px-5 font-bold"
            >
              {searching ? <Loader2 className="h-4 w-4 animate-spin" /> : "Search"}
            </Button>
          </div>
          {searchError && (
            <Alert variant="destructive" className="mt-3 rounded-xl py-2.5 text-xs">
              <AlertDescription className="flex items-center gap-1.5">
                <CircleAlert className="h-3.5 w-3.5" /> {searchError}
              </AlertDescription>
            </Alert>
          )}

          {found && (
            <div className="fade-up mt-5 rounded-2xl border border-sky-200 bg-sky-50/50 p-4">
              <div className="flex items-center gap-3">
                <Avatar name={found.student.name} color={found.student.photoColor} size={52} ring />
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-extrabold text-slate-800">{found.student.name}</div>
                  <div className="text-xs text-slate-500">{found.student.rollNumber}</div>
                  <div className="mt-0.5 text-[11px] text-slate-500">
                    {found.student.programme} · {found.student.year}
                  </div>
                  <div className="text-[11px] text-slate-400">{found.student.department}</div>
                </div>
                {verified && (
                  <Badge className="rounded-full bg-emerald-100 px-2.5 py-1 text-[10px] font-bold text-emerald-700 hover:bg-emerald-100">
                    <ShieldCheck className="mr-1 h-3 w-3" /> Verified
                  </Badge>
                )}
              </div>
              <div className="mt-3 grid grid-cols-4 gap-2">
                <VerifyStat label="Total" value={String(found.stats.total)} />
                <VerifyStat label="Pending" value={String(found.stats.pending)} />
                <VerifyStat label="Overdue" value={String(found.stats.overdue)} warn />
                <VerifyStat label="Outstanding" value={inr(found.stats.outstanding)} />
              </div>

              {!verified ? (
                <div className="mt-4">
                  <p className="mb-2 text-[11px] leading-relaxed text-slate-500">
                    Confirm this is the intended student before offence selection becomes available.
                  </p>
                  <Button onClick={() => setVerified(true)} className="w-full rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 font-bold">
                    <ShieldCheck className="mr-1.5 h-4 w-4" /> Verify Student
                  </Button>
                </div>
              ) : (
                <Button onClick={() => setStep(2)} className="mt-4 w-full rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 font-bold">
                  Continue to Offences <ChevronRight className="ml-1 h-4 w-4" />
                </Button>
              )}
            </div>
          )}
        </SectionCard>
      )}

      {/* STEP 2 — offence selection (FR-07, FR-08, FR-09) */}
      {step === 2 && found && (
        <SectionCard className="fade-up">
          <SectionHeader
            title={`Select Offences — ${found.student.name.split(" ")[0]}`}
            icon={<FileWarning className="h-4 w-4 text-sky-500" />}
            action={
              <Button variant="ghost" size="sm" className="h-8 rounded-lg text-xs font-bold text-slate-500" onClick={() => setStep(1)}>
                <ChevronLeft className="h-3.5 w-3.5" /> Back
              </Button>
            }
          />
          <p className="mb-3 text-[11px] text-slate-500">
            Amounts load automatically from the approved catalogue. At least <b>one offence is required</b>;
            add more if needed.
          </p>

          {offences === null ? (
            <CardsSkeleton n={4} />
          ) : (
            <>
              <div className="max-h-[22rem] space-y-2 overflow-y-auto pe-1 nice-scroll">
                {offences.map((o) => {
                  const checked = !!selected[o.id];
                  return (
                    <label
                      key={o.id}
                      className={`flex cursor-pointer items-start gap-3 rounded-2xl border p-3.5 transition ${
                        checked ? "border-sky-300 bg-sky-50/60 shadow-sm" : "border-slate-200/80 bg-white hover:border-sky-200"
                      }`}
                    >
                      <Checkbox checked={checked} onCheckedChange={() => toggleOffence(o.id)} className="mt-0.5" />
                      <span className="min-w-0 flex-1">
                        <span className="flex items-start justify-between gap-2">
                          <span className="text-sm font-bold text-slate-800">{o.name}</span>
                          <span className={`shrink-0 text-sm font-extrabold ${checked ? "text-sky-600" : "text-slate-700"}`}>
                            {inr(o.amount)}
                          </span>
                        </span>
                        <span className="mt-0.5 block text-[11px] text-slate-400">
                          {o.code} · {o.ruleRef} · {o.category}
                        </span>
                        {checked && (
                          <Textarea
                            value={selected[o.id].reason}
                            onChange={(e) => setSelected((p) => ({ ...p, [o.id]: { reason: e.target.value } }))}
                            onClick={(e) => e.stopPropagation()}
                            placeholder={`Context / incident details for ${o.name} (optional)`}
                            className="mt-2 min-h-[60px] rounded-xl border-slate-200 bg-white text-xs"
                          />
                        )}
                      </span>
                    </label>
                  );
                })}
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <div>
                  <Label className="text-xs font-bold text-slate-600">Due date</Label>
                  <Input
                    type="date"
                    value={dueDate}
                    min={new Date().toISOString().slice(0, 10)}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="mt-1.5 h-11 rounded-xl border-slate-200 bg-slate-50/70 text-sm"
                  />
                </div>
                <div className="flex items-end">
                  <div className="w-full rounded-xl bg-slate-50 px-4 py-3 ring-1 ring-slate-100">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-500">{selectedList.length} offence(s) selected</span>
                      <span className="text-base font-extrabold text-slate-800">{inr(total)}</span>
                    </div>
                  </div>
                </div>
              </div>

              <Button
                onClick={() => setStep(3)}
                disabled={selectedList.length === 0}
                className="mt-4 w-full rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 font-bold disabled:opacity-50"
              >
                Review Summary <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
              {selectedList.length === 0 && (
                <p className="mt-2 text-center text-[11px] font-medium text-amber-600">
                  Select at least one offence to continue — submission is blocked otherwise.
                </p>
              )}
            </>
          )}
        </SectionCard>
      )}

      {/* STEP 3 — review & submit */}
      {step === 3 && found && (
        <SectionCard className="fade-up">
          <SectionHeader
            title="Review Fine Summary"
            icon={<BadgeIndianRupee className="h-4 w-4 text-sky-500" />}
            action={
              <Button variant="ghost" size="sm" className="h-8 rounded-lg text-xs font-bold text-slate-500" onClick={() => setStep(2)}>
                <ChevronLeft className="h-3.5 w-3.5" /> Back
              </Button>
            }
          />
          <div className="rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-100">
            <div className="flex items-center gap-3">
              <Avatar name={found.student.name} color={found.student.photoColor} size={44} />
              <div>
                <div className="text-sm font-extrabold text-slate-800">{found.student.name}</div>
                <div className="text-xs text-slate-500">
                  {found.student.rollNumber} · {found.student.programme} · {found.student.year}
                </div>
              </div>
              <Badge className="ml-auto rounded-full bg-emerald-100 px-2.5 py-1 text-[10px] font-bold text-emerald-700 hover:bg-emerald-100">
                <ShieldCheck className="mr-1 h-3 w-3" /> Verified
              </Badge>
            </div>
          </div>

          <div className="mt-3 space-y-2">
            {selectedList.map((o) => (
              <div key={o.id} className="rounded-2xl border border-slate-200/80 p-3.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-bold text-slate-800">{o.name}</span>
                  <span className="text-sm font-extrabold text-slate-800">{inr(o.amount)}</span>
                </div>
                <div className="mt-0.5 text-[11px] text-slate-400">
                  {o.code} · {o.ruleRef}
                </div>
                {selected[o.id]?.reason && (
                  <p className="mt-1.5 text-xs text-slate-500">“{selected[o.id].reason}”</p>
                )}
              </div>
            ))}
          </div>

          <div className="mt-3 space-y-1.5 rounded-2xl bg-gradient-to-r from-sky-500 to-blue-600 p-4 text-white">
            <div className="flex justify-between text-xs text-sky-100">
              <span>Due date</span>
              <span className="font-bold">{fmtDate(dueDate)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold">Total payable</span>
              <span className="text-xl font-extrabold">{inr(total)}</span>
            </div>
          </div>

          {submitError && (
            <Alert variant="destructive" className="mt-3 rounded-xl py-2.5 text-xs">
              <AlertDescription>{submitError}</AlertDescription>
            </Alert>
          )}

          <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
            <AlertDialogContent className="rounded-3xl">
              <AlertDialogHeader>
                <AlertDialogTitle>Confirm fine submission?</AlertDialogTitle>
                <AlertDialogDescription>
                  {selectedList.length} separate fine record{selectedList.length > 1 ? "s" : ""} totalling{" "}
                  {inr(total)} will be created for {found.student.name} ({found.student.rollNumber}). This
                  action is audited.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={(e) => {
                    e.preventDefault();
                    submit();
                  }}
                  className="rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 font-bold"
                >
                  {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Confirm & Submit"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          <Button
            onClick={() => setConfirmOpen(true)}
            disabled={submitting || selectedList.length === 0}
            className="mt-4 h-12 w-full rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 text-sm font-extrabold shadow-md shadow-blue-500/25"
          >
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : `Submit ${selectedList.length} Fine${selectedList.length > 1 ? "s" : ""} · ${inr(total)}`}
          </Button>
        </SectionCard>
      )}
    </div>
  );
}

function VerifyStat({ label, value, warn }: { label: string; value: string; warn?: boolean }) {
  return (
    <div className="rounded-xl bg-white px-2.5 py-2 text-center ring-1 ring-slate-100">
      <p className="text-[9px] font-bold uppercase tracking-wide text-slate-400">{label}</p>
      <p className={`truncate text-xs font-extrabold ${warn && value !== "0" ? "text-rose-600" : "text-slate-700"}`}>{value}</p>
    </div>
  );
}

/* ---------------- Fine history (FR-14) ---------------- */
function FineHistory({ session }: { session: SessionUser }) {
  const [fines, setFines] = useState<FineT[] | null>(null);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("ALL");
  const [mineOnly, setMineOnly] = useState(false);
  const [selected, setSelected] = useState<FineT | null>(null);

  useEffect(() => {
    api<{ fines: FineT[] }>(session, "/api/fines")
      .then((d) => setFines(d.fines))
      .catch(() => setFines([]));
  }, [session]);

  const filtered = useMemo(() => {
    let list = fines ?? [];
    if (mineOnly) list = list.filter((f) => f.issuedBy.id === session.id);
    if (status !== "ALL") list = list.filter((f) => f.status === status);
    if (q.trim()) {
      const s = q.trim().toLowerCase();
      list = list.filter(
        (f) =>
          f.student.name.toLowerCase().includes(s) ||
          f.student.rollNumber.toLowerCase().includes(s) ||
          f.offence.name.toLowerCase().includes(s) ||
          (f.reason ?? "").toLowerCase().includes(s)
      );
    }
    return list;
  }, [fines, q, status, mineOnly, session.id]);

  const exportCsv = () => {
    downloadCsv(
      "unifine-fine-history.csv",
      toCsv(
        filtered.map((f) => ({
          Roll: f.student.rollNumber,
          Student: f.student.name,
          Offence: f.offence.name,
          Rule: f.offence.ruleRef,
          Amount: f.amountSnapshot,
          Status: f.status,
          IssuedBy: f.issuedBy.name,
          Issued: fmtDate(f.issueDate),
          Due: fmtDate(f.dueDate),
          Reason: f.reason ?? "",
        }))
      )
    );
  };

  return (
    <SectionCard>
      <SectionHeader
        title="Fine History"
        icon={<History className="h-4 w-4 text-sky-500" />}
        action={
          <Button variant="outline" size="sm" onClick={exportCsv} className="h-8 gap-1.5 rounded-lg text-xs font-bold text-slate-600">
            <FileDown className="h-3.5 w-3.5" /> Export CSV
          </Button>
        }
      />
      <div className="mb-3 flex flex-col gap-2 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search student, roll, offence…"
            className="h-10 rounded-xl border-slate-200 bg-slate-50/70 pl-9 text-sm"
          />
        </div>
        <div className="flex gap-2">
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="h-10 rounded-xl border border-slate-200 bg-slate-50/70 px-3 text-xs font-bold text-slate-600"
            aria-label="Filter by status"
          >
            <option value="ALL">All status</option>
            <option value="PENDING">Pending</option>
            <option value="PAID">Paid</option>
            <option value="OVERDUE">Overdue</option>
          </select>
          <Button
            variant={mineOnly ? "default" : "outline"}
            size="sm"
            onClick={() => setMineOnly(!mineOnly)}
            className={`h-10 rounded-xl px-3.5 text-xs font-bold ${mineOnly ? "bg-gradient-to-r from-sky-500 to-blue-600" : "text-slate-600"}`}
          >
            Mine only
          </Button>
        </div>
      </div>

      {fines === null ? (
        <CardsSkeleton n={5} />
      ) : filtered.length === 0 ? (
        <EmptyState title="No fines found" hint="Adjust your filters or search term." />
      ) : (
        <div className="max-h-[60vh] space-y-2.5 overflow-y-auto pe-1 nice-scroll">
          {filtered.map((f) => (
            <FineCard key={f.id} fine={f} showStudent onClick={() => setSelected(f)} />
          ))}
        </div>
      )}

      <FineDetailDialog session={session} fine={selected} open={!!selected} onClose={() => setSelected(null)} />
    </SectionCard>
  );
}
