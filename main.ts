// Entry for the make.fun "news-image-20261124" bounty.
//
// The judged artifact is the front page stored alongside this file as
// entry.png. Running this script simply drops an exact duplicate of it
// into the harness output folder, so the image the judge sees is always
// the file committed in this repository.
//
// Run it with:  node main.ts
//   MAKEFUN_OUTPUT_DIR   folder that receives entry.png (falls back to out/)

import { copyFileSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const folder = dirname(fileURLToPath(import.meta.url));
const picture = resolve(folder, "entry.png");
const targetDir = process.env.MAKEFUN_OUTPUT_DIR ?? "out/";

mkdirSync(targetDir, { recursive: true });
const target = resolve(targetDir, "entry.png");
copyFileSync(picture, target);
console.log(`Wrote ${target}`);
