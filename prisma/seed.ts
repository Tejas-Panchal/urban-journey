import { db } from "../lib/db";
import { hashPassword } from "../lib/auth";

async function main() {
  console.log("Seeding Urban Journey database with complete demo data...");

  // 1. Chart of Accounts (Including wireframe pre-configured accounts)
  const accounts = [
    { name: "Bank A/c", type: "ASSET" as const, subtype: "BANK" as const },
    { name: "Purchase Expense A/c", type: "EXPENSE" as const, subtype: "PURCHASE" as const },
    { name: "Debtors A/c", type: "ASSET" as const, subtype: "DEBTOR" as const },
    { name: "Creditors A/c", type: "LIABILITY" as const, subtype: "CREDITOR" as const },
    { name: "Sales Income A/c", type: "INCOME" as const, subtype: "SALE" as const },
    { name: "Cash A/c", type: "ASSET" as const, subtype: "CASH" as const },
    { name: "Other Expense A/c", type: "EXPENSE" as const, subtype: "OTHER" as const },
    { name: "Capital A/c", type: "CAPITAL" as const, subtype: "CAPITAL" as const },
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
    {
      name: "Bank Journal",
      type: "BANK" as const,
      defaultDebitId: bankAcct?.id,
      defaultCreditId: bankAcct?.id,
    },
    {
      name: "Cash Journal",
      type: "CASH" as const,
      defaultDebitId: cashAcct?.id,
      defaultCreditId: cashAcct?.id,
    },
  ];
  for (const j of journals) {
    await db.journal.upsert({ where: { name: j.name }, update: {}, create: j });
  }

  // 3. Product Categories
  const catFurniture = await db.category.upsert({
    where: { name: "Furniture" },
    update: {},
    create: { name: "Furniture" },
  });
  const catElectronics = await db.category.upsert({
    where: { name: "Electronics" },
    update: {},
    create: { name: "Electronics" },
  });
  const catOffice = await db.category.upsert({
    where: { name: "Office Supplies" },
    update: {},
    create: { name: "Office Supplies" },
  });

  // 4. Contacts (Including Wireframe Demo Contacts)
  const openWood = await db.contact.upsert({
    where: { email: "Openwood21@example.com" },
    update: {},
    create: {
      name: "Open Wood",
      type: "CUSTOMER",
      email: "Openwood21@example.com",
      mobile: "+91 9090090909",
      street: "Sector 17",
      city: "Chandigarh",
      state: "Punjab",
      pincode: "160017",
    },
  });

  const joeyWills = await db.contact.upsert({
    where: { email: "Joey.wills@example.com" },
    update: {},
    create: {
      name: "Joey Wills",
      type: "CUSTOMER",
      email: "Joey.wills@example.com",
      mobile: "+91 8080080808",
      street: "MG Road",
      city: "Bengaluru",
      state: "Karnataka",
      pincode: "560001",
    },
  });

  const azure = await db.contact.upsert({
    where: { email: "azure@journey.example.com" },
    update: {},
    create: {
      name: "Azure Journey",
      type: "VENDOR",
      email: "azure@journey.example.com",
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

  // 5. Products (Including Wireframe Demo Products)
  const prods = [
    {
      name: "Air Conditioner",
      type: "GOODS" as const,
      salesPrice: 25000,
      cost: 15000,
      categoryId: catElectronics.id,
    },
    {
      name: "Refrigerator",
      type: "GOODS" as const,
      salesPrice: 10000,
      cost: 7000,
      categoryId: catElectronics.id,
    },
    {
      name: "Office Chair",
      type: "GOODS" as const,
      salesPrice: 5000,
      cost: 3000,
      categoryId: catFurniture.id,
    },
    {
      name: "Wooden Table",
      type: "GOODS" as const,
      salesPrice: 8000,
      cost: 5000,
      categoryId: catFurniture.id,
    },
    {
      name: "Sofa",
      type: "GOODS" as const,
      salesPrice: 20000,
      cost: 12000,
      categoryId: catFurniture.id,
    },
    {
      name: "Dining Table",
      type: "GOODS" as const,
      salesPrice: 15000,
      cost: 9000,
      categoryId: catFurniture.id,
    },
    {
      name: "Wooden Chair",
      type: "GOODS" as const,
      salesPrice: 3500,
      cost: 2000,
      categoryId: catFurniture.id,
    },
  ];
  for (const p of prods) {
    const ex = await db.product.findFirst({ where: { name: p.name } });
    if (!ex) await db.product.create({ data: p });
  }

  // 6. Analytic Account
  const analytic = await db.analytic.upsert({
    where: { name: "Journey Project" },
    update: {},
    create: { name: "Journey Project", type: "EXPENSE" },
  });

  const analyticIT = await db.analytic.upsert({
    where: { name: "IT Infrastructure" },
    update: {},
    create: { name: "IT Infrastructure", type: "EXPENSE" },
  });

  // 7. System Users (Admin, Accountant, Contact User)
  const adminHash = await hashPassword("admin123");
  await db.user.upsert({
    where: { loginId: "admin01" },
    update: {},
    create: {
      loginId: "admin01",
      email: "admin@urban.example.com",
      passwordHash: adminHash,
      role: "ADMIN",
    },
  });

  const acctHash = await hashPassword("account123");
  await db.user.upsert({
    where: { loginId: "acct001" },
    update: {},
    create: {
      loginId: "acct001",
      email: "acct@urban.example.com",
      passwordHash: acctHash,
      role: "ACCOUNTANT",
    },
  });

  const contactUserHash = await hashPassword("user1234!");
  await db.user.upsert({
    where: { loginId: "nimesh01" },
    update: {},
    create: {
      loginId: "nimesh01",
      email: "nimesh@example.com",
      passwordHash: contactUserHash,
      role: "CONTACT",
      contactId: nimesh.id,
    },
  });

  // 8. Budget
  const b = await db.budget.findFirst({ where: { name: "Q1 2026 Budget" } });
  if (!b) {
    await db.budget.create({
      data: {
        name: "Q1 2026 Budget",
        start: new Date("2026-01-01"),
        end: new Date("2026-03-31"),
        status: "CONFIRMED",
        lines: {
          create: [
            { analyticId: analytic.id, type: "EXPENSE", committed: 250000 },
            { analyticId: analyticIT.id, type: "EXPENSE", committed: 150000 },
          ],
        },
      },
    });
  }

  console.log("Database seeded successfully!", {
    contacts: ["Open Wood", "Joey Wills", "Azure Journey", "Rahul Sharma", "Nimesh Pathak"],
    products: ["Air Conditioner", "Refrigerator", "Office Chair", "Wooden Table", "Sofa"],
    admin: "admin01 / admin123",
    accountant: "acct001 / account123",
    customerUser: "nimesh01 / user1234!",
  });
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
