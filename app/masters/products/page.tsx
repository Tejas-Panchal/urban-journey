"use client";
import { ListPage } from "../_list";
export default function ProductsPage() {
  return <ListPage title="Product Master List View" url="/api/products" columns={["Product", "Category", "Type", "Sales Price", "Cost"]}
    renderRow={(r: any) => (<><td className="border p-2">{r.name}</td><td className="border p-2">{r.category?.name ?? r.categoryId}</td><td className="border p-2">{r.type}</td><td className="border p-2">{r.salesPrice}</td><td className="border p-2">{r.cost}</td></>)} />;
}
