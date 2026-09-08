"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
  LegendChip,
} from "./shared";
import { StatusBadge } from "./StatusBadge";
import { api, inr, fmtDate, fmtDateTime, toCsv, downloadCsv } from "./utils";
import type { FineT, OffenceT, RuleEntryT, AuditT, SessionUser, SummaryT, NotificationT } from "./types";
import {
  AlertTriangle,
  BadgeIndianRupee,
  BarChart3,
  BellRing,
  BookOpenCheck,
  CheckCircle2,
  ClipboardEdit,
  FileDown,
  FilePlus2,
  FileWarning,
  Gavel,
  History,
  Landmark,
  Loader2,
  Pencil,
  PlusCircle,
  Percent,
  ScrollText,
  Send,
  ShieldCheck,
  Users,
} from "lucide-react";

import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
} from "recharts";

const CHART_COLORS = ["#0ea5e9", "#8b5cf6", "#10b981", "#f59e0b", "#f43f5e", "#06b6d4", "#f97316"];

type Nav =
  | "home"
  | "catalogue"
  | "fines"
  | "reports"
  | "rulebook"
  | "notifications"
  | "audit";

export function AdminApp({
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
      {view === "home" && <AdminHome session={session} onView={onView} />}
      {view === "catalogue" && <OffenceCatalogue session={session} />}
      {view === "fines" && <AdminFines session={session} />}
      {view === "reports" && <ReportsView session={session} />}
      {view === "rulebook" && <RuleBookAdmin session={session} />}
      {view === "notifications" && <BroadcastView session={session} />}
      {view === "audit" && <AuditView session={session} />}
    </div>
  );
}

