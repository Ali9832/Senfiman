import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const email = (process.env.ADMIN_EMAIL ?? "admin@local.test").toLowerCase();
  const password = process.env.ADMIN_PASSWORD ?? "ChangeMe123!";
  if (process.env.NODE_ENV === "production" && !process.env.ADMIN_PASSWORD) {
    throw new Error("Set ADMIN_PASSWORD before seeding production.");
  }
  const passwordHash = await bcrypt.hash(password, 12);
  const admin = await prisma.user.upsert({
    where: { email },
    update: { passwordHash },
    create: {
      email,
      passwordHash,
      profile: { create: { firstName: "System", lastName: "Administrator", studentCode: "admin" } },
    },
  });
  await prisma.userRole.upsert({
    where: { userId_role: { userId: admin.id, role: "admin" } },
    update: {},
    create: { userId: admin.id, role: "admin" },
  });
  console.log(`Admin account ready: ${email}`);
}

main()
  .finally(() => prisma.$disconnect());
