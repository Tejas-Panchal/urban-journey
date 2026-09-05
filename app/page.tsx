import Link from "next/link";

export default function Home() {
  return (
    <main className="mx-auto max-w-3xl p-8">
      <h1 className="text-3xl font-bold">Urban Furniture — Accounting</h1>
      <p className="mt-2 text-gray-600">Masters → Purchase/Sales → Bills/Invoices → Payments → Journals → Reports</p>
      <div className="mt-6 flex gap-3">
        <Link className="rounded bg-black px-4 py-2 text-white" href="/login">Login</Link>
        <Link className="rounded border px-4 py-2" href="/signup">Sign Up</Link>
        <Link className="rounded border px-4 py-2" href="/dashboard">Dashboard</Link>
      </div>
      <div className="mt-8 text-sm text-gray-600">
        <p>Seed logins: <code>admin01 / admin123</code> (ADMIN), <code>acct001 / account123</code> (ACCOUNTANT)</p>
        <p className="mt-1">Run: <code>bunx prisma migrate dev && bun run db:seed && bun dev</code></p>
      </div>
    </main>
  );
}
