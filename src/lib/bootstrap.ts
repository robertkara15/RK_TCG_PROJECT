import { hash } from "bcryptjs";
import { count, eq } from "drizzle-orm";

import { db } from "@/lib/db";
import { formatConfig, syncMetadata, users } from "@/lib/db/schema";

export async function seedCatalogConfig() {
  const [formatRow] = await db.select().from(formatConfig).limit(1);
  if (!formatRow) {
    await db.insert(formatConfig).values({ id: 1 });
  }

  const [syncRow] = await db.select().from(syncMetadata).limit(1);
  if (!syncRow) {
    await db.insert(syncMetadata).values({ id: 1 });
  }
}

export async function bootstrapOwnerIfNeeded() {
  await seedCatalogConfig();

  const [userCount] = await db.select({ value: count() }).from(users);
  if (userCount.value > 0) {
    return { bootstrapped: false as const, reason: "users_exist" };
  }

  const email = process.env.OWNER_EMAIL;
  const password = process.env.OWNER_PASSWORD;

  if (!email || !password) {
    return { bootstrapped: false as const, reason: "missing_env" };
  }

  const passwordHash = await hash(password, 12);
  await db.insert(users).values({ email, passwordHash });

  return { bootstrapped: true as const, email };
}

export async function hasUsers() {
  const [userCount] = await db.select({ value: count() }).from(users);
  return userCount.value > 0;
}

export async function findUserByEmail(email: string) {
  const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);
  return user ?? null;
}
