import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import { PackingListDetail } from "@/components/packing/PackingListDetail";

export default async function PackingListPage({ params }: { params: Promise<{ listId: string }> }) {
  const session = await auth();
  const { listId } = await params;

  const list = await db.packingList.findFirst({
    where: { id: listId, userId: session!.user.id },
    include: {
      items: { orderBy: [{ category: "asc" }, { sortOrder: "asc" }] },
      shares: { include: { user: { select: { id: true, name: true, email: true } } } },
    },
  });

  if (!list) notFound();

  return <PackingListDetail list={list} />;
}
