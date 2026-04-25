# Safari de Sons — Design Doc

**Date:** 2026-04-25
**Status:** Approved (brainstorming complete; awaiting implementation plan)
**Author:** Davi Rolim, with Claude

---

## 1. Overview

Safari de Sons is the first of a planned series of interactive web micro-games for Natan (2 years 4 months). Each game targets a specific developmental skill in a 2–5 minute play session, uses custom assets that connect to his world (the Madagascar-style animal squad already established in the `natan-escova-floresta` storybook), and is delivered as an installable PWA.

Safari de Sons specifically teaches **English animal vocabulary** through a tap-and-respond loop: tap an animal in a jungle scene, hear its English name spoken in a warm British voice, then hear its real animal sound. No instructions, no fail state, infinite replay.

This is v1 of v1: 5 animals, one screen, one mechanic. Everything else is intentionally out of scope.

## 2. Goals

### 2.1 Why this game first

Of nine candidate games brainstormed, Safari de Sons was chosen as the starter because it has:

- **Lowest implementation risk.** Pure tap-and-respond, no fail state, no instructions to follow. A 2y4m can grasp it instantly.
- **Lowest asset cost.** Reuses the existing `character-sheet.png` from the `natan-escova-floresta` storybook — no Flow generation needed for v1.
- **Highest engine reuse for follow-on games.** The diorama + tap + audio engine forms 70% of what Peek-a-Boo, Body Parts, and Sugar-Bug Counting will need.
- **Strong vocab payoff.** Five solid English words on day one, expandable cheaply.

### 2.2 Success criteria (concrete, observable)

1. Natan plays it unassisted (after a one-time demo) for at least **3 separate sessions across a week**.
2. He says (or attempts) at least **2 of the 5 English animal names spontaneously** after a week of play.
3. Game is **installable as a PWA** on iPhone home screen and runs offline after first load.
4. Loads to playable in **< 2 seconds** on a 4G iPhone.
5. Adding a 6th animal is a **< 30-min task** (drop image + run voiceover script).

### 2.3 Non-goals (explicitly out of v1 scope)

- Score, levels, progression, unlocks.
- Settings menu (no parent-facing controls; volume is a constant in code).
- Multi-language toggle (English-only, hard-coded).
- Cross-device save state (each session is fresh).
- Analytics or telemetry. Success is measured by parent observation.
- Animations richer than CSS transforms (no sprite sheets, no skeletal animation).

## 3. User Experience

### 3.1 Audience and constraints

- **Primary user:** Natan, age 2 years 4 months, pre-reader, Portuguese-native.
- **Device:** primarily iPhone (PWA on home screen). Also runs on Mac in a browser for development.
- **Language displayed/spoken:** English only (rationale: at this age, single-label-per-object accelerates vocabulary acquisition more reliably than bilingual prompts; supported by Pearson/Conboy L2 toddler research).

### 3.2 Layout — Diorama Scene

All five animals are nestled into a single jungle composition with foreground/background depth, mirroring the `character-sheet.png` from the storybook. Aspect ratio 16:10, locked to landscape.

Approximate composition (to be refined by inspecting the source crops):

| Animal  | Position           | Z-depth      |
|---------|--------------------|--------------|
| Lion    | Left, mid-back     | Mid          |
| Zebra   | Center-left, back  | Back         |
| Hippo   | Center, foreground | Front        |
| Giraffe | Right, back        | Back (tall)  |
| Lemur   | Right, foreground  | Front        |

Tap-target ambiguity (he might tap a leaf or sky) is mitigated by an idle hint (see 3.4) rather than visual outlines around animals — outlines would break the storybook feel.

### 3.3 The core tap interaction

```
[tap on animal]
  ↓
  T+0ms      animal animation plays    (CSS transform: scale up + slight wiggle, 600ms)
  T+0ms      idle hint pauses for 4s
  T+150ms    ElevenLabs voice clip:    "LION!"           (~600–900ms)
  T+1100ms   stock animal sound:       lion-roar.mp3     (~700ms)
  T+1800ms   small sparkle particle    fades out
  ↓
[ready for next tap]
```

**Word before sound** is intentional: the English label is the learning target, and it should land first while attention is fresh. The animal sound is the dopamine reward.

### 3.4 Idle / attract behavior

