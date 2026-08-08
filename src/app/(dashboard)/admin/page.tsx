import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { AdminClient } from "@/components/admin/AdminClient";

export default async function AdminPage() {
  const session = await auth();
  const users = await db.user.findMany({
    select: { id: true, name: true, email: true, isAdmin: true, createdAt: true },
    orderBy: { email: "asc" },
  });

  return <AdminClient users={users} currentUserId={session!.user.id} />;
}
