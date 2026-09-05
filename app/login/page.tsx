"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const r = useRouter();
  const [loginId, setLoginId] = useState("admin01");
  const [password, setPassword] = useState("admin123");
  const [err, setErr] = useState("");
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr("");
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ loginId, password }),
    });
    const j = await res.json();
    if (!res.ok) {
      setErr(j.error ?? "Invalid Login Id or Password");
      return;
    }
    r.push("/dashboard");
  }
  return (
    <main className="mx-auto max-w-md p-8">
      <h1 className="text-2xl font-bold">Login Page</h1>
      <div className="mt-2 rounded border p-3 text-center">App LoGo</div>
      <form onSubmit={submit} className="mt-4 space-y-3">
        <label className="block">
          Login Id -
          <input
            className="mt-1 w-full rounded border p-2"
            value={loginId}
            onChange={(e) => setLoginId(e.target.value)}
          />
        </label>
        <label className="block">
          Password -
          <input
            type="password"
            className="mt-1 w-full rounded border p-2"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </label>
        {err && <p className="text-sm text-red-600">{err}</p>}
        <button className="w-full rounded bg-black py-2 text-white">
          SIGN IN
        </button>
      </form>
      <div className="mt-3 text-sm">
        <a className="underline" href="/forgot">
          Forgot Password
        </a>{" "}
        |{" "}
        <a className="underline" href="/signup">
          Sign Up
        </a>
      </div>
    </main>
  );
}
