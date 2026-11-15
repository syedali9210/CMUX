/**
 * Stack: what cmux is made of, as four rounded plates held slightly apart.
 * From the ground up: the libghostty renderer (a row of cells), the Swift and
 * AppKit window (a title bar and its lights), the socket (one slot), and the
 * agents standing on top. The plate under the pointer floats free of the ones
 * around it. The slider is how far the stack opens, in world units.
 *
 * The pattern: discrete items on tweens, staggered by distance from the plate
 * chosen, picked by fixed screen bands measured on the rest pose.
 */
const {
  Cam, clamp, facing, fit, poly, prism, proj, ringAt, rings, rrect, seg,
  tdone, tset, tval, tween, disposer, flatDot, mk, place, pointer, put, register, solid,
} = HL;

const W = 112, D = 84, T = 6, GAP = 18, N = 4, STEP = 45;
const NAMES = ["ghostty", "appkit", "socket", "agents"];
const BLOCKS = [[14, 12, 40, 38, 14], [46, 28, 72, 54, 9], [78, 44, 102, 70, 12]];
const rest = (i) => i * (T + GAP);

function mount({ stage, svg, read }, value) {
  const bag = disposer();
  let spread = value;

  // Fitted to the stack fully open with the agents standing on it, so nothing leaves the frame.
  const C = Cam(45, 0.5, 1.5), TOP = rest(N - 1) + T + 14 + 24;
  fit(C, [[0, 0, 0], [W, 0, 0], [0, D, 0], [W, D, 0], [0, 0, TOP], [W, 0, TOP], [0, D, TOP], [W, D, TOP]], 200, 166);
  const P = proj(C), front = facing(C);
  const [ring, inner] = rings(0, 0, W, D, 12, 1.6);
  // every mark sits in the band along the near edges, the part of a plate the one above leaves in view
  const slot = rrect(W / 2 - 22, D - 15, W / 2 + 22, D - 6, 4.5, 5);
  const blocks = BLOCKS.map(([x0, y0, x1, y1, h]) => ({ r: rings(x0, y0, x1, y1, 5, 1.2), h }));

  const g = mk("g", {}, svg);
  const layers = [];
  for (let i = 0; i < N; i++) {
    const grp = mk("g", {}, g), plate = solid(grp), marks = [];
    if (i === 0) for (let k = 0; k < 9; k++) marks.push(flatDot(grp, C, 1.2, "dot off"));
    if (i === 1) { marks.push(mk("path", { class: "nf lo" }, grp)); for (let k = 0; k < 3; k++) marks.push(flatDot(grp, C, 1.3, "dot off")); }
    if (i === 2) marks.push(mk("path", { class: "nf hi" }, grp));
    if (i === 3) for (const _ of blocks) marks.push(solid(grp));
    layers.push({ plate, marks, z: tween(rest(i)), last: NaN });
  }

  function draw(i, z) {
    const L = layers[i], zt = z + T;
    if (z === L.last) return;
    L.last = z;
    put(L.plate, prism(P, front, ring, inner, z, zt));
    if (i === 0) L.marks.forEach((el, k) => place(el, P(16 + k * 10, D - 9, zt)));
    if (i === 1) {
      // a title bar: three lights and the rule beside them
      L.marks[0].setAttribute("d", seg(P(38, D - 9, zt), P(W - 14, D - 9, zt)));
      L.marks.slice(1).forEach((el, k) => place(el, P(13 + k * 7, D - 9, zt)));
    }
    if (i === 2) L.marks[0].setAttribute("d", poly(ringAt(P, slot, zt)));
    if (i === 3) L.marks.forEach((s, k) => put(s, prism(P, front, blocks[k].r[0], blocks[k].r[1], zt, zt + blocks[k].h)));
  }

  const B = register(stage, (_dt, now) => {
    let moving = false;
    layers.forEach((L, i) => { draw(i, tval(L.z, now)); if (!tdone(L.z, now)) moving = true; });
    return moving;
  });
  bag.add(B.unregister);

  // hit bands: one strip of screen per plate, measured on the rest pose. They never move.
  const cy = layers.map((_, i) => P(W / 2, D / 2, rest(i) + T)[1]);
  const cx = P(W / 2, D / 2, 0)[0], hw = P(W, 0, 0)[0] - cx, hh = P(W, D, 0)[1] - P(W / 2, D / 2, 0)[1], sp = cy[0] - cy[1];
  function hit([x, y]) {
    if (Math.abs(x - cx) > hw + 6 || y > cy[0] + hh + 6 || y < cy[N - 1] - hh - 20) return -1;
    return clamp(Math.round((cy[0] - y) / sp), 0, N - 1);
  }

  let act = -1;
  function aim(from) {
    const now = performance.now();
    layers.forEach((L, i) => {
      const up = act < 0 ? 0 : i > act ? spread : i === act ? spread / 2 : 0;
      tset(L.z, rest(i) + up, now, Math.abs(i - from) * STEP);
    });
    B.wake();
  }
  function setActive(a) {
    if (a === act) return;
    const from = a >= 0 ? a : act;
    act = a;
    layers.forEach((L, i) => L.plate.sil.classList.toggle("hi", i === a));
    layers[2].marks[0].classList.toggle("hi", a < 0 || a === 2);
    layers[3].marks.forEach((s) => s.sil.classList.toggle("hi", a === 3));
    read.textContent = a < 0 ? "rest" : NAMES[a];
    aim(from);
  }

  bag.add(pointer(stage, { move: (p) => setActive(hit(p)), leave: () => setActive(-1) }));
  bag.add(() => svg.replaceChildren());

  return {
    set: (v) => { spread = v; if (act >= 0) aim(act); },
    destroy: bag.dispose,
  };
}

hairline({
  name: "stack",
  means: "Four layers of cmux, renderer to agents: the one under the pointer floats free of the stack.",
  rules: [1, 2, 5, 9],
  range: [8, 16, 24],
  mount,
});
