"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function SignupPage() {
  const r = useRouter();
  const [form, setForm] = useState({ name: "", loginId: "", email: "", password: "", rePassword: "" });
  const [err, setErr] = useState("");
  function set(k: string, v: string) { setForm(f => ({ ...f, [k]: v })); }
  async function submit(e: React.FormEvent) {
    e.preventDefault(); setErr("");
    const res = await fetch("/api/auth/signup", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...form, name: form.name || form.loginId }) });
    const j = await res.json();
    if (!res.ok) { setErr(j.error ?? "Signup failed"); return; }
    r.push("/dashboard");
  }
  return (
    <main className="mx-auto max-w-md p-8">
      <h1 className="text-2xl font-bold">Sign Up Page</h1>
      <form onSubmit={submit} className="mt-4 space-y-3">
        <input className="w-full rounded border p-2" placeholder="Name" value={form.name} onChange={e => set("name", e.target.value)} />
        <input className="w-full rounded border p-2" placeholder="Enter Login Id (6-12, unique)" value={form.loginId} onChange={e => set("loginId", e.target.value)} />
        <input className="w-full rounded border p-2" placeholder="Enter Email Id (unique)" value={form.email} onChange={e => set("email", e.target.value)} />
        <input className="w-full rounded border p-2" type="password" placeholder="Enter Password (>8, lower+upper+special)" value={form.password} onChange={e => set("password", e.target.value)} />
        <input className="w-full rounded border p-2" type="password" placeholder="Re-Enter Password" value={form.rePassword} onChange={e => set("rePassword", e.target.value)} />
        {err && <p className="text-sm text-red-600">{err}</p>}
        <button className="w-full rounded bg-black py-2 text-white">SIGN UP</button>
      </form>
    </main>
  );
}
