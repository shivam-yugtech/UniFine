"use client";

import { useMemo, useRef, useState } from "react";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Avatar } from "./Avatar";
import { KrmuLogo } from "./shared";
import { AnimatePresence, motion, PageTransition } from "./motion";
import { greeting, firstName, roleLabel } from "./utils";
import type { SessionUser } from "./types";
import { Bell, ChevronRight, Headphones, Home, LogOut, Menu, PlusCircle, ScanLine, Search, X } from "lucide-react";

export interface NavItem {
  key: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

/**
 * App shell — mirrors the KRMU iCloudEMS student app:
 * flat blue header with rounded bottom, white greeting card, "Search modules…" box,
 * bottom nav with a floating centre action on phones, and a sidebar on desktop.
 *
 * `children` is rendered exactly ONCE. (Previously it was rendered in both a mobile and a
 * desktop tree, so every view mounted twice: double API calls and duplicate dialogs.)
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
  const centerItem = nav.find((n) => n.key === centerKey);
  const subtitle = `${session.designation || roleLabel(session.role) + " Portal"}${session.rollNumber ? ` · ${session.rollNumber}` : ""}`;
  const currentLabel = nav.find((n) => n.key === view)?.label ?? "Dashboard";

  return (
    <div className="min-h-screen bg-surface lg:flex">
      {/* ===== Desktop sidebar ===== */}
      <aside className="sticky top-0 hidden h-screen w-[268px] shrink-0 flex-col gap-5 border-r border-slate-200/70 bg-white p-5 lg:flex">
        <div className="flex items-center gap-3 px-1 pt-1">
          <KrmuLogo size={44} />
          <div className="leading-tight">
            <div className="text-base font-bold tracking-tight text-slate-800">UniFine</div>
            <div className="text-[11px] font-medium text-slate-400">KR Mangalam University</div>
          </div>
        </div>
        <div className="nice-scroll -mx-1 flex-1 overflow-y-auto px-1">
          <SideNav nav={nav} view={view} onView={onView} unread={unreadCount} layoutGroup="desktop" />
        </div>
        <UserCard session={session} onLogout={onLogout} />
      </aside>

      <div className="flex min-h-screen min-w-0 flex-1 flex-col">
        {/* ===== Mobile header ===== */}
        <header className="relative z-10 rounded-b-[28px] bg-brand-500 px-4 pb-5 pt-[max(0.9rem,env(safe-area-inset-top))] shadow-lg shadow-brand-500/25 lg:hidden">
          <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-b-[28px]">
            <div className="float-slow absolute -right-10 -top-16 h-40 w-40 rounded-full bg-white/10" />
            <div className="float-slower absolute -bottom-20 left-10 h-36 w-36 rounded-full bg-white/[0.07]" />
          </div>
          <div className="relative flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
                <SheetTrigger asChild>
                  <button
                    aria-label="Open menu"
                    className="flex h-10 w-10 items-center justify-center rounded-xl text-white transition hover:bg-white/15 active:scale-90"
                  >
                    <Menu className="h-6 w-6" />
                  </button>
                </SheetTrigger>
                <SheetContent side="left" className="flex w-[290px] flex-col overflow-y-auto rounded-r-3xl border-0 p-4">
                  <SheetHeader className="p-0 pb-3 text-left">
                    <SheetTitle className="flex items-center gap-2.5">
                      <KrmuLogo size={38} />
                      <span>
                        <span className="block text-sm font-bold text-slate-800">UniFine</span>
                        <span className="block text-[10px] font-medium text-slate-400">KR Mangalam University</span>
                      </span>
                    </SheetTitle>
                    <SheetDescription className="sr-only">Main navigation</SheetDescription>
                  </SheetHeader>
                  <SideNav
                    nav={nav}
                    view={view}
                    unread={unreadCount}
                    layoutGroup="sheet"
                    onView={(k) => {
                      onView(k);
                      setMenuOpen(false);
                    }}
                  />
                  <div className="mt-auto pt-4">
                    <UserCard session={session} onLogout={onLogout} />
                  </div>
                </SheetContent>
              </Sheet>
              <KrmuLogo size={44} />
            </div>
            <button
              aria-label="Help — open the rule book"
              title="Help & rule book"
              onClick={() => onView("rulebook")}
              className="flex h-10 w-10 items-center justify-center rounded-xl text-white transition hover:bg-white/15 active:scale-90"
            >
              <Headphones className="h-6 w-6" />
            </button>
          </div>
        </header>

        {/* Mobile greeting card + module search (like the reference app) */}
        <div className="relative z-[5] -mt-6 px-0 lg:hidden">
          <div className="rounded-b-[28px] bg-white px-5 pb-4 pt-9 shadow-sm">
            <h1 className="text-[21px] font-semibold tracking-tight text-slate-900">
              {greeting()} <span className="inline-block origin-[70%_70%] animate-[wave_2s_ease-in-out_1]">👋</span>{" "}
              {firstName(session.name)}
            </h1>
            <p className="mt-0.5 truncate text-xs font-medium text-slate-500">{subtitle}</p>
          </div>
          <div className="px-4 pt-4">
            <ModuleSearch nav={nav} onView={onView} />
          </div>
        </div>

        {/* ===== Desktop header ===== */}
        <header className="sticky top-0 z-20 hidden border-b border-slate-200/60 bg-surface/85 px-8 py-4 backdrop-blur-md lg:block">
          <div className="mx-auto flex max-w-6xl items-center justify-between gap-6">
            <div className="min-w-0">
              <h1 className="truncate text-xl font-semibold tracking-tight text-slate-900">
                {greeting()} 👋 {firstName(session.name)}
              </h1>
              <p className="truncate text-xs font-medium text-slate-500">
                {subtitle} · <span className="text-brand-600">{currentLabel}</span>
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="hidden w-72 xl:block">
                <ModuleSearch nav={nav} onView={onView} compact />
              </div>
              <button
                onClick={() => onView("notifications")}
                aria-label={`Notifications${unreadCount ? `, ${unreadCount} unread` : ""}`}
                className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-white text-slate-500 shadow-sm ring-1 ring-slate-100 transition hover:-translate-y-0.5 hover:text-brand-600 hover:shadow-md"
              >
                <Bell className="h-5 w-5" />
                <UnreadDot count={unreadCount} />
              </button>
              <Avatar name={session.name} color="#4a9ee8" size={40} />
            </div>
          </div>
        </header>

        <main className="mx-auto w-full max-w-6xl flex-1 px-4 pb-32 pt-4 lg:px-8 lg:pb-8 lg:pt-6">
          <AnimatePresence mode="wait" initial={false}>
            <PageTransition key={view}>{children}</PageTransition>
          </AnimatePresence>
        </main>

        <footer className="hidden border-t border-slate-200/60 py-4 text-center text-[11px] text-slate-400 lg:block">
          UniFine · KR Mangalam University — Transparent fine management per university norms
        </footer>
      </div>

      {/* ===== Mobile bottom nav ===== */}
      <nav
        aria-label="Bottom navigation"
        className="fixed inset-x-0 bottom-0 z-30 rounded-t-[26px] bg-white px-6 pb-[max(0.6rem,env(safe-area-inset-bottom))] pt-2 shadow-[0_-10px_30px_rgba(15,23,42,0.08)] lg:hidden"
      >
        <div className="relative mx-auto grid max-w-md grid-cols-3 items-end">
          <BottomItem
            icon={<Home className="h-6 w-6" />}
            label="Home"
            active={view === nav[0]?.key}
            onClick={() => onView(nav[0]?.key)}
          />
          <div className="relative flex flex-col items-center">
            <motion.button
              whileTap={{ scale: 0.88 }}
              whileHover={{ scale: 1.06 }}
              onClick={() => onView(centerKey)}
              aria-label={centerItem?.label ?? "Action"}
              className={`absolute -top-12 flex h-[62px] w-[62px] items-center justify-center rounded-full bg-brand-500 text-white shadow-lg shadow-brand-500/40 ring-[5px] ring-white ${view === centerKey ? "" : "pulse-ring"}`}
            >
              {session.role === "STUDENT" ? <ScanLine className="h-7 w-7" /> : <PlusCircle className="h-7 w-7" />}
            </motion.button>
            <span className={`pt-7 text-[11px] font-medium ${view === centerKey ? "text-brand-600" : "text-slate-400"}`}>
              {centerItem?.label ?? ""}
            </span>
          </div>
          <BottomItem
            icon={
              <span className="relative">
                <Bell className="h-6 w-6" />
                <UnreadDot count={unreadCount} />
              </span>
            }
            label="Notifications"
            active={view === "notifications"}
            onClick={() => onView("notifications")}
          />
        </div>
      </nav>
    </div>
  );
}

