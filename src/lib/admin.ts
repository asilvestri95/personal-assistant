import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

type AdminCheck =
  | { ok: false; status: 401 | 403; error: string }
  | { ok: true; userId: string };

export async function requireAdmin(): Promise<AdminCheck> {
  const session = await auth();
  if (!session) return { ok: false, status: 401, error: "Unauthorized" };

  const me = await db.user.findUnique({ where: { id: session.user.id } });
  if (!me?.isAdmin) return { ok: false, status: 403, error: "Admin access required." };

  return { ok: true, userId: session.user.id };
}
