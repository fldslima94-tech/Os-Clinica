import { getDb } from './index.ts';
import { users } from './schema.ts';
import { eq } from 'drizzle-orm';

export async function getOrCreateUser(uid: string, email: string, nome?: string) {
  try {
    const db = getDb();
    const result = await db.insert(users)
      .values({
        uid,
        email,
        nome: nome || 'Usuário',
      })
      .onConflictDoUpdate({
        target: users.uid,
        set: {
          email,
          ...(nome ? { nome } : {}),
        },
      })
      .returning();

    return result[0];
  } catch (error) {
    console.error("Database user operation failed:", error);
    throw new Error("Failed to get or create user record.", { cause: error });
  }
}

export async function getUsers() {
  try {
    const db = getDb();
    return await db.select().from(users);
  } catch (error) {
    console.error("Database query failed:", error);
    throw new Error("Database query failed. Please try again later.", { cause: error });
  }
}

