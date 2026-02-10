import { chromium } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

const baseUrl = "http://127.0.0.1:5173/";
const outDir = path.resolve(".tmp", "screens");

fs.mkdirSync(outDir, { recursive: true });

const mockDateScript = (hour) => `
  (() => {
    const base = new Date();
    base.setHours(${hour}, 0, 0, 0);
    const now = base.getTime();
    class MockDate extends Date {
      constructor(...args) {
        if (args.length) {
          return new Date(...args);
        }
        return new Date(now);
      }
      static now() {
        return now;
      }
    }
    window.Date = MockDate;
  })();
`;

const takeShot = async ({ label, hour }) => {
  const browser = await chromium.launch();
  const page = await browser.newPage({
    viewport: { width: 1440, height: 900 },
  });
  await page.addInitScript(mockDateScript(hour));
  await page.goto(baseUrl, { waitUntil: "networkidle" });
  await page.waitForTimeout(1500);
  await page.screenshot({
    path: path.join(outDir, `theme-${label}.png`),
    fullPage: true,
  });
  await browser.close();
};

await takeShot({ label: "day", hour: 10 });
await takeShot({ label: "night", hour: 20 });

console.log(`Screenshots saved to ${outDir}`);
