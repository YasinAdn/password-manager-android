const { execFileSync } = require("child_process");

const keytoolExe =
  "C:\\Users\\muhammad_yasin\\.bubblewrap\\jdk\\jdk-17.0.11+9\\bin\\keytool.exe";
const keystorePath = "D:\\Website work\\password-manager-android\\android.keystore";

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
    "android",
    "-keypass",
    keystorePassword,
    "-keystore",
    keystorePath,
    "-storepass",
    keystorePassword,
    "-validity",
    "20000",
    "-keyalg",
    "RSA",
  ],
  { stdio: "inherit" },
);
console.log("Signing key created at", keystorePath);