/* ---------------- Home ---------------- */
function AdminHome({ session, onView }: { session: SessionUser; onView: (v: string) => void }) {
  const [summary, setSummary] = useState<SummaryT | null>(null);
  const [audit, setAudit] = useState<AuditT[] | null>(null);

  useEffect(() => {
    api<SummaryT>(session, "/api/reports/summary").then(setSummary).catch(() => setSummary(undefined as never));
    api<{ audits: AuditT[] }>(session, "/api/audit?take=6").then((d) => setAudit(d.audits)).catch(() => setAudit([]));
  }, [session]);

  return (
    <>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {summary === null ? (
          <StatSkeleton />
        ) : summary ? (
          <>
            <StatCard label="Total Fines" value={summary.total} sub={`${summary.studentsWithFines} students`} tone="blue" icon={<FileWarning className="h-4 w-4" />} />
            <StatCard label="Collected" value={inr(summary.collected)} sub={`${summary.paidCount} fines cleared`} tone="emerald" icon={<BadgeIndianRupee className="h-4 w-4" />} />
            <StatCard label="Outstanding" value={inr(summary.outstanding)} sub={`${summary.pendingCount + summary.overdueCount} unsettled`} tone="rose" icon={<AlertTriangle className="h-4 w-4" />} />
            <StatCard label="Collection Rate" value={`${summary.collectionRate}%`} tone="violet" icon={<Percent className="h-4 w-4" />} />
          </>
        ) : null}
      </div>

      {summary && (
        <SectionCard>
          <div className="mb-2 flex items-center justify-between">
            <span className="text-sm font-bold text-slate-700">Collection progress</span>
            <span className="text-xs font-bold text-violet-600">{summary.collectionRate}% of {inr(summary.totalAmount)}</span>
          </div>
          <Progress value={summary.collectionRate} className="h-3 rounded-full bg-slate-100" />
        </SectionCard>
      )}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <ColorTile label="Offence Catalogue" icon={<Gavel className="h-11 w-11" />} tone="violet" onClick={() => onView("catalogue")} />
        <ColorTile label="Correct Fines" icon={<ClipboardEdit className="h-11 w-11" />} tone="rose" onClick={() => onView("fines")} />
        <ColorTile label="Reports" icon={<BarChart3 className="h-11 w-11" />} tone="emerald" onClick={() => onView("reports")} />
        <ColorTile label="Rule Book" icon={<ScrollText className="h-11 w-11" />} tone="sky" onClick={() => onView("rulebook")} />
      </div>

      <div className="grid gap-4 lg:grid-cols-5">
        <SectionCard className="lg:col-span-3">
          <SectionHeader title="6-Month Trend" icon={<BarChart3 className="h-4 w-4 text-sky-500" />} />
          {summary === null ? (
            <Skeleton className="h-56 w-full rounded-2xl" />
          ) : summary ? (
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={summary.byMonth} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
                  <defs>
                    <linearGradient id="gIssued" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#0ea5e9" stopOpacity={0.5} />
                      <stop offset="100%" stopColor="#0ea5e9" stopOpacity={0.05} />
                    </linearGradient>
                    <linearGradient id="gCollected" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#10b981" stopOpacity={0.5} />
                      <stop offset="100%" stopColor="#10b981" stopOpacity={0.05} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                  <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                  <Tooltip
                    contentStyle={{ borderRadius: 16, border: "1px solid #e2e8f0", fontSize: 12 }}
                    formatter={(v: number, name: string) => [name === "issued" ? `${v} fines` : inr(v), name]}
                  />
                  <Area type="monotone" dataKey="issued" stroke="#0ea5e9" strokeWidth={2.5} fill="url(#gIssued)" name="issued" />
                  <Area type="monotone" dataKey="collected" stroke="#10b981" strokeWidth={2.5} fill="url(#gCollected)" name="collected" />
                </AreaChart>
              </ResponsiveContainer>
              <div className="mt-1 flex justify-center gap-4">
                <LegendChip color="#0ea5e9" label="Fines issued" />
                <LegendChip color="#10b981" label="Amount collected" />
              </div>
            </div>
          ) : null}
        </SectionCard>

        <SectionCard className="lg:col-span-2">
          <SectionHeader title="Status Split" icon={<Landmark className="h-4 w-4 text-sky-500" />} />
          {summary === null ? (
            <Skeleton className="mx-auto h-44 w-44 rounded-full" />
          ) : summary ? (
            <>
              <div className="mx-auto h-44 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={[
                        { name: "Paid", value: summary.paidCount },
                        { name: "Pending", value: summary.pendingCount },
                        { name: "Overdue", value: summary.overdueCount },
                      ]}
                      dataKey="value"
                      innerRadius={52}
                      outerRadius={75}
                      paddingAngle={4}
                      strokeWidth={0}
                    >
                      <Cell fill="#10b981" />
                      <Cell fill="#f59e0b" />
                      <Cell fill="#f43f5e" />
                    </Pie>
                    <Tooltip contentStyle={{ borderRadius: 16, border: "1px solid #e2e8f0", fontSize: 12 }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex justify-center gap-3">
                <LegendChip color="#10b981" label={`Paid ${summary.paidCount}`} />
                <LegendChip color="#f59e0b" label={`Pending ${summary.pendingCount}`} />
                <LegendChip color="#f43f5e" label={`Overdue ${summary.overdueCount}`} />
              </div>
            </>
          ) : null}
        </SectionCard>
      </div>

      <SectionCard>
        <SectionHeader
          title="Recent Activity"
          icon={<History className="h-4 w-4 text-sky-500" />}
          action={
            <Button variant="ghost" size="sm" className="h-8 rounded-lg text-xs font-bold text-sky-600 hover:bg-sky-50" onClick={() => onView("audit")}>
              Full audit trail
            </Button>
          }
        />
        {audit === null ? (
          <CardsSkeleton n={3} />
        ) : audit.length === 0 ? (
          <EmptyState title="No activity yet" />
        ) : (
          <ol className="relative space-y-3 border-l-2 border-slate-100 pl-4">
            {audit.map((a) => (
              <li key={a.id} className="relative">
                <span className="absolute -left-[22px] top-1.5 h-2.5 w-2.5 rounded-full bg-gradient-to-br from-sky-400 to-blue-600 ring-2 ring-white" />
                <div className="text-xs font-bold text-slate-700">
                  {a.action.replaceAll("_", " ")}
                  {a.fine ? (
                    <span className="ml-1 font-normal text-slate-400">
                      · {a.fine.offence.name} — {a.fine.student.name}
                    </span>
                  ) : null}
                </div>
                <div className="text-[11px] text-slate-400">
                  {a.actorName} · {fmtDateTime(a.createdAt)}
                </div>
              </li>
            ))}
          </ol>
        )}
      </SectionCard>
    </>
  );
}

/* ---------------- Offence catalogue (FR-05) ---------------- */
const EMPTY_FORM = { code: "", name: "", description: "", ruleRef: "", category: "Campus Discipline", amount: "", active: true };

