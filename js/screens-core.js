/* =====================================================================
   SCREENS (core) — Today, Workout, Weight, Meals, Faith.
   ===================================================================== */
window.Screens = window.Screens || {};
(function (S) {
  const esc = UI.esc;

  function dayFor(dateISO) { return Store.days().find((d) => d.dow === DateU.dow(dateISO)); }

  // Noom-style nutrition coach: reads the day vs goals and nudges / gets you back on track.
  function coachMsg(nut, p, date) {
    const calT = p.calorieTarget || 2100, protT = p.proteinTarget || 180;
    const leftCal = calT - nut.cal, leftP = protT - nut.protein;
    const today = date === DateU.today();
    const late = DateU.nowMinutes() >= 19 * 60;
    if (nut.cal === 0) return { t: "Nothing logged yet — tap a meal's ✓ or add a food to start tracking.", tone: "" };
    if (leftCal < -150) return { t: "You're " + (-leftCal).toLocaleString() + " cal over today — it happens, no guilt. Get back on track: make the next thing a green one (lean protein + veggies), drink water, and reset tomorrow.", tone: "warn", link: true };
    if (leftP > 35 && leftCal < 350) return { t: "Tight on calories but " + leftP + "g short on protein — go lean: grilled chicken, shrimp, egg whites, or a protein shake.", tone: "warn", link: true };
    if (leftP > 30) return { t: leftP + "g of protein to go. A high-protein pick (chicken, Greek yogurt, shrimp, tuna) gets you there.", tone: "", link: true };
    if (leftCal > 500 && (!today || late)) return { t: "You've got " + leftCal.toLocaleString() + " cal left" + (today ? " and it's getting late" : "") + " — don't undereat; a balanced dinner fuels recovery.", tone: "", link: true };
    if (leftCal >= -50 && leftP <= 20) return { t: "Dialed in — protein on track and calories in budget. 👏 Keep favoring the 🟢 greens.", tone: "good" };
    return { t: leftCal.toLocaleString() + " cal left for the day. Keep it green and protein-forward.", tone: "" };
  }
  function workoutFor(type) { return DATA.workouts.find((w) => w.type === type) || null; }
  function blockEmoji(b) { return (DATA.mealEmojiByTitle[b.title]) || DATA.blockIcon[b.type] || "•"; }

  function topbar(title, right) {
    return '<div class="topbar"><h1>' + esc(title) + '</h1>' + (right || "") + '</div>';
  }
  function subbar(title, backHref) {
    return '<div class="topbar sub">' +
      '<a class="back" href="' + (backHref || "#/more") + '">‹</a>' +
      '<h1>' + esc(title) + '</h1><span style="width:30px"></span></div>';
  }

  /* ===================== TODAY ===================== */
  S.today = function () {
    const realToday = DateU.today();
    const date = App.ui.viewDate || realToday;
    const isToday = date === realToday;
    const isFuture = date > realToday;
    const dt = dayFor(date);
    const prog = Phases.progress(date);
    const dtw = Phases.daysToWedding(date);
    const dl = Store.day(date);
    const prof = Store.get().profile;
    const onboarded = !!(Store.get().schedule && Store.get().schedule.length);
    const dinnerIdx = Store.get().dinnerPlan[DateU.dow(date)];
    const todaysDinner = dinnerIdx != null ? DATA.dinners[dinnerIdx] : null;
    // Active "pull the evening earlier" shift: display-only — completion keys
    // stay tied to the template times.
    const sh = dl.shift || null;
    const eff = dt.blocks.map((b) => (sh && b.s > sh.from)
      ? { s: DateU.fromMin(DateU.toMin(b.s) - sh.min), e: DateU.fromMin(DateU.toMin(b.e) - sh.min) }
      : { s: b.s, e: b.e });

    let phaseCard;
    if (onboarded) {
      const tracks = Store.tracks();
      const greet = (function () { const h = new Date().getHours(); return h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening"; })();
      if (tracks.event && prof.eventDate) {
        phaseCard = '<div class="phase">' +
          '<div class="label">' + esc(prof.eventName || "Your big day") + ' · ' + esc(DateU.fmtShort(prof.eventDate)) + '</div>' +
          '<div class="pname">' + greet + ', ' + esc(prof.name) + '.</div>' +
          '<div class="count"><b class="tabnum">' + (dtw >= 0 ? dtw : 0) + '</b><span>days to go' + (prof.partner ? '<br>you &amp; ' + esc(prof.partner) : '') + '</span></div></div>';
      } else {
        phaseCard = '<div class="phase"><div class="label">' + esc(DateU.fmtLong(date)) + '</div>' +
          '<div class="pname">' + greet + ', ' + esc(prof.name) + '. Let\'s make it count.</div></div>';
      }
    } else if (prog) {
      const p = prog.phase, pct = prog.dayN / prog.total * 100;
      phaseCard =
        '<div class="phase">' +
          '<div class="label">' + esc(p.name.replace(":", " ·")) + '</div>' +
          '<div class="pname">' + esc(p.goal) + '</div>' +
          '<div class="psub">Day ' + prog.dayN + ' of ' + prog.total + ' · ends ' + DateU.fmtShort(p.end) + '</div>' +
          '<div class="count"><b class="tabnum">' + (dtw >= 0 ? dtw : 0) + '</b>' +
            '<span>days until you marry ' + esc(prof.partner) + '<br>Nov 6 · ' + esc(prof.weddingVenue) + '</span></div>' +
          '<div class="pbar"><i style="width:' + pct.toFixed(0) + '%"></i></div>' +
        '</div>';
    } else {
      const pre = date < DATA.phases[0].start;
      phaseCard = '<div class="phase"><div class="label">' + (pre ? "Get ready" : "Married! 🎉") + '</div>' +
        '<div class="count"><b class="tabnum">' + Math.abs(dtw) + '</b><span>' +
        (pre ? "days until your plan begins<br>June 8 · Phase 1" : "days since you married " + esc(prof.partner)) +
        '</span></div></div>';
    }

    // Merge the day's template blocks with any custom events pinned to it
    const customs = (dl.custom || []).slice().sort((a, b) => DateU.toMin(a.s) - DateU.toMin(b.s));
    const items = dt.blocks.map((b, ti) => ({ kind: "tpl", key: b.s, s: b.s, e: b.e, effS: eff[ti].s, effE: eff[ti].e, b }))
      .concat(customs.map((c) => ({ kind: "cus", key: "cus" + c.id, s: c.s, e: c.e, effS: c.s, effE: c.e, c })));
    items.sort((a, b) => DateU.toMin(a.effS) - DateU.toMin(b.effS));

    const nowM = DateU.nowMinutes();
    let curIdx = -1, nextIdx = -1;
    if (isToday) items.forEach((it, i) => {
      if (it.kind === "cus" && it.c.allDay) return; // all-day events don't hog the clock
      const s = DateU.toMin(it.effS), e = DateU.toMin(it.effE);
      if (nowM >= s && nowM < e && curIdx < 0) curIdx = i;
      if (nowM < s && nextIdx < 0) nextIdx = i;
    });
    let heroIdx = curIdx >= 0 ? curIdx : nextIdx;
    let adHero = false;
    if (isToday && curIdx < 0) {
      const ad = items.findIndex((x) => x.kind === "cus" && x.c.allDay && !dl.completed[x.key]);
      if (ad >= 0) { heroIdx = ad; adHero = true; }
    }
    let hero = "";
    if (isToday && heroIdx >= 0) {
      const it = items[heroIdx];
      const isCusH = it.kind === "cus";
      const hTitle = isCusH ? it.c.title : it.b.title;
      const hDesc = isCusH ? ((it.c.note ? it.c.note + " " : "") + (it.c.loc && !it.c.travel ? "📍 " + it.c.loc : "")).trim() : (it.b.desc || "");
      const hIcon = isCusH ? (it.c.travel ? "🚗" : "📌") : blockEmoji(it.b);
      const hAllDay = isCusH && it.c.allDay;
      const hCta = !isCusH ? heroCTA(it.b, date)
        : '<button class="btn btn-primary" data-act="toggleBlock" data-k="' + esc(it.key) + '">Mark done</button>';
      hero =
        '<div class="now">' +
          '<span class="kicker"><span class="dot"></span> ' + (curIdx >= 0 ? "Right now" : adHero ? "All day today" : "Up next") + '</span>' +
          '<h2>' + hIcon + ' ' + esc(hTitle) + '</h2>' +
          '<div class="now-time tabnum">' + (hAllDay ? "All day" : DateU.time12(it.effS) + ' – ' + DateU.time12(it.effE) + (durTxt(it) ? ' · ' + durTxt(it) : '')) + '</div>' +
          '<p>' + esc(hDesc) + (!isCusH && it.b.meal === "dinner" && todaysDinner ? ' <b>Tonight: ' + esc(todaysDinner.name) + '.</b>' : "") + '</p>' +
          '<div class="cta">' + hCta + '</div>' +
        '</div>';
    }

    const dAttr = ' data-date="' + date + '"';
    const rows = items.map((it, i) => {
      const done = !!dl.completed[it.key], skipped = it.kind === "tpl" && it.key in dl.skipped, cur = i === curIdx;
      const cls = (done ? "is-done" : skipped ? "is-skip" : cur ? "is-cur" : "") + (it.kind === "cus" ? " is-cus" : "");
      const b = it.b || null;
      const cAllDay = !b && it.c.allDay;
      const isDinner = b && b.meal === "dinner" && todaysDinner;
      let ctaInline = b ? blockOpenLink(b, date, isToday) : "";
      if (isDinner) ctaInline = '<button class="btn btn-ghost" data-act="recipe" data-i="' + dinnerIdx + '">🍴 View recipe</button>';
      const title = b ? b.title : it.c.title;
      const desc = b ? (b.desc || "") : ((it.c.note ? it.c.note + " " : "") + (it.c.loc && !it.c.travel ? "📍 " + it.c.loc : "")).trim();
      const sub = isDinner ? esc(todaysDinner.name) + ' · tap for recipe' : esc(desc.length > 64 ? desc.slice(0, 62) + "…" : desc);
      const icon = b ? blockEmoji(b) : (it.c.travel ? "🚗" : "📌");
      const check = isFuture
        ? '<span class="check off">·</span>'
        : (cur ? '<span class="chip now-chip">Now</span>' :
            done ? '<span class="check on" data-act="toggleBlock" data-k="' + esc(it.key) + '"' + dAttr + '>✓</span>' :
            '<span class="check" data-act="toggleBlock" data-k="' + esc(it.key) + '"' + dAttr + '></span>');
      const planBtns = it.kind === "cus"
        ? '<button class="btn btn-ghost" data-act="delCustom" data-id="' + it.c.id + '"' + dAttr + '>🗑 Remove</button>'
        : (skipped
          ? '<button class="btn btn-ghost" data-act="restoreBlock" data-k="' + esc(it.key) + '"' + dAttr + '>↩ Restore</button>'
          : '<button class="btn btn-ghost" data-act="skipDay" data-k="' + esc(it.key) + '"' + dAttr + '>Skip this day</button>');
      const markBtn = isFuture ? "" :
        (done ? '<button class="btn btn-ghost" data-act="toggleBlock" data-k="' + esc(it.key) + '"' + dAttr + '>Undo</button>'
              : '<button class="btn btn-primary" data-act="toggleBlock" data-k="' + esc(it.key) + '"' + dAttr + '>Mark done</button>');
      const timeCell = cAllDay
        ? '<div class="time allday">All<span class="te2">day</span></div>'
        : '<div class="time tabnum">' + DateU.time12c(it.effS) + '<span class="te">' + DateU.time12c(it.effE) + '</span></div>';
      return '<details class="row ' + cls + '">' +
        '<summary>' +
          timeCell +
          '<div class="rail"><span class="node ' + (done ? "done" : cur ? "cur" : "") + '"></span></div>' +
          '<div class="card">' +
            '<span class="ico">' + icon + '</span>' +
            '<div class="cbody"><div class="t">' + esc(title) + '</div>' +
              ((desc || isDinner) ? '<div class="d">' + sub + '</div>' : "") + '</div>' +
            check +
          '</div>' +
        '</summary>' +
        '<div class="row-x">' +
          '<p class="rngline tabnum">🕐 ' + (cAllDay ? 'All day' : DateU.time12(it.effS) + ' – ' + DateU.time12(it.effE) + (durTxt(it) ? ' &nbsp;·&nbsp; ' + durTxt(it) : '')) + '</p>' +
          (desc ? '<p>' + esc(desc) + '</p>' : "") +
          '<div class="row-btns">' + markBtn + ctaInline + planBtns + '</div>' +
        '</div>' +
      '</details>';
    }).join("");

    const target = DATA.profile.hydrationTargetOz;
    const hyd = Math.min(100, dl.hydration / target * 100);
    const doneCount = items.filter((it) => dl.completed[it.key]).length;
    const water = !isToday ? "" :
      '<div class="hydro">' +
        '<div class="hydro-top"><span>💧 Water</span><b class="tabnum">' + dl.hydration + ' / ' + target + ' oz</b></div>' +
        '<div class="hydro-bar"><i style="width:' + hyd.toFixed(0) + '%"></i></div>' +
        '<div class="hydro-btns">' +
          '<button class="chipbtn" data-act="water" data-oz="8">+8</button>' +
          '<button class="chipbtn" data-act="water" data-oz="16">+16</button>' +
          '<button class="chipbtn" data-act="water" data-oz="24">+24</button>' +
          '<button class="chipbtn ghost" data-act="water" data-oz="-8">−8</button>' +
        '</div>' +
      '</div>';

    const stats = !isToday ? "" :
      '<div class="stats">' +
        '<div class="stat"><b class="tabnum">' + doneCount + '/' + items.length + '</b><span>blocks done</span></div>' +
        '<a class="stat cal" href="#/meals"><b class="tabnum">' + Store.dayNutrition(date).cal + '<small>/' + (Store.get().profile.calorieTarget || 2100) + '</small></b><span>🔥 calories</span></a>' +
        '<div class="stat"><b>' + (dt.workoutType ? '🏋️' : '🌙') + '</b><span>' + (dt.workoutType ? 'workout day' : 'rest day') + '</span></div>' +
      '</div>';

    const shiftBanner = (sh && isToday)
      ? '<div class="nudge shiftb"><span>⏩</span><p>Running ' + sh.min + ' min ahead — lights out around ' +
        DateU.time12(eff[dt.blocks.length - 1].s) + '. Extra sleep, banked.</p>' +
        '<button class="linkbtn" data-act="unshift">Undo</button></div>'
      : "";

    const away = DateU.daysBetween(realToday, date);
    const planBanner = isToday ? "" :
      '<div class="nudge shiftb"><span>📅</span><p>' +
      (isFuture ? "Planning ahead — " + (away === 1 ? "tomorrow" : away + " days from now") : (away === -1 ? "Yesterday" : (-away) + " days ago")) +
      ' · ' + esc(dt.name) + '</p><button class="linkbtn" data-act="jumpToday">Today</button></div>';

    const nds = isToday ? nudges(date, dt, dl, dinnerIdx) : [];
    const nudgeHtml = nds.map((n) => {
      const tap = n.act || n.href;
      const tag = n.href ? "a" : "div";
      const attr = n.href ? ' href="' + n.href + '"' : (n.act ? ' data-act="' + n.act + '"' + (n.m ? ' data-m="' + n.m + '"' : '') + ' role="button"' : "");
      return '<' + tag + ' class="nudge' + (n.w ? ' warn' : '') + (tap ? ' tap' : '') + '"' + attr + '>' +
        '<span>' + n.i + '</span><p>' + esc(n.t) + '</p>' + (tap ? '<span class="nchev">›</span>' : '') +
      '</' + tag + '>';
    }).join("");

    const header =
      '<div class="topbar"><h1>' + (isToday ? "Today" : "Planner") + '</h1>' +
        '<div class="dnav">' +
          '<button class="dnav-b" data-act="dayNav" data-d="-1" aria-label="Previous day">‹</button>' +
          '<button class="datepill" data-act="pickDate">' + esc(DateU.fmt(date)) + '</button>' +
          '<button class="dnav-b" data-act="dayNav" data-d="1" aria-label="Next day">›</button>' +
        '</div></div>';
    const addBtn = '<button class="btn btn-ghost big" data-act="addCustom"' + dAttr + ' style="margin-top:14px">➕ Add something to this day</button>';

    return '<div class="screen">' + header +
      '<div class="wrap">' + phaseCard + planBanner + shiftBanner + nudgeHtml + hero +
        '<div class="sec-h">' + (isToday ? "Today's schedule" : "Schedule · " + esc(DateU.fmtLong(date))) + '</div><div class="tl">' + rows + '</div>' +
        addBtn + water + stats +
      '</div></div>';
  };

  function shortDesc(b) { const d = b.desc || ""; return d.length > 64 ? d.slice(0, 62) + "…" : d; }

  // "75 min" → "1 hr 15 min"; hidden for tiny admin blocks (< 10 min)
  function durTxt(b) {
    const m = DateU.toMin(b.e) - DateU.toMin(b.s);
    if (m < 10) return "";
    const h = Math.floor(m / 60), r = m % 60;
    return h ? h + " hr" + (r ? " " + r + " min" : "") : m + " min";
  }

  // Smart nudges — contextual banners at the top of Today.
  // Ordered by urgency; at most 2 show at once. They clear themselves
  // when the moment passes or the thing gets done.
  function nudges(date, dt, dl, dinnerIdx) {
    const out = [];
    const nowM = DateU.nowMinutes();
    const dow = DateU.dow(date);
    // Leave for work: weekdays, from 25 min before the commute until it ends
    if (dow >= 1 && dow <= 5) {
      const com = dt.blocks.find((b) => b.type === "commute");
      if (com && !dl.completed[com.s] && nowM >= DateU.toMin(com.s) - 25 && nowM < DateU.toMin(com.e))
        out.push({ i: "🚗", w: 1, t: "Heads up — leave for work by " + DateU.time12(com.s) + "." });
    }
    // Traveling today: leave-by reminder for any drive block, from an hour out
    (dl.custom || []).forEach((c) => {
      if (!c.travel || dl.completed["cus" + c.id]) return;
      const lv = DateU.toMin(c.s);
      if (nowM >= lv - 60 && nowM < lv + 30) {
        const d2 = durTxt(c);
        out.push({ i: "🚗", w: 1, t: "Leave by " + DateU.time12(c.s) + (c.loc ? " for " + c.loc : "") + (d2 ? " — about " + d2 + " of driving." : ".") });
      }
    });
    // Weigh-in: Friday mornings (the plan's weigh-in day), or any morning
    // once it's been more than 8 days. Tap to log right there.
    const lastW = Store.latestWeight();
    const overdue = lastW && DateU.daysBetween(lastW.date, date) > 8;
    const weighedToday = lastW && lastW.date === date;
    if (!weighedToday && nowM >= 360 && nowM < 720 && (dow === 5 || overdue))
      out.push({ i: "⚖️", w: 0, act: "addWeight", t: dow === 5
        ? "Friday weigh-in — scale after the bathroom, before coffee. Tap to log it."
        : "Weigh-in is overdue — hop on the scale this morning. Tap to log it." });
    // Defrost tonight's dinner: mornings until noon
    const dn = dinnerIdx != null ? DATA.dinners[dinnerIdx] : null;
    if (dn && dn.defrost && nowM >= 360 && nowM < 720)
      out.push({ i: "🧊", w: 0, t: "Tonight is " + dn.name + " — take the " + dn.defrost + " out of the freezer before you head out." });
    // Overdue wedding tasks: month ended OR past their due date, still open
    const wo = Screens.weddingOverdue ? Screens.weddingOverdue() : { count: 0 };
    if (wo.count)
      out.push({ i: "💍", w: 1, act: "weddingCatchup", m: wo.oldest,
        t: wo.count + " wedding task" + (wo.count === 1 ? "" : "s") + " from " + DATA.monthLabels[wo.oldest] + (wo.count === 1 ? " is" : " are") + " still open — tap to catch up." });
    else {
      // Due in the next couple of days (only when nothing's overdue)
      const ds = Store.get().weddingTasks.filter((t) => t.status !== "done" && t.due && t.due >= date && DateU.daysBetween(date, t.due) <= 2);
      if (ds.length) out.push({ i: "📅", w: 1, act: "weddingCatchup", m: ds[0].month,
        t: ds.length + " wedding task" + (ds.length === 1 ? "" : "s") + " due in the next couple days — tap to see." });
    }
    // Water pacing: 10 AM – 9 PM, expects steady sipping from wake to bedtime
    if (nowM >= 600 && nowM <= 1260) {
      const tgt = DATA.profile.hydrationTargetOz;
      const expect = Math.round((Math.min(1, (nowM - 375) / 885) * tgt) / 8) * 8;
      if ((dl.hydration || 0) < expect - 16)
        out.push({ i: "💧", w: 1, t: "You're at " + (dl.hydration || 0) + " oz — aim for ~" + expect + " oz by now. Drink up." });
    }
    // Gym day: from 6 AM until the workout starts (or gets checked off)
    if (dt.workoutType) {
      const wb = dt.blocks.find((b) => b.type === "workout");
      if (wb && !dl.completed[wb.s] && nowM >= 360 && nowM < DateU.toMin(wb.s))
        out.push({ i: "🏋️", w: 0, href: "#/workout", t: "Gym day today — " + wb.title + " at " + DateU.time12(wb.s) + "." });
    }
    return out.slice(0, 2);
  }

  function heroCTA(b, date) {
    const done = !!Store.day(date).completed[b.s];
    let primary = "";
    if (b.type === "workout" && dayFor(date).workoutType) primary = '<a class="btn btn-primary" href="#/workout">🏋️ Open workout</a>';
    else if (b.type === "wedding-checkin" || b.type === "wedding-block") primary = '<a class="btn btn-primary" href="#/wedding">💍 Wedding</a>';
    else if (b.type === "fintech") primary = '<a class="btn btn-primary" href="#/fintech">📈 Study</a>';
    else if (b.type === "meal-prep" && b.prep) primary = '<a class="btn btn-primary" href="#/meals/prep">🍱 Prep list</a>';
    else if (b.type === "meal-prep" && b.grocery) primary = '<a class="btn btn-primary" href="#/meals/grocery">🛒 Grocery</a>';
    else if (b.type === "mass") primary = '<a class="btn btn-primary" href="#/faith">⛪ Faith</a>';
    else if (b.meal === "dinner") { const di = Store.get().dinnerPlan[DateU.dow(date)]; if (di != null) primary = '<button class="btn btn-primary" data-act="recipe" data-i="' + di + '">🍴 Tonight\'s recipe</button>'; }
    const mark = done
      ? '<button class="btn btn-ghost" data-act="toggleBlock" data-k="' + esc(b.s) + '">✓ Done</button>'
      : '<button class="btn ' + (primary ? 'btn-ghost' : 'btn-primary') + '" data-act="toggleBlock" data-k="' + esc(b.s) + '">Mark done</button>';
    return primary + mark;
  }
  function blockOpenLink(b, date, isToday) {
    // The dinner recipe is useful for planning any day; the rest are "do it
    // now" links that only make sense on the real today.
    if (b.meal === "dinner") { const di = Store.get().dinnerPlan[DateU.dow(date)]; if (di != null) return '<button class="btn btn-ghost" data-act="recipe" data-i="' + di + '">Recipe</button>'; return ""; }
    if (!isToday) return "";
    if (b.type === "workout" && dayFor(date).workoutType) return '<a class="btn btn-ghost" href="#/workout">Open</a>';
    if (b.type === "wedding-checkin" || b.type === "wedding-block") return '<a class="btn btn-ghost" href="#/wedding">Open</a>';
    if (b.type === "fintech") return '<a class="btn btn-ghost" href="#/fintech">Open</a>';
    if (b.prep) return '<a class="btn btn-ghost" href="#/meals/prep">Open</a>';
    if (b.grocery) return '<a class="btn btn-ghost" href="#/meals/grocery">Open</a>';
    if (b.mass) return '<a class="btn btn-ghost" href="#/faith">Open</a>';
    return "";
  }

  /* ===================== WORKOUT (today) ===================== */
  S.workout = function () {
    const date = DateU.today();
    const dt = dayFor(date);
    if (!dt.workoutType) {
      return '<div class="screen">' + topbar("Workout", "") +
        '<div class="wrap"><div class="rest-state">🌙<h2>Rest day</h2>' +
        '<p>Your body is adapting. Sleep, hydrate, stretch if you like. See you tomorrow.</p>' +
        '<a class="btn btn-primary" href="#/">Back to Today</a></div></div></div>';
    }
    const w = workoutFor(dt.workoutType);
    const prog = Phases.progress(date);
    const guidance = prog ? prog.phase.workout : "";
    const draft = Store.getDraft(date, w.type) || { sets: {} };
    const doneToday = Store.get().workoutLogs.some((l) => l.date === date && l.type === w.type && l.completedAt);

    const ex = w.exercises.map((e, i) => {
      const last = Store.lastSet(w.type, e.name);
      const lastPill = last && last.weight != null
        ? '<span class="last">Last: ' + esc(last.weight) + (typeof last.weight === "number" ? " lb" : "") + (last.reps ? " × " + esc(last.reps) : "") + '</span>'
        : '<span class="last start">Start: ' + esc(e.start) + '</span>';
      const cues = (e.cues || []).map((c) => '<li>' + esc(c) + '</li>').join("");
      let doneCt = 0;
      const setRows = Array.from({ length: e.sets }, (_, k) => {
        const sn = k + 1;
        const ds = draft.sets[i + "_" + sn] || null;
        const lock = !!(ds && ds.done);
        if (lock) doneCt++;
        const dis = lock ? " disabled" : "";
        const fv = ds && ds.felt ? ds.felt : "";
        return '<div class="setrow' + (lock ? " saved" : "") + '" id="row_' + i + '_' + sn + '">' +
          '<span class="setno">Set ' + sn + '</span>' +
          '<input class="setin" id="w_' + i + '_' + sn + '" inputmode="decimal" placeholder="' + (last && last.weight != null ? esc(last.weight) : "lb") + '" value="' + (ds && ds.weight != null ? ds.weight : "") + '"' + dis + '>' +
          '<span class="x">×</span>' +
          '<input class="setin" id="r_' + i + '_' + sn + '" inputmode="numeric" placeholder="reps" value="' + (ds && ds.reps != null ? ds.reps : "") + '"' + dis + '>' +
          '<input type="hidden" id="f_' + i + '_' + sn + '" value="' + fv + '">' +
          '<span class="felt">' +
            '<button class="fb easy' + (fv === "easy" ? " on" : "") + '" data-act="felt" data-ex="' + i + '" data-set="' + sn + '" data-v="easy" title="Felt easy">·</button>' +
            '<button class="fb right' + (fv === "right" ? " on" : "") + '" data-act="felt" data-ex="' + i + '" data-set="' + sn + '" data-v="right" title="Felt right">·</button>' +
            '<button class="fb hard' + (fv === "hard" ? " on" : "") + '" data-act="felt" data-ex="' + i + '" data-set="' + sn + '" data-v="hard" title="Felt hard">·</button>' +
          '</span>' +
          '<button class="setsave' + (lock ? " on" : "") + '" data-act="saveSet" data-ex="' + i + '" data-set="' + sn + '" title="' + (lock ? "Saved — tap to edit" : "Save this set") + '">✓</button>' +
        '</div>';
      }).join("");
      return '<div class="ex">' +
        '<div class="ex-head">' +
          '<div><div class="ex-name">' + esc(e.name) + '</div>' +
            '<div class="ex-target">' + e.sets + ' × ' + esc(e.reps) + ' &nbsp;·&nbsp; ' + lastPill +
              '<span class="expill' + (doneCt === e.sets ? " full" : "") + '" id="exdone_' + i + '">' + doneCt + '/' + e.sets + '</span></div></div>' +
          '<a class="demo" href="' + esc(e.demo) + '" target="_blank" rel="noopener">▶ Demo</a>' +
        '</div>' +
        (e.notes ? '<div class="ex-note">' + esc(e.notes) + '</div>' : "") +
        '<div class="sets">' + setRows + '</div>' +
        (cues ? '<details class="cues"><summary>How to do it</summary><ul>' + cues + '</ul>' +
          '<div class="startw">Suggested start: <b>' + esc(e.start) + '</b> — adjust to feel.</div></details>' : "") +
      '</div>';
    }).join("");

    return '<div class="screen">' +
      topbar(w.name, '<a class="datepill" href="#/workout/history">History</a>') +
      '<div class="wrap">' +
        '<div class="wk-meta">~' + w.minutes + ' min · ' + w.exercises.length + ' exercises' +
          (guidance ? '<div class="guide">📋 ' + esc(guidance) + '</div>' : "") +
          (doneToday ? '<div class="guide done-banner">✅ Finished today — nice work. Logging more saves a second session.</div>' : "") +
          '<div class="savehint">💾 Tap ✓ after each set — it saves instantly, so it\'s safe to close the app between sets.</div>' +
        '</div>' +
        '<details class="warm" open><summary>🔥 Warm-up</summary><p>' + esc(w.warmup) + '</p></details>' +
        ex +
        '<details class="warm"><summary>🧊 Cooldown</summary><p>' + esc(w.cooldown) + '</p></details>' +
        '<div class="startw note">💡 Starting weights are suggestions for a 6\'3" / 240 lb starting point. Pick a weight you can move with good form, then nudge up as it gets easy.</div>' +
        '<div style="height:80px"></div>' +
      '</div>' +
      '<div class="sticky-finish"><button class="btn btn-primary big" data-act="finishWorkout" data-type="' + w.type + '">✓ Finish workout</button></div>' +
      '</div>';
  };

  S.workoutHistory = function () {
    const logs = Store.get().workoutLogs.filter((x) => x.completedAt).sort((a, b) => a.date < b.date ? 1 : -1);
    const list = logs.length ? logs.map((l) => {
      const w = workoutFor(l.type);
      const sets = (l.sets || []).filter((s) => s.weight != null || s.reps != null).length;
      return '<a class="hist" data-act="viewWorkout" data-id="' + esc(l.id) + '">' +
        '<div><div class="t">' + esc(w ? w.name : l.type) + '</div>' +
          '<div class="d">' + DateU.fmtLong(l.date) + ' · ' + sets + ' sets logged</div></div><span class="chev">›</span></a>';
    }).join("") : '<div class="empty">No workouts logged yet. Finish one and it shows up here.</div>';
    return '<div class="screen">' + subbar("Workout History", "#/workout") + '<div class="wrap">' + list + '</div></div>';
  };

  S.workoutProgress = function () {
    const logs = Store.get().workoutLogs.filter((x) => x.completedAt);
    const wk = DateU.monday(DateU.today());
    const weeks = [];
    for (let i = 5; i >= 0; i--) {
      const m = DateU.addDays(wk, -7 * i), e = DateU.addDays(m, 6);
      const c = logs.filter((l) => l.date >= m && l.date <= e).length;
      weeks.push({ label: DateU.fmtShort(m).split(" ")[1], value: c });
    }
    const adher = UI.barChart(weeks, { target: 6, max: 7 });

    const exNames = []; logs.forEach((l) => (l.sets || []).forEach((s) => { if (s.weight != null && exNames.indexOf(s.ex) < 0) exNames.push(s.ex); }));
    const sel = App.ui.progEx || exNames[0];
    let prog = '<div class="chart-empty">Log weighted sets to see strength gains.</div>';
    if (sel) {
      const pts = logs.filter((l) => (l.sets || []).some((s) => s.ex === sel && s.weight != null))
        .sort((a, b) => a.date < b.date ? -1 : 1)
        .map((l) => ({ date: l.date, lbs: Math.max.apply(null, l.sets.filter((s) => s.ex === sel && s.weight != null).map((s) => +s.weight)) }));
      if (pts.length) { const lo = Math.min.apply(null, pts.map((p) => p.lbs)), hi = Math.max.apply(null, pts.map((p) => p.lbs)); prog = UI.weightChart(pts, { start: hi, target: lo }); }
    }
    const options = exNames.map((n) => '<option value="' + esc(n) + '"' + (n === sel ? " selected" : "") + '>' + esc(n) + '</option>').join("");

    return '<div class="screen">' + subbar("Workout Progress", "#/stats") + '<div class="wrap">' +
      '<div class="card2"><div class="card2-h">Workouts per week <span class="muted">target 6</span></div>' + adher + '</div>' +
      '<div class="card2"><div class="card2-h">Strength over time</div>' +
        (exNames.length ? '<select class="sel" data-act="progEx">' + options + '</select>' : "") + prog + '</div>' +
      '</div></div>';
  };

  /* ===================== WEIGHT ===================== */
  S.weight = function () {
    const st = Store.get(), prof = st.profile;
    const list = st.weights.slice().sort((a, b) => a.date < b.date ? -1 : 1);
    const cur = list.length ? list[list.length - 1].lbs : prof.startWeight;
    const lost = (prof.startWeight - cur).toFixed(1);
    const toGo = (cur - prof.targetWeight).toFixed(1);
    let rate = "—";
    if (list.length >= 2) {
      const recent = list.filter((w) => DateU.daysBetween(w.date, DateU.today()) <= 28);
      if (recent.length >= 2) {
        const f = recent[0], l = recent[recent.length - 1];
        const wks = Math.max(1, DateU.daysBetween(f.date, l.date) / 7);
        rate = ((f.lbs - l.lbs) / wks).toFixed(1) + " /wk";
      }
    }
    const chart = UI.weightChart(list.map((w) => ({ date: w.date, lbs: w.lbs })), { start: prof.startWeight, target: prof.targetWeight });
    const hist = list.slice().reverse().slice(0, 12).map((w) =>
      '<div class="wrow"><span class="tabnum b">' + w.lbs + ' lb</span><span class="muted">' + DateU.fmtLong(w.date) + '</span>' +
      (w.note ? '<span class="wn">' + esc(w.note) + '</span>' : "") + '</div>').join("");
    const isFri = DateU.dow(DateU.today()) === 5;

    return '<div class="screen">' + subbar("Weight", "#/stats") + '<div class="wrap">' +
      '<button class="btn btn-primary big' + (isFri ? ' pulse' : '') + '" data-act="addWeight">⚖️ ' + (isFri ? "Friday weigh-in — log it" : "Log weight") + '</button>' +
      '<div class="stats4">' +
        '<div class="stat"><b class="tabnum">' + cur + '</b><span>current</span></div>' +
        '<div class="stat"><b class="tabnum">' + lost + '</b><span>lbs lost</span></div>' +
        '<div class="stat"><b class="tabnum">' + toGo + '</b><span>to target</span></div>' +
        '<div class="stat"><b class="tabnum" style="font-size:15px">' + rate + '</b><span>avg loss</span></div>' +
      '</div>' +
      '<div class="card2"><div class="card2-h">Trend <span class="muted">' + prof.startWeight + ' → ' + prof.targetWeight + ' lb</span></div>' + chart + '</div>' +
      (hist ? '<div class="sec-h">Recent entries</div>' + hist : '') +
      '</div></div>';
  };

  /* ===================== MEALS ===================== */
  S.meals = function () {
    const date = DateU.today();
    const ml = Store.mealLog(date);
    const dow = DateU.dow(date);
    const dinnerIdx = Store.get().dinnerPlan[dow];
    const dinner = DATA.dinners[dinnerIdx != null ? dinnerIdx : 0];

    const meals = DATA.meals.map((m) => {
      const eaten = ml[m.type] === "eaten";
      let body = esc(m.desc);
      if (m.type === "dinner") body = esc(dinner.name) + ' — <span class="muted">' + esc(dinner.blurb) + '</span>';
      return '<div class="meal ' + (eaten ? "eaten" : "") + '">' +
        '<button class="check ' + (eaten ? "on" : "") + '" data-act="mealEat" data-type="' + m.type + '">' + (eaten ? "✓" : "") + '</button>' +
        '<div class="meal-b"><div class="meal-h"><span class="t">' + esc(m.label) + '</span><span class="time tabnum">' + DateU.time12c(m.time) + '</span></div>' +
          '<div class="d">' + body + '</div>' +
          (m.type === "dinner" ? '<button class="link" data-act="recipe" data-i="' + dinnerIdx + '">View recipe ›</button>' : "") +
          (m.alt ? '<div class="alt">or: ' + esc(m.alt) + '</div>' : "") +
        '</div><span class="cal' + (eaten ? ' counted' : '') + '">' + (eaten ? "✓ " : "") + m.cal + ' cal</span></div>';
    }).join("");

    // Calorie + macro tracker (Noom-style)
    const prof = Store.get().profile;
    const calTgt = prof.calorieTarget || 2100, protTgt = prof.proteinTarget || 180;
    const carbTgt = prof.carbTarget || 170, fatTgt = prof.fatTarget || 65;
    const nut = Store.dayNutrition(date);
    const over = nut.cal > calTgt;
    const cc = nut.colors || { g: 0, y: 0, r: 0 };
    const foods = Store.day(date).foods || [];
    const cw = (v, t) => Math.min(100, t ? v / t * 100 : 0).toFixed(0);
    const macroBar = (label, val, tgt, cls) =>
      '<div class="mrow"><span>' + label + '</span><b class="tabnum">' + val + ' <span class="muted">/ ' + tgt + ' g</span></b></div>' +
      '<div class="calbar sm"><i class="' + cls + (val > tgt * 1.1 ? " over" : "") + '" style="width:' + cw(val, tgt) + '%"></i></div>';
    const cz = coachMsg(nut, prof, date);
    const extras = foods.map((f) =>
      '<div class="xfood">' + (f.col != null ? '<span class="fdot ' + ["g", "y", "r"][f.col] + '"></span>' : '') +
        '<span class="xn">' + esc(f.name) + '</span>' +
        '<span class="xc tabnum">' + (f.cal || 0) + ' cal</span>' +
        '<button class="oosbtn" data-act="delFood" data-id="' + f.id + '">✕</button></div>').join("");
    const calCard =
      '<div class="card2 calcard">' +
        '<div class="card2-h">Today <span class="muted">goal ' + calTgt.toLocaleString() + ' cal</span></div>' +
        '<div class="calbig tabnum"><b>' + nut.cal.toLocaleString() + '</b> <span class="muted">/ ' + calTgt.toLocaleString() + ' cal</span></div>' +
        '<div class="calbar"><i class="' + (over ? "over" : "") + '" style="width:' + cw(nut.cal, calTgt) + '%"></i></div>' +
        '<div class="calmeta">' +
          (over ? '<span class="overtxt">' + (nut.cal - calTgt).toLocaleString() + ' over goal</span>' : '<span>' + (calTgt - nut.cal).toLocaleString() + ' cal left</span>') +
          '<span class="colortally">🟢 ' + cc.g + ' &nbsp;🟡 ' + cc.y + ' &nbsp;🔴 ' + cc.r + '</span></div>' +
        '<div class="macros">' +
          macroBar("💪 Protein", nut.protein, protTgt, "prot") +
          macroBar("🍞 Carbs", nut.carbs, carbTgt, "carb") +
          macroBar("🥑 Fat", nut.fat, fatTgt, "fatm") +
        '</div>' +
        '<div class="coach ' + cz.tone + '">🧭 ' + esc(cz.t) + (cz.link ? ' <a href="#/meals/plan">See meal ideas ›</a>' : "") + '</div>' +
        (extras ? '<div class="xhead">Logged today</div>' + extras : "") +
        '<button class="btn btn-ghost" data-act="addFood" style="margin-top:12px">➕ Add food / snack</button>' +
      '</div>';

    return '<div class="screen">' + subbar("Meals", "#/more") + '<div class="wrap">' +
      '<div class="tiles t4">' +
        '<a class="tile" href="#/meals/plan">🗓️<span>Plan this week</span></a>' +
        '<a class="tile" href="#/meals/rotation">🍽️<span>All dinners</span></a>' +
        '<a class="tile" href="#/meals/grocery">🛒<span>Grocery list</span></a>' +
        '<a class="tile" href="#/meals/prep">🍱<span>Prep tasks</span></a>' +
      '</div>' +
      calCard +
      '<div class="sec-h">Today\'s meals <span class="muted" style="font-weight:600;text-transform:none;letter-spacing:0">tap ✓ to count it</span></div>' + meals +
      '</div></div>';
  };

  S.dinnerRotation = function () {
    const cards = DATA.dinners.map((dn, i) =>
      '<div class="dinner">' +
        '<div class="dinner-h"><div><div class="t">' + esc(dn.name) + '</div>' +
          '<div class="d">' + esc(dn.blurb) + '</div></div></div>' +
        '<div class="dinner-m"><span>⏱ ' + esc(dn.time) + '</span><span>💪 ' + esc(dn.protein) + '</span></div>' +
        '<button class="btn btn-ghost" data-act="recipe" data-i="' + i + '">View recipe</button>' +
      '</div>').join("");
    return '<div class="screen">' + subbar("Dinners & Recipes", "#/meals") + '<div class="wrap">' +
      '<p class="muted intro">Every dinner you can choose from — ' + DATA.dinners.length + ' in all. Tap one for the full recipe + links to videos and more recipes online. Pick your week over on <a href="#/meals/plan">Plan this week</a>.</p>' + cards + '</div></div>';
  };

  function dinnerProteinNum(dn) { const m = (dn.protein || "").match(/\d+/); return m ? +m[0] : 0; }
  function dinnerTags(dn) {
    const p = dinnerProteinNum(dn), nm = dn.name.toLowerCase();
    const tags = [];
    if (p >= 40) tags.push('<span class="mtag hp">💪 High protein</span>');
    if (/salad|veggie|quinoa|falafel|bowl/.test(nm) || p < 35) tags.push('<span class="mtag lt">🥗 Lighter</span>');
    return tags.join("");
  }
  S.mealPlan = function () {
    const sel = Store.weekMeals();
    const selSet = {}; sel.forEach((i) => { selSet[i] = (selSet[i] || 0) + 1; });
    const cards = DATA.dinners.map((dn, i) => {
      const on = !!selSet[i];
      return '<div class="planmeal ' + (on ? "on" : "") + '">' +
        '<button class="check ' + (on ? "on" : "") + '" data-act="toggleWeekMeal" data-i="' + i + '">' + (on ? "✓" : "") + '</button>' +
        '<div class="planmeal-b" data-act="recipe" data-i="' + i + '" role="button">' +
          '<div class="t">' + esc(dn.name) + '</div>' +
          '<div class="d">' + esc(dn.blurb) + '</div>' +
          '<div class="dinner-m">' + dinnerTags(dn) + '<span>⏱ ' + esc(dn.time) + '</span><span class="muted">tap for recipe ›</span></div>' +
        '</div></div>';
    }).join("");
    const n = sel.length;
    // balance coaching for the week's picks
    let balance = "";
    if (n) {
      const hp = sel.filter((i) => DATA.dinners[i] && dinnerProteinNum(DATA.dinners[i]) >= 40).length;
      const light = sel.filter((i) => { const d = DATA.dinners[i]; return d && (/salad|veggie|quinoa|falafel|bowl/.test(d.name.toLowerCase()) || dinnerProteinNum(d) < 35); }).length;
      let tip;
      if (hp === 0) tip = "These are tasty but light on protein — add a 💪 high-protein night to hit your goals.";
      else if (light === 0) tip = "Solid protein! Toss in a 🥗 lighter/veg-forward night for balance.";
      else tip = "Nice balance — " + hp + " high-protein and " + light + " lighter pick" + (light === 1 ? "" : "s") + ". 👏";
      balance = '<div class="coach">🧭 ' + tip + '</div>';
    }
    return '<div class="screen">' + subbar("Plan This Week", "#/meals") + '<div class="wrap">' +
      '<p class="muted intro">Tap the meals you want this week. When you\'re done, build a grocery list that matches exactly what you picked — then re-share the wedding planning... er, dinner duty, with ' + esc(Store.get().profile.partner || "your partner") + '. 🙂</p>' +
      '<div class="planbar"><b id="planCount">' + n + '</b> meal' + (n === 1 ? "" : "s") + ' picked' +
        '<button class="btn btn-primary" data-act="buildGrocery">🛒 Build grocery list</button></div>' +
      balance +
      cards +
      '<div style="height:20px"></div>' +
      '</div></div>';
  };

  S.recipeHTML = function (i) {
    const dn = DATA.dinners[i];
    const ing = dn.ingredients.map((x) => '<li>' + esc(x) + '</li>').join("");
    const steps = dn.steps.map((x) => '<li>' + esc(x) + '</li>').join("");
    const weblink = "https://www.google.com/search?q=" + encodeURIComponent(dn.name + " recipe");
    const ytlink = "https://www.youtube.com/results?search_query=" + encodeURIComponent("how to make " + dn.name);
    return '<div class="recipe">' +
      '<div class="recipe-m"><span>⏱ ' + esc(dn.time) + '</span><span>💪 ' + esc(dn.protein) + '</span></div>' +
      '<p class="blurb">' + esc(dn.blurb) + '</p>' +
      '<h4>Ingredients</h4><ul class="ing">' + ing + '</ul>' +
      '<h4>Steps</h4><ol class="steps">' + steps + '</ol>' +
      '<div class="recipe-links"><a class="btn btn-ghost" href="' + weblink + '" target="_blank" rel="noopener">🔎 More recipes online</a>' +
        '<a class="btn btn-ghost" href="' + ytlink + '" target="_blank" rel="noopener">▶ Watch how-to videos</a></div></div>';
  };

  S.grocery = function () {
    const g = Store.get().grocery;
    const row = (it, i) =>
      '<div class="gitem ' + (it.checked ? "got" : "") + (it.oos ? " oos" : "") + '">' +
        '<button class="check ' + (it.checked ? "on" : "") + '" data-act="grocery" data-i="' + i + '" data-field="checked">' + (it.checked ? "✓" : "") + '</button>' +
        '<span class="gname">' + esc(it.name) + '</span>' +
        '<button class="oosbtn" data-act="grocery" data-i="' + i + '" data-field="oos">' + (it.oos ? "out" : "✕") + '</button>' +
      '</div>';
    const byStore = (store) => {
      const items = g.items.map((it, i) => ({ it, i })).filter((x) => x.it.store === store);
      const done = items.filter((x) => x.it.checked).length;
      return '<div class="sec-h">' + store + ' <span class="muted">' + done + '/' + items.length + '</span></div>' +
        items.map(({ it, i }) => row(it, i)).join("");
    };
    // Dinner ingredients for the week ahead, grouped by recipe
    const dItems = g.items.map((it, i) => ({ it, i })).filter((x) => x.it.store === "dinner");
    let dinnerHtml = "";
    if (dItems.length) {
      const groups = {};
      dItems.forEach((x) => { (groups[x.it.cat] = groups[x.it.cat] || []).push(x); });
      const done = dItems.filter((x) => x.it.checked).length;
      dinnerHtml = '<div class="sec-h">This week\'s dinners <span class="muted">' + done + '/' + dItems.length + '</span></div>' +
        '<p class="muted" style="font-size:12.5px;margin:0 4px 8px">Everything the rotation\'s recipes call for, Saturday through Friday.</p>' +
        Object.keys(groups).map((cat) =>
          '<div class="gdin">🍽️ ' + esc(cat) + '</div>' +
          groups[cat].map(({ it, i }) => row(it, i)).join("")
        ).join("");
    }
    return '<div class="screen">' + subbar("Grocery List", "#/meals") +
      '<div class="wrap">' +
        '<p class="muted intro">Aldi first for staples, then Publix for produce &amp; fish — then the week\'s dinner ingredients by recipe. Tap ✕ to flag out-of-stock.</p>' +
        byStore("Aldi") + byStore("Publix") + dinnerHtml +
        '<button class="btn btn-ghost" data-act="groceryReset" style="margin-top:18px">↻ Reset list for a new week</button>' +
      '</div></div>';
  };

  S.mealPrep = function () {
    const dl = Store.day(DateU.today());
    const rows = DATA.mealPrepTasks.map((t, i) => {
      const done = !!dl.completed["prep" + i];
      return '<label class="prep ' + (done ? "done" : "") + '">' +
        '<button class="check ' + (done ? "on" : "") + '" data-act="toggleBlock" data-k="prep' + i + '">' + (done ? "✓" : "") + '</button>' +
        '<div class="prep-b"><div class="t">' + esc(t.title) + '</div><div class="d">' + esc(t.desc) + '</div></div></label>';
    }).join("");
    return '<div class="screen">' + subbar("Meal Prep", "#/meals") + '<div class="wrap">' +
      '<p class="muted intro">Saturday 90-minute block. Knock these out and the week cooks itself.</p>' + rows + '</div></div>';
  };

  /* ===================== FAITH ===================== */
  S.faith = function () {
    const date = DateU.today();
    const dl = Store.day(date);
    const st = Store.get();
    const isSun = DateU.dow(date) === 0;
    const attended = Store.massFor(date);
    const recentMass = st.mass.slice().sort((a, b) => a.date < b.date ? 1 : -1).slice(0, 5)
      .map((m) => '<div class="wrow"><span class="' + (m.attended ? "yes" : "muted") + '">' + (m.attended ? "✓ Attended" : "—") + '</span><span class="muted">' + DateU.fmtLong(m.date) + '</span></div>').join("");

    return '<div class="screen">' + subbar("Faith", "#/more") + '<div class="wrap">' +
      '<div class="card2"><div class="card2-h">Today\'s prayer</div>' +
        '<button class="prayer-row ' + (dl.prayerM ? "on" : "") + '" data-act="prayer" data-which="morning">' +
          '<span class="check ' + (dl.prayerM ? "on" : "") + '">' + (dl.prayerM ? "✓" : "") + '</span>🌅 Morning Prayer' + (Store.get().profile.partner ? ' with ' + esc(Store.get().profile.partner) : '') + '</button>' +
        '<button class="prayer-row ' + (dl.prayerE ? "on" : "") + '" data-act="prayer" data-which="evening">' +
          '<span class="check ' + (dl.prayerE ? "on" : "") + '">' + (dl.prayerE ? "✓" : "") + '</span>🌙 Evening Prayer / Examen</button>' +
      '</div>' +
      '<div class="card2"><div class="card2-h">Bible in a Year</div>' +
        '<div class="bible"><div>Current episode<br><b class="tabnum big">#' + (st.settings.bibleEpisode || 1) + '</b></div>' +
        '<button class="btn btn-primary" data-act="bible">▶ Played next episode</button></div></div>' +
      '<div class="card2"><div class="card2-h">Mass — Corpus Christi</div>' +
        (isSun ? '<button class="btn ' + (attended ? "btn-ghost" : "btn-primary") + ' big" data-act="mass" data-date="' + date + '">' +
          (attended ? "✓ Attended today" : "⛪ Mark attended") + '</button>' :
          '<p class="muted">Sunday Mass at 10:30 AM, Pooler. The button to log attendance appears on Sundays.</p>') +
        (recentMass ? '<div class="sec-h" style="margin-top:14px">Recent</div>' + recentMass : "") +
      '</div>' +
      '</div></div>';
  };

})(window.Screens);
