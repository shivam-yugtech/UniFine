require("dotenv").config();

const { PrismaClient } = require("@prisma/client");
const db = new PrismaClient();

async function test() {
  try {
    const result = await db.$queryRaw`SELECT NOW()`;
    console.log("PRISMA CONNECTION SUCCESS:", result);
  } catch (error) {
    console.log("PRISMA CONNECTION FAILED:", error.message);
  } finally {
    await db.$disconnect();
  }
}

test();
