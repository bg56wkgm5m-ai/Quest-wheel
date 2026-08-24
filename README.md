# Questwheel v3

Questwheel is a private, offline-friendly RPG-style quest and time planner.

## v3 changes
- Reworked colour palette with more clearly separated hues and several reds
- Removed the day-picker arrows and off-centre date input
- Swipe the main 24-hour wheel left/right to change days
- Keyboard left/right on the focused wheel remains as a non-swipe accessibility option
- Recurring blocks: repeat every X days for a duration in days, weeks, or months
- Permanent Delete alongside Archive for quests
- Deleting a quest cascades through nested subtasks and their scheduled blocks after confirmation
- Cascading quest tree: any quest or subtask can contain more subtasks
- Any level of the quest tree can be scheduled as its own time block
- Subtasks inherit the parent category/colour by default but can be given a different colour when created
- Quest/subtask completion toggles for checklist-style progress
- Keeps the same local-storage key as v1/v2 for data compatibility

## Updating an existing GitHub Pages copy
Upload/replace the v3 files in the same GitHub repository and commit the changes. Keep the same Pages URL. Your existing local Questwheel data should remain because the storage key is unchanged.

If the Home Screen app briefly shows the old version after GitHub finishes publishing, fully close Questwheel and open it again. The service-worker cache is versioned as v3.

## Privacy and backup
Quest and schedule data remains in local browser storage on your device. GitHub hosts the app code only. Clearing Safari website data for the Questwheel site can erase local planner data, so Export/Import backup remains an important future feature.
