import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { hashPassword } from "@/lib/auth";
import { forgotPasswordSchema } from "@/lib/validations";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const parsed = forgotPasswordSchema.safeParse(body);

    if (!parsed.success) {
      const firstErr = parsed.error.issues[0]?.message || "Invalid input data.";
      return NextResponse.json({ error: firstErr }, { status: 400 });
    }

    const { loginId, email, newPassword } = parsed.data;

    // Find user by loginId
    const user = await db.user.findUnique({
      where: { loginId },
    });

    if (!user || user.email.toLowerCase() !== email.trim().toLowerCase()) {
      return NextResponse.json(
        { error: "No user found matching this Login ID and Email address." },
        { status: 404 }
      );
    }

    // Hash the new password and update user in database
    const newHash = await hashPassword(newPassword);
    await db.user.update({
      where: { id: user.id },
      data: { passwordHash: newHash },
    });

    return NextResponse.json({
      ok: true,
      message: "Password updated successfully! You can now sign in with your new password.",
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to reset password." },
      { status: 500 }
    );
  }
}
