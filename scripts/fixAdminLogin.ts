import { db } from "../server/db.js";
import { users } from "../shared/schema.js";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";

function requireOneOfEnv(names: string[]): string {
  for (const name of names) {
    const value = process.env[name];
    if (value && value.trim()) return value.trim();
  }
  throw new Error(`Missing required environment variable: ${names.join(" or ")}`);
}

function resolveAdminEmail(): string {
  return requireOneOfEnv(["MEALSCOUT_ADMIN_EMAIL", "ADMIN_EMAIL"]);
}

function resolveAdminPassword(): string {
  return requireOneOfEnv(["MEALSCOUT_ADMIN_PASSWORD", "ADMIN_PASSWORD"]);
}

async function checkAndFixAdmin() {
  const email = resolveAdminEmail();
  const password = resolveAdminPassword();

  console.log(`Checking admin account: ${email}\n`);

  try {
    // Check if admin exists
    const adminUsers = await db
      .select({
        id: users.id,
        email: users.email,
        userType: users.userType,
        firstName: users.firstName,
        lastName: users.lastName,
        hasPassword: users.passwordHash,
        emailVerified: users.emailVerified,
      })
      .from(users)
      .where(eq(users.email, email));

    if (adminUsers.length === 0) {
      console.log("❌ Admin account does not exist!");
      console.log("Creating admin account...\n");

      const passwordHash = await bcrypt.hash(password, 12);

      await db.insert(users).values({
        email,
        userType: "admin",
        firstName: "MealScout",
        lastName: "Admin",
        passwordHash,
        emailVerified: true,
        createdAt: new Date(),
      });

      console.log("✅ Admin account created successfully!");
      console.log(`   Email: ${email}`);
    } else {
      const admin = adminUsers[0];
      console.log("✅ Admin account found:");
      console.log(`   ID: ${admin.id}`);
      console.log(`   Email: ${admin.email}`);
      console.log(`   User Type: ${admin.userType}`);
      console.log(`   Name: ${admin.firstName} ${admin.lastName}`);
      console.log(`   Has Password: ${admin.hasPassword ? "Yes" : "No"}`);
      console.log(`   Email Verified: ${admin.emailVerified}\n`);

      // Update password if missing or if explicitly requested
      if (!admin.hasPassword) {
        console.log("⚠️  No password hash found. Setting password...\n");
      } else {
        console.log("🔄 Resetting password...\n");
      }

      const passwordHash = await bcrypt.hash(password, 12);

      await db
        .update(users)
        .set({
          passwordHash,
          emailVerified: true,
          userType: "admin", // Ensure admin role
        })
        .where(eq(users.id, admin.id));

      console.log("✅ Password updated successfully!");
      console.log(`   Email: ${email}`);
    }

    console.log("\n✅ Admin login should now work at /admin-login");
  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  }

  process.exit(0);
}

checkAndFixAdmin();
