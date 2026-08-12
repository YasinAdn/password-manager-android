// Re-syncs the Android project's native resources (splash screen,
// status-bar color, etc.) from the current live web manifest -- e.g. after
// changing manifest.json's theme_color/background_color. Does NOT touch
// the existing signing key.
const path = require("path");
const {
  TwaManifest,
  TwaGenerator,
  BufferedLog,
  ConsoleLog,
} = require(
  "C:\\Users\\muhammad_yasin\\AppData\\Roaming\\npm\\node_modules\\@bubblewrap\\cli\\node_modules\\@bubblewrap\\core",
);

const MANIFEST_URL = "https://vault-yasinadnan.vercel.app/manifest.json";
const TARGET_DIR = __dirname;

async function main() {
  const twaManifest = await TwaManifest.fromWebManifest(MANIFEST_URL);
  twaManifest.launcherName = "Vault";
  twaManifest.signingKey.path = path.join(TARGET_DIR, "android.keystore");
  twaManifest.signingKey.alias = "android";

  console.log("themeColor:", twaManifest.themeColor.hex());
  console.log("backgroundColor:", twaManifest.backgroundColor.hex());

  await twaManifest.saveToFile(path.join(TARGET_DIR, "twa-manifest.json"));

  const twaGenerator = new TwaGenerator();
  await twaGenerator.removeTwaProject(TARGET_DIR);
  const log = new BufferedLog(new ConsoleLog("Regenerating TWA"));
  await twaGenerator.createTwaProject(TARGET_DIR, twaManifest, log, () => {});
  log.flush();
  console.log("TWA project regenerated.");

  const crypto = require("crypto");
  const fs = require("fs");
  const manifestFile = path.join(TARGET_DIR, "twa-manifest.json");
  const sum = crypto
    .createHash("sha1")
    .update(fs.readFileSync(manifestFile))
    .digest("hex");
  fs.writeFileSync(path.join(TARGET_DIR, "manifest-checksum.txt"), sum);
  console.log("Checksum updated.");
}

main().catch((err) => {
  console.error("FAILED:", err);
  process.exit(1);
});
