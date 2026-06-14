import type { Database } from "./types";
import { createAdminClient } from "./supabase/admin";

const ROW_ID = "main";

export interface RemoteStoreStatus {
  enabled: boolean;
  ok: boolean;
  error?: string;
  profileCount?: number;
  productCount?: number;
}

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
    console.error("loadRemoteDatabase:", error.message, error.code);
    return null;
  }

  if (!data?.data) return null;
  return data.data as Database;
}

export async function saveRemoteDatabase(db: Database): Promise<boolean> {
  const admin = createAdminClient();
  if (!admin) {
    console.error("saveRemoteDatabase: admin client manquant");
    return false;
  }

  const { error } = await admin.from("app_state").upsert({
    id: ROW_ID,
    data: db,
    updated_at: new Date().toISOString(),
  });

  if (error) {
    console.error("saveRemoteDatabase:", error.message, error.code, error.details);
    return false;
  }

  return true;
}

export async function checkRemoteStore(): Promise<RemoteStoreStatus> {
  if (!isRemoteStoreEnabled()) {
    return {
      enabled: false,
      ok: false,
      error: "SUPABASE_SERVICE_ROLE_KEY ou NEXT_PUBLIC_SUPABASE_URL manquant",
    };
  }

  const admin = createAdminClient();
  if (!admin) {
    return { enabled: true, ok: false, error: "Client admin Supabase indisponible" };
  }

  const { data, error } = await admin
    .from("app_state")
    .select("data")
    .eq("id", ROW_ID)
    .maybeSingle();

  if (error) {
    return {
      enabled: true,
      ok: false,
      error: `${error.message} (${error.code}). Exécutez supabase/app_state.sql.`,
    };
  }

  const db = (data?.data || {}) as Database;
  return {
    enabled: true,
    ok: true,
    profileCount: db.profiles?.length ?? 0,
    productCount: db.products?.length ?? 0,
  };
}
