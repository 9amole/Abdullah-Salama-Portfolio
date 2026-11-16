/* Tabqa 3D Studio — interactions
   1. Sticky nav + mobile menu
   2. Scroll reveal + active link
   3. Printer animation (hero)
   4. Order form -> WhatsApp
*/
(() => {
  "use strict";

  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* Set the studio's WhatsApp number here (international format, digits only).
     Leave empty to let the visitor choose the chat. */
  const WHATSAPP_NUMBER = "";

  /* ---------- 1. nav ---------- */
  const nav = $("#nav");
  const toggle = $("#navToggle");
  const fab = $(".fab");

  const onScroll = () => {
    const y = window.scrollY;
    nav.classList.toggle("is-scrolled", y > 8);
    const contactTop = $("#contact").getBoundingClientRect().top;
    fab.classList.toggle("is-visible", y > window.innerHeight * 0.8 && contactTop > window.innerHeight);
  };
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  const closeMenu = () => {
    nav.classList.remove("is-open");
    toggle.setAttribute("aria-expanded", "false");
    toggle.setAttribute("aria-label", "فتح القائمة");
  };
  toggle.addEventListener("click", () => {
    const open = nav.classList.toggle("is-open");
    toggle.setAttribute("aria-expanded", String(open));
    toggle.setAttribute("aria-label", open ? "إغلاق القائمة" : "فتح القائمة");
  });
  $$(".nav__links a").forEach(a => a.addEventListener("click", closeMenu));
  document.addEventListener("keydown", e => { if (e.key === "Escape") closeMenu(); });

  /* ---------- 2. reveal + active section ---------- */
  const groups = new Map();
  $$(".reveal").forEach(el => {
    const parent = el.parentElement;
    const i = groups.get(parent) || 0;
    el.style.setProperty("--d", `${Math.min(i, 4) * 0.08}s`);
    groups.set(parent, i + 1);
  });

  const revealObs = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add("is-in");
      revealObs.unobserve(entry.target);
    });
  }, { threshold: 0.15, rootMargin: "0px 0px -40px 0px" });
  $$(".reveal").forEach(el => revealObs.observe(el));

  // steps: progress line follows how many steps are visible
  const steps = $$(".step");
  const stepsList = $("#stepsList");
  new MutationObserver(() => {
    const done = steps.filter(s => s.classList.contains("is-in")).length;
    stepsList.style.setProperty("--progress", Math.max(0, (done - 1) / (steps.length - 1)));
  }).observe(stepsList, { subtree: true, attributes: true, attributeFilter: ["class"] });

  const links = $$(".nav__links a");
  const sectionObs = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      links.forEach(l => l.classList.toggle("is-active", l.getAttribute("href") === `#${entry.target.id}`));
    });
  }, { rootMargin: "-45% 0px -50% 0px" });
  ["service", "work", "steps", "faq"].forEach(id => sectionObs.observe(document.getElementById(id)));

  /* ---------- 3. printer ---------- */
  const clip = $("#clipRect");
  const gantry = $("#gantry");
  const head = $("#head");
  const pct = $("#pct");
  const bar = $("#bar");
  const layerTxt = $("#layerTxt");

  const BED_Y = 340, TOP_Y = 160, H = BED_Y - TOP_Y;
  const X_MIN = 150, X_MAX = 270;
  const LAYERS = 240;
  const PRINT_MS = 9000, HOLD_MS = 1600;

  const setFrame = (p, t) => {
    const h = H * p;
    clip.setAttribute("y", BED_Y - h);
    clip.setAttribute("height", h);
    const gy = BED_Y - h - 25;
    gantry.setAttribute("transform", `translate(0 ${gy})`);
    const x = X_MIN + (X_MAX - X_MIN) * (0.5 + 0.5 * Math.sin(t / 140));
    head.setAttribute("transform", `translate(${x} 0)`);
    const layer = Math.round(LAYERS * p);
    layerTxt.textContent = `LAYER ${String(layer).padStart(3, "0")} / ${LAYERS}`;
    const percent = Math.round(p * 100);
    pct.textContent = p >= 1 ? "DONE ✓" : `${percent}%`;
    bar.style.width = `${percent}%`;
  };

  if (reduceMotion) {
    setFrame(1, 0);
  } else {
    let start = null, visible = true;
    new IntersectionObserver(([e]) => { visible = e.isIntersecting; }).observe($(".printer"));
    const loop = now => {
      if (start === null) start = now;
      if (visible) {
        const t = (now - start) % (PRINT_MS + HOLD_MS);
        const p = Math.min(t / PRINT_MS, 1);
        const eased = p < 1 ? p : 1;
        setFrame(eased, p < 1 ? now : 0);
        if (p >= 1) head.setAttribute("transform", `translate(${X_MAX + 40} 0)`);
      }
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  }

  /* ---------- 4. form ---------- */
  const form = $("#orderForm");
  const note = $("#formNote");

  form.addEventListener("submit", e => {
    e.preventDefault();
    const name = form.name.value.trim();
    const msg = form.msg.value.trim();
    form.name.classList.toggle("is-invalid", !name);
    form.msg.classList.toggle("is-invalid", !msg);

    if (!name || !msg) {
      note.textContent = "من فضلك اكتب الاسم وتفاصيل القطعة.";
      note.classList.add("is-error");
      (name ? form.msg : form.name).focus();
      return;
    }
    note.classList.remove("is-error");

    const text = [
      "مرحبًا، أريد طلب طباعة ثلاثية الأبعاد:",
      `الاسم: ${name}`,
      `نوع الطلب: ${form.type.value}`,
      `التقنية: ${form.tech.value}`,
      `التفاصيل: ${msg}`
    ].join("\n");

    const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`;
    window.open(url, "_blank", "noopener");
    note.textContent = "تم تجهيز رسالتك في واتساب، اضغط إرسال هناك.";
  });

  ["input", "change"].forEach(evt => form.addEventListener(evt, e => e.target.classList.remove("is-invalid")));
})();
