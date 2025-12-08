#!/usr/bin/env tsx
/**
 * Quarterly Golden Plate Award Script
 * Runs every 90 days to award Golden Plate badges to top-performing restaurants
 */

import { db } from '../server/db';
import { restaurants } from '@shared/schema';
import { eq, sql } from 'drizzle-orm';
import { 
  calculateRestaurantRankingScore,
  awardGoldenPlatesForArea 
} from '../server/awardCalculations';

async function runQuarterlyGoldenPlateAwards() {
  console.log('🏆 Starting quarterly Golden Plate award process...');
  console.log(`Timestamp: ${new Date().toISOString()}`);

  try {
    // Get all active restaurants
    const allRestaurants = await db.query.restaurants.findMany({
      where: (rest, { eq }) => eq(rest.isActive, true),
    });

    console.log(`Found ${allRestaurants.length} active restaurants`);

    // First, update all ranking scores
    console.log('📊 Updating ranking scores for all restaurants...');
    for (let i = 0; i < allRestaurants.length; i++) {
      const restaurant = allRestaurants[i];
      const rankingScore = await calculateRestaurantRankingScore(restaurant.id);
      
      await db
        .update(restaurants)
        .set({ rankingScore })
        .where(eq(restaurants.id, restaurant.id));

      if ((i + 1) % 50 === 0) {
        console.log(`   Updated ${i + 1}/${allRestaurants.length} restaurants...`);
      }
    }

    // Extract unique geographic areas (counties/cities)
    console.log('\n🗺️  Identifying geographic areas...');
    const areasSet = new Set<string>();
    
    for (const restaurant of allRestaurants) {
      // Extract county or city from address
      // Common format: "123 Main St, CityName, State ZIP"
      const addressParts = restaurant.address.split(',');
      if (addressParts.length >= 2) {
        const area = addressParts[addressParts.length - 2].trim(); // City/County before state
        areasSet.add(area);
      }
    }

    const areas = Array.from(areasSet);
    console.log(`Found ${areas.length} unique geographic areas`);

    // Award Golden Plates for each area
    let totalAwardedCount = 0;

    for (const area of areas) {
      console.log(`\n🏅 Processing area: ${area}`);
      const awardedCount = await awardGoldenPlatesForArea(area);
      totalAwardedCount += awardedCount;
      console.log(`   Awarded ${awardedCount} Golden Plates in ${area}`);
      
      // TODO: Send email notifications to restaurant owners
    }

    console.log('\n🎉 Golden Plate award process complete!');
    console.log(`   Total areas processed: ${areas.length}`);
    console.log(`   Total Golden Plates awarded: ${totalAwardedCount}`);
    console.log(`   Timestamp: ${new Date().toISOString()}`);

  } catch (error) {
    console.error('❌ Error in Golden Plate award process:', error);
    process.exit(1);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runQuarterlyGoldenPlateAwards()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

export default runQuarterlyGoldenPlateAwards;
