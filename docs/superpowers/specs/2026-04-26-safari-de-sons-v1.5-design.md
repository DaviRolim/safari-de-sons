# Safari de Sons v1.5 — Two Scenes + Natan Design Doc

**Date:** 2026-04-26
**Status:** Approved (brainstorming complete; awaiting implementation plan)
**Author:** Davi Rolim, with Claude
**Builds on:** [`2026-04-25-safari-de-sons-design.md`](./2026-04-25-safari-de-sons-design.md) (v1)

---

## 1. Overview

v1.5 doubles the world. The single jungle diorama becomes a horizontally-paged two-scene world: the original **Jungle** (5 animals) and a new **Backyard** (5 new animals). Natan — the toddler the game is built for — becomes a visible, tappable character in both scenes, addressing v1's flaw where he was painted into the jungle bg but covered by the cropped hippo sprite.

Tap-target count grows from 5 → 11 distinct identities (10 animals + Natan), rendered as 12 sprite entries since Natan appears in both scenes with a scene-matched pose. The tap-and-respond engine, audio system, idle-hint behavior, and PWA install flow stay unchanged. New mechanics: a swipe-paged scene navigator with edge-peek and page dots, and a per-roster-entry voice override (so Natan's name is spoken in Brazilian Portuguese while everything else stays English).

This is explicitly v1.5, not v2: no multi-pose sprites, no expansion roster beyond the 5 new animals, no save state. Those remain v2.

## 2. Goals

### 2.1 Why this iteration

- Natan-centric: v1's bg silently obscured the very kid the game is for. Making him visible and tappable matches the "this is your world" framing.
- 5 → 10 animal vocabulary doubles the learning surface with the same engine and almost no new code paths.
- Validates a swipe-paged scene mechanic that v2's expanded roster will also need.

### 2.2 Success criteria

1. Natan plays both scenes unassisted across a week (one demo of swipe is enough).
2. He spontaneously says (or attempts) at least 4 of the 10 English animal names after a week.
3. He taps Natan on screen at least once per session and reacts to hearing his own name.
4. PWA install flow unchanged (manifest stays single-install, single-version).
5. Adding an 11th animal is a < 30-min task as before.

### 2.3 Non-goals

- A third scene.
- Multi-pose sprites (still v2).
- Save state / "last scene viewed" (each cold load starts on scene 1).
- Animations during scene swipe beyond the native scroll-snap.
- Settings UI, parent controls, or scene-skip toggles.
- Auto-cycle / scene-rotation on idle.

## 3. User Experience

### 3.1 Two-scene world

```
┌──── viewport ────┐         ┌──── viewport ────┐
│ [scene 1]│peek2 │ ──────►  │peek1 │ [scene 2] │
│  jungle  │      │ swipe ←  │      │ backyard  │
└──────────────────┘         └──────────────────┘
       ● ○                          ○ ●
```

Approximately 6% of the next scene is visible at the screen edge as a discoverability cue. Page dots at the bottom indicate position and are tappable as a swipe fallback.

### 3.2 Scene 1 — Jungle (revised)

The same 5 animals, repositioned to clear Natan at center. The new background is regenerated via Flow with Natan painted into the composition's center and the 5 jungle animals painted into their assigned spots — same "painted twin + cropped overlay" treatment as v1, except the painted hippo no longer occupies center.

### 3.3 Scene 2 — Backyard (new)

Cartoon backyard scene with Natan center-left, a small pond at right (turtle), a tree with a perched bird, a fence in the background with a cow grazing past it, a dog by Natan's side, and a cat curled on the lawn. Same painted-twin + cropped overlay treatment as scene 1.

### 3.4 Tap interaction (unchanged for animals)

Identical to v1: tap → bounce animation + sparkle → English voice clip → animal sound. 1.8s cooldown on same animal; cross-animal taps interrupt.

### 3.5 Tap on Natan

Same flow with the BR-PT voice and a giggle SFX as the "animal sound" companion:

```
[tap on Natan]
  T+0ms      sprite scale-bounce (existing .tapped class)
  T+150ms    BR-PT voice: "Natan!"  (~600ms)
  T+1000ms   giggle SFX             (~700ms)
  T+1700ms   sparkle fades
```

No code branches for Natan: he's a roster entry like any animal, just with `voice: "br-pt"` and a giggle file in `soundPath`.

### 3.6 Swipe / navigation

- Touch drag horizontally; native CSS `scroll-snap` handles momentum and snap-to-page.
- Page dots at bottom-center: 2 dots, 16px circles, 44×44 hit area; tap to programmatically snap to a scene.
- Edge peek: ~6% of next scene visible at the relevant edge.
- No scene transition animation beyond native scroll. Idle pulse re-targets to the visible scene's animals on snap.

### 3.7 Cross-scene concurrency rules

- Tap during a scroll/snap: ignored.
- Audio playing while swiping: continues to completion unless interrupted by a new tap (existing rule).
- Idle pulse cycles **only animals in the currently visible scene**. Hello-wave likewise.
- 2-second idle-hint delay applies after each scene change (so the new scene gets a fresh attract pass).

### 3.8 Edge cases

- Mid-scroll lock-screen / app backgrounding: state is fresh on resume; on cold load we always show scene 1.
- Bad scroll position from a fast swipe-twice: scroll-snap pulls to nearest page; engine waits for snap before re-enabling taps.
- Network drops mid-session: cache covers everything (see §6).

## 4. Architecture

### 4.1 Directory layout (additions and renames)

```
creatives/safari-de-sons/
├── src/
│   ├── main.js                # Bootstrap; wires scenes + diorama + audio
│   ├── diorama.js             # Renders both scene panels, dispatches taps
│   ├── scenes.js              # NEW: swipe/snap/page-dots, emits onChange
│   ├── audio.js               # Unchanged
│   ├── roster.js              # RENAMED from animals.js; 12 entries, scene field
│   └── styles.css             # Adds .scenes-track, .scene-panel, .page-dots
│
├── assets/
│   ├── images/
│   │   ├── jungle-bg.png      # REGENERATED — Natan center, no covered
│   │   ├── backyard-bg.png    # NEW
│   │   ├── lion.png, zebra.png, hippo.png, giraffe.png, lemur.png  # unchanged
│   │   ├── cow.png, dog.png, cat.png, turtle.png, bird.png         # NEW
│   │   ├── natan-jungle.png   # NEW — overlay matching jungle bg
│   │   └── natan-backyard.png # NEW — overlay matching backyard bg
│   ├── voice/
│   │   ├── lion.mp3, zebra.mp3, hippo.mp3, giraffe.mp3, lemur.mp3  # unchanged
│   │   ├── cow.mp3, dog.mp3, cat.mp3, turtle.mp3, bird.mp3         # NEW (British)
│   │   └── natan.mp3                                                # NEW (BR-PT)
│   └── sounds/
│       ├── (existing 5 files)                                       # unchanged
│       ├── cow-moo.mp3, dog-bark.mp3, cat-meow.mp3,
│       │   turtle-splash.mp3, bird-tweet.mp3                        # NEW
│       ├── natan-giggle.mp3                                          # NEW
│       └── LICENSES.md         # extended with new sources
│
├── scripts/
│   ├── generate-voiceover.mjs # extended for voice override
│   ├── voice-config.mjs       # britishVoiceId + brPtVoiceId
│   ├── voiceover-samples.mjs  # extended to also audition BR-PT voice
│   ├── flow-shot-list-v1.5.md # NEW — prompts for 2 bgs + 7 sprites
│   └── (rest unchanged)
│
└── tests/
    ├── unit/
    │   ├── roster.test.js     # RENAMED from animals.test.js, extended
    │   ├── audio.test.js      # unchanged
    │   └── scenes.test.js     # NEW
    └── e2e/
        ├── tap-flow.spec.js   # extended to all 12 sprites, both scenes
        ├── swipe-flow.spec.js # NEW
        ├── page-dots.spec.js  # NEW
        ├── idle-hint.spec.js  # extended (visible-scene-only pulse)
        └── pwa.spec.js        # extended cache list
```

### 4.2 Module boundaries

| Module | Owns | Knows about |
|---|---|---|
| `main.js` | Bootstrap, SW reg, iOS audio unlock | `scenes`, `diorama`, `audio` |
| `roster.js` | 12-entry roster (id, scene, voice, paths, position) | nothing |
| `audio.js` | AudioContext lifecycle, play/interrupt, queue | nothing |
| `scenes.js` | Swipe/snap behavior, page dots, `onChange(sceneId)` | DOM only |
| `diorama.js` | Render two scene panels, dispatch taps, idle hints | `roster`, `audio`, subscribes to `scenes.onChange` |
| `styles.css` | Layout, panel/scene styles, dot styles, keyframes | n/a |

`scenes.js` does not know about animals or audio. `diorama.js` does not know about scroll mechanics. The `onChange` event is the only coupling between them.

### 4.3 Roster shape

```js
// src/roster.js
export const ROSTER = [
  // Scene 1 — Jungle
  { id: "lion",    scene: "jungle",   englishWord: "Lion",
    voicePath: "assets/voice/lion.mp3",  soundPath: "assets/sounds/lion-roar.mp3",
    position: { left: 12, bottom: 18 }, scale: 1.0,  zIndex: 3 },
  { id: "zebra",   scene: "jungle",   englishWord: "Zebra",
    voicePath: "assets/voice/zebra.mp3", soundPath: "assets/sounds/zebra-neigh.mp3",
    position: { left: 30, bottom: 22 }, scale: 0.95, zIndex: 2 },
  { id: "natan-jungle", scene: "jungle", englishWord: "Natan", voice: "br-pt",
    voicePath: "assets/voice/natan.mp3", soundPath: "assets/sounds/natan-giggle.mp3",
    position: { left: 50, bottom: 12 }, scale: 1.0,  zIndex: 5,
    spritePath: "assets/images/natan-jungle.png" },
  { id: "hippo",   scene: "jungle",   englishWord: "Hippo",
    voicePath: "assets/voice/hippo.mp3", soundPath: "assets/sounds/hippo-grunt.mp3",
    position: { left: 68, bottom: 10 }, scale: 1.1,  zIndex: 4 },
  { id: "giraffe", scene: "jungle",   englishWord: "Giraffe",
    voicePath: "assets/voice/giraffe.mp3", soundPath: "assets/sounds/giraffe-bleat.mp3",
    position: { left: 84, bottom: 25 }, scale: 1.05, zIndex: 2 },
  { id: "lemur",   scene: "jungle",   englishWord: "Lemur",
    voicePath: "assets/voice/lemur.mp3", soundPath: "assets/sounds/lemur-chatter.mp3",
    position: { left: 92, bottom: 14 }, scale: 0.85, zIndex: 3 },

  // Scene 2 — Backyard
  { id: "cow",     scene: "backyard", englishWord: "Cow",
    voicePath: "assets/voice/cow.mp3",   soundPath: "assets/sounds/cow-moo.mp3",
    position: { left: 14, bottom: 20 }, scale: 1.0,  zIndex: 2 },
  { id: "dog",     scene: "backyard", englishWord: "Dog",
    voicePath: "assets/voice/dog.mp3",   soundPath: "assets/sounds/dog-bark.mp3",
    position: { left: 32, bottom: 12 }, scale: 0.9,  zIndex: 4 },
  { id: "natan-backyard", scene: "backyard", englishWord: "Natan", voice: "br-pt",
    voicePath: "assets/voice/natan.mp3", soundPath: "assets/sounds/natan-giggle.mp3",
    position: { left: 48, bottom: 12 }, scale: 1.0,  zIndex: 5,
    spritePath: "assets/images/natan-backyard.png" },
  { id: "cat",     scene: "backyard", englishWord: "Cat",
    voicePath: "assets/voice/cat.mp3",   soundPath: "assets/sounds/cat-meow.mp3",
    position: { left: 62, bottom: 10 }, scale: 0.85, zIndex: 3 },
  { id: "bird",    scene: "backyard", englishWord: "Bird",
    voicePath: "assets/voice/bird.mp3",  soundPath: "assets/sounds/bird-tweet.mp3",
    position: { left: 80, bottom: 50 }, scale: 0.7,  zIndex: 2 },
  { id: "turtle",  scene: "backyard", englishWord: "Turtle",
    voicePath: "assets/voice/turtle.mp3", soundPath: "assets/sounds/turtle-splash.mp3",
    position: { left: 88, bottom: 8 },  scale: 0.8,  zIndex: 4 }
];

export const SCENES = ["jungle", "backyard"];
```

`spritePath` defaults to `assets/images/${id}.png` when absent. The two Natan entries override it because they share an English word but use distinct images.

### 4.4 `scenes.js` API

```js
export function createScenes(track, { sceneIds }) {
  // track: HTMLElement with horizontal scroll-snap
  // sceneIds: ["jungle", "backyard"]
  return {
    snapTo(sceneId),       // programmatic snap (page dots use this)
    onChange(callback),    // subscribe to current-scene changes
    getCurrent(),          // returns current sceneId
  };
}
```

Detection of current scene uses `IntersectionObserver` on each panel — the panel with the highest intersection ratio is "current." Emits `onChange` only on transitions, not on every scroll tick.

### 4.5 Idle-hint adaptation

`diorama.js` subscribes to `scenes.onChange`. The pulse cursor and hello-wave both filter the roster by current scene before picking targets. On scene change, the pulse timer resets (so the new scene gets a fresh 2-second attract delay).

## 5. Asset Pipeline

### 5.1 Backgrounds (Flow, 2 generations)

Both generated via Google Labs Flow following the `flow-asset-generation` skill workflow (Claude-in-Chrome, Image mode, Nano Banana 2 free tier, parallel-prompt queueing). Style guardrails reused from the existing storybook prompt set.

- **`assets/images/jungle-bg.png`** — landscape 16:10. Natan center, holding a leaf or stick. Lion at left-mid (~12%), zebra center-left (~30%), hippo right of Natan (~68%), giraffe far-right back (~84%), lemur far-right front (~92%). Painted into the bg as style twins for the cropped overlays.
- **`assets/images/backyard-bg.png`** — landscape 16:10. Natan center-left. Cow grazing past a fence at left, dog beside Natan, cat curled on the lawn, tree at right with bird perched, small pond at far right with turtle.

### 5.2 Sprites (Flow, 7 generations)

Transparent-bg, full-body, single-pose. Style consistent with existing storybook crops (the 5 v1 sprites stay unchanged).

- `cow.png`, `dog.png`, `cat.png`, `turtle.png`, `bird.png` — friendly toddler-safe poses, eyes-forward, mid-action (sitting / wagging / peeking).
- `natan-jungle.png` — Natan in his jungle pose (matches what's painted in jungle-bg).
- `natan-backyard.png` — Natan in his backyard pose (matches what's painted in backyard-bg).

Post-process all 7 with rembg for clean alpha.

### 5.3 Voice clips

Generated by `scripts/generate-voiceover.mjs`. The script reads each roster entry's `voice` field and routes to the corresponding ElevenLabs voice ID from `voice-config.mjs`. Default voice = British (existing v1 voice). Override = `br-pt`.

**One-time BR-PT audition** (mirrors v1's British audition):
1. `npm run voiceover:samples -- --voice br-pt` → 5 sample clips of "Natan!" in 5 candidate Brazilian Portuguese voices into `voice-samples/br-pt/`.
2. Listen, pick favorite.
3. Pin its ID into `voice-config.mjs` as `brPtVoiceId`.

After audition, regular `npm run voiceover:generate` produces all 11 clips (skipping any that already exist unless `--force`).

### 5.4 Sound clips

Manual Pixabay curation per v1's process. Selection criteria unchanged: ≤2s, cartoony > realistic, normalize -3dB peak with ffmpeg.

| File | Source target |
|---|---|
| `cow-moo.mp3` | Pixabay "cow moo cartoon" |
| `dog-bark.mp3` | Pixabay "dog bark small friendly" |
| `cat-meow.mp3` | Pixabay "cat meow cute" |
| `turtle-splash.mp3` | Pixabay "water plop small" (turtles don't vocalize) |
| `bird-tweet.mp3` | Pixabay "songbird short tweet" |
| `natan-giggle.mp3` | Pixabay "toddler giggle short" |

Each entry recorded with source URL + author + license in `assets/sounds/LICENSES.md`.

### 5.5 Order of operations

1. Backgrounds first (Flow, parallel) → review composition matches §5.1 plans → if not, re-prompt.
2. Sprites in parallel with voice + sound generation (these don't depend on bg approval).
3. BR-PT voice audition before voice generation.
4. Final composite review on actual device before declaring assets done.

## 6. PWA & Service Worker

- Cache list grows to ~26 entries. Total footprint ~6–9 MB.
- Service worker version bumps to **v4**. Old caches deleted on activate as before.
- Manifest unchanged. Orientation still landscape-locked.
- iOS splash unchanged; landscape composition still works since Natan stays inside the safe scene area.

## 7. Testing

### 7.1 Unit tests

- **`roster.test.js`** — every entry has id, scene ∈ {jungle, backyard}, position, voicePath, soundPath. Exactly one Natan entry per scene. `voice` if present is in {british, br-pt}. IDs are unique. Positions ∈ [0, 100].
- **`audio.test.js`** — unchanged.
- **`scenes.test.js`** — `snapTo` triggers `onChange`; rapid `snapTo` calls debounce; `onChange` fires only on scene transitions, not every scroll event.

### 7.2 E2E tests (Playwright, mobile viewport)

- **`tap-flow.spec.js`** (extended) — tap each of the 12 rendered sprites (across both scenes), assert correct audio called.
- **`swipe-flow.spec.js`** (new) — load page → swipe right → scene 2 visible → tap a scene-2 animal → assert correct audio. Swipe back → scene 1 visible.
- **`page-dots.spec.js`** (new) — tap right dot → scene 2 active → tap left dot → scene 1 active.
- **`idle-hint.spec.js`** (extended) — pulse fires only on visible-scene animals.
- **`pwa.spec.js`** (extended) — manifest valid, SW v4 registers, full asset list cached.

### 7.3 Manual QA

Before declaring v1.5 done: install on actual iPhone, swipe both directions, tap every target including both Natans, verify giggle plays after BR-PT name, verify edge peek visible without competing, verify no audio overlaps when interrupting cross-scene.

## 8. Implementation Phases (rough)

The detailed plan will be produced by the writing-plans skill. Rough sequence:

1. **Roster refactor.** Rename `animals.js` → `roster.js`, add `scene` and `voice` fields, add 6 new entries (5 animals + 1 Natan stub), update tests.
2. **Voice override pipeline.** Extend `voice-config.mjs`, `generate-voiceover.mjs`, `voiceover-samples.mjs` to handle `voice` field + BR-PT audition.
3. **Asset generation.** Run Flow for 2 bgs + 7 sprites; rembg post-process; manual sound curation; voice generation. End-state: all assets in repo.
4. **`scenes.js` module.** Pure module + tests, no DOM integration yet.
5. **Diorama wiring.** Two scene panels rendered; existing tap engine works per scene.
6. **Scenes integration.** Wire `scenes.js` into `diorama.js` for visible-scene-only idle hints.
7. **Page dots + edge peek styling.**
8. **PWA cache update + version bump.**
9. **E2E tests + manual iPhone QA.**
10. **Roadmap docs update** (`docs/roadmap.md` adds v1.5 row; `flow-shot-list-v1.5.md` committed).

## 9. Decisions Locked

| Decision | Choice | Why |
|---|---|---|
| Scene model | Two static dioramas, swipe-paged | Preserves storybook feel; lets each scene breathe |
| Navigation | Edge swipe + edge peek + page dots | Discoverable; tap-fallback if swipe fails |
| Scene 2 setting | Backyard | Cleanest counterpoint to jungle; natural placement for cow/dog/cat/turtle/bird |
| Asset path | Full Flow regeneration (2 bgs + 7 sprites) | One Flow session is cheaper than two; cleanest result |
| Natan model | Dual sprite (one per scene) | Simpler engine; no parallax mechanic |
| Natan tap | Tappable, BR-PT voice, giggle SFX | Matches the kid's expectation; reuses engine |
| BR-PT voice | New ElevenLabs voice ID, audition flow | Same process as v1's British voice |
| Scene-1 fix | Regenerate bg with Natan at center, hippo offset | Painted-twin treatment requires bg regen |
| Idle hint | Visible-scene only | Avoids pulsing offscreen targets |
| Auto-cycle on idle | Rejected | Edge peek + dots already signal "more"; auto-cycle would feel out-of-control |
| Save state | Rejected | Each cold load starts on scene 1; aligns with v1 statelessness |
| Out-of-scope for v1.5 | 3rd scene, multi-pose, save state | Defer to v2 or later |

## 10. Open Items (deferred to implementation)

- Specific BR-PT ElevenLabs voice ID — picked during audition.
- Exact Pixabay URLs for the 6 new sound clips.
- Final pixel-precise positions for animals after bgs are generated (current values in §4.3 are targets, will be calibrated against the actual bg).
