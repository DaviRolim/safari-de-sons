# Safari de Sons Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship a touch-first, voice-driven English-vocabulary micro-game for a 2y4m toddler — installable as a PWA on iPhone, deployed to GitHub Pages.

**Architecture:** Vanilla HTML/CSS/JS + ESM modules. Vite for dev HMR + static prod build. No runtime framework. ElevenLabs TTS pre-generates voice MP3s at build time; stock animal sounds curated from Pixabay. Service worker provides offline. Per-game GitHub repo deploys via GitHub Actions to GitHub Pages.

**Tech Stack:** Node 20+, Vite, Playwright (mobile viewport), `node --test`, `sharp` (chroma-key image cropping), `dotenv`, ElevenLabs HTTP API.

**Spec:** [`docs/superpowers/specs/2026-04-25-safari-de-sons-design.md`](../specs/2026-04-25-safari-de-sons-design.md)

**Working directory:** All commands assume `cd /Users/davirolim/playground/creatives/safari-de-sons` unless otherwise stated.

---

## Manual Pre-Tasks (Do These First)

These cannot be automated. Do them once before Task 1.

- [ ] **Rotate the ElevenLabs API key.** The key shared during brainstorming is now in conversation history. Log into the ElevenLabs dashboard, revoke that key, generate a new one. Keep the new key handy — you'll paste it into `.env` in Task 1, Step 5.
- [ ] **Confirm Node version.** Run `node --version`. Required: ≥ 20. If lower, install Node 20 LTS via your usual method (Homebrew, nvm, etc.) before continuing.
- [ ] **Confirm git identity.** Run `git config --global user.name` and `git config --global user.email` — both must return values. If not, set them before continuing.

---

## Task 1: Bootstrap Vite Project

**Files:**
- Create: `package.json`
- Create: `vite.config.js`
- Create: `index.html`
- Create: `src/main.js`
- Create: `src/styles.css`
- Create: `.env`
- Create: `.env.example`
- Create: `.gitignore`

- [ ] **Step 1: Create package.json**

Create `package.json`:
```json
{
  "name": "safari-de-sons",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview --host",
    "voiceover:samples": "node scripts/voiceover-samples.mjs",
    "voiceover:generate": "node scripts/generate-voiceover.mjs",
    "sheet:crop": "node scripts/crop-character-sheet.mjs",
    "test": "node --test $(find tests/unit -name '*.test.js' | sort)",
    "test:e2e": "playwright test"
  },
  "devDependencies": {
    "@playwright/test": "^1.49.0",
    "dotenv": "^16.4.5",
    "sharp": "^0.33.5",
    "vite": "^5.4.10"
  }
}
```

- [ ] **Step 2: Create vite.config.js**

Create `vite.config.js`:
```js
import { defineConfig } from "vite";

export default defineConfig({
  base: "./",
  build: {
    outDir: "dist",
    assetsInlineLimit: 0,
    rollupOptions: {
      input: {
        main: "index.html"
      }
    }
  },
  publicDir: "public",
  server: {
    port: 4173,
    host: true
  },
  preview: {
    port: 4173,
    host: true
  }
});
```

`base: "./"` is critical — GitHub Pages serves at a subpath, and relative URLs let the same build work locally and deployed.

- [ ] **Step 3: Create stub index.html**

Create `index.html`:
```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
    <title>Safari de Sons</title>
    <link rel="stylesheet" href="/src/styles.css" />
  </head>
  <body>
    <main id="app">
      <h1>Safari de Sons</h1>
      <p>Boot OK.</p>
    </main>
    <script type="module" src="/src/main.js"></script>
  </body>
</html>
```

- [ ] **Step 4: Create stub main.js and styles.css**

Create `src/main.js`:
```js
console.log("Safari de Sons booted");
```

Create `src/styles.css`:
```css
:root {
  --bg-jungle-deep: #2d5a3d;
  --bg-jungle-mid: #5a8c52;
}

* { box-sizing: border-box; }

html, body {
  margin: 0;
  padding: 0;
  height: 100%;
  overflow: hidden;
  background: var(--bg-jungle-deep);
  color: #fff;
  font-family: system-ui, -apple-system, sans-serif;
}

#app {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  flex-direction: column;
}
```

- [ ] **Step 5: Create .env, .env.example, .gitignore**

Create `.env` (do NOT commit — `.gitignore` handles this in step 5):
```
ELEVENLABS_API_KEY=PASTE_YOUR_ROTATED_KEY_HERE
```
Replace `PASTE_YOUR_ROTATED_KEY_HERE` with the rotated key from Manual Pre-Tasks.

Create `.env.example` (committed):
```
ELEVENLABS_API_KEY=
```

Create `.gitignore`:
```
node_modules/
dist/
.env
voice-samples/
test-results/
playwright-report/
.DS_Store
```

- [ ] **Step 6: Install and run dev server**

Run:
```bash
npm install
npm run dev
```

Expected output: Vite prints `Local: http://localhost:4173/` (or similar). Open the URL in a browser — should show "Safari de Sons" heading and "Boot OK.". Stop with `Ctrl+C`.

- [ ] **Step 7: Verify production build works**

Run:
```bash
npm run build
npm run preview
```

Expected: `dist/` directory is created. Preview serves at http://localhost:4173/ and shows the same page. Stop with `Ctrl+C`.

- [ ] **Step 8: Commit**

```bash
git init
git add package.json package-lock.json vite.config.js index.html src/main.js src/styles.css .env.example .gitignore
git commit -m "Bootstrap Vite project with stub index page."
```

(The `.env` file is gitignored and is NOT staged — verify with `git status` that it shows as ignored. The `package-lock.json` IS staged — committing the lockfile guarantees reproducible installs across machines and CI, important here because `sharp` ships platform-specific native binaries.)

---

## Task 2: Create GitHub Repo and Push

**Files:** none modified — this task is a manual GitHub setup + push.

- [ ] **Step 1: Create the remote repo**

Manual: Go to https://github.com/new and create a new public repo named `safari-de-sons`. Do NOT initialize it with a README, license, or .gitignore (the local repo already has commits).

- [ ] **Step 2: Add remote and push**

Run (substitute your GitHub username):
```bash
git remote add origin git@github.com:<your-username>/safari-de-sons.git
git branch -M main
git push -u origin main
```

Expected: push succeeds. The repo on GitHub now shows your initial commit.

- [ ] **Step 3: Enable GitHub Pages with Actions source**

Manual:
- On the repo's GitHub page → **Settings → Pages**.
- Under **Source**, choose **GitHub Actions**.
- Leave the page (no save button — GitHub auto-saves the choice).

This enables the deployment workflow we add in Task 3.

---

## Task 3: GitHub Actions Deploy Workflow

**Files:**
- Create: `.github/workflows/deploy.yml`

- [ ] **Step 1: Create the workflow file**

Create `.github/workflows/deploy.yml`:
```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [main]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: pages
  cancel-in-progress: true

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm
      - run: npm ci
      - run: npm run build
      - uses: actions/upload-pages-artifact@v3
        with:
          path: dist

  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - id: deployment
        uses: actions/deploy-pages@v4
```

- [ ] **Step 2: Commit and push**

```bash
git add .github/workflows/deploy.yml
git commit -m "Add GitHub Pages deploy workflow."
git push
```

- [ ] **Step 3: Verify deployment**

Manual: On the repo's GitHub page → **Actions** tab. The "Deploy to GitHub Pages" workflow should be running. Wait ~1 minute for it to finish (both `build` and `deploy` jobs green).

- [ ] **Step 4: Open the live site**

The deploy job's output shows the URL (e.g., `https://<your-username>.github.io/safari-de-sons/`). Open it in a browser. Expected: same "Safari de Sons / Boot OK." page.

If you see a 404 or stale content, hard-refresh (`Cmd+Shift+R`) and re-check after ~30s — Pages can take a moment.

- [ ] **Step 5: Bookmark the URL**

You'll use this URL when installing the PWA on the iPhone in Task 19.

---

## Task 4: Animals Roster Module + Unit Tests

**Files:**
- Create: `src/animals.js`
- Create: `tests/unit/animals.test.js`

This is pure data + a shape validator. TDD.

- [ ] **Step 1: Write the failing test**

