import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { DefaultsClient } from "@/components/packing/DefaultsClient";

export default async function DefaultsPage() {
  const session = await auth();
  const [items, bags] = await Promise.all([
    db.defaultPackingItem.findMany({
      where: { userId: session!.user.id },
      orderBy: [{ category: "asc" }, { sortOrder: "asc" }],
    }),
    db.bag.findMany({
      where: { userId: session!.user.id },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    }),
  ]);

  return <DefaultsClient items={items} bags={bags} />;
}
