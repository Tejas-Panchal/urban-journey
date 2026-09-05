"use client";
import React, { useEffect, useState } from "react";

export default function PaymentsPage() {
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/payments").then((r) => r.json().catch(() => ({ payments: [] }))).catch(() => ({ payments: [] }));
      setPayments(res.payments || []);
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

  const filteredPayments = payments.filter((p) => {
    const search = q.toLowerCase();
    return (
      p.partnerId?.toLowerCase().includes(search) ||
      p.note?.toLowerCase().includes(search) ||
      p.via?.toLowerCase().includes(search)
    );
  });

  return (
    <main className="mx-auto max-w-7xl px-6 py-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between border-b border-[var(--border-color)] pb-6">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-[var(--text-main)]">
            Payments Ledger
          </h1>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="mt-6 flex items-center justify-between">
        <input
          type="text"
          placeholder="Search payments by Partner or Note..."
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="rounded-lg border border-[var(--border-color)] bg-[var(--card-bg)] px-3 py-1.5 text-xs text-[var(--text-main)] focus:outline-none w-72"
        />
        <div className="text-xs text-[var(--text-muted)] font-semibold">
          Total Recorded: {payments.length}
        </div>
      </div>

      {/* Data Table */}
      <div className="mt-6 card-mono overflow-hidden">
        <div className="overflow-x-auto">
          {loading ? (
            <div className="py-16 text-center text-xs text-[var(--text-muted)]">
              Loading payment entries...
            </div>
          ) : filteredPayments.length === 0 ? (
            <div className="py-16 text-center text-xs text-[var(--text-muted)]">
              No payment records found.
            </div>
          ) : (
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[var(--border-color)] bg-[var(--badge-bg)] text-[var(--text-muted)] font-bold uppercase tracking-wider">
                  <th className="py-3.5 px-4">Payment ID</th>
                  <th className="py-3.5 px-4">Date</th>
                  <th className="py-3.5 px-4">Partner</th>
                  <th className="py-3.5 px-4">Document Ref</th>
                  <th className="py-3.5 px-4">Payment Method</th>
                  <th className="py-3.5 px-4 text-right">Amount</th>
                  <th className="py-3.5 px-4">Memo</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-color)]/60">
                {filteredPayments.map((p) => (
                  <tr key={p.id} className="hover:bg-[var(--card-hover)] transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-[var(--text-main)]">
                      PAY-{p.id.slice(-6)}
                    </td>
                    <td className="py-3.5 px-4 text-[var(--text-muted)]">
                      {new Date(p.date).toLocaleDateString()}
                    </td>
                    <td className="py-3.5 px-4 font-medium text-[var(--text-main)]">
                      {p.partner?.name || p.partnerId}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-[var(--text-muted)]">
                      {p.invoiceId ? `Invoice: ${p.invoiceId}` : p.billId ? `Bill: ${p.billId}` : "-"}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center rounded-md border border-[var(--border-color)] bg-[var(--badge-bg)] px-2 py-0.5 text-[10px] font-bold text-[var(--text-main)]">
                        {p.via}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right font-bold text-[var(--text-main)]">
                      {formatCurrency(p.amount || 0)}
                    </td>
                    <td className="py-3.5 px-4 text-[var(--text-muted)] italic">
                      {p.note || "-"}
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
