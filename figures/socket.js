/**
 * Socket: one round hub, the Unix socket, with five callers standing round it,
 * each on a dashed line to the hub. At rest the hub is the bright one. The
 * caller nearest the pointer rises and its line goes bright: that call is on
 * the wire. Each caller's lid carries its number in dots, and the read-out
 * names the socket method it stands for. The slider is how far a caller rises.
 *
 * The pattern: discrete items on tweens, staggered by distance round the ring,
 * picked by the nearest resting centre so a rising block cannot flip the choice.
 */
const {
  Cam, circ, facing, fit, poly, prism, proj, rad, ringAt, rings, rrect, seg,
  tdone, tset, tval, tween, disposer, flatDot, mk, place, pointer, put, register, solid,
} = HL;

const N = 5, RAD = 64, HALF = 11, HUB = 16, HUBH = 14, STEP = 45, REACH = 32;
const HEIGHT = [10, 16, 8, 13, 11];
const METHODS = ["workspace.list", "workspace.create", "surface.split", "surface.send_text", "notification.create"];

function mount({ stage, svg, read }, value) {
  const bag = disposer();
  let lift = value;

  const at = (k) => [RAD * Math.cos(rad(-150 + k * 72)), RAD * Math.sin(rad(-150 + k * 72))];
  const E = RAD + HALF, TOP = 16 + 11;
  const C = Cam(45, 0.5, 1.72);
  fit(C, [[-E, -E, 0], [E, -E, 0], [-E, E, 0], [E, E, 0], [-E, -E, TOP], [E, -E, TOP], [-E, E, TOP], [E, E, TOP]], 200, 166);
  const P = proj(C), front = facing(C);

  // guides first: they lie on the ground, behind everything that stands on it
  const g = mk("g", {}, svg);
  const guides = [];
  for (let k = 0; k < N; k++) guides.push(mk("path", { d: seg(P(...at(k), 0), P(0, 0, 0)), class: "nf dash" }, g));

  // the hub and the callers, appended far to near
  const order = [{ hub: true, d: 0 }];
  for (let k = 0; k < N; k++) order.push({ k, d: at(k)[0] + at(k)[1] });
  order.sort((a, b) => a.d - b.d);

  const callers = [];
  let hub = null;
  for (const o of order) {
    const s = solid(g);
    if (o.hub) {
      put(s, prism(P, front, circ(HUB, 28), circ(HUB - 1.8, 28), 0, HUBH));
      mk("path", { d: poly(ringAt(P, rrect(-7, -2.6, 7, 2.6, 2.6, 4), HUBH)), class: "nf lo" }, s.g);
      s.sil.classList.add("hi");
      hub = s;
      continue;
    }
    const [x, y] = at(o.k), dots = [];
    for (let j = 0; j <= o.k; j++) dots.push(flatDot(s.g, C, 1.1, "dot off"));
    callers[o.k] = { s, x, y, dots, rg: rings(x - HALF, y - HALF, x + HALF, y + HALF, 6, 1.4), z: tween(0), last: NaN };
  }

  function draw(c, k, z) {
    if (z === c.last) return;
    c.last = z;
    put(c.s, prism(P, front, c.rg[0], c.rg[1], z, z + HEIGHT[k]));
    c.dots.forEach((el, j) => place(el, P(c.x + (j - k / 2) * 3.6, c.y, z + HEIGHT[k])));
  }

  const B = register(stage, (_dt, now) => {
    let moving = false;
    callers.forEach((c, k) => { draw(c, k, tval(c.z, now)); if (!tdone(c.z, now)) moving = true; });
    return moving;
  });
  bag.add(B.unregister);

  // hit: the caller whose resting lid is nearest on screen, within reach. The centres never move.
  const centres = callers.map((c, k) => P(c.x, c.y, HEIGHT[k]));
  function hit([x, y]) {
    let best = -1, bd = REACH;
    centres.forEach(([cx, cy], k) => { const d = Math.hypot(x - cx, y - cy); if (d < bd) { bd = d; best = k; } });
    return best;
  }

  const round = (i, a) => Math.min(Math.abs(i - a), N - Math.abs(i - a));
  let act = -1;
  function aim(from) {
    const now = performance.now();
    callers.forEach((c, k) => tset(c.z, k === act ? lift : 0, now, round(k, from) * STEP));
    B.wake();
  }
  function setActive(a) {
    if (a === act) return;
    const from = a >= 0 ? a : act;
    act = a;
    hub.sil.classList.toggle("hi", a < 0);
    callers.forEach((c, k) => {
      c.s.sil.classList.toggle("hi", k === a);
      guides[k].classList.toggle("hi", k === a);
      c.dots.forEach((el) => el.classList.toggle("off", k !== a));
    });
    read.textContent = a < 0 ? "rest" : METHODS[a];
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
  name: "socket",
  means: "One socket, five callers: the one nearest the pointer rises and its line to the hub goes bright.",
  rules: [1, 2, 4, 10],
  range: [3, 7, 11],
  mount,
});
