import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/admin";
import { z } from "zod";

const userSelect = {
  id: true,
  name: true,
  email: true,
  isAdmin: true,
  createdAt: true,
} as const;

const updateSchema = z.object({
  isAdmin: z.boolean(),
});

export async function PATCH(req: Request, { params }: { params: Promise<{ userId: string }> }) {
  const check = await requireAdmin();
  if (!check.ok) return NextResponse.json({ error: check.error }, { status: check.status });

  const { userId } = await params;
  const body = await req.json();
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  if (userId === check.userId && !parsed.data.isAdmin) {
    return NextResponse.json({ error: "You can't remove your own admin access." }, { status: 400 });
  }

  const target = await db.user.findUnique({ where: { id: userId } });
  if (!target) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const updated = await db.user.update({
    where: { id: userId },
    data: { isAdmin: parsed.data.isAdmin },
    select: userSelect,
  });

  return NextResponse.json(updated);
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ userId: string }> }) {
  const check = await requireAdmin();
  if (!check.ok) return NextResponse.json({ error: check.error }, { status: check.status });

  const { userId } = await params;

  if (userId === check.userId) {
    return NextResponse.json({ error: "You can't delete your own account." }, { status: 400 });
  }

  const target = await db.user.findUnique({ where: { id: userId } });
  if (!target) return NextResponse.json({ error: "Not found" }, { status: 404 });

  try {
    await db.user.delete({ where: { id: userId } });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2003") {
      return NextResponse.json(
        { error: "Can't delete this user because they created invite codes still referenced by other data." },
        { status: 400 }
      );
    }
    throw e;
  }

  return NextResponse.json({ success: true });
}
