"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Modal from "@/components/Modal";

interface Account {
  id: string;
  name: string;
  type: "ASSET" | "LIABILITY" | "INCOME" | "EXPENSE" | "CAPITAL";
  subtype: "CASH" | "BANK" | "DEBTOR" | "CREDITOR" | "SALE" | "PURCHASE" | "OTHER" | "CAPITAL";
  isArchived: boolean;
}

// Wireframe specification options mapped to database Enum values
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
  const [err, setErr] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [saving, setSaving] = useState(false);

  // Form state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: "",
    selectedOptionIndex: "Balancesheet-0", // key for selected option
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
    
    // Find matching option key
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

    // Resolve selected option payload
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

  // Format type string for list view as shown in wireframe (Assets, Expense, Liabilities, Income, Capital)
  const formatAccountType = (acc: Account) => {
    if (acc.type === "ASSET") return "Assets";
    if (acc.type === "LIABILITY") return "Liabilities";
    if (acc.type === "INCOME") return "Income";
    if (acc.type === "EXPENSE") return "Expense";
    if (acc.type === "CAPITAL") return "Capital";
    return acc.type;
  };

  return (
    <main className="mx-auto max-w-7xl px-6 py-8">
      {/* --- HEADER BAR --- */}
      <div className="flex flex-wrap items-center justify-between gap-4 card-mono p-4 mb-6 shadow-md">
        {/* Left Action Buttons */}
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

        {/* Right Controls: Home & Back */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push("/dashboard")}
            className="btn-outline px-5 py-2 text-xs font-bold rounded-lg"
          >
            Home
          </button>

          <button
            onClick={() => router.push("/dashboard")}
            className="btn-outline px-5 py-2 text-xs font-bold rounded-lg"
          >
            Back
          </button>
        </div>
      </div>

      {/* --- POPUP COMPONENT (MODAL) --- */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editingId ? "Edit Account" : "Create New Account"}
      >
        <div className="p-2">
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
            {/* Account Name */}
            <div className="grid grid-cols-12 items-center gap-4">
              <label className="col-span-3 font-bold text-xs text-[#e06666]">
                Account Name *
              </label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Enter Account Name (e.g. Bank A/c, Cash A/c)"
                className="col-span-9 rounded-lg border border-[var(--border-color)] bg-[var(--bg-primary)] px-3 py-2 text-xs text-[var(--text-main)] font-semibold focus:outline-none focus:border-[var(--text-main)]"
                required
              />
            </div>

            {/* Type Selection with Dropdown */}
            <div className="grid grid-cols-12 items-start gap-4">
              <label className="col-span-3 font-bold text-xs text-[#e06666] pt-2">
                Type *
              </label>
              <div className="col-span-9 space-y-3">
                <select
                  value={form.selectedOptionIndex}
                  onChange={(e) => setForm({ ...form, selectedOptionIndex: e.target.value })}
                  className="w-full rounded-lg border border-[var(--border-color)] bg-[var(--bg-primary)] px-3.5 py-2 text-xs text-[var(--text-main)] font-semibold focus:outline-none focus:border-[var(--text-main)]"
                >
                  {ACCOUNT_TYPE_OPTIONS.map((grp) => (
                    <optgroup key={grp.group} label={grp.group} className="font-bold text-[var(--text-main)]">
                      {grp.options.map((opt, idx) => (
                        <option key={`${grp.group}-${idx}`} value={`${grp.group}-${idx}`}>
                          {opt.label}
                        </option>
                      ))}
                    </optgroup>
                  ))}
                </select>

                <div className="p-3 rounded-lg bg-[var(--badge-bg)] border border-sky-500/20 text-sky-400 text-[11px] leading-relaxed">
                  <p className="font-semibold mb-1">
                    Select account classification:
                  </p>
                  <div className="grid grid-cols-2 gap-2 text-[10px] font-mono text-[var(--text-muted)] border-t border-[var(--border-color)]/40 pt-2 mt-1">
                    <div>
                      <strong className="text-emerald-400">Balancesheet:</strong>
                      <ul className="list-disc list-inside mt-0.5 space-y-0.5">
                        <li>Asset</li>
                        <li>Liability</li>
                        <li>Bank</li>
                        <li>Capital</li>
                        <li>Cash</li>
                      </ul>
                    </div>
                    <div>
                      <strong className="text-emerald-400">Profit and Loss:</strong>
                      <ul className="list-disc list-inside mt-0.5 space-y-0.5">
                        <li>Income</li>
                        <li>Expenses</li>
                        <li>Other Expenses</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Form Actions */}
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
                className="btn-outline px-5 py-2 text-xs font-bold rounded-lg border-2 bg-[var(--badge-bg)]"
              >
                {saving ? "Saving..." : editingId ? "Update Account" : "Create Account"}
              </button>
            </div>
          </form>
        </div>
      </Modal>

      {/* --- LIST VIEW (CHART OF ACCOUNTS TABLE ALWAYS VISIBLE) --- */}
      <div className="card-mono shadow-2xl overflow-hidden">
        <div className="p-4 border-b border-[var(--border-color)] bg-[var(--badge-bg)] flex justify-between items-center">
          <div>
            <h2 className="text-lg font-black text-[var(--text-main)]">
              Chart of Accounts
            </h2>
            <p className="text-xs text-[var(--text-muted)] mt-0.5">
              Click any account item below to edit its configuration in popup modal.
            </p>
          </div>
          <span className="text-xs font-semibold text-[var(--text-muted)]">
            Total: {accounts.length}
          </span>
        </div>

        <div className="overflow-x-auto">
          {loading ? (
            <div className="py-16 text-center text-xs text-[var(--text-muted)]">
              Loading chart of accounts...
            </div>
          ) : accounts.length === 0 ? (
            <div className="py-16 text-center text-xs text-[var(--text-muted)]">
              No accounts found.
            </div>
          ) : (
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[var(--border-color)] bg-[var(--card-bg)] text-[var(--text-muted)] font-bold uppercase tracking-wider">
                  <th className="py-3.5 px-6">Account Name</th>
                  <th className="py-3.5 px-6">Type</th>
                  <th className="py-3.5 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-color)]/60">
                {accounts.map((acc) => (
                  <tr
                    key={acc.id}
                    onClick={() => handleEdit(acc)}
                    className="hover:bg-[var(--card-hover)] cursor-pointer transition-colors"
                  >
                    <td className="py-3.5 px-6 font-bold text-red-400 font-serif text-sm">
                      {acc.name}
                    </td>
                    <td className="py-3.5 px-6 font-serif text-red-400 italic text-sm">
                      {formatAccountType(acc)}
                    </td>
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
                            ? "border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10"
                            : "border-amber-500/30 text-amber-400 hover:bg-amber-500/10"
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
