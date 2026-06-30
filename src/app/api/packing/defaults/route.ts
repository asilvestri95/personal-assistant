import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";

const createSchema = z.object({
  name: z.string().min(1).max(200),
  category: z.string().min(1).max(100),
  sortOrder: z.number().int().default(0),
});

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const items = await db.defaultPackingItem.findMany({
    where: { userId: session.user.id },
    orderBy: [{ category: "asc" }, { sortOrder: "asc" }],
  });

  return NextResponse.json(items);
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  const item = await db.defaultPackingItem.create({
    data: { userId: session.user.id, ...parsed.data },
  });

  return NextResponse.json(item, { status: 201 });
}
