/* Bunn & Hekaya — interactions
   1. Language   2. Nav   3. Open-now status + hours
   4. Menu tabs  5. Coupon  6. Booking form  7. Reveal
*/
(() => {
  "use strict";

  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const root = document.documentElement;

  /* ---------- data ---------- */
  // [opens, closes] in 24h minutes; closes may pass midnight. Sunday = 0.
  const HOURS = [
    [8 * 60, 24 * 60], [8 * 60, 24 * 60], [8 * 60, 24 * 60], [8 * 60, 24 * 60],
    [8 * 60, 26 * 60], [13 * 60, 26 * 60], [9 * 60, 25 * 60]
  ];
  const DAYS = {
    ar: ["الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"],
    en: ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]
  };

  const MENU = [
    { id: "hot", ar: "قهوة", en: "Coffee", items: [
      { ar: "إسبريسو", en: "Espresso", dAr: "شوت مزدوج من خلطة البيت", dEn: "Double shot of the house blend", p: 45 },
      { ar: "كورتادو", en: "Cortado", dAr: "إسبريسو وحليب بنفس الكمية", dEn: "Espresso cut with equal milk", p: 60 },
      { ar: "فلات وايت", en: "Flat White", dAr: "حليب ناعم وطبقة رقيقة", dEn: "Silky milk, thin microfoam", p: 70 },
      { ar: "V60 إثيوبي", en: "Ethiopian V60", dAr: "بُن الأسبوع، مقطّر يدويًا", dEn: "This week's single origin, hand-brewed", p: 85, tag: ["مختص", "Single origin"] },
      { ar: "قهوة عربي بالهيل", en: "Arabic Coffee", dAr: "بالهيل والزعفران", dEn: "With cardamom & saffron", p: 50 },
      { ar: "قهوة تركي", en: "Turkish Coffee", dAr: "على الرملة", dEn: "Brewed on hot sand", p: 40 }
    ]},
    { id: "cold", ar: "بارد", en: "Cold", items: [
      { ar: "كولد برو", en: "Cold Brew", dAr: "منقوع ١٨ ساعة", dEn: "Steeped for 18 hours", p: 75 },
      { ar: "آيس سبانش لاتيه", en: "Iced Spanish Latte", dAr: "بالحليب المكثف", dEn: "With condensed milk", p: 80 },
      { ar: "إسبريسو تونيك", en: "Espresso Tonic", dAr: "تونيك وقشر برتقال", dEn: "Tonic & orange peel", p: 85, tag: ["جديد", "New"] },
      { ar: "ليمون بالنعناع", en: "Mint Lemonade", dAr: "معصور فريش", dEn: "Freshly squeezed", p: 55 }
    ]},
    { id: "sweet", ar: "حلويات", en: "Bakery", items: [
      { ar: "كرواسون زبدة", en: "Butter Croissant", dAr: "بيتخبز كل صباح", dEn: "Baked every morning", p: 45 },
      { ar: "تشيز كيك باسك", en: "Basque Cheesecake", dAr: "قطعة", dEn: "Per slice", p: 95 },
      { ar: "كوكيز شوكولاتة", en: "Chocolate Cookie", dAr: "بالبندق والملح", dEn: "Hazelnut & sea salt", p: 40 },
      { ar: "بسبوسة بالقشطة", en: "Basbousa & Cream", dAr: "وصفة البيت", dEn: "House recipe", p: 55 }
    ]}
  ];

  const T = {
    ar: { open: c => `مفتوح الآن · يقفل ${c}`, closed: o => `مقفول دلوقتي · يفتح ${o}`, today: "النهارده",
          copied: "اتنسخ ✓", copy: "انسخ", egp: "ج.م", next: "بكرة",
          need: "من فضلك كمّل البيانات المطلوبة.", phone: "رقم الموبايل لازم يكون ١١ رقم ويبدأ بـ 01.",
          ok: (n, d, t, p) => `تمام يا ${n}! وصلنا طلب حجز طاولة (عدد الأشخاص: ${p}) يوم ${d} الساعة ${t}. هنكلمك للتأكيد. (نموذج تجريبي)` },
    en: { open: c => `Open now · closes ${c}`, closed: o => `Closed now · opens ${o}`, today: "Today",
          copied: "Copied ✓", copy: "Copy", egp: "EGP", next: "tomorrow",
          need: "Please fill in the required fields.", phone: "Mobile number should be 11 digits starting with 01.",
          ok: (n, d, t, p) => `Thanks ${n}! Table for ${p} on ${d} at ${t} received. We'll call to confirm. (demo form)` }
  };

  let lang = "ar";
  let tab = MENU[0].id;
  const tr = () => T[lang];

  /* ---------- helpers ---------- */
  const clock = (m, l = lang) => {
    const h24 = Math.floor(m / 60) % 24, mm = m % 60;
    if (h24 === 0 && mm === 0) return l === "ar" ? "منتصف الليل" : "midnight";
    const h12 = ((h24 + 11) % 12) + 1;
    const suffix = l === "ar" ? (h24 < 12 ? "ص" : "م") : (h24 < 12 ? "AM" : "PM");
    return `${h12}${mm ? ":" + String(mm).padStart(2, "0") : ""} ${suffix}`;
  };

  /* ---------- 1. language ---------- */
  const setLang = l => {
    lang = l;
    root.lang = l;
    root.dir = l === "ar" ? "rtl" : "ltr";
    $("#lang").textContent = l === "ar" ? "EN" : "ع";
    $("#lang").setAttribute("aria-label", l === "ar" ? "English" : "العربية");
    document.title = l === "ar" ? "بُنّ وحكاية | محمصة وقهوة مختصة" : "Bunn & Hekaya | Specialty Coffee Roastery";
    renderStatus(); renderHours(); renderMenu(); renderTimes();
    $("#copy").textContent = tr().copy;
  };
  $("#lang").addEventListener("click", () => setLang(lang === "ar" ? "en" : "ar"));

  /* ---------- 2. nav ---------- */
  const nav = $("#nav");
  const onScroll = () => nav.classList.toggle("is-scrolled", scrollY > 8);
  addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* ---------- 3. status + hours ---------- */
  function renderStatus() {
    const now = new Date();
    const day = now.getDay(), mins = now.getHours() * 60 + now.getMinutes();
    const prev = (day + 6) % 7;
    const [o, c] = HOURS[day];
    const [, pc] = HOURS[prev];
    let open = false, closeAt = 0;
    if (mins >= o && mins < c) { open = true; closeAt = c; }
    else if (pc > 1440 && mins < pc - 1440) { open = true; closeAt = pc; }
    const el = $("#status");
    el.classList.toggle("is-open", open);
    el.classList.toggle("is-closed", !open);
    el.querySelector("span").textContent = open
      ? tr().open(clock(closeAt))
      : tr().closed(mins < o ? clock(o) : `${tr().next} ${clock(HOURS[(day + 1) % 7][0])}`);
  }

  function renderHours() {
    const today = new Date().getDay();
    $("#hours").innerHTML = HOURS.map(([o, c], i) =>
      `<li class="${i === today ? "is-today" : ""}"><span data-today="${tr().today}">${DAYS[lang][i]}</span><b><bdi>${clock(o)}</bdi> – <bdi>${clock(c)}</bdi></b></li>`
    ).join("");
  }

  /* ---------- 4. menu ---------- */
  function renderMenu() {
    const tabs = $("#tabs");
    tabs.innerHTML = MENU.map(m =>
      `<button role="tab" type="button" id="tab-${m.id}" aria-selected="${m.id === tab}" tabindex="${m.id === tab ? 0 : -1}" data-id="${m.id}">${m[lang]}</button>`
    ).join("");
    const cat = MENU.find(m => m.id === tab);
    const list = $("#menuList");
    list.setAttribute("aria-labelledby", `tab-${tab}`);
    list.style.animation = "none"; void list.offsetWidth; list.style.animation = "";
    list.innerHTML = cat.items.map(it => `
      <div class="item">
        <span class="item__name">${lang === "ar" ? it.ar : it.en}${it.tag ? `<span class="item__tag">${it.tag[lang === "ar" ? 0 : 1]}</span>` : ""}</span>
        <span class="item__dots"></span>
        <span class="item__price">${it.p} <small>${tr().egp}</small></span>
        <p class="item__desc">${lang === "ar" ? it.dAr : it.dEn}</p>
      </div>`).join("");

    const btns = $$("button", tabs);
    btns.forEach((b, i) => {
      b.addEventListener("click", () => { tab = b.dataset.id; renderMenu(); $(`#tab-${tab}`).focus(); });
      b.addEventListener("keydown", e => {
        const fwd = lang === "ar" ? "ArrowLeft" : "ArrowRight", back = lang === "ar" ? "ArrowRight" : "ArrowLeft";
        const d = e.key === fwd ? 1 : e.key === back ? -1 : 0;
        if (!d) return;
        tab = MENU[(i + d + MENU.length) % MENU.length].id; renderMenu(); $(`#tab-${tab}`).focus();
      });
    });
  }

  /* ---------- 5. coupon ---------- */
  $("#copy").addEventListener("click", async () => {
    try { await navigator.clipboard.writeText("HEKAYA2"); } catch (e) { /* clipboard blocked: code is visible anyway */ }
    $("#copy").textContent = tr().copied;
    setTimeout(() => { $("#copy").textContent = tr().copy; }, 1800);
  });

  /* ---------- 6. booking ---------- */
  const form = $("#book");
  const dateIn = $("#bDate");
  const timeSel = $("#bTime");
  const msg = $("#bookMsg");
  const todayStr = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  dateIn.min = todayStr(new Date());
  dateIn.value = todayStr(new Date());

  function renderTimes() {
    const keep = timeSel.value;
    const d = dateIn.value ? new Date(dateIn.value + "T00:00") : new Date();
    const [o, c] = HOURS[d.getDay()];
    const isToday = dateIn.value === todayStr(new Date());
    const now = new Date(), nowM = now.getHours() * 60 + now.getMinutes();
    const slots = [];
    for (let m = o; m <= c - 60; m += 30) if (!isToday || m > nowM + 30) slots.push(m);
    timeSel.innerHTML = slots.length
      ? slots.map(m => `<option value="${m}">${clock(m)}</option>`).join("")
      : `<option value="">${lang === "ar" ? "مفيش مواعيد متاحة" : "No slots left"}</option>`;
    if ([...timeSel.options].some(op => op.value === keep)) timeSel.value = keep;
  }
  dateIn.addEventListener("change", renderTimes);

  form.addEventListener("submit", e => {
    e.preventDefault();
    const name = form.name, phone = form.phone;
    const phoneVal = phone.value.replace(/\D/g, "");
    const bad = [];
    if (!name.value.trim()) bad.push(name);
    if (!dateIn.value) bad.push(dateIn);
    if (!timeSel.value) bad.push(timeSel);
    const phoneBad = !/^01[0125]\d{8}$/.test(phoneVal);
    if (phoneBad) bad.push(phone);
    [name, phone, dateIn, timeSel].forEach(f => f.classList.toggle("is-invalid", bad.includes(f)));
    msg.className = "book__msg";
    if (bad.length) {
      msg.textContent = phoneBad && bad.length === 1 ? tr().phone : tr().need;
      msg.classList.add("is-error");
      bad[0].focus();
      return;
    }
    const d = new Date(dateIn.value + "T00:00");
    const dayLabel = `${DAYS[lang][d.getDay()]} ${d.toLocaleDateString(lang === "ar" ? "ar-EG" : "en-GB", { day: "numeric", month: "long" })}`;
    msg.textContent = tr().ok(name.value.trim(), dayLabel, clock(+timeSel.value), form.ppl.value);
    msg.classList.add("is-ok");
    form.reset();
    dateIn.value = todayStr(new Date());
    renderTimes();
  });
  form.addEventListener("input", e => e.target.classList.remove("is-invalid"));

  /* ---------- 7. reveal ---------- */
  const groups = new Map();
  $$(".reveal").forEach(el => {
    const i = groups.get(el.parentElement) || 0;
    el.style.setProperty("--d", `${Math.min(i, 4) * 0.08}s`);
    groups.set(el.parentElement, i + 1);
  });
  const io = new IntersectionObserver(es => es.forEach(e => {
    if (e.isIntersecting) { e.target.classList.add("is-in"); io.unobserve(e.target); }
  }), { threshold: 0.12, rootMargin: "0px 0px -30px 0px" });
  $$(".reveal").forEach(el => io.observe(el));

  setLang("ar");
  setInterval(renderStatus, 60000);
})();
