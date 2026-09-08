"use client";

import { useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Avatar } from "./Avatar";
import { KrmuLogo } from "./shared";
import { greeting, firstName, roleLabel } from "./utils";
import type { SessionUser } from "./types";
import {
  Bell,
  ChevronRight,
  Headphones,
  Home,
  LogOut,
  Menu,
  PlusCircle,
  ScanLine,
} from "lucide-react";

export interface NavItem {
  key: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

/**
 * App shell — mirrors the reference mobile theme:
 * blue gradient header with rounded bottom, greeting card, search-ish spacing,
 * mobile bottom nav with a floating center action, desktop sidebar.
 */
export function Shell({
  session,
  nav,
  view,
  onView,
  unreadCount = 0,
  onLogout,
  centerActionKey,
  children,
}: {
  session: SessionUser;
  nav: NavItem[];
  view: string;
  onView: (v: string) => void;
  unreadCount?: number;
  onLogout: () => void;
  centerActionKey?: string;
  children: React.ReactNode;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const centerKey = centerActionKey ?? nav[0]?.key;

  return (
    <div className="min-h-screen bg-[#eef2f7]">
      {/* ===== Mobile ===== */}
      <div className="lg:hidden">
        <header className="relative z-10 rounded-b-[28px] bg-gradient-to-br from-sky-400 via-blue-500 to-blue-600 px-4 pb-5 pt-[max(1rem,env(safe-area-inset-top))] shadow-lg shadow-blue-500/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
                <SheetTrigger asChild>
                  <button
                    aria-label="Open menu"
                    className="flex h-10 w-10 items-center justify-center rounded-xl text-white transition hover:bg-white/15"
                  >
                    <Menu className="h-5 w-5" />
                  </button>
                </SheetTrigger>
                <SheetContent side="left" className="w-72 rounded-r-3xl border-0 p-4">
                  <SheetHeader className="p-0 pb-3 text-left">
                    <SheetTitle className="flex items-center gap-2.5">
                      <KrmuLogo size={36} />
                      <div>
                        <div className="text-sm font-extrabold text-slate-800">UniFine</div>
                        <div className="text-[10px] font-medium text-slate-400">KR Mangalam University</div>
                      </div>
                    </SheetTitle>
                  </SheetHeader>
                  <SideNav nav={nav} view={view} onView={(k) => { onView(k); setMenuOpen(false); }} />
                  <div className="mt-4">
                    <UserCard session={session} onLogout={onLogout} />
                  </div>
                </SheetContent>
              </Sheet>
              <div className="flex items-center gap-2.5">
                <KrmuLogo size={40} />
                <div className="leading-tight">
                  <div className="text-sm font-extrabold text-white">UniFine</div>
                  <div className="text-[10px] font-medium text-sky-100">KRMU · Fine Portal</div>
                </div>
              </div>
            </div>
            <button
              aria-label="Support"
              onClick={() => onView("notifications")}
              className="relative flex h-10 w-10 items-center justify-center rounded-xl text-white transition hover:bg-white/15"
            >
              <Headphones className="h-5 w-5" />
            </button>
          </div>
        </header>

        <main className="fade-up -mt-3 relative z-20 px-4 pb-32 pt-4">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h1 className="text-[22px] font-extrabold tracking-tight text-slate-800">
                {greeting()} 👋 {firstName(session.name)}
              </h1>
              <p className="text-xs font-medium text-slate-500">
                {session.designation || roleLabel(session.role) + " Portal"}
                {session.rollNumber ? ` · ${session.rollNumber}` : ""}
              </p>
            </div>
          </div>
          {children}
        </main>

        {/* Bottom nav */}
        <nav
          aria-label="Bottom navigation"
          className="fixed inset-x-0 bottom-0 z-30 rounded-t-3xl border-t border-slate-100 bg-white/95 px-8 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-2 shadow-[0_-8px_30px_rgba(15,23,42,0.08)] backdrop-blur"
        >
          <div className="relative mx-auto grid max-w-md grid-cols-3 items-end">
            <BottomItem
              icon={<Home className="h-5 w-5" />}
              label="Home"
              active={view === nav[0]?.key}
              onClick={() => onView(nav[0]?.key)}
            />
            <div className="relative flex justify-center">
              <span className="absolute -top-11 h-14 w-14 rounded-full bg-gradient-to-br from-sky-400 to-blue-600 shadow-lg shadow-blue-500/40 ring-4 ring-white" />
              <button
                onClick={() => onView(centerKey)}
                aria-label={nav.find((n) => n.key === centerKey)?.label ?? "Action"}
                className="absolute -top-11 flex h-14 w-14 items-center justify-center rounded-full text-white transition hover:scale-105 active:scale-95"
              >
                {session.role === "FACULTY" ? (
                  <PlusCircle className="h-6 w-6" />
                ) : session.role === "STUDENT" ? (
                  <ScanLine className="h-6 w-6" />
                ) : (
                  <PlusCircle className="h-6 w-6" />
                )}
              </button>
              <span className="pt-3 text-[10px] font-semibold text-slate-400">
                {nav.find((n) => n.key === centerKey)?.label ?? ""}
              </span>
            </div>
            <BottomItem
              icon={
                <span className="relative">
                  <Bell className="h-5 w-5" />
                  {unreadCount > 0 && (
                    <span className="absolute -right-1.5 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[9px] font-bold text-white">
                      {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                  )}
                </span>
              }
              label={nav.find((n) => n.key === "notifications")?.label ?? "Alerts"}
              active={view === "notifications"}
              onClick={() => onView("notifications")}
            />
          </div>
        </nav>
      </div>

      {/* ===== Desktop ===== */}
      <div className="hidden lg:flex lg:min-h-screen">
        <aside className="flex w-64 shrink-0 flex-col gap-5 border-r border-slate-200/70 bg-white p-5">
          <div className="flex items-center gap-3 px-1 pt-1">
            <KrmuLogo size={44} />
            <div className="leading-tight">
              <div className="text-base font-extrabold tracking-tight text-slate-800">UniFine</div>
              <div className="text-[11px] font-medium text-slate-400">KR Mangalam University</div>
            </div>
          </div>
          <SideNav nav={nav} view={view} onView={onView} />
          <div className="mt-auto space-y-3">
            <UserCard session={session} onLogout={onLogout} />
          </div>
        </aside>
        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-20 border-b border-slate-200/60 bg-[#eef2f7]/85 px-8 py-4 backdrop-blur">
            <div className="mx-auto flex max-w-6xl items-center justify-between">
              <div>
                <h1 className="text-xl font-extrabold tracking-tight text-slate-800">
                  {greeting()} 👋 {firstName(session.name)}
                </h1>
                <p className="text-xs font-medium text-slate-500">
                  {session.designation || roleLabel(session.role) + " Portal"}
                  {session.rollNumber ? ` · ${session.rollNumber}` : ""}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => onView("notifications")}
                  aria-label="Notifications"
                  className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-white text-slate-500 shadow-sm ring-1 ring-slate-100 transition hover:text-sky-600"
                >
                  <Bell className="h-5 w-5" />
                  {unreadCount > 0 && (
                    <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[9px] font-bold text-white">
                      {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                  )}
                </button>
                <Avatar name={session.name} color="#3b82f6" size={40} />
              </div>
            </div>
          </header>
          <main className="fade-up mx-auto w-full max-w-6xl flex-1 px-8 py-6">{children}</main>
          <footer className="mt-auto border-t border-slate-200/60 py-4 text-center text-[11px] text-slate-400">
            UniFine · KR Mangalam University — Transparent fine management per university norms
          </footer>
        </div>
      </div>
    </div>
  );
}

function BottomItem({
  icon,
  label,
  active,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center gap-0.5 py-1 transition ${active ? "text-sky-600" : "text-slate-400 hover:text-slate-600"}`}
    >
      {icon}
      <span className="text-[10px] font-semibold">{label}</span>
    </button>
  );
}

function SideNav({
  nav,
  view,
  onView,
}: {
  nav: NavItem[];
  view: string;
  onView: (v: string) => void;
}) {
  return (
    <nav className="space-y-1" aria-label="Main navigation">
      {nav.map((item) => {
        const active = view === item.key;
        return (
          <button
            key={item.key}
            onClick={() => onView(item.key)}
            className={`flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold transition-all ${
              active
                ? "bg-gradient-to-r from-sky-500 to-blue-600 text-white shadow-md shadow-blue-500/20"
                : "text-slate-500 hover:bg-sky-50 hover:text-sky-700"
            }`}
          >
            <item.icon className="h-[18px] w-[18px]" />
            {item.label}
            {active && <ChevronRight className="ml-auto h-4 w-4 opacity-70" />}
          </button>
        );
      })}
    </nav>
  );
}

function UserCard({ session, onLogout }: { session: SessionUser; onLogout: () => void }) {
  return (
    <div className="rounded-2xl bg-gradient-to-br from-sky-50 to-blue-50 p-3 ring-1 ring-sky-100">
      <div className="flex items-center gap-3">
        <Avatar name={session.name} color="#3b82f6" size={38} />
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-bold text-slate-800">{session.name}</div>
          <div className="truncate text-[11px] text-slate-500">
            {session.designation || roleLabel(session.role)}
            {session.rollNumber ? ` · ${session.rollNumber}` : ""}
          </div>
        </div>
      </div>
      <button
        onClick={onLogout}
        className="mt-2.5 flex w-full items-center justify-center gap-1.5 rounded-xl bg-white py-2 text-xs font-bold text-rose-500 ring-1 ring-rose-100 transition hover:bg-rose-50"
      >
        <LogOut className="h-3.5 w-3.5" /> Sign out
      </button>
    </div>
  );
}
