import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";

const importSchema = z.object({
  items: z
    .array(
      z.object({
        name: z.string().min(1).max(200),
        category: z.string().min(1).max(100),
      })
    )
    .min(1)
    .max(1000),
});

export async function POST(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = importSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  const existingCount = await db.defaultPackingItem.count({ where: { userId: session.user.id } });

  const created = await db.defaultPackingItem.createManyAndReturn({
    data: parsed.data.items.map((item, i) => ({
      userId: session.user.id,
      name: item.name,
      category: item.category,
      sortOrder: existingCount + i,
    })),
  });

  return NextResponse.json(created, { status: 201 });
}
