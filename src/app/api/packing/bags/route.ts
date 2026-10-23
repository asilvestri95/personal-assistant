import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";

const createSchema = z.object({
  name: z.string().trim().min(1).max(100),
  sortOrder: z.number().int().default(0),
});

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const bags = await db.bag.findMany({
    where: { userId: session.user.id },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
  });

  return NextResponse.json(bags);
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  const existing = await db.bag.findUnique({
    where: { userId_name: { userId: session.user.id, name: parsed.data.name } },
  });
  if (existing) return NextResponse.json({ error: "A bag with that name already exists" }, { status: 409 });

  const bag = await db.bag.create({
    data: { userId: session.user.id, ...parsed.data },
  });

  return NextResponse.json(bag, { status: 201 });
}
