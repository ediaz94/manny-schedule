/* =====================================================================
   APP — router, navigation, PIN gate, phase modal, and the global
   action dispatcher (Act) that wires every button.
   ===================================================================== */
window.App = (function () {
  const S = window.Screens;
  const routes = {
    "": S.today, "today": S.today,
    "workout": S.workout, "workout/history": S.workoutHistory, "workout/progress": S.workoutProgress,
    "weight": S.weight,
    "meals": S.meals, "meals/rotation": S.dinnerRotation, "meals/grocery": S.grocery, "meals/prep": S.mealPrep,
    "fintech": S.fintech,
    "wedding": S.wedding, "wedding/vendors": S.vendors, "wedding/memoriam": S.memoriam,
    "faith": S.faith, "review": S.review, "stats": S.stats, "more": S.more, "settings": S.settings
  };
  const ui = {}; // transient view state (filters, selected exercise)

  function routeKey() { return (location.hash || "#/").replace(/^#\/?/, ""); }
  function navTab(key) {
    if (key === "" || key === "today") return "today";
    if (key.indexOf("workout") === 0) return "workout";
    if (key.indexOf("wedding") === 0) return "wedding";
    if (["stats", "weight", "fintech", "review"].indexOf(key) >= 0 || key.indexOf("workout/") === 0) return "stats";
    return "more";
  }
  function nav(active) {
    const t = (key, tab, icon, label) =>
      '<a class="' + (active === tab ? "active" : "") + '" href="#/' + key + '">' + UI.icon(icon) + label + '</a>';
    return '<nav class="nav">' +
      t("", "today", "home", "Today") +
      t("workout", "workout", "dumbbell", "Workout") +
      t("wedding", "wedding", "heart", "Wedding") +
      t("stats", "stats", "chart", "Stats") +
      t("more", "more", "menu", "More") +
      '</nav>';
  }

  function render() {
    const key = routeKey();
    const fn = routes[key] || S.today;
    document.getElementById("view").innerHTML = fn();
    document.getElementById("navbar").innerHTML = nav(navTab(key));
    window.scrollTo(0, 0);
  }
  function closeSheets() {
    document.querySelectorAll(".sheet-back").forEach((s) => s.remove());
    document.body.style.overflow = "";
  }

  /* ---- PIN ----------------------------------------------------------- */
  function hash(s) { let h = 5381; for (let i = 0; i < s.length; i++) h = ((h * 33) ^ s.charCodeAt(i)) >>> 0; return String(h); }
  function locked() { return !!Store.get().pinHash && sessionStorage.getItem("manny.unlocked") !== "1"; }
  function showLock() {
    document.getElementById("app").innerHTML =
      '<div class="lock"><div class="lock-card">' +
        '<div class="lock-emoji">💍</div><h2>Manny\'s Plan</h2>' +
        '<p class="muted">Enter your PIN</p>' +
        '<input id="pin" class="pin-in tabnum" type="tel" inputmode="numeric" maxlength="4" autocomplete="off" placeholder="••••">' +
        '<button class="btn btn-primary big" id="unlock">Unlock</button>' +
        '<div id="pinerr" class="pinerr"></div>' +
      '</div></div>';
    const inp = document.getElementById("pin");
    inp.focus();
    function tryUnlock() {
      if (hash(inp.value) === Store.get().pinHash) { sessionStorage.setItem("manny.unlocked", "1"); boot(); }
      else { document.getElementById("pinerr").textContent = "Wrong PIN"; inp.value = ""; inp.focus(); inp.classList.add("shake"); setTimeout(() => inp.classList.remove("shake"), 400); }
    }
    document.getElementById("unlock").onclick = tryUnlock;
    inp.addEventListener("keydown", (e) => { if (e.key === "Enter" || inp.value.length === 4 && e.key.length === 1) {} });
    inp.addEventListener("input", () => { if (inp.value.length === 4) tryUnlock(); });
  }

  /* ---- Phase transition modal ---------------------------------------- */
  function maybePhaseModal() {
    const prog = Phases.progress(DateU.today()); if (!prog) return;
    const p = prog.phase, st = Store.get();
    if (st.seenPhase[p.slug]) return;
    st.seenPhase[p.slug] = true; Store.save();
    UI.sheet("You're entering " + p.name,
      '<p class="goal">🎯 ' + UI.esc(p.goal) + '</p>' +
      '<div class="change"><b>Workouts</b><br>' + UI.esc(p.workout) + '</div>' +
      '<div class="change"><b>Fintech</b><br>' + UI.esc(p.fintech) + '</div>' +
      '<div class="change"><b>Diet</b><br>' + UI.esc(p.diet) + '</div>' +
      '<button class="btn btn-primary big" data-act="closeSheet">Got it</button>');
  }

  /* ---- Boot ---------------------------------------------------------- */
  function boot() {
    Store.load();
    if (locked()) { showLock(); return; }
    document.getElementById("app").innerHTML = '<div id="view"></div><div id="navbar"></div>';
    render();
    maybePhaseModal();
  }

  return { boot, render, closeSheets, ui, hashPin: hash };
})();

/* =====================================================================
   Act — every data-act button routes here.
   ===================================================================== */
window.Act = (function () {
  const T = () => DateU.today();
  const num = (id) => { const v = parseFloat((document.getElementById(id) || {}).value); return isNaN(v) ? null : v; };
  const val = (id) => ((document.getElementById(id) || {}).value || "").trim();

  const A = {
    closeSheet() { App.closeSheets(); },

    /* Today */
    toggleBlock(el) { Store.toggleBlock(T(), el.dataset.k); App.render(); },
    water(el) { Store.addWater(T(), parseInt(el.dataset.oz, 10)); App.render(); },
    prayer(el) { const w = el.dataset.which; const dl = Store.day(T()); Store.setPrayer(T(), w, !(w === "morning" ? dl.prayerM : dl.prayerE)); App.render(); },
    mass(el) { Store.setMass(el.dataset.date, !Store.massFor(el.dataset.date)); App.render(); UI.toast("Logged 🙏"); },
    bible() { Store.bumpBible(); App.render(); UI.toast("Bible episode #" + Store.get().settings.bibleEpisode); },
    mealEat(el) { Store.setMeal(T(), el.dataset.type, "eaten"); App.render(); },
    recipe(el) { UI.sheet(DATA.dinners[+el.dataset.i].name, Screens.recipeHTML(+el.dataset.i)); },

    /* Grocery / prep */
    grocery(el) { Store.toggleGrocery(+el.dataset.i, el.dataset.field); App.render(); },
    groceryReset() { UI.confirmDialog("Reset the grocery list for a new week? Checkmarks clear.", () => { Store.resetGrocery(); App.render(); UI.toast("Fresh list"); }, "Reset"); },

    /* Workout */
    felt(el) {
      document.getElementById("f_" + el.dataset.ex + "_" + el.dataset.set).value = el.dataset.v;
      el.parentNode.querySelectorAll(".fb").forEach((b) => b.classList.remove("on")); el.classList.add("on");
    },
    finishWorkout(el) {
      const type = el.dataset.type, w = DATA.workouts.find((x) => x.type === type);
      const sets = [];
      w.exercises.forEach((e, i) => {
        for (let sn = 1; sn <= e.sets; sn++) {
          const weight = num("w_" + i + "_" + sn), reps = num("r_" + i + "_" + sn), felt = val("f_" + i + "_" + sn);
          if (weight != null || reps != null) sets.push({ ex: e.name, set: sn, weight, reps, felt: felt || null });
        }
      });
      const now = new Date().toISOString();
      Store.saveWorkout({ id: Store.uid(), date: T(), type, startedAt: now, completedAt: now, note: "", sets });
      const dt = DATA.days.find((d) => d.dow === DateU.dow(T()));
      dt.blocks.forEach((b) => { if (b.type === "workout") Store.toggleBlock(T(), b.s) === undefined; });
      // mark workout blocks done (ensure true, not toggle)
      const dl = Store.day(T()); dt.blocks.forEach((b) => { if (b.type === "workout") dl.completed[b.s] = true; }); Store.save();
      UI.toast("Workout saved 💪 " + sets.length + " sets");
      location.hash = "#/";
    },
    viewWorkout(el) {
      const l = Store.get().workoutLogs.find((x) => x.id === el.dataset.id); if (!l) return;
      const w = DATA.workouts.find((x) => x.type === l.type);
      const rows = (l.sets || []).map((s) => '<div class="wrow"><span class="b">' + UI.esc(s.ex) + '</span><span class="tabnum">' +
        (s.weight != null ? s.weight + " lb" : "—") + (s.reps != null ? " × " + s.reps : "") + '</span></div>').join("");
      UI.sheet((w ? w.name : l.type) + " · " + DateU.fmtShort(l.date), rows || '<p class="muted">No sets recorded.</p>');
    },
    progEx(el) { App.ui.progEx = el.value; App.render(); },

    /* Weight */
    addWeight() {
      UI.sheet("Log weight", '<label class="field"><span>Weight (lbs)</span><input id="wlbs" class="big-in tabnum" type="number" step="0.1" inputmode="decimal" autofocus></label>' +
        '<label class="field"><span>Note (optional)</span><input id="wnote" placeholder="e.g. post-vacation, expected"></label>' +
        '<button class="btn btn-primary big" data-act="saveWeight">Save</button>');
    },
    saveWeight() { const lbs = num("wlbs"); if (lbs == null) return UI.toast("Enter a number"); Store.addWeight({ date: T(), lbs, note: val("wnote") }); App.closeSheets(); App.render(); UI.toast("Logged " + lbs + " lb"); },

    /* Fintech */
    logFintech() {
      const opts = DATA.fintechModules.map((m) => '<option value="' + m.id + '">' + UI.esc(m.name) + '</option>').join("");
      UI.sheet("Log study session",
        '<label class="field"><span>Module</span><select id="fmod" class="sel">' + opts + '</select></label>' +
        '<label class="field"><span>Minutes</span><input id="fmin" class="big-in tabnum" type="number" inputmode="numeric"></label>' +
        '<div class="presets">' + [30, 45, 60, 75].map((m) => '<button class="chipbtn" data-act="finPreset" data-m="' + m + '">' + m + '</button>').join("") + '</div>' +
        '<label class="field"><span>What did you cover?</span><input id="fnote" placeholder="e.g. SQL window functions"></label>' +
        '<div class="seg-q">Productive? ' + UI.segmented([{ v: "yes", t: "Yes" }, { v: "partial", t: "Partial" }, { v: "no", t: "No" }], "yes", "finProd") + '</div>' +
        '<input type="hidden" id="fprod" value="yes">' +
        '<button class="btn btn-primary big" data-act="saveFintech">Save session</button>');
    },
    finPreset(el) { document.getElementById("fmin").value = el.dataset.m; },
    finProd(el) { document.getElementById("fprod").value = el.dataset.v; el.parentNode.querySelectorAll(".seg-b").forEach((b) => b.classList.remove("on")); el.classList.add("on"); },
    saveFintech() {
      const min = num("fmin"); if (min == null) return UI.toast("Enter minutes");
      Store.addFintech({ date: T(), minutes: min, module: val("fmod"), note: val("fnote"), productive: val("fprod") });
      App.closeSheets(); App.render(); UI.toast("Logged " + min + " min");
    },
    milestone(el) { Store.toggleMilestone(+el.dataset.id); App.render(); },

    /* Wedding */
    taskCycle(el) {
      const t = Store.get().weddingTasks.find((x) => x.id === +el.dataset.id);
      const next = { "open": "in-progress", "in-progress": "done", "done": "open" }[t.status];
      Store.setTaskStatus(t.id, next); App.render();
    },
    taskMonth(el) { App.ui.taskMonth = el.value; App.render(); },
    taskStatus(el) { App.ui.taskStatus = el.dataset.v; App.render(); },
    addTask() {
      const months = Object.keys(DATA.monthLabels).map((k) => '<option value="' + k + '">' + UI.esc(DATA.monthLabels[k]) + '</option>').join("");
      UI.sheet("Add wedding task",
        '<label class="field"><span>Task</span><input id="tt" autofocus></label>' +
        '<label class="field"><span>Details</span><input id="td"></label>' +
        '<label class="field"><span>Month</span><select id="tm" class="sel">' + months + '</select></label>' +
        '<label class="field"><span>Who</span><select id="tw" class="sel"><option value="manny">Manny</option><option value="nicole">Nicole</option><option value="both">Both</option><option value="coordinator">Coordinator</option><option value="vendor">Vendor</option></select></label>' +
        '<label class="field"><span>Priority</span><select id="tp" class="sel"><option value="high">High</option><option value="medium">Medium</option><option value="low">Low</option></select></label>' +
        '<button class="btn btn-primary big" data-act="saveTask">Add task</button>');
    },
    saveTask() { const title = val("tt"); if (!title) return UI.toast("Enter a task"); Store.addTask({ title, desc: val("td"), month: val("tm"), who: val("tw"), priority: val("tp") }); App.closeSheets(); App.render(); UI.toast("Task added"); },

    editVendor(el) {
      const v = Store.get().vendors.find((x) => x.id === +el.dataset.id);
      const opt = (s, t) => '<option value="' + s + '"' + (v.status === s ? " selected" : "") + '>' + t + '</option>';
      UI.sheet("Edit " + v.name,
        '<input type="hidden" id="vid" value="' + v.id + '">' +
        '<label class="field"><span>Contract status</span><select id="vstatus" class="sel">' +
          opt("no-contract", "No contract") + opt("sent", "Sent") + opt("signed", "Signed") + opt("complete", "Complete") + '</select></label>' +
        '<label class="field"><span>Cost ($)</span><input id="vcost" type="number" inputmode="numeric" value="' + (v.cost || "") + '"></label>' +
        '<label class="field"><span>Notes</span><textarea id="vnotes" rows="3">' + UI.esc(v.notes || "") + '</textarea></label>' +
        '<button class="btn btn-primary big" data-act="saveVendor">Save</button>');
    },
    saveVendor() {
      const id = +val("vid"), v = Store.get().vendors.find((x) => x.id === id);
      v.status = val("vstatus"); v.cost = num("vcost"); v.notes = val("vnotes");
      Store.saveVendor(v); App.closeSheets(); App.render(); UI.toast("Vendor saved");
    },

    memToggle(el) { const m = Store.get().memoriam.find((x) => x.id === +el.dataset.id); m[el.dataset.field] = !m[el.dataset.field]; Store.saveMemoriam(m); App.render(); },
    editMem(el) {
      const m = Store.get().memoriam.find((x) => x.id === +el.dataset.id);
      UI.sheet("Edit",
        '<input type="hidden" id="mid" value="' + m.id + '">' +
        '<label class="field"><span>Name</span><input id="mname" value="' + UI.esc(m.name) + '" autofocus></label>' +
        '<label class="field"><span>Relationship</span><input id="mrel" value="' + UI.esc(m.rel) + '"></label>' +
        '<label class="field"><span>Notes</span><textarea id="mnotes" rows="2">' + UI.esc(m.notes || "") + '</textarea></label>' +
        '<button class="btn btn-primary big" data-act="saveMem">Save</button>');
    },
    saveMem() { const id = +val("mid"), m = Store.get().memoriam.find((x) => x.id === id); m.name = val("mname"); m.rel = val("mrel"); m.notes = val("mnotes"); Store.saveMemoriam(m); App.closeSheets(); App.render(); UI.toast("Saved"); },

    /* Review */
    saveReview(el) {
      const d = el.dataset;
      Store.addReview({
        week: d.week, workouts: +d.workouts, lunches: +d.lunches, fintech: d.fintech,
        reflection_workouts: val("reflection_workouts"), reflection_lunch: val("reflection_lunch"),
        reflection_fintech: val("reflection_fintech"), reflection_sleep: val("reflection_sleep"),
        reflection_next_week_focus: val("reflection_next_week_focus"), completedAt: new Date().toISOString()
      });
      App.render(); UI.toast("Review saved 🙏");
    },

    /* Profile + settings */
    editProfile() {
      const p = Store.get().profile;
      UI.sheet("Edit profile",
        '<label class="field"><span>Name</span><input id="pname" value="' + UI.esc(p.name) + '"></label>' +
        '<label class="field"><span>Height (inches)</span><input id="pht" type="number" value="' + p.heightIn + '"></label>' +
        '<label class="field"><span>Starting weight</span><input id="psw" type="number" value="' + p.startWeight + '"></label>' +
        '<label class="field"><span>Target weight</span><input id="ptw" type="number" value="' + p.targetWeight + '"></label>' +
        '<label class="field"><span>Wedding date</span><input id="pwd" type="date" value="' + p.weddingDate + '"></label>' +
        '<button class="btn btn-primary big" data-act="saveProfile">Save</button>');
    },
    saveProfile() {
      const p = Store.get().profile;
      p.name = val("pname") || p.name; p.heightIn = num("pht") || p.heightIn;
      p.startWeight = num("psw") || p.startWeight; p.targetWeight = num("ptw") || p.targetWeight;
      p.weddingDate = val("pwd") || p.weddingDate; Store.save(); App.closeSheets(); App.render(); UI.toast("Profile updated");
    },
    setPin() {
      UI.sheet("Set a 4-digit PIN", '<label class="field"><span>New PIN</span><input id="np" class="pin-in tabnum" type="tel" inputmode="numeric" maxlength="4" placeholder="••••"></label>' +
        '<button class="btn btn-primary big" data-act="savePin">Save PIN</button>');
    },
    savePin() { const p = val("np"); if (!/^\d{4}$/.test(p)) return UI.toast("Enter 4 digits"); Store.setPin(App.hashPin(p)); sessionStorage.setItem("manny.unlocked", "1"); App.closeSheets(); App.render(); UI.toast("PIN set 🔒"); },
    removePin() { Store.setPin(null); App.render(); UI.toast("PIN removed"); },

    exportData() {
      const blob = new Blob([Store.exportJSON()], { type: "application/json" });
      const a = document.createElement("a"); a.href = URL.createObjectURL(blob);
      a.download = "manny-plan-backup-" + T() + ".json"; document.body.appendChild(a); a.click(); a.remove();
      UI.toast("Backup downloaded");
    },
    importData() {
      const inp = document.createElement("input"); inp.type = "file"; inp.accept = "application/json";
      inp.onchange = () => { const f = inp.files[0]; if (!f) return; f.text().then((t) => { try { Store.importJSON(t); App.ui.taskMonth = undefined; App.render(); UI.toast("Backup restored"); } catch (e) { UI.toast("Could not read that file"); } }); };
      inp.click();
    },
    resetAll() { UI.confirmDialog("Erase ALL your logged data and start fresh? This cannot be undone.", () => { Store.reset(); App.render(); UI.toast("Reset complete"); }, "Erase everything"); }
  };
  return A;
})();

/* ---- Global event wiring -------------------------------------------- */
document.addEventListener("click", function (e) {
  const el = e.target.closest("[data-act]");
  if (!el || el.tagName === "SELECT") return;
  const act = el.dataset.act;
  if (Act[act]) { e.preventDefault(); Act[act](el); }
});
document.addEventListener("change", function (e) {
  const el = e.target.closest("[data-act]");
  if (!el || el.tagName !== "SELECT") return;
  if (Act[el.dataset.act]) Act[el.dataset.act](el);
});
window.addEventListener("hashchange", function () { App.render(); });
window.addEventListener("DOMContentLoaded", function () {
  App.boot();
  if ("serviceWorker" in navigator) { try { navigator.serviceWorker.register("sw.js"); } catch (e) {} }
});
