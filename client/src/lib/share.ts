import { apiRequest } from "@/lib/queryClient";

function normalizeSharePath(input: string): string {
  if (!input) return "/";

  if (input.startsWith("http")) {
    try {
      const url = new URL(input);
      return `${url.pathname}${url.search}${url.hash}`;
    } catch {
      return "/";
    }
  }

  if (input.startsWith("/")) {
    return input;
  }

  return `/${input}`;
}

export async function getAffiliateShareUrl(input: string): Promise<string> {
  if (typeof window === "undefined") {
    return input;
  }

  const path = normalizeSharePath(input);
  const fallback = input.startsWith("http")
    ? input
    : `${window.location.origin}${path}`;

  try {
    const res = await apiRequest("POST", "/api/share/generate", { path });
    const data = await res.json();
    return data?.shareLink || fallback;
  } catch {
    return fallback;
  }
}
