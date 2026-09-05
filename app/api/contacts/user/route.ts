import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireSession, apiError } from "@/lib/api";
import { hashPassword } from "@/lib/auth";
import { z } from "zod";

const createContactUserSchema = z.object({
  contactId: z.string().min(1),
  loginId: z.string().min(4).max(12),
  email: z.string().email(),
  password: z.string().min(6),
});

export async function POST(req: Request) {
  const { error } = await requireSession(["ADMIN", "ACCOUNTANT"]);
  if (error) return error!;

  const body = await req.json().catch(() => ({}));
  const parsed = createContactUserSchema.safeParse(body);
  if (!parsed.success) return apiError(parsed.error.issues[0]?.message ?? "Invalid input");

  const { contactId, loginId, email, password } = parsed.data;

  const contact = await db.contact.findUnique({ where: { id: contactId } });
  if (!contact) return apiError("Contact not found", 404);

  const existingUser = await db.user.findFirst({
    where: { OR: [{ loginId }, { email }, { contactId }] },
  });
  if (existingUser) return apiError("User or login ID already exists for this contact/email", 409);

  const passwordHash = await hashPassword(password);

  const user = await db.user.create({
    data: {
      loginId,
      email,
      passwordHash,
      role: "CONTACT",
      contactId,
    },
    select: { id: true, loginId: true, email: true, role: true, contactId: true },
  });

  return NextResponse.json({ user }, { status: 201 });
}