function UnreadDot({ count }: { count: number }) {
  return (
    <AnimatePresence>
      {count > 0 && (
        <motion.span
          key={count > 9 ? "9+" : count}
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          exit={{ scale: 0 }}
          transition={{ type: "spring", stiffness: 500, damping: 22 }}
          className="absolute -right-1.5 -top-1.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white ring-2 ring-white"
        >
          {count > 9 ? "9+" : count}
        </motion.span>
      )}
    </AnimatePresence>
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
    <motion.button
      whileTap={{ scale: 0.9 }}
      onClick={onClick}
      aria-current={active ? "page" : undefined}
      className={`relative flex flex-col items-center gap-1 py-1 transition-colors ${active ? "text-brand-500" : "text-slate-400 hover:text-slate-600"}`}
    >
      {icon}
      <span className="text-[11px] font-medium">{label}</span>
      {active && (
        <motion.span layoutId="bottom-active" className="absolute -bottom-1 h-1 w-6 rounded-full bg-brand-500" />
      )}
    </motion.button>
  );
}

function SideNav({
  nav,
  view,
  onView,
  unread,
  layoutGroup,
}: {
  nav: NavItem[];
  view: string;
  onView: (v: string) => void;
  unread: number;
  layoutGroup: string;
}) {
  return (
    <nav className="space-y-1" aria-label="Main navigation">
      {nav.map((item) => {
        const active = view === item.key;
        return (
          <button
            key={item.key}
            onClick={() => onView(item.key)}
            aria-current={active ? "page" : undefined}
            className={`group relative flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition-colors ${
              active ? "text-white" : "text-slate-500 hover:bg-brand-50 hover:text-brand-700"
            }`}
          >
            {active && (
              <motion.span
                layoutId={`nav-active-${layoutGroup}`}
                transition={{ type: "spring", stiffness: 420, damping: 34 }}
                className="absolute inset-0 rounded-2xl bg-brand-500 shadow-md shadow-brand-500/25"
              />
            )}
            <item.icon className="relative h-[18px] w-[18px] transition-transform group-hover:scale-110" />
            <span className="relative">{item.label}</span>
            {item.key === "notifications" && unread > 0 && (
              <span
                className={`relative ml-auto rounded-full px-2 py-0.5 text-[10px] font-bold ${active ? "bg-white/25 text-white" : "bg-rose-100 text-rose-600"}`}
              >
                {unread > 9 ? "9+" : unread}
              </span>
            )}
            {active && item.key !== "notifications" && <ChevronRight className="relative ml-auto h-4 w-4 opacity-80" />}
          </button>
        );
      })}
    </nav>
  );
}

