/* =====================================================================
   Sync — live wedding-task sync over Firebase Realtime Database.

   This layer does NOT invent its own merge logic. It reuses the two
   primitives the share-link already relies on:
     • Store.weddingSyncPayload()  → a compact {v,base,add} diff
     • Store.applyWeddingSync(p)    → idempotent merge (done wins, never
                                      undoes a completed task, never deletes)
   It simply ferries those payloads between phones in real time.

   Design:
     • Each phone writes its full payload to rooms/{room}/devices/{deviceId}.
     • Each phone listens to rooms/{room}/devices and merges every OTHER
       device's payload into local state.
     • Echo guard: after merging, we only re-publish if our own payload
       actually changed (JSON compare) — so two phones converge in a couple
       of hops instead of looping forever.

   The Firebase SDK is imported lazily (only when sync is turned on) so users
   who never enable it pay nothing and the app stays fully offline-capable.
   The config below is public-safe: access is enforced by the database's
   security rules (a room is reachable only if you know its long token),
   not by hiding these values.
   ===================================================================== */
window.Sync = (function () {
  const CONFIG = {
    apiKey: "AIzaSyAB0FG5mnCBmHgidZ0asgJ7M57FVLokANo",
    authDomain: "diaz-ferara-household.firebaseapp.com",
    databaseURL: "https://diaz-ferara-household-default-rtdb.firebaseio.com",
    projectId: "diaz-ferara-household",
    storageBucket: "diaz-ferara-household.firebasestorage.app",
    messagingSenderId: "228533702082",
    appId: "1:228533702082:web:2b6c6d19c3b8d4ab6cda5b"
  };
  const SDK = "https://www.gstatic.com/firebasejs/12.14.0/";

  let app = null, db = null, fns = null; // firebase bits, loaded on demand
  let devicesRef = null;                 // ref to rooms/{room}/devices
  let started = false, status = "off";   // off | connecting | live | error
  let lastSync = 0, pushTimer = null;

  function cfg() { return Store.get().sync || {}; }
  function available() { return !!CONFIG.databaseURL; }
  function enabled() { const s = cfg(); return !!(s.on && s.room); }
  function getStatus() { return enabled() ? status : "off"; }
  function lastSyncedAt() { return lastSync; }

  function notify() { if (window.App && App.onSyncChange) App.onSyncChange(getStatus()); }

  // stable per-device id (so a phone never merges its own echo)
  function deviceId() {
    const s = Store.get();
    if (!s.sync) s.sync = { on: false, room: "", device: "" };
    if (!s.sync.device) { s.sync.device = "d" + Math.random().toString(36).slice(2, 10) + Date.now().toString(36); Store.save(); }
    return s.sync.device;
  }

  // a long, unguessable room token (>= 20 chars to satisfy the db rules)
  function newRoom() {
    let t = "";
    while (t.length < 24) t += Math.random().toString(36).slice(2);
    return t.slice(0, 24);
  }

  async function loadSDK() {
    if (db && fns) return;
    const appMod = await import(SDK + "firebase-app.js");
    if (!app) app = appMod.getApps().length ? appMod.getApp() : appMod.initializeApp(CONFIG);
    const dbMod = await import(SDK + "firebase-database.js");
    db = dbMod.getDatabase(app);
    fns = { ref: dbMod.ref, onValue: dbMod.onValue, set: dbMod.set, off: dbMod.off };
  }

  async function start() {
    if (!enabled() || started) return;
    status = "connecting"; notify();
    try {
      await loadSDK();
      const room = cfg().room;
      devicesRef = fns.ref(db, "rooms/" + room + "/devices");
      fns.onValue(devicesRef, onRemote, onErr);
      await pushNow();          // publish our current state immediately
      started = true; status = "live"; notify();
    } catch (e) { status = "error"; notify(); }
  }

  function stop() {
    if (devicesRef && fns) { try { fns.off(devicesRef); } catch (e) {} }
    devicesRef = null; started = false; status = "off"; notify();
  }

  function onErr() { status = "error"; notify(); }

  function onRemote(snap) {
    const val = (snap && snap.val()) || {};
    const me = deviceId();
    const before = JSON.stringify(Store.weddingSyncPayload());
    Object.keys(val).forEach((dev) => {
      if (dev === me) return;            // skip our own echo
      const node = val[dev];
      if (node && node.p) Store.applyWeddingSync(node.p);
    });
    const after = JSON.stringify(Store.weddingSyncPayload());
    lastSync = Date.now(); status = "live"; notify();
    if (before !== after) {              // we actually learned something new
      if (window.App && App.render) App.render();
      pushNow();                         // propagate so the other phone converges
    }
  }

  async function pushNow() {
    if (!db || !fns || !enabled()) return;
    try {
      const node = { p: Store.weddingSyncPayload(), t: Date.now(), who: (Store.get().profile.name || "") };
      await fns.set(fns.ref(db, "rooms/" + cfg().room + "/devices/" + deviceId()), node);
      lastSync = Date.now(); status = "live"; notify();
    } catch (e) { status = "error"; notify(); }
  }

  // debounced push triggered by Store on every wedding-task change
  function pushSoon() {
    if (!enabled()) return;
    if (!started) { start(); return; }   // first change also (re)starts a dead connection
    clearTimeout(pushTimer);
    pushTimer = setTimeout(pushNow, 600);
  }

  // turn sync on: mint a room if we don't have one, then connect
  function turnOn() {
    const s = Store.get();
    if (!s.sync) s.sync = { on: false, room: "", device: "" };
    if (!s.sync.room) s.sync.room = newRoom();
    s.sync.on = true; Store.save();
    deviceId(); start();
    return s.sync.room;
  }

  // join an existing room from a shared link
  function join(room) {
    if (!room || room.length < 20) return false;
    const s = Store.get();
    if (!s.sync) s.sync = { on: false, room: "", device: "" };
    s.sync.room = room; s.sync.on = true; Store.save();
    deviceId(); start();
    return true;
  }

  function turnOff() {
    const s = Store.get();
    if (s.sync) { s.sync.on = false; Store.save(); }
    stop();
  }

  function room() { return cfg().room || ""; }
  function joinLink() {
    return location.origin + location.pathname + "?room=" + encodeURIComponent(room());
  }

  return {
    available, enabled, getStatus, lastSyncedAt,
    start, stop, pushSoon, turnOn, turnOff, join, room, joinLink
  };
})();
