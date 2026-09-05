"use client";
import React, { useEffect, useState } from "react";

export default function JournalEntriesPage() {
  const [entries, setEntries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/entries").then((r) => r.json().catch(() => ({ entries: [] }))).catch(() => ({ entries: [] }));
      setEntries(res.entries || []);
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

  const filteredEntries = entries.filter((e) => {
    const search = q.toLowerCase();
    return (
      e.reference?.toLowerCase().includes(search) ||
      e.sourceType?.toLowerCase().includes(search)
    );
  });

  return (
    <main className="mx-auto max-w-7xl px-6 py-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between border-b border-[var(--border-color)] pb-6">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-[var(--text-main)]">
            Journal Entries (General Ledger)
          </h1>
          <p className="mt-1 text-xs text-[var(--text-muted)]">
            Balanced double-entry accounting transactions across journals.
          </p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="mt-6 flex items-center justify-between">
        <input
          type="text"
          placeholder="Search entries by Reference or Source..."
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="rounded-lg border border-[var(--border-color)] bg-[var(--card-bg)] px-3 py-1.5 text-xs text-[var(--text-main)] focus:outline-none w-72"
        />
        <div className="text-xs text-[var(--text-muted)] font-semibold">
          Total Posted Entries: {entries.length}
        </div>
      </div>

      {/* Journal Entries List */}
      <div className="mt-6 space-y-4">
        {loading ? (
          <div className="card-mono py-16 text-center text-xs text-[var(--text-muted)]">
            Loading journal entries...
          </div>
        ) : filteredEntries.length === 0 ? (
          <div className="card-mono py-16 text-center text-xs text-[var(--text-muted)]">
            No posted journal entries found.
          </div>
        ) : (
          filteredEntries.map((entry) => {
            const totalDebit = entry.lines?.reduce((s: number, l: any) => s + (l.debit || 0), 0) || 0;
            const totalCredit = entry.lines?.reduce((s: number, l: any) => s + (l.credit || 0), 0) || 0;
            const isBalanced = Math.abs(totalDebit - totalCredit) < 0.01;

            return (
              <div key={entry.id} className="card-mono overflow-hidden">
                {/* Entry Header */}
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b border-[var(--border-color)] bg-[var(--badge-bg)] p-4 text-xs">
                  <div className="flex items-center gap-3">
                    <span className="font-mono font-bold text-[var(--text-main)] text-sm">
                      {entry.reference || `ENTRY-${entry.id.slice(-6)}`}
                    </span>
                    <span className="rounded-full bg-[var(--text-main)] px-2.5 py-0.5 text-[9px] font-extrabold text-[var(--bg-primary)] uppercase">
                      {entry.status}
                    </span>
                    {isBalanced ? (
                      <span className="text-[10px] font-bold text-emerald-500 flex items-center gap-1">
                        ✓ Balanced
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold text-red-500">
                        ⚠ Unbalanced
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-4 text-[var(--text-muted)]">
                    <span>Date: {new Date(entry.date).toLocaleDateString()}</span>
                    <span>Source: {entry.sourceType || "Manual"}</span>
                  </div>
                </div>

                {/* Entry Lines Table */}
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-[var(--border-color)] text-[var(--text-muted)] font-semibold uppercase text-[10px]">
                        <th className="py-2.5 px-4">Account</th>
                        <th className="py-2.5 px-4">Partner</th>
                        <th className="py-2.5 px-4 text-right w-32">Debit (₹)</th>
                        <th className="py-2.5 px-4 text-right w-32">Credit (₹)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--border-color)]/50">
                      {entry.lines?.map((line: any, idx: number) => (
                        <tr key={line.id || idx} className="hover:bg-[var(--card-hover)]">
                          <td className="py-2.5 px-4 font-sans font-semibold text-[var(--text-main)]">
                            {line.account?.name ? `${line.account.code ? line.account.code + " - " : ""}${line.account.name}` : line.accountId}
                          </td>
                          <td className="py-2.5 px-4 text-[var(--text-muted)] font-medium">
                            {line.partner?.name || line.partnerId || "-"}
                          </td>
                          <td className="py-2.5 px-4 text-right font-semibold text-[var(--text-main)]">
                            {line.debit > 0 ? formatCurrency(line.debit) : "-"}
                          </td>
                          <td className="py-2.5 px-4 text-right font-semibold text-[var(--text-main)]">
                            {line.credit > 0 ? formatCurrency(line.credit) : "-"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="border-t border-[var(--border-color)] font-bold bg-[var(--badge-bg)]/50 text-[var(--text-main)]">
                        <td colSpan={2} className="py-2.5 px-4 text-right uppercase text-[10px]">
                          Total Entry Amount:
                        </td>
                        <td className="py-2.5 px-4 text-right">{formatCurrency(totalDebit)}</td>
                        <td className="py-2.5 px-4 text-right">{formatCurrency(totalCredit)}</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            );
          })
        )}
      </div>
    </main>
  );
}
