// Generates the Bubblewrap TWA project + signing key programmatically,
// bypassing the interactive CLI prompts entirely (they can't be scripted
// reliably via blind stdin -- one wrong answer cascades into invalid state,
// as happened with the packageId prompt).
const path = require("path");
const {
  TwaManifest,
  TwaGenerator,
  Config,
  JdkHelper,
  KeyTool,
  BufferedLog,
  ConsoleLog,
} = require(
  "C:\\Users\\muhammad_yasin\\AppData\\Roaming\\npm\\node_modules\\@bubblewrap\\cli\\node_modules\\@bubblewrap\\core",
);

const MANIFEST_URL = "https://vault-yasinadnan.vercel.app/manifest.json";
const TARGET_DIR = __dirname;

async function main() {
  const twaManifest = await TwaManifest.fromWebManifest(MANIFEST_URL);

  // Keep the auto-derived packageId (app.vercel.vault_yasinadnan.twa) --
  // it's already valid. Just fix the launcher name (max 12 chars) and
  // signing key path.
  twaManifest.launcherName = "Vault";
  twaManifest.signingKey.path = path.join(TARGET_DIR, "android.keystore");
  twaManifest.signingKey.alias = "android";

  console.log("packageId:", twaManifest.packageId);
  console.log("name:", twaManifest.name);
  console.log("launcherName:", twaManifest.launcherName);
  console.log("host:", twaManifest.host);
  console.log("iconUrl:", twaManifest.iconUrl);

  await twaManifest.saveToFile(path.join(TARGET_DIR, "twa-manifest.json"));

  const twaGenerator = new TwaGenerator();
  const log = new BufferedLog(new ConsoleLog("Generating TWA"));
  await twaGenerator.createTwaProject(
    TARGET_DIR,
    twaManifest,
    log,
    () => {},
  );
  log.flush();
  console.log("TWA project generated.");

  // KeyTool.createSigningKey() relies on JdkHelper.getEnv() to put keytool
  // on PATH for the child process -- on this machine that PATH-merging
  // didn't take effect (likely a Path/PATH case-key collision between the
  // MSYS-inherited env and Windows' expected casing). Invoke keytool by its
  // full path directly instead, sidestepping that entirely.
  const { execFileSync } = require("child_process");
  const keytoolExe =
    "C:\\Users\\muhammad_yasin\\.bubblewrap\\jdk\\jdk-17.0.11+9\\bin\\keytool.exe";
  const keystorePassword = process.env.KEYSTORE_PASSWORD;
  if (!keystorePassword) {
    console.error("FAILED: set KEYSTORE_PASSWORD in the environment before running this script.");
    process.exit(1);
  }
  execFileSync(
    keytoolExe,
    [
      "-genkeypair",
      "-dname",
      "cn=Vault App, ou=Personal, o=Personal, c=US",
      "-alias",
      twaManifest.signingKey.alias,
      "-keypass",
      keystorePassword,
      "-keystore",
      twaManifest.signingKey.path,
      "-storepass",
      keystorePassword,
      "-validity",
      "20000",
      "-keyalg",
      "RSA",
    ],
    { stdio: "inherit" },
  );
  console.log("Signing key created at", twaManifest.signingKey.path);
}

main().catch((err) => {
  console.error("FAILED:", err);
  process.exit(1);
});