Create `tests/unit/animals.test.js`:
```js
import { test } from "node:test";
import assert from "node:assert/strict";
import { ANIMALS } from "../../src/animals.js";

test("ANIMALS exports an array of 5 animals", () => {
  assert.ok(Array.isArray(ANIMALS));
  assert.equal(ANIMALS.length, 5);
});

test("each animal has the required shape", () => {
  for (const animal of ANIMALS) {
    assert.equal(typeof animal.id, "string", `id missing on ${JSON.stringify(animal)}`);
    assert.equal(typeof animal.englishWord, "string");
    assert.equal(typeof animal.voicePath, "string");
    assert.equal(typeof animal.soundPath, "string");
    assert.ok(animal.voicePath.endsWith(".mp3"));
    assert.ok(animal.soundPath.endsWith(".mp3"));
    assert.equal(typeof animal.position, "object");
    assert.equal(typeof animal.position.left, "number");
    assert.equal(typeof animal.position.bottom, "number");
    assert.equal(typeof animal.scale, "number");
    assert.equal(typeof animal.zIndex, "number");
  }
});

test("animal IDs are unique", () => {
  const ids = ANIMALS.map((a) => a.id);
  assert.equal(new Set(ids).size, ids.length);
});

test("expected 5 animals are present", () => {
  const ids = ANIMALS.map((a) => a.id).sort();
  assert.deepEqual(ids, ["giraffe", "hippo", "lemur", "lion", "zebra"]);
});

test("positions are within 0-100% range", () => {
  for (const animal of ANIMALS) {
    assert.ok(animal.position.left >= 0 && animal.position.left <= 100);
    assert.ok(animal.position.bottom >= 0 && animal.position.bottom <= 100);
  }
});
```

- [ ] **Step 2: Run the test — verify it fails**

Run: `npm test`

Expected: FAIL with `Cannot find module '../../src/animals.js'` (or similar).

- [ ] **Step 3: Implement src/animals.js**

Create `src/animals.js`:
```js
export const ANIMALS = [
  {
    id: "lion",
    englishWord: "Lion",
    voicePath: "assets/voice/lion.mp3",
    soundPath: "assets/sounds/lion-roar.mp3",
    position: { left: 14, bottom: 18 },
    scale: 1.0,
    zIndex: 3
  },
  {
    id: "zebra",
    englishWord: "Zebra",
    voicePath: "assets/voice/zebra.mp3",
    soundPath: "assets/sounds/zebra-neigh.mp3",
    position: { left: 32, bottom: 22 },
    scale: 0.95,
    zIndex: 2
  },
  {
    id: "hippo",
    englishWord: "Hippo",
    voicePath: "assets/voice/hippo.mp3",
    soundPath: "assets/sounds/hippo-grunt.mp3",
    position: { left: 50, bottom: 8 },
    scale: 1.1,
    zIndex: 4
  },
  {
    id: "giraffe",
    englishWord: "Giraffe",
    voicePath: "assets/voice/giraffe.mp3",
    soundPath: "assets/sounds/giraffe-bleat.mp3",
    position: { left: 72, bottom: 25 },
    scale: 1.05,
    zIndex: 2
  },
  {
    id: "lemur",
    englishWord: "Lemur",
    voicePath: "assets/voice/lemur.mp3",
    soundPath: "assets/sounds/lemur-chatter.mp3",
    position: { left: 86, bottom: 12 },
    scale: 0.85,
    zIndex: 3
  }
];
```

`position.left` and `.bottom` are percentages of the diorama container (0–100). `scale` is a unitless CSS scale multiplier. `zIndex` controls stacking depth. These values are estimates from inspecting `character-sheet.png`; we'll fine-tune visually in Task 11.

- [ ] **Step 4: Run the test — verify it passes**

Run: `npm test`

Expected: all 5 tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/animals.js tests/unit/animals.test.js
git commit -m "Add animals roster module with unit tests."
```

---

## Task 5: Audio Module + Unit Tests

**Files:**
- Create: `src/audio.js`
- Create: `tests/unit/audio.test.js`

The audio module wraps `<audio>` element behavior with our concurrency rules: same-source cooldown, cross-source interrupt, no-error-on-load-fail. We TDD it against a fake audio backend so tests don't need a real DOM.

- [ ] **Step 1: Write the failing tests**

Create `tests/unit/audio.test.js`:
```js
import { test } from "node:test";
import assert from "node:assert/strict";
import { createAudioSystem } from "../../src/audio.js";

function makeFakeBackend() {
  const calls = [];
  const elements = new Map();
  return {
    calls,
    elements,
    create(src) {
      const el = {
        src,
        playing: false,
        currentTime: 0,
        play: () => {
          el.playing = true;
          calls.push({ op: "play", src });
          return Promise.resolve();
        },
        pause: () => {
          el.playing = false;
          calls.push({ op: "pause", src });
        }
      };
      elements.set(src, el);
      return el;
    }
  };
}

function makeClock(initial = 0) {
  let now = initial;
  return {
    now: () => now,
    advance: (ms) => {
      now += ms;
    }
  };
}

test("play() plays a clip via the backend", async () => {
  const backend = makeFakeBackend();
  const clock = makeClock();
  const audio = createAudioSystem({ backend, clock, cooldownMs: 1800 });
  await audio.play("voice/lion.mp3");
  assert.deepEqual(backend.calls, [{ op: "play", src: "voice/lion.mp3" }]);
});

test("rapid same-source play() within cooldown is ignored", async () => {
  const backend = makeFakeBackend();
  const clock = makeClock();
  const audio = createAudioSystem({ backend, clock, cooldownMs: 1800 });
  await audio.play("voice/lion.mp3");
  clock.advance(500);
  await audio.play("voice/lion.mp3");
  assert.equal(backend.calls.filter((c) => c.op === "play").length, 1);
});

test("same-source play() after cooldown plays again", async () => {
  const backend = makeFakeBackend();
  const clock = makeClock();
  const audio = createAudioSystem({ backend, clock, cooldownMs: 1800 });
  await audio.play("voice/lion.mp3");
  clock.advance(2000);
  await audio.play("voice/lion.mp3");
  assert.equal(backend.calls.filter((c) => c.op === "play").length, 2);
});

test("different-source play() interrupts current clip", async () => {
  const backend = makeFakeBackend();
  const clock = makeClock();
  const audio = createAudioSystem({ backend, clock, cooldownMs: 1800 });
  await audio.play("voice/lion.mp3");
  clock.advance(300);
  await audio.play("voice/zebra.mp3");
  const playOps = backend.calls.filter((c) => c.op === "play").map((c) => c.src);
  const pauseOps = backend.calls.filter((c) => c.op === "pause").map((c) => c.src);
  assert.deepEqual(playOps, ["voice/lion.mp3", "voice/zebra.mp3"]);
  assert.deepEqual(pauseOps, ["voice/lion.mp3"]);
});

test("playSequence() queues two clips with a gap", async () => {
  const backend = makeFakeBackend();
  const clock = makeClock();
  const audio = createAudioSystem({ backend, clock, cooldownMs: 1800 });
  await audio.playSequence(["voice/lion.mp3", "sounds/lion-roar.mp3"]);
  const playSrcs = backend.calls.filter((c) => c.op === "play").map((c) => c.src);
  assert.deepEqual(playSrcs, ["voice/lion.mp3", "sounds/lion-roar.mp3"]);
});
```

- [ ] **Step 2: Run tests — verify they fail**

Run: `npm test`

Expected: FAIL with `Cannot find module '../../src/audio.js'`.

- [ ] **Step 3: Implement src/audio.js**

Create `src/audio.js`:
```js
export function createAudioSystem({ backend, clock, cooldownMs = 1800, sequenceGapMs = 950 }) {
  const cache = new Map();
  let currentSrc = null;
  let currentEl = null;
  let lastPlayedAt = new Map();

  function getElement(src) {
    if (!cache.has(src)) {
      cache.set(src, backend.create(src));
    }
    return cache.get(src);
  }

  async function play(src) {
    const now = clock.now();
    if (currentSrc === src) {
      const last = lastPlayedAt.get(src) ?? -Infinity;
      if (now - last < cooldownMs) {
        return;
      }
    } else if (currentEl && currentEl.playing) {
      currentEl.pause();
    }

    const el = getElement(src);
    el.currentTime = 0;
    currentSrc = src;
    currentEl = el;
    lastPlayedAt.set(src, now);
    try {
      await el.play();
    } catch (err) {
      // Audio failures are intentionally swallowed.
      // No error UI per spec section 3.5.
    }
  }

  async function playSequence(srcs) {
    for (const src of srcs) {
      await play(src);
      await new Promise((resolve) => setTimeout(resolve, sequenceGapMs));
    }
  }

  function preload(srcs) {
    for (const src of srcs) {
      getElement(src);
    }
  }

  return { play, playSequence, preload };
}

export function createBrowserBackend() {
  return {
    create(src) {
      const el = new Audio(src);
      el.preload = "auto";
      el.playing = false;
      el.addEventListener("playing", () => {
        el.playing = true;
      });
      el.addEventListener("pause", () => {
        el.playing = false;
      });
      el.addEventListener("ended", () => {
        el.playing = false;
      });
      return el;
    }
  };
}

