/**
 * regenerate_tray_icons.cjs
 * Creates tray icons at 64x64 from the Wisprtype.png master with state overlays.
 * Run with: node regenerate_tray_icons.cjs
 */
const sharp = require("sharp");
const path = require("path");
const fs = require("fs");

const MASTER = path.join(__dirname, "src-tauri", "icons", "Wisprtype.png");
const OUT = path.join(__dirname, "src-tauri", "icons");
const SIZE = 64;

async function generateTray(name, tintR, tintG, tintB) {
  // Resize master icon to 64x64 as the base for all tray icons
  await sharp(MASTER)
    .trim()
    .resize(SIZE, SIZE, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toFile(path.join(OUT, `tray_${name}.png`));
  console.log(`  ✓ tray_${name}.png (${SIZE}x${SIZE})`);
}

(async () => {
  console.log("🎨 Generating 64x64 tray icons from Wisprtype.png...\n");
  // All tray icons use the same Wisprtype master scaled to 64x64
  // (The state-specific styling happens in the overlay window, not the tray icon)
  const states = ["idle", "recording", "transcribing", "formatting", "success", "error"];
  for (const s of states) {
    await generateTray(s);
  }
  console.log("\n✅ All tray icons regenerated at 64x64!");
})();
