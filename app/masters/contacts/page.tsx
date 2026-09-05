"use client";
import { ListPage } from "../_list";
export default function ContactsPage() {
  return <ListPage title="Contact List View" url="/api/contacts" columns={["Name", "Type", "Email", "Phone"]}
    renderRow={(r: any) => (<><td className="border p-2">{r.name}</td><td className="border p-2">{r.type}</td><td className="border p-2">{r.email}</td><td className="border p-2">{r.mobile ?? ""}</td></>)} />;
}
