import { test, expect } from "@playwright/test";

test("after 2.5s of no taps, an animal in the visible scene has the pulse-hint class", async ({ page }) => {
  await page.goto("/");
  await page.waitForSelector(".animal");
  await page.waitForTimeout(2500);

  const visibleSceneId = "jungle"; // initial scene
  const pulsedInVisibleScene = await page.locator(`.animal[data-scene="${visibleSceneId}"].pulse-hint`).count();
  expect(pulsedInVisibleScene).toBeGreaterThanOrEqual(1);
});

test("pulses do not fire on the offscreen scene", async ({ page }) => {
  await page.goto("/");
  await page.waitForSelector(".animal");

  // Wait through several pulse cycles to ensure offscreen never gets pulsed.
  await page.waitForTimeout(8000);

  const offscreenPulses = await page.locator('.animal[data-scene="backyard"].pulse-hint').count();
  expect(offscreenPulses).toBe(0);
});

test("after swiping to scene 2, pulse fires there instead", async ({ page }) => {
  await page.goto("/");
  await page.waitForSelector(".animal");

  await page.click('.page-dot[data-scene="backyard"]');
  await page.waitForTimeout(800); // settle + the 2s pulse delay reset

  // Wait for the pulse to actually fire after scene change (scenes resets cursor + reschedules).
  await page.waitForTimeout(2500);

  const pulsedInBackyard = await page.locator('.animal[data-scene="backyard"].pulse-hint').count();
  expect(pulsedInBackyard).toBeGreaterThanOrEqual(1);
});
