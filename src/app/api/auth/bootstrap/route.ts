import { hash } from "bcryptjs";
import { count } from "drizzle-orm";
import { NextResponse } from "next/server";

import { hasUsers, seedCatalogConfig } from "@/lib/bootstrap";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";

export async function POST(request: Request) {
  const [userCount] = await db.select({ value: count() }).from(users);
  if (userCount.value > 0) {
    return NextResponse.json({ error: "Users already exist" }, { status: 403 });
  }

  let email = process.env.OWNER_EMAIL;
  let password = process.env.OWNER_PASSWORD;

  try {
    const body = (await request.json()) as { email?: string; password?: string };
    email = body.email ?? email;
    password = body.password ?? password;
  } catch {
    // Body is optional when env vars are set.
  }

  if (!email || !password) {
    return NextResponse.json(
      { error: "Email and password are required" },
      { status: 400 },
    );
  }

  await seedCatalogConfig();

  const passwordHash = await hash(password, 12);
  await db.insert(users).values({ email, passwordHash });

  return NextResponse.json({ ok: true, email });
}

export async function GET() {
  const ownerExists = await hasUsers();

  return NextResponse.json({ ownerExists });
}
