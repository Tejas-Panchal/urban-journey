"use client";
import { ListPage } from "../_list";
export default function AccountsPage() {
  return <ListPage title="Chart of Accounts (List View)" url="/api/accounts" columns={["Account Name", "Type", "Subtype"]}
    renderRow={(r: any) => (<><td className="border p-2">{r.name}</td><td className="border p-2">{r.type}</td><td className="border p-2">{r.subtype}</td></>)} />;
}