- After **2 seconds** with no taps from page load, an idle hint kicks in: a soft pulsing glow cycles through animals one at a time (~1.5s each) until the first tap.
- After any tap, idle hint pauses for **4 seconds**, then resumes.
- After **60 seconds** of no taps, a single low-key animation: a randomly chosen animal does a "hello" wave (lasts ~1.5s, then returns to its resting pose). Then back to idle.
- **No attract sounds** — silence respects nearby parents.

### 3.5 Concurrency rules

- **Rapid taps on the same animal:** ignore taps for **1.8s** while the clip is playing. Animation ignores cooldown — he sees instant visual feedback even if audio is gated.
- **Tap on a different animal mid-clip:** interrupt current clip, play new one. Toddlers don't politely wait — interrupting matches their tempo.
- **Audio not yet loaded:** animal animates, sparkle plays, audio is silent. No error UI, ever.

### 3.6 Input modalities

- **Touch** is primary. `touchstart` is used (not `click`) for ~200ms-faster feel on iOS.
- **Mouse click** works for Mac dev experience.
- **No keyboard, no swipe gestures, no long-press.** Only single taps.

### 3.7 Edge cases

- **iOS audio unlock:** Web Audio is muted until first user interaction. The first tap doubles as the unlock gesture; we play normally on first tap with no special handling needed.
- **Orientation:** locked to landscape via PWA manifest. Diorama is composed for 16:10. Portrait shows a friendly "rotate device" hint.
- **Screen lock during play:** game state is stateless, so on resume the diorama is exactly as it was.
- **Network drops mid-session:** all assets are cached after first load. No network ⇒ no problem.

## 4. Architecture

### 4.1 Directory layout

```
creatives/safari-de-sons/
├── index.html                 # SPA entry, no router
├── manifest.webmanifest       # PWA manifest
├── service-worker.js          # Cache-first SW
├── package.json
├── vite.config.js             # Vite for dev HMR + prod static build
├── playwright.config.mjs      # E2E test config
├── .env                       # ELEVENLABS_API_KEY (gitignored)
├── .env.example               # Committed template
├── .gitignore                 # Includes .env, voice-samples/, dist/, node_modules/
│
├── .github/
│   └── workflows/
│       └── deploy.yml         # CI: test + build + deploy to gh-pages on push to main
│
├── src/
│   ├── main.js                # Entry: bootstraps, mounts diorama, registers SW
│   ├── diorama.js             # Renders animals, handles taps, animations, idle hint
│   ├── audio.js               # Audio system: load, play, interrupt, iOS unlock
│   ├── animals.js             # Roster data: id, name, English word, voice path, sound path, position, scale, z-index
│   └── styles.css             # Layout, theme, animation keyframes
│
├── assets/
│   ├── images/
│   │   ├── jungle-bg.png      # Backdrop (cropped from existing character sheet)
│   │   ├── lion.png           # Transparent crops from character-sheet.png
│   │   ├── zebra.png
│   │   ├── hippo.png
│   │   ├── giraffe.png
│   │   └── lemur.png
│   ├── voice/                 # Generated by scripts/generate-voiceover.mjs
│   │   ├── lion.mp3
│   │   ├── zebra.mp3
│   │   ├── hippo.mp3
│   │   ├── giraffe.mp3
│   │   └── lemur.mp3
│   └── sounds/                # Curated from Pixabay/Freesound
│       ├── LICENSES.md        # Source URL + license per file
│       ├── lion-roar.mp3
│       ├── zebra-neigh.mp3
│       ├── hippo-grunt.mp3
│       ├── giraffe-bleat.mp3
│       └── lemur-chatter.mp3
│
├── voice-samples/             # GITIGNORED — first-run audition output, not committed
│
├── scripts/
│   ├── generate-voiceover.mjs # Reads animals.js, calls ElevenLabs, writes voice/*.mp3
│   ├── voice-config.mjs       # Pinned voice ID after first-run sample selection
│   ├── crop-character-sheet.mjs # Cuts character-sheet.png into 5 transparent PNGs
│   ├── crop-config.json       # Bounding boxes per animal
│   └── flow-shot-list-v2.md   # Roadmap doc — Flow prompts for v2 sprite expansion
│
├── public/
│   ├── icon-192.png           # PWA icons
│   └── icon-512.png
│
├── tests/
│   ├── e2e/                   # Playwright
│   │   ├── tap-flow.spec.js
│   │   ├── pwa.spec.js
│   │   └── idle-hint.spec.js
│   └── unit/                  # node --test
│       ├── animals.test.js
│       └── audio.test.js
│
└── docs/
    ├── roadmap.md             # The 8 other games + v2 expansion notes
    └── superpowers/specs/     # This file
```

