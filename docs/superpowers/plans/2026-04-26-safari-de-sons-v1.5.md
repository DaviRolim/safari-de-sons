# Safari de Sons v1.5 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Extend Safari de Sons from a single jungle scene to a horizontally-paged two-scene world (Jungle + Backyard), add 5 new animals (cow, dog, cat, turtle, bird) and a tappable Natan in each scene, with a Brazilian-Portuguese voice override for Natan's name.

**Architecture:** Vanilla HTML/CSS/JS + ESM modules, same as v1. Adds a `scenes.js` module that owns swipe/snap/page-dots and emits `onChange(sceneId)`. The `roster.js` (renamed from `animals.js`) becomes a 12-entry array with a `scene` field. The diorama renders two scene panels in a horizontally-scroll-snapping track. Natan's tap reuses the same play-sequence engine but routes to a Brazilian Portuguese ElevenLabs voice via a per-entry voice override.

**Tech Stack:** Node 20+, Vite, Playwright, `node --test`, ElevenLabs HTTP API, Google Labs Flow (asset generation, browser-driven), Pixabay (sound effects, manual curation), `rembg` (sprite alpha refinement).

**Spec:** [`docs/superpowers/specs/2026-04-26-safari-de-sons-v1.5-design.md`](../specs/2026-04-26-safari-de-sons-v1.5-design.md)

---

## Pre-flight

- [ ] **Verify clean working tree.** Run `git -C /Users/davirolim/playground/creatives/safari-de-sons status`. Expected: `nothing to commit, working tree clean` (the spec was committed at the end of brainstorming).

- [ ] **Verify v1 tests pass before any change.** Run `npm test`. Expected: all tests in `tests/unit/animals.test.js` and `tests/unit/audio.test.js` pass. This is the green baseline.

- [ ] **Verify `npm run dev` boots.** Run `npm run dev`, open `http://localhost:5173/`, confirm the existing 5-animal jungle scene loads. Stop with Ctrl+C. This is the visual baseline.

---

## Task 1: Rename `animals.js` → `roster.js`, add `scene` field to v1 entries

**Files:**
- Rename: `src/animals.js` → `src/roster.js`
- Rename: `tests/unit/animals.test.js` → `tests/unit/roster.test.js`
- Modify: `src/diorama.js:1` (import path + symbol name)
- Modify: `src/main.js:2` (import path + symbol name)
- Modify: `scripts/generate-voiceover.mjs:4` (import path + symbol name)

- [ ] **Step 1: Rename the source file with `git mv` to preserve history**

```bash
git mv src/animals.js src/roster.js
git mv tests/unit/animals.test.js tests/unit/roster.test.js
```

- [ ] **Step 2: Update the test file to expect `ROSTER` (not `ANIMALS`) and assert a `scene` field on every entry**

Replace the entire contents of `tests/unit/roster.test.js`:

```js
import { test } from "node:test";
import assert from "node:assert/strict";
import { ROSTER, SCENES } from "../../src/roster.js";

test("SCENES exports the two scene IDs in display order", () => {
  assert.deepEqual(SCENES, ["jungle", "backyard"]);
});

test("ROSTER exports an array of 5 entries (jungle scene only, after Task 1)", () => {
  assert.ok(Array.isArray(ROSTER));
  assert.equal(ROSTER.length, 5);
});

test("each entry has the required v1 shape", () => {
  for (const entry of ROSTER) {
    assert.equal(typeof entry.id, "string", `id missing on ${JSON.stringify(entry)}`);
    assert.equal(typeof entry.englishWord, "string");
    assert.equal(typeof entry.voicePath, "string");
    assert.equal(typeof entry.soundPath, "string");
    assert.ok(entry.voicePath.endsWith(".mp3"));
    assert.ok(entry.soundPath.endsWith(".mp3"));
    assert.equal(typeof entry.position, "object");
    assert.equal(typeof entry.position.left, "number");
    assert.equal(typeof entry.position.bottom, "number");
    assert.equal(typeof entry.scale, "number");
    assert.equal(typeof entry.zIndex, "number");
  }
});

test("each entry declares its scene as 'jungle' or 'backyard'", () => {
  for (const entry of ROSTER) {
    assert.ok(["jungle", "backyard"].includes(entry.scene), `bad scene on ${entry.id}: ${entry.scene}`);
  }
});

test("entry IDs are unique", () => {
  const ids = ROSTER.map((e) => e.id);
  assert.equal(new Set(ids).size, ids.length);
});

test("v1 jungle animals are present", () => {
  const ids = ROSTER.filter((e) => e.scene === "jungle").map((e) => e.id).sort();
  assert.deepEqual(ids, ["giraffe", "hippo", "lemur", "lion", "zebra"]);
});

test("positions are within 0-100% range", () => {
  for (const entry of ROSTER) {
    assert.ok(entry.position.left >= 0 && entry.position.left <= 100);
    assert.ok(entry.position.bottom >= 0 && entry.position.bottom <= 100);
  }
});
```

- [ ] **Step 3: Run the test, verify it fails for the right reason**

Run: `npm test`
Expected: failures saying `ROSTER` and `SCENES` are not exported, plus the scene-field assertion fails.

- [ ] **Step 4: Update `src/roster.js` — rename export, add `scene: "jungle"` to each entry, add `SCENES` export**

Replace the contents of `src/roster.js` with:

```js
export const SCENES = ["jungle", "backyard"];

export const ROSTER = [
  {
    id: "lion",
    scene: "jungle",
    englishWord: "Lion",
    voicePath: "assets/voice/lion.mp3",
    soundPath: "assets/sounds/lion-roar.mp3",
    position: { left: 14, bottom: 18 },
    scale: 1.0,
    zIndex: 3
  },
  {
    id: "zebra",
    scene: "jungle",
    englishWord: "Zebra",
    voicePath: "assets/voice/zebra.mp3",
    soundPath: "assets/sounds/zebra-neigh.mp3",
    position: { left: 32, bottom: 22 },
    scale: 0.95,
    zIndex: 2
  },
  {
    id: "hippo",
    scene: "jungle",
    englishWord: "Hippo",
    voicePath: "assets/voice/hippo.mp3",
    soundPath: "assets/sounds/hippo-grunt.mp3",
    position: { left: 50, bottom: 8 },
    scale: 1.1,
    zIndex: 4
  },
  {
    id: "giraffe",
    scene: "jungle",
    englishWord: "Giraffe",
    voicePath: "assets/voice/giraffe.mp3",
    soundPath: "assets/sounds/giraffe-bleat.mp3",
    position: { left: 72, bottom: 25 },
    scale: 1.05,
    zIndex: 2
  },
  {
    id: "lemur",
    scene: "jungle",
    englishWord: "Lemur",
    voicePath: "assets/voice/lemur.mp3",
    soundPath: "assets/sounds/lemur-chatter.mp3",
    position: { left: 86, bottom: 12 },
    scale: 0.85,
    zIndex: 3
  }
];
```

(Note: positions match v1 exactly. Scene-1 position adjustments to clear Natan happen in Task 6 when the bg is regenerated.)

- [ ] **Step 5: Update `src/diorama.js:1` import**

Replace line 1 of `src/diorama.js`:

```js
import { ROSTER } from "./roster.js";
```

Then in the same file, replace `for (const animal of ANIMALS)` with `for (const animal of ROSTER)`.

- [ ] **Step 6: Update `src/main.js:2` import**

Replace line 2 of `src/main.js`:

```js
import { ROSTER } from "./roster.js";
```

Then on line 12, replace `ANIMALS.flatMap` with `ROSTER.flatMap`.

- [ ] **Step 7: Update `scripts/generate-voiceover.mjs:4` import**

Replace line 4 of `scripts/generate-voiceover.mjs`:

```js
import { ROSTER } from "../src/roster.js";
```

Then on line 17, replace `for (const animal of ANIMALS)` with `for (const animal of ROSTER)`.

