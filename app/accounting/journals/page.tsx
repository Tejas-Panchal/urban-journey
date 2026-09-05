"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface JournalAnalytics {
  totalEntries: number;
  draftEntries: number;
  postedEntries: number;
  ledgerBalance: number;
}

interface Account {
  id: string;
  name: string;
  code?: string;
  type: string;
}

interface Journal {
  id: string;
  code?: string;
  name: string;
  type: "SALES" | "PURCHASE" | "BANK" | "CASH" | "GENERAL";
  defaultAccount?: Account | null;
  defaultDebit?: Account | null;
  defaultCredit?: Account | null;
  analytics: JournalAnalytics;
}

const JOURNAL_CARD_CONFIG: Record<
  string,
  { label: string; icon: string; badgeColor: string; accentColor: string }
> = {
  SALES: {
    label: "Sales Journal",
    icon: "🛒",
    badgeColor: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
    accentColor: "border-l-4 border-l-emerald-500",
  },
  PURCHASE: {
    label: "Purchase Journal",
    icon: "📄",
    badgeColor: "bg-sky-500/10 text-sky-400 border-sky-500/30",
    accentColor: "border-l-4 border-l-sky-500",
  },
  BANK: {
    label: "Bank Journal",
    icon: "🏛️",
    badgeColor: "bg-purple-500/10 text-purple-400 border-purple-500/30",
    accentColor: "border-l-4 border-l-purple-500",
  },
  CASH: {
    label: "Cash Journal",
    icon: "💵",
    badgeColor: "bg-amber-500/10 text-amber-400 border-amber-500/30",
    accentColor: "border-l-4 border-l-amber-500",
  },
  GENERAL: {
    label: "Miscellaneous / General Journal",
    icon: "📒",
    badgeColor: "bg-indigo-500/10 text-indigo-400 border-indigo-500/30",
    accentColor: "border-l-4 border-l-indigo-500",
  },
};

