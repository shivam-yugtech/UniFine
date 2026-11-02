"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Landing } from "@/components/unifine/Landing";
import { Login } from "@/components/unifine/Login";
import { Shell, type NavItem } from "@/components/unifine/Shell";
import { StudentApp } from "@/components/unifine/StudentApp";
import { FacultyApp } from "@/components/unifine/FacultyApp";
import { AdminApp } from "@/components/unifine/AdminApp";
import { KrmuLogo } from "@/components/unifine/shared";
import { AnimatePresence, motion } from "@/components/unifine/motion";
import type { Role, SessionUser, StudentT } from "@/components/unifine/types";
import { api, NOTIFS_CHANGED_EVENT, UNAUTHORIZED_EVENT } from "@/components/unifine/utils";
import { toast } from "@/hooks/use-toast";
import {
  LayoutDashboard,
  FileWarning,
  PlusCircle,
  History,
  Bell,
  UserRound,
  Gavel,
  ClipboardEdit,
  BarChart3,
  ScrollText,
  ShieldCheck,
} from "lucide-react";

type Screen = "landing" | "login" | "app";

interface Persisted {
  session: SessionUser;
  student: StudentT | null;
}

const STORAGE_KEY = "unifine.session";

const NAV: Record<Role, NavItem[]> = {
  ADMIN: [
    { key: "home", label: "Dashboard", icon: LayoutDashboard },
    { key: "catalogue", label: "Offence Catalogue", icon: Gavel },
    { key: "fines", label: "Fines & Corrections", icon: ClipboardEdit },
    { key: "reports", label: "Reports", icon: BarChart3 },
    { key: "rulebook", label: "Rule Book", icon: ScrollText },
    { key: "audit", label: "Audit Trail", icon: ShieldCheck },
    { key: "notifications", label: "Notifications", icon: Bell },
  ],
  FACULTY: [
    { key: "home", label: "Dashboard", icon: LayoutDashboard },
    { key: "assign", label: "Assign Fine", icon: PlusCircle },
    { key: "history", label: "Fine History", icon: History },
    { key: "rulebook", label: "Rule Book", icon: ScrollText },
    { key: "notifications", label: "Notifications", icon: Bell },
  ],
  STUDENT: [
    { key: "home", label: "Home", icon: LayoutDashboard },
    { key: "fines", label: "My Fines", icon: FileWarning },
    { key: "rulebook", label: "Rule Book", icon: ScrollText },
    { key: "notifications", label: "Notifications", icon: Bell },
    { key: "profile", label: "Profile", icon: UserRound },
  ],
};

const CENTER_ACTION: Record<Role, string> = { FACULTY: "assign", ADMIN: "catalogue", STUDENT: "fines" };

function readHashView(role: Role): string {
  if (typeof window === "undefined") return "home";
  const v = window.location.hash.replace(/^#\/?/, "");
  return NAV[role].some((n) => n.key === v) ? v : "home";
}

function loadPersisted(): Persisted | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed: Persisted = JSON.parse(raw);
    // sessions saved before signed tokens existed can't call the API any more
    if (!parsed?.session?.token || !NAV[parsed.session.role]) return null;
    return parsed;
  } catch {
    return null;
  }
}

