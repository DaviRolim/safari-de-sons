# Asset Workflow — Safari de Sons

How every asset in this project was generated, and how to regenerate or extend them. Useful for v2 expansion (10 more animals + multi-pose sprites) and as a template for sibling games (Peek-a-Boo Safari, Body Parts, etc.).

## TL;DR

| Asset class | Tool | Cost | Time |
|---|---|---|---|
| Animal sprites (5) | **Google Labs Flow** (Nano Banana 2) → `rembg` | Free | ~3 min total for 5 |
| Voice clips (5) | **ElevenLabs API** (voice: Alice, Brit female) | ~Free tier | ~1 min total for 5 |
| Animal sounds (5) | **Pixabay** (curated via claude-in-chrome MCP) | Free, royalty-free | ~5 min for 5 |
| PWA icons + splash | **`sharp`** compositing the lion sprite on green | Free, local | <1 sec |

The full pipeline is repeatable and partially automated. The only piece a human can't skip is **picking** — voice samples, Pixabay candidates, and visual inspection of generated sprites.

---

## 1. Animal sprites (Flow + rembg)

### What we tried first that didn't work

The existing storybook project (`../natan-escova-floresta/`) has a `character-sheet.png` with all 5 animals + Natan + sugar bugs in one composition. Initial plan: crop bounding boxes + chroma-key the green background.

**Failure mode:** the animals are densely packed and overlap each other. Chroma-key only removes the jungle-green background — it can't separate a giraffe from the hippo in front of it. Even with tight bounding boxes and `rembg` AI background removal, 3 of 5 crops included neighbor animals.

The kept artifacts (`scripts/crop-character-sheet.mjs`, `scripts/refine-with-rembg.mjs`, `scripts/crop-config.json`) are the legacy chroma-key approach. They're not used in production but kept in case someone wants to crop a different storybook sheet.

### What worked: Flow-generated isolated characters

**Tool:** Google Labs Flow with the Nano Banana 2 image model (free tier, 0 credits per image). Driven through the **`claude-in-chrome` MCP** (the Claude in Chrome browser extension). This pattern is encoded in a globally-installed skill: `~/.claude/skills/flow-asset-generation/SKILL.md`.

