"use client";

import React, { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface Account {
  id: string;
  code?: string;
  name: string;
  type: string;
}

interface Contact {
  id: string;
  name: string;
  email?: string;
}

interface Journal {
  id: string;
  code?: string;
  name: string;
  type: string;
}

interface Analytic {
  id: string;
  name: string;
}

interface LineItem {
  id: string; // temporary key for UI
  accountId: string;
  partnerId: string;
  analyticId: string;
  narration: string;
  debit: string;
  credit: string;
}

export function JournalEntryForm({ entryId }: { entryId?: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(!!entryId);
  const [saving, setSaving] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [err, setErr] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Master options
  const [journals, setJournals] = useState<Journal[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [analytics, setAnalytics] = useState<Analytic[]>([]);

  // Entry Form State
  const [entryStatus, setEntryStatus] = useState<"DRAFT" | "POSTED" | "CANCELLED">("DRAFT");
  const [entryNumber, setEntryNumber] = useState("NEW (Auto-generated)");
  const [journalId, setJournalId] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [reference, setReference] = useState("");
  const [headerPartnerId, setHeaderPartnerId] = useState("");
  const [headerNarration, setHeaderNarration] = useState("");
  const [reversedAt, setReversedAt] = useState<string | null>(null);

  // Line items
  const [lines, setLines] = useState<LineItem[]>([
    { id: "1", accountId: "", partnerId: "", analyticId: "", narration: "", debit: "0", credit: "0" },
    { id: "2", accountId: "", partnerId: "", analyticId: "", narration: "", debit: "0", credit: "0" },
  ]);

  // Printable Modal State
  const [showVoucherModal, setShowVoucherModal] = useState(false);
  const [voucherData, setVoucherData] = useState<any>(null);

  // Load masters
  useEffect(() => {
    const loadMasters = async () => {
      try {
        const [jRes, aRes, cRes, anRes] = await Promise.all([
          fetch("/api/accounting/journals"),
          fetch("/api/accounts"),
          fetch("/api/contacts"),
          fetch("/api/analytics"),
        ]);

        const [jData, aData, cData, anData] = await Promise.all([
          jRes.json().catch(() => ({})),
          aRes.json().catch(() => ({})),
          cRes.json().catch(() => ({})),
          anRes.json().catch(() => ({})),
        ]);

        if (jData.journals) {
          setJournals(jData.journals);
          if (!journalId && jData.journals.length > 0) {
            setJournalId(jData.journals[0].id);
          }
        }
        if (aData.accounts) setAccounts(aData.accounts);
        if (cData.contacts) setContacts(cData.contacts);
        if (anData.analytics) setAnalytics(anData.analytics);
      } catch (e) {
        console.error("Failed to load options:", e);
      }
    };
    loadMasters();
  }, []);

  // Fetch existing entry if entryId provided
  useEffect(() => {
    if (!entryId) return;

    const fetchEntry = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/accounting/entries/${entryId}`);
        const data = await res.json().catch(() => ({}));
        if (res.ok && data.entry) {
          const e = data.entry;
          setEntryStatus(e.status);
          setEntryNumber(e.entryNumber || e.id);
          setJournalId(e.journalId);
          setDate(e.date ? new Date(e.date).toISOString().split("T")[0] : new Date().toISOString().split("T")[0]);
          setReference(e.reference || "");
          setHeaderNarration(e.narration || "");
          setReversedAt(e.reversedAt || null);

          if (e.lines && e.lines.length > 0) {
            setLines(
              e.lines.map((l: any, idx: number) => ({
                id: l.id || String(idx + 1),
                accountId: l.accountId || "",
                partnerId: l.partnerId || "",
                analyticId: l.analyticId || l.analyticAccountId || "",
                narration: l.narration || l.lineLabel || "",
                debit: l.debit ? String(l.debit) : "0",
                credit: l.credit ? String(l.credit) : "0",
              }))
            );
          }
        } else {
          setErr("Entry not found.");
        }
      } catch (err: any) {
        setErr("Failed to load entry.");
      } finally {
        setLoading(false);
      }
    };

    fetchEntry();
  }, [entryId]);

  // Live Balancing Calculation
  const totalDebit = lines.reduce((sum, l) => sum + (parseFloat(l.debit) || 0), 0);
  const totalCredit = lines.reduce((sum, l) => sum + (parseFloat(l.credit) || 0), 0);
  const roundedDebit = Math.round(totalDebit * 100) / 100;
  const roundedCredit = Math.round(totalCredit * 100) / 100;
  const diff = Math.round(Math.abs(roundedDebit - roundedCredit) * 100) / 100;
  const isBalanced = diff < 0.01 && roundedDebit > 0;

  // Add line item
  const addLine = () => {
    setLines((prev) => [
      ...prev,
      {
        id: String(Date.now()),
        accountId: accounts[0]?.id || "",
        partnerId: headerPartnerId || "",
        analyticId: "",
        narration: "",
        debit: "0",
        credit: "0",
      },
    ]);
  };

  // Remove line item
  const removeLine = (id: string) => {
    if (lines.length <= 2) {
      alert("A journal entry must contain at least 2 lines.");
      return;
    }
    setLines((prev) => prev.filter((l) => l.id !== id));
  };

  // Update line field
  const updateLine = (id: string, field: keyof LineItem, val: string) => {
    setLines((prev) =>
      prev.map((l) => (l.id === id ? { ...l, [field]: val } : l))
    );
  };

  // Keyboard navigation on last cell (Pressing Enter adds line)
  const handleKeyDown = (e: React.KeyboardEvent, index: number, isLastCell: boolean) => {
    if (e.key === "Enter" && isLastCell) {
      e.preventDefault();
      if (index === lines.length - 1) {
        addLine();
      }
    }
  };

  // Save / Submit Handler
  const handleSave = async (targetStatus: "DRAFT" | "POSTED" = "DRAFT") => {
    setErr("");
    setSuccessMsg("");

    if (!reference.trim()) {
      setErr("Reference / Memo is required.");
      return;
    }
    if (!journalId) {
      setErr("Please select a Journal.");
      return;
    }

    if (targetStatus === "POSTED" && !isBalanced) {
      setErr(`Cannot post unbalanced entry! Difference: $${diff.toFixed(2)}`);
      return;
    }

    setSaving(true);
    try {
      const payloadLines = lines.map((l) => ({
        accountId: l.accountId,
        partnerId: l.partnerId || headerPartnerId || null,
        analyticId: l.analyticId || null,
        narration: l.narration || null,
        debit: parseFloat(l.debit) || 0,
        credit: parseFloat(l.credit) || 0,
      }));

      const url = entryId ? `/api/accounting/entries/${entryId}` : "/api/accounting/entries";
      const method = entryId ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          journalId,
          date,
          reference: reference.trim(),
          narration: headerNarration,
          status: entryId ? undefined : targetStatus,
          lines: payloadLines,
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || "Failed to save entry");
      }

      const savedEntry = data.entry;
      setSuccessMsg("Journal Entry saved successfully!");

      if (targetStatus === "POSTED" && entryId && entryStatus === "DRAFT") {
        await handlePostAction(savedEntry.id);
      } else if (!entryId && savedEntry?.id) {
        router.push(`/accounting/entries/${savedEntry.id}`);
      }
    } catch (error: any) {
      setErr(error.message);
    } finally {
      setSaving(false);
    }
  };

  // Post action
  const handlePostAction = async (targetId?: string) => {
    const id = targetId || entryId;
    if (!id) return;
    setActionLoading(true);
    try {
      const res = await fetch(`/api/accounting/entries/${id}/post`, { method: "POST" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || "Failed to post entry");
      }
      setEntryStatus("POSTED");
      setSuccessMsg("Journal Entry posted successfully!");
    } catch (error: any) {
      setErr(error.message);
    } finally {
      setActionLoading(false);
    }
  };

  // Reverse action
  const handleReverseAction = async () => {
    if (!entryId) return;
    if (!confirm("Generate a reversal voucher with swapped debits & credits?")) return;
    setActionLoading(true);
    try {
      const res = await fetch(`/api/accounting/entries/${entryId}/reverse`, { method: "POST" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || "Failed to reverse entry");
      }
      setSuccessMsg(`Reversal entry generated: ${data.reversal?.entryNumber || data.reversal?.id}`);
      setTimeout(() => {
        router.push(`/accounting/entries/${data.reversal?.id}`);
      }, 700);
    } catch (error: any) {
      setErr(error.message);
    } finally {
      setActionLoading(false);
    }
  };

  // Duplicate action
  const handleDuplicateAction = () => {
    setEntryNumber("NEW (Duplicate)");
    setEntryStatus("DRAFT");
    setSuccessMsg("Entry duplicated into a new draft!");
    router.push("/accounting/entries/new");
  };

  // Cancel action
  const handleCancelAction = async () => {
    if (!entryId) return;
    if (!confirm("Are you sure you want to cancel this entry?")) return;
    setActionLoading(true);
    try {
      const res = await fetch(`/api/accounting/entries/${entryId}/cancel`, { method: "POST" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || "Failed to cancel entry");
      }
      setEntryStatus("CANCELLED");
      setSuccessMsg("Journal Entry cancelled.");
    } catch (error: any) {
      setErr(error.message);
    } finally {
      setActionLoading(false);
    }
  };

  // Print Voucher
  const handlePrintVoucher = async () => {
    if (!entryId) return;
    try {
      const res = await fetch(`/api/accounting/entries/${entryId}/pdf`);
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.voucher) {
        setVoucherData(data.voucher);
        setShowVoucherModal(true);
      }
    } catch (e) {
      console.error(e);
    }
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl px-6 py-20 text-center text-xs text-[var(--text-muted)] card-mono">
        Loading journal entry form...
      </div>
    );
  }

  return (
    <main className="mx-auto max-w-7xl px-6 py-8 space-y-6">
      {/* Breadcrumb & Navigation Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 card-mono p-4 shadow-md">
        {/* Breadcrumbs */}
        <div className="flex items-center gap-2 text-xs font-mono">
          <Link href="/accounting/journals" className="text-[var(--text-muted)] hover:underline">
            Accounting
          </Link>
          <span className="opacity-40">/</span>
          <Link href="/accounting/entries" className="text-[var(--text-muted)] hover:underline">
            Journal Entries
          </Link>
          <span className="opacity-40">/</span>
          <span className="font-bold text-[var(--text-main)]">{entryNumber}</span>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push("/accounting/entries")}
            className="btn-outline px-4 py-1.5 text-xs font-bold rounded-lg"
          >
            Back to List
          </button>
        </div>
      </div>

      {/* Main Form Container */}
      <div className="card-mono p-8 shadow-2xl space-y-6 bg-[var(--card-bg)] border border-[var(--border-color)]">
        {/* Header Bar: Status Stepper & Action Controls */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[var(--border-color)] pb-6">
          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            {entryStatus === "DRAFT" && (
              <>
                <button
                  onClick={() => handleSave("DRAFT")}
                  disabled={saving || actionLoading}
                  className="btn-outline px-4 py-2 text-xs font-bold rounded-lg border-2"
                >
                  {saving ? "Saving..." : "Save Draft"}
                </button>
                <button
                  onClick={() => (entryId ? handlePostAction() : handleSave("POSTED"))}
                  disabled={saving || actionLoading || !isBalanced}
                  className={`px-4 py-2 text-xs font-bold rounded-lg border-2 transition-all ${
                    isBalanced
                      ? "bg-emerald-500 text-black border-emerald-400 hover:bg-emerald-400"
                      : "opacity-40 cursor-not-allowed border-neutral-600 text-neutral-400"
                  }`}
                  title={!isBalanced ? `Deficit of $${diff.toFixed(2)}` : "Post Entry"}
                >
                  {actionLoading ? "Posting..." : "Post Entry"}
                </button>
              </>
            )}

            {entryStatus === "POSTED" && !reversedAt && (
              <button
                onClick={handleReverseAction}
                disabled={actionLoading}
                className="btn-outline px-4 py-2 text-xs font-bold rounded-lg border-2 text-purple-400 border-purple-500/40 hover:bg-purple-500/10"
              >
                {actionLoading ? "Generating..." : "Reverse Entry"}
              </button>
            )}

            {entryId && (
              <>
                <button
                  onClick={handleDuplicateAction}
                  className="btn-outline px-3.5 py-2 text-xs font-bold rounded-lg"
                >
                  Duplicate
                </button>

                <button
                  onClick={handlePrintVoucher}
                  className="btn-outline px-3.5 py-2 text-xs font-bold rounded-lg bg-[var(--badge-bg)]"
                >
                  🖨️ Print Voucher
                </button>
              </>
            )}

            {entryStatus !== "CANCELLED" && (
              <button
                onClick={handleCancelAction}
                disabled={actionLoading}
                className="px-3.5 py-2 text-xs font-bold rounded-lg text-red-400 border border-red-500/30 hover:bg-red-500/10"
              >
                Cancel
              </button>
            )}
          </div>

          {/* Odoo Status Stepper */}
          <div className="flex items-center rounded-lg border border-[var(--border-color)] bg-[var(--bg-primary)] p-1 text-[11px] font-mono">
            <span
              className={`px-3 py-1 rounded-md font-bold ${
                entryStatus === "DRAFT"
                  ? "bg-amber-500 text-black"
                  : "text-[var(--text-muted)] opacity-60"
              }`}
            >
              1. Draft
            </span>
            <span className="px-1.5 opacity-30">➔</span>
            <span
              className={`px-3 py-1 rounded-md font-bold ${
                entryStatus === "POSTED" && !reversedAt
                  ? "bg-emerald-500 text-black"
                  : "text-[var(--text-muted)] opacity-60"
              }`}
            >
              2. Posted
            </span>
            <span className="px-1.5 opacity-30">➔</span>
            <span
              className={`px-3 py-1 rounded-md font-bold ${
                entryStatus === "CANCELLED" || reversedAt
                  ? "bg-purple-500 text-white"
                  : "text-[var(--text-muted)] opacity-60"
              }`}
            >
              {reversedAt ? "Reversed" : "Cancelled"}
            </span>
          </div>
        </div>

        {/* System Error & Success Banners */}
        {err && (
          <div className="rounded-lg bg-red-500/10 border border-red-500/30 p-3.5 text-xs text-red-400 font-medium text-center">
            ⚠️ {err}
          </div>
        )}
        {successMsg && (
          <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/30 p-3.5 text-xs text-emerald-400 font-medium text-center">
            ✓ {successMsg}
          </div>
        )}

        {/* Top Header Fields Form */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 text-xs pt-2">
          {/* Journal Selector */}
          <div className="md:col-span-4 space-y-1">
            <label className="font-bold text-[var(--text-main)] block">
              Journal <span className="text-red-400">*</span>
            </label>
            <select
              value={journalId}
              onChange={(e) => setJournalId(e.target.value)}
              disabled={entryStatus !== "DRAFT"}
              className="w-full rounded-lg border border-[var(--border-color)] bg-[var(--bg-primary)] px-3 py-2 text-xs text-[var(--text-main)] font-semibold focus:outline-none focus:border-[var(--text-main)] font-mono"
            >
              {journals.map((j) => (
                <option key={j.id} value={j.id}>
                  {j.name} ({j.code || j.type})
                </option>
              ))}
            </select>
          </div>

          {/* Date Picker */}
          <div className="md:col-span-4 space-y-1">
            <label className="font-bold text-[var(--text-main)] block">
              Accounting Date <span className="text-red-400">*</span>
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              disabled={entryStatus !== "DRAFT"}
              className="w-full rounded-lg border border-[var(--border-color)] bg-[var(--bg-primary)] px-3 py-2 text-xs text-[var(--text-main)] font-mono focus:outline-none focus:border-[var(--text-main)]"
            />
          </div>

          {/* Partner / Contact Selector */}
          <div className="md:col-span-4 space-y-1">
            <label className="font-bold text-[var(--text-main)] block">
              Default Partner / Contact
            </label>
            <select
              value={headerPartnerId}
              onChange={(e) => setHeaderPartnerId(e.target.value)}
              disabled={entryStatus !== "DRAFT"}
              className="w-full rounded-lg border border-[var(--border-color)] bg-[var(--bg-primary)] px-3 py-2 text-xs text-[var(--text-main)] focus:outline-none focus:border-[var(--text-main)]"
            >
              <option value="">-- Optional Default Contact --</option>
              {contacts.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Reference / Memo */}
          <div className="md:col-span-6 space-y-1">
            <label className="font-bold text-[var(--text-main)] block">
              Reference / Document Ref <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              placeholder="e.g. INV/2026/001 or Opening Balance adjustment"
              disabled={entryStatus !== "DRAFT"}
              className="w-full rounded-lg border border-[var(--border-color)] bg-[var(--bg-primary)] px-3 py-2 text-xs text-[var(--text-main)] font-mono focus:outline-none focus:border-[var(--text-main)]"
              required
            />
          </div>

          {/* Internal Memo / Narration */}
          <div className="md:col-span-6 space-y-1">
            <label className="font-bold text-[var(--text-main)] block">
              Internal Narration / Header Memo
            </label>
            <input
              type="text"
              value={headerNarration}
              onChange={(e) => setHeaderNarration(e.target.value)}
              placeholder="Internal explanatory notes"
              disabled={entryStatus !== "DRAFT"}
              className="w-full rounded-lg border border-[var(--border-color)] bg-[var(--bg-primary)] px-3 py-2 text-xs text-[var(--text-main)] focus:outline-none focus:border-[var(--text-main)]"
            />
          </div>
        </div>

        {/* --- FAST-INPUT KEYBOARD-FRIENDLY LINE ITEMS TABLE --- */}
        <div className="space-y-4 pt-4 border-t border-[var(--border-color)]">
          <div className="flex items-center justify-between">
            <h3 className="font-black text-sm text-[var(--text-main)] flex items-center gap-2">
              <span>📊</span> Journal Items (Double-Entry Lines)
            </h3>
            {entryStatus === "DRAFT" && (
              <button
                type="button"
                onClick={addLine}
                className="btn-outline px-3 py-1.5 text-xs font-bold rounded-lg border"
              >
                + Add Line (Or press Enter)
              </button>
            )}
          </div>

          <div className="overflow-x-auto border border-[var(--border-color)] rounded-xl">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[var(--border-color)] bg-[var(--card-bg)] text-[var(--text-muted)] font-bold uppercase tracking-wider">
                  <th className="py-3 px-3 w-[28%]">Account Code & Name</th>
                  <th className="py-3 px-3 w-[20%]">Partner / Contact</th>
                  <th className="py-3 px-3 w-[20%]">Label / Line Narration</th>
                  <th className="py-3 px-3 w-[12%] text-right">Debit ($)</th>
                  <th className="py-3 px-3 w-[12%] text-right">Credit ($)</th>
                  {entryStatus === "DRAFT" && <th className="py-3 px-3 w-[8%] text-center">Action</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-color)]/60">
                {lines.map((line, idx) => (
                  <tr key={line.id} className="hover:bg-[var(--card-hover)] transition-colors">
                    {/* Account Searchable Dropdown */}
                    <td className="py-2.5 px-3">
                      <select
                        value={line.accountId}
                        onChange={(e) => updateLine(line.id, "accountId", e.target.value)}
                        disabled={entryStatus !== "DRAFT"}
                        className="w-full rounded-md border border-[var(--border-color)] bg-[var(--bg-primary)] px-2.5 py-1.5 text-xs text-[var(--text-main)] font-mono focus:outline-none focus:border-[var(--text-main)]"
                      >
                        <option value="">-- Select Account --</option>
                        {accounts.map((a) => (
                          <option key={a.id} value={a.id}>
                            {a.code ? `[${a.code}] ` : ""}{a.name} ({a.type})
                          </option>
                        ))}
                      </select>
                    </td>

                    {/* Partner Selector */}
                    <td className="py-2.5 px-3">
                      <select
                        value={line.partnerId}
                        onChange={(e) => updateLine(line.id, "partnerId", e.target.value)}
                        disabled={entryStatus !== "DRAFT"}
                        className="w-full rounded-md border border-[var(--border-color)] bg-[var(--bg-primary)] px-2.5 py-1.5 text-xs text-[var(--text-main)] focus:outline-none focus:border-[var(--text-main)]"
                      >
                        <option value="">-- Optional Partner --</option>
                        {contacts.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name}
                          </option>
                        ))}
                      </select>
                    </td>

                    {/* Line Narration / Label */}
                    <td className="py-2.5 px-3">
                      <input
                        type="text"
                        value={line.narration}
                        onChange={(e) => updateLine(line.id, "narration", e.target.value)}
                        placeholder="Line description"
                        disabled={entryStatus !== "DRAFT"}
                        className="w-full rounded-md border border-[var(--border-color)] bg-[var(--bg-primary)] px-2.5 py-1.5 text-xs text-[var(--text-main)] focus:outline-none focus:border-[var(--text-main)]"
                      />
                    </td>

                    {/* Debit ($) */}
                    <td className="py-2.5 px-3 text-right">
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={line.debit}
                        onChange={(e) => updateLine(line.id, "debit", e.target.value)}
                        disabled={entryStatus !== "DRAFT"}
                        className="w-full text-right rounded-md border border-[var(--border-color)] bg-[var(--bg-primary)] px-2.5 py-1.5 text-xs text-emerald-400 font-mono font-bold focus:outline-none focus:border-[var(--text-main)]"
                      />
                    </td>

                    {/* Credit ($) */}
                    <td className="py-2.5 px-3 text-right">
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={line.credit}
                        onChange={(e) => updateLine(line.id, "credit", e.target.value)}
                        onKeyDown={(e) => handleKeyDown(e, idx, true)}
                        disabled={entryStatus !== "DRAFT"}
                        className="w-full text-right rounded-md border border-[var(--border-color)] bg-[var(--bg-primary)] px-2.5 py-1.5 text-xs text-sky-400 font-mono font-bold focus:outline-none focus:border-[var(--text-main)]"
                      />
                    </td>

                    {/* Delete Line */}
                    {entryStatus === "DRAFT" && (
                      <td className="py-2.5 px-3 text-center">
                        <button
                          type="button"
                          onClick={() => removeLine(line.id)}
                          className="text-red-400 hover:text-red-300 font-bold text-xs"
                          title="Remove line"
                        >
                          ✕
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* --- LIVE BALANCING BAR & INDICATOR --- */}
        <div className="card-mono p-5 shadow-inner border border-[var(--border-color)] bg-[var(--bg-primary)] flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4 text-xs font-mono">
            <div>
              <span className="text-[var(--text-muted)] block text-[10px] uppercase">Total Debit</span>
              <span className="font-bold text-emerald-400 text-sm">
                ${roundedDebit.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </span>
            </div>

            <div className="text-[18px] opacity-30">|</div>

            <div>
              <span className="text-[var(--text-muted)] block text-[10px] uppercase">Total Credit</span>
              <span className="font-bold text-sky-400 text-sm">
                ${roundedCredit.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>

          {/* Real-time Balance Indicator Badge */}
          <div>
            {isBalanced ? (
              <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-mono font-bold text-xs">
                <span>🟢</span>
                <span>Balanced ($0.00 Difference)</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 font-mono font-bold text-xs">
                <span>🔴</span>
                <span>Unbalanced (Difference: ${diff.toFixed(2)})</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* --- VOUCHER PRINT MODAL --- */}
      {showVoucherModal && voucherData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="card-mono w-full max-w-3xl p-6 shadow-2xl space-y-6 bg-[var(--card-bg)] max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start border-b border-[var(--border-color)] pb-4">
              <div>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-sky-500/10 text-sky-400 border border-sky-500/30">
                  {voucherData.voucherType}
                </span>
                <h3 className="text-xl font-black text-[var(--text-main)] mt-1">
                  {voucherData.entryNumber}
                </h3>
                <p className="text-xs text-[var(--text-muted)] font-mono">
                  {voucherData.journalName} ({voucherData.journalCode})
                </p>
              </div>
              <button
                onClick={() => setShowVoucherModal(false)}
                className="text-xs font-bold text-red-400 hover:underline"
              >
                Close (Esc)
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs font-mono border-b border-[var(--border-color)] pb-4">
              <div>
                <span className="text-[var(--text-muted)]">Date:</span>{" "}
                {new Date(voucherData.date).toLocaleDateString()}
              </div>
              <div>
                <span className="text-[var(--text-muted)]">Reference:</span> {voucherData.reference}
              </div>
              <div>
                <span className="text-[var(--text-muted)]">Status:</span> {voucherData.status}
              </div>
              <div>
                <span className="text-[var(--text-muted)]">Memo:</span> {voucherData.narration}
              </div>
            </div>

            {/* Voucher Items Table */}
            <table className="w-full text-left text-xs font-mono border border-[var(--border-color)]">
              <thead>
                <tr className="bg-[var(--badge-bg)] text-[var(--text-muted)] font-bold">
                  <th className="p-2">Code</th>
                  <th className="p-2">Account Name</th>
                  <th className="p-2">Partner</th>
                  <th className="p-2 text-right">Debit ($)</th>
                  <th className="p-2 text-right">Credit ($)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-color)]/60">
                {voucherData.lines.map((l: any) => (
                  <tr key={l.id}>
                    <td className="p-2 text-sky-400 font-bold">{l.accountCode}</td>
                    <td className="p-2">{l.accountName}</td>
                    <td className="p-2 text-[var(--text-muted)]">{l.partnerName || "—"}</td>
                    <td className="p-2 text-right text-emerald-400 font-bold">
                      {l.debit > 0 ? `$${l.debit.toFixed(2)}` : "—"}
                    </td>
                    <td className="p-2 text-right text-sky-400 font-bold">
                      {l.credit > 0 ? `$${l.credit.toFixed(2)}` : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Voucher Totals */}
            <div className="flex justify-between items-center text-xs font-mono pt-2 border-t border-[var(--border-color)]">
              <span className="font-bold text-emerald-400">
                Total Debit: ${voucherData.summary?.totalDebit?.toFixed(2)}
              </span>
              <span className="font-bold text-sky-400">
                Total Credit: ${voucherData.summary?.totalCredit?.toFixed(2)}
              </span>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => window.print()}
                className="btn-outline px-5 py-2 text-xs font-bold rounded-lg border bg-emerald-500 text-black"
              >
                Print Voucher Now
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
