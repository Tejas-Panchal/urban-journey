"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { UserGroupIcon, ShieldCheckIcon } from "@/components/Icons";

export default function CreateUserPage() {
  const router = useRouter();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    name: "",
    loginId: "",
    email: "",
    role: "ACCOUNTANT", // ACCOUNTANT, ADMIN, CONTACT
    password: "",
    rePassword: "",
  });
  const [err, setErr] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [saving, setSaving] = useState(false);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/users").then((r) => r.json());
      setUsers(res.users || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleChange = (field: string, val: string) => {
    setForm((prev) => ({ ...prev, [field]: val }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr("");
    setSuccessMsg("");

    if (form.password !== form.rePassword) {
      setErr("Passwords do not match.");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to create user");
      }
      setSuccessMsg(`User '${form.loginId}' created successfully!`);
      setForm({
        name: "",
        loginId: "",
        email: "",
        role: "ACCOUNTANT",
        password: "",
        rePassword: "",
      });
      loadUsers();
    } catch (error: any) {
      setErr(error.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="mx-auto max-w-6xl px-6 py-8">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between border-b border-[var(--border-color)] pb-6">
        <div>
          <div className="flex items-center gap-2">
            <UserGroupIcon className="h-6 w-6 text-[var(--text-main)]" />
            <h1 className="text-2xl font-black tracking-tight text-[var(--text-main)]">
              Create & Manage Users
            </h1>
          </div>
          <p className="mt-1 text-xs text-[var(--text-muted)]">
            Admin portal to register system users, accountants, and administrators.
          </p>
        </div>
        <Link href="/dashboard" className="btn-outline text-xs px-3.5 py-1.5">
          ← Back to Dashboard
        </Link>
      </div>

      <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Create User Form Card (Top Wireframe) */}
        <div className="card-mono p-6 shadow-xl lg:col-span-1">
          <div className="text-center pb-4 border-b border-[var(--border-color)]">
            <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--text-main)] text-[var(--bg-primary)] text-sm font-black shadow-md">
              UF
            </div>
            <h2 className="mt-3 text-lg font-bold text-[var(--text-main)]">Create User</h2>
            <p className="text-[11px] text-[var(--text-muted)] mt-0.5">Assign access credentials & roles</p>
          </div>

          <form onSubmit={handleSubmit} className="mt-5 space-y-3.5 text-xs">
            {err && (
              <div className="rounded-lg bg-red-500/10 border border-red-500/30 p-2.5 text-red-500 font-medium text-center">
                {err}
              </div>
            )}
            {successMsg && (
              <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/30 p-2.5 text-emerald-500 font-medium text-center">
                {successMsg}
              </div>
            )}

            <div>
              <label className="block font-semibold text-[var(--text-muted)] mb-1">
                Name
              </label>
              <input
                type="text"
                placeholder="Full Name"
                value={form.name}
                onChange={(e) => handleChange("name", e.target.value)}
                className="w-full rounded-lg border border-[var(--border-color)] bg-[var(--bg-primary)] px-3 py-2 text-[var(--text-main)] focus:outline-none focus:border-[var(--text-main)]"
                required
              />
            </div>

            <div>
              <label className="block font-semibold text-[var(--text-muted)] mb-1">
                Login ID (6-12 chars)
              </label>
              <input
                type="text"
                placeholder="e.g. john_doe"
                value={form.loginId}
                onChange={(e) => handleChange("loginId", e.target.value)}
                minLength={6}
                maxLength={12}
                className="w-full rounded-lg border border-[var(--border-color)] bg-[var(--bg-primary)] px-3 py-2 text-[var(--text-main)] font-mono focus:outline-none focus:border-[var(--text-main)]"
                required
              />
            </div>

            <div>
              <label className="block font-semibold text-[var(--text-muted)] mb-1">
                E-mail ID
              </label>
              <input
                type="email"
                placeholder="user@domain.com"
                value={form.email}
                onChange={(e) => handleChange("email", e.target.value)}
                className="w-full rounded-lg border border-[var(--border-color)] bg-[var(--bg-primary)] px-3 py-2 text-[var(--text-main)] font-mono focus:outline-none focus:border-[var(--text-main)]"
                required
              />
            </div>

            {/* Role Radio Selection */}
            <div>
              <label className="block font-semibold text-[var(--text-muted)] mb-1.5">
                Role Assignment
              </label>
              <div className="flex items-center gap-4 rounded-lg border border-[var(--border-color)] bg-[var(--badge-bg)] p-2.5">
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="radio"
                    name="role"
                    value="ACCOUNTANT"
                    checked={form.role === "ACCOUNTANT"}
                    onChange={(e) => handleChange("role", e.target.value)}
                    className="accent-[var(--text-main)]"
                  />
                  <span>Accountant</span>
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="radio"
                    name="role"
                    value="ADMIN"
                    checked={form.role === "ADMIN"}
                    onChange={(e) => handleChange("role", e.target.value)}
                    className="accent-[var(--text-main)]"
                  />
                  <span>Administrator</span>
                </label>
              </div>
            </div>

            <div>
              <label className="block font-semibold text-[var(--text-muted)] mb-1">
                Password
              </label>
              <input
                type="password"
                placeholder="••••••••"
                value={form.password}
                onChange={(e) => handleChange("password", e.target.value)}
                minLength={8}
                className="w-full rounded-lg border border-[var(--border-color)] bg-[var(--bg-primary)] px-3 py-2 text-[var(--text-main)] font-mono focus:outline-none focus:border-[var(--text-main)]"
                required
              />
            </div>

            <div>
              <label className="block font-semibold text-[var(--text-muted)] mb-1">
                Re-Enter Password
              </label>
              <input
                type="password"
                placeholder="••••••••"
                value={form.rePassword}
                onChange={(e) => handleChange("rePassword", e.target.value)}
                minLength={8}
                className="w-full rounded-lg border border-[var(--border-color)] bg-[var(--bg-primary)] px-3 py-2 text-[var(--text-main)] font-mono focus:outline-none focus:border-[var(--text-main)]"
                required
              />
            </div>

            <div className="pt-3 flex gap-3">
              <button
                type="button"
                onClick={() => setForm({ name: "", loginId: "", email: "", role: "ACCOUNTANT", password: "", rePassword: "" })}
                className="btn-outline w-1/2 py-2 text-xs"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="btn-primary w-1/2 py-2 text-xs font-bold uppercase tracking-wider disabled:opacity-50"
              >
                {saving ? "Creating..." : "Create"}
              </button>
            </div>
          </form>
        </div>

        {/* Existing Users Table (Right Column) */}
        <div className="card-mono p-6 lg:col-span-2 overflow-hidden flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-4">
              <div>
                <h2 className="text-base font-bold text-[var(--text-main)]">System Users Directory</h2>
                <p className="text-xs text-[var(--text-muted)]">Registered accounts with active role permissions</p>
              </div>
              <span className="text-xs font-bold text-[var(--text-main)] bg-[var(--badge-bg)] border border-[var(--border-color)] px-2.5 py-1 rounded-md">
                {users.length} Users
              </span>
            </div>

            <div className="mt-4 overflow-x-auto">
              {loading ? (
                <div className="py-12 text-center text-xs text-[var(--text-muted)]">
                  Loading user records...
                </div>
              ) : users.length === 0 ? (
                <div className="py-12 text-center text-xs text-[var(--text-muted)]">
                  No registered users found.
                </div>
              ) : (
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-[var(--border-color)] bg-[var(--badge-bg)] text-[var(--text-muted)] font-bold uppercase tracking-wider">
                      <th className="py-3 px-3">Login ID</th>
                      <th className="py-3 px-3">Email Address</th>
                      <th className="py-3 px-3">Role</th>
                      <th className="py-3 px-3 text-right">Created Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border-color)]/60">
                    {users.map((u) => (
                      <tr key={u.id} className="hover:bg-[var(--card-hover)] transition-colors">
                        <td className="py-3 px-3 font-mono font-bold text-[var(--text-main)]">
                          {u.loginId}
                        </td>
                        <td className="py-3 px-3 font-mono text-[var(--text-muted)]">
                          {u.email}
                        </td>
                        <td className="py-3 px-3">
                          <span
                            className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                              u.role === "ADMIN"
                                ? "bg-[var(--text-main)] text-[var(--bg-primary)]"
                                : "border border-[var(--border-color)] bg-[var(--badge-bg)] text-[var(--text-main)]"
                            }`}
                          >
                            {u.role === "ADMIN" && <ShieldCheckIcon className="h-3 w-3" />}
                            {u.role}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-right text-[var(--text-muted)]">
                          {new Date(u.createdAt).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
