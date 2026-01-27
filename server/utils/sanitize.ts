type SanitizeUserOptions = {
  includeStripe?: boolean;
};

const STRIPPED_FIELDS = new Set([
  "passwordHash",
  "googleAccessToken",
  "facebookAccessToken",
  "tradescoutId",
]);

export function sanitizeUser<T extends Record<string, any>>(
  user: T | null | undefined,
  options: SanitizeUserOptions = {}
): Omit<T, "passwordHash" | "googleAccessToken" | "facebookAccessToken" | "tradescoutId"> | null | undefined {
  if (!user || typeof user !== "object") {
    return user as null | undefined;
  }

  const sanitized = { ...user } as Record<string, any>;

  Array.from(STRIPPED_FIELDS).forEach((field) => {
    if (field in sanitized) {
      delete sanitized[field];
    }
  });

  if (!options.includeStripe) {
    delete sanitized.stripeCustomerId;
    delete sanitized.stripeSubscriptionId;
  }

  return sanitized as any;
}

export function sanitizeUsers<T extends Record<string, any>>(
  users: T[] | null | undefined,
  options?: SanitizeUserOptions
): Array<Omit<T, "passwordHash" | "googleAccessToken" | "facebookAccessToken" | "tradescoutId">> {
  if (!Array.isArray(users)) {
    return [];
  }
  return users.map((user) => sanitizeUser(user, options) as any);
}
