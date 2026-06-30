import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";

const updateSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  category: z.string().min(1).max(100).optional(),
  quantity: z.number().int().min(1).optional(),
  bag: z.string().optional().nullable(),
  gathered: z.boolean().optional(),
  packed: z.boolean().optional(),
  preTripNotes: z.string().optional().nullable(),
  postTripNotes: z.string().optional().nullable(),
  sortOrder: z.number().int().optional(),
});

async function verifyOwner(listId: string, itemId: string, userId: string) {
  return db.packingListItem.findFirst({
    where: { id: itemId, listId, list: { userId } },
  });
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ listId: string; itemId: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { listId, itemId } = await params;
  const item = await verifyOwner(listId, itemId, session.user.id);
  if (!item) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json();
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  const updated = await db.packingListItem.update({
    where: { id: itemId },
    data: parsed.data,
  });

  return NextResponse.json(updated);
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ listId: string; itemId: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { listId, itemId } = await params;
  const item = await verifyOwner(listId, itemId, session.user.id);
  if (!item) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await db.packingListItem.delete({ where: { id: itemId } });
  return NextResponse.json({ success: true });
}
