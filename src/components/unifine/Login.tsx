"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { KrmuLogo } from "./shared";
import { AnimatePresence, motion } from "./motion";
import type { Role, SessionUser, StudentT } from "./types";
import {
  ArrowLeft,
  GraduationCap,
  Loader2,
  Lock,
  Mail,
  ShieldCheck,
  UserRound,
  Info,
  Eye,
  EyeOff,
} from "lucide-react";

// Demo accounts are created by `npm run db:seed`. Never show/prefill passwords on a production deployment.
const SHOW_DEMO = process.env.NODE_ENV !== "production";

const DEMO: Record<Role, { email: string; password: string; hint: string }> = {
  ADMIN: { email: "admin@krmu.ac.in", password: "Admin@123", hint: "Dr. Meera Kapoor · Dean Student Affairs" },
  FACULTY: { email: "faculty@krmu.ac.in", password: "Faculty@123", hint: "Prof. Rajesh Choudhary · SOET" },
  STUDENT: { email: "student@krmu.ac.in", password: "Student@123", hint: "Aarav Choudhary · B.Tech CSE" },
};

const SCHOOLS = [
  "School of Engineering & Technology",
  "School of Management & Commerce",
  "School of Law",
  "School of Pharmacy",
  "School of Basic Sciences",
];

const YEARS = ["1st Year", "2nd Year", "3rd Year", "4th Year"];

type Mode = "signin" | "signup";

const inputCls = "h-11 rounded-xl border-slate-200 bg-slate-50/60 text-sm";
const selectCls = "h-11 w-full rounded-xl border border-slate-200 bg-slate-50/70 px-3 text-sm font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-400";

