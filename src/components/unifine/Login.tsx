"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { KrmuLogo } from "./shared";
import type { Role, SessionUser, StudentT } from "./types";
import { ArrowLeft, Loader2, Lock, Mail, ShieldCheck } from "lucide-react";

const DEMO: Record<Role, { email: string; password: string; hint: string }> = {
  ADMIN: { email: "admin@krmu.ac.in", password: "Admin@123", hint: "Dr. Meera Kapoor · Dean Student Affairs" },
  FACULTY: { email: "faculty@krmu.ac.in", password: "Faculty@123", hint: "Prof. Rajesh Choudhary · SOET" },
  STUDENT: { email: "student@krmu.ac.in", password: "Student@123", hint: "Aarav Choudhary · B.Tech CSE" },
};

export function Login({
  initialRole = "FACULTY",
  onBack,
  onLogin,
}: {
  initialRole?: Role;
  onBack: () => void;
  onLogin: (user: SessionUser, student: StudentT | null) => void;
}) {
  const [role, setRole] = useState<Role>(initialRole);
  const [email, setEmail] = useState(DEMO[initialRole].email);
  const [password, setPassword] = useState(DEMO[initialRole].password);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const pickRole = (r: string) => {
    const rr = r as Role;
    setRole(rr);
    setEmail(DEMO[rr].email);
    setPassword(DEMO[rr].password);
    setError("");
  };

  const submit = async (e: React.FormEvent) => {
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
            <h1 className="text-2xl font-extrabold tracking-tight">Sign in to UniFine</h1>
            <p className="mt-1 text-sm text-sky-100">KR Mangalam University · Fine Management Portal</p>
          </div>

          <div className="rounded-3xl bg-white p-6 shadow-2xl shadow-blue-900/20">
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

            <form onSubmit={submit} className="space-y-4">
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
                    className="h-11 rounded-xl border-slate-200 bg-slate-50/60 pl-9 text-sm"
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
                    className="h-11 rounded-xl border-slate-200 bg-slate-50/60 pl-9 text-sm"
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
          </div>

          <p className="mt-4 text-center text-[11px] text-sky-100/80">
            Access is role-restricted. Students get read-only views of their own records.
          </p>
        </div>
      </div>
    </div>
  );
}
