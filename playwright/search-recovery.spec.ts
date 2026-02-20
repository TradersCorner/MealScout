import { test, expect } from "@playwright/test";

const FRONTEND = process.env.FRONTEND_URL ?? "http://localhost:5174";

test.describe("Search recovery flows", () => {
  test("Did-you-mean updates query and emits telemetry", async ({ page }) => {
    const telemetryEvents: Array<{ eventName?: string; properties?: Record<string, unknown> }> = [];

    await page.route("**/api/telemetry/track", async (route) => {
      const payload = route.request().postDataJSON() as {
        eventName?: string;
        properties?: Record<string, unknown>;
      };
      telemetryEvents.push(payload || {});
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ ok: true }),
      });
    });

    await page.route("**/api/deals/featured", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify([]),
      });
    });

    await page.route("**/api/search?*", async (route) => {
      const url = new URL(route.request().url());
      const q = (url.searchParams.get("q") || "").toLowerCase();
      if (q === "pizza") {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            deals: [
              {
                id: "deal-1",
                title: "Pizza lunch special",
                description: "20% off",
                discountValue: "20",
                minOrderAmount: "10",
                createdAt: new Date().toISOString(),
                restaurant: {
                  id: "r1",
                  name: "Pizza Place",
                  cuisineType: "Italian",
                },
              },
            ],
            restaurants: [],
            parkingPassHosts: [],
            videos: [],
            events: [],
          }),
        });
        return;
      }

      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          deals: [],
          restaurants: [],
          parkingPassHosts: [],
          videos: [],
          events: [],
        }),
      });
    });

    await page.goto(`${FRONTEND}/search?q=piza`, { waitUntil: "domcontentloaded" });

    const suggestionButton = page.getByTestId("button-did-you-mean");
    await expect(suggestionButton).toBeVisible();
    await suggestionButton.click();

    await expect(page).toHaveURL(/\/search\?q=pizza/);
    await expect(page.getByText('Deals for "pizza"')).toBeVisible();

    expect(
      telemetryEvents.some((event) => event.eventName === "search_did_you_mean_clicked"),
    ).toBeTruthy();
  });

  test("Sticky location CTA emits telemetry on mobile", async ({ page }) => {
    const telemetryEvents: Array<{ eventName?: string }> = [];
    await page.setViewportSize({ width: 390, height: 844 });

    await page.addInitScript(() => {
      Object.defineProperty(navigator, "geolocation", {
        configurable: true,
        value: {
          getCurrentPosition: (_success: unknown, error: ((err: { code: number; message: string }) => void) | undefined) => {
            error?.({ code: 1, message: "denied" });
          },
        },
      });
    });

    await page.route("**/api/deals/featured", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify([]),
      });
    });

    await page.route("**/api/telemetry/track", async (route) => {
      telemetryEvents.push(route.request().postDataJSON() as { eventName?: string });
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ ok: true }),
      });
    });

    await page.goto(`${FRONTEND}/search`, { waitUntil: "domcontentloaded" });

    const stickyLocation = page.getByTestId("button-search-sticky-location");
    await expect(stickyLocation).toBeVisible();
    await stickyLocation.click();

    await expect(
      page.getByText("Unable to get your location."),
    ).toBeVisible();
    expect(
      telemetryEvents.some((event) => event.eventName === "search_location_request_sticky"),
    ).toBeTruthy();
  });
});
