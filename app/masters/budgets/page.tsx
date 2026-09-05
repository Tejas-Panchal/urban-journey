"use client";
import { ListPage } from "../_list";
export default function BudgetsPage() {
  return <ListPage title="Budgets" url="/api/budgets" columns={["Budget", "Status", "Lines"]}
    renderRow={(r: any) => (<><td className="border p-2">{r.name}</td><td className="border p-2">{r.status}</td><td className="border p-2">{r.lines?.length ?? 0}</td></>)} />;
}
