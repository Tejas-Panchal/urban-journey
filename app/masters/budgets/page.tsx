"use client";
import React, { useEffect, useState } from "react";
import { RefreshIcon } from "@/components/Icons";

interface BudgetLineItem {
  id?: string;
  analyticId: string;
  analyticName?: string;
  type: "EXPENSE" | "INCOME";
  committed: number;
  achievedCached: number;
}

interface BudgetRecord {
  id: string;
  name: string;
  start: string;
  end: string;
  responsibleId?: string;
  status: "DRAFT" | "CONFIRMED" | "REVISED" | "CANCELLED";
  revisionOfId?: string;
  revisionOf?: { id: string; name: string; status: string } | null;
  revisedWith?: { id: string; name: string; status: string } | null;
  lines: BudgetLineItem[];
  createdAt?: string;
}

function SVGSlicePie({ achieved, committed }: { achieved: number; committed: number }) {
  const safeTotal = committed > 0 ? committed : 1;
  const ratio = Math.min(1, Math.max(0, achieved / safeTotal));
  const angle = ratio * 360;

  const rad = (angle - 90) * (Math.PI / 180);
  const x = 16 + 12 * Math.cos(rad);
  const y = 16 + 12 * Math.sin(rad);
  const largeArc = angle > 180 ? 1 : 0;

  return (
    <div className="flex items-center gap-2" title={`Achieved: ${Math.round(ratio * 100)}%`}>
      <svg className="h-7 w-7 drop-shadow-sm shrink-0" viewBox="0 0 32 32">
        {ratio >= 1 ? (
          <circle cx="16" cy="16" r="12" fill="#06b6d4" />
        ) : ratio <= 0 ? (
          <circle cx="16" cy="16" r="12" fill="#f43f5e" />
        ) : (
          <>
            <circle cx="16" cy="16" r="12" fill="#f43f5e" />
            <path d={`M 16 16 L 16 4 A 12 12 0 ${largeArc} 1 ${x} ${y} Z`} fill="#06b6d4" />
          </>
        )}
      </svg>
      <span className="text-[11px] font-bold font-mono">
        {Math.round(ratio * 100)}%
      </span>
    </div>
  );
}

export default function BudgetsPage() {
  const [budgets, setBudgets] = useState<BudgetRecord[]>([]);
  const [analytics, setAnalytics] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [viewMode, setViewMode] = useState<"list" | "kanban" | "form">("list");
  const [activeBudget, setActiveBudget] = useState<BudgetRecord | null>(null);

  // Form state
  const [formName, setFormName] = useState("");
  const [formStart, setFormStart] = useState("");
  const [formEnd, setFormEnd] = useState("");
  const [formResponsible, setFormResponsible] = useState("");
  const [formLines, setFormLines] = useState<BudgetLineItem[]>([]);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/budgets")
        .then((r) => r.json())
        .catch(() => ({ budgets: [], analytics: [] }));
      setBudgets(res.budgets || []);
      setAnalytics(res.analytics || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const openFormForBudget = async (b: BudgetRecord) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/budgets/${b.id}`).then((r) => r.json());
      const full = res.budget || b;
      setActiveBudget({
        ...full,
        revisionOf: res.revisionOf || b.revisionOf,
        revisedWith: res.revisedWith || b.revisedWith,
      });
      setFormName(full.name);
      setFormStart(full.start ? full.start.slice(0, 10) : "");
      setFormEnd(full.end ? full.end.slice(0, 10) : "");
      setFormResponsible(full.responsibleId || "");
      setFormLines(full.lines || []);
      setViewMode("form");
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const openNewForm = () => {
    setActiveBudget(null);
    setFormName("New Budget " + new Date().toLocaleDateString("en-US", { month: "short", year: "numeric" }));
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().slice(0, 10);
    setFormStart(firstDay);
    setFormEnd(lastDay);
    setFormResponsible("Finance Manager");
    setFormLines([
      { analyticId: analytics[0]?.id || "", type: "EXPENSE", committed: 200000, achievedCached: 0 },
    ]);
    setViewMode("form");
  };

  const handleAddLine = () => {
    setFormLines([
      ...formLines,
      { analyticId: analytics[0]?.id || "", type: "EXPENSE", committed: 50000, achievedCached: 0 },
    ]);
  };

  const handleRemoveLine = (index: number) => {
    setFormLines(formLines.filter((_, i) => i !== index));
  };

  const handleLineChange = (index: number, field: keyof BudgetLineItem, val: any) => {
    const updated = [...formLines];
    updated[index] = { ...updated[index], [field]: val };
    setFormLines(updated);
  };

  const handleSaveBudget = async () => {
    setErrorMsg("");
    if (!formName.trim() || !formStart || !formEnd || formLines.length === 0) {
      setErrorMsg("Please fill in all required fields and add at least one line.");
      return;
    }

    setSaving(true);
    try {
      if (activeBudget?.id) {
        // Update existing budget
        const res = await fetch(`/api/budgets/${activeBudget.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: formName,
            start: formStart,
            end: formEnd,
            responsibleId: formResponsible,
            lines: formLines,
          }),
        }).then((r) => r.json());

        if (res.error) {
          setErrorMsg(res.error);
        } else {
          await loadData();
          if (res.budget) openFormForBudget(res.budget);
        }
      } else {
        // Create new budget
        const res = await fetch("/api/budgets", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: formName,
            start: formStart,
            end: formEnd,
            responsibleId: formResponsible,
            lines: formLines,
          }),
        }).then((r) => r.json());

        if (res.error) {
          setErrorMsg(res.error);
        } else {
          await loadData();
          if (res.budget) openFormForBudget(res.budget);
        }
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to save budget");
    } finally {
      setSaving(false);
    }
  };

  const handleStatusAction = async (action: "confirm" | "revise" | "cancel" | "recompute") => {
    if (!activeBudget?.id) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/budgets/${activeBudget.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      }).then((r) => r.json());

      if (res.error) {
        alert(res.error);
      } else {
        await loadData();
        if (action === "revise" && res.budget) {
          openFormForBudget(res.budget);
        } else {
          openFormForBudget(activeBudget);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 }).format(val);

  const formatDate = (dateStr?: string) =>
    dateStr ? new Date(dateStr).toLocaleDateString("en-IN", { day: "2-digit", month: "2-digit", year: "numeric" }) : "-";

  const filteredBudgets = budgets.filter(
    (b) =>
      b.name.toLowerCase().includes(search.toLowerCase()) ||
      b.status.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <main className="mx-auto max-w-7xl px-6 py-8">
      {/* Top Header / Control Bar matching wireframe and _list.tsx specifications */}
      <div className="flex flex-wrap items-center justify-between gap-4 card-mono p-4 mb-6 shadow-md">
        <div className="flex items-center gap-3">
          <button
            onClick={openNewForm}
            className="btn-outline px-5 py-2 text-xs font-bold rounded-lg border-2"
          >
            New
          </button>

          {viewMode !== "form" && (
            <div className="relative">
              <input
                type="text"
                placeholder="Search Budgets..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-64 rounded-lg border border-[var(--border-color)] bg-[var(--bg-primary)] px-3.5 py-1.5 text-xs text-[var(--text-main)] focus:outline-none focus:border-[var(--text-main)] font-mono"
              />
            </div>
          )}
        </div>

        {/* Right Controls: Back Button & View Switcher */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              if (viewMode === "form") setViewMode("list");
              else window.history.back();
            }}
            className="btn-outline px-5 py-2 text-xs font-bold rounded-lg"
          >
            Back
          </button>

          {/* List vs Kanban View Toggle Buttons (Identical to _list.tsx) */}
          <div className="flex items-center rounded-lg border border-[var(--border-color)] bg-[var(--bg-primary)] p-1 gap-1">
            <button
              onClick={() => setViewMode("list")}
              aria-label="List"
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
              aria-label="Kanban"
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

          <button onClick={loadData} className="btn-outline p-2 rounded-lg" title="Refresh">
            <RefreshIcon className="h-4 w-4" />
          </button>
        </div>
      </div>


      {/* Main Content Areas */}
      {loading ? (
        <div className="mt-8 card-mono py-20 text-center text-xs text-[var(--text-muted)]">
          Loading budget records...
        </div>
      ) : viewMode === "list" ? (
        /* LIST VIEW */
        <div className="mt-6 space-y-4">
          <div className="card-mono overflow-hidden">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-[var(--badge-bg)] border-b border-[var(--border-color)] text-[var(--text-muted)] uppercase font-extrabold tracking-wider text-[10px]">
                  <th className="p-3.5">Budget</th>
                  <th className="p-3.5">Start Date</th>
                  <th className="p-3.5">End Date</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5 text-right">Committed Limit</th>
                  <th className="p-3.5 text-right">Achieved Amount</th>
                  <th className="p-3.5 text-center">Pie Chart</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-color)]/60">
                {filteredBudgets.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-[var(--text-muted)]">
                      No budgets found. Click "+ New Budget" to create one.
                    </td>
                  </tr>
                ) : (
                  filteredBudgets.map((b) => {
                    const committedTotal = b.lines?.reduce((s, l) => s + (l.committed || 0), 0) || 0;
                    const achievedTotal = b.lines?.reduce((s, l) => s + (l.achievedCached || 0), 0) || 0;

                    return (
                      <tr
                        key={b.id}
                        onClick={() => openFormForBudget(b)}
                        className="hover:bg-[var(--card-hover)] cursor-pointer transition-colors"
                      >
                        <td className="p-3.5 font-bold text-[var(--text-main)] flex flex-col">
                          <span>{b.name}</span>
                          {b.revisionOf && (
                            <span className="text-[10px] text-amber-500 font-normal">
                              Revision of {b.revisionOf.name}
                            </span>
                          )}
                        </td>
                        <td className="p-3.5 text-[var(--text-main)] font-mono">{formatDate(b.start)}</td>
                        <td className="p-3.5 text-[var(--text-main)] font-mono">{formatDate(b.end)}</td>
                        <td className="p-3.5">
                          <span
                            className={`inline-block rounded-md px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wider ${
                              b.status === "CONFIRMED"
                                ? "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20"
                                : b.status === "REVISED"
                                ? "bg-amber-500/10 text-amber-600 border border-amber-500/20"
                                : b.status === "CANCELLED"
                                ? "bg-red-500/10 text-red-600 border border-red-500/20"
                                : "bg-slate-500/10 text-slate-600 border border-slate-500/20"
                            }`}
                          >
                            {b.status}
                          </span>
                        </td>
                        <td className="p-3.5 text-right font-mono font-bold text-[var(--text-main)]">
                          {formatCurrency(committedTotal)}
                        </td>
                        <td className="p-3.5 text-right font-mono font-bold text-[var(--text-main)]">
                          {formatCurrency(achievedTotal)}
                        </td>
                        <td className="p-3.5 flex justify-center">
                          <SVGSlicePie achieved={achievedTotal} committed={committedTotal} />
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : viewMode === "kanban" ? (
        /* KANBAN VIEW */
        <div className="mt-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredBudgets.map((b) => {
              const committedTotal = b.lines?.reduce((s, l) => s + (l.committed || 0), 0) || 0;
              const achievedTotal = b.lines?.reduce((s, l) => s + (l.achievedCached || 0), 0) || 0;
              const pct = committedTotal > 0 ? Math.round((achievedTotal / committedTotal) * 100) : 0;

              return (
                <div
                  key={b.id}
                  onClick={() => openFormForBudget(b)}
                  className="card-mono p-5 cursor-pointer hover:border-[var(--text-muted)] transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2 border-b border-[var(--border-color)] pb-3">
                      <div>
                        <h3 className="font-extrabold text-base text-[var(--text-main)]">{b.name}</h3>
                        <p className="text-[11px] text-[var(--text-muted)] font-mono mt-0.5">
                          {formatDate(b.start)} — {formatDate(b.end)}
                        </p>
                      </div>
                      <span
                        className={`rounded px-2 py-0.5 text-[9px] font-extrabold uppercase ${
                          b.status === "CONFIRMED"
                            ? "bg-emerald-500/10 text-emerald-600"
                            : b.status === "REVISED"
                            ? "bg-amber-500/10 text-amber-600"
                            : "bg-slate-500/10 text-slate-600"
                        }`}
                      >
                        {b.status}
                      </span>
                    </div>

                    {b.revisionOf && (
                      <div className="mt-2 text-[10px] font-medium text-amber-500">
                        ↳ Revision of <span className="underline">{b.revisionOf.name}</span>
                      </div>
                    )}

                    <div className="mt-4 flex items-center justify-between">
                      <div className="space-y-1">
                        <div className="text-[10px] uppercase font-bold text-[var(--text-muted)]">Committed</div>
                        <div className="text-sm font-black font-mono">{formatCurrency(committedTotal)}</div>
                      </div>
                      <div className="space-y-1 text-right">
                        <div className="text-[10px] uppercase font-bold text-[var(--text-muted)]">Achieved</div>
                        <div className="text-sm font-black font-mono">{formatCurrency(achievedTotal)}</div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-5 pt-3 border-t border-[var(--border-color)]/60 flex items-center justify-between">
                    <div className="w-2/3">
                      <div className="h-2 w-full rounded-full bg-[var(--border-color)] overflow-hidden">
                        <div
                          className="h-full bg-cyan-500 transition-all duration-300"
                          style={{ width: `${Math.min(100, pct)}%` }}
                        />
                      </div>
                    </div>
                    <SVGSlicePie achieved={achievedTotal} committed={committedTotal} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* FORM VIEW (Wireframes 1 & 2) */
        <div className="mt-6 space-y-6">
          {/* Form Action Header Bar */}
          <div className="card-mono p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-[var(--badge-bg)]/40">
            {/* Status Action Buttons */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={openNewForm}
                className="btn-outline text-xs px-3 py-1.5 border-slate-300"
              >
                New
              </button>

              <button
                onClick={() => handleStatusAction("confirm")}
                disabled={activeBudget?.status === "CONFIRMED" || saving}
                className={`text-xs px-4 py-1.5 rounded font-bold transition-all ${
                  activeBudget?.status === "DRAFT" || !activeBudget
                    ? "bg-purple-800 text-white hover:bg-purple-900 shadow-md"
                    : "btn-outline opacity-50 cursor-not-allowed"
                }`}
              >
                Confirm
              </button>

              <button
                onClick={() => handleStatusAction("revise")}
                disabled={activeBudget?.status !== "CONFIRMED" || saving}
                className={`text-xs px-4 py-1.5 rounded font-bold transition-all ${
                  activeBudget?.status === "CONFIRMED"
                    ? "bg-amber-600 text-white hover:bg-amber-700 shadow-md"
                    : "btn-outline opacity-50 cursor-not-allowed"
                }`}
              >
                Revise
              </button>

              <button
                onClick={() => handleStatusAction("cancel")}
                disabled={activeBudget?.status === "CANCELLED" || saving}
                className="btn-outline text-xs px-3.5 py-1.5 hover:text-red-500 hover:border-red-500"
              >
                Cancel
              </button>

              {activeBudget?.id && (
                <button
                  onClick={handleSaveBudget}
                  disabled={saving}
                  className="btn-primary text-xs px-4 py-1.5"
                >
                  {saving ? "Saving..." : "Save Changes"}
                </button>
              )}
            </div>

            {/* Status Breadcrumb Pipeline */}
            <div className="flex items-center text-xs font-bold border border-[var(--border-color)] rounded-lg overflow-hidden bg-[var(--card-bg)]">
              {["Draft", "Confirm", "Revised", "Cancelled"].map((st) => {
                const upper = st.toUpperCase();
                const currentStatus = activeBudget?.status || "DRAFT";
                const isCurrent = currentStatus === upper;

                return (
                  <div
                    key={st}
                    className={`px-3 py-1.5 border-r last:border-r-0 border-[var(--border-color)] transition-colors ${
                      isCurrent
                        ? "bg-purple-900 text-white font-extrabold"
                        : "text-[var(--text-muted)] bg-[var(--badge-bg)]/50"
                    }`}
                  >
                    {st}
                  </div>
                );
              })}
            </div>
          </div>

          {errorMsg && (
            <div className="p-3.5 rounded-lg bg-red-500/10 border border-red-500/30 text-xs font-semibold text-red-600">
              {errorMsg}
            </div>
          )}

          {/* Form Header Fields */}
          <div className="card-mono p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* LEFT FIELDS */}
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-rose-600 uppercase tracking-wider mb-1">
                    Budget Name
                  </label>
                  <input
                    type="text"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="e.g. January 2026"
                    className="w-full text-base font-bold rounded-md border-b-2 border-slate-400 bg-transparent py-1 px-1 outline-none focus:border-purple-800"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-rose-600 uppercase tracking-wider mb-1">
                    Budget Period
                  </label>
                  <div className="flex items-center gap-2 text-xs">
                    <input
                      type="date"
                      value={formStart}
                      onChange={(e) => setFormStart(e.target.value)}
                      className="rounded border border-[var(--border-color)] bg-[var(--card-bg)] p-1.5 text-xs text-[var(--text-main)] outline-none"
                    />
                    <span className="font-bold text-[var(--text-muted)]">To</span>
                    <input
                      type="date"
                      value={formEnd}
                      onChange={(e) => setFormEnd(e.target.value)}
                      className="rounded border border-[var(--border-color)] bg-[var(--card-bg)] p-1.5 text-xs text-[var(--text-main)] outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* RIGHT FIELDS */}
              <div className="space-y-4">
                {/* REVISION LINKS */}
                {activeBudget?.revisionOf && (
                  <div>
                    <label className="block text-xs font-bold text-rose-600 uppercase tracking-wider mb-1">
                      Revision Of
                    </label>
                    <button
                      onClick={() => openFormForBudget(activeBudget.revisionOf as any)}
                      className="text-xs font-extrabold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
                    >
                      🔗 {activeBudget.revisionOf.name} (Original Budget Clickable link)
                    </button>
                  </div>
                )}

                {activeBudget?.revisedWith && (
                  <div>
                    <label className="block text-xs font-bold text-rose-600 uppercase tracking-wider mb-1">
                      Revised With
                    </label>
                    <button
                      onClick={() => openFormForBudget(activeBudget.revisedWith as any)}
                      className="text-xs font-extrabold text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-1"
                    >
                      🔗 {activeBudget.revisedWith.name} (Clickable link to Revised Budget)
                    </button>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold text-rose-600 uppercase tracking-wider mb-1">
                    Responsible
                  </label>
                  <input
                    type="text"
                    value={formResponsible}
                    onChange={(e) => setFormResponsible(e.target.value)}
                    placeholder="Person responsible"
                    className="w-full text-xs font-semibold rounded-md border-b-2 border-slate-400 bg-transparent py-1 px-1 outline-none focus:border-purple-800"
                  />
                </div>
              </div>
            </div>

            {/* BUDGET LINES TABLE (Wireframe Form Columns) */}
            <div className="border-t border-[var(--border-color)] pt-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-extrabold text-[var(--text-main)] uppercase tracking-wider">
                  Analytic Budget Allocations
                </h3>
                <button
                  onClick={handleAddLine}
                  className="btn-outline text-xs px-3 py-1 font-bold text-purple-700 dark:text-purple-300"
                >
                  + Add Line
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b-2 border-black text-[var(--text-main)] font-extrabold text-[11px]">
                      <th className="py-2 px-2">Analytic</th>
                      <th className="py-2 px-2">Type</th>
                      <th className="py-2 px-2 text-right">Committed Amount</th>
                      <th className="py-2 px-2 text-right">Achieved Amount</th>
                      <th className="py-2 px-2 text-center">Achieved %</th>
                      <th className="py-2 px-2 text-right">Amount To Achieve</th>
                      <th className="py-2 px-2 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border-color)]">
                    {formLines.map((line, index) => {
                      const committed = line.committed || 0;
                      const achieved = line.achievedCached || 0;
                      const achievedPct = committed > 0 ? Math.round((achieved / committed) * 100) : 0;
                      const amountToAchieve = Math.max(0, committed - achieved);

                      return (
                        <tr key={index} className="hover:bg-[var(--card-hover)]">
                          {/* ANALYTIC SELECT */}
                          <td className="py-2.5 px-2">
                            <select
                              value={line.analyticId}
                              onChange={(e) => handleLineChange(index, "analyticId", e.target.value)}
                              className="rounded border border-[var(--border-color)] bg-[var(--card-bg)] p-1.5 text-xs font-semibold text-[var(--text-main)] outline-none"
                            >
                              {analytics.map((a) => (
                                <option key={a.id} value={a.id}>
                                  {a.name}
                                </option>
                              ))}
                            </select>
                          </td>

                          {/* TYPE */}
                          <td className="py-2.5 px-2">
                            <select
                              value={line.type}
                              onChange={(e) => handleLineChange(index, "type", e.target.value as any)}
                              className="rounded border border-[var(--border-color)] bg-[var(--card-bg)] p-1.5 text-xs font-semibold text-[var(--text-main)] outline-none"
                            >
                              <option value="EXPENSE">Expense</option>
                              <option value="INCOME">Income</option>
                            </select>
                          </td>

                          {/* COMMITTED AMOUNT */}
                          <td className="py-2.5 px-2 text-right">
                            <input
                              type="number"
                              value={line.committed}
                              onChange={(e) => handleLineChange(index, "committed", parseFloat(e.target.value) || 0)}
                              className="w-28 text-right font-mono font-bold rounded border border-[var(--border-color)] bg-[var(--card-bg)] p-1.5 text-xs text-[var(--text-main)] outline-none focus:border-purple-800"
                            />
                          </td>

                          {/* ACHIEVED AMOUNT (Real money transactions) */}
                          <td className="py-2.5 px-2 text-right font-mono font-bold text-[var(--text-main)]">
                            {formatCurrency(achieved)}
                          </td>

                          {/* ACHIEVED % */}
                          <td className="py-2.5 px-2 text-center font-mono font-extrabold text-cyan-600 dark:text-cyan-400">
                            {achievedPct}%
                          </td>

                          {/* AMOUNT TO ACHIEVE */}
                          <td className="py-2.5 px-2 text-right font-mono font-bold text-[var(--text-main)]">
                            {formatCurrency(amountToAchieve)}
                          </td>

                          {/* ACTIONS */}
                          <td className="py-2.5 px-2 text-center">
                            <button
                              onClick={() => handleRemoveLine(index)}
                              className="text-red-500 hover:text-red-700 font-bold px-2 py-0.5 text-xs"
                              title="Delete Line"
                            >
                              ✕
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {!activeBudget?.id && (
                <div className="mt-6 flex justify-end">
                  <button
                    onClick={handleSaveBudget}
                    disabled={saving}
                    className="btn-primary text-xs px-6 py-2 shadow-md"
                  >
                    {saving ? "Creating..." : "Create Budget Record"}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
