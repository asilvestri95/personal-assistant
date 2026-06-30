import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";

const createSchema = z.object({
  code: z.string().min(4).max(50).toUpperCase(),
  expiresInDays: z.number().int().min(1).max(365).optional(),
});

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const codes = await db.inviteCode.findMany({
    where: { createdBy: session.user.id },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(codes);
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  const { code, expiresInDays } = parsed.data;

  const existing = await db.inviteCode.findUnique({ where: { code } });
  if (existing) return NextResponse.json({ error: "Code already exists." }, { status: 400 });

  const invite = await db.inviteCode.create({
    data: {
      code,
      createdBy: session.user.id,
      expiresAt: expiresInDays
        ? new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000)
        : null,
    },
  });

  return NextResponse.json(invite, { status: 201 });
}