- [ ] **Step 8: Run unit tests, verify pass**

Run: `npm test`
Expected: all tests pass.

- [ ] **Step 9: Smoke-test in browser**

Run: `npm run dev`, open `http://localhost:5173/`, confirm the 5 animals still render and tap. Stop with Ctrl+C.

- [ ] **Step 10: Commit**

```bash
git add -A
git commit -m "Rename animals.js to roster.js, add scene field to v1 entries."
```

---

## Task 2: Add 6 new roster entries (5 backyard animals + 2 Natan sprites)

**Files:**
- Modify: `src/roster.js` (append entries)
- Modify: `tests/unit/roster.test.js` (extend assertions)

- [ ] **Step 1: Update the test to expect 12 entries with the new IDs**

Replace the `ROSTER exports an array of 5 entries...` test in `tests/unit/roster.test.js` with:

```js
test("ROSTER exports 12 entries — 6 per scene", () => {
  assert.ok(Array.isArray(ROSTER));
  assert.equal(ROSTER.length, 12);
  const jungle = ROSTER.filter((e) => e.scene === "jungle");
  const backyard = ROSTER.filter((e) => e.scene === "backyard");
  assert.equal(jungle.length, 6);
  assert.equal(backyard.length, 6);
});
```

Replace the `v1 jungle animals are present` test with:

```js
test("v1 jungle animals (plus jungle Natan) are present", () => {
  const ids = ROSTER.filter((e) => e.scene === "jungle").map((e) => e.id).sort();
  assert.deepEqual(ids, ["giraffe", "hippo", "lemur", "lion", "natan-jungle", "zebra"]);
});

test("backyard animals (plus backyard Natan) are present", () => {
  const ids = ROSTER.filter((e) => e.scene === "backyard").map((e) => e.id).sort();
  assert.deepEqual(ids, ["bird", "cat", "cow", "dog", "natan-backyard", "turtle"]);
});

test("Natan entries declare the br-pt voice override", () => {
  const natanEntries = ROSTER.filter((e) => e.id.startsWith("natan-"));
  assert.equal(natanEntries.length, 2);
  for (const entry of natanEntries) {
    assert.equal(entry.voice, "br-pt");
    assert.equal(entry.englishWord, "Natan");
    assert.ok(entry.spritePath?.endsWith(".png"), `${entry.id} should declare a spritePath`);
  }
});

test("non-Natan entries either omit voice or set voice='british'", () => {
  for (const entry of ROSTER) {
    if (entry.id.startsWith("natan-")) continue;
    if ("voice" in entry) assert.equal(entry.voice, "british");
  }
});
```

- [ ] **Step 2: Run tests, verify they fail for the right reason**

Run: `npm test`
Expected: failures saying ROSTER has 5 entries, not 12; Natan entries missing.

- [ ] **Step 3: Append the 7 new entries (5 animals + 2 Natans) to `src/roster.js`**

In `src/roster.js`, replace the closing `];` of the ROSTER array with:

```js
  ,
  {
    id: "natan-jungle",
    scene: "jungle",
    englishWord: "Natan",
    voice: "br-pt",
    voicePath: "assets/voice/natan.mp3",
    soundPath: "assets/sounds/natan-giggle.mp3",
    spritePath: "assets/images/natan-jungle.png",
    position: { left: 50, bottom: 12 },
    scale: 1.0,
    zIndex: 5
  },
  {
    id: "cow",
    scene: "backyard",
    englishWord: "Cow",
    voicePath: "assets/voice/cow.mp3",
    soundPath: "assets/sounds/cow-moo.mp3",
    position: { left: 14, bottom: 20 },
    scale: 1.0,
    zIndex: 2
  },
  {
    id: "dog",
    scene: "backyard",
    englishWord: "Dog",
    voicePath: "assets/voice/dog.mp3",
    soundPath: "assets/sounds/dog-bark.mp3",
    position: { left: 32, bottom: 12 },
    scale: 0.9,
    zIndex: 4
  },
  {
    id: "natan-backyard",
    scene: "backyard",
    englishWord: "Natan",
    voice: "br-pt",
    voicePath: "assets/voice/natan.mp3",
    soundPath: "assets/sounds/natan-giggle.mp3",
    spritePath: "assets/images/natan-backyard.png",
    position: { left: 48, bottom: 12 },
    scale: 1.0,
    zIndex: 5
  },
  {
    id: "cat",
    scene: "backyard",
    englishWord: "Cat",
    voicePath: "assets/voice/cat.mp3",
    soundPath: "assets/sounds/cat-meow.mp3",
    position: { left: 62, bottom: 10 },
    scale: 0.85,
    zIndex: 3
  },
  {
    id: "bird",
    scene: "backyard",
    englishWord: "Bird",
    voicePath: "assets/voice/bird.mp3",
    soundPath: "assets/sounds/bird-tweet.mp3",
    position: { left: 80, bottom: 50 },
    scale: 0.7,
    zIndex: 2
  },
  {
    id: "turtle",
    scene: "backyard",
    englishWord: "Turtle",
    voicePath: "assets/voice/turtle.mp3",
    soundPath: "assets/sounds/turtle-splash.mp3",
    position: { left: 88, bottom: 8 },
    scale: 0.8,
    zIndex: 4
  }
];
```

(After this, the file ends with the new closing `];`. Verify by reading the file.)

- [ ] **Step 4: Run tests, verify they pass**

Run: `npm test`
Expected: all tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/roster.js tests/unit/roster.test.js
git commit -m "Add 6 new roster entries (5 backyard animals + 2 Natan sprites)."
```

---

## Task 3: Voice override pipeline — `voice-config.mjs` & `generate-voiceover.mjs`

**Files:**
- Modify: `scripts/voice-config.mjs` (add brPtVoiceId stub + helper)
- Modify: `scripts/generate-voiceover.mjs` (route by `voice` field; idempotent across both Natan entries that share the same `voicePath`)

- [ ] **Step 1: Replace `scripts/voice-config.mjs` to export multiple voice configs**

```js
// British (English) voice — picked during v1 audition.
export const BRITISH_VOICE_ID = "Xb7hH8MSUJpSbSDYk0k2";

// Brazilian Portuguese voice — picked during v1.5 audition.
// Run `npm run voiceover:samples -- --voice br-pt` to audition, then paste the chosen ID here.
export const BR_PT_VOICE_ID = "REPLACE_ME_AFTER_AUDITION";

export const MODEL_ID = "eleven_multilingual_v2";
export const VOICE_SETTINGS = { stability: 0.4, similarity_boost: 0.75, style: 0.5 };

const VOICE_IDS = {
  british: BRITISH_VOICE_ID,
  "br-pt": BR_PT_VOICE_ID
};

export function voiceIdFor(label = "british") {
  const id = VOICE_IDS[label];
  if (!id || id === "REPLACE_ME_AFTER_AUDITION") {
    throw new Error(`No ElevenLabs voice ID configured for label "${label}". Run audition first.`);
  }
  return id;
}

// Back-compat: keep the single-id export so scripts that imported VOICE_ID still work.
export const VOICE_ID = BRITISH_VOICE_ID;
```

- [ ] **Step 2: Replace `scripts/generate-voiceover.mjs` to honor the `voice` field and dedupe by output path**

```js
import "dotenv/config";
import { promises as fs } from "node:fs";
import path from "node:path";
import { ROSTER } from "../src/roster.js";
import { voiceIdFor, MODEL_ID, VOICE_SETTINGS } from "./voice-config.mjs";

const apiKey = process.env.ELEVENLABS_API_KEY;
if (!apiKey) {
  console.error("Missing ELEVENLABS_API_KEY in .env");
  process.exit(1);
}

const force = process.argv.includes("--force");
const outDir = path.resolve("assets/voice");
await fs.mkdir(outDir, { recursive: true });

