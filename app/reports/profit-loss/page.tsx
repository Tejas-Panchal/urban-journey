"use client";
import React, { useEffect, useState } from "react";
import { PrinterIcon, RefreshIcon, TrendingUpIcon } from "@/components/Icons";

export default function ProfitLossReportPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/reports/profit-loss").then((r) => r.json());
      setData(res);
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

  const totalIncome = data?.income ?? 0;
  const purchaseExpense = data?.purchaseExpense ?? 0;
  const otherExpense = data?.otherExpense ?? 0;
  const totalExpense = data?.totalExpense ?? (purchaseExpense + otherExpense);
  const netOperatingIncome = data?.net ?? (totalIncome - totalExpense);
  const isProfitable = netOperatingIncome >= 0;

  return (
    <main className="mx-auto max-w-6xl px-6 py-8">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between border-b border-[var(--border-color)] pb-6">
        <div>
          <div className="flex items-center gap-2">
            <TrendingUpIcon className="h-6 w-6 text-[var(--text-main)]" />
            <h1 className="text-2xl font-black tracking-tight text-[var(--text-main)]">
              Profit & Loss Statement (Income Statement)
            </h1>
          </div>
          <p className="mt-1 text-xs text-[var(--text-muted)]">
            Statement of Earnings: Net Operating Income = Total Revenue − Total Expenses
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => window.print()}
            className="btn-outline text-xs px-3.5 py-1.5 flex items-center gap-1.5"
          >
            <PrinterIcon className="h-4 w-4" /> Print P&L
          </button>
          <button
            onClick={loadData}
            className="btn-primary text-xs px-3.5 py-1.5 flex items-center gap-1.5"
          >
            <RefreshIcon className="h-4 w-4" /> Recalculate
          </button>
        </div>
      </div>

      {loading ? (
        <div className="mt-8 card-mono py-20 text-center text-xs text-[var(--text-muted)]">
          Generating Income Statement...
        </div>
      ) : !data ? (
        <div className="mt-8 card-mono py-20 text-center text-xs text-red-500 font-medium">
          Failed to load Profit & Loss report.
        </div>
      ) : (
        <div className="mt-8">
          {/* Dual Column Income vs Expense Layout */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
            {/* LEFT COLUMN: REVENUE / INCOME */}
            <div className="card-mono overflow-hidden flex flex-col justify-between">
              <div>
                <div className="bg-[var(--badge-bg)] border-b border-[var(--border-color)] p-4 flex justify-between items-center">
                  <h2 className="text-sm font-black uppercase tracking-wider text-[var(--text-main)]">
                    OPERATING REVENUE (INCOME)
                  </h2>
                  <span className="text-[11px] text-[var(--text-muted)] font-semibold">Gross Sales</span>
                </div>

                <div className="p-4 space-y-3 text-xs">
                  <div className="flex justify-between py-2 border-b border-[var(--border-color)]/50">
                    <span className="font-medium text-[var(--text-main)]">Gross Invoiced Sales Revenue</span>
                    <span className="font-bold text-[var(--text-main)]">
                      {formatCurrency(totalIncome)}
                    </span>
                  </div>
                  {data?.incomeBreakdown?.sales !== undefined && (
                    <div className="flex justify-between py-2 border-b border-[var(--border-color)]/50 text-[var(--text-muted)]">
                      <span>• Sales Account Ledger</span>
                      <span className="font-semibold">{formatCurrency(data.incomeBreakdown.sales)}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* TOTAL REVENUE FOOTER */}
              <div className="bg-[var(--badge-bg)] border-t-2 border-[var(--text-main)] p-4 flex justify-between items-center text-sm font-extrabold text-[var(--text-main)]">
                <span>TOTAL OPERATING REVENUE</span>
                <span>{formatCurrency(totalIncome)}</span>
              </div>
            </div>

            {/* RIGHT COLUMN: OPERATING EXPENSES */}
            <div className="card-mono overflow-hidden flex flex-col justify-between">
              <div>
                <div className="bg-[var(--badge-bg)] border-b border-[var(--border-color)] p-4 flex justify-between items-center">
                  <h2 className="text-sm font-black uppercase tracking-wider text-[var(--text-main)]">
                    OPERATING EXPENSES
                  </h2>
                  <span className="text-[11px] text-[var(--text-muted)] font-semibold">Vendor & Cost of Goods</span>
                </div>

                <div className="p-4 space-y-3 text-xs">
                  <div className="flex justify-between py-2 border-b border-[var(--border-color)]/50">
                    <span className="font-medium text-[var(--text-main)]">Vendor Purchase Expenses</span>
                    <span className="font-bold text-[var(--text-main)]">
                      {formatCurrency(purchaseExpense)}
                    </span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-[var(--border-color)]/50">
                    <span className="font-medium text-[var(--text-main)]">Other Operating Expenses</span>
                    <span className="font-bold text-[var(--text-main)]">
                      {formatCurrency(otherExpense)}
                    </span>
                  </div>
                </div>
              </div>

              {/* TOTAL EXPENSES FOOTER */}
              <div className="bg-[var(--badge-bg)] border-t-2 border-[var(--text-main)] p-4 flex justify-between items-center text-sm font-extrabold text-[var(--text-main)]">
                <span>TOTAL OPERATING EXPENSES</span>
                <span>{formatCurrency(totalExpense)}</span>
              </div>
            </div>
          </div>

          {/* NET OPERATING INCOME BANNER */}
          <div
            className={`mt-6 card-mono p-6 flex flex-col sm:flex-row justify-between items-center rounded-xl transition-colors ${
              isProfitable
                ? "bg-[var(--text-main)] text-[var(--bg-primary)]"
                : "bg-red-600 text-white"
            }`}
          >
            <div>
              <div className="text-xs uppercase tracking-widest font-extrabold opacity-80">
                NET OPERATING INCOME / (LOSS)
              </div>
              <div className="text-2xl font-black tracking-tight mt-1">
                {formatCurrency(netOperatingIncome)}
              </div>
            </div>

            <div className="mt-3 sm:mt-0 text-right flex flex-col items-end gap-1">
              <span className="text-xs font-extrabold px-3 py-1 rounded-full border border-current uppercase">
                {isProfitable ? "PROFITABLE OPERATION" : "NET OPERATING LOSS"}
              </span>
              <span className="text-xs font-mono opacity-90 mt-1">
                Revenue ({formatCurrency(totalIncome)}) − Expenses ({formatCurrency(totalExpense)})
              </span>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
