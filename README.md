# Questwheel v13.5

## Functionality update

- Quest default duration can be left blank for abstract/container quests.
- Leaf subtasks require a corresponding time block before completion. If none exists, Questwheel asks for a one-off completion block and completes the subtask with it.
- Completion-created blocks never inherit recurrence or create future copies.
- Quests can link to existing jars, and Create/Edit Quest can create a new linked jar directly.
- Blocks have a Banked Free Time rule: bank planned/actual variance or do not affect the bank.
- Banked Free Time can be deliberately spent with a dated ledger entry and an optional completed Free Time wheel block.
- The Jars screen can move through earlier days/weeks, review historical contributions, and edit/delete historical manual jar entries.
- Repeating quests show their recurrence expiry.
- Repeating subtasks can be tethered to their parent or repeat independently. Tethered subtasks renew only with the parent. Independent subtasks keep their own rhythm but cannot extend beyond any ancestor quest's recurrence expiry.

## Retained patch behaviour

- Exact-interval overlap splitting on the wheel.
- Completed subtasks remain visible through their completion day, then leave the active tree.
- Completed scheduled blocks move below unfinished blocks for the day.
- The Schedule Block dialog's top-right × behaves the same as Cancel.
