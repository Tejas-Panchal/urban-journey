import { db } from "@/lib/db";

// ==========================================
// PRECISION & ROUNDING UTILITIES
// ==========================================

export function round2(num: number): number {
  return Math.round((num + Number.EPSILON) * 100) / 100;
}

export function lineTotal(qty: number, unitPrice: number): number {
  return round2(qty * unitPrice);
}

export function lineSubtotal(qty: number, unitPrice: number): number {
  return round2(qty * unitPrice);
}

export function lineTaxAmount(qty: number, unitPrice: number, tax: number = 0): number {
  return round2(qty * unitPrice * (tax / 100));
}

export function lineGrandTotal(qty: number, unitPrice: number, tax: number = 0): number {
  return lineSubtotal(qty, unitPrice) + lineTaxAmount(qty, unitPrice, tax);
}

// ==========================================
// SEQUENTIAL NUMBER GENERATORS (COLLISION SAFE)
// ==========================================

export async function nextPoNo(tx: any) {
  const last = await tx.purchaseOrder.findFirst({ orderBy: { createdAt: "desc" } });
  const n = last ? parseInt(last.no.replace(/\D/g, "") || "0", 10) + 1 : 1;
  return "P" + String(n).padStart(5, "0");
}

export async function nextSoNo(tx: any) {
  const last = await tx.salesOrder.findFirst({ orderBy: { createdAt: "desc" } });
  const n = last ? parseInt(last.no.replace(/\D/g, "") || "0", 10) + 1 : 1;
  return "S" + String(n).padStart(5, "0");
}

export async function nextBillNo(tx: any, date = new Date()) {
  const y = new Date(date).getFullYear();
  const prefix = `Bill/${y}/`;
  const last = await tx.vendorBill.findFirst({
    where: { no: { startsWith: prefix } },
    orderBy: { createdAt: "desc" },
  });
  const lastNum = last && last.no ? parseInt(last.no.split("/").pop() || "0", 10) : 0;
  return `${prefix}${String(lastNum + 1).padStart(4, "0")}`;
}

export async function nextInvNo(tx: any, date = new Date()) {
  const y = new Date(date).getFullYear();
  const prefix = `INV/${y}/`;
  const last = await tx.customerInvoice.findFirst({
    where: { no: { startsWith: prefix } },
    orderBy: { createdAt: "desc" },
  });
  const lastNum = last && last.no ? parseInt(last.no.split("/").pop() || "0", 10) : 0;
  return `${prefix}${String(lastNum + 1).padStart(4, "0")}`;
}

/**
 * Collision-Safe Sequential Entry Numbering Engine
 * Generates sequence formatted per journal & fiscal year: {JOURNAL_CODE}/{YEAR}/{SEQUENCE}
 * Example: MISC/2026/0001, BNK1/2026/0001, INV/2026/0001, BILL/2026/0001
 */
export async function generateEntryNumber(
  tx: any,
  journalId: string,
  entryDate: Date = new Date()
): Promise<string> {
  const journal = await tx.journal.findUnique({ where: { id: journalId } });
  const journalCode = (
    journal?.code ||
    (journal?.type === "SALES"
      ? "INV"
      : journal?.type === "PURCHASE"
      ? "BILL"
      : journal?.type === "BANK"
      ? "BNK1"
      : journal?.type === "CASH"
      ? "CSH1"
      : "MISC")
  ).toUpperCase();

  const year = new Date(entryDate).getFullYear();
  const prefix = `${journalCode}/${year}/`;
  const last = await tx.journalEntry.findFirst({
    where: { entryNumber: { startsWith: prefix } },
    orderBy: { createdAt: "desc" },
  });

  const lastNum = last && last.entryNumber ? parseInt(last.entryNumber.split("/").pop() || "0", 10) : 0;
  return `${prefix}${String(lastNum + 1).padStart(4, "0")}`;
}

export const nextEntryNo = generateEntryNumber;

// Lookup Helpers
export async function getAccountIdByName(tx: any, name: string) {
  const a = await tx.account.findUnique({ where: { name } });
  if (!a) throw new Error(`Account not found: ${name}`);
  return a.id;
}

