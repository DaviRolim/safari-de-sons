import { test, expect } from "@playwright/test";

test("diorama renders 5 animals", async ({ page }) => {
  await page.goto("/");
  await page.waitForSelector(".animal");
  const animals = page.locator(".animal");
  await expect(animals).toHaveCount(5);
});

test("tapping each animal applies the tapped class and triggers audio", async ({ page }) => {
  // Stub HTMLMediaElement.play before page scripts run.
  await page.addInitScript(() => {
    window.__playLog = [];
    const origPlay = HTMLMediaElement.prototype.play;
    HTMLMediaElement.prototype.play = function () {
      window.__playLog.push(this.src);
      return Promise.resolve();
    };
    HTMLMediaElement.prototype.pause = function () {};
  });

  await page.goto("/");
  await page.waitForSelector(".animal");

  const ids = ["lion", "zebra", "hippo", "giraffe", "lemur"];
  for (const id of ids) {
    const before = await page.evaluate(() => window.__playLog.length);
    await page.click(`.animal[data-id="${id}"]`);
    await expect(page.locator(`.animal[data-id="${id}"]`)).toHaveClass(/tapped/);
    await page.waitForTimeout(200);
    const after = await page.evaluate(() => window.__playLog.length);
    expect(after).toBeGreaterThan(before);
    const log = await page.evaluate(() => window.__playLog);
    expect(log.some((src) => src.includes(`/voice/${id}.mp3`))).toBe(true);
    await page.waitForTimeout(2000); // pass cooldown so next animal isn't gated
  }
});
