"use client";

import { useCallback, useEffect, useState } from "react";
import { Landing } from "@/components/unifine/Landing";
import { Login } from "@/components/unifine/Login";
import { Shell, type NavItem } from "@/components/unifine/Shell";
import { StudentApp } from "@/components/unifine/StudentApp";
import { FacultyApp } from "@/components/unifine/FacultyApp";
import { AdminApp } from "@/components/unifine/AdminApp";
import type { Role, SessionUser, StudentT } from "@/components/unifine/types";
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

export default function UniFinePage() {
  const [screen, setScreen] = useState<Screen>("landing");
  const [loginRole, setLoginRole] = useState<Role>("FACULTY");
  const [session, setSession] = useState<SessionUser | null>(null);
  const [student, setStudent] = useState<StudentT | null>(null);
  const [view, setView] = useState("home");
  const [unread, setUnread] = useState(0);
  const [booting, setBooting] = useState(true);

  // restore session (persisted client-side; production uses signed JWT, TRD §10)
  useEffect(() => {
    queueMicrotask(() => {
      try {
        const raw = sessionStorage.getItem("unifine.session");
        if (raw) {
          const parsed: Persisted = JSON.parse(raw);
          setSession(parsed.session);
          setStudent(parsed.student);
          setView("home");
          setScreen("app");
        }
      } catch {
        /* ignore corrupt storage */
      }
      setBooting(false);
    });
  }, []);

  const persist = useCallback((u: SessionUser, s: StudentT | null) => {
    sessionStorage.setItem("unifine.session", JSON.stringify({ session: u, student: s } satisfies Persisted));
    setSession(u);
    setStudent(s);
    setView("home");
    setScreen("app");
  }, []);

  const logout = useCallback(() => {
    sessionStorage.removeItem("unifine.session");
    setSession(null);
    setStudent(null);
    setScreen("landing");
  }, []);

  // unread notification badge
  useEffect(() => {
    if (!session) return;
    let alive = true;
    const load = () => {
      const headers: Record<string, string> = {
        "x-user-id": session.id,
        "x-user-role": session.role,
        "x-user-name": session.name,
      };
      if (session.rollNumber) headers["x-user-roll"] = session.rollNumber;
      fetch("/api/notifications", { headers })
        .then((r) => (r.ok ? r.json() : { notifications: [] }))
        .then((d) => {
          if (alive) setUnread((d.notifications as { read: boolean }[]).filter((n) => !n.read).length);
        })
        .catch(() => {});
    };
    load();
    const t = setInterval(load, 30000);
    return () => {
      alive = false;
      clearInterval(t);
    };
  }, [session, view]);

  if (booting) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#eef2f7]">
        <div className="flex flex-col items-center gap-3">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-500 to-blue-600 shadow-lg shadow-blue-500/30">
            <span className="text-lg font-extrabold text-white">KRMU</span>
          </div>
          <p className="text-sm font-semibold text-slate-400">Loading UniFine…</p>
        </div>
      </div>
    );
  }

  if (screen === "landing") {
    return (
      <Landing
        onEnter={(role) => {
          if (role) setLoginRole(role as Role);
          setScreen("login");
        }}
      />
    );
  }

  if (screen === "login" || !session) {
    return (
      <Login
        initialRole={loginRole}
        onBack={() => setScreen("landing")}
        onLogin={(u, s) => persist(u, s)}
      />
    );
  }

  const nav = NAV[session.role];
  const centerKey = session.role === "FACULTY" ? "assign" : session.role === "ADMIN" ? "catalogue" : "fines";

  return (
    <Shell
      session={session}
      nav={nav}
      view={view}
      onView={setView}
      unreadCount={unread}
      onLogout={logout}
      centerActionKey={centerKey}
    >
      {session.role === "STUDENT" && <StudentApp session={session} student={student} view={view} onView={setView} />}
      {session.role === "FACULTY" && <FacultyApp session={session} view={view} onView={setView} />}
      {session.role === "ADMIN" && <AdminApp session={session} view={view} onView={setView} />}
    </Shell>
  );
}
