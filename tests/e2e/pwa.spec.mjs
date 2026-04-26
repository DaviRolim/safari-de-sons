import { test, expect } from "@playwright/test";

test("manifest is served and parseable", async ({ request }) => {
  const res = await request.get("/manifest.webmanifest");
  expect(res.ok()).toBe(true);
  const manifest = await res.json();
  expect(manifest.name).toBe("Safari de Sons");
  expect(manifest.display).toBe("fullscreen");
  expect(manifest.orientation).toBe("landscape");
});

test("service worker registers", async ({ page }) => {
  await page.goto("/");
  await page.waitForFunction(
    async () => {
      if (!("serviceWorker" in navigator)) return false;
      const reg = await navigator.serviceWorker.getRegistration();
      return Boolean(reg && reg.active);
    },
    null,
    { timeout: 10000 }
  );
});

test("service worker uses cache version v4", async ({ page }) => {
  await page.goto("/");
  await page.waitForFunction(
    async () => {
      const reg = await navigator.serviceWorker.getRegistration();
      return Boolean(reg && reg.active);
    },
    null,
    { timeout: 10000 }
  );

  // Read the SW source and check the version constant.
  const swText = await page.request.get("/service-worker.js").then((r) => r.text());
  expect(swText).toContain('CACHE_VERSION = "v4"');
});
