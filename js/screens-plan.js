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
        '<div class="tiles">' +
          '<a class="tile" href="#/wedding/vendors">🤝<span>Vendors</span></a>' +
          '<a class="tile" href="#/wedding/memoriam">🕯️<span>In Memoriam</span></a>' +
          '<button class="tile" data-act="addTask">➕<span>Add task</span></button>' +
        '</div>' +
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
      '<div class="wrow"><span class="b">Week of ' + DateU.fmtShort(r.week) + '</span><span class="muted">' + r.workouts + ' workouts · ' + (r.prayer != null ? r.prayer + ' prayer days' : (r.fintech || 0) + 'h') + '</span></div>').join("");

    return '<div class="screen">' + subbar("Weekly Review", "#/stats") + '<div class="wrap">' +
      '<p class="muted intro">Sunday, 5 minutes, be honest. Week of ' + DateU.fmtShort(wk) + '.</p>' +
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