export async function getJournalIdByType(
  tx: any,
  type: "SALES" | "PURCHASE" | "BANK" | "CASH" | "GENERAL"
) {
  const j = await tx.journal.findFirst({ where: { type } });
  if (!j) throw new Error(`Journal not found for type: ${type}`);
  return j.id;
}

// ==========================================
// DOUBLE-ENTRY ENGINE & CONSTRAINTS
// ==========================================

/**
 * Strict Double-Entry Rule with 2-Decimal Precision & Non-Negative Checks
 */
export function checkBalanced(
  lines: { debit?: number; credit?: number; lineLabel?: string | null; narration?: string | null }[]
) {
  let totalDebit = 0;
  let totalCredit = 0;

  for (let i = 0; i < lines.length; i++) {
    const l = lines[i];
    const dr = round2(l.debit || 0);
    const cr = round2(l.credit || 0);

    if (dr < 0 || cr < 0) {
      throw new Error(`Line #${i + 1}: Negative numbers are strictly forbidden in debit or credit fields.`);
    }
    totalDebit += dr;
    totalCredit += cr;
  }

  const roundedDr = round2(totalDebit);
  const roundedCr = round2(totalCredit);
  const diff = round2(Math.abs(roundedDr - roundedCr));

  if (diff > 0.001) {
    throw new Error(
      `Unbalanced Journal Entry! Total Debit ($${roundedDr.toFixed(
        2
      )}) does not equal Total Credit ($${roundedCr.toFixed(2)}). Difference: $${diff.toFixed(2)}`
    );
  }
}

export const validateDoubleEntry = checkBalanced;

/**
 * Creates a Journal Entry in DRAFT or POSTED status.
 */
export async function createJournalEntry(
  tx: any,
  opts: {
    journalId?: string;
    journalType?: "SALES" | "PURCHASE" | "BANK" | "CASH" | "GENERAL";
    entryNumber?: string;
    date?: Date | string;
    reference: string;
    status?: "DRAFT" | "POSTED" | "CANCELLED";
    sourceType?: string;
    sourceId?: string;
    narration?: string;
    lines: {
      accountId: string;
      partnerId?: string | null;
      analyticId?: string | null;
      analyticAccountId?: string | null;
      narration?: string | null;
      lineLabel?: string | null;
      matchedLineId?: string | null;
      debit: number;
      credit: number;
    }[];
  }
) {
  const status = opts.status || "DRAFT";
  if (status === "POSTED") {
    checkBalanced(opts.lines);
  }

  let journalId = opts.journalId;
  if (!journalId && opts.journalType) {
    journalId = await getJournalIdByType(tx, opts.journalType);
  }
  if (!journalId) {
    journalId = await getJournalIdByType(tx, "GENERAL");
  }

  const entryDate = opts.date ? new Date(opts.date) : new Date();
  const entryNumber = opts.entryNumber || (await generateEntryNumber(tx, journalId!, entryDate));

  return tx.journalEntry.create({
    data: {
      journalId,
      entryNumber,
      date: entryDate,
      reference: opts.reference,
      status,
      sourceType: opts.sourceType,
      sourceId: opts.sourceId,
      narration: opts.narration,
      postedAt: status === "POSTED" ? new Date() : null,
      lines: {
        create: opts.lines.map((l) => ({
          accountId: l.accountId,
          partnerId: l.partnerId || null,
          analyticId: l.analyticId || l.analyticAccountId || null,
          analyticAccountId: l.analyticAccountId || l.analyticId || null,
          narration: l.narration || l.lineLabel || null,
          lineLabel: l.lineLabel || l.narration || null,
          matchedLineId: l.matchedLineId || null,
          debit: round2(l.debit || 0),
          credit: round2(l.credit || 0),
        })),
      },
    },
    include: {
      lines: true,
      journal: true,
    },
  });
}

/**
 * Atomically posts a Journal Entry inside $transaction after strict balance validation.
 */
