"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface Account {
  id: string;
  name: string;
  type: string;
  subtype: string;
}

interface Journal {
  id: string;
  name: string;
  type: "SALES" | "PURCHASE" | "BANK" | "CASH";
  defaultDebitId?: string | null;
  defaultCreditId?: string | null;
  defaultDebit?: Account | null;
  defaultCredit?: Account | null;
}

const JOURNAL_TYPES = [
  {
    key: "SALES",
    label: "Sales Journal",
    desc: "Customer invoices and sales transactions",
    color: "bg-emerald-500/10 text-emerald-500 border-emerald-500/30",
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
      </svg>
    ),
  },
  {
    key: "PURCHASE",
    label: "Purchase Journal",
    desc: "Vendor bills and purchase transactions",
    color: "bg-sky-500/10 text-sky-500 border-sky-500/30",
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
  },
  {
    key: "BANK",
    label: "Bank Journal",
    desc: "Bank-related transactions & transfers",
    color: "bg-purple-500/10 text-purple-500 border-purple-500/30",
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z" />
      </svg>
    ),
  },
  {
    key: "CASH",
    label: "Cash Journal",
    desc: "Cash receipts and petty cash payments",
    color: "bg-amber-500/10 text-amber-500 border-amber-500/30",
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
      </svg>
    ),
  },
];

