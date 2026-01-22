import { test, expect } from "@playwright/test";

const FRONTEND = process.env.FRONTEND_URL ?? "http://localhost:5174";

const HOST_EMAIL = process.env.TEST_HOST_EMAIL;
const HOST_PASSWORD = process.env.TEST_HOST_PASSWORD;
const TRUCK_EMAIL = process.env.TEST_TRUCK_EMAIL;
const TRUCK_PASSWORD = process.env.TEST_TRUCK_PASSWORD;

async function login(page: any, email?: string, password?: string) {
  if (!email || !password) {
    throw new Error("Missing TEST_* credentials for this flow.");
  }

  await page.goto(`${FRONTEND}/login`, { waitUntil: "domcontentloaded" });
  await page.getByLabel(/email/i).fill(email);
  await page.getByLabel(/password/i).fill(password);
  await page.getByRole("button", { name: /log in|sign in/i }).click();
  await page.waitForLoadState("networkidle");
}

async function checkBrokenLinks(page: any) {
  const links = await page.$$eval("a[href]", (nodes) =>
    nodes
      .map((node) => (node as HTMLAnchorElement).href)
      .filter((href) => href.startsWith(window.location.origin)),
  );

  const unique = Array.from(new Set(links));
  for (const href of unique) {
    const res = await page.request.get(href);
    expect(res.status(), `Broken link: ${href}`).toBeLessThan(400);
  }
}

test.describe("Host flow", () => {
  test("Host can reach dashboard and parking pass manage", async ({ page }) => {
    await login(page, HOST_EMAIL, HOST_PASSWORD);
    await page.goto(`${FRONTEND}/host/dashboard`, {
      waitUntil: "domcontentloaded",
    });
    await expect(page).toHaveURL(/\/host\/dashboard/);

    // Host dashboard should render
    await expect(page.getByText(/host/i)).toBeVisible();

    await page.goto(`${FRONTEND}/parking-pass-manage`, {
      waitUntil: "domcontentloaded",
    });
    await expect(page).toHaveURL(/\/parking-pass-manage/);

    await checkBrokenLinks(page);
  });
});

test.describe("Food truck flow", () => {
  test("Truck can access parking pass search and booking entry", async ({
    page,
  }) => {
    await login(page, TRUCK_EMAIL, TRUCK_PASSWORD);
    await page.goto(`${FRONTEND}/parking-pass`, {
      waitUntil: "domcontentloaded",
    });
    await expect(page).toHaveURL(/\/parking-pass/);

    // Parking Pass page should render for food truck
    await expect(page.getByText(/parking pass/i)).toBeVisible();

    await checkBrokenLinks(page);
  });
});
