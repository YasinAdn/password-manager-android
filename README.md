# Vault — Android app

A [Trusted Web Activity](https://developer.chrome.com/docs/android/trusted-web-activity/overview/)
wrapper around [Vault](https://github.com/YasinAdn/password-manager), a
self-hosted, client-encrypted password manager. This repo doesn't contain a
separate app — it packages the live web app (https://passten.vercel.app) so it
installs and runs like a native Android app, with no browser chrome. Any
change pushed to the [web app repo](https://github.com/YasinAdn/password-manager)
shows up here automatically, with no rebuild required — see
[How it works](#how-it-works) below.

## Download

**[Latest release →](https://github.com/YasinAdn/password-manager-android/releases/latest)**

Download `Vault.apk` and open it on your phone (you'll need to allow "install
unknown apps" for whichever app you used to download it — Chrome, Files,
etc.). Distributed directly via GitHub Releases rather than the Play Store.

This APK connects to my own hosted instance (https://passten.vercel.app) —
installing it means your account and vault live on my Supabase project, not
a private deployment of your own.

## Want your own instance?

If you'd rather run a fully private Vault — your own Supabase project, your
own data, nothing shared with anyone else's deployment — head to the
[password-manager repo](https://github.com/YasinAdn/password-manager) and
follow its README to deploy your own copy. It's a standard Next.js +
Supabase app; the README walks through creating a Supabase project, running
the schema, and deploying it. Once your own instance is live, this repo's
`regen-project.cjs` (see below) can generate a TWA wrapper pointed at your
own domain instead of mine.

## How it works

A TWA is a thin native shell around Chrome that renders one specific web
origin full-screen — it isn't a snapshot or a separate copy of the app.
That means:

- **UI/feature changes to the web app show up here automatically.** Push to
  `password-manager` → Vercel deploys → the app reflects it immediately, same
  as reloading a browser tab. No Android rebuild needed.
- **Only native-shell changes need a rebuild**: app icon, splash screen,
  launcher name, the target domain itself, or the signing key.
- Android only renders the TWA seamlessly (no address bar) if the app's
  signing certificate fingerprint matches an
  [`assetlinks.json`](https://developer.android.com/training/app-links/verify-android-applinks#web-assoc)
  file served at `/.well-known/assetlinks.json` on the target domain — this
  is what proves the app and the website are controlled by the same party.
  That file lives in the web app's `public/.well-known/` directory and must
  be kept in sync with this repo's signing key (see below).

## Rebuilding the APK

Requires [Bubblewrap](https://github.com/GoogleChromeLabs/bubblewrap)
(`npm install -g @bubblewrap/cli`) and the existing `android.keystore` in this
repo (gitignored — back it up separately; losing it means you can never
publish an update under the same app identity again).

1. Set the keystore password as environment variables (bubblewrap's
   interactive password prompt doesn't work in every terminal/CI context —
   these env vars skip it):
   ```powershell
   $env:BUBBLEWRAP_KEYSTORE_PASSWORD = "..."
   $env:BUBBLEWRAP_KEY_PASSWORD = "..."
   ```
2. ```
   bubblewrap build
   ```
   Produces `app-release-signed.apk` and `app-release-bundle.aab` in the
   project root.

### Changing the target domain

An Android TWA's target domain is a real security binding, not a config
value the app looks up at runtime — Android verifies it against the
signed app's declared origin via Digital Asset Links, which requires it
to be baked into the compiled app. That's inherent to the platform, not
a limitation of this code, so a domain change always needs a rebuild —
but the rebuild itself is a single parameterized command, not a
multi-file hand-edit:

```
TWA_MANIFEST_URL="https://new-domain.com/manifest.json" node regen-project.cjs
bubblewrap build
```

Don't hand-edit `app/build.gradle` — it's generated.  `regen-project.cjs`
fetches the *live* web app's manifest from `TWA_MANIFEST_URL` (defaults to
the current domain if unset) to regenerate the whole native project, and
pins `packageId` to `app.vercel.vault_yasinadnan.twa` regardless of what
the fetched manifest implies — the package ID is baked into
`assetlinks.json` on the web app and into the signed key's identity, so
letting it drift would silently break Digital Asset Link verification and
orphan any already-installed APK under a different package.

One thing that does *not* need to change: `assetlinks.json` on the web app
lists the package name and signing fingerprint, neither of which depends
on the domain — so as long as it's served at
`/.well-known/assetlinks.json` on whatever the new domain is, no edit is
needed there either. The web app itself is fully domain-agnostic already
(see its own README) — only this repo's compiled APK needs the rebuild.

## Project layout

- `twa-manifest.json` — the TWA's config (host, package ID, theme colors,
  signing key path) — source of truth for regeneration, not hand-edited
  directly.
- `app/build.gradle`, `app/src/main/AndroidManifest.xml`,
  `app/src/main/res/` — generated by Bubblewrap from `twa-manifest.json`;
  regenerated by `regen-project.cjs`, not edited by hand.
- `gen-key.cjs` — one-time keystore generation (reads the password from
  `KEYSTORE_PASSWORD`, never hardcoded).
- `gen-project.cjs` — one-time initial project generation.
- `regen-project.cjs` — re-syncs the native project from the live web
  manifest; use this for any config change going forward.
- `android.keystore` — the signing key (gitignored).

## Related

- [password-manager](https://github.com/YasinAdn/password-manager) — the web
  app this wraps.
- [Live app](https://passten.vercel.app)

## License

[PolyForm Noncommercial 1.0.0](LICENSE). Free to use, fork, and self-host
for any noncommercial purpose. Commercial use (selling it, offering it as a
paid hosted service, bundling it into a paid product) requires a separate
agreement — contact yasin.adnan@mynexsystems.com.
