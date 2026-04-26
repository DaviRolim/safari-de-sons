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