export default function JournalsMasterPage() {
  const router = useRouter();
  const [journals, setJournals] = useState<Journal[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"list" | "kanban" | "form">("list");
  const [search, setSearch] = useState("");
  const [err, setErr] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [saving, setSaving] = useState(false);
  const [showConcept, setShowConcept] = useState(true);

  // Form State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: "",
    type: "SALES" as "SALES" | "PURCHASE" | "BANK" | "CASH",
    defaultDebitId: "",
    defaultCreditId: "",
  });

  const fetchJournals = async () => {
    setLoading(true);
    try {
      const q = search ? `?search=${encodeURIComponent(search)}` : "";
      const res = await fetch(`/api/journals${q}`);
      const data = await res.json();
      if (res.ok && data.journals) {
        setJournals(data.journals);
      }
    } catch (e) {
      console.error("Failed to load journals:", e);
    } finally {
      setLoading(false);
    }
  };

  const fetchAccounts = async () => {
    try {
      const res = await fetch("/api/accounts");
      const data = await res.json();
      if (res.ok && data.accounts) {
        setAccounts(data.accounts);
      }
    } catch (e) {
      console.error("Failed to load accounts:", e);
    }
  };

  useEffect(() => {
    fetchJournals();
    fetchAccounts();
  }, [search]);

  const handleNew = () => {
    setEditingId(null);
    setForm({
      name: "",
      type: "SALES",
      defaultDebitId: "",
      defaultCreditId: "",
    });
    setErr("");
    setSuccessMsg("");
    setViewMode("form");
  };

  const handleEdit = (j: Journal) => {
    setEditingId(j.id);
    setForm({
      name: j.name || "",
      type: j.type || "SALES",
      defaultDebitId: j.defaultDebitId || "",
      defaultCreditId: j.defaultCreditId || "",
    });
    setErr("");
    setSuccessMsg("");
    setViewMode("form");
  };

  const handleConfirm = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErr("");
    setSuccessMsg("");

    if (!form.name.trim()) {
      setErr("Journal Name is required.");
      return;
    }

    setSaving(true);
    try {
      const url = editingId ? `/api/journals/${editingId}` : "/api/journals";
      const method = editingId ? "PATCH" : "POST";

      const payload = {
        name: form.name.trim(),
        type: form.type,
        defaultDebitId: form.defaultDebitId || null,
        defaultCreditId: form.defaultCreditId || null,
      };

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to save journal");
      }

      setSuccessMsg(editingId ? "Journal updated successfully!" : "Journal created successfully!");
      await fetchJournals();
      setTimeout(() => {
        setViewMode("list");
      }, 600);
    } catch (error: any) {
      setErr(error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this journal?")) return;
    try {
      const res = await fetch(`/api/journals/${id}`, { method: "DELETE" });
      if (res.ok) {
        await fetchJournals();
      } else {
        const data = await res.json();
        alert(data.error || "Failed to delete journal");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const getBadgeStyle = (type: string) => {
    const matched = JOURNAL_TYPES.find((jt) => jt.key === type);
    return matched ? matched.color : "bg-neutral-500/10 text-neutral-400 border-neutral-500/30";
  };

  const getJournalIcon = (type: string) => {
    const matched = JOURNAL_TYPES.find((jt) => jt.key === type);
    return matched ? matched.icon : null;
  };

  return (
    <main className="mx-auto max-w-7xl px-6 py-8">
      {/* Top Action & View Control Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 card-mono p-4 mb-6 shadow-md">
        {/* Left Action Controls */}
        <div className="flex items-center gap-3">
          <button
            onClick={handleNew}
            className="btn-outline px-5 py-2 text-xs font-bold rounded-lg border-2"
          >
            New Journal
          </button>

          {viewMode === "form" && (
            <button
              onClick={() => handleConfirm()}
              disabled={saving}
              className="btn-outline px-5 py-2 text-xs font-bold rounded-lg border-2 bg-[var(--badge-bg)]"
            >
              {saving ? "Saving..." : "Confirm"}
            </button>
          )}

          {viewMode !== "form" && (
            <div className="relative">
              <input
                type="text"
                placeholder="Search Journal..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-64 rounded-lg border border-[var(--border-color)] bg-[var(--bg-primary)] px-3.5 py-1.5 text-xs text-[var(--text-main)] focus:outline-none focus:border-[var(--text-main)] font-mono"
              />
            </div>
          )}
        </div>

        {/* Right View Switcher & Concept Toggle */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowConcept(!showConcept)}
            className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-[var(--border-color)] text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors"
          >
            {showConcept ? "Hide Concept Guide" : "Show Concept Guide"}
          </button>

          <button
            onClick={() => {
              if (viewMode === "form") {
                setViewMode("list");
              } else {
                router.push("/dashboard");
              }
            }}
            className="btn-outline px-5 py-2 text-xs font-bold rounded-lg"
          >
            Back
          </button>

          <div className="flex items-center rounded-lg border border-[var(--border-color)] bg-[var(--bg-primary)] p-1 gap-1">
            <button
              onClick={() => setViewMode("list")}
              title="List View"
              className={`p-1.5 rounded-md transition-colors ${
                viewMode === "list"
                  ? "bg-[var(--text-main)] text-[var(--bg-primary)]"
                  : "text-[var(--text-muted)] hover:text-[var(--text-main)]"
              }`}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>

            <button
              onClick={() => setViewMode("kanban")}
              title="Kanban View"
              className={`p-1.5 rounded-md transition-colors ${
                viewMode === "kanban"
                  ? "bg-[var(--text-main)] text-[var(--bg-primary)]"
                  : "text-[var(--text-muted)] hover:text-[var(--text-main)]"
              }`}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h4a1 1 0 011 1v14a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM14 5a1 1 0 011-1h4a1 1 0 011 1v7a1 1 0 01-1 1h-4a1 1 0 01-1-1V5z" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* --- CONCEPT & EXPLANATION BANNER --- */}
      {showConcept && (
        <div className="card-mono p-6 mb-6 shadow-xl border border-[var(--border-color)] bg-[var(--card-bg)]">
          <div className="flex items-start justify-between gap-4 mb-4">
            <div>
              <h1 className="text-xl font-black text-[var(--text-main)] flex items-center gap-2">
                <span className="p-2 rounded-lg bg-[var(--badge-bg)] border border-[var(--border-color)]">
                  📖
                </span>
                Journal Master Concept
              </h1>
              <p className="text-xs text-[var(--text-muted)] mt-1.5 max-w-3xl leading-relaxed">
                A <strong>Journal</strong> is a record or book used to group and organize similar accounting
                transactions. Each journal represents a specific type of financial activity, such as sales,
                purchases, bank transactions, or cash transactions.
              </p>
            </div>
            <span className="px-3 py-1 text-[11px] font-mono font-bold rounded-full bg-[var(--badge-bg)] border border-[var(--border-color)] text-[var(--text-main)] shrink-0">
              Odoo Accounting Spec
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2">
            {JOURNAL_TYPES.map((jt) => (
              <div
                key={jt.key}
                className={`p-3.5 rounded-xl border ${jt.color} transition-all hover:scale-[1.02]`}
              >
                <div className="flex items-center gap-2 mb-1.5">
                  {jt.icon}
                  <span className="font-bold text-xs">{jt.label}</span>
                </div>
                <p className="text-[11px] opacity-80 leading-snug">{jt.desc}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* --- FORM VIEW --- */}
      {viewMode === "form" && (
        <div className="card-mono p-8 shadow-2xl max-w-4xl mx-auto">
          <h2 className="text-xl font-black text-center text-[var(--text-main)] mb-8">
            {editingId ? "Edit Journal" : "Create New Journal"}
          </h2>

          {err && (
            <div className="mb-6 rounded-lg bg-red-500/10 border border-red-500/30 p-3 text-xs text-red-500 font-medium text-center">
              {err}
            </div>
          )}
          {successMsg && (
            <div className="mb-6 rounded-lg bg-emerald-500/10 border border-emerald-500/30 p-3 text-xs text-emerald-500 font-medium text-center">
              {successMsg}
            </div>
          )}

          <form onSubmit={handleConfirm} className="space-y-6 text-xs">
            {/* Journal Name */}
            <div className="grid grid-cols-12 items-center gap-4 border-b border-[var(--border-color)] pb-4">
              <label className="col-span-3 font-bold text-xs text-[var(--text-main)]">
                Journal Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. Customer Sales Journal, Vendor Bills Journal, Main Cash"
                className="col-span-9 rounded-md border-b-2 border-[var(--border-color)] bg-transparent px-3 py-2 text-sm text-[var(--text-main)] font-semibold focus:outline-none focus:border-[var(--text-main)]"
                required
              />
            </div>

            {/* Type Dropdown */}
            <div className="grid grid-cols-12 items-center gap-4 border-b border-[var(--border-color)] pb-4">
              <label className="col-span-3 font-bold text-xs text-[var(--text-main)]">
                Journal Type <span className="text-red-500">*</span>
              </label>
              <div className="col-span-9">
                <select
                  value={form.type}
                  onChange={(e) => setForm({ ...form, type: e.target.value as any })}
                  className="w-full rounded-md border border-[var(--border-color)] bg-[var(--bg-primary)] px-3 py-2 text-xs text-[var(--text-main)] font-semibold focus:outline-none focus:border-[var(--text-main)]"
                >
                  <option value="SALES">Sales Journal (Invoices & Customer Receipts)</option>
                  <option value="PURCHASE">Purchase Journal (Vendor Bills & Payments)</option>
                  <option value="BANK">Bank Journal (Bank Accounts & Transfers)</option>
                  <option value="CASH">Cash Journal (Petty Cash & Cash Handouts)</option>
                </select>
                <p className="mt-1 text-[10px] text-[var(--text-muted)]">
                  Defines the scope of financial activity managed by this journal.
                </p>
              </div>
            </div>

            {/* Default Debit Account */}
            <div className="grid grid-cols-12 items-center gap-4 border-b border-[var(--border-color)] pb-4">
              <label className="col-span-3 font-bold text-xs text-[var(--text-main)]">
                Default Debit Account
              </label>
              <div className="col-span-9">
                <select
                  value={form.defaultDebitId}
                  onChange={(e) => setForm({ ...form, defaultDebitId: e.target.value })}
                  className="w-full rounded-md border border-[var(--border-color)] bg-[var(--bg-primary)] px-3 py-2 text-xs text-[var(--text-main)] font-semibold focus:outline-none focus:border-[var(--text-main)] font-mono"
                >
                  <option value="">-- No Default Debit Account --</option>
                  {accounts.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name} ({a.type} - {a.subtype})
                    </option>
                  ))}
                </select>
                <p className="mt-1 text-[10px] text-[var(--text-muted)]">
                  Account automatically debited when posting entries in this journal.
                </p>
              </div>
            </div>

            {/* Default Credit Account */}
            <div className="grid grid-cols-12 items-center gap-4 pb-2">
              <label className="col-span-3 font-bold text-xs text-[var(--text-main)]">
                Default Credit Account
              </label>
              <div className="col-span-9">
                <select
                  value={form.defaultCreditId}
                  onChange={(e) => setForm({ ...form, defaultCreditId: e.target.value })}
                  className="w-full rounded-md border border-[var(--border-color)] bg-[var(--bg-primary)] px-3 py-2 text-xs text-[var(--text-main)] font-semibold focus:outline-none focus:border-[var(--text-main)] font-mono"
                >
                  <option value="">-- No Default Credit Account --</option>
                  {accounts.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name} ({a.type} - {a.subtype})
                    </option>
                  ))}
                </select>
                <p className="mt-1 text-[10px] text-[var(--text-muted)]">
                  Account automatically credited when posting entries in this journal.
                </p>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* --- LIST VIEW --- */}
      {viewMode === "list" && (
        <div className="card-mono shadow-2xl overflow-hidden">
          <div className="p-4 border-b border-[var(--border-color)] bg-[var(--badge-bg)] flex justify-between items-center">
            <h2 className="text-lg font-black text-[var(--text-main)]">Journal Master List View</h2>
            <span className="text-xs font-semibold text-[var(--text-muted)]">Total: {journals.length}</span>
          </div>

          <div className="overflow-x-auto">
            {loading ? (
              <div className="py-16 text-center text-xs text-[var(--text-muted)]">
                Loading journals...
              </div>
            ) : journals.length === 0 ? (
              <div className="py-16 text-center text-xs text-[var(--text-muted)]">
                No journals found matching criteria.
              </div>
            ) : (
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-[var(--border-color)] bg-[var(--card-bg)] text-[var(--text-muted)] font-bold uppercase tracking-wider">
                    <th className="py-3.5 px-4">Journal Name</th>
                    <th className="py-3.5 px-4">Type</th>
                    <th className="py-3.5 px-4">Default Debit Account</th>
                    <th className="py-3.5 px-4">Default Credit Account</th>
                    <th className="py-3.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border-color)]/60">
                  {journals.map((j) => (
                    <tr
                      key={j.id}
                      className="hover:bg-[var(--card-hover)] transition-colors cursor-pointer"
                      onClick={() => handleEdit(j)}
                    >
                      <td className="py-3.5 px-4 font-bold text-[var(--text-main)]">
                        <div className="flex items-center gap-2">
                          <span className="p-1 rounded bg-[var(--badge-bg)] border border-[var(--border-color)] text-[var(--text-main)]">
                            {getJournalIcon(j.type)}
                          </span>
                          {j.name}
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-block rounded border px-2 py-0.5 text-[10px] font-bold ${getBadgeStyle(
                            j.type
                          )}`}
                        >
                          {j.type}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-mono text-[var(--text-muted)]">
                        {j.defaultDebit ? (
                          <span className="text-[var(--text-main)] font-semibold">
                            {j.defaultDebit.name}
                          </span>
                        ) : (
                          <span className="opacity-50">—</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-[var(--text-muted)]">
                        {j.defaultCredit ? (
                          <span className="text-[var(--text-main)] font-semibold">
                            {j.defaultCredit.name}
                          </span>
                        ) : (
                          <span className="opacity-50">—</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right space-x-2" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => handleEdit(j)}
                          className="px-2.5 py-1 text-[11px] font-bold rounded border border-[var(--border-color)] hover:bg-[var(--badge-bg)] text-[var(--text-main)] transition-colors"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(j.id)}
                          className="px-2.5 py-1 text-[11px] font-bold rounded border border-red-500/30 text-red-500 hover:bg-red-500/10 transition-colors"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* --- KANBAN VIEW --- */}
      {viewMode === "kanban" && (
        <div className="space-y-4">
          <div className="card-mono p-4 border-b border-[var(--border-color)] flex justify-between items-center">
            <h2 className="text-lg font-black text-[var(--text-main)]">Journal Kanban View</h2>
            <span className="text-xs font-semibold text-[var(--text-muted)]">Total: {journals.length}</span>
          </div>

          {loading ? (
            <div className="card-mono py-16 text-center text-xs text-[var(--text-muted)]">
              Loading kanban cards...
            </div>
          ) : journals.length === 0 ? (
            <div className="card-mono py-16 text-center text-xs text-[var(--text-muted)]">
              No journals found.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {journals.map((j) => (
                <div
                  key={j.id}
                  onClick={() => handleEdit(j)}
                  className="card-mono p-4 hover:shadow-xl transition-all cursor-pointer border border-[var(--border-color)] hover:border-[var(--text-main)] flex flex-col justify-between space-y-3"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="p-2 rounded-xl bg-[var(--badge-bg)] border border-[var(--border-color)] text-[var(--text-main)]">
                        {getJournalIcon(j.type)}
                      </div>
                      <span
                        className={`rounded border px-2 py-0.5 text-[10px] font-bold ${getBadgeStyle(
                          j.type
                        )}`}
                      >
                        {j.type}
                      </span>
                    </div>

                    <h3 className="font-bold text-sm text-[var(--text-main)] truncate pt-1">
                      {j.name}
                    </h3>
                  </div>

                  <div className="border-t border-[var(--border-color)]/60 pt-2 space-y-1 text-[11px]">
                    <div className="flex justify-between items-center">
                      <span className="text-[var(--text-muted)]">Default Debit:</span>
                      <span className="font-mono font-semibold text-[var(--text-main)] truncate max-w-[140px]">
                        {j.defaultDebit?.name || "—"}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-[var(--text-muted)]">Default Credit:</span>
                      <span className="font-mono font-semibold text-[var(--text-main)] truncate max-w-[140px]">
                        {j.defaultCredit?.name || "—"}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </main>
  );
}
