"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";

export default function CreateUserPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    name: "",
    loginId: "",
    email: "",
    role: "CONTACT", // CONTACT (User), ACCOUNTANT, ADMIN (Administrator)
    password: "",
    rePassword: "",
  });
  const [err, setErr] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [saving, setSaving] = useState(false);

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
        role: "CONTACT",
        password: "",
        rePassword: "",
      });
    } catch (error: any) {
      setErr(error.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="mx-auto max-w-xl px-6 py-10">
      {/* Top Page Title */}
      <h1 className="text-2xl font-bold text-center text-[var(--text-main)] mb-8">
        Create User
      </h1>

      {/* Form Card */}
      <div className="card-mono p-8 shadow-2xl">
        {/* App Logo Header */}
        <div className="flex justify-center mb-6">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--text-main)] text-[var(--bg-primary)] font-black tracking-wider text-sm shadow-sm">
              UJ
            </div>
            <span className="font-extrabold tracking-tight text-base text-[var(--text-main)]">
              URBAN JOURNEY
            </span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 text-xs">
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

          {/* Name Field */}
          <div className="grid grid-cols-3 items-center gap-3">
            <label className="font-semibold text-[var(--text-main)]">
              Name
            </label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => handleChange("name", e.target.value)}
              className="col-span-2 rounded-md border border-[var(--border-color)] bg-[var(--bg-primary)] px-3 py-2 text-xs text-[var(--text-main)] focus:outline-none focus:border-[var(--text-main)]"
              required
            />
          </div>

          {/* Login Id Field */}
          <div className="grid grid-cols-3 items-center gap-3">
            <label className="font-semibold text-[var(--text-main)]">
              Login id
            </label>
            <input
              type="text"
              value={form.loginId}
              onChange={(e) => handleChange("loginId", e.target.value)}
              minLength={6}
              maxLength={12}
              className="col-span-2 rounded-md border border-[var(--border-color)] bg-[var(--bg-primary)] px-3 py-2 text-xs text-[var(--text-main)] font-mono focus:outline-none focus:border-[var(--text-main)]"
              required
            />
          </div>

          {/* E-mail id Field */}
          <div className="grid grid-cols-3 items-center gap-3">
            <label className="font-semibold text-[var(--text-main)]">
              E-mail id
            </label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => handleChange("email", e.target.value)}
              className="col-span-2 rounded-md border border-[var(--border-color)] bg-[var(--bg-primary)] px-3 py-2 text-xs text-[var(--text-main)] font-mono focus:outline-none focus:border-[var(--text-main)]"
              required
            />
          </div>

          {/* Role Radio Selection */}
          <div className="grid grid-cols-3 items-center gap-3">
            <label className="font-semibold text-[var(--text-main)]">
              Role
            </label>
            <div className="col-span-2 flex items-center gap-4">
              <label className="flex items-center gap-1.5 cursor-pointer font-medium">
                <input
                  type="radio"
                  name="role"
                  value="CONTACT"
                  checked={form.role === "CONTACT"}
                  onChange={(e) => handleChange("role", e.target.value)}
                  className="accent-black"
                />
                <span>User</span>
              </label>

              <label className="flex items-center gap-1.5 cursor-pointer font-medium">
                <input
                  type="radio"
                  name="role"
                  value="ACCOUNTANT"
                  checked={form.role === "ACCOUNTANT"}
                  onChange={(e) => handleChange("role", e.target.value)}
                  className="accent-black"
                />
                <span>Accountant</span>
              </label>

              <label className="flex items-center gap-1.5 cursor-pointer font-medium">
                <input
                  type="radio"
                  name="role"
                  value="ADMIN"
                  checked={form.role === "ADMIN"}
                  onChange={(e) => handleChange("role", e.target.value)}
                  className="accent-black"
                />
                <span>Administrator</span>
              </label>
            </div>
          </div>

          {/* Password Field */}
          <div className="grid grid-cols-3 items-center gap-3">
            <label className="font-semibold text-[var(--text-main)]">
              Password
            </label>
            <input
              type="password"
              value={form.password}
              onChange={(e) => handleChange("password", e.target.value)}
              minLength={8}
              className="col-span-2 rounded-md border border-[var(--border-color)] bg-[var(--bg-primary)] px-3 py-2 text-xs text-[var(--text-main)] font-mono focus:outline-none focus:border-[var(--text-main)]"
              required
            />
          </div>

          {/* Re-Enter Password Field */}
          <div className="grid grid-cols-3 items-center gap-3">
            <label className="font-semibold text-[var(--text-main)]">
              Re-Enter Password
            </label>
            <input
              type="password"
              value={form.rePassword}
              onChange={(e) => handleChange("rePassword", e.target.value)}
              minLength={8}
              className="col-span-2 rounded-md border border-[var(--border-color)] bg-[var(--bg-primary)] px-3 py-2 text-xs text-[var(--text-main)] font-mono focus:outline-none focus:border-[var(--text-main)]"
              required
            />
          </div>

          {/* Action Buttons: Create & Cancel */}
          <div className="pt-6 flex justify-center gap-4">
            <button
              type="submit"
              disabled={saving}
              className="btn-outline px-6 py-2 text-xs font-semibold rounded-lg"
            >
              {saving ? "Creating..." : "Create"}
            </button>
            <button
              type="button"
              onClick={() => router.push("/dashboard")}
              className="btn-outline px-6 py-2 text-xs font-semibold rounded-lg"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}
