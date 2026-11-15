/* cmux site, fourth pass: the theme switch, the hero's pane grid, the footer's dawn. */
(() => {
  const $ = (s, el = document) => el.querySelector(s);
  const still = matchMedia("(prefers-reduced-motion: reduce)"), root = document.documentElement;

  /* 1. theme: the system's until the switch is pressed, then the switch's. It changes at once. */
  const btn = $("#theme");
  if (btn) {
    const label = () => btn.setAttribute("aria-label", root.dataset.theme === "light" ? "Switch to the dark theme" : "Switch to the light theme");
    btn.addEventListener("click", () => {
      root.dataset.theme = root.dataset.theme === "light" ? "dark" : "light";
      try { localStorage.setItem("cmux-theme", root.dataset.theme); } catch {}
      label();
    });
    label();
  }

  /* 2. the hero's background: a cmux window of split panes, in hairline. The pane under the pointer takes the ring;
        left alone, the ring moves from pane to pane, the way agents take turns needing you. */
  const bg = $("#hero-bg");
  if (bg) {
    // column, row, columns wide, rows tall, on a 12 by 6 grid, tiling it exactly
    const PANES = [[1, 1, 3, 3], [4, 1, 5, 2], [4, 3, 5, 1], [9, 1, 4, 3], [1, 4, 2, 3], [3, 4, 4, 2], [3, 6, 4, 1], [7, 4, 3, 3], [10, 4, 3, 2], [10, 6, 3, 1]];
    bg.innerHTML = PANES.map(([c, r, w, h]) => `<i class="hp" style="grid-area:${r} / ${c} / span ${h} / span ${w}"></i>`).join("");
    const panes = [...bg.children], ORDER = [0, 3, 7, 4, 9, 5];
    let rects = [], cur = -1, lastMove = 0, step = 0, onScreen = true;
    const measure = () => { rects = panes.map((p) => p.getBoundingClientRect()).map((r) => ({ l: r.left, t: r.top + scrollY, r: r.right, b: r.bottom + scrollY })); };
    const ring = (i) => { if (i === cur) return; cur = i; panes.forEach((p, k) => p.classList.toggle("ring", k === i)); };
    addEventListener("resize", measure);
    document.fonts.ready.then(measure);
    addEventListener("pointermove", (e) => {
      if (e.pointerType === "touch" || !onScreen) return;
      const x = e.clientX, y = e.clientY + scrollY;
      const i = rects.findIndex((r) => x >= r.l && x < r.r && y >= r.t && y < r.b);
      if (i >= 0) { lastMove = performance.now(); ring(i); }
    }, { passive: true });
    new IntersectionObserver(([e]) => { onScreen = e.isIntersecting; }).observe(bg);
    setInterval(() => { if (onScreen && !document.hidden && !still.matches && performance.now() - lastMove > 2600) ring(ORDER[step++ % ORDER.length]); }, 2400);
    ring(ORDER[step++]);
  }

  /* 3. the footer's dawn rises as the footer comes into view */
  const foot = $(".foot");
  if (foot && !still.matches) {
    const rise = () => { const r = foot.getBoundingClientRect(); foot.style.setProperty("--rise", Math.min(1, Math.max(0, (innerHeight - r.top) / Math.min(r.height, innerHeight))).toFixed(3)); };
    addEventListener("scroll", rise, { passive: true });
    rise();
  }
})();
