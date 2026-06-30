import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";

const schema = z.object({
  name: z.string().min(1).max(200),
});

export async function POST(req: Request, { params }: { params: Promise<{ listId: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { listId } = await params;
  const source = await db.packingList.findFirst({
    where: { id: listId, userId: session.user.id },
    include: { items: true },
  });

  if (!source) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  const newList = await db.packingList.create({
    data: {
      userId: session.user.id,
      name: parsed.data.name,
      destination: source.destination,
      status: "PLANNING",
      items: {
        create: source.items.map((item) => ({
          name: item.name,
          category: item.category,
          quantity: item.quantity,
          bag: item.bag,
          sortOrder: item.sortOrder,
          // Reset trip-specific fields
          gathered: false,
          packed: false,
          preTripNotes: null,
          postTripNotes: null,
        })),
      },
    },
    include: { items: true },
  });

  return NextResponse.json(newList, { status: 201 });
}