export async function postJournalEntry(dbOrTx: any, entryId: string) {
  const runner = async (tx: any) => {
    const entry = await tx.journalEntry.findUnique({
      where: { id: entryId },
      include: { lines: true },
    });
    if (!entry) throw new Error(`Journal Entry not found: ${entryId}`);
    if (entry.status === "POSTED") return entry;
    if (entry.status === "CANCELLED") {
      throw new Error("Cannot post a cancelled journal entry.");
    }

    checkBalanced(entry.lines);

    return tx.journalEntry.update({
      where: { id: entryId },
      data: {
        status: "POSTED",
        postedAt: new Date(),
      },
      include: {
        lines: true,
        journal: true,
      },
    });
  };

  if (dbOrTx.$transaction) {
    return dbOrTx.$transaction(runner);
  }
  return runner(dbOrTx);
}

/**
 * Updates a Journal Entry (enforces Immutability rules if POSTED).
 */
export async function updateJournalEntry(
  tx: any,
  entryId: string,
  data: {
    reference?: string;
    date?: Date | string;
    narration?: string;
    lines?: {
      accountId: string;
      partnerId?: string | null;
      analyticId?: string | null;
      narration?: string | null;
      debit: number;
      credit: number;
    }[];
  }
) {
  const entry = await tx.journalEntry.findUnique({
    where: { id: entryId },
    include: { lines: true },
  });
  if (!entry) throw new Error(`Journal Entry not found: ${entryId}`);
  if (entry.status === "POSTED") {
    throw new Error("Cannot edit posted journal entries. Create a reversal entry or reset to draft.");
  }

  if (data.lines) {
    checkBalanced(data.lines);
  }

  // Delete old lines and recreate new lines if lines provided
  if (data.lines) {
    await tx.journalLine.deleteMany({ where: { entryId } });
  }

  return tx.journalEntry.update({
    where: { id: entryId },
    data: {
      reference: data.reference,
      date: data.date ? new Date(data.date) : undefined,
      narration: data.narration,
      lines: data.lines
        ? {
            create: data.lines.map((l) => ({
              accountId: l.accountId,
              partnerId: l.partnerId || null,
              analyticId: l.analyticId || null,
              narration: l.narration || null,
              debit: round2(l.debit || 0),
              credit: round2(l.credit || 0),
            })),
          }
        : undefined,
    },
    include: {
      lines: true,
      journal: true,
    },
  });
}

/**
 * Atomically generates a Reversal Entry with swapped debits & credits inside $transaction.
 */
export async function reverseJournalEntry(
  dbOrTx: any,
  entryId: string,
  opts?: { reference?: string; date?: Date | string }
) {
  const runner = async (tx: any) => {
    const entry = await tx.journalEntry.findUnique({
      where: { id: entryId },
      include: { lines: true },
    });
    if (!entry) throw new Error(`Journal Entry not found: ${entryId}`);
    if (entry.status !== "POSTED") {
      throw new Error("Only posted entries can be reversed.");
    }
    if (entry.reversedEntryId) {
      throw new Error("This entry has already been reversed.");
    }

    const reversedLines = entry.lines.map((line: any) => ({
      accountId: line.accountId,
      partnerId: line.partnerId,
      analyticId: line.analyticId,
      analyticAccountId: line.analyticAccountId,
      narration: `Reversal of line ${line.id}`,
      debit: round2(line.credit),
      credit: round2(line.debit),
    }));

    const revDate = opts?.date ? new Date(opts.date) : new Date();

    const reversalEntry = await createJournalEntry(tx, {
      journalId: entry.journalId,
      reference: opts?.reference || `Reversal of ${entry.reference || entry.entryNumber}`,
      date: revDate,
      status: "POSTED",
      sourceType: "Reversal",
      sourceId: entry.id,
      narration: `Reversal voucher for ${entry.entryNumber || entry.id}`,
      lines: reversedLines,
    });

    await tx.journalEntry.update({
      where: { id: entryId },
      data: {
        reversedEntryId: reversalEntry.id,
        reversedAt: new Date(),
      },
    });

    return reversalEntry;
  };

  if (dbOrTx.$transaction) {
    return dbOrTx.$transaction(runner);
  }
  return runner(dbOrTx);
}

