/**
 * User API Routes
 *
 * Handles user-related endpoints including credit balance
 */

import { Router, Request, Response } from "express";
import { ilike } from "drizzle-orm";
import { db } from "./db";
import { users } from "@shared/schema";
import { getUserCreditBalance } from "./creditService";

const router = Router();

/**
 * GET /api/users/:userId/balance
 *
 * Get user's current credit balance (for form validation)
 */
router.get("/:userId/balance", async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    const balance = await getUserCreditBalance(userId);

    res.json({
      userId,
      balance,
    });
  } catch (error) {
    console.error("[userRoutes] Error getting user balance:", error);
    res.status(500).json({
      error: "Failed to fetch user balance",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

/**
 * GET /api/users/search
 *
 * Search for users by email (for restaurant credit redemption form)
 */
router.get("/search", async (req: Request, res: Response) => {
  try {
    const { q, limit = 5 } = req.query;

    if (!q || typeof q !== "string") {
      return res.status(400).json({ error: "Search query required" });
    }

    const parsedLimit = Math.min(Number(limit) || 5, 20);

    const results = await db
      .select({
        id: users.id,
        email: users.email,
        firstName: users.firstName,
        lastName: users.lastName,
      })
      .from(users)
      .where(ilike(users.email, `%${q}%`))
      .limit(parsedLimit);

    const mapped = results.map(
      (u: {
        id: string;
        email: string | null;
        firstName: string | null;
        lastName: string | null;
      }) => {
        const nameParts = [u.firstName, u.lastName].filter(Boolean);
        return {
          id: u.id,
          email: u.email ?? "",
          name: nameParts.length > 0 ? nameParts.join(" ") : u.email ?? "",
        };
      }
    );

    res.json({ users: mapped });
  } catch (error) {
    console.error("[userRoutes] Error searching users:", error);
    res.status(500).json({
      error: "Failed to search users",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

export default router;
