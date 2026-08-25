# Questwheel v12 — Theme Engine

## Theme engine
- Questwheel Original remains built in.
- New built-in theme: **Tanglang · Red Velvet** (deep red velvet, gold trim, brocade motif, traditional serif typography).
- Tap the new **Theme** control beside Today to switch themes.
- Personal themes live entirely in local Questwheel data; adding one does not require a GitHub Pages update.
- Theme manager supports Use, Duplicate, Edit, Delete (personal themes), Export, and Import.
- Exported files use the `.qtheme` extension.
- `.qtheme` files are JSON data only; Questwheel does not execute CSS or JavaScript from imported themes.
- Supported theme properties include core colors, panel levels, accent, free-time color, safe surface materials, motifs, typography, corner roundness, and optional wheel colors.

### .qtheme format
Current format is `qthemeVersion: 1`. This engine is deliberately constrained for safety and stability. A future app update can expose additional themeable components without invalidating existing v1 themes.

## Weekly jar bug fix
- Fixed the crash that prevented a standalone Weekly jar from saving when it was not linked to a Daily jar.
- Daily-jar behavior is unchanged.

## iOS date/time layout follow-up
- Phone-width date/time pairs remain vertically stacked.
- Native iOS date/time controls now constrain the outer box while explicitly giving the internal displayed value full width, reducing the clipping introduced by v11.2.

## Update
Upload v12 over the same GitHub Pages repository, replace `index.html`, and open once with `?v=12`.

Do not clear Safari website data; that stores Questwheel data and personal themes.
