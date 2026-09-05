"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function SignupPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    name: "",
    loginId: "",
    email: "",
    password: "",
    rePassword: "",
  });
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  function handleChange(field: string, val: string) {
    setForm((prev) => ({ ...prev, [field]: val }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr("");

    // Client-side quick validation
    if (form.password !== form.rePassword) {
      setErr("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          name: form.name || form.loginId,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErr(data.error ?? "Registration failed. Please check your details.");
        return;
      }
      window.location.href = "/dashboard";
    } catch {
      setErr("Network error occurred during signup.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-[85vh] items-center justify-center px-4 py-12">
      <div className="card-mono w-full max-w-md p-8 shadow-2xl">
        <div className="text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--text-main)] text-[var(--bg-primary)] text-lg font-black shadow-md">
            UJ
          </div>
          <h1 className="mt-4 text-2xl font-black tracking-tight text-[var(--text-main)]">
            Create Account
          </h1>
          <p className="mt-1 text-xs text-[var(--text-muted)]">
            Register for Urban Journey & Accounting
          </p>
        </div>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          {err && (
            <div className="rounded-lg bg-red-500/10 border border-red-500/30 p-3 text-xs text-red-500 font-medium text-center">
              {err}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-[var(--text-muted)] mb-1">
              Full Name
            </label>
            <input
              type="text"
              className="w-full rounded-lg border border-[var(--border-color)] bg-[var(--bg-primary)] px-3.5 py-2.5 text-xs text-[var(--text-main)] focus:outline-none focus:border-[var(--text-main)]"
              placeholder="John Doe"
              value={form.name}
              onChange={(e) => handleChange("name", e.target.value)}
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[var(--text-muted)] mb-1">
              Login ID (6-12 Characters)
            </label>
            <input
              type="text"
              className="w-full rounded-lg border border-[var(--border-color)] bg-[var(--bg-primary)] px-3.5 py-2.5 text-xs text-[var(--text-main)] focus:outline-none focus:border-[var(--text-main)] font-mono"
              placeholder="user123"
              value={form.loginId}
              onChange={(e) => handleChange("loginId", e.target.value)}
              minLength={6}
              maxLength={12}
              required
            />
            <p className="mt-1 text-[10px] text-[var(--text-muted)]">
              Letters, numbers, dots, dashes, or underscores.
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[var(--text-muted)] mb-1">
              Email Address
            </label>
            <input
              type="email"
              className="w-full rounded-lg border border-[var(--border-color)] bg-[var(--bg-primary)] px-3.5 py-2.5 text-xs text-[var(--text-main)] focus:outline-none focus:border-[var(--text-main)] font-mono"
              placeholder="user@example.com"
              value={form.email}
              onChange={(e) => handleChange("email", e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-semibold text-[var(--text-muted)] mb-1">
                Password
              </label>
              <input
                type="password"
                className="w-full rounded-lg border border-[var(--border-color)] bg-[var(--bg-primary)] px-3 py-2 text-xs text-[var(--text-main)] focus:outline-none focus:border-[var(--text-main)] font-mono"
                placeholder="••••••••"
                value={form.password}
                onChange={(e) => handleChange("password", e.target.value)}
                minLength={8}
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[var(--text-muted)] mb-1">
                Confirm Password
              </label>
              <input
                type="password"
                className="w-full rounded-lg border border-[var(--border-color)] bg-[var(--bg-primary)] px-3 py-2 text-xs text-[var(--text-main)] focus:outline-none focus:border-[var(--text-main)] font-mono"
                placeholder="••••••••"
                value={form.rePassword}
                onChange={(e) => handleChange("rePassword", e.target.value)}
                minLength={8}
                required
              />
            </div>
          </div>
          <p className="text-[10px] text-[var(--text-muted)]">
            Must contain 8+ characters, uppercase, lowercase, and a special
            character.
          </p>

          <button
            type="submit"
            disabled={loading}
            className="w-full btn-primary py-2.5 text-xs font-bold uppercase tracking-wider disabled:opacity-50 mt-2"
          >
            {loading ? "Creating Account..." : "Create Account"}
          </button>
        </form>

        <div className="mt-6 border-t border-[var(--border-color)] pt-4 text-center text-xs text-[var(--text-muted)]">
          Already have an account?{" "}
          <Link
            href="/login"
            className="font-bold underline text-[var(--text-main)]"
          >
            Sign In
          </Link>
        </div>
      </div>
    </main>
  );
}
