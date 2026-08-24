(() => {
  const STORE = "questwheel-v1";
  const categories = {
    business: { label: "Business", color: "#c9a84f" },
    training: { label: "Training", color: "#8aa8cf" },
    personal: { label: "Personal", color: "#9d8bc0" },
    admin: { label: "Admin", color: "#8eaa91" },
    rest: { label: "Rest", color: "#6f7682" }
  };

  const questPalette = [
    "#c9a84f", "#8aa8cf", "#9d8bc0", "#8eaa91",
    "#c47c67", "#72aaa5", "#b88aa3", "#a5a66f",
    "#d09055", "#6f8fb8", "#9a7ec7", "#73a77d"
  ];
  let selectedQuestColor = questPalette[0];

  const defaultState = {
    quests: [],
    blocks: [],
    selectedDate: isoDate(new Date())
  };

  let state = loadState();

  const $ = (id) => document.getElementById(id);
  const el = {
    dayLabel: $("dayLabel"),
    datePicker: $("datePicker"),
    selectedDateHeading: $("selectedDateHeading"),
    reclaimedTotal: $("reclaimedTotal"),
    wheelScheduled: $("wheelScheduled"),
    dayWheel: $("dayWheel"),
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
    questName: $("questName"),
    questCategory: $("questCategory"),
    questDuration: $("questDuration"),
    questColorPicker: $("questColorPicker"),
    blockQuest: $("blockQuest"),
    blockStart: $("blockStart"),
    blockMinutes: $("blockMinutes"),
    finishBlockId: $("finishBlockId"),
    finishTitle: $("finishTitle"),
    actualMinutes: $("actualMinutes")
  };

  function isoDate(d) {
    const y = d.getFullYear();
    const m = String(d.getMonth()+1).padStart(2,"0");
    const day = String(d.getDate()).padStart(2,"0");
    return `${y}-${m}-${day}`;
  }

  function dateFromISO(s) {
    const [y,m,d] = s.split("-").map(Number);
    return new Date(y, m-1, d);
  }

  function uid(prefix) {
    return prefix + "-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2,7);
  }

  function loadState() {
    try {
      const raw = localStorage.getItem(STORE);
      if (!raw) return structuredClone(defaultState);
      const parsed = JSON.parse(raw);
      return {
        quests: Array.isArray(parsed.quests) ? parsed.quests : [],
        blocks: Array.isArray(parsed.blocks) ? parsed.blocks : [],
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
    const [h,m] = t.split(":").map(Number);
    return h*60 + m;
  }

  function timeFromMinutes(n) {
    n = ((n % 1440) + 1440) % 1440;
    return `${String(Math.floor(n/60)).padStart(2,"0")}:${String(n%60).padStart(2,"0")}`;
  }

  function questById(id) {
    return state.quests.find(q => q.id === id);
  }

  function blocksFor(date) {
    return state.blocks.filter(b => b.date === date).sort((a,b) => a.start - b.start);
  }

  function selectedBlocks() { return blocksFor(state.selectedDate); }

  function categoryColor(category) {
    return categories[category]?.color || categories.personal.color;
  }

  function questColor(q) {
    return q?.color || categoryColor(q?.category);
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
      btn.addEventListener("click", () => {
        selectedQuestColor = color;
        renderColorPicker(color);
      });
      el.questColorPicker.appendChild(btn);
    });
  }

  function render() {
    el.datePicker.value = state.selectedDate;
    const date = dateFromISO(state.selectedDate);
    const today = isoDate(new Date());
    el.dayLabel.textContent = state.selectedDate === today ? "TODAY" : date.toLocaleDateString(undefined, { weekday:"long" }).toUpperCase();
    el.selectedDateHeading.textContent = date.toLocaleDateString(undefined, { weekday:"long", month:"long", day:"numeric" });

    renderQuestOptions();
    if (!el.questColorPicker.children.length) renderColorPicker(categoryColor(el.questCategory.value));
    renderQuests();
    renderTimeline();
    renderWheel();
    renderWeek();
  }

  function renderQuestOptions() {
    const active = state.quests.filter(q => !q.archived);
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
    active.forEach(q => {
      const opt = document.createElement("option");
      opt.value = q.id;
      opt.textContent = q.name;
      el.blockQuest.appendChild(opt);
    });
  }

  function renderQuests() {
    const quests = state.quests.filter(q => !q.archived);
    if (!quests.length) {
      el.questList.className = "quest-list empty-state";
      el.questList.textContent = "No quests yet.";
      return;
    }
    el.questList.className = "quest-list";
    el.questList.innerHTML = "";
    quests.forEach(q => {
      const card = document.createElement("article");
      card.className = "quest-card";
      const scheduled = state.blocks.filter(b => b.questId === q.id && !b.completed).length;
      card.innerHTML = `
        <div class="card-main">
          <span class="category-mark" style="background:${questColor(q)}"></span>
          <div class="card-text">
            <div class="card-title"></div>
            <div class="card-meta">${categories[q.category]?.label || "Quest"} · default ${fmtMinutes(q.defaultMinutes)}${scheduled ? ` · ${scheduled} scheduled` : ""}</div>
          </div>
        </div>
        <div class="card-actions">
          <button class="small-btn accent schedule-quest" type="button">Schedule</button>
          <button class="small-btn danger archive-quest" type="button">Archive</button>
        </div>`;
      card.querySelector(".card-title").textContent = q.name;
      card.querySelector(".schedule-quest").addEventListener("click", () => openBlockDialog(q.id));
      card.querySelector(".archive-quest").addEventListener("click", () => {
        q.archived = true;
        saveState();
        render();
      });
      el.questList.appendChild(card);
    });
  }

  function renderTimeline() {
    const blocks = selectedBlocks();
    const reclaimed = blocks.reduce((sum,b) => sum + (b.reclaimed || 0), 0);
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
      card.innerHTML = `
        <div class="card-main">
          <span class="category-mark" style="background:${questColor(q)}"></span>
          <div class="card-text">
            <div class="card-title"></div>
            <div class="card-meta">${timeFromMinutes(b.start)}–${timeFromMinutes(end)} · ${fmtMinutes(b.minutes)}</div>
            ${b.completed ? `<div class="reclaimed-note">${b.reclaimed > 0 ? `+${fmtMinutes(b.reclaimed)} reclaimed` : `Completed in ${fmtMinutes(b.actualMinutes)}`}</div>` : ""}
          </div>
        </div>
        <div class="card-actions"></div>`;
      card.querySelector(".card-title").textContent = q.name;
      const actions = card.querySelector(".card-actions");
      if (!b.completed) {
        const finish = document.createElement("button");
        finish.type = "button";
        finish.className = "small-btn accent";
        finish.textContent = "Finish";
        finish.addEventListener("click", () => openFinishDialog(b.id));
        actions.appendChild(finish);
      }
      const del = document.createElement("button");
      del.type = "button";
      del.className = "small-btn danger";
      del.textContent = "Delete";
      del.addEventListener("click", () => {
        state.blocks = state.blocks.filter(x => x.id !== b.id);
        saveState(); render();
      });
      actions.appendChild(del);
      el.timeline.appendChild(card);
    });
  }

  function polar(cx, cy, r, angle) {
    const rad = (angle - 90) * Math.PI / 180;
    return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
  }

  function arcPath(cx, cy, rOuter, rInner, startAngle, endAngle) {
    const p1 = polar(cx,cy,rOuter,startAngle);
    const p2 = polar(cx,cy,rOuter,endAngle);
    const p3 = polar(cx,cy,rInner,endAngle);
    const p4 = polar(cx,cy,rInner,startAngle);
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

    const base = document.createElementNS(NS,"circle");
    base.setAttribute("cx",cx); base.setAttribute("cy",cy); base.setAttribute("r",(ro+ri)/2);
    base.setAttribute("fill","none"); base.setAttribute("stroke","#252a33"); base.setAttribute("stroke-width",ro-ri);
    svg.appendChild(base);

    for (let h=0; h<24; h++) {
      const a = h/24*360;
      const p1 = polar(cx,cy,ro+3,a);
      const p2 = polar(cx,cy,ro+(h%6===0?12:7),a);
      const line = document.createElementNS(NS,"line");
      line.setAttribute("x1",p1.x); line.setAttribute("y1",p1.y); line.setAttribute("x2",p2.x); line.setAttribute("y2",p2.y);
      line.setAttribute("stroke", h%6===0 ? "#8b929f" : "#4b515d");
      line.setAttribute("stroke-width", h%6===0 ? "2" : "1");
      svg.appendChild(line);
      if (h % 3 === 0) {
        const tp = polar(cx,cy,ro+24,a);
        const text = document.createElementNS(NS,"text");
        text.setAttribute("x",tp.x); text.setAttribute("y",tp.y+4);
        text.setAttribute("fill","#969daa"); text.setAttribute("font-size","10"); text.setAttribute("text-anchor","middle");
        text.textContent = String(h).padStart(2,"0");
        svg.appendChild(text);
      }
    }

    const blocks = selectedBlocks();
    blocks.forEach(b => {
      const q = questById(b.questId);
      if (!q) return;
      const startA = b.start/1440*360;
      const endA = (b.start+b.minutes)/1440*360;
      const path = document.createElementNS(NS,"path");
      path.setAttribute("d", arcPath(cx,cy,ro,ri,startA,endA));
      path.setAttribute("fill", questColor(q));
      path.setAttribute("opacity", b.completed ? ".48" : ".9");
      path.setAttribute("stroke","#0e1014");
      path.setAttribute("stroke-width","1.5");
      svg.appendChild(path);

      if (b.completed && b.reclaimed > 0) {
        const actualEndA = (b.start + b.actualMinutes)/1440*360;
        const plannedEndA = (b.start + b.minutes)/1440*360;
        const free = document.createElementNS(NS,"path");
        free.setAttribute("d", arcPath(cx,cy,ro,ri,actualEndA,plannedEndA));
        free.setAttribute("fill","#3d424d");
        free.setAttribute("opacity","1");
        free.setAttribute("stroke","#d9b55b");
        free.setAttribute("stroke-width","1.5");
        svg.appendChild(free);
      }
    });

    const scheduled = blocks.reduce((s,b) => s+b.minutes,0);
    el.wheelScheduled.textContent = fmtMinutes(scheduled);

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
    const day = (d.getDay()+6)%7;
    d.setDate(d.getDate()-day);
    d.setHours(0,0,0,0);
    return d;
  }

  function renderMiniWheel(svg, blocks) {
    svg.innerHTML = "";
    const NS = "http://www.w3.org/2000/svg";
    const cx = 50, cy = 50, ro = 44, ri = 28;

    const base = document.createElementNS(NS, "circle");
    base.setAttribute("cx", cx); base.setAttribute("cy", cy); base.setAttribute("r", (ro+ri)/2);
    base.setAttribute("fill", "none"); base.setAttribute("stroke", "#252a33"); base.setAttribute("stroke-width", ro-ri);
    svg.appendChild(base);

    [0,6,12,18].forEach(h => {
      const a = h/24*360;
      const p1 = polar(cx,cy,ro+1,a);
      const p2 = polar(cx,cy,ro+5,a);
      const line = document.createElementNS(NS,"line");
      line.setAttribute("x1",p1.x); line.setAttribute("y1",p1.y); line.setAttribute("x2",p2.x); line.setAttribute("y2",p2.y);
      line.setAttribute("stroke","#818896"); line.setAttribute("stroke-width","1");
      svg.appendChild(line);
    });

    blocks.forEach(b => {
      const q = questById(b.questId);
      if (!q) return;
      const startA = b.start/1440*360;
      const endA = (b.start+b.minutes)/1440*360;
      const path = document.createElementNS(NS,"path");
      path.setAttribute("d", arcPath(cx,cy,ro,ri,startA,endA));
      path.setAttribute("fill", questColor(q));
      path.setAttribute("opacity", b.completed ? ".5" : ".95");
      svg.appendChild(path);

      if (b.completed && b.reclaimed > 0) {
        const actualEndA = (b.start + b.actualMinutes)/1440*360;
        const plannedEndA = (b.start + b.minutes)/1440*360;
        const free = document.createElementNS(NS,"path");
        free.setAttribute("d", arcPath(cx,cy,ro,ri,actualEndA,plannedEndA));
        free.setAttribute("fill","#3d424d");
        free.setAttribute("stroke","#d9b55b");
        free.setAttribute("stroke-width","1");
        svg.appendChild(free);
      }
    });
  }

  function renderWeek() {
    const base = dateFromISO(state.selectedDate);
    const start = startOfWeek(base);
    const end = new Date(start); end.setDate(start.getDate()+6);
    el.weekHeading.textContent = `${start.toLocaleDateString(undefined,{month:"short",day:"numeric"})} – ${end.toLocaleDateString(undefined,{month:"short",day:"numeric"})}`;
    el.weekGrid.innerHTML = "";
    const today = isoDate(new Date());

    for (let i=0;i<7;i++) {
      const d = new Date(start); d.setDate(start.getDate()+i);
      const iso = isoDate(d);
      const blocks = blocksFor(iso);
      const total = blocks.reduce((s,b)=>s+b.minutes,0);
      const reclaimed = blocks.reduce((s,b)=>s+(b.reclaimed||0),0);
      const box = document.createElement("div");
      box.className = "week-day" + (iso===today ? " today" : "");

      const btn = document.createElement("button");
      btn.type = "button";

      const dateStack = document.createElement("div");
      dateStack.className = "week-date-stack";
      dateStack.innerHTML = `<div class="week-name">${d.toLocaleDateString(undefined,{weekday:"short"})}</div>
        <div class="week-num">${d.getDate()}</div>
        <div class="week-hours">${fmtMinutes(total)}</div>
        ${reclaimed ? `<div class="week-free">+${fmtMinutes(reclaimed)}</div>` : ""}`;

      const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
      svg.setAttribute("class", "mini-wheel");
      svg.setAttribute("viewBox", "0 0 100 100");
      svg.setAttribute("aria-label", `${d.toLocaleDateString(undefined,{weekday:"long"})} 24 hour schedule`);
      renderMiniWheel(svg, blocks);

      const questSummary = document.createElement("div");
      questSummary.className = "week-quests";
      const allIds = [...new Set(blocks.map(b => b.questId))];
      const ids = allIds.slice(0,4);
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
        const extra = allIds.length - ids.length;
        if (extra > 0) {
          const more = document.createElement("div");
          more.className = "week-quest-line";
          more.textContent = `+${extra} more`;
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

  function openBlockDialog(questId) {
    renderQuestOptions();
    if (el.blockQuest.disabled) {
      el.questDialog.showModal();
      return;
    }
    if (questId) el.blockQuest.value = questId;
    const q = questById(el.blockQuest.value);
    el.blockMinutes.value = q?.defaultMinutes || 30;
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

  document.querySelectorAll(".tab").forEach(btn => {
    btn.addEventListener("click", () => switchView(btn.dataset.view));
  });

  $("todayBtn").addEventListener("click", () => {
    state.selectedDate = isoDate(new Date()); saveState(); render();
  });
  $("prevDay").addEventListener("click", () => {
    const d = dateFromISO(state.selectedDate); d.setDate(d.getDate()-1);
    state.selectedDate = isoDate(d); saveState(); render();
  });
  $("nextDay").addEventListener("click", () => {
    const d = dateFromISO(state.selectedDate); d.setDate(d.getDate()+1);
    state.selectedDate = isoDate(d); saveState(); render();
  });
  el.datePicker.addEventListener("change", () => {
    if (/^\d{4}-\d{2}-\d{2}$/.test(el.datePicker.value)) {
      state.selectedDate = el.datePicker.value; saveState(); render();
    }
  });

  $("addQuestBtn").addEventListener("click", () => {
    renderColorPicker(categoryColor(el.questCategory.value));
    el.questDialog.showModal();
  });
  el.questCategory.addEventListener("change", () => renderColorPicker(categoryColor(el.questCategory.value)));
  $("cancelQuest").addEventListener("click", () => el.questDialog.close());
  el.questForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const name = el.questName.value.trim();
    if (!name) return;
    state.quests.push({
      id: uid("q"),
      name,
      category: el.questCategory.value,
      defaultMinutes: Math.max(2, Math.min(600, Number(el.questDuration.value)||30)),
      color: selectedQuestColor,
      archived: false,
      createdAt: Date.now()
    });
    el.questName.value = "";
    saveState(); el.questDialog.close();
    renderColorPicker(categoryColor(el.questCategory.value));
    render();
  });

  $("addBlockBtn").addEventListener("click", () => openBlockDialog());
  $("cancelBlock").addEventListener("click", () => el.blockDialog.close());
  el.blockQuest.addEventListener("change", () => {
    const q = questById(el.blockQuest.value);
    if (q) el.blockMinutes.value = q.defaultMinutes;
  });
  el.blockForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const questId = el.blockQuest.value;
    const start = minutesFromTime(el.blockStart.value);
    const minutes = Math.max(2, Math.min(600, Number(el.blockMinutes.value)||30));
    if (!questById(questId)) return;
    state.blocks.push({
      id: uid("b"),
      questId,
      date: state.selectedDate,
      start,
      minutes,
      completed: false,
      actualMinutes: null,
      reclaimed: 0
    });
    saveState(); el.blockDialog.close(); render();
  });

  $("cancelFinish").addEventListener("click", () => el.finishDialog.close());
  el.finishForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const b = state.blocks.find(x => x.id === el.finishBlockId.value);
    if (!b) return;
    const actual = Math.max(1, Math.min(600, Number(el.actualMinutes.value)||b.minutes));
    b.completed = true;
    b.actualMinutes = actual;
    b.reclaimed = Math.max(0, b.minutes - actual);
    saveState(); el.finishDialog.close(); render();
  });

  if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
      navigator.serviceWorker.register("./sw.js").catch(() => {});
    });
  }

  render();
})();
