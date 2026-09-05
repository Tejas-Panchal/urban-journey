"use client";
import { ListPage } from "../_list";
export default function AnalyticsPage() {
  return (
    <ListPage
      title="Analyticals"
      url="/api/analytics"
      columns={["Analytic", "Type"]}
      renderRow={(r: any) => (
        <>
          <td className="p-2">{r.name}</td>
          <td className="p-2">{r.type}</td>
        </>
      )}
    />
  );
}
