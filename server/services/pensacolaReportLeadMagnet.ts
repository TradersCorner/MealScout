import crypto from "crypto";
import { z } from "zod";
import { db } from "../db";
import { emailService } from "../emailService";
import {
  pensacolaReportLeads,
  reportDownloadTokens,
  reportLeadSequenceSends,
} from "@shared/schema";
import { and, eq, gt, isNull } from "drizzle-orm";
import { renderPensacolaReportPdfBuffer, buildPensacolaReportData } from "./pensacolaReportPdf";

const SEQUENCE = "pensacola_report_v1";

function envEnabled(name: string): boolean {
  return String(process.env[name] || "").trim().toLowerCase() === "true";
}

function publicBaseUrl(): string {
  return String(process.env.PUBLIC_BASE_URL || "https://www.mealscout.us").replace(
    /\/+$/,
    "",
  );
}

function sha256(value: string): string {
  return crypto.createHash("sha256").update(value).digest("hex");
}

function tokenTtlHours(): number {
  const raw = Number(process.env.REPORT_DOWNLOAD_TOKEN_TTL_HOURS ?? 72);
  if (!Number.isFinite(raw)) return 72;
  return Math.max(1, Math.min(Math.floor(raw), 24 * 30));
}

export const requestReportSchema = z.object({
  email: z.string().email(),
  firstName: z.string().trim().min(1).max(80).optional(),
});

export async function upsertPensacolaReportLead(params: {
  email: string;
  firstName?: string | null;
  ip?: string | null;
  userAgent?: string | null;
}) {
  const email = params.email.trim().toLowerCase();
  const firstName =
    typeof params.firstName === "string" && params.firstName.trim()
      ? params.firstName.trim()
      : null;

  const existing = await db
    .select()
    .from(pensacolaReportLeads)
    .where(eq(pensacolaReportLeads.email, email))
    .limit(1)
    .then((rows: any[]) => rows[0] || null);

  if (existing) return existing;

  const [created] = await db
    .insert(pensacolaReportLeads)
    .values({
      email,
      firstName,
      source: "pensacola_report",
      ip: params.ip || null,
      userAgent: params.userAgent || null,
    } as any)
    .returning();

  return created;
}

export async function createReportDownloadToken(leadId: string) {
  const token = crypto.randomBytes(32).toString("hex");
  const tokenHash = sha256(token);
  const expiresAt = new Date(Date.now() + tokenTtlHours() * 60 * 60 * 1000);

  const [created] = await db
    .insert(reportDownloadTokens)
    .values({
      leadId,
      tokenHash,
      expiresAt,
    } as any)
    .returning();

  return { token, tokenRow: created };
}

export async function sendReportEmail(params: {
  lead: any;
  token: string;
}) {
  const base = publicBaseUrl();
  const downloadUrl = `${base}/api/public/pensacola/report/download?token=${encodeURIComponent(
    params.token,
  )}`;
  const spotsUrl = `${base}/pensacola/spots`;
  const signupUrl = `${base}/restaurant-signup?redirect=${encodeURIComponent(
    "/pensacola/spots",
  )}`;

  const name = params.lead?.firstName || "there";
  const subject = "Your Pensacola Food Truck Parking Report (PDF)";
  const html = `
    <!DOCTYPE html>
    <html>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #111827;">
        <div style="max-width: 640px; margin: 0 auto; padding: 24px;">
          <h2 style="margin: 0 0 12px 0;">Hi ${name} &mdash; here&apos;s your report</h2>
          <p style="margin: 0 0 12px 0;">
            Download the PDF here (link expires in ${tokenTtlHours()} hours):
          </p>
          <p style="margin: 0 0 16px 0;">
            <a href="${downloadUrl}">${downloadUrl}</a>
          </p>
          <p style="margin: 0 0 12px 0;">
            Want the live version (availability + booking)? Start here:
            <a href="${spotsUrl}">${spotsUrl}</a>
          </p>
          <p style="margin: 0;">
            No account yet? Create a free one:
            <a href="${signupUrl}">${signupUrl}</a>
          </p>
          <p style="margin-top: 24px; color:#6b7280; font-size: 12px;">
            MealScout &middot; Pensacola
          </p>
        </div>
      </body>
    </html>
  `;

  // Use category "account" so it still sends when EMAIL_NOTIFICATIONS_MODE=account_only.
  return emailService.sendBasicEmail(
    String(params.lead.email),
    subject,
    html,
    undefined,
    "account",
  );
}

