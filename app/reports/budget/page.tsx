"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import { RefreshIcon } from "@/components/Icons";

export default function BudgetReportPage() {
  const [budgets, setBudgets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/reports/budget")
        .then((r) => r.json().catch(() => ({ budgets: [] })))
        .catch(() => ({ budgets: [] }));
      setBudgets(res.budgets || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 }).format(val);

  return (
    <main className="mx-auto max-w-6xl px-6 py-8">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between border-b border-[var(--border-color)] pb-6">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-[var(--text-main)]">
            Budget Performance & Variance Report
          </h1>
          <p className="text-xs text-[var(--text-muted)] mt-1">
            Real-time transaction tracking against allocated analytic budget limits
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/masters/budgets"
            className="btn-outline text-xs px-3.5 py-1.5 font-semibold"
          >
            Manage Budgets Form
          </Link>
          <button
            onClick={loadData}
            className="btn-primary text-xs px-3.5 py-1.5 flex items-center gap-1.5"
          >
            <RefreshIcon className="h-4 w-4" /> Recalculate Transactions
          </button>
        </div>
      </div>

      {loading ? (
        <div className="mt-8 card-mono py-20 text-center text-xs text-[var(--text-muted)]">
          Aggregating money transactions against budget allocations...
        </div>
      ) : budgets.length === 0 ? (
        <div className="mt-8 card-mono py-20 text-center text-xs text-[var(--text-muted)]">
          No budget allocations configured. Go to{" "}
          <Link href="/masters/budgets" className="underline font-bold text-[var(--text-main)]">
            Budgets Master
          </Link>{" "}
          to create one.
        </div>
      ) : (
        <div className="mt-8 space-y-6">
          {budgets.map((b) => {
            const limit = b.lines?.reduce((s: number, l: any) => s + (l.committed || 0), 0) || 0;
            const actual = b.lines?.reduce((s: number, l: any) => s + (l.achievedCached || 0), 0) || 0;
            const variance = limit - actual;
            const percentage = limit > 0 ? Math.min(100, Math.round((actual / limit) * 100)) : 0;

            return (
              <div key={b.id} className="card-mono p-6">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b border-[var(--border-color)] pb-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-lg font-bold text-[var(--text-main)]">{b.name}</h2>
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded font-extrabold uppercase ${
                          b.status === "CONFIRMED"
                            ? "bg-emerald-500/10 text-emerald-600"
                            : b.status === "REVISED"
                            ? "bg-amber-500/10 text-amber-600"
                            : "bg-slate-500/10 text-slate-600"
                        }`}
                      >
                        {b.status}
                      </span>
                    </div>
                    <p className="text-xs text-[var(--text-muted)] font-mono mt-0.5">
                      Period: {new Date(b.start).toLocaleDateString("en-IN")} — {new Date(b.end).toLocaleDateString("en-IN")}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 text-xs">
                    <span className="font-extrabold font-mono text-[var(--text-main)]">
                      Budget Utilization: {percentage}%
                    </span>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="mt-4">
                  <div className="h-3 w-full rounded-full bg-[var(--border-color)] overflow-hidden">
                    <div
                      className={`h-full transition-all duration-500 ${
                        variance < 0 ? "bg-red-500" : "bg-cyan-500"
                      }`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>

                {/* Metrics Breakdown */}
                <div className="mt-6 grid grid-cols-3 gap-4 text-center text-xs border-t border-[var(--border-color)]/60 pt-4">
                  <div>
                    <div className="text-[var(--text-muted)] uppercase tracking-wider font-semibold text-[10px]">
                      Committed Budget Limit
                    </div>
                    <div className="text-base font-extrabold font-mono text-[var(--text-main)] mt-1">
                      {formatCurrency(limit)}
                    </div>
                  </div>
                  <div>
                    <div className="text-[var(--text-muted)] uppercase tracking-wider font-semibold text-[10px]">
                      Actual Posted Transactions
                    </div>
                    <div className="text-base font-extrabold font-mono text-[var(--text-main)] mt-1">
                      {formatCurrency(actual)}
                    </div>
                  </div>
                  <div>
                    <div className="text-[var(--text-muted)] uppercase tracking-wider font-semibold text-[10px]">
                      Available Variance
                    </div>
                    <div
                      className={`text-base font-extrabold font-mono mt-1 ${
                        variance < 0 ? "text-red-500" : "text-emerald-600 dark:text-emerald-400"
                      }`}
                    >
                      {formatCurrency(variance)}
                    </div>
                  </div>
                </div>

                {/* Analytic Line Breakdown */}
                {b.lines && b.lines.length > 0 && (
                  <div className="mt-6 border-t border-[var(--border-color)]/40 pt-4">
                    <div className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider mb-3">
                      Analytic Line Breakdown
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="border-b border-[var(--border-color)] text-[var(--text-muted)] uppercase font-bold text-[10px]">
                            <th className="py-2 px-2">Analytic Account</th>
                            <th className="py-2 px-2">Type</th>
                            <th className="py-2 px-2 text-right">Committed Amount</th>
                            <th className="py-2 px-2 text-right">Achieved Amount</th>
                            <th className="py-2 px-2 text-center">Achieved %</th>
                            <th className="py-2 px-2 text-right">Remaining Variance</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[var(--border-color)]/50">
                          {b.lines.map((line: any, idx: number) => {
                            const lineCommitted = line.committed || 0;
                            const lineAchieved = line.achievedCached || 0;
                            const linePct = lineCommitted > 0 ? Math.round((lineAchieved / lineCommitted) * 100) : 0;
                            const lineRem = lineCommitted - lineAchieved;

                            return (
                              <tr key={idx} className="hover:bg-[var(--card-hover)]">
                                <td className="py-2 px-2 font-bold">{line.analyticName || line.analyticId}</td>
                                <td className="py-2 px-2 font-semibold text-[var(--text-muted)]">{line.type}</td>
                                <td className="py-2 px-2 text-right font-mono">{formatCurrency(lineCommitted)}</td>
                                <td className="py-2 px-2 text-right font-mono font-bold">{formatCurrency(lineAchieved)}</td>
                                <td className="py-2 px-2 text-center font-mono font-bold text-cyan-600 dark:text-cyan-400">
                                  {linePct}%
                                </td>
                                <td
                                  className={`py-2 px-2 text-right font-mono font-bold ${
                                    lineRem < 0 ? "text-red-500" : "text-[var(--text-main)]"
                                  }`}
                                >
                                  {formatCurrency(lineRem)}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </main>
  );
}
