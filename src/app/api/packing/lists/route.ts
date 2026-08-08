import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";

const createSchema = z.object({
  name: z.string().min(1).max(200),
  destination: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  fromDefaults: z.boolean().optional(),
});

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const lists = await db.packingList.findMany({
    where: { userId: session.user.id },
    include: { items: { select: { id: true, gathered: true, packed: true } } },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(lists);
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  const { name, destination, startDate, endDate, fromDefaults } = parsed.data;

  // Fetch defaults if requested
  let defaultItems: { name: string; category: string; sortOrder: number }[] = [];
  if (fromDefaults) {
    defaultItems = await db.defaultPackingItem.findMany({
      where: { userId: session.user.id },
      orderBy: [{ category: "asc" }, { sortOrder: "asc" }],
    });
  }

  const list = await db.packingList.create({
    data: {
      userId: session.user.id,
      name,
      destination: destination || null,
      startDate: startDate ? new Date(startDate) : null,
      endDate: endDate ? new Date(endDate) : null,
      items: defaultItems.length > 0
        ? { create: defaultItems.map((d) => ({ name: d.name, category: d.category, sortOrder: d.sortOrder })) }
        : undefined,
    },
    include: { items: true },
  });

  return NextResponse.json(list, { status: 201 });
}
