"use client";

import React, { useEffect, useState, useRef } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";

interface SearchResult {
  id: string;
  title: string;
  subtitle: string;
  category: string;
  href: string;
}

export function CommandPalette() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [mounted, setMounted] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Keyboard shortcut listener (Ctrl+K or Cmd+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      }
      if (e.key === "Escape" && isOpen) {
        setIsOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  // Focus input & lock body scroll when opened
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      setTimeout(() => inputRef.current?.focus(), 50);
      setSelectedIndex(0);
    } else {
      document.body.style.overflow = "unset";
      setQuery("");
      setResults([]);
    }

    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  // Fetch search results on query change
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
        if (res.ok) {
          const data = await res.json();
          setResults(data.results || []);
          setSelectedIndex(0);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [query]);

  const defaultPages = [
    { title: "Financial Dashboard", subtitle: "Overview & Key Metrics", category: "Navigation", href: "/dashboard" },
    { title: "Sales Orders", subtitle: "Customer Quotations & SOs", category: "Sales", href: "/sales/orders" },
    { title: "Customer Invoices", subtitle: "AR Invoices & Receivables", category: "Sales", href: "/sales/invoices" },
    { title: "Purchase Orders", subtitle: "Vendor POs & Ordering", category: "Purchase", href: "/purchase/orders" },
    { title: "Vendor Bills", subtitle: "AP Bills & Payables", category: "Purchase", href: "/purchase/bills" },
    { title: "Payments Ledger", subtitle: "Customer Receipts & Vendor Payments", category: "Accounting", href: "/payments" },
    { title: "Journal Entries", subtitle: "General Ledger Posting Vouchers", category: "Accounting", href: "/entries" },
    { title: "Chart of Accounts", subtitle: "GL Account Hierarchy & Balances", category: "Accounting", href: "/masters/accounts" },
    { title: "AR / AP Aging Breakdown", subtitle: "30/60/90+ Days Due Schedule", category: "Reports", href: "/reports/aging" },
    { title: "Balance Sheet Statement", subtitle: "Assets, Liabilities & Equity", category: "Reports", href: "/reports/balancesheet" },
    { title: "Profit & Loss Statement", subtitle: "Income & Expense Statement", category: "Reports", href: "/reports/profit-loss" },
    { title: "Budget Performance", subtitle: "Planned vs Actual Variance", category: "Reports", href: "/reports/budget" },
  ];

  const filteredPages = query.trim()
    ? defaultPages.filter(
        (p) =>
          p.title.toLowerCase().includes(query.toLowerCase()) ||
          p.subtitle.toLowerCase().includes(query.toLowerCase()) ||
          p.category.toLowerCase().includes(query.toLowerCase())
      )
    : defaultPages;

  const combinedItems = [
    ...results,
    ...filteredPages.map((p) => ({ id: p.href, title: p.title, subtitle: p.subtitle, category: p.category, href: p.href })),
  ];

  const handleKeyDownInput = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1 < combinedItems.length ? prev + 1 : 0));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : combinedItems.length - 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (combinedItems[selectedIndex]) {
        navigateTo(combinedItems[selectedIndex].href);
      }
    }
  };

  const navigateTo = (href: string) => {
    setIsOpen(false);
    setQuery("");
    setResults([]);
    router.push(href);
  };

  const getCategoryBadgeClass = (category: string) => {
    switch (category) {
      case "Customer Invoice":
      case "Sales":
        return "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30";
      case "Vendor Bill":
      case "Purchase":
        return "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30";
      case "Contact":
        return "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/30";
      case "Product":
        return "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30";
      case "Reports":
        return "bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/30";
      default:
        return "bg-[var(--badge-bg)] text-[var(--text-muted)] border-[var(--border-color)]";
    }
  };

  const portalContent = isOpen && mounted ? (
    <div className="fixed inset-0 z-[9999] flex items-start justify-center pt-20 px-4">
      {/* Dimmed Blurred Backdrop Overlay */}
      <div
        className="fixed inset-0 bg-black/70 backdrop-blur-md transition-opacity duration-200"
        onClick={() => setIsOpen(false)}
      />

      {/* Floating Spotlight Card */}
      <div className="relative w-full max-w-2xl rounded-2xl border border-[var(--border-color)] bg-[var(--card-bg)] shadow-2xl overflow-hidden z-10">
        {/* Search Input Bar */}
        <div className="flex items-center border-b border-[var(--border-color)] px-4 py-3 bg-[var(--bg-primary)]">
          <svg className="h-5 w-5 text-[var(--text-muted)] shrink-0 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            ref={inputRef}
            type="text"
            placeholder="Search invoices, bills, contacts, products, commands..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDownInput}
            className="w-full bg-transparent text-sm font-semibold text-[var(--text-main)] placeholder-[var(--text-muted)] outline-none"
          />
          {loading ? (
            <div className="h-4 w-4 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin shrink-0 ml-2" />
          ) : query ? (
            <button
              onClick={() => setQuery("")}
              className="text-xs text-[var(--text-muted)] hover:text-[var(--text-main)] font-bold px-2 py-1"
            >
              Clear
            </button>
          ) : (
            <kbd className="rounded border border-[var(--border-color)] bg-[var(--badge-bg)] px-2 py-0.5 text-[10px] font-mono text-[var(--text-muted)] shrink-0">
              ESC
            </kbd>
          )}
        </div>

        {/* Results List */}
        <div className="max-h-96 overflow-y-auto p-2 divide-y divide-[var(--border-color)]/40">
          {combinedItems.length === 0 ? (
            <div className="py-12 text-center text-xs text-[var(--text-muted)]">
              No records match &quot;{query}&quot;
            </div>
          ) : (
            combinedItems.map((item, idx) => {
              const isSelected = idx === selectedIndex;
              return (
                <button
                  key={`${item.category}-${item.id}-${idx}`}
                  onClick={() => navigateTo(item.href)}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`w-full text-left px-3 py-2.5 rounded-xl flex items-center justify-between transition-all ${
                    isSelected
                      ? "bg-[var(--text-main)] text-[var(--bg-primary)] shadow-md"
                      : "hover:bg-[var(--card-hover)] text-[var(--text-main)]"
                  }`}
                >
                  <div className="min-w-0 pr-3">
                    <div className={`text-xs font-bold truncate ${isSelected ? "text-[var(--bg-primary)]" : "text-[var(--text-main)]"}`}>
                      {item.title}
                    </div>
                    <div className={`text-[11px] truncate mt-0.5 ${isSelected ? "text-[var(--bg-primary)]/80" : "text-[var(--text-muted)]"}`}>
                      {item.subtitle}
                    </div>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider border shrink-0 ${
                      isSelected
                        ? "bg-[var(--bg-primary)] text-[var(--text-main)] border-transparent"
                        : getCategoryBadgeClass(item.category)
                    }`}
                  >
                    {item.category}
                  </span>
                </button>
              );
            })
          )}
        </div>

        {/* Navigation Footer */}
        <div className="flex items-center justify-between border-t border-[var(--border-color)] px-4 py-2 bg-[var(--badge-bg)] text-[10px] text-[var(--text-muted)] font-mono">
          <div className="flex items-center gap-3">
            <span><kbd className="px-1.5 py-0.5 rounded border border-[var(--border-color)] bg-[var(--card-bg)] text-[var(--text-main)] font-bold">↑↓</kbd> Navigate</span>
            <span><kbd className="px-1.5 py-0.5 rounded border border-[var(--border-color)] bg-[var(--card-bg)] text-[var(--text-main)] font-bold">↵</kbd> Select</span>
            <span><kbd className="px-1.5 py-0.5 rounded border border-[var(--border-color)] bg-[var(--card-bg)] text-[var(--text-main)] font-bold">ESC</kbd> Close</span>
          </div>
          <span className="font-sans text-[11px] font-bold text-[var(--text-main)]">Spotlight Search</span>
        </div>
      </div>
    </div>
  ) : null;

  return (
    <>
      {/* Navbar Quick Trigger Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="hidden sm:flex items-center gap-2.5 rounded-lg border border-[var(--border-color)] bg-[var(--badge-bg)] px-3 py-1.5 text-xs text-[var(--text-muted)] hover:text-[var(--text-main)] hover:border-[var(--text-main)] transition-all font-mono shadow-sm"
        title="Spotlight Search (Ctrl + K)"
      >
        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <span className="font-sans font-medium text-xs">Search...</span>
        <kbd className="rounded border border-[var(--border-color)] bg-[var(--bg-primary)] px-1.5 py-0.5 text-[10px] font-extrabold text-[var(--text-main)]">
          Ctrl K
        </kbd>
      </button>

      {/* Render overlay outside DOM subtree using React Portal */}
      {mounted && portalContent && createPortal(portalContent, document.body)}
    </>
  );
}