/**
 * Cancels a draft or un-reconciled journal entry.
 */
export async function cancelJournalEntry(tx: any, entryId: string) {
  const entry = await tx.journalEntry.findUnique({
    where: { id: entryId },
    include: { lines: true },
  });
  if (!entry) throw new Error(`Journal Entry not found: ${entryId}`);

  // Check reconciliation protection
  const hasReconciledLine = entry.lines.some((l: any) => !!l.matchedLineId);
  if (hasReconciledLine) {
    throw new Error("Cannot cancel entry because it contains reconciled payment items. Unmatch items first.");
  }

  return tx.journalEntry.update({
    where: { id: entryId },
    data: { status: "CANCELLED" },
  });
}

export const postJournal = async (tx: any, opts: any) => {
  return createJournalEntry(tx, {
    journalType: opts.journalType,
    date: opts.date,
    reference: opts.reference,
    sourceType: opts.sourceType,
    sourceId: opts.sourceId,
    lines: opts.lines,
    status: "POSTED",
  });
};

// ==========================================
// AUTOMATED POSTING HOOKS
// ==========================================

export async function create_invoice_entry(tx: any, invoice: any) {
  const debtorId = await getAccountIdByName(tx, "Debtors").catch(async () =>
    getAccountIdByName(tx, "Debtors A/c")
  );
  const saleId = await getAccountIdByName(tx, "Sale Income").catch(async () =>
    getAccountIdByName(tx, "Sales Income A/c")
  );

  const grandTotal = round2(invoice.total > 0 ? invoice.total : invoice.subtotal || 0);

  const lines = [
    {
      accountId: debtorId,
      partnerId: invoice.customerId,
      narration: `Invoice ${invoice.no || invoice.id}`,
      debit: grandTotal,
      credit: 0,
    },
    {
      accountId: saleId,
      partnerId: invoice.customerId,
      narration: `Sales Revenue for ${invoice.no || invoice.id}`,
      debit: 0,
      credit: grandTotal,
    },
  ];

  return createJournalEntry(tx, {
    journalType: "SALES",
    date: invoice.invDate || new Date(),
    reference: invoice.no || invoice.invRef || `INV-${invoice.id}`,
    sourceType: "CustomerInvoice",
    sourceId: invoice.id,
    narration: `Customer Invoice Entry ${invoice.no || ""}`,
    lines,
    status: "POSTED",
  });
}

export const createInvoiceEntry = create_invoice_entry;

export async function create_bill_entry(tx: any, bill: any) {
  const creditorId = await getAccountIdByName(tx, "Creditors").catch(async () =>
    getAccountIdByName(tx, "Creditors A/c")
  );
  const purchaseId = await getAccountIdByName(tx, "Purchase Expense").catch(async () =>
    getAccountIdByName(tx, "Purchase Expense A/c")
  );

  const totalAmount = round2(bill.subtotal > 0 ? bill.subtotal : bill.due || bill.paid || 0);

  const lines = [
    {
      accountId: purchaseId,
      partnerId: bill.vendorId,
      narration: `Vendor Bill ${bill.no || bill.id}`,
      debit: totalAmount,
      credit: 0,
    },
    {
      accountId: creditorId,
      partnerId: bill.vendorId,
      narration: `Payable for Bill ${bill.no || bill.id}`,
      debit: 0,
      credit: totalAmount,
    },
  ];

  return createJournalEntry(tx, {
    journalType: "PURCHASE",
    date: bill.billDate || new Date(),
    reference: bill.no || bill.billRef || `BILL-${bill.id}`,
    sourceType: "VendorBill",
    sourceId: bill.id,
    narration: `Vendor Bill Entry ${bill.no || ""}`,
    lines,
    status: "POSTED",
  });
}

export const createBillEntry = create_bill_entry;

