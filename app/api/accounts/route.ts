import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireSession, apiError } from "@/lib/api";
import { z } from "zod";

export async function GET(req: Request) {
  const { error } = await requireSession(["ADMIN", "ACCOUNTANT"]);
  if (error) return error!;

  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search");
  const showArchived = searchParams.get("archived") === "true";

  const where: any = {
    isArchived: showArchived,
  };

  if (search) {
    where.name = { contains: search };
  }

  const accounts = await db.account.findMany({
    where,
    orderBy: { name: "asc" },
  });

  const journalLines = await db.journalLine.findMany({
    where: { entry: { status: "POSTED" } },
  });

  const customerInvoices = await db.customerInvoice.findMany({
    where: { status: { in: ["CONFIRMED", "PARTIAL"] } },
  });
  const invoiceDueTotal = customerInvoices.reduce((s, inv) => s + inv.due, 0);

  const vendorBills = await db.vendorBill.findMany({
    where: { status: { in: ["CONFIRMED", "PARTIAL"] } },
  });
  const billDueTotal = vendorBills.reduce((s, b) => s + b.due, 0);

  const enrichedAccounts = accounts.map((acc) => {
    const accLines = journalLines.filter((l) => l.accountId === acc.id);
    let rawBal = accLines.reduce((s, l) => s + l.debit - l.credit, 0);

    let balance = 0;
    if (acc.type === "ASSET" || acc.type === "EXPENSE") {
      balance = Math.max(0, rawBal);
      if (acc.subtype === "DEBTOR") {
        balance = Math.max(balance, invoiceDueTotal);
      }
    } else {
      balance = Math.max(0, -rawBal);
      if (acc.subtype === "CREDITOR") {
        balance = Math.max(balance, billDueTotal);
      }
    }

    return {
      ...acc,
      balance: Math.round(balance * 100) / 100,
    };
  });

  return NextResponse.json({ accounts: enrichedAccounts });
}

export async function POST(req: Request) {
  const { error } = await requireSession(["ADMIN", "ACCOUNTANT"]);
  if (error) return error!;
  const body = await req.json().catch(() => ({}));
  const parsed = z
    .object({
      name: z.string().min(1),
      type: z.enum(["ASSET", "LIABILITY", "INCOME", "EXPENSE", "CAPITAL"]),
      subtype: z
        .enum(["CASH", "BANK", "DEBTOR", "CREDITOR", "SALE", "PURCHASE", "OTHER", "CAPITAL"])
        .default("OTHER"),
    })
    .safeParse(body);

  if (!parsed.success) return apiError("Invalid input");

  try {
    const a = await db.account.create({ data: parsed.data });
    return NextResponse.json({ account: a }, { status: 201 });
  } catch {
    return apiError("Account already exists", 409);
  }
}

