/* =====================================================================
   STORE — dates, phases, and all saved data (your phone's localStorage).
   Nothing leaves the device. Export/import lets you back it up.
   ===================================================================== */

/* ---------- Date helpers ---------------------------------------------- */
window.DateU = (function () {
  const pad = (n) => String(n).padStart(2, "0");
  function iso(d) { return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate()); }
  function parse(s) { const [y, m, d] = s.split("-").map(Number); return new Date(y, m - 1, d); }
  function today() {
    try {
      const q = new URLSearchParams(location.search).get("date");
      if (q && /^\d{4}-\d{2}-\d{2}$/.test(q)) return q;
      const dev = localStorage.getItem("manny.devDate");
      if (dev) return dev;
    } catch (e) {}
    return iso(new Date());
  }
  function dow(s) { return parse(s).getDay(); }
  function addDays(s, n) { const d = parse(s); d.setDate(d.getDate() + n); return iso(d); }
  function daysBetween(a, b) { return Math.round((parse(b) - parse(a)) / 86400000); }
  function monday(s) { const d = parse(s); const wd = (d.getDay() + 6) % 7; d.setDate(d.getDate() - wd); return iso(d); }
  const MON = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  const DAY = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
  const DAYL = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
  function fmt(s) { const d = parse(s); return DAY[d.getDay()] + " · " + MON[d.getMonth()] + " " + d.getDate(); }
  function fmtLong(s) { const d = parse(s); return DAYL[d.getDay()] + ", " + MON[d.getMonth()] + " " + d.getDate(); }
  function fmtShort(s) { const d = parse(s); return MON[d.getMonth()] + " " + d.getDate(); }
  function time12(hhmm) {
    let [h, m] = hhmm.split(":").map(Number); const ap = h >= 12 ? "PM" : "AM";
    h = h % 12; if (h === 0) h = 12; return h + ":" + pad(m) + " " + ap;
  }
  function time12c(hhmm) {
    let [h, m] = hhmm.split(":").map(Number); const ap = h >= 12 ? "p" : "a";
    h = h % 12; if (h === 0) h = 12; return h + ":" + pad(m) + ap;
  }
  function nowMinutes() { const d = new Date(); return d.getHours() * 60 + d.getMinutes(); }
  function toMin(hhmm) { const [h, m] = hhmm.split(":").map(Number); return h * 60 + m; }
  return { iso, parse, today, dow, addDays, daysBetween, monday, fmt, fmtLong, fmtShort, time12, time12c, nowMinutes, toMin };
})();

/* ---------- Phase logic ----------------------------------------------- */
window.Phases = (function () {
  function current(dateISO) {
    const d = dateISO || DateU.today();
    const P = DATA.phases;
    const ww = P.find((p) => p.slug === "wedding-week");
    if (d >= ww.start && d <= ww.end) return ww;
    for (const p of P) {
      if (p.slug === "wedding-week") continue;
      if (d >= p.start && d <= p.end) return p;
    }
    return null;
  }
  function progress(dateISO) {
    const p = current(dateISO); if (!p) return null;
    const total = DateU.daysBetween(p.start, p.end) + 1;
    const dayN = Math.min(total, DateU.daysBetween(p.start, dateISO) + 1);
    return { phase: p, dayN, total };
  }
  function daysToWedding(dateISO) { return DateU.daysBetween(dateISO || DateU.today(), DATA.profile.weddingDate); }
  return { current, progress, daysToWedding };
})();

