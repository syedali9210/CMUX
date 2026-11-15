/* cmux site, second layer: the hero's character field, the eased scroll, the prompt rail, and the small interactions. */
(() => {
  const $ = (s, el = document) => el.querySelector(s), $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const still = matchMedia("(prefers-reduced-motion: reduce)"), fine = matchMedia("(hover: hover) and (pointer: fine)");
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

  /* 1. the hero's field: a terminal grid of characters. Diagonal bands drift through it, and it wakes under the pointer. */
  const cv = $("#field");
  if (cv) {
    const ctx = cv.getContext("2d"), RAMP = "·:;+=*#", CW = 15, CH = 22;
    let w = 0, h = 0, cols = 0, rows = 0, on = false, raf = 0, px = -999, py = -999, tx = -999, ty = -999, lastDraw = 0;
    const size = () => {
      const r = cv.getBoundingClientRect(), d = Math.min(devicePixelRatio || 1, 2);
      w = r.width; h = r.height; cols = Math.ceil(w / CW); rows = Math.ceil(h / CH);
      cv.width = w * d; cv.height = h * d;
      ctx.setTransform(d, 0, 0, d, 0, 0);
      ctx.font = '13px "Geist Mono", ui-monospace, monospace';
      ctx.textBaseline = "top";
      draw(performance.now());
    };
    function draw(now) {
      const t = still.matches ? 4 : now / 1000;
      px += (tx - px) * 0.12; py += (ty - py) * 0.12;
      ctx.clearRect(0, 0, w, h);
      for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
        const x = c * CW, y = r * CH;
        const band = Math.sin((x + y * 1.5) * 0.0075 - t * 0.55) * 0.5 + 0.5, fleck = Math.sin(c * 12.9898 + r * 78.233) * 43758.5453 % 1;
        const d2 = (x - px) ** 2 + (y - py) ** 2, near = Math.exp(-d2 / 26000);
        const v = Math.pow(band, 5) * (0.55 + 0.45 * Math.abs(fleck)) + near * 0.9;
        if (v < 0.16) continue;
        const k = clamp(v, 0, 1);
        // blue in the bands, violet where the pointer is
        ctx.fillStyle = near > 0.12 ? `rgba(${155 + 40 * near}, ${150}, 255, ${0.25 + 0.6 * near})` : `rgba(120, 150, 240, ${k * 0.32})`;
        ctx.fillText(RAMP[Math.min(RAMP.length - 1, (k * RAMP.length) | 0)], x, y);
      }
    }
    const loop = (now) => { raf = 0; if (!on || document.hidden) return; if (now - lastDraw > 33) { lastDraw = now; draw(now); } raf = requestAnimationFrame(loop); };
    const kick = () => { if (!raf && on && !still.matches) raf = requestAnimationFrame(loop); };
    new IntersectionObserver(([e]) => { on = e.isIntersecting; kick(); }).observe(cv);
    addEventListener("pointermove", (e) => { if (!on || e.pointerType === "touch") return; const r = cv.getBoundingClientRect(); tx = e.clientX - r.left; ty = e.clientY - r.top; }, { passive: true });
    document.addEventListener("visibilitychange", kick);
    addEventListener("resize", size);
    still.addEventListener("change", () => { draw(performance.now()); kick(); });
    document.fonts.ready.then(size);
  }

  /* 2. the eased scroll. The wheel sets a target and the window glides to it (ease-out); a link to a section
        travels there on an ease-in-out curve. Touch, keyboard and reduced motion keep the browser's own scroll. */
  let target = scrollY, cur = scrollY, raf = 0, last = 0, trip = null, stopped = false;
  const limit = () => document.documentElement.scrollHeight - innerHeight;
  const off = () => stopped || still.matches || !fine.matches || document.fullscreenElement;
  function glide(now) {
    const dt = Math.min(0.05, (now - last) / 1000 || 0.016);
    last = now;
    if (trip) {
      const k = clamp((now - trip.t0) / trip.dur, 0, 1), e = k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2;
      cur = target = trip.from + (trip.to - trip.from) * e;
      if (k >= 1) trip = null;
    } else cur += (target - cur) * (1 - Math.exp(-dt * 9));
    if (!trip && Math.abs(target - cur) < 0.5) { cur = target; raf = 0; } else raf = requestAnimationFrame(glide);
    scrollTo(0, cur);
  }
  const go = () => { if (!raf) { last = performance.now(); raf = requestAnimationFrame(glide); } };
  addEventListener("wheel", (e) => {
    if (off() || e.ctrlKey || e.defaultPrevented) return;
    e.preventDefault();
    trip = null;
    target = clamp(target + e.deltaY * (e.deltaMode === 1 ? 32 : 1), 0, limit());
    go();
  }, { passive: false });
  addEventListener("scroll", () => { if (!raf) target = cur = scrollY; }, { passive: true });
  document.addEventListener("click", (e) => {
    const a = e.target.closest('a[href^="#"]'), el = a && a.hash.length > 1 && $(a.hash);
    if (!el) return;
    e.preventDefault();
    const to = clamp(el.getBoundingClientRect().top + scrollY - (parseFloat(getComputedStyle(el).scrollMarginTop) || 88), 0, limit());
    history.pushState(null, "", a.hash);
    if (off()) return scrollTo(0, to);
    cur = scrollY;
    trip = { from: cur, to, t0: performance.now(), dur: clamp(Math.abs(to - cur) * 0.45, 500, 1200) };
    go();
  });
  window.__smoothStop = () => { stopped = true; trip = null; cancelAnimationFrame(raf); raf = 0; };

  /* 3. the rail: an index drawn as a prompt. The mark slides to the section in view and the line fills as you read. */
  $$(".rail").forEach((rail) => {
    const links = $$("a", rail), secs = links.map((a) => $(a.hash)), box = secs[0].parentElement;
    let act = -1;
    const set = (i) => {
      if (i === act) return;
      act = i;
      links.forEach((a, k) => a.classList.toggle("on", k === i));
      const a = links[i];
      rail.style.setProperty("--y", a.offsetTop + (a.offsetHeight - 20) / 2 + "px");
      rail.style.setProperty("--x", a.offsetLeft + "px");
      rail.style.setProperty("--w", a.offsetWidth + "px");
      rail.style.setProperty("--hue", a.dataset.hue || "var(--accent)");
    };
    const read = () => {
      const mid = innerHeight * 0.45, b = box.getBoundingClientRect();
      rail.style.setProperty("--p", clamp((mid - b.top) / b.height, 0, 1));
      let i = 0;
      secs.forEach((s, k) => { if (s.getBoundingClientRect().top < mid) i = k; });
      set(i);
    };
    addEventListener("scroll", read, { passive: true });
    addEventListener("resize", () => { act = -1; read(); });
    read();
  });

  /* 4. small things */
  // the nav: a pill glides under the link the pointer is on; the menu on a phone
  const links = $(".nav-links"), pill = $(".nav-pill");
  if (links && pill) {
    $$("a", links).forEach((a) => a.addEventListener("pointerenter", () => { pill.style.cssText = `opacity:1;width:${a.offsetWidth + 20}px;transform:translateX(${a.offsetLeft - 10}px)`; }));
    links.addEventListener("pointerleave", () => { pill.style.opacity = 0; });
  }
  const menuBtn = $("#menu-btn"), nav = $("#nav");
  if (menuBtn) {
    const shut = () => { nav.classList.remove("open"); menuBtn.setAttribute("aria-expanded", "false"); };
    menuBtn.addEventListener("click", () => { const o = nav.classList.toggle("open"); menuBtn.setAttribute("aria-expanded", o); });
    $$("#menu a").forEach((a) => a.addEventListener("click", shut));
    addEventListener("keydown", (e) => { if (e.key === "Escape") shut(); });
  }
  // the bar at the foot of a phone: there once the hero's buttons have gone, gone again at the closing call
  const dock = $("#dock"), heroCta = $(".hero .hero-cta"), endCta = $(".cta");
  if (dock) {
    const state = { hero: true, end: false };
    const io = new IntersectionObserver((es) => {
      es.forEach((e) => { state[e.target === heroCta ? "hero" : "end"] = e.isIntersecting; });
      dock.classList.toggle("show", !state.hero && !state.end && scrollY > 300);
    });
    io.observe(heroCta); io.observe(endCta);
  }
  // quotes: grey at rest. A pointer colours the one it is on; without a pointer, the ones in the middle of the screen
  if (!fine.matches) {
    const lit = new IntersectionObserver((es) => es.forEach((e) => e.target.classList.toggle("lit", e.isIntersecting)), { rootMargin: "-32% 0px -32% 0px" });
    const watch = () => $$(".q, .lead-quote").forEach((q) => lit.observe(q));
    watch(); setTimeout(watch, 600);
  }
  // code: pointing at a CLI line shows the socket call that does the same
  $$("[data-eq]").forEach((line) => {
    const out = $(".code-eq", line.closest(".code")), show = () => { out.textContent = line.dataset.eq; $$("[data-eq]", line.parentElement).forEach((l) => l.classList.toggle("on", l === line)); };
    line.addEventListener("pointerenter", show);
    line.addEventListener("focus", show);
  });
  // the demo's full screen button
  const fs = $("#fs"), cm = $("#cmux");
  if (fs) {
    if (!document.fullscreenEnabled) fs.hidden = true;
    fs.addEventListener("click", () => (document.fullscreenElement ? document.exitFullscreen() : cm.requestFullscreen()));
  }
  // the footer's horizon: its light follows the pointer along the rim
  const foot = $(".foot");
  if (foot) foot.addEventListener("pointermove", (e) => {
    if (e.pointerType === "touch") return;
    const r = $(".planet", foot).offsetWidth / 2, dx = e.clientX - innerWidth / 2;
    foot.style.setProperty("--mx", e.clientX + "px");
    foot.style.setProperty("--my", r - Math.sqrt(r * r - dx * dx) + "px");
  }, { passive: true });
})();