export function Login({
  initialRole = "FACULTY",
  onBack,
  onLogin,
}: {
  initialRole?: Role;
  onBack: () => void;
  onLogin: (user: SessionUser, student: StudentT | null) => void;
}) {
  const [mode, setMode] = useState<Mode>("signin");

  /* ---- sign in state ---- */
  const [role, setRole] = useState<Role>(initialRole);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);

  /* ---- sign up state ---- */
  const [signupRole, setSignupRole] = useState<"STUDENT" | "FACULTY">("STUDENT");
  const [suName, setSuName] = useState("");
  const [suEmail, setSuEmail] = useState("");
  const [suPassword, setSuPassword] = useState("");
  const [suRoll, setSuRoll] = useState("");
  const [suSchool, setSuSchool] = useState(SCHOOLS[0]);
  const [suProgramme, setSuProgramme] = useState("");
  const [suYear, setSuYear] = useState(YEARS[0]);
  const [suDesignation, setSuDesignation] = useState("");

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const switchMode = (m: Mode) => {
    if (m === mode) return;
    setMode(m);
    setError("");
    setLoading(false);
  };

  const pickRole = (r: string) => {
    const rr = r as Role;
    setRole(rr);
    setError("");
  };

  /* ---------------- Sign in ---------------- */
  const submitSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!email.trim() || !password) {
      setError("Please enter both email and password.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || "Login failed.");
        return;
      }
      onLogin({ ...data.user, token: data.token }, data.student ?? null);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  /* ---------------- Sign up ---------------- */
  const submitSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const name = suName.trim();
    const mail = suEmail.trim();
    const roll = suRoll.trim();

    if (name.length < 3) {
      setError("Please enter your full name.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(mail)) {
      setError("Please enter a valid university email.");
      return;
    }
    if (suPassword.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }
    if (signupRole === "STUDENT") {
      if (!/^\d{10}$/.test(roll)) {
        setError("Roll number must be exactly 10 digits (e.g. 2501560006).");
        return;
      }
      if (!suProgramme.trim()) {
        setError("Please enter your programme (e.g. B.Tech CSE).");
        return;
      }
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          role: signupRole,
          name,
          email: mail,
          password: suPassword,
          ...(signupRole === "STUDENT"
            ? { rollNumber: roll, department: suSchool, programme: suProgramme.trim(), year: suYear }
            : { department: suSchool, designation: suDesignation.trim() }),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || "Registration failed.");
        return;
      }
      onLogin({ ...data.user, token: data.token }, data.student ?? null);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden bg-gradient-to-b from-brand-400 via-brand-500 to-brand-600">
      <div className="pointer-events-none absolute inset-0">
        <div className="float-slow absolute -right-24 -top-24 h-80 w-80 rounded-full bg-white/10" />
        <div className="float-slower absolute -bottom-32 -left-24 h-96 w-96 rounded-full bg-white/[0.07]" />
      </div>
      <div className="relative px-5 pt-[max(1.25rem,env(safe-area-inset-top))]">
        <button
          onClick={onBack}
          className="flex h-10 w-10 items-center justify-center rounded-xl text-white transition hover:bg-white/15"
          aria-label="Back to landing"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
      </div>

      <div className="relative flex flex-1 items-start justify-center px-4 pb-10 pt-6 sm:items-center">
        <motion.div
          initial={{ opacity: 0, y: 24, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="w-full max-w-md"
        >
          <div className="mb-5 text-center text-white">
            <motion.div
              className="mb-3 flex justify-center"
              initial={{ scale: 0.6, rotate: -12, opacity: 0 }}
              animate={{ scale: 1, rotate: 0, opacity: 1 }}
              transition={{ type: "spring", stiffness: 260, damping: 18, delay: 0.1 }}
            >
              <KrmuLogo size={68} />
            </motion.div>
            <h1 className="text-2xl font-bold tracking-tight">
              {mode === "signin" ? "Sign in to UniFine" : "Create your UniFine account"}
            </h1>
            <p className="mt-1 text-sm text-brand-100">KR Mangalam University · Fine Management Portal</p>
          </div>

          <div className="overflow-hidden rounded-[28px] bg-white p-6 shadow-2xl shadow-brand-900/25">
            {/* mode switch — sliding pill */}
            <div className="mb-5 grid grid-cols-2 gap-1 rounded-2xl bg-slate-100 p-1">
              {(["signin", "signup"] as const).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => switchMode(m)}
                  className={`relative h-9 rounded-xl text-xs font-bold transition-colors ${
                    mode === m ? "text-brand-600" : "text-slate-500 hover:text-slate-700"
                  }`}
                >
                  {mode === m && (
                    <motion.span
                      layoutId="auth-mode-pill"
                      transition={{ type: "spring", stiffness: 450, damping: 34 }}
                      className="absolute inset-0 rounded-xl bg-white shadow-sm"
                    />
                  )}
                  <span className="relative">{m === "signin" ? "Sign In" : "Sign Up"}</span>
                </button>
              ))}
            </div>

            <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={mode}
              initial={{ opacity: 0, x: mode === "signin" ? -16 : 16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: mode === "signin" ? 16 : -16 }}
              transition={{ duration: 0.22 }}
            >
            {mode === "signin" ? (
              <>
                <Tabs value={role} onValueChange={pickRole}>
                  <TabsList className="mb-4 grid w-full grid-cols-3 rounded-2xl bg-slate-100 p-1">
                    <TabsTrigger value="ADMIN" className="rounded-xl text-xs font-bold">Admin</TabsTrigger>
                    <TabsTrigger value="FACULTY" className="rounded-xl text-xs font-bold">Faculty</TabsTrigger>
                    <TabsTrigger value="STUDENT" className="rounded-xl text-xs font-bold">Student</TabsTrigger>
                  </TabsList>
                </Tabs>

                {SHOW_DEMO && (
                  <button
                    type="button"
                    onClick={() => {
                      setEmail(DEMO[role].email);
                      setPassword(DEMO[role].password);
                      setError("");
                    }}
                    className="mb-4 flex w-full items-center gap-1.5 rounded-xl bg-brand-50 px-3 py-2 text-left text-[11px] font-medium text-brand-700 ring-1 ring-brand-100 transition hover:bg-brand-100"
                  >
                    <ShieldCheck className="h-3.5 w-3.5 shrink-0" />
                    <span>
                      Dev only — tap to fill demo {role.toLowerCase()} ({DEMO[role].email}). Requires <code>npm run db:seed</code>.
                    </span>
                  </button>
                )}

                <form onSubmit={submitSignIn} className="space-y-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="email" className="text-xs font-bold text-slate-600">University email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                      <Input
                        id="email"
                        type="email"
                        autoComplete="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="you@krmu.ac.in"
                        className={inputCls + " pl-9"}
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="password" className="text-xs font-bold text-slate-600">Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                      <Input
                        id="password"
                        type={showPw ? "text" : "password"}
                        autoComplete="current-password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Enter your password"
                        className={inputCls + " pl-9 pr-10"}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPw((v) => !v)}
                        aria-label={showPw ? "Hide password" : "Show password"}
                        className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
                      >
                        {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  <AnimatePresence>
                    {error && (
                      <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}>
                        <motion.div animate={{ x: [0, -6, 6, -4, 4, 0] }} transition={{ duration: 0.4 }}>
                          <Alert variant="destructive" className="rounded-xl py-2.5 text-xs">
                            <AlertDescription>{error}</AlertDescription>
                          </Alert>
                        </motion.div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <Button
                    type="submit"
                    disabled={loading}
                    className="h-11 w-full rounded-xl bg-gradient-to-r from-brand-500 to-brand-600 text-sm font-bold shadow-md shadow-brand-500/25 hover:from-brand-600 hover:to-brand-700"
                  >
                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : `Sign in as ${role.charAt(0) + role.slice(1).toLowerCase()}`}
                  </Button>
                </form>
              </>
            ) : (
              <>
                {/* signup role selector — student / faculty self-service */}
                <div className="mb-4 grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => { setSignupRole("STUDENT"); setError(""); }}
                    className={`flex h-11 items-center justify-center gap-2 rounded-xl border text-xs font-bold transition-all ${
                      signupRole === "STUDENT"
                        ? "border-brand-300 bg-brand-50 text-brand-700 ring-2 ring-brand-200"
                        : "border-slate-200 bg-slate-50/60 text-slate-500 hover:border-slate-300"
                    }`}
                  >
                    <GraduationCap className="h-4 w-4" /> Student
                  </button>
                  <button
                    type="button"
                    onClick={() => { setSignupRole("FACULTY"); setError(""); }}
                    className={`flex h-11 items-center justify-center gap-2 rounded-xl border text-xs font-bold transition-all ${
                      signupRole === "FACULTY"
                        ? "border-brand-300 bg-brand-50 text-brand-700 ring-2 ring-brand-200"
                        : "border-slate-200 bg-slate-50/60 text-slate-500 hover:border-slate-300"
                    }`}
                  >
                    <UserRound className="h-4 w-4" /> Faculty
                  </button>
                </div>

                <form onSubmit={submitSignUp} className="space-y-3.5">
                  <div className="space-y-1.5">
                    <Label htmlFor="su-name" className="text-xs font-bold text-slate-600">Full name</Label>
                    <div className="relative">
                      <UserRound className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                      <Input
                        id="su-name"
                        value={suName}
                        onChange={(e) => setSuName(e.target.value)}
                        placeholder={signupRole === "STUDENT" ? "e.g. Rahul Sharma" : "e.g. Dr. Anita Verma"}
                        autoComplete="name"
                        className={inputCls + " pl-9"}
                      />
                    </div>
                  </div>

                  {signupRole === "STUDENT" && (
                    <div className="space-y-1.5">
                      <Label htmlFor="su-roll" className="text-xs font-bold text-slate-600">Roll number</Label>
                      <Input
                        id="su-roll"
                        value={suRoll}
                        onChange={(e) => setSuRoll(e.target.value.replace(/\D/g, "").slice(0, 10))}
                        placeholder="2501560006"
                        inputMode="numeric"
                        autoComplete="off"
                        className={inputCls + " tracking-widest"}
                      />
                      <p className="text-[10px] font-medium text-slate-400">
                        10-digit university roll number — links your account to your official fine record.
                      </p>
                    </div>
                  )}

                  <div className="space-y-1.5">
                    <Label htmlFor="su-email" className="text-xs font-bold text-slate-600">University email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                      <Input
                        id="su-email"
                        type="email"
                        value={suEmail}
                        onChange={(e) => setSuEmail(e.target.value)}
                        placeholder="you@krmu.ac.in"
                        autoComplete="email"
                        className={inputCls + " pl-9"}
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="su-password" className="text-xs font-bold text-slate-600">Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                      <Input
                        id="su-password"
                        type={showPw ? "text" : "password"}
                        value={suPassword}
                        onChange={(e) => setSuPassword(e.target.value)}
                        placeholder="Minimum 6 characters"
                        autoComplete="new-password"
                        className={inputCls + " pl-9"}
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="su-school" className="text-xs font-bold text-slate-600">School / Department</Label>
                    <select
                      id="su-school"
                      value={suSchool}
                      onChange={(e) => setSuSchool(e.target.value)}
                      className={selectCls}
                    >
                      {SCHOOLS.map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>

                  {signupRole === "STUDENT" ? (
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <Label htmlFor="su-programme" className="text-xs font-bold text-slate-600">Programme</Label>
                        <Input
                          id="su-programme"
                          value={suProgramme}
                          onChange={(e) => setSuProgramme(e.target.value)}
                          placeholder="B.Tech CSE"
                          className={inputCls}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="su-year" className="text-xs font-bold text-slate-600">Year</Label>
                        <select
                          id="su-year"
                          value={suYear}
                          onChange={(e) => setSuYear(e.target.value)}
                          className={selectCls}
                        >
                          {YEARS.map((y) => (
                            <option key={y} value={y}>{y}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-1.5">
                      <Label htmlFor="su-designation" className="text-xs font-bold text-slate-600">
                        Designation <span className="font-medium text-slate-400">(optional)</span>
                      </Label>
                      <Input
                        id="su-designation"
                        value={suDesignation}
                        onChange={(e) => setSuDesignation(e.target.value)}
                        placeholder="Assistant Professor"
                        className={inputCls}
                      />
                    </div>
                  )}

                  <AnimatePresence>
                    {error && (
                      <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}>
                        <motion.div animate={{ x: [0, -6, 6, -4, 4, 0] }} transition={{ duration: 0.4 }}>
                          <Alert variant="destructive" className="rounded-xl py-2.5 text-xs">
                            <AlertDescription>{error}</AlertDescription>
                          </Alert>
                        </motion.div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <Button
                    type="submit"
                    disabled={loading}
                    className="h-11 w-full rounded-xl bg-gradient-to-r from-brand-500 to-brand-600 text-sm font-bold shadow-md shadow-brand-500/25 hover:from-brand-600 hover:to-brand-700"
                  >
                    {loading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      `Create ${signupRole === "STUDENT" ? "Student" : "Faculty"} Account`
                    )}
                  </Button>

                  <p className="flex items-start gap-1.5 text-[10px] leading-relaxed text-slate-400">
                    <Info className="mt-0.5 h-3 w-3 shrink-0" />
                    Admin accounts are provisioned by the university. Students register with their official
                    10-digit roll number issued at admission.
                  </p>
                </form>
              </>
            )}
            </motion.div>
            </AnimatePresence>
          </div>

          <p className="mt-4 text-center text-[11px] text-brand-100/80">
            {mode === "signin" ? (
              <>
                New student or faculty member?{" "}
                <button type="button" onClick={() => switchMode("signup")} className="font-bold text-white underline underline-offset-2 hover:text-brand-100">
                  Create an account
                </button>
              </>
            ) : (
              <>
                Already registered?{" "}
                <button type="button" onClick={() => switchMode("signin")} className="font-bold text-white underline underline-offset-2 hover:text-brand-100">
                  Sign in
                </button>
              </>
            )}
          </p>

          <p className="mt-2 text-center text-[11px] text-brand-100/60">
            Access is role-restricted. Students get read-only views of their own records.
          </p>
        </motion.div>
      </div>
    </div>
  );
}
