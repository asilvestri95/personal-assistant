import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { DefaultsClient } from "@/components/packing/DefaultsClient";

export default async function DefaultsPage() {
  const session = await auth();
  const items = await db.defaultPackingItem.findMany({
    where: { userId: session!.user.id },
    orderBy: [{ category: "asc" }, { sortOrder: "asc" }],
  });

  return <DefaultsClient items={items} />;
}
