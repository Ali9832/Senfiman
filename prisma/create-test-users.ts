import "dotenv/config";
import bcrypt from "bcryptjs";
import { AppRole, PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const password = "Test12345!";

const users: Array<[string, string, string, string, AppRole]> = [
  ["student@test.local", "دانشجوی تست", "دانشجو", "test-student", AppRole.student],
  ["warden@test.local", "سرپرست تست", "خوابگاه", "test-warden", AppRole.warden],
  ["services@test.local", "مجری تست", "خدمات", "test-services", AppRole.services],
  ["warehouse@test.local", "انباردار تست", "انبار", "test-warehouse", AppRole.warehouse],
  ["secretary@test.local", "دبیر تست", "شورا", "test-secretary", AppRole.council_secretary],
  ["council@test.local", "عضو تست", "شورا", "test-council", AppRole.council_member],
  ["central@test.local", "شورای مرکزی تست", "شورا", "test-central", AppRole.central_council],
  ["admin-test@test.local", "ادمین تست", "سیستم", "test-admin", AppRole.admin],
];

async function main() {
  const passwordHash = await bcrypt.hash(password, 12);
  try {
    for (const [email, firstName, lastName, studentCode, role] of users) {
      const user = await prisma.user.upsert({
      where: { email },
      update: {
        passwordHash,
        profile: {
          upsert: {
            update: { firstName, lastName, studentCode },
            create: { firstName, lastName, studentCode },
          },
        },
      },
      create: {
        email,
        passwordHash,
        profile: { create: { firstName, lastName, studentCode } },
      },
      });

      await prisma.userRole.upsert({
        where: { userId_role: { userId: user.id, role } },
        update: {},
        create: { userId: user.id, role },
      });
      console.log(`created: ${email} (${role})`);
    }
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
