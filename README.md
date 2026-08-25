# Questwheel v11.2

## Recurrence inheritance and future scheduling
- New subtasks under a repeating parent inherit the parent cadence by default. You can turn repetition off or change the cadence to override it.
- Existing one-off descendants under repeating parents are upgraded to inherited recurrence. If you had manually given a child the exact same cadence in v11.1, Questwheel can fold that into the parent framework too.
- Scheduling a block for a repeating quest now defaults the block recurrence to the quest recurrence.
- Inline blocks created while making a repeating quest are expanded across the recurrence horizon immediately.
- Existing repeating quests with a single non-series/auto-scheduled block are migrated so future blocks become visible immediately.
- Future quest occurrences remain out of the active Quest list until they are due, but their blocks are visible now in future Day and Week views.
- When a future quest occurrence becomes active, its already-created block is relinked to that occurrence instead of being recreated. This means deleting a particular future block (for example a vacation week) stays deleted.
- Inherited subtask trees renew recursively with the parent.

## iPhone form fit
- Date/time pairs stack vertically on phone-width screens.
- Native iOS date/time controls are constrained and clipped inside their cards so they cannot push beyond the right edge.

## Update
Upload v11.2 over the same GitHub Pages repository, replace index.html, then open once with ?v=11.2.

Do not clear Safari website data; that stores your Questwheel data.
