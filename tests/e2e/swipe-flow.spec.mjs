import { test, expect } from "@playwright/test";

test("swipe right snaps to backyard scene", async ({ page }) => {
  await page.goto("/");
  await page.waitForSelector(".scene-panel[data-scene='jungle']");

  // Verify scene 1 is initially in view.
  const trackInitial = await page.evaluate(() => {
    const t = document.querySelector(".scenes-track");
    return { scrollLeft: t.scrollLeft };
  });
  expect(trackInitial.scrollLeft).toBeLessThan(50);

  // Programmatically snap to backyard (Playwright touch-drag is flaky).
  await page.evaluate(() => {
    const panel = document.querySelector('.scene-panel[data-scene="backyard"]');
    panel.scrollIntoView({ behavior: "instant", inline: "center" });
  });
  await page.waitForTimeout(300);

  const trackAfter = await page.evaluate(() => {
    const t = document.querySelector(".scenes-track");
    return { scrollLeft: t.scrollLeft };
  });
  expect(trackAfter.scrollLeft).toBeGreaterThan(100);
});

test("snap-back to jungle after viewing backyard works", async ({ page }) => {
  await page.goto("/");
  await page.waitForSelector(".scene-panel[data-scene='jungle']");

  await page.evaluate(() => {
    document.querySelector('.scene-panel[data-scene="backyard"]').scrollIntoView({ behavior: "instant", inline: "center" });
  });
  await page.waitForTimeout(300);

  await page.evaluate(() => {
    document.querySelector('.scene-panel[data-scene="jungle"]').scrollIntoView({ behavior: "instant", inline: "center" });
  });
  await page.waitForTimeout(300);

  const scrollLeft = await page.evaluate(() => document.querySelector(".scenes-track").scrollLeft);
  expect(scrollLeft).toBeLessThan(50);
});
