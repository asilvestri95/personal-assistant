import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";

const createSchema = z.object({
  name: z.string().min(1).max(200),
  category: z.string().min(1).max(100),
  quantity: z.number().int().min(1).default(1),
  bag: z.string().optional().nullable(),
  preTripNotes: z.string().optional().nullable(),
  sortOrder: z.number().int().default(0),
});

async function verifyOwner(listId: string, userId: string) {
  return db.packingList.findFirst({ where: { id: listId, userId } });
}

export async function POST(req: Request, { params }: { params: Promise<{ listId: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { listId } = await params;
  const list = await verifyOwner(listId, session.user.id);
  if (!list) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  const item = await db.packingListItem.create({
    data: { listId, ...parsed.data },
  });

  return NextResponse.json(item, { status: 201 });
}
