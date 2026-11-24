// Entry for the make.fun "news-image-20261124" bounty.
//
// The judged artifact is the front page stored alongside this file as
// entry.png. Running this script drops an exact duplicate of it into the
// harness output folder, so the image the judge sees is always the file
// committed in this repository. After copying, the script reads the output
// back and refuses to finish quietly unless the copy is byte-identical to
// the source and still inside the competition caps (1024x1024, 1 MiB).
//
// Run it with:  node main.ts
//   MAKEFUN_OUTPUT_DIR   folder that receives entry.png (falls back to out/)

import { copyFileSync, mkdirSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const folder = dirname(fileURLToPath(import.meta.url));
const picture = resolve(folder, "entry.png");
const targetDir = process.env.MAKEFUN_OUTPUT_DIR ?? "out/";

const MAX_BYTES = 1024 * 1024; // 1 MiB competition cap
const EXPECTED_WIDTH = 1024;
const EXPECTED_HEIGHT = 1024;

function fail(message: string): never {
  console.error(`ERROR: ${message}`);
  process.exit(1);
}

// Read the pixel size out of the image bytes themselves, so a wrong-sized
// file can never slip through silently. Handles the two formats this entry
// could plausibly be: a PNG stores width/height in its IHDR chunk, while a
// JPEG (which entry.png actually is, despite the extension) stores them in
// its first frame header (SOF0/SOF1/SOF2) after skipping the other segments.
function imageDimensions(bytes: Buffer): { format: string; width: number; height: number } | null {
  const pngSignature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  if (bytes.length >= 24 && bytes.subarray(0, 8).equals(pngSignature)) {
    return { format: "PNG", width: bytes.readUInt32BE(16), height: bytes.readUInt32BE(20) };
  }
  if (bytes.length >= 4 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    let offset = 2;
    while (offset + 4 <= bytes.length) {
      if (bytes[offset] !== 0xff) return null;
      const marker = bytes[offset + 1];
      if (marker === 0xd9 || marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7)) {
        offset += 2;
        continue;
      }
      const segmentLength = bytes.readUInt16BE(offset + 2);
      if (marker === 0xc0 || marker === 0xc1 || marker === 0xc2) {
        return {
          format: "JPEG",
          height: bytes.readUInt16BE(offset + 5),
          width: bytes.readUInt16BE(offset + 7),
        };
      }
      offset += 2 + segmentLength;
    }
  }
  return null;
}

mkdirSync(targetDir, { recursive: true });
const target = resolve(targetDir, "entry.png");
copyFileSync(picture, target);

// Read the copy back and prove it is the same file, byte for byte.
const sourceBytes = readFileSync(picture);
const writtenBytes = readFileSync(target);
if (!writtenBytes.equals(sourceBytes)) {
  fail(`output ${target} differs from ${picture} after copy`);
}
if (writtenBytes.length > MAX_BYTES) {
  fail(`output is ${writtenBytes.length} bytes, over the 1 MiB cap`);
}

const dims = imageDimensions(writtenBytes);
if (dims === null) {
  fail("output is neither a PNG nor a JPEG image");
}
if (dims.width !== EXPECTED_WIDTH || dims.height !== EXPECTED_HEIGHT) {
  fail(`output is ${dims.width}x${dims.height}, expected ${EXPECTED_WIDTH}x${EXPECTED_HEIGHT}`);
}

console.log(`Wrote ${target} (${dims.format} ${dims.width}x${dims.height}, ${writtenBytes.length} bytes, verified byte-identical to entry.png)`);