**Project URL** (specific to Davi's account): `https://labs.google/fx/tools/flow/project/3e73cdef-4398-467a-9916-5482ec1fbfb3`

**Key trick: parallel queueing.** Flow accepts new prompt submissions while older ones are still rendering. Submitting all 5 prompts back-to-back with 2-second gaps gets them all done in ~30–45 seconds, vs. ~3–5 minutes if done sequentially.

**Prompt template** (proven for storybook-consistent isolated characters):

```
Polished 3D cartoon illustration of a single original {ANIMAL} character,
full body visible, {POSE_DESCRIPTION}. The {ANIMAL} has {DISTINCTIVE_FEATURES}.
Style is rounded, expressive, with bedtime warmth - similar to a polished
children's storybook 3D animation. Plain solid white background, isolated
single character, no other animals, no scenery, no text. Three-quarter front view.
```

The tail (`Plain solid white background, isolated single character, no other animals, no scenery, no text`) is **load-bearing** — without it, Nano Banana 2 will sometimes add a jungle scene or a second character.

The five exact prompts used for v1 are below. Each generates a single character.

<details>
<summary>Lion prompt</summary>

```
Polished 3D cartoon illustration of a single original theatrical lion character,
full body visible, standing proudly with one paw raised in a friendly wave.
The lion has a warm orange-brown mane, a friendly toothy smile, big expressive
eyes, soft golden-cream body, wearing a small red theatrical cape draped over
his back. Style is rounded, expressive, with bedtime warmth - similar to a
polished children's storybook 3D animation. Plain solid white background,
isolated single character, no other animals, no scenery, no text.
Three-quarter front view.
```
</details>

<details>
<summary>Zebra prompt</summary>

```
Polished 3D cartoon illustration of a single original funny zebra character,
full body visible, standing happily. The zebra has a bright wide friendly
smile with visible teeth, expressive cartoon eyes, distinctive black and
white stripes covering body and legs, a soft mohawk-like mane down the neck,
small ears, a swishy tail. Style is rounded, expressive, with bedtime warmth
- similar to a polished children's storybook 3D animation. Plain solid white
background, isolated single character, no other animals, no scenery, no text.
Three-quarter front view.
```
</details>

<details>
<summary>Hippo prompt</summary>

```
Polished 3D cartoon illustration of a single original gentle hippo character,
full body visible, standing happily with a warm friendly smile. The hippo has
a chubby round body, soft warm gray-brown skin, big expressive eyes, small
round ears, a wide kind mouth showing happy small teeth, short stubby legs.
Style is rounded, expressive, with bedtime warmth - similar to a polished
children's storybook 3D animation. Plain solid white background, isolated
single character, no other animals, no scenery, no text. Three-quarter front view.
```
</details>

<details>
<summary>Giraffe prompt</summary>

```
Polished 3D cartoon illustration of a single original clumsy giraffe character,
full body visible, standing happily. The giraffe has a tall slim neck, two
small rounded horns, big friendly eyes, a warm playful smile, light cream-
colored body with soft brown spots, hooves visible at the bottom. Style is
rounded, expressive, with bedtime warmth - similar to a polished children's
storybook 3D animation. Plain solid white background, isolated single character,
no other animals, no scenery, no text. Three-quarter front view.
```
</details>

<details>
<summary>Lemur prompt</summary>

```
Polished 3D cartoon illustration of a single original festive lemur character,
full body visible, standing happily on hind legs. The lemur is small with big
round amber-orange eyes, a long fluffy striped tail (white with gray or black
bands), soft gray and white fur, a playful joyful expression, small front paws
held up. Style is rounded, expressive, with bedtime warmth - similar to a
polished children's storybook 3D animation. Plain solid white background,
isolated single character, no other animals, no scenery, no text.
Three-quarter front view.
```
</details>

### Download → process pipeline

For each generated image:

1. **Click thumbnail** in the Flow gallery → opens detail view (URL gains `/edit/{id}`).
2. **Click `Download`** at top-right (~1241, 40 on 1489×812).
3. **Click `1K Original size`** in the dropdown (~1184, 93). Free tier; 2K Upscaled also free; 4K paid.
4. Browser downloads to `~/Downloads/` named like `Lion_character_waving_202604251416.jpeg`.
5. **Click `Done`** (~1429, 40) to return.

Pixel coordinates may shift if Flow's UI updates — always screenshot first; use `mcp__Claude_in_Chrome__find` semantically as fallback.

The downloads are **JPEG with solid white background**, NOT transparent PNG. Convert with `rembg`:

```bash
# One-time install (the [cpu,cli] extras are required —
# plain `rembg` fails due to missing onnxruntime):
pipx install "rembg[cpu,cli]"

# Per file:
rembg i ~/Downloads/Lion_character_waving_202604251416.jpeg assets/images/lion.png
```

First `rembg` invocation downloads ~170MB U^2-Net model into `~/.u2net/` (cached after).

### Known limitation: no programmatic reference upload

Verified 2026-04-25: `mcp__Claude_in_Chrome__file_upload` against Flow's hidden file input fails with `"Not allowed"` — the MCP doesn't permit local-file uploads to file inputs. Workaround: rely on detailed text prompts. If you really need a reference image, upload it manually via Flow's UI before starting the automated session.

### Adding a new animal (e.g., for a v2 sprite)

1. Open the Flow project in Chrome (with the extension paired).
2. Switch to Image mode + 3:4 aspect.
3. Submit the prompt from the template above.
4. Wait ~10 seconds for completion.
5. Click thumbnail → Download → 1K Original.
6. `rembg i ~/Downloads/{filename} assets/images/{new-animal}.png`.
7. Add the new animal to `src/animals.js` with its `id`, `englishWord`, `voicePath`, `soundPath`, `position`, `scale`, `zIndex`.
8. Add precache entries to `public/service-worker.js` and bump `CACHE_VERSION`.
9. Generate the voice clip via `npm run voiceover:generate` (the script reads from `animals.js`).
10. Curate a new animal sound from Pixabay (see section 3 below).
11. Update `assets/sounds/LICENSES.md` with the new source URL and author.

---

## 2. Voice clips (ElevenLabs)

### Voice selection — done once per project

`scripts/voiceover-samples.mjs` generates the same word ("Lion!") in 5 different British female voices into `voice-samples/` (gitignored). Listen to each in Finder QuickLook, pick a favorite, pin its voice ID in `scripts/voice-config.mjs`.

For Safari de Sons we picked **Alice** (`Xb7hH8MSUJpSbSDYk0k2`). Other free-tier British female voices that worked: Lily (`pFZP5JQG7iQjIQuC4Bku`), Sarah (`EXAVITQu4vr4xnSDxMaL`), Laura (`FGY2WhTYpPnrIDTdsKH5`).

**Voice that doesn't work for free tier:** Charlotte (`XB0fDUnXU5powFXDhCwa`) — returns HTTP 402 `paid_plan_required` because it's classified as a "library voice." Note for future projects.

**Voice settings used:**
```js
{ stability: 0.4, similarity_boost: 0.75, style: 0.5 }
// Model: eleven_multilingual_v2
// Output: mp3_44100_128
```

### Production generation

```bash
npm run voiceover:generate            # idempotent, skips existing files
npm run voiceover:generate -- --force # regenerate all
```

The script reads from `src/animals.js` — each animal's `englishWord` becomes the prompt (e.g., `"Lion!"`). Output writes to each animal's `voicePath`.

### Cost

For Safari de Sons: 5 single-word prompts × ~6 chars each ≈ 30 chars total. ElevenLabs free tier covers this trivially. Even a project with 50 words is well under the free quota.

### API key

Lives in `.env` (gitignored). The variable is `ELEVENLABS_API_KEY`. The committed `.env.example` is a template with no value. If a key was leaked in a previous chat (it has been — the v1 build started with a leaked key), rotate it on the ElevenLabs dashboard and update `.env`.

---

## 3. Animal sounds (Pixabay, curated via browser)

### Why not generate?

ElevenLabs has a Sound Effects API and could synthesize roars/grunts/etc. We chose real recordings from **Pixabay Sound Effects** instead because, at the toddler level we're targeting, the *visceral* quality of a real lion roar is what makes Natan laugh. Synthetic SFX feel flat in comparison.

Pixabay's Content License is permissive: free for commercial and non-commercial use, no attribution required (we record attribution anyway in `assets/sounds/LICENSES.md` for hygiene).

### Workflow (semi-automated)

We drove Pixabay search via the `claude-in-chrome` MCP. Repeating it for a new animal:

1. **Navigate** to `https://pixabay.com/sound-effects/search/{animal}/` (e.g., `lion-roar`).
2. **Skim the result list.** Pixabay shows title, author, duration, category. Look for:
   - Duration ≤ 2 seconds (long roars get ignored at this age).
   - Cartoony / exaggerated > realistic. "Goofiness wins" in toddler audio.
3. **Click into a candidate's detail page.**
4. **Click `Free download`** (right side, ~1244, 175 on 1489×812).
5. **Cookie banner** may appear on first visit — click "Reject All" to dismiss.
6. The file lands in `~/Downloads/` named like `{author}-{title-slug}-{id}.mp3`.

### Substitutions used

Some animals don't have widely-recognized vocal sounds in stock libraries:

- **Zebra** has 16 results on Pixabay, mostly unrelated. We substituted a **horse neigh** (281 results, plenty to choose from). Standard for kid content.
- **Lemur** has only 1 result, which is a person saying the word. We substituted a **monkey chatter** (356 results).
- **Giraffe** has 19 results; "Jerapah" (Indonesian for giraffe) at 0:02 was the best fit and is an actual giraffe sound.

These substitutions are recorded in `assets/sounds/LICENSES.md`.

### Optional normalization

The plan recommends normalizing each clip to -3 dB peak via `ffmpeg loudnorm`:

```bash
for f in assets/sounds/*.mp3; do
  ffmpeg -y -i "$f" -filter:a "loudnorm=I=-16:TP=-3:LRA=11" -ar 44100 "${f%.mp3}-norm.mp3"
  mv "${f%.mp3}-norm.mp3" "$f"
done
```

We didn't run this for v1 because `ffmpeg` wasn't installed on Davi's machine. Volume mismatch is acceptable for v1 — Natan listens at a controlled iPhone volume. If volume disparity becomes annoying, install ffmpeg (`brew install ffmpeg`) and run the loop above.

---

## 4. PWA icons + splash (`sharp`)

`scripts/make-icons.mjs` composites the `assets/images/lion.png` sprite onto a green-jungle backdrop at three sizes:

- `icon-192.png` (192×192) — Android Chrome PWA icon
- `icon-512.png` (512×512, maskable) — Android adaptive icon + Play Store
- `splash-1170x2532.png` (1170×2532) — iPhone 14 / 15 portrait splash screen

Run:

```bash
node scripts/make-icons.mjs
```

Output goes to `public/`, which Vite copies to `dist/` verbatim. Re-run after replacing `assets/images/lion.png`.

The splash only covers iPhone 14/15 dimensions (1170×2532). Other phones get the theme-color background as a fallback. Per spec §6.2, covering all iOS resolutions is "a maintenance pit; one good fallback is enough."

---

## 5. End-to-end checklist for adding a 6th animal

If you want to validate the whole pipeline, this is the shortest path:

```bash
# 1. Generate sprite via Flow (manual via browser MCP)
#    Save the JPEG download from ~/Downloads/

# 2. Convert to transparent PNG
rembg i ~/Downloads/{filename}.jpeg assets/images/octopus.png

# 3. Curate an octopus sound from Pixabay (browser MCP)
#    → ~/Downloads/{filename}.mp3
mv ~/Downloads/{filename}.mp3 assets/sounds/octopus-bubble.mp3

# 4. Update src/animals.js — add an entry with id, englishWord, paths, position
#    Update tests/unit/animals.test.js — bump count from 5 to 6, add to expected ID list
#    Update assets/sounds/LICENSES.md
#    Update public/service-worker.js — add precache entries; bump CACHE_VERSION

# 5. Generate voice clip
npm run voiceover:generate

# 6. Verify
npm test                # 11 → 11 (or higher if you added a roster shape test)
npm run build
npm run test:e2e        # diorama should now render 6 animals
```

A single new animal should take about **15–20 minutes end-to-end** if you have all tooling set up. Most of the time is curating the Pixabay sound and visually verifying the Flow-generated sprite.

---

## 6. References

- [`flow-asset-generation` skill (global)](file://~/.claude/skills/flow-asset-generation/SKILL.md) — full Flow workflow encoded for any future Claude session.
- [Implementation plan](superpowers/plans/2026-04-25-safari-de-sons.md) — the original step-by-step plan, with forward-fixes recorded.
- [Design spec](superpowers/specs/2026-04-25-safari-de-sons-design.md) — the why-and-what of v1.
- [Roadmap](roadmap.md) — the 8 follow-on games + v2 plans.
- [Pixabay Content License](https://pixabay.com/service/license-summary/) — covers all sound effects.
- [ElevenLabs voice library](https://elevenlabs.io/app/voice-library) — to find new voices for future projects.
