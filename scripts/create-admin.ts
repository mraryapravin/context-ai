
import "dotenv/config";
import bcrypt from "bcryptjs";
import { prisma } from "../lib/prisma";

async function main() {
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;

  if (!email || !password) {
    throw new Error("ADMIN_EMAIL and ADMIN_PASSWORD are required.");
  }

  if (password.length < 12) {
    throw new Error("Admin password must be at least 12 characters.");
  }

  const passwordHash = await bcrypt.hash(password, 12);

  await prisma.staffUser.upsert({
    where: {
      email: email.trim().toLowerCase(),
    },
    update: {
      passwordHash,
      name: "Admin",
      role: "ADMIN",
    },
    create: {
      email: email.trim().toLowerCase(),
      passwordHash,
      name: "Admin",
      role: "ADMIN",
    },
  });

  console.log("Admin account created successfully.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