### 4.2 Module boundaries

| Module        | Owns                                                                  | Knows about           |
|---------------|-----------------------------------------------------------------------|-----------------------|
| `main.js`     | Bootstrap, SW registration, iOS audio unlock on first tap             | `diorama`, `audio`    |
| `diorama.js`  | DOM rendering of animals, idle hint, tap dispatch, animation triggers | `animals` data, `audio` API |
| `audio.js`    | AudioContext lifecycle, preloading, play/interrupt, queue rules       | nothing (pure module) |
| `animals.js`  | Roster array. Pure data. No logic.                                    | nothing               |
| `styles.css`  | Layout, theme, keyframes (`bounce`, `pulse`, `sparkle`)               | nothing               |

No circular dependencies. `audio.js` and `animals.js` are leaves (no internal deps) and trivially unit-testable.

### 4.3 Tech dependencies

**Runtime:** none. Production bundle is plain HTML/CSS/JS modules.

**Dev dependencies:**
- `vite` — dev server with HMR + prod static build.
- `@playwright/test` — e2e tests, matching existing project's pattern.
- `dotenv` — for the voiceover script. Chosen over Node 22+ `--env-file` for portability.
- `sharp` — for the chroma-key cropping script.

### 4.4 Build/run commands

```
npm run dev                 # Vite dev server with HMR
npm run build               # Static bundle to dist/
npm run preview             # Local preview of the prod bundle
npm run voiceover:generate  # Calls ElevenLabs, writes assets/voice/*.mp3
npm run voiceover:samples   # Generates 5 sample voices to voice-samples/ (one-time)
npm run sheet:crop          # One-off: cut character-sheet.png → individual PNGs
npm test                    # node --test
npm run test:e2e            # Playwright
```

## 5. Asset Pipeline

### 5.1 Voice clips (ElevenLabs)

