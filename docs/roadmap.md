# Safari de Sons — Roadmap

This is the documented forward plan. Each item is build-ready (spec'd in the v1 design doc, ordered by engine reuse) but **not yet committed to**. Build only after observing how Natan engages with the previous step.

## v1.5 (shipped 2026-04-26)

Two-scene world: jungle (5 v1 animals + Natan) + backyard (cow, dog, cat, turtle, bird + Natan). Adds horizontally-paged scene navigator with edge-peek + page dots, BR-PT voice override for Natan's name. Engine extended without breaking v1 patterns; v2's planned multi-pose expansion still applies on top.

Spec: [`2026-04-26-safari-de-sons-v1.5-design.md`](superpowers/specs/2026-04-26-safari-de-sons-v1.5-design.md)

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
