#!/usr/bin/env node

/**
 * Helper: encode your Supabase database password for DATABASE_URL.
 * Usage: node scripts/encode-db-password.mjs "MyP@ss#word"
 */

const password = process.argv[2];

if (!password) {
  console.log(`Usage: node scripts/encode-db-password.mjs "your-database-password"

Then paste the encoded password into your DATABASE_URL:

postgresql://postgres.mpuboebxkugbobspodwd:ENCODED@aws-0-REGION.pooler.supabase.com:5432/postgres
`);
  process.exit(1);
}

console.log("\nEncoded password:\n");
console.log(encodeURIComponent(password));
console.log("\nExample DATABASE_URL:\n");
console.log(
  `postgresql://postgres.mpuboebxkugbobspodwd:${encodeURIComponent(password)}@aws-0-REGION.pooler.supabase.com:5432/postgres`,
);
console.log("");