export default function UniFinePage() {
  const [screen, setScreen] = useState<Screen>("landing");
  const [loginRole, setLoginRole] = useState<Role>("STUDENT");
  const [session, setSession] = useState<SessionUser | null>(null);
  const [student, setStudent] = useState<StudentT | null>(null);
  const [view, setViewState] = useState("home");
  const [unread, setUnread] = useState(0);
  const [booting, setBooting] = useState(true);

  // restore session from sessionStorage (client-only, so do it after mount)
  useEffect(() => {
    queueMicrotask(() => {
      const p = loadPersisted();
      if (p) {
        setSession(p.session);
        setStudent(p.student);
        setViewState(readHashView(p.session.role));
        setScreen("app");
      } else {
        sessionStorage.removeItem(STORAGE_KEY);
      }
      setBooting(false);
    });
  }, []);

  // Views are mirrored in the URL hash so the phone/browser back button moves between
  // screens instead of leaving the portal.
  const viewRef = useRef(view);
  useEffect(() => {
    viewRef.current = view;
  }, [view]);

  const setView = useCallback((v: string) => {
    if (viewRef.current !== v) window.history.pushState(null, "", `#${v}`);
    setViewState(v);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  useEffect(() => {
    if (!session) return;
    const onPop = () => setViewState(readHashView(session.role));
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, [session]);

  const persist = useCallback((u: SessionUser, s: StudentT | null) => {
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ session: u, student: s } satisfies Persisted));
    } catch {
      /* storage blocked (private mode) — session still works for this tab */
    }
    window.history.replaceState(null, "", "#home");
    setSession(u);
    setStudent(s);
    setViewState("home");
    setScreen("app");
  }, []);

  const logout = useCallback(() => {
    try {
      sessionStorage.removeItem(STORAGE_KEY);
    } catch {}
    window.history.replaceState(null, "", window.location.pathname);
    setSession(null);
    setStudent(null);
    setUnread(0);
    setViewState("home");
    setScreen("landing");
  }, []);

  // expired / invalid token anywhere in the app -> back to sign-in
  useEffect(() => {
    const onUnauthorized = () => {
      if (!session) return;
      logout();
      setScreen("login");
      toast({ title: "Session expired", description: "Please sign in again to continue.", variant: "destructive" });
    };
    window.addEventListener(UNAUTHORIZED_EVENT, onUnauthorized);
    return () => window.removeEventListener(UNAUTHORIZED_EVENT, onUnauthorized);
  }, [session, logout]);

  // unread notification badge — refreshes on navigation, on read/unread events and every 30s while visible
  useEffect(() => {
    if (!session) return;
    let alive = true;
    const load = () => {
      if (document.visibilityState === "hidden") return;
      api<{ unread: number }>(session, "/api/notifications")
        .then((d) => alive && setUnread(d.unread ?? 0))
        .catch(() => {});
    };
    load();
    const t = setInterval(load, 30000);
    window.addEventListener(NOTIFS_CHANGED_EVENT, load);
    document.addEventListener("visibilitychange", load);
    return () => {
      alive = false;
      clearInterval(t);
      window.removeEventListener(NOTIFS_CHANGED_EVENT, load);
      document.removeEventListener("visibilitychange", load);
    };
  }, [session, view]);

  if (booting) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center gap-3"
        >
          <div className="pulse-ring rounded-full">
            <KrmuLogo size={72} />
          </div>
          <p className="text-sm font-semibold text-slate-400">Loading UniFine…</p>
        </motion.div>
      </div>
    );
  }

  return (
    <AnimatePresence mode="wait" initial={false}>
      {screen === "landing" && (
        <motion.div key="landing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <Landing
            onEnter={(role) => {
              if (role) setLoginRole(role as Role);
              setScreen("login");
            }}
          />
        </motion.div>
      )}

      {(screen === "login" || (screen === "app" && !session)) && (
        <motion.div key="login" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <Login initialRole={loginRole} onBack={() => setScreen("landing")} onLogin={(u, s) => persist(u, s)} />
        </motion.div>
      )}

      {screen === "app" && session && (
        <motion.div key={`app-${session.id}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <Shell
            session={session}
            nav={NAV[session.role]}
            view={view}
            onView={setView}
            unreadCount={unread}
            onLogout={logout}
            centerActionKey={CENTER_ACTION[session.role]}
          >
            {session.role === "STUDENT" && <StudentApp session={session} student={student} view={view} onView={setView} />}
            {session.role === "FACULTY" && <FacultyApp session={session} view={view} onView={setView} />}
            {session.role === "ADMIN" && <AdminApp session={session} view={view} onView={setView} />}
          </Shell>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
