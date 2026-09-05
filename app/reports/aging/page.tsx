"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { RefreshIcon, PrinterIcon, InboxArrowDownIcon, PaperAirplaneIcon } from "@/components/Icons";

interface AgingPartner {
  partnerName: string;
  current: number;
  d1_30: number;
  d31_60: number;
  d61_90: number;
  d90Plus: number;
  totalDue: number;
}

interface AgingSummary {
  current: number;
  d1_30: number;
  d31_60: number;
  d61_90: number;
  d90Plus: number;
  total: number;
}

export default function AgingReportPage() {
  const router = useRouter();
  const [receivables, setReceivables] = useState<AgingPartner[]>([]);
  const [payables, setPayables] = useState<AgingPartner[]>([]);
  const [arSummary, setArSummary] = useState<AgingSummary | null>(null);
  const [apSummary, setApSummary] = useState<AgingSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"RECEIVABLES" | "PAYABLES">("RECEIVABLES");
  const [todayStr, setTodayStr] = useState<string>("");

  useEffect(() => {
    setTodayStr(new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }));
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/reports/aging").then((r) => r.json());
      setReceivables(res.receivables || []);
      setPayables(res.payables || []);
      setArSummary(res.arSummary || null);
      setApSummary(res.apSummary || null);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(val || 0);

  const activeData = activeTab === "RECEIVABLES" ? receivables : payables;
  const activeSummary = activeTab === "RECEIVABLES" ? arSummary : apSummary;

  return (
    <main className="mx-auto max-w-7xl px-6 py-8">
      {/* PRINT LETTERHEAD */}
      <div className="hidden print:block mb-8 border-b-2 border-slate-900 pb-4 text-center">
        <h1 className="text-2xl font-black text-slate-900 uppercase tracking-widest font-mono">
          URBAN JOURNEY ENTERPRISE
        </h1>
        <h2 className="text-lg font-bold text-slate-700 uppercase mt-1">
          {activeTab === "RECEIVABLES" ? "Accounts Receivable (AR) Aging Summary" : "Accounts Payable (AP) Aging Summary"}
        </h2>
        <p className="text-xs text-slate-600 font-mono mt-1">As of: {todayStr}</p>
      </div>

      {/* HEADER CONTROL BAR */}
      <div className="flex flex-wrap items-center justify-between gap-4 card-mono p-4 mb-6 shadow-md print:hidden">
        <div>
          <h1 className="text-lg font-extrabold text-[var(--text-main)] font-mono">
            AR / AP Aging Breakdown Report
          </h1>
          <p className="text-xs text-[var(--text-muted)] mt-0.5">
            As of: {todayStr || "Loading..."}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => window.print()}
            className="btn-outline px-4 py-2 text-xs font-bold rounded-lg border-2 border-indigo-500/30 text-indigo-600 dark:text-indigo-400 bg-indigo-500/10 hover:bg-indigo-500/20 flex items-center gap-1.5"
          >
            <PrinterIcon className="h-4 w-4" /> Print Report
          </button>
          <button onClick={loadData} className="btn-outline p-2 rounded-lg" title="Refresh">
            <RefreshIcon className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* TAB SELECTOR */}
      <div className="flex items-center gap-2 mb-6 border-b border-[var(--border-color)] pb-2 print:hidden">
        <button
          onClick={() => setActiveTab("RECEIVABLES")}
          className={`px-5 py-2.5 rounded-lg text-xs font-black transition-all flex items-center gap-2 ${
            activeTab === "RECEIVABLES"
              ? "bg-emerald-500/10 text-emerald-600 border-2 border-emerald-500/30 shadow-sm"
              : "btn-outline text-[var(--text-muted)]"
          }`}
        >
          <InboxArrowDownIcon className="h-4 w-4" /> Accounts Receivable (Customers Due)
        </button>

        <button
          onClick={() => setActiveTab("PAYABLES")}
          className={`px-5 py-2.5 rounded-lg text-xs font-black transition-all flex items-center gap-2 ${
            activeTab === "PAYABLES"
              ? "bg-rose-500/10 text-rose-600 border-2 border-rose-500/30 shadow-sm"
              : "btn-outline text-[var(--text-muted)]"
          }`}
        >
          <PaperAirplaneIcon className="h-4 w-4" /> Accounts Payable (Vendors Due)
        </button>
      </div>

      {/* AGING SUMMARY CARDS */}
      {activeSummary && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-6 print:grid-cols-6">
          <div className="card-mono p-3 bg-emerald-500/5 border-emerald-500/20">
            <div className="text-[10px] font-extrabold uppercase text-emerald-700 dark:text-emerald-400">Current (Not Overdue)</div>
            <div className="text-lg font-black font-mono mt-1 text-[var(--text-main)]">
              {formatCurrency(activeSummary.current)}
            </div>
          </div>

          <div className="card-mono p-3 bg-blue-500/5 border-blue-500/20">
            <div className="text-[10px] font-extrabold uppercase text-blue-700 dark:text-blue-400">1–30 Days</div>
            <div className="text-lg font-black font-mono mt-1 text-[var(--text-main)]">
              {formatCurrency(activeSummary.d1_30)}
            </div>
          </div>

          <div className="card-mono p-3 bg-amber-500/5 border-amber-500/20">
            <div className="text-[10px] font-extrabold uppercase text-amber-700 dark:text-amber-400">31–60 Days</div>
            <div className="text-lg font-black font-mono mt-1 text-[var(--text-main)]">
              {formatCurrency(activeSummary.d31_60)}
            </div>
          </div>

          <div className="card-mono p-3 bg-orange-500/5 border-orange-500/20">
            <div className="text-[10px] font-extrabold uppercase text-orange-700 dark:text-orange-400">61–90 Days</div>
            <div className="text-lg font-black font-mono mt-1 text-[var(--text-main)]">
              {formatCurrency(activeSummary.d61_90)}
            </div>
          </div>

          <div className="card-mono p-3 bg-rose-500/5 border-rose-500/20">
            <div className="text-[10px] font-extrabold uppercase text-rose-700 dark:text-rose-400">90+ Days</div>
            <div className="text-lg font-black font-mono mt-1 text-[var(--text-main)]">
              {formatCurrency(activeSummary.d90Plus)}
            </div>
          </div>

          <div className="card-mono p-3 bg-purple-500/10 border-purple-500/30">
            <div className="text-[10px] font-extrabold uppercase text-purple-700 dark:text-purple-400">Total Outstanding</div>
            <div className="text-lg font-black font-mono mt-1 text-[var(--text-main)]">
              {formatCurrency(activeSummary.total)}
            </div>
          </div>
        </div>
      )}

      {/* AGING DATA TABLE */}
      <div className="card-mono shadow-2xl overflow-hidden">
        <div className="p-4 border-b border-[var(--border-color)] bg-[var(--badge-bg)] flex justify-between items-center">
          <h2 className="text-base font-black text-[var(--text-main)]">
            {activeTab === "RECEIVABLES" ? "Customer Receivables Aging Schedule" : "Vendor Payables Aging Schedule"}
          </h2>
          <span className="text-xs font-bold font-mono text-[var(--text-muted)]">
            {activeData.length} Partners
          </span>
        </div>

        <div className="overflow-x-auto">
          {loading ? (
            <div className="py-16 text-center text-xs text-[var(--text-muted)]">Loading aging breakdown report...</div>
          ) : activeData.length === 0 ? (
            <div className="py-16 text-center text-xs text-[var(--text-muted)]">No outstanding aging balances recorded.</div>
          ) : (
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-[var(--border-color)] bg-[var(--card-bg)] text-[var(--text-muted)] font-extrabold uppercase tracking-wider text-[10px]">
                  <th className="py-3.5 px-4">Partner Name</th>
                  <th className="py-3.5 px-4 text-right">Current</th>
                  <th className="py-3.5 px-4 text-right">1–30 Days</th>
                  <th className="py-3.5 px-4 text-right">31–60 Days</th>
                  <th className="py-3.5 px-4 text-right">61–90 Days</th>
                  <th className="py-3.5 px-4 text-right">90+ Days</th>
                  <th className="py-3.5 px-4 text-right">Total Due</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-color)]/60 font-mono">
                {activeData.map((row, idx) => (
                  <tr key={idx} className="hover:bg-[var(--card-hover)] transition-colors">
                    <td className="py-3 px-4 font-bold text-[var(--text-main)] font-sans">{row.partnerName}</td>
                    <td className="py-3 px-4 text-right font-medium text-emerald-600 dark:text-emerald-400">
                      {row.current > 0 ? formatCurrency(row.current) : "-"}
                    </td>
                    <td className="py-3 px-4 text-right font-medium text-blue-600 dark:text-blue-400">
                      {row.d1_30 > 0 ? formatCurrency(row.d1_30) : "-"}
                    </td>
                    <td className="py-3 px-4 text-right font-medium text-amber-600 dark:text-amber-400">
                      {row.d31_60 > 0 ? formatCurrency(row.d31_60) : "-"}
                    </td>
                    <td className="py-3 px-4 text-right font-medium text-orange-600 dark:text-orange-400">
                      {row.d61_90 > 0 ? formatCurrency(row.d61_90) : "-"}
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-rose-600 dark:text-rose-400">
                      {row.d90Plus > 0 ? formatCurrency(row.d90Plus) : "-"}
                    </td>
                    <td className="py-3 px-4 text-right font-black text-sm text-[var(--text-main)]">
                      {formatCurrency(row.totalDue)}
                    </td>
                  </tr>
                ))}
              </tbody>
              {activeSummary && (
                <tfoot>
                  <tr className="border-t-2 border-[var(--text-main)] bg-[var(--badge-bg)] font-mono font-black text-xs">
                    <td className="py-3.5 px-4 font-sans uppercase">Total Aging Schedule</td>
                    <td className="py-3.5 px-4 text-right">{formatCurrency(activeSummary.current)}</td>
                    <td className="py-3.5 px-4 text-right">{formatCurrency(activeSummary.d1_30)}</td>
                    <td className="py-3.5 px-4 text-right">{formatCurrency(activeSummary.d31_60)}</td>
                    <td className="py-3.5 px-4 text-right">{formatCurrency(activeSummary.d61_90)}</td>
                    <td className="py-3.5 px-4 text-right">{formatCurrency(activeSummary.d90Plus)}</td>
                    <td className="py-3.5 px-4 text-right text-sm">{formatCurrency(activeSummary.total)}</td>
                  </tr>
                </tfoot>
              )}
            </table>
          )}
        </div>
      </div>
    </main>
  );
}
