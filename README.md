# Questwheel v10

## Repeating quests
- Quests can repeat on an every-X-days cadence for a chosen number of days, weeks, or months.
- One occurrence stays active at a time. Completed occurrences remain in Completed history.
- When the next cadence date arrives, a new active occurrence is created automatically.
- A repeating parent quest carries its subtask structure into the next occurrence.
- Archiving or deleting the current repeating quest stops future recurrence.

## Duplication
- Active and completed quests have a Duplicate action.
- The duplicate opens pre-filled so you can change its name/category/duration/colour/repeat settings before creation.
- Duplicating a quest also copies its visible subtask tree and jar links.
- By default Questwheel immediately opens the scheduling dialog for the new quest, where you can change date, start time, duration, jar, and repetition. You can turn this off in the duplicate dialog.
- Blocks now have Duplicate in both the timeline and selected-wheel-block controls.
- A block copy opens the scheduling form pre-filled, including date and recurrence details, but is saved as a new independent block/series.

## Series editing
- Any repeating block now exposes This occurrence / This and all future occurrences when edited, including the last currently-generated occurrence.
- Choosing This and all future shows Repeat every X days + Continue for X days/weeks/months, so the future pattern can be shortened, extended, or spaced differently.
- Completed past occurrences stay historical and unchanged.

Existing Questwheel local data remains compatible. Upload v10 over the same GitHub Pages repository and open once with ?v=10.