// Dedupe by voicePath: the two Natan entries share assets/voice/natan.mp3.
const seen = new Set();
const tasks = ROSTER.filter((entry) => {
  if (seen.has(entry.voicePath)) return false;
  seen.add(entry.voicePath);
  return true;
});

for (const entry of tasks) {
  const outFile = path.resolve(entry.voicePath);
  await fs.mkdir(path.dirname(outFile), { recursive: true });

  const exists = await fs.stat(outFile).then(() => true).catch(() => false);
  if (exists && !force) {
    console.log(`  skip  ${entry.id} (already exists; pass --force to regenerate)`);
    continue;
  }

  const voiceLabel = entry.voice ?? "british";
  const voiceId = voiceIdFor(voiceLabel);
  const text = `${entry.englishWord}!`;
  const url = `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}?output_format=mp3_44100_128`;
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
    console.error(`  FAIL  ${entry.id} (${voiceLabel}): ${res.status} ${errText}`);
    process.exit(1);
  }
  const buf = Buffer.from(await res.arrayBuffer());
  await fs.writeFile(outFile, buf);
  console.log(`  ok    ${entry.id}  (${voiceLabel})  →  ${path.relative(process.cwd(), outFile)}`);
}

console.log("Done.");
```

- [ ] **Step 3: Quick syntax check — run unit tests (the script is invoked with `node` later, but failures here would be import-time)**

Run: `npm test`
Expected: still passes (this task only touches scripts, not src/).

- [ ] **Step 4: Verify the script loads without crashing (no `--force`, all v1 voice files already exist so it should skip them; new voices will fail at the audition gate, which is expected)**

Run: `node scripts/generate-voiceover.mjs`
Expected output: 5 lines `skip lion ...` through `skip lemur ...`, then a `FAIL` or thrown error on the first new entry (cow/natan-jungle/etc.) because the BR-PT voice ID isn't set yet AND no API call has been made for new English clips. **This is OK** — Task 9 generates the missing clips after audition + asset gen.

If the script errors out on `voiceIdFor("br-pt")` before reaching cow/dog/cat/bird/turtle, that's the expected failure path. We're just verifying the script doesn't crash on import / shape.

- [ ] **Step 5: Commit**

```bash
git add scripts/voice-config.mjs scripts/generate-voiceover.mjs
git commit -m "Voice override: route generate-voiceover by entry.voice, dedupe Natan."
```

---

## Task 4: BR-PT audition support in `voiceover-samples.mjs`

**Files:**
- Modify: `scripts/voiceover-samples.mjs` (accept `--voice br-pt` flag, generate 5 BR-PT samples saying "Natan!")

- [ ] **Step 1: Replace `scripts/voiceover-samples.mjs` to accept a voice flag and have two sample sets**

```js
import "dotenv/config";
import { promises as fs } from "node:fs";
import path from "node:path";

const apiKey = process.env.ELEVENLABS_API_KEY;
if (!apiKey) {
  console.error("Missing ELEVENLABS_API_KEY in .env");
  process.exit(1);
}

// Parse --voice flag (default: british).
const voiceArgIdx = process.argv.indexOf("--voice");
const voiceLabel = voiceArgIdx >= 0 ? process.argv[voiceArgIdx + 1] : "british";

// Five British-female ElevenLabs preset voice IDs — used in v1 to pick the warm narrator.
const BRITISH_SAMPLES = [
  { id: "XB0fDUnXU5powFXDhCwa", name: "Charlotte" },
  { id: "Xb7hH8MSUJpSbSDYk0k2", name: "Alice" },
  { id: "FGY2WhTYpPnrIDTdsKH5", name: "Laura" },
  { id: "EXAVITQu4vr4xnSDxMaL", name: "Sarah" },
  { id: "pFZP5JQG7iQjIQuC4Bku", name: "Lily" }
];

// Five Brazilian Portuguese voice IDs — used to pick a warm voice for "Natan!".
// Names approximate; verify in ElevenLabs UI if any error out.
const BR_PT_SAMPLES = [
  { id: "TX3LPaxmHKxFdv7VOQHJ", name: "Liam-PT" },
  { id: "9BWtsMINqrJLrRacOk9x", name: "Aria-PT" },
  { id: "CwhRBWXzGAHq8TQ4Fs17", name: "Roger-PT" },
  { id: "SAz9YHcvj6GT2YYXdXww", name: "River-PT" },
  { id: "JBFqnCBsd6RMkjVDRZzb", name: "Sofia-PT" }
];

const SAMPLE_SETS = {
  british: { samples: BRITISH_SAMPLES, text: "Lion!", subdir: "british" },
  "br-pt": { samples: BR_PT_SAMPLES, text: "Natan!", subdir: "br-pt" }
};

const config = SAMPLE_SETS[voiceLabel];
if (!config) {
  console.error(`Unknown --voice value: "${voiceLabel}". Valid: british | br-pt`);
  process.exit(1);
}

const outDir = path.resolve("voice-samples", config.subdir);
await fs.mkdir(outDir, { recursive: true });

console.log(`Auditioning ${voiceLabel} voices saying "${config.text}" → ${outDir}\n`);

