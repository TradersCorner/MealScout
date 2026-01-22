type ImageSize = number | "small" | "medium" | "large";

const sizeMap: Record<Exclude<ImageSize, number>, number> = {
  small: 64,
  medium: 128,
  large: 256,
};

function resolveSize(size: ImageSize): number {
  return typeof size === "number" ? size : sizeMap[size];
}

export function getOptimizedImageUrl(
  input: string | null | undefined,
  size: ImageSize = "medium",
): string {
  if (!input || typeof input !== "string") return "";

  const trimmed = input.trim();
  if (!trimmed) return "";

  try {
    const url = new URL(trimmed);
    const host = url.hostname.toLowerCase();
    const px = resolveSize(size);

    if (
      host.includes("fbcdn.net") ||
      host.includes("facebook.com") ||
      host.includes("fbsbx.com")
    ) {
      url.searchParams.set("width", String(px));
      url.searchParams.set("height", String(px));
      url.searchParams.set("type", "large");
      return url.toString();
    }

    if (host.includes("googleusercontent.com")) {
      if (url.pathname.includes("=")) {
        return trimmed.replace(/=s\d+(-c)?$/, `=s${px}-c`);
      }
      return `${trimmed}=s${px}-c`;
    }

    if (host.includes("pbs.twimg.com")) {
      url.searchParams.set("name", "large");
      return url.toString();
    }

    return trimmed;
  } catch {
    return trimmed;
  }
}
