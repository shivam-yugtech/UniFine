"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { KrmuLogo } from "./shared";
import { motion, Reveal, Stagger, StaggerItem, EASE } from "./motion";
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
    tile: "bg-[#e6e4fd]",
  },
  {
    role: "FACULTY",
    icon: <GraduationCap className="h-6 w-6" />,
    title: "Faculty",
    desc: "Verify students & assign fines per approved offences",
    tone: "from-brand-400 to-brand-600",
    tile: "bg-[#dcefff]",
  },
  {
    role: "STUDENT",
    icon: <UserRound className="h-6 w-6" />,
    title: "Student",
    desc: "Read-only view of fines, status, history & rule book",
    tone: "from-emerald-500 to-teal-600",
    tile: "bg-[#d9f2ea]",
  },
];

export function Landing({ onEnter }: { onEnter: (role?: string) => void }) {
  return (
    <div className="min-h-screen bg-[#eef2f7]">
      {/* Hero header — matches dashboard gradient theme */}
      <header className="relative overflow-hidden rounded-b-[36px] bg-brand-500 px-6 pb-20 pt-[max(2rem,env(safe-area-inset-top))] text-white shadow-xl shadow-brand-500/20">
        <div className="float-slow absolute -right-20 -top-24 h-72 w-72 rounded-full bg-white/10" />
        <div className="float-slower absolute -bottom-24 -left-16 h-64 w-64 rounded-full bg-white/10" />
        <div className="float-slow absolute right-1/4 top-1/2 h-24 w-24 rounded-full bg-white/[0.06]" />
        <div className="relative mx-auto max-w-5xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <KrmuLogo size={46} />
              <div className="leading-tight">
                <div className="text-lg font-bold">UniFine</div>
                <div className="text-[11px] font-medium text-brand-100">KR Mangalam University</div>
              </div>
            </div>
            <Button
              onClick={() => onEnter()}
              className="rounded-full bg-white font-bold text-brand-600 shadow-md hover:bg-brand-50"
            >
              Sign in <ArrowRight className="h-4 w-4" />
            </Button>
          </div>

          <motion.div
            className="mt-14 max-w-2xl"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: EASE, delay: 0.1 }}
          >
            <Badge className="mb-4 rounded-full bg-white/15 px-3 py-1 text-[11px] font-bold text-white backdrop-blur hover:bg-white/15">
              <BookOpenCheck className="mr-1.5 h-3.5 w-3.5" /> University Fine Management System
            </Badge>
            <h1 className="text-3xl font-semibold leading-tight tracking-tight sm:text-5xl">
              Transparent, accurate &
              <br />
              audit-ready <span className="text-brand-100">fine management</span>
            </h1>
            <p className="mt-4 max-w-xl text-sm leading-relaxed text-brand-50/90 sm:text-base">
              UniFine centralises how KR Mangalam University issues, tracks and resolves student
              fines — with verified identity checks, approved offence amounts and a complete audit
              trail, all per university norms.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Button
                onClick={() => onEnter()}
                size="lg"
                className="group rounded-full bg-white font-bold text-brand-600 shadow-lg transition hover:-translate-y-0.5 hover:bg-brand-50 hover:shadow-xl"
              >
                Enter Portal <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Button>
            </div>
          </motion.div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 pb-16">
        {/* Role cards */}
        <Stagger className="relative z-10 -mt-10 grid gap-4 sm:grid-cols-3" aria-label="Portals">
          {ROLES.map((r) => (
            <StaggerItem key={r.role}>
            <motion.button
              onClick={() => onEnter(r.role)}
              whileHover={{ y: -6 }}
              whileTap={{ scale: 0.97 }}
              transition={{ type: "spring", stiffness: 400, damping: 24 }}
              className={`group relative h-full w-full overflow-hidden rounded-[26px] p-5 text-left shadow-lg shadow-slate-200/60 ring-1 ring-black/[0.03] transition-shadow hover:shadow-xl ${r.tile}`}
            >
              <span className="absolute -bottom-14 -right-12 h-36 w-36 rounded-full bg-white/50 transition-transform duration-500 group-hover:scale-125" />
              <span
                className={`relative flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br text-white shadow-md transition-transform duration-300 group-hover:-rotate-6 group-hover:scale-110 ${r.tone}`}
              >
                {r.icon}
              </span>
              <h3 className="relative mt-3.5 text-lg font-semibold text-slate-900">{r.title}</h3>
              <p className="relative mt-1 text-xs leading-relaxed text-slate-600">{r.desc}</p>
              <span className="relative mt-3 inline-flex items-center gap-1 text-xs font-bold text-brand-700 transition-transform group-hover:translate-x-1">
                Open portal <ArrowRight className="h-3.5 w-3.5" />
              </span>
            </motion.button>
            </StaggerItem>
          ))}
        </Stagger>

        {/* Features */}
        <section className="mt-14" aria-label="Features">
          <Reveal>
          <h2 className="text-center text-2xl font-bold tracking-tight text-slate-800">
            Built on university norms, end to end
          </h2>
          <p className="mx-auto mt-2 max-w-lg text-center text-sm text-slate-500">
            Every step — from offence selection to correction — follows the approved KRMU fine
            policy with full traceability.
          </p>
          </Reveal>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((f, i) => (
              <Reveal key={f.title} delay={(i % 3) * 0.08}>
              <div className="group h-full rounded-[26px] bg-white p-5 shadow-sm ring-1 ring-slate-100 transition duration-300 hover:-translate-y-1 hover:shadow-lg">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-500 ring-1 ring-brand-100 transition-transform duration-300 group-hover:scale-110">
                  {f.icon}
                </span>
                <h3 className="mt-3 text-sm font-bold text-slate-800">{f.title}</h3>
                <p className="mt-1 text-xs leading-relaxed text-slate-500">{f.desc}</p>
              </div>
              </Reveal>
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
