# Questwheel v11

## Quest hierarchy
- Parent quests with active subtasks are progress-driven and cannot be directly checked complete.
- Only leaf tasks (the smallest task in a branch) have a completion checkbox.
- Parent progress is calculated from all descendant leaf tasks and the parent completes automatically when they all do.
- Completing a leaf task marks its relevant linked scheduled block complete at planned time when possible, so nested wheel progress and jar credit stay coherent.
- Subtasks can be moved up/down among their siblings.
- Existing quests can now be edited (name, category, duration, colour, and recurrence).

## Repeat + duplicate
- Repeating quest occurrences copy the entire nested subtask tree recursively.
- Duplicating a quest copies every descendant level recursively as well.
- Repeat settings remain editable on the active occurrence.

## Schedule while creating a quest
- New/duplicated quests have an optional “Create a scheduled block when I save this quest” toggle.
- Enter the date and start time in the same quest form; the block uses the quest's default duration.
- If that quest itself repeats, future quest occurrences can automatically receive the same-time block.

## Hierarchical wheel blocks
- When a child quest's block is contained within an ancestor quest's block, it overlays inside the same radial band rather than consuming another simultaneous-activity lane.
- Deeper descendants inset slightly.
- Completed descendant portions grey only their own portion of the ancestor block.
- A parent-linked block cannot be directly Finished; its state follows its leaf subtasks.

## Rolling wheel + week history
- The Day screen now has Calendar day / Rolling 24h modes below the wheel key.
- Rolling mode shows the 12 hours before now and 12 hours after now, updating as time passes.
- Calendar mode keeps the existing swipe-between-days scheduling workflow.
- Week view now has previous / this week / next controls. Historical weeks use the same retained block data and remain available unless you delete those blocks.

## Update
Upload v11 to the same GitHub Pages repository, replace index.html, and open once with ?v=11.
Do not clear Safari website data; that contains your Questwheel data.
