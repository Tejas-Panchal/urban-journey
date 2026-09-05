"use client";
import { useEffect, useState } from "react";

function useList(url: string) {
  const [data, setData] = useState<any>(null);
  const [q, setQ] = useState("");
  async function load() {
    const r = await fetch(q ? `${url}?search=${encodeURIComponent(q)}` : url);
    setData(await r.json());
  }
  useEffect(() => { load(); }, []);
  return { data, q, setQ, load };
}

export function ListPage({ title, url, columns, renderRow }: { title: string; url: string; columns: string[]; renderRow: (r: any) => React.ReactNode }) {
  const { data, q, setQ, load } = useList(url);
  const key = Object.keys(data ?? {}).find(k => Array.isArray((data as any)[k])) ?? "";
  const rows: any[] = key ? (data as any)[key] : [];
  return (
    <main className="mx-auto max-w-5xl p-8">
      <h1 className="text-2xl font-bold">{title}</h1>
      <div className="mt-3 flex gap-2">
        <input className="rounded border p-2" placeholder="Search" value={q} onChange={e => setQ(e.target.value)} />
        <button className="rounded border px-3" onClick={load}>Search</button>
        <a className="ml-auto rounded border px-3 py-2" href="/dashboard">Back</a>
      </div>
      <table className="mt-4 w-full border text-sm">
        <thead><tr>{columns.map(c => <th key={c} className="border p-2 text-left">{c}</th>)}</tr></thead>
        <tbody>{rows.map((r: any, i: number) => <tr key={r.id ?? i}>{renderRow(r)}</tr>)}</tbody>
      </table>
    </main>
  );
}
