# Manny's Plan 💍

Your 6-month wedding-prep companion — fitness, faith, meals, fintech study, and the wedding countdown — all in one phone-friendly web app. Built to run for free with nothing to maintain.

**Wedding:** November 6, 2026 · Sacred Heart, Savannah.

---

## 📱 Put it on your iPhone (30 seconds)

Once it's online (see *Hosting* below), you'll have a link like `https://yourname.github.io/manny-schedule/`.

1. Open that link in **Safari** on your iPhone.
2. Tap the **Share** button (the square with an arrow).
3. Tap **Add to Home Screen** → **Add**.
4. You now have a "Manny's Plan" icon. Open it — it runs full-screen like a real app and works even with no signal.

> Android: same idea in Chrome → menu (⋮) → *Add to Home screen*.

---

## ✨ What's inside

- **Today** — your full daily schedule (5:15 AM → lights out), the live "right now" block, tap to check things off, water tracker, day countdown.
- **Workout** — today's exercises with **suggested starting weights**, a **▶ Demo** link for every move, "how to do it" form cues, and inline set/weight logging. Plus history and strength charts.
- **Wedding** — countdown, all 37 tasks by month, vendors with contracts & costs, and the In Memoriam table.
- **Meals** — today's meals, the 7-dinner rotation with **full recipes** (ingredients + steps), the Aldi/Publix grocery list, and the Saturday meal-prep checklist.
- **Stats** — weight trend, fintech study hours, weekly review.
- **Faith** — morning/evening prayer, Bible-in-a-Year episode tracker, Sunday Mass log.

Everything you log is saved **on your phone** (no account, no cloud, no fees).

---

## 🔒 Privacy & your PIN

Your data never leaves your device. To add a 4-digit lock: open **More → Settings → Security → Set a PIN**. It's a casual speed-bump for a shared phone, not bank security.

Back up anytime: **Settings → Export backup** saves a file. Moving to a new phone? **Settings → Import backup**.

---

## ✏️ Want to change something?

All your content lives in plain-English files in the `js/` folder — you can edit text without being a programmer:

- **Recipes, dinners, meals** → `js/data.js`, the `dinners` and `meals` sections.
- **Workout starting weights / exercises** → `js/data.js`, the `workouts` section (each exercise has a `start:` value).
- **Schedule blocks / times** → `js/data.js`, the `days` section.
- **Wedding tasks, vendors, In Memoriam names** → editable right inside the app, or in `js/data.js`.

Or just ask Claude Code to make the change for you — that's the easy way.

---

## ☁️ Hosting (free, on GitHub Pages)

This is a plain static website — no build step. To publish:

1. Create a new repository on GitHub (e.g. `manny-schedule`).
2. Upload everything in this folder (or `git push`).
3. In the repo: **Settings → Pages → Source: "Deploy from a branch" → main / root → Save**.
4. Wait ~1 minute. Your link appears at the top of the Pages settings.

To update later: change a file and re-upload (or push). Pages redeploys automatically.

> The app caches itself for offline use. After an update, fully close and reopen it (or pull-to-refresh) to get the new version.

---

## 🛠 How it's built (for the curious)

- Plain HTML/CSS/JavaScript — **no frameworks, no build, no dependencies**.
- Data baked into `js/data.js`; your logs live in the browser's `localStorage`.
- Installable PWA (`manifest.webmanifest` + `sw.js` service worker) for the app feel and offline.
- `make_icons.py` regenerates the app icons (needs Python + Pillow); you rarely need it.

Made for Manny & Nicole. 🤍
