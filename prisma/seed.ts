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
    let password = process.env.ADMIN_PASSWORD;
    if (!password) {
      password = randomUUID().slice(0, 16);
      console.log(`No ADMIN_PASSWORD set — generated one: ${password}`);
      console.log("Save it now; it will not be shown again.");
    }
    const hash = await bcrypt.hash(password, 12);
    admin = await prisma.user.create({
      data: {
        email: adminEmail,
        name: "Admin",
        passwordHash: hash,
        isAdmin: true,
      },
    });
    console.log(`Created admin user: ${adminEmail}`);
  } else if (!admin.isAdmin) {
    admin = await prisma.user.update({ where: { id: admin.id }, data: { isAdmin: true } });
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
