"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function ForgotPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    loginId: "",
    email: "",
    newPassword: "",
    rePassword: "",
  });
  const [err, setErr] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (field: string, val: string) => {
    setForm((prev) => ({ ...prev, [field]: val }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr("");
    setSuccessMsg("");

    if (form.newPassword !== form.rePassword) {
      setErr("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          loginId: form.loginId,
          email: form.email,
          newPassword: form.newPassword,
          rePassword: form.rePassword,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to reset password");
      }

      setSuccessMsg(data.message || "Password updated successfully!");
      setForm({
        loginId: "",
        email: "",
        newPassword: "",
        rePassword: "",
      });
    } catch (error: any) {
      setErr(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-[85vh] items-center justify-center px-4 py-12">
      <div className="card-mono w-full max-w-md p-8 shadow-2xl">
        {/* Brand Logo Header */}
        <div className="text-center">
          <div className="flex justify-center mb-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--text-main)] text-[var(--bg-primary)] font-black tracking-wider text-base shadow-md">
                UJ
              </div>
              <span className="font-extrabold tracking-tight text-lg text-[var(--text-main)]">
                URBAN JOURNEY
              </span>
            </div>
          </div>
          <h1 className="mt-2 text-2xl font-black tracking-tight text-[var(--text-main)]">
            Reset Password
          </h1>
          <p className="mt-1 text-xs text-[var(--text-muted)]">
            Verify your Login ID & Email to set a new password
          </p>
        </div>

        {/* Success Card */}
        {successMsg ? (
          <div className="mt-6 space-y-4 text-center">
            <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/30 p-4 text-emerald-500 text-xs font-semibold leading-relaxed">
              ✓ {successMsg}
            </div>
            <button
              onClick={() => router.push("/login")}
              className="w-full btn-primary py-2.5 text-xs font-bold uppercase tracking-wider mt-2"
            >
              Sign In Now
            </button>
          </div>
        ) : (
          /* Password Reset Form */
          <form onSubmit={handleSubmit} className="mt-6 space-y-4 text-xs">
            {err && (
              <div className="rounded-lg bg-red-500/10 border border-red-500/30 p-3 text-red-500 font-medium text-center">
                {err}
              </div>
            )}

            <div>
              <label className="block font-semibold text-[var(--text-muted)] mb-1">
                Login ID
              </label>
              <input
                type="text"
                value={form.loginId}
                onChange={(e) => handleChange("loginId", e.target.value)}
                placeholder="e.g. admin01"
                className="w-full rounded-lg border border-[var(--border-color)] bg-[var(--bg-primary)] px-3.5 py-2.5 text-xs text-[var(--text-main)] font-mono focus:outline-none focus:border-[var(--text-main)]"
                required
              />
            </div>

            <div>
              <label className="block font-semibold text-[var(--text-muted)] mb-1">
                Registered E-mail ID
              </label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => handleChange("email", e.target.value)}
                placeholder="user@example.com"
                className="w-full rounded-lg border border-[var(--border-color)] bg-[var(--bg-primary)] px-3.5 py-2.5 text-xs text-[var(--text-main)] font-mono focus:outline-none focus:border-[var(--text-main)]"
                required
              />
            </div>

            <div>
              <label className="block font-semibold text-[var(--text-muted)] mb-1">
                New Password
              </label>
              <input
                type="password"
                value={form.newPassword}
                onChange={(e) => handleChange("newPassword", e.target.value)}
                placeholder="••••••••"
                minLength={8}
                className="w-full rounded-lg border border-[var(--border-color)] bg-[var(--bg-primary)] px-3.5 py-2.5 text-xs text-[var(--text-main)] font-mono focus:outline-none focus:border-[var(--text-main)]"
                required
              />
            </div>

            <div>
              <label className="block font-semibold text-[var(--text-muted)] mb-1">
                Confirm New Password
              </label>
              <input
                type="password"
                value={form.rePassword}
                onChange={(e) => handleChange("rePassword", e.target.value)}
                placeholder="••••••••"
                minLength={8}
                className="w-full rounded-lg border border-[var(--border-color)] bg-[var(--bg-primary)] px-3.5 py-2.5 text-xs text-[var(--text-main)] font-mono focus:outline-none focus:border-[var(--text-main)]"
                required
              />
            </div>

            <p className="text-[10px] text-[var(--text-muted)] leading-normal">
              Password must be 8+ characters and include lowercase, uppercase, and special characters.
            </p>

            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary py-2.5 text-xs font-bold uppercase tracking-wider disabled:opacity-50 mt-2"
            >
              {loading ? "Updating Password..." : "Reset Password"}
            </button>
          </form>
        )}

        {/* Back to Login Footer */}
        <div className="mt-6 border-t border-[var(--border-color)] pt-4 text-center text-xs text-[var(--text-muted)]">
          Remembered your password?{" "}
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
