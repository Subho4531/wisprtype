/**
 * generate_icons.js
 * Resizes Wisprtype.png into every required icon size for Tauri.
 * Run with: node generate_icons.js
 */

const sharp = require("sharp");
const path = require("path");
const fs = require("fs");

const SRC = path.join(__dirname, "src-tauri", "icons", "Wisprtype.png");
const OUT = path.join(__dirname, "src-tauri", "icons");

// PNG sizes to generate
const pngSizes = [
  { file: "32x32.png",             size: 32  },
  { file: "128x128.png",           size: 128 },
  { file: "128x128@2x.png",        size: 256 },
  { file: "icon.png",              size: 512 },
  { file: "Square30x30Logo.png",   size: 30  },
  { file: "Square44x44Logo.png",   size: 44  },
  { file: "Square71x71Logo.png",   size: 71  },
  { file: "Square89x89Logo.png",   size: 89  },
  { file: "Square107x107Logo.png", size: 107 },
  { file: "Square142x142Logo.png", size: 142 },
  { file: "Square150x150Logo.png", size: 150 },
  { file: "Square284x284Logo.png", size: 284 },
  { file: "Square310x310Logo.png", size: 310 },
  { file: "StoreLogo.png",         size: 50  },
];

async function generatePNGs() {
  for (const { file, size } of pngSizes) {
    const outPath = path.join(OUT, file);
    await sharp(SRC)
      .resize(size, size, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .png()
      .toFile(outPath);
    console.log(`✓ ${file} (${size}x${size})`);
  }
}

// ICO is a multi-resolution container; we build it from PNG buffers using a minimal ICO writer
async function generateICO() {
  const icoSizes = [16, 32, 48, 64, 128, 256];

  // Each ICO entry: generate a PNG buffer for each size, then wrap in ICO format
  const pngBuffers = await Promise.all(
    icoSizes.map((s) =>
      sharp(SRC)
        .resize(s, s, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
        .png()
        .toBuffer()
    )
  );

  // Build the ICO file binary manually (ICONDIR + ICONDIRENTRY[] + image data)
  // ICO format spec: https://en.wikipedia.org/wiki/ICO_(file_format)
  const ICONDIR_SIZE = 6;
  const ICONDIRENTRY_SIZE = 16;
  const numImages = pngBuffers.length;
  const headerSize = ICONDIR_SIZE + ICONDIRENTRY_SIZE * numImages;

  let offset = headerSize;
  const entries = pngBuffers.map((buf, i) => {
    const size = icoSizes[i];
    const entry = { size, buf, offset };
    offset += buf.length;
    return entry;
  });

  // ICONDIR header
  const header = Buffer.alloc(ICONDIR_SIZE);
  header.writeUInt16LE(0, 0);      // Reserved
  header.writeUInt16LE(1, 2);      // Type: ICO
  header.writeUInt16LE(numImages, 4);

  // ICONDIRENTRY for each image
  const entryBuffers = entries.map(({ size, buf, offset }) => {
    const e = Buffer.alloc(ICONDIRENTRY_SIZE);
    e.writeUInt8(size >= 256 ? 0 : size, 0);  // Width (0 means 256+)
    e.writeUInt8(size >= 256 ? 0 : size, 1);  // Height
    e.writeUInt8(0, 2);                         // Color count
    e.writeUInt8(0, 3);                         // Reserved
    e.writeUInt16LE(1, 4);                      // Color planes
    e.writeUInt16LE(32, 6);                     // Bits per pixel
    e.writeUInt32LE(buf.length, 8);             // Size of image data
    e.writeUInt32LE(offset, 12);                // Offset of image data
    return e;
  });

  const icoBuffer = Buffer.concat([
    header,
    ...entryBuffers,
    ...entries.map((e) => e.buf),
  ]);

  const icoPath = path.join(OUT, "icon.ico");
  fs.writeFileSync(icoPath, icoBuffer);
  console.log(`✓ icon.ico (multi-res: ${icoSizes.join(", ")}px)`);
}

// Generate .icns by writing the largest PNG as a placeholder
// (Real ICNS requires macOS tooling; this creates a valid fallback PNG copy named .icns
//  which Tauri uses on non-macOS builds)
async function generateICNS() {
  const buf = await sharp(SRC)
    .resize(512, 512, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer();

  // Write 512px PNG as .icns placeholder (Tauri will use the PNG for Windows; macOS needs real icns)
  // On Windows this file is not actively used for the executable icon, icon.ico takes precedence.
  const icnsPath = path.join(OUT, "icon.icns");
  fs.writeFileSync(icnsPath, buf);
  console.log(`✓ icon.icns (512x512 PNG placeholder for non-macOS builds)`);
}

(async () => {
  console.log("🎨 Generating Wisprtype icons from master PNG...\n");
  await generatePNGs();
  await generateICO();
  await generateICNS();
  console.log("\n✅ All icons generated successfully!");
})();