export function createBrowserClock() {
  return { now: () => performance.now() };
}
```

- [ ] **Step 4: Run tests — verify they pass**

Run: `npm test`

Expected: all 10 tests (5 from animals + 5 from audio) pass.

- [ ] **Step 5: Commit**

```bash
git add src/audio.js tests/unit/audio.test.js
git commit -m "Add audio module with cooldown, interrupt, and sequence playback."
```

---

## Task 6: Character Sheet Crop Script

**Files:**
- Create: `scripts/crop-config.json`
- Create: `scripts/crop-character-sheet.mjs`
- Create: `assets/images/lion.png` (output)
- Create: `assets/images/zebra.png` (output)
- Create: `assets/images/hippo.png` (output)
- Create: `assets/images/giraffe.png` (output)
- Create: `assets/images/lemur.png` (output)
- Create: `assets/images/jungle-bg.png` (output)

The script crops bounding boxes from the existing storybook character sheet, removes the dominant green background via chroma-key, and writes 5 transparent PNGs + a backdrop.

- [ ] **Step 1: Inspect the source image dimensions**

Run:
```bash
node -e "import('sharp').then(({default: sharp}) => sharp('../natan-escova-floresta/assets/generated/character-sheet.png').metadata().then(m => console.log(m.width, m.height)))"
```

Expected output: two integers — width and height in pixels (likely something like `2048 1152` or similar). **Note these values** — they're used for the bounding-box estimates in Step 2.

- [ ] **Step 2: Create initial crop-config.json**

Create `scripts/crop-config.json`. Coordinates are in source-image pixels. These are eyeballed estimates from the character-sheet composition — **expect to refine them in Step 5 after seeing the first crop output**:

```json
{
  "source": "../natan-escova-floresta/assets/generated/character-sheet.png",
  "outDir": "assets/images",
  "chromaKey": {
    "r": 90,
    "g": 140,
    "b": 80,
    "tolerance": 70
  },
  "background": {
    "out": "jungle-bg.png",
    "blur": 8
  },
  "crops": [
    { "id": "lion",    "out": "lion.png",    "x": 0.05, "y": 0.10, "w": 0.20, "h": 0.75 },
    { "id": "zebra",   "out": "zebra.png",   "x": 0.22, "y": 0.05, "w": 0.18, "h": 0.80 },
    { "id": "hippo",   "out": "hippo.png",   "x": 0.40, "y": 0.20, "w": 0.22, "h": 0.65 },
    { "id": "giraffe", "out": "giraffe.png", "x": 0.65, "y": 0.05, "w": 0.18, "h": 0.85 },
    { "id": "lemur",   "out": "lemur.png",   "x": 0.83, "y": 0.40, "w": 0.15, "h": 0.55 }
  ]
}
```

`x`, `y`, `w`, `h` are fractions of source dimensions (0.0–1.0). `chromaKey` RGB is roughly the dominant jungle-green; `tolerance` is the per-channel ±range that gets keyed to transparent.

- [ ] **Step 3: Create the crop script**

Create `scripts/crop-character-sheet.mjs`:
```js
import { promises as fs } from "node:fs";
import path from "node:path";
import sharp from "sharp";

const configPath = path.resolve("scripts/crop-config.json");
const config = JSON.parse(await fs.readFile(configPath, "utf-8"));

const sourcePath = path.resolve(config.source);
const outDir = path.resolve(config.outDir);
await fs.mkdir(outDir, { recursive: true });

const meta = await sharp(sourcePath).metadata();
const { width: W, height: H } = meta;

console.log(`Source: ${sourcePath}  ${W}x${H}`);

// 1. Background pass — blurred copy of the whole sheet, no chroma-key.
const bgPath = path.join(outDir, config.background.out);
await sharp(sourcePath)
  .blur(config.background.blur)
  .toFile(bgPath);
console.log(`  → ${path.relative(process.cwd(), bgPath)}`);

// 2. Animal pass — crop, then chroma-key the green to alpha.
const { r: kr, g: kg, b: kb, tolerance } = config.chromaKey;

for (const crop of config.crops) {
  const x = Math.round(crop.x * W);
  const y = Math.round(crop.y * H);
  const w = Math.round(crop.w * W);
  const h = Math.round(crop.h * H);

  const cropped = await sharp(sourcePath)
    .extract({ left: x, top: y, width: w, height: h })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const { data, info } = cropped;
  const channels = info.channels;
  for (let i = 0; i < data.length; i += channels) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    if (
      Math.abs(r - kr) <= tolerance &&
      Math.abs(g - kg) <= tolerance &&
      Math.abs(b - kb) <= tolerance
    ) {
      data[i + 3] = 0;
    }
  }

  const outPath = path.join(outDir, crop.out);
  await sharp(data, {
    raw: { width: info.width, height: info.height, channels: info.channels }
  })
    .png()
    .toFile(outPath);
  console.log(`  → ${path.relative(process.cwd(), outPath)}  (${w}x${h})`);
}

