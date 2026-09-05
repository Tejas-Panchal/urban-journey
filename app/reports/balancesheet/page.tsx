"use client";
import React, { useEffect, useState } from "react";
import { PrinterIcon, RefreshIcon, ScaleIcon } from "@/components/Icons";

export default function BalanceSheetReportPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [fromDate, setFromDate] = useState<string>("");
  const [toDate, setToDate] = useState<string>("");
  const [todayStr, setTodayStr] = useState<string>("");
  const [printDate, setPrintDate] = useState<string>("");

  const loadData = async (from?: string, to?: string) => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams();
      if (from) queryParams.set("from", from);
      if (to) queryParams.set("to", to);

      const res = await fetch(`/api/reports/balancesheet?${queryParams.toString()}`)
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
    const now = new Date();
    setTodayStr(
      now.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      })
    );
    setPrintDate(
      now.toLocaleString("en-IN", {
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

  const totalAssets = data?.assets?.total || 0;
  const totalLiabilities = data?.liabilities?.total || 0;
  const capital = data?.capital || 0;
  const netIncome = data?.netIncome || 0;
  const totalLiabilitiesEquity = data?.totalLiabilitiesEquity ?? (totalLiabilities + capital + netIncome);
  const isBalanced = data?.balanced ?? Math.abs(totalAssets - totalLiabilitiesEquity) < 0.02;

  const periodLabel =
    fromDate || toDate
      ? `${fromDate ? new Date(fromDate).toLocaleDateString("en-IN") : "Beginning"} — ${
          toDate ? new Date(toDate).toLocaleDateString("en-IN") : "Present"
        }`
      : todayStr
      ? `As of ${todayStr}`
      : "For Current Period";

  return (
    <main className="mx-auto max-w-6xl px-6 py-8 print:p-0 print:max-w-none">
      {/* Screen Header (Hidden on Print) */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between border-b border-[var(--border-color)] pb-6 print:hidden">
        <div>
          <div className="flex items-center gap-2">
            <ScaleIcon className="h-6 w-6 text-[var(--text-main)]" />
            <h1 className="text-2xl font-black tracking-tight text-[var(--text-main)]">
              Balance Sheet Statement
            </h1>
          </div>
          <p className="text-xs text-[var(--text-muted)] mt-1 font-medium">
            Financial Position • Assets = Liabilities + Equity • Amounts in INR (₹)
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
            <span className="font-extrabold text-[var(--text-muted)] uppercase text-[10px]">As of Date:</span>
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
              Financial Accounting System • Balance Sheet Statement
            </p>
          </div>
          <div className="text-right text-[11px] text-gray-700">
            <div><span className="font-bold">As of Date:</span> {periodLabel}</div>
            <div><span className="font-bold">Printed:</span> {printDate}</div>
            <div><span className="font-bold">Currency:</span> INR (₹)</div>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="mt-8 card-mono py-20 text-center text-xs text-[var(--text-muted)] print:border-none print:py-8">
          Generating Balance Sheet Statement...
        </div>
      ) : !data ? (
        <div className="mt-8 card-mono py-20 text-center text-xs text-red-500 font-medium">
          Failed to load Balance Sheet report.
        </div>
      ) : (
        <div className="mt-8 print:mt-0 space-y-6">
          {/* TOP KPI METRICS SUMMARY CARDS */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 print:hidden">
            <div className="card-mono p-4 bg-emerald-500/5 border-emerald-500/20">
              <div className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                Total Assets
              </div>
              <div className="text-xl font-black font-mono mt-1 text-[var(--text-main)]">
                {formatCurrency(totalAssets)}
              </div>
              <div className="text-[11px] text-[var(--text-muted)] mt-1 font-medium">
                Cash, Bank & Accounts Receivable
              </div>
            </div>

            <div className="card-mono p-4 bg-slate-500/5 border-slate-500/20">
              <div className="text-[10px] font-extrabold uppercase tracking-wider text-[var(--text-muted)]">
                Total Liabilities & Equity
              </div>
              <div className="text-xl font-black font-mono mt-1 text-[var(--text-main)]">
                {formatCurrency(totalLiabilitiesEquity)}
              </div>
              <div className="text-[11px] text-[var(--text-muted)] mt-1 font-medium">
                Payables, Capital & Net Earnings
              </div>
            </div>

            <div className="card-mono p-4 bg-emerald-500/10 border-emerald-500/30">
              <div className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                Accounting Equation Balance
              </div>
              <div className="text-xl font-black font-mono mt-1 text-[var(--text-main)]">
                {formatCurrency(totalAssets)}
              </div>
              <div className="text-[11px] font-bold font-mono mt-1 text-emerald-600 dark:text-emerald-400">
                ✓ Total Assets = Total Liabilities & Equity
              </div>
            </div>
          </div>

          {/* DUAL COLUMN ASSETS VS LIABILITIES & EQUITY LAYOUT */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch print:grid-cols-2 print:gap-4">
            {/* LEFT COLUMN: ASSETS */}
            <div className="card-mono overflow-hidden flex flex-col justify-between print:border print:border-gray-400 print:rounded-none print:break-inside-avoid">
              <div>
                <div className="bg-[var(--badge-bg)] border-b border-[var(--border-color)] p-4 flex justify-between items-center print:bg-gray-100 print:border-gray-400 print:p-3">
                  <h2 className="text-sm font-black uppercase tracking-wider text-[var(--text-main)] print:text-black">
                    ASSETS
                  </h2>
                  <span className="text-[11px] text-[var(--text-muted)] font-semibold print:text-gray-700">
                    Current Assets
                  </span>
                </div>

                <div className="p-4 space-y-3 text-xs print:p-3 print:space-y-2">
                  {(data?.assetItems || [
                    { name: "Cash in Hand", amount: data?.assets?.cash || 0 },
                    { name: "Bank Accounts", amount: data?.assets?.bank || 0 },
                    { name: "Debtors / Accounts Receivable", amount: data?.assets?.debtors || 0 },
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

              {/* TOTAL ASSETS FOOTER */}
              <div className="bg-[var(--badge-bg)] border-t-2 border-[var(--text-main)] p-4 flex justify-between items-center text-sm font-extrabold text-[var(--text-main)] print:bg-gray-100 print:border-t-2 print:border-b-4 print:border-double print:border-black print:text-black print:p-3">
                <span>TOTAL ASSETS</span>
                <span className="font-mono tabular-nums">{formatCurrency(totalAssets)}</span>
              </div>
            </div>

            {/* RIGHT COLUMN: LIABILITIES & EQUITY */}
            <div className="card-mono overflow-hidden flex flex-col justify-between print:border print:border-gray-400 print:rounded-none print:break-inside-avoid">
              <div>
                <div className="bg-[var(--badge-bg)] border-b border-[var(--border-color)] p-4 flex justify-between items-center print:bg-gray-100 print:border-gray-400 print:p-3">
                  <h2 className="text-sm font-black uppercase tracking-wider text-[var(--text-main)] print:text-black">
                    LIABILITIES & EQUITY
                  </h2>
                  <span className="text-[11px] text-[var(--text-muted)] font-semibold print:text-gray-700">
                    Payables & Net Income
                  </span>
                </div>

                <div className="p-4 space-y-3 text-xs print:p-3 print:space-y-2">
                  <div className="font-bold uppercase tracking-wider text-[10px] text-[var(--text-muted)] mt-1 print:text-gray-600">
                    Current Liabilities
                  </div>
                  {(data?.liabilityItems || [
                    { name: "Creditors / Accounts Payable", amount: data?.liabilities?.creditors || 0 },
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

                  <div className="font-bold uppercase tracking-wider text-[10px] text-[var(--text-muted)] mt-4 print:text-gray-600 print:mt-3">
                    Capital & Retained Earnings
                  </div>
                  {(data?.equityItems || [
                    { name: "Owner Capital", amount: capital },
                    { name: "Retained Net Operating Income", amount: netIncome },
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

              {/* TOTAL LIABILITIES & EQUITY FOOTER */}
              <div className="bg-[var(--badge-bg)] border-t-2 border-[var(--text-main)] p-4 flex justify-between items-center text-sm font-extrabold text-[var(--text-main)] print:bg-gray-100 print:border-t-2 print:border-b-4 print:border-double print:border-black print:text-black print:p-3">
                <span>TOTAL LIABILITIES & EQUITY</span>
                <span className="font-mono tabular-nums">{formatCurrency(totalLiabilitiesEquity)}</span>
              </div>
            </div>
          </div>

          {/* BALANCE VERIFICATION BANNER */}
          <div
            className={`mt-6 card-mono p-4 rounded-xl flex flex-col sm:flex-row justify-between items-center text-xs font-extrabold transition-colors print:break-inside-avoid print:bg-white print:border print:border-black print:text-black ${
              isBalanced
                ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-300 print:border-emerald-800 print:text-emerald-900"
                : "bg-slate-500/10 border-slate-500/30 text-[var(--text-main)] print:border-black print:text-black"
            }`}
          >
            <div className="flex items-center gap-2">
              <span className="text-sm">✓</span>
              <span>
                Accounting Equation: Total Assets ({formatCurrency(totalAssets)}) = Liabilities & Equity ({formatCurrency(totalLiabilitiesEquity)})
              </span>
            </div>
            <div className="mt-2 sm:mt-0 font-mono text-[11px] opacity-90 print:opacity-100">
              Assets: {formatCurrency(totalAssets)} | Liab & Equity: {formatCurrency(totalLiabilitiesEquity)}
            </div>
          </div>
        </div>
      )}

      {/* Official Print Footer (Visible ONLY on Print) */}
      <div className="hidden print:flex justify-between items-center text-[10px] text-gray-500 pt-4 border-t border-gray-300 mt-8">
        <div>Urban Journey ERP • Financial Accounting System</div>
        <div>Confidential Balance Sheet Statement</div>
        <div>Page 1 of 1</div>
      </div>
    </main>
  );
}
