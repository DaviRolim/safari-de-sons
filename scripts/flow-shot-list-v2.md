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
- For repeating this asset-creation workflow efficiently, use the [`flow-asset-generation` skill](~/.claude/skills/flow-asset-generation/SKILL.md) — it encodes the parallel-prompt queueing and rembg post-processing.
