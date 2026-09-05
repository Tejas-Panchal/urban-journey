import Link from "next/link";
import {
  SparklesIcon,
  TrendingUpIcon,
  PackageIcon,
  ScaleIcon,
  ChartBarIcon,
} from "@/components/Icons";

export default function Home() {
  return (
    <main className="mx-auto max-w-5xl px-6 py-16 flex flex-col items-center justify-center text-center min-h-[80vh]">
      <div className="inline-flex items-center gap-2 rounded-full border border-[var(--border-color)] bg-[var(--badge-bg)] px-3 py-1 text-xs font-semibold uppercase tracking-wider text-[var(--text-main)] mb-6">
        <SparklesIcon className="h-3.5 w-3.5" />
        <span>Next-Gen Accounting & ERP</span>
      </div>

      <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-[var(--text-main)] max-w-3xl leading-[1.1]">
        URBAN JOURNEY <br />
        <span className="opacity-60 font-light">ERP & ACCOUNTING</span>
      </h1>

      <p className="mt-6 text-base sm:text-lg text-[var(--text-muted)] max-w-2xl leading-relaxed">
        Full double-entry general ledger, sales orders, customer receivables,
        purchase orders, vendor payables, budget management, and financial
        statement reports.
      </p>

      <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
        <Link href="/login" className="btn-primary py-3 px-6 text-sm">
          Launch Dashboard →
        </Link>
        <Link
          href="/reports/balancesheet"
          className="btn-outline py-3 px-6 text-sm"
        >
          View Financial Reports
        </Link>
      </div>

      {/* Feature Pills */}
      <div className="mt-16 grid grid-cols-2 gap-4 sm:grid-cols-4 max-w-4xl w-full text-left">
        <div className="card-mono p-4">
          <TrendingUpIcon className="h-5 w-5 text-[var(--text-main)]" />
          <div className="mt-2 text-xs font-bold text-[var(--text-main)]">
            Sales & Invoicing
          </div>
          <div className="mt-1 text-[11px] text-[var(--text-muted)]">
            Quotations, SOs & AR Invoices
          </div>
        </div>

        <div className="card-mono p-4">
          <PackageIcon className="h-5 w-5 text-[var(--text-main)]" />
          <div className="mt-2 text-xs font-bold text-[var(--text-main)]">
            Procurement
          </div>
          <div className="mt-1 text-[11px] text-[var(--text-muted)]">
            POs & Vendor AP Bills
          </div>
        </div>

        <div className="card-mono p-4">
          <ScaleIcon className="h-5 w-5 text-[var(--text-main)]" />
          <div className="mt-2 text-xs font-bold text-[var(--text-main)]">
            General Ledger
          </div>
          <div className="mt-1 text-[11px] text-[var(--text-muted)]">
            Double-Entry Journal Posting
          </div>
        </div>

        <div className="card-mono p-4">
          <ChartBarIcon className="h-5 w-5 text-[var(--text-main)]" />
          <div className="mt-2 text-xs font-bold text-[var(--text-main)]">
            Financial Reports
          </div>
          <div className="mt-1 text-[11px] text-[var(--text-muted)]">
            Balance Sheet & P&L
          </div>
        </div>
      </div>
    </main>
  );
}
