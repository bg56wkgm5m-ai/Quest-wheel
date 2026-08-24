# Questwheel v3.1 — cache repair build

This build fixes the v2→v3 upgrade crash caused by an old service worker mixing cached v2 JavaScript with v3 HTML.

## What changed
- All v3.1 assets have new versioned filenames, so old caches cannot substitute v2 files.
- The new service worker uses network-first navigation, preventing the installed PWA from getting permanently trapped on an old index page.
- The PWA start URL includes a version query.
- Icon files also have new URLs to give iOS a fresh icon resource.
- A small `v3.1` label appears beside Questwheel so you can verify which build actually loaded.
- All v3 feature changes remain intact.
- Local planner data still uses the same `questwheel-v1` localStorage key, preserving v1/v2 data.

## Upload
Upload all files/folders in this package to the same GitHub Pages repository. They may coexist with old files; v3.1 references only the new versioned assets.

## First recovery load
After GitHub Pages republishes, open your normal Pages URL in Safari and add `?v=3.1` to the end once. Example:
`https://YOURNAME.github.io/questwheel/?v=3.1`

That bypasses the old cached root page and lets v3.1 install its repaired service worker. Do not clear Safari website data, because that would erase locally stored Questwheel data.
