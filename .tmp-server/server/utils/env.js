function required(name) {
    var v = process.env[name];
    if (!v || !v.trim()) {
        throw new Error("Missing required env var: ".concat(name));
    }
    return v;
}
function optional(name) {
    var v = process.env[name];
    return v && v.trim() ? v : undefined;
}
function requiredInProd(name) {
    var value = optional(name);
    if (process.env.NODE_ENV === "production" && !value) {
        throw new Error("Missing required env var in production: ".concat(name));
    }
    return value;
}
export function validateEnv() {
    var isProduction = process.env.NODE_ENV === "production";
    var env = {
        DATABASE_URL: optional("DATABASE_URL") || "",
        TRADESCOUT_API_TOKEN: optional("TRADESCOUT_API_TOKEN"),
        SESSION_SECRET: required("SESSION_SECRET"),
        CLIENT_ORIGIN: required("CLIENT_ORIGIN"),
        BREVO_API_KEY: requiredInProd("BREVO_API_KEY"),
        INCIDENT_EMAIL_RECIPIENTS: requiredInProd("INCIDENT_EMAIL_RECIPIENTS"),
        TWILIO_ACCOUNT_SID: optional("TWILIO_ACCOUNT_SID"),
        TWILIO_AUTH_TOKEN: optional("TWILIO_AUTH_TOKEN"),
    };
    if (!env.CLIENT_ORIGIN.startsWith("http")) {
        throw new Error("CLIENT_ORIGIN must be a valid http(s) origin");
    }
    if (!env.TRADESCOUT_API_TOKEN) {
        console.warn("⚠️  TRADESCOUT_API_TOKEN not set - TradeScout LLM integration will be unavailable");
    }
    if (!env.DATABASE_URL) {
        console.warn("⚠️  DATABASE_URL is not set – running in limited dev mode without database connectivity.");
    }
    // For non-production, warn but do not prevent the server from starting
    // when incident email configuration is missing.
    if (!isProduction && !env.BREVO_API_KEY) {
        console.warn("⚠️  BREVO_API_KEY is not set – incident email notifications will fail and related actions will error until configured.");
    }
    if (!isProduction && !env.INCIDENT_EMAIL_RECIPIENTS) {
        console.warn("⚠️  INCIDENT_EMAIL_RECIPIENTS is not set – incident email notifications will throw errors when triggered.");
    }
    if ((env.TWILIO_ACCOUNT_SID && !env.TWILIO_AUTH_TOKEN) ||
        (!env.TWILIO_ACCOUNT_SID && env.TWILIO_AUTH_TOKEN)) {
        console.warn("⚠️  Partial Twilio configuration detected – SMS incident notifications will be disabled until all TWILIO_* vars are set.");
    }
    return env;
}
