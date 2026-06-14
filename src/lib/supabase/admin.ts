import { createClient } from "@supabase/supabase-js";

export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;

  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

export async function confirmSupabaseUser(userId: string): Promise<boolean> {
  const admin = createAdminClient();
  if (!admin) return false;

  const { error } = await admin.auth.admin.updateUserById(userId, {
    email_confirm: true,
  });
  return !error;
}

export async function findSupabaseUserIdByEmail(
  email: string
): Promise<string | null> {
  const admin = createAdminClient();
  if (!admin) return null;

  const normalized = email.toLowerCase().trim();
  let page = 1;
  const perPage = 200;

  while (page <= 10) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage });
    if (error || !data.users.length) break;

    const match = data.users.find(
      (u) => u.email?.toLowerCase() === normalized
    );
    if (match) return match.id;

    if (data.users.length < perPage) break;
    page += 1;
  }

  return null;
}

export async function ensureSupabaseLoginAllowed(email: string): Promise<void> {
  const userId = await findSupabaseUserIdByEmail(email);
  if (userId) await confirmSupabaseUser(userId);
}

export async function repairSuperAdminSupabaseAccount(
  email: string,
  password: string
): Promise<string | null> {
  const normalized = email.toLowerCase().trim();
  const admin = createAdminClient();
  if (!admin) return null;

  let userId = await findSupabaseUserIdByEmail(normalized);

  if (!userId) {
    const { data, error } = await admin.auth.admin.createUser({
      email: normalized,
      password,
      email_confirm: true,
    });

    if (error) {
      userId = await findSupabaseUserIdByEmail(normalized);
      if (!userId) return null;
    } else {
      userId = data.user.id;
    }
  }

  await admin.auth.admin.updateUserById(userId, {
    email_confirm: true,
    password,
  });

  return userId;
}
