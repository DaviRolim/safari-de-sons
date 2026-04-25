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
