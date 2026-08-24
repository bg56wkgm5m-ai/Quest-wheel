(() => {
  const STORE = "questwheel-v1"; // Keep the same key so v1/v2 data survives upgrades.

  const categories = {
    business: { label: "Business", color: "#F2C14E" },
    training: { label: "Training", color: "#4EA8DE" },
    personal: { label: "Personal", color: "#9B5DE5" },
    admin: { label: "Admin", color: "#2FA36B" },
    rest: { label: "Rest", color: "#7D8597" }
  };

  // Deliberately separated hues, with several distinct reds.
  const questPalette = [
    "#F2C14E", // gold
    "#F28E2B", // orange
    "#E63946", // scarlet
    "#B55239", // brick red
    "#C0365C", // crimson
    "#2FA36B", // green
    "#2A9D8F", // teal
    "#4EA8DE", // cyan-blue
    "#4361EE", // blue
    "#6C63D9", // indigo
    "#9B5DE5", // purple
    "#D65DB1", // magenta
    "#A06B45", // brown
    "#7D8597"  // slate
  ];

  let selectedQuestColor = questPalette[0];
  let swipeStart = null;

  const defaultState = {
    quests: [],
    blocks: [],
    selectedDate: isoDate(new Date())
  };

  let state = loadState();

  const $ = (id) => document.getElementById(id);
  const el = {
    dayLabel: $("dayLabel"),
    selectedDateHeading: $("selectedDateHeading"),
    reclaimedTotal: $("reclaimedTotal"),
    wheelScheduled: $("wheelScheduled"),
    dayWheel: $("dayWheel"),
    wheelWrap: $("wheelWrap"),
    wheelLegend: $("wheelLegend"),
    timeline: $("timeline"),
    questList: $("questList"),
    weekGrid: $("weekGrid"),
    weekHeading: $("weekHeading"),
    questDialog: $("questDialog"),
    blockDialog: $("blockDialog"),
    finishDialog: $("finishDialog"),
    questForm: $("questForm"),
    blockForm: $("blockForm"),
    finishForm: $("finishForm"),
    questDialogEyebrow: $("questDialogEyebrow"),
    questDialogTitle: $("questDialogTitle"),
    questParentId: $("questParentId"),
    questName: $("questName"),
    questCategory: $("questCategory"),
    questDuration: $("questDuration"),
    questColorPicker: $("questColorPicker"),
    blockQuest: $("blockQuest"),
    blockStart: $("blockStart"),
    blockMinutes: $("blockMinutes"),
    repeatEnabled: $("repeatEnabled"),
    repeatFields: $("repeatFields"),
    repeatEvery: $("repeatEvery"),
    repeatFor: $("repeatFor"),
    repeatUnit: $("repeatUnit"),
    finishBlockId: $("finishBlockId"),
    finishTitle: $("finishTitle"),
    actualMinutes: $("actualMinutes")
  };

  function isoDate(d) {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  }

  function dateFromISO(s) {
    const [y, m, d] = s.split("-").map(Number);
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
      archived: Boolean(q.archived),
      defaultMinutes: Math.max(2, Math.min(600, Number(q.defaultMinutes) || 30))
    };
  }

  function normalizeBlock(b) {
    return {
      ...b,
      completed: Boolean(b.completed),
      reclaimed: Math.max(0, Number(b.reclaimed) || 0),
      actualMinutes: b.actualMinutes == null ? null : Math.max(1, Number(b.actualMinutes) || 1),
      minutes: Math.max(2, Math.min(600, Number(b.minutes) || 30)),
      start: Math.max(0, Math.min(1439, Number(b.start) || 0))
    };
  }

  function loadState() {
    try {
      const raw = localStorage.getItem(STORE);
      if (!raw) return structuredClone(defaultState);
      const parsed = JSON.parse(raw);
      return {
        quests: Array.isArray(parsed.quests) ? parsed.quests.map(normalizeQuest) : [],
        blocks: Array.isArray(parsed.blocks) ? parsed.blocks.map(normalizeBlock) : [],
        selectedDate: isoDate(new Date())
      };
    } catch {
      return structuredClone(defaultState);
    }
  }

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

  function minutesFromTime(t) {
    const [h, m] = t.split(":").map(Number);
    return h * 60 + m;
  }

  function timeFromMinutes(n) {
    n = ((n % 1440) + 1440) % 1440;
    return `${String(Math.floor(n / 60)).padStart(2, "0")}:${String(n % 60).padStart(2, "0")}`;
  }

  function questById(id) {
    return state.quests.find(q => q.id === id);
  }

  function childrenOf(parentId) {
    return state.quests.filter(q => (q.parentId || null) === (parentId || null));
  }

  function descendantIds(id) {
    const out = [];
    const visit = (parentId) => {
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
    return q && !q.archived && !ancestorArchived(q);
  }

  function questDepth(q) {
    let depth = 0;
    let current = q;
    const seen = new Set();
    while (current?.parentId && depth < 20) {
      if (seen.has(current.parentId)) break;
      seen.add(current.parentId);
      current = questById(current.parentId);
      depth += 1;
    }
    return depth;
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
    return state.blocks.filter(b => b.date === date).sort((a, b) => a.start - b.start);
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

  function renderColorPicker(preferred) {
    selectedQuestColor = preferred || selectedQuestColor || questPalette[0];
    el.questColorPicker.innerHTML = "";
    questPalette.forEach(color => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "color-swatch";
      btn.style.setProperty("--swatch", color);
      btn.setAttribute("role", "radio");
      btn.setAttribute("aria-label", `Colour ${color}`);
      btn.setAttribute("aria-checked", color === selectedQuestColor ? "true" : "false");
      btn.addEventListener("click", () => renderColorPicker(color));
      el.questColorPicker.appendChild(btn);
    });
  }

  function render() {
    const date = dateFromISO(state.selectedDate);
    const today = isoDate(new Date());
    el.dayLabel.textContent = state.selectedDate === today ? "TODAY" : date.toLocaleDateString(undefined, { weekday: "long" }).toUpperCase();
    el.selectedDateHeading.textContent = date.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" });

    renderQuestOptions();
    renderQuests();
    renderTimeline();
    renderWheel();
    renderWeek();
  }

  function renderQuestOptions() {
    const active = orderedActiveQuests();
    el.blockQuest.innerHTML = "";
    if (!active.length) {
      const opt = document.createElement("option");
      opt.value = "";
      opt.textContent = "Create a quest first";
      el.blockQuest.appendChild(opt);
      el.blockQuest.disabled = true;
      return;
    }
    el.blockQuest.disabled = false;
    active.forEach(({ q, depth }) => {
      const opt = document.createElement("option");
      opt.value = q.id;
      opt.textContent = `${depth ? "↳ ".repeat(Math.min(depth, 3)) : ""}${q.name}${q.completed ? " ✓" : ""}`;
      el.blockQuest.appendChild(opt);
    });
  }

  function createQuestNode(q, depth) {
    const node = document.createElement("div");
    node.className = "quest-node";
    node.dataset.depth = String(depth);
    node.style.setProperty("--depth", String(depth));

    const card = document.createElement("article");
    card.className = "quest-card" + (q.completed ? " completed" : "");
    const scheduled = state.blocks.filter(b => b.questId === q.id && !b.completed).length;
    const childCount = childrenOf(q.id).filter(c => !c.archived).length;

    const main = document.createElement("div");
    main.className = "card-main";
    main.innerHTML = `<span class="category-mark" style="background:${questColor(q)}"></span>`;

    const titleWrap = document.createElement("div");
    titleWrap.className = "card-text";
    const titleRow = document.createElement("div");
    titleRow.className = "quest-title-row";

    const complete = document.createElement("button");
    complete.type = "button";
    complete.className = "complete-toggle";
    complete.setAttribute("aria-label", q.completed ? `Mark ${q.name} incomplete` : `Mark ${q.name} complete`);
    complete.textContent = q.completed ? "✓" : "";
    complete.addEventListener("click", () => {
      q.completed = !q.completed;
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
    if (childCount) parts.push(`${childCount} subtask${childCount === 1 ? "" : "s"}`);
    meta.textContent = parts.join(" · ");
    titleWrap.append(titleRow, meta);
    main.appendChild(titleWrap);

    const actions = document.createElement("div");
    actions.className = "card-actions";

    const schedule = makeSmallButton("Schedule", "accent", () => openBlockDialog(q.id));
    const subtask = makeSmallButton("+ Subtask", "", () => openQuestDialog(q.id));
    const archive = makeSmallButton("Archive", "danger", () => archiveQuest(q));
    const del = makeSmallButton("Delete", "danger", () => deleteQuest(q));
    actions.append(schedule, subtask, archive, del);

    card.append(main, actions);
    node.appendChild(card);

    const visibleChildren = childrenOf(q.id)
      .filter(child => !child.archived)
      .sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0));
    if (visibleChildren.length) {
      const group = document.createElement("div");
      group.className = "quest-children";
      visibleChildren.forEach(child => group.appendChild(createQuestNode(child, depth + 1)));
      node.appendChild(group);
    }
    return node;
  }

  function makeSmallButton(text, extraClass, handler) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = `small-btn ${extraClass}`.trim();
    btn.textContent = text;
    btn.addEventListener("click", handler);
    return btn;
  }

  function renderQuests() {
    const roots = childrenOf(null).filter(q => !q.archived).sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0));
    if (!roots.length) {
      el.questList.className = "quest-list empty-state";
      el.questList.textContent = "No active quests yet.";
      return;
    }
    el.questList.className = "quest-list";
    el.questList.innerHTML = "";
    roots.forEach(q => el.questList.appendChild(createQuestNode(q, 0)));
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

  function renderTimeline() {
    const blocks = selectedBlocks();
    const reclaimed = blocks.reduce((sum, b) => sum + (b.reclaimed || 0), 0);
    el.reclaimedTotal.textContent = fmtMinutes(reclaimed);

    if (!blocks.length) {
      el.timeline.className = "timeline empty-state";
      el.timeline.textContent = "No time blocks yet.";
      return;
    }

    el.timeline.className = "timeline";
    el.timeline.innerHTML = "";
    blocks.forEach(b => {
      const q = questById(b.questId);
      if (!q) return;
      const card = document.createElement("article");
      card.className = "block-card" + (b.completed ? " done" : "");
      const end = b.start + b.minutes;

      const main = document.createElement("div");
      main.className = "card-main";
      main.innerHTML = `<span class="category-mark" style="background:${questColor(q)}"></span>`;
      const text = document.createElement("div");
      text.className = "card-text";
      const title = document.createElement("div");
      title.className = "card-title";
      title.textContent = q.name;
      const meta = document.createElement("div");
      meta.className = "card-meta";
      meta.textContent = `${timeFromMinutes(b.start)}–${timeFromMinutes(end)} · ${fmtMinutes(b.minutes)}`;
      text.append(title, meta);
      if (b.recurrenceLabel) {
        const rep = document.createElement("div");
        rep.className = "repeat-note";
        rep.textContent = `↻ ${b.recurrenceLabel}`;
        text.appendChild(rep);
      }
      if (b.completed) {
        const note = document.createElement("div");
        note.className = "reclaimed-note";
        note.textContent = b.reclaimed > 0 ? `+${fmtMinutes(b.reclaimed)} reclaimed` : `Completed in ${fmtMinutes(b.actualMinutes)}`;
        text.appendChild(note);
      }
      main.appendChild(text);

      const actions = document.createElement("div");
      actions.className = "card-actions";
      if (!b.completed) actions.appendChild(makeSmallButton("Finish", "accent", () => openFinishDialog(b.id)));
      actions.appendChild(makeSmallButton("Delete", "danger", () => {
        state.blocks = state.blocks.filter(x => x.id !== b.id);
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
    const p1 = polar(cx, cy, rOuter, startAngle);
    const p2 = polar(cx, cy, rOuter, endAngle);
    const p3 = polar(cx, cy, rInner, endAngle);
    const p4 = polar(cx, cy, rInner, startAngle);
    const large = endAngle - startAngle > 180 ? 1 : 0;
    return [
      `M ${p1.x} ${p1.y}`,
      `A ${rOuter} ${rOuter} 0 ${large} 1 ${p2.x} ${p2.y}`,
      `L ${p3.x} ${p3.y}`,
      `A ${rInner} ${rInner} 0 ${large} 0 ${p4.x} ${p4.y}`,
      "Z"
    ].join(" ");
  }

  function renderWheel() {
    const svg = el.dayWheel;
    svg.innerHTML = "";
    const NS = "http://www.w3.org/2000/svg";
    const cx = 180, cy = 180, ro = 155, ri = 98;

    const base = document.createElementNS(NS, "circle");
    base.setAttribute("cx", cx); base.setAttribute("cy", cy); base.setAttribute("r", (ro + ri) / 2);
    base.setAttribute("fill", "none"); base.setAttribute("stroke", "#252a33"); base.setAttribute("stroke-width", ro - ri);
    svg.appendChild(base);

    for (let h = 0; h < 24; h += 1) {
      const a = h / 24 * 360;
      const p1 = polar(cx, cy, ro + 3, a);
      const p2 = polar(cx, cy, ro + (h % 6 === 0 ? 12 : 7), a);
      const line = document.createElementNS(NS, "line");
      line.setAttribute("x1", p1.x); line.setAttribute("y1", p1.y); line.setAttribute("x2", p2.x); line.setAttribute("y2", p2.y);
      line.setAttribute("stroke", h % 6 === 0 ? "#8b929f" : "#4b515d");
      line.setAttribute("stroke-width", h % 6 === 0 ? "2" : "1");
      svg.appendChild(line);
      if (h % 3 === 0) {
        const tp = polar(cx, cy, ro + 24, a);
        const text = document.createElementNS(NS, "text");
        text.setAttribute("x", tp.x); text.setAttribute("y", tp.y + 4);
        text.setAttribute("fill", "#969daa"); text.setAttribute("font-size", "10"); text.setAttribute("text-anchor", "middle");
        text.textContent = String(h).padStart(2, "0");
        svg.appendChild(text);
      }
    }

    const blocks = selectedBlocks();
    blocks.forEach(b => {
      const q = questById(b.questId);
      if (!q) return;
      const startA = b.start / 1440 * 360;
      const endA = (b.start + b.minutes) / 1440 * 360;
      const path = document.createElementNS(NS, "path");
      path.setAttribute("d", arcPath(cx, cy, ro, ri, startA, endA));
      path.setAttribute("fill", questColor(q));
      path.setAttribute("opacity", b.completed ? ".48" : ".92");
      path.setAttribute("stroke", "#0e1014");
      path.setAttribute("stroke-width", "1.5");
      svg.appendChild(path);

      if (b.completed && b.reclaimed > 0) {
        const actualEndA = (b.start + b.actualMinutes) / 1440 * 360;
        const plannedEndA = (b.start + b.minutes) / 1440 * 360;
        const free = document.createElementNS(NS, "path");
        free.setAttribute("d", arcPath(cx, cy, ro, ri, actualEndA, plannedEndA));
        free.setAttribute("fill", "#3d424d");
        free.setAttribute("stroke", "#d9b55b");
        free.setAttribute("stroke-width", "1.5");
        svg.appendChild(free);
      }
    });

    el.wheelScheduled.textContent = fmtMinutes(blocks.reduce((s, b) => s + b.minutes, 0));
    el.wheelLegend.innerHTML = "";
    const usedQuestIds = [...new Set(blocks.map(b => b.questId))];
    usedQuestIds.forEach(id => {
      const q = questById(id);
      if (!q) return;
      const item = document.createElement("span");
      item.className = "legend-item";
      item.innerHTML = `<span class="legend-dot" style="background:${questColor(q)}"></span>`;
      item.appendChild(document.createTextNode(q.name));
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
    const cx = 50, cy = 50, ro = 44, ri = 28;
    const base = document.createElementNS(NS, "circle");
    base.setAttribute("cx", cx); base.setAttribute("cy", cy); base.setAttribute("r", (ro + ri) / 2);
    base.setAttribute("fill", "none"); base.setAttribute("stroke", "#252a33"); base.setAttribute("stroke-width", ro - ri);
    svg.appendChild(base);

    [0, 6, 12, 18].forEach(h => {
      const a = h / 24 * 360;
      const p1 = polar(cx, cy, ro + 1, a);
      const p2 = polar(cx, cy, ro + 5, a);
      const line = document.createElementNS(NS, "line");
      line.setAttribute("x1", p1.x); line.setAttribute("y1", p1.y); line.setAttribute("x2", p2.x); line.setAttribute("y2", p2.y);
      line.setAttribute("stroke", "#818896"); line.setAttribute("stroke-width", "1");
      svg.appendChild(line);
    });

    blocks.forEach(b => {
      const q = questById(b.questId);
      if (!q) return;
      const path = document.createElementNS(NS, "path");
      path.setAttribute("d", arcPath(cx, cy, ro, ri, b.start / 1440 * 360, (b.start + b.minutes) / 1440 * 360));
      path.setAttribute("fill", questColor(q));
      path.setAttribute("opacity", b.completed ? ".5" : ".95");
      svg.appendChild(path);
      if (b.completed && b.reclaimed > 0) {
        const free = document.createElementNS(NS, "path");
        free.setAttribute("d", arcPath(cx, cy, ro, ri, (b.start + b.actualMinutes) / 1440 * 360, (b.start + b.minutes) / 1440 * 360));
        free.setAttribute("fill", "#3d424d");
        free.setAttribute("stroke", "#d9b55b");
        free.setAttribute("stroke-width", "1");
        svg.appendChild(free);
      }
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
      const reclaimed = blocks.reduce((s, b) => s + (b.reclaimed || 0), 0);
      const box = document.createElement("div");
      box.className = "week-day" + (iso === today ? " today" : "");

      const btn = document.createElement("button");
      btn.type = "button";
      const dateStack = document.createElement("div");
      dateStack.className = "week-date-stack";
      dateStack.innerHTML = `<div class="week-name">${d.toLocaleDateString(undefined, { weekday: "short" })}</div><div class="week-num">${d.getDate()}</div><div class="week-hours">${fmtMinutes(total)}</div>${reclaimed ? `<div class="week-free">+${fmtMinutes(reclaimed)}</div>` : ""}`;

      const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
      svg.setAttribute("class", "mini-wheel");
      svg.setAttribute("viewBox", "0 0 100 100");
      svg.setAttribute("aria-label", `${d.toLocaleDateString(undefined, { weekday: "long" })} 24 hour schedule`);
      renderMiniWheel(svg, blocks);

      const questSummary = document.createElement("div");
      questSummary.className = "week-quests";
      const allIds = [...new Set(blocks.map(b => b.questId))];
      const ids = allIds.slice(0, 4);
      if (!ids.length) {
        questSummary.innerHTML = `<div class="week-quest-line">No quests scheduled</div>`;
      } else {
        ids.forEach(id => {
          const q = questById(id);
          if (!q) return;
          const line = document.createElement("div");
          line.className = "week-quest-line";
          line.innerHTML = `<span class="week-quest-dot" style="background:${questColor(q)}"></span>`;
          const name = document.createElement("span");
          name.textContent = q.name;
          line.appendChild(name);
          questSummary.appendChild(line);
        });
        if (allIds.length > ids.length) {
          const more = document.createElement("div");
          more.className = "week-quest-line";
          more.textContent = `+${allIds.length - ids.length} more`;
          questSummary.appendChild(more);
        }
      }

      btn.append(dateStack, svg, questSummary);
      btn.addEventListener("click", () => {
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
    el.questDialogTitle.textContent = parent ? `Add under ${parent.name}` : "Create objective";
    el.questName.value = "";
    if (parent) {
      el.questCategory.value = parent.category || "personal";
      el.questDuration.value = String(parent.defaultMinutes || 30);
      renderColorPicker(questColor(parent));
    } else {
      el.questCategory.value = "business";
      el.questDuration.value = "30";
      renderColorPicker(categoryColor(el.questCategory.value));
    }
    el.questDialog.showModal();
  }

  function openBlockDialog(questId) {
    renderQuestOptions();
    if (el.blockQuest.disabled) {
      openQuestDialog();
      return;
    }
    if (questId) el.blockQuest.value = questId;
    const q = questById(el.blockQuest.value);
    el.blockMinutes.value = q?.defaultMinutes || 30;
    el.repeatEnabled.checked = false;
    el.repeatFields.hidden = true;
    el.repeatEvery.value = "1";
    el.repeatFor.value = "7";
    el.repeatUnit.value = "weeks";
    el.blockDialog.showModal();
  }

  function openFinishDialog(blockId) {
    const b = state.blocks.find(x => x.id === blockId);
    const q = b && questById(b.questId);
    if (!b || !q) return;
    el.finishBlockId.value = b.id;
    el.finishTitle.textContent = q.name;
    el.actualMinutes.value = b.minutes;
    el.finishDialog.showModal();
  }

  function switchView(id) {
    document.querySelectorAll(".view").forEach(v => v.classList.toggle("active", v.id === id));
    document.querySelectorAll(".tab").forEach(t => t.classList.toggle("active", t.dataset.view === id));
  }

  function shiftSelectedDay(delta) {
    const d = dateFromISO(state.selectedDate);
    d.setDate(d.getDate() + delta);
    state.selectedDate = isoDate(d);
    saveState();
    render();
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

  $("todayBtn").addEventListener("click", () => {
    state.selectedDate = isoDate(new Date());
    saveState();
    render();
  });

  // Swipe left = next day, swipe right = previous day. Vertical movement remains normal page scrolling.
  el.wheelWrap.addEventListener("pointerdown", event => {
    swipeStart = { id: event.pointerId, x: event.clientX, y: event.clientY };
    el.wheelWrap.classList.add("swiping");
    if (el.wheelWrap.setPointerCapture) el.wheelWrap.setPointerCapture(event.pointerId);
  });
  el.wheelWrap.addEventListener("pointerup", event => {
    if (!swipeStart || swipeStart.id !== event.pointerId) return;
    const dx = event.clientX - swipeStart.x;
    const dy = event.clientY - swipeStart.y;
    el.wheelWrap.classList.remove("swiping");
    swipeStart = null;
    if (Math.abs(dx) >= 45 && Math.abs(dx) > Math.abs(dy) * 1.15) shiftSelectedDay(dx < 0 ? 1 : -1);
  });
  el.wheelWrap.addEventListener("pointercancel", () => {
    swipeStart = null;
    el.wheelWrap.classList.remove("swiping");
  });
  el.wheelWrap.addEventListener("keydown", event => {
    if (event.key === "ArrowLeft") { event.preventDefault(); shiftSelectedDay(-1); }
    if (event.key === "ArrowRight") { event.preventDefault(); shiftSelectedDay(1); }
  });

  $("addQuestBtn").addEventListener("click", () => openQuestDialog());
  el.questCategory.addEventListener("change", () => {
    if (!el.questParentId.value) renderColorPicker(categoryColor(el.questCategory.value));
  });
  $("cancelQuest").addEventListener("click", () => el.questDialog.close());
  el.questForm.addEventListener("submit", event => {
    event.preventDefault();
    const name = el.questName.value.trim();
    if (!name) return;
    const parentId = el.questParentId.value || null;
    state.quests.push({
      id: uid("q"),
      parentId,
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
  el.blockQuest.addEventListener("change", () => {
    const q = questById(el.blockQuest.value);
    if (q) el.blockMinutes.value = q.defaultMinutes;
  });
  el.repeatEnabled.addEventListener("change", () => {
    el.repeatFields.hidden = !el.repeatEnabled.checked;
  });

  el.blockForm.addEventListener("submit", event => {
    event.preventDefault();
    const questId = el.blockQuest.value;
    const start = minutesFromTime(el.blockStart.value);
    const minutes = Math.max(2, Math.min(600, Number(el.blockMinutes.value) || 30));
    if (!questById(questId)) return;

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
        questId,
        date,
        start,
        minutes,
        completed: false,
        actualMinutes: null,
        reclaimed: 0,
        seriesId,
        recurrenceLabel
      });
    });

    saveState();
    el.blockDialog.close();
    render();
  });

  $("cancelFinish").addEventListener("click", () => el.finishDialog.close());
  el.finishForm.addEventListener("submit", event => {
    event.preventDefault();
    const b = state.blocks.find(x => x.id === el.finishBlockId.value);
    if (!b) return;
    const actual = Math.max(1, Math.min(600, Number(el.actualMinutes.value) || b.minutes));
    b.completed = true;
    b.actualMinutes = actual;
    b.reclaimed = Math.max(0, b.minutes - actual);
    saveState();
    el.finishDialog.close();
    render();
  });

  if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => navigator.serviceWorker.register("./sw.js").catch(() => {}));
  }

  renderColorPicker(categoryColor("business"));
  render();
})();
