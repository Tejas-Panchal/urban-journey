"use client";
import { useState } from "react";
export default function ForgotPage() {
  const [loginId, setLoginId] = useState("");
  const [email, setEmail] = useState("");
  const [msg, setMsg] = useState("");
  async function submit(e: React.FormEvent) {
    e.preventDefault(); setMsg("If Login Id + Email match, a reset link would be sent (localhost mock). Ask admin to reset.");
  }
  return (
    <main className="mx-auto max-w-md p-8">
      <h1 className="text-2xl font-bold">Forgot Password</h1>
      <form onSubmit={submit} className="mt-4 space-y-3">
        <input className="w-full rounded border p-2" placeholder="Enter Login Id" value={loginId} onChange={e => setLoginId(e.target.value)} />
        <input className="w-full rounded border p-2" placeholder="Enter Email Id" value={email} onChange={e => setEmail(e.target.value)} />
        <button className="w-full rounded bg-black py-2 text-white">Submit</button>
      </form>
      {msg && <p className="mt-3 text-sm">{msg}</p>}
    </main>
  );
}
