# Urban Journey ERP & Accounting System

A modern, full-featured Enterprise Resource Planning (ERP) and Accounting web application inspired by Odoo, built with Next.js App Router, TypeScript, Prisma ORM, and Bun.

---

## 🚀 Features & Modules

### 📊 Dashboard & Financial Overview
- Real-time revenue vs. expense summary graphs.
- Quick status tracking for Purchase Orders, Vendor Bills, Sales Orders, and Invoices.
- Live Budget Performance gauges and active financial allocation overview.

### 🛒 Purchasing & Accounts Payable (AP)
- **Purchase Orders (PO):** Create, track, and confirm purchase orders with product line items.
- **Vendor Bills:** Create vendor bills directly or generate them automatically from confirmed POs. Includes line-item **Analytic Account** tracking for budget allocation.
- **Bill Payment Processing:** Register full or partial payments via Cash or Bank, auto-updating due amounts, payment statuses, and corresponding double-entry accounting journal entries.

### 🏷️ Sales & Accounts Receivable (AR)
- **Sales Orders (SO):** Manage customer sales orders and quotations.
- **Customer Invoices:** Issue invoices from SOs or standalone. Track payments and due dates.
- **Customer Portal:** Dedicated contact view for customer invoice/payment history.

### 💰 Accounting & Financial Reports
- **Double-Entry Journal Entries:** Automated journal posting for purchase bills, customer invoices, and payment transactions.
- **Chart of Accounts & General Ledger:** View and manage asset, liability, equity, income, and expense accounts.
- **Profit & Loss (P&L) Report:** Real-time income vs. expense breakdown.
- **Balance Sheet Report:** Assets, Liabilities, and Equity balance statements.
- **Aging Reports:** Accounts Receivable (AR) and Accounts Payable (AP) aging analysis.

### 🎯 Budget Management & Analytic Cost Centers
- **Analytic Accounts:** Allocate transactions across departments, projects, or cost centers (e.g., IT Infrastructure, Marketing, Journey Project).
- **Budget Performance Tracking:** Define committed budget limits and track actual achieved amounts computed in real-time from confirmed/paid vendor bills and posted journal entries.
- **Automated Budget Updates:** Budget utilization and variance automatically recalculate immediately upon bill confirmation or bill payment registration.

---

## 🛠️ Technology Stack

- **Framework:** [Next.js](https://nextjs.org/) (App Router, Server Actions, API Routes)
- **Language:** TypeScript
- **Database & ORM:** [Prisma ORM](https://www.prisma.io/) with SQLite
- **Runtime & Package Manager:** [Bun](https://bun.sh/)
- **Styling:** Custom CSS variables with responsive design & monochromatic theme components.

---

## 💻 Getting Started

### 1. Prerequisites
Ensure [Bun](https://bun.sh/) is installed on your system.

### 2. Install Dependencies
```bash
bun install
```

### 3. Database Setup & Seed
Initialize the database and populate seed data:
```bash
bunx prisma db push
bun seed
```

### 4. Run Development Server
Start the Next.js development server:
```bash
bun run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🔑 Demo Login Credentials

| Role | Username / Login ID | Password | Access Rights |
| :--- | :--- | :--- | :--- |
| **Admin** | `admin01` | `admin123` | Full access to all modules, settings, and reports |
| **Accountant** | `acct001` | `account123` | Financial entries, invoices, bills, payments, and reports |
| **Customer / Contact** | `nimesh01` | `user1234!` | Customer portal for invoices & payments |

---

## 📂 Project Structure

```
├── app/
│   ├── accounting/         # Journal entries & Chart of accounts
│   ├── api/                # REST API endpoints (bills, orders, payments, budgets, reports)
│   ├── dashboard/          # Financial dashboard & performance metrics
│   ├── masters/            # Master data forms (budgets, analytics)
│   ├── payments/           # Payment history & registration
│   ├── purchase/           # Purchase Orders & Vendor Bills
│   ├── reports/            # Financial & budget reports
│   └── sales/              # Sales Orders & Customer Invoices
├── components/             # Reusable UI components & modals
├── lib/
│   ├── accounting.ts       # Core accounting & journal entry engines
│   ├── budgets.ts          # Real-time budget achievement computation
│   ├── db.ts               # Prisma database client
│   └── validations.ts      # Zod request validation schemas
├── prisma/
│   ├── schema.prisma       # Database schema definitions
│   └── seed.ts             # Initial database seed script
└── README.md
```
