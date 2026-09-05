"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ShieldCheckIcon, UserGroupIcon } from "@/components/Icons";

export default function LoginPage() {
  const router = useRouter();
  const [loginId, setLoginId] = useState("admin01");
  const [password, setPassword] = useState("admin123");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ loginId, password }),
      });
      const j = await res.json();
      if (!res.ok) {
        setErr(j.error ?? "Invalid Login ID or Password");
        return;
      }
      window.location.href = "/dashboard";
    } catch {
      setErr("Login request failed. Please check network.");
    } finally {
      setLoading(false);
    }
  }

  const fillQuick = (id: string, pass: string) => {
    setLoginId(id);
    setPassword(pass);
  };

  return (
    <main className="flex min-h-[85vh] items-center justify-center px-4 py-12">
      <div className="card-mono w-full max-w-md p-8 shadow-2xl">
        <div className="text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--text-main)] text-[var(--bg-primary)] text-lg font-black shadow-md">
            UJ
          </div>
          <h1 className="mt-4 text-2xl font-black tracking-tight text-[var(--text-main)]">
            Welcome Back
          </h1>
          <p className="mt-1 text-xs text-[var(--text-muted)]">
            Sign in to Urban Journey & Accounting
          </p>
        </div>

        <form onSubmit={submit} className="mt-6 space-y-4">
          {err && (
            <div className="rounded-lg bg-red-500/10 border border-red-500/30 p-3 text-xs text-red-500 font-medium text-center">
              {err}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-[var(--text-muted)] mb-1">
              Login ID
            </label>
            <input
              className="w-full rounded-lg border border-[var(--border-color)] bg-[var(--bg-primary)] px-3.5 py-2.5 text-xs text-[var(--text-main)] focus:outline-none focus:border-[var(--text-main)] font-mono"
              value={loginId}
              onChange={(e) => setLoginId(e.target.value)}
              placeholder="e.g. admin01"
              required
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-semibold text-[var(--text-muted)]">
                Password
              </label>
              <Link
                href="/forgot"
                className="text-[11px] font-semibold text-[var(--text-main)] hover:underline"
              >
                Forgot Password?
              </Link>
            </div>
            <input
              type="password"
              className="w-full rounded-lg border border-[var(--border-color)] bg-[var(--bg-primary)] px-3.5 py-2.5 text-xs text-[var(--text-main)] focus:outline-none focus:border-[var(--text-main)] font-mono"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full btn-primary py-2.5 text-xs font-bold uppercase tracking-wider disabled:opacity-50 mt-2"
          >
            {loading ? "Authenticating..." : "Sign In"}
          </button>
        </form>

        {/* Quick Demo Credentials Switcher */}
        <div className="mt-6 border-t border-[var(--border-color)] pt-4">
          <p className="text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-wider text-center">
            Quick Demo Logins:
          </p>
          <div className="mt-2.5 flex flex-wrap justify-center gap-2">
            <button
              onClick={() => fillQuick("admin01", "admin123")}
              className="rounded-md border border-[var(--border-color)] bg-[var(--badge-bg)] px-2.5 py-1 text-[11px] font-medium text-[var(--text-main)] hover:border-[var(--text-main)] flex items-center gap-1"
            >
              <ShieldCheckIcon className="h-3.5 w-3.5" /> Admin
            </button>
            <button
              onClick={() => fillQuick("acct001", "account123")}
              className="rounded-md border border-[var(--border-color)] bg-[var(--badge-bg)] px-2.5 py-1 text-[11px] font-medium text-[var(--text-main)] hover:border-[var(--text-main)] flex items-center gap-1"
            >
              <UserGroupIcon className="h-3.5 w-3.5" /> Accountant
            </button>
            <button
              onClick={() => fillQuick("nimesh01", "user1234!")}
              className="rounded-md border border-[var(--border-color)] bg-[var(--badge-bg)] px-2.5 py-1 text-[11px] font-medium text-[var(--text-main)] hover:border-[var(--text-main)] flex items-center gap-1"
            >
              <UserGroupIcon className="h-3.5 w-3.5" /> Customer (nimesh01)
            </button>
          </div>
        </div>

        <div className="mt-6 text-center text-xs text-[var(--text-muted)]">
          Don't have an account?{" "}
          <Link
            href="/signup"
            className="font-bold underline text-[var(--text-main)]"
          >
            Sign Up
          </Link>
        </div>
      </div>
    </main>
  );
}
