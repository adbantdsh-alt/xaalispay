import type { Database } from "./types";
import { createAdminClient } from "./supabase/admin";

const ROW_ID = "main";

export function isRemoteStoreEnabled(): boolean {
  return !!(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
}

export async function loadRemoteDatabase(): Promise<Database | null> {
  const admin = createAdminClient();
  if (!admin) return null;

  const { data, error } = await admin
    .from("app_state")
    .select("data")
    .eq("id", ROW_ID)
    .maybeSingle();

  if (error) {
    console.error("loadRemoteDatabase:", error.message);
    return null;
  }

  if (!data?.data) return null;
  return data.data as Database;
}

export async function saveRemoteDatabase(db: Database): Promise<boolean> {
  const admin = createAdminClient();
  if (!admin) return false;

  const { error } = await admin.from("app_state").upsert({
    id: ROW_ID,
    data: db,
    updated_at: new Date().toISOString(),
  });

  if (error) {
    console.error("saveRemoteDatabase:", error.message);
    return false;
  }

  return true;
}