export async function register_payment_entry(tx: any, payment: any) {
  const isCash = payment.via === "CASH";
  const bankOrCashName = isCash ? "Cash" : "Bank";

  const bankOrCashId = await getAccountIdByName(tx, bankOrCashName).catch(async () =>
    getAccountIdByName(tx, `${bankOrCashName} A/c`)
  );
  const debtorId = await getAccountIdByName(tx, "Debtors").catch(async () =>
    getAccountIdByName(tx, "Debtors A/c")
  );
  const creditorId = await getAccountIdByName(tx, "Creditors").catch(async () =>
    getAccountIdByName(tx, "Creditors A/c")
  );

  const amount = round2(payment.amount || 0);
  const isVendorPayment = !!payment.billId;

  let lines: any[] = [];
  if (isVendorPayment) {
    lines = [
      {
        accountId: creditorId,
        partnerId: payment.partnerId,
        narration: `Payment to Vendor - ${payment.note || ""}`,
        debit: amount,
        credit: 0,
      },
      {
        accountId: bankOrCashId,
        partnerId: payment.partnerId,
        narration: `Outflow via ${bankOrCashName}`,
        debit: 0,
        credit: amount,
      },
    ];
  } else {
    lines = [
      {
        accountId: bankOrCashId,
        partnerId: payment.partnerId,
        narration: `Inflow via ${bankOrCashName}`,
        debit: amount,
        credit: 0,
      },
      {
        accountId: debtorId,
        partnerId: payment.partnerId,
        narration: `Customer Receipt - ${payment.note || ""}`,
        debit: 0,
        credit: amount,
      },
    ];
  }

  return createJournalEntry(tx, {
    journalType: isCash ? "CASH" : "BANK",
    date: payment.date || new Date(),
    reference: `PAY-${payment.id}`,
    sourceType: "Payment",
    sourceId: payment.id,
    narration: `Payment Voucher ${payment.id}`,
    lines,
    status: "POSTED",
  });
}

export const registerPaymentEntry = register_payment_entry;

// ==========================================
// FINANCIAL REPORTING FUNCTIONS
// ==========================================

export async function generate_balance_sheet(tx: any, asOfDate?: Date | string) {
  const cutOff = asOfDate ? new Date(asOfDate) : new Date();

  const accounts = await tx.account.findMany({
    where: {
      type: { in: ["ASSET", "LIABILITY", "CAPITAL"] },
    },
  });

  const lines = await tx.journalLine.findMany({
    where: {
      entry: {
        status: "POSTED",
        date: { lte: cutOff },
      },
    },
  });

  const accountBalances = new Map<string, { debit: number; credit: number }>();
  for (const l of lines) {
    const curr = accountBalances.get(l.accountId) || { debit: 0, credit: 0 };
    accountBalances.set(l.accountId, {
      debit: round2(curr.debit + (l.debit || 0)),
      credit: round2(curr.credit + (l.credit || 0)),
    });
  }

  const assets: any[] = [];
  const liabilities: any[] = [];
  const capital: any[] = [];

  let totalAssets = 0;
  let totalLiabilities = 0;
  let totalCapital = 0;

  for (const acc of accounts) {
    const bal = accountBalances.get(acc.id) || { debit: 0, credit: 0 };
    if (acc.type === "ASSET") {
      const net = round2(bal.debit - bal.credit);
      assets.push({ accountId: acc.id, name: acc.name, code: acc.code, balance: net });
      totalAssets += net;
    } else if (acc.type === "LIABILITY") {
      const net = round2(bal.credit - bal.debit);
      liabilities.push({ accountId: acc.id, name: acc.name, code: acc.code, balance: net });
      totalLiabilities += net;
    } else if (acc.type === "CAPITAL") {
      const net = round2(bal.credit - bal.debit);
      capital.push({ accountId: acc.id, name: acc.name, code: acc.code, balance: net });
      totalCapital += net;
    }
  }

  totalAssets = round2(totalAssets);
  totalLiabilities = round2(totalLiabilities);
  totalCapital = round2(totalCapital);
  const totalLiabilitiesAndEquity = round2(totalLiabilities + totalCapital);
  const isBalanced = Math.abs(totalAssets - totalLiabilitiesAndEquity) < 0.01;

  return {
    asOfDate: cutOff,
    assets,
    liabilities,
    capital,
    totalAssets,
    totalLiabilities,
    totalCapital,
    totalLiabilitiesAndEquity,
    isBalanced,
  };
}

