import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/admin";

export async function POST(_req: Request, { params }: { params: Promise<{ userId: string }> }) {
  const check = await requireAdmin();
  if (!check.ok) return NextResponse.json({ error: check.error }, { status: check.status });

  const { userId } = await params;
  const target = await db.user.findUnique({ where: { id: userId } });
  if (!target) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const password = randomUUID().slice(0, 16);
  const passwordHash = await bcrypt.hash(password, 12);

  await db.user.update({ where: { id: userId }, data: { passwordHash } });

  return NextResponse.json({ password });
}
