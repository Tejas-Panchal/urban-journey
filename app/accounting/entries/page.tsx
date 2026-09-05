"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface Account {
  id: string;
  code?: string;
  name: string;
}

interface Contact {
  id: string;
  name: string;
}

interface JournalLine {
  id: string;
  accountId: string;
  account?: Account | null;
  partnerId?: string | null;
  partner?: Contact | null;
  narration?: string | null;
  debit: number;
  credit: number;
}

interface JournalEntry {
  id: string;
  entryNumber?: string | null;
  date: string;
  reference: string;
  status: "DRAFT" | "POSTED" | "CANCELLED";
  sourceType?: string | null;
  sourceId?: string | null;
  narration?: string | null;
  postedAt?: string | null;
  reversedAt?: string | null;
  reversedEntryId?: string | null;
  journal: {
    id: string;
    code?: string;
    name: string;
    type: string;
  };
  lines: JournalLine[];
}

export default function JournalEntriesListPage() {
  const router = useRouter();
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [journals, setJournals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters & State
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [journalFilter, setJournalFilter] = useState("ALL");
  const [search, setSearch] = useState("");
  const [dateFilter, setDateFilter] = useState("ALL"); // ALL, THIS_MONTH, THIS_YEAR
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Action states
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchJournals = async () => {
    try {
      const res = await fetch("/api/accounting/journals");
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.journals) {
        setJournals(data.journals);
      }
    } catch (e) {
      console.error("Failed to load journals:", e);
    }
  };

  const fetchEntries = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter !== "ALL") params.set("status", statusFilter);
      if (journalFilter !== "ALL") params.set("journalId", journalFilter);
      if (search) params.set("search", search);

      if (dateFilter === "THIS_MONTH") {
        const now = new Date();
        const start = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
        params.set("startDate", start);
      } else if (dateFilter === "THIS_YEAR") {
        const now = new Date();
        const start = new Date(now.getFullYear(), 0, 1).toISOString();
        params.set("startDate", start);
      }

      const res = await fetch(`/api/accounting/entries?${params.toString()}`);
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.entries) {
        setEntries(data.entries);
      }
    } catch (e) {
      console.error("Failed to load entries:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJournals();
  }, []);

  useEffect(() => {
    fetchEntries();
  }, [statusFilter, journalFilter, search, dateFilter]);

  const handlePost = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setActionLoading(id);
    try {
      const res = await fetch(`/api/accounting/entries/${id}/post`, { method: "POST" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        alert(data.error || "Failed to post entry");
      } else {
        await fetchEntries();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleReverse = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Are you sure you want to generate a reversal entry?")) return;
    setActionLoading(id);
    try {
      const res = await fetch(`/api/accounting/entries/${id}/reverse`, { method: "POST" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        alert(data.error || "Failed to reverse entry");
      } else {
        alert(`Reversal voucher created: ${data.reversal?.entryNumber || data.reversal?.id}`);
        await fetchEntries();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(null);
    }
  };

  const getStatusBadge = (status: string, reversedAt?: string | null) => {
    if (reversedAt) {
      return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-500/10 text-purple-400 border border-purple-500/30">Reversed</span>;
    }
    switch (status) {
      case "DRAFT":
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30">Draft</span>;
      case "POSTED":
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">Posted</span>;
      case "CANCELLED":
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-500/10 text-red-400 border border-red-500/30">Cancelled</span>;
      default:
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-neutral-500/10 text-neutral-400 border border-neutral-500/30">{status}</span>;
    }
  };

  return (
    <main className="mx-auto max-w-7xl px-6 py-8">
      {/* Top Header & Actions Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 card-mono p-4 mb-6 shadow-md">
        <div className="flex items-center gap-3">
          <Link
            href="/accounting/entries/new"
            className="btn-outline px-5 py-2 text-xs font-bold rounded-lg border-2"
          >
            + New Journal Entry
          </Link>

          <Link
            href="/accounting/journals"
            className="btn-outline px-4 py-2 text-xs font-bold rounded-lg"
          >
            Journals Dashboard
          </Link>

          <div className="relative">
            <input
              type="text"
              placeholder="Search Reference / Entry # / Memo..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-64 rounded-lg border border-[var(--border-color)] bg-[var(--bg-primary)] px-3.5 py-1.5 text-xs text-[var(--text-main)] focus:outline-none focus:border-[var(--text-main)] font-mono"
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

      {/* Filter & Grouping Toolbar */}
      <div className="card-mono p-4 mb-6 shadow-md flex flex-wrap items-center justify-between gap-4 text-xs">
        {/* Quick Status Filter Tabs */}
        <div className="flex items-center gap-1 rounded-lg border border-[var(--border-color)] bg-[var(--bg-primary)] p-1">
          {["ALL", "DRAFT", "POSTED", "CANCELLED"].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1 rounded-md font-bold transition-colors text-[11px] ${
                statusFilter === st
                  ? "bg-[var(--text-main)] text-[var(--bg-primary)]"
                  : "text-[var(--text-muted)] hover:text-[var(--text-main)]"
              }`}
            >
              {st === "ALL" ? "All Entries" : st}
            </button>
          ))}
        </div>

        {/* Date Range Tabs */}
        <div className="flex items-center gap-2">
          <span className="text-[var(--text-muted)] font-semibold">Date Range:</span>
          <select
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="rounded-lg border border-[var(--border-color)] bg-[var(--bg-primary)] px-3 py-1.5 text-xs text-[var(--text-main)] font-mono"
          >
            <option value="ALL">All Time</option>
            <option value="THIS_MONTH">This Month</option>
            <option value="THIS_YEAR">This Fiscal Year</option>
          </select>
        </div>

        {/* Journal Filter Dropdown */}
        <div className="flex items-center gap-2">
          <span className="text-[var(--text-muted)] font-semibold">Journal:</span>
          <select
            value={journalFilter}
            onChange={(e) => setJournalFilter(e.target.value)}
            className="rounded-lg border border-[var(--border-color)] bg-[var(--bg-primary)] px-3 py-1.5 text-xs text-[var(--text-main)] font-mono"
          >
            <option value="ALL">All Journals</option>
            {journals.map((j) => (
              <option key={j.id} value={j.id}>
                {j.name} ({j.code || j.type})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Entries Ledger Explorer Table */}
      <div className="card-mono shadow-2xl overflow-hidden">
        <div className="p-4 border-b border-[var(--border-color)] bg-[var(--badge-bg)] flex justify-between items-center">
          <h2 className="text-lg font-black text-[var(--text-main)] flex items-center gap-2">
            <span>📒</span> Journal Entries Ledger Explorer
          </h2>
          <span className="text-xs font-semibold text-[var(--text-muted)]">
            Total Records: {entries.length}
          </span>
        </div>

        <div className="overflow-x-auto">
          {loading ? (
            <div className="py-16 text-center text-xs text-[var(--text-muted)]">
              Loading journal entries...
            </div>
          ) : entries.length === 0 ? (
            <div className="py-16 text-center text-xs text-[var(--text-muted)]">
              No journal entries found matching criteria.
            </div>
          ) : (
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[var(--border-color)] bg-[var(--card-bg)] text-[var(--text-muted)] font-bold uppercase tracking-wider">
                  <th className="py-3 px-4"></th>
                  <th className="py-3 px-4">Entry Number</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Journal</th>
                  <th className="py-3 px-4">Reference / Memo</th>
                  <th className="py-3 px-4">Source</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Debit ($)</th>
                  <th className="py-3 px-4 text-right">Credit ($)</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-color)]/60">
                {entries.map((entry) => {
                  const isExpanded = expandedId === entry.id;
                  const totalDr = entry.lines.reduce((s, l) => s + l.debit, 0);
                  const totalCr = entry.lines.reduce((s, l) => s + l.credit, 0);

                  return (
                    <React.Fragment key={entry.id}>
                      <tr
                        onClick={() => setExpandedId(isExpanded ? null : entry.id)}
                        className={`hover:bg-[var(--card-hover)] transition-colors cursor-pointer ${
                          isExpanded ? "bg-[var(--badge-bg)] font-semibold" : ""
                        }`}
                      >
                        <td className="py-3.5 px-4 text-center">
                          <span className="text-[10px] font-mono text-[var(--text-muted)]">
                            {isExpanded ? "▼" : "▶"}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 font-mono font-bold text-[var(--text-main)]">
                          <Link
                            href={`/accounting/entries/${entry.id}`}
                            className="hover:underline text-sky-400"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {entry.entryNumber || entry.id.substring(0, 8)}
                          </Link>
                        </td>
                        <td className="py-3.5 px-4 font-mono text-[var(--text-muted)]">
                          {new Date(entry.date).toLocaleDateString()}
                        </td>
                        <td className="py-3.5 px-4 font-semibold text-[var(--text-main)]">
                          <span className="inline-block px-2 py-0.5 rounded text-[10px] font-mono bg-[var(--badge-bg)] border border-[var(--border-color)] mr-1">
                            {entry.journal?.code || entry.journal?.type}
                          </span>
                          {entry.journal?.name}
                        </td>
                        <td className="py-3.5 px-4 font-mono text-[var(--text-main)]">
                          {entry.reference || "—"}
                        </td>
                        <td className="py-3.5 px-4">
                          {entry.sourceType ? (
                            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-neutral-500/10 border border-neutral-500/30 text-[var(--text-main)]">
                              {entry.sourceType}
                            </span>
                          ) : (
                            <span className="opacity-40">—</span>
                          )}
                        </td>
                        <td className="py-3.5 px-4">
                          {getStatusBadge(entry.status, entry.reversedAt)}
                        </td>
                        <td className="py-3.5 px-4 text-right font-mono font-bold text-emerald-400">
                          ${totalDr.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </td>
                        <td className="py-3.5 px-4 text-right font-mono font-bold text-sky-400">
                          ${totalCr.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </td>
                        <td className="py-3.5 px-4 text-right space-x-1.5" onClick={(e) => e.stopPropagation()}>
                          {entry.status === "DRAFT" && (
                            <button
                              onClick={(e) => handlePost(entry.id, e)}
                              disabled={actionLoading === entry.id}
                              className="px-2.5 py-1 text-[10px] font-bold rounded border border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/10 transition-colors"
                            >
                              Post
                            </button>
                          )}
                          {entry.status === "POSTED" && !entry.reversedAt && (
                            <button
                              onClick={(e) => handleReverse(entry.id, e)}
                              disabled={actionLoading === entry.id}
                              className="px-2.5 py-1 text-[10px] font-bold rounded border border-purple-500/40 text-purple-400 hover:bg-purple-500/10 transition-colors"
                            >
                              Reverse
                            </button>
                          )}
                          <Link
                            href={`/accounting/entries/${entry.id}`}
                            className="px-2 py-1 text-[10px] font-bold rounded border border-[var(--border-color)] text-[var(--text-main)] hover:bg-[var(--badge-bg)] inline-block"
                          >
                            Open
                          </Link>
                        </td>
                      </tr>

                      {/* Expandable Inline Line Items Explorer */}
                      {isExpanded && (
                        <tr>
                          <td colSpan={10} className="bg-[var(--bg-primary)] p-4 border-b border-[var(--border-color)]">
                            <div className="rounded-xl border border-[var(--border-color)] p-4 bg-[var(--card-bg)] space-y-3">
                              <div className="flex justify-between items-center border-b border-[var(--border-color)]/60 pb-2">
                                <h4 className="font-bold text-xs text-[var(--text-main)] flex items-center gap-2">
                                  <span>📑</span> Journal Item Lines Breakdown
                                </h4>
                                {entry.narration && (
                                  <span className="text-[11px] font-mono text-[var(--text-muted)] italic">
                                    Memo: "{entry.narration}"
                                  </span>
                                )}
                              </div>

                              <table className="w-full text-left text-[11px]">
                                <thead>
                                  <tr className="text-[var(--text-muted)] font-bold uppercase tracking-wider border-b border-[var(--border-color)]/40">
                                    <th className="py-2 px-2">Account Code & Name</th>
                                    <th className="py-2 px-2">Partner / Contact</th>
                                    <th className="py-2 px-2">Line Label</th>
                                    <th className="py-2 px-2 text-right">Debit ($)</th>
                                    <th className="py-2 px-2 text-right">Credit ($)</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-[var(--border-color)]/30">
                                  {entry.lines.map((l) => (
                                    <tr key={l.id} className="hover:bg-[var(--card-hover)]">
                                      <td className="py-2 px-2 font-mono font-bold text-[var(--text-main)]">
                                        <span className="text-sky-400 mr-2">{l.account?.code || "—"}</span>
                                        {l.account?.name || "Unknown Account"}
                                      </td>
                                      <td className="py-2 px-2 text-[var(--text-muted)] font-medium">
                                        {l.partner?.name || "—"}
                                      </td>
                                      <td className="py-2 px-2 text-[var(--text-muted)] font-mono">
                                        {l.narration || "—"}
                                      </td>
                                      <td className="py-2 px-2 text-right font-mono font-bold text-emerald-400">
                                        {l.debit > 0 ? `$${l.debit.toFixed(2)}` : "—"}
                                      </td>
                                      <td className="py-2 px-2 text-right font-mono font-bold text-sky-400">
                                        {l.credit > 0 ? `$${l.credit.toFixed(2)}` : "—"}
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </main>
  );
}