/* ---------- Store (localStorage) -------------------------------------- */
window.Store = (function () {
  const KEY = "manny.v1";
  let state = null;

  function defaults() {
    return {
      version: 1,
      profile: Object.assign({}, DATA.profile),
      pinHash: null,
      settings: { bibleEpisode: 1 },
      dayLogs: {},
      weights: [],
      workoutLogs: [],
      workoutDrafts: {},
      mealLogs: {},
      dinnerPlan: seedDinnerPlan(),
      grocery: seedGrocery(),
      fintechSessions: [],
      fintechMilestones: DATA.fintechMilestones.map((m, i) => ({ id: i, module: m.module, title: m.title, desc: m.desc, done: false })),
      weddingTasks: DATA.weddingTasks.map((t, i) => ({ id: i, title: t.t, desc: t.d, month: t.m, who: t.who, priority: t.p, status: "open" })),
      vendors: DATA.vendors.map((v, i) => Object.assign({ id: i }, v)),
      memoriam: DATA.memoriam.map((m, i) => Object.assign({ id: i }, m)),
      mass: [],
      sleep: {},
      dateNights: [],
      reviews: [],
      seenPhase: {}
    };
  }
  function seedDinnerPlan() {
    const plan = {};
    DATA.dinners.forEach((dn, i) => { plan[dn.dow] = i; });
    return plan;
  }
  function seedGrocery() {
    const items = [];
    DATA.grocery.aldi.forEach((g) => items.push({ store: "Aldi", name: g.name, cat: g.cat, checked: false, oos: false }));
    DATA.grocery.publix.forEach((g) => items.push({ store: "Publix", name: g.name, cat: g.cat, checked: false, oos: false }));
    return { items, week: DateU.monday(DateU.today()) };
  }

  function load() {
    try { state = JSON.parse(localStorage.getItem(KEY)); } catch (e) { state = null; }
    if (!state) { state = defaults(); save(); }
    const d = defaults();
    for (const k in d) if (!(k in state)) state[k] = d[k];
    commitStaleDrafts();
    return state;
  }
  function save() { try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) {} }
  function get() { return state || load(); }

  function day(dateISO) {
    const d = dateISO || DateU.today();
    if (!state.dayLogs[d]) state.dayLogs[d] = { completed: {}, skipped: {}, prayerM: false, prayerE: false, hydration: 0, lunchPacked: null, note: "" };
    return state.dayLogs[d];
  }
  function toggleBlock(dateISO, key) {
    const dl = day(dateISO);
    if (dl.completed[key]) delete dl.completed[key]; else { dl.completed[key] = true; delete dl.skipped[key]; }
    save();
  }
  function skipBlock(dateISO, key, reason) {
    const dl = day(dateISO); dl.skipped[key] = reason || ""; delete dl.completed[key]; save();
  }
  function addWater(dateISO, oz) { const dl = day(dateISO); dl.hydration = Math.max(0, (dl.hydration || 0) + oz); save(); }
  function setPrayer(dateISO, which, val) { const dl = day(dateISO); dl[which === "morning" ? "prayerM" : "prayerE"] = val; save(); }

  function addWeight(entry) { state.weights.push(entry); state.weights.sort((a, b) => a.date < b.date ? -1 : 1); save(); }
  function latestWeight() { return state.weights.length ? state.weights[state.weights.length - 1] : null; }

  function uid() { return "w" + state.workoutLogs.length + "_" + DateU.today() + "_" + Math.floor(performance.now()); }
  function saveWorkout(log) {
    const i = state.workoutLogs.findIndex((w) => w.id === log.id);
    if (i >= 0) state.workoutLogs[i] = log; else state.workoutLogs.push(log);
    save();
  }
  function lastWorkout(type) {
    const list = state.workoutLogs.filter((w) => w.type === type && w.completedAt).sort((a, b) => a.date < b.date ? 1 : -1);
    return list[0] || null;
  }
  function lastSet(type, exName) {
    const w = lastWorkout(type); if (!w) return null;
    const sets = (w.sets || []).filter((s) => s.ex === exName && (s.weight != null || s.reps != null));
    return sets.length ? sets[sets.length - 1] : null;
  }

  /* Mid-workout drafts — every set saves instantly; survives closing the app. */
  function getDraft(date, type) { return (state.workoutDrafts || {})[date + "_" + type] || null; }
  function setDraftSet(date, type, key, val) {
    if (!state.workoutDrafts) state.workoutDrafts = {};
    const k = date + "_" + type;
    if (!state.workoutDrafts[k]) state.workoutDrafts[k] = { sets: {}, startedAt: new Date().toISOString() };
    state.workoutDrafts[k].sets[key] = val;
    save();
  }
  function clearDraft(date, type) { if (state.workoutDrafts) { delete state.workoutDrafts[date + "_" + type]; save(); } }
  // A draft from a previous day means the app was closed mid-workout and
  // "Finish" never got tapped. File its logged sets as a real workout so
  // nothing is lost, then drop the draft.
  function commitStaleDrafts() {
    const drafts = state.workoutDrafts || {};
    const today = DateU.today();
    let changed = false;
    Object.keys(drafts).forEach((k) => {
      const date = k.slice(0, 10), type = k.slice(11);
      if (date >= today) return;
      const w = DATA.workouts.find((x) => x.type === type);
      const sets = [];
      const ds = drafts[k].sets || {};
      Object.keys(ds).forEach((sk) => {
        const s = ds[sk]; if (!s || (s.weight == null && s.reps == null)) return;
        const p = sk.split("_");
        const exName = w && w.exercises[+p[0]] ? w.exercises[+p[0]].name : "Exercise " + (+p[0] + 1);
        sets.push({ ex: exName, set: +p[1], weight: s.weight, reps: s.reps, felt: s.felt || null });
      });
      if (sets.length) {
        state.workoutLogs.push({
          id: uid(), date, type, startedAt: drafts[k].startedAt || null,
          completedAt: drafts[k].startedAt || (date + "T23:59:00"),
          note: "Auto-saved — the app was closed mid-workout.", sets
        });
      }
      delete drafts[k];
      changed = true;
    });
    if (changed) save();
  }

  function mealLog(dateISO) { const d = dateISO || DateU.today(); if (!state.mealLogs[d]) state.mealLogs[d] = {}; return state.mealLogs[d]; }
  function setMeal(dateISO, type, status) { const m = mealLog(dateISO); if (m[type] === status) delete m[type]; else m[type] = status; save(); }
  function setDinner(dow, idx) { state.dinnerPlan[dow] = idx; save(); }

  function toggleGrocery(i, field) { const it = state.grocery.items[i]; it[field] = !it[field]; save(); }
  function resetGrocery() { state.grocery = seedGrocery(); save(); }

  function addFintech(s) { state.fintechSessions.push(s); save(); }
  function toggleMilestone(id) { const m = state.fintechMilestones.find((x) => x.id === id); if (m) { m.done = !m.done; save(); } }
  function fintechHoursWeek(weekMonday) {
    const end = DateU.addDays(weekMonday, 6);
    const mins = state.fintechSessions.filter((s) => s.date >= weekMonday && s.date <= end).reduce((a, s) => a + (s.minutes || 0), 0);
    return mins / 60;
  }

  function setTaskStatus(id, status) { const t = state.weddingTasks.find((x) => x.id === id); if (t) { t.status = status; save(); } }
  function addTask(t) { const id = Math.max(0, ...state.weddingTasks.map((x) => x.id)) + 1; state.weddingTasks.push(Object.assign({ id, status: "open" }, t)); save(); return id; }
  function saveVendor(v) { const i = state.vendors.findIndex((x) => x.id === v.id); if (i >= 0) state.vendors[i] = v; save(); }
  function saveMemoriam(m) { const i = state.memoriam.findIndex((x) => x.id === m.id); if (i >= 0) state.memoriam[i] = m; save(); }

  function setMass(dateISO, attended) {
    const i = state.mass.findIndex((m) => m.date === dateISO);
    if (i >= 0) state.mass[i].attended = attended; else state.mass.push({ date: dateISO, attended });
    save();
  }
  function massFor(dateISO) { const m = state.mass.find((x) => x.date === dateISO); return m ? m.attended : false; }
  function bumpBible() { state.settings.bibleEpisode = (state.settings.bibleEpisode || 1) + 1; save(); }

  function addReview(r) { const i = state.reviews.findIndex((x) => x.week === r.week); if (i >= 0) state.reviews[i] = r; else state.reviews.push(r); save(); }
  function reviewFor(week) { return state.reviews.find((x) => x.week === week) || null; }
  function addDateNight(dn) { state.dateNights.push(dn); save(); }
  function dateNightsInMonth(yyyymm) { return state.dateNights.filter((d) => d.date.slice(0, 7) === yyyymm).length; }

  function setPin(hash) { state.pinHash = hash; save(); }

  function exportJSON() { return JSON.stringify(state, null, 2); }
  function importJSON(text) { const obj = JSON.parse(text); state = obj; save(); }
  function reset() { state = defaults(); save(); }

  return {
    load, save, get, day, toggleBlock, skipBlock, addWater, setPrayer,
    addWeight, latestWeight, uid, saveWorkout, lastWorkout, lastSet,
    getDraft, setDraftSet, clearDraft,
    mealLog, setMeal, setDinner, toggleGrocery, resetGrocery,
    addFintech, toggleMilestone, fintechHoursWeek,
    setTaskStatus, addTask, saveVendor, saveMemoriam,
    setMass, massFor, bumpBible, addReview, reviewFor, addDateNight, dateNightsInMonth,
    setPin, exportJSON, importJSON, reset
  };
})();