- **Script:** `scripts/generate-voiceover.mjs`
- **Source of truth:** roster lives in `src/animals.js` — script reads from there to avoid duplicate word lists.
- **Voice profile:** warm + playful **British female** (Peppa-adjacent, given Natan's familiarity with Peppa Pig).
- **Voice ID picking flow (one-time):** on first run, the script generates 5 sample clips of "LION!" using 5 different British-female voice IDs into `voice-samples/`. Listen, pick favorite, pin its ID into `scripts/voice-config.mjs`. Then real generation runs.
- **Prompt format:** `"<Word>!"` — single word, exclamation. Short, punchy, energetic.
- **Model:** `eleven_multilingual_v2` (high quality).
- **Output:** MP3 44.1kHz 128kbps. Universal browser support; ~12–20 KB per clip.
- **Idempotence:** skips files that already exist unless `--force` is passed.
- **API key:** lives in gitignored `.env`. The key was transmitted in conversation during brainstorming and **should be rotated on the ElevenLabs dashboard** before first commit, then the rotated key placed into `.env`.

### 5.2 Animal sprites (cropping)

The existing `natan-escova-floresta/assets/generated/character-sheet.png` has all 5 animals in one composition. We extract each as a transparent PNG.

**Default approach:** `scripts/crop-character-sheet.mjs` using `sharp` with bounding boxes from `scripts/crop-config.json` and a chroma-key for the jungle background. Pure-Node, zero external tools.

**Fallbacks if chroma cuts look rough:**
- **Manual edit in Pixelmator/Photopea** — 20 min hand-cutting, best edges.
- **Local `rembg` (Python AI bg removal)** — better edges than chroma-key, but adds Python tooling.

These fallbacks are documented but not implemented in v1. Decision is made by inspecting v1's chroma-key output.

### 5.3 Animal sounds (stock library curation)

- **Source:** Pixabay Sound Effects (CC0) primary. Freesound.org (mostly CC-BY) fallback.
- **Process (manual, one-time):** for each animal, search "lion roar short" etc., preview 3–5 candidates, download the punchiest 1–2 second clip.
- **Selection criteria:**
  - ≤ 2 seconds (long roars get ignored at this age).
  - Cartoony / exaggerated > realistic. Goofiness wins.
  - Mid-volume; normalize to -3 dB peak with `ffmpeg`.
- **Hygiene:** commit `assets/sounds/LICENSES.md` listing each file's source URL + license.

### 5.4 v2 Flow shot list (roadmap-only)

`scripts/flow-shot-list-v2.md` will document Flow prompts for upgrading sprites in v2 — multi-pose sprites for the 5 animals plus ~10 expansion animals. Documentation only; no code.

## 6. PWA, Hosting & Deployment

### 6.1 Manifest

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

### 6.2 iOS-specific tags (Apple ignores most of the manifest)

```html
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
<link rel="apple-touch-icon" href="icon-192.png">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
```

A single iOS splash for one common iPhone resolution is included. Covering all resolutions is a maintenance pit; one good fallback is enough.

CSS uses `env(safe-area-inset-*)` so the diorama respects the notch.

### 6.3 Service worker

- Single `service-worker.js`, ~40 lines, no Workbox dependency.
- **Strategy: cache-first for everything**, with a versioned cache name.
- `install`: precache the full asset list (HTML, JS, CSS, all 5 sprites, 5 voice clips, 5 sounds, manifest, icons).
- `fetch`: serve from cache; fall through to network only on cache miss.
- `activate`: delete old cache versions.
- Cache version bumps automatically per deploy via build-time hash.
- Total cache footprint estimate: ~3–5 MB.

### 6.4 Icon

`icon-192.png` and `icon-512.png` from a simple composition: lion's head (cropped from the character sheet) on a dark-jungle-green circle. Maskable variant pads corners so iOS/Android crops without cutting the lion's face.

### 6.5 Hosting: GitHub Pages

- **Repo strategy:** per-game repo. New repo `safari-de-sons`, independent of `creatives/`. Reasoning: cleanest GitHub Pages setup, independent lifecycle per game, no risk of one broken commit blocking another's deploy.
- **Domain:** default `https://<github-username>.github.io/safari-de-sons/` (resolved when the repo is created). Custom domain easy to add later.
- **Deploy flow:**
  1. Push to `main`.
  2. GitHub Action runs `npm ci && npm run build`, publishes `dist/` to `gh-pages` branch.
  3. Live in ~30 seconds.
- **iPhone install flow:** Safari → Share → Add to Home Screen → tap icon → fullscreen, offline-capable.

## 7. Testing

### 7.1 Unit tests (`node --test`)

- `animals.test.js` — roster shape (every animal has id, name, position, voice path, sound path); IDs are unique; positions are in valid 0–100% range.
- `audio.test.js` — interrupt logic, cooldown gate, queue behavior. Uses a fake audio backend (no real `<audio>`).

### 7.2 E2E tests (Playwright, mobile viewport)

- `tap-flow.spec.js` — load page → wait for diorama → tap each of 5 animals → assert tapped sprite gets `tapped` class and `audio.play()` was called for the right clip.
- `pwa.spec.js` — manifest is valid, service worker registers successfully, page loads from cache after a network-disabled second visit.
- `idle-hint.spec.js` — after 2s with no taps, `pulse` class is on an animal.

### 7.3 Manual QA

Whether the lion's wiggle feels delightful, or whether the roar makes Natan giggle, is not something Playwright can tell us. Plan to manually QA the assembled experience on the actual iPhone before declaring v1 done.

### 7.4 CI

Unit + e2e run on every PR via the same GitHub Action that handles deploys.

## 8. Implementation Phases (rough)

The detailed plan will be produced by the writing-plans skill. Rough sequence:

1. **Bootstrap.** Empty Vite project, gitignored `.env`, `.env.example`, GH Action skeleton. Deploy a "hello world" to GH Pages so the deploy path is proven before anything else matters.
2. **Asset pipeline.** Crop script, voiceover script, manually-curated sounds. End-state: all 5 sprites + 5 voice clips + 5 sounds in the repo.
3. **Audio system.** `audio.js` with tests. Pure module, no DOM.
4. **Diorama + tap flow.** `diorama.js` renders 5 animals on jungle background, taps trigger audio. No idle hint yet.
5. **Polish.** Idle hint, sparkles, animations — the "feels good" pass.
6. **PWA.** Manifest, SW, icons. Installable.
7. **E2E + iPhone manual QA.** Fix anything QA reveals.
8. **Document roadmap.** `docs/roadmap.md` + `scripts/flow-shot-list-v2.md`.

Each phase is independently shippable and reviewable.

## 9. Roadmap (post-v1, documentation-only)

The 8 other brainstormed games, in recommended build sequence:

| # | Game | Skill | Why this order |
|---|---|---|---|
| 1 | Safari de Sons | Vocab + cause/effect | **v1 — building now.** Engine foundation. |
| 2 | Cadê? Achou! (Peek-a-Boo Safari) | Object permanence + vocab | Reuses ~80% of Safari's engine. Adds a "hidden" state and reveal animation. Days, not weeks. |
| 3 | Cadê o Nariz do Natan? (Body Parts) | Body-part vocab | First game to use a Natan-faced asset (cropped from existing storybook art). New scene, same tap-target engine. |
| 4 | Conta os Bichinhos (Sugar Bug Counting) | Counting 1–3 | Uses existing Bichinhos do Açúcar art. New mechanic (count tracker), same audio system. |
| 5 | Frutas dos Lêmures (Color Hunt) | Colors | First game with a "right answer". Audio system extends with correct/try-again pattern. |
| 6 | Alimenta o Hipopótamo (Feed the Hippo) | Food vocab + drag-drop | First drag-drop game. Adds touch-gesture handling. |
| 7 | Sombras dos Animais (Shadow Match) | Shape recognition | Reuses Color Hunt's right-answer pattern + drag-drop. |
| 8 | Vestir o Leão (Dress the Lion) | Clothing vocab | Compositional drag-drop (multiple items onto one target). |
| 9 | Dia e Noite (Morning vs Bedtime) | Routine sequencing | Most complex — sorting into two zones. Save for last. |

**v2 sprite expansion for Safari de Sons:** 4 poses per existing animal + 10 new animals from `flow-shot-list-v2.md`. To be evaluated only after v1 has been validated by Natan playing it for several weeks.

Bath/hygiene game is explicitly excluded — already covered by the existing tooth-brushing storybook.

## 10. Decisions Locked, with Rationale

| Decision | Choice | Why |
|---|---|---|
| Scope of v1 | Single game (Safari de Sons) | Avoid over-investing in 8 games before learning what Natan engages with. |
| TTS engine | ElevenLabs (build-time MP3 generation) | High quality, consistent across devices, no runtime network. |
| Voice profile | Warm British female (Peppa-adjacent) | Familiar pronunciation, clear articulation, well-suited to vocab modeling. |
| Voice ID | Picked via 5-sample audition on first run | Avoids guessing, matches taste. |
| Animal sounds | Real recordings from Pixabay/Freesound | More visceral and laugh-inducing than TTS-generated SFX. |
| Language | English only (no PT translations) | Single-label-per-object accelerates vocab acquisition (Pearson/Conboy). |
| Layout | Diorama scene (single composition) | Reuses existing character-sheet asset; storybook-magical feel. |
| Tech stack | Vanilla HTML/CSS/JS + Vite (dev only) + ESM | Matches existing project pattern; minimal new concepts. |
| Folder | `creatives/safari-de-sons/` | Sibling to `natan-escova-floresta/`. |
| Hosting | GitHub Pages | Free, HTTPS, trivial deploys. |
| Repo strategy | Per-game repo | Independent lifecycle, simpler GH Pages config. |
| Asset reuse for v1 | Crop existing `character-sheet.png` | Zero Flow generation, fastest path to playable. |
| v2 expansion | Documented Flow shot list, no code | Defer investment until Natan validates v1. |
| Cropping approach | `sharp` chroma-key (default), Pixelmator/rembg as fallbacks | Pure-Node, no extra tooling unless needed. |
| Tap audio cooldown | 1.8s on same animal; interrupt across animals | Matches toddler tap rhythm. |
| Word/sound order | Word first, sound after | Word is the learning target; should land while attention is fresh. |
| Orientation | Landscape lock | Diorama is composed for 16:10. |

## 11. Open Items (deferred to implementation)

- Specific ElevenLabs voice ID — picked during voiceover sample audition.
- Specific stock sound URLs — picked during sound curation.
- Exact bounding-box coordinates for the 5 animal crops — measured against `character-sheet.png` during the crop script's first run.
- Exact landscape splash-screen image dimensions for iPhone — picked during PWA polish phase.
