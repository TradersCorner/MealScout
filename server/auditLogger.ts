import winston from 'winston';
import { db } from './db';
import { securityAuditLog } from '../shared/schema';
import { redactPII, redactIp, redactUserAgent } from './piiRedaction';

const auditLogger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.Console(),
  ],
});

export async function logAudit(
  userId?: string,
  action?: string,
  resourceType?: string,
  resourceId?: string,
  ip?: string,
  userAgent?: string,
  metadata?: any,
) {
  // Redact sensitive data before logging
  const redactedIp = ip ? redactIp(ip) : undefined;
  const redactedUserAgent = userAgent ? redactUserAgent(userAgent) : undefined;
  const redactedMetadata = metadata ? redactPII(metadata) : undefined;

  // Log to Winston (console + file if configured)
  auditLogger.info({
    userId,
    action,
    resourceType,
    resourceId,
    ip: redactedIp,
    userAgent: redactedUserAgent,
    metadata: redactedMetadata,
  });

  // Store in database with redacted data
  await db.insert(securityAuditLog).values({
    userId,
    action,
    resourceType,
    resourceId,
    ip: redactedIp,
    userAgent: redactedUserAgent,
    metadata: redactedMetadata,
  });
}

export default auditLogger;
