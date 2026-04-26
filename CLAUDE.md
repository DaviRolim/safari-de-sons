# Safari de Sons

An English-vocabulary tap game for Davi's son **Natan** (2 years 4 months old, Portuguese-native, loves Madagascar-style animals). Touch an animal in the jungle scene, hear the English word ("LION!") in a warm British voice, then hear the real animal sound. No fail state, no instructions — pure tap-and-respond.

**Live:** https://davirolim.github.io/safari-de-sons/
**Repo:** https://github.com/DaviRolim/safari-de-sons
**v1 shipped:** 2026-04-25

## Audience

This is the first of a planned 9-game series for Natan. Every design decision optimizes for a 2y4m attention span: 2–5 minute play sessions, big tap targets, no reading, no fail-states. The animal squad (lion, zebra, hippo, giraffe, lemur) is reused from the existing storybook project at `../natan-escova-floresta/`.

## Tech stack

Vanilla HTML/CSS/JS + ESM. **No runtime framework.** Vite for dev HMR + static prod build. Service worker for offline. Hosted on GitHub Pages via Actions.

- **Runtime deps:** none.
- **Dev deps:** `vite`, `@playwright/test`, `dotenv`, `sharp`.
- **External services at build time:** ElevenLabs (TTS), Pixabay (animal sounds), Google Labs Flow (image generation).
- **Required tooling on dev machine:** Node ≥ 20 (currently 22.17), `pipx` + `rembg` for sprite alpha extraction, `gh` CLI for repo/Pages management.

## Run / build / test

```bash
npm run dev                  # Vite dev server, HMR, http://localhost:4173
npm run build                # Static bundle to dist/ (also copies assets/)
npm run preview              # Local preview of the prod bundle
npm test                     # node --test, 11 unit tests
npm run test:e2e             # Playwright E2E (5 tests, mobile-landscape WebKit)
npm run sheet:crop           # Legacy: chroma-key crop of the storybook sheet
npm run sheet:refine         # Legacy: rembg refinement on chroma-key crops
npm run voiceover:samples    # Generate 5 candidate voices to voice-samples/
npm run voiceover:generate   # Generate the 5 production voice clips
```

## Project layout

```
safari-de-sons/
├── index.html              # Single-page entry, PWA tags, iOS meta
├── manifest.webmanifest    # via public/, Vite copies to dist/ root
├── service-worker.js       # via public/, cache-first + cache-on-fetch
├── vite.config.js          # base: "./", publicDir: "public"
├── playwright.config.mjs   # mobile project: iPhone 14 landscape (WebKit)
├── package.json            # build script does Vite build + cp -R assets dist/
├── .npmrc                  # pins to public npm (see Gotchas)
├── .env / .env.example     # ELEVENLABS_API_KEY (gitignored)
│
├── src/
│   ├── main.js             # Bootstraps audio + diorama + SW registration
│   ├── diorama.js          # Renders 5 animal buttons, idle scheduler
│   ├── audio.js            # createAudioSystem with cooldown/interrupt/cancel
│   ├── animals.js          # Pure data: 5 animals (id, word, paths, position)
│   └── styles.css          # All theme + animations (wiggle, sparkle, pulse, wave)
│
├── assets/                 # Copied verbatim into dist/assets/ at build time
│   ├── images/             # 5 sprites (Flow-generated) + jungle-bg
│   ├── voice/              # 5 ElevenLabs MP3s (Alice voice)
│   └── sounds/             # 5 Pixabay MP3s + LICENSES.md
│
├── public/                 # Vite copies these to dist/ root verbatim
│   ├── manifest.webmanifest
│   ├── service-worker.js
│   ├── icon-192.png / icon-512.png / splash-1170x2532.png
│
├── scripts/                # Build-time asset generation
│   ├── voiceover-samples.mjs       # ElevenLabs voice audition
│   ├── generate-voiceover.mjs      # ElevenLabs production clips
│   ├── voice-config.mjs            # Pinned voice ID (Alice)
│   ├── crop-character-sheet.mjs    # Legacy chroma-key crop
│   ├── refine-with-rembg.mjs       # Legacy rembg refinement
│   ├── make-icons.mjs              # Generate PWA icons + splash from lion.png
│   ├── crop-config.json            # Bounding boxes for chroma-key crops
│   └── flow-shot-list-v2.md        # Prompts for the v2 sprite expansion
│
├── tests/
│   ├── unit/               # node --test (animals.test.js, audio.test.js)
│   └── e2e/                # Playwright .spec.mjs (tap-flow, pwa, idle-hint)
│
├── .github/workflows/
│   └── deploy.yml          # test → build → deploy on push to main
│
└── docs/
    ├── roadmap.md          # The other 8 games in build order
    ├── asset-workflow.md   # How the sprites/voice/sounds were made
    └── superpowers/
        ├── specs/2026-04-25-safari-de-sons-design.md
        └── plans/2026-04-25-safari-de-sons.md
```

## Conventions

- **Commits:** no co-author lines. Max 2 sentences. Subject in imperative voice.
- **Tests:** TDD where applicable (audio module, animals roster). E2E for layout + integration. Run `npm test` and `npm run test:e2e` before pushing — CI will too.
- **Branching:** straight-to-main. This is a single-developer hobby project.
- **Asset edits:** if you regenerate a sprite/voice/sound, replace the file in `assets/<kind>/` with the same filename. Don't introduce new filenames without updating `src/animals.js`.

## Gotchas / fragile spots

These are the things that bit us during the build. Read these before changing related code.

- **`node --test` glob.** Bash on Ubuntu CI doesn't expand `**` patterns. The `test` script uses `node --test $(find tests/unit -name '*.test.js' | sort)` — keep that or it breaks CI silently.
- **`.npmrc` overrides global JFrog mirror.** The committed `.npmrc` pins the project to the public npm registry, overriding Davi's machine-wide JFrog config. Don't delete it — CI installs will fail.
- **Vite doesn't copy `assets/` automatically.** The `build` script is `vite build && cp -R assets dist/` — the second half is essential. If you add Vite plugins, make sure they don't override this behavior.
- **Service worker version must be bumped manually on every deploy.** `CACHE_VERSION` in `public/service-worker.js` is a static string. Bump it (v3 → v4) when you change any precached file or the page HTML, otherwise returning users get the stale version.
- **Audio.play() must be synchronous from the gesture event.** iOS Safari rejects `play()` after a `setTimeout(>0)` macrotask. The `onTap` handler in `main.js` calls `audio.playSequence` synchronously — keep it that way.
- **Landscape-locked.** The diorama is composed for 16:10. Portrait shows the rotate-hint instead. Don't try to make it work in portrait without a separate composition.
- **Playwright device profile must be `iPhone 14 landscape`** (not `iPhone 14`). Portrait variants hit the "rotate hint" CSS and the e2e tests time out waiting for `.animal`.
- **Spec + plan files require `git add -f`.** Davi's global `~/.gitignore` excludes `docs/`. The committed spec/plan/roadmap/asset-workflow are all force-added.

## Roadmap

The 8 future games are documented in [`docs/roadmap.md`](docs/roadmap.md), ordered by engine reuse. Don't start the next one until Natan has played the current one for at least 2 weeks and shown engagement.

For asset re-generation (existing sprites, new animals, voice updates, etc.) see [`docs/asset-workflow.md`](docs/asset-workflow.md). The Flow workflow itself is encoded in a globally-installed skill at `~/.claude/skills/flow-asset-generation/SKILL.md` (auto-discoverable).
