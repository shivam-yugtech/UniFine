/**
 * UniFine user admin CLI — run from the project folder.
 *
 *   npm run users -- list                                  # every account (passwords are hashed, never shown)
 *   npm run users -- set-password <email> <newPassword>    # reset anyone's password (e.g. a forgotten admin one)
 *   npm run users -- create-admin <email> <password> "<Full Name>"
 *   npm run users -- disable <email>   /   enable <email>
 *
 * Passwords are stored as salted scrypt hashes, so nobody (not even an admin) can read
 * an existing password — reset it instead.
 */
import { PrismaClient } from "@prisma/client";
import { hashPassword } from "../src/lib/password";

const db = new PrismaClient();
const [cmd, ...args] = process.argv.slice(2);

function usage(): never {
  console.log(`Usage:
  npm run users -- list
  npm run users -- set-password <email> <newPassword>
  npm run users -- create-admin <email> <password> "<Full Name>"
  npm run users -- disable <email>
  npm run users -- enable <email>`);
  process.exit(1);
}

async function main() {
  if (cmd === "list") {
    const users = await db.user.findMany({ orderBy: [{ role: "asc" }, { email: "asc" }] });
    console.table(
      users.map((u) => ({ role: u.role, email: u.email, name: u.name, roll: u.rollNumber ?? "", status: u.status })),
    );
    return;
  }
  if (cmd === "set-password") {
    const [email, pw] = args;
    if (!email || !pw) usage();
    if (pw.length < 6) throw new Error("Password must be at least 6 characters.");
    const u = await db.user.update({ where: { email: email.toLowerCase() }, data: { passwordHash: hashPassword(pw) } });
    console.log(`Password updated for ${u.email} (${u.role}).`);
    return;
  }
  if (cmd === "create-admin") {
    const [email, pw, name] = args;
    if (!email || !pw || !name) usage();
    if (pw.length < 6) throw new Error("Password must be at least 6 characters.");
    const u = await db.user.create({
      data: {
        email: email.toLowerCase(),
        passwordHash: hashPassword(pw),
        name,
        role: "ADMIN",
        department: "Administration",
        designation: "Administrator",
      },
    });
    console.log(`Admin created: ${u.email}`);
    return;
  }
  if (cmd === "disable" || cmd === "enable") {
    const [email] = args;
    if (!email) usage();
    const u = await db.user.update({
      where: { email: email.toLowerCase() },
      data: { status: cmd === "disable" ? "INACTIVE" : "ACTIVE" },
    });
    console.log(`${u.email} is now ${u.status}.`);
    return;
  }
  usage();
}

main()
  .catch((e) => {
    console.error(e instanceof Error ? e.message : e);
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
