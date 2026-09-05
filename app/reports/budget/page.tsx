"use client";
import React, { useEffect, useState } from "react";
import { RefreshIcon } from "@/components/Icons";

export default function BudgetReportPage() {
  const [budgets, setBudgets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/reports/budget").then((r) => r.json().catch(() => ({ budgets: [] }))).catch(() => ({ budgets: [] }));
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
    new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(val);

  return (
    <main className="mx-auto max-w-5xl px-6 py-8">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between border-b border-[var(--border-color)] pb-6">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-[var(--text-main)]">
            Budget Performance & Variance Report
          </h1>
          <p className="mt-1 text-xs text-[var(--text-muted)]">
            Analytical budget allocation vs actual committed costs and variance.
          </p>
        </div>
        <button
          onClick={loadData}
          className="btn-primary text-xs px-3.5 py-1.5 flex items-center gap-1.5"
        >
          <RefreshIcon className="h-4 w-4" /> Refresh Budgets
        </button>
      </div>

      {loading ? (
        <div className="mt-8 card-mono py-20 text-center text-xs text-[var(--text-muted)]">
          Loading budget reports...
        </div>
      ) : budgets.length === 0 ? (
        <div className="mt-8 card-mono py-20 text-center text-xs text-[var(--text-muted)]">
          No budget allocations configured.
        </div>
      ) : (
        <div className="mt-8 space-y-6">
          {budgets.map((b) => {
            const limit = b.lines?.reduce((s: number, l: any) => s + (l.committed || 0), 0) || 0;
            const actual = b.actual || 0;
            const variance = limit - actual;
            const percentage = limit > 0 ? Math.min(100, Math.round((actual / limit) * 100)) : 0;

            return (
              <div key={b.id} className="card-mono p-6">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b border-[var(--border-color)] pb-4">
                  <div>
                    <h2 className="text-lg font-bold text-[var(--text-main)]">{b.name}</h2>
                    <p className="text-xs text-[var(--text-muted)]">
                      Period: {new Date(b.start).toLocaleDateString()} — {new Date(b.end).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 text-xs">
                    <span className="font-semibold text-[var(--text-main)]">
                      Utilization: {percentage}%
                    </span>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="mt-4">
                  <div className="h-3 w-full rounded-full bg-[var(--border-color)] overflow-hidden">
                    <div
                      className={`h-full transition-all duration-500 ${
                        variance < 0 ? "bg-red-500" : "bg-[var(--text-main)]"
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
                    <div className="text-base font-extrabold text-[var(--text-main)] mt-1">
                      {formatCurrency(limit)}
                    </div>
                  </div>
                  <div>
                    <div className="text-[var(--text-muted)] uppercase tracking-wider font-semibold text-[10px]">
                      Actual Posted Expenses
                    </div>
                    <div className="text-base font-extrabold text-[var(--text-main)] mt-1">
                      {formatCurrency(actual)}
                    </div>
                  </div>
                  <div>
                    <div className="text-[var(--text-muted)] uppercase tracking-wider font-semibold text-[10px]">
                      Available Variance
                    </div>
                    <div
                      className={`text-base font-extrabold mt-1 ${
                        variance < 0 ? "text-red-500" : "text-[var(--text-main)]"
                      }`}
                    >
                      {formatCurrency(variance)}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </main>
  );
}
