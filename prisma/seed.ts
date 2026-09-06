import { db } from "../lib/db";
import { hashPassword } from "../lib/auth";
import { recomputeAllConfirmedBudgets } from "../lib/budgets";

async function main() {
  console.log("Seeding Urban Journey database with 3-month demo data (June - Sept 2026)...");

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
  await db.category.upsert({
    where: { name: "Office Supplies" },
    update: {},
    create: { name: "Office Supplies" },
  });

  // 4. Contacts
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

  const techCorp = await db.contact.upsert({
    where: { email: "info@techcorp.example.com" },
    update: {},
    create: {
      name: "TechCorp Pvt Ltd",
      type: "CUSTOMER",
      email: "info@techcorp.example.com",
      mobile: "+91 9123456789",
      street: "Cyber City",
      city: "Gurugram",
      state: "Haryana",
      pincode: "122002",
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

  const globalSupplies = await db.contact.upsert({
    where: { email: "orders@globalsupplies.example.com" },
    update: {},
    create: {
      name: "Global Supplies Ltd",
      type: "VENDOR",
      email: "orders@globalsupplies.example.com",
      mobile: "+91 9988776655",
      street: "Bandra Kurla Complex",
      city: "Mumbai",
      state: "Maharashtra",
      pincode: "400051",
    },
  });

  // Helper for Product creation
  const getOrCreateProduct = async (p: { name: string; type: "GOODS" | "SERVICE"; salesPrice: number; cost: number; categoryId: string }) => {
    const existing = await db.product.findFirst({ where: { name: p.name } });
    if (existing) return existing;
    return db.product.create({ data: p });
  };

  // 5. Products
  const acProd = await getOrCreateProduct({ name: "Air Conditioner", type: "GOODS", salesPrice: 25000, cost: 15000, categoryId: catElectronics.id });
  const fridgeProd = await getOrCreateProduct({ name: "Refrigerator", type: "GOODS", salesPrice: 10000, cost: 7000, categoryId: catElectronics.id });
  const chairProd = await getOrCreateProduct({ name: "Office Chair", type: "GOODS", salesPrice: 5000, cost: 3000, categoryId: catFurniture.id });
  const tableProd = await getOrCreateProduct({ name: "Wooden Table", type: "GOODS", salesPrice: 8000, cost: 5000, categoryId: catFurniture.id });
  const sofaProd = await getOrCreateProduct({ name: "Sofa", type: "GOODS", salesPrice: 20000, cost: 12000, categoryId: catFurniture.id });
  const deskProd = await getOrCreateProduct({ name: "Ergonomic Desk", type: "GOODS", salesPrice: 18000, cost: 11000, categoryId: catFurniture.id });

  // 6. Analytic Accounts
  const analyticJourney = await db.analytic.upsert({
    where: { name: "Journey Project" },
    update: {},
    create: { name: "Journey Project", type: "EXPENSE" },
  });

  const analyticIT = await db.analytic.upsert({
    where: { name: "IT Infrastructure" },
    update: {},
    create: { name: "IT Infrastructure", type: "EXPENSE" },
  });

  const analyticMktg = await db.analytic.upsert({
    where: { name: "Marketing & Sales" },
    update: {},
    create: { name: "Marketing & Sales", type: "EXPENSE" },
  });

  const analyticOps = await db.analytic.upsert({
    where: { name: "Operations & Logistics" },
    update: {},
    create: { name: "Operations & Logistics", type: "EXPENSE" },
  });

  // 7. System Users
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

  // 8. Budgets (Q2 & Q3 2026)
  const q2Budget = await db.budget.findFirst({ where: { name: "Q2 2026 Budget" } });
  if (!q2Budget) {
    await db.budget.create({
      data: {
        name: "Q2 2026 Budget",
        start: new Date("2026-04-01"),
        end: new Date("2026-06-30"),
        status: "CONFIRMED",
        lines: {
          create: [
            { analyticId: analyticJourney.id, type: "EXPENSE", committed: 300000 },
            { analyticId: analyticIT.id, type: "EXPENSE", committed: 200000 },
          ],
        },
      },
    });
  }

  const q3Budget = await db.budget.findFirst({ where: { name: "Q3 2026 Budget" } });
  if (!q3Budget) {
    await db.budget.create({
      data: {
        name: "Q3 2026 Budget",
        start: new Date("2026-07-01"),
        end: new Date("2026-09-30"),
        status: "CONFIRMED",
        lines: {
          create: [
            { analyticId: analyticJourney.id, type: "EXPENSE", committed: 350000 },
            { analyticId: analyticIT.id, type: "EXPENSE", committed: 250000 },
            { analyticId: analyticMktg.id, type: "EXPENSE", committed: 150000 },
            { analyticId: analyticOps.id, type: "EXPENSE", committed: 180000 },
          ],
        },
      },
    });
  }

  // Helper helper to create Sales Order + Invoice + Payment
  const createDemoSale = async (opts: {
    soNo: string;
    invNo: string;
    customer: any;
    date: string;
    items: { product: any; qty: number; unitPrice: number; tax?: number; analyticId?: string }[];
    status?: "PAID" | "PARTIAL" | "CONFIRMED";
    payAmount?: number;
  }) => {
    const saleDate = new Date(opts.date);
    const dueDate = new Date(saleDate.getTime() + 30 * 864e5);
    const subtotal = opts.items.reduce((s, i) => s + i.qty * i.unitPrice, 0);
    const taxTotal = opts.items.reduce((s, i) => s + i.qty * i.unitPrice * ((i.tax || 18) / 100), 0);
    const grandTotal = Math.round((subtotal + taxTotal) * 100) / 100;

    // 1. Sales Order
    const existingSo = await db.salesOrder.findFirst({ where: { no: opts.soNo } });
    if (!existingSo) {
      await db.salesOrder.create({
        data: {
          no: opts.soNo,
          customerId: opts.customer.id,
          date: saleDate,
          status: "CONFIRMED",
          subtotal,
          taxTotal,
          total: grandTotal,
          lines: {
            create: opts.items.map((i) => ({
              productId: i.product.id,
              analyticId: i.analyticId || null,
              qty: i.qty,
              unitPrice: i.unitPrice,
              tax: i.tax || 18,
              total: Math.round(i.qty * i.unitPrice * (1 + (i.tax || 18) / 100) * 100) / 100,
            })),
          },
        },
      });
    }

    // 2. Customer Invoice
    const existingInv = await db.customerInvoice.findFirst({ where: { no: opts.invNo } });
    if (!existingInv) {
      const paid = opts.status === "PAID" ? grandTotal : opts.payAmount || 0;
      const due = Math.max(0, Math.round((grandTotal - paid) * 100) / 100);
      const invStatus = due <= 0.01 ? "PAID" : paid > 0 ? "PARTIAL" : "CONFIRMED";

      const inv = await db.customerInvoice.create({
        data: {
          no: opts.invNo,
          invRef: `REF-${opts.invNo.replace(/\//g, "-")}`,
          customerId: opts.customer.id,
          invDate: saleDate,
          dueDate,
          status: invStatus,
          subtotal,
          taxTotal,
          total: grandTotal,
          paid,
          due,
          lines: {
            create: opts.items.map((i) => ({
              productId: i.product.id,
              analyticId: i.analyticId || null,
              qty: i.qty,
              unitPrice: i.unitPrice,
              tax: i.tax || 18,
              total: Math.round(i.qty * i.unitPrice * (1 + (i.tax || 18) / 100) * 100) / 100,
            })),
          },
        },
      });

      // 3. Payment
      if (paid > 0) {
        const payDate = new Date(saleDate.getTime() + 3 * 864e5);
        await db.payment.create({
          data: {
            partnerId: opts.customer.id,
            invoiceId: inv.id,
            amount: paid,
            date: payDate,
            via: "BANK",
            note: `Payment received for ${inv.no}`,
          },
        });
      }
    }
  };

  // Helper to create Purchase Order + Vendor Bill + Payment
  const createDemoPurchase = async (opts: {
    poNo: string;
    billNo: string;
    vendor: any;
    date: string;
    items: { product: any; qty: number; unitPrice: number; analyticId?: string }[];
    status?: "PAID" | "PARTIAL" | "CONFIRMED";
    payAmount?: number;
  }) => {
    const billDate = new Date(opts.date);
    const dueDate = new Date(billDate.getTime() + 30 * 864e5);
    const subtotal = opts.items.reduce((s, i) => s + i.qty * i.unitPrice, 0);

    // 1. Purchase Order
    const existingPo = await db.purchaseOrder.findFirst({ where: { no: opts.poNo } });
    if (!existingPo) {
      await db.purchaseOrder.create({
        data: {
          no: opts.poNo,
          vendorId: opts.vendor.id,
          date: billDate,
          status: "CONFIRMED",
          subtotal,
          lines: {
            create: opts.items.map((i) => ({
              productId: i.product.id,
              analyticId: i.analyticId || null,
              qty: i.qty,
              unitPrice: i.unitPrice,
              total: i.qty * i.unitPrice,
            })),
          },
        },
      });
    }

    // 2. Vendor Bill
    const existingBill = await db.vendorBill.findFirst({ where: { no: opts.billNo } });
    if (!existingBill) {
      const paid = opts.status === "PAID" ? subtotal : opts.payAmount || 0;
      const due = Math.max(0, Math.round((subtotal - paid) * 100) / 100);
      const billStatus = due <= 0.01 ? "PAID" : paid > 0 ? "PARTIAL" : "CONFIRMED";

      const bill = await db.vendorBill.create({
        data: {
          no: opts.billNo,
          billRef: `REF-${opts.billNo.replace(/\//g, "-")}`,
          vendorId: opts.vendor.id,
          billDate,
          dueDate,
          status: billStatus,
          subtotal,
          paid,
          due,
          lines: {
            create: opts.items.map((i) => ({
              productId: i.product.id,
              analyticId: i.analyticId || null,
              qty: i.qty,
              unitPrice: i.unitPrice,
              total: i.qty * i.unitPrice,
            })),
          },
        },
      });

      // 3. Payment
      if (paid > 0) {
        const payDate = new Date(billDate.getTime() + 4 * 864e5);
        await db.payment.create({
          data: {
            partnerId: opts.vendor.id,
            billId: bill.id,
            amount: paid,
            date: payDate,
            via: "BANK",
            note: `Payment made for bill ${bill.no}`,
          },
        });
      }
    }
  };

  // --- JUNE 2026 DEMO TRANSACTIONS ---
  console.log("Generating June 2026 transactions...");
  await createDemoSale({
    soNo: "S00003",
    invNo: "INV/2026/0002",
    customer: openWood,
    date: "2026-06-05",
    items: [
      { product: acProd, qty: 2, unitPrice: 25000, analyticId: analyticJourney.id },
      { product: chairProd, qty: 4, unitPrice: 5000, analyticId: analyticJourney.id },
    ],
    status: "PAID",
  });

  await createDemoSale({
    soNo: "S00004",
    invNo: "INV/2026/0003",
    customer: techCorp,
    date: "2026-06-18",
    items: [
      { product: deskProd, qty: 5, unitPrice: 18000, analyticId: analyticIT.id },
      { product: chairProd, qty: 5, unitPrice: 5000, analyticId: analyticIT.id },
    ],
    status: "PAID",
  });

  await createDemoSale({
    soNo: "S00010",
    invNo: "INV/2026/0009",
    customer: nimesh,
    date: "2026-06-25",
    items: [
      { product: sofaProd, qty: 1, unitPrice: 20000, analyticId: analyticJourney.id },
      { product: tableProd, qty: 1, unitPrice: 8000, analyticId: analyticJourney.id },
    ],
    status: "PAID",
  });

  await createDemoPurchase({
    poNo: "P00002",
    billNo: "BILL/2026/0002",
    vendor: azure,
    date: "2026-06-02",
    items: [
      { product: acProd, qty: 3, unitPrice: 15000, analyticId: analyticJourney.id },
    ],
    status: "PAID",
  });

  await createDemoPurchase({
    poNo: "P00003",
    billNo: "BILL/2026/0003",
    vendor: globalSupplies,
    date: "2026-06-20",
    items: [
      { product: deskProd, qty: 6, unitPrice: 11000, analyticId: analyticIT.id },
      { product: chairProd, qty: 10, unitPrice: 3000, analyticId: analyticIT.id },
    ],
    status: "PAID",
  });

  // --- JULY 2026 DEMO TRANSACTIONS ---
  console.log("Generating July 2026 transactions...");
  await createDemoSale({
    soNo: "S00005",
    invNo: "INV/2026/0004",
    customer: joeyWills,
    date: "2026-07-08",
    items: [
      { product: sofaProd, qty: 2, unitPrice: 20000, analyticId: analyticJourney.id },
      { product: tableProd, qty: 1, unitPrice: 8000, analyticId: analyticJourney.id },
    ],
    status: "PAID",
  });

  await createDemoSale({
    soNo: "S00006",
    invNo: "INV/2026/0005",
    customer: techCorp,
    date: "2026-07-22",
    items: [
      { product: acProd, qty: 3, unitPrice: 25000, analyticId: analyticIT.id },
      { product: fridgeProd, qty: 2, unitPrice: 10000, analyticId: analyticOps.id },
    ],
    status: "PARTIAL",
    payAmount: 50000,
  });

  await createDemoSale({
    soNo: "S00011",
    invNo: "INV/2026/0010",
    customer: openWood,
    date: "2026-07-28",
    items: [
      { product: deskProd, qty: 3, unitPrice: 18000, analyticId: analyticJourney.id },
    ],
    status: "PAID",
  });

  await createDemoPurchase({
    poNo: "P00004",
    billNo: "BILL/2026/0004",
    vendor: rahul,
    date: "2026-07-04",
    items: [
      { product: sofaProd, qty: 3, unitPrice: 12000, analyticId: analyticJourney.id },
      { product: tableProd, qty: 2, unitPrice: 5000, analyticId: analyticJourney.id },
    ],
    status: "PAID",
  });

  await createDemoPurchase({
    poNo: "P00005",
    billNo: "BILL/2026/0005",
    vendor: globalSupplies,
    date: "2026-07-15",
    items: [
      { product: acProd, qty: 4, unitPrice: 15000, analyticId: analyticIT.id },
      { product: chairProd, qty: 15, unitPrice: 3000, analyticId: analyticMktg.id },
    ],
    status: "PAID",
  });

  // --- AUGUST 2026 DEMO TRANSACTIONS ---
  console.log("Generating August 2026 transactions...");
  await createDemoSale({
    soNo: "S00007",
    invNo: "INV/2026/0006",
    customer: nimesh,
    date: "2026-08-04",
    items: [
      { product: deskProd, qty: 2, unitPrice: 18000, analyticId: analyticJourney.id },
      { product: chairProd, qty: 2, unitPrice: 5000, analyticId: analyticJourney.id },
    ],
    status: "PAID",
  });

  await createDemoSale({
    soNo: "S00008",
    invNo: "INV/2026/0007",
    customer: openWood,
    date: "2026-08-19",
    items: [
      { product: acProd, qty: 2, unitPrice: 25000, analyticId: analyticOps.id },
      { product: sofaProd, qty: 1, unitPrice: 20000, analyticId: analyticOps.id },
    ],
    status: "PAID",
  });

  await createDemoSale({
    soNo: "S00012",
    invNo: "INV/2026/0011",
    customer: joeyWills,
    date: "2026-08-27",
    items: [
      { product: fridgeProd, qty: 2, unitPrice: 10000, analyticId: analyticMktg.id },
      { product: chairProd, qty: 4, unitPrice: 5000, analyticId: analyticMktg.id },
    ],
    status: "PAID",
  });

  await createDemoPurchase({
    poNo: "P00006",
    billNo: "BILL/2026/0006",
    vendor: azure,
    date: "2026-08-01",
    items: [
      { product: deskProd, qty: 4, unitPrice: 11000, analyticId: analyticJourney.id },
      { product: chairProd, qty: 8, unitPrice: 3000, analyticId: analyticJourney.id },
    ],
    status: "PAID",
  });

  await createDemoPurchase({
    poNo: "P00007",
    billNo: "BILL/2026/0007",
    vendor: rahul,
    date: "2026-08-14",
    items: [
      { product: acProd, qty: 3, unitPrice: 15000, analyticId: analyticOps.id },
      { product: fridgeProd, qty: 4, unitPrice: 7000, analyticId: analyticMktg.id },
    ],
    status: "PAID",
  });

  // --- SEPTEMBER 2026 DEMO TRANSACTIONS ---
  console.log("Generating September 2026 transactions...");
  await createDemoSale({
    soNo: "S00009",
    invNo: "INV/2026/0008",
    customer: techCorp,
    date: "2026-09-02",
    items: [
      { product: acProd, qty: 1, unitPrice: 25000, analyticId: analyticIT.id },
      { product: deskProd, qty: 2, unitPrice: 18000, analyticId: analyticIT.id },
    ],
    status: "PARTIAL",
    payAmount: 30000,
  });

  await createDemoSale({
    soNo: "S00013",
    invNo: "INV/2026/0012",
    customer: nimesh,
    date: "2026-09-04",
    items: [
      { product: sofaProd, qty: 2, unitPrice: 20000, analyticId: analyticJourney.id },
      { product: chairProd, qty: 2, unitPrice: 5000, analyticId: analyticJourney.id },
    ],
    status: "CONFIRMED",
    payAmount: 0,
  });

  await createDemoSale({
    soNo: "S00014",
    invNo: "INV/2026/0013",
    customer: openWood,
    date: "2026-09-05",
    items: [
      { product: acProd, qty: 2, unitPrice: 25000, analyticId: analyticOps.id },
    ],
    status: "PAID",
  });

  await createDemoPurchase({
    poNo: "P00008",
    billNo: "BILL/2026/0008",
    vendor: globalSupplies,
    date: "2026-09-03",
    items: [
      { product: acProd, qty: 2, unitPrice: 15000, analyticId: analyticIT.id },
      { product: sofaProd, qty: 2, unitPrice: 12000, analyticId: analyticMktg.id },
    ],
    status: "PAID",
  });

  // Recompute budgets
  console.log("Recomputing all confirmed budget lines...");
  await recomputeAllConfirmedBudgets();

  console.log("Database seeded successfully with 3-month demo data!", {
    monthsCovered: ["June 2026", "July 2026", "August 2026", "September 2026"],
    contacts: ["Open Wood", "Joey Wills", "Azure Journey", "Rahul Sharma", "Nimesh Pathak", "TechCorp Pvt Ltd", "Global Supplies Ltd"],
    products: ["Air Conditioner", "Refrigerator", "Office Chair", "Wooden Table", "Sofa", "Ergonomic Desk"],
    budgets: ["Q1 2026 Budget", "Q2 2026 Budget", "Q3 2026 Budget"],
    salesOrdersCount: 9,
    vendorBillsCount: 8,
    admin: "admin01 / admin123",
    accountant: "acct001 / account123",
    customerUser: "nimesh01 / user1234!",
  });
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
