// Auth transport diagnostic — do not remove; gated to dev only.
export async function authDebugProbe() {
  if (import.meta.env.PROD) return;

  try {
    const res = await fetch("/api/debug/session", {
      credentials: "include",
    });

    const data = await res.json();

    console.group("[AUTH DEBUG] Probe");
    console.log("HTTP status:", res.status);
    console.log("sessionID:", data.sessionID);
    console.log("isAuthenticated:", data.isAuthenticated);
    console.log("user:", data.user);
    console.log("cookie header present:", Boolean(data.cookie));
    console.groupEnd();
  } catch (err) {
    console.error("Auth debug probe failed:", err);
  }
}
