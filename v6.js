/* cmux site, sixth pass: the hero's split lines. They follow the pointer; a click on the hero's empty space keeps the split. */
(() => {
  const bg = document.getElementById("hero-split");
  if (!bg) return;
  const still = matchMedia("(prefers-reduced-motion: reduce)"), label = bg.querySelector(".sl");
  let x = innerWidth * 0.62, y = 300, tx = x, ty = y, raf = 0, lastMove = -1e9, vertical = true, onScreen = true;
  const cuts = [];
  const paint = () => {
    bg.style.setProperty("--x", x.toFixed(1) + "px");
    bg.style.setProperty("--y", y.toFixed(1) + "px");
    // the size, in terminal cells, of the pane the split would leave on the left
    label.textContent = `${Math.max(1, Math.round(x / 8.4))}×${Math.max(1, Math.round(y / 18))}`;
  };
  const frame = (now) => {
    raf = 0;
    if (!onScreen || document.hidden) return;
    const idle = now - lastMove > 2800;
    if (idle && !still.matches) { const w = bg.clientWidth, h = bg.clientHeight; tx = w * (0.5 + 0.34 * Math.sin(now / 5200)); ty = h * (0.42 + 0.2 * Math.sin(now / 3700 + 1)); }
    x += (tx - x) * (still.matches ? 1 : 0.14); y += (ty - y) * (still.matches ? 1 : 0.14);
    paint();
    if (!still.matches || Math.abs(tx - x) > 0.5) raf = requestAnimationFrame(frame);
  };
  const kick = () => { if (!raf) raf = requestAnimationFrame(frame); };
  const inside = (e) => { const r = bg.getBoundingClientRect(); return e.clientY >= r.top && e.clientY <= r.bottom ? r : null; };
  addEventListener("pointermove", (e) => {
    const r = e.pointerType !== "touch" && inside(e);
    if (!r) return;
    tx = e.clientX - r.left; ty = e.clientY - r.top; lastMove = performance.now();
    kick();
  }, { passive: true });
  addEventListener("click", (e) => {
    const r = inside(e);
    if (!r || e.target.closest("a, button, input, .cmux, .nav")) return;
    const cut = document.createElement("i");
    cut.className = "cut " + (vertical ? "v" : "h");
    cut.style.transform = vertical ? `translateX(${e.clientX - r.left}px)` : `translateY(${e.clientY - r.top}px)`;
    vertical = !vertical;
    bg.prepend(cut);
    cuts.push(cut);
    if (cuts.length > 6) cuts.shift().remove();
  });
  new IntersectionObserver(([e]) => { onScreen = e.isIntersecting; kick(); }).observe(bg);
  paint();
  kick();
})();
