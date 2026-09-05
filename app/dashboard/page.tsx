"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import {
  TrendingUpIcon,
  TrendingDownIcon,
  ScaleIcon,
  DollarIcon,
  ReceiptIcon,
  ChartBarIcon,
  CreditCardIcon,
  RefreshIcon,
} from "@/components/Icons";

export default function Dashboard() {
  const [data, setData] = useState<any>({
    po: [],
    bills: [],
    so: [],
    inv: [],
    budgets: [],
    payments: [],
    pl: null,
  });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<
    "so" | "inv" | "po" | "bills" | "payments"
  >("inv");

  const loadData = async () => {
    setLoading(true);
    try {
      const [poRes, billsRes, soRes, invRes, budgetsRes, payRes, plRes] =
        await Promise.all([
          fetch("/api/purchase/orders")
            .then((r) => r.json())
            .catch(() => ({ orders: [] })),
          fetch("/api/purchase/bills")
            .then((r) => r.json())
            .catch(() => ({ bills: [] })),
          fetch("/api/sales/orders")
            .then((r) => r.json())
            .catch(() => ({ orders: [] })),
          fetch("/api/sales/invoices")
            .then((r) => r.json())
            .catch(() => ({ invoices: [] })),
          fetch("/api/reports/budget")
            .then((r) => r.json())
            .catch(() => ({ budgets: [] })),
          fetch("/api/payments")
            .then((r) => r.json())
            .catch(() => ({ payments: [] })),
          fetch("/api/reports/profit-loss")
            .then((r) => r.json())
            .catch(() => null),
        ]);

      setData({
        po: poRes.orders || [],
        bills: billsRes.bills || [],
        so: soRes.orders || [],
        inv: invRes.invoices || [],
        budgets: budgetsRes.budgets || [],
        payments: payRes.payments || [],
        pl: plRes,
      });
    } catch (err) {
      console.error("Dashboard data load error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Compute key totals
  const totalRevenue = data.inv.reduce(
    (sum: number, i: any) => sum + (i.total || 0),
    0,
  );
  const totalExpenses = data.bills.reduce(
    (sum: number, b: any) => sum + (b.total || 0),
    0,
  );
  const netProfit = totalRevenue - totalExpenses;
  const totalReceivables = data.inv.reduce(
    (sum: number, i: any) => sum + (i.due || 0),
    0,
  );
  const totalPayables = data.bills.reduce(
    (sum: number, b: any) => sum + (b.due || 0),
    0,
  );

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
    }).format(val);

  const renderStatusBadge = (status: string) => {
    switch (status) {
      case "PAID":
      case "POSTED":
        return (
          <span className="inline-flex items-center rounded-full bg-[var(--text-main)] px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[var(--bg-primary)]">
            {status}
          </span>
        );
      case "CONFIRMED":
      case "PARTIAL":
        return (
          <span className="inline-flex items-center rounded-full border border-[var(--text-main)] px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[var(--text-main)]">
            {status}
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center rounded-full border border-[var(--border-color)] bg-[var(--badge-bg)] px-2.5 py-0.5 text-[10px] font-medium uppercase tracking-wider text-[var(--text-muted)]">
            {status || "DRAFT"}
          </span>
        );
    }
  };

  return (
    <main className="mx-auto max-w-7xl px-6 py-8">
      {/* Top Banner & Quick Action Buttons */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between pb-8 border-b border-[var(--border-color)]">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-[var(--text-main)]">
            Financial Dashboard
          </h1>
          <p className="mt-1 text-sm text-[var(--text-muted)]">
            Real-time accounting analytics, revenue stats, and operational
            overview.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Link
            href="/sales/orders"
            className="btn-primary text-xs flex items-center gap-1.5 py-2 px-3.5"
          >
            <span>+</span> New Sales Order
          </Link>
          <Link
            href="/purchase/bills"
            className="btn-outline text-xs flex items-center gap-1.5 py-2 px-3.5"
          >
            <span>+</span> New Vendor Bill
          </Link>
          <Link
            href="/payments"
            className="btn-outline text-xs flex items-center gap-1.5 py-2 px-3.5"
          >
            <CreditCardIcon className="h-3.5 w-3.5" /> Record Payment
          </Link>
          <button
            onClick={loadData}
            className="rounded-lg border border-[var(--border-color)] p-2 text-xs hover:bg-[var(--badge-bg)] transition-colors"
            title="Refresh Dashboard"
          >
            <RefreshIcon className="h-4 w-4 text-[var(--text-main)]" />
          </button>
        </div>
      </div>

      {/* 6 Key Financial KPI Cards */}
      <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {/* Card 1: Total Revenue */}
        <div className="card-mono p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">
            <span>Total Invoiced Revenue</span>
            <TrendingUpIcon className="h-5 w-5 text-emerald-500" />
          </div>
          <div className="mt-4">
            <div className="text-2xl font-extrabold tracking-tight text-[var(--text-main)]">
              {formatCurrency(totalRevenue)}
            </div>
            <div className="mt-1 text-xs text-[var(--text-muted)]">
              Across {data.inv.length} customer invoices
            </div>
          </div>
        </div>

        {/* Card 2: Total Expenses */}
        <div className="card-mono p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">
            <span>Total Vendor Bills</span>
            <TrendingDownIcon className="h-5 w-5 text-rose-500" />
          </div>
          <div className="mt-4">
            <div className="text-2xl font-extrabold tracking-tight text-[var(--text-main)]">
              {formatCurrency(totalExpenses)}
            </div>
            <div className="mt-1 text-xs text-[var(--text-muted)]">
              Across {data.bills.length} vendor bills
            </div>
          </div>
        </div>

        {/* Card 3: Net Profit */}
        <div className="card-mono p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">
            <span>Net Operating Income</span>
            <ScaleIcon className="h-5 w-5 text-blue-500" />
          </div>
          <div className="mt-4">
            <div
              className={`text-2xl font-extrabold tracking-tight ${
                netProfit >= 0 ? "text-[var(--text-main)]" : "text-red-500"
              }`}
            >
              {formatCurrency(netProfit)}
            </div>
            <div className="mt-1 text-xs text-[var(--text-muted)]">
              Gross Invoiced Profit Margin
            </div>
          </div>
        </div>

        {/* Card 4: Accounts Receivable */}
        <div className="card-mono p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">
            <span>Accounts Receivable (AR)</span>
            <DollarIcon className="h-5 w-5 text-amber-500" />
          </div>
          <div className="mt-4">
            <div className="text-2xl font-extrabold tracking-tight text-[var(--text-main)]">
              {formatCurrency(totalReceivables)}
            </div>
            <div className="mt-1 text-xs text-[var(--text-muted)]">
              Outstanding due from customers
            </div>
          </div>
        </div>

        {/* Card 5: Accounts Payable */}
        <div className="card-mono p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">
            <span>Accounts Payable (AP)</span>
            <ReceiptIcon className="h-5 w-5 text-purple-500" />
          </div>
          <div className="mt-4">
            <div className="text-2xl font-extrabold tracking-tight text-[var(--text-main)]">
              {formatCurrency(totalPayables)}
            </div>
            <div className="mt-1 text-xs text-[var(--text-muted)]">
              Outstanding due to vendors
            </div>
          </div>
        </div>

        {/* Card 6: Active Budgets & Performance */}
        <div className="card-mono p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">
            <span>Budget Overview</span>
            <ChartBarIcon className="h-5 w-5 text-indigo-500" />
          </div>
          <div className="mt-4">
            <div className="text-2xl font-extrabold tracking-tight text-[var(--text-main)]">
              {data.budgets.length} Budgets
            </div>
            <div className="mt-1 text-xs text-[var(--text-muted)]">
              Active financial allocations
            </div>
          </div>
        </div>
      </div>

      {/* Visual Monochromatic Financial Chart & Budget Gauge Section */}
      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Monochromatic Financial Overview Chart Card */}
        <div className="card-mono p-6 lg:col-span-2">
          <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-4">
            <div>
              <h2 className="text-base font-bold text-[var(--text-main)]">
                Revenue vs. Expense Summary
              </h2>
              <p className="text-xs text-[var(--text-muted)]">
                Comparison of receivables and vendor commitments
              </p>
            </div>
            <Link
              href="/reports/profit-loss"
              className="text-xs font-medium underline text-[var(--text-main)]"
            >
              View Full P&L →
            </Link>
          </div>

          <div className="mt-6 flex flex-col gap-6">
            {/* Visual Bar Graphs */}
            <div>
              <div className="flex justify-between text-xs font-semibold mb-2">
                <span>Invoiced Revenue ({formatCurrency(totalRevenue)})</span>
                <span>100%</span>
              </div>
              <div className="h-4 w-full rounded-full bg-[var(--border-color)] overflow-hidden">
                <div
                  className="h-full bg-[var(--text-main)] transition-all duration-500"
                  style={{ width: "100%" }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-semibold mb-2">
                <span>Vendor Expenses ({formatCurrency(totalExpenses)})</span>
                <span>
                  {totalRevenue > 0
                    ? `${Math.min(100, Math.round((totalExpenses / totalRevenue) * 100))}% of Revenue`
                    : "0%"}
                </span>
              </div>
              <div className="h-4 w-full rounded-full bg-[var(--border-color)] overflow-hidden">
                <div
                  className="h-full bg-[var(--text-muted)] transition-all duration-500"
                  style={{
                    width: `${totalRevenue > 0 ? Math.min(100, (totalExpenses / totalRevenue) * 100) : 0}%`,
                  }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-semibold mb-2">
                <span>Net Cash Received</span>
                <span>{formatCurrency(totalRevenue - totalReceivables)}</span>
              </div>
              <div className="h-4 w-full rounded-full bg-[var(--border-color)] overflow-hidden">
                <div
                  className="h-full bg-[var(--text-main)] border border-[var(--bg-primary)] transition-all duration-500"
                  style={{
                    width: `${totalRevenue > 0 ? Math.min(100, ((totalRevenue - totalReceivables) / totalRevenue) * 100) : 0}%`,
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Budget Performance Gauge */}
        <div className="card-mono p-6">
          <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-4">
            <h2 className="text-base font-bold text-[var(--text-main)]">
              Budget Performance
            </h2>
            <Link
              href="/reports/budget"
              className="text-xs font-medium underline text-[var(--text-main)]"
            >
              Details →
            </Link>
          </div>

          <div className="mt-5 space-y-4">
            {data.budgets.length === 0 ? (
              <p className="text-xs text-[var(--text-muted)] italic py-4">
                No active budgets configured.
              </p>
            ) : (
              data.budgets.slice(0, 4).map((b: any, idx: number) => {
                const limit =
                  b.lines?.reduce(
                    (s: number, l: any) => s + (l.committed || 0),
                    0,
                  ) || 1;
                const percentage =
                  Math.min(100, Math.round((b.actual / limit) * 100)) || 0;
                return (
                  <div
                    key={b.id || idx}
                    className="border-b border-[var(--border-color)]/50 pb-3 last:border-0"
                  >
                    <div className="flex justify-between text-xs font-semibold">
                      <span className="text-[var(--text-main)]">{b.name}</span>
                      <span className="text-[var(--text-muted)]">
                        {percentage}%
                      </span>
                    </div>
                    <div className="mt-1.5 h-2 w-full rounded-full bg-[var(--border-color)] overflow-hidden">
                      <div
                        className="h-full bg-[var(--text-main)] transition-all duration-300"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Recent Transactions & Documents Section */}
      <div className="mt-8 card-mono p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-[var(--border-color)] pb-4">
          <div>
            <h2 className="text-lg font-bold text-[var(--text-main)]">
              Recent Transactions
            </h2>
            <p className="text-xs text-[var(--text-muted)]">
              Latest documents across sales, purchase, and GL
            </p>
          </div>

          {/* Filter Tabs */}
          <div className="flex items-center gap-1 rounded-lg border border-[var(--border-color)] bg-[var(--badge-bg)] p-1 text-xs font-semibold">
            <button
              onClick={() => setActiveTab("inv")}
              className={`rounded-md px-3 py-1.5 transition-all ${
                activeTab === "inv"
                  ? "bg-[var(--card-bg)] text-[var(--text-main)] shadow-sm"
                  : "text-[var(--text-muted)] hover:text-[var(--text-main)]"
              }`}
            >
              Invoices ({data.inv.length})
            </button>
            <button
              onClick={() => setActiveTab("so")}
              className={`rounded-md px-3 py-1.5 transition-all ${
                activeTab === "so"
                  ? "bg-[var(--card-bg)] text-[var(--text-main)] shadow-sm"
                  : "text-[var(--text-muted)] hover:text-[var(--text-main)]"
              }`}
            >
              Sales Orders ({data.so.length})
            </button>
            <button
              onClick={() => setActiveTab("bills")}
              className={`rounded-md px-3 py-1.5 transition-all ${
                activeTab === "bills"
                  ? "bg-[var(--card-bg)] text-[var(--text-main)] shadow-sm"
                  : "text-[var(--text-muted)] hover:text-[var(--text-main)]"
              }`}
            >
              Vendor Bills ({data.bills.length})
            </button>
            <button
              onClick={() => setActiveTab("payments")}
              className={`rounded-md px-3 py-1.5 transition-all ${
                activeTab === "payments"
                  ? "bg-[var(--card-bg)] text-[var(--text-main)] shadow-sm"
                  : "text-[var(--text-muted)] hover:text-[var(--text-main)]"
              }`}
            >
              Payments ({data.payments.length})
            </button>
          </div>
        </div>

        {/* Tab Content Table */}
        <div className="mt-4 overflow-x-auto">
          {loading ? (
            <div className="py-12 text-center text-xs text-[var(--text-muted)] font-medium">
              Loading recent records...
            </div>
          ) : (
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[var(--border-color)] text-[var(--text-muted)] font-bold uppercase tracking-wider">
                  <th className="py-3 px-3">Doc #</th>
                  <th className="py-3 px-3">Date</th>
                  <th className="py-3 px-3">Customer / Vendor</th>
                  <th className="py-3 px-3 text-right">Total Amount</th>
                  <th className="py-3 px-3 text-right">Due Balance</th>
                  <th className="py-3 px-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-color)]/60">
                {activeTab === "inv" &&
                  data.inv.slice(0, 8).map((item: any) => (
                    <tr
                      key={item.id}
                      className="hover:bg-[var(--card-hover)] transition-colors"
                    >
                      <td className="py-3 px-3 font-mono font-bold text-[var(--text-main)]">
                        <Link
                          href="/sales/invoices"
                          className="hover:underline"
                        >
                          {item.no}
                        </Link>
                      </td>
                      <td className="py-3 px-3 text-[var(--text-muted)]">
                        {new Date(item.invDate).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-3 font-medium text-[var(--text-main)]">
                        {item.customerId}
                      </td>
                      <td className="py-3 px-3 text-right font-semibold text-[var(--text-main)]">
                        {formatCurrency(item.total)}
                      </td>
                      <td className="py-3 px-3 text-right text-[var(--text-muted)]">
                        {formatCurrency(item.due)}
                      </td>
                      <td className="py-3 px-3 text-center">
                        {renderStatusBadge(item.status)}
                      </td>
                    </tr>
                  ))}

                {activeTab === "so" &&
                  data.so.slice(0, 8).map((item: any) => (
                    <tr
                      key={item.id}
                      className="hover:bg-[var(--card-hover)] transition-colors"
                    >
                      <td className="py-3 px-3 font-mono font-bold text-[var(--text-main)]">
                        <Link href="/sales/orders" className="hover:underline">
                          {item.no}
                        </Link>
                      </td>
                      <td className="py-3 px-3 text-[var(--text-muted)]">
                        {new Date(item.date).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-3 font-medium text-[var(--text-main)]">
                        {item.customerId}
                      </td>
                      <td className="py-3 px-3 text-right font-semibold text-[var(--text-main)]">
                        {formatCurrency(item.total)}
                      </td>
                      <td className="py-3 px-3 text-right text-[var(--text-muted)]">
                        -
                      </td>
                      <td className="py-3 px-3 text-center">
                        {renderStatusBadge(item.status)}
                      </td>
                    </tr>
                  ))}

                {activeTab === "bills" &&
                  data.bills.slice(0, 8).map((item: any) => (
                    <tr
                      key={item.id}
                      className="hover:bg-[var(--card-hover)] transition-colors"
                    >
                      <td className="py-3 px-3 font-mono font-bold text-[var(--text-main)]">
                        <Link
                          href="/purchase/bills"
                          className="hover:underline"
                        >
                          {item.no}
                        </Link>
                      </td>
                      <td className="py-3 px-3 text-[var(--text-muted)]">
                        {new Date(item.billDate).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-3 font-medium text-[var(--text-main)]">
                        {item.vendorId}
                      </td>
                      <td className="py-3 px-3 text-right font-semibold text-[var(--text-main)]">
                        {formatCurrency(item.total)}
                      </td>
                      <td className="py-3 px-3 text-right text-[var(--text-muted)]">
                        {formatCurrency(item.due)}
                      </td>
                      <td className="py-3 px-3 text-center">
                        {renderStatusBadge(item.status)}
                      </td>
                    </tr>
                  ))}

                {activeTab === "payments" &&
                  data.payments.slice(0, 8).map((item: any) => (
                    <tr
                      key={item.id}
                      className="hover:bg-[var(--card-hover)] transition-colors"
                    >
                      <td className="py-3 px-3 font-mono font-bold text-[var(--text-main)]">
                        PAY-{item.id.slice(-6)}
                      </td>
                      <td className="py-3 px-3 text-[var(--text-muted)]">
                        {new Date(item.date).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-3 font-medium text-[var(--text-main)]">
                        Partner: {item.partnerId}
                      </td>
                      <td className="py-3 px-3 text-right font-semibold text-[var(--text-main)]">
                        {formatCurrency(item.amount)}
                      </td>
                      <td className="py-3 px-3 text-right text-[var(--text-muted)]">
                        Via {item.via}
                      </td>
                      <td className="py-3 px-3 text-center">
                        {renderStatusBadge("PAID")}
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