/** "Search modules…" box from the reference app — jumps to any screen by name. */
function ModuleSearch({ nav, onView, compact = false }: { nav: NavItem[]; onView: (v: string) => void; compact?: boolean }) {
  const [q, setQ] = useState("");
  const [focused, setFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const results = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return nav;
    return nav.filter((n) => n.label.toLowerCase().includes(s) || n.key.includes(s));
  }, [q, nav]);

  const go = (k: string) => {
    onView(k);
    setQ("");
    setFocused(false);
    inputRef.current?.blur();
  };

  return (
    <div className="relative">
      <Search className={`pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 ${compact ? "h-4 w-4" : "h-5 w-5"}`} />
      <input
        ref={inputRef}
        value={q}
        onChange={(e) => setQ(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setTimeout(() => setFocused(false), 120)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && results[0]) go(results[0].key);
          if (e.key === "Escape") inputRef.current?.blur();
        }}
        placeholder="Search modules..."
        aria-label="Search modules"
        className={`w-full rounded-2xl bg-white pl-12 pr-10 text-slate-700 shadow-sm ring-1 ring-slate-100 transition placeholder:text-slate-400 focus:shadow-md focus:outline-none focus:ring-2 focus:ring-brand-300 ${compact ? "h-10 text-sm" : "h-14 text-base"}`}
      />
      {q && (
        <button
          aria-label="Clear search"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => setQ("")}
          className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-slate-400 hover:bg-slate-100"
        >
          <X className="h-4 w-4" />
        </button>
      )}
      <AnimatePresence>
        {focused && (
          <motion.ul
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            transition={{ duration: 0.18 }}
            className="absolute inset-x-0 top-full z-40 mt-2 overflow-hidden rounded-2xl bg-white p-1.5 shadow-xl ring-1 ring-slate-100"
            role="listbox"
          >
            {results.length === 0 ? (
              <li className="px-3 py-3 text-xs text-slate-400">No module matches “{q}”.</li>
            ) : (
              results.map((r) => (
                <li key={r.key}>
                  <button
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => go(r.key)}
                    className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium text-slate-600 transition hover:bg-brand-50 hover:text-brand-700"
                  >
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-50 text-brand-500">
                      <r.icon className="h-4 w-4" />
                    </span>
                    {r.label}
                    <ChevronRight className="ml-auto h-4 w-4 text-slate-300" />
                  </button>
                </li>
              ))
            )}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  );
}

function UserCard({ session, onLogout }: { session: SessionUser; onLogout: () => void }) {
  return (
    <div className="rounded-2xl bg-brand-50 p-3 ring-1 ring-brand-100">
      <div className="flex items-center gap-3">
        <Avatar name={session.name} color="#4a9ee8" size={38} />
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-semibold text-slate-800">{session.name}</div>
          <div className="truncate text-[11px] text-slate-500">
            {session.designation || roleLabel(session.role)}
            {session.rollNumber ? ` · ${session.rollNumber}` : ""}
          </div>
        </div>
      </div>
      <button
        onClick={onLogout}
        className="mt-2.5 flex w-full items-center justify-center gap-1.5 rounded-xl bg-white py-2 text-xs font-semibold text-rose-500 ring-1 ring-rose-100 transition hover:bg-rose-50 active:scale-[0.98]"
      >
        <LogOut className="h-3.5 w-3.5" /> Sign out
      </button>
    </div>
  );
}
