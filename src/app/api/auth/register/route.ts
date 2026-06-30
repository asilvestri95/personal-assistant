import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { z } from "zod";

const schema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email(),
  password: z.string().min(8),
  inviteCode: z.string().min(1),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid input." }, { status: 400 });
    }

    const { name, email, password, inviteCode } = parsed.data;

    const invite = await db.inviteCode.findUnique({ where: { code: inviteCode.toUpperCase() } });
    if (!invite || invite.usedBy) {
      return NextResponse.json({ error: "Invalid or already-used invite code." }, { status: 400 });
    }
    if (invite.expiresAt && invite.expiresAt < new Date()) {
      return NextResponse.json({ error: "Invite code has expired." }, { status: 400 });
    }

    const existing = await db.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({ error: "An account with this email already exists." }, { status: 400 });
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const user = await db.user.create({
      data: { name, email, passwordHash },
    });

    await db.inviteCode.update({
      where: { id: invite.id },
      data: { usedBy: user.id, usedAt: new Date() },
    });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Server error." }, { status: 500 });
  }
}
