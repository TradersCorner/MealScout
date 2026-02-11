import type { User } from "@shared/schema";
import { storage } from "../storage";

export function isPremiumTrialActive(user: User | null): boolean {
  if (!user?.trialEndsAt) return false;
  return user.trialEndsAt.getTime() > Date.now();
}

export async function ensurePremiumTrialForUser(user: User): Promise<User> {
  if (isPremiumTrialActive(user) || user.trialUsed || user.stripeSubscriptionId) {
    return user;
  }

  // Never grant trials to staff/admin accounts.
  const ineligibleTypes = new Set(["staff", "admin", "super_admin"]);
  if (ineligibleTypes.has(String(user.userType || ""))) {
    return user;
  }

  const restaurantsForUser = await storage.getRestaurantsByOwner(user.id);
  const eligibleUserTypes = new Set(["restaurant_owner", "food_truck"]);
  if (!eligibleUserTypes.has(String(user.userType || ""))) {
    return user;
  }

  // Trial starts only after the business is verified (user requirement).
  const hasVerifiedBusiness = restaurantsForUser.some((restaurant: any) => {
    if (!restaurant?.isVerified) return false;
    return (
      restaurant.businessType === "restaurant" ||
      restaurant.businessType === "bar" ||
      restaurant.isFoodTruck
    );
  });

  if (!hasVerifiedBusiness) {
    return user;
  }

  const startedAt = new Date();
  const endsAt = new Date(startedAt.getTime() + 30 * 24 * 60 * 60 * 1000);
  const updated = await storage.updateUser(user.id, {
    trialStartedAt: startedAt,
    trialEndsAt: endsAt,
    trialUsed: true,
    subscriptionBillingInterval: "trial",
  });

  return updated || user;
}

export async function ensurePremiumTrialForUserId(
  userId: string,
): Promise<User | null> {
  const user = await storage.getUser(userId);
  if (!user) return null;
  return await ensurePremiumTrialForUser(user);
}
