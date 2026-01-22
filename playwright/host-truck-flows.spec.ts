import { test, expect } from "@playwright/test";

const FRONTEND = process.env.FRONTEND_URL ?? "http://localhost:5174";

const HOST_EMAIL = process.env.TEST_HOST_EMAIL;
const HOST_PASSWORD = process.env.TEST_HOST_PASSWORD;
const TRUCK_EMAIL = process.env.TEST_TRUCK_EMAIL;
const TRUCK_PASSWORD = process.env.TEST_TRUCK_PASSWORD;

async function fillWithFallbacks(
  page: any,
  selectors: string[],
  value: string,
  label: string,
) {
  for (const selector of selectors) {
    try {
      const locator = page.locator(selector);
      if (await locator.count()) {
        await locator.first().fill(value);
        console.log(`[flow] Filled ${label} using selector: ${selector}`);
        return true;
      }
    } catch {
      continue;
    }
  }
  return false;
}

async function login(page: any, email?: string, password?: string) {
  if (!email || !password) {
    throw new Error("Missing TEST_* credentials for this flow.");
  }

  await page.goto(`${FRONTEND}/login`, { waitUntil: "domcontentloaded" });
  const emailToggle = page.getByRole("button", {
    name: /email|use email|continue with email|sign in with email/i,
  });
  if (await emailToggle.count()) {
    await emailToggle.first().click();
  }
  const emailPanelButton = page.getByRole("button", {
    name: /sign in with email/i,
  });
  if (await emailPanelButton.count()) {
    await emailPanelButton.first().click();
  }
  try {
    await page.waitForSelector("input", { timeout: 5000 });
  } catch {
    // Continue; we'll collect debug info below if needed.
  }
  const emailSelectors = [
    "label:has-text('Email') >> input",
    "input[type='email']",
    "input[autocomplete='email']",
    "input[autocomplete='username']",
    "input[name*='email' i]",
    "input[id*='email' i]",
    "input[placeholder*='email' i]",
    "input[type='text'][name*='email' i]",
    "input[type='text'][id*='email' i]",
    "input[type='text'][placeholder*='email' i]",
  ];
  const passwordSelectors = [
    "label:has-text('Password') >> input",
    "input[type='password']",
    "input[autocomplete='current-password']",
    "input[name*='password' i]",
    "input[id*='password' i]",
    "input[placeholder*='password' i]",
  ];

  const emailFilled = await fillWithFallbacks(
    page,
    emailSelectors,
    email,
    "email",
  );
  const passwordFilled = await fillWithFallbacks(
    page,
    passwordSelectors,
    password,
    "password",
  );

  if (!emailFilled || !passwordFilled) {
    const inputInfo = await page.evaluate(() => {
      return Array.from(document.querySelectorAll("input")).map((input) => ({
        type: input.type,
        name: input.name,
        id: input.id,
        placeholder: input.placeholder,
        autocomplete: input.autocomplete,
      }));
    });
    console.log("[flow] Input fields found:", inputInfo);
    throw new Error("Login fields not found with fallback selectors.");
  }

  const loginButton = page.getByRole("button", {
    name: /log in|sign in|continue|next/i,
  });
  if (await loginButton.count()) {
    await loginButton.first().click();
  }
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
