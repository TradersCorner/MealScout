#!/usr/bin/env tsx
/**
 * Daily Golden Fork Award Script
 * Runs daily to check and award Golden Fork badges to eligible users
 */

import { db } from '../server/db';
import { users } from '@shared/schema';
import { eq } from 'drizzle-orm';
import { 
  checkGoldenForkEligibility, 
  awardGoldenFork,
  calculateUserInfluenceScore 
} from '../server/awardCalculations';
import { sendGoldenForkAwardEmail } from '../server/emailNotifications';

async function runDailyGoldenForkAwards() {
  console.log('🍴 Starting daily Golden Fork award process...');
  console.log(`Timestamp: ${new Date().toISOString()}`);

  try {
    // Get all users who don't have Golden Fork yet
    const eligibleUsers = await db.query.users.findMany({
      where: (user, { eq }) => eq(user.hasGoldenFork, false),
    });

    console.log(`Found ${eligibleUsers.length} users without Golden Fork`);

    let awardedCount = 0;
    let checkedCount = 0;

    for (const user of eligibleUsers) {
      checkedCount++;
      
      // Update influence score
      const influenceScore = await calculateUserInfluenceScore(user.id);
      await db
        .update(users)
        .set({ influenceScore })
        .where(eq(users.id, user.id));

      // Check eligibility
      const eligibility = await checkGoldenForkEligibility(user.id);
      
      if (eligibility.eligible) {
        console.log(`✅ Awarding Golden Fork to user ${user.id} (${user.email})`);
        console.log(`   Stats: ${eligibility.stats.reviewCount} reviews, ${eligibility.stats.recommendationCount} recommendations, ${eligibility.stats.influenceScore} influence score`);
        
        const awarded = await awardGoldenFork(user.id);
        if (awarded) {
          awardedCount++;
          
          // Send email notification
          try {
            await sendGoldenForkAwardEmail(user.id);
            console.log(`   📧 Email notification sent to ${user.email}`);
          } catch (emailError) {
            console.error(`   ⚠️  Failed to send email to ${user.email}:`, emailError);
          }
        }
      } else if (checkedCount % 100 === 0) {
        console.log(`Checked ${checkedCount}/${eligibleUsers.length} users...`);
      }
    }

    console.log('\n🎉 Golden Fork award process complete!');
    console.log(`   Total checked: ${checkedCount}`);
    console.log(`   Total awarded: ${awardedCount}`);
    console.log(`   Timestamp: ${new Date().toISOString()}`);

  } catch (error) {
    console.error('❌ Error in Golden Fork award process:', error);
    process.exit(1);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runDailyGoldenForkAwards()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

export default runDailyGoldenForkAwards;
