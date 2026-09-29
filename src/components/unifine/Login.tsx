"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { KrmuLogo } from "./shared";
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
} from "lucide-react";

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
const selectCls = "h-11 w-full rounded-xl border border-slate-200 bg-slate-50/70 px-3 text-sm font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-400";

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
  const [email, setEmail] = useState(DEMO[initialRole].email);
  const [password, setPassword] = useState(DEMO[initialRole].password);

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
    setMode(m);
    setError("");
    setLoading(false);
  };

  const pickRole = (r: string) => {
    const rr = r as Role;
    setRole(rr);
    setEmail(DEMO[rr].email);
    setPassword(DEMO[rr].password);
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
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Login failed.");
        return;
      }
      onLogin(data.user, data.student ?? null);
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
    if (!mail) {
      setError("Please enter your university email.");
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
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Registration failed.");
        return;
      }
      onLogin(data.user, data.student ?? null);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-sky-400 via-blue-500 to-blue-600">
      <div className="px-5 pt-[max(1.25rem,env(safe-area-inset-top))]">
        <button
          onClick={onBack}
          className="flex h-10 w-10 items-center justify-center rounded-xl text-white transition hover:bg-white/15"
          aria-label="Back to landing"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
      </div>

      <div className="flex flex-1 items-start justify-center px-4 pb-10 pt-6 sm:items-center">
        <div className="fade-up w-full max-w-md">
          <div className="mb-5 text-center text-white">
            <div className="mb-3 flex justify-center">
              <KrmuLogo size={64} />
            </div>
            <h1 className="text-2xl font-extrabold tracking-tight">
              {mode === "signin" ? "Sign in to UniFine" : "Create your UniFine account"}
            </h1>
            <p className="mt-1 text-sm text-sky-100">KR Mangalam University · Fine Management Portal</p>
          </div>

          <div className="rounded-3xl bg-white p-6 shadow-2xl shadow-blue-900/20">
            {/* mode switch */}
            <div className="mb-5 grid grid-cols-2 gap-1 rounded-2xl bg-slate-100 p-1">
              <button
                type="button"
                onClick={() => switchMode("signin")}
                className={`h-9 rounded-xl text-xs font-bold transition-all ${
                  mode === "signin" ? "bg-white text-sky-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => switchMode("signup")}
                className={`h-9 rounded-xl text-xs font-bold transition-all ${
                  mode === "signup" ? "bg-white text-sky-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
                }`}
              >
                Sign Up
              </button>
            </div>

            {mode === "signin" ? (
              <>
                <Tabs value={role} onValueChange={pickRole}>
                  <TabsList className="mb-4 grid w-full grid-cols-3 rounded-2xl bg-slate-100 p-1">
                    <TabsTrigger value="ADMIN" className="rounded-xl text-xs font-bold">Admin</TabsTrigger>
                    <TabsTrigger value="FACULTY" className="rounded-xl text-xs font-bold">Faculty</TabsTrigger>
                    <TabsTrigger value="STUDENT" className="rounded-xl text-xs font-bold">Student</TabsTrigger>
                  </TabsList>
                </Tabs>

                <p className="mb-4 flex items-center gap-1.5 rounded-xl bg-sky-50 px-3 py-2 text-[11px] font-medium text-sky-700 ring-1 ring-sky-100">
                  <ShieldCheck className="h-3.5 w-3.5 shrink-0" />
                  Demo: {DEMO[role].email} / {DEMO[role].password} — {DEMO[role].hint}
                </p>

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
                        type="password"
                        autoComplete="current-password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Enter your password"
                        className={inputCls + " pl-9"}
                      />
                    </div>
                  </div>

                  {error && (
                    <Alert variant="destructive" className="rounded-xl py-2.5 text-xs">
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}

                  <Button
                    type="submit"
                    disabled={loading}
                    className="h-11 w-full rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 text-sm font-bold shadow-md shadow-blue-500/25 hover:from-sky-600 hover:to-blue-700"
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
                        ? "border-sky-300 bg-sky-50 text-sky-700 ring-2 ring-sky-200"
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
                        ? "border-sky-300 bg-sky-50 text-sky-700 ring-2 ring-sky-200"
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
                        type="password"
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

                  {error && (
                    <Alert variant="destructive" className="rounded-xl py-2.5 text-xs">
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}

                  <Button
                    type="submit"
                    disabled={loading}
                    className="h-11 w-full rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 text-sm font-bold shadow-md shadow-blue-500/25 hover:from-sky-600 hover:to-blue-700"
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
          </div>

          <p className="mt-4 text-center text-[11px] text-sky-100/80">
            {mode === "signin" ? (
              <>
                New student or faculty member?{" "}
                <button type="button" onClick={() => switchMode("signup")} className="font-bold text-white underline underline-offset-2 hover:text-sky-100">
                  Create an account
                </button>
              </>
            ) : (
              <>
                Already registered?{" "}
                <button type="button" onClick={() => switchMode("signin")} className="font-bold text-white underline underline-offset-2 hover:text-sky-100">
                  Sign in
                </button>
              </>
            )}
          </p>

          <p className="mt-2 text-center text-[11px] text-sky-100/60">
            Access is role-restricted. Students get read-only views of their own records.
          </p>
        </div>
      </div>
    </div>
  );
}
