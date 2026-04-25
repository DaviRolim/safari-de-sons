import { test, expect } from "@playwright/test";

test("after 2.5s of no taps, an animal has the pulse-hint class", async ({ page }) => {
  await page.goto("/");
  await page.waitForSelector(".animal");
  await page.waitForTimeout(2500);
  const count = await page.locator(".animal.pulse-hint").count();
  expect(count).toBeGreaterThanOrEqual(1);
});
