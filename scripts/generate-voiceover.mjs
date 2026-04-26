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
