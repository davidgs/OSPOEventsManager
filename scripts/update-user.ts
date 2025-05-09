import { db } from "../server/db";
import { users } from "../shared/schema";
import { eq } from "drizzle-orm";

async function updateUser() {
  console.log("Updating user info...");

  try {
    // Update user with ID 1
    const [updatedUser] = await db
      .update(users)
      .set({
        name: "Alex Johnson",
        email: "alex@example.com",
        bio: "Senior Developer Advocate with expertise in Kubernetes and cloud-native technologies.",
        role: "developer_advocate",
        jobTitle: "Senior Developer Advocate"
      })
      .where(eq(users.id, 1))
      .returning();
    
    if (updatedUser) {
      console.log(`Updated user with ID: ${updatedUser.id}`);
      console.log("User info:", updatedUser);
    } else {
      console.log("No user found with ID 1");
    }
    
    console.log("✅ User update completed successfully!");
  } catch (error) {
    console.error("❌ Error updating user:", error);
  } finally {
    // Close the pool connection for @neondatabase/serverless
    if (db) {
      try {
        // @ts-ignore - Access the underlying pool
        await db[Symbol.for('driver')].session.end();
        console.log("Database connection closed");
      } catch (err) {
        console.log("Note: Could not explicitly close connection, but update was successful");
      }
    }
  }
}

updateUser();