import { test, expect } from "@playwright/test";

const FRONTEND = process.env.FRONTEND_URL ?? "http://localhost:5174";

const HOST_EMAIL = process.env.TEST_HOST_EMAIL;
const HOST_PASSWORD = process.env.TEST_HOST_PASSWORD;
const TRUCK_EMAIL = process.env.TEST_TRUCK_EMAIL;
const TRUCK_PASSWORD = process.env.TEST_TRUCK_PASSWORD;

async function fillWithFallbacks(
  context: any,
  selectors: string[],
  value: string,
  label: string,
) {
  for (const selector of selectors) {
    try {
      const locator = context.locator(selector);
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

async function fillInAnyFrame(
  page: any,
  selectors: string[],
  value: string,
  label: string,
) {
  const frames = page.frames();
  for (const frame of frames) {
    const filled = await fillWithFallbacks(frame, selectors, value, label);
    if (filled) {
      return true;
    }
  }
  return false;
}

async function login(page: any, email?: string, password?: string) {
  if (!email || !password) {
    throw new Error("Missing TEST_* credentials for this flow.");
  }

  const apiLogin = await page.request.post(`${FRONTEND}/api/auth/login`, {
    data: { email, password },
  });
  if (!apiLogin.ok()) {
    const body = await apiLogin.text().catch(() => "");
    throw new Error(
      `API login failed: ${apiLogin.status()} ${apiLogin.statusText()} ${body}`,
    );
  }

  await page.goto(`${FRONTEND}/login`, { waitUntil: "domcontentloaded" });
  const emailLoginButton = page.getByTestId("button-email-login");
  if (await emailLoginButton.count()) {
    await emailLoginButton.first().click({ force: true });
  } else {
    const emailToggleButtons = [
      page.getByRole("button", {
        name: /email|use email|continue with email|sign in with email/i,
      }),
      page.getByText(/sign in with email/i),
      page.getByText(/continue with email/i),
    ];
    for (const button of emailToggleButtons) {
      if (await button.count()) {
        await button.first().click({ force: true });
        break;
      }
    }
  }
  try {
    await page.waitForSelector("[data-testid='input-email']", {
      timeout: 8000,
    });
  } catch {
    // Continue; we'll collect debug info below if needed.
  }
  const emailSelectors = [
    "[data-testid='input-email']",
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
    "[data-testid='input-password']",
    "label:has-text('Password') >> input",
    "input[type='password']",
    "input[autocomplete='current-password']",
    "input[name*='password' i]",
    "input[id*='password' i]",
    "input[placeholder*='password' i]",
  ];

  const emailFilled = await fillInAnyFrame(page, emailSelectors, email, "email");
  const passwordFilled = await fillInAnyFrame(
    page,
    passwordSelectors,
    password,
    "password",
  );

  if (!emailFilled || !passwordFilled) {
    if (page.isClosed()) {
      throw new Error("Login page closed before inputs were found.");
    }
    const inputInfo = await page.evaluate(() => {
      return {
        inputs: Array.from(document.querySelectorAll("input")).map((input) => ({
          type: input.type,
          name: input.name,
          id: input.id,
          placeholder: input.placeholder,
          autocomplete: input.autocomplete,
        })),
        buttons: Array.from(document.querySelectorAll("button")).map((button) =>
          button.textContent?.trim(),
        ),
        iframes: Array.from(document.querySelectorAll("iframe")).map(
          (iframe) => iframe.src,
        ),
      };
    });
    console.log("[flow] Login debug:", inputInfo);
    throw new Error("Login fields not found with fallback selectors.");
  }

  const loginButton = page
    .getByTestId("button-login-submit")
    .or(
      page.getByRole("button", { name: /log in|sign in|continue|next/i }),
    );
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
