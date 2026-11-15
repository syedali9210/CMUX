/* cmux site: scroll motion, small interactions, and the host for the hairline figures. No dependencies. */
(() => {
  const $ = (s, el = document) => el.querySelector(s), $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const still = matchMedia("(prefers-reduced-motion: reduce)");
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

  /* the host for the hairline figures: what the skill's bench does, for several figures on one page */
  window.hairline = (figure) => {
    const stage = $(`[data-fig="${figure.name}"]`);
    if (!stage) return;
    HL.inject(document);
    stage.setAttribute("data-hairline", figure.name);
    stage.setAttribute("role", "img");
    stage.setAttribute("aria-label", figure.means);
    const svg = HL.mk("svg", { viewBox: "0 0 400 320", "aria-hidden": "true" }, stage);
    const out = $(".fig-tag.r", stage.parentElement), hint = $(".fig-hint", stage.parentElement);
    let text = "rest";
    const read = {
      get textContent() { return text; },
      set textContent(v) { text = v == null ? "" : String(v); out.textContent = text === "rest" ? "" : text; if (text !== "rest" && hint) hint.hidden = true; },
    };
    figure.mount({ stage, svg, read }, figure.range[1]);
  };

  /* entrances: one observer, each thing once */
  const seen = new IntersectionObserver((entries) => {
    for (const e of entries) if (e.isIntersecting) { e.target.classList.add("in"); seen.unobserve(e.target); }
  }, { rootMargin: "0px 0px -8% 0px", threshold: 0.08 });
  $$("[data-in], .rule, .h1").forEach((el) => seen.observe(el));

  /* one scroll handler for everything tied to the scroll */
  const nav = $("#nav"), frame = $("#frame"), wall = $("#wall");
  let ticking = false;
  function onScroll() {
    ticking = false;
    const vh = innerHeight;
    nav.classList.toggle("is-stuck", scrollY > 24);
    if (still.matches) return;
    // the demo's frame stands up as it comes into view
    const f = frame.getBoundingClientRect(), p = clamp((vh - f.top) / (vh * 0.7), 0, 1), e = p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2;
    frame.style.transform = `rotateX(${(1 - e) * 10}deg) scale(${0.9 + e * 0.1})`;
    // the wall's columns travel at different rates
    const w = wall.getBoundingClientRect();
    if (w.top < vh && w.bottom > 0) {
      const q = clamp((vh - w.top) / (vh + w.height), 0, 1);
      [...wall.children].forEach((col, i) => { col.style.transform = `translateY(${(i === 1 ? q : 1 - q) * 56}px)`; });
    }
  }
  addEventListener("scroll", () => { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }, { passive: true });
  addEventListener("resize", onScroll);

  /* code: two tabs and a copy button that only says so once the clipboard has it */
  $$("[data-code]").forEach((box) => {
    const tabs = $$("[data-tab]", box), panes = $$("[data-pane]", box), copy = $("[data-copy]", box);
    tabs.forEach((t) => t.addEventListener("click", () => {
      tabs.forEach((x) => x.setAttribute("aria-selected", x === t));
      panes.forEach((p) => { p.hidden = p.dataset.pane !== t.dataset.tab; });
    }));
    copy.addEventListener("click", async () => {
      const text = $$("b", panes.find((p) => !p.hidden)).map((b) => b.textContent).join("\n");
      try { await navigator.clipboard.writeText(text); copy.textContent = "Copied"; } catch { copy.textContent = "Press Ctrl C"; }
      setTimeout(() => { copy.textContent = "Copy"; }, 1600);
    });
  });

  /* the wall: what people said, each linked to where they said it (text from cmux.com) */
  const Q = [
    ["I'm late to the party, but cmux is great. Current split: Codex Mac app for knowledge work, learning, reading; cmux + Codex CLI for coding.", "", "Peter Steinberger", "OpenClaw creator. Founder of PSPDFKit.", "steipete", "https://x.com/steipete/status/2058093406874689770"],
    ["This is exactly the product I've been looking for. After two hours this am I've in love.", "", "Nick Schrock", "Creator of Dagster. GraphQL co-creator.", "schrockn", "https://x.com/schrockn/status/2025182278637207857"],
    ["I've been using this all weekend and it's amazing.", "", "Edward Grefenstette", "Director of Research at Google DeepMind", "egrefen", "https://x.com/egrefen/status/2026806171563184199"],
    ["Been using this for a week and it's fantastic. Vert tab for each WIP task. Inside, claudes on one side and browser with PR and resources on the other, switch between tasks and stay organized.", "", "Connor", "", "connorelsea", "https://cmux.com/community"],
    ["this has been my favorite tool for past two weeks", "", "Max Forsey", "", "max4c_", "https://x.com/max4c_/status/2027266664270889204"],
    ["cmux しばらく使ってみたが好きだな めちゃくちゃ良いというよりは、あーこれだわこれ、という感触", "I've used cmux for a while and I like it. It feels less like 'this is amazing' and more like 'yes, this is it.'", "yamadashy / やまだし", "", "yamadashy", "https://x.com/yamadashy/status/2057255883751788567"],
    ["> learn cmux > trust me", "", "David Ondrej", "", "davidondrej1", "https://x.com/DavidOndrej1/status/2059360111336865901"],
    ["Я уже какое-то время назад на него переехал с warp и как будто пересел на ракету.", "I moved to it from Warp a while ago and it felt like switching to a rocket.", "Закиев Василь", "", "zvasil", "https://x.com/zvasil/status/2058873355172810894"],
    ["Vertical tabs in my terminal 🤤 I never thought of that before. I use and love Firefox vertical tabs.", "", "Joe Riddle", "", "joeriddles10", "https://x.com/joeriddles10/status/2024914132416561465"],
    ["最近用的最多的终端工具就是这个 cmux，开源免费。基本上代替 iTerm2 了。", "cmux is the terminal tool I use most lately. It's open source and free. It has basically replaced iTerm2 for me.", "金尘马", "", "jinchenma_ai", "https://x.com/jinchenma_ai/status/2057038510323016067"],
    ["po nao sei como vivi tanto tempo sem cmux", "Man, I don't know how I lived so long without cmux.", "Wesley", "", "wescld", "https://x.com/wescld/status/2059611549677863347"],
    ["This has been such a useful find. I can't recommend it enough.", "", "Scott Watermasysk", "", "scottw", "https://cmux.com/community"],
    ["Hab mir gerade cmux installiert, hab bisher ghostty genutzt. Aber cmux ist nochmal besser für KI Agenten und Coding geeignet.", "I just installed cmux. I had been using Ghostty, but cmux is even better suited for AI agents and coding.", "Tobias Glöckler", "", "tobiasgloeckler", "https://x.com/TobiasGloeckler/status/2032322168122720660"],
    ["grabbed this over the weekend and loved it. been waiting for something like this.", "", "John Blythe", "", "johnblythe", "https://cmux.com/community"],
    ["Tuve algún tema con el navegador pero cmux es insustituible en mi día a día.", "I had an issue with the browser, but cmux is indispensable in my day to day.", "Juan Barbat", "", "juan_barbat", "https://x.com/juan_barbat/status/2055270317270921668"],
  ];
  const esc = (s) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const cols = [[], [], []];
  Q.forEach((q, i) => cols[i % 3].push(q));
  wall.innerHTML = cols.map((col) => `<div class="wall-col">${col.map(([t, tr, name, role, av, url]) =>
    `<a class="q" href="${url}"><p>“${esc(t)}”</p>${tr ? `<span class="tr">${esc(tr)}</span>` : ""}<span class="who"><img src="https://cmux.com/avatars/${av}.jpg" alt="" width="28" height="28" loading="lazy"><span style="color:var(--fg)">${esc(name)}${role ? `<span>${esc(role)}</span>` : ""}</span></span></a>`).join("")}</div>`).join("");

  onScroll();
})();
