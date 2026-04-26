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
