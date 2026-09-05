import { db } from "../lib/db";

async function main() {
  const redundantNames = [
    "Bank A/c",
    "Purchase Expense A/c",
    "Debtors A/c",
    "Creditors A/c",
    "Sales Income A/c",
    "Cash A/c",
    "Other Expense A/c",
    "Capital A/c",
  ];

  for (const name of redundantNames) {
    const acc = await db.account.findUnique({ where: { name } });
    if (acc) {
      await db.journal.updateMany({
        where: { defaultDebitId: acc.id },
        data: { defaultDebitId: null },
      });
      await db.journal.updateMany({
        where: { defaultCreditId: acc.id },
        data: { defaultCreditId: null },
      });

      try {
        await db.account.delete({ where: { id: acc.id } });
        console.log(`Deleted redundant account: ${name}`);
      } catch (err: any) {
        console.log(`Could not delete ${name}: ${err.message}`);
      }
    }
  }
}

main().finally(() => process.exit(0));
