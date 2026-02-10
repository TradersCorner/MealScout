import type { Request } from "express";
import crypto from "crypto";
import type { User } from "@shared/schema";
import { storage } from "../storage";
import { emailService, isEmailConfigured } from "../emailService";

type SendVerificationResult =
  | { sent: true }
  | {
      sent: false;
      skippedReason:
        | "missing_email"
        | "already_verified"
        | "provider_not_configured"
        | "send_failed";
    };

export async function sendEmailVerificationIfNeeded(
  user: User,
  req: Request,
): Promise<SendVerificationResult> {
  if (!user.email) {
    return { sent: false, skippedReason: "missing_email" };
  }
  if (user.emailVerified) {
    return { sent: false, skippedReason: "already_verified" };
  }
  if (!isEmailConfigured()) {
    return { sent: false, skippedReason: "provider_not_configured" };
  }

  const token = crypto.randomBytes(32).toString("hex");
  const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

  await storage.createEmailVerificationToken({
    userId: user.id,
    tokenHash,
    expiresAt,
    requestIp: req.ip || undefined,
    userAgent: req.get("User-Agent") || undefined,
  });

  const reqHost = req.get("host");
  const inferredBaseUrl = reqHost ? `${req.protocol}://${reqHost}` : null;
  const apiBaseUrl = (
    process.env.PUBLIC_BASE_URL ||
    inferredBaseUrl ||
    "http://localhost:5000"
  ).replace(/\/+$/, "");

  const verifyUrl = `${apiBaseUrl}/api/auth/verify-email?token=${encodeURIComponent(
    token,
  )}`;

  const ok = await emailService.sendEmailVerificationEmail(user, verifyUrl);
  return ok ? { sent: true } : { sent: false, skippedReason: "send_failed" };
}
