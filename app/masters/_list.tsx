"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

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
  renderKanbanCard,
  createUrl,
}: {
  title: string;
  url: string;
  columns: string[];
  renderRow: (r: any) => React.ReactNode;
  renderKanbanCard?: (r: any) => React.ReactNode;
  createUrl?: string;
}) {
  const router = useRouter();
  const [viewMode, setViewMode] = useState<"list" | "kanban">("list");
  const { data, q, setQ, load, loading } = useList(url);
  const key = Object.keys(data ?? {}).find((k) => Array.isArray((data as any)[k])) ?? "";
  const rows: any[] = key ? (data as any)[key] : [];

  return (
    <main className="mx-auto max-w-7xl px-6 py-8">
      {/* Header Bar matching wireframe specifications */}
      <div className="flex flex-wrap items-center justify-between gap-4 card-mono p-4 mb-6 shadow-md">
        <div className="flex items-center gap-3">
          {createUrl ? (
            <Link
              href={createUrl}
              className="btn-outline px-5 py-2 text-xs font-bold rounded-lg border-2"
            >
              New
            </Link>
          ) : (
            <button
              onClick={() => alert(`To create a new ${title}, use the respective section form.`)}
              className="btn-outline px-5 py-2 text-xs font-bold rounded-lg border-2"
            >
              New
            </button>
          )}

          <div className="relative">
            <input
              type="text"
              placeholder={`Search ${title}...`}
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && load()}
              className="w-64 rounded-lg border border-[var(--border-color)] bg-[var(--bg-primary)] px-3.5 py-1.5 text-xs text-[var(--text-main)] focus:outline-none focus:border-[var(--text-main)] font-mono"
            />
          </div>
        </div>

        {/* Right Controls: Back Button & View Switcher */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push("/dashboard")}
            className="btn-outline px-5 py-2 text-xs font-bold rounded-lg"
          >
            Back
          </button>

          {/* List vs Kanban View Toggle Buttons */}
          <div className="flex items-center rounded-lg border border-[var(--border-color)] bg-[var(--bg-primary)] p-1 gap-1">
            <button
              onClick={() => setViewMode("list")}
              title="Shift to List View"
              className={`p-1.5 rounded-md transition-colors ${
                viewMode === "list"
                  ? "bg-[var(--text-main)] text-[var(--bg-primary)]"
                  : "text-[var(--text-muted)] hover:text-[var(--text-main)]"
              }`}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>

            <button
              onClick={() => setViewMode("kanban")}
              title="Shift to Kanban View"
              className={`p-1.5 rounded-md transition-colors ${
                viewMode === "kanban"
                  ? "bg-[var(--text-main)] text-[var(--bg-primary)]"
                  : "text-[var(--text-muted)] hover:text-[var(--text-main)]"
              }`}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h4a1 1 0 011 1v14a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM14 5a1 1 0 011-1h4a1 1 0 011 1v7a1 1 0 01-1 1h-4a1 1 0 01-1-1V5z" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      {viewMode === "list" ? (
        <div className="card-mono overflow-hidden shadow-2xl">
          <div className="p-4 border-b border-[var(--border-color)] bg-[var(--badge-bg)] flex justify-between items-center">
            <h2 className="text-lg font-black text-[var(--text-main)]">{title} (List View)</h2>
            <span className="text-xs font-semibold text-[var(--text-muted)]">Total: {rows.length}</span>
          </div>

          <div className="overflow-x-auto">
            {loading ? (
              <div className="py-16 text-center text-xs text-[var(--text-muted)]">
                Loading records...
              </div>
            ) : rows.length === 0 ? (
              <div className="py-16 text-center text-xs text-[var(--text-muted)]">
                No records found.
              </div>
            ) : (
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-[var(--border-color)] bg-[var(--card-bg)] text-[var(--text-muted)] font-bold uppercase tracking-wider">
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
      ) : (
        <div className="space-y-4">
          <div className="card-mono p-4 border-b border-[var(--border-color)] flex justify-between items-center">
            <h2 className="text-lg font-black text-[var(--text-main)]">{title} (Kanban View)</h2>
            <span className="text-xs font-semibold text-[var(--text-muted)]">Total: {rows.length}</span>
          </div>

          {loading ? (
            <div className="card-mono py-16 text-center text-xs text-[var(--text-muted)]">
              Loading kanban cards...
            </div>
          ) : rows.length === 0 ? (
            <div className="card-mono py-16 text-center text-xs text-[var(--text-muted)]">
              No records found.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {rows.map((r: any, i: number) =>
                renderKanbanCard ? (
                  renderKanbanCard(r)
                ) : (
                  <div
                    key={r.id ?? i}
                    className="card-mono p-4 hover:shadow-xl transition-all border hover:border-[var(--text-main)] flex items-start gap-3"
                  >
                    {r.image ? (
                      <img
                        src={r.image}
                        alt={r.name || "Item"}
                        className="w-12 h-12 rounded-xl object-cover border border-[var(--border-color)] shadow-sm shrink-0"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-xl bg-[var(--text-main)] text-[var(--bg-primary)] font-black text-sm flex items-center justify-center shrink-0 shadow-sm">
                        {(r.name || r.id || "M").substring(0, 2).toUpperCase()}
                      </div>
                    )}

                    <div className="space-y-1 min-w-0 flex-1 text-xs">
                      <h3 className="font-bold text-[var(--text-main)] truncate">
                        {r.name || r.id}
                      </h3>
                      {r.type && (
                        <span className="inline-block rounded bg-[var(--badge-bg)] border border-[var(--border-color)] px-1.5 py-0.5 text-[10px] font-semibold text-[var(--text-muted)]">
                          {r.type}
                        </span>
                      )}
                      {r.salesPrice !== undefined && (
                        <p className="font-mono text-[var(--text-muted)]">
                          ₹{r.salesPrice?.toLocaleString()}
                        </p>
                      )}
                    </div>
                  </div>
                )
              )}
            </div>
          )}
        </div>
      )}
    </main>
  );
}
