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
    "wedding": S.wedding, "wedding/vendors": S.vendors, "wedding/memoriam": S.memoriam, "wedding/calendar": S.weddingCal,
    "faith": S.faith, "review": S.review, "stats": S.stats, "more": S.more, "settings": S.settings, "settings/foods": S.foodList
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

    /* Today / Planner */
    toggleBlock(el) {
      const key = el.dataset.k;
      const date = el.dataset.date || T();
      const wasDone = !!Store.day(date).completed[key];
      Store.toggleBlock(date, key);
      App.render();
      if (!wasDone && date === T()) Act.maybeEarlyFinish(key); // only real-time completions
    },
    dayNav(el) {
      const cur = App.ui.viewDate || T();
      const nd = DateU.addDays(cur, +el.dataset.d);
      App.ui.viewDate = nd === T() ? null : nd;
      App.render();
    },
    jumpToday() { App.ui.viewDate = null; App.closeSheets(); App.render(); },
    pickDate() {
      const v = App.ui.viewDate || T();
      UI.sheet("Jump to a date",
        '<label class="field"><span>See your plan for any day</span><input type="date" id="jumpdate" value="' + v + '"></label>' +
        '<button class="btn btn-primary big" data-act="jumpDate">Go</button>' +
        '<button class="btn btn-ghost big" data-act="jumpToday">Back to today</button>');
    },
    jumpDate() {
      const v = val("jumpdate");
      if (!/^\d{4}-\d{2}-\d{2}$/.test(v)) return UI.toast("Pick a date first");
      App.ui.viewDate = v === T() ? null : v;
      App.closeSheets(); App.render();
    },
    addCustom(el) {
      const date = el.dataset.date || App.ui.viewDate || T();
      UI.sheet("Add to " + DateU.fmt(date),
        '<input type="hidden" id="cdate" value="' + date + '">' +
        '<label class="field"><span>What is it?</span><input id="ctitle" placeholder="e.g. Father\'s Day in Baxley" autofocus></label>' +
        '<label class="chkrow"><input type="checkbox" id="callday"> This takes the whole day</label>' +
        '<div id="ctimes">' +
          '<label class="field"><span>Starts</span><input type="time" id="cstart" value="19:00"></label>' +
          '<label class="field"><span>Ends</span><input type="time" id="cend" value="20:30"></label>' +
        '</div>' +
        '<label class="field"><span>Where? (optional)</span><input id="cloc" placeholder="e.g. Baxley, GA"></label>' +
        '<div class="field"><span>Driving there? One-way drive time:</span>' +
          '<div class="presets">' +
            [0, 30, 60, 90, 120, 180].map((m) => '<button type="button" class="chipbtn drv' + (m === 0 ? " on" : "") + '" data-min="' + m + '">' +
              (m ? (m >= 60 ? (m / 60) + (m % 60 ? ".5" : "") + " hr" : m + " min") : "No drive") + '</button>').join("") +
          '</div><input type="hidden" id="cdrive" value="0"></div>' +
        '<label class="field" id="cleavewrap" style="display:none"><span>When do you plan to leave?</span><input type="time" id="cleave"></label>' +
        '<label class="field"><span>Note (optional)</span><input id="cnote" placeholder="who, what to bring"></label>' +
        '<button class="btn btn-primary big" data-act="saveCustom">Add it</button>',
        (body) => {
          body.querySelector("#callday").addEventListener("change", (ev) => {
            body.querySelector("#ctimes").style.display = ev.target.checked ? "none" : "";
          });
          body.querySelectorAll(".drv").forEach((btn) => btn.addEventListener("click", () => {
            body.querySelectorAll(".drv").forEach((x) => x.classList.remove("on"));
            btn.classList.add("on");
            const m = +btn.dataset.min;
            body.querySelector("#cdrive").value = m;
            const wrap = body.querySelector("#cleavewrap");
            wrap.style.display = m ? "" : "none";
            if (m) {
              const lv = body.querySelector("#cleave");
              if (!lv.value) {
                const allDay = body.querySelector("#callday").checked;
                const s = body.querySelector("#cstart").value;
                lv.value = allDay || !/^\d\d:\d\d$/.test(s) ? "08:30" : DateU.fromMin(Math.max(0, DateU.toMin(s) - m));
              }
            }
          }));
        });
    },
    saveCustom() {
      const date = val("cdate"), title = val("ctitle"), note = val("cnote"), loc = val("cloc");
      const allDay = !!(document.getElementById("callday") || {}).checked;
      const drive = +val("cdrive") || 0;
      if (!title) return UI.toast("Give it a name");
      let s, e;
      if (allDay) { s = "00:00"; e = "23:59"; }
      else {
        s = val("cstart"); const e0 = val("cend");
        if (!/^\d\d:\d\d$/.test(s)) return UI.toast("Pick a start time");
        e = (/^\d\d:\d\d$/.test(e0) && DateU.toMin(e0) > DateU.toMin(s)) ? e0 : DateU.fromMin(DateU.toMin(s) + 60);
      }
      const dl = Store.day(date);
      dl.custom = dl.custom || [];
      const id = Date.now().toString(36);
      dl.custom.push({ id, s, e, title, note, loc, allDay });
      // travel legs: there (at your chosen leave time) and, for timed events, back
      let spanS = DateU.toMin(s), spanE = DateU.toMin(e);
      if (loc && drive) {
        const lv0 = val("cleave");
        const lv = /^\d\d:\d\d$/.test(lv0) ? lv0 : (allDay ? "08:30" : DateU.fromMin(Math.max(0, DateU.toMin(s) - drive)));
        dl.custom.push({ id: id + "a", parent: id, travel: true, loc, s: lv, e: DateU.fromMin(Math.min(1439, DateU.toMin(lv) + drive)), title: "Drive to " + loc });
        spanS = Math.min(spanS, DateU.toMin(lv));
        if (!allDay) {
          const backE = Math.min(1439, DateU.toMin(e) + drive);
          dl.custom.push({ id: id + "b", parent: id, travel: true, loc, s: e, e: DateU.fromMin(backE), title: "Drive home from " + loc });
          spanE = Math.max(spanE, backE);
        }
      }
      Store.save(); App.closeSheets(); App.render();
      // conflict pass: everything planned that this (plus the driving) runs over
      const dt = DATA.days.find((d) => d.dow === DateU.dow(date));
      const overl = dt ? dt.blocks.filter((b) => !dl.skipped[b.s] &&
        DateU.toMin(b.s) < spanE && DateU.toMin(b.e) > spanS &&
        ["wake", "rest"].indexOf(b.type) < 0) : [];
      if (!overl.length) return UI.toast("Added 📌");
      UI.sheet("Make room for " + title + "?",
        '<p class="found"><b>' + UI.esc(title) + '</b>' + (allDay ? " takes the whole day" : (loc && drive ? " (driving included)" : "")) +
          ' and runs over <b>' + overl.length + '</b> planned block' + (overl.length === 1 ? "" : "s") + ' on ' + DateU.fmt(date) +
          '. Skip the ones you won\'t get to — uncheck anything you\'ll still do:</p>' +
        overl.map((b) => '<label class="confl"><input type="checkbox" checked data-skipk="' + b.s + '">' +
          '<span><b class="tabnum">' + DateU.time12c(b.s) + '–' + DateU.time12c(b.e) + '</b> &nbsp;' + UI.esc(b.title) + '</span></label>').join("") +
        '<button class="btn btn-primary big" data-act="applyConflicts" data-date="' + date + '" data-t="' + UI.esc(title) + '">Skip checked &amp; make room</button>' +
        '<button class="btn btn-ghost big" data-act="closeSheet">Keep everything</button>');
    },
    applyConflicts(el) {
      const date = el.dataset.date;
      let n = 0;
      document.querySelectorAll(".sheet-back [data-skipk]").forEach((cb) => {
        if (cb.checked) { Store.skipBlock(date, cb.dataset.skipk, "cleared for " + el.dataset.t); n++; }
      });
      App.closeSheets(); App.render();
      UI.toast(n ? "Cleared " + n + " block" + (n === 1 ? "" : "s") + " — enjoy it 🎉" : "Kept everything");
    },
    delCustom(el) {
      const date = el.dataset.date || T();
      UI.confirmDialog("Remove this from the day? Any drive blocks that came with it go too.", () => {
        const dl = Store.day(date);
        const id = el.dataset.id;
        (dl.custom || []).forEach((c) => { if (c.id === id || c.parent === id) delete dl.completed["cus" + c.id]; });
        dl.custom = (dl.custom || []).filter((c) => c.id !== id && c.parent !== id);
        Store.save(); App.render();
      }, "Remove");
    },
    skipDay(el) {
      const date = el.dataset.date || T();
      Store.skipBlock(date, el.dataset.k, "making room for plans");
      App.render(); UI.toast("Skipped for " + DateU.fmtShort(date) + " — tap Restore to undo");
    },
    restoreBlock(el) {
      const date = el.dataset.date || T();
      const dl = Store.day(date); delete dl.skipped[el.dataset.k]; Store.save(); App.render();
    },
    /* Busy map: tap a day → wedding picture for that day */
    calDay(el) {
      const d = el.dataset.date;
      UI.sheet(DateU.fmtLong(d), Screens.calDaySheet(d));
    },
    openPlanner(el) {
      const d = el.dataset.date;
      App.ui.viewDate = d === T() ? null : d;
      App.closeSheets();
      if (location.hash === "#/" || location.hash === "") App.render(); else location.hash = "#/";
    },
    /* Overdue banner: jump to the slipped month's open tasks */
    weddingCatchup(el) {
      App.ui.taskMonth = el.dataset.m || "all";
      App.ui.taskStatus = "open";
      App.closeSheets();
      if (location.hash === "#/wedding") App.render(); else location.hash = "#/wedding";
    },
    /* Finished a block early? Offer found-time ideas + shifting the rest of
       the day earlier. Fires once per block per day. */
    maybeEarlyFinish(key) {
      if (!/^\d\d:\d\d$/.test(key)) return; // ignore checklist pseudo-keys (prep0 etc.)
      const dt = DATA.days.find((d) => d.dow === DateU.dow(T()));
      if (!dt) return;
      const idx = dt.blocks.findIndex((b) => b.s === key);
      if (idx < 0) return;
      const b = dt.blocks[idx];
      const okTypes = ["meal", "workout", "shower", "meal-prep", "wedding-checkin", "wedding-block", "flex", "mass", "review", "fintech", "work"];
      if (okTypes.indexOf(b.type) < 0) return;
      const nowM = DateU.nowMinutes();
      const found = DateU.toMin(b.e) - nowM;
      if (found < 15) return;
      const dl = Store.day(T());
      dl.earlyOffered = dl.earlyOffered || {};
      if (dl.earlyOffered[key]) return;
      dl.earlyOffered[key] = true; Store.save();

      const later = dt.blocks.slice(idx + 1).filter((x) => !dl.completed[x.s]);
      const canShift = later.length > 0 && !dl.shift;
      const shiftMin = Math.min(60, Math.floor(found / 5) * 5);
      const evening = DateU.toMin(b.s) >= 17 * 60;
      const lastB = dt.blocks[dt.blocks.length - 1];
      const newLights = DateU.time12(DateU.fromMin(DateU.toMin(lastB.s) - shiftMin));

      // found-time ideas, tuned to the moment
      const dow = DateU.dow(T());
      const sugs = [];
      if (evening) {
        sugs.push({ i: "🍽️", t: "Knock out the dishes while the kitchen's still warm" });
        sugs.push({ i: "🧺", t: "Start a load of laundry — it runs while you relax" });
        if (dow >= 0 && dow <= 4) sugs.push({ i: "🥗", t: "Pack tomorrow's lunch now, skip the morning scramble" });
        const tmrw = DATA.days.find((d) => d.dow === (dow + 1) % 7);
        if (tmrw && tmrw.workoutType) sugs.push({ i: "🎒", t: "Set the gym bag by the door for tomorrow" });
      } else {
        sugs.push({ i: "🧺", t: "Sneak in a load of laundry" });
        sugs.push({ i: "🚶", t: "10-minute walk — free steps, clears the head" });
      }
      const open = Store.get().weddingTasks.filter((t) => t.status !== "done");
      const pr = { high: 0, medium: 1, low: 2 };
      open.sort((a, c) => pr[a.priority] - pr[c.priority]);
      const rows = sugs.slice(0, 3).map((s) =>
        '<div class="sug"><span>' + s.i + '</span><div>' + UI.esc(s.t) + '</div></div>').join("") +
        (open.length ? '<div class="sug tap" data-act="goWedding"><span>💍</span><div>Wedding quick win: ' + UI.esc(open[0].title) + '</div><span class="nchev">›</span></div>' : "");

      UI.sheet("Finished early 🎉",
        '<p class="found">You wrapped up <b>' + UI.esc(b.title) + '</b> about <b>' + found + ' minutes</b> ahead of schedule. A few ways to spend it:</p>' +
        rows +
        (canShift ? '<button class="btn btn-primary big" data-act="shiftDay" data-from="' + b.s + '" data-min="' + shiftMin + '">⏩ Pull the rest of ' + (evening ? "tonight" : "today") + ' ' + shiftMin + ' min earlier' + (evening ? " — lights out " + newLights : "") + '</button>' : "") +
        '<button class="btn btn-ghost big" data-act="closeSheet">Keep the schedule as-is</button>');
    },
    shiftDay(el) {
      const dl = Store.day(T());
      dl.shift = { from: el.dataset.from, min: +el.dataset.min };
      Store.save(); App.closeSheets(); App.render();
      UI.toast("Rest of today moved " + el.dataset.min + " min earlier ⏩");
    },
    unshift() {
      const dl = Store.day(T()); delete dl.shift; Store.save(); App.render();
      UI.toast("Back to the planned times");
    },
    goWedding() { App.closeSheets(); location.hash = "#/wedding"; },
    water(el) { Store.addWater(T(), parseInt(el.dataset.oz, 10)); App.render(); },
    prayer(el) { const w = el.dataset.which; const dl = Store.day(T()); Store.setPrayer(T(), w, !(w === "morning" ? dl.prayerM : dl.prayerE)); App.render(); },
    mass(el) { Store.setMass(el.dataset.date, !Store.massFor(el.dataset.date)); App.render(); UI.toast("Logged 🙏"); },
    bible() { Store.bumpBible(); App.render(); UI.toast("Bible episode #" + Store.get().settings.bibleEpisode); },
    mealEat(el) { Store.setMeal(T(), el.dataset.type, "eaten"); App.render(); },
    recipe(el) { UI.sheet(DATA.dinners[+el.dataset.i].name, Screens.recipeHTML(+el.dataset.i)); },
    addFood() {
      UI.sheet("Add food",
        '<label class="field"><span>Type what you ate — plain English</span>' +
          '<textarea id="fdtext" rows="2" placeholder="2 hard-boiled eggs and 2 sourdough toast"></textarea></label>' +
        '<button type="button" class="btn btn-ghost big" data-act="lookupFood">🔎 Look up the calories</button>' +
        '<div id="fdresults" class="fdresults"></div>' +
        '<div class="fdman"><button type="button" class="link" data-act="foodManual">or enter the calories myself ›</button>' +
          '<div id="fdmanwrap" style="display:none">' +
            '<label class="field"><span>Food</span><input id="fdname" placeholder="e.g. Protein bar"></label>' +
            '<label class="field"><span>Calories</span><input id="fdcal" class="big-in tabnum" type="number" inputmode="numeric"></label>' +
            '<div class="presets">' + [100, 150, 200, 300, 500].map((c) => '<button type="button" class="chipbtn" data-act="foodPreset" data-c="' + c + '">' + c + '</button>').join("") + '</div>' +
            '<label class="field"><span>Protein (g, optional)</span><input id="fdprot" type="number" inputmode="numeric"></label>' +
            '<button class="btn btn-primary big" data-act="saveFood">Add it</button>' +
          '</div></div>');
    },
    foodManual() { const w = document.getElementById("fdmanwrap"); if (!w) return; w.style.display = w.style.display === "none" ? "" : "none"; if (w.style.display === "") { const n = document.getElementById("fdname"); if (n) n.focus(); } },
    foodPreset(el) { const c = document.getElementById("fdcal"); if (c) c.value = el.dataset.c; },
    lookupFood() {
      const r = Act.parseFoods(val("fdtext"));
      App.ui._pf = r.items;
      const res = document.getElementById("fdresults"); if (!res) return;
      if (!r.items.length && !r.unmatched.length) { res.innerHTML = '<p class="muted" style="margin:8px 2px">Type what you ate above, then look it up.</p>'; return; }
      const qf = (q) => q === 0.5 ? "½" : String(q);
      let cal = 0, p = 0;
      const rows = r.items.map((it) => { const c = it.food.cal * it.qty, pp = (it.food.p || 0) * it.qty; cal += c; p += pp; return '<div class="pfrow"><span>' + qf(it.qty) + '× ' + UI.esc(it.food.n) + ' <span class="muted">(' + UI.esc(it.food.u) + ')</span></span><b class="tabnum">' + Math.round(c) + ' cal</b></div>'; }).join("");
      const un = r.unmatched.length ? '<div class="pfun">Couldn’t find: <b>' + r.unmatched.map(UI.esc).join(", ") + '</b> — add those with “enter the calories myself” below.</div>' : "";
      res.innerHTML = rows + un +
        (r.items.length ? '<div class="pftot"><span>Total</span><b class="tabnum">' + Math.round(cal) + ' cal · ' + Math.round(p) + ' g protein</b></div>' +
          '<button class="btn btn-primary big" data-act="addParsed">Add ' + r.items.length + ' item' + (r.items.length === 1 ? "" : "s") + ' to today</button>' : "");
    },
    addParsed() {
      const items = App.ui._pf || [];
      const qf = (q) => q === 0.5 ? "½" : String(q);
      let n = 0;
      items.forEach((it) => { Store.addFood(T(), { name: qf(it.qty) + "× " + it.food.n, cal: Math.round(it.food.cal * it.qty), protein: Math.round((it.food.p || 0) * it.qty) }); n++; });
      App.ui._pf = null; App.closeSheets(); App.render(); UI.toast(n ? "Added " + n + " item" + (n === 1 ? "" : "s") + " 🍽️" : "Nothing matched");
    },
    parseFoods(text) {
      const W = { one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10, a: 1, an: 1, half: 0.5, couple: 2, dozen: 12 };
      const items = [], unmatched = [];
      (text || "").toLowerCase().replace(/&/g, " and ").replace(/\b(with|plus|on|over|topped)\b/g, ",")
        .split(/,|\band\b|\n|\+/).map((s) => s.trim()).filter(Boolean)
        .forEach((frag) => {
          let qty = 1, rest = frag;
          const m = frag.match(/^(\d+(?:\.\d+)?)\s*(.*)$/);
          if (m) { qty = parseFloat(m[1]); rest = m[2]; }
          else { const wm = frag.match(/^([a-z]+)\s+(.*)$/); if (wm && W[wm[1]] != null) { qty = W[wm[1]]; rest = wm[2]; } }
          rest = rest.replace(/\b(pieces?|slices?|cups?|servings?|scoops?|cloves?|bowls?|glass(?:es)?|cans?|bottles?|orders?|handful|of|some|fresh|big|small|the|a|an)\b/g, " ").replace(/[^a-z ]/g, " ").replace(/\s+/g, " ").trim();
          if (!rest) { if (frag) unmatched.push(frag.trim()); return; }
          const f = Act._matchFood(rest);
          if (f) items.push({ food: f, qty: qty || 1 }); else unmatched.push(frag.trim());
        });
      return { items, unmatched };
    },
    _matchFood(str) {
      const F = Store.foodDb(); let best = null, bl = 0;
      for (let i = 0; i < F.length; i++) { const ks = F[i].k; for (let j = 0; j < ks.length; j++) { const k = ks[j]; if (str.indexOf(k) >= 0 && k.length > bl) { best = F[i]; bl = k.length; } } }
      return best;
    },
    saveFood() {
      const name = val("fdname"), cal = num("fdcal");
      if (!name) return UI.toast("Name it");
      if (cal == null) return UI.toast("Enter calories");
      Store.addFood(T(), { name, cal, protein: num("fdprot") || 0 });
      App.closeSheets(); App.render(); UI.toast("Added " + cal + " cal");
    },
    delFood(el) { Store.delFood(T(), el.dataset.id); App.render(); },

    /* Editable food library (Settings → Food list) */
    editFoodDb(el) { const f = Store.foodDb().find((x) => x.id === +el.dataset.id); if (f) Act._foodForm("Edit food", f); },
    addFoodDb() { Act._foodForm("Add a food", null); },
    _foodForm(title, f) {
      f = f || {};
      UI.sheet(title,
        '<input type="hidden" id="fdid" value="' + (f.id != null ? f.id : "") + '">' +
        '<label class="field"><span>Name</span><input id="fdn" value="' + UI.esc(f.n || "") + '" autofocus></label>' +
        '<label class="field"><span>Portion / unit</span><input id="fdu" value="' + UI.esc(f.u || "") + '" placeholder="e.g. slice, 1 cup, egg"></label>' +
        '<label class="field"><span>Calories per ' + (f.u ? UI.esc(f.u) : "unit") + '</span><input id="fdc" class="big-in tabnum" type="number" inputmode="numeric" value="' + (f.cal != null ? f.cal : "") + '"></label>' +
        '<label class="field"><span>Protein (g)</span><input id="fdpr" type="number" inputmode="numeric" value="' + (f.p != null ? f.p : "") + '"></label>' +
        '<label class="field"><span>Match words <small class="muted">(comma-separated — what you might type)</small></span><input id="fdk" value="' + UI.esc((f.k || []).join(", ")) + '" placeholder="auto-filled from the name"></label>' +
        '<button class="btn btn-primary big" data-act="saveFoodDb">Save</button>' +
        (f.id != null ? '<button class="btn btn-ghost big danger" data-act="delFoodDb" data-id="' + f.id + '">🗑 Delete this food</button>' : ""));
    },
    saveFoodDb() {
      const id = val("fdid"), n = val("fdn"), cal = num("fdc");
      if (!n) return UI.toast("Name it");
      if (cal == null) return UI.toast("Enter calories");
      let kw = val("fdk").toLowerCase().split(",").map((s) => s.trim()).filter(Boolean);
      if (kw.indexOf(n.toLowerCase()) < 0) kw.push(n.toLowerCase());
      const rec = { n, u: val("fdu") || "serving", cal, p: num("fdpr") || 0, k: kw };
      if (id === "") Store.addFoodDb(rec); else Store.setFoodDb(Object.assign({ id: +id }, rec));
      App.closeSheets(); App.render(); UI.toast("Saved");
    },
    delFoodDb(el) { const id = +el.dataset.id; UI.confirmDialog("Remove this food from your list?", () => { Store.delFoodDb(id); App.closeSheets(); App.render(); UI.toast("Deleted"); }, "Delete"); },
    resetFoodDb() { UI.confirmDialog("Reset the food list back to the built-in foods? Foods you added or edited will be lost.", () => { Store.resetFoodDb(); App.render(); UI.toast("Food list reset"); }, "Reset"); },

    /* Grocery / prep */
    grocery(el) { Store.toggleGrocery(+el.dataset.i, el.dataset.field); App.render(); },
    groceryReset() { UI.confirmDialog("Reset the grocery list for a new week? Checkmarks clear.", () => { Store.resetGrocery(); App.render(); UI.toast("Fresh list"); }, "Reset"); },

    /* Workout */
    felt(el) {
      const ex = el.dataset.ex, sn = el.dataset.set;
      const wIn = document.getElementById("w_" + ex + "_" + sn);
      if (wIn && wIn.disabled) return; // row already saved — tap ✓ to unlock first
      document.getElementById("f_" + ex + "_" + sn).value = el.dataset.v;
      el.parentNode.querySelectorAll(".fb").forEach((b) => b.classList.remove("on")); el.classList.add("on");
      Act.stashRow(+ex, +sn);
    },
    // Auto-save what's typed (draft, not locked) so nothing is lost on close
    stashRow(ex, sn) {
      const dt = DATA.days.find((d) => d.dow === DateU.dow(T()));
      if (!dt || !dt.workoutType) return;
      Store.setDraftSet(T(), dt.workoutType, ex + "_" + sn, {
        weight: num("w_" + ex + "_" + sn), reps: num("r_" + ex + "_" + sn),
        felt: val("f_" + ex + "_" + sn) || null, done: false
      });
    },
    // ✓ on a set row: save + lock (gray out, values stay visible). Tap again to edit.
    saveSet(el) {
      const ex = +el.dataset.ex, sn = +el.dataset.set;
      const dt = DATA.days.find((d) => d.dow === DateU.dow(T()));
      if (!dt || !dt.workoutType) return;
      const row = document.getElementById("row_" + ex + "_" + sn);
      const wIn = document.getElementById("w_" + ex + "_" + sn), rIn = document.getElementById("r_" + ex + "_" + sn);
      const vals = { weight: num("w_" + ex + "_" + sn), reps: num("r_" + ex + "_" + sn), felt: val("f_" + ex + "_" + sn) || null };
      const locked = el.classList.contains("on");
      if (!locked && vals.weight == null && vals.reps == null) return UI.toast("Type the weight or reps first");
      Store.setDraftSet(T(), dt.workoutType, ex + "_" + sn, Object.assign(vals, { done: !locked }));
      el.classList.toggle("on", !locked);
      el.title = locked ? "Save this set" : "Saved — tap to edit";
      if (row) row.classList.toggle("saved", !locked);
      wIn.disabled = rIn.disabled = !locked;
      if (locked) wIn.focus();
      const pill = document.getElementById("exdone_" + ex);
      if (pill) {
        const total = document.querySelectorAll('[id^="row_' + ex + '_"]').length;
        const draft = Store.getDraft(T(), dt.workoutType);
        let n = 0;
        for (let s2 = 1; s2 <= total; s2++) { const d2 = draft && draft.sets[ex + "_" + s2]; if (d2 && d2.done) n++; }
        pill.textContent = n + "/" + total;
        pill.classList.toggle("full", n === total);
      }
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
      Store.clearDraft(T(), type);
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
    // --- task-editor helpers (shared by add + edit) ---
    monthKeyFromDate(iso) { const m = +iso.slice(5, 7), d = +iso.slice(8, 10); if (m >= 6 && m <= 10) return ["june", "july", "august", "september", "october"][m - 6]; if (m === 11 && d <= 6) return "nov-week"; return null; },
    taskMonthOpts(sel) { return Object.keys(DATA.monthLabels).map((k) => '<option value="' + k + '"' + (sel === k ? " selected" : "") + '>' + UI.esc(DATA.monthLabels[k]) + '</option>').join(""); },
    whoOptions(sel) {
      const ppl = Store.get().people || [];
      const builtins = [["manny", "Manny"], ["nicole", "Nicole"], ["both", "Both"], ["coordinator", "Coordinator"], ["vendor", "Vendor"]];
      let o = builtins.map((b) => '<option value="' + b[0] + '"' + (sel === b[0] ? " selected" : "") + '>' + b[1] + '</option>').join("");
      o += ppl.map((p) => '<option value="' + UI.esc(p) + '"' + (sel === p ? " selected" : "") + '>' + UI.esc(p) + '</option>').join("");
      if (sel && builtins.every((b) => b[0] !== sel) && ppl.indexOf(sel) < 0) o += '<option value="' + UI.esc(sel) + '" selected>' + UI.esc(sel) + '</option>';
      return o + '<option value="__new__">➕ Add someone…</option>';
    },
    whoField(sel) {
      return '<label class="field"><span>Who\'s on it?</span><select id="tw" class="sel">' + Act.whoOptions(sel) + '</select></label>' +
        '<div class="field" id="twnewwrap" style="display:none"><span>New person\'s name</span>' +
        '<div class="presets"><input id="twnew" placeholder="e.g. Aunt Rosa" style="flex:1;min-width:0"><button type="button" class="chipbtn" id="twaddbtn">Add</button></div></div>';
    },
    wirePeople(body) {
      const sel = body.querySelector("#tw"), wrap = body.querySelector("#twnewwrap"), inp = body.querySelector("#twnew"), btn = body.querySelector("#twaddbtn");
      if (!sel || !btn) return;
      sel.addEventListener("change", () => { if (sel.value === "__new__") { wrap.style.display = ""; inp.focus(); } else wrap.style.display = "none"; });
      btn.addEventListener("click", () => { const name = Store.addPerson(inp.value); if (!name) return UI.toast("Type a name"); sel.innerHTML = Act.whoOptions(name); wrap.style.display = "none"; inp.value = ""; });
    },
    addTask() {
      const dm = (App.ui.taskMonth && App.ui.taskMonth !== "all") ? App.ui.taskMonth : null;
      UI.sheet("Add wedding task",
        '<label class="field"><span>Task</span><input id="tt" autofocus></label>' +
        '<label class="field"><span>Details</span><input id="td"></label>' +
        '<label class="field"><span>Due date (optional)</span><input type="date" id="tdue"></label>' +
        '<label class="field"><span>Month</span><select id="tm" class="sel">' + Act.taskMonthOpts(dm) + '</select></label>' +
        Act.whoField("both") +
        '<label class="field"><span>Priority</span><select id="tp" class="sel"><option value="high">High</option><option value="medium" selected>Medium</option><option value="low">Low</option></select></label>' +
        '<button class="btn btn-primary big" data-act="saveTask">Add task</button>',
        (body) => Act.wirePeople(body));
    },
    saveTask() {
      const title = val("tt"); if (!title) return UI.toast("Enter a task");
      const due = val("tdue"); let month = val("tm"); if (due) { const mk = Act.monthKeyFromDate(due); if (mk) month = mk; }
      let who = val("tw"); if (who === "__new__") who = "both";
      Store.addTask({ title, desc: val("td"), month, who, priority: val("tp"), due: due || null });
      App.closeSheets(); App.render(); UI.toast("Task added" + (due ? " · due " + DateU.fmtShort(due) : ""));
    },
    editTask(el) {
      const t = Store.get().weddingTasks.find((x) => x.id === +el.dataset.id); if (!t) return;
      UI.sheet("Edit task",
        '<input type="hidden" id="eid" value="' + t.id + '">' +
        '<label class="field"><span>Task</span><input id="tt" value="' + UI.esc(t.title) + '"></label>' +
        '<label class="field"><span>Details</span><input id="td" value="' + UI.esc(t.desc || "") + '"></label>' +
        '<label class="field"><span>Due date (optional)</span><input type="date" id="tdue" value="' + (t.due || "") + '"></label>' +
        '<label class="field"><span>Month</span><select id="tm" class="sel">' + Act.taskMonthOpts(t.month) + '</select></label>' +
        Act.whoField(t.who) +
        '<label class="field"><span>Priority</span><select id="tp" class="sel">' + ["high", "medium", "low"].map((p) => '<option value="' + p + '"' + (t.priority === p ? " selected" : "") + '>' + p.charAt(0).toUpperCase() + p.slice(1) + '</option>').join("") + '</select></label>' +
        '<label class="field"><span>Status</span><select id="tstat" class="sel">' + [["open", "Open"], ["in-progress", "In progress"], ["done", "Done"]].map((s) => '<option value="' + s[0] + '"' + (t.status === s[0] ? " selected" : "") + '>' + s[1] + '</option>').join("") + '</select></label>' +
        '<button class="btn btn-primary big" data-act="saveEditTask">Save changes</button>' +
        '<button class="btn btn-ghost big danger" data-act="deleteTask" data-id="' + t.id + '">🗑 Delete task</button>',
        (body) => Act.wirePeople(body));
    },
    saveEditTask() {
      const id = +val("eid"); const title = val("tt"); if (!title) return UI.toast("Enter a task");
      const due = val("tdue"); let month = val("tm"); if (due) { const mk = Act.monthKeyFromDate(due); if (mk) month = mk; }
      let who = val("tw"); if (who === "__new__") who = "both";
      Store.setTask({ id, title, desc: val("td"), month, who, priority: val("tp"), status: val("tstat"), due: due || null });
      App.closeSheets(); App.render(); UI.toast("Task updated");
    },
    deleteTask(el) {
      const id = +el.dataset.id;
      UI.confirmDialog("Delete this task for good?", () => { Store.deleteTask(id); App.closeSheets(); App.render(); UI.toast("Task deleted"); }, "Delete");
    },

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
        week: d.week, workouts: +d.workouts, lunches: +d.lunches, prayer: +d.prayer,
        reflection_workouts: val("reflection_workouts"), reflection_lunch: val("reflection_lunch"),
        reflection_wedding: val("reflection_wedding"), reflection_sleep: val("reflection_sleep"),
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
        '<label class="field"><span>Daily calorie goal</span><input id="pcal" type="number" inputmode="numeric" value="' + (p.calorieTarget || 2100) + '"></label>' +
        '<label class="field"><span>Daily protein goal (g)</span><input id="pprot" type="number" inputmode="numeric" value="' + (p.proteinTarget || 180) + '"></label>' +
        '<label class="field"><span>Wedding date</span><input id="pwd" type="date" value="' + p.weddingDate + '"></label>' +
        '<button class="btn btn-primary big" data-act="saveProfile">Save</button>');
    },
    saveProfile() {
      const p = Store.get().profile;
      p.name = val("pname") || p.name; p.heightIn = num("pht") || p.heightIn;
      p.startWeight = num("psw") || p.startWeight; p.targetWeight = num("ptw") || p.targetWeight;
      p.calorieTarget = num("pcal") || p.calorieTarget || 2100; p.proteinTarget = num("pprot") || p.proteinTarget || 180;
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

    /* Calendar reminders (.ics) — native iPhone notifications, no server.
       Recurring alerts through Nov 6, then they stop on their own. */
    buildICS() {
      const TZ = "America/New_York";
      const UNTIL = "20261107T045959Z"; // end of Nov 6, Eastern
      const BY = ["SU", "MO", "TU", "WE", "TH", "FR", "SA"];
      const stamp = new Date().toISOString().replace(/[-:]/g, "").slice(0, 15) + "Z";
      const today = T();
      // first calendar date on/after today that falls on one of the listed weekdays
      const firstOn = (dows) => { let c = today; for (let i = 0; i < 8; i++) { if (dows.indexOf(DateU.dow(c)) >= 0) return c; c = DateU.addDays(c, 1); } return c; };
      const dtLocal = (dateISO, hm) => dateISO.replace(/-/g, "") + "T" + hm.replace(":", "") + "00";
      const lines = [
        "BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Manny's Plan//Reminders//EN",
        "CALSCALE:GREGORIAN", "X-WR-CALNAME:Manny's Plan Reminders",
        "BEGIN:VTIMEZONE", "TZID:" + TZ,
        "BEGIN:DAYLIGHT", "TZOFFSETFROM:-0500", "TZOFFSETTO:-0400", "TZNAME:EDT",
        "DTSTART:19700308T020000", "RRULE:FREQ=YEARLY;BYMONTH=3;BYDAY=2SU", "END:DAYLIGHT",
        "BEGIN:STANDARD", "TZOFFSETFROM:-0400", "TZOFFSETTO:-0500", "TZNAME:EST",
        "DTSTART:19701101T020000", "RRULE:FREQ=YEARLY;BYMONTH=11;BYDAY=1SU", "END:STANDARD",
        "END:VTIMEZONE"
      ];
      const ev = (key, dows, hm, summary) => {
        lines.push(
          "BEGIN:VEVENT",
          "UID:manny-plan-" + key + "@ediaz94.github.io",
          "DTSTAMP:" + stamp,
          "DTSTART;TZID=" + TZ + ":" + dtLocal(firstOn(dows), hm),
          "DURATION:PT5M",
          "RRULE:FREQ=WEEKLY;BYDAY=" + dows.map((d) => BY[d]).join(",") + ";UNTIL=" + UNTIL,
          "SUMMARY:" + summary,
          "BEGIN:VALARM", "ACTION:DISPLAY", "DESCRIPTION:" + summary, "TRIGGER:PT0S", "END:VALARM",
          "END:VEVENT"
        );
      };
      // 1) Leave for work — weekdays 7:10 AM
      ev("leave-work", [1, 2, 3, 4, 5], "07:10", "🚗 Leave for work by 7:15");
      // 2) Defrost tonight's dinner — named per day from the rotation
      const plan = Store.get().dinnerPlan;
      for (let d = 0; d <= 6; d++) {
        const dn = plan[d] != null ? DATA.dinners[plan[d]] : null;
        if (!dn || !dn.defrost) continue;
        const hm = (d >= 1 && d <= 5) ? "06:50" : "09:00"; // weekends sleep in
        ev("defrost-" + BY[d].toLowerCase(), [d], hm, "🧊 Freezer: take out " + dn.defrost + " — tonight is " + dn.name);
      }
      // 3) Gym days — right before the drive to the gym (or the Saturday run)
      DATA.days.forEach((day) => {
        if (!day.workoutType) return;
        const wb = day.blocks.find((b) => b.type === "workout");
        if (!wb) return;
        if (day.dow >= 1 && day.dow <= 5) {
          const isGym = day.workoutType !== "active-recovery";
          ev("gym-" + BY[day.dow].toLowerCase(), [day.dow], "16:40",
            (isGym ? "🏋️ Gym tonight — " : "🚶 After work — ") + wb.title + " at " + DateU.time12(wb.s));
        } else if (day.dow === 6) {
          ev("run-sat", [6], "07:20", "🏃 Long run this morning — 60–75 min");
        }
      });
      // 4) Water checks — twice daily
      ev("water-noon", [0, 1, 2, 3, 4, 5, 6], "12:30", "💧 Water check — you should be near 55 oz");
      ev("water-eve", [0, 1, 2, 3, 4, 5, 6], "18:45", "💧 Water check — push toward 120 oz by bedtime");
      // 5) Friday weigh-in — right at wake, before coffee
      ev("weigh-fri", [5], "06:20", "⚖️ Friday weigh-in — scale before coffee, log it in the app");
      lines.push("END:VCALENDAR");
      return lines.join("\r\n");
    },
    downloadICS() {
      const blob = new Blob([Act.buildICS()], { type: "text/calendar;charset=utf-8" });
      const a = document.createElement("a"); a.href = URL.createObjectURL(blob);
      a.download = "manny-plan-reminders.ics"; document.body.appendChild(a); a.click(); a.remove();
      UI.toast("Open the file → Add All to Calendar");
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
// Auto-stash workout inputs as you type (350 ms after the last keystroke)
let stashTimer;
document.addEventListener("input", function (e) {
  const el = e.target;
  if (el.id === "foodq") {
    const q = el.value.toLowerCase().trim();
    let n = 0;
    document.querySelectorAll(".frow").forEach(function (r) {
      const show = !q || (r.dataset.s || "").indexOf(q) >= 0;
      r.style.display = show ? "" : "none"; if (show) n++;
    });
    const c = document.getElementById("foodcount"); if (c) c.textContent = n;
    return;
  }
  if (!el.classList || !el.classList.contains("setin")) return;
  const m = el.id.match(/^[wr]_(\d+)_(\d+)$/);
  if (!m) return;
  clearTimeout(stashTimer);
  stashTimer = setTimeout(function () { Act.stashRow(+m[1], +m[2]); }, 350);
});
window.addEventListener("hashchange", function () { App.render(); });
window.addEventListener("DOMContentLoaded", function () {
  App.boot();
  if ("serviceWorker" in navigator) { try { navigator.serviceWorker.register("sw.js"); } catch (e) {} }
});
