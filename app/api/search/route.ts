import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/api";

export async function GET(req: Request) {
  const { error } = await requireSession(["ADMIN", "ACCOUNTANT", "CONTACT"]);
  if (error) return error!;

  const { searchParams } = new URL(req.url);
  const q = (searchParams.get("q") || "").trim();
  if (!q) return NextResponse.json({ results: [] });

  const [invoices, bills, contacts, products, entries] = await Promise.all([
    db.customerInvoice.findMany({
      where: {
        OR: [
          { no: { contains: q } },
          { invRef: { contains: q } },
          { customer: { name: { contains: q } } },
        ],
      },
      include: { customer: true },
      take: 5,
    }),
    db.vendorBill.findMany({
      where: {
        OR: [
          { no: { contains: q } },
          { billRef: { contains: q } },
          { vendor: { name: { contains: q } } },
        ],
      },
      include: { vendor: true },
      take: 5,
    }),
    db.contact.findMany({
      where: {
        OR: [
          { name: { contains: q } },
          { email: { contains: q } },
        ],
      },
      take: 5,
    }),
    db.product.findMany({
      where: { name: { contains: q } },
      take: 5,
    }),
    db.journalEntry.findMany({
      where: {
        OR: [
          { entryNumber: { contains: q } },
          { reference: { contains: q } },
          { narration: { contains: q } },
        ],
      },
      take: 5,
    }),
  ]);

  const results = [
    ...invoices.map((inv) => ({
      id: inv.id,
      title: `Invoice: ${inv.no}`,
      subtitle: `${inv.customer?.name || "Customer"} — ₹${inv.total.toLocaleString("en-IN")}`,
      category: "Customer Invoice",
      href: `/sales/invoices`,
    })),
    ...bills.map((b) => ({
      id: b.id,
      title: `Vendor Bill: ${b.no}`,
      subtitle: `${b.vendor?.name || "Vendor"} — ₹${b.subtotal.toLocaleString("en-IN")}`,
      category: "Vendor Bill",
      href: `/purchase/bills`,
    })),
    ...contacts.map((c) => ({
      id: c.id,
      title: c.name,
      subtitle: `${c.type} — ${c.email}`,
      category: "Contact",
      href: `/masters/contacts`,
    })),
    ...products.map((p) => ({
      id: p.id,
      title: p.name,
      subtitle: `Sales Price: ₹${p.salesPrice.toLocaleString("en-IN")} | Cost: ₹${p.cost.toLocaleString("en-IN")}`,
      category: "Product",
      href: `/masters/products`,
    })),
    ...entries.map((e) => ({
      id: e.id,
      title: `Entry: ${e.entryNumber || e.id}`,
      subtitle: `${e.reference} — ${e.status}`,
      category: "Journal Entry",
      href: `/entries`,
    })),
  ];

  return NextResponse.json({ results });
}
