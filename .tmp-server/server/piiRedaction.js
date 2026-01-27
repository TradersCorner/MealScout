/**
 * PII Redaction and Audit Logging
 *
 * Redacts personally identifiable information before storing in audit logs.
 * Ensures compliance with privacy regulations (GDPR, CCPA, etc.).
 */
/**
 * List of patterns and fields to redact
 */
var redactionRules = {
    // Email addresses - redact domain
    email: function (value) {
        if (typeof value !== 'string')
            return value;
        var local = value.split('@')[0];
        return "".concat(local.slice(0, 3), "***@***.com");
    },
    // Phone numbers - redact middle digits
    phone: function (value) {
        if (typeof value !== 'string')
            return value;
        var cleaned = value.replace(/\D/g, '');
        if (cleaned.length < 7)
            return '****';
        return "".concat(cleaned.slice(0, 2), "***").concat(cleaned.slice(-2));
    },
    // Credit card - redact everything but last 4
    creditCard: function (value) {
        if (typeof value !== 'string')
            return value;
        var cleaned = value.replace(/\D/g, '');
        if (cleaned.length < 4)
            return '****';
        return "****-****-****-".concat(cleaned.slice(-4));
    },
    // SSN - redact first 5 digits
    ssn: function (value) {
        if (typeof value !== 'string')
            return value;
        return "***-**-".concat(value.slice(-4));
    },
    // Passport - redact first half
    passport: function (value) {
        if (typeof value !== 'string')
            return value;
        return "".concat(value.slice(0, 2), "****");
    },
    // API Key - redact all but first and last 4
    apiKey: function (value) {
        if (typeof value !== 'string' || value.length < 8)
            return '****';
        return "".concat(value.slice(0, 4), "***").concat(value.slice(-4));
    },
    // Password - redact completely
    password: function () { return '***REDACTED***'; },
    // Full name - redact last name
    fullName: function (value) {
        if (typeof value !== 'string')
            return value;
        var parts = value.trim().split(' ');
        if (parts.length < 2)
            return value;
        return "".concat(parts[0], " ").concat(parts[parts.length - 1].replace(/./g, '*'));
    },
    // Address - keep only city/state
    address: function (value) {
        if (typeof value !== 'string')
            return value;
        // Simple heuristic: keep last 10 chars (usually city/state/zip)
        return "***".concat(value.slice(-10));
    },
    // IP address - redact last octet
    ipAddress: function (value) {
        if (typeof value !== 'string')
            return value;
        var parts = value.split('.');
        if (parts.length === 4) {
            return "".concat(parts[0], ".").concat(parts[1], ".").concat(parts[2], ".***");
        }
        return value;
    },
    // UUID - keep first 8 chars
    uuid: function (value) {
        if (typeof value !== 'string')
            return value;
        return "".concat(value.slice(0, 8), "***");
    },
};
/**
 * Field name patterns that should be redacted
 */
var sensitiveFields = [
    /email/i,
    /phone/i,
    /password/i,
    /token/i,
    /api[-_]?key/i,
    /credit[-_]?card/i,
    /ssn/i,
    /passport/i,
    /secret/i,
    /authorization/i,
    /auth/i,
    /lastname/i,
    /address/i,
    /ipaddress/i,
    /ip_address/i,
];
/**
 * Determine if a field should be redacted based on name or pattern
 */
function isSensitiveField(fieldName) {
    for (var _i = 0, sensitiveFields_1 = sensitiveFields; _i < sensitiveFields_1.length; _i++) {
        var pattern = sensitiveFields_1[_i];
        if (pattern.test(fieldName)) {
            // Match to redaction rule
            if (/email/i.test(fieldName))
                return 'email';
            if (/phone/i.test(fieldName))
                return 'phone';
            if (/password/i.test(fieldName))
                return 'password';
            if (/token|secret|key/i.test(fieldName))
                return 'apiKey';
            if (/credit[-_]?card/i.test(fieldName))
                return 'creditCard';
            if (/ssn/i.test(fieldName))
                return 'ssn';
            if (/passport/i.test(fieldName))
                return 'passport';
            if (/address/i.test(fieldName))
                return 'address';
            if (/ip|address/i.test(fieldName) && /ip/i.test(fieldName))
                return 'ipAddress';
            return 'apiKey'; // Default for auth-like fields
        }
    }
    return null;
}
/**
 * Recursively redact sensitive data in an object
 */
export function redactPII(obj, depth) {
    if (depth === void 0) { depth = 0; }
    // Prevent deep recursion
    if (depth > 10)
        return '[REDACTED - too deep]';
    if (obj === null || obj === undefined) {
        return obj;
    }
    if (typeof obj === 'string') {
        return obj;
    }
    if (Array.isArray(obj)) {
        return obj.map(function (item) { return redactPII(item, depth + 1); });
    }
    if (typeof obj === 'object') {
        var redacted = {};
        for (var _i = 0, _a = Object.entries(obj); _i < _a.length; _i++) {
            var _b = _a[_i], key = _b[0], value = _b[1];
            var sensitiveRule = isSensitiveField(key);
            if (sensitiveRule && value) {
                redacted[key] = redactionRules[sensitiveRule](String(value));
            }
            else if (typeof value === 'object') {
                redacted[key] = redactPII(value, depth + 1);
            }
            else {
                redacted[key] = value;
            }
        }
        return redacted;
    }
    return obj;
}
/**
 * Redact a user agent string (removes OS version details)
 */
export function redactUserAgent(userAgent) {
    if (!userAgent)
        return 'unknown';
    // Keep browser/framework info, remove detailed OS info
    return userAgent
        .replace(/Windows NT \d+\.\d+/gi, 'Windows')
        .replace(/Mac OS X [\d_]+/gi, 'macOS')
        .replace(/Android \d+/gi, 'Android')
        .replace(/iPhone OS \d+/gi, 'iOS')
        .slice(0, 100); // Cap at 100 chars
}
/**
 * Redact an IP address
 */
export function redactIp(ip) {
    if (!ip)
        return 'unknown';
    var parts = ip.split('.');
    if (parts.length === 4) {
        return "".concat(parts[0], ".").concat(parts[1], ".").concat(parts[2], ".***");
    }
    // IPv6 or other format
    return ip.slice(0, 10) + '...';
}
/**
 * Create an audit log entry with redacted data
 */
export function createRedactedAuditEntry(entry) {
    return {
        action: entry.action,
        userId: entry.userId,
        resourceType: entry.resourceType,
        resourceId: entry.resourceId,
        ip: redactIp(entry.ip),
        userAgent: redactUserAgent(entry.userAgent),
        metadata: redactPII(entry.metadata),
    };
}
