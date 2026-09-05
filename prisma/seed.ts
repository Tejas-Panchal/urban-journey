import { db } from "../lib/db";
import { hashPassword } from "../lib/auth";

async function main() {
  console.log("Seeding Urban Journey database with complete demo data...");

  // 1. Essential Chart of Accounts
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

  // 9. Demo Sales Orders
  const existingSo = await db.salesOrder.findFirst({ where: { no: "S00001" } });
  if (!existingSo) {
    const acProd = await db.product.findFirst({ where: { name: "Air Conditioner" } });
    const chairProd = await db.product.findFirst({ where: { name: "Office Chair" } });

    if (acProd && chairProd) {
      await db.salesOrder.create({
        data: {
          no: "S00001",
          date: new Date("2026-02-15"),
          customerId: openWood.id,
          status: "CONFIRMED",
          subtotal: 30000,
          taxAmount: 5400,
          total: 35400,
          lines: {
            create: [
              { productId: acProd.id, qty: 1, unitPrice: 25000, tax: 18, total: 29500 },
              { productId: chairProd.id, qty: 1, unitPrice: 5000, tax: 18, total: 5900 },
            ],
          },
        },
      });

      await db.salesOrder.create({
        data: {
          no: "S00002",
          date: new Date("2026-02-20"),
          customerId: joeyWills.id,
          status: "QUOTATION",
          subtotal: 10000,
          taxAmount: 1800,
          total: 11800,
          lines: {
            create: [
              { productId: chairProd.id, qty: 2, unitPrice: 5000, tax: 18, total: 11800 },
            ],
          },
        },
      });
    }
  }

  // 10. Demo Customer Invoices & Payment
  const existingInv = await db.customerInvoice.findFirst({ where: { no: "INV/2026/0001" } });
  if (!existingInv) {
    const acProd = await db.product.findFirst({ where: { name: "Air Conditioner" } });
    if (acProd) {
      const inv = await db.customerInvoice.create({
        data: {
          no: "INV/2026/0001",
          invDate: new Date("2026-02-10"),
          dueDate: new Date("2026-03-10"),
          customerId: openWood.id,
          status: "CONFIRMED",
          subtotal: 25000,
          taxAmount: 4500,
          total: 29500,
          paid: 10000,
          due: 19500,
          lines: {
            create: [
              { productId: acProd.id, qty: 1, unitPrice: 25000, tax: 18, total: 29500 },
            ],
          },
        },
      });

      const existingPay = await db.payment.findFirst({ where: { invoiceId: inv.id } });
      if (!existingPay) {
        await db.payment.create({
          data: {
            date: new Date("2026-02-12"),
            partnerId: openWood.id,
            invoiceId: inv.id,
            amount: 10000,
            via: "BANK",
          },
        });
      }
    }
  }

  // 11. Demo Purchase Orders
  const existingPo = await db.purchaseOrder.findFirst({ where: { no: "P00001" } });
  if (!existingPo) {
    const sofaProd = await db.product.findFirst({ where: { name: "Sofa" } });
    if (sofaProd) {
      await db.purchaseOrder.create({
        data: {
          no: "P00001",
          date: new Date("2026-02-01"),
          vendorId: azure.id,
          status: "CONFIRMED",
          subtotal: 24000,
          total: 24000,
          lines: {
            create: [
              { productId: sofaProd.id, qty: 2, unitPrice: 12000, total: 24000 },
            ],
          },
        },
      });
    }
  }

  // 12. Demo Vendor Bills
  const existingBill = await db.vendorBill.findFirst({ where: { no: "BILL/2026/0001" } });
  if (!existingBill) {
    const tableProd = await db.product.findFirst({ where: { name: "Wooden Table" } });
    if (tableProd) {
      const bill = await db.vendorBill.create({
        data: {
          no: "BILL/2026/0001",
          billRef: "REF-BILL-001",
          billDate: new Date("2026-02-05"),
          dueDate: new Date("2026-03-05"),
          vendorId: azure.id,
          status: "PAID",
          subtotal: 11800,
          paid: 11800,
          due: 0,
          lines: {
            create: [
              { productId: tableProd.id, qty: 2, unitPrice: 5000, total: 10000 },
            ],
          },
        },
      });

      const existingBillPay = await db.payment.findFirst({ where: { billId: bill.id } });
      if (!existingBillPay) {
        await db.payment.create({
          data: {
            date: new Date("2026-02-08"),
            partnerId: azure.id,
            billId: bill.id,
            amount: 11800,
            via: "BANK",
          },
        });
      }
    }
  }

  console.log("Database seeded successfully!", {
    contacts: ["Open Wood", "Joey Wills", "Azure Journey", "Rahul Sharma", "Nimesh Pathak"],
    products: ["Air Conditioner", "Refrigerator", "Office Chair", "Wooden Table", "Sofa"],
    salesOrders: ["S00001", "S00002"],
    customerInvoices: ["INV/2026/0001"],
    purchaseOrders: ["P00001"],
    vendorBills: ["BILL/2026/0001"],
    admin: "admin01 / admin123",
    accountant: "acct001 / account123",
    customerUser: "nimesh01 / user1234!",
  });
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
