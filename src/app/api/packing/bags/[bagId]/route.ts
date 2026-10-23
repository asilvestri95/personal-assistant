import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";

const updateSchema = z.object({
  name: z.string().trim().min(1).max(100).optional(),
  sortOrder: z.number().int().optional(),
});

async function verifyOwner(bagId: string, userId: string) {
  return db.bag.findFirst({ where: { id: bagId, userId } });
}

export async function PATCH(req: Request, { params }: { params: Promise<{ bagId: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { bagId } = await params;
  const bag = await verifyOwner(bagId, session.user.id);
  if (!bag) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json();
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  if (parsed.data.name && parsed.data.name !== bag.name) {
    const clash = await db.bag.findUnique({
      where: { userId_name: { userId: session.user.id, name: parsed.data.name } },
    });
    if (clash) return NextResponse.json({ error: "A bag with that name already exists" }, { status: 409 });
  }

  const updated = await db.bag.update({
    where: { id: bagId },
    data: parsed.data,
  });

  return NextResponse.json(updated);
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ bagId: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { bagId } = await params;
  const bag = await verifyOwner(bagId, session.user.id);
  if (!bag) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await db.bag.delete({ where: { id: bagId } });
  return NextResponse.json({ success: true });
}
