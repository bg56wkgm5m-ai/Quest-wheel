# Questwheel v5.1 — runtime/cache repair

This build keeps all v5 features but packages the app's core CSS and JavaScript directly inside index.html.

Why:
- A blank wheel + dead buttons means the page HTML loaded without the matching app JavaScript.
- Keeping the core app in one file prevents Safari/GitHub/service-worker version mismatches.
- The service worker is network-first and uses a new v5.1 cache.
- Existing local Questwheel data still uses the same `questwheel-v1` local-storage key.

## Update
Upload every file in this folder to the same GitHub Pages repository.
Replace `index.html`.
Then visit your Pages URL in Safari with `?v=5.1` appended once.

You should see `v5.1` in the app header.

Do not clear Safari website data; that is where your current Questwheel data is stored.
