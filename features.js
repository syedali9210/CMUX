/* The four feature scenes. Each is a small working picture: it plays by itself while on screen,
   and stops playing by itself the moment the visitor touches it. */
(() => {
  const $ = (s, el = document) => el.querySelector(s), $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const still = matchMedia("(prefers-reduced-motion: reduce)");

  /** Runs `step` every `ms` while `el` is on screen, until the visitor takes over. */
  function ambient(el, ms, step) {
    let timer = 0, taken = false;
    const stop = () => clearInterval(timer);
    new IntersectionObserver(([e]) => { stop(); if (e.isIntersecting && !taken && !still.matches) timer = setInterval(step, ms); }, { threshold: 0.35 }).observe(el);
    el.addEventListener("pointerdown", () => { taken = true; stop(); });
    el.addEventListener("keydown", () => { taken = true; stop(); });
  }

  /* 1. vertical tabs: rows open under the pointer; agents leave notes while you watch */
  const tabs = $("#v-tabs");
  if (tabs) {
    const rows = $$(".vt", tabs), NOTES = ["Needs input", "Build complete", "Tests pass", "Waiting for review", "Port 3000 ready"];
    let n = 0;
    const pick = (row) => { rows.forEach((r) => r.setAttribute("aria-pressed", r === row)); row.classList.remove("unread"); };
    rows.forEach((r) => r.addEventListener("click", () => pick(r)));
    ambient(tabs, 2200, () => {
      const quiet = rows.filter((r) => r.getAttribute("aria-pressed") !== "true");
      const row = quiet[n % quiet.length];
      $("i", row).textContent = NOTES[n++ % NOTES.length];
      row.classList.add("unread");
    });
  }

  /* 2. rings: click a pane to make its agent ask; the key jumps to the newest and clears it */
  const rings = $("#v-rings");
  if (rings) {
    const panes = $$(".vr", rings), say = $(".v-say", rings), order = [];
    const paint = () => {
      panes.forEach((p) => p.classList.toggle("ring", order.includes(p)));
      say.textContent = order.length ? `${order.length} waiting` : "All clear";
    };
    const ask = (p) => { if (!order.includes(p)) order.push(p); p.classList.remove("focus"); paint(); };
    const jump = () => {
      const p = order.pop();
      panes.forEach((x) => x.classList.toggle("focus", x === p));
      paint();
      if (!p) say.textContent = "Nothing unread";
    };
    panes.forEach((p) => p.addEventListener("click", () => (order.includes(p) ? (order.splice(order.indexOf(p), 1), panes.forEach((x) => x.classList.toggle("focus", x === p)), paint()) : ask(p))));
    $(".keybtn", rings).addEventListener("click", jump);
    let k = 0;
    ask(panes[1]);
    ambient(rings, 2400, () => (order.length > 1 ? jump() : ask(panes[(k += 2) % panes.length])));
  }

  /* 3. browser: each command does to the page what it says */
  const web = $("#v-web");
  if (web) {
    const cmds = $$(".vw-cmd", web), page = $(".vw-page", web), cur = $(".vw-cursor", web), log = $(".vw-log", web), field = $(".vw-field", web);
    const to = (el) => { const a = el.getBoundingClientRect(), b = page.getBoundingClientRect(); cur.style.transform = `translate(${a.left - b.left + a.width / 2}px, ${a.top - b.top + a.height / 2}px)`; };
    const DO = {
      navigate: () => { page.dataset.state = "loaded"; log.textContent = "loaded localhost:3000"; },
      snapshot: () => { page.dataset.state = "snap"; log.textContent = "DOM snapshot taken"; },
      click: () => { page.dataset.state = "loaded"; to($(".vw-btn", web)); $(".vw-btn", web).classList.add("hit"); setTimeout(() => $(".vw-btn", web).classList.remove("hit"), 500); log.textContent = "clicked the button"; },
      type: () => { page.dataset.state = "loaded"; to(field); field.textContent = "docs site"; log.textContent = "typed into the field"; },
      eval: () => { page.dataset.state = "loaded"; log.textContent = 'document.title → "Workspaces"'; },
    };
    let i = 0;
    const run = (c) => { cmds.forEach((x) => x.setAttribute("aria-pressed", x === c)); if (c.dataset.do === "navigate") field.textContent = ""; DO[c.dataset.do](); };
    cmds.forEach((c) => c.addEventListener("click", () => run(c)));
    ambient(web, 1700, () => run(cmds[i++ % cmds.length]));
  }

  /* 4. restore: quit, and everything comes back as it was */
  const rest = $("#v-restore");
  if (rest) {
    const win = $(".vs-win", rest), key = $(".keybtn", rest), label = $("span", key), keys = $("kbd", key);
    const set = (off) => {
      win.classList.toggle("off", off);
      label.textContent = off ? "Reopen previous session" : "Quit cmux";
      keys.textContent = off ? "⌘⇧O" : "⌘Q";
    };
    key.addEventListener("click", () => set(!win.classList.contains("off")));
    ambient(rest, 2600, () => set(!win.classList.contains("off")));
  }
})();
