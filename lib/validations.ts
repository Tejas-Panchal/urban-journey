import { z } from "zod";

export const loginIdSchema = z
  .string()
  .min(6, "Login Id must be 6-12 characters")
  .max(12, "Login Id must be 6-12 characters")
  .regex(/^[A-Za-z0-9._-]+$/, "Login Id contains invalid characters");
export const passwordSchema = z
  .string()
  .min(8, "Password must be more than 8 characters")
  .regex(/[a-z]/, "Password must contain a small case letter")
  .regex(/[A-Z]/, "Password must contain a large case letter")
  .regex(/[^A-Za-z0-9]/, "Password must contain a special character");

export const signupSchema = z
  .object({
    name: z.string().min(1),
    loginId: loginIdSchema,
    email: z.string().email(),
    password: passwordSchema,
    rePassword: z.string(),
  })
  .refine((d) => d.password === d.rePassword, {
    message: "Passwords do not match",
    path: ["rePassword"],
  });

export const forgotPasswordSchema = z
  .object({
    loginId: z.string().min(1, "Login Id is required"),
    email: z.string().email("Valid email is required"),
    newPassword: passwordSchema,
    rePassword: z.string(),
  })
  .refine((d) => d.newPassword === d.rePassword, {
    message: "Passwords do not match",
    path: ["rePassword"],
  });

export const createUserSchema = signupSchema.extend({
  role: z.enum(["ADMIN", "ACCOUNTANT", "CONTACT"]).default("ACCOUNTANT"),
});

export const contactSchema = z.object({
  name: z.string().min(1),
  type: z.enum(["CUSTOMER", "VENDOR", "BOTH"]).default("CUSTOMER"),
  email: z.string().email(),
  mobile: z.string().optional(),
  street: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  pincode: z.string().optional(),
  image: z.string().optional(),
});

export const productSchema = z.object({
  name: z.string().min(1),
  type: z.enum(["GOODS", "SERVICE", "COMBO"]).default("GOODS"),
  salesPrice: z.number().nonnegative(),
  cost: z.number().nonnegative(),
  categoryId: z.string().min(1),
  image: z.string().optional(),
});

export const docLineSchema = z.object({
  productId: z.string().min(1),
  analyticId: z.string().optional(),
  qty: z.number().positive(),
  unitPrice: z.number().nonnegative(),
  tax: z.number().nonnegative().optional().default(0),
});

export const purchaseOrderSchema = z.object({
  vendorId: z.string().min(1),
  date: z.string().optional(),
  lines: z.array(docLineSchema).min(1),
});

export const vendorBillSchema = z.object({
  vendorId: z.string().min(1),
  poId: z.string().optional(),
  billRef: z.string().min(1),
  billDate: z.string().optional(),
  dueDate: z.string().min(1),
  lines: z.array(docLineSchema).min(1),
});

export const salesOrderSchema = purchaseOrderSchema
  .extend({ customerId: z.string().min(1) })
  .omit({ vendorId: true })
  .merge(z.object({ vendorId: z.string().optional() }));
// simpler: accept customerId
export const salesOrderStrict = z.object({
  customerId: z.string().min(1),
  date: z.string().optional(),
  lines: z.array(docLineSchema).min(1),
});

export const customerInvoiceSchema = z.object({
  customerId: z.string().min(1),
  soId: z.string().optional(),
  invRef: z.string().min(1),
  invDate: z.string().optional(),
  dueDate: z.string().min(1),
  lines: z.array(docLineSchema).min(1),
});

export const paymentSchema = z
  .object({
    partnerId: z.string().min(1),
    billId: z.string().optional(),
    invoiceId: z.string().optional(),
    amount: z.number().positive(),
    date: z.string().optional(),
    via: z.enum(["CASH", "BANK"]).default("BANK"),
    note: z.string().optional(),
  })
  .refine((d) => !!d.billId !== !!d.invoiceId, {
    message: "Provide exactly one of billId or invoiceId",
  });

export const budgetLineSchema = z.object({
  analyticId: z.string().min(1),
  type: z.enum(["INCOME", "EXPENSE"]),
  committed: z.number().positive(),
});

export const budgetSchema = z.object({
  name: z.string().min(1),
  start: z.string().min(1),
  end: z.string().min(1),
  responsibleId: z.string().optional(),
  lines: z.array(budgetLineSchema).min(1),
});
