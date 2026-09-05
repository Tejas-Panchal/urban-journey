import { db } from "../lib/db";
import { hashPassword } from "../lib/auth";

async function main() {
  console.log("Seeding Urban Furniture database...");

  // 1. Chart of Accounts
  const accounts = [
    { name: "Cash", type: "ASSET" as const, subtype: "CASH" as const },
    { name: "Bank", type: "ASSET" as const, subtype: "BANK" as const },
    { name: "Debtors", type: "ASSET" as const, subtype: "DEBTOR" as const },
    { name: "Creditors", type: "LIABILITY" as const, subtype: "CREDITOR" as const },
    { name: "Sale Income", type: "INCOME" as const, subtype: "SALE" as const },
    { name: "Purchase Expense", type: "EXPENSE" as const, subtype: "PURCHASE" as const },
    { name: "Capital", type: "CAPITAL" as const, subtype: "CAPITAL" as const },
  ];
  for (const a of accounts) {
    await db.account.upsert({ where: { name: a.name }, update: {}, create: a });
  }

  // 2. Journals
  const cashAcct = await db.account.findUnique({ where: { name: "Cash" } });
  const bankAcct = await db.account.findUnique({ where: { name: "Bank" } });

  const journals = [
    { name: "Sales Journal", type: "SALES" as const },
    { name: "Purchase Journal", type: "PURCHASE" as const },
    { name: "Bank Journal", type: "BANK" as const, defaultDebitId: bankAcct?.id, defaultCreditId: bankAcct?.id },
    { name: "Cash Journal", type: "CASH" as const, defaultDebitId: cashAcct?.id, defaultCreditId: cashAcct?.id },
  ];
  for (const j of journals) {
    await db.journal.upsert({ where: { name: j.name }, update: {}, create: j });
  }

  // 3. Product Categories
  const catFurniture = await db.category.upsert({ where: { name: "Furniture" }, update: {}, create: { name: "Furniture" } });
  const catElectronics = await db.category.upsert({ where: { name: "Electronics" }, update: {}, create: { name: "Electronics" } });

  // 4. Contacts (PDF Page 1, 2, 4)
  const azure = await db.contact.upsert({
    where: { email: "azure@furniture.example.com" },
    update: {},
    create: {
      name: "Azure Furniture",
      type: "VENDOR",
      email: "azure@furniture.example.com",
      mobile: "+91 9898098980",
      street: "Industrial Area Phase 1",
      city: "Ahmedabad",
      state: "Gujarat",
      pincode: "380015",
    },
  });

  const rahul = await db.contact.upsert({
    where: { email: "rahul@azure.example.com" },
    update: {},
    create: {
      name: "Rahul Sharma",
      type: "VENDOR",
      email: "rahul@azure.example.com",
      mobile: "+91 9090090909",
      street: "CG Road",
      city: "Ahmedabad",
      state: "Gujarat",
      pincode: "380001",
    },
  });

  const nimesh = await db.contact.upsert({
    where: { email: "nimesh@example.com" },
    update: {},
    create: {
      name: "Nimesh Pathak",
      type: "CUSTOMER",
      email: "nimesh@example.com",
      mobile: "+91 8080080808",
      street: "Infocity",
      city: "Gandhinagar",
      state: "Gujarat",
      pincode: "382001",
    },
  });

  // 5. Products (PDF Page 2)
  const prods = [
    { name: "Office Chair", type: "GOODS" as const, salesPrice: 5000, cost: 3000, categoryId: catFurniture.id },
    { name: "Wooden Table", type: "GOODS" as const, salesPrice: 8000, cost: 5000, categoryId: catFurniture.id },
    { name: "Sofa", type: "GOODS" as const, salesPrice: 20000, cost: 12000, categoryId: catFurniture.id },
    { name: "Dining Table", type: "GOODS" as const, salesPrice: 15000, cost: 9000, categoryId: catFurniture.id },
    { name: "Wooden Chair", type: "GOODS" as const, salesPrice: 3500, cost: 2000, categoryId: catFurniture.id },
  ];
  for (const p of prods) {
    const ex = await db.product.findFirst({ where: { name: p.name } });
    if (!ex) await db.product.create({ data: p });
  }

  // 6. Analytic Account (PDF Page 4)
  const analytic = await db.analytic.upsert({
    where: { name: "Furniture Project" },
    update: {},
    create: { name: "Furniture Project", type: "EXPENSE" },
  });

  // 7. System Users (Admin, Accountant, Contact User)
  const adminHash = await hashPassword("admin123");
  await db.user.upsert({
    where: { loginId: "admin01" },
    update: {},
    create: { loginId: "admin01", email: "admin@urban.example.com", passwordHash: adminHash, role: "ADMIN" },
  });

  const acctHash = await hashPassword("account123");
  await db.user.upsert({
    where: { loginId: "acct001" },
    update: {},
    create: { loginId: "acct001", email: "acct@urban.example.com", passwordHash: acctHash, role: "ACCOUNTANT" },
  });

  const contactUserHash = await hashPassword("user1234!");
  await db.user.upsert({
    where: { loginId: "nimesh01" },
    update: {},
    create: { loginId: "nimesh01", email: "nimesh@example.com", passwordHash: contactUserHash, role: "CONTACT", contactId: nimesh.id },
  });

  // 8. Budget (PDF Page 4)
  const b = await db.budget.findFirst({ where: { name: "Q1 2026 Budget" } });
  if (!b) {
    await db.budget.create({
      data: {
        name: "Q1 2026 Budget",
        start: new Date("2026-01-01"),
        end: new Date("2026-03-31"),
        status: "CONFIRMED",
        lines: { create: [{ analyticId: analytic.id, type: "EXPENSE", committed: 250000 }] },
      },
    });
  }

  console.log("Database seeded successfully!", {
    admin: "admin01 / admin123",
    accountant: "acct001 / account123",
    contactUser: "nimesh01 / user1234!",
    vendor: azure.name,
    customer: nimesh.name,
  });
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
