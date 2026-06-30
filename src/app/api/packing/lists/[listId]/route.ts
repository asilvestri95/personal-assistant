import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";

const updateSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  destination: z.string().optional().nullable(),
  startDate: z.string().optional().nullable(),
  endDate: z.string().optional().nullable(),
  status: z.enum(["PLANNING", "PACKING", "TRAVELING", "COMPLETED"]).optional(),
});

async function getListForUser(listId: string, userId: string) {
  return db.packingList.findFirst({ where: { id: listId, userId } });
}

export async function GET(_req: Request, { params }: { params: Promise<{ listId: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { listId } = await params;
  const list = await db.packingList.findFirst({
    where: { id: listId, userId: session.user.id },
    include: {
      items: { orderBy: [{ category: "asc" }, { sortOrder: "asc" }] },
      shares: { include: { user: { select: { id: true, name: true, email: true } } } },
    },
  });

  if (!list) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(list);
}

export async function PATCH(req: Request, { params }: { params: Promise<{ listId: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { listId } = await params;
  const list = await getListForUser(listId, session.user.id);
  if (!list) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json();
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  const { startDate, endDate, ...rest } = parsed.data;
  const updated = await db.packingList.update({
    where: { id: listId },
    data: {
      ...rest,
      startDate: startDate !== undefined ? (startDate ? new Date(startDate) : null) : undefined,
      endDate: endDate !== undefined ? (endDate ? new Date(endDate) : null) : undefined,
    },
  });

  return NextResponse.json(updated);
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ listId: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { listId } = await params;
  const list = await getListForUser(listId, session.user.id);
  if (!list) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await db.packingList.delete({ where: { id: listId } });
  return NextResponse.json({ success: true });
}
