/* cmux site, fifth pass: tabs that behave as tabs (arrow keys, Home and End, one tab stop), for the plans and the code box. */
(() => {
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  $$('[role="tablist"]').forEach((list) => {
    const tabs = $$('[role="tab"]', list), line = list.querySelector(".tabs-line");
    const sync = () => {
      tabs.forEach((t) => {
        const on = t.getAttribute("aria-selected") === "true", panel = document.getElementById(t.getAttribute("aria-controls"));
        t.tabIndex = on ? 0 : -1;
        if (panel) panel.hidden = !on;
        if (on && line) { list.style.setProperty("--x", t.offsetLeft + "px"); list.style.setProperty("--w", t.offsetWidth + "px"); }
      });
    };
    tabs.forEach((t) => t.addEventListener("click", () => { tabs.forEach((x) => x.setAttribute("aria-selected", x === t)); sync(); }));
    list.addEventListener("keydown", (e) => {
      const i = tabs.indexOf(document.activeElement), n = tabs.length;
      const to = { ArrowRight: (i + 1) % n, ArrowLeft: (i - 1 + n) % n, Home: 0, End: n - 1 }[e.key];
      if (i < 0 || to === undefined) return;
      e.preventDefault();
      tabs[to].focus();
      tabs[to].click();
    });
    addEventListener("resize", sync);
    document.fonts.ready.then(sync);
    sync();
  });
})();