export const generateBalanceSheet = generate_balance_sheet;

export async function generate_profit_and_loss(
  tx: any,
  startDate?: Date | string,
  endDate?: Date | string
) {
  const start = startDate ? new Date(startDate) : new Date(0);
  const end = endDate ? new Date(endDate) : new Date();

  const accounts = await tx.account.findMany({
    where: {
      type: { in: ["INCOME", "EXPENSE"] },
    },
  });

  const lines = await tx.journalLine.findMany({
    where: {
      entry: {
        status: "POSTED",
        date: {
          gte: start,
          lte: end,
        },
      },
    },
  });

  const accountBalances = new Map<string, { debit: number; credit: number }>();
  for (const l of lines) {
    const curr = accountBalances.get(l.accountId) || { debit: 0, credit: 0 };
    accountBalances.set(l.accountId, {
      debit: round2(curr.debit + (l.debit || 0)),
      credit: round2(curr.credit + (l.credit || 0)),
    });
  }

  const revenue: any[] = [];
  const expenses: any[] = [];

  let totalRevenue = 0;
  let totalExpenses = 0;

  for (const acc of accounts) {
    const bal = accountBalances.get(acc.id) || { debit: 0, credit: 0 };
    if (acc.type === "INCOME") {
      const net = round2(bal.credit - bal.debit);
      revenue.push({ accountId: acc.id, name: acc.name, code: acc.code, amount: net });
      totalRevenue += net;
    } else if (acc.type === "EXPENSE") {
      const net = round2(bal.debit - bal.credit);
      expenses.push({ accountId: acc.id, name: acc.name, code: acc.code, amount: net });
      totalExpenses += net;
    }
  }

  totalRevenue = round2(totalRevenue);
  totalExpenses = round2(totalExpenses);
  const netIncome = round2(totalRevenue - totalExpenses);

  return {
    startDate: start,
    endDate: end,
    revenue,
    expenses,
    totalRevenue,
    totalExpenses,
    netIncome,
    netProfit: netIncome,
  };
}

export const generateProfitAndLoss = generate_profit_and_loss;

export async function generate_budget_report(tx: any, budgetId: string) {
  const budget = await tx.budget.findUnique({
    where: { id: budgetId },
    include: { lines: true },
  });
  if (!budget) throw new Error(`Budget not found: ${budgetId}`);

  const reportLines: any[] = [];
  let totalCommitted = 0;
  let totalAchieved = 0;

  for (const bLine of budget.lines) {
    const targetAnalyticId = bLine.analyticId;

    const journalLines = await tx.journalLine.findMany({
      where: {
        OR: [
          { analyticId: targetAnalyticId },
          { analyticAccountId: targetAnalyticId },
        ],
        entry: { status: "POSTED" },
      },
    });

    const actualAchieved = journalLines.reduce((sum: number, l: any) => {
      if (bLine.type === "EXPENSE") {
        return sum + (l.debit - l.credit);
      } else {
        return sum + (l.credit - l.debit);
      }
    }, 0);

    const roundedAchieved = round2(actualAchieved);
    const variance = round2(bLine.committed - roundedAchieved);
    const variancePercent =
      bLine.committed > 0 ? ((roundedAchieved / bLine.committed) * 100).toFixed(1) + "%" : "N/A";

    reportLines.push({
      analyticId: targetAnalyticId,
      type: bLine.type,
      committed: bLine.committed,
      achieved: roundedAchieved,
      variance,
      variancePercent,
    });

    totalCommitted += bLine.committed;
    totalAchieved += roundedAchieved;
  }

  return {
    budgetId: budget.id,
    budgetName: budget.name,
    status: budget.status,
    lines: reportLines,
    totalCommitted: round2(totalCommitted),
    totalAchieved: round2(totalAchieved),
    netVariance: round2(totalCommitted - totalAchieved),
  };
}

export const generateBudgetReport = generate_budget_report;