export default function AccountingJournalsDashboard() {
  const router = useRouter();
  const [journals, setJournals] = useState<Journal[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const fetchJournals = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/accounting/journals");
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.journals) {
        setJournals(data.journals);
      }
    } catch (e) {
      console.error("Failed to load journals:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJournals();
  }, []);

  const filteredJournals = journals.filter((j) =>
    search ? j.name.toLowerCase().includes(search.toLowerCase()) || j.code?.toLowerCase().includes(search.toLowerCase()) : true
  );

  return (
    <main className="mx-auto max-w-7xl px-6 py-8">
      {/* Top Bar Navigation */}
      <div className="flex flex-wrap items-center justify-between gap-4 card-mono p-4 mb-6 shadow-md">
        <div className="flex items-center gap-3">
          <Link
            href="/accounting/entries/new"
            className="btn-outline px-5 py-2 text-xs font-bold rounded-lg border-2"
          >
            + New Journal Entry
          </Link>

          <Link
            href="/accounting/entries"
            className="btn-outline px-4 py-2 text-xs font-bold rounded-lg"
          >
            Ledger Explorer & Items
          </Link>

          <div className="relative">
            <input
              type="text"
              placeholder="Search Journals..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-60 rounded-lg border border-[var(--border-color)] bg-[var(--bg-primary)] px-3.5 py-1.5 text-xs text-[var(--text-main)] focus:outline-none focus:border-[var(--text-main)] font-mono"
            />
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push("/dashboard")}
            className="btn-outline px-5 py-2 text-xs font-bold rounded-lg"
          >
            Dashboard
          </button>
        </div>
      </div>

      {/* Header Banner */}
      <div className="card-mono p-6 mb-8 shadow-xl bg-[var(--card-bg)] border border-[var(--border-color)]">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-black text-[var(--text-main)] flex items-center gap-2">
              <span className="p-2 rounded-xl bg-[var(--badge-bg)] border border-[var(--border-color)]">
                📘
              </span>
              Accounting Journals Dashboard
            </h1>
          </div>
          <div className="flex gap-2 text-xs font-mono">
            <div className="px-3 py-1.5 rounded-lg bg-[var(--badge-bg)] border border-[var(--border-color)] text-center">
              <span className="block font-black text-sm text-[var(--text-main)]">{journals.length}</span>
              <span className="text-[10px] text-[var(--text-muted)] uppercase">Journals</span>
            </div>
            <div className="px-3 py-1.5 rounded-lg bg-[var(--badge-bg)] border border-[var(--border-color)] text-center">
              <span className="block font-black text-sm text-amber-400">
                {journals.reduce((s, j) => s + (j.analytics?.draftEntries || 0), 0)}
              </span>
              <span className="text-[10px] text-[var(--text-muted)] uppercase">Draft Entries</span>
            </div>
          </div>
        </div>
      </div>

      {/* Odoo-style Kanban Cards Grid */}
      {loading ? (
        <div className="card-mono py-20 text-center text-xs text-[var(--text-muted)]">
          Loading accounting journals...
        </div>
      ) : filteredJournals.length === 0 ? (
        <div className="card-mono py-20 text-center text-xs text-[var(--text-muted)]">
          No journals found.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredJournals.map((j) => {
            const config = JOURNAL_CARD_CONFIG[j.type] || JOURNAL_CARD_CONFIG.GENERAL;
            const defAccount = j.defaultAccount || j.defaultDebit || j.defaultCredit;

            return (
              <div
                key={j.id}
                className={`card-mono p-5 shadow-xl hover:shadow-2xl transition-all border border-[var(--border-color)] hover:border-[var(--text-main)] flex flex-col justify-between space-y-4 ${config.accentColor}`}
              >
                {/* Card Header */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{config.icon}</span>
                      <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-[var(--badge-bg)] border border-[var(--border-color)] text-[var(--text-main)]">
                        {j.code || j.type}
                      </span>
                    </div>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${config.badgeColor}`}>
                      {j.type}
                    </span>
                  </div>

                  <h3 className="font-black text-base text-[var(--text-main)] pt-1 truncate">
                    {j.name}
                  </h3>
                </div>

                {/* Metrics Breakdown */}
                <div className="space-y-2.5 pt-2 border-t border-[var(--border-color)]/60 text-xs">
                  {/* Default Account */}
                  <div className="flex justify-between items-center text-[11px]">
                    <span className="text-[var(--text-muted)] font-medium">Default Account:</span>
                    <span className="font-mono font-bold text-[var(--text-main)] truncate max-w-[170px]">
                      {defAccount ? `${defAccount.code ? defAccount.code + " " : ""}${defAccount.name}` : "—"}
                    </span>
                  </div>

                  {/* Ledger Balance */}
                  <div className="flex justify-between items-center text-[11px]">
                    <span className="text-[var(--text-muted)] font-medium">Ledger Balance:</span>
                    <span
                      className={`font-mono font-bold ${
                        j.analytics?.ledgerBalance >= 0 ? "text-emerald-400" : "text-red-400"
                      }`}
                    >
                      ${j.analytics?.ledgerBalance?.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </span>
                  </div>

                  {/* Draft vs Posted Counts */}
                  <div className="flex justify-between items-center text-[11px]">
                    <span className="text-[var(--text-muted)] font-medium">Draft Entries:</span>
                    <span className="font-mono font-bold text-amber-400">
                      {j.analytics?.draftEntries || 0} Drafts
                    </span>
                  </div>
                </div>

                {/* Quick Action Shortcuts */}
                <div className="pt-3 border-t border-[var(--border-color)] flex items-center gap-2">
                  <Link
                    href={`/accounting/entries/new?journalId=${j.id}`}
                    className="flex-1 text-center btn-outline py-1.5 text-[11px] font-bold rounded-lg border"
                  >
                    + New Entry
                  </Link>

                  <Link
                    href={`/accounting/entries?journalId=${j.id}`}
                    className="flex-1 text-center btn-outline py-1.5 text-[11px] font-bold rounded-lg border bg-[var(--badge-bg)]"
                  >
                    View Items ({j.analytics?.totalEntries || 0})
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </main>
  );
}
