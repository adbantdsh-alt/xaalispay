import { getDb, updateDb } from "./db";
import type { AdminAuditEntry } from "./types";

const MAX_ENTRIES = 500;

export async function logAdminAction(input: {
  action: string;
  targetType: AdminAuditEntry["targetType"];
  targetId: string;
  detail?: string;
  adminEmail?: string;
}) {
  const entry: AdminAuditEntry = {
    id: crypto.randomUUID(),
    action: input.action,
    targetType: input.targetType,
    targetId: input.targetId,
    detail: input.detail,
    adminEmail: input.adminEmail,
    createdAt: new Date().toISOString(),
  };

  await updateDb((db) => {
    const log = db.adminAuditLog || [];
    log.unshift(entry);
    db.adminAuditLog = log.slice(0, MAX_ENTRIES);
  });

  return entry;
}

export async function getAdminAuditLog(limit = 50): Promise<AdminAuditEntry[]> {
  const db = await getDb();
  return [...(db.adminAuditLog || [])]
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, limit);
}
