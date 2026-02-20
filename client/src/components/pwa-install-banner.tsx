import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { X, Share2, PlusSquare } from "lucide-react";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

const DISMISS_KEY = "mealscout:pwa_install_banner:dismissed_at";
const DISMISS_DAYS = 7;

function isIosDevice() {
  const ua = navigator.userAgent || "";
  return /iPad|iPhone|iPod/i.test(ua);
}

function isInAppBrowser() {
  const ua = navigator.userAgent || "";
  // Facebook/Messenger/Instagram in-app browsers commonly include these.
  return /FBAN|FBAV|FB_IAB|Instagram/i.test(ua);
}

function isStandaloneMode() {
  // iOS uses navigator.standalone; others use display-mode.
  const anyNav = navigator as any;
  return Boolean(
    window.matchMedia?.("(display-mode: standalone)")?.matches ||
      anyNav.standalone,
  );
}

export function PwaInstallBanner() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(
    null,
  );
  const [dismissed, setDismissed] = useState(false);

  const ios = useMemo(() => (typeof window === "undefined" ? false : isIosDevice()), []);
  const inApp = useMemo(() => (typeof window === "undefined" ? false : isInAppBrowser()), []);
  const standalone = useMemo(
    () => (typeof window === "undefined" ? false : isStandaloneMode()),
    [],
  );

  const isDismissedRecently = () => {
    try {
      const raw = localStorage.getItem(DISMISS_KEY);
      if (!raw) return false;
      const ts = Number(raw);
      if (!Number.isFinite(ts)) return false;
      const ms = DISMISS_DAYS * 24 * 60 * 60 * 1000;
      return Date.now() - ts < ms;
    } catch {
      return false;
    }
  };

  useEffect(() => {
    try {
      const raw = localStorage.getItem(DISMISS_KEY);
      if (!raw) return;
      const ts = Number(raw);
      if (!Number.isFinite(ts)) return;
      const ms = DISMISS_DAYS * 24 * 60 * 60 * 1000;
      if (Date.now() - ts < ms) setDismissed(true);
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    const handler = (event: Event) => {
      // Chrome/Edge on Android/Desktop.
      // IMPORTANT: Only suppress the browser prompt when we intend to show our own UI.
      // If the banner is dismissed (or we're already installed), let the browser handle install UX.
      if (isStandaloneMode()) return;
      if (isDismissedRecently()) return;
      event.preventDefault();
      setDeferredPrompt(event as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  // In iOS in-app browsers (FB/Messenger/IG), A2HS is commonly blocked.
  // Always show instructions there (even if previously dismissed) so users can open in Safari.
  const shouldShow =
    !standalone &&
    ((ios && inApp) || (!dismissed && (ios || Boolean(deferredPrompt))));
  if (!shouldShow) return null;

  const dismiss = () => {
    try {
      localStorage.setItem(DISMISS_KEY, String(Date.now()));
    } catch {
      // ignore
    }
    setDismissed(true);
  };

  const onInstall = async () => {
    if (!deferredPrompt) return;
    try {
      await deferredPrompt.prompt();
      await deferredPrompt.userChoice.catch(() => undefined);
    } finally {
      setDeferredPrompt(null);
      dismiss();
    }
  };

  const title = deferredPrompt ? "Install MealScout" : "Add MealScout to your Home Screen";
  const body = deferredPrompt
    ? "Get faster access and an app-like experience."
    : inApp
      ? "You're in an in-app browser. Tap ... then Open in Safari, then Share and Add to Home Screen."
      : "Tap Share, then Add to Home Screen.";

  return (
    <div className="fixed left-0 right-0 bottom-[72px] z-50 px-4 md:bottom-4 md:px-6">
      <Card className="mx-auto max-w-md border-[color:var(--border-subtle)] bg-[var(--bg-card)] shadow-clean-lg">
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="text-sm font-semibold text-foreground">{title}</div>
              <div className="mt-1 text-xs text-muted-foreground">{body}</div>
              {!deferredPrompt && ios && (
                <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
                  <span className="inline-flex items-center gap-1 rounded-full border border-[color:var(--border-subtle)] px-2 py-1">
                    <Share2 className="h-3 w-3" />
                    Share
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-full border border-[color:var(--border-subtle)] px-2 py-1">
                    <PlusSquare className="h-3 w-3" />
                    Add to Home Screen
                  </span>
                </div>
              )}
              <div className="mt-3 flex gap-2">
                {deferredPrompt ? (
                  <Button size="sm" onClick={onInstall} data-testid="button-pwa-install">
                    Install
                  </Button>
                ) : (
                  <Button size="sm" variant="outline" onClick={dismiss}>
                    Got it
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={dismiss}
                  aria-label="Dismiss install banner"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
