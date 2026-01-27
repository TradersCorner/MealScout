import type { Request } from "express";
import crypto from "crypto";
import type { User } from "@shared/schema";
import { storage } from "../storage";
import { emailService } from "../emailService";

type InviteOptions = {
  user: User;
  createdBy?: User | null;
  req: Request;
};

export async function sendAccountSetupInvite({
  user,
  createdBy,
  req,
}: InviteOptions): Promise<boolean> {
  const setupToken = crypto.randomBytes(32).toString("hex");
  const tokenHash = crypto.createHash("sha256").update(setupToken).digest("hex");
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  await storage.createAccountSetupToken({
    userId: user.id,
    tokenHash,
    expiresAt,
    createdByUserId: createdBy?.id ?? undefined,
    requestIp: req.ip || undefined,
    userAgent: req.get("User-Agent") || undefined,
  });

  const baseUrl =
    process.env.PUBLIC_BASE_URL || `${req.protocol}://${req.get("host")}`;
  const setupUrl = `${baseUrl.replace(/\/+$/, "")}/account-setup?token=${encodeURIComponent(
    setupToken
  )}`;

  const createdByName = createdBy?.firstName
    ? `${createdBy.firstName} ${createdBy.lastName || ""}`.trim()
    : undefined;

  return emailService.sendAccountSetupEmail(user, setupUrl, createdByName);
}
