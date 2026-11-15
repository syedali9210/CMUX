/**
 * Panes: a cmux window as a plate carrying a sidebar and three split panes.
 * One pane stands proud with a bright rim: the agent in it is waiting. Its
 * dot in the sidebar is bright too, which is the unread badge. The pane under
 * the pointer takes the ring and rises; the others settle. The slider is how
 * far a ringing pane rises, in world units.
 *
 * The pattern: discrete items on tweens, staggered by distance, picked on the
 * panes' resting tops so a pane lifting cannot move out from under the pointer.
 */
const {
  Cam, facing, fit, prism, proj, rings, seg, unproj,
  tdone, tset, tval, tween, disposer, flatDot, mk, place, pointer, put, register, solid,
} = HL;

const W = 150, D = 100, BASE = 4, TILE = 3, STEP = 45;
// x0, y0, x1, y1, rest lift: far to near, so they are appended in this order
const PANES = [[36, 5, 92, 58, 1.5], [96, 5, 145, 58, 6], [36, 62, 145, 95, 0]];
const RING = 1;

function mount({ stage, svg, read }, value) {
  const bag = disposer();
  let lift = value;

  const C = Cam(45, 0.5, 1.5), TOP = BASE + TILE + 18;
  fit(C, [[0, 0, 0], [W, 0, 0], [0, D, 0], [W, D, 0], [0, 0, TOP], [W, 0, TOP], [0, D, TOP], [W, D, TOP]], 200, 166);
  const P = proj(C), front = facing(C);

  const g = mk("g", {}, svg);
  const [bo, bi] = rings(0, 0, W, D, 10, 1.6);
  put(solid(g), prism(P, front, bo, bi, 0, BASE));

  // the sidebar: one strip that never moves, with a dot for each pane
  const [so, si] = rings(5, 5, 31, 95, 5, 1.2), SZ = BASE + 2.5;
  put(solid(g), prism(P, front, so, si, BASE, SZ));
  const dots = PANES.map((_, i) => {
    const el = flatDot(g, C, 1.5, i === RING ? "dot" : "dot off");
    place(el, P(18, 20 + i * 16, SZ));
    return el;
  });

  const panes = PANES.map(([x0, y0, x1, y1, r]) => {
    const s = solid(g), line = mk("path", { class: "nf lo" }, s.g);
    return { s, line, x0, y0, x1, y1, r, rg: rings(x0, y0, x1, y1, 5, 1.4), z: tween(r), last: NaN };
  });
  panes[RING].s.sil.classList.add("hi");

  function draw(p, z) {
    if (z === p.last) return;
    p.last = z;
    const z0 = BASE + z, zt = z0 + TILE;
    put(p.s, prism(P, front, p.rg[0], p.rg[1], z0, zt));
    // a prompt and one line of output, as a terminal would show
    p.line.setAttribute("d", seg(P(p.x0 + 8, p.y0 + 10, zt), P(p.x0 + 26, p.y0 + 10, zt)) + seg(P(p.x0 + 8, p.y0 + 18, zt), P(p.x0 + 40, p.y0 + 18, zt)));
  }

  const B = register(stage, (_dt, now) => {
    let moving = false;
    for (const p of panes) { draw(p, tval(p.z, now)); if (!tdone(p.z, now)) moving = true; }
    return moving;
  });
  bag.add(B.unregister);

  /** The pane whose resting top holds the pointer; -1 outside all three. */
  function hit([sx, sy]) {
    return panes.findIndex((p) => {
      const [x, y] = unproj(C, sx, sy, BASE + p.r + TILE);
      return x >= p.x0 && x <= p.x1 && y >= p.y0 && y <= p.y1;
    });
  }

  let act = -1;
  function aim(from) {
    const now = performance.now();
    panes.forEach((p, i) => tset(p.z, act < 0 ? p.r : i === act ? lift : 0, now, Math.abs(i - from) * STEP));
    B.wake();
  }
  function setActive(a) {
    if (a === act) return;
    const from = a >= 0 ? a : act, lit = a < 0 ? RING : a;
    act = a;
    panes.forEach((p, i) => p.s.sil.classList.toggle("hi", i === lit));
    dots.forEach((el, i) => el.classList.toggle("off", i !== lit));
    read.textContent = a < 0 ? "rest" : "pane " + (a + 1);
    aim(from);
  }

  bag.add(pointer(stage, { move: (p) => setActive(hit(p)), leave: () => setActive(-1) }));
  bag.add(() => svg.replaceChildren());

  return {
    set: (v) => { lift = v; if (act >= 0) aim(act); },
    destroy: bag.dispose,
  };
}

hairline({
  name: "panes",
  means: "A window of split panes: the one that needs you wears the ring, and the sidebar repeats it as a dot.",
  rules: [1, 4, 5, 6],
  range: [6, 11, 18],
  mount,
});
