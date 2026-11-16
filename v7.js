/* cmux site, seventh pass: the hero's cells and the footer's name. */
(() => {
  const still = matchMedia("(prefers-reduced-motion: reduce)");

  /* 1. the hero's background: terminal cells. A cell lights when the pointer passes and fades behind it, so the
        pointer writes a short trail in the headline's caret. Left alone, a cell blinks here and there, like an agent typing. */
  const cv = document.getElementById("hero-cells");
  if (cv) {
    const ctx = cv.getContext("2d"), CELL = 26, GAP = 3;
    let cols = 0, rows = 0, heat = new Float32Array(0), raf = 0, onScreen = true, ink = "107, 139, 237", w = 0, h = 0;
    const size = () => {
      const r = cv.getBoundingClientRect(), d = Math.min(devicePixelRatio || 1, 2);
      w = r.width; h = r.height; cols = Math.ceil(w / CELL); rows = Math.ceil(h / CELL);
      cv.width = w * d; cv.height = h * d;
      ctx.setTransform(d, 0, 0, d, 0, 0);
      heat = new Float32Array(cols * rows);
    };
    const draw = () => {
      raf = 0;
      ctx.clearRect(0, 0, w, h);
      let alive = false;
      for (let i = 0; i < heat.length; i++) {
        const v = heat[i];
        if (v < 0.02) continue;
        alive = true;
        ctx.fillStyle = `rgba(${ink}, ${Math.min(0.55, v * 0.55).toFixed(3)})`;
        ctx.fillRect((i % cols) * CELL + GAP, ((i / cols) | 0) * CELL + GAP, CELL - GAP * 2 + 1, CELL - GAP * 2 + 1);
        heat[i] = still.matches ? 0 : v * 0.93;
      }
      if (alive && onScreen && !document.hidden) raf = requestAnimationFrame(draw);
    };
    const kick = () => { if (!raf) raf = requestAnimationFrame(draw); };
    const warm = (x, y, amount, reach) => {
      const c0 = Math.floor(x / CELL), r0 = Math.floor(y / CELL);
      for (let r = r0 - reach; r <= r0 + reach; r++) for (let c = c0 - reach; c <= c0 + reach; c++) {
        if (r < 0 || c < 0 || r >= rows || c >= cols) continue;
        const d = Math.hypot(c - c0, r - r0), i = r * cols + c;
        heat[i] = Math.max(heat[i], amount * Math.exp(-d * d / 1.5));
      }
      kick();
    };
    const readInk = () => { const m = getComputedStyle(document.documentElement).getPropertyValue("--accent").trim().match(/^#(..)(..)(..)$/); if (m) ink = m.slice(1).map((x) => parseInt(x, 16)).join(", "); };
    addEventListener("pointermove", (e) => {
      if (e.pointerType === "touch" || !onScreen) return;
      const r = cv.getBoundingClientRect();
      if (e.clientY >= r.top && e.clientY <= r.bottom) warm(e.clientX - r.left, e.clientY - r.top, 1, 2);
    }, { passive: true });
    setInterval(() => { if (onScreen && !document.hidden && !still.matches) { const side = Math.random() < 0.5 ? 0.02 + Math.random() * 0.2 : 0.78 + Math.random() * 0.2; warm(w * side, h * (0.1 + Math.random() * 0.6), 0.7, 0); } }, 900);
    new IntersectionObserver(([e]) => { onScreen = e.isIntersecting; }).observe(cv);
    new MutationObserver(readInk).observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    addEventListener("resize", size);
    readInk(); size();
  }

  /* 2. the footer's name fills up to the pointer, and fills whole again when the pointer leaves */
  const mark = document.querySelector(".foot-mark");
  if (mark) {
    mark.addEventListener("pointermove", (e) => {
      if (e.pointerType === "touch") return;
      const r = mark.getBoundingClientRect();
      mark.classList.add("live");
      mark.style.setProperty("--fx", Math.min(100, Math.max(4, ((e.clientX - r.left) / r.width) * 100)).toFixed(1) + "%");
    }, { passive: true });
    mark.addEventListener("pointerleave", () => { mark.classList.remove("live"); mark.style.setProperty("--fx", "100%"); });
  }
})();
