import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
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

const createSchema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email(),
  password: z.string().min(8).optional(),
  isAdmin: z.boolean().default(false),
});

export async function GET() {
  const check = await requireAdmin();
  if (!check.ok) return NextResponse.json({ error: check.error }, { status: check.status });

  const users = await db.user.findMany({
    select: userSelect,
    orderBy: { email: "asc" },
  });

  return NextResponse.json(users);
}

export async function POST(req: Request) {
  const check = await requireAdmin();
  if (!check.ok) return NextResponse.json({ error: check.error }, { status: check.status });

  const body = await req.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  const { name, email, isAdmin } = parsed.data;

  const existing = await db.user.findUnique({ where: { email } });
  if (existing) return NextResponse.json({ error: "An account with this email already exists." }, { status: 400 });

  const generatedPassword = parsed.data.password ? null : randomUUID().slice(0, 16);
  const passwordHash = await bcrypt.hash(parsed.data.password ?? generatedPassword!, 12);

  const user = await db.user.create({
    data: { name, email, passwordHash, isAdmin },
    select: userSelect,
  });

  return NextResponse.json({ user, generatedPassword }, { status: 201 });
}
