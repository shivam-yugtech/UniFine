# UniFine
Universities often manage student fines through manual or fragmented processes, making it difficult to ensure accuracy, transparency, and easy tracking. The proposed UniFine system will provide a centralized web-based platform where faculty can verify students and assign fines based on predefined university offences and fixed amounts

## Running locally

```bash
npm install
npm run db:deploy   # applies Prisma migrations (adds the NotificationRead table)
npm run db:seed     # optional: wipes prisma/custom.db and loads demo data (admin@krmu.ac.in / Admin@123 etc.)
npm run dev
```

Set `AUTH_SECRET` (any random string, 16+ characters) in `.env` before deploying.
Sessions are HMAC-signed tokens; without `AUTH_SECRET` a random secret is generated per
server start, so everyone is signed out whenever the server restarts.
