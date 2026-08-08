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

    const claimed = await db.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: { name, email, passwordHash },
      });

      // Atomic claim: only succeeds if the code is still unused, so two
      // concurrent registrations can't both consume it.
      const result = await tx.inviteCode.updateMany({
        where: { id: invite.id, usedBy: null },
        data: { usedBy: user.id, usedAt: new Date() },
      });

      if (result.count === 0) {
        throw new Error("INVITE_TAKEN");
      }
      return true;
    }).catch((e) => {
      if (e instanceof Error && e.message === "INVITE_TAKEN") return false;
      throw e;
    });

    if (!claimed) {
      return NextResponse.json({ error: "Invalid or already-used invite code." }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Server error." }, { status: 500 });
  }
}
