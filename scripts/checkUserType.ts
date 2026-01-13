import "dotenv/config";
import { db } from "../server/db";
import { users } from "@shared/schema";
import { eq } from "drizzle-orm";

async function checkUserType() {
  const adminEmail = "info.mealscout@gmail.com";
  
  console.log(`🔍 Checking user type for: ${adminEmail}`);
  
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.email, adminEmail))
    .limit(1);

  if (!user) {
    console.log("❌ User not found");
    return;
  }

  console.log("✅ User found:");
  console.log(`   ID: ${user.id}`);
  console.log(`   Email: ${user.email}`);
  console.log(`   Name: ${user.firstName} ${user.lastName}`);
  console.log(`   User Type: ${user.userType}`);
  console.log(`   Has Password: ${!!user.passwordHash}`);
  console.log(`   Created: ${user.createdAt}`);
}

checkUserType()
  .then(() => {
    console.log("\n✅ Check complete");
    process.exit(0);
  })
  .catch((err) => {
    console.error("❌ Error:", err);
    process.exit(1);
  });
