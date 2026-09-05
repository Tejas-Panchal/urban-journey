"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Modal from "@/components/Modal";
import { RefreshIcon } from "@/components/Icons";

interface Account {
  id: string;
  name: string;
  type: "ASSET" | "LIABILITY" | "INCOME" | "EXPENSE" | "CAPITAL";
  subtype: "CASH" | "BANK" | "DEBTOR" | "CREDITOR" | "SALE" | "PURCHASE" | "OTHER" | "CAPITAL";
  balance?: number;
  isArchived: boolean;
}

const ACCOUNT_TYPE_OPTIONS = [
  {
    group: "Balancesheet",
    options: [
      { label: "Asset", type: "ASSET", subtype: "OTHER" },
      { label: "Liability", type: "LIABILITY", subtype: "OTHER" },
      { label: "Bank", type: "ASSET", subtype: "BANK" },
      { label: "Capital", type: "CAPITAL", subtype: "CAPITAL" },
      { label: "Cash", type: "ASSET", subtype: "CASH" },
    ],
  },
  {
    group: "Profit and Loss",
    options: [
      { label: "Income", type: "INCOME", subtype: "SALE" },
      { label: "Expenses", type: "EXPENSE", subtype: "PURCHASE" },
      { label: "Other Expenses", type: "EXPENSE", subtype: "OTHER" },
    ],
  },
];

export default function ChartOfAccountsPage() {
  const router = useRouter();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [search, setSearch] = useState("");
  const [showArchived, setShowArchived] = useState(false);
  const [activeTab, setActiveTab] = useState<"ALL" | "ASSET" | "LIABILITY" | "CAPITAL" | "INCOME" | "EXPENSE">("ALL");
  const [err, setErr] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [saving, setSaving] = useState(false);

  // Form state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: "",
    selectedOptionIndex: "Balancesheet-0",
  });

  const fetchAccounts = async () => {
    setLoading(true);
    try {
      const qParams = new URLSearchParams();
      if (search) qParams.set("search", search);
      if (showArchived) qParams.set("archived", "true");

      const res = await fetch(`/api/accounts?${qParams.toString()}`);
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.accounts) {
        setAccounts(data.accounts);
      }
    } catch (e) {
      console.error("Failed to load accounts:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAccounts();
  }, [search, showArchived]);

  const handleNew = () => {
    setEditingId(null);
    setForm({
      name: "",
      selectedOptionIndex: "Balancesheet-0",
    });
    setErr("");
    setSuccessMsg("");
    setShowModal(true);
  };

  const handleEdit = (acc: Account) => {
    setEditingId(acc.id);

    let foundKey = "Balancesheet-0";
    ACCOUNT_TYPE_OPTIONS.forEach((grp) => {
      grp.options.forEach((opt, idx) => {
        if (opt.type === acc.type && opt.subtype === acc.subtype) {
          foundKey = `${grp.group}-${idx}`;
        }
      });
    });

    setForm({
      name: acc.name,
      selectedOptionIndex: foundKey,
    });
    setErr("");
    setSuccessMsg("");
    setShowModal(true);
  };

  const handleConfirm = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErr("");
    setSuccessMsg("");

    if (!form.name.trim()) {
      setErr("Account Name is required.");
      return;
    }

    const [grpName, idxStr] = form.selectedOptionIndex.split("-");
    const grp = ACCOUNT_TYPE_OPTIONS.find((g) => g.group === grpName);
    const selectedOpt = grp ? grp.options[parseInt(idxStr, 10)] : ACCOUNT_TYPE_OPTIONS[0].options[0];

    setSaving(true);
    try {
      const url = editingId ? `/api/accounts/${editingId}` : "/api/accounts";
      const method = editingId ? "PATCH" : "POST";

      const payload = {
        name: form.name.trim(),
        type: selectedOpt.type,
        subtype: selectedOpt.subtype,
      };

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || "Failed to save account");
      }

      setSuccessMsg(editingId ? "Account updated successfully!" : "Account created successfully!");
      await fetchAccounts();
      setTimeout(() => {
        setShowModal(false);
      }, 600);
    } catch (error: any) {
      setErr(error.message);
    } finally {
      setSaving(false);
    }
  };

  const toggleArchive = async (acc: Account, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const res = await fetch(`/api/accounts/${acc.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isArchived: !acc.isArchived }),
      });
      if (res.ok) {
        await fetchAccounts();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 }).format(val);

  const getStatementGroup = (acc: Account) => {
    if (acc.type === "ASSET" || acc.type === "LIABILITY" || acc.type === "CAPITAL") {
      return "Balance Sheet";
    }
    return "Profit & Loss";
  };

  const getTypeBadgeStyle = (acc: Account) => {
    switch (acc.type) {
      case "ASSET":
        return "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20";
      case "LIABILITY":
        return "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20";
      case "INCOME":
        return "bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/20";
      case "EXPENSE":
        return "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20";
      case "CAPITAL":
        return "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20";
      default:
        return "bg-slate-500/10 text-slate-600 border-slate-500/20";
    }
  };

  const filteredAccounts = accounts.filter((acc) => {
    if (activeTab !== "ALL" && acc.type !== activeTab) return false;
    return true;
  });

  // Calculate totals for KPI summary cards
  const totalAssetsBal = accounts.filter((a) => a.type === "ASSET").reduce((s, a) => s + (a.balance || 0), 0);
  const totalLiabBal = accounts.filter((a) => a.type === "LIABILITY").reduce((s, a) => s + (a.balance || 0), 0);
  const totalIncomeBal = accounts.filter((a) => a.type === "INCOME").reduce((s, a) => s + (a.balance || 0), 0);
  const totalExpenseBal = accounts.filter((a) => a.type === "EXPENSE").reduce((s, a) => s + (a.balance || 0), 0);

  return (
    <main className="mx-auto max-w-7xl px-6 py-8">
      {/* HEADER BAR matching _list.tsx */}
      <div className="flex flex-wrap items-center justify-between gap-4 card-mono p-4 mb-6 shadow-md">
        <div className="flex items-center gap-3">
          <button
            onClick={handleNew}
            className="btn-outline px-5 py-2 text-xs font-bold rounded-lg border-2"
          >
            + New Account
          </button>

          <button
            onClick={() => setShowArchived(!showArchived)}
            className={`px-4 py-2 text-xs font-bold rounded-lg border transition-all ${
              showArchived
                ? "bg-[var(--text-main)] text-[var(--bg-primary)] border-[var(--text-main)]"
                : "btn-outline border-[var(--border-color)] text-[var(--text-muted)]"
            }`}
          >
            {showArchived ? "Viewing Archived" : "Archived"}
          </button>

          <div className="relative">
            <input
              type="text"
              placeholder="Search accounts..."
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
            Back
          </button>
          <button onClick={fetchAccounts} className="btn-outline p-2 rounded-lg" title="Refresh">
            <RefreshIcon className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* TOP KPI METRIC SUMMARY CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="card-mono p-4 bg-emerald-500/5 border-emerald-500/20">
          <div className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
            Total Assets Balance
          </div>
          <div className="text-xl font-black font-mono mt-1 text-[var(--text-main)]">
            {formatCurrency(totalAssetsBal)}
          </div>
          <div className="text-[11px] text-[var(--text-muted)] mt-1 font-medium">
            Cash, Bank & Receivables
          </div>
        </div>

        <div className="card-mono p-4 bg-amber-500/5 border-amber-500/20">
          <div className="text-[10px] font-extrabold uppercase tracking-wider text-amber-700 dark:text-amber-400">
            Total Liabilities Balance
          </div>
          <div className="text-xl font-black font-mono mt-1 text-[var(--text-main)]">
            {formatCurrency(totalLiabBal)}
          </div>
          <div className="text-[11px] text-[var(--text-muted)] mt-1 font-medium">
            Payables & Current Debts
          </div>
        </div>

        <div className="card-mono p-4 bg-cyan-500/5 border-cyan-500/20">
          <div className="text-[10px] font-extrabold uppercase tracking-wider text-cyan-700 dark:text-cyan-400">
            Sales & Operating Income
          </div>
          <div className="text-xl font-black font-mono mt-1 text-[var(--text-main)]">
            {formatCurrency(totalIncomeBal)}
          </div>
          <div className="text-[11px] text-[var(--text-muted)] mt-1 font-medium">
            Invoiced Revenues
          </div>
        </div>

        <div className="card-mono p-4 bg-rose-500/5 border-rose-500/20">
          <div className="text-[10px] font-extrabold uppercase tracking-wider text-rose-700 dark:text-rose-400">
            Purchases & Expenses
          </div>
          <div className="text-xl font-black font-mono mt-1 text-[var(--text-main)]">
            {formatCurrency(totalExpenseBal)}
          </div>
          <div className="text-[11px] text-[var(--text-muted)] mt-1 font-medium">
            Vendor Bills & Operating Costs
          </div>
        </div>
      </div>

      {/* CATEGORY TABS */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-2 mb-4 border-b border-[var(--border-color)] text-xs">
        {[
          { id: "ALL", label: "All Accounts" },
          { id: "ASSET", label: "Assets" },
          { id: "LIABILITY", label: "Liabilities" },
          { id: "CAPITAL", label: "Equity & Capital" },
          { id: "INCOME", label: "Income" },
          { id: "EXPENSE", label: "Expenses" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-3.5 py-1.5 rounded-lg font-bold transition-colors shrink-0 ${
              activeTab === tab.id
                ? "bg-[var(--text-main)] text-[var(--bg-primary)] shadow-sm"
                : "text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--badge-bg)]"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* MODAL POPUP FOR CREATION AND EDITING */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editingId ? "Edit GL Account" : "Create New GL Account"}
      >
        <div className="p-2">
          {err && (
            <div className="mb-4 rounded-lg bg-red-500/10 border border-red-500/30 p-3 text-xs text-red-600 font-semibold text-center">
              {err}
            </div>
          )}
          {successMsg && (
            <div className="mb-4 rounded-lg bg-emerald-500/10 border border-emerald-500/30 p-3 text-xs text-emerald-600 font-semibold text-center">
              {successMsg}
            </div>
          )}

          <form onSubmit={handleConfirm} className="space-y-5 text-xs">
            <div>
              <label className="block font-bold text-xs text-[var(--text-main)] mb-1 uppercase tracking-wider">
                Account Name *
              </label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Enter Account Name (e.g. Bank Account, Cash in Hand)"
                className="w-full rounded-lg border border-[var(--border-color)] bg-[var(--bg-primary)] px-3.5 py-2 text-xs text-[var(--text-main)] font-semibold outline-none focus:border-[var(--text-main)]"
                required
              />
            </div>

            <div>
              <label className="block font-bold text-xs text-[var(--text-main)] mb-1 uppercase tracking-wider">
                Classification Type *
              </label>
              <select
                value={form.selectedOptionIndex}
                onChange={(e) => setForm({ ...form, selectedOptionIndex: e.target.value })}
                className="w-full rounded-lg border border-[var(--border-color)] bg-[var(--bg-primary)] px-3.5 py-2 text-xs text-[var(--text-main)] font-semibold outline-none focus:border-[var(--text-main)]"
              >
                {ACCOUNT_TYPE_OPTIONS.map((grp) => (
                  <optgroup key={grp.group} label={grp.group} className="font-bold text-[var(--text-main)]">
                    {grp.options.map((opt, idx) => (
                      <option key={`${grp.group}-${idx}`} value={`${grp.group}-${idx}`}>
                        {grp.group}: {opt.label} ({opt.type})
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-[var(--border-color)]">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="btn-outline px-4 py-2 text-xs font-bold rounded-lg"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="btn-primary px-5 py-2 text-xs font-bold rounded-lg shadow-md"
              >
                {saving ? "Saving..." : editingId ? "Update Account" : "Create Account"}
              </button>
            </div>
          </form>
        </div>
      </Modal>

      {/* CHART OF ACCOUNTS TABLE (CLEAN TYPOGRAPHY) */}
      <div className="card-mono shadow-2xl overflow-hidden">
        <div className="p-4 border-b border-[var(--border-color)] bg-[var(--badge-bg)] flex justify-between items-center">
          <h2 className="text-lg font-black text-[var(--text-main)]">
            Chart of Accounts Listing
          </h2>
          <span className="text-xs font-bold font-mono text-[var(--text-muted)]">
            Showing {filteredAccounts.length} of {accounts.length} Accounts
          </span>
        </div>

        <div className="overflow-x-auto">
          {loading ? (
            <div className="py-16 text-center text-xs text-[var(--text-muted)]">
              Loading Chart of Accounts...
            </div>
          ) : filteredAccounts.length === 0 ? (
            <div className="py-16 text-center text-xs text-[var(--text-muted)]">
              No accounts match the current filter.
            </div>
          ) : (
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-[var(--border-color)] bg-[var(--card-bg)] text-[var(--text-muted)] font-extrabold uppercase tracking-wider text-[10px]">
                  <th className="py-3.5 px-6">Account Name</th>
                  <th className="py-3.5 px-6">Statement Group</th>
                  <th className="py-3.5 px-6">Type & Subtype</th>
                  <th className="py-3.5 px-6 text-right">Posted GL Balance</th>
                  <th className="py-3.5 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-color)]/60">
                {filteredAccounts.map((acc) => (
                  <tr
                    key={acc.id}
                    onClick={() => handleEdit(acc)}
                    className="hover:bg-[var(--card-hover)] cursor-pointer transition-colors"
                  >
                    {/* Clean Bold Account Name */}
                    <td className="py-3.5 px-6 font-extrabold text-[var(--text-main)] text-sm">
                      {acc.name}
                    </td>

                    {/* Statement Group */}
                    <td className="py-3.5 px-6 font-semibold text-[var(--text-muted)]">
                      {getStatementGroup(acc)}
                    </td>

                    {/* Account Type Badge */}
                    <td className="py-3.5 px-6">
                      <span
                        className={`inline-block rounded-md px-2.5 py-1 text-[10px] font-extrabold uppercase border ${getTypeBadgeStyle(
                          acc
                        )}`}
                      >
                        {acc.type} ({acc.subtype})
                      </span>
                    </td>

                    {/* Real-time Posted GL Balance */}
                    <td className="py-3.5 px-6 text-right font-mono font-bold text-sm text-[var(--text-main)]">
                      {formatCurrency(acc.balance || 0)}
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-6 text-right space-x-2" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => handleEdit(acc)}
                        className="px-2.5 py-1 text-[11px] font-bold rounded border border-[var(--border-color)] hover:bg-[var(--badge-bg)] text-[var(--text-main)] transition-colors"
                      >
                        Edit
                      </button>
                      <button
                        onClick={(e) => toggleArchive(acc, e)}
                        className={`px-2.5 py-1 text-[11px] font-bold rounded border transition-colors ${
                          acc.isArchived
                            ? "border-emerald-500/30 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10"
                            : "border-amber-500/30 text-amber-600 dark:text-amber-400 hover:bg-amber-500/10"
                        }`}
                      >
                        {acc.isArchived ? "Unarchive" : "Archive"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </main>
  );
}