console.log("Done.");
```

- [ ] **Step 4: Run the crop script**

Run: `npm run sheet:crop`

Expected output: 6 file paths printed (1 backdrop + 5 animals) and "Done."

- [ ] **Step 5: Visually inspect outputs and refine**

Open all 6 generated files in Finder/Preview. Check each:
- Animal is centered in the frame.
- Animal isn't partially clipped at the edges.
- Background is mostly transparent (some halos around fur are acceptable for v1).
- `jungle-bg.png` has no animals visible — wait, it WILL have them. That's fine for v1; we're using the whole blurred sheet as a backdrop layer behind which we overlay the cropped sprites. The sprites will mask the duplicates.

If any crop is wrong (animal cut off, wrong animal in frame), edit the corresponding `crops[]` entry in `crop-config.json` and re-run `npm run sheet:crop`. Iterate until all 6 look acceptable.

If chroma-key leaves too much green or eats too much animal, adjust `chromaKey.tolerance` (lower = stricter, higher = more aggressive) and re-run.

If the chroma-key results are unacceptable after a few tries, fall back: open `character-sheet.png` in Pixelmator/Photopea, hand-cut each animal with proper feathered alpha, save into `assets/images/<id>.png`. Skip the script for v1 — it's documented as a fallback in spec §5.2.

- [ ] **Step 6: Commit**

```bash
git add scripts/crop-config.json scripts/crop-character-sheet.mjs assets/images/
git commit -m "Add character-sheet crop script with chroma-key; output 5 sprites + backdrop."
```

---

## Task 7: Voice Sample Audition

**Files:**
- Create: `scripts/voiceover-samples.mjs`
- Create: `scripts/voice-config.mjs` (after listening)
- Create: `voice-samples/*.mp3` (output, NOT committed — gitignored)

Generates 5 candidate British female voices saying "LION!" so you can pick your favorite.

- [ ] **Step 1: Create voiceover-samples.mjs**

Create `scripts/voiceover-samples.mjs`:
```js
import "dotenv/config";
import { promises as fs } from "node:fs";
import path from "node:path";

const apiKey = process.env.ELEVENLABS_API_KEY;
if (!apiKey) {
  console.error("Missing ELEVENLABS_API_KEY in .env");
  process.exit(1);
}

// Five British-female ElevenLabs preset voice IDs (names approximate; verify in ElevenLabs UI).
// See https://api.elevenlabs.io/v1/voices for the live list.
const SAMPLES = [
  { id: "XB0fDUnXU5powFXDhCwa", name: "Charlotte" },
  { id: "Xb7hH8MSUJpSbSDYk0k2", name: "Alice" },
  { id: "FGY2WhTYpPnrIDTdsKH5", name: "Laura" },
  { id: "EXAVITQu4vr4xnSDxMaL", name: "Sarah" },
  { id: "pFZP5JQG7iQjIQuC4Bku", name: "Lily" }
];

const text = "Lion!";
const outDir = path.resolve("voice-samples");
await fs.mkdir(outDir, { recursive: true });

for (const v of SAMPLES) {
  const url = `https://api.elevenlabs.io/v1/text-to-speech/${v.id}?output_format=mp3_44100_128`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "xi-api-key": apiKey,
      "content-type": "application/json"
    },
    body: JSON.stringify({
      text,
      model_id: "eleven_multilingual_v2",
      voice_settings: { stability: 0.4, similarity_boost: 0.75, style: 0.5 }
    })
  });
  if (!res.ok) {
    const errText = await res.text();
    console.error(`FAIL ${v.name} (${v.id}): ${res.status} ${errText}`);
    continue;
  }
  const buf = Buffer.from(await res.arrayBuffer());
  const file = path.join(outDir, `${v.name}-${v.id}.mp3`);
  await fs.writeFile(file, buf);
  console.log(`  → ${path.relative(process.cwd(), file)}`);
}

console.log("\nListen to all 5 in voice-samples/, pick your favorite, then create scripts/voice-config.mjs:");
console.log(`
export const VOICE_ID = "<paste-the-voice-id-here>";
export const MODEL_ID = "eleven_multilingual_v2";
export const VOICE_SETTINGS = { stability: 0.4, similarity_boost: 0.75, style: 0.5 };
`);
```

- [ ] **Step 2: Run the audition**

Run: `npm run voiceover:samples`

Expected output: 5 file paths printed (one per voice) into `voice-samples/`. The directory is gitignored.

If any voice errors out (the IDs may shift over time), open https://elevenlabs.io/app/voice-library, find any 5 British female voices, copy their IDs, and update the `SAMPLES` array. Re-run.

- [ ] **Step 3: Listen and choose**

Open Finder, navigate to `voice-samples/`, play each MP3. Pick your favorite. Note its file name — the part after the `-` and before `.mp3` is the voice ID.

- [ ] **Step 4: Pin the voice ID**

Create `scripts/voice-config.mjs` with the chosen voice ID. Example (your ID will differ):
```js
export const VOICE_ID = "XB0fDUnXU5powFXDhCwa";
export const MODEL_ID = "eleven_multilingual_v2";
export const VOICE_SETTINGS = { stability: 0.4, similarity_boost: 0.75, style: 0.5 };
```

- [ ] **Step 5: Commit (script + pinned config, NOT samples)**

```bash
git add scripts/voiceover-samples.mjs scripts/voice-config.mjs
git commit -m "Add voice audition script and pin chosen ElevenLabs voice ID."
```

---

## Task 8: Generate Production Voice Clips

**Files:**
- Create: `scripts/generate-voiceover.mjs`
- Create: `assets/voice/lion.mp3` (output)
- Create: `assets/voice/zebra.mp3` (output)
- Create: `assets/voice/hippo.mp3` (output)
- Create: `assets/voice/giraffe.mp3` (output)
- Create: `assets/voice/lemur.mp3` (output)

- [ ] **Step 1: Create the production voiceover script**

Create `scripts/generate-voiceover.mjs`:
```js
import "dotenv/config";
import { promises as fs } from "node:fs";
import path from "node:path";
import { ANIMALS } from "../src/animals.js";
import { VOICE_ID, MODEL_ID, VOICE_SETTINGS } from "./voice-config.mjs";

const apiKey = process.env.ELEVENLABS_API_KEY;
if (!apiKey) {
  console.error("Missing ELEVENLABS_API_KEY in .env");
  process.exit(1);
}

const force = process.argv.includes("--force");
const outDir = path.resolve("assets/voice");
await fs.mkdir(outDir, { recursive: true });

for (const animal of ANIMALS) {
  const outFile = path.resolve(animal.voicePath);
  await fs.mkdir(path.dirname(outFile), { recursive: true });

  const exists = await fs.stat(outFile).then(() => true).catch(() => false);
  if (exists && !force) {
    console.log(`  skip  ${animal.id} (already exists; pass --force to regenerate)`);
    continue;
  }

  const text = `${animal.englishWord}!`;
  const url = `https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}?output_format=mp3_44100_128`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "xi-api-key": apiKey,
      "content-type": "application/json"
    },
    body: JSON.stringify({ text, model_id: MODEL_ID, voice_settings: VOICE_SETTINGS })
  });
  if (!res.ok) {
    const errText = await res.text();
    console.error(`  FAIL  ${animal.id}: ${res.status} ${errText}`);
    process.exit(1);
  }
  const buf = Buffer.from(await res.arrayBuffer());
  await fs.writeFile(outFile, buf);
  console.log(`  ok    ${animal.id}  →  ${path.relative(process.cwd(), outFile)}`);
}

console.log("Done.");
```

- [ ] **Step 2: Run the script**

Run: `npm run voiceover:generate`

Expected output: 5 lines, one per animal, all `ok`. Files appear in `assets/voice/`.

- [ ] **Step 3: Listen and confirm**

Play each MP3 in Finder. Each should be a clear, single-word "Lion!", "Zebra!", etc. in the chosen voice.

If any clip sounds off (mispronounced, weird inflection), re-run with `--force` after tweaking `VOICE_SETTINGS` in `scripts/voice-config.mjs`:
```bash
node scripts/generate-voiceover.mjs --force
```

- [ ] **Step 4: Commit**

```bash
git add scripts/generate-voiceover.mjs assets/voice/
git commit -m "Generate ElevenLabs voice clips for the 5 animals."
```

---

## Task 9: Curate Animal Sounds

**Files:**
- Create: `assets/sounds/lion-roar.mp3`
- Create: `assets/sounds/zebra-neigh.mp3`
- Create: `assets/sounds/hippo-grunt.mp3`
- Create: `assets/sounds/giraffe-bleat.mp3`
- Create: `assets/sounds/lemur-chatter.mp3`
- Create: `assets/sounds/LICENSES.md`

This is a manual curation task — no automation.

- [ ] **Step 1: Find five sounds**

Visit https://pixabay.com/sound-effects/ (free, CC0). For each animal, search for the sound and pick a clip ≤ 2 seconds, cartoony rather than realistic where possible:
- "lion roar short"
- "zebra neigh" or "horse neigh short" (zebras are rare; horse-like neigh is a fine substitute)
- "hippo grunt" or "hippo sound"
- "giraffe sound" (very obscure — a goat/sheep bleat is a fine substitute, and is what kids' content typically uses)
- "lemur chatter" or "monkey chatter short"

For each, download the MP3 and rename it to the target filename listed above.

- [ ] **Step 2: Place files in assets/sounds/**

```bash
mkdir -p assets/sounds
mv ~/Downloads/<your-lion-file>.mp3 assets/sounds/lion-roar.mp3
mv ~/Downloads/<your-zebra-file>.mp3 assets/sounds/zebra-neigh.mp3
mv ~/Downloads/<your-hippo-file>.mp3 assets/sounds/hippo-grunt.mp3
mv ~/Downloads/<your-giraffe-file>.mp3 assets/sounds/giraffe-bleat.mp3
mv ~/Downloads/<your-lemur-file>.mp3 assets/sounds/lemur-chatter.mp3
```

(Substitute your actual download filenames.)

- [ ] **Step 3: Normalize volume (optional but recommended)**

If you have `ffmpeg` installed (`brew install ffmpeg` on Mac), normalize each clip to -3 dB peak for consistent loudness:

```bash
for f in assets/sounds/*.mp3; do
  ffmpeg -y -i "$f" -filter:a "loudnorm=I=-16:TP=-3:LRA=11" -ar 44100 "${f%.mp3}-norm.mp3"
  mv "${f%.mp3}-norm.mp3" "$f"
done
```

If you don't have `ffmpeg`, skip this step. Volume mismatch is acceptable for v1.

- [ ] **Step 4: Create LICENSES.md**

Create `assets/sounds/LICENSES.md`:
```markdown
# Animal Sounds — Licenses

All sounds are royalty-free. Attribution is not strictly required for Pixabay CC0,
but is recorded here for hygiene and traceability.

| File | Source | License | Notes |
|---|---|---|---|
| lion-roar.mp3 | https://pixabay.com/sound-effects/<paste-url> | Pixabay Content License | <paste-author-if-shown> |
| zebra-neigh.mp3 | https://pixabay.com/sound-effects/<paste-url> | Pixabay Content License | substituted with horse neigh |
| hippo-grunt.mp3 | https://pixabay.com/sound-effects/<paste-url> | Pixabay Content License | <paste-author-if-shown> |
| giraffe-bleat.mp3 | https://pixabay.com/sound-effects/<paste-url> | Pixabay Content License | substituted with bleat |
| lemur-chatter.mp3 | https://pixabay.com/sound-effects/<paste-url> | Pixabay Content License | <paste-author-if-shown> |
```

Replace each `<paste-...>` placeholder with the actual source URL and author for the sound you chose.

- [ ] **Step 5: Commit**

```bash
git add assets/sounds/
git commit -m "Add curated animal sound clips with license attribution."
```

---

## Task 10: Diorama Module — Render Animals

**Files:**
- Create: `src/diorama.js`
- Modify: `src/main.js`
- Modify: `src/styles.css`
- Modify: `index.html`

The diorama renders the 5 animals positioned in the jungle scene. No taps yet — just rendering.

- [ ] **Step 1: Update index.html for the diorama container**

Replace `index.html` contents:
```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
    <title>Safari de Sons</title>
    <link rel="stylesheet" href="/src/styles.css" />
  </head>
  <body>
    <div id="rotate-hint" hidden>
      <p>Rotate the device to landscape 🦁</p>
    </div>
    <main id="diorama" aria-label="Animal scene">
      <!-- Diorama renders animal sprites here. -->
    </main>
    <script type="module" src="/src/main.js"></script>
  </body>
</html>
```

- [ ] **Step 2: Add diorama CSS**

Replace `src/styles.css` with:
```css
:root {
  --bg-jungle-deep: #2d5a3d;
  --bg-jungle-mid: #5a8c52;
}

* { box-sizing: border-box; }

html, body {
  margin: 0;
  padding: 0;
  height: 100%;
  width: 100%;
  overflow: hidden;
  background: var(--bg-jungle-deep);
  color: #fff;
  font-family: system-ui, -apple-system, sans-serif;
  user-select: none;
  -webkit-user-select: none;
  -webkit-tap-highlight-color: transparent;
  touch-action: manipulation;
}

#diorama {
  position: relative;
  width: 100vw;
  height: 100vh;
  background-image: url("/assets/images/jungle-bg.png");
  background-size: cover;
  background-position: center;
  background-color: var(--bg-jungle-deep);
  overflow: hidden;
}

.animal {
  position: absolute;
  cursor: pointer;
  transform-origin: center bottom;
  filter: drop-shadow(2px 6px 8px rgba(0, 0, 0, 0.4));
  will-change: transform;
}

.animal img {
  display: block;
  height: 50vh;
  width: auto;
  pointer-events: none;
}

#rotate-hint {
  position: fixed;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--bg-jungle-deep);
  z-index: 9999;
  font-size: 24px;
  text-align: center;
}

#rotate-hint[hidden] { display: none; }

@media (orientation: portrait) {
  #rotate-hint { display: flex; }
  #diorama { display: none; }
}
```

- [ ] **Step 3: Implement diorama.js (render only — no taps yet)**

Create `src/diorama.js`:
```js
import { ANIMALS } from "./animals.js";

export function renderDiorama(container) {
  container.innerHTML = "";
  for (const animal of ANIMALS) {
    const el = document.createElement("button");
    el.className = "animal";
    el.dataset.id = animal.id;
    el.setAttribute("aria-label", animal.englishWord);
    el.style.left = `${animal.position.left}%`;
    el.style.bottom = `${animal.position.bottom}%`;
    el.style.transform = `translateX(-50%) scale(${animal.scale})`;
    el.style.zIndex = String(animal.zIndex);

    const img = document.createElement("img");
    img.src = `assets/images/${animal.id}.png`;
    img.alt = "";
    el.appendChild(img);

    container.appendChild(el);
  }
  return container;
}
```

- [ ] **Step 4: Wire main.js to call renderDiorama**

Replace `src/main.js`:
```js
import { renderDiorama } from "./diorama.js";

const container = document.getElementById("diorama");
renderDiorama(container);
```

- [ ] **Step 5: Verify in browser**

Run: `npm run dev`

Open http://localhost:4173/ in a browser. Resize the window wider than tall (landscape). Expected: 5 animal sprites visible on the jungle backdrop, roughly positioned across the scene.

If positions look off (animals overlapping awkwardly, off-screen, wrong order front-to-back), edit the `position`, `scale`, and `zIndex` values in `src/animals.js`. The unit tests still pass as long as percentages stay in 0–100.

Stop with `Ctrl+C` when satisfied.

- [ ] **Step 6: Commit**

```bash
git add src/diorama.js src/main.js src/styles.css index.html
git commit -m "Render diorama with 5 positioned animal sprites."
```

---

## Task 11: Wire Tap Interactions to Audio

**Files:**
- Modify: `src/diorama.js`
- Modify: `src/main.js`
- Modify: `src/styles.css`

Hook up taps: tap an animal → wiggle animation → voice clip → animal sound → sparkle.

- [ ] **Step 1: Add tap animation keyframes to styles.css**

Append to `src/styles.css`:
```css
.animal.tapped {
  animation: wiggle 600ms ease-out;
}

@keyframes wiggle {
  0%   { transform: translateX(-50%) scale(var(--scale, 1)); }
  20%  { transform: translateX(-50%) scale(calc(var(--scale, 1) * 1.12)) rotate(-4deg); }
  50%  { transform: translateX(-50%) scale(calc(var(--scale, 1) * 1.08)) rotate(4deg); }
  80%  { transform: translateX(-50%) scale(calc(var(--scale, 1) * 1.04)) rotate(-2deg); }
  100% { transform: translateX(-50%) scale(var(--scale, 1)); }
}

.sparkle {
  position: absolute;
  width: 60px;
  height: 60px;
  pointer-events: none;
  background: radial-gradient(circle, rgba(255,255,180,0.9) 0%, rgba(255,255,180,0) 70%);
  animation: sparkle-fade 1200ms ease-out forwards;
  z-index: 100;
}

@keyframes sparkle-fade {
  0%   { transform: translate(-50%, -50%) scale(0.4); opacity: 1; }
  60%  { transform: translate(-50%, -50%) scale(1.4); opacity: 0.8; }
  100% { transform: translate(-50%, -50%) scale(1.8); opacity: 0; }
}
```

- [ ] **Step 2: Update diorama.js to handle taps**

Replace `src/diorama.js`:
```js
import { ANIMALS } from "./animals.js";

export function renderDiorama(container, { onTap } = {}) {
  container.innerHTML = "";
  for (const animal of ANIMALS) {
    const el = document.createElement("button");
    el.className = "animal";
    el.dataset.id = animal.id;
    el.setAttribute("aria-label", animal.englishWord);
    el.style.left = `${animal.position.left}%`;
    el.style.bottom = `${animal.position.bottom}%`;
    el.style.setProperty("--scale", String(animal.scale));
    el.style.transform = `translateX(-50%) scale(${animal.scale})`;
    el.style.zIndex = String(animal.zIndex);

    const img = document.createElement("img");
    img.src = `assets/images/${animal.id}.png`;
    img.alt = "";
    el.appendChild(img);

    const handle = (event) => {
      event.preventDefault();
      triggerTap(el, animal, container);
      if (onTap) onTap(animal);
    };
    el.addEventListener("touchstart", handle, { passive: false });
    el.addEventListener("click", handle);

    container.appendChild(el);
  }
  return container;
}

function triggerTap(el, animal, container) {
  el.classList.remove("tapped");
  void el.offsetWidth; // force reflow so the animation restarts
  el.classList.add("tapped");
  setTimeout(() => el.classList.remove("tapped"), 700);

  const rect = el.getBoundingClientRect();
  const containerRect = container.getBoundingClientRect();
  const sparkle = document.createElement("div");
  sparkle.className = "sparkle";
  sparkle.style.left = `${rect.left - containerRect.left + rect.width / 2}px`;
  sparkle.style.top = `${rect.top - containerRect.top + rect.height / 2}px`;
  container.appendChild(sparkle);
  setTimeout(() => sparkle.remove(), 1300);
}
```

- [ ] **Step 3: Wire main.js to play audio on tap**

Replace `src/main.js`:
```js
import { renderDiorama } from "./diorama.js";
import { ANIMALS } from "./animals.js";
import { createAudioSystem, createBrowserBackend, createBrowserClock } from "./audio.js";

const container = document.getElementById("diorama");
const audio = createAudioSystem({
  backend: createBrowserBackend(),
  clock: createBrowserClock(),
  cooldownMs: 1800
});

const allClips = ANIMALS.flatMap((a) => [a.voicePath, a.soundPath]);
audio.preload(allClips);

renderDiorama(container, {
  onTap: (animal) => {
    // Spec §3.3: voice clip starts at T+150ms (tap animation gets a head start).
    setTimeout(() => {
      audio.playSequence([animal.voicePath, animal.soundPath]);
    }, 150);
  }
});
```

- [ ] **Step 4: Verify in browser**

Run: `npm run dev`

Open the URL. In landscape, tap each animal:
- Animal wiggles.
- Sparkle appears.
- ~150ms later, you hear the English word ("Lion!").
- ~1.1s after that, you hear the animal sound (roar).
- Tapping the same animal again within ~2s does nothing audio-wise.
- Tapping a *different* animal mid-clip interrupts and plays the new one.

If the audio doesn't play at all, check the browser console for autoplay errors — the first tap should unlock audio. If it's still silent, check that the MP3 paths in `dist/` (run `npm run build` to regenerate) match `assets/voice/<id>.mp3`.

Stop with `Ctrl+C`.

- [ ] **Step 5: Commit**

```bash
git add src/diorama.js src/main.js src/styles.css
git commit -m "Wire tap interactions to play voice + animal sound with wiggle and sparkle."
```

---

## Task 12: Idle Hint and Hello Wave

**Files:**
- Modify: `src/diorama.js`
- Modify: `src/styles.css`

After 2s of no taps, pulse animals one at a time. After any tap, pause hints for 4s. After 60s of no taps, one random animal does a "hello" wave.

- [ ] **Step 1: Add pulse and wave keyframes to styles.css**

Append to `src/styles.css`:
```css
.animal.pulse-hint {
  animation: pulse-hint 1500ms ease-in-out;
}

@keyframes pulse-hint {
  0%   { transform: translateX(-50%) scale(var(--scale, 1));    filter: drop-shadow(2px 6px 8px rgba(0, 0, 0, 0.4)); }
  50%  { transform: translateX(-50%) scale(calc(var(--scale, 1) * 1.06)); filter: drop-shadow(0 0 18px rgba(255, 255, 180, 0.9)) drop-shadow(2px 6px 8px rgba(0, 0, 0, 0.4)); }
  100% { transform: translateX(-50%) scale(var(--scale, 1));    filter: drop-shadow(2px 6px 8px rgba(0, 0, 0, 0.4)); }
}

.animal.hello-wave {
  animation: hello-wave 1500ms ease-in-out;
}

@keyframes hello-wave {
  0%   { transform: translateX(-50%) scale(var(--scale, 1)); }
  25%  { transform: translateX(-50%) scale(var(--scale, 1)) translateY(-12px) rotate(-6deg); }
  50%  { transform: translateX(-50%) scale(var(--scale, 1)) translateY(-8px) rotate(6deg); }
  75%  { transform: translateX(-50%) scale(var(--scale, 1)) translateY(-12px) rotate(-3deg); }
  100% { transform: translateX(-50%) scale(var(--scale, 1)); }
}
```

- [ ] **Step 2: Update diorama.js with idle behavior**

Replace `src/diorama.js`:
```js
import { ANIMALS } from "./animals.js";

const IDLE_HINT_DELAY_MS = 2000;
const HINT_PAUSE_AFTER_TAP_MS = 4000;
const HINT_INTERVAL_MS = 1500;
const HELLO_WAVE_DELAY_MS = 60_000;

export function renderDiorama(container, { onTap } = {}) {
  container.innerHTML = "";
  const animalEls = new Map();

  for (const animal of ANIMALS) {
    const el = document.createElement("button");
    el.className = "animal";
    el.dataset.id = animal.id;
    el.setAttribute("aria-label", animal.englishWord);
    el.style.left = `${animal.position.left}%`;
    el.style.bottom = `${animal.position.bottom}%`;
    el.style.setProperty("--scale", String(animal.scale));
    el.style.transform = `translateX(-50%) scale(${animal.scale})`;
    el.style.zIndex = String(animal.zIndex);

    const img = document.createElement("img");
    img.src = `assets/images/${animal.id}.png`;
    img.alt = "";
    el.appendChild(img);

    const handle = (event) => {
      event.preventDefault();
      triggerTap(el, animal, container);
      idle.notifyTap();
      if (onTap) onTap(animal);
    };
    el.addEventListener("touchstart", handle, { passive: false });
    el.addEventListener("click", handle);

    container.appendChild(el);
    animalEls.set(animal.id, el);
  }

  const idle = createIdleScheduler(animalEls);
  idle.start();
  return container;
}

function triggerTap(el, animal, container) {
  el.classList.remove("tapped");
  void el.offsetWidth;
  el.classList.add("tapped");
  setTimeout(() => el.classList.remove("tapped"), 700);

  const rect = el.getBoundingClientRect();
  const containerRect = container.getBoundingClientRect();
  const sparkle = document.createElement("div");
  sparkle.className = "sparkle";
  sparkle.style.left = `${rect.left - containerRect.left + rect.width / 2}px`;
  sparkle.style.top = `${rect.top - containerRect.top + rect.height / 2}px`;
  container.appendChild(sparkle);
  setTimeout(() => sparkle.remove(), 1300);
}

function createIdleScheduler(animalEls) {
  const ids = [...animalEls.keys()];
  let cursor = 0;
  let pulseTimer = null;
  let helloTimer = null;
  let lastInteractionAt = performance.now();

  function pulseNext() {
    const id = ids[cursor % ids.length];
    cursor += 1;
    const el = animalEls.get(id);
    el.classList.remove("pulse-hint");
    void el.offsetWidth;
    el.classList.add("pulse-hint");
    setTimeout(() => el.classList.remove("pulse-hint"), 1500);
  }

  function schedulePulse() {
    clearTimeout(pulseTimer);
    pulseTimer = setTimeout(() => {
      pulseNext();
      pulseTimer = setTimeout(loop, HINT_INTERVAL_MS);
    }, IDLE_HINT_DELAY_MS);
  }

  function loop() {
    pulseNext();
    pulseTimer = setTimeout(loop, HINT_INTERVAL_MS);
  }

  function scheduleHello() {
    clearTimeout(helloTimer);
    helloTimer = setTimeout(() => {
      const idleMs = performance.now() - lastInteractionAt;
      if (idleMs >= HELLO_WAVE_DELAY_MS) {
        const id = ids[Math.floor(Math.random() * ids.length)];
        const el = animalEls.get(id);
        el.classList.remove("hello-wave");
        void el.offsetWidth;
        el.classList.add("hello-wave");
        setTimeout(() => el.classList.remove("hello-wave"), 1500);
      }
      scheduleHello();
    }, HELLO_WAVE_DELAY_MS);
  }

  return {
    start() {
      schedulePulse();
      scheduleHello();
    },
    notifyTap() {
      lastInteractionAt = performance.now();
      clearTimeout(pulseTimer);
      pulseTimer = setTimeout(loop, HINT_PAUSE_AFTER_TAP_MS);
    }
  };
}
```

- [ ] **Step 3: Verify in browser**

Run: `npm run dev`

Open the URL, leave the window in foreground without tapping for 5 seconds. Expected: animals start pulsing one at a time, ~1.5s apart, with a soft yellow glow.

Tap any animal. Expected: pulse cycle pauses for 4s, then resumes.

(The 60-second hello-wave is hard to verify without waiting — trust the code; we'll cover it in E2E with a faked timer in Task 16.)

Stop with `Ctrl+C`.

- [ ] **Step 4: Commit**

```bash
git add src/diorama.js src/styles.css
git commit -m "Add idle pulse-hint cycle and 60s hello-wave behavior."
```

---

## Task 13: PWA Manifest and iOS Tags

**Files:**
- Create: `manifest.webmanifest`
- Modify: `index.html`

- [ ] **Step 1: Create the manifest**

Create `manifest.webmanifest`:
```json
{
  "name": "Safari de Sons",
  "short_name": "Safari",
  "description": "Animal sounds with Natan",
  "start_url": "./",
  "scope": "./",
  "display": "fullscreen",
  "orientation": "landscape",
  "background_color": "#2d5a3d",
  "theme_color": "#2d5a3d",
  "icons": [
    { "src": "icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "icon-512.png", "sizes": "512x512", "type": "image/png", "purpose": "any maskable" }
  ]
}
```

- [ ] **Step 2: Add PWA + iOS tags to index.html**

Replace the `<head>` of `index.html` with:
```html
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
    <title>Safari de Sons</title>

    <link rel="manifest" href="manifest.webmanifest" />
    <meta name="theme-color" content="#2d5a3d" />

    <meta name="apple-mobile-web-app-capable" content="yes" />
    <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
    <meta name="apple-mobile-web-app-title" content="Safari" />
    <link rel="apple-touch-icon" href="icon-192.png" />

    <!-- Single iOS splash for iPhone 14 / 15 (1170x2532). Other phones get the
         theme-color background as a fallback — see spec §6.2. -->
    <link rel="apple-touch-startup-image" href="splash-1170x2532.png"
          media="(device-width: 390px) and (device-height: 844px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)" />

    <link rel="stylesheet" href="/src/styles.css" />
  </head>
```

- [ ] **Step 3: Verify manifest is served**

Run: `npm run dev`

Open http://localhost:4173/manifest.webmanifest in a browser. Expected: the JSON above is displayed. (404 means the manifest is in the wrong place — should be at the project root.)

Stop with `Ctrl+C`.

- [ ] **Step 4: Commit**

```bash
git add manifest.webmanifest index.html
git commit -m "Add PWA manifest and iOS-specific meta tags."
```

---

## Task 14: PWA Icons and iOS Splash

**Files:**
- Create: `scripts/make-icons.mjs`
- Create: `public/icon-192.png`
- Create: `public/icon-512.png`
- Create: `public/splash-1170x2532.png`

Vite copies anything in `public/` to the build root, so these end up at `dist/icon-192.png`, `dist/splash-1170x2532.png` etc., matching the manifest and `index.html`.

- [ ] **Step 1: Create the asset-generation script**

Create `scripts/make-icons.mjs`:
```js
import { promises as fs } from "node:fs";
import path from "node:path";
import sharp from "sharp";

const lionPath = path.resolve("assets/images/lion.png");
const outDir = path.resolve("public");
await fs.mkdir(outDir, { recursive: true });

const ICON_SIZES = [192, 512];
const SPLASH = { width: 1170, height: 2532 }; // iPhone 14/15 portrait
const BG_COLOR = { r: 45, g: 90, b: 61, alpha: 1 };

// 1. Icons (square, lion centered, full bleed).
for (const size of ICON_SIZES) {
  const bg = await sharp({
    create: { width: size, height: size, channels: 4, background: BG_COLOR }
  })
    .png()
    .toBuffer();

  const lionTarget = Math.round(size * 0.78);
  const lion = await sharp(lionPath).resize({ height: lionTarget, fit: "inside" }).toBuffer();
  const lionMeta = await sharp(lion).metadata();

  const left = Math.round((size - lionMeta.width) / 2);
  const top = Math.round((size - lionMeta.height) / 2);

  const out = path.join(outDir, `icon-${size}.png`);
  await sharp(bg)
    .composite([{ input: lion, top, left }])
    .png()
    .toFile(out);
  console.log(`  → ${path.relative(process.cwd(), out)}`);
}

// 2. iOS splash (portrait iPhone 14/15, lion centered ~40% width).
{
  const bg = await sharp({
    create: { width: SPLASH.width, height: SPLASH.height, channels: 4, background: BG_COLOR }
  })
    .png()
    .toBuffer();

  const lionTarget = Math.round(SPLASH.width * 0.55);
  const lion = await sharp(lionPath).resize({ width: lionTarget, fit: "inside" }).toBuffer();
  const lionMeta = await sharp(lion).metadata();

  const left = Math.round((SPLASH.width - lionMeta.width) / 2);
  const top = Math.round((SPLASH.height - lionMeta.height) / 2);

  const out = path.join(outDir, `splash-${SPLASH.width}x${SPLASH.height}.png`);
  await sharp(bg)
    .composite([{ input: lion, top, left }])
    .png()
    .toFile(out);
  console.log(`  → ${path.relative(process.cwd(), out)}`);
}
```

- [ ] **Step 2: Run the script**

Run: `node scripts/make-icons.mjs`

Expected output: 3 file paths printed (2 icons + 1 splash). Open them in Preview:
- `icon-192.png` and `icon-512.png` — green squares with the lion centered.
- `splash-1170x2532.png` — tall green portrait with the lion centered.

- [ ] **Step 3: Verify served by Vite**

Run: `npm run dev`

Open http://localhost:4173/icon-192.png — the icon displays.
Open http://localhost:4173/splash-1170x2532.png — the splash displays.

Stop with `Ctrl+C`.

- [ ] **Step 4: Commit**

```bash
git add scripts/make-icons.mjs public/icon-192.png public/icon-512.png public/splash-1170x2532.png
git commit -m "Generate PWA icons (192, 512) and iPhone 14 splash."
```

---

## Task 15: Service Worker (Offline)

**Files:**
- Create: `public/service-worker.js`
- Modify: `src/main.js`

The SW precaches the app shell + all assets on install, serves cache-first.

- [ ] **Step 1: Create the service worker**

Create `public/service-worker.js`:
```js
const CACHE_VERSION = "v1";
const CACHE_NAME = `safari-de-sons-${CACHE_VERSION}`;

const PRECACHE = [
  "./",
  "./index.html",
  "./manifest.webmanifest",
  "./icon-192.png",
  "./icon-512.png",
  "./splash-1170x2532.png",
  "./assets/images/jungle-bg.png",
  "./assets/images/lion.png",
  "./assets/images/zebra.png",
  "./assets/images/hippo.png",
  "./assets/images/giraffe.png",
  "./assets/images/lemur.png",
  "./assets/voice/lion.mp3",
  "./assets/voice/zebra.mp3",
  "./assets/voice/hippo.mp3",
  "./assets/voice/giraffe.mp3",
  "./assets/voice/lemur.mp3",
  "./assets/sounds/lion-roar.mp3",
  "./assets/sounds/zebra-neigh.mp3",
  "./assets/sounds/hippo-grunt.mp3",
  "./assets/sounds/giraffe-bleat.mp3",
  "./assets/sounds/lemur-chatter.mp3"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((k) => k.startsWith("safari-de-sons-") && k !== CACHE_NAME)
          .map((k) => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  event.respondWith(
    caches.match(event.request).then((cached) => cached || fetch(event.request))
  );
});
```

- [ ] **Step 2: Register the service worker from main.js**

Append to `src/main.js`:
```js

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./service-worker.js").catch(() => {
      // SW registration failures are silent in dev.
    });
  });
}
```

- [ ] **Step 3: Verify in production preview**

Service workers don't reliably register against the Vite dev server (HMR conflicts). Test against the production build:

```bash
npm run build
npm run preview
```

Open http://localhost:4173/. In Chrome DevTools → Application → Service Workers, verify "safari-de-sons-v1" is activated. In Application → Cache Storage, verify all 21 precache entries are present.

Stop with `Ctrl+C`.

- [ ] **Step 4: Verify offline behavior**

`npm run preview` again. Open the URL. In DevTools → Network, set throttling to "Offline". Hard-refresh. Expected: page still loads, animals visible, taps still trigger sounds.

Stop with `Ctrl+C`.

- [ ] **Step 5: Commit**

```bash
git add public/service-worker.js src/main.js
git commit -m "Add cache-first service worker for offline support."
```

---

## Task 16: E2E Tests with Playwright

**Files:**
- Create: `playwright.config.mjs`
- Create: `tests/e2e/tap-flow.spec.mjs`
- Create: `tests/e2e/pwa.spec.mjs`
- Create: `tests/e2e/idle-hint.spec.mjs`

- [ ] **Step 1: Install Playwright browsers**

Run: `npx playwright install --with-deps chromium`

Expected: Chromium downloads to a Playwright cache. May take 1–2 min on first run.

- [ ] **Step 2: Create playwright config**

Create `playwright.config.mjs`:
```js
import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  testMatch: ["**/*.spec.mjs"],
  webServer: {
    command: "npm run preview",
    url: "http://localhost:4173",
    reuseExistingServer: true,
    timeout: 60000
  },
  use: {
    baseURL: "http://localhost:4173",
    trace: "retain-on-failure"
  },
  projects: [
    {
      name: "mobile",
      use: { ...devices["iPhone 14 landscape"] }
    }
  ]
});
```

> **Note:** The device profile is `"iPhone 14 landscape"` (not `"iPhone 14"`). The base `iPhone 14` is portrait, and the app's CSS hides the diorama in portrait mode (it's a landscape-locked PWA), which would cause `waitForSelector(".animal")` to time out. The landscape variant uses WebKit so `npx playwright install webkit` is also needed (`chromium` alone is not enough).

- [ ] **Step 3: Create tap-flow E2E test**

Create `tests/e2e/tap-flow.spec.mjs`:
```js
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
```

- [ ] **Step 4: Create PWA E2E test**

Create `tests/e2e/pwa.spec.mjs`:
```js
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
```

- [ ] **Step 5: Create idle-hint E2E test**

Create `tests/e2e/idle-hint.spec.mjs`:
```js
import { test, expect } from "@playwright/test";

