import { db } from "@/lib/db";
import { getSession } from "@/lib/api";

export async function logAudit(action: string, entityType: string, entityId?: string, details?: string) {
  try {
    const session = await getSession().catch(() => null);
    await db.auditLog.create({
      data: {
        userId: session?.sub || null,
        userName: session?.loginId || "System",
        action,
        entityType,
        entityId: entityId || null,
        details: details || null,
      },
    });
  } catch (err) {
    console.error("Failed to write audit log:", err);
  }
}
