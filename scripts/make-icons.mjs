import { promises as fs } from "node:fs";
import path from "node:path";
import sharp from "sharp";

const lionPath = path.resolve("assets/images/lion.png");
const outDir = path.resolve("public");
await fs.mkdir(outDir, { recursive: true });

const ICON_SIZES = [192, 512];
const SPLASH = { width: 1170, height: 2532 }; // iPhone 14/15 portrait
const BG_COLOR = { r: 45, g: 90, b: 61, alpha: 1 };

// 1. Icons (square, lion centered, full bleed).
for (const size of ICON_SIZES) {
  const bg = await sharp({
    create: { width: size, height: size, channels: 4, background: BG_COLOR }
  })
    .png()
    .toBuffer();

  const lionTarget = Math.round(size * 0.78);
  const lion = await sharp(lionPath).resize({ height: lionTarget, fit: "inside" }).toBuffer();
  const lionMeta = await sharp(lion).metadata();

  const left = Math.round((size - lionMeta.width) / 2);
  const top = Math.round((size - lionMeta.height) / 2);

  const out = path.join(outDir, `icon-${size}.png`);
  await sharp(bg)
    .composite([{ input: lion, top, left }])
    .png()
    .toFile(out);
  console.log(`  → ${path.relative(process.cwd(), out)}`);
}

// 2. iOS splash (portrait iPhone 14/15, lion centered ~55% width).
{
  const bg = await sharp({
    create: { width: SPLASH.width, height: SPLASH.height, channels: 4, background: BG_COLOR }
  })
    .png()
    .toBuffer();

  const lionTarget = Math.round(SPLASH.width * 0.55);
  const lion = await sharp(lionPath).resize({ width: lionTarget, fit: "inside" }).toBuffer();
  const lionMeta = await sharp(lion).metadata();

  const left = Math.round((SPLASH.width - lionMeta.width) / 2);
  const top = Math.round((SPLASH.height - lionMeta.height) / 2);

  const out = path.join(outDir, `splash-${SPLASH.width}x${SPLASH.height}.png`);
  await sharp(bg)
    .composite([{ input: lion, top, left }])
    .png()
    .toFile(out);
  console.log(`  → ${path.relative(process.cwd(), out)}`);
}
