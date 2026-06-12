/* =====================================================================
   SCREENS (planning) — Wedding, Vendors, In Memoriam, Fintech,
   Weekly Review, Stats hub, More menu, Settings.
   ===================================================================== */
window.Screens = window.Screens || {};
(function (S) {
  const esc = UI.esc;
  function subbar(title, back) {
    return '<div class="topbar sub"><a class="back" href="' + (back || "#/more") + '">‹</a><h1>' + esc(title) + '</h1><span style="width:30px"></span></div>';
  }
  function topbar(title, right) { return '<div class="topbar"><h1>' + esc(title) + '</h1>' + (right || "") + '</div>'; }
  function monthFocusToday() {
    const m = DateU.parse(DateU.today()).getMonth() + 1;
    return ({ 6: "june", 7: "july", 8: "august", 9: "september", 10: "october", 11: "nov-week" })[m] || "all";
  }

  /* ---- Overdue wedding tasks: month ended, still open ----------------- */
  const MONTH_END = { june: "2026-06-30", july: "2026-07-31", august: "2026-08-31", september: "2026-09-30", october: "2026-10-31", "nov-week": "2026-11-06" };
  S.weddingOverdue = function () {
    const today = DateU.today();
    const out = { count: 0, oldest: null };
    Store.get().weddingTasks.forEach((t) => {
      if (t.status === "done") return;
      if (MONTH_END[t.month] && MONTH_END[t.month] < today) { out.count++; if (!out.oldest) out.oldest = t.month; }
    });
    return out;
  };
  function overdueBanner(tappable) {
    const wo = S.weddingOverdue();
    if (!wo.count) return "";
    return '<div class="nudge warn' + (tappable ? ' tap" data-act="weddingCatchup" data-m="' + wo.oldest + '" role="button' : '') + '">' +
      '<span>⏰</span><p>' + wo.count + ' task' + (wo.count === 1 ? "" : "s") + ' slipped past ' + esc(DATA.monthLabels[wo.oldest]) +
      (wo.count === 1 ? " and is" : " and are") + ' still open — knock ' + (wo.count === 1 ? "it" : "them") + ' out this week.</p>' +
      (tappable ? '<span class="nchev">›</span>' : '') + '</div>';
  }

  /* ===================== WEDDING BUSY MAP ===================== */
  // Heat is DYNAMIC: open tasks ÷ days REMAINING in that month. Stall and
  // the same tasks squeeze into fewer days → the map heats up. Catch up →
  // it cools. Saturdays (power block) and pinned events add a level.
  const MONTH_BOUNDS = {
    june: ["2026-06-01", "2026-06-30"], july: ["2026-07-01", "2026-07-31"],
    august: ["2026-08-01", "2026-08-31"], september: ["2026-09-01", "2026-09-30"],
    october: ["2026-10-01", "2026-10-31"], "nov-week": ["2026-11-01", "2026-11-06"]
  };
  function monthKeyOf(iso) {
    const m = DateU.parse(iso).getMonth() + 1;
    if (m >= 6 && m <= 10) return ["june", "july", "august", "september", "october"][m - 6];
    if (m === 11 && +iso.slice(8, 10) <= 6) return "nov-week";
    return null;
  }
  function monthPressure(mk, openByMonth) {
    const b = MONTH_BOUNDS[mk]; if (!b) return { p: 0, open: 0, remaining: 0 };
    const today = DateU.today();
    if (today > b[1]) return { p: 0, open: openByMonth[mk] || 0, remaining: 0 };
    const from = today > b[0] ? today : b[0];
    const remaining = Math.max(1, DateU.daysBetween(from, b[1]) + 1);
    const open = openByMonth[mk] || 0;
    return { p: open / remaining, open, remaining };
  }
  function heatLevel(iso, openByMonth) {
    const mk = monthKeyOf(iso); if (!mk) return 0;
    const p = monthPressure(mk, openByMonth).p;
    let lvl = p >= 1 ? 4 : p >= 0.6 ? 3 : p >= 0.3 ? 2 : p >= 0.15 ? 1 : 0;
    if (DateU.dow(iso) === 6) lvl += 1; // Saturday power block
    const dl = Store.get().dayLogs[iso];
    if (dl && (dl.custom || []).some((c) => !c.travel)) lvl += 1; // pinned plans
    if (mk === "nov-week") lvl = Math.max(lvl, 3); // crunch week floor
    return Math.min(4, lvl);
  }

  /* ---- Day detail sheet: the wedding picture for one day --------------- */
  S.calDaySheet = function (iso) {
    const st = Store.get();
    const openByMonth = {};
    st.weddingTasks.forEach((t) => { if (t.status !== "done") openByMonth[t.month] = (openByMonth[t.month] || 0) + 1; });
    const mk = monthKeyOf(iso);
    const lvl = heatLevel(iso, openByMonth);
    const names = ["Calm", "Light", "Busy", "Loaded", "Packed"];
    let html = '<p class="found"><span class="heat-chip h' + lvl + '">' + names[lvl] + '</span></p>';
    if (mk) {
      const pr = monthPressure(mk, openByMonth);
      const pace = !pr.open ? esc(DATA.monthLabels[mk]) + " tasks: all clear ✓"
        : pr.remaining === 0 ? pr.open + " open task" + (pr.open === 1 ? "" : "s") + " left over from " + esc(DATA.monthLabels[mk]) + " — overdue."
        : pr.open + " open " + esc(DATA.monthLabels[mk]) + " task" + (pr.open === 1 ? "" : "s") + " · " + pr.remaining + " day" + (pr.remaining === 1 ? "" : "s") + " left → " +
          (pr.p > 1 ? "more than one a day. Crunch mode — divide and conquer with " + esc(DATA.profile.partner) + "."
            : "about 1 task every " + Math.max(1, Math.round(pr.remaining / pr.open)) + " day" + (Math.round(pr.remaining / pr.open) > 1 ? "s" : "") + " keeps you on track.");
      html += '<p class="found">' + pace + '</p>';
      const tasks = st.weddingTasks.filter((t) => t.status !== "done" && t.month === mk);
      const pIco = { high: "🔴", medium: "🟡", low: "🟢" };
      html += tasks.slice(0, 8).map((t) => '<div class="sug"><span>' + pIco[t.priority] + '</span><div>' + esc(t.title) + '</div></div>').join("");
      if (tasks.length > 8) html += '<p class="found">…and ' + (tasks.length - 8) + ' more.</p>';
    }
    const dt = DATA.days.find((d) => d.dow === DateU.dow(iso));
    (dt ? dt.blocks : []).forEach((b) => {
      if (b.type === "wedding-checkin" || b.type === "wedding-block")
        html += '<div class="sug"><span>💍</span><div>' + esc(b.title) + ' · <b class="tabnum">' + DateU.time12c(b.s) + '–' + DateU.time12c(b.e) + '</b></div></div>';
    });
    const dl = st.dayLogs[iso];
    ((dl && dl.custom) || []).forEach((c) => {
      html += '<div class="sug"><span>' + (c.travel ? "🚗" : "📌") + '</span><div>' + esc(c.title) + (c.allDay ? ' · all day' : ' · <b class="tabnum">' + DateU.time12c(c.s) + '–' + DateU.time12c(c.e) + '</b>') + '</div></div>';
    });
    html += (mk ? '<button class="btn btn-primary big" data-act="weddingCatchup" data-m="' + mk + '">Work ' + esc(DATA.monthLabels[mk]) + '\'s tasks</button>' : '') +
      '<button class="btn btn-ghost big" data-act="openPlanner" data-date="' + iso + '">📅 Open this day in the planner</button>';
    return html;
  };
  S.weddingCal = function () {
    const st = Store.get();
    const today = DateU.today();
    const openByMonth = {};
    st.weddingTasks.forEach((t) => { if (t.status !== "done") openByMonth[t.month] = (openByMonth[t.month] || 0) + 1; });
    const monthKeys = { 6: "june", 7: "july", 8: "august", 9: "september", 10: "october", 11: "nov-week" };
    const MN = ["June", "July", "August", "September", "October", "November"];
    const WD = ["S", "M", "T", "W", "T", "F", "S"];
    let cal = "";
    for (let m = 6; m <= 11; m++) {
      const mm = String(m).padStart(2, "0");
      const dim = m === 11 ? 6 : new Date(2026, m, 0).getDate(); // stop after Nov 6
      const off = DateU.dow("2026-" + mm + "-01");
      let cells = WD.map((w) => '<span class="cal-w">' + w + '</span>').join("");
      for (let i = 0; i < off; i++) cells += '<span class="cal-c empty"></span>';
      for (let d = 1; d <= dim; d++) {
        const iso = "2026-" + mm + "-" + String(d).padStart(2, "0");
        const lvl = heatLevel(iso, openByMonth);
        const isWed = iso === "2026-11-06";
        cells += '<button class="cal-c h' + lvl + (iso < today ? " past" : "") + (iso === today ? " today" : "") + (isWed ? " wedding" : "") +
          '" data-act="calDay" data-date="' + iso + '">' + (isWed ? "💍" : d) + '</button>';
      }
      const open = openByMonth[monthKeys[m]] || 0;
      cal += '<div class="cal-month"><div class="cal-h">' + MN[m - 6] +
        '<span class="muted">' + (open ? open + " open task" + (open === 1 ? "" : "s") : "all clear ✓") + '</span></div>' +
        '<div class="cal-grid">' + cells + '</div></div>';
    }
    const legend =
      '<div class="cal-legend">' +
        '<span><i style="background:#F2EFE8"></i>calm</span>' +
        '<span><i style="background:#CFE3D4"></i>light</span>' +
        '<span><i style="background:#F6DD8F"></i>busy</span>' +
        '<span><i style="background:#F2AE5E"></i>loaded</span>' +
        '<span><i style="background:#E2746C"></i>packed</span>' +
      '</div>';
    return '<div class="screen">' + subbar("Busy Map", "#/wedding") + '<div class="wrap">' +
      '<p class="muted intro">Color = open tasks squeezed into the days <b>left</b> in each month — fall behind and it heats up, catch up and it cools. Tap any day for its wedding picture.</p>' +
      legend + overdueBanner(true) + cal +
      '</div></div>';
  };

  /* ===================== WEDDING ===================== */
  S.wedding = function () {
    const st = Store.get();
    const dtw = Phases.daysToWedding(DateU.today());
    const tasks = st.weddingTasks;
    const open = tasks.filter((t) => t.status !== "done").length;
    const done = tasks.filter((t) => t.status === "done").length;
    const contracted = st.vendors.reduce((a, v) => a + (v.cost || 0), 0);

    if (App.ui.taskMonth === undefined) App.ui.taskMonth = monthFocusToday();
    const fm = App.ui.taskMonth, fs = App.ui.taskStatus || "all";
    const months = Object.keys(DATA.monthLabels);
    const monthOpts = '<option value="all"' + (fm === "all" ? " selected" : "") + '>All months</option>' +
      months.map((k) => '<option value="' + k + '"' + (fm === k ? " selected" : "") + '>' + esc(DATA.monthLabels[k]) + '</option>').join("");

    let shown = tasks.filter((t) => (fm === "all" || t.month === fm) && (fs === "all" || (fs === "open" ? t.status !== "done" : t.status === "done")));
    const prioRank = { high: 0, medium: 1, low: 2 };
    shown.sort((a, b) => (a.status === "done") - (b.status === "done") || prioRank[a.priority] - prioRank[b.priority]);

    const rows = shown.length ? shown.map((t) => {
      const cls = t.status === "done" ? "done" : t.status === "in-progress" ? "wip" : "";
      const badge = t.status === "done" ? "✓" : t.status === "in-progress" ? "◐" : "○";
      return '<div class="task ' + cls + '">' +
        '<button class="task-check" data-act="taskCycle" data-id="' + t.id + '" title="Tap to change status">' + badge + '</button>' +
        '<div class="task-b"><div class="t">' + esc(t.title) + '</div>' +
          (t.desc ? '<div class="d">' + esc(t.desc) + '</div>' : "") +
          '<div class="task-m"><span class="pill p-' + t.priority + '">' + t.priority + '</span>' +
            '<span class="pill who">' + esc(t.who) + '</span>' +
            '<span class="pill">' + esc(DATA.monthLabels[t.month]) + '</span></div>' +
        '</div></div>';
    }).join("") : '<div class="empty">No tasks match this filter.</div>';

    return '<div class="screen">' + topbar("Wedding", '<a class="datepill" href="#/wedding/vendors">Vendors</a>') +
      '<div class="wrap">' +
        '<div class="phase wed"><div class="label">November 6, 2026 · Sacred Heart</div>' +
          '<div class="count"><b class="tabnum">' + (dtw >= 0 ? dtw : 0) + '</b><span>days until you marry ' + esc(DATA.profile.partner) + '</span></div></div>' +
        '<div class="stats">' +
          '<div class="stat"><b class="tabnum">' + open + '</b><span>tasks open</span></div>' +
          '<div class="stat"><b class="tabnum">' + done + '</b><span>done</span></div>' +
          '<div class="stat"><b class="tabnum">$' + contracted.toLocaleString() + '</b><span>contracted</span></div>' +
        '</div>' +
        '<div class="tiles t4">' +
          '<a class="tile" href="#/wedding/calendar">📆<span>Busy map</span></a>' +
          '<a class="tile" href="#/wedding/vendors">🤝<span>Vendors</span></a>' +
          '<a class="tile" href="#/wedding/memoriam">🕯️<span>In Memoriam</span></a>' +
          '<button class="tile" data-act="addTask">➕<span>Add task</span></button>' +
        '</div>' +
        overdueBanner(true) +
        '<div class="filters">' +
          '<select class="sel" data-act="taskMonth">' + monthOpts + '</select>' +
          UI.segmented([{ v: "all", t: "All" }, { v: "open", t: "Open" }, { v: "done", t: "Done" }], fs, "taskStatus") +
        '</div>' +
        rows +
      '</div></div>';
  };

  /* ===================== VENDORS ===================== */
  S.vendors = function () {
    const cards = Store.get().vendors.map((v) => {
      const badge = ({ "signed": "Signed", "no-contract": "No contract", "sent": "Sent", "complete": "Complete" })[v.status] || v.status;
      return '<div class="vendor">' +
        '<div class="vendor-h"><div><div class="t">' + esc(v.name) + '</div><div class="role">' + esc(v.role) + '</div></div>' +
          '<span class="badge b-' + v.status + '">' + esc(badge) + '</span></div>' +
        (v.cost ? '<div class="cost">$' + v.cost.toLocaleString() + '</div>' : "") +
        (v.notes ? '<div class="vnotes">' + esc(v.notes) + '</div>' : "") +
        '<button class="link" data-act="editVendor" data-id="' + v.id + '">Edit ›</button>' +
      '</div>';
    }).join("");
    return '<div class="screen">' + subbar("Vendors", "#/wedding") + '<div class="wrap">' + cards + '</div></div>';
  };

  /* ===================== IN MEMORIAM ===================== */
  S.memoriam = function () {
    const list = Store.get().memoriam;
    const photos = list.filter((m) => m.photo).length, framed = list.filter((m) => m.framed).length;
    const rows = list.map((m) =>
      '<div class="mem">' +
        '<div class="mem-b"><div class="t">' + esc(m.name) + '</div><div class="rel">' + esc(m.rel) + '</div>' +
          (m.notes ? '<div class="d">' + esc(m.notes) + '</div>' : "") + '</div>' +
        '<div class="mem-x">' +
          '<button class="tag ' + (m.photo ? "on" : "") + '" data-act="memToggle" data-id="' + m.id + '" data-field="photo">📷 photo</button>' +
          '<button class="tag ' + (m.framed ? "on" : "") + '" data-act="memToggle" data-id="' + m.id + '" data-field="framed">🖼 framed</button>' +
          '<button class="link" data-act="editMem" data-id="' + m.id + '">edit</button>' +
        '</div>' +
      '</div>').join("");
    return '<div class="screen">' + subbar("In Memoriam", "#/wedding") + '<div class="wrap">' +
      '<p class="muted intro">Loved ones honored at the reception table. Edit the placeholders with real names.</p>' +
      '<div class="stats"><div class="stat"><b class="tabnum">' + list.length + '</b><span>honored</span></div>' +
        '<div class="stat"><b class="tabnum">' + photos + '/' + list.length + '</b><span>photos</span></div>' +
        '<div class="stat"><b class="tabnum">' + framed + '/' + list.length + '</b><span>framed</span></div></div>' +
      rows + '</div></div>';
  };

  /* ===================== FINTECH ===================== */
  S.fintech = function () {
    const st = Store.get();
    const wkMon = DateU.monday(DateU.today());
    const hrs = Store.fintechHoursWeek(wkMon);
    const target = DATA.profile.fintechWeeklyHours;
    const weeks = [];
    for (let i = 5; i >= 0; i--) { const m = DateU.addDays(wkMon, -7 * i); weeks.push({ label: DateU.fmtShort(m).split(" ")[1], value: +Store.fintechHoursWeek(m).toFixed(1) }); }
    let streak = 0; for (let i = 0; i < 60; i++) { const d = DateU.addDays(DateU.today(), -i); if (st.fintechSessions.some((s) => s.date === d)) streak++; else if (i > 0) break; }

    const groups = {};
    st.fintechMilestones.forEach((m) => { (groups[m.module] = groups[m.module] || []).push(m); });
    const modName = {}; DATA.fintechModules.forEach((m) => modName[m.id] = m.name);
    const ms = Object.keys(groups).map((mod) => {
      const items = groups[mod].map((m) =>
        '<label class="ms ' + (m.done ? "done" : "") + '"><button class="check ' + (m.done ? "on" : "") + '" data-act="milestone" data-id="' + m.id + '">' + (m.done ? "✓" : "") + '</button>' +
        '<span>' + esc(m.title) + '</span></label>').join("");
      const dn = groups[mod].filter((m) => m.done).length;
      return '<details class="msg"><summary>' + esc(modName[mod] || mod) + ' <span class="muted">' + dn + '/' + groups[mod].length + '</span></summary>' + items + '</details>';
    }).join("");

    return '<div class="screen">' + subbar("Fintech Study", "#/more") + '<div class="wrap">' +
      '<div class="guide" style="margin-bottom:12px">⏸ Paused while the wedding takes priority. Your milestones are saved — pick this back up after Nov 9 (or log the odd session if you feel like it).</div>' +
      '<button class="btn btn-primary big" data-act="logFintech">⏱ Log a study session</button>' +
      '<div class="fin-top">' +
        UI.ring(hrs / target, hrs.toFixed(1) + "h", "this week") +
        '<div class="fin-side"><div class="big tabnum">' + streak + ' 🔥</div><div class="muted">day streak</div>' +
          '<div class="muted" style="margin-top:8px">Target ' + target + ' h/week</div></div>' +
      '</div>' +
      '<div class="card2"><div class="card2-h">Hours per week <span class="muted">target ' + target + '</span></div>' + UI.barChart(weeks, { target: target }) + '</div>' +
      '<div class="sec-h">Milestones</div>' + ms +
      '</div></div>';
  };

  /* ===================== WEEKLY REVIEW ===================== */
  S.review = function () {
    const wk = DateU.monday(DateU.today());
    const end = DateU.addDays(wk, 6);
    const st = Store.get();
    const workouts = st.workoutLogs.filter((l) => l.completedAt && l.date >= wk && l.date <= end).length;
    let lunches = 0;
    for (let i = 0; i < 5; i++) { const d = DateU.addDays(wk, i); const ml = st.mealLogs[d]; if (ml && ml.lunch === "eaten") lunches++; }
    let prayerDays = 0;
    for (let i = 0; i < 7; i++) { const d = DateU.addDays(wk, i); const pl = st.dayLogs[d]; if (pl && (pl.prayerM || pl.prayerE)) prayerDays++; }
    const dn = Store.dateNightsInMonth(DateU.today().slice(0, 7));
    const saved = Store.reviewFor(wk) || {};
    const ta = (id, label, ph) => '<label class="rfield"><span>' + label + '</span><textarea id="' + id + '" rows="2" placeholder="' + ph + '">' + esc(saved[id] || "") + '</textarea></label>';

    const past = st.reviews.slice().sort((a, b) => a.week < b.week ? 1 : -1).slice(0, 6).map((r) =>
      '<div class="wrow"><span class="b tabnum">' + DateU.fmtShort(r.week) + ' – ' + DateU.fmtShort(DateU.addDays(r.week, 6)) + '</span><span class="muted">' + r.workouts + ' workouts · ' + (r.prayer != null ? r.prayer + ' prayer days' : (r.fintech || 0) + 'h') + '</span></div>').join("");

    return '<div class="screen">' + subbar("Weekly Review", "#/stats") + '<div class="wrap">' +
      '<p class="muted intro">Sunday, 5 minutes, be honest. This week: <b class="tabnum">' + DateU.fmtShort(wk) + ' – ' + DateU.fmtShort(end) + '</b>.</p>' +
      '<div class="stats4">' +
        '<div class="stat"><b class="tabnum">' + workouts + '/6</b><span>workouts</span></div>' +
        '<div class="stat"><b class="tabnum">' + lunches + '/5</b><span>lunches</span></div>' +
        '<div class="stat"><b class="tabnum">' + prayerDays + '/7</b><span>prayer days</span></div>' +
        '<div class="stat"><b class="tabnum">' + dn + '</b><span>date nights</span></div>' +
      '</div>' +
      '<div class="card2"><div class="card2-h">Reflection</div>' +
        ta("reflection_workouts", "Did I hit my workouts? If not, why?", "…") +
        ta("reflection_lunch", "Did I pack lunch all 5 days?", "…") +
        ta("reflection_wedding", "Did the wedding move forward this week? What's next?", "…") +
        ta("reflection_sleep", "How did I sleep on average?", "…") +
        ta("reflection_next_week_focus", "The one biggest pull on next week's calendar?", "…") +
        '<button class="btn btn-primary big" data-act="saveReview" data-week="' + wk + '" data-workouts="' + workouts + '" data-lunches="' + lunches + '" data-prayer="' + prayerDays + '">Save review</button>' +
      '</div>' +
      (past ? '<div class="sec-h">Past reviews</div>' + past : "") +
      '</div></div>';
  };

  /* ===================== STATS hub ===================== */
  S.stats = function () {
    const st = Store.get();
    const w = Store.latestWeight();
    const wkMon = DateU.monday(DateU.today());
    const workouts = st.workoutLogs.filter((l) => l.completedAt && l.date >= wkMon).length;
    const tasksOpen = st.weddingTasks.filter((t) => t.status !== "done").length;
    return '<div class="screen">' + topbar("Stats", "") + '<div class="wrap">' +
      '<div class="stats">' +
        '<div class="stat"><b class="tabnum">' + (w ? w.lbs : st.profile.startWeight) + '</b><span>weight</span></div>' +
        '<div class="stat"><b class="tabnum">' + workouts + '</b><span>workouts/wk</span></div>' +
        '<div class="stat"><b class="tabnum">' + tasksOpen + '</b><span>wedding tasks</span></div>' +
      '</div>' +
      '<div class="menu">' +
        '<a class="mrow" href="#/weight"><span>⚖️ Weight &amp; body</span><span class="chev">›</span></a>' +
        '<a class="mrow" href="#/workout/progress"><span>🏋️ Workout progress</span><span class="chev">›</span></a>' +
        '<a class="mrow" href="#/review"><span>📊 Weekly review</span><span class="chev">›</span></a>' +
        '<a class="mrow" href="#/workout/history"><span>📜 Workout history</span><span class="chev">›</span></a>' +
      '</div></div></div>';
  };

  /* ===================== MORE ===================== */
  S.more = function () {
    return '<div class="screen">' + topbar("More", "") + '<div class="wrap">' +
      '<div class="menu">' +
        '<a class="mrow" href="#/meals"><span>🍽️ Meals &amp; recipes</span><span class="chev">›</span></a>' +
        '<a class="mrow" href="#/meals/grocery"><span>🛒 Grocery list</span><span class="chev">›</span></a>' +
        '<a class="mrow" href="#/meals/prep"><span>🧑‍🍳 Meal prep</span><span class="chev">›</span></a>' +
        '<a class="mrow" href="#/weight"><span>⚖️ Weight</span><span class="chev">›</span></a>' +
        '<a class="mrow" href="#/fintech"><span>📈 Fintech study <small class="muted">(paused)</small></span><span class="chev">›</span></a>' +
        '<a class="mrow" href="#/faith"><span>🙏 Faith &amp; prayer</span><span class="chev">›</span></a>' +
        '<a class="mrow" href="#/wedding/vendors"><span>🤝 Vendors</span><span class="chev">›</span></a>' +
        '<a class="mrow" href="#/wedding/memoriam"><span>🕯️ In Memoriam</span><span class="chev">›</span></a>' +
        '<a class="mrow" href="#/review"><span>📊 Weekly review</span><span class="chev">›</span></a>' +
        '<a class="mrow" href="#/settings"><span>⚙️ Settings</span><span class="chev">›</span></a>' +
      '</div>' +
      '<div class="madefor">Made for ' + esc(DATA.profile.name) + ' &amp; ' + esc(DATA.profile.partner) + ' · Nov 6, 2026 💍</div>' +
      '</div></div>';
  };

  /* ===================== SETTINGS ===================== */
  S.settings = function () {
    const p = Store.get().profile;
    const hasPin = !!Store.get().pinHash;
    return '<div class="screen">' + subbar("Settings", "#/more") + '<div class="wrap">' +
      '<div class="card2"><div class="card2-h">Profile</div>' +
        '<div class="kv"><span>Name</span><b>' + esc(p.name) + '</b></div>' +
        '<div class="kv"><span>Height</span><b>' + Math.floor(p.heightIn / 12) + "′" + (p.heightIn % 12) + '″</b></div>' +
        '<div class="kv"><span>Starting weight</span><b>' + p.startWeight + ' lb</b></div>' +
        '<div class="kv"><span>Target weight</span><b>' + p.targetWeight + ' lb</b></div>' +
        '<div class="kv"><span>Wedding</span><b>' + DateU.fmtLong(p.weddingDate) + '</b></div>' +
        '<button class="link" data-act="editProfile">Edit profile ›</button>' +
      '</div>' +
      '<div class="card2"><div class="card2-h">Security</div>' +
        '<p class="muted">A 4-digit PIN blocks casual access on a shared phone. It is not bank-grade — just a speed bump.</p>' +
        '<button class="btn btn-ghost" data-act="setPin">' + (hasPin ? "Change PIN" : "Set a PIN") + '</button>' +
        (hasPin ? ' <button class="btn btn-ghost" data-act="removePin">Remove PIN</button>' : "") +
      '</div>' +
      '<div class="card2"><div class="card2-h">Phone reminders</div>' +
        '<p class="muted">Real iPhone notifications — leave-for-work, defrost tonight\'s dinner (named per day), gym days, water checks, and the Friday weigh-in. Download the file, open it, tap <b>Add All</b> to put them in your Calendar. They run through Nov 6, then stop on their own.</p>' +
        '<button class="btn btn-ghost" data-act="downloadICS">📅 Download reminders (.ics)</button>' +
        '<p class="muted" style="margin-top:8px;font-size:12.5px">Smarter nudges — like "you\'re behind on water" — show at the top of Today whenever you open the app. A free web app can\'t check your data in the background, so those only fire in-app.</p>' +
      '</div>' +
      '<div class="card2"><div class="card2-h">Your data</div>' +
        '<p class="muted">Everything lives on this device. Back it up here, or restore on a new phone.</p>' +
        '<button class="btn btn-ghost" data-act="exportData">⬇ Export backup (JSON)</button>' +
        '<button class="btn btn-ghost" data-act="importData">⬆ Import backup</button>' +
        '<button class="btn btn-ghost danger" data-act="resetAll">↺ Reset everything</button>' +
      '</div>' +
      '<div class="madefor">Manny\'s Plan · v1 · ' + esc(DateU.fmtShort(DateU.today())) + '</div>' +
      '</div></div>';
  };

})(window.Screens);
