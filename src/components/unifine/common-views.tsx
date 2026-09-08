"use client";

import { useEffect, useMemo, useState } from "react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  SectionCard,
  SectionHeader,
  EmptyState,
  CardsSkeleton,
} from "./shared";
import { api, fmtDateTime } from "./utils";
import type { NotificationT, RuleEntryT, SessionUser } from "./types";
import { Bell, BellRing, CheckCheck, Search, ScrollText, Info, AlertTriangle, IndianRupee, RefreshCcw } from "lucide-react";

/* =============== Notifications (FR-16) =============== */
export function NotificationsView({ session }: { session: SessionUser }) {
  const [items, setItems] = useState<NotificationT[] | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  const load = () => {
    api<{ notifications: NotificationT[] }>(session, "/api/notifications")
      .then((d) => setItems(d.notifications))
      .catch(() => setItems([]));
  };
  useEffect(load, [session]);

  const markRead = async (n: NotificationT) => {
    if (n.read) return;
    setBusy(n.id);
    try {
      await api(session, `/api/notifications/${n.id}`, { method: "PATCH", body: JSON.stringify({ read: true }) });
      setItems((prev) => prev?.map((x) => (x.id === n.id ? { ...x, read: true } : x)) ?? null);
    } finally {
      setBusy(null);
    }
  };

  const markAll = async () => {
    const unread = items?.filter((n) => !n.read) ?? [];
    for (const n of unread) {
      await api(session, `/api/notifications/${n.id}`, { method: "PATCH", body: JSON.stringify({ read: true }) });
    }
    load();
  };

  const iconFor = (t: string) =>
    t === "FINE_ISSUED" ? (
      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-rose-100 text-rose-500"><AlertTriangle className="h-4 w-4" /></span>
    ) : t === "PAYMENT" ? (
      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600"><IndianRupee className="h-4 w-4" /></span>
    ) : t === "STATUS" ? (
      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-100 text-amber-600"><RefreshCcw className="h-4 w-4" /></span>
    ) : (
      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-sky-100 text-sky-600"><Info className="h-4 w-4" /></span>
    );

  const unread = items?.filter((n) => !n.read).length ?? 0;

  return (
    <div className="space-y-4">
      <SectionCard>
        <SectionHeader
          title="Notifications"
          icon={<BellRing className="h-4 w-4 text-sky-500" />}
          action={
            unread > 0 ? (
              <Button variant="ghost" size="sm" onClick={markAll} className="h-8 gap-1 rounded-lg text-xs font-bold text-sky-600 hover:bg-sky-50">
                <CheckCheck className="h-3.5 w-3.5" /> Mark all read
              </Button>
            ) : undefined
          }
        />
        {items === null ? (
          <CardsSkeleton n={4} />
        ) : items.length === 0 ? (
          <EmptyState title="No notifications yet" hint="Fine and payment updates will appear here." icon={<Bell className="h-6 w-6" />} />
        ) : (
          <ul className="space-y-2.5">
            {items.map((n) => (
              <li key={n.id}>
                <button
                  onClick={() => markRead(n)}
                  className={`flex w-full items-start gap-3 rounded-2xl border p-3.5 text-left transition hover:border-sky-200 ${
                    n.read ? "border-slate-100 bg-white" : "border-sky-200 bg-sky-50/40"
                  }`}
                >
                  {iconFor(n.type)}
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-2">
                      <span className={`truncate text-sm ${n.read ? "font-semibold text-slate-700" : "font-bold text-slate-900"}`}>
                        {n.title}
                      </span>
                      {!n.read && <span className="h-2 w-2 shrink-0 rounded-full bg-sky-500" />}
                    </span>
                    <span className="mt-0.5 block text-xs leading-relaxed text-slate-500">{n.message}</span>
                    <span className="mt-1 block text-[10px] font-medium text-slate-400">{fmtDateTime(n.createdAt)}</span>
                  </span>
                  {busy === n.id && <RefreshCcw className="h-3.5 w-3.5 animate-spin text-slate-300" />}
                </button>
              </li>
            ))}
          </ul>
        )}
      </SectionCard>
    </div>
  );
}

/* =============== Rule Book (FR-13, read-only for students/staff) =============== */
export function RuleBookView({ session }: { session: SessionUser }) {
  const [entries, setEntries] = useState<RuleEntryT[] | null>(null);
  const [q, setQ] = useState("");

  useEffect(() => {
    api<{ entries: RuleEntryT[] }>(session, "/api/rule-book")
      .then((d) => setEntries(d.entries.filter((e) => e.active)))
      .catch(() => setEntries([]));
  }, [session]);

  const grouped = useMemo(() => {
    const map: Record<string, RuleEntryT[]> = {};
    for (const e of entries ?? []) {
      if (q && !(e.title + e.content + (e.ruleRef ?? "")).toLowerCase().includes(q.toLowerCase())) continue;
      map[e.category] = map[e.category] || [];
      map[e.category].push(e);
    }
    return Object.entries(map);
  }, [entries, q]);

  return (
    <SectionCard>
      <SectionHeader title="University Rule Book" icon={<ScrollText className="h-4 w-4 text-sky-500" />} />
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search rules… e.g. dress code, attendance"
          className="h-11 rounded-2xl border-slate-200 bg-slate-50/70 pl-9 text-sm"
        />
      </div>

      {entries === null ? (
        <CardsSkeleton n={4} />
      ) : grouped.length === 0 ? (
        <EmptyState title="No matching rules" hint="Try a different keyword like 'library' or 'hostel'." icon={<ScrollText className="h-6 w-6" />} />
      ) : (
        <Accordion type="multiple" defaultValue={grouped.map(([c]) => c)} className="space-y-3">
          {grouped.map(([category, rules]) => (
            <AccordionItem
              key={category}
              value={category}
              className="overflow-hidden rounded-2xl border border-slate-200/80 bg-slate-50/40 px-4"
            >
              <AccordionTrigger className="py-3.5 text-sm font-bold text-slate-800 hover:no-underline">
                <span className="flex items-center gap-2">
                  {category}
                  <Badge variant="outline" className="ml-1 border-sky-200 bg-white text-[10px] font-bold text-sky-600">
                    {rules.length} rules
                  </Badge>
                </span>
              </AccordionTrigger>
              <AccordionContent className="space-y-3 pb-4">
                {rules.map((r) => (
                  <div key={r.id} className="rounded-xl bg-white p-3.5 ring-1 ring-slate-100">
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="text-sm font-bold text-slate-700">{r.title}</h4>
                      {r.ruleRef && (
                        <Badge variant="outline" className="shrink-0 border-violet-200 bg-violet-50 text-[10px] font-bold text-violet-600">
                          {r.ruleRef}
                        </Badge>
                      )}
                    </div>
                    <p className="mt-1 text-xs leading-relaxed text-slate-500">{r.content}</p>
                  </div>
                ))}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      )}
    </SectionCard>
  );
}
