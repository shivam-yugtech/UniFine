require("dotenv").config();

const { PrismaClient } = require("@prisma/client");

const db = new PrismaClient({
  datasources: {
    db: { url: process.env.DIRECT_URL }
  }
});

async function main() {
  const users = await db.user.findMany({
    select: {
      email: true,
      name: true,
      role: true,
      status: true
    },
    orderBy: { email: "asc" }
  });

  console.table(users);
}

main()
  .catch(error => console.error(error.message))
  .finally(() => db.$disconnect());
