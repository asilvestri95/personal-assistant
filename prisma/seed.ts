import { PrismaClient } from "@prisma/client";
import { randomUUID } from "crypto";

const prisma = new PrismaClient();

async function main() {
  // Create initial invite codes
  const codes = ["WELCOME-2024", "PACK-IT-UP", "ASSISTANT-01"];

  // We need a system user or just create standalone invite codes with a placeholder
  // For seeding we'll create an admin user first
  const adminEmail = process.env.ADMIN_EMAIL || "admin@example.com";

  let admin = await prisma.user.findUnique({ where: { email: adminEmail } });
  if (!admin) {
    const bcrypt = await import("bcryptjs");
    const hash = await bcrypt.hash(process.env.ADMIN_PASSWORD || "changeme123", 12);
    admin = await prisma.user.create({
      data: {
        email: adminEmail,
        name: "Admin",
        passwordHash: hash,
      },
    });
    console.log(`Created admin user: ${adminEmail}`);
  }

  for (const code of codes) {
    await prisma.inviteCode.upsert({
      where: { code },
      update: {},
      create: {
        code,
        createdBy: admin.id,
        expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      },
    });
  }

  console.log(`Seeded ${codes.length} invite codes:`, codes);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
