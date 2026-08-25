# Questwheel v11.1

## Rolling wheel
- Now is fixed at 12 o'clock.
- Rolling horizon is 6 hours of past + 18 hours of future.
- Only the past quarter of the wheel is greyed.
- A neutral −6h cutoff marker sits at 9 o'clock so the start of the historical window is explicit.
- Hour labels, activities, and the daylight/twilight ring all use the same rotated rolling scale.

## Quest inline scheduling
- For a repeating quest, the scheduled block date automatically follows First occurrence.
- Changing First occurrence immediately updates the block date.
- While Repeat this quest is enabled, the inline block date is locked to the occurrence date so the two cannot drift apart.
- Automatically scheduled future quest iterations continue to use each iteration's own occurrence date.

## Form fit
- Two-column date/time/number fields use zero-minimum grid columns and tighter mobile spacing to prevent iOS inputs from hanging off the right side.

## Update
Upload v11.1 over the same GitHub Pages repository, replace index.html, then open once with ?v=11.1.

Do not clear Safari website data; that stores your Questwheel data.
