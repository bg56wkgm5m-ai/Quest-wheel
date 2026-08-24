(() => {
  const STORE = "questwheel-v1"; // Preserve all prior Questwheel local data.
  const BUILD = "v5";

  const categories = {
    business: { label: "Business", color: "#FFB000" },
    training: { label: "Training", color: "#00A7E1" },
    personal: { label: "Personal", color: "#7C4DFF" },
    admin: { label: "Admin", color: "#2EAD65" },
    rest: { label: "Rest", color: "#90A4AE" }
  };

  // Deliberately spread around the hue wheel. Includes three visibly different reds.
  const questPalette = [
    "#FFB000", // amber
    "#FF6B00", // orange
    "#E53935", // clear red
    "#8E2424", // deep maroon
    "#F05A7E", // rose red
    "#2EAD65", // green
    "#00A6A6", // teal
    "#00A7E1", // cyan
    "#3D5AFE", // royal blue
    "#7C4DFF", // violet
    "#D500F9", // magenta
    "#8D6E63", // brown
    "#90A4AE"  // slate
  ];

  let selectedQuestColor = questPalette[0];
  let selectedBlockColor = categories.personal.color;
  let selectedEditBlockColor = categories.personal.color;
  let swipeStart = null;
  let swipeAnimating = false;
  let currentQuestMode = "active";
  let selectedBlockId = null;
  let suppressBlockClick = false;

  const defaultState = {
    quests: [],
    blocks: [],
    bankLedger: [],
    selectedDate: isoDate(new Date())
  };

  const $ = id => document.getElementById(id);
  const el = {
    dayLabel: $("dayLabel"),
    selectedDateHeading: $("selectedDateHeading"),
    reclaimedTotal: $("reclaimedTotal"),
    bankedTimeTotal: $("bankedTimeTotal"),
    wheelScheduled: $("wheelScheduled"),
    dayWheel: $("dayWheel"),
    wheelWrap: $("wheelWrap"),
    wheelSlide: $("wheelSlide"),
    wheelLegend: $("wheelLegend"),
    selectedBlockPanel: $("selectedBlockPanel"),
    selectedBlockMark: $("selectedBlockMark"),
    selectedBlockTitle: $("selectedBlockTitle"),
    selectedBlockMeta: $("selectedBlockMeta"),
    selectedBlockStatus: $("selectedBlockStatus"),
    selectedBlockEdit: $("selectedBlockEdit"),
    selectedBlockFinish: $("selectedBlockFinish"),
    selectedBlockDelete: $("selectedBlockDelete"),
    selectedBlockClose: $("selectedBlockClose"),
    timeline: $("timeline"),
    questList: $("questList"),
    activeQuestsSubtab: $("activeQuestsSubtab"),
    completedQuestsSubtab: $("completedQuestsSubtab"),
    weekGrid: $("weekGrid"),
    weekHeading: $("weekHeading"),
    questDialog: $("questDialog"),
    blockDialog: $("blockDialog"),
    editBlockDialog: $("editBlockDialog"),
    finishDialog: $("finishDialog"),
    questForm: $("questForm"),
    blockForm: $("blockForm"),
    editBlockForm: $("editBlockForm"),
    finishForm: $("finishForm"),
    questDialogEyebrow: $("questDialogEyebrow"),
    questDialogTitle: $("questDialogTitle"),
    questParentId: $("questParentId"),
    questName: $("questName"),
    questCategory: $("questCategory"),
    questDuration: $("questDuration"),
    questColorPicker: $("questColorPicker"),
    blockQuest: $("blockQuest"),
    standaloneFields: $("standaloneFields"),
    blockName: $("blockName"),
    blockCategory: $("blockCategory"),
    blockColorPicker: $("blockColorPicker"),
    blockStart: $("blockStart"),
    blockHours: $("blockHours"),
    blockMinutes: $("blockMinutes"),
    repeatEnabled: $("repeatEnabled"),
    repeatFields: $("repeatFields"),
    repeatEvery: $("repeatEvery"),
    repeatFor: $("repeatFor"),
    repeatUnit: $("repeatUnit"),
    editBlockId: $("editBlockId"),
    editBlockTitle: $("editBlockTitle"),
    editSeriesScope: $("editSeriesScope"),
    editScopeOne: $("editScopeOne"),
    editScopeFuture: $("editScopeFuture"),
    editSeriesNote: $("editSeriesNote"),
    editBlockQuest: $("editBlockQuest"),
    editStandaloneFields: $("editStandaloneFields"),
    editBlockName: $("editBlockName"),
    editBlockCategory: $("editBlockCategory"),
    editBlockColorPicker: $("editBlockColorPicker"),
    editBlockDate: $("editBlockDate"),
    editBlockStart: $("editBlockStart"),
    editBlockHours: $("editBlockHours"),
    editBlockMinutes: $("editBlockMinutes"),
    finishBlockId: $("finishBlockId"),
    finishTitle: $("finishTitle"),
    plannedDurationLabel: $("plannedDurationLabel"),
    timeDeltaGauge: $("timeDeltaGauge"),
    gaugeDeltaLabel: $("gaugeDeltaLabel"),
    actualDurationLabel: $("actualDurationLabel"),
    actualHours: $("actualHours"),
    actualMinutes: $("actualMinutes")
  };

  function isoDate(d) {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  }

  function dateFromISO(s) {
    const [y, m, d] = String(s).split("-").map(Number);
    return new Date(y, m - 1, d);
  }

  function addDays(date, amount) {
    const d = new Date(date);
    d.setDate(d.getDate() + amount);
    return d;
  }

  function addDuration(date, amount, unit) {
    const d = new Date(date);
    if (unit === "weeks") d.setDate(d.getDate() + amount * 7);
    else if (unit === "months") d.setMonth(d.getMonth() + amount);
    else d.setDate(d.getDate() + amount);
    return d;
  }

  function uid(prefix) {
    return prefix + "-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 8);
  }

  function normalizeQuest(q) {
    return {
      ...q,
      parentId: q.parentId || null,
      completed: Boolean(q.completed),
      completedAt: q.completed ? (Number(q.completedAt) || 0) : null,
      archived: Boolean(q.archived),
      defaultMinutes: Math.max(2, Math.min(600, Number(q.defaultMinutes) || 30))
    };
  }

  function normalizeBlock(b) {
    return {
      ...b,
      questId: b.questId || null,
      name: b.name || null,
      category: b.category || "personal",
      color: b.color || null,
      completed: Boolean(b.completed),
      bankDelta: b.bankDelta != null ? Number(b.bankDelta) || 0 : Math.max(0, Number(b.reclaimed) || 0),
      reclaimed: Math.max(0, b.bankDelta != null ? Number(b.bankDelta) || 0 : Number(b.reclaimed) || 0),
      actualMinutes: b.actualMinutes == null ? null : Math.max(1, Math.min(1440, Number(b.actualMinutes) || 1)),
      minutes: Math.max(2, Math.min(600, Number(b.minutes) || 30)),
      start: Math.max(0, Math.min(1439, Number(b.start) || 0))
    };
  }

  function loadState() {
    try {
      const raw = localStorage.getItem(STORE);
      if (!raw) return structuredClone(defaultState);
      const parsed = JSON.parse(raw);
      const blocks = Array.isArray(parsed.blocks) ? parsed.blocks.map(normalizeBlock) : [];
      const bankLedger = Array.isArray(parsed.bankLedger)
        ? parsed.bankLedger.map(entry => ({
            id: entry.id || uid("bank"),
            blockId: entry.blockId || null,
            delta: Number(entry.delta) || 0,
            createdAt: Number(entry.createdAt) || 0,
            note: entry.note || null
          }))
        : blocks
            .filter(b => b.completed && (b.bankDelta || 0) !== 0)
            .map(b => ({ id: uid("bank-migrate"), blockId: b.id, delta: Number(b.bankDelta) || 0, createdAt: 0, note: "Migrated from earlier Questwheel version" }));
      return {
        quests: Array.isArray(parsed.quests) ? parsed.quests.map(normalizeQuest) : [],
        blocks,
        bankLedger,
        selectedDate: isoDate(new Date())
      };
    } catch {
      return structuredClone(defaultState);
    }
  }

  let state = loadState();

  function saveState() {
    localStorage.setItem(STORE, JSON.stringify(state));
  }

  function fmtMinutes(mins) {
    mins = Math.max(0, Math.round(Number(mins) || 0));
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    if (!h) return `${m}m`;
    if (!m) return `${h}h`;
    return `${h}h ${m}m`;
  }

  function fmtSignedMinutes(mins, { zeroLabel = "0m" } = {}) {
    const value = Math.round(Number(mins) || 0);
    if (value === 0) return zeroLabel;
    return `${value > 0 ? "+" : "−"}${fmtMinutes(Math.abs(value))}`;
  }

  function bankBalance() {
    return (state.bankLedger || []).reduce((sum, entry) => sum + (Number(entry.delta) || 0), 0);
  }

  function blockBankDelta(b) {
    if (!b?.completed) return 0;
    if (b.bankDelta != null) return Number(b.bankDelta) || 0;
    return Math.max(0, Number(b.reclaimed) || 0);
  }

  function setBlockDurationInputs(totalMinutes) {
    const total = Math.max(2, Math.min(600, Math.round(Number(totalMinutes) || 30)));
    el.blockHours.value = String(Math.floor(total / 60));
    el.blockMinutes.value = String(total % 60);
  }

  function blockDurationFromInputs() {
    const hours = Math.max(0, Math.min(10, Number(el.blockHours.value) || 0));
    const minutes = Math.max(0, Math.min(59, Number(el.blockMinutes.value) || 0));
    return Math.round(hours * 60 + minutes);
  }

  function minutesFromTime(t) {
    const [h, m] = String(t).split(":").map(Number);
    return Math.max(0, Math.min(1439, (h || 0) * 60 + (m || 0)));
  }

  function timeFromMinutes(n) {
    n = ((Number(n) % 1440) + 1440) % 1440;
    return `${String(Math.floor(n / 60)).padStart(2, "0")}:${String(n % 60).padStart(2, "0")}`;
  }

  function questById(id) {
    return id ? state.quests.find(q => q.id === id) : null;
  }

  function childrenOf(parentId) {
    return state.quests.filter(q => (q.parentId || null) === (parentId || null));
  }

  function descendantIds(id) {
    const out = [];
    const seen = new Set();
    const visit = parentId => {
      if (seen.has(parentId)) return;
      seen.add(parentId);
      childrenOf(parentId).forEach(child => {
        out.push(child.id);
        visit(child.id);
      });
    };
    visit(id);
    return out;
  }

  function ancestorArchived(q) {
    let current = q;
    const seen = new Set();
    while (current?.parentId) {
      if (seen.has(current.parentId)) break;
      seen.add(current.parentId);
      current = questById(current.parentId);
      if (current?.archived) return true;
    }
    return false;
  }

  function isQuestActive(q) {
    return Boolean(q && !q.archived && !q.completed && !ancestorArchived(q));
  }

  function orderedActiveQuests() {
    const ordered = [];
    const walk = (parentId, depth) => {
      childrenOf(parentId)
        .filter(isQuestActive)
        .sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0))
        .forEach(q => {
          ordered.push({ q, depth });
          walk(q.id, depth + 1);
        });
    };
    walk(null, 0);
    return ordered;
  }

  function blocksFor(date) {
    return state.blocks.filter(b => b.date === date).sort((a, b) => a.start - b.start || a.minutes - b.minutes);
  }

  function selectedBlocks() {
    return blocksFor(state.selectedDate);
  }

  function categoryColor(category) {
    return categories[category]?.color || categories.personal.color;
  }

  function questColor(q) {
    if (!q) return categories.personal.color;
    if (q.color) return q.color;
    if (q.parentId) {
      const parent = questById(q.parentId);
      if (parent) return questColor(parent);
    }
    return categoryColor(q.category);
  }

  function blockTitle(b) {
    const q = questById(b.questId);
    return q?.name || b.name || "Standalone block";
  }

  function blockColor(b) {
    const q = questById(b.questId);
    return q ? questColor(q) : (b.color || categoryColor(b.category));
  }

  function blockCategoryLabel(b) {
    const q = questById(b.questId);
    return categories[q?.category || b.category]?.label || "Block";
  }

  function renderColorPicker(container, name, selected, onChange) {
    container.innerHTML = "";
    questPalette.forEach((color, index) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "color-swatch";
      btn.style.setProperty("--swatch", color);
      btn.dataset.color = color;
      btn.setAttribute("role", "radio");
      btn.setAttribute("aria-label", `Colour ${index + 1}`);
      btn.setAttribute("aria-checked", color === selected ? "true" : "false");
      btn.addEventListener("click", () => {
        onChange(color);
        [...container.querySelectorAll(".color-swatch")].forEach(swatch => {
          swatch.setAttribute("aria-checked", swatch.dataset.color === color ? "true" : "false");
        });
      });
      container.appendChild(btn);
    });
  }

  function setQuestColorPicker(color) {
    selectedQuestColor = color || questPalette[0];
    renderColorPicker(el.questColorPicker, "questColor", selectedQuestColor, picked => { selectedQuestColor = picked; });
  }

  function setBlockColorPicker(color) {
    selectedBlockColor = color || categories.personal.color;
    renderColorPicker(el.blockColorPicker, "blockColor", selectedBlockColor, picked => { selectedBlockColor = picked; });
  }

  function setEditBlockColorPicker(color) {
    selectedEditBlockColor = color || categories.personal.color;
    renderColorPicker(el.editBlockColorPicker, "editBlockColor", selectedEditBlockColor, picked => { selectedEditBlockColor = picked; });
  }

  function calendarDayDiff(target, base = new Date()) {
    const a = Date.UTC(target.getFullYear(), target.getMonth(), target.getDate());
    const b = Date.UTC(base.getFullYear(), base.getMonth(), base.getDate());
    return Math.round((a - b) / 86400000);
  }

  function relativeDayName(diff) {
    const small = ["zero", "one", "two", "three", "four", "five", "six"];
    if (diff === 0) return "Today";
    if (diff === 1) return "Tomorrow (+1)";
    if (diff === -1) return "Yesterday (-1)";
    if (diff >= 2 && diff <= 6) return `In ${small[diff]} days (+${diff})`;
    if (diff <= -2 && diff >= -6) return `${small[Math.abs(diff)]} days ago (${diff})`;
    if (diff === 7) return "One week hence (+7)";
    if (diff === -7) return "One week ago (-7)";
    if (diff >= 8 && diff <= 13) return `One week + ${diff - 7} day${diff === 8 ? "" : "s"} (+${diff})`;
    if (diff <= -8 && diff >= -13) return `One week + ${Math.abs(diff) - 7} day${diff === -8 ? "" : "s"} ago (${diff})`;
    if (diff === 14) return "A fortnight hence (+14)";
    if (diff === -14) return "A fortnight ago (-14)";
    return diff > 0 ? `In ${diff} days (+${diff})` : `${Math.abs(diff)} days ago (${diff})`;
  }

  function compactDate(date) {
    const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    return `${weekdays[date.getDay()]} ${date.getDate()} ${months[date.getMonth()]} ’${String(date.getFullYear()).slice(-2)}`;
  }

  function renderDateIdentity() {
    const date = dateFromISO(state.selectedDate);
    const diff = calendarDayDiff(date);
    el.dayLabel.innerHTML = "";
    const relative = document.createElement("span");
    relative.className = "relative-label";
    relative.textContent = relativeDayName(diff);
    const exact = document.createElement("span");
    exact.className = "relative-date";
    exact.textContent = compactDate(date);
    el.dayLabel.append(relative, exact);
    el.selectedDateHeading.textContent = date.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" });
  }

  function render() {
    renderDateIdentity();
    renderQuestOptions();
    renderQuests();
    renderTimeline();
    renderWheel();
    renderSelectedBlockPanel();
    renderWeek();
  }

  function renderQuestOptions() {
    const active = orderedActiveQuests();
    el.blockQuest.innerHTML = "";

    const standalone = document.createElement("option");
    standalone.value = "__free__";
    standalone.textContent = "Standalone block — not linked to a quest";
    el.blockQuest.appendChild(standalone);

    active.forEach(({ q, depth }) => {
      const opt = document.createElement("option");
      opt.value = q.id;
      opt.textContent = `${depth ? "   ↳ ".repeat(Math.min(depth, 3)) : ""}${q.name}${q.completed ? " ✓" : ""}`;
      el.blockQuest.appendChild(opt);
    });
  }

  function renderEditQuestOptions(currentQuestId = null) {
    const active = orderedActiveQuests();
    el.editBlockQuest.innerHTML = "";
    const standalone = document.createElement("option");
    standalone.value = "__free__";
    standalone.textContent = "Standalone block — not linked to a quest";
    el.editBlockQuest.appendChild(standalone);

    active.forEach(({ q, depth }) => {
      const opt = document.createElement("option");
      opt.value = q.id;
      opt.textContent = `${depth ? "   ↳ ".repeat(Math.min(depth, 3)) : ""}${q.name}`;
      el.editBlockQuest.appendChild(opt);
    });

    // If a completed/archived quest is already linked, keep it selectable while editing that block.
    const current = questById(currentQuestId);
    if (current && ![...el.editBlockQuest.options].some(opt => opt.value === current.id)) {
      const opt = document.createElement("option");
      opt.value = current.id;
      opt.textContent = `${current.name} (${current.completed ? "completed" : "archived"})`;
      el.editBlockQuest.appendChild(opt);
    }
  }

  function makeSmallButton(text, extraClass, handler) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = `small-btn ${extraClass}`.trim();
    btn.textContent = text;
    btn.addEventListener("click", handler);
    return btn;
  }

  function createQuestNode(q, depth) {
    const node = document.createElement("div");
    node.className = "quest-node";
    node.dataset.depth = String(depth);
    node.style.setProperty("--node-color", questColor(q));

    const card = document.createElement("article");
    card.className = "quest-card" + (q.completed ? " completed" : "");
    const scheduled = state.blocks.filter(b => b.questId === q.id && !b.completed).length;
    const visibleChildren = childrenOf(q.id).filter(child => !child.archived).sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0));

    const main = document.createElement("div");
    main.className = "card-main";
    main.innerHTML = `<span class="category-mark" style="background:${questColor(q)}"></span>`;

    const titleWrap = document.createElement("div");
    titleWrap.className = "card-text";

    const hierarchy = document.createElement("div");
    hierarchy.className = "hierarchy-label" + (depth === 0 ? " root" : "");
    if (depth === 0) {
      hierarchy.innerHTML = `<span>MAIN QUEST</span>`;
    } else {
      const parent = questById(q.parentId);
      const arrow = document.createElement("span");
      arrow.className = "hierarchy-arrow";
      arrow.textContent = "↳";
      const label = document.createElement("span");
      label.textContent = `LEVEL ${depth + 1} · SUBTASK OF ${parent?.name || "PARENT"}`;
      hierarchy.append(arrow, label);
    }

    const titleRow = document.createElement("div");
    titleRow.className = "quest-title-row";
    const complete = document.createElement("button");
    complete.type = "button";
    complete.className = "complete-toggle";
    complete.setAttribute("aria-label", q.completed ? `Mark ${q.name} incomplete` : `Mark ${q.name} complete`);
    complete.textContent = q.completed ? "✓" : "";
    complete.addEventListener("click", () => {
      q.completed = !q.completed;
      q.completedAt = q.completed ? Date.now() : null;
      saveState();
      render();
    });
    const title = document.createElement("div");
    title.className = "card-title";
    title.textContent = q.name;
    titleRow.append(complete, title);

    const meta = document.createElement("div");
    meta.className = "card-meta";
    const parts = [categories[q.category]?.label || "Quest", `default ${fmtMinutes(q.defaultMinutes)}`];
    if (scheduled) parts.push(`${scheduled} scheduled`);
    if (visibleChildren.length) parts.push(`${visibleChildren.length} subtask${visibleChildren.length === 1 ? "" : "s"}`);
    meta.textContent = parts.join(" · ");

    titleWrap.append(hierarchy, titleRow, meta);
    main.appendChild(titleWrap);

    const actions = document.createElement("div");
    actions.className = "card-actions";
    actions.append(
      makeSmallButton("Schedule", "accent", () => openBlockDialog(q.id)),
      makeSmallButton("+ Subtask", "", () => openQuestDialog(q.id)),
      makeSmallButton("Archive", "danger", () => archiveQuest(q)),
      makeSmallButton("Delete", "danger", () => deleteQuest(q))
    );

    card.append(main, actions);
    node.appendChild(card);

    if (visibleChildren.length) {
      const group = document.createElement("div");
      group.className = "quest-children";
      group.style.setProperty("--branch-color", questColor(q));
      visibleChildren.forEach(child => group.appendChild(createQuestNode(child, depth + 1)));
      node.appendChild(group);
    }
    return node;
  }

  function hasCompletedDescendant(q) {
    return descendantIds(q.id).some(id => {
      const item = questById(id);
      return item && !item.archived && item.completed;
    });
  }

  function completedAtLabel(q) {
    if (!q.completedAt) return "Completed earlier";
    const d = new Date(q.completedAt);
    return `Completed ${d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: d.getFullYear() !== new Date().getFullYear() ? "numeric" : undefined })}`;
  }

  function createCompletedReviewNode(q, depth = 0) {
    const contextOnly = !q.completed;
    const node = document.createElement("div");
    node.className = "quest-node completed-review-node" + (contextOnly ? " context-node" : "");
    node.dataset.depth = String(depth);
    node.style.setProperty("--node-color", questColor(q));

    const card = document.createElement("article");
    card.className = "quest-card completed-review-card" + (contextOnly ? " context-card" : " completed");
    const main = document.createElement("div");
    main.className = "card-main";
    main.innerHTML = `<span class="category-mark" style="background:${questColor(q)}"></span>`;
    const text = document.createElement("div");
    text.className = "card-text";

    const hierarchy = document.createElement("div");
    hierarchy.className = "hierarchy-label" + (depth === 0 ? " root" : "");
    hierarchy.textContent = contextOnly ? (depth === 0 ? "PINNED ACTIVE QUEST" : "ACTIVE BRANCH") : (depth === 0 ? "COMPLETED QUEST" : "COMPLETED SUBTASK");

    const title = document.createElement("div");
    title.className = "card-title";
    title.textContent = q.name;
    const meta = document.createElement("div");
    meta.className = "card-meta";
    if (contextOnly) {
      const count = descendantIds(q.id).filter(id => {
        const item = questById(id);
        return item && !item.archived && item.completed;
      }).length;
      meta.textContent = `Still active · ${count} completed part${count === 1 ? "" : "s"}`;
    } else {
      meta.textContent = `${completedAtLabel(q)} · ${categories[q.category]?.label || "Quest"}`;
    }
    text.append(hierarchy, title, meta);
    main.appendChild(text);
    card.appendChild(main);

    if (!contextOnly) {
      const actions = document.createElement("div");
      actions.className = "card-actions";
      actions.appendChild(makeSmallButton("Restore", "", () => {
        q.completed = false;
        q.completedAt = null;
        saveState();
        render();
      }));
      card.appendChild(actions);
    }
    node.appendChild(card);

    const children = childrenOf(q.id)
      .filter(child => !child.archived && (child.completed || hasCompletedDescendant(child)))
      .sort((a, b) => {
        if (a.completed !== b.completed) return a.completed ? -1 : 1;
        return (b.completedAt || 0) - (a.completedAt || 0) || (a.createdAt || 0) - (b.createdAt || 0);
      });
    if (children.length) {
      const group = document.createElement("div");
      group.className = "quest-children completed-children";
      group.style.setProperty("--branch-color", questColor(q));
      children.forEach(child => group.appendChild(createCompletedReviewNode(child, depth + 1)));
      node.appendChild(group);
    }
    return node;
  }

  function renderActiveQuests() {
    const roots = childrenOf(null).filter(q => !q.archived && !q.completed).sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0));
    if (!roots.length) {
      el.questList.className = "quest-list empty-state";
      el.questList.textContent = "No active quests yet.";
      return;
    }
    el.questList.className = "quest-list";
    el.questList.innerHTML = "";
    roots.forEach(q => el.questList.appendChild(createQuestNode(q, 0)));
  }

  function renderCompletedQuests() {
    el.questList.className = "quest-list completed-quest-list";
    el.questList.innerHTML = "";

    const activePinnedRoots = childrenOf(null)
      .filter(q => !q.archived && !q.completed && hasCompletedDescendant(q))
      .sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0));

    const pinnedIds = new Set();
    activePinnedRoots.forEach(root => {
      pinnedIds.add(root.id);
      descendantIds(root.id).forEach(id => pinnedIds.add(id));
    });

    if (activePinnedRoots.length) {
      const heading = document.createElement("div");
      heading.className = "completed-section-heading pinned-heading";
      heading.innerHTML = `<span>PINNED PROGRESS</span><small>Completed parts inside active quests</small>`;
      el.questList.appendChild(heading);
      activePinnedRoots.forEach(q => el.questList.appendChild(createCompletedReviewNode(q, 0)));
    }

    const completed = state.quests.filter(q => !q.archived && q.completed && !pinnedIds.has(q.id));
    const completedIds = new Set(completed.map(q => q.id));
    const completedRoots = completed
      .filter(q => !q.parentId || !completedIds.has(q.parentId))
      .sort((a, b) => (b.completedAt || 0) - (a.completedAt || 0) || (b.createdAt || 0) - (a.createdAt || 0));

    if (completedRoots.length) {
      const heading = document.createElement("div");
      heading.className = "completed-section-heading";
      heading.innerHTML = `<span>COMPLETED QUESTS</span><small>Most recent first</small>`;
      el.questList.appendChild(heading);
      completedRoots.forEach(q => el.questList.appendChild(createCompletedReviewNode(q, 0)));
    }

    if (!activePinnedRoots.length && !completedRoots.length) {
      el.questList.className = "quest-list empty-state";
      el.questList.textContent = "Nothing completed yet.";
    }
  }

  function renderQuests() {
    el.activeQuestsSubtab.classList.toggle("active", currentQuestMode === "active");
    el.completedQuestsSubtab.classList.toggle("active", currentQuestMode === "completed");
    el.activeQuestsSubtab.setAttribute("aria-selected", currentQuestMode === "active" ? "true" : "false");
    el.completedQuestsSubtab.setAttribute("aria-selected", currentQuestMode === "completed" ? "true" : "false");
    const completedCount = state.quests.filter(q => !q.archived && q.completed).length;
    el.completedQuestsSubtab.textContent = completedCount ? `Completed (${completedCount})` : "Completed";
    if (currentQuestMode === "completed") renderCompletedQuests();
    else renderActiveQuests();
  }

  function archiveQuest(q) {
    const ids = [q.id, ...descendantIds(q.id)];
    ids.forEach(id => {
      const item = questById(id);
      if (item) item.archived = true;
    });
    saveState();
    render();
  }

  function deleteQuest(q) {
    const ids = new Set([q.id, ...descendantIds(q.id)]);
    const nestedCount = ids.size - 1;
    const scheduledCount = state.blocks.filter(b => ids.has(b.questId)).length;
    const detail = [
      nestedCount ? `${nestedCount} nested task${nestedCount === 1 ? "" : "s"}` : null,
      scheduledCount ? `${scheduledCount} scheduled block${scheduledCount === 1 ? "" : "s"}` : null
    ].filter(Boolean).join(" and ");
    const message = `Permanently delete “${q.name}”${detail ? ` plus ${detail}` : ""}? This cannot be undone.`;
    if (!window.confirm(message)) return;
    state.quests = state.quests.filter(item => !ids.has(item.id));
    state.blocks = state.blocks.filter(b => !ids.has(b.questId));
    saveState();
    render();
  }

  function intervalsOverlap(a, b) {
    const aEnd = Math.min(1440, a.start + a.minutes);
    const bEnd = Math.min(1440, b.start + b.minutes);
    return a.start < bEnd && b.start < aEnd;
  }

  function overlapCount(block, blocks) {
    return blocks.filter(other => other.id !== block.id && intervalsOverlap(block, other)).length;
  }

  function clearSelectedBlock() {
    selectedBlockId = null;
    renderSelectedBlockPanel();
    renderTimeline();
    renderWheel();
  }

  function selectBlock(blockId) {
    const block = state.blocks.find(item => item.id === blockId);
    if (!block || block.date !== state.selectedDate) return;
    selectedBlockId = block.id;
    renderSelectedBlockPanel();
    renderTimeline();
    renderWheel();
  }

  function deleteSelectedBlock(block) {
    if (!block) return;
    state.blocks = state.blocks.filter(item => item.id !== block.id);
    selectedBlockId = null;
    saveState();
    render();
  }

  function renderSelectedBlockPanel() {
    const block = state.blocks.find(item => item.id === selectedBlockId && item.date === state.selectedDate);
    if (!block) {
      selectedBlockId = null;
      el.selectedBlockPanel.hidden = true;
      return;
    }
    el.selectedBlockPanel.hidden = false;
    el.selectedBlockMark.style.background = blockColor(block);
    el.selectedBlockTitle.textContent = blockTitle(block);
    el.selectedBlockMeta.textContent = `${timeFromMinutes(block.start)}–${timeFromMinutes(block.start + block.minutes)} · ${fmtMinutes(block.minutes)} · ${blockCategoryLabel(block)}`;
    const delta = blockBankDelta(block);
    el.selectedBlockStatus.className = "selected-block-status";
    if (block.completed) {
      if (delta > 0) {
        el.selectedBlockStatus.textContent = `${fmtSignedMinutes(delta)} banked · completed in ${fmtMinutes(block.actualMinutes)}`;
        el.selectedBlockStatus.classList.add("positive");
      } else if (delta < 0) {
        el.selectedBlockStatus.textContent = `${fmtSignedMinutes(delta)} banked · ${fmtMinutes(Math.abs(delta))} over plan`;
        el.selectedBlockStatus.classList.add("negative");
      } else {
        el.selectedBlockStatus.textContent = `Completed on time · ${fmtMinutes(block.actualMinutes)}`;
      }
    } else if (block.recurrenceLabel) {
      el.selectedBlockStatus.textContent = `Repeating · ${block.recurrenceLabel}`;
    } else {
      el.selectedBlockStatus.textContent = block.questId ? "Quest-linked block" : "Standalone block";
    }
    el.selectedBlockFinish.hidden = block.completed;
  }

  function renderTimeline() {
    const blocks = selectedBlocks();
    const dayNet = blocks.reduce((sum, b) => sum + blockBankDelta(b), 0);
    el.reclaimedTotal.textContent = fmtSignedMinutes(dayNet);
    el.reclaimedTotal.classList.toggle("negative", dayNet < 0);
    const balance = bankBalance();
    el.bankedTimeTotal.textContent = fmtSignedMinutes(balance);
    el.bankedTimeTotal.classList.toggle("negative", balance < 0);

    if (!blocks.length) {
      el.timeline.className = "timeline empty-state";
      el.timeline.textContent = "No time blocks yet.";
      return;
    }

    el.timeline.className = "timeline";
    el.timeline.innerHTML = "";
    blocks.forEach(b => {
      const card = document.createElement("article");
      card.className = "block-card" + (b.completed ? " done" : "") + (b.id === selectedBlockId ? " selected" : "");
      const end = b.start + b.minutes;

      const main = document.createElement("div");
      main.className = "card-main";
      main.innerHTML = `<span class="category-mark" style="background:${blockColor(b)}"></span>`;
      const text = document.createElement("div");
      text.className = "card-text";
      const title = document.createElement("div");
      title.className = "card-title";
      title.textContent = blockTitle(b);
      const meta = document.createElement("div");
      meta.className = "card-meta";
      meta.textContent = `${timeFromMinutes(b.start)}–${timeFromMinutes(end)} · ${fmtMinutes(b.minutes)} · ${blockCategoryLabel(b)}`;
      text.append(title, meta);

      if (!b.questId) {
        const free = document.createElement("div");
        free.className = "standalone-note";
        free.textContent = "Standalone schedule block";
        text.appendChild(free);
      }
      if (b.recurrenceLabel) {
        const rep = document.createElement("div");
        rep.className = "repeat-note";
        rep.textContent = `↻ ${b.recurrenceLabel}`;
        text.appendChild(rep);
      }
      const overlaps = overlapCount(b, blocks);
      if (overlaps) {
        const note = document.createElement("div");
        note.className = "overlap-note";
        note.textContent = `◎ simultaneous with ${overlaps} other block${overlaps === 1 ? "" : "s"}`;
        text.appendChild(note);
      }
      if (b.completed) {
        const note = document.createElement("div");
        const delta = blockBankDelta(b);
        note.className = "reclaimed-note" + (delta < 0 ? " negative" : "");
        if (delta > 0) note.textContent = `${fmtSignedMinutes(delta)} banked · finished in ${fmtMinutes(b.actualMinutes)}`;
        else if (delta < 0) note.textContent = `${fmtSignedMinutes(delta)} banked · ran ${fmtMinutes(Math.abs(delta))} over`;
        else note.textContent = `On time · completed in ${fmtMinutes(b.actualMinutes)}`;
        text.appendChild(note);
      }
      main.appendChild(text);

      const actions = document.createElement("div");
      actions.className = "card-actions";
      actions.appendChild(makeSmallButton("Edit", "", () => openEditBlockDialog(b.id)));
      if (!b.completed) actions.appendChild(makeSmallButton("Finish", "accent", () => openFinishDialog(b.id)));
      actions.appendChild(makeSmallButton("Delete", "danger", () => {
        state.blocks = state.blocks.filter(x => x.id !== b.id);
        if (selectedBlockId === b.id) selectedBlockId = null;
        saveState();
        render();
      }));

      card.append(main, actions);
      el.timeline.appendChild(card);
    });
  }

  function polar(cx, cy, r, angle) {
    const rad = (angle - 90) * Math.PI / 180;
    return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
  }

  function arcPath(cx, cy, rOuter, rInner, startAngle, endAngle) {
    const span = Math.max(0.001, Math.min(359.999, endAngle - startAngle));
    const finalAngle = startAngle + span;
    const p1 = polar(cx, cy, rOuter, startAngle);
    const p2 = polar(cx, cy, rOuter, finalAngle);
    const p3 = polar(cx, cy, rInner, finalAngle);
    const p4 = polar(cx, cy, rInner, startAngle);
    const large = span > 180 ? 1 : 0;
    return [
      `M ${p1.x} ${p1.y}`,
      `A ${rOuter} ${rOuter} 0 ${large} 1 ${p2.x} ${p2.y}`,
      `L ${p3.x} ${p3.y}`,
      `A ${rInner} ${rInner} 0 ${large} 0 ${p4.x} ${p4.y}`,
      "Z"
    ].join(" ");
  }

  function assignLanes(blocks) {
    const sorted = [...blocks].sort((a, b) => a.start - b.start || a.minutes - b.minutes);
    const laneEnds = [];
    const laneById = new Map();
    sorted.forEach(block => {
      const end = Math.min(1440, block.start + block.minutes);
      let lane = laneEnds.findIndex(lastEnd => block.start >= lastEnd);
      if (lane === -1) {
        lane = laneEnds.length;
        laneEnds.push(end);
      } else {
        laneEnds[lane] = end;
      }
      laneById.set(block.id, lane);
    });
    return { laneById, laneCount: Math.max(1, laneEnds.length) };
  }

  function laneGeometry(laneCount, ro, minInner) {
    const gap = laneCount > 1 ? 2 : 0;
    const desiredTotal = 54 + Math.max(0, laneCount - 1) * 7;
    const total = Math.min(ro - minInner, desiredTotal);
    const band = Math.max(5, (total - gap * (laneCount - 1)) / laneCount);
    return { gap, band, inner: ro - total };
  }

  function appendWheelBlocks(svg, blocks, cx, cy, ro, minInner, strokeWidth = 1.5, interactive = false) {
    const NS = "http://www.w3.org/2000/svg";
    const lanes = assignLanes(blocks);
    const geo = laneGeometry(lanes.laneCount, ro, minInner);

    blocks.forEach(b => {
      const lane = lanes.laneById.get(b.id) || 0;
      const laneOuter = ro - lane * (geo.band + geo.gap);
      const laneInner = laneOuter - geo.band;
      const visibleEnd = Math.min(1440, b.start + b.minutes);
      if (visibleEnd <= b.start) return;
      const startA = b.start / 1440 * 360;
      const endA = visibleEnd / 1440 * 360;
      const path = document.createElementNS(NS, "path");
      path.setAttribute("d", arcPath(cx, cy, laneOuter, laneInner, startA, endA));
      path.setAttribute("fill", blockColor(b));
      path.setAttribute("opacity", b.completed ? ".48" : ".93");
      path.setAttribute("stroke", b.id === selectedBlockId && interactive ? "#f2f3f5" : "#0e1014");
      path.setAttribute("stroke-width", String(b.id === selectedBlockId && interactive ? Math.max(2.8, strokeWidth * 2) : strokeWidth));
      if (interactive) {
        path.classList.add("wheel-block-segment");
        if (b.id === selectedBlockId) path.classList.add("selected");
        path.setAttribute("tabindex", "0");
        path.setAttribute("role", "button");
        path.setAttribute("aria-label", `${blockTitle(b)}, ${timeFromMinutes(b.start)} to ${timeFromMinutes(b.start + b.minutes)}, ${fmtMinutes(b.minutes)}`);
        const activate = event => {
          if (suppressBlockClick) return;
          event.stopPropagation();
          selectBlock(b.id);
        };
        path.addEventListener("click", activate);
        path.addEventListener("keydown", event => {
          if (event.key === "Enter" || event.key === " ") { event.preventDefault(); activate(event); }
        });
      }
      svg.appendChild(path);

      if (b.completed && b.reclaimed > 0 && b.actualMinutes != null) {
        const freeStart = Math.min(1440, b.start + b.actualMinutes);
        const plannedEnd = Math.min(1440, b.start + b.minutes);
        if (plannedEnd > freeStart) {
          const free = document.createElementNS(NS, "path");
          free.setAttribute("d", arcPath(cx, cy, laneOuter, laneInner, freeStart / 1440 * 360, plannedEnd / 1440 * 360));
          free.setAttribute("fill", "#3d424d");
          free.setAttribute("stroke", "#d9b55b");
          free.setAttribute("stroke-width", String(strokeWidth));
          if (interactive) {
            free.classList.add("wheel-block-segment");
            free.setAttribute("tabindex", "0");
            free.setAttribute("role", "button");
            free.setAttribute("aria-label", `${blockTitle(b)} reclaimed time`);
            const activateFree = event => { if (suppressBlockClick) return; event.stopPropagation(); selectBlock(b.id); };
            free.addEventListener("click", activateFree);
            free.addEventListener("keydown", event => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); activateFree(event); } });
          }
          svg.appendChild(free);
        }
      }
    });
    return geo;
  }

  function renderWheel() {
    const svg = el.dayWheel;
    svg.innerHTML = "";
    const NS = "http://www.w3.org/2000/svg";
    const cx = 180, cy = 180, ro = 148;
    const blocks = selectedBlocks();
    const lanes = assignLanes(blocks);
    const geo = laneGeometry(lanes.laneCount, ro, 58);

    const base = document.createElementNS(NS, "circle");
    base.setAttribute("cx", cx);
    base.setAttribute("cy", cy);
    base.setAttribute("r", (ro + geo.inner) / 2);
    base.setAttribute("fill", "none");
    base.setAttribute("stroke", "#252a33");
    base.setAttribute("stroke-width", ro - geo.inner);
    svg.appendChild(base);

    appendWheelBlocks(svg, blocks, cx, cy, ro, 58, 1.4, true);

    // Hour ticks point inward so they no longer get clipped by the SVG edge.
    for (let h = 0; h < 24; h += 1) {
      const a = h / 24 * 360;
      const p1 = polar(cx, cy, ro - 1, a);
      const p2 = polar(cx, cy, ro - (h % 6 === 0 ? 15 : 9), a);
      const line = document.createElementNS(NS, "line");
      line.setAttribute("x1", p1.x);
      line.setAttribute("y1", p1.y);
      line.setAttribute("x2", p2.x);
      line.setAttribute("y2", p2.y);
      line.setAttribute("stroke", h % 6 === 0 ? "#d1d5dc" : "#777f8d");
      line.setAttribute("stroke-width", h % 6 === 0 ? "1.8" : "1");
      svg.appendChild(line);

      if (h % 3 === 0) {
        const tp = polar(cx, cy, ro + 11, a);
        const text = document.createElementNS(NS, "text");
        text.setAttribute("x", tp.x);
        text.setAttribute("y", tp.y + 3.5);
        text.setAttribute("fill", "#a5abb6");
        text.setAttribute("font-size", "9.5");
        text.setAttribute("font-weight", "650");
        text.setAttribute("text-anchor", "middle");
        text.textContent = String(h).padStart(2, "0");
        svg.appendChild(text);
      }
    }

    el.wheelScheduled.textContent = fmtMinutes(blocks.reduce((s, b) => s + b.minutes, 0));
    el.wheelLegend.innerHTML = "";
    const seen = new Set();
    blocks.forEach(b => {
      const key = `${blockTitle(b)}|${blockColor(b)}`;
      if (seen.has(key)) return;
      seen.add(key);
      const item = document.createElement("span");
      item.className = "legend-item";
      item.innerHTML = `<span class="legend-dot" style="background:${blockColor(b)}"></span>`;
      item.appendChild(document.createTextNode(blockTitle(b)));
      el.wheelLegend.appendChild(item);
    });
    if (blocks.some(b => b.reclaimed > 0)) {
      const item = document.createElement("span");
      item.className = "legend-item";
      item.innerHTML = `<span class="legend-dot" style="background:#3d424d;border:1px solid #d9b55b"></span>Reclaimed`;
      el.wheelLegend.appendChild(item);
    }
  }

  function startOfWeek(date) {
    const d = new Date(date);
    const day = (d.getDay() + 6) % 7;
    d.setDate(d.getDate() - day);
    d.setHours(0, 0, 0, 0);
    return d;
  }

  function renderMiniWheel(svg, blocks) {
    svg.innerHTML = "";
    const NS = "http://www.w3.org/2000/svg";
    const cx = 50, cy = 50, ro = 44;
    const lanes = assignLanes(blocks);
    const geo = laneGeometry(lanes.laneCount, ro, 15);
    const base = document.createElementNS(NS, "circle");
    base.setAttribute("cx", cx);
    base.setAttribute("cy", cy);
    base.setAttribute("r", (ro + geo.inner) / 2);
    base.setAttribute("fill", "none");
    base.setAttribute("stroke", "#252a33");
    base.setAttribute("stroke-width", ro - geo.inner);
    svg.appendChild(base);
    appendWheelBlocks(svg, blocks, cx, cy, ro, 15, .7);

    [0, 6, 12, 18].forEach(h => {
      const a = h / 24 * 360;
      const p1 = polar(cx, cy, ro - 1, a);
      const p2 = polar(cx, cy, ro - 5, a);
      const line = document.createElementNS(NS, "line");
      line.setAttribute("x1", p1.x);
      line.setAttribute("y1", p1.y);
      line.setAttribute("x2", p2.x);
      line.setAttribute("y2", p2.y);
      line.setAttribute("stroke", "#b1b6c0");
      line.setAttribute("stroke-width", "1");
      svg.appendChild(line);
    });
  }

  function renderWeek() {
    const base = dateFromISO(state.selectedDate);
    const start = startOfWeek(base);
    const end = addDays(start, 6);
    el.weekHeading.textContent = `${start.toLocaleDateString(undefined, { month: "short", day: "numeric" })} – ${end.toLocaleDateString(undefined, { month: "short", day: "numeric" })}`;
    el.weekGrid.innerHTML = "";
    const today = isoDate(new Date());

    for (let i = 0; i < 7; i += 1) {
      const d = addDays(start, i);
      const iso = isoDate(d);
      const blocks = blocksFor(iso);
      const total = blocks.reduce((s, b) => s + b.minutes, 0);
      const reclaimed = blocks.reduce((s, b) => s + blockBankDelta(b), 0);
      const box = document.createElement("div");
      box.className = "week-day" + (iso === today ? " today" : "");

      const btn = document.createElement("button");
      btn.type = "button";
      const dateStack = document.createElement("div");
      dateStack.className = "week-date-stack";
      dateStack.innerHTML = `<div class="week-name">${d.toLocaleDateString(undefined, { weekday: "short" })}</div><div class="week-num">${d.getDate()}</div><div class="week-hours">${fmtMinutes(total)}</div>${reclaimed ? `<div class="week-free${reclaimed < 0 ? " negative" : ""}">${fmtSignedMinutes(reclaimed)}</div>` : ""}`;

      const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
      svg.setAttribute("class", "mini-wheel");
      svg.setAttribute("viewBox", "0 0 100 100");
      svg.setAttribute("aria-label", `${d.toLocaleDateString(undefined, { weekday: "long" })} 24 hour schedule`);
      renderMiniWheel(svg, blocks);

      const summary = document.createElement("div");
      summary.className = "week-quests";
      const unique = [];
      const seen = new Set();
      blocks.forEach(b => {
        const key = `${blockTitle(b)}|${blockColor(b)}`;
        if (seen.has(key)) return;
        seen.add(key);
        unique.push(b);
      });
      if (!unique.length) {
        summary.innerHTML = `<div class="week-quest-line">No blocks scheduled</div>`;
      } else {
        unique.slice(0, 4).forEach(b => {
          const line = document.createElement("div");
          line.className = "week-quest-line";
          line.innerHTML = `<span class="week-quest-dot" style="background:${blockColor(b)}"></span>`;
          const name = document.createElement("span");
          name.textContent = blockTitle(b);
          line.appendChild(name);
          summary.appendChild(line);
        });
        if (unique.length > 4) {
          const more = document.createElement("div");
          more.className = "week-quest-line";
          more.textContent = `+${unique.length - 4} more`;
          summary.appendChild(more);
        }
      }

      btn.append(dateStack, svg, summary);
      btn.addEventListener("click", () => {
        selectedBlockId = null;
        state.selectedDate = iso;
        saveState();
        switchView("dayView");
        render();
      });
      box.appendChild(btn);
      el.weekGrid.appendChild(box);
    }
  }

  function openQuestDialog(parentId = null) {
    const parent = parentId ? questById(parentId) : null;
    el.questParentId.value = parent?.id || "";
    el.questDialogEyebrow.textContent = parent ? "NEW SUBTASK" : "NEW QUEST";
    el.questDialogTitle.textContent = parent ? `Add under ${parent.name}` : "Create quest";
    el.questName.value = "";
    if (parent) {
      el.questCategory.value = parent.category || "personal";
      el.questDuration.value = String(parent.defaultMinutes || 30);
      setQuestColorPicker(questColor(parent));
    } else {
      el.questCategory.value = "business";
      el.questDuration.value = "30";
      setQuestColorPicker(categoryColor("business"));
    }
    el.questDialog.showModal();
  }

  function toggleBlockMode({ resetDuration = true } = {}) {
    const q = questById(el.blockQuest.value);
    const standalone = !q;
    el.standaloneFields.hidden = !standalone;
    el.blockName.required = standalone;
    if (q && resetDuration) setBlockDurationInputs(q.defaultMinutes || 30);
  }

  function openBlockDialog(questId = null) {
    renderQuestOptions();
    el.blockQuest.value = questId && questById(questId) ? questId : "__free__";
    el.blockStart.value = "09:00";
    setBlockDurationInputs(questId && questById(questId) ? (questById(questId).defaultMinutes || 30) : 30);
    el.blockName.value = "";
    el.blockCategory.value = "personal";
    setBlockColorPicker(categoryColor("personal"));
    el.repeatEnabled.checked = false;
    el.repeatFields.hidden = true;
    el.repeatEvery.value = "1";
    el.repeatFor.value = "7";
    el.repeatUnit.value = "weeks";
    toggleBlockMode({ resetDuration: false });
    el.blockDialog.showModal();
  }

  function setEditBlockDurationInputs(totalMinutes) {
    const total = Math.max(2, Math.min(600, Math.round(Number(totalMinutes) || 30)));
    el.editBlockHours.value = String(Math.floor(total / 60));
    el.editBlockMinutes.value = String(total % 60);
  }

  function editBlockDurationFromInputs() {
    const hours = Math.max(0, Math.min(10, Number(el.editBlockHours.value) || 0));
    const minutes = Math.max(0, Math.min(59, Number(el.editBlockMinutes.value) || 0));
    return Math.round(hours * 60 + minutes);
  }

  function toggleEditBlockMode() {
    const q = questById(el.editBlockQuest.value);
    const standalone = !q;
    el.editStandaloneFields.hidden = !standalone;
    el.editBlockName.required = standalone;
  }

  function calendarDateDelta(fromISO, toISO) {
    const from = dateFromISO(fromISO);
    const to = dateFromISO(toISO);
    const a = Date.UTC(from.getFullYear(), from.getMonth(), from.getDate());
    const b = Date.UTC(to.getFullYear(), to.getMonth(), to.getDate());
    return Math.round((b - a) / 86400000);
  }

  function refreshLedgerForBlock(block) {
    if (!block.completed || block.actualMinutes == null) return;
    const newDelta = block.minutes - block.actualMinutes;
    block.bankDelta = newDelta;
    block.reclaimed = Math.max(0, newDelta);
    state.bankLedger = Array.isArray(state.bankLedger) ? state.bankLedger : [];
    const entries = state.bankLedger.filter(entry => entry.blockId === block.id);
    if (entries.length) {
      entries[0].delta = newDelta;
      entries[0].note = blockTitle(block);
      state.bankLedger = state.bankLedger.filter((entry, index) => entry.blockId !== block.id || entry === entries[0]);
      if (newDelta === 0) state.bankLedger = state.bankLedger.filter(entry => entry.blockId !== block.id);
    } else if (newDelta !== 0) {
      state.bankLedger.push({ id: uid("bank"), blockId: block.id, delta: newDelta, createdAt: Date.now(), note: blockTitle(block) });
    }
  }

  function openEditBlockDialog(blockId) {
    const block = state.blocks.find(item => item.id === blockId);
    if (!block) return;
    el.editBlockId.value = block.id;
    el.editBlockTitle.textContent = blockTitle(block);
    renderEditQuestOptions(block.questId);
    el.editBlockQuest.value = block.questId || "__free__";
    el.editBlockName.value = block.questId ? "" : (block.name || "");
    el.editBlockCategory.value = block.questId ? (questById(block.questId)?.category || "personal") : (block.category || "personal");
    setEditBlockColorPicker(blockColor(block));
    el.editBlockDate.value = block.date;
    el.editBlockStart.value = timeFromMinutes(block.start);
    setEditBlockDurationInputs(block.minutes);
    toggleEditBlockMode();

    const seriesBlocks = block.seriesId ? state.blocks.filter(item => item.seriesId === block.seriesId) : [];
    const hasFuture = seriesBlocks.some(item => item.id !== block.id && item.date >= block.date);
    el.editSeriesScope.hidden = !(block.seriesId && hasFuture);
    el.editScopeOne.checked = true;
    el.editScopeFuture.checked = false;
    if (!el.editSeriesScope.hidden) {
      const futureCount = seriesBlocks.filter(item => item.date >= block.date).length;
      el.editSeriesNote.textContent = `${futureCount} occurrence${futureCount === 1 ? "" : "s"} from this date onward${block.recurrenceLabel ? ` · ${block.recurrenceLabel}` : ""}. Past occurrences will not change.`;
    } else {
      el.editSeriesNote.textContent = "";
    }
    el.editBlockDialog.showModal();
  }

  function setActualDurationInputs(actualMinutes) {
    const actual = Math.max(1, Math.min(1440, Math.round(Number(actualMinutes) || 1)));
    el.actualHours.value = String(Math.floor(actual / 60));
    el.actualMinutes.value = String(actual % 60);
  }

  function actualDurationFromInputs() {
    const hours = Math.max(0, Math.min(23, Number(el.actualHours.value) || 0));
    const minutes = Math.max(0, Math.min(59, Number(el.actualMinutes.value) || 0));
    return Math.max(1, Math.min(1440, Math.round(hours * 60 + minutes)));
  }

  function updateFinishGaugeFromActual() {
    const b = state.blocks.find(x => x.id === el.finishBlockId.value);
    if (!b) return;
    const actual = actualDurationFromInputs();
    const delta = actual - b.minutes;
    el.timeDeltaGauge.value = String(Math.max(Number(el.timeDeltaGauge.min), Math.min(Number(el.timeDeltaGauge.max), delta)));
    updateFinishReadout(b, actual);
  }

  function updateFinishReadout(b, actual) {
    const bankDelta = b.minutes - actual;
    el.actualDurationLabel.textContent = `Actual: ${fmtMinutes(actual)}`;
    if (bankDelta > 0) {
      el.gaugeDeltaLabel.textContent = `${fmtMinutes(bankDelta)} early · bank ${fmtSignedMinutes(bankDelta)}`;
      el.gaugeDeltaLabel.classList.remove("negative");
    } else if (bankDelta < 0) {
      el.gaugeDeltaLabel.textContent = `${fmtMinutes(Math.abs(bankDelta))} over · bank ${fmtSignedMinutes(bankDelta)}`;
      el.gaugeDeltaLabel.classList.add("negative");
    } else {
      el.gaugeDeltaLabel.textContent = "On time · bank ±0m";
      el.gaugeDeltaLabel.classList.remove("negative");
    }
  }

  function openFinishDialog(blockId) {
    const b = state.blocks.find(x => x.id === blockId);
    if (!b) return;
    el.finishBlockId.value = b.id;
    el.finishTitle.textContent = blockTitle(b);
    el.plannedDurationLabel.textContent = fmtMinutes(b.minutes);
    el.timeDeltaGauge.min = String(-(b.minutes - 1));
    el.timeDeltaGauge.max = String(Math.min(720, 1440 - b.minutes));
    el.timeDeltaGauge.value = "0";
    setActualDurationInputs(b.minutes);
    updateFinishReadout(b, b.minutes);
    el.finishDialog.showModal();
  }

  function switchView(id) {
    document.querySelectorAll(".view").forEach(v => v.classList.toggle("active", v.id === id));
    document.querySelectorAll(".tab").forEach(t => t.classList.toggle("active", t.dataset.view === id));
  }

  function setSelectedDay(delta) {
    selectedBlockId = null;
    const d = dateFromISO(state.selectedDate);
    d.setDate(d.getDate() + delta);
    state.selectedDate = isoDate(d);
    saveState();
    render();
  }

  function animateDayShift(delta) {
    if (swipeAnimating || !delta) return;
    selectedBlockId = null;
    swipeAnimating = true;
    const slide = el.wheelSlide;
    const outgoing = delta > 0 ? -112 : 112;
    const incoming = -outgoing;

    slide.classList.add("animating");
    slide.style.transform = `translateX(${outgoing}%)`;
    slide.style.opacity = "0.15";

    window.setTimeout(() => {
      const d = dateFromISO(state.selectedDate);
      d.setDate(d.getDate() + delta);
      state.selectedDate = isoDate(d);
      saveState();
      render();

      slide.classList.remove("animating");
      slide.style.transform = `translateX(${incoming}%)`;
      slide.style.opacity = "0.15";
      void slide.offsetWidth;
      slide.classList.add("animating");
      slide.style.transform = "translateX(0)";
      slide.style.opacity = "1";

      window.setTimeout(() => {
        slide.classList.remove("animating");
        slide.style.transform = "";
        slide.style.opacity = "";
        swipeAnimating = false;
      }, 185);
    }, 175);
  }

  function snapWheelBack() {
    el.wheelSlide.classList.add("animating");
    el.wheelSlide.style.transform = "translateX(0)";
    el.wheelSlide.style.opacity = "1";
    window.setTimeout(() => {
      el.wheelSlide.classList.remove("animating");
      el.wheelSlide.style.transform = "";
      el.wheelSlide.style.opacity = "";
    }, 180);
  }

  function recurrenceDates(startDate, everyDays, durationAmount, durationUnit) {
    const start = dateFromISO(startDate);
    const end = addDuration(start, durationAmount, durationUnit);
    const dates = [];
    let cursor = new Date(start);
    let guard = 0;
    while (cursor <= end && guard < 1200) {
      dates.push(isoDate(cursor));
      cursor = addDays(cursor, everyDays);
      guard += 1;
    }
    return { dates, truncated: cursor <= end };
  }

  document.querySelectorAll(".tab").forEach(btn => btn.addEventListener("click", () => switchView(btn.dataset.view)));

  el.activeQuestsSubtab.addEventListener("click", () => { currentQuestMode = "active"; renderQuests(); });
  el.completedQuestsSubtab.addEventListener("click", () => { currentQuestMode = "completed"; renderQuests(); });

  $("todayBtn").addEventListener("click", () => {
    selectedBlockId = null;
    state.selectedDate = isoDate(new Date());
    saveState();
    render();
  });

  // Swipe interaction: follow the finger, then slide the old day out and the new day in.
  el.wheelWrap.addEventListener("pointerdown", event => {
    if (swipeAnimating) return;
    swipeStart = { id: event.pointerId, x: event.clientX, y: event.clientY, dx: 0, horizontal: false };
    if (el.wheelWrap.setPointerCapture) el.wheelWrap.setPointerCapture(event.pointerId);
  });

  el.wheelWrap.addEventListener("pointermove", event => {
    if (!swipeStart || swipeStart.id !== event.pointerId || swipeAnimating) return;
    const dx = event.clientX - swipeStart.x;
    const dy = event.clientY - swipeStart.y;
    if (!swipeStart.horizontal && Math.abs(dx) > 8 && Math.abs(dx) > Math.abs(dy) * 1.15) {
      swipeStart.horizontal = true;
      suppressBlockClick = true;
    }
    if (!swipeStart.horizontal) return;
    swipeStart.dx = dx;
    const width = Math.max(240, el.wheelWrap.clientWidth || 360);
    const limited = Math.max(-width * .52, Math.min(width * .52, dx));
    el.wheelSlide.style.transform = `translateX(${limited}px)`;
    el.wheelSlide.style.opacity = String(Math.max(.55, 1 - Math.abs(limited) / width * .65));
  });

  el.wheelWrap.addEventListener("pointerup", event => {
    if (!swipeStart || swipeStart.id !== event.pointerId || swipeAnimating) return;
    const dx = swipeStart.dx || event.clientX - swipeStart.x;
    const horizontal = swipeStart.horizontal;
    swipeStart = null;
    if (horizontal && Math.abs(dx) >= 45) animateDayShift(dx < 0 ? 1 : -1);
    else snapWheelBack();
    if (horizontal) window.setTimeout(() => { suppressBlockClick = false; }, 260);
  });

  el.wheelWrap.addEventListener("pointercancel", () => {
    swipeStart = null;
    suppressBlockClick = false;
    snapWheelBack();
  });

  el.wheelWrap.addEventListener("keydown", event => {
    if (event.key === "ArrowLeft") { event.preventDefault(); animateDayShift(-1); }
    if (event.key === "ArrowRight") { event.preventDefault(); animateDayShift(1); }
  });

  $("addQuestBtn").addEventListener("click", () => openQuestDialog());
  el.questCategory.addEventListener("change", () => {
    if (!el.questParentId.value) setQuestColorPicker(categoryColor(el.questCategory.value));
  });
  $("cancelQuest").addEventListener("click", () => el.questDialog.close());
  el.questForm.addEventListener("submit", event => {
    event.preventDefault();
    const name = el.questName.value.trim();
    if (!name) return;
    state.quests.push({
      id: uid("q"),
      parentId: el.questParentId.value || null,
      name,
      category: el.questCategory.value,
      defaultMinutes: Math.max(2, Math.min(600, Number(el.questDuration.value) || 30)),
      color: selectedQuestColor,
      completed: false,
      archived: false,
      createdAt: Date.now()
    });
    saveState();
    el.questDialog.close();
    render();
  });

  $("addBlockBtn").addEventListener("click", () => openBlockDialog());
  $("cancelBlock").addEventListener("click", () => el.blockDialog.close());
  el.blockQuest.addEventListener("change", () => toggleBlockMode());
  el.blockCategory.addEventListener("change", () => setBlockColorPicker(categoryColor(el.blockCategory.value)));
  el.repeatEnabled.addEventListener("change", () => { el.repeatFields.hidden = !el.repeatEnabled.checked; });

  el.blockForm.addEventListener("submit", event => {
    event.preventDefault();
    const q = questById(el.blockQuest.value);
    const standalone = !q;
    const name = standalone ? el.blockName.value.trim() : null;
    if (standalone && !name) {
      el.blockName.focus();
      return;
    }

    const start = minutesFromTime(el.blockStart.value);
    const minutes = blockDurationFromInputs();
    if (minutes < 2 || minutes > 600) {
      window.alert("Block duration must be between 2 minutes and 10 hours.");
      (minutes < 2 ? el.blockMinutes : el.blockHours).focus();
      return;
    }
    let dates = [state.selectedDate];
    let recurrenceLabel = null;
    let seriesId = null;

    if (el.repeatEnabled.checked) {
      const every = Math.max(1, Math.min(365, Number(el.repeatEvery.value) || 1));
      const duration = Math.max(1, Math.min(3650, Number(el.repeatFor.value) || 1));
      const unit = ["days", "weeks", "months"].includes(el.repeatUnit.value) ? el.repeatUnit.value : "days";
      const generated = recurrenceDates(state.selectedDate, every, duration, unit);
      dates = generated.dates;
      recurrenceLabel = `every ${every} day${every === 1 ? "" : "s"} for ${duration} ${unit}`;
      seriesId = uid("series");
      if (generated.truncated) window.alert("That repetition would create more than 1,200 blocks, so Questwheel created the first 1,200 only.");
    }

    dates.forEach(date => {
      state.blocks.push({
        id: uid("b"),
        questId: q?.id || null,
        name,
        category: standalone ? el.blockCategory.value : (q?.category || "personal"),
        color: standalone ? selectedBlockColor : null,
        date,
        start,
        minutes,
        completed: false,
        actualMinutes: null,
        reclaimed: 0,
        seriesId,
        recurrenceLabel,
        recurrenceEvery: el.repeatEnabled.checked ? Math.max(1, Math.min(365, Number(el.repeatEvery.value) || 1)) : null,
        recurrenceFor: el.repeatEnabled.checked ? Math.max(1, Math.min(3650, Number(el.repeatFor.value) || 1)) : null,
        recurrenceUnit: el.repeatEnabled.checked ? el.repeatUnit.value : null
      });
    });

    saveState();
    el.blockDialog.close();
    render();
  });

  $("cancelEditBlock").addEventListener("click", () => el.editBlockDialog.close());
  el.editBlockQuest.addEventListener("change", toggleEditBlockMode);
  el.editBlockCategory.addEventListener("change", () => setEditBlockColorPicker(categoryColor(el.editBlockCategory.value)));
  el.editBlockForm.addEventListener("submit", event => {
    event.preventDefault();
    const source = state.blocks.find(item => item.id === el.editBlockId.value);
    if (!source) return;

    const q = questById(el.editBlockQuest.value);
    const standalone = !q;
    const name = standalone ? el.editBlockName.value.trim() : null;
    if (standalone && !name) {
      el.editBlockName.focus();
      return;
    }
    const minutes = editBlockDurationFromInputs();
    if (minutes < 2 || minutes > 600) {
      window.alert("Block duration must be between 2 minutes and 10 hours.");
      (minutes < 2 ? el.editBlockMinutes : el.editBlockHours).focus();
      return;
    }
    const newDate = el.editBlockDate.value;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(newDate)) return;
    const newStart = minutesFromTime(el.editBlockStart.value);
    const scopeFuture = !el.editSeriesScope.hidden && el.editScopeFuture.checked && source.seriesId;
    const originalDate = source.date;
    const shiftDays = calendarDateDelta(originalDate, newDate);

    let targets = [source];
    if (scopeFuture) {
      targets = state.blocks.filter(item => item.seriesId === source.seriesId && item.date >= originalDate);
    }

    targets.forEach(block => {
      if (scopeFuture) block.date = isoDate(addDays(dateFromISO(block.date), shiftDays));
      else block.date = newDate;
      block.start = newStart;
      block.minutes = minutes;
      block.questId = q?.id || null;
      block.name = standalone ? name : null;
      block.category = standalone ? el.editBlockCategory.value : (q?.category || "personal");
      block.color = standalone ? selectedEditBlockColor : null;
      refreshLedgerForBlock(block);
    });

    saveState();
    el.editBlockDialog.close();
    render();
  });

  $("cancelFinish").addEventListener("click", () => el.finishDialog.close());
  el.timeDeltaGauge.addEventListener("input", () => {
    const b = state.blocks.find(x => x.id === el.finishBlockId.value);
    if (!b) return;
    const delta = Number(el.timeDeltaGauge.value) || 0;
    const actual = Math.max(1, Math.min(1440, b.minutes + delta));
    setActualDurationInputs(actual);
    updateFinishReadout(b, actual);
  });
  el.actualHours.addEventListener("input", updateFinishGaugeFromActual);
  el.actualMinutes.addEventListener("input", updateFinishGaugeFromActual);
  el.finishForm.addEventListener("submit", event => {
    event.preventDefault();
    const b = state.blocks.find(x => x.id === el.finishBlockId.value);
    if (!b) return;
    const actual = actualDurationFromInputs();
    const delta = b.minutes - actual;
    b.completed = true;
    b.actualMinutes = actual;
    b.bankDelta = delta;
    b.reclaimed = Math.max(0, delta);
    state.bankLedger = Array.isArray(state.bankLedger) ? state.bankLedger : [];
    if (delta !== 0) {
      state.bankLedger.push({
        id: uid("bank"),
        blockId: b.id,
        delta,
        createdAt: Date.now(),
        note: blockTitle(b)
      });
    }
    saveState();
    el.finishDialog.close();
    render();
  });

  el.selectedBlockClose.addEventListener("click", () => clearSelectedBlock());
  el.selectedBlockEdit.addEventListener("click", () => {
    if (selectedBlockId) openEditBlockDialog(selectedBlockId);
  });
  el.selectedBlockFinish.addEventListener("click", () => {
    if (selectedBlockId) openFinishDialog(selectedBlockId);
  });
  el.selectedBlockDelete.addEventListener("click", () => {
    const block = state.blocks.find(item => item.id === selectedBlockId);
    if (block) deleteSelectedBlock(block);
  });

  if ("serviceWorker" in navigator) {
    window.addEventListener("load", async () => {
      try {
        const reg = await navigator.serviceWorker.register("./sw-v5.js", { updateViaCache: "none" });
        if (reg.update) reg.update().catch(() => {});
      } catch {}
    });
  }

  setQuestColorPicker(categoryColor("business"));
  setBlockColorPicker(categoryColor("personal"));
  setEditBlockColorPicker(categoryColor("personal"));
  render();
})();
