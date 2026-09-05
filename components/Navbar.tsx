"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useTheme } from "./ThemeProvider";
import { SunIcon, MoonIcon } from "./Icons";

interface UserSession {
  user?: {
    id: string;
    loginId: string;
    email: string;
    role: string;
  };
}

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();
  const [session, setSession] = useState<UserSession | null>(null);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => setSession(data))
      .catch(() => setSession(null));
  }, [pathname]);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    setSession(null);
    router.push("/login");
  };

  const navDropdowns = [
    {
      label: "Sales",
      prefix: "/sales",
      items: [
        { label: "Sales Orders", href: "/sales/orders", desc: "Customer Quotations & SOs" },
        { label: "Customer Invoices", href: "/sales/invoices", desc: "Receivables & AR Invoices" },
      ],
    },
    {
      label: "Purchase",
      prefix: "/purchase",
      items: [
        { label: "Purchase Orders", href: "/purchase/orders", desc: "Vendor POs & Ordering" },
        { label: "Vendor Bills", href: "/purchase/bills", desc: "Payables & AP Bills" },
      ],
    },
    {
      label: "Accounting",
      prefix: "/accounting",
      items: [
        { label: "Payments", href: "/payments", desc: "Customer & Vendor Payments" },
        { label: "Journal Entries", href: "/entries", desc: "General Ledger Posting" },
        { label: "Chart of Accounts", href: "/masters/accounts", desc: "GL Account Hierarchy" },
      ],
    },
    {
      label: "Master Data",
      prefix: "/masters",
      items: [
        { label: "Products", href: "/masters/products", desc: "Items, Cost & Sales Prices" },
        { label: "Contacts", href: "/masters/contacts", desc: "Customers & Vendors List" },
        { label: "Journals", href: "/masters/journals", desc: "Sales, Purchase, Cash & Bank" },
        { label: "Analytic Accounts", href: "/masters/analytics", desc: "Cost Centers & Projects" },
      ],
    },
    {
      label: "Reports",
      prefix: "/reports",
      items: [
        { label: "Balance Sheet", href: "/reports/balancesheet", desc: "Assets, Liabilities & Equity" },
        { label: "Profit & Loss", href: "/reports/profit-loss", desc: "Income & Expense Statement" },
        { label: "Budget Performance", href: "/reports/budget", desc: "Planned vs Actual Variance" },
        { label: "Budget Masters", href: "/masters/budgets", desc: "Budget Configurations" },
      ],
    },
  ];

  return (
    <header className="sticky top-0 z-50 border-b border-[var(--border-color)] bg-[var(--bg-primary)]/90 backdrop-blur-md transition-colors">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3">
        {/* Brand Logo & Name */}
        <div className="flex items-center gap-8">
          <Link href="/dashboard" className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--text-main)] text-[var(--bg-primary)] font-black tracking-wider text-sm shadow-sm">
              UF
            </div>
            <div>
              <span className="font-extrabold tracking-tight text-base text-[var(--text-main)]">
                URBAN FURNITURE
              </span>
              <span className="ml-2 rounded border border-[var(--border-color)] bg-[var(--badge-bg)] px-1.5 py-0.5 text-[10px] font-medium tracking-wide uppercase text-[var(--text-muted)]">
                ERP
              </span>
            </div>
          </Link>

          {/* Horizontal Navigation Menu with Dropdowns */}
          <nav className="hidden md:flex items-center gap-1">
            <Link
              href="/dashboard"
              className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                pathname === "/dashboard" || pathname === "/"
                  ? "bg-[var(--badge-bg)] text-[var(--text-main)] font-semibold"
                  : "text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--badge-bg)]/50"
              }`}
            >
              Dashboard
            </Link>

            {navDropdowns.map((drop) => {
              const isActive = pathname.startsWith(drop.prefix) || drop.items.some(i => i.href === pathname);
              const isOpen = activeDropdown === drop.label;
              return (
                <div
                  key={drop.label}
                  className="relative"
                  onMouseEnter={() => setActiveDropdown(drop.label)}
                  onMouseLeave={() => setActiveDropdown(null)}
                >
                  <button
                    className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                      isActive
                        ? "bg-[var(--badge-bg)] text-[var(--text-main)] font-semibold"
                        : "text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--badge-bg)]/50"
                    }`}
                  >
                    {drop.label}
                    <svg
                      className={`h-3.5 w-3.5 transition-transform duration-200 ${
                        isOpen ? "rotate-180" : ""
                      }`}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {/* Dropdown Card */}
                  {isOpen && (
                    <div className="absolute left-0 top-full pt-1.5 w-64 z-50">
                      <div className="rounded-xl border border-[var(--border-color)] bg-[var(--card-bg)] p-2 shadow-2xl backdrop-blur-lg">
                        {drop.items.map((item) => (
                          <Link
                            key={item.href}
                            href={item.href}
                            className={`block rounded-lg p-2.5 transition-colors ${
                              pathname === item.href
                                ? "bg-[var(--badge-bg)] text-[var(--text-main)] font-semibold"
                                : "hover:bg-[var(--card-hover)] text-[var(--text-main)]"
                            }`}
                          >
                            <div className="text-xs font-semibold">{item.label}</div>
                            <div className="text-[11px] text-[var(--text-muted)] leading-tight mt-0.5">
                              {item.desc}
                            </div>
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </nav>
        </div>

        {/* Right Action Icons & Profile Badge */}
        <div className="flex items-center gap-3">
          {/* Theme Toggle Button */}
          <button
            onClick={toggleTheme}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-[var(--border-color)] bg-[var(--badge-bg)] text-[var(--text-main)] transition-transform hover:scale-105"
            title={`Switch to ${theme === "dark" ? "Light" : "Dark"} Mode`}
          >
            {theme === "dark" ? <SunIcon className="h-4 w-4 text-amber-400" /> : <MoonIcon className="h-4 w-4 text-indigo-400" />}
          </button>

          {/* User Profile Info or Auth Links */}
          {session?.user ? (
            <div className="flex items-center gap-3 pl-2 border-l border-[var(--border-color)]">
              <div className="text-right">
                <div className="text-xs font-bold text-[var(--text-main)] leading-none">
                  {session.user.loginId}
                </div>
                <div className="mt-1 inline-block rounded bg-[var(--border-color)] px-1.5 py-0.5 text-[9px] font-extrabold uppercase tracking-wider text-[var(--text-main)]">
                  {session.user.role}
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="rounded-lg border border-[var(--border-color)] px-2.5 py-1.5 text-xs font-medium text-[var(--text-muted)] transition-colors hover:border-red-500 hover:text-red-500"
              >
                Logout
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link href="/login" className="btn-outline text-xs py-1.5 px-3">
                Log In
              </Link>
              <Link href="/signup" className="btn-primary text-xs py-1.5 px-3">
                Sign Up
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
