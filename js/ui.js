/* =====================================================================
   UI — small shared helpers: escaping, toast, bottom sheet, dialogs,
   and dependency-free SVG charts.
   ===================================================================== */
window.UI = (function () {

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  }

  /* ---- Toast ---------------------------------------------------------- */
  let toastT;
  function toast(msg) {
    let t = document.getElementById("toast");
    if (!t) { t = document.createElement("div"); t.id = "toast"; document.body.appendChild(t); }
    t.textContent = msg; t.className = "show";
    clearTimeout(toastT); toastT = setTimeout(() => (t.className = ""), 1900);
  }

  /* ---- Bottom sheet --------------------------------------------------- */
  function sheet(title, html, onMount) {
    const back = document.createElement("div");
    back.className = "sheet-back";
    back.innerHTML =
      '<div class="sheet" role="dialog" aria-modal="true">' +
        '<div class="sheet-grab"></div>' +
        '<div class="sheet-head"><h3>' + esc(title) + '</h3>' +
          '<button class="sheet-x" aria-label="Close">✕</button></div>' +
        '<div class="sheet-body">' + html + '</div>' +
      '</div>';
    document.body.appendChild(back);
    document.body.style.overflow = "hidden";
    function close() { back.remove(); document.body.style.overflow = ""; }
    back.addEventListener("click", (e) => { if (e.target === back) close(); });
    back.querySelector(".sheet-x").addEventListener("click", close);
    if (onMount) onMount(back.querySelector(".sheet-body"), close);
    requestAnimationFrame(() => back.classList.add("open"));
    return close;
  }

  function confirmDialog(message, onYes, yesLabel) {
    sheet("Confirm", '<p class="muted" style="margin:4px 0 18px">' + esc(message) + '</p>' +
      '<div class="row-btns"><button class="btn btn-ghost" data-x>Cancel</button>' +
      '<button class="btn btn-primary" data-yes>' + esc(yesLabel || "Yes") + '</button></div>',
      (body, close) => {
        body.querySelector("[data-x]").onclick = close;
        body.querySelector("[data-yes]").onclick = () => { close(); onYes && onYes(); };
      });
  }

  /* ---- Charts (SVG, no deps) ----------------------------------------- */
  function weightChart(data, opts) {
    const W = 320, H = 150, pad = { l: 30, r: 12, t: 12, b: 20 };
    if (!data.length) return '<div class="chart-empty">Log your weight to see the trend.</div>';
    const ys = data.map((d) => d.lbs);
    let lo = Math.min(opts.target, ...ys) - 3, hi = Math.max(opts.start, ...ys) + 3;
    const x = (i) => pad.l + (data.length === 1 ? (W - pad.l - pad.r) / 2 : i * (W - pad.l - pad.r) / (data.length - 1));
    const y = (v) => pad.t + (hi - v) * (H - pad.t - pad.b) / (hi - lo);
    const line = data.map((d, i) => (i ? "L" : "M") + x(i).toFixed(1) + " " + y(d.lbs).toFixed(1)).join(" ");
    const area = line + " L" + x(data.length - 1).toFixed(1) + " " + (H - pad.b) + " L" + x(0).toFixed(1) + " " + (H - pad.b) + " Z";
    const tY = y(opts.target), sY = y(opts.start);
    const grid = [lo, Math.round((lo + hi) / 2), hi].map((v) =>
      '<text x="2" y="' + (y(v) + 3).toFixed(1) + '" class="ax">' + Math.round(v) + '</text>').join("");
    const dots = data.map((d, i) => '<circle cx="' + x(i).toFixed(1) + '" cy="' + y(d.lbs).toFixed(1) + '" r="2.6" class="dot"/>').join("");
    return '<svg viewBox="0 0 ' + W + ' ' + H + '" class="chart" preserveAspectRatio="xMidYMid meet">' +
      '<line x1="' + pad.l + '" x2="' + (W - pad.r) + '" y1="' + tY.toFixed(1) + '" y2="' + tY.toFixed(1) + '" class="ref ref-target"/>' +
      '<text x="' + (W - pad.r) + '" y="' + (tY - 4).toFixed(1) + '" class="ref-lbl" text-anchor="end">target ' + opts.target + '</text>' +
      '<line x1="' + pad.l + '" x2="' + (W - pad.r) + '" y1="' + sY.toFixed(1) + '" y2="' + sY.toFixed(1) + '" class="ref ref-start"/>' +
      grid +
      '<path d="' + area + '" class="area"/><path d="' + line + '" class="trend"/>' + dots +
      '</svg>';
  }

  function barChart(data, opts) {
    opts = opts || {};
    const W = 320, H = 140, pad = { l: 24, r: 10, t: 10, b: 22 };
    if (!data.length) return '<div class="chart-empty">No data yet.</div>';
    const max = opts.max || Math.max(opts.target || 0, ...data.map((d) => d.value)) * 1.15 || 1;
    const bw = (W - pad.l - pad.r) / data.length;
    const y = (v) => pad.t + (1 - v / max) * (H - pad.t - pad.b);
    const bars = data.map((d, i) => {
      const bx = pad.l + i * bw + bw * 0.18, w = bw * 0.64, by = y(d.value), h = (H - pad.b) - by;
      return '<rect x="' + bx.toFixed(1) + '" y="' + by.toFixed(1) + '" width="' + w.toFixed(1) + '" height="' + Math.max(0, h).toFixed(1) +
        '" rx="3" class="bar' + (opts.target && d.value >= opts.target ? " bar-hit" : "") + '"/>' +
        '<text x="' + (bx + w / 2).toFixed(1) + '" y="' + (H - 7) + '" class="ax" text-anchor="middle">' + esc(d.label) + '</text>';
    }).join("");
    const tline = opts.target ? '<line x1="' + pad.l + '" x2="' + (W - pad.r) + '" y1="' + y(opts.target).toFixed(1) +
      '" y2="' + y(opts.target).toFixed(1) + '" class="ref ref-target"/>' : "";
    return '<svg viewBox="0 0 ' + W + ' ' + H + '" class="chart" preserveAspectRatio="xMidYMid meet">' + tline + bars + '</svg>';
  }

  function ring(pct, label, sub) {
    const r = 34, c = 2 * Math.PI * r, off = c * (1 - Math.max(0, Math.min(1, pct)));
    return '<div class="ring-wrap"><svg viewBox="0 0 84 84" class="ring">' +
      '<circle cx="42" cy="42" r="' + r + '" class="ring-bg"/>' +
      '<circle cx="42" cy="42" r="' + r + '" class="ring-fg" stroke-dasharray="' + c.toFixed(1) +
      '" stroke-dashoffset="' + off.toFixed(1) + '" transform="rotate(-90 42 42)"/>' +
      '<text x="42" y="46" class="ring-num">' + label + '</text></svg>' +
      (sub ? '<div class="ring-sub">' + esc(sub) + '</div>' : "") + '</div>';
  }

  function segmented(opts, current, act) {
    return '<div class="seg">' + opts.map((o) =>
      '<button class="seg-b' + (o.v === current ? " on" : "") + '" data-act="' + act + '" data-v="' + esc(o.v) + '">' + esc(o.t) + '</button>'
    ).join("") + '</div>';
  }

  const icons = {
    home: 'M3 9.5 12 3l9 6.5V21H3z',
    dumbbell: 'M6.5 6.5 17.5 17.5M4 9l-1 1 11 11 1-1M15 4l-1 1 5 5 1-1M3 13l-2 2 1 1 2-2M21 11l2-2-1-1-2 2',
    heart: 'M20.8 5.6a5.5 5.5 0 0 0-7.8 0L12 6.6l-1-1a5.5 5.5 0 1 0-7.8 7.8L12 22l8.8-8.6a5.5 5.5 0 0 0 0-7.8z',
    chart: 'M3 21h18M7 21V11M12 21V5M17 21v-8',
    menu: 'M4 7h16M4 12h16M4 17h16'
  };
  function icon(name) {
    return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="' + icons[name] + '"/></svg>';
  }

  return { esc, toast, sheet, confirmDialog, weightChart, barChart, ring, segmented, icon };
})();
