type EnvSpec = {
  DATABASE_URL: string;
  TRADESCOUT_API_TOKEN: string;
  SESSION_SECRET: string;
  CLIENT_ORIGIN: string;
};

function required(name: keyof EnvSpec): string {
  const v = process.env[name];
  if (!v || !v.trim()) {
    throw new Error(`Missing required env var: ${name}`);
  }
  return v;
}

export function validateEnv(): EnvSpec {
  const env: EnvSpec = {
    DATABASE_URL: required("DATABASE_URL"),
    TRADESCOUT_API_TOKEN: required("TRADESCOUT_API_TOKEN"),
    SESSION_SECRET: required("SESSION_SECRET"),
    CLIENT_ORIGIN: required("CLIENT_ORIGIN"),
  };

  if (!env.CLIENT_ORIGIN.startsWith("http")) {
    throw new Error("CLIENT_ORIGIN must be a valid http(s) origin");
  }

  return env;
}
