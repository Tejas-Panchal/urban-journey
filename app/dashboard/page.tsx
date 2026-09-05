"use client";
import { useEffect, useState } from "react";

export default function Dashboard() {
  const [data, setData] = useState<any>(null);
  useEffect(() => {
    (async () => {
      const [po, bills, so, inv, budgets] = await Promise.all([
        fetch("/api/purchase/orders")
          .then((r) => r.json())
          .catch(() => ({})),
        fetch("/api/purchase/bills")
          .then((r) => r.json())
          .catch(() => ({})),
        fetch("/api/sales/orders")
          .then((r) => r.json())
          .catch(() => ({})),
        fetch("/api/sales/invoices")
          .then((r) => r.json())
          .catch(() => ({})),
        fetch("/api/reports/budget")
          .then((r) => r.json())
          .catch(() => ({})),
      ]);
      setData({ po, bills, so, inv, budgets });
    })();
  }, []);
  const counts = (arr: any[]) => ({
    all: arr?.length ?? 0,
    confirmed:
      arr?.filter((x: any) =>
        ["CONFIRMED", "PAID", "PARTIAL"].includes(x.status),
      )?.length ?? 0,
    draft: arr?.filter((x: any) => x.status === "DRAFT")?.length ?? 0,
  });
  const poc = counts(data?.po?.orders);
  const soc = counts(data?.so?.orders);
  return (
    <main className="mx-auto max-w-5xl p-8">
      <h1 className="text-2xl font-bold">App Dashboard</h1>
      <nav className="mt-2 flex gap-4 text-sm underline">
        <a href="/dashboard">Sales</a>
        <a href="/dashboard">Purchase</a>
        <a href="/dashboard">Account</a>
        <a href="/dashboard">Report</a>
        <a href="/api/reports/balancesheet">BalanceSheet JSON</a>
        <a href="/api/reports/profit-loss">P&L JSON</a>
      </nav>
      <div className="mt-4 grid grid-cols-3 gap-4">
        <div className="rounded border p-4">
          <h2>Sales</h2>
          <p>All {soc.all}</p>
          <p>Confirmed {soc.confirmed}</p>
          <p>Draft {soc.draft}</p>
        </div>
        <div className="rounded border p-4">
          <h2>Purchase</h2>
          <p>All {poc.all}</p>
          <p>Confirmed {poc.confirmed}</p>
          <p>Draft {poc.draft}</p>
        </div>
        <div className="rounded border p-4">
          <h2>Budget Reports</h2>
          <p>{data?.budgets?.budgets?.length ?? 0} budgets</p>
        </div>
      </div>
      <pre className="mt-4 overflow-auto rounded bg-gray-100 p-3 text-xs">
        {JSON.stringify(data, null, 2)?.slice(0, 4000)}
      </pre>
    </main>
  );
}