for (const v of config.samples) {
  const url = `https://api.elevenlabs.io/v1/text-to-speech/${v.id}?output_format=mp3_44100_128`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "xi-api-key": apiKey,
      "content-type": "application/json"
    },
    body: JSON.stringify({
      text: config.text,
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

const targetConst = voiceLabel === "british" ? "BRITISH_VOICE_ID" : "BR_PT_VOICE_ID";
console.log(`
Listen to all 5 in ${outDir}, pick your favorite, then update scripts/voice-config.mjs:

export const ${targetConst} = "<paste-the-voice-id-here>";
`);
```

- [ ] **Step 2: Verify the script accepts the new flag (do not actually call ElevenLabs yet — that uses API credit; just confirm parsing)**

Run: `node -e "process.argv=['node','x','--voice','br-pt']; await import('./scripts/voiceover-samples.mjs')" 2>&1 | head -3`

Expected: prints something like `Auditioning br-pt voices saying "Natan!" → ...` before hitting the API. (It WILL hit the API and burn ~5 credits if you let it run; cancel with Ctrl+C if you don't want to spend credits yet — Task 9 runs it for real after Pixabay/Flow are done so we batch the asset work.)

- [ ] **Step 3: Add npm scripts for the audition flows**

Modify `package.json` scripts block — replace the existing `voiceover:samples` line with two:

```json
"voiceover:samples:british": "node scripts/voiceover-samples.mjs --voice british",
"voiceover:samples:brpt": "node scripts/voiceover-samples.mjs --voice br-pt",
```

(Remove the original `voiceover:samples` entry.)

- [ ] **Step 4: Commit**

```bash
git add scripts/voiceover-samples.mjs package.json
git commit -m "Add --voice flag to voiceover-samples; expose british/brpt npm scripts."
```

---

## Task 5: Build `src/scenes.js` — pure swipe/snap/page-dots module

**Files:**
- Create: `src/scenes.js`
- Create: `tests/unit/scenes.test.js`

The scenes module is mostly DOM-bound (scroll-snap, IntersectionObserver), but the index/state logic can be unit-tested without DOM via dependency injection. We test the core observer-handler logic with a fake observer.

- [ ] **Step 1: Write `tests/unit/scenes.test.js` — tests for the pure state machine**

```js
import { test } from "node:test";
import assert from "node:assert/strict";
import { createSceneStateMachine } from "../../src/scenes.js";

test("createSceneStateMachine emits onChange only on transitions", () => {
  const sm = createSceneStateMachine({ sceneIds: ["jungle", "backyard"] });
  const events = [];
  sm.onChange((id) => events.push(id));

  sm.observe("jungle", 0.95);
  sm.observe("backyard", 0.05);
  // initial high-ratio scene wins → emits "jungle"
  assert.deepEqual(events, ["jungle"]);

  // No transition; same scene still dominates
  sm.observe("jungle", 0.85);
  sm.observe("backyard", 0.15);
  assert.deepEqual(events, ["jungle"]);

  // Transition: backyard takes over
  sm.observe("jungle", 0.10);
  sm.observe("backyard", 0.90);
  assert.deepEqual(events, ["jungle", "backyard"]);

  // Same again, no duplicate
  sm.observe("backyard", 0.95);
  assert.deepEqual(events, ["jungle", "backyard"]);
});

test("getCurrent returns the dominant scene", () => {
  const sm = createSceneStateMachine({ sceneIds: ["jungle", "backyard"] });
  sm.observe("jungle", 0.6);
  sm.observe("backyard", 0.4);
  assert.equal(sm.getCurrent(), "jungle");

  sm.observe("jungle", 0.3);
  sm.observe("backyard", 0.7);
  assert.equal(sm.getCurrent(), "backyard");
});

test("getCurrent returns the first sceneId before any observation", () => {
  const sm = createSceneStateMachine({ sceneIds: ["jungle", "backyard"] });
  assert.equal(sm.getCurrent(), "jungle");
});

test("multiple onChange subscribers all fire", () => {
  const sm = createSceneStateMachine({ sceneIds: ["jungle", "backyard"] });
  const a = [];
  const b = [];
  sm.onChange((id) => a.push(id));
  sm.onChange((id) => b.push(id));
  sm.observe("backyard", 0.9);
  sm.observe("jungle", 0.1);
  assert.deepEqual(a, ["backyard"]);
  assert.deepEqual(b, ["backyard"]);
});
```

- [ ] **Step 2: Run, see fail (file does not exist)**

Run: `npm test`
Expected: failure resolving `../../src/scenes.js`.

- [ ] **Step 3: Implement `src/scenes.js`**

```js
// src/scenes.js
//
// Owns the swipe-paged scene navigator: scroll-snap detection via
// IntersectionObserver, page-dot rendering, and a public API for the diorama
// to subscribe to current-scene changes.
//
// The DOM-free state machine (createSceneStateMachine) is exported separately
// so it can be unit-tested without IntersectionObserver.

export function createSceneStateMachine({ sceneIds }) {
  if (!Array.isArray(sceneIds) || sceneIds.length === 0) {
    throw new Error("sceneIds must be a non-empty array");
  }

  const ratios = new Map(sceneIds.map((id) => [id, 0]));
  let current = sceneIds[0];
  const subscribers = [];

  function dominantScene() {
    let bestId = sceneIds[0];
    let bestRatio = -1;
    for (const id of sceneIds) {
      const r = ratios.get(id) ?? 0;
      if (r > bestRatio) {
        bestId = id;
        bestRatio = r;
      }
    }
    return bestId;
  }

  return {
    observe(sceneId, ratio) {
      if (!ratios.has(sceneId)) return;
      ratios.set(sceneId, ratio);
      const next = dominantScene();
      if (next !== current) {
        current = next;
        for (const cb of subscribers) cb(current);
      }
    },
    getCurrent() {
      return current;
    },
    onChange(cb) {
      subscribers.push(cb);
    }
  };
}

export function createScenes(track, { sceneIds }) {
  const sm = createSceneStateMachine({ sceneIds });
  const panelEls = new Map();

  for (const sceneId of sceneIds) {
    const panel = track.querySelector(`.scene-panel[data-scene="${sceneId}"]`);
    if (!panel) {
      throw new Error(`Missing panel for scene "${sceneId}"`);
    }
    panelEls.set(sceneId, panel);
  }

  // Detect current scene via IntersectionObserver against the track itself.
  const io = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        const sceneId = e.target.dataset.scene;
        sm.observe(sceneId, e.intersectionRatio);
      }
    },
    {
      root: track,
      threshold: [0, 0.25, 0.5, 0.75, 1]
    }
  );
  for (const panel of panelEls.values()) io.observe(panel);

  // Page dots (rendered into a sibling of the track, populated by index.html).
  const dotsContainer = document.querySelector(".page-dots");
  if (dotsContainer) {
    dotsContainer.innerHTML = "";
    for (const sceneId of sceneIds) {
      const dot = document.createElement("button");
      dot.className = "page-dot";
      dot.dataset.scene = sceneId;
      dot.setAttribute("aria-label", `Go to ${sceneId} scene`);
      dot.addEventListener("click", () => snapTo(sceneId));
      dotsContainer.appendChild(dot);
    }
    sm.onChange((id) => {
      const dots = dotsContainer.querySelectorAll(".page-dot");
      for (const dot of dots) {
        dot.classList.toggle("active", dot.dataset.scene === id);
      }
    });
    // Initial active state.
    const first = dotsContainer.querySelector(`.page-dot[data-scene="${sm.getCurrent()}"]`);
    if (first) first.classList.add("active");
  }

  function snapTo(sceneId) {
    const panel = panelEls.get(sceneId);
    if (!panel) return;
    panel.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
  }

  return {
    snapTo,
    getCurrent: sm.getCurrent.bind(sm),
    onChange: sm.onChange.bind(sm)
  };
}
```

- [ ] **Step 4: Run unit tests, verify pass**

Run: `npm test`
Expected: all tests pass (including the new scenes tests).

- [ ] **Step 5: Commit**

```bash
git add src/scenes.js tests/unit/scenes.test.js
git commit -m "Add scenes module — swipe/snap state machine + IntersectionObserver wrapper."
```

---

## Task 6: Document Flow shot list — `scripts/flow-shot-list-v1.5.md`

**Files:**
- Create: `scripts/flow-shot-list-v1.5.md`

This file is the source-of-truth for re-generating the Flow assets. It mirrors the v2 list's format.

- [ ] **Step 1: Write the shot list**

```markdown
# Flow Shot List — v1.5 Two-Scene World

Prompts for Google Labs Flow image generation for v1.5 (jungle + backyard scenes). Use the existing `assets/images/jungle-bg.png` (v1) as a style reference: polished 3D cartoon, expressive faces, rounded shapes, tropical palette, bedtime warmth.

Run via the [`flow-asset-generation` skill](~/.claude/skills/flow-asset-generation/SKILL.md) — uses Image mode + Nano Banana 2 + parallel-prompt queueing trick.

## Style guardrails (apply to all prompts)

- "Polished 3D cartoon illustration, expressive faces, rounded shapes, bedtime warmth"
- "Original character — not Madagascar, not any existing movie character"
- "Storybook-consistent with the v1 jungle scene"

## Backgrounds (2 generations, 16:10 landscape)

### `assets/images/jungle-bg.png` (regenerated — replaces v1)

Prompt:

> Polished 3D cartoon illustration, 16:10 landscape, lush jungle clearing at golden hour. A toddler boy named Natan stands center on a wooden plank floor, holding a small leaf, smiling at the viewer, brown hair, green t-shirt. Surrounding him, painted into the scene: a friendly lion with red cape on the far left (~12% from left), a happy zebra center-left (~30%), a cheerful purple hippo on Natan's right side (~68%, NOT covering Natan), a tall giraffe far right back (~84%), and a small ring-tailed lemur far right foreground (~92%). Hanging vines, glowing fireflies, sunset palette of pinks and oranges. Storybook warmth.

Critical: hippo placed to the RIGHT of Natan, never overlapping him. Natan is fully visible, not partly hidden behind any animal.

### `assets/images/backyard-bg.png` (new)

Prompt:

> Polished 3D cartoon illustration, 16:10 landscape, sunny suburban backyard. A toddler boy named Natan stands center-left on grass, smiling at the viewer, brown hair, green t-shirt, holding a toy. Surrounding him, painted into the scene: a friendly cow grazing past a wooden fence on the far left (~14% from left), a happy small dog beside Natan (~32%), a content cat curled on the lawn (~62%), a small colorful songbird perched in a tree at right (~80%, mid-height), and a green turtle peeking from a small lily pond at far right (~88%). Blue sky with soft clouds, sunflowers along the fence, storybook warmth.

## Sprites (7 transparent-bg generations)

