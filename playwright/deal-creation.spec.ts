import { test, expect } from "@playwright/test";
import path from "path";

const FRONTEND = process.env.FRONTEND_URL ?? "http://localhost:5174";
const DEAL_PAGE = `${FRONTEND}/deal-creation`;

// If your app requires login to access deal creation, set these (real creds) before running:
//   setx TEST_EMAIL "you@real.com"
//   setx TEST_PASSWORD "yourRealPassword"
const TEST_EMAIL = process.env.TEST_EMAIL;
const TEST_PASSWORD = process.env.TEST_PASSWORD;

async function maybeLogin(page: any) {
  // If your deal page redirects to /login, this attempts login.
  // If your app doesn't require login, this does nothing.
  const url = page.url();
  if (!url.includes("/login")) return;

  if (!TEST_EMAIL || !TEST_PASSWORD) {
    throw new Error(
      "Redirected to /login but TEST_EMAIL/TEST_PASSWORD are not set. Set real creds and rerun."
    );
  }

  // These selectors may differ in your app; update them to match your login form if needed.
  await page.getByLabel(/email/i).fill(TEST_EMAIL);
  await page.getByLabel(/password/i).fill(TEST_PASSWORD);
  await page.getByRole("button", { name: /log in|sign in/i }).click();

  await page.waitForLoadState("networkidle");
}

async function openDealCreation(page: any) {
  await page.goto(DEAL_PAGE, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(250);
  await maybeLogin(page);
  // Ensure we're on deal creation after possible login
  if (!page.url().includes("/deal-creation")) {
    await page.goto(DEAL_PAGE, { waitUntil: "domcontentloaded" });
  }
  await expect(page).toHaveURL(/\/deal-creation/);
}

async function fillRequiredBasics(page: any, title: string) {
  // Use data-testid selectors which match the actual component
  await page.locator('[data-testid="input-deal-title"]').fill(title);
  await page.locator('[data-testid="textarea-description"]').fill("Deal creation automated verification");

  // Select percentage deal type (default is already percentage)
  await page.locator('[data-testid="radio-percentage"]').check();

  // Fill discount value
  await page.locator('[data-testid="input-discount-value"]').fill("10");
}

async function uploadImage(page: any) {
  const imagePath = path.resolve(process.cwd(), "test-assets/real-image.jpg");

  // The file input has data-testid="input-file-upload" but is hidden
  // Use it directly to set the file
  const fileInput = page.locator('[data-testid="input-file-upload"]');
  await fileInput.setInputFiles(imagePath);
  
  // Wait for image to be processed
  await page.waitForTimeout(300);
}

function captureDealPost(page: any) {
  let captured: { url: string; method: string; postData: any } | null = null;

  page.on("request", (req: any) => {
    const url = req.url();
    if (url.includes("/api/deals") && req.method() === "POST") {
      const raw = req.postData();
      try {
        captured = { url, method: req.method(), postData: raw ? JSON.parse(raw) : null };
      } catch {
        captured = { url, method: req.method(), postData: raw };
      }
    }
  });

  return () => captured;
}

test.describe("Deal creation UI contract (A–D)", () => {
  test("Test A: Image required blocks submit (no POST)", async ({ page }) => {
    await openDealCreation(page);

    const getCaptured = captureDealPost(page);

    await fillRequiredBasics(page, "Test A No Image");

    // Click publish using data-testid
    await page.locator('[data-testid="button-publish-deal"]').click();
    await page.waitForTimeout(800);

    const captured = getCaptured();
    expect(captured).toBeNull();

    // Expect some visible validation error for image
    // If your UI shows a specific message, adjust this regex.
    await expect(page.getByText(/image/i)).toBeVisible();
  });

  test("Test B: Business hours checkbox sends null times", async ({ page }) => {
    await openDealCreation(page);

    const getCaptured = captureDealPost(page);

    await uploadImage(page);
    await fillRequiredBasics(page, "Test B Business Hours");

    // Toggle the business hours checkbox
    await page.locator('[data-testid="checkbox-business-hours"]').check();

    await page.locator('[data-testid="button-publish-deal"]').click();
    await page.waitForTimeout(1200);

    const captured = getCaptured();
    expect(captured).not.toBeNull();
    if (!captured) return;

    const body = captured.postData;

    expect(body.availableDuringBusinessHours).toBe(true);
    expect(body.startTime).toBeNull();
    expect(body.endTime).toBeNull();
  });

  test("Test C: Ongoing deal sends null endDate", async ({ page }) => {
    await openDealCreation(page);

    const getCaptured = captureDealPost(page);

    await uploadImage(page);
    await fillRequiredBasics(page, "Test C Ongoing Deal");

    await page.locator('[data-testid="checkbox-ongoing"]').check();

    await page.locator('[data-testid="button-publish-deal"]').click();
    await page.waitForTimeout(1200);

    const captured = getCaptured();
    expect(captured).not.toBeNull();
    if (!captured) return;

    const body = captured.postData;

    expect(body.isOngoing).toBe(true);
    expect(body.endDate).toBeNull();
  });

  test("Test D: Both checkboxes send null times + null endDate", async ({ page }) => {
    await openDealCreation(page);

    const getCaptured = captureDealPost(page);

    await uploadImage(page);
    await fillRequiredBasics(page, "Test D Both Checkboxes");

    await page.locator('[data-testid="checkbox-business-hours"]').check();
    await page.locator('[data-testid="checkbox-ongoing"]').check();

    await page.locator('[data-testid="button-publish-deal"]').click();
    await page.waitForTimeout(1200);

    const captured = getCaptured();
    expect(captured).not.toBeNull();
    if (!captured) return;

    const body = captured.postData;

    expect(body.availableDuringBusinessHours).toBe(true);
    expect(body.startTime).toBeNull();
    expect(body.endTime).toBeNull();

    expect(body.isOngoing).toBe(true);
    expect(body.endDate).toBeNull();
  });
});
