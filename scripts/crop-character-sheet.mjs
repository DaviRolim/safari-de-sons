import { promises as fs } from "node:fs";
import path from "node:path";
import sharp from "sharp";

const configPath = path.resolve("scripts/crop-config.json");
const config = JSON.parse(await fs.readFile(configPath, "utf-8"));

const sourcePath = path.resolve(config.source);
const outDir = path.resolve(config.outDir);
await fs.mkdir(outDir, { recursive: true });

const meta = await sharp(sourcePath).metadata();
const { width: W, height: H } = meta;

console.log(`Source: ${sourcePath}  ${W}x${H}`);

// 1. Background pass — blurred copy of the whole sheet, no chroma-key.
const bgPath = path.join(outDir, config.background.out);
await sharp(sourcePath)
  .blur(config.background.blur)
  .toFile(bgPath);
console.log(`  → ${path.relative(process.cwd(), bgPath)}`);

// 2. Animal pass — crop, then chroma-key the green to alpha.
const { r: kr, g: kg, b: kb, tolerance } = config.chromaKey;

for (const crop of config.crops) {
  const x = Math.round(crop.x * W);
  const y = Math.round(crop.y * H);
  const w = Math.round(crop.w * W);
  const h = Math.round(crop.h * H);

  const cropped = await sharp(sourcePath)
    .extract({ left: x, top: y, width: w, height: h })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const { data, info } = cropped;
  const channels = info.channels;
  for (let i = 0; i < data.length; i += channels) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    if (
      Math.abs(r - kr) <= tolerance &&
      Math.abs(g - kg) <= tolerance &&
      Math.abs(b - kb) <= tolerance
    ) {
      data[i + 3] = 0;
    }
  }

  const outPath = path.join(outDir, crop.out);
  await sharp(data, {
    raw: { width: info.width, height: info.height, channels: info.channels }
  })
    .png()
    .toFile(outPath);
  console.log(`  → ${path.relative(process.cwd(), outPath)}  (${w}x${h})`);
}

console.log("Done.");