Each sprite is the same character as painted in the bg, but isolated against a transparent background. Style-match the v1 cropped sprites (lion.png etc.).

### Backyard animals

- **`assets/images/cow.png`** — "Friendly cartoon cow, white with brown patches, soft features, big eyes, small smile, standing facing forward, transparent background, full body visible"
- **`assets/images/dog.png`** — "Small friendly cartoon dog, golden fur, tongue out smiling, sitting upright, tail visible, transparent background, full body"
- **`assets/images/cat.png`** — "Content cartoon cat, orange tabby, sitting upright, alert ears, gentle smile, transparent background, full body"
- **`assets/images/turtle.png`** — "Friendly green cartoon turtle, head and front paws peeking from shell, smiling, transparent background"
- **`assets/images/bird.png`** — "Small colorful cartoon songbird, perched, blue and yellow feathers, big eyes, beak slightly open as if singing, transparent background"

### Natan

- **`assets/images/natan-jungle.png`** — "Cartoon toddler boy named Natan, brown hair, green t-shirt, holding a small leaf, standing facing forward smiling at viewer, full body, transparent background. Pose matches the painted Natan in jungle-bg.png."
- **`assets/images/natan-backyard.png`** — "Cartoon toddler boy named Natan, brown hair, green t-shirt, holding a toy, standing facing forward smiling at viewer, full body, transparent background. Pose matches the painted Natan in backyard-bg.png."

## Workflow

1. Generate all 9 assets in one Flow session for style consistency.
2. JPEG-download each, then run `npm run sheet:refine` (rembg) to clean alpha.
3. Save outputs to `assets/images/` with the exact filenames above.
4. Visual review: open both bgs and verify Natan is fully visible, no animal overlaps him.
5. If composition is off, re-prompt; do not edit by hand (we want the asset workflow reproducible).
```

- [ ] **Step 2: Commit**

```bash
git add scripts/flow-shot-list-v1.5.md
git commit -m "Document Flow shot list for v1.5 backgrounds and sprites."
```

---

## Task 7: Generate Flow assets (browser-driven, manual)

**Files:**
- Create: `assets/images/jungle-bg.png` (regenerated, replaces v1)
- Create: `assets/images/backyard-bg.png`
- Create: `assets/images/cow.png`, `dog.png`, `cat.png`, `turtle.png`, `bird.png`
- Create: `assets/images/natan-jungle.png`, `natan-backyard.png`

This task uses the `flow-asset-generation` skill via Claude-in-Chrome. It is mostly out-of-band browser work, but the output paths and verification steps live here.

- [ ] **Step 1: Invoke the asset-generation skill**

In a fresh Claude Code session (or this one), invoke the skill:

> Use the `flow-asset-generation` skill to generate the 9 assets listed in `scripts/flow-shot-list-v1.5.md`. Output to `assets/images/` with the exact filenames specified.

The skill will drive Claude-in-Chrome to Google Labs Flow, queue prompts in parallel, download JPEGs, and run rembg post-processing.

- [ ] **Step 2: Verify all 9 files exist**

Run: `ls -la assets/images/{jungle-bg,backyard-bg,cow,dog,cat,turtle,bird,natan-jungle,natan-backyard}.png`
Expected: 9 lines, all files non-empty.

- [ ] **Step 3: Visual review on local dev server**

Run: `npm run dev`, open `http://localhost:5173/`. The diorama still uses v1's old layout (we haven't touched diorama.js yet), but the new `jungle-bg.png` should now show with Natan visible at center. The cropped sprites should still align with their painted twins.

- [ ] **Step 4: If composition is wrong, re-prompt**

If Natan is still partly hidden, hippo overlaps him, or sprites don't match the bg's painted twins: open `scripts/flow-shot-list-v1.5.md`, refine the prompt, re-run the skill for the affected asset(s). Repeat until visual review passes.

- [ ] **Step 5: Commit assets**

```bash
git add assets/images/
git commit -m "Add v1.5 generated images: 2 backgrounds + 7 sprites (Flow + rembg)."
```

---

## Task 8: Curate Pixabay sounds + extend `LICENSES.md`

**Files:**
- Create: `assets/sounds/cow-moo.mp3`, `dog-bark.mp3`, `cat-meow.mp3`, `turtle-splash.mp3`, `bird-tweet.mp3`, `natan-giggle.mp3`
- Modify: `assets/sounds/LICENSES.md`

Manual curation, same process as v1: ≤2 seconds, cartoony > realistic, normalize to -3dB peak with `ffmpeg`.

- [ ] **Step 1: Search and download from Pixabay**

