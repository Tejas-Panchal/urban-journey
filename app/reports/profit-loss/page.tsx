"use client";
import React, { useEffect, useState } from "react";
import { PrinterIcon, RefreshIcon, TrendingUpIcon } from "@/components/Icons";

export default function ProfitLossReportPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [fromDate, setFromDate] = useState<string>("");
  const [toDate, setToDate] = useState<string>("");
  const [printDate, setPrintDate] = useState<string>("");

  const loadData = async (from?: string, to?: string) => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams();
      if (from) queryParams.set("from", from);
      if (to) queryParams.set("to", to);

      const res = await fetch(`/api/reports/profit-loss?${queryParams.toString()}`)
        .then((r) => r.json().catch(() => ({})))
        .catch(() => ({}));
      setData(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    setPrintDate(
      new Date().toLocaleString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      })
    );
  }, []);

  const handleApplyFilter = () => {
    loadData(fromDate, toDate);
  };

  const handlePresetFilter = (preset: "thisMonth" | "thisQuarter" | "thisYear" | "allTime") => {
    const now = new Date();
    if (preset === "allTime") {
      setFromDate("");
      setToDate("");
      loadData("", "");
      return;
    }

    let start = new Date();
    let end = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    if (preset === "thisMonth") {
      start = new Date(now.getFullYear(), now.getMonth(), 1);
    } else if (preset === "thisQuarter") {
      const qMonth = Math.floor(now.getMonth() / 3) * 3;
      start = new Date(now.getFullYear(), qMonth, 1);
      end = new Date(now.getFullYear(), qMonth + 3, 0);
    } else if (preset === "thisYear") {
      start = new Date(now.getFullYear(), 0, 1);
      end = new Date(now.getFullYear(), 11, 31);
    }

    const startStr = start.toISOString().slice(0, 10);
    const endStr = end.toISOString().slice(0, 10);

    setFromDate(startStr);
    setToDate(endStr);
    loadData(startStr, endStr);
  };

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 2,
    }).format(val);

  const totalIncome = data?.income ?? 0;
  const purchaseExpense = data?.purchaseExpense ?? 0;
  const otherExpense = data?.otherExpense ?? 0;
  const totalExpense = data?.totalExpense ?? purchaseExpense + otherExpense;
  const netOperatingIncome = data?.net ?? totalIncome - totalExpense;
  const isProfitable = netOperatingIncome >= 0;

  const profitMarginPct =
    totalIncome > 0
      ? Math.round((netOperatingIncome / totalIncome) * 1000) / 10
      : 0;

  const todayStr = new Date().toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  const periodLabel =
    fromDate || toDate
      ? `${fromDate ? new Date(fromDate).toLocaleDateString("en-IN") : "Beginning"} — ${
          toDate ? new Date(toDate).toLocaleDateString("en-IN") : "Present"
        }`
      : `For Period Ending ${todayStr}`;

  return (
    <main className="mx-auto max-w-6xl px-6 py-8 print:p-0 print:max-w-none">
      {/* Screen Header (Hidden on Print) */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between border-b border-[var(--border-color)] pb-6 print:hidden">
        <div>
          <div className="flex items-center gap-2">
            <TrendingUpIcon className="h-6 w-6 text-[var(--text-main)]" />
            <h1 className="text-2xl font-black tracking-tight text-[var(--text-main)]">
              Profit & Loss Statement
            </h1>
          </div>
          <p className="text-xs text-[var(--text-muted)] mt-1 font-medium">
            Income Statement • Operating Revenue, Cost of Goods & Net Income
          </p>
        </div>
        <div className="flex items-center gap-3 print:hidden no-print">
          <button
            onClick={() => window.print()}
            className="btn-outline text-xs px-3.5 py-1.5 flex items-center gap-1.5 hover:bg-slate-100 dark:hover:bg-zinc-800 print:hidden no-print"
          >
            <PrinterIcon className="h-4 w-4" /> Print / Export PDF
          </button>
          <button
            onClick={() => loadData(fromDate, toDate)}
            className="btn-primary text-xs px-3.5 py-1.5 flex items-center gap-1.5 print:hidden no-print"
          >
            <RefreshIcon className="h-4 w-4" /> Recalculate
          </button>
        </div>
      </div>

      {/* Date Filter Bar (Hidden on Print) */}
      <div className="mt-6 card-mono p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 print:hidden no-print bg-[var(--badge-bg)]/40">
        <div className="flex flex-wrap items-center gap-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-[var(--text-muted)] uppercase text-[10px]">From:</span>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="rounded border border-[var(--border-color)] bg-[var(--card-bg)] px-2.5 py-1.5 text-xs text-[var(--text-main)] outline-none"
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-[var(--text-muted)] uppercase text-[10px]">To:</span>
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="rounded border border-[var(--border-color)] bg-[var(--card-bg)] px-2.5 py-1.5 text-xs text-[var(--text-main)] outline-none"
            />
          </div>
          <button
            onClick={handleApplyFilter}
            className="btn-primary text-xs px-3 py-1.5"
          >
            Apply Period
          </button>
        </div>

        {/* Quick Presets */}
        <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
          <button
            onClick={() => handlePresetFilter("thisMonth")}
            className="btn-outline px-2.5 py-1 text-[11px]"
          >
            This Month
          </button>
          <button
            onClick={() => handlePresetFilter("thisQuarter")}
            className="btn-outline px-2.5 py-1 text-[11px]"
          >
            This Quarter
          </button>
          <button
            onClick={() => handlePresetFilter("thisYear")}
            className="btn-outline px-2.5 py-1 text-[11px]"
          >
            This Year
          </button>
          <button
            onClick={() => handlePresetFilter("allTime")}
            className="btn-outline px-2.5 py-1 text-[11px]"
          >
            All Time
          </button>
        </div>
      </div>

      {/* Official Print Header (Visible ONLY on Print) */}
      <div className="hidden print:block border-b-2 border-black pb-4 mb-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-xl font-black tracking-wider uppercase text-black">
              URBAN JOURNEY ENTERPRISES
            </h1>
            <p className="text-xs text-gray-700 font-semibold tracking-wide uppercase mt-0.5">
              Financial Accounting System • Profit & Loss Statement (Income Statement)
            </p>
          </div>
          <div className="text-right text-[11px] text-gray-700">
            <div><span className="font-bold">Period:</span> {periodLabel}</div>
            <div><span className="font-bold">Printed:</span> {printDate}</div>
            <div><span className="font-bold">Currency:</span> INR (₹)</div>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="mt-8 card-mono py-20 text-center text-xs text-[var(--text-muted)] print:border-none print:py-8">
          Generating Income Statement...
        </div>
      ) : !data ? (
        <div className="mt-8 card-mono py-20 text-center text-xs text-red-500 font-medium">
          Failed to load Profit & Loss report.
        </div>
      ) : (
        <div className="mt-8 print:mt-0 space-y-6">
          {/* TOP KPI METRICS SUMMARY CARDS */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 print:hidden">
            <div className="card-mono p-4 bg-emerald-500/5 border-emerald-500/20">
              <div className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                Gross Operating Revenue
              </div>
              <div className="text-xl font-black font-mono mt-1 text-[var(--text-main)]">
                {formatCurrency(totalIncome)}
              </div>
              <div className="text-[11px] text-[var(--text-muted)] mt-1 font-medium">
                Invoiced sales & operating income
              </div>
            </div>

            <div className="card-mono p-4 bg-slate-500/5 border-slate-500/20">
              <div className="text-[10px] font-extrabold uppercase tracking-wider text-[var(--text-muted)]">
                Total Operating Expenses
              </div>
              <div className="text-xl font-black font-mono mt-1 text-[var(--text-main)]">
                {formatCurrency(totalExpense)}
              </div>
              <div className="text-[11px] text-[var(--text-muted)] mt-1 font-medium">
                Vendor bills & operating costs
              </div>
            </div>

            <div
              className={`card-mono p-4 ${
                isProfitable
                  ? "bg-emerald-500/10 border-emerald-500/30"
                  : "bg-red-500/10 border-red-500/30"
              }`}
            >
              <div
                className={`text-[10px] font-extrabold uppercase tracking-wider ${
                  isProfitable ? "text-emerald-700 dark:text-emerald-400" : "text-red-700 dark:text-red-400"
                }`}
              >
                Net Profit Margin %
              </div>
              <div className="text-xl font-black font-mono mt-1 text-[var(--text-main)]">
                {profitMarginPct}%
              </div>
              <div
                className={`text-[11px] font-bold mt-1 ${
                  isProfitable ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"
                }`}
              >
                {isProfitable ? "✓ Profitable Operation" : "⚠ Net Operating Loss"}
              </div>
            </div>
          </div>

          {/* DUAL COLUMN INCOME VS EXPENSES STATEMENT */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch print:grid-cols-2 print:gap-4">
            {/* LEFT COLUMN: REVENUE / INCOME */}
            <div className="card-mono overflow-hidden flex flex-col justify-between print:border print:border-gray-400 print:rounded-none print:break-inside-avoid">
              <div>
                <div className="bg-[var(--badge-bg)] border-b border-[var(--border-color)] p-4 flex justify-between items-center print:bg-gray-100 print:border-gray-400 print:p-3">
                  <h2 className="text-sm font-black uppercase tracking-wider text-[var(--text-main)] print:text-black">
                    OPERATING REVENUE (INCOME)
                  </h2>
                  <span className="text-[11px] text-[var(--text-muted)] font-semibold print:text-gray-700">
                    Gross Invoiced Sales
                  </span>
                </div>

                <div className="p-4 space-y-3 text-xs print:p-3 print:space-y-2">
                  {(data?.incomeItems || [
                    { name: "Invoiced Sales Revenue", code: "INC-4001", amount: totalIncome },
                  ]).map((item: any, idx: number) => (
                    <div key={idx} className="flex justify-between py-2 border-b border-[var(--border-color)]/50 print:border-gray-200">
                      <span className="font-medium text-[var(--text-main)] print:text-black">
                        {item.name}
                      </span>
                      <span className="font-bold font-mono tabular-nums text-[var(--text-main)] print:text-black">
                        {formatCurrency(item.amount)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* TOTAL REVENUE FOOTER */}
              <div className="bg-[var(--badge-bg)] border-t-2 border-[var(--text-main)] p-4 flex justify-between items-center text-sm font-extrabold text-[var(--text-main)] print:bg-gray-100 print:border-t-2 print:border-b-4 print:border-double print:border-black print:text-black print:p-3">
                <span>TOTAL OPERATING REVENUE</span>
                <span className="font-mono tabular-nums">{formatCurrency(totalIncome)}</span>
              </div>
            </div>

            {/* RIGHT COLUMN: OPERATING EXPENSES */}
            <div className="card-mono overflow-hidden flex flex-col justify-between print:border print:border-gray-400 print:rounded-none print:break-inside-avoid">
              <div>
                <div className="bg-[var(--badge-bg)] border-b border-[var(--border-color)] p-4 flex justify-between items-center print:bg-gray-100 print:border-gray-400 print:p-3">
                  <h2 className="text-sm font-black uppercase tracking-wider text-[var(--text-main)] print:text-black">
                    OPERATING EXPENSES
                  </h2>
                  <span className="text-[11px] text-[var(--text-muted)] font-semibold print:text-gray-700">
                    Cost of Goods & Purchases
                  </span>
                </div>

                <div className="p-4 space-y-3 text-xs print:p-3 print:space-y-2">
                  <div className="flex justify-between py-2 border-b border-[var(--border-color)]/50 print:border-gray-200">
                    <span className="font-medium text-[var(--text-main)] print:text-black">
                      Vendor Purchase Expenses (COGS)
                    </span>
                    <span className="font-bold font-mono tabular-nums text-[var(--text-main)] print:text-black">
                      {formatCurrency(purchaseExpense)}
                    </span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-[var(--border-color)]/50 print:border-gray-200">
                    <span className="font-medium text-[var(--text-main)] print:text-black">
                      Other Operating Expenses
                    </span>
                    <span className="font-bold font-mono tabular-nums text-[var(--text-main)] print:text-black">
                      {formatCurrency(otherExpense)}
                    </span>
                  </div>
                </div>
              </div>

              {/* TOTAL EXPENSES FOOTER */}
              <div className="bg-[var(--badge-bg)] border-t-2 border-[var(--text-main)] p-4 flex justify-between items-center text-sm font-extrabold text-[var(--text-main)] print:bg-gray-100 print:border-t-2 print:border-b-4 print:border-double print:border-black print:text-black print:p-3">
                <span>TOTAL OPERATING EXPENSES</span>
                <span className="font-mono tabular-nums">{formatCurrency(totalExpense)}</span>
              </div>
            </div>
          </div>

          {/* NET OPERATING INCOME BANNER (Fixed Contrast Bug) */}
          <div
            className={`mt-6 card-mono p-5 rounded-xl flex flex-col sm:flex-row justify-between items-center transition-colors print:break-inside-avoid print:bg-white print:border print:border-black print:text-black ${
              isProfitable
                ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-300 print:border-black print:text-black"
                : "bg-red-500/10 border-red-500/30 text-red-700 dark:text-red-300 print:border-black print:text-black"
            }`}
          >
            <div>
              <div className="text-xs uppercase tracking-widest font-extrabold opacity-90">
                NET OPERATING INCOME / (LOSS)
              </div>
              <div className="text-2xl font-black font-mono tracking-tight mt-1">
                {formatCurrency(netOperatingIncome)}
              </div>
            </div>

            <div className="mt-3 sm:mt-0 text-right flex flex-col items-end gap-1">
              <span
                className={`text-xs font-extrabold px-3 py-1 rounded-full border uppercase ${
                  isProfitable
                    ? "border-emerald-600 text-emerald-700 dark:text-emerald-300 print:border-black print:text-black"
                    : "border-red-600 text-red-700 dark:text-red-300 print:border-black print:text-black"
                }`}
              >
                {isProfitable ? "PROFITABLE OPERATION" : "NET OPERATING LOSS"}
              </span>
              <span className="text-xs font-mono opacity-90 mt-1">
                Revenue ({formatCurrency(totalIncome)}) − Expenses ({formatCurrency(totalExpense)})
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Official Print Footer (Visible ONLY on Print) */}
      <div className="hidden print:flex justify-between items-center text-[10px] text-gray-500 pt-4 border-t border-gray-300 mt-8">
        <div>Urban Journey ERP • Financial Accounting System</div>
        <div>Confidential Income Statement</div>
        <div>Page 1 of 1</div>
      </div>
    </main>
  );
}
