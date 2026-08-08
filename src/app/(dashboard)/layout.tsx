import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { Sidebar } from "@/components/layout/Sidebar";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session) redirect("/login");

  const me = await db.user.findUnique({ where: { id: session.user.id }, select: { isAdmin: true } });

  return (
    <div className="flex h-screen overflow-hidden bg-bg">
      <Sidebar user={session.user} isAdmin={me?.isAdmin ?? false} />
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  );
}
