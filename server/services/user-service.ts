import { db } from "../db";
import { eq } from "drizzle-orm";
import { users, type InsertUser, type User } from "../../shared/schema.js";

export class UserService {
  /**
   * Finds or creates a user based on Keycloak information
   * @param keycloakId The Keycloak user ID
   * @param username The Keycloak username
   * @returns The user record from the application database
   */
  static async findOrCreateUser(keycloakId: string, username: string): Promise<User> {
    // Ensure db is not null
    if (!db) {
      throw new Error("Database connection is not available.");
    }

    // Try to find the user first
    const [existingUser] = await db.select().from(users).where(eq(users.keycloak_id, keycloakId));

    if (existingUser) {
      // Update the last login time
      const [updatedUser] = await db
        .update(users)
        .set({ last_login: new Date() })
        .where(eq(users.id, existingUser.id))
        .returning();

      return updatedUser;
    }

    // Create a new user if one doesn't exist
    const insertData: InsertUser = {
      keycloak_id: keycloakId,
      username,
    };

    const [newUser] = await db
      .insert(users)
      .values(insertData)
      .returning();

    return newUser;
  }

  /**
   * Gets a user by their Keycloak ID
   * @param keycloakId The Keycloak user ID
   * @returns The user record or undefined if not found
   */
  static async getUserByKeycloakId(keycloakId: string): Promise<User | undefined> {
    if (!db) {
      throw new Error("Database connection is not available.");
    }
    const [user] = await db.select().from(users).where(eq(users.keycloak_id, keycloakId));
    return user || undefined;
  }

  /**
   * Updates user preferences
   * @param id The user ID
   * @param preferences The JSON preferences string
   * @returns The updated user record or undefined if user not found
   */
  static async updateUserPreferences(id: number, preferences: string): Promise<User | undefined> {
    if (!db) {
      throw new Error("Database connection is not available.");
    }
    const [user] = await db
      .update(users)
      .set({
        preferences,
        last_login: new Date()
      })
      .where(eq(users.id, id))
      .returning();

    return user || undefined;
  }

  /**
   * Gets all users from the database
   * @returns Array of all user records
   */
  static async getAllUsers(): Promise<User[]> {
    if (!db) {
      throw new Error("Database connection is not available.");
    }
    return await db.select().from(users);
  }
}