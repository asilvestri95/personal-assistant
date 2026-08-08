import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { PackingListsClient } from "@/components/packing/PackingListsClient";

export default async function PackingPage() {
  const session = await auth();
  const lists = await db.packingList.findMany({
    where: { userId: session!.user.id },
    include: { items: { select: { id: true, gathered: true, packed: true } } },
    orderBy: { createdAt: "desc" },
  });

  return <PackingListsClient lists={lists} />;
}