function OffenceCatalogue({ session }: { session: SessionUser }) {
  const [offences, setOffences] = useState<OffenceT[] | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<OffenceT | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [q, setQ] = useState("");

  const load = () => {
    api<{ offences: OffenceT[] }>(session, "/api/offences").then((d) => setOffences(d.offences)).catch(() => setOffences([]));
  };
  useEffect(load, [session]);

  const openAdd = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setError("");
    setDialogOpen(true);
  };
  const openEdit = (o: OffenceT) => {
    setEditing(o);
    setForm({ code: o.code, name: o.name, description: o.description, ruleRef: o.ruleRef, category: o.category, amount: String(o.amount), active: o.active });
    setError("");
    setDialogOpen(true);
  };

  const save = async () => {
    setError("");
    if (!form.code.trim() || !form.name.trim() || !form.ruleRef.trim() || !form.amount) {
      setError("Code, name, rule reference and amount are required.");
      return;
    }
    setSaving(true);
    try {
      if (editing) {
        await api(session, `/api/offences/${editing.id}`, {
          method: "PATCH",
          body: JSON.stringify({ name: form.name, description: form.description, ruleRef: form.ruleRef, category: form.category, amount: Number(form.amount), active: form.active }),
        });
      } else {
        await api(session, "/api/offences", {
          method: "POST",
          body: JSON.stringify({ ...form, amount: Number(form.amount) }),
        });
      }
      setDialogOpen(false);
      load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed.");
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (o: OffenceT) => {
    await api(session, `/api/offences/${o.id}`, { method: "PATCH", body: JSON.stringify({ active: !o.active }) });
    load();
  };

  const filtered = (offences ?? []).filter(
    (o) => !q || (o.name + o.code + o.category + o.ruleRef).toLowerCase().includes(q.toLowerCase())
  );

  return (
    <SectionCard>
      <SectionHeader
        title="Offence Catalogue"
        icon={<Gavel className="h-4 w-4 text-sky-500" />}
        action={
          <Button onClick={openAdd} size="sm" className="h-9 gap-1.5 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 text-xs font-bold">
            <PlusCircle className="h-3.5 w-3.5" /> Add offence
          </Button>
        }
      />
      <div className="relative mb-3">
        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search catalogue…" className="h-10 rounded-xl border-slate-200 bg-slate-50/70 pl-9 text-sm" />
        <ScrollText className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
      </div>

      {offences === null ? (
        <CardsSkeleton n={5} />
      ) : (
        <div className="max-h-[62vh] space-y-2 overflow-y-auto pe-1 nice-scroll">
          {filtered.map((o) => (
            <div key={o.id} className="flex items-start gap-3 rounded-2xl border border-slate-200/80 p-3.5">
              <span className={`mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${o.active ? "bg-gradient-to-br from-violet-100 to-purple-50 text-violet-600" : "bg-slate-100 text-slate-400"}`}>
                <Gavel className="h-4.5 w-4.5" />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                  <span className="text-sm font-bold text-slate-800">{o.name}</span>
                  <Badge variant="outline" className="border-slate-200 text-[10px] font-bold text-slate-500">{o.code}</Badge>
                  <Badge variant="outline" className="border-violet-200 bg-violet-50 text-[10px] font-bold text-violet-600">{o.ruleRef}</Badge>
                  {!o.active && <Badge variant="outline" className="border-rose-200 bg-rose-50 text-[10px] font-bold text-rose-500">Inactive</Badge>}
                </div>
                <p className="mt-0.5 line-clamp-1 text-[11px] text-slate-400">{o.description}</p>
                <div className="mt-1 flex items-center gap-3 text-xs">
                  <span className="font-extrabold text-slate-700">{inr(o.amount)}</span>
                  <span className="text-slate-400">{o.category}</span>
                </div>
              </div>
              <div className="flex shrink-0 flex-col items-end gap-2">
                <Switch checked={o.active} onCheckedChange={() => toggleActive(o)} aria-label="Toggle active" />
                <Button variant="ghost" size="sm" onClick={() => openEdit(o)} className="h-7 gap-1 rounded-lg px-2 text-[11px] font-bold text-sky-600 hover:bg-sky-50">
                  <Pencil className="h-3 w-3" /> Edit
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-h-[85vh] overflow-y-auto rounded-3xl sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit offence" : "Add offence"}</DialogTitle>
            <DialogDescription>
              Amounts here auto-populate on every new fine. Existing fines keep their original snapshot.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs font-bold text-slate-600">Code *</Label>
                <Input value={form.code} disabled={!!editing} onChange={(e) => setForm({ ...form, code: e.target.value })} placeholder="OFF-016" className="mt-1 h-10 rounded-xl bg-slate-50/70 text-sm" />
              </div>
              <div>
                <Label className="text-xs font-bold text-slate-600">Amount (₹) *</Label>
                <Input type="number" min={1} value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} placeholder="500" className="mt-1 h-10 rounded-xl bg-slate-50/70 text-sm" />
              </div>
            </div>
            <div>
              <Label className="text-xs font-bold text-slate-600">Offence name *</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Elevator Misuse" className="mt-1 h-10 rounded-xl bg-slate-50/70 text-sm" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs font-bold text-slate-600">Rule reference *</Label>
                <Input value={form.ruleRef} onChange={(e) => setForm({ ...form, ruleRef: e.target.value })} placeholder="Rule C-12" className="mt-1 h-10 rounded-xl bg-slate-50/70 text-sm" />
              </div>
              <div>
                <Label className="text-xs font-bold text-slate-600">Category</Label>
                <select
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  className="mt-1 h-10 w-full rounded-xl border border-slate-200 bg-slate-50/70 px-3 text-sm text-slate-700"
                >
                  {["Campus Discipline", "Dress & Conduct", "Academics", "Library", "Hostel", "Examinations", "Major Discipline"].map((c) => (
                    <option key={c}>{c}</option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <Label className="text-xs font-bold text-slate-600">Description</Label>
              <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="What constitutes this offence…" className="mt-1 min-h-[70px] rounded-xl bg-slate-50/70 text-sm" />
            </div>
            {editing && (
              <label className="flex items-center justify-between rounded-xl bg-slate-50 px-3.5 py-3 ring-1 ring-slate-100">
                <span className="text-xs font-bold text-slate-600">Active (selectable for new fines)</span>
                <Switch checked={form.active} onCheckedChange={(v) => setForm({ ...form, active: v })} />
              </label>
            )}
            {error && <p className="rounded-xl bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-600 ring-1 ring-rose-100">{error}</p>}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} className="rounded-xl">Cancel</Button>
            <Button onClick={save} disabled={saving} className="rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 font-bold">
              {saving && <Loader2 className="mr-1 h-4 w-4 animate-spin" />} {editing ? "Save changes" : "Add offence"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </SectionCard>
  );
}

/* ---------------- All fines + admin correction (FR-11) ---------------- */
function AdminFines({ session }: { session: SessionUser }) {
  const [fines, setFines] = useState<FineT[] | null>(null);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("ALL");
  const [selected, setSelected] = useState<FineT | null>(null);
  const [correctOpen, setCorrectOpen] = useState(false);
  const [target, setTarget] = useState<FineT | null>(null);
  const [form, setForm] = useState({ status: "PENDING", amount: "", reason: "", note: "" });
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const load = () => {
    api<{ fines: FineT[] }>(session, "/api/fines").then((d) => setFines(d.fines)).catch(() => setFines([]));
  };
  useEffect(load, [session]);

  const filtered = useMemo(() => {
    let list = fines ?? [];
    if (status !== "ALL") list = list.filter((f) => f.status === status);
    if (q.trim()) {
      const s = q.trim().toLowerCase();
      list = list.filter(
        (f) =>
          f.student.name.toLowerCase().includes(s) ||
          f.student.rollNumber.toLowerCase().includes(s) ||
          f.offence.name.toLowerCase().includes(s) ||
          f.issuedBy.name.toLowerCase().includes(s)
      );
    }
    return list;
  }, [fines, q, status]);

  const openCorrect = (f: FineT) => {
    setTarget(f);
    setForm({ status: f.status, amount: String(f.amountSnapshot), reason: f.reason ?? "", note: "" });
    setError("");
    setCorrectOpen(true);
  };

  const markPaid = async (f: FineT) => {
    await api(session, `/api/fines/${f.id}`, { method: "PATCH", body: JSON.stringify({ status: "PAID", note: "Marked paid via UniFine admin." }) });
    load();
  };

  const saveCorrection = async () => {
    if (!target) return;
    setError("");
    if (!form.note.trim()) {
      setError("A correction note is mandatory for the audit trail.");
      return;
    }
    setSaving(true);
    try {
      await api(session, `/api/fines/${target.id}`, {
        method: "PATCH",
        body: JSON.stringify({
          status: form.status,
          amount: Number(form.amount),
          reason: form.reason,
          note: form.note.trim(),
        }),
      });
      setCorrectOpen(false);
      setSelected(null);
      load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Correction failed.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <SectionCard>
      <SectionHeader title="All Fines & Corrections" icon={<ClipboardEdit className="h-4 w-4 text-sky-500" />} />
      <div className="mb-3 flex flex-col gap-2 sm:flex-row">
        <div className="relative flex-1">
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search student, roll, offence, staff…" className="h-10 rounded-xl border-slate-200 bg-slate-50/70 pl-9 text-sm" />
          <History className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        </div>
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
      </div>

      {fines === null ? (
        <CardsSkeleton n={5} />
      ) : filtered.length === 0 ? (
        <EmptyState title="No fines found" hint="Adjust your filters or search term." />
      ) : (
        <div className="max-h-[62vh] space-y-2.5 overflow-y-auto pe-1 nice-scroll">
          {filtered.map((f) => (
            <FineCard
              key={f.id}
              fine={f}
              showStudent
              onClick={() => setSelected(f)}
              actions={
                <>
                  {f.status !== "PAID" && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={(e) => {
                        e.stopPropagation();
                        markPaid(f);
                      }}
                      className="h-7 rounded-lg border-emerald-200 px-2 text-[11px] font-bold text-emerald-600 hover:bg-emerald-50"
                    >
                      <CheckCircle2 className="mr-1 h-3 w-3" /> Paid
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={(e) => {
                      e.stopPropagation();
                      openCorrect(f);
                    }}
                    className="h-7 rounded-lg px-2 text-[11px] font-bold text-violet-600 hover:bg-violet-50"
                  >
                    <Pencil className="mr-1 h-3 w-3" /> Correct
                  </Button>
                </>
              }
            />
          ))}
        </div>
      )}

      <FineDetailDialog
        session={session}
        fine={selected}
        open={!!selected}
        onClose={() => setSelected(null)}
        footer={
          selected && (
            <div className="flex gap-2">
              {selected.status !== "PAID" && (
                <Button variant="outline" className="flex-1 rounded-xl font-bold text-emerald-600" onClick={() => markPaid(selected)}>
                  <CheckCircle2 className="mr-1 h-4 w-4" /> Mark paid
                </Button>
              )}
              <Button
                className="flex-1 rounded-xl bg-gradient-to-r from-violet-500 to-purple-600 font-bold"
                onClick={() => {
                  setSelected(null);
                  openCorrect(selected);
                }}
              >
                <Pencil className="mr-1 h-4 w-4" /> Correct record
              </Button>
            </div>
          )
        }
      />

      {/* Correction dialog */}
      <Dialog open={correctOpen} onOpenChange={setCorrectOpen}>
        <DialogContent className="max-h-[85vh] overflow-y-auto rounded-3xl sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-violet-500" /> Correct fine record
            </DialogTitle>
            <DialogDescription>
              {target ? `${target.offence.name} — ${target.student.name} (${target.student.rollNumber})` : ""}. All
              changes are audit-logged with your name.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs font-bold text-slate-600">Status</Label>
                <select
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value })}
                  className="mt-1 h-10 w-full rounded-xl border border-slate-200 bg-slate-50/70 px-3 text-sm"
                >
                  <option value="PENDING">Pending</option>
                  <option value="PAID">Paid</option>
                  <option value="OVERDUE">Overdue</option>
                </select>
              </div>
              <div>
                <Label className="text-xs font-bold text-slate-600">Amount (₹)</Label>
                <Input type="number" min={1} value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} className="mt-1 h-10 rounded-xl bg-slate-50/70 text-sm" />
              </div>
            </div>
            <div>
              <Label className="text-xs font-bold text-slate-600">Reason</Label>
              <Textarea value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} className="mt-1 min-h-[64px] rounded-xl bg-slate-50/70 text-sm" />
            </div>
            <div>
              <Label className="text-xs font-bold text-slate-600">Correction note (mandatory)</Label>
              <Textarea value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} placeholder="Why is this correction needed?" className="mt-1 min-h-[64px] rounded-xl bg-slate-50/70 text-sm" />
            </div>
            {error && <p className="rounded-xl bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-600 ring-1 ring-rose-100">{error}</p>}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCorrectOpen(false)} className="rounded-xl">Cancel</Button>
            <Button onClick={saveCorrection} disabled={saving} className="rounded-xl bg-gradient-to-r from-violet-500 to-purple-600 font-bold">
              {saving && <Loader2 className="mr-1 h-4 w-4 animate-spin" />} Save correction
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </SectionCard>
  );
}

/* ---------------- Reports (FR-15) ---------------- */
function ReportsView({ session }: { session: SessionUser }) {
  const [summary, setSummary] = useState<SummaryT | null>(null);
  const [fines, setFines] = useState<FineT[] | null>(null);

  useEffect(() => {
    api<SummaryT>(session, "/api/reports/summary").then(setSummary).catch(() => setSummary(undefined as never));
    api<{ fines: FineT[] }>(session, "/api/fines").then((d) => setFines(d.fines)).catch(() => setFines([]));
  }, [session]);

  const exportCsv = () => {
    if (!fines) return;
    downloadCsv(
      `unifine-report-${new Date().toISOString().slice(0, 10)}.csv`,
      toCsv(
        fines.map((f) => ({
          Roll: f.student.rollNumber,
          Student: f.student.name,
          Programme: f.student.programme,
          Offence: f.offence.name,
          Category: f.offence.category,
          Rule: f.offence.ruleRef,
          Amount: f.amountSnapshot,
          Status: f.status,
          IssuedBy: f.issuedBy.name,
          IssuedOn: fmtDate(f.issueDate),
          DueOn: fmtDate(f.dueDate),
          PaidOn: f.paymentDate ? fmtDate(f.paymentDate) : "",
        }))
      )
    );
  };

  return (
    <>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {summary === null ? (
          <StatSkeleton />
        ) : summary ? (
          <>
            <StatCard label="Total Fines" value={summary.total} tone="blue" icon={<FileWarning className="h-4 w-4" />} />
            <StatCard label="Collected" value={inr(summary.collected)} tone="emerald" icon={<CheckCircle2 className="h-4 w-4" />} />
            <StatCard label="Outstanding" value={inr(summary.outstanding)} tone="rose" icon={<AlertTriangle className="h-4 w-4" />} />
            <StatCard label="Collection Rate" value={`${summary.collectionRate}%`} tone="violet" icon={<Percent className="h-4 w-4" />} />
          </>
        ) : null}
      </div>

      <SectionCard>
        <SectionHeader
          title="Detailed Report"
          icon={<BarChart3 className="h-4 w-4 text-sky-500" />}
          action={
            <Button onClick={exportCsv} size="sm" className="h-9 gap-1.5 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 text-xs font-bold">
              <FileDown className="h-3.5 w-3.5" /> Export CSV
            </Button>
          }
        />
        <div className="grid gap-4 lg:grid-cols-2">
          <div>
            <h4 className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-400">Fines by category</h4>
            {summary === null ? (
              <Skeleton className="h-64 w-full rounded-2xl" />
            ) : summary.byCategory.length === 0 ? (
              <EmptyState title="No data yet" />
            ) : (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={summary.byCategory} layout="vertical" margin={{ top: 0, right: 12, left: 8, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={false} />
                    <XAxis type="number" tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                    <YAxis type="category" dataKey="category" width={104} tick={{ fontSize: 10, fill: "#64748b" }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={{ borderRadius: 16, border: "1px solid #e2e8f0", fontSize: 12 }} formatter={(v: number) => [`${v} fines`, "Count"]} />
                    <Bar dataKey="count" radius={[0, 8, 8, 0]} barSize={16}>
                      {summary.byCategory.map((_, i) => (
                        <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
          <div>
            <h4 className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-400">Top offences</h4>
            {summary === null ? (
              <CardsSkeleton n={4} />
            ) : (
              <div className="space-y-2">
                {summary.topOffences.map((o, i) => (
                  <div key={o.name} className="flex items-center gap-3 rounded-2xl border border-slate-200/80 px-3.5 py-2.5">
                    <span className="flex h-7 w-7 items-center justify-center rounded-lg text-xs font-extrabold text-white" style={{ background: CHART_COLORS[i % CHART_COLORS.length] }}>
                      {i + 1}
                    </span>
                    <span className="min-w-0 flex-1 truncate text-xs font-bold text-slate-700">{o.name}</span>
                    <span className="text-[11px] text-slate-400">{o.count}×</span>
                    <span className="text-xs font-extrabold text-slate-700">{inr(o.amount)}</span>
                  </div>
                ))}
              </div>
            )}
            <h4 className="mb-2 mt-5 text-xs font-bold uppercase tracking-wide text-slate-400">Monthly trend</h4>
            {summary && (
              <div className="h-40">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={summary.byMonth} margin={{ top: 4, right: 8, left: -22, bottom: 0 }}>
                    <defs>
                      <linearGradient id="gRep" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.45} />
                        <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0.05} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                    <XAxis dataKey="label" tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={{ borderRadius: 16, border: "1px solid #e2e8f0", fontSize: 12 }} formatter={(v: number) => [`${v} fines`, "Issued"]} />
                    <Area type="monotone" dataKey="issued" stroke="#8b5cf6" strokeWidth={2.5} fill="url(#gRep)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </div>
      </SectionCard>
    </>
  );
}

/* ---------------- Rule book management (FR-13) ---------------- */
function RuleBookAdmin({ session }: { session: SessionUser }) {
  const [entries, setEntries] = useState<RuleEntryT[] | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<RuleEntryT | null>(null);
  const [form, setForm] = useState({ category: "", title: "", content: "", ruleRef: "" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const load = () => {
    api<{ entries: RuleEntryT[] }>(session, "/api/rule-book").then((d) => setEntries(d.entries)).catch(() => setEntries([]));
  };
  useEffect(load, [session]);

  const save = async () => {
    setError("");
    if (!form.category.trim() || !form.title.trim() || !form.content.trim()) {
      setError("Category, title and content are required.");
      return;
    }
    setSaving(true);
    try {
      if (editing) {
        await api(session, `/api/rule-book/${editing.id}`, { method: "PATCH", body: JSON.stringify(form) });
      } else {
        await api(session, "/api/rule-book", { method: "POST", body: JSON.stringify(form) });
      }
      setDialogOpen(false);
      load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed.");
    } finally {
      setSaving(false);
    }
  };

  const toggle = async (r: RuleEntryT) => {
    await api(session, `/api/rule-book/${r.id}`, { method: "PATCH", body: JSON.stringify({ active: !r.active }) });
    load();
  };

  const grouped = useMemo(() => {
    const map: Record<string, RuleEntryT[]> = {};
    for (const e of entries ?? []) {
      map[e.category] = map[e.category] || [];
      map[e.category].push(e);
    }
    return Object.entries(map);
  }, [entries]);

  return (
    <SectionCard>
      <SectionHeader
        title="Rule Book Management"
        icon={<BookOpenCheck className="h-4 w-4 text-sky-500" />}
        action={
          <Button
            size="sm"
            onClick={() => {
              setEditing(null);
              setForm({ category: "", title: "", content: "", ruleRef: "" });
              setError("");
              setDialogOpen(true);
            }}
            className="h-9 gap-1.5 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 text-xs font-bold"
          >
            <PlusCircle className="h-3.5 w-3.5" /> Add rule
          </Button>
        }
      />
      {entries === null ? (
        <CardsSkeleton n={4} />
      ) : (
        <div className="max-h-[62vh] space-y-4 overflow-y-auto pe-1 nice-scroll">
          {grouped.map(([cat, rules]) => (
            <div key={cat}>
              <h4 className="mb-2 flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-slate-400">
                <BookOpenCheck className="h-3.5 w-3.5 text-sky-400" /> {cat}
              </h4>
              <div className="space-y-2">
                {rules.map((r) => (
                  <div key={r.id} className="rounded-2xl border border-slate-200/80 p-3.5">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className={`text-sm font-bold ${r.active ? "text-slate-800" : "text-slate-400 line-through"}`}>{r.title}</span>
                          {r.ruleRef && <Badge variant="outline" className="border-violet-200 bg-violet-50 text-[10px] font-bold text-violet-600">{r.ruleRef}</Badge>}
                          {!r.active && <Badge variant="outline" className="border-rose-200 bg-rose-50 text-[10px] font-bold text-rose-500">Hidden</Badge>}
                          <Badge variant="outline" className="border-slate-200 text-[10px] text-slate-400">v{r.version}</Badge>
                        </div>
                        <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-slate-500">{r.content}</p>
                      </div>
                      <div className="flex shrink-0 flex-col items-end gap-1.5">
                        <Switch checked={r.active} onCheckedChange={() => toggle(r)} aria-label="Toggle visible" />
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 gap-1 rounded-lg px-2 text-[11px] font-bold text-sky-600 hover:bg-sky-50"
                          onClick={() => {
                            setEditing(r);
                            setForm({ category: r.category, title: r.title, content: r.content, ruleRef: r.ruleRef ?? "" });
                            setError("");
                            setDialogOpen(true);
                          }}
                        >
                          <Pencil className="h-3 w-3" /> Edit
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="rounded-3xl sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit rule" : "Add rule"}</DialogTitle>
            <DialogDescription>Students and staff see active rules instantly in their rule book.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs font-bold text-slate-600">Category *</Label>
                <Input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} placeholder="Code of Conduct" className="mt-1 h-10 rounded-xl bg-slate-50/70 text-sm" />
              </div>
              <div>
                <Label className="text-xs font-bold text-slate-600">Rule ref</Label>
                <Input value={form.ruleRef} onChange={(e) => setForm({ ...form, ruleRef: e.target.value })} placeholder="Rule D-08" className="mt-1 h-10 rounded-xl bg-slate-50/70 text-sm" />
              </div>
            </div>
            <div>
              <Label className="text-xs font-bold text-slate-600">Title *</Label>
              <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Rule title" className="mt-1 h-10 rounded-xl bg-slate-50/70 text-sm" />
            </div>
            <div>
              <Label className="text-xs font-bold text-slate-600">Content *</Label>
              <Textarea value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} className="mt-1 min-h-[90px] rounded-xl bg-slate-50/70 text-sm" />
            </div>
            {error && <p className="rounded-xl bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-600 ring-1 ring-rose-100">{error}</p>}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} className="rounded-xl">Cancel</Button>
            <Button onClick={save} disabled={saving} className="rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 font-bold">
              {saving && <Loader2 className="mr-1 h-4 w-4 animate-spin" />} {editing ? "Save changes" : "Add rule"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </SectionCard>
  );
}

/* ---------------- Broadcast notifications ---------------- */
function BroadcastView({ session }: { session: SessionUser }) {
  const [items, setItems] = useState<NotificationT[] | null>(null);
  const [form, setForm] = useState({ audience: "ALL", type: "GENERAL", title: "", message: "" });
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  const load = () => {
    api<{ notifications: NotificationT[] }>(session, "/api/notifications").then((d) => setItems(d.notifications)).catch(() => setItems([]));
  };
  useEffect(load, [session]);

  const send = async () => {
    setError("");
    if (!form.title.trim() || !form.message.trim()) {
      setError("Title and message are required.");
      return;
    }
    setSending(true);
    try {
      await api(session, "/api/notifications", { method: "POST", body: JSON.stringify(form) });
      setForm({ audience: form.audience, type: form.type, title: "", message: "" });
      load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Send failed.");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="grid gap-4 lg:grid-cols-5">
      <SectionCard className="lg:col-span-2">
        <SectionHeader title="Send Broadcast" icon={<Send className="h-4 w-4 text-sky-500" />} />
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs font-bold text-slate-600">Audience</Label>
              <select
                value={form.audience}
                onChange={(e) => setForm({ ...form, audience: e.target.value })}
                className="mt-1 h-10 w-full rounded-xl border border-slate-200 bg-slate-50/70 px-3 text-sm"
              >
                <option value="ALL">Everyone</option>
                <option value="STUDENT">Students</option>
                <option value="FACULTY">Faculty</option>
                <option value="ADMIN">Admins</option>
              </select>
            </div>
            <div>
              <Label className="text-xs font-bold text-slate-600">Type</Label>
              <select
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value })}
                className="mt-1 h-10 w-full rounded-xl border border-slate-200 bg-slate-50/70 px-3 text-sm"
              >
                <option value="GENERAL">General</option>
                <option value="STATUS">Status update</option>
                <option value="PAYMENT">Payment</option>
                <option value="FINE_ISSUED">Fine related</option>
              </select>
            </div>
          </div>
          <div>
            <Label className="text-xs font-bold text-slate-600">Title</Label>
            <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g. Mid-term fine clearance drive" className="mt-1 h-10 rounded-xl bg-slate-50/70 text-sm" />
          </div>
          <div>
            <Label className="text-xs font-bold text-slate-600">Message</Label>
            <Textarea value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} placeholder="Write the announcement…" className="mt-1 min-h-[90px] rounded-xl bg-slate-50/70 text-sm" />
          </div>
          {error && <p className="rounded-xl bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-600 ring-1 ring-rose-100">{error}</p>}
          <Button onClick={send} disabled={sending} className="w-full rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 font-bold">
            {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Send className="mr-1.5 h-4 w-4" /> Send notification</>}
          </Button>
        </div>
      </SectionCard>

      <SectionCard className="lg:col-span-3">
        <SectionHeader title="Recent Notifications" icon={<BellRing className="h-4 w-4 text-sky-500" />} />
        {items === null ? (
          <CardsSkeleton n={4} />
        ) : items.length === 0 ? (
          <EmptyState title="No notifications sent yet" icon={<BellRing className="h-6 w-6" />} />
        ) : (
          <ul className="max-h-[55vh] space-y-2.5 overflow-y-auto pe-1 nice-scroll">
            {items.map((n) => (
              <li key={n.id} className="rounded-2xl border border-slate-100 p-3.5">
                <div className="flex items-center gap-2">
                  <span className="truncate text-sm font-bold text-slate-700">{n.title}</span>
                  <Badge variant="outline" className="ml-auto shrink-0 border-sky-200 bg-sky-50 text-[10px] font-bold text-sky-600">
                    {n.audience}
                  </Badge>
                </div>
                <p className="mt-1 text-xs leading-relaxed text-slate-500">{n.message}</p>
                <p className="mt-1 text-[10px] text-slate-400">{fmtDateTime(n.createdAt)}</p>
              </li>
            ))}
          </ul>
        )}
      </SectionCard>
    </div>
  );
}

/* ---------------- Audit trail ---------------- */
function AuditView({ session }: { session: SessionUser }) {
  const [audits, setAudits] = useState<AuditT[] | null>(null);
  const [action, setAction] = useState("ALL");

  useEffect(() => {
    api<{ audits: AuditT[] }>(session, "/api/audit?take=200").then((d) => setAudits(d.audits)).catch(() => setAudits([]));
  }, [session]);

  const filtered = useMemo(
    () => (audits ?? []).filter((a) => action === "ALL" || a.action === action),
    [audits, action]
  );

  return (
    <SectionCard>
      <SectionHeader title="Audit Trail" icon={<ShieldCheck className="h-4 w-4 text-sky-500" />} />
      <div className="mb-3">
        <select
          value={action}
          onChange={(e) => setAction(e.target.value)}
          className="h-10 rounded-xl border border-slate-200 bg-slate-50/70 px-3 text-xs font-bold text-slate-600"
          aria-label="Filter by action"
        >
          <option value="ALL">All actions</option>
          <option value="CREATED">Created</option>
          <option value="CORRECTED">Corrected</option>
          <option value="MARKED_PAID">Marked paid</option>
          <option value="STATUS_UPDATED">Status updated</option>
        </select>
      </div>
      {audits === null ? (
        <CardsSkeleton n={6} />
      ) : filtered.length === 0 ? (
        <EmptyState title="No audit entries" hint="Critical actions will be recorded here." />
      ) : (
        <div className="max-h-[62vh] space-y-2 overflow-y-auto pe-1 nice-scroll">
          {filtered.map((a) => (
            <div key={a.id} className="rounded-2xl border border-slate-200/80 p-3.5">
              <div className="flex flex-wrap items-center gap-2">
                <Badge
                  variant="outline"
                  className={`text-[10px] font-extrabold ${
                    a.action === "CREATED"
                      ? "border-sky-200 bg-sky-50 text-sky-600"
                      : a.action === "CORRECTED"
                        ? "border-violet-200 bg-violet-50 text-violet-600"
                        : a.action === "MARKED_PAID"
                          ? "border-emerald-200 bg-emerald-50 text-emerald-600"
                          : "border-amber-200 bg-amber-50 text-amber-600"
                  }`}
                >
                  {a.action.replaceAll("_", " ")}
                </Badge>
                {a.fine && (
                  <span className="text-xs font-bold text-slate-700">
                    {a.fine.offence.name} <span className="font-normal text-slate-400">· {a.fine.student.name} ({a.fine.student.rollNumber})</span>
                  </span>
                )}
                <span className="ml-auto text-[10px] text-slate-400">{fmtDateTime(a.createdAt)}</span>
              </div>
              <p className="mt-1.5 text-xs text-slate-500">
                <Users className="mr-1 inline h-3 w-3 text-slate-400" />
                {a.actorName}
                {a.note ? ` — ${a.note}` : ""}
              </p>
            </div>
          ))}
        </div>
      )}
    </SectionCard>
  );
}
