"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";

function useList(url: string) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");

  async function load() {
    setLoading(true);
    try {
      const r = await fetch(q ? `${url}?search=${encodeURIComponent(q)}` : url);
      setData(await r.json());
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  return { data, q, setQ, load, loading };
}

export function ListPage({
  title,
  url,
  columns,
  renderRow,
}: {
  title: string;
  url: string;
  columns: string[];
  renderRow: (r: any) => React.ReactNode;
}) {
  const { data, q, setQ, load, loading } = useList(url);
  const key = Object.keys(data ?? {}).find((k) => Array.isArray((data as any)[k])) ?? "";
  const rows: any[] = key ? (data as any)[key] : [];

  return (
    <main className="mx-auto max-w-7xl px-6 py-8">
      {/* Header Controls */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between border-b border-[var(--border-color)] pb-6">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-[var(--text-main)]">
            {title}
          </h1>
          <p className="mt-1 text-xs text-[var(--text-muted)]">
            Master Data records and configurations.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/dashboard" className="btn-outline text-xs px-3.5 py-1.5">
            ← Dashboard
          </Link>
        </div>
      </div>

      {/* Search & Actions Bar */}
      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <input
            type="text"
            placeholder={`Search ${title}...`}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && load()}
            className="rounded-lg border border-[var(--border-color)] bg-[var(--card-bg)] px-3 py-1.5 text-xs text-[var(--text-main)] focus:outline-none w-64"
          />
          <button onClick={load} className="btn-outline text-xs py-1.5 px-3">
            Search
          </button>
        </div>
        <div className="text-xs font-semibold text-[var(--text-muted)]">
          Total Records: {rows.length}
        </div>
      </div>

      {/* Data Table */}
      <div className="mt-6 card-mono overflow-hidden">
        <div className="overflow-x-auto">
          {loading ? (
            <div className="py-16 text-center text-xs text-[var(--text-muted)]">
              Loading {title.toLowerCase()}...
            </div>
          ) : rows.length === 0 ? (
            <div className="py-16 text-center text-xs text-[var(--text-muted)]">
              No records found.
            </div>
          ) : (
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[var(--border-color)] bg-[var(--badge-bg)] text-[var(--text-muted)] font-bold uppercase tracking-wider">
                  {columns.map((c) => (
                    <th key={c} className="py-3.5 px-4">
                      {c}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-color)]/60">
                {rows.map((r: any, i: number) => (
                  <tr key={r.id ?? i} className="hover:bg-[var(--card-hover)] transition-colors">
                    {renderRow(r)}
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
