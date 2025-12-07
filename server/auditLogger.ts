import winston from 'winston';
import { db } from './db';
import { securityAuditLog } from '../shared/schema';

const auditLogger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.Console(),
  ],
});

export async function logAudit({
  userId,
  action,
  resourceType,
  resourceId,
  ip,
  userAgent,
  metadata,
}: {
  userId?: string;
  action: string;
  resourceType?: string;
  resourceId?: string;
  ip?: string;
  userAgent?: string;
  metadata?: any;
}) {
  auditLogger.info({ userId, action, resourceType, resourceId, ip, userAgent, metadata });
  await db.insert(securityAuditLog).values({
    userId,
    action,
    resourceType,
    resourceId,
    ip,
    userAgent,
    metadata,
  });
}

export default auditLogger;