For each animal:
1. Search Pixabay sound effects (https://pixabay.com/sound-effects/) for the term.
2. Preview 3–5 candidates, pick the punchiest ≤2-second clip.
3. Download the MP3 to `assets/sounds/<filename>.mp3`.
4. Note the source URL + author for `LICENSES.md`.

| File | Search term | Notes |
|---|---|---|
| `cow-moo.mp3` | "cow moo cartoon" | Single short moo |
| `dog-bark.mp3` | "small dog bark friendly" | One bark, not a series |
| `cat-meow.mp3` | "cat meow cute" | Single meow, not a yowl |
| `turtle-splash.mp3` | "small water plop" | Turtles don't vocalize; a water-plop fits the pond |
| `bird-tweet.mp3` | "songbird short tweet" | A single chirp or tweet |
| `natan-giggle.mp3` | "toddler giggle short" | Real child giggle, ≤2s |

- [ ] **Step 2: Normalize peak to -3dB with ffmpeg**

For each downloaded file:

```bash
ffmpeg -y -i assets/sounds/cow-moo.mp3 -af "loudnorm=I=-16:TP=-3:LRA=11" assets/sounds/cow-moo.normalized.mp3 && mv assets/sounds/cow-moo.normalized.mp3 assets/sounds/cow-moo.mp3
```

Repeat for each of the 6 new files (substitute filename).

- [ ] **Step 3: Append to `assets/sounds/LICENSES.md`**

Open the file. Add 6 rows to the existing table (or recreate the whole table per the format below):

```markdown
| File | Source | Author | Notes |
|---|---|---|---|
| lion-roar.mp3 | https://pixabay.com/sound-effects/film-special-effects-cartoon-lion-roar-487672/ | DRAGON-STUDIO | Cartoon-style roar, 0:02 |
| zebra-neigh.mp3 | https://pixabay.com/sound-effects/nature-horse-neigh-515279/ | DRAGON-STUDIO | Horse neigh substituted for zebra |
| hippo-grunt.mp3 | https://pixabay.com/sound-effects/nature-hungry-hippos-scream-226113/ | u_tococonino969 | Hippo vocalization, 0:01 |
| giraffe-bleat.mp3 | https://pixabay.com/sound-effects/nature-jerapah-220059/ | SondangSirait419 | Actual giraffe sound |
| lemur-chatter.mp3 | https://pixabay.com/sound-effects/nature-monkey-128368/ | u_zpj3vbdres | Monkey chatter substituted for lemur |
| cow-moo.mp3 | <PASTE_URL> | <PASTE_AUTHOR> | Cartoon moo, ≤2s |
| dog-bark.mp3 | <PASTE_URL> | <PASTE_AUTHOR> | Single bark, ≤2s |
| cat-meow.mp3 | <PASTE_URL> | <PASTE_AUTHOR> | Single meow, ≤2s |
| turtle-splash.mp3 | <PASTE_URL> | <PASTE_AUTHOR> | Water plop (turtles don't vocalize) |
| bird-tweet.mp3 | <PASTE_URL> | <PASTE_AUTHOR> | Single songbird tweet |
| natan-giggle.mp3 | <PASTE_URL> | <PASTE_AUTHOR> | Toddler giggle, ≤2s |
```

(Replace each `<PASTE_*>` with the real value from the download step.)

- [ ] **Step 4: Verify each sound**

Run: `for f in cow-moo dog-bark cat-meow turtle-splash bird-tweet natan-giggle; do afplay assets/sounds/$f.mp3; done`
Listen: each plays a short, cartoony, recognizable sound at consistent volume.

- [ ] **Step 5: Commit**

```bash
git add assets/sounds/
git commit -m "Add 6 new sound effects (Pixabay), normalized to -3dB; extend LICENSES.md."
```

---

## Task 9: BR-PT voice audition + generate all voice clips

**Files:**
- Modify: `scripts/voice-config.mjs:3` (replace `BR_PT_VOICE_ID`)
- Create: `assets/voice/cow.mp3`, `dog.mp3`, `cat.mp3`, `turtle.mp3`, `bird.mp3`, `natan.mp3`

- [ ] **Step 1: Run BR-PT audition**

Run: `npm run voiceover:samples:brpt`
Expected output: 5 lines, each like `→ voice-samples/br-pt/Liam-PT-TX3LPaxmHKxFdv7VOQHJ.mp3`. The script burns ~5 ElevenLabs credits.

If any voice ID errors out (IDs may shift), open https://elevenlabs.io/app/voice-library, filter by Portuguese, copy any 5 voice IDs into the `BR_PT_SAMPLES` array in `scripts/voiceover-samples.mjs`, re-run.

- [ ] **Step 2: Listen to all 5 samples**

Run: `for f in voice-samples/br-pt/*.mp3; do echo "$f"; afplay "$f"; done`
Pick the warmest, clearest pronunciation of "Natan". Note the voice ID from the filename (the part after the `-`).

- [ ] **Step 3: Pin the chosen ID into `scripts/voice-config.mjs`**

Edit `scripts/voice-config.mjs:3`:

```js
export const BR_PT_VOICE_ID = "<paste-the-chosen-voice-id>";
```

- [ ] **Step 4: Generate all voice clips**

Run: `npm run voiceover:generate`
Expected output: 5 `skip` lines for v1 animals, then 6 `ok` lines for cow, dog, natan, cat, bird, turtle (the order depends on roster.js position). The Natan entry generates only once because the script dedupes by `voicePath`.

- [ ] **Step 5: Verify each clip**

Run: `for f in cow dog cat turtle bird natan; do echo "$f"; afplay assets/voice/$f.mp3; done`
Listen: each animal name in the warm British voice; "Natan!" in the chosen BR-PT voice. ~600–900ms per clip.

- [ ] **Step 6: Commit**

```bash
git add scripts/voice-config.mjs assets/voice/
git commit -m "Pin BR-PT voice ID; generate 6 new voice clips (5 English + Natan)."
```

---

## Task 10: Update `index.html` for two scene panels

**Files:**
- Modify: `index.html:27-29`

- [ ] **Step 1: Replace the `<main id="diorama">` block with the scenes track**

In `index.html`, replace the `<main id="diorama" aria-label="Animal scene">...</main>` block with:

```html
<main id="diorama" aria-label="Animal scenes">
  <div class="scenes-track" role="region" aria-roledescription="carousel">
    <section class="scene-panel" data-scene="jungle" aria-label="Jungle scene"></section>
    <section class="scene-panel" data-scene="backyard" aria-label="Backyard scene"></section>
  </div>
  <nav class="page-dots" aria-label="Scene navigation"></nav>
</main>
```

- [ ] **Step 2: Smoke-test the markup loads**

Run: `npm run dev`, open `http://localhost:5173/`.
Expected: page loads but is broken visually (no animals render — the `renderDiorama` call still targets `#diorama` and the children selector won't find `.scene-panel`-scoped animals). This is OK; Task 11 fixes diorama.js.

(Stop dev server before next step.)

- [ ] **Step 3: Commit**

```bash
git add index.html
git commit -m "Restructure index.html with scenes-track + page-dots containers."
```

---

## Task 11: Update `diorama.js` to render two scene panels

**Files:**
- Modify: `src/diorama.js` (full rewrite — render per scene)

- [ ] **Step 1: Replace `src/diorama.js` with a per-scene-panel renderer**

```js
import { ROSTER, SCENES } from "./roster.js";

const IDLE_HINT_DELAY_MS = 2000;
const HINT_PAUSE_AFTER_TAP_MS = 4000;
const HINT_INTERVAL_MS = 1500;
const HELLO_WAVE_DELAY_MS = 60_000;

export function renderDiorama(track, { onTap, scenes } = {}) {
  // track: the .scenes-track element. Each .scene-panel inside is populated here.
  const animalEls = new Map(); // id → button element

  for (const sceneId of SCENES) {
    const panel = track.querySelector(`.scene-panel[data-scene="${sceneId}"]`);
    if (!panel) {
      throw new Error(`renderDiorama: missing panel for scene "${sceneId}"`);
    }
    panel.innerHTML = "";

    const entries = ROSTER.filter((e) => e.scene === sceneId);
    for (const entry of entries) {
      const el = document.createElement("button");
      el.className = "animal";
      el.dataset.id = entry.id;
      el.dataset.scene = sceneId;
      el.setAttribute("aria-label", entry.englishWord);
      el.style.left = `${entry.position.left}%`;
      el.style.bottom = `${entry.position.bottom}%`;
      el.style.setProperty("--scale", String(entry.scale));
      el.style.transform = `translateX(-50%) scale(${entry.scale})`;
      el.style.zIndex = String(entry.zIndex);

      const img = document.createElement("img");
      img.src = entry.spritePath ?? `assets/images/${entry.id}.png`;
      img.alt = "";
      el.appendChild(img);

      const handle = (event) => {
        event.preventDefault();
        triggerTap(el, entry, panel);
        idle.notifyTap();
        if (onTap) onTap(entry);
      };
      el.addEventListener("touchstart", handle, { passive: false });
      el.addEventListener("click", handle);

      panel.appendChild(el);
      animalEls.set(entry.id, el);
    }
  }

  const idle = createIdleScheduler(animalEls, scenes);
  idle.start();
  return track;
}

function triggerTap(el, entry, panel) {
  el.classList.remove("tapped");
  void el.offsetWidth;
  el.classList.add("tapped");
  setTimeout(() => el.classList.remove("tapped"), 700);

  const rect = el.getBoundingClientRect();
  const panelRect = panel.getBoundingClientRect();
  const sparkle = document.createElement("div");
  sparkle.className = "sparkle";
  sparkle.style.left = `${rect.left - panelRect.left + rect.width / 2}px`;
  sparkle.style.top = `${rect.top - panelRect.top + rect.height / 2}px`;
  panel.appendChild(sparkle);
  setTimeout(() => sparkle.remove(), 1800);
}

function createIdleScheduler(animalEls, scenes) {
  let cursor = 0;
  let pulseTimer = null;
  let helloTimer = null;
  let lastInteractionAt = performance.now();

  function visibleIds() {
    const sceneId = scenes?.getCurrent?.() ?? null;
    if (!sceneId) return [...animalEls.keys()];
    return ROSTER.filter((e) => e.scene === sceneId).map((e) => e.id);
  }

  function pulseNext() {
    const ids = visibleIds();
    if (ids.length === 0) return;
    const id = ids[cursor % ids.length];
    cursor += 1;
    const el = animalEls.get(id);
    if (!el) return;
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
        const ids = visibleIds();
        if (ids.length > 0) {
          const id = ids[Math.floor(Math.random() * ids.length)];
          const el = animalEls.get(id);
          if (el) {
            el.classList.remove("hello-wave");
            void el.offsetWidth;
            el.classList.add("hello-wave");
            setTimeout(() => el.classList.remove("hello-wave"), 1500);
          }
        }
      }
      scheduleHello();
    }, HELLO_WAVE_DELAY_MS);
  }

  // Reset cursor + restart pulse when scene changes.
  scenes?.onChange?.(() => {
    cursor = 0;
    clearTimeout(pulseTimer);
    schedulePulse();
  });

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

- [ ] **Step 2: Update `src/main.js` to wire scenes + diorama together**

Replace the contents of `src/main.js`:

```js
import { renderDiorama } from "./diorama.js";
import { createScenes } from "./scenes.js";
import { ROSTER, SCENES } from "./roster.js";
import { createAudioSystem, createBrowserBackend, createBrowserClock } from "./audio.js";

const diorama = document.getElementById("diorama");
const track = diorama.querySelector(".scenes-track");

const audio = createAudioSystem({
  backend: createBrowserBackend(),
  clock: createBrowserClock(),
  cooldownMs: 1800
});

const allClips = ROSTER.flatMap((entry) => [entry.voicePath, entry.soundPath]);
audio.preload(allClips);

// .scene-panel elements are created by index.html, so createScenes can find
// them immediately. renderDiorama populates them with animal buttons after.
const scenes = createScenes(track, { sceneIds: SCENES });
renderDiorama(track, {
  scenes,
  onTap: (entry) => {
    // iOS Safari requires audio.play() called synchronously from the user
    // gesture event. The CSS animation already paints first naturally
    // (paint is faster than audio decode), so no setTimeout needed.
    audio.playSequence([entry.voicePath, entry.soundPath]);
  }
});

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./service-worker.js").catch(() => {
      // SW registration failures are silent in dev.
    });
  });
}
```

- [ ] **Step 3: Smoke-test in browser**

Run: `npm run dev`, open `http://localhost:5173/`.
Expected: 6 animals rendered in scene 1 (lion, zebra, natan-jungle, hippo, giraffe, lemur). Page is unstyled for two scenes (no scroll-snap yet, both panels render stacked vertically or side-by-side without snap behavior). Tapping each animal plays its voice + sound. Tapping Natan plays his BR-PT voice + giggle.

