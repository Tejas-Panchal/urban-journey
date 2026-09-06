"use client";
import React, { useEffect, useState } from "react";
import { CreditCardIcon } from "@/components/Icons";

import Modal from "@/components/Modal";

interface LineItem {
  productId: string;
  analyticId?: string;
  qty: number;
  unitPrice: number;
  tax: number;
}

export default function CustomerInvoicesPage() {
  const [invoices, setInvoices] = useState<any[]>([]);
  const [contacts, setContacts] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [analytics, setAnalytics] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [showModal, setShowModal] = useState(false);
  const [showPayModal, setShowPayModal] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);
  const [viewDetailInvoice, setViewDetailInvoice] = useState<any>(null);

  // Invoice Form state
  const [customerId, setCustomerId] = useState("");
  const [invRef, setInvRef] = useState("INV-REF-001");
  const [invDate, setInvDate] = useState(new Date().toISOString().split("T")[0]);
  const [dueDate, setDueDate] = useState(
    new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]
  );
  const [lines, setLines] = useState<LineItem[]>([
    { productId: "", analyticId: "", qty: 1, unitPrice: 0, tax: 0 },
  ]);
  const [errorMsg, setErrorMsg] = useState("");
  const [saving, setSaving] = useState(false);

  // Payment Form state
  const [payAmount, setPayAmount] = useState(0);
  const [payVia, setPayVia] = useState<"BANK" | "CASH">("BANK");
  const [payDate, setPayDate] = useState(new Date().toISOString().split("T")[0]);
  const [payNote, setPayNote] = useState("");

  const [session, setSession] = useState<any>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [invRes, contactRes, prodRes, authRes] = await Promise.all([
        fetch("/api/sales/invoices").then((r) => r.json()).catch(() => ({ invoices: [], analytics: [] })),
        fetch("/api/contacts").then((r) => r.json()).catch(() => ({ contacts: [] })),
        fetch("/api/products").then((r) => r.json()).catch(() => ({ products: [] })),
        fetch("/api/auth/me").then((r) => (r.ok ? r.json() : null)).catch(() => null),
      ]);
      setInvoices(invRes.invoices || []);
      setAnalytics(invRes.analytics || []);
      setContacts(contactRes.contacts || []);
      setProducts(prodRes.products || []);
      setSession(authRes);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAddLine = () => {
    setLines([...lines, { productId: "", analyticId: analytics[0]?.id || "", qty: 1, unitPrice: 0, tax: 0 }]);
  };

  const handleRemoveLine = (idx: number) => {
    if (lines.length > 1) {
      setLines(lines.filter((_, i) => i !== idx));
    }
  };

  const handleLineChange = (idx: number, field: keyof LineItem, val: any) => {
    const next = [...lines];
    if (field === "productId") {
      next[idx].productId = val;
      const selectedProd = products.find((p) => p.id === val);
      if (selectedProd) {
        next[idx].unitPrice = selectedProd.salesPrice || 0;
      }
    } else if (field === "analyticId") {
      next[idx].analyticId = val;
    } else {
      (next[idx] as any)[field] = Number(val);
    }
    setLines(next);
  };

  const calculateSubtotal = () => lines.reduce((s, l) => s + l.qty * l.unitPrice, 0);
  const calculateTax = () =>
    lines.reduce((s, l) => s + l.qty * l.unitPrice * ((l.tax || 0) / 100), 0);
  const calculateTotal = () => calculateSubtotal() + calculateTax();

  const handleCreateInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    if (!customerId) {
      setErrorMsg("Please select a customer.");
      return;
    }
    if (lines.some((l) => !l.productId || l.qty <= 0)) {
      setErrorMsg("Please ensure all line items have a product and positive quantity.");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/sales/invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerId,
          invRef,
          invDate,
          dueDate,
          lines,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || "Failed to create invoice");
      }
      setShowModal(false);
      loadData();
    } catch (err: any) {
      setErrorMsg(err.message || "An unexpected error occurred");
    } finally {
      setSaving(false);
    }
  };

  const openPaymentModal = (inv: any) => {
    setSelectedInvoice(inv);
    setPayAmount(inv.due || inv.total || 0);
    setShowPayModal(true);
  };

  const handleRegisterPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInvoice || payAmount <= 0) return;

    setSaving(true);
    try {
      const res = await fetch("/api/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          partnerId: selectedInvoice.customerId,
          invoiceId: selectedInvoice.id,
          amount: payAmount,
          date: payDate,
          via: payVia,
          note: payNote || `Payment for ${selectedInvoice.no}`,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Failed to post payment");
      setShowPayModal(false);
      loadData();
    } catch (err: any) {
      alert(err.message || "Failed to post payment");
    } finally {
      setSaving(false);
    }
  };

  const handleConfirmInvoice = async (invoiceId: string) => {
    try {
      const res = await fetch(`/api/sales/invoices/${invoiceId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "confirm" }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Failed to confirm invoice");
      await loadData();
      if (viewDetailInvoice && viewDetailInvoice.id === invoiceId) {
        setViewDetailInvoice((prev: any) => (prev ? { ...prev, status: "CONFIRMED" } : null));
      }
    } catch (err: any) {
      alert(err.message || "Failed to confirm invoice");
    }
  };

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(val);

  const filteredInvoices = invoices.filter((i) => {
    const matchesQ =
      i.no.toLowerCase().includes(q.toLowerCase()) ||
      i.customerId.toLowerCase().includes(q.toLowerCase());
    const matchesStatus = statusFilter === "ALL" || i.status === statusFilter;
    return matchesQ && matchesStatus;
  });

  return (
    <main className="mx-auto max-w-7xl px-6 py-8">
      {/* Header Controls */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between border-b border-[var(--border-color)] pb-6">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-[var(--text-main)]">
            Customer Invoices (AR)
          </h1>
        </div>
        {session?.user?.role !== "CONTACT" && (
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowModal(true)}
              className="btn-primary text-xs flex items-center gap-1.5 py-2 px-4"
            >
              <span>+</span> Create Customer Invoice
            </button>
          </div>
        )}
      </div>

      {/* Filter Bar */}
      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <input
          type="text"
          placeholder="Search by Invoice # or Customer..."
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="rounded-lg border border-[var(--border-color)] bg-[var(--card-bg)] px-3 py-1.5 text-xs text-[var(--text-main)] focus:outline-none w-64"
        />
        <div className="flex items-center gap-1 rounded-lg border border-[var(--border-color)] bg-[var(--badge-bg)] p-1 text-xs font-semibold">
          {["ALL", "DRAFT", "CONFIRMED", "PAID"].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`rounded-md px-3 py-1 transition-all ${
                statusFilter === st
                  ? "bg-[var(--card-bg)] text-[var(--text-main)] shadow-sm"
                  : "text-[var(--text-muted)] hover:text-[var(--text-main)]"
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Data Table */}
      <div className="mt-6 card-mono overflow-hidden">
        <div className="overflow-x-auto">
          {loading ? (
            <div className="py-16 text-center text-xs text-[var(--text-muted)]">
              Loading customer invoices...
            </div>
          ) : filteredInvoices.length === 0 ? (
            <div className="py-16 text-center text-xs text-[var(--text-muted)]">
              No customer invoices found matching your criteria.
            </div>
          ) : (
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[var(--border-color)] bg-[var(--badge-bg)] text-[var(--text-muted)] font-bold uppercase tracking-wider">
                  <th className="py-3.5 px-4">Invoice #</th>
                  <th className="py-3.5 px-4">Date</th>
                  <th className="py-3.5 px-4">Due Date</th>
                  <th className="py-3.5 px-4">Customer</th>
                  <th className="py-3.5 px-4 text-right">Total Amount</th>
                  <th className="py-3.5 px-4 text-right">Balance Due</th>
                  <th className="py-3.5 px-4 text-center">Status</th>
                  <th className="py-3.5 px-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-color)]/60">
                {filteredInvoices.map((i) => (
                  <tr
                    key={i.id}
                    onClick={() => setViewDetailInvoice(i)}
                    className="hover:bg-[var(--card-hover)] cursor-pointer transition-colors"
                  >
                    <td className="py-3.5 px-4 font-mono font-bold text-[var(--text-main)]">
                      {i.no}
                    </td>
                    <td className="py-3.5 px-4 text-[var(--text-muted)]">
                      {new Date(i.invDate).toLocaleDateString()}
                    </td>
                    <td className="py-3.5 px-4 text-[var(--text-muted)]">
                      {new Date(i.dueDate).toLocaleDateString()}
                    </td>
                    <td className="py-3.5 px-4 font-medium text-[var(--text-main)]">
                      {i.customer?.name || contacts.find((c) => c.id === i.customerId)?.name || i.customerId}
                    </td>
                    <td className="py-3.5 px-4 text-right font-bold text-[var(--text-main)]">
                      {formatCurrency(i.total || 0)}
                    </td>
                    <td className="py-3.5 px-4 text-right font-semibold text-[var(--text-muted)]">
                      {formatCurrency(i.due || 0)}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span className="inline-flex items-center rounded-full border border-[var(--border-color)] bg-[var(--badge-bg)] px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[var(--text-main)]">
                        {i.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center" onClick={(e) => e.stopPropagation()}>
                      {i.status === "DRAFT" ? (
                        <button
                          onClick={() => handleConfirmInvoice(i.id)}
                          className="btn-outline text-[11px] py-1 px-2.5 flex items-center justify-center gap-1 mx-auto border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/10 font-bold"
                        >
                          ✓ Confirm
                        </button>
                      ) : i.due > 0 ? (
                        <button
                          onClick={() => openPaymentModal(i)}
                          className="btn-outline text-[11px] py-1 px-2.5 flex items-center justify-center gap-1 mx-auto"
                        >
                          <CreditCardIcon className="h-3.5 w-3.5" /> Pay
                        </button>
                      ) : null}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* --- INVOICE DETAIL POPUP COMPONENT (MODAL) --- */}
      <Modal
        isOpen={Boolean(viewDetailInvoice)}
        onClose={() => setViewDetailInvoice(null)}
        title={`Customer Invoice ${viewDetailInvoice?.no || ""}`}
        maxWidth="max-w-3xl"
      >
        {viewDetailInvoice && (
          <div className="space-y-4 text-xs">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 rounded-lg bg-[var(--badge-bg)] border border-[var(--border-color)]">
              <div>
                <span className="text-[var(--text-muted)] block text-[10px] uppercase font-bold">Invoice Ref</span>
                <span className="font-mono font-bold text-[var(--text-main)]">{viewDetailInvoice.no}</span>
              </div>
              <div>
                <span className="text-[var(--text-muted)] block text-[10px] uppercase font-bold">Customer</span>
                <span className="font-bold text-[var(--text-main)]">
                  {viewDetailInvoice.customer?.name || contacts.find((c) => c.id === viewDetailInvoice.customerId)?.name || viewDetailInvoice.customerId}
                </span>
              </div>
              <div>
                <span className="text-[var(--text-muted)] block text-[10px] uppercase font-bold">Invoice Date</span>
                <span className="font-mono text-[var(--text-main)]">{new Date(viewDetailInvoice.invDate).toLocaleDateString()}</span>
              </div>
              <div>
                <span className="text-[var(--text-muted)] block text-[10px] uppercase font-bold">Status</span>
                <span className="font-bold text-emerald-400">{viewDetailInvoice.status}</span>
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="font-bold text-xs text-[var(--text-main)]">Invoice Line Items</h4>
              <table className="w-full text-left text-xs border border-[var(--border-color)]">
                <thead>
                  <tr className="border-b border-[var(--border-color)] bg-[var(--badge-bg)] text-[var(--text-muted)] font-bold">
                    <th className="p-2">Product</th>
                    <th className="p-2 text-right">Qty</th>
                    <th className="p-2 text-right">Unit Price</th>
                    <th className="p-2 text-right">Tax (%)</th>
                    <th className="p-2 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border-color)]/60 font-mono">
                  {(viewDetailInvoice.lines || []).map((l: any, idx: number) => (
                    <tr key={l.id || idx}>
                      <td className="p-2 font-sans font-semibold">
                        {l.product?.name || products.find((p) => p.id === l.productId)?.name || l.productId}
                      </td>
                      <td className="p-2 text-right">{l.qty}</td>
                      <td className="p-2 text-right">{formatCurrency(l.unitPrice)}</td>
                      <td className="p-2 text-right">{l.tax}%</td>
                      <td className="p-2 text-right font-bold">{formatCurrency(l.total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex justify-between items-center pt-3 border-t border-[var(--border-color)]">
              <div className="text-[11px] font-mono">
                <span className="text-[var(--text-muted)]">Total Amount: </span>
                <span className="font-bold text-emerald-400 text-sm">{formatCurrency(viewDetailInvoice.total || 0)}</span>
              </div>
              <div className="flex gap-2">
                {viewDetailInvoice.status === "DRAFT" && (
                  <button
                    onClick={() => handleConfirmInvoice(viewDetailInvoice.id)}
                    className="btn-outline px-4 py-2 text-xs font-bold rounded-lg bg-emerald-500/20 text-emerald-300 border-emerald-500/40 hover:bg-emerald-500/30"
                  >
                    Confirm Invoice
                  </button>
                )}
                {viewDetailInvoice.status !== "DRAFT" && viewDetailInvoice.due > 0 && (
                  <button
                    onClick={() => {
                      const inv = viewDetailInvoice;
                      setViewDetailInvoice(null);
                      openPaymentModal(inv);
                    }}
                    className="btn-outline px-4 py-2 text-xs font-bold rounded-lg bg-[var(--badge-bg)]"
                  >
                    Pay Invoice Now
                  </button>
                )}
                <button
                  onClick={() => setViewDetailInvoice(null)}
                  className="btn-outline px-4 py-2 text-xs font-bold rounded-lg"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Create Invoice Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="card-mono w-full max-w-3xl p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-4">
              <h2 className="text-lg font-bold text-[var(--text-main)]">Create Customer Invoice</h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-[var(--text-muted)] hover:text-[var(--text-main)] font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateInvoice} className="mt-5 space-y-4">
              {errorMsg && (
                <div className="rounded-lg bg-red-500/10 border border-red-500/30 p-3 text-xs text-red-500 font-medium">
                  {errorMsg}
                </div>
              )}

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div>
                  <label className="block text-xs font-semibold text-[var(--text-muted)] mb-1">
                    Customer *
                  </label>
                  <select
                    value={customerId}
                    onChange={(e) => setCustomerId(e.target.value)}
                    className="w-full rounded-lg border border-[var(--border-color)] bg-[var(--bg-primary)] px-3 py-2 text-xs text-[var(--text-main)]"
                    required
                  >
                    <option value="">-- Select Customer --</option>
                    {contacts.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[var(--text-muted)] mb-1">
                    Invoice Reference
                  </label>
                  <input
                    type="text"
                    value={invRef}
                    onChange={(e) => setInvRef(e.target.value)}
                    className="w-full rounded-lg border border-[var(--border-color)] bg-[var(--bg-primary)] px-3 py-2 text-xs text-[var(--text-main)]"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[var(--text-muted)] mb-1">
                    Invoice Date / Due Date
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="date"
                      value={invDate}
                      onChange={(e) => setInvDate(e.target.value)}
                      className="w-1/2 rounded-lg border border-[var(--border-color)] bg-[var(--bg-primary)] p-1.5 text-xs text-[var(--text-main)]"
                    />
                    <input
                      type="date"
                      value={dueDate}
                      onChange={(e) => setDueDate(e.target.value)}
                      className="w-1/2 rounded-lg border border-[var(--border-color)] bg-[var(--bg-primary)] p-1.5 text-xs text-[var(--text-main)]"
                    />
                  </div>
                </div>
              </div>

              {/* Line Items Table */}
              <div className="mt-4">
                <label className="block text-xs font-bold text-[var(--text-main)] uppercase tracking-wider mb-2">
                  Invoice Lines
                </label>
                <div className="overflow-x-auto rounded-lg border border-[var(--border-color)]">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[var(--badge-bg)] border-b border-[var(--border-color)] text-[var(--text-muted)] font-bold uppercase">
                      <tr>
                        <th className="py-2.5 px-3">Product</th>
                        <th className="py-2.5 px-3">Analytic Account</th>
                        <th className="py-2.5 px-3 w-20">Qty</th>
                        <th className="py-2.5 px-3 w-28 text-right">Unit Price</th>
                        <th className="py-2.5 px-3 w-24 text-right">Tax (%)</th>
                        <th className="py-2.5 px-3 w-28 text-right">Line Total</th>
                        <th className="py-2.5 px-3 w-10 text-center"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--border-color)]">
                      {lines.map((line, idx) => {
                        const lineSub = line.qty * line.unitPrice;
                        const lineTax = lineSub * ((line.tax || 0) / 100);
                        const lineTotal = lineSub + lineTax;
                        return (
                          <tr key={idx}>
                            <td className="p-2">
                              <select
                                value={line.productId}
                                onChange={(e) => handleLineChange(idx, "productId", e.target.value)}
                                className="w-full rounded border border-[var(--border-color)] bg-[var(--bg-primary)] p-1.5 text-xs text-[var(--text-main)]"
                                required
                              >
                                <option value="">-- Select Product --</option>
                                {products.map((p) => (
                                  <option key={p.id} value={p.id}>
                                    {p.name} (₹{p.salesPrice})
                                  </option>
                                ))}
                              </select>
                            </td>
                            <td className="p-2">
                              <select
                                value={line.analyticId || ""}
                                onChange={(e) => handleLineChange(idx, "analyticId", e.target.value)}
                                className="w-full rounded border border-[var(--border-color)] bg-[var(--bg-primary)] p-1.5 text-xs text-[var(--text-main)]"
                              >
                                <option value="">-- Default / None --</option>
                                {analytics.map((a) => (
                                  <option key={a.id} value={a.id}>
                                    {a.name}
                                  </option>
                                ))}
                              </select>
                            </td>
                            <td className="p-2">
                              <input
                                type="number"
                                min="1"
                                value={line.qty}
                                onChange={(e) => handleLineChange(idx, "qty", e.target.value)}
                                className="w-full rounded border border-[var(--border-color)] bg-[var(--bg-primary)] p-1.5 text-xs text-[var(--text-main)] text-center"
                              />
                            </td>
                            <td className="p-2">
                              <input
                                type="number"
                                step="0.01"
                                min="0"
                                value={line.unitPrice}
                                onChange={(e) => handleLineChange(idx, "unitPrice", e.target.value)}
                                className="w-full rounded border border-[var(--border-color)] bg-[var(--bg-primary)] p-1.5 text-xs text-[var(--text-main)] text-right"
                              />
                            </td>
                            <td className="p-2">
                              <input
                                type="number"
                                step="0.1"
                                min="0"
                                value={line.tax}
                                onChange={(e) => handleLineChange(idx, "tax", e.target.value)}
                                className="w-full rounded border border-[var(--border-color)] bg-[var(--bg-primary)] p-1.5 text-xs text-[var(--text-main)] text-right"
                              />
                            </td>
                            <td className="p-2 text-right font-bold text-[var(--text-main)]">
                              {formatCurrency(lineTotal)}
                            </td>
                            <td className="p-2 text-center">
                              {lines.length > 1 && (
                                <button
                                  type="button"
                                  onClick={() => handleRemoveLine(idx)}
                                  className="text-red-500 hover:text-red-700 font-bold"
                                >
                                  ✕
                                </button>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                <button
                  type="button"
                  onClick={handleAddLine}
                  className="mt-2 text-xs font-semibold text-[var(--text-main)] underline hover:opacity-80"
                >
                  + Add Line Item
                </button>
              </div>

              {/* Total Calculation */}
              <div className="mt-4 rounded-lg border border-[var(--border-color)] bg-[var(--badge-bg)] p-4 text-xs space-y-1.5 text-right">
                <div className="flex justify-between">
                  <span className="text-[var(--text-muted)]">Subtotal:</span>
                  <span className="font-semibold text-[var(--text-main)]">
                    {formatCurrency(calculateSubtotal())}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--text-muted)]">Tax Amount:</span>
                  <span className="font-semibold text-[var(--text-main)]">
                    {formatCurrency(calculateTax())}
                  </span>
                </div>
                <div className="flex justify-between text-sm font-black border-t border-[var(--border-color)] pt-2 mt-2 text-[var(--text-main)]">
                  <span>Grand Total:</span>
                  <span>{formatCurrency(calculateTotal())}</span>
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-3 border-t border-[var(--border-color)] pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="btn-outline text-xs px-4 py-2"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="btn-primary text-xs px-5 py-2 disabled:opacity-50"
                >
                  {saving ? "Posting..." : "Create & Post Invoice"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Payment Registration Modal */}
      {showPayModal && selectedInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="card-mono w-full max-w-md p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-3">
              <h2 className="text-base font-bold text-[var(--text-main)]">
                Register Payment ({selectedInvoice.no})
              </h2>
              <button
                onClick={() => setShowPayModal(false)}
                className="text-[var(--text-muted)] font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleRegisterPayment} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[var(--text-muted)] mb-1">
                  Payment Amount (₹)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  max={selectedInvoice.due}
                  value={payAmount}
                  onChange={(e) => setPayAmount(Number(e.target.value))}
                  className="w-full rounded-lg border border-[var(--border-color)] bg-[var(--bg-primary)] px-3 py-2 text-xs text-[var(--text-main)] font-bold"
                  required
                />
                <p className="mt-1 text-[10px] text-[var(--text-muted)]">
                  Remaining balance due: {formatCurrency(selectedInvoice.due)}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[var(--text-muted)] mb-1">
                    Payment Method
                  </label>
                  <select
                    value={payVia}
                    onChange={(e) => setPayVia(e.target.value as any)}
                    className="w-full rounded-lg border border-[var(--border-color)] bg-[var(--bg-primary)] px-3 py-2 text-xs text-[var(--text-main)]"
                  >
                    <option value="BANK">BANK</option>
                    <option value="CASH">CASH</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[var(--text-muted)] mb-1">
                    Payment Date
                  </label>
                  <input
                    type="date"
                    value={payDate}
                    onChange={(e) => setPayDate(e.target.value)}
                    className="w-full rounded-lg border border-[var(--border-color)] bg-[var(--bg-primary)] p-1.5 text-xs text-[var(--text-main)]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--text-muted)] mb-1">
                  Memo / Note
                </label>
                <input
                  type="text"
                  placeholder="Optional memo..."
                  value={payNote}
                  onChange={(e) => setPayNote(e.target.value)}
                  className="w-full rounded-lg border border-[var(--border-color)] bg-[var(--bg-primary)] px-3 py-2 text-xs text-[var(--text-main)]"
                />
              </div>

              <div className="mt-6 flex justify-end gap-3 border-t border-[var(--border-color)] pt-3">
                <button
                  type="button"
                  onClick={() => setShowPayModal(false)}
                  className="btn-outline text-xs px-3 py-1.5"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="btn-primary text-xs px-4 py-1.5 disabled:opacity-50"
                >
                  {saving ? "Processing..." : "Confirm Payment"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
