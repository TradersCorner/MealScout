/**
 * PHASE 6: Empty County Experience Service
 * 
 * When a county has 0 restaurants:
 * 1. Show acknowledgement message
 * 2. Show "Be an early backer" reframe
 * 3. Show "Submit favorite" form
 * 4. Show affiliate link CTA
 */

import { db } from './db';
import { restaurants } from '@shared/schema';
import { eq, ilike } from 'drizzle-orm';

/**
 * Check if a county is empty (has no restaurants)
 */
export async function isCountyEmpty(county: string, state: string): Promise<boolean> {
  try {
    const result = await db.query.restaurants.findFirst({
      where: (table) => eq(table.county, county),
    });

    return !result;
  } catch (error) {
    console.error('[emptyCountyService] Error checking if county is empty:', error);
    return true; // Assume empty if we can't check
  }
}

/**
 * Get empty county experience data
 * 
 * Returns messaging and CTAs for empty counties
 */
export async function getEmptyCountyExperience(county: string, state: string) {
  try {
    const isEmpty = await isCountyEmpty(county, state);

    if (!isEmpty) {
      return {
        isEmpty: false,
        message: null,
      };
    }

    // County is empty - return full experience data
    return {
      isEmpty: true,
      county,
      state,
      experience: {
        step1: {
          title: 'No Partners Yet',
          message: `${county} County, ${state} doesn't have any partner restaurants on MealScout yet.`,
          icon: 'alert',
        },
        step2: {
          title: 'Be an Early Backer',
          message: `You're early. Help grow the platform and earn money when restaurants sign up.`,
          icon: 'heart',
        },
        step3: {
          title: 'Know a Great Spot?',
          message: `Tell us about your favorite restaurant. We'll reach out to them.`,
          cta: 'Submit Restaurant',
          icon: 'mappin',
        },
        step4: {
          title: 'Earn & Give Back',
          message: `When restaurants join MealScout, you earn credits that can be spent locally or cashed out.`,
          icon: 'gift',
        },
      },
      userCanEarn: true, // User can share referral link and earn
    };
  } catch (error) {
    console.error('[emptyCountyService] Error getting empty county experience:', error);
    throw error;
  }
}

/**
 * Get nearby counties with restaurants (fallback content)
 * 
 * Returns restaurants from neighboring counties
 */
export async function getNearbyCountyFallback(county: string, state: string) {
  try {
    // For MVP, just get any restaurants from the same state as fallback
    const nearbyRestaurants = await db.query.restaurants.findMany({
      where: eq(restaurants.state, state),
      limit: 10,
    });

    return {
      fallbackType: 'state_wide',
      message: `Showing restaurants from across ${state}`,
      restaurants: nearbyRestaurants,
    };
  } catch (error) {
    console.error('[emptyCountyService] Error getting nearby fallback:', error);
    throw error;
  }
}

export default {
  isCountyEmpty,
  getEmptyCountyExperience,
  getNearbyCountyFallback,
};