(Stop dev server.)

- [ ] **Step 4: Commit**

```bash
git add src/diorama.js src/main.js
git commit -m "Render diorama per scene panel; wire scenes module into idle scheduler."
```

---

## Task 12: Style scene panels — scroll-snap, edge peek, page dots

**Files:**
- Modify: `src/styles.css` (add scenes-track, scene-panel, page-dots rules; update existing #diorama rule)

- [ ] **Step 1: Replace the `#diorama` rule and add new rules**

Replace lines 23–37 of `src/styles.css` (the current `#diorama { ... }` block) with:

```css
#diorama {
  position: relative;
  width: 100vw;
  height: 100vh;
  background-color: var(--bg-jungle-deep);
  overflow: hidden;
  padding-top: env(safe-area-inset-top);
  padding-bottom: env(safe-area-inset-bottom);
  box-sizing: border-box;
}

.scenes-track {
  display: flex;
  width: 100%;
  height: 100%;
  overflow-x: auto;
  overflow-y: hidden;
  scroll-snap-type: x mandatory;
  scroll-behavior: smooth;
  scrollbar-width: none; /* Firefox */
  -ms-overflow-style: none; /* IE/Edge */
  padding-left: env(safe-area-inset-left);
  padding-right: env(safe-area-inset-right);
}

.scenes-track::-webkit-scrollbar {
  display: none; /* WebKit */
}

.scene-panel {
  position: relative;
  flex: 0 0 94vw;
  margin: 0 3vw;
  height: 100%;
  scroll-snap-align: center;
  background-size: cover;
  background-position: center;
}

.scene-panel[data-scene="jungle"] {
  background-image: url("/assets/images/jungle-bg.png");
  background-color: var(--bg-jungle-deep);
}

.scene-panel[data-scene="backyard"] {
  background-image: url("/assets/images/backyard-bg.png");
  background-color: #87b6d8; /* sky blue fallback */
}

.page-dots {
  position: absolute;
  left: 0;
  right: 0;
  bottom: calc(env(safe-area-inset-bottom, 12px) + 12px);
  display: flex;
  justify-content: center;
  gap: 8px;
  pointer-events: none; /* dots themselves re-enable */
  z-index: 200;
}

.page-dot {
  pointer-events: auto;
  width: 44px;
  height: 44px;
  padding: 0;
  background: transparent;
  border: 0;
  -webkit-appearance: none;
  appearance: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}

.page-dot::after {
  content: "";
  display: block;
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.4);
  border: 2px solid rgba(255, 255, 255, 0.8);
  transition: background 200ms ease;
}

.page-dot.active::after {
  background: rgba(255, 255, 255, 1);
}
```

- [ ] **Step 2: Smoke-test in browser**

Run: `npm run dev`, open `http://localhost:5173/`.
Expected:
- Scene 1 fills the screen.
- A small sliver (~6%) of scene 2's bg peeks at the right edge.
- Two dots at the bottom; left dot is filled (active), right dot is outline.
- Drag/swipe horizontally → scene 2 snaps in. Left edge now shows a sliver of scene 1.
- Tapping the right dot from scene 1 → scene 2 snaps in smoothly.
- Tapping animals on each scene plays correct audio.

If scene panels don't snap or peek isn't visible, inspect the `.scenes-track` element — `flex: 0 0 94vw` with `margin: 0 3vw` should produce the peek. Adjust as needed; commit only after working.

- [ ] **Step 3: Commit**

```bash
git add src/styles.css
git commit -m "Style scene panels with scroll-snap, edge peek, and page dots."
```

---

## Task 13: Update service worker — add new assets, bump cache to v4

**Files:**
- Modify: `public/service-worker.js:5` (CACHE_VERSION)
- Modify: `public/service-worker.js:8-30` (PRECACHE list)

- [ ] **Step 1: Update CACHE_VERSION and PRECACHE in `public/service-worker.js`**

Replace lines 5 and the PRECACHE array:

```js
const CACHE_VERSION = "v4";
const CACHE_NAME = `safari-de-sons-${CACHE_VERSION}`;

const PRECACHE = [
  "./",
  "./index.html",
  "./manifest.webmanifest",
  "./icon-192.png",
  "./icon-512.png",
  "./splash-1170x2532.png",
  // Backgrounds
  "./assets/images/jungle-bg.png",
  "./assets/images/backyard-bg.png",
  // Jungle sprites (v1)
  "./assets/images/lion.png",
  "./assets/images/zebra.png",
  "./assets/images/hippo.png",
  "./assets/images/giraffe.png",
  "./assets/images/lemur.png",
  "./assets/images/natan-jungle.png",
  // Backyard sprites (v1.5)
  "./assets/images/cow.png",
  "./assets/images/dog.png",
  "./assets/images/cat.png",
  "./assets/images/turtle.png",
  "./assets/images/bird.png",
  "./assets/images/natan-backyard.png",
  // Voices
  "./assets/voice/lion.mp3",
  "./assets/voice/zebra.mp3",
  "./assets/voice/hippo.mp3",
  "./assets/voice/giraffe.mp3",
  "./assets/voice/lemur.mp3",
  "./assets/voice/cow.mp3",
  "./assets/voice/dog.mp3",
  "./assets/voice/cat.mp3",
  "./assets/voice/turtle.mp3",
  "./assets/voice/bird.mp3",
  "./assets/voice/natan.mp3",
  // Sounds
  "./assets/sounds/lion-roar.mp3",
  "./assets/sounds/zebra-neigh.mp3",
  "./assets/sounds/hippo-grunt.mp3",
  "./assets/sounds/giraffe-bleat.mp3",
  "./assets/sounds/lemur-chatter.mp3",
  "./assets/sounds/cow-moo.mp3",
  "./assets/sounds/dog-bark.mp3",
  "./assets/sounds/cat-meow.mp3",
  "./assets/sounds/turtle-splash.mp3",
  "./assets/sounds/bird-tweet.mp3",
  "./assets/sounds/natan-giggle.mp3"
];
```

- [ ] **Step 2: Smoke-test SW registration**

Run: `npm run build && npm run preview`.
Open `http://localhost:4173/`. In DevTools → Application → Service Workers, verify:
- New SW registered (status: activated).
- Old `safari-de-sons-v3` cache deleted.
- New `safari-de-sons-v4` cache exists in DevTools → Application → Cache Storage with all 41 entries.

Stop preview server.

- [ ] **Step 3: Commit**

```bash
git add public/service-worker.js
git commit -m "Bump SW cache to v4; precache new bgs, sprites, voices, sounds."
```

---

## Task 14: Extend `tap-flow.spec.mjs` — all 12 sprites across scenes

**Files:**
- Modify: `tests/e2e/tap-flow.spec.mjs`

- [ ] **Step 1: Replace `tests/e2e/tap-flow.spec.mjs` to test all 12 sprites**

```js
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
```

- [ ] **Step 2: Run e2e test, verify pass**

Run: `npm run test:e2e -- tap-flow.spec.mjs`
Expected: 3 tests pass.

- [ ] **Step 3: Commit**

```bash
git add tests/e2e/tap-flow.spec.mjs
git commit -m "Extend tap-flow e2e for 12 sprites across both scenes."
```

---

## Task 15: Add `swipe-flow.spec.mjs` — swipe between scenes

**Files:**
- Create: `tests/e2e/swipe-flow.spec.mjs`

- [ ] **Step 1: Write the test**

```js
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
```

- [ ] **Step 2: Run, verify pass**

Run: `npm run test:e2e -- swipe-flow.spec.mjs`
Expected: 2 tests pass.

- [ ] **Step 3: Commit**

```bash
git add tests/e2e/swipe-flow.spec.mjs
git commit -m "Add swipe-flow e2e — programmatic snap between scenes."
```

---

## Task 16: Add `page-dots.spec.mjs` — dot taps snap correctly

**Files:**
- Create: `tests/e2e/page-dots.spec.mjs`

- [ ] **Step 1: Write the test**

```js
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
```

- [ ] **Step 2: Run, verify pass**

Run: `npm run test:e2e -- page-dots.spec.mjs`
Expected: 3 tests pass.

- [ ] **Step 3: Commit**

```bash
git add tests/e2e/page-dots.spec.mjs
git commit -m "Add page-dots e2e — dot rendering, active state, snap-on-tap."
```

---

## Task 17: Update `idle-hint.spec.mjs` — pulse only on visible scene

**Files:**
- Modify: `tests/e2e/idle-hint.spec.mjs`

- [ ] **Step 1: Replace the test file**

```js
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
```

- [ ] **Step 2: Run, verify pass**

Run: `npm run test:e2e -- idle-hint.spec.mjs`
Expected: 3 tests pass.

- [ ] **Step 3: Commit**

```bash
git add tests/e2e/idle-hint.spec.mjs
git commit -m "Update idle-hint e2e — pulse stays within visible scene only."
```

---

## Task 18: Update `pwa.spec.mjs` — verify cache v4 + new asset count

**Files:**
- Modify: `tests/e2e/pwa.spec.mjs`

- [ ] **Step 1: Append a cache-version assertion**

Replace the contents of `tests/e2e/pwa.spec.mjs`:

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
```

- [ ] **Step 2: Run, verify pass**

Run: `npm run build && npm run test:e2e -- pwa.spec.mjs`
Expected: 3 tests pass. (`npm run build` is needed because the SW source for the test is read from the built artifact via the preview server; verify your `playwright.config.mjs` `webServer` setting points at preview, not dev.)

- [ ] **Step 3: Commit**

```bash
git add tests/e2e/pwa.spec.mjs
git commit -m "PWA e2e checks SW cache version pinned to v4."
```

---

## Task 19: Update `docs/roadmap.md` with v1.5 entry

**Files:**
- Modify: `docs/roadmap.md`

- [ ] **Step 1: Add a v1.5 row at the top of the future games table (or as its own section)**

Open `docs/roadmap.md`. Insert after the H1 `# Safari de Sons — Roadmap` and before the `## Future games (in build order)` section:

```markdown
## v1.5 (shipped 2026-04-26)

Two-scene world: jungle (5 v1 animals + Natan) + backyard (cow, dog, cat, turtle, bird + Natan). Adds horizontally-paged scene navigator with edge-peek + page dots, BR-PT voice override for Natan's name. Engine extended without breaking v1 patterns; v2's planned multi-pose expansion still applies on top.

Spec: [`2026-04-26-safari-de-sons-v1.5-design.md`](superpowers/specs/2026-04-26-safari-de-sons-v1.5-design.md)

```

- [ ] **Step 2: Commit**

```bash
git add -f docs/roadmap.md
git commit -m "Roadmap: log v1.5 (jungle + backyard, BR-PT Natan)."
```

---

## Task 20: Manual iPhone QA + final verification

This task is hands-on and not testable in CI. The goal is to confirm the actual play experience works on Natan's device.

- [ ] **Step 1: Build production bundle and serve locally**

Run: `npm run build && npm run preview --host`
Note the LAN URL printed (e.g., `http://192.168.1.10:4173/`).

- [ ] **Step 2: Open URL on the iPhone**

Safari → enter LAN URL. Verify:
- Landscape lock works (rotate hint shown in portrait).
- Both scenes load with Natan visible at center, no animal covering him.
- All 12 sprites tappable; correct voice + sound for each.
- Natan's clip is the BR-PT voice; followed by a giggle.
- Swipe right → scene 2 appears with snap; left edge peeks scene 1.
- Page dots toggle correctly; tapping right dot from scene 1 snaps to scene 2.
- Idle pulse fires only on the visible scene's animals.
- Tap audio interrupts cleanly when crossing scenes mid-clip.

- [ ] **Step 3: Install as PWA, retest offline**

iPhone Safari → Share → Add to Home Screen → tap icon. Disable Wi-Fi/cellular. Tap icon again — confirm offline play works exactly as online.

- [ ] **Step 4: Re-enable network, run full test suite**

Run: `npm test && npm run build && npm run test:e2e`
Expected: all unit tests pass; all e2e specs (tap-flow, swipe-flow, page-dots, idle-hint, pwa) pass.

- [ ] **Step 5: Final commit (if any composition adjustments needed during QA)**

If iPhone QA exposed misaligned positions or audio issues, fix in the relevant file (`src/roster.js` for positions, `src/audio.js` for timing) and commit.

```bash
git add -A
git commit -m "Final QA adjustments from iPhone playtest."
```

---

## Spec Coverage Check

| Spec section | Implemented in |
|---|---|
| §1 Overview — 12-sprite world | Tasks 1, 2 |
| §3.1 Two-scene layout | Tasks 10, 12 |
| §3.2 Scene 1 (jungle) revised | Tasks 7, 11 |
| §3.3 Scene 2 (backyard) | Tasks 7, 11 |
| §3.4 Tap interaction unchanged | Task 11 |
| §3.5 Tap on Natan | Tasks 2, 9, 11 |
| §3.6 Swipe / page dots | Tasks 5, 10, 12 |
| §3.7 Cross-scene concurrency | Task 11 (idle scheduler filters by visible scene) |
| §4.1 Directory layout | All asset/code tasks |
| §4.2 Module boundaries | Tasks 1, 5, 11 |
| §4.3 Roster shape | Tasks 1, 2 |
| §4.4 scenes.js API | Task 5 |
| §4.5 Idle-hint adaptation | Task 11 |
| §5.1 Backgrounds (Flow) | Tasks 6, 7 |
| §5.2 Sprites (Flow) | Tasks 6, 7 |
| §5.3 Voice clips (ElevenLabs override) | Tasks 3, 4, 9 |
| §5.4 Sound clips (Pixabay) | Task 8 |
| §5.5 Order of operations | Tasks 6 → 7 → 8/9 |
| §6 PWA cache update | Task 13 |
| §7.1 Unit tests | Tasks 1, 2, 5 |
| §7.2 E2E tests | Tasks 14, 15, 16, 17, 18 |
| §7.3 Manual QA | Task 20 |
| §8 Implementation phases | Whole plan |
| §9 Decisions locked | Carried through |
