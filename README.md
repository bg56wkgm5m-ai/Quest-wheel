# Questwheel v13

## Theme engine v2
Questwheel themes can now carry safe embedded decorative artwork in addition to colours/material settings. Supported artwork slots are:
- background texture
- corner ornament
- wheel-center emblem
- cloud/decorative overlay
- top-right constellation/ornament

Imported artwork is restricted to embedded PNG/JPEG/WebP data. Themes still cannot execute CSS or JavaScript.

The built-in Tanglang skin has been upgraded to **Tanglang · New Year** with a stronger Seven Star Praying Mantis identity: red velvet/crimson, gold trim, mantis emblem, Big Dipper ornament, cloud flourishes, corner detail and brocade-like texture.

### Theme import compatibility
The iOS Files picker is no longer filtered by `.qtheme` MIME/extension. Pick any file; Questwheel validates its JSON contents after selection. This fixes `.qtheme` files appearing greyed out on iPhone.

Older v1 `.qtheme` files remain importable. New exports use qthemeVersion 2 and can include artwork.

## Collapsible quest trees
- Parent quests now have an expand/collapse chevron.
- Collapsing a parent hides every descendant while leaving the parent progress summary visible.
- Nested parents can be collapsed independently.
- Collapsed/expanded state is remembered locally across launches.

## Jar hours + minutes
- Daily and weekly jar targets now accept hours + minutes.
- Manual `+ Time` entries also accept hours + minutes.
- Questwheel continues storing/calculating jar time internally in minutes, so existing data remains compatible.

## Recurrence default
New recurrence forms now default the `For X` duration unit to **Days** instead of Weeks. Days, Weeks and Months remain selectable. Existing recurrence settings are not changed.

## Update
Upload all v13 files to the same GitHub Pages repository, replace `index.html`, and open once with `?v=13`.

Do not clear Safari website data; that contains your Questwheel data and personal themes.
