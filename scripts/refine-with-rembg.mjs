import { promises as fs } from "node:fs";
import path from "node:path";
import os from "node:os";
import { spawn } from "node:child_process";
import sharp from "sharp";

const configPath = path.resolve("scripts/crop-config.json");
const config = JSON.parse(await fs.readFile(configPath, "utf-8"));

const sourcePath = path.resolve(config.source);
const outDir = path.resolve(config.outDir);
await fs.mkdir(outDir, { recursive: true });

const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "safari-de-sons-rembg-"));

const meta = await sharp(sourcePath).metadata();
const { width: W, height: H } = meta;
console.log(`Source: ${sourcePath}  ${W}x${H}`);
console.log(`Tmp:    ${tmpDir}`);

function runRembg(inputPath, outputPath) {
  return new Promise((resolve, reject) => {
    const proc = spawn("rembg", ["i", inputPath, outputPath], { stdio: ["ignore", "pipe", "pipe"] });
    let stderr = "";
    proc.stderr.on("data", (d) => { stderr += d.toString(); });
    proc.on("error", reject);
    proc.on("close", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`rembg exited ${code}: ${stderr}`));
    });
  });
}

for (const crop of config.crops) {
  const x = Math.round(crop.x * W);
  const y = Math.round(crop.y * H);
  const w = Math.round(crop.w * W);
  const h = Math.round(crop.h * H);

  const tmpFile = path.join(tmpDir, `${crop.id}.png`);
  await sharp(sourcePath)
    .extract({ left: x, top: y, width: w, height: h })
    .toFile(tmpFile);

  const outPath = path.join(outDir, crop.out);
  process.stdout.write(`  rembg ${crop.id}  (${w}x${h}) ... `);
  await runRembg(tmpFile, outPath);
  console.log(`→ ${path.relative(process.cwd(), outPath)}`);
}

console.log("Done. Tmp files left in", tmpDir);
