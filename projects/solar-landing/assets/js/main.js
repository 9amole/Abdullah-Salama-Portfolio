/* Dayy Solar — interactions
   1. Nav            2. Reveal + active link
   3. Hero day cycle 4. System-type tabs
   5. Calculator     6. Lead form -> WhatsApp
*/
(() => {
  "use strict";

  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const fmt = new Intl.NumberFormat("en-US", { maximumFractionDigits: 1 });

  /* Company WhatsApp number in international format, digits only (e.g. "2010XXXXXXXX").
     Empty = the visitor chooses the chat. */
  const WHATSAPP_NUMBER = "";

  /* ---------- 1. nav ---------- */
  const nav = $("#nav");
  const toggle = $("#navToggle");
  const setMenu = open => {
    nav.classList.toggle("is-open", open);
    toggle.setAttribute("aria-expanded", String(open));
    toggle.setAttribute("aria-label", open ? "إغلاق القائمة" : "فتح القائمة");
  };
  toggle.addEventListener("click", () => setMenu(!nav.classList.contains("is-open")));
  $$(".nav__links a").forEach(a => a.addEventListener("click", () => setMenu(false)));
  document.addEventListener("keydown", e => e.key === "Escape" && setMenu(false));
  const onScroll = () => nav.classList.toggle("is-scrolled", window.scrollY > 8);
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* ---------- 2. reveal + active link ---------- */
  const counters = new Map();
  $$(".reveal").forEach(el => {
    const i = counters.get(el.parentElement) || 0;
    el.style.setProperty("--d", `${Math.min(i, 4) * 0.09}s`);
    counters.set(el.parentElement, i + 1);
  });
  const revealObs = new IntersectionObserver(entries => entries.forEach(e => {
    if (e.isIntersecting) { e.target.classList.add("is-in"); revealObs.unobserve(e.target); }
  }), { threshold: 0.15, rootMargin: "0px 0px -40px 0px" });
  $$(".reveal").forEach(el => revealObs.observe(el));

  const links = $$(".nav__links a");
  const secObs = new IntersectionObserver(entries => entries.forEach(e => {
    if (e.isIntersecting) links.forEach(l => l.classList.toggle("is-active", l.hash === `#${e.target.id}`));
  }), { rootMargin: "-45% 0px -50% 0px" });
  ["how", "calc", "steps", "faq"].forEach(id => secObs.observe(document.getElementById(id)));

  /* ---------- 3. hero day cycle ---------- */
  const sun = $("#sun");
  const shines = $$(".panel__shine");
  const flows = $$(".flow");
  const wins = $$(".win");
  const led = $("#led");
  const batFill = $("#batFill");
  const skyTop = $("#skyTop");
  const kwEl = $("#kw"), kwhEl = $("#kwh"), clockEl = $("#clock"), dayBar = $("#dayBar");

  const PEAK_KW = 5.5;          // system size shown in the scene
  const DAY_MS = 14000;         // 06:00 → 18:00
  const NIGHT_MS = 2600;        // short evening pause
  const ARC = { cx: 240, cy: 330, rx: 200, ry: 175 };
  const lerp = (a, b, t) => a + (b - a) * t;
  const mix = (c1, c2, t) => {
    const p = c => [1, 3, 5].map(i => parseInt(c.slice(i, i + 2), 16));
    const [a, b] = [p(c1), p(c2)];
    return `rgb(${a.map((v, i) => Math.round(lerp(v, b[i], t))).join(",")})`;
  };

  let energy = 0, last = null;
  const render = (t, dt) => {
    // t: 0 → 1 across daylight; > 1 = evening
    const day = Math.min(t, 1);
    const theta = Math.PI * day;
    const x = ARC.cx - ARC.rx * Math.cos(theta);
    const y = ARC.cy - ARC.ry * Math.sin(theta);
    sun.setAttribute("transform", `translate(${x.toFixed(1)} ${y.toFixed(1)})`);
    sun.style.opacity = t > 1 ? 0 : 1;

    const power = t > 1 ? 0 : PEAK_KW * Math.pow(Math.sin(theta), 1.3);
    energy += power * (dt / 3600000) * (12 * 3600000 / DAY_MS); // scale sim time to 12h day
    const level = power / PEAK_KW;

    shines.forEach(s => s.style.opacity = (level * 0.45).toFixed(2));
    flows.forEach((f, i) => {
      f.style.opacity = level > 0.05 ? Math.min(1, level * 1.4) : 0;
      f.style.strokeDashoffset = String((-(performance.now() / (60 - level * 30)) - i * 4) % 1000);
    });
    led.classList.toggle("is-on", level > 0.05);
    wins.forEach(w => w.classList.toggle("is-lit", t > 1));
    batFill.setAttribute("height", (47 * Math.min(1, energy / 30)).toFixed(1));
    batFill.setAttribute("y", (323 - 47 * Math.min(1, energy / 30)).toFixed(1));
    skyTop.setAttribute("stop-color", t > 1 ? "#9fb8b9" : mix("#e9d8b8", "#cfe3df", Math.sin(theta)));

    const minutes = 6 * 60 + Math.round(day * 12 * 60);
    clockEl.textContent = `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`;
    dayBar.style.width = `${day * 100}%`;
    kwEl.textContent = fmt.format(power);
    kwhEl.textContent = fmt.format(energy);
  };

  // ?t=0.5 freezes the scene at that point of the day (handy for screenshots)
  const frozen = parseFloat(new URLSearchParams(location.search).get("t"));
  if (reduceMotion || !Number.isNaN(frozen)) {
    const t = Number.isNaN(frozen) ? 0.5 : Math.min(Math.max(frozen, 0), 1);
    energy = PEAK_KW * 12 * (2 / Math.PI) * (1 - Math.cos(Math.PI * t)) / 2;
    render(t, 0);
    if (!Number.isNaN(frozen)) document.documentElement.classList.add("is-static");
  } else {
    let visible = true, start = null;
    new IntersectionObserver(([e]) => { visible = e.isIntersecting; }).observe($(".scene"));
    const loop = now => {
      if (start === null) { start = now; last = now; }
      const dt = now - last; last = now;
      if (visible) {
        const cycle = (now - start) % (DAY_MS + NIGHT_MS);
        if (cycle < dt) energy = 0; // new day
        render(cycle / DAY_MS, cycle <= DAY_MS ? dt : 0);
      }
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  }

  /* ---------- 4. tabs ---------- */
  const tabs = $$('[role="tab"]');
  const selectTab = tab => {
    tabs.forEach(t => {
      const on = t === tab;
      t.setAttribute("aria-selected", String(on));
      t.tabIndex = on ? 0 : -1;
      document.getElementById(t.getAttribute("aria-controls")).hidden = !on;
    });
  };
  tabs.forEach((tab, i) => {
    tab.addEventListener("click", () => selectTab(tab));
    tab.addEventListener("keydown", e => {
      // RTL: ArrowLeft moves to the next tab
      const dir = e.key === "ArrowLeft" ? 1 : e.key === "ArrowRight" ? -1 : 0;
      if (!dir) return;
      const next = tabs[(i + dir + tabs.length) % tabs.length];
      selectTab(next); next.focus();
    });
  });

  /* ---------- 5. calculator ---------- */
  const SUN_HOURS = 5.5, PERF = 0.8, PANEL_W = 550, PANEL_M2 = 2.6, GRID_KG_PER_KWH = 0.45;
  const usage = $("#usage");
  const out = {
    usage: $("#usageOut b"), kw: $("#rKw"), panels: $("#rPanels"),
    area: $("#rArea"), year: $("#rYear"), co2: $("#rCo2"), summary: $("#calcSummary")
  };
  let result = {};
  const set = (el, val) => {
    if (el.textContent === val) return;
    el.textContent = val;
    el.classList.remove("bump"); void el.offsetWidth; el.classList.add("bump");
  };
  const calc = () => {
    const kwhMonth = +usage.value;
    const cover = +$('input[name="cover"]:checked').value;
    const kw = (kwhMonth * cover) / (30 * SUN_HOURS * PERF);
    const panels = Math.max(1, Math.ceil((kw * 1000) / PANEL_W));
    const realKw = (panels * PANEL_W) / 1000;
    const yearKwh = realKw * SUN_HOURS * PERF * 365;
    result = { kw: realKw, panels };

    usage.style.setProperty("--fill", `${((kwhMonth - usage.min) / (usage.max - usage.min)) * 100}%`);
    out.usage.textContent = kwhMonth.toLocaleString("en-US");
    set(out.kw, realKw.toFixed(1));
    set(out.panels, String(panels));
    $("#rPanelsUnit").textContent = panels > 10 ? "لوحًا" : panels > 2 ? "ألواح" : panels === 2 ? "لوحان" : "لوح";
    set(out.area, String(Math.round(panels * PANEL_M2)));
    set(out.year, Math.round(yearKwh / 10) * 10 > 0 ? (Math.round(yearKwh / 10) * 10).toLocaleString("en-US") : "0");
    set(out.co2, fmt.format((yearKwh * GRID_KG_PER_KWH) / 1000));
    out.summary.textContent = `${realKw.toFixed(1)} kW · ${panels} ${panels > 10 ? "لوحًا" : panels > 2 ? "ألواح" : "لوح"}`;
  };
  usage.addEventListener("input", calc);
  $$('input[name="cover"]').forEach(r => r.addEventListener("change", calc));
  calc();

  /* ---------- 6. lead form ---------- */
  const form = $("#leadForm");
  const note = $("#formNote");
  form.addEventListener("submit", e => {
    e.preventDefault();
    const required = [form.name, form.city];
    const missing = required.filter(f => !f.value.trim());
    required.forEach(f => f.classList.toggle("is-invalid", missing.includes(f)));
    if (missing.length) {
      note.textContent = "من فضلك اكتب الاسم والمدينة.";
      note.classList.add("is-error");
      missing[0].focus();
      return;
    }
    note.classList.remove("is-error");
    const lines = [
      "مرحبًا، أريد حجز معاينة لنظام طاقة شمسية:",
      `الاسم: ${form.name.value.trim()}`,
      `المدينة: ${form.city.value.trim()}`,
      `نوع المكان: ${form.place.value}`
    ];
    if ($("#fCalc").checked) lines.push(`الاستهلاك الشهري: ${usage.value} kWh · النظام المقترح: ${result.kw.toFixed(1)} kW (${result.panels} ألواح)`);
    if (form.note.value.trim()) lines.push(`ملاحظات: ${form.note.value.trim()}`);
    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(lines.join("\n"))}`, "_blank", "noopener");
    note.textContent = "تم تجهيز رسالتك في واتساب، اضغط إرسال هناك.";
  });
  form.addEventListener("input", e => e.target.classList.remove("is-invalid"));
})();
