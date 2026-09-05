"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Modal from "@/components/Modal";

interface AnalyticItem {
  id: string;
  name: string;
  type: "INCOME" | "EXPENSE";
}

export default function AnalyticsMasterPage() {
  const router = useRouter();
  const [analytics, setAnalytics] = useState<AnalyticItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"list" | "kanban">("list");
  const [showModal, setShowModal] = useState(false);
  const [search, setSearch] = useState("");
  const [err, setErr] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Form state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: "",
    type: "EXPENSE" as "INCOME" | "EXPENSE",
  });

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const query = search ? `?search=${encodeURIComponent(search)}` : "";
      const res = await fetch(`/api/analytics${query}`);
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.analytics) {
        setAnalytics(data.analytics);
      }
    } catch (e) {
      console.error("Failed to load analytics:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [search]);

  const handleNew = () => {
    setEditingId(null);
    setForm({
      name: "",
      type: "EXPENSE",
    });
    setErr("");
    setSuccessMsg("");
    setShowModal(true);
  };

  const handleEdit = (item: AnalyticItem) => {
    setEditingId(item.id);
    setForm({
      name: item.name || "",
      type: item.type || "EXPENSE",
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
      setErr("Analytic Account Name is required.");
      return;
    }

    setSaving(true);
    try {
      const url = editingId ? `/api/analytics/${editingId}` : "/api/analytics";
      const method = editingId ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to save analytic account");
      }

      setSuccessMsg(
        editingId
          ? "Analytic account updated successfully!"
          : "Analytic account created successfully!"
      );
      await fetchAnalytics();
      setTimeout(() => {
        setShowModal(false);
      }, 700);
    } catch (error: any) {
      setErr(error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!editingId) return;
    if (!confirm("Are you sure you want to delete this analytic account?")) return;

    setDeleting(true);
    try {
      const res = await fetch(`/api/analytics/${editingId}`, { method: "DELETE" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || "Failed to delete analytic account");
      }
      await fetchAnalytics();
      setShowModal(false);
    } catch (error: any) {
      setErr(error.message);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <main className="mx-auto max-w-7xl px-6 py-8">
      {/* Top Action Controls Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 card-mono p-4 mb-6 shadow-md">
        {/* Left Action Buttons */}
        <div className="flex items-center gap-3">
          <button
            onClick={handleNew}
            className="btn-outline px-5 py-2 text-xs font-bold rounded-lg border-2 flex items-center gap-1.5"
          >
            <span>+</span> New Analytic Account
          </button>

          {/* Search Box */}
          <div className="relative">
            <input
              type="text"
              placeholder="Search analytics..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-64 rounded-lg border border-[var(--border-color)] bg-[var(--bg-primary)] px-3.5 py-1.5 text-xs text-[var(--text-main)] focus:outline-none focus:border-[var(--text-main)] font-mono"
            />
          </div>
        </div>

        {/* Right View Switchers & Back Button */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push("/dashboard")}
            className="btn-outline px-5 py-2 text-xs font-bold rounded-lg"
          >
            Back
          </button>

          {/* View Toggle Icons (List vs Kanban) */}
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
        </div>
      </div>

      {/* --- POPUP COMPONENT (MODAL) --- */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editingId ? "Edit Analytic Account" : "Create New Analytic Account"}
        maxWidth="max-w-xl"
      >
        <div className="p-2">
          {err && (
            <div className="mb-4 rounded-lg bg-red-500/10 border border-red-500/30 p-3 text-xs text-red-500 font-medium text-center">
              {err}
            </div>
          )}
          {successMsg && (
            <div className="mb-4 rounded-lg bg-emerald-500/10 border border-emerald-500/30 p-3 text-xs text-emerald-500 font-medium text-center">
              {successMsg}
            </div>
          )}

          <form onSubmit={handleConfirm} className="space-y-5 text-xs">
            <div>
              <label className="block font-bold text-xs text-[var(--text-main)] mb-1.5">
                Analytic Account Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. Marketing Campaign, IT Operations, Software R&D"
                className="w-full rounded-md border border-[var(--border-color)] bg-[var(--bg-primary)] px-3 py-2 text-xs text-[var(--text-main)] font-semibold focus:outline-none focus:border-[var(--text-main)]"
                required
              />
            </div>

            <div>
              <label className="block font-bold text-xs text-[var(--text-main)] mb-1.5">
                Analytic Account Type <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-2 gap-3">
                <label
                  className={`flex items-center justify-center p-3 rounded-lg border cursor-pointer font-bold transition-all ${
                    form.type === "EXPENSE"
                      ? "border-rose-500/50 bg-rose-500/10 text-rose-400"
                      : "border-[var(--border-color)] bg-[var(--badge-bg)] text-[var(--text-muted)] hover:text-[var(--text-main)]"
                  }`}
                >
                  <input
                    type="radio"
                    name="analyticType"
                    value="EXPENSE"
                    checked={form.type === "EXPENSE"}
                    onChange={() => setForm({ ...form, type: "EXPENSE" })}
                    className="sr-only"
                  />
                  <span>Expense / Cost</span>
                </label>

                <label
                  className={`flex items-center justify-center p-3 rounded-lg border cursor-pointer font-bold transition-all ${
                    form.type === "INCOME"
                      ? "border-emerald-500/50 bg-emerald-500/10 text-emerald-400"
                      : "border-[var(--border-color)] bg-[var(--badge-bg)] text-[var(--text-muted)] hover:text-[var(--text-main)]"
                  }`}
                >
                  <input
                    type="radio"
                    name="analyticType"
                    value="INCOME"
                    checked={form.type === "INCOME"}
                    onChange={() => setForm({ ...form, type: "INCOME" })}
                    className="sr-only"
                  />
                  <span>Income / Revenue</span>
                </label>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-between pt-4 border-t border-[var(--border-color)]">
              {editingId ? (
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={deleting}
                  className="px-3 py-1.5 text-xs font-bold rounded-lg text-red-400 border border-red-500/30 hover:bg-red-500/10 transition-colors"
                >
                  {deleting ? "Deleting..." : "Delete"}
                </button>
              ) : (
                <div />
              )}
              <div className="flex gap-2">
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
            </div>
          </form>
        </div>
      </Modal>

      {/* --- LIST VIEW --- */}
      {viewMode === "list" && (
        <div className="card-mono shadow-2xl overflow-hidden">
          <div className="p-4 border-b border-[var(--border-color)] bg-[var(--badge-bg)] flex justify-between items-center">
            <div>
              <h2 className="text-lg font-black text-[var(--text-main)]">Analytics Master</h2>
            </div>
            <span className="text-xs font-semibold text-[var(--text-muted)]">Total: {analytics.length}</span>
          </div>

          <div className="overflow-x-auto">
            {loading ? (
              <div className="py-16 text-center text-xs text-[var(--text-muted)]">Loading analytic accounts...</div>
            ) : analytics.length === 0 ? (
              <div className="py-16 text-center text-xs text-[var(--text-muted)]">No analytic accounts found.</div>
            ) : (
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-[var(--border-color)] bg-[var(--card-bg)] text-[var(--text-muted)] font-bold uppercase tracking-wider">
                    <th className="py-3.5 px-4">Account Name</th>
                    <th className="py-3.5 px-4">Type</th>
                    <th className="py-3.5 px-4">ID</th>
                    <th className="py-3.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border-color)]/60">
                  {analytics.map((a) => (
                    <tr
                      key={a.id}
                      onClick={() => handleEdit(a)}
                      className="hover:bg-[var(--card-hover)] cursor-pointer transition-colors"
                    >
                      <td className="py-3.5 px-4 font-bold text-[var(--text-main)]">{a.name}</td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                            a.type === "INCOME"
                              ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                              : "bg-rose-500/10 text-rose-400 border-rose-500/30"
                          }`}
                        >
                          {a.type}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-[var(--text-muted)] font-mono text-[11px]">{a.id}</td>
                      <td className="py-3.5 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => handleEdit(a)}
                          className="px-2.5 py-1 text-[11px] font-bold rounded border border-[var(--border-color)] hover:bg-[var(--badge-bg)] text-[var(--text-main)]"
                        >
                          Edit
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
            <h2 className="text-lg font-black text-[var(--text-main)]">Analytics Master</h2>
            <span className="text-xs font-semibold text-[var(--text-muted)]">Total: {analytics.length}</span>
          </div>

          {loading ? (
            <div className="card-mono py-16 text-center text-xs text-[var(--text-muted)]">Loading kanban cards...</div>
          ) : analytics.length === 0 ? (
            <div className="card-mono py-16 text-center text-xs text-[var(--text-muted)]">No analytic accounts found.</div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {analytics.map((a) => (
                <div
                  key={a.id}
                  onClick={() => handleEdit(a)}
                  className="card-mono p-4 hover:shadow-xl cursor-pointer transition-all border hover:border-[var(--text-main)] flex items-start gap-3"
                >
                  <div
                    className={`w-10 h-10 rounded-xl font-black text-xs flex items-center justify-center shrink-0 shadow-sm border ${
                      a.type === "INCOME"
                        ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                        : "bg-rose-500/20 text-rose-300 border-rose-500/40"
                    }`}
                  >
                    {a.name.substring(0, 2).toUpperCase()}
                  </div>

                  <div className="space-y-1 min-w-0 flex-1 text-xs">
                    <h3 className="font-bold text-[var(--text-main)] truncate">{a.name}</h3>
                    <span
                      className={`inline-block rounded px-1.5 py-0.5 text-[10px] font-semibold ${
                        a.type === "INCOME"
                          ? "bg-emerald-500/10 text-emerald-400"
                          : "bg-rose-500/10 text-rose-400"
                      }`}
                    >
                      {a.type}
                    </span>
                    <p className="font-mono text-[10px] text-[var(--text-muted)] truncate">{a.id}</p>
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
