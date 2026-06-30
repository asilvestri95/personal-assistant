import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";
import { generateToken } from "@/lib/utils";

const schema = z.object({
  shareType: z.enum(["PUBLIC", "INVITE_ONLY"]).nullable(),
  // For INVITE_ONLY: array of user emails to add
  inviteEmails: z.array(z.string().email()).optional(),
});

export async function POST(req: Request, { params }: { params: Promise<{ listId: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { listId } = await params;
  const list = await db.packingList.findFirst({ where: { id: listId, userId: session.user.id } });
  if (!list) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  const { shareType, inviteEmails } = parsed.data;

  if (shareType === null) {
    // Disable sharing
    const updated = await db.packingList.update({
      where: { id: listId },
      data: { shareType: null, shareToken: null },
    });
    await db.packingListShare.deleteMany({ where: { listId } });
    return NextResponse.json(updated);
  }

  const shareToken = list.shareToken || generateToken();
  const updated = await db.packingList.update({
    where: { id: listId },
    data: { shareType, shareToken },
  });

  if (shareType === "INVITE_ONLY" && inviteEmails?.length) {
    const users = await db.user.findMany({
      where: { email: { in: inviteEmails } },
    });
    for (const user of users) {
      if (user.id === session.user.id) continue;
      await db.packingListShare.upsert({
        where: { listId_userId: { listId, userId: user.id } },
        update: {},
        create: { listId, userId: user.id },
      });
    }
  }

  return NextResponse.json({ ...updated, shareUrl: `${process.env.NEXT_PUBLIC_APP_URL}/share/${shareToken}` });
}