export async function handleReportRequest(params: {
  email: string;
  firstName?: string | null;
  ip?: string | null;
  userAgent?: string | null;
}) {
  if (!envEnabled("PENSACOLA_REPORT_ENABLED")) {
    return { ok: false as const, code: "disabled" as const };
  }

  const lead = await upsertPensacolaReportLead(params);

  // Cooldown: avoid spamming the same lead with repeated emails.
  const cooldownMinutesRaw = Number(process.env.REPORT_EMAIL_COOLDOWN_MINUTES ?? 30);
  const cooldownMinutes = Number.isFinite(cooldownMinutesRaw)
    ? Math.max(1, Math.min(Math.floor(cooldownMinutesRaw), 24 * 60))
    : 30;
  const cutoff = new Date(Date.now() - cooldownMinutes * 60 * 1000);

  const recentSend = await db
    .select({ id: reportLeadSequenceSends.id })
    .from(reportLeadSequenceSends)
    .where(
      and(
        eq(reportLeadSequenceSends.leadId, String(lead.id)),
        eq(reportLeadSequenceSends.sequence, SEQUENCE),
        eq(reportLeadSequenceSends.step, 1),
        gt(reportLeadSequenceSends.sentAt, cutoff),
      ),
    )
    .limit(1);

  if (recentSend.length > 0) {
    // Don't spam emails, but still allow the lead to download a fresh copy.
    const { token } = await createReportDownloadToken(String(lead.id));
    const downloadUrl = `${publicBaseUrl()}/api/public/pensacola/report/download?token=${encodeURIComponent(
      token,
    )}`;

    return {
      ok: true as const,
      leadId: lead.id,
      emailed: false,
      cooldownMinutes,
      downloadUrl,
    };
  }

  const { token } = await createReportDownloadToken(String(lead.id));
  const emailed = await sendReportEmail({ lead, token });

  if (emailed) {
    // Mark step 1 sent for the drip (idempotent).
    await db
      .insert(reportLeadSequenceSends)
      .values({
        leadId: String(lead.id),
        sequence: SEQUENCE,
        step: 1,
        metadata: { kind: "lead", leadId: lead.id },
      } as any)
      .onConflictDoNothing();
  }

  const downloadUrl = `${publicBaseUrl()}/api/public/pensacola/report/download?token=${encodeURIComponent(
    token,
  )}`;

  return {
    ok: true as const,
    leadId: lead.id,
    emailed,
    downloadUrl,
  };
}

export async function renderReportPdfForToken(token: string) {
  const tokenHash = sha256(String(token || "").trim());
  const now = new Date();

  const row = await db
    .select({
      id: reportDownloadTokens.id,
      leadId: reportDownloadTokens.leadId,
      expiresAt: reportDownloadTokens.expiresAt,
      usedAt: reportDownloadTokens.usedAt,
    })
    .from(reportDownloadTokens)
    .where(eq(reportDownloadTokens.tokenHash, tokenHash))
    .limit(1)
    .then((rows: any[]) => rows[0] || null);

  if (!row) return { ok: false as const, code: "invalid" as const };
  if (row.expiresAt && now > new Date(row.expiresAt)) return { ok: false as const, code: "expired" as const };

  const pdf = await renderPensacolaReportPdfBuffer(buildPensacolaReportData());

  // Mark used (best-effort).
  await db
    .update(reportDownloadTokens)
    .set({ usedAt: row.usedAt ? row.usedAt : now } as any)
    .where(and(eq(reportDownloadTokens.id, row.id), isNull(reportDownloadTokens.usedAt)));

  return { ok: true as const, pdf };
}