test("after 2.5s of no taps, an animal has the pulse-hint class", async ({ page }) => {
  await page.goto("/");
  await page.waitForSelector(".animal");
  await page.waitForTimeout(2500);
  const count = await page.locator(".animal.pulse-hint").count();
  expect(count).toBeGreaterThanOrEqual(1);
});
```

- [ ] **Step 6: Run all tests**

Run:
```bash
npm run build
npm run test:e2e
```

Expected: 5 tests pass (2 in tap-flow.spec.mjs, 2 in pwa.spec.mjs, 1 in idle-hint.spec.mjs). If any fail:
- Audio test fails → check that `assets/voice/*.mp3` exist in `dist/` after build (Vite should copy `assets/` automatically).
- SW test times out → SW only registers in production preview; verify `npm run preview` was the server invoked.

Stop the preview server if Playwright didn't auto-stop it.

- [ ] **Step 7: Commit**

```bash
git add playwright.config.mjs tests/e2e/
git commit -m "Add Playwright E2E tests for tap flow, PWA manifest/SW, and idle hint."
```

---

## Task 17: Add Tests to CI

**Files:**
- Modify: `.github/workflows/deploy.yml`

- [ ] **Step 1: Add test steps to the build job**

Replace `.github/workflows/deploy.yml`:
```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: pages
  cancel-in-progress: true

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm
      - run: npm ci
      - run: npm test
      - run: npx playwright install --with-deps chromium
      - run: npm run build
      - run: npm run test:e2e

  build:
    needs: test
    if: github.event_name == 'push' && github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm
      - run: npm ci
      - run: npm run build
      - uses: actions/upload-pages-artifact@v3
        with:
          path: dist

  deploy:
    needs: build
    if: github.event_name == 'push' && github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - id: deployment
        uses: actions/deploy-pages@v4
```

- [ ] **Step 2: Commit and push**

```bash
git add .github/workflows/deploy.yml
git commit -m "Run unit and E2E tests in CI before deploying."
git push
```

- [ ] **Step 3: Verify on GitHub**

Manual: Open the Actions tab. The new workflow run should show 3 jobs: `test`, `build`, `deploy`. All three must succeed for the deploy to land.

If a job fails, click into the logs. Most likely: a Playwright test that worked locally but flaked in CI (audio timing). Fix by adjusting the `waitForTimeout` value in the failing test, push the fix, repeat.

---

## Task 18: Roadmap Documentation

**Files:**
- Create: `docs/roadmap.md`
- Create: `scripts/flow-shot-list-v2.md`

- [ ] **Step 1: Create docs/roadmap.md**

Create `docs/roadmap.md`:
```markdown
# Safari de Sons — Roadmap

This is the documented forward plan. Each item is build-ready (spec'd in the v1 design doc, ordered by engine reuse) but **not yet committed to**. Build only after observing how Natan engages with the previous step.

## Future games (in build order)

The 8 other games brainstormed alongside Safari de Sons, sequenced by engine reuse:

| # | Game | Skill | New mechanics added |
|---|---|---|---|
| 2 | Cadê? Achou! (Peek-a-Boo Safari) | Object permanence + vocab | Hidden/revealed state on the existing animal sprites. Reuses ~80% of Safari's engine. |
| 3 | Cadê o Nariz do Natan? (Body Parts) | Body-part vocab | New scene (a Natan face), but same tap-target engine. First game with a Natan-faced asset. |
| 4 | Conta os Bichinhos (Sugar Bug Counting) | Counting 1–3 | Simple count tracker. Reuses existing Bichinhos do Açúcar art from the storybook. |
| 5 | Frutas dos Lêmures (Color Hunt) | Colors | First game with a "right answer" — adds correct/try-again audio pattern. |
| 6 | Alimenta o Hipopótamo (Feed the Hippo) | Food vocab + drag-drop | First drag-drop game. Adds touch-gesture handling. |
| 7 | Sombras dos Animais (Shadow Match) | Shape recognition | Reuses Color Hunt's right-answer pattern + Feed Hippo's drag-drop. |
| 8 | Vestir o Leão (Dress the Lion) | Clothing vocab | Compositional drag-drop (multiple items onto one target). |
| 9 | Dia e Noite (Morning vs Bedtime) | Routine sequencing | Most complex — sorting into two zones. Save for last. |

Bath/hygiene game is explicitly excluded — already covered by the existing tooth-brushing storybook (`natan-escova-floresta`).

## Safari de Sons v2 (this game, scaled up)

Build only after Natan has played v1 for several weeks AND continues to engage AND the v1 has demonstrated value as a learning tool.

- **Multi-pose sprites** for each existing animal (idle / tap-react / wave / jump). Replaces single-pose CSS-transform animations with proper sprite-frame switches. See `scripts/flow-shot-list-v2.md` for Flow prompts.
- **Expansion roster** — 10 additional animals (monkey, elephant, parrot, frog, snake, owl, etc.). Drop-in extends animals.js + reruns the voiceover script.
- **Sticker book** — small persistent UI element where each played animal "sticks" a copy onto a virtual page. Adds a sense of progression without a fail state.

## Validation rules

- **Wait at least 2 weeks** between shipping any game and starting the next. Watch how Natan plays.
- **Cancel a planned game** if observation suggests he won't engage. Don't sunk-cost previous brainstorming.
- **Each game has its own repo, deploy, and PWA install.** No shared bundle. Update games independently.
```

- [ ] **Step 2: Create scripts/flow-shot-list-v2.md**

Create `scripts/flow-shot-list-v2.md`:
```markdown
# Flow Shot List — v2 Sprite Expansion

These prompts are for Google Labs Flow image generation when scaling up Safari de Sons. Use the existing `natan-escova-floresta/assets/generated/character-sheet.png` as a style reference for every prompt.

## Style guardrails (apply to all prompts)

- "Polished 3D cartoon illustration, expressive faces, rounded shapes, tropical jungle and savanna palette, bedtime warmth"
- "Original character — not Madagascar, not any existing movie character"
- "Transparent background"
- "Single character centered, full body visible"

## Multi-pose sprites for existing animals

For each of the 5 v1 animals, generate 4 pose variants on transparent background:

### Lion
- **lion-idle.png** — "theatrical lion with warm mane, standing relaxed, friendly smile, looking forward"
- **lion-tap-react.png** — "same lion, eyes wide with delighted surprise, mouth open in joyful exclamation, paws slightly raised"
- **lion-wave.png** — "same lion waving one paw above his head, big friendly grin, head tilted"
- **lion-jump.png** — "same lion mid-jump, all four paws off the ground, delighted laughing face"

(Repeat the same 4-pose pattern for zebra, hippo, giraffe, lemur — adapt the species-specific descriptors from the original `natan-escova-floresta/assets/prompts/image-prompts.md`.)

## Expansion roster (10 new animals)

Each gets the same 4 poses (idle, tap-react, wave, jump):

1. **Monkey** — "playful curious monkey with long tail, brown fur, big eyes"
2. **Elephant** — "gentle elephant with soft gray skin, kind eyes, small tusks, slightly cartoony"
3. **Parrot** — "colorful tropical parrot, red/yellow/blue feathers, perched"
4. **Frog** — "bright green tree frog with big round eyes"
5. **Snake** — "friendly green snake, smiling, no fangs visible (toddler-friendly)"
6. **Owl** — "warm tropical owl with big amber eyes, fluffy feathers"
7. **Toucan** — "tropical toucan with oversized colorful beak"
8. **Crocodile** — "friendly cartoon crocodile, smiling, soft features (toddler-friendly)"
9. **Butterfly** — "large cartoon butterfly with patterned wings"
10. **Pig** — "round happy pig, pink, big smile (Peppa-adjacent for Natan's preferences but still original)"

## Workflow notes

- Generate all 60 sprites (5 × 4 + 10 × 4) in one Flow session for style consistency.
- After download, run a chroma-key pass via `scripts/crop-character-sheet.mjs` (extended) to ensure clean alpha.
- Update `src/animals.js` to reference the new sprite-set paths and add the 10 new entries.
- Re-run `npm run voiceover:generate` to add voice clips for the 10 new animals.
- Source new animal sounds from Pixabay; update `LICENSES.md`.
```

- [ ] **Step 3: Commit**

```bash
git add docs/roadmap.md scripts/flow-shot-list-v2.md
git commit -m "Document v2 roadmap and Flow shot list for sprite expansion."
git push
```

---

## Task 19: iPhone Manual QA

**Files:** none — manual checklist.

This is the final acceptance gate. Cannot be automated.

- [ ] **Step 1: Confirm latest deploy is live**

Manual: Open the GitHub Pages URL on your Mac in a browser. Verify it shows the diorama, the latest commits are reflected (compare against your local repo).

- [ ] **Step 2: Open on iPhone in Safari**

On the iPhone, open Safari, paste the GitHub Pages URL. Wait for full load. Tap an animal — confirm voice + sound play.

- [ ] **Step 3: Add to Home Screen**

In Safari, tap **Share → Add to Home Screen**. Name it "Safari" (or accept default). Tap **Add**.

Find the new icon on the home screen — should be the lion-on-green PWA icon.

- [ ] **Step 4: Launch from home screen**

Tap the icon. Expected:
- Opens fullscreen (no Safari chrome).
- Loads quickly (offline-capable now since SW pre-cached on first visit).
- Diorama renders in landscape.

- [ ] **Step 5: Run the QA checklist (real-world)**

Tap each animal. For each, verify:
- [ ] Animal wiggles immediately on tap (< 100ms perceived latency).
- [ ] English word plays first ("Lion!").
- [ ] Animal sound plays after the word (~1s gap).
- [ ] Sparkle particle appears.
- [ ] Tapping the same animal again within 2s does nothing audio-wise (animation still plays).
- [ ] Tapping a different animal interrupts the current clip.
- [ ] After 2s of no taps, idle hint pulses cycle through animals.
- [ ] Audio volume is comfortable at the iPhone's typical listening volume.

- [ ] **Step 6: Test airplane mode**

Enable airplane mode on the iPhone. Force-quit Safari and the PWA. Re-launch the PWA from the home-screen icon. Expected: still loads, fully functional offline.

- [ ] **Step 7: Hand it to Natan**

Sit next to him with the iPhone, demo a tap or two ("Look! Lion!"), then hand it over. Watch what he does. Note anything that confuses him or misses — adjust v2 plans accordingly.

- [ ] **Step 8: Update spec status**

Manual: Edit `docs/superpowers/specs/2026-04-25-safari-de-sons-design.md` line 4:
```markdown
**Status:** Approved (brainstorming complete; awaiting implementation plan)
```
to:
```markdown
**Status:** v1 shipped <date>
```

Commit:
```bash
git add docs/superpowers/specs/2026-04-25-safari-de-sons-design.md
git commit -m "Mark v1 as shipped."
git push
```

---

## Done.

Total: 19 tasks. Estimated wall-clock time: 4–8 hours of focused work, more if Flow/cropping iteration is heavy or if Natan supplies real-time feedback during QA.
