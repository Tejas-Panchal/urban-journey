"use client";
import { ListPage } from "../_list";
export default function JournalsPage() {
  return <ListPage title="Journals" url="/api/journals" columns={["Journal Name", "Type"]}
    renderRow={(r: any) => (<><td className="border p-2">{r.name}</td><td className="border p-2">{r.type}</td></>)} />;
}
