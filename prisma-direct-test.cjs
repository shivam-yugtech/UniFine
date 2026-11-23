require("dotenv").config();

const { PrismaClient } = require("@prisma/client");

const db = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DIRECT_URL
    }
  }
});

async function test() {
  try {
    const result = await db.$queryRaw`SELECT NOW()`;
    console.log("PRISMA DIRECT SUCCESS:", result);
  } catch (error) {
    console.log("PRISMA DIRECT FAILED:", error.message);
  } finally {
    await db.$disconnect();
  }
}

test();
