import { storage } from "./server/storage.js";
import bcrypt from "bcryptjs";

async function createAdmin() {
  const email = "info.mealscout@gmail.com";
  const password = "Roundtable4!";
  
  console.log("Creating admin account...");
  
  try {
    // Check if exists
    const existing = await storage.getUserByEmail(email);
    if (existing) {
      console.log(`✅ Admin already exists: ${email}`);
      console.log(`   User type: ${existing.userType}`);
      
      if (existing.userType !== 'admin') {
        console.log('   Promoting to admin...');
        await storage.updateUserType(existing.id, 'admin');
        console.log('   ✅ Promoted to admin');
      }
      
      process.exit(0);
    }
    
    // Create new admin
    const passwordHash = await bcrypt.hash(password, 12);
    
    const result = await storage.upsertUserByAuth('email', {
      email,
      firstName: 'Admin',
      lastName: 'User',
      phone: '+1 (555) 000-0000',
      passwordHash
    });
    
    // Promote to admin
    await storage.updateUserType(result.userId, 'admin');
    
    console.log(`✅ Admin account created: ${email}`);
    console.log(`   Password: ${password}`);
    console.log(`   User ID: ${result.userId}`);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Failed to create admin:', error);
    process.exit(1);
  }
}

createAdmin();
