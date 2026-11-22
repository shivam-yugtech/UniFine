# UniFine
Universities often manage student fines through manual or fragmented processes, making it difficult to ensure accuracy, transparency, and easy tracking. The proposed UniFine system will provide a centralized web-based platform where faculty can verify students and assign fines based on predefined university offences and fixed amounts

## Running locally

```bash
npm install         # also generates the Prisma client
npm run dev         # applies any pending DB migrations automatically, then starts on http://localhost:3000
```

Set `AUTH_SECRET` (any random string, 16+ characters) in `.env` before deploying.
Without it a random secret is generated per server start, so everyone is signed out on restart.

## Where things are

| What | Where |
| --- | --- |
| Backend (API) | `src/app/api/**/route.ts` — Next.js API routes (login, signup, fines, notifications, reports…) |
| Auth / sessions | `src/lib/auth.ts` (signed tokens), `src/lib/password.ts` (scrypt hashing) |
| Database | SQLite file `prisma/custom.db`, schema in `prisma/schema.prisma` |
| Frontend | `src/components/unifine/*` |
| `fine-management-backend/` | an older, separate Flask prototype — **not used** by this app |

## Email rules (sign-up)

* Students: `<10-digit roll number>@krmu.edu.in` — filled in automatically from the roll number.
  Students can sign in with that email **or just the roll number**.
* Faculty: `<name>@krmangalam.edu.in` (e.g. `rajesh.kumar@krmangalam.edu.in`).
* Admins can't self-register — create them with the users script below.

## Managing users / passwords

Passwords are stored as salted hashes, so nobody can read them — not even an admin. Reset instead:

```bash
npm run users -- list                                        # all accounts (no passwords)
npm run users -- set-password admin@krmu.edu.in NewPass@123  # reset any password
npm run users -- create-admin someone@krmu.edu.in Pass@1234 "Full Name"
npm run users -- disable <email>   # / enable <email>
```

`npm run db:seed` **wipes the database** and loads demo data
(admin@krmu.edu.in / Admin@123, rajesh.choudhary@krmangalam.edu.in / Faculty@123, 2201560042@krmu.edu.in / Student@123).
