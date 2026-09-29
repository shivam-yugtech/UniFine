import { randomBytes, scryptSync, createHash, timingSafeEqual } from "crypto";

/**
 * Password hashing — salted scrypt ("s2:<saltHex>:<hashHex>").
 * verifyPassword() also accepts legacy unsalted sha256 hex hashes so
 * pre-existing seeded accounts continue to work across migration.
 */
const KEYLEN = 64;

export function hashPassword(password: string): string {
  const salt = randomBytes(16);
  const derived = scryptSync(password, salt, KEYLEN);
  return `s2:${salt.toString("hex")}:${derived.toString("hex")}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  try {
    if (stored.startsWith("s2:")) {
      const [, saltHex, hashHex] = stored.split(":");
      const derived = scryptSync(password, Buffer.from(saltHex, "hex"), KEYLEN);
      const expected = Buffer.from(hashHex, "hex");
      return derived.length === expected.length && timingSafeEqual(derived, expected);
    }
    // legacy unsalted sha256 (pre-migration demo accounts)
    const legacy = createHash("sha256").update(password).digest("hex");
    return legacy === stored;
  } catch {
    return false;
  }
}
