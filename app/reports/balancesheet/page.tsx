"use client";
import React, { useEffect, useState } from "react";
import { PrinterIcon, RefreshIcon, ScaleIcon } from "@/components/Icons";

export default function BalanceSheetReportPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/reports/balancesheet").then((r) => r.json());
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

  const totalAssets = data?.assets?.total || 0;
  const totalLiabilities = data?.liabilities?.total || 0;
  const capital = data?.capital || 0;
  const netIncome = data?.netIncome || 0;
  const totalLiabilitiesEquity = totalLiabilities + capital + netIncome;
  const isBalanced = data?.balanced ?? Math.abs(totalAssets - totalLiabilitiesEquity) < 0.02;

  return (
    <main className="mx-auto max-w-6xl px-6 py-8">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between border-b border-[var(--border-color)] pb-6">
        <div>
          <div className="flex items-center gap-2">
            <ScaleIcon className="h-6 w-6 text-[var(--text-main)]" />
            <h1 className="text-2xl font-black tracking-tight text-[var(--text-main)]">
              Balance Sheet Statement
            </h1>
          </div>
          <p className="mt-1 text-xs text-[var(--text-muted)]">
            Statement of Financial Position: Assets = Liabilities + Equity
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => window.print()}
            className="btn-outline text-xs px-3.5 py-1.5 flex items-center gap-1.5"
          >
            <PrinterIcon className="h-4 w-4" /> Print Report
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
          Generating Balance Sheet...
        </div>
      ) : !data ? (
        <div className="mt-8 card-mono py-20 text-center text-xs text-red-500 font-medium">
          Failed to load Balance Sheet.
        </div>
      ) : (
        <div className="mt-8">
          {/* Dual Column Balanced Layout */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
            {/* LEFT COLUMN: ASSETS */}
            <div className="card-mono overflow-hidden flex flex-col justify-between">
              <div>
                <div className="bg-[var(--badge-bg)] border-b border-[var(--border-color)] p-4 flex justify-between items-center">
                  <h2 className="text-sm font-black uppercase tracking-wider text-[var(--text-main)]">
                    ASSETS
                  </h2>
                  <span className="text-[11px] text-[var(--text-muted)] font-semibold">Current Assets</span>
                </div>

                <div className="p-4 space-y-3 text-xs">
                  <div className="flex justify-between py-2 border-b border-[var(--border-color)]/50">
                    <span className="font-medium text-[var(--text-main)]">Cash in Hand</span>
                    <span className="font-bold text-[var(--text-main)]">
                      {formatCurrency(data.assets?.cash || 0)}
                    </span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-[var(--border-color)]/50">
                    <span className="font-medium text-[var(--text-main)]">Bank Accounts</span>
                    <span className="font-bold text-[var(--text-main)]">
                      {formatCurrency(data.assets?.bank || 0)}
                    </span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-[var(--border-color)]/50">
                    <span className="font-medium text-[var(--text-main)]">Debtors / Accounts Receivable</span>
                    <span className="font-bold text-[var(--text-main)]">
                      {formatCurrency(data.assets?.debtors || 0)}
                    </span>
                  </div>
                </div>
              </div>

              {/* TOTAL ASSETS FOOTER */}
              <div className="bg-[var(--badge-bg)] border-t-2 border-[var(--text-main)] p-4 flex justify-between items-center text-sm font-extrabold text-[var(--text-main)]">
                <span>TOTAL ASSETS</span>
                <span>{formatCurrency(totalAssets)}</span>
              </div>
            </div>

            {/* RIGHT COLUMN: LIABILITIES & EQUITY */}
            <div className="card-mono overflow-hidden flex flex-col justify-between">
              <div>
                <div className="bg-[var(--badge-bg)] border-b border-[var(--border-color)] p-4 flex justify-between items-center">
                  <h2 className="text-sm font-black uppercase tracking-wider text-[var(--text-main)]">
                    LIABILITIES & EQUITY
                  </h2>
                  <span className="text-[11px] text-[var(--text-muted)] font-semibold">Payables & Net Income</span>
                </div>

                <div className="p-4 space-y-3 text-xs">
                  <div className="font-bold uppercase tracking-wider text-[10px] text-[var(--text-muted)] mt-1">
                    Current Liabilities
                  </div>
                  <div className="flex justify-between py-2 border-b border-[var(--border-color)]/50">
                    <span className="font-medium text-[var(--text-main)]">Creditors / Accounts Payable</span>
                    <span className="font-bold text-[var(--text-main)]">
                      {formatCurrency(data.liabilities?.creditors || 0)}
                    </span>
                  </div>

                  <div className="font-bold uppercase tracking-wider text-[10px] text-[var(--text-muted)] mt-4">
                    Capital & Retained Earnings
                  </div>
                  <div className="flex justify-between py-2 border-b border-[var(--border-color)]/50">
                    <span className="font-medium text-[var(--text-main)]">Owner Capital</span>
                    <span className="font-bold text-[var(--text-main)]">
                      {formatCurrency(capital)}
                    </span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-[var(--border-color)]/50">
                    <span className="font-medium text-[var(--text-main)]">Retained Net Operating Income</span>
                    <span className="font-bold text-[var(--text-main)]">
                      {formatCurrency(netIncome)}
                    </span>
                  </div>
                </div>
              </div>

              {/* TOTAL LIABILITIES & EQUITY FOOTER */}
              <div className="bg-[var(--badge-bg)] border-t-2 border-[var(--text-main)] p-4 flex justify-between items-center text-sm font-extrabold text-[var(--text-main)]">
                <span>TOTAL LIABILITIES & EQUITY</span>
                <span>{formatCurrency(totalLiabilitiesEquity)}</span>
              </div>
            </div>
          </div>

          {/* BALANCE VERIFICATION BANNER */}
          <div
            className={`mt-6 card-mono p-5 flex flex-col sm:flex-row justify-between items-center text-sm font-extrabold transition-colors ${
              isBalanced
                ? "bg-[var(--text-main)] text-[var(--bg-primary)]"
                : "bg-red-500 text-white"
            }`}
          >
            <div className="flex items-center gap-2">
              <span>
                {isBalanced
                  ? "✓ Accounting Equation Balanced (Assets = Liabilities + Equity)"
                  : "⚠ Balance Sheet Out of Balance"}
              </span>
            </div>
            <div className="mt-2 sm:mt-0 font-mono text-xs opacity-90">
              Assets: {formatCurrency(totalAssets)} = Liab & Equity: {formatCurrency(totalLiabilitiesEquity)}
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
