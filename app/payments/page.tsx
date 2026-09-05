"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Modal from "@/components/Modal";
import { RefreshIcon, DownloadIcon, InboxArrowDownIcon, PaperAirplaneIcon } from "@/components/Icons";
import { downloadCSV } from "@/lib/export";

interface PaymentRecord {
  id: string;
  partnerId: string;
  partner?: { id: string; name: string; type: string };
  billId?: string;
  bill?: { id: string; no: string; billRef: string; due: number; subtotal: number };
  invoiceId?: string;
  invoice?: { id: string; no: string; invRef: string; due: number; total: number };
  amount: number;
  date: string;
  via: "CASH" | "BANK";
  note?: string;
  journalEntryId?: string;
  createdAt: string;
}

interface OpenInvoice {
  id: string;
  no: string;
  invRef: string;
  due: number;
  total: number;
  customer?: { id: string; name: string };
  customerId: string;
}

interface OpenBill {
  id: string;
  no: string;
  billRef: string;
  due: number;
  subtotal: number;
  vendor?: { id: string; name: string };
  vendorId: string;
}

export default function PaymentsPage() {
  const router = useRouter();
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [openInvoices, setOpenInvoices] = useState<OpenInvoice[]>([]);
  const [openBills, setOpenBills] = useState<OpenBill[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<"ALL" | "INBOUND" | "OUTBOUND" | "BANK" | "CASH">("ALL");

  // Register Payment Modal state
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [payType, setPayType] = useState<"INVOICE" | "BILL">("INVOICE");
  const [selectedDocId, setSelectedDocId] = useState<string>("");
  const [payAmount, setPayAmount] = useState<number>(0);
  const [payVia, setPayVia] = useState<"BANK" | "CASH">("BANK");
  const [payDate, setPayDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [payNote, setPayNote] = useState<string>("");
  const [saving, setSaving] = useState(false);
  const [formErr, setFormErr] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Inspect Detail Modal state
  const [inspectPayment, setInspectPayment] = useState<PaymentRecord | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/payments")
        .then((r) => r.json().catch(() => ({ payments: [], openInvoices: [], openBills: [] })))
        .catch(() => ({ payments: [], openInvoices: [], openBills: [] }));

      setPayments(res.payments || []);
      setOpenInvoices(res.openInvoices || []);
      setOpenBills(res.openBills || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const openRegister = (type: "INVOICE" | "BILL" = "INVOICE") => {
    setPayType(type);
    setSelectedDocId("");
    setPayAmount(0);
    setPayVia("BANK");
    setPayDate(new Date().toISOString().slice(0, 10));
    setPayNote("");
    setFormErr("");
    setSuccessMsg("");
    setShowRegisterModal(true);
  };

  // When selected document changes in modal, auto-fill amount & info
  const handleDocChange = (docId: string) => {
    setSelectedDocId(docId);
    if (payType === "INVOICE") {
      const inv = openInvoices.find((i) => i.id === docId);
      if (inv) setPayAmount(inv.due);
    } else {
      const bill = openBills.find((b) => b.id === docId);
      if (bill) setPayAmount(bill.due);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormErr("");
    setSuccessMsg("");

    if (!selectedDocId) {
      setFormErr("Please select an outstanding Invoice or Vendor Bill to pay.");
      return;
    }
    if (!payAmount || payAmount <= 0) {
      setFormErr("Payment amount must be greater than 0.");
      return;
    }

    setSaving(true);
    try {
      let payload: any = {
        amount: Number(payAmount),
        via: payVia,
        date: payDate,
        note: payNote,
      };

      if (payType === "INVOICE") {
        const inv = openInvoices.find((i) => i.id === selectedDocId);
        if (!inv) throw new Error("Selected invoice not found");
        payload.invoiceId = inv.id;
        payload.partnerId = inv.customerId;
      } else {
        const bill = openBills.find((b) => b.id === selectedDocId);
        if (!bill) throw new Error("Selected bill not found");
        payload.billId = bill.id;
        payload.partnerId = bill.vendorId;
      }

      const res = await fetch("/api/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const resData = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(resData.error || "Failed to record payment");
      }

      setSuccessMsg("Payment registered and posted successfully!");
      await loadData();
      setTimeout(() => {
        setShowRegisterModal(false);
      }, 650);
    } catch (err: any) {
      setFormErr(err.message || "Failed to record payment");
    } finally {
      setSaving(false);
    }
  };

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 }).format(val);

  const formatDate = (dateStr?: string) =>
    dateStr ? new Date(dateStr).toLocaleDateString("en-IN", { day: "2-digit", month: "2-digit", year: "numeric" }) : "-";

  // Filter payments
  const filteredPayments = payments.filter((p) => {
    const q = search.toLowerCase();
    const matchesSearch =
      p.id.toLowerCase().includes(q) ||
      p.partner?.name?.toLowerCase().includes(q) ||
      p.note?.toLowerCase().includes(q) ||
      p.invoice?.no?.toLowerCase().includes(q) ||
      p.bill?.no?.toLowerCase().includes(q);

    if (!matchesSearch) return false;

    if (activeTab === "INBOUND") return !!p.invoiceId;
    if (activeTab === "OUTBOUND") return !!p.billId;
    if (activeTab === "BANK") return p.via === "BANK";
    if (activeTab === "CASH") return p.via === "CASH";

    return true;
  });

  // KPI Calculations
  const totalCount = payments.length;
  const totalAmount = payments.reduce((s, p) => s + (p.amount || 0), 0);
  const inboundTotal = payments.filter((p) => p.invoiceId).reduce((s, p) => s + (p.amount || 0), 0);
  const outboundTotal = payments.filter((p) => p.billId).reduce((s, p) => s + (p.amount || 0), 0);
  const bankTotal = payments.filter((p) => p.via === "BANK").reduce((s, p) => s + (p.amount || 0), 0);

  return (
    <main className="mx-auto max-w-7xl px-6 py-8">
      {/* HEADER CONTROL BAR matching _list.tsx */}
      <div className="flex flex-wrap items-center justify-between gap-4 card-mono p-4 mb-6 shadow-md">
        <div className="flex items-center gap-3">
          <button
            onClick={() => openRegister("INVOICE")}
            className="btn-outline px-5 py-2 text-xs font-bold rounded-lg border-2 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20"
          >
            + Customer Receipt
          </button>

          <button
            onClick={() => openRegister("BILL")}
            className="btn-outline px-5 py-2 text-xs font-bold rounded-lg border-2 bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30 hover:bg-rose-500/20"
          >
            - Vendor Payment
          </button>

          <div className="relative">
            <input
              type="text"
              placeholder="Search payments..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-64 rounded-lg border border-[var(--border-color)] bg-[var(--bg-primary)] px-3.5 py-1.5 text-xs text-[var(--text-main)] focus:outline-none focus:border-[var(--text-main)] font-mono"
            />
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              const exportRows = filteredPayments.map((p) => ({
                "Payment Ref": `PAY-${p.id.slice(-6)}`,
                Date: p.date ? p.date.slice(0, 10) : "",
                Partner: p.partner?.name || p.partnerId,
                Type: p.invoiceId ? "Customer Receipt" : "Vendor Disbursement",
                "Doc Ref": p.invoice?.no || p.bill?.no || "",
                Method: p.via,
                Amount: p.amount,
                Note: p.note || "",
              }));
              downloadCSV("Payments_Ledger", exportRows);
            }}
            className="btn-outline px-4 py-2 text-xs font-bold rounded-lg border-2 border-cyan-500/30 text-cyan-600 dark:text-cyan-400 bg-cyan-500/10 hover:bg-cyan-500/20 flex items-center gap-1.5"
          >
            <DownloadIcon className="h-4 w-4" /> Export CSV
          </button>
          <button
            onClick={() => router.push("/dashboard")}
            className="btn-outline px-5 py-2 text-xs font-bold rounded-lg"
          >
            Back
          </button>
          <button onClick={loadData} className="btn-outline p-2 rounded-lg" title="Refresh">
            <RefreshIcon className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* TOP KPI METRIC SUMMARY CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="card-mono p-4 bg-purple-500/5 border-purple-500/20">
          <div className="text-[10px] font-extrabold uppercase tracking-wider text-purple-700 dark:text-purple-400">
            Total Payments Processed
          </div>
          <div className="text-xl font-black font-mono mt-1 text-[var(--text-main)]">
            {formatCurrency(totalAmount)}
          </div>
          <div className="text-[11px] text-[var(--text-muted)] mt-1 font-medium">
            {totalCount} Total Recorded Transactions
          </div>
        </div>

        <div className="card-mono p-4 bg-emerald-500/5 border-emerald-500/20">
          <div className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
            Customer Receipts (Inbound)
          </div>
          <div className="text-xl font-black font-mono mt-1 text-[var(--text-main)]">
            {formatCurrency(inboundTotal)}
          </div>
          <div className="text-[11px] text-[var(--text-muted)] mt-1 font-medium">
            Received for Customer Invoices
          </div>
        </div>

        <div className="card-mono p-4 bg-rose-500/5 border-rose-500/20">
          <div className="text-[10px] font-extrabold uppercase tracking-wider text-rose-700 dark:text-rose-400">
            Vendor Disbursements (Outbound)
          </div>
          <div className="text-xl font-black font-mono mt-1 text-[var(--text-main)]">
            {formatCurrency(outboundTotal)}
          </div>
          <div className="text-[11px] text-[var(--text-muted)] mt-1 font-medium">
            Paid for Vendor Bills
          </div>
        </div>

        <div className="card-mono p-4 bg-cyan-500/5 border-cyan-500/20">
          <div className="text-[10px] font-extrabold uppercase tracking-wider text-cyan-700 dark:text-cyan-400">
            Bank Payments Ratio
          </div>
          <div className="text-xl font-black font-mono mt-1 text-[var(--text-main)]">
            {formatCurrency(bankTotal)}
          </div>
          <div className="text-[11px] text-[var(--text-muted)] mt-1 font-medium">
            Processed via Bank Transfer
          </div>
        </div>
      </div>

      {/* CATEGORY TABS */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-2 mb-4 border-b border-[var(--border-color)] text-xs">
        {[
          { id: "ALL", label: "All Payments" },
          { id: "INBOUND", label: "Customer Receipts (Inbound)" },
          { id: "OUTBOUND", label: "Vendor Disbursements (Outbound)" },
          { id: "BANK", label: "Bank Method" },
          { id: "CASH", label: "Cash Method" },
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

      {/* REGISTER PAYMENT MODAL */}
      <Modal
        isOpen={showRegisterModal}
        onClose={() => setShowRegisterModal(false)}
        title={payType === "INVOICE" ? "Register Customer Receipt (Inbound)" : "Register Vendor Payment (Outbound)"}
      >
        <div className="p-2">
          {formErr && (
            <div className="mb-4 rounded-lg bg-red-500/10 border border-red-500/30 p-3 text-xs text-red-600 font-semibold text-center">
              {formErr}
            </div>
          )}
          {successMsg && (
            <div className="mb-4 rounded-lg bg-emerald-500/10 border border-emerald-500/30 p-3 text-xs text-emerald-600 font-semibold text-center">
              {successMsg}
            </div>
          )}

          <form onSubmit={handleRegisterSubmit} className="space-y-4 text-xs">
            {/* Payment Type Selection */}
            <div>
              <label className="block font-bold text-xs text-[var(--text-main)] mb-1 uppercase tracking-wider">
                Payment Type
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setPayType("INVOICE");
                    setSelectedDocId("");
                    setPayAmount(0);
                  }}
                  className={`p-2.5 rounded-lg border font-bold text-center transition-all flex items-center justify-center gap-2 ${
                    payType === "INVOICE"
                      ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/40"
                      : "btn-outline text-[var(--text-muted)]"
                  }`}
                >
                  <InboxArrowDownIcon className="h-4 w-4" /> Customer Receipt (Inbound)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setPayType("BILL");
                    setSelectedDocId("");
                    setPayAmount(0);
                  }}
                  className={`p-2.5 rounded-lg border font-bold text-center transition-all flex items-center justify-center gap-2 ${
                    payType === "BILL"
                      ? "bg-rose-500/10 text-rose-600 border-rose-500/40"
                      : "btn-outline text-[var(--text-muted)]"
                  }`}
                >
                  <PaperAirplaneIcon className="h-4 w-4" /> Vendor Payment (Outbound)
                </button>
              </div>
            </div>

            {/* Document Selection (Invoice vs Bill) */}
            <div>
              <label className="block font-bold text-xs text-[var(--text-main)] mb-1 uppercase tracking-wider">
                {payType === "INVOICE" ? "Select Outstanding Customer Invoice *" : "Select Outstanding Vendor Bill *"}
              </label>
              {payType === "INVOICE" ? (
                <select
                  value={selectedDocId}
                  onChange={(e) => handleDocChange(e.target.value)}
                  className="w-full rounded-lg border border-[var(--border-color)] bg-[var(--bg-primary)] px-3.5 py-2 text-xs text-[var(--text-main)] font-semibold outline-none focus:border-[var(--text-main)]"
                  required
                >
                  <option value="">-- Choose Outstanding Invoice --</option>
                  {openInvoices.map((inv) => (
                    <option key={inv.id} value={inv.id}>
                      {inv.no} — {inv.customer?.name || "Customer"} (Due: {formatCurrency(inv.due)})
                    </option>
                  ))}
                </select>
              ) : (
                <select
                  value={selectedDocId}
                  onChange={(e) => handleDocChange(e.target.value)}
                  className="w-full rounded-lg border border-[var(--border-color)] bg-[var(--bg-primary)] px-3.5 py-2 text-xs text-[var(--text-main)] font-semibold outline-none focus:border-[var(--text-main)]"
                  required
                >
                  <option value="">-- Choose Outstanding Vendor Bill --</option>
                  {openBills.map((bill) => (
                    <option key={bill.id} value={bill.id}>
                      {bill.no} — {bill.vendor?.name || "Vendor"} (Due: {formatCurrency(bill.due)})
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Payment Amount & Method */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block font-bold text-xs text-[var(--text-main)] mb-1 uppercase tracking-wider">
                  Payment Amount (INR ₹) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={payAmount}
                  onChange={(e) => setPayAmount(parseFloat(e.target.value) || 0)}
                  placeholder="0.00"
                  className="w-full font-mono font-bold rounded-lg border border-[var(--border-color)] bg-[var(--bg-primary)] px-3.5 py-2 text-xs text-[var(--text-main)] outline-none focus:border-[var(--text-main)]"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-xs text-[var(--text-main)] mb-1 uppercase tracking-wider">
                  Payment Method *
                </label>
                <select
                  value={payVia}
                  onChange={(e) => setPayVia(e.target.value as any)}
                  className="w-full rounded-lg border border-[var(--border-color)] bg-[var(--bg-primary)] px-3.5 py-2 text-xs text-[var(--text-main)] font-semibold outline-none focus:border-[var(--text-main)]"
                >
                  <option value="BANK">Bank Account / Transfer</option>
                  <option value="CASH">Cash in Hand</option>
                </select>
              </div>
            </div>

            {/* Payment Date & Memo */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block font-bold text-xs text-[var(--text-main)] mb-1 uppercase tracking-wider">
                  Payment Date *
                </label>
                <input
                  type="date"
                  value={payDate}
                  onChange={(e) => setPayDate(e.target.value)}
                  className="w-full rounded-lg border border-[var(--border-color)] bg-[var(--bg-primary)] px-3.5 py-2 text-xs text-[var(--text-main)] font-semibold outline-none focus:border-[var(--text-main)]"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-xs text-[var(--text-main)] mb-1 uppercase tracking-wider">
                  Memo / Reference Note
                </label>
                <input
                  type="text"
                  value={payNote}
                  onChange={(e) => setPayNote(e.target.value)}
                  placeholder="e.g. Bank Ref #94827"
                  className="w-full rounded-lg border border-[var(--border-color)] bg-[var(--bg-primary)] px-3.5 py-2 text-xs text-[var(--text-main)] outline-none focus:border-[var(--text-main)]"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-[var(--border-color)]">
              <button
                type="button"
                onClick={() => setShowRegisterModal(false)}
                className="btn-outline px-4 py-2 text-xs font-bold rounded-lg"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="btn-primary px-5 py-2 text-xs font-bold rounded-lg shadow-md"
              >
                {saving ? "Posting..." : "Confirm & Post Payment"}
              </button>
            </div>
          </form>
        </div>
      </Modal>

      {/* INSPECT PAYMENT DETAIL MODAL */}
      <Modal
        isOpen={Boolean(inspectPayment)}
        onClose={() => setInspectPayment(null)}
        title={`Payment Voucher - PAY-${inspectPayment?.id.slice(-6)}`}
      >
        {inspectPayment && (
          <div className="space-y-4 text-xs">
            <div className="card-mono p-4 bg-[var(--badge-bg)] space-y-3">
              <div className="flex justify-between items-center border-b border-[var(--border-color)] pb-3">
                <div>
                  <h3 className="font-extrabold text-base text-[var(--text-main)] font-mono">
                    PAY-{inspectPayment.id.slice(-6)}
                  </h3>
                  <span className="text-[11px] text-[var(--text-muted)]">
                    Date: {formatDate(inspectPayment.date)}
                  </span>
                </div>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-black uppercase ${
                    inspectPayment.invoiceId
                      ? "bg-emerald-500/10 text-emerald-600"
                      : "bg-rose-500/10 text-rose-600"
                  }`}
                >
                  {inspectPayment.invoiceId ? "Customer Receipt" : "Vendor Disbursement"}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <span className="text-[var(--text-muted)] font-semibold block uppercase text-[10px]">Partner Name</span>
                  <span className="font-bold text-[var(--text-main)] text-sm">{inspectPayment.partner?.name || inspectPayment.partnerId}</span>
                </div>
                <div>
                  <span className="text-[var(--text-muted)] font-semibold block uppercase text-[10px]">Payment Amount</span>
                  <span className="font-mono font-black text-sm text-[var(--text-main)]">{formatCurrency(inspectPayment.amount)}</span>
                </div>
                <div>
                  <span className="text-[var(--text-muted)] font-semibold block uppercase text-[10px]">Payment Method</span>
                  <span className="font-bold text-[var(--text-main)]">{inspectPayment.via}</span>
                </div>
                <div>
                  <span className="text-[var(--text-muted)] font-semibold block uppercase text-[10px]">Document Ref</span>
                  <span className="font-mono font-bold text-[var(--text-main)]">
                    {inspectPayment.invoice ? `Invoice: ${inspectPayment.invoice.no}` : inspectPayment.bill ? `Bill: ${inspectPayment.bill.no}` : "-"}
                  </span>
                </div>
              </div>

              {inspectPayment.note && (
                <div className="pt-2 border-t border-[var(--border-color)]/60">
                  <span className="text-[var(--text-muted)] font-semibold block uppercase text-[10px]">Memo Note</span>
                  <span className="text-[var(--text-main)] italic">{inspectPayment.note}</span>
                </div>
              )}
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setInspectPayment(null)}
                className="btn-outline px-5 py-2 text-xs font-bold rounded-lg"
              >
                Close Receipt
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* PAYMENTS DATA TABLE */}
      <div className="card-mono shadow-2xl overflow-hidden">
        <div className="p-4 border-b border-[var(--border-color)] bg-[var(--badge-bg)] flex justify-between items-center">
          <h2 className="text-lg font-black text-[var(--text-main)]">
            Payments Ledger
          </h2>
          <span className="text-xs font-bold font-mono text-[var(--text-muted)]">
            Showing {filteredPayments.length} of {payments.length} Payments
          </span>
        </div>

        <div className="overflow-x-auto">
          {loading ? (
            <div className="py-16 text-center text-xs text-[var(--text-muted)]">
              Loading payments ledger...
            </div>
          ) : filteredPayments.length === 0 ? (
            <div className="py-16 text-center text-xs text-[var(--text-muted)]">
              No payments match the current filter.
            </div>
          ) : (
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-[var(--border-color)] bg-[var(--card-bg)] text-[var(--text-muted)] font-extrabold uppercase tracking-wider text-[10px]">
                  <th className="py-3.5 px-4">Payment Ref</th>
                  <th className="py-3.5 px-4">Date</th>
                  <th className="py-3.5 px-4">Partner</th>
                  <th className="py-3.5 px-4">Type</th>
                  <th className="py-3.5 px-4">Document Ref</th>
                  <th className="py-3.5 px-4">Method</th>
                  <th className="py-3.5 px-4 text-right">Amount</th>
                  <th className="py-3.5 px-4">Memo</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-color)]/60">
                {filteredPayments.map((p) => {
                  const isInbound = !!p.invoiceId;

                  return (
                    <tr
                      key={p.id}
                      onClick={() => setInspectPayment(p)}
                      className="hover:bg-[var(--card-hover)] cursor-pointer transition-colors"
                    >
                      <td className="py-3.5 px-4 font-mono font-bold text-[var(--text-main)]">
                        PAY-{p.id.slice(-6)}
                      </td>
                      <td className="py-3.5 px-4 text-[var(--text-main)] font-mono">
                        {formatDate(p.date)}
                      </td>
                      <td className="py-3.5 px-4 font-bold text-[var(--text-main)]">
                        {p.partner?.name || p.partnerId}
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-block rounded-md px-2 py-0.5 text-[10px] font-extrabold uppercase ${
                            isInbound
                              ? "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20"
                              : "bg-rose-500/10 text-rose-600 border border-rose-500/20"
                          }`}
                        >
                          {isInbound ? "Receipt" : "Disbursement"}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-mono text-[var(--text-main)] font-semibold">
                        {p.invoice ? `Inv: ${p.invoice.no}` : p.bill ? `Bill: ${p.bill.no}` : "-"}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center rounded-md border border-[var(--border-color)] bg-[var(--badge-bg)] px-2 py-0.5 text-[10px] font-bold text-[var(--text-main)]">
                          {p.via}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono font-black text-sm text-[var(--text-main)]">
                        {formatCurrency(p.amount || 0)}
                      </td>
                      <td className="py-3.5 px-4 text-[var(--text-muted)] italic max-w-xs truncate">
                        {p.note || "-"}
                      </td>
                    </tr>
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
