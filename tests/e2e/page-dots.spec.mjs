import { test, expect } from "@playwright/test";

test("two page dots are rendered with the first active", async ({ page }) => {
  await page.goto("/");
  await page.waitForSelector(".page-dot");
  const dots = page.locator(".page-dot");
  await expect(dots).toHaveCount(2);

  const firstClass = await dots.nth(0).getAttribute("class");
  const secondClass = await dots.nth(1).getAttribute("class");
  expect(firstClass).toContain("active");
  expect(secondClass ?? "").not.toContain("active");
});

test("tapping the second dot snaps to backyard and toggles active", async ({ page }) => {
  await page.goto("/");
  await page.waitForSelector(".page-dot");

  await page.click('.page-dot[data-scene="backyard"]');
  await page.waitForTimeout(700); // smooth scroll + IntersectionObserver settle

  const trackScroll = await page.evaluate(() => document.querySelector(".scenes-track").scrollLeft);
  expect(trackScroll).toBeGreaterThan(100);

  const firstClass = await page.locator('.page-dot[data-scene="jungle"]').getAttribute("class");
  const secondClass = await page.locator('.page-dot[data-scene="backyard"]').getAttribute("class");
  expect(firstClass ?? "").not.toContain("active");
  expect(secondClass).toContain("active");
});

test("tapping the first dot snaps back to jungle", async ({ page }) => {
  await page.goto("/");
  await page.waitForSelector(".page-dot");

  await page.click('.page-dot[data-scene="backyard"]');
  await page.waitForTimeout(700);

  await page.click('.page-dot[data-scene="jungle"]');
  await page.waitForTimeout(700);

  const trackScroll = await page.evaluate(() => document.querySelector(".scenes-track").scrollLeft);
  expect(trackScroll).toBeLessThan(50);
});
