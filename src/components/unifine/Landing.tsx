"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { KrmuLogo } from "./shared";
import {
  ShieldCheck,
  BookOpenCheck,
  FileText,
  BellRing,
  ArrowRight,
  GraduationCap,
  UserCog,
  UserRound,
  Search,
  BadgeIndianRupee,
  ScrollText,
} from "lucide-react";

const FEATURES = [
  {
    icon: <Search className="h-5 w-5" />,
    title: "Verified Student Lookup",
    desc: "Faculty search by roll number and verify name, photo, programme & year before any fine is assigned.",
  },
  {
    icon: <BadgeIndianRupee className="h-5 w-5" />,
    title: "Pre-approved Amounts",
    desc: "Fine amounts load automatically from the approved offence catalogue — no manual typing, no errors.",
  },
  {
    icon: <FileText className="h-5 w-5" />,
    title: "One Record per Offence",
    desc: "Multiple offences create separate, independently auditable fine records — never one opaque entry.",
  },
  {
    icon: <ScrollText className="h-5 w-5" />,
    title: "Digital Rule Book",
    desc: "The university rule book is available in-app to every student and staff member, always up to date.",
  },
  {
    icon: <BellRing className="h-5 w-5" />,
    title: "Instant Notifications",
    desc: "Students are notified the moment a fine is issued, paid or overdue — full transparency.",
  },
  {
    icon: <ShieldCheck className="h-5 w-5" />,
    title: "Auditable Corrections",
    desc: "Admin corrections preserve a complete audit trail — who changed what, when and why.",
  },
];

const ROLES = [
  {
    role: "ADMIN",
    icon: <UserCog className="h-6 w-6" />,
    title: "Administrator",
    desc: "Catalogue, corrections, reports, audit & rule book management",
    tone: "from-violet-500 to-purple-600",
  },
  {
    role: "FACULTY",
    icon: <GraduationCap className="h-6 w-6" />,
    title: "Faculty",
    desc: "Verify students & assign fines per approved offences",
    tone: "from-sky-500 to-blue-600",
  },
  {
    role: "STUDENT",
    icon: <UserRound className="h-6 w-6" />,
    title: "Student",
    desc: "Read-only view of fines, status, history & rule book",
    tone: "from-emerald-500 to-teal-600",
  },
];

export function Landing({ onEnter }: { onEnter: (role?: string) => void }) {
  return (
    <div className="min-h-screen bg-[#eef2f7]">
      {/* Hero header — matches dashboard gradient theme */}
      <header className="relative overflow-hidden rounded-b-[36px] bg-gradient-to-br from-sky-400 via-blue-500 to-blue-600 px-6 pb-16 pt-8 text-white shadow-xl shadow-blue-500/20">
        <div className="absolute -right-20 -top-24 h-72 w-72 rounded-full bg-white/10" />
        <div className="absolute -bottom-24 -left-16 h-64 w-64 rounded-full bg-white/10" />
        <div className="relative mx-auto max-w-5xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <KrmuLogo size={46} />
              <div className="leading-tight">
                <div className="text-lg font-extrabold">UniFine</div>
                <div className="text-[11px] font-medium text-sky-100">KR Mangalam University</div>
              </div>
            </div>
            <Button
              onClick={() => onEnter()}
              className="rounded-full bg-white font-bold text-blue-600 shadow-md hover:bg-sky-50"
            >
              Sign in <ArrowRight className="h-4 w-4" />
            </Button>
          </div>

          <div className="mt-14 max-w-2xl">
            <Badge className="mb-4 rounded-full bg-white/15 px-3 py-1 text-[11px] font-bold text-white backdrop-blur hover:bg-white/15">
              <BookOpenCheck className="mr-1.5 h-3.5 w-3.5" /> University Fine Management System
            </Badge>
            <h1 className="text-3xl font-extrabold leading-tight tracking-tight sm:text-5xl">
              Transparent, accurate &
              <br />
              audit-ready <span className="text-sky-100">fine management</span>
            </h1>
            <p className="mt-4 max-w-xl text-sm leading-relaxed text-sky-50/90 sm:text-base">
              UniFine centralises how KR Mangalam University issues, tracks and resolves student
              fines — with verified identity checks, approved offence amounts and a complete audit
              trail, all per university norms.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Button
                onClick={() => onEnter()}
                size="lg"
                className="rounded-full bg-white font-bold text-blue-600 shadow-lg hover:bg-sky-50"
              >
                Enter Portal <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 pb-16">
        {/* Role cards */}
        <section className="-mt-10 grid gap-4 sm:grid-cols-3" aria-label="Portals">
          {ROLES.map((r) => (
            <button
              key={r.role}
              onClick={() => onEnter(r.role)}
              className="group rounded-3xl bg-white p-5 text-left shadow-lg shadow-slate-200/60 ring-1 ring-slate-100 transition-all hover:-translate-y-1 hover:shadow-xl"
            >
              <span
                className={`flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br text-white shadow-md ${r.tone}`}
              >
                {r.icon}
              </span>
              <h3 className="mt-3.5 text-base font-extrabold text-slate-800">{r.title}</h3>
              <p className="mt-1 text-xs leading-relaxed text-slate-500">{r.desc}</p>
              <span className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-sky-600 transition-transform group-hover:translate-x-0.5">
                Open portal <ArrowRight className="h-3.5 w-3.5" />
              </span>
            </button>
          ))}
        </section>

        {/* Features */}
        <section className="mt-14" aria-label="Features">
          <h2 className="text-center text-2xl font-extrabold tracking-tight text-slate-800">
            Built on university norms, end to end
          </h2>
          <p className="mx-auto mt-2 max-w-lg text-center text-sm text-slate-500">
            Every step — from offence selection to correction — follows the approved KRMU fine
            policy with full traceability.
          </p>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((f) => (
              <div
                key={f.title}
                className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-100 transition hover:shadow-md"
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-sky-100 to-blue-50 text-sky-600 ring-1 ring-sky-100">
                  {f.icon}
                </span>
                <h3 className="mt-3 text-sm font-bold text-slate-800">{f.title}</h3>
                <p className="mt-1 text-xs leading-relaxed text-slate-500">{f.desc}</p>
              </div>
            ))}
          </div>
        </section>
      </main>

      <footer className="border-t border-slate-200/70 bg-white/60 py-6 text-center text-xs text-slate-400">
        UniFine v1.0 · KR Mangalam University — Student fine transparency portal
      </footer>
    </div>
  );
}
