require("dotenv").config();
const { PrismaClient } = require("@prisma/client");
const { scryptSync, timingSafeEqual, createHash } = require("crypto");

const db = new PrismaClient({
  datasources: { db: { url: process.env.DIRECT_URL } }
});

async function main() {
  const email = "admin@krmu.edu.in";
  const password = process.env.TEST_PASSWORD;

  if (!password) throw new Error("Password was not supplied.");

  const user = await db.user.findUnique({
    where: { email },
    select: { email: true, role: true, status: true, passwordHash: true }
  });

  if (!user) {
    console.log("ADMIN ACCOUNT NOT FOUND");
    return;
  }

  let matches = false;
  const stored = user.passwordHash;

  if (stored.startsWith("s2:")) {
    const [, saltHex, hashHex] = stored.split(":");
    const actual = scryptSync(password, Buffer.from(saltHex, "hex"), 64);
    const expected = Buffer.from(hashHex, "hex");
    matches = actual.length === expected.length &&
      timingSafeEqual(actual, expected);
  } else {
    matches = createHash("sha256").update(password).digest("hex") === stored;
  }

  console.log({
    email: user.email,
    role: user.role,
    status: user.status,
    passwordMatches: matches
  });
}

main()
  .catch(e => console.error(e.message))
  .finally(() => db.$disconnect());
