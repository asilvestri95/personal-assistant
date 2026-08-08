import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session) redirect("/login");

  const me = await db.user.findUnique({ where: { id: session.user.id } });
  if (!me?.isAdmin) redirect("/packing");

  return children;
}
