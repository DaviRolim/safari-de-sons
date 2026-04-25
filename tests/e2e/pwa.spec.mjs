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
