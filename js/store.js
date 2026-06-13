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
  function fromMin(m) { m = Math.max(0, m); return pad(Math.floor(m / 60)) + ":" + pad(m % 60); }
  return { iso, parse, today, dow, addDays, daysBetween, monday, fmt, fmtLong, fmtShort, time12, time12c, nowMinutes, toMin, fromMin };
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
  function eventDate() { const p = (window.Store && Store.get().profile) || {}; return p.eventDate || p.weddingDate || DATA.profile.weddingDate; }
  function daysToWedding(dateISO) { return DateU.daysBetween(dateISO || DateU.today(), eventDate()); }
  return { current, progress, daysToWedding, eventDate };
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
      seenPhase: {},
      people: [],
      foodDb: DATA.foods.map((f, i) => Object.assign({ id: i }, f)),
      foodDbVersion: DATA.foodSeedVersion,
      onboarded: false
    };
  }

  /* ---- Personalized schedule generator (from onboarding answers) ------- */
  const DAYN = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const GYM_ROTATION = ["lower-strength", "upper-push", "lower-volume", "upper-pull", "long-run", "active-recovery"];
  function buildSchedule(a) {
    const tr = a.tracks || {};
    const fit = !!tr.fitness, faith = !!tr.faith, meals = tr.meals !== false, study = !!tr.study, event = !!tr.event;
    const pw = a.partner ? " with " + a.partner : "";
    const am = (t, n) => DateU.fromMin(Math.max(0, Math.min(1439, DateU.toMin(t) + n)));
    const gymDays = (a.gymDays || []).slice().sort((x, y) => x - y);
    const wtype = (dow) => { const i = gymDays.indexOf(dow); return (fit && i >= 0) ? GYM_ROTATION[i % GYM_ROTATION.length] : null; };
    const wname = (type) => { const w = DATA.workouts.find((x) => x.type === type); return w ? w.name : "Workout"; };
    const days = [];
    for (let dow = 0; dow <= 6; dow++) {
      const work = (a.workDays || []).indexOf(dow) >= 0;
      const gymType = wtype(dow);
      const sleep = a.sleep || "21:45";
      const B = [];
      const add = (s, e, type, title, desc, extra) => B.push(Object.assign({ s: s, e: e, type: type, title: title, desc: desc || "" }, extra || {}));
      if (work) {
        const wake = a.wake || "06:15";
        add(wake, am(wake, 15), "wake", "Wake & Hydrate", "Water before coffee. Ease into the day.");
        let t = am(wake, 15);
        add(t, am(t, 20), "meal", "Breakfast", "Fuel up.", meals ? { meal: "breakfast" } : null); t = am(t, 20);
        if (faith) { add(t, am(t, 10), "prayer", "Morning Prayer" + pw, "A few quiet minutes.", { prayer: "morning" }); t = am(t, 10); }
        const wStart = a.workStart || "08:00", wEnd = a.workEnd || "17:00", commute = am(wStart, -20);
        let morningStudy = false;
        if (study && DateU.toMin(commute) - DateU.toMin(t) >= 45) { add(t, am(t, 45), "fintech", a.studyLabel || "Study", "Focused study block."); morningStudy = true; }
        add(commute, wStart, "commute", "Commute", "Podcast or music.");
        add(wStart, wEnd, "work", a.workLabel || "Work", "Refuel at lunch; step outside after eating.");
        let ev = wEnd;
        if (gymType) { const g = a.gymTime || am(wEnd, 30); add(g, am(g, 60), "workout", wname(gymType), "Today's session — log your sets."); add(am(g, 65), am(g, 85), "shower", "Shower & Reset", ""); ev = am(g, 85); }
        else ev = am(wEnd, 30);
        add(ev, am(ev, 50), "meal", "Dinner" + pw, "Phones away.", meals ? { meal: "dinner" } : null); ev = am(ev, 50);
        if (study && !morningStudy) { add(ev, am(ev, 40), "fintech", a.studyLabel || "Study", "Evening study block."); ev = am(ev, 40); }
        if (event) { add(ev, am(ev, 30), "wedding-checkin", (a.eventName || "Big day") + " check-in", "Knock out the top items.", {}); ev = am(ev, 30); }
        add(ev, am(ev, 45), "flex", "Flex / Personal", "Hobby, errands, or rest.");
        if (faith) add(am(sleep, -15), am(sleep, -5), "prayer", "Evening Prayer", "Reflect and give thanks.", { prayer: "evening" });
        add(am(sleep, -5), sleep, "rest", "Wind Down", "Lay out tomorrow.");
        add(sleep, am(sleep, 5), "rest", "Lights Out", "Phone away. Cool, dark room.");
      } else {
        const wake = am(a.wake || "07:00", 75);
        add(wake, am(wake, 30), "wake", "Slow Wake", "Sleep in a little. Coffee.");
        let t = am(wake, 30);
        add(t, am(t, 30), "meal", "Breakfast", "Relaxed start.", meals ? { meal: "breakfast" } : null); t = am(t, 30);
        if (faith) { add(t, am(t, 10), "prayer", "Morning Prayer" + pw, "", { prayer: "morning" }); t = am(t, 10); }
        if (gymType) { add(t, am(t, 75), "workout", wname(gymType), "Weekend session — your big one."); t = am(t, 80); }
        if (meals) { add(t, am(t, 60), "meal-prep", "Meal Prep", "Cook ahead for the week.", { prep: true }); t = am(t, 60); }
        if (event) { add(t, am(t, 90), "wedding-block", (a.eventName || "Big day") + " planning", "Big weekly push" + pw + ".", {}); t = am(t, 90); }
        add(t, am(t, 150), "flex", "Free Time", "Friends, projects, or rest."); t = am(t, 150);
        add(t, am(t, 60), "meal", "Dinner" + pw, "", meals ? { meal: "dinner" } : null); t = am(t, 60);
        if (faith) add(am(sleep, 10), am(sleep, 20), "prayer", "Evening Prayer", "", { prayer: "evening" });
        add(am(sleep, 25), am(sleep, 30), "rest", "Lights Out", "");
      }
      B.sort((x, y) => DateU.toMin(x.s) - DateU.toMin(y.s));
      days.push({ dow: dow, name: DAYN[dow] + (gymType ? " — " + wname(gymType) : ""), workoutType: gymType, blocks: B });
    }
    return days;
  }
  // Add new seed foods to a user's saved library (by name) without touching
  // foods they edited or added. Runs once per seed version bump.
  function migrateFoodDb() {
    if (!state.foodDb) state.foodDb = DATA.foods.map((f, i) => Object.assign({ id: i }, f));
    if (state.foodDbVersion === DATA.foodSeedVersion) return;
    const have = {};
    state.foodDb.forEach((f) => { have[(f.n || "").toLowerCase()] = true; });
    let nextId = Math.max(-1, ...state.foodDb.map((f) => f.id)) + 1;
    DATA.foods.forEach((f) => {
      const k = (f.n || "").toLowerCase();
      if (!have[k]) { state.foodDb.push(Object.assign({ id: nextId++ }, f)); have[k] = true; }
    });
    state.foodDbVersion = DATA.foodSeedVersion;
    save();
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
    // The week's dinner ingredients, grouped by recipe (a Saturday shop
    // covers Sat → Fri). Pantry basics you always have are left off.
    const pantry = /salt|pepper|olive oil/i;
    const DAY3 = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const plan = (state && state.dinnerPlan) ? state.dinnerPlan
      : (function () { const p = {}; DATA.dinners.forEach((dn, i) => { p[dn.dow] = i; }); return p; })();
    [6, 0, 1, 2, 3, 4, 5].forEach((dow) => {
      const di = plan[dow]; if (di == null) return;
      const dn = DATA.dinners[di]; if (!dn) return;
      dn.ingredients.forEach((ing) => {
        if (pantry.test(ing)) return;
        items.push({ store: "dinner", name: ing, cat: DAY3[dow] + " · " + dn.name, checked: false, oos: false });
      });
    });
    return { items, week: DateU.monday(DateU.today()) };
  }

  function load() {
    try { state = JSON.parse(localStorage.getItem(KEY)); } catch (e) { state = null; }
    if (!state) { state = defaults(); save(); }
    else if (!("onboarded" in state)) state.onboarded = true; // grandfather existing users — never force setup on them
    migrateFoodDb(); // merge new seed foods before the generic key-fill below
    const d = defaults();
    for (const k in d) if (!(k in state)) state[k] = d[k];
    // one-time upgrade: older grocery lists predate the dinner-ingredient section
    if (state.grocery && !(state.grocery.items || []).some((i) => i.store === "dinner")) state.grocery = seedGrocery();
    commitStaleDrafts();
    return state;
  }
  function save() { try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) {} }
  function get() { return state || load(); }

  /* active schedule + chosen life-tracks (fall back to the built-in defaults) */
  function days() { return (state.schedule && state.schedule.length) ? state.schedule : DATA.days; }
  function tracks() { return (state.profile && state.profile.tracks) || { fitness: true, faith: true, meals: true, study: true, event: true }; }
  function completeSetup(a) {
    const p = state.profile || {};
    Object.assign(p, {
      name: a.name || p.name || "You", partner: a.partner || "",
      eventName: a.eventName || "", eventDate: a.eventDate || "",
      weddingDate: a.eventDate || p.weddingDate, weddingVenue: a.eventName || p.weddingVenue || "",
      units: a.units || "lbs",
      startWeight: a.startWeight != null ? a.startWeight : p.startWeight,
      targetWeight: a.targetWeight != null ? a.targetWeight : p.targetWeight,
      calorieTarget: a.calorieTarget || p.calorieTarget || 2100,
      proteinTarget: a.proteinTarget || p.proteinTarget || 160,
      tracks: a.tracks, studyLabel: a.studyLabel || "Study", workLabel: a.workLabel || "Work",
      wake: a.wake, sleep: a.sleep, workStart: a.workStart, workEnd: a.workEnd,
      workDays: a.workDays, gymDays: a.gymDays, gymTime: a.gymTime
    });
    state.profile = p;
    state.schedule = buildSchedule(a);
    state.onboarded = true;
    save();
  }

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
  function dayFoods(dateISO) { const dl = day(dateISO); if (!dl.foods) dl.foods = []; return dl.foods; }
  function addFood(dateISO, f) { dayFoods(dateISO).push(Object.assign({ id: Date.now().toString(36) }, f)); save(); }
  function delFood(dateISO, id) { const dl = day(dateISO); dl.foods = (dl.foods || []).filter((x) => x.id !== id); save(); }
  function dayNutrition(dateISO) {
    const ml = mealLog(dateISO); let cal = 0, protein = 0;
    DATA.meals.forEach((m) => { if (ml[m.type] === "eaten") { cal += m.cal; protein += m.protein; } });
    (day(dateISO).foods || []).forEach((f) => { cal += +f.cal || 0; protein += +f.protein || 0; });
    return { cal, protein };
  }

  /* Editable food library (powers the plain-English calorie lookup) */
  function foodDb() { if (!state.foodDb) state.foodDb = DATA.foods.map((f, i) => Object.assign({ id: i }, f)); return state.foodDb; }
  function addFoodDb(f) { const db = foodDb(); const id = Math.max(-1, ...db.map((x) => x.id)) + 1; db.push(Object.assign({ id }, f)); save(); return id; }
  function setFoodDb(f) { const x = foodDb().find((y) => y.id === f.id); if (x) { Object.assign(x, f); save(); } }
  function delFoodDb(id) { state.foodDb = foodDb().filter((x) => x.id !== id); save(); }
  function resetFoodDb() { state.foodDb = DATA.foods.map((f, i) => Object.assign({ id: i }, f)); save(); }

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
  function setTask(upd) { const t = state.weddingTasks.find((x) => x.id === upd.id); if (t) { Object.assign(t, upd); save(); } }
  function deleteTask(id) { state.weddingTasks = state.weddingTasks.filter((x) => x.id !== id); save(); }
  // Wedding-task sharing: a compact payload of only what's changed from the
  // shared seed list + any custom tasks added. Both phones seed the same 37
  // tasks (ids 0–36), so we only ship the diffs.
  function weddingSyncPayload() {
    const SEED_N = DATA.weddingTasks.length;
    const base = [];
    state.weddingTasks.forEach((t) => {
      const seed = DATA.weddingTasks[t.id];
      if (t.id < SEED_N && seed) {
        if (t.status !== "open" || t.due || t.who !== seed.who || t.priority !== seed.p) {
          const e = { i: t.id, s: t.status, w: t.who, p: t.priority };
          if (t.due) e.u = t.due;
          base.push(e);
        }
      }
    });
    const add = state.weddingTasks.filter((t) => !(t.id < SEED_N && DATA.weddingTasks[t.id]))
      .map((t) => ({ t: t.title, d: t.desc || "", m: t.month, w: t.who, p: t.priority, s: t.status, u: t.due || "" }));
    return { v: 1, base: base, add: add };
  }
  function applyWeddingSync(payload) {
    if (!payload || payload.v !== 1) return 0;
    let n = 0;
    (payload.base || []).forEach((e) => {
      const t = state.weddingTasks.find((x) => x.id === e.i); if (!t) return;
      t.status = (t.status === "done" || e.s === "done") ? "done" : e.s; // never undo a completed task
      if (e.u) t.due = e.u; if (e.w) t.who = e.w; if (e.p) t.priority = e.p;
      n++;
    });
    (payload.add || []).forEach((e) => {
      if (!e.t) return;
      if (state.weddingTasks.some((x) => (x.title || "").toLowerCase() === e.t.toLowerCase())) return;
      const id = Math.max(DATA.weddingTasks.length - 1, ...state.weddingTasks.map((x) => x.id)) + 1;
      state.weddingTasks.push({ id: id, title: e.t, desc: e.d || "", month: e.m || "june", who: e.w || "both", priority: e.p || "medium", status: e.s || "open", due: e.u || null });
      n++;
    });
    save(); return n;
  }
  function addPerson(name) {
    name = (name || "").trim(); if (!name) return "";
    if (!state.people) state.people = [];
    const low = name.toLowerCase();
    if (["manny", "nicole", "both", "coordinator", "vendor"].indexOf(low) < 0 && !state.people.some((p) => p.toLowerCase() === low)) state.people.push(name);
    save(); return name;
  }
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
    load, save, get, days, tracks, completeSetup, day, toggleBlock, skipBlock, addWater, setPrayer,
    addWeight, latestWeight, uid, saveWorkout, lastWorkout, lastSet,
    getDraft, setDraftSet, clearDraft,
    mealLog, setMeal, setDinner, dayFoods, addFood, delFood, dayNutrition,
    foodDb, addFoodDb, setFoodDb, delFoodDb, resetFoodDb, toggleGrocery, resetGrocery,
    addFintech, toggleMilestone, fintechHoursWeek,
    setTaskStatus, addTask, setTask, deleteTask, addPerson, weddingSyncPayload, applyWeddingSync, saveVendor, saveMemoriam,
    setMass, massFor, bumpBible, addReview, reviewFor, addDateNight, dateNightsInMonth,
    setPin, exportJSON, importJSON, reset
  };
})();
