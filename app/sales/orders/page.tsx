"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";

interface LineItem {
  productId: string;
  qty: number;
  unitPrice: number;
  tax: number;
}

export default function SalesOrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [contacts, setContacts] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [showModal, setShowModal] = useState(false);

  // Form state
  const [customerId, setCustomerId] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [lines, setLines] = useState<LineItem[]>([
    { productId: "", qty: 1, unitPrice: 0, tax: 0 },
  ]);
  const [errorMsg, setErrorMsg] = useState("");
  const [saving, setSaving] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [soRes, contactRes, prodRes] = await Promise.all([
        fetch("/api/sales/orders").then((r) => r.json()),
        fetch("/api/contacts").then((r) => r.json()).catch(() => ({ contacts: [] })),
        fetch("/api/products").then((r) => r.json()).catch(() => ({ products: [] })),
      ]);
      setOrders(soRes.orders || []);
      setContacts(contactRes.contacts || []);
      setProducts(prodRes.products || []);
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
    setLines([...lines, { productId: "", qty: 1, unitPrice: 0, tax: 0 }]);
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
    } else {
      (next[idx] as any)[field] = Number(val);
    }
    setLines(next);
  };

  const calculateSubtotal = () =>
    lines.reduce((s, l) => s + l.qty * l.unitPrice, 0);

  const calculateTax = () =>
    lines.reduce((s, l) => s + l.qty * l.unitPrice * ((l.tax || 0) / 100), 0);

  const calculateTotal = () => calculateSubtotal() + calculateTax();

  const handleSubmit = async (e: React.FormEvent) => {
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
      const res = await fetch("/api/sales/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ customerId, date, lines }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to create Sales Order");
      }
      setShowModal(false);
      // Reset form
      setCustomerId("");
      setLines([{ productId: "", qty: 1, unitPrice: 0, tax: 0 }]);
      loadData();
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setSaving(false);
    }
  };

  const filteredOrders = orders.filter((o) => {
    const matchesQ =
      o.no.toLowerCase().includes(q.toLowerCase()) ||
      o.customerId.toLowerCase().includes(q.toLowerCase());
    const matchesStatus = statusFilter === "ALL" || o.status === statusFilter;
    return matchesQ && matchesStatus;
  });

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(val);

  return (
    <main className="mx-auto max-w-7xl px-6 py-8">
      {/* Header & Controls */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between border-b border-[var(--border-color)] pb-6">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-[var(--text-main)]">
            Sales Orders
          </h1>
          <p className="mt-1 text-xs text-[var(--text-muted)]">
            Manage customer quotations and confirmed sales orders.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowModal(true)}
            className="btn-primary text-xs flex items-center gap-1.5 py-2 px-4"
          >
            <span>+</span> Create Sales Order
          </button>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <input
            type="text"
            placeholder="Search by SO # or Customer..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="rounded-lg border border-[var(--border-color)] bg-[var(--card-bg)] px-3 py-1.5 text-xs text-[var(--text-main)] focus:outline-none focus:border-[var(--text-main)] w-64"
          />
        </div>
        <div className="flex items-center gap-1 rounded-lg border border-[var(--border-color)] bg-[var(--badge-bg)] p-1 text-xs font-semibold">
          {["ALL", "DRAFT", "CONFIRMED"].map((st) => (
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
              Loading sales orders...
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="py-16 text-center text-xs text-[var(--text-muted)]">
              No sales orders found matching your criteria.
            </div>
          ) : (
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[var(--border-color)] bg-[var(--badge-bg)] text-[var(--text-muted)] font-bold uppercase tracking-wider">
                  <th className="py-3.5 px-4">SO #</th>
                  <th className="py-3.5 px-4">Date</th>
                  <th className="py-3.5 px-4">Customer</th>
                  <th className="py-3.5 px-4 text-right">Subtotal</th>
                  <th className="py-3.5 px-4 text-right">Tax Total</th>
                  <th className="py-3.5 px-4 text-right">Total Amount</th>
                  <th className="py-3.5 px-4 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-color)]/60">
                {filteredOrders.map((o) => (
                  <tr key={o.id} className="hover:bg-[var(--card-hover)] transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-[var(--text-main)]">
                      {o.no}
                    </td>
                    <td className="py-3.5 px-4 text-[var(--text-muted)]">
                      {new Date(o.date).toLocaleDateString()}
                    </td>
                    <td className="py-3.5 px-4 font-medium text-[var(--text-main)]">
                      {o.customerId}
                    </td>
                    <td className="py-3.5 px-4 text-right text-[var(--text-muted)]">
                      {formatCurrency(o.subtotal || 0)}
                    </td>
                    <td className="py-3.5 px-4 text-right text-[var(--text-muted)]">
                      {formatCurrency(o.taxTotal || 0)}
                    </td>
                    <td className="py-3.5 px-4 text-right font-bold text-[var(--text-main)]">
                      {formatCurrency(o.total || 0)}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span className="inline-flex items-center rounded-full border border-[var(--border-color)] bg-[var(--badge-bg)] px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[var(--text-main)]">
                        {o.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Create Sales Order Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="card-mono w-full max-w-3xl p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-4">
              <h2 className="text-lg font-bold text-[var(--text-main)]">Create New Sales Order</h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-[var(--text-muted)] hover:text-[var(--text-main)] text-base font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="mt-5 space-y-4">
              {errorMsg && (
                <div className="rounded-lg bg-red-500/10 border border-red-500/30 p-3 text-xs text-red-500 font-medium">
                  {errorMsg}
                </div>
              )}

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-semibold text-[var(--text-muted)] mb-1">
                    Customer *
                  </label>
                  <select
                    value={customerId}
                    onChange={(e) => setCustomerId(e.target.value)}
                    className="w-full rounded-lg border border-[var(--border-color)] bg-[var(--bg-primary)] px-3 py-2 text-xs text-[var(--text-main)] focus:outline-none"
                    required
                  >
                    <option value="">-- Select Customer --</option>
                    {contacts.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.email})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[var(--text-muted)] mb-1">
                    Order Date
                  </label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full rounded-lg border border-[var(--border-color)] bg-[var(--bg-primary)] px-3 py-2 text-xs text-[var(--text-main)] focus:outline-none"
                  />
                </div>
              </div>

              {/* Line Items Editor Table */}
              <div className="mt-4">
                <label className="block text-xs font-bold text-[var(--text-main)] uppercase tracking-wider mb-2">
                  Order Line Items
                </label>
                <div className="overflow-x-auto rounded-lg border border-[var(--border-color)]">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[var(--badge-bg)] border-b border-[var(--border-color)] text-[var(--text-muted)] font-bold uppercase">
                      <tr>
                        <th className="py-2.5 px-3">Product</th>
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
                                <option value="">-- Select Item --</option>
                                {products.map((p) => (
                                  <option key={p.id} value={p.id}>
                                    {p.name} (₹{p.salesPrice})
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

              {/* Order Calculations Summary */}
              <div className="mt-4 rounded-lg border border-[var(--border-color)] bg-[var(--badge-bg)] p-4 text-xs space-y-1.5 text-right">
                <div className="flex justify-between">
                  <span className="text-[var(--text-muted)]">Subtotal:</span>
                  <span className="font-semibold text-[var(--text-main)]">
                    {formatCurrency(calculateSubtotal())}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--text-muted)]">Estimated Tax:</span>
                  <span className="font-semibold text-[var(--text-main)]">
                    {formatCurrency(calculateTax())}
                  </span>
                </div>
                <div className="flex justify-between text-sm font-black border-t border-[var(--border-color)] pt-2 mt-2 text-[var(--text-main)]">
                  <span>Grand Total:</span>
                  <span>{formatCurrency(calculateTotal())}</span>
                </div>
              </div>

              {/* Submit Buttons */}
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
                  {saving ? "Creating..." : "Save Sales Order"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
