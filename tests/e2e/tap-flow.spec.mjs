import { test, expect } from "@playwright/test";

test("track renders 12 animal buttons across both scene panels", async ({ page }) => {
  await page.goto("/");
  await page.waitForSelector(".animal");
  const animals = page.locator(".animal");
  await expect(animals).toHaveCount(12);
});

test("tapping each scene-1 animal applies tapped class and triggers audio", async ({ page }) => {
  await page.addInitScript(() => {
    window.__playLog = [];
    HTMLMediaElement.prototype.play = function () {
      window.__playLog.push(this.src);
      return Promise.resolve();
    };
    HTMLMediaElement.prototype.pause = function () {};
  });

  await page.goto("/");
  await page.waitForSelector(".animal");

  // Scene 1 = jungle. Natan-jungle is data-id="natan-jungle".
  const sceneOneIds = [
    { id: "lion",          voiceFile: "lion.mp3" },
    { id: "zebra",         voiceFile: "zebra.mp3" },
    { id: "hippo",         voiceFile: "hippo.mp3" },
    { id: "giraffe",       voiceFile: "giraffe.mp3" },
    { id: "lemur",         voiceFile: "lemur.mp3" },
    { id: "natan-jungle",  voiceFile: "natan.mp3" }
  ];

  for (const { id, voiceFile } of sceneOneIds) {
    const before = await page.evaluate(() => window.__playLog.length);
    await page.click(`.animal[data-id="${id}"]`);
    await expect(page.locator(`.animal[data-id="${id}"]`)).toHaveClass(/tapped/);
    await page.waitForTimeout(200);
    const after = await page.evaluate(() => window.__playLog.length);
    expect(after).toBeGreaterThan(before);
    const log = await page.evaluate(() => window.__playLog);
    expect(log.some((src) => src.includes(`/voice/${voiceFile}`))).toBe(true);
    await page.waitForTimeout(2000);
  }
});

test("tapping each scene-2 animal applies tapped class and triggers audio", async ({ page }) => {
  await page.addInitScript(() => {
    window.__playLog = [];
    HTMLMediaElement.prototype.play = function () {
      window.__playLog.push(this.src);
      return Promise.resolve();
    };
    HTMLMediaElement.prototype.pause = function () {};
  });

  await page.goto("/");
  await page.waitForSelector(".animal");

  // Programmatically snap to scene 2.
  await page.evaluate(() => {
    const panel = document.querySelector('.scene-panel[data-scene="backyard"]');
    panel.scrollIntoView({ behavior: "instant", inline: "center" });
  });
  await page.waitForTimeout(300);

  const sceneTwoIds = [
    { id: "cow",             voiceFile: "cow.mp3" },
    { id: "dog",             voiceFile: "dog.mp3" },
    { id: "cat",             voiceFile: "cat.mp3" },
    { id: "bird",            voiceFile: "bird.mp3" },
    { id: "turtle",          voiceFile: "turtle.mp3" },
    { id: "natan-backyard",  voiceFile: "natan.mp3" }
  ];

  for (const { id, voiceFile } of sceneTwoIds) {
    const before = await page.evaluate(() => window.__playLog.length);
    await page.click(`.animal[data-id="${id}"]`);
    await expect(page.locator(`.animal[data-id="${id}"]`)).toHaveClass(/tapped/);
    await page.waitForTimeout(200);
    const after = await page.evaluate(() => window.__playLog.length);
    expect(after).toBeGreaterThan(before);
    const log = await page.evaluate(() => window.__playLog);
    expect(log.some((src) => src.includes(`/voice/${voiceFile}`))).toBe(true);
    await page.waitForTimeout(2000);
  }
});
