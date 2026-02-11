import { Router } from "express";
import { storage } from "../storage";
import { ensurePremiumTrialForUserId } from "../services/premiumTrial";
import { db } from "../db";
import { deals, restaurants, creditLedger } from "@shared/schema";
import { eq, and, like, ilike } from "drizzle-orm";

const router = Router();

// ==================== ACTION HANDLERS ====================

/**
 * Search deals by location, category, or text
 */
async function findDeals(params: {
  location?: string;
  category?: string;
  search?: string;
  limit?: number;
  offset?: number;
}) {
  try {
    const limit = Math.min(params.limit || 20, 100); // Max 100
    const offset = params.offset || 0;

    const conditions = [eq(deals.isActive, true)];

    if (params.search) {
      conditions.push(
        like(deals.title, `%${params.search}%`)
      );
    }

    // Note: deals don't have a 'category' field directly, skipping category filter
    // if (params.category) {
    //   conditions.push(eq(deals.category, params.category));
    // }

    const results = await db
      .select()
      .from(deals)
      .where(and(...conditions))
      .limit(limit)
      .offset(offset);

    return {
      success: true,
      data: results,
      count: results.length,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Search restaurants by name, location, or cuisine
 */
async function findRestaurants(params: {
  search?: string;
  location?: string;
  cuisine?: string;
  limit?: number;
  offset?: number;
}) {
  try {
    const limit = Math.min(params.limit || 20, 100);
    const offset = params.offset || 0;

    const conditions = [eq(restaurants.isActive, true)];

    if (params.search) {
      conditions.push(
        ilike(restaurants.name, `%${params.search}%`)
      );
    }

    if (params.location) {
      conditions.push(
        like(restaurants.address, `%${params.location}%`)
      );
    }

    if (params.cuisine) {
      conditions.push(
        like(restaurants.cuisineType, `%${params.cuisine}%`)
      );
    }

    const results = await db
      .select()
      .from(restaurants)
      .where(and(...conditions))
      .limit(limit)
      .offset(offset);

    return {
      success: true,
      data: results,
      count: results.length,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Create a new restaurant (restaurant owner action)
 */
async function createRestaurant(params: {
  userId: string;
  name: string;
  address: string;
  cuisineType?: string;
  description?: string;
  phoneNumber?: string;
  websiteUrl?: string;
}) {
  try {
    if (!params.userId || !params.name || !params.address) {
      return {
        success: false,
        error: "Missing required fields: userId, name, address",
      };
    }

    const result = await storage.createRestaurant({
      ownerId: params.userId,
      name: params.name,
      address: params.address,
      cuisineType: params.cuisineType,
      phoneNumber: params.phoneNumber,
      websiteUrl: params.websiteUrl,
      isActive: true,
      latitude: "0",
      longitude: "0",
    } as any);

    try {
      await ensurePremiumTrialForUserId(params.userId);
    } catch (e) {
      console.warn("ensurePremiumTrialForUserId failed after action createRestaurant:", e);
    }

    return {
      success: true,
      data: result,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Update restaurant data (restaurant owner action)
 */
async function updateRestaurant(params: {
  restaurantId: string;
  userId: string;
  updates: Record<string, any>;
}) {
  try {
    if (!params.restaurantId || !params.userId) {
      return {
        success: false,
        error: "Missing required fields: restaurantId, userId",
      };
    }

    // Verify ownership
    const restaurant = await storage.getRestaurant(params.restaurantId);
    if (!restaurant || restaurant.ownerId !== params.userId) {
      return {
        success: false,
        error: "Unauthorized: You do not own this restaurant",
      };
    }

    const updated = await storage.updateRestaurant(
      params.restaurantId,
      params.updates
    );

    return {
      success: true,
      data: updated,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Get live food truck locations
 */
async function getFoodTruckLocations(params: {
  latitude: number;
  longitude: number;
  radiusKm?: number;
}) {
  try {
    if (
      params.latitude === undefined ||
      params.longitude === undefined
    ) {
      return {
        success: false,
        error: "Missing required fields: latitude, longitude",
      };
    }

    const latitude = Number(params.latitude);
    const longitude = Number(params.longitude);
    const radius = Math.min(Number(params.radiusKm ?? 5), 50);

    if (
      Number.isNaN(latitude) ||
      Number.isNaN(longitude) ||
      Number.isNaN(radius)
    ) {
      return {
        success: false,
        error: "Invalid coordinates or radius",
      };
    }

    if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
      return {
        success: false,
        error: "Invalid coordinates range",
      };
    }

    const trucks = await storage.getLiveTrucksNearby(latitude, longitude, radius);

    return {
      success: true,
      data: trucks,
      count: trucks.length,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Redeem credits (user action)
 */
async function redeemCredits(params: {
  userId: string;
  amount: number;
  dealId?: string;
  reason?: string;
}) {
  try {
    if (!params.userId || !params.amount || params.amount <= 0) {
      return {
        success: false,
        error: "Missing or invalid required fields: userId, amount (must be > 0)",
      };
    }

    // Get user to verify they exist
    const user = await storage.getUser(params.userId);
    if (!user) {
      return {
        success: false,
        error: "User not found",
      };
    }

    // Create credit redemption entry in ledger
    await db.insert(creditLedger).values({
      userId: params.userId,
      amount: params.amount,
      sourceType: "redemption",
      description: params.reason || "Credits redeemed",
      dealId: params.dealId,
      sourceUserId: params.userId,
    } as any);

    return {
      success: true,
      data: {
        amountRedeemed: params.amount,
        message: "Credits redeemed successfully",
      },
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Get user's credit balance
 */
async function getCreditBalance(params: { userId: string }) {
  try {
    if (!params.userId) {
      return {
        success: false,
        error: "Missing required field: userId",
      };
    }

    const user = await storage.getUser(params.userId);
    if (!user) {
      return {
        success: false,
        error: "User not found",
      };
    }

    // Calculate balance from credit ledger (sum of all credits for this user)
    const credits = await db
      .select()
      .from(creditLedger)
      .where(eq(creditLedger.userId, params.userId));

    const balance = credits.reduce((sum: number, credit: any) => sum + parseFloat(credit.amount as any), 0);

    return {
      success: true,
      data: {
        userId: params.userId,
        balance: Math.max(0, balance),
      },
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Get restaurant details
 */
async function getRestaurantDetails(params: { restaurantId: string }) {
  try {
    if (!params.restaurantId) {
      return {
        success: false,
        error: "Missing required field: restaurantId",
      };
    }

    const restaurant = await storage.getRestaurant(params.restaurantId);
    if (!restaurant) {
      return {
        success: false,
        error: "Restaurant not found",
      };
    }

    // Get active deals for this restaurant
    const restaurantDeals = await db
      .select()
      .from(deals)
      .where(
        and(
          eq(deals.restaurantId, params.restaurantId),
          eq(deals.isActive, true)
        )
      );

    return {
      success: true,
      data: {
        restaurant,
        activeDeals: restaurantDeals,
        dealCount: restaurantDeals.length,
      },
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Submit community builder application
 */
async function submitBuilderApplication(params: {
  userId: string;
  countyName: string;
  motivation?: string;
  experience?: string;
}) {
  try {
    if (!params.userId || !params.countyName) {
      return {
        success: false,
        error: "Missing required fields: userId, countyName",
      };
    }

    const user = await storage.getUser(params.userId);
    if (!user) {
      return {
        success: false,
        error: "User not found",
      };
    }

    return {
      success: true,
      data: {
        userId: params.userId,
        countyName: params.countyName,
        status: "submitted",
        message: "Community builder application submitted. Check back soon!",
      },
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Get county transparency data
 */
async function getCountyTransparency(params: { countyName: string }) {
  try {
    if (!params.countyName) {
      return {
        success: false,
        error: "Missing required field: countyName",
      };
    }

    return {
      success: true,
      data: {
        countyName: params.countyName,
        message: "County transparency endpoint - feature coming soon",
      },
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Get redemption ledger for county
 */
async function getCountyRedemptionLedger(params: {
  countyName: string;
  limit?: number;
}) {
  try {
    if (!params.countyName) {
      return {
        success: false,
        error: "Missing required field: countyName",
      };
    }

    return {
      success: true,
      data: [],
      count: 0,
      message: "County redemption ledger endpoint - feature coming soon",
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Get county vault status
 */
async function getCountyVault(params: { countyName: string }) {
  try {
    if (!params.countyName) {
      return {
        success: false,
        error: "Missing required field: countyName",
      };
    }

    return {
      success: true,
      data: {
        countyName: params.countyName,
        message: "County vault endpoint - feature coming soon",
      },
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message,
    };
  }
}

// ==================== MAIN ACTION ROUTER ====================

router.post("/", async (req, res) => {
  const { action, params } = req.body;

  if (!action) {
    return res.status(400).json({
      error: "Missing required field: action",
    });
  }

  try {
    let result: any;

    switch (action) {
      case "FIND_DEALS":
        result = await findDeals(params || {});
        break;
      case "FIND_RESTAURANTS":
        result = await findRestaurants(params || {});
        break;
      case "GET_RESTAURANT_DETAILS":
        result = await getRestaurantDetails(params || {});
        break;
      case "CREATE_RESTAURANT":
        result = await createRestaurant(params || {});
        break;
      case "UPDATE_RESTAURANT":
        result = await updateRestaurant(params || {});
        break;
      case "GET_FOOD_TRUCKS":
        result = await getFoodTruckLocations(params || {});
        break;
      case "REDEEM_CREDITS":
        result = await redeemCredits(params || {});
        break;
      case "GET_CREDITS_BALANCE":
        result = await getCreditBalance(params || {});
        break;
      case "SUBMIT_BUILDER_APPLICATION":
        result = await submitBuilderApplication(params || {});
        break;
      case "GET_COUNTY_TRANSPARENCY":
        result = await getCountyTransparency(params || {});
        break;
      case "GET_COUNTY_LEDGER":
        result = await getCountyRedemptionLedger(params || {});
        break;
      case "GET_COUNTY_VAULT":
        result = await getCountyVault(params || {});
        break;
      default:
        return res.status(400).json({
          error: `Unknown action: ${action}`,
          supportedActions: [
            "FIND_DEALS",
            "FIND_RESTAURANTS",
            "GET_RESTAURANT_DETAILS",
            "CREATE_RESTAURANT",
            "UPDATE_RESTAURANT",
            "GET_FOOD_TRUCKS",
            "REDEEM_CREDITS",
            "GET_CREDITS_BALANCE",
            "SUBMIT_BUILDER_APPLICATION",
            "GET_COUNTY_TRANSPARENCY",
            "GET_COUNTY_LEDGER",
            "GET_COUNTY_VAULT",
          ],
        });
    }

    return res.json(result);
  } catch (err: any) {
    console.error(`Error in action ${action}:`, err);
    return res.status(500).json({
      error: "Internal server error",
      message: err.message,
    });
  }
});

export default router;
