/* The working model of cmux in the hero. A simulation: workspaces, split panes, agents that ask for input,
   notification rings, and a command line that takes real cmux CLI commands (cmux.com/docs/api). */
(() => {
  const $ = (s, el = document) => el.querySelector(s);
  const root = $("#cmux"), side = $("#side"), stage = $("#panes"), out = $("#cmd-out"), input = $("#cmd-in"), caption = $("#caption");
  const still = matchMedia("(prefers-reduced-motion: reduce)"), small = matchMedia("(max-width: 760px)");
  const MAX_PANES = () => (small.matches ? 3 : 6), MAX_WS = 6;

  /* what an agent prints, the question it stops on, and how it finishes */
  const SCRIPTS = {
    claude: { title: "claude", lines: [["d", "$ claude"], ["f", "● Read Sources/Sidebar/WorkspaceRow.swift"], ["f", "● Update WorkspaceRow.swift"], ["g", "  + hover state matches the active row"], ["f", "● Bash(swift build)"], ["d", "  Build complete"]],
      ask: "Run the full test suite?", yes: [["f", "● Bash(swift test)"], ["g", "  ✓ all tests passed"], ["b", "Done. Ready for review."]], no: [["d", "  Skipped the tests."], ["b", "Done. Ready for review."]], done: "Ready for review" },
    codex: { title: "codex", lines: [["d", "$ codex"], ["f", "• Reading middleware/rateLimit.ts"], ["f", "• Editing middleware/rateLimit.ts"], ["g", "  + sliding window per API key"], ["f", "• Running the unit tests"]],
      ask: "Apply this patch?", yes: [["g", "  ✓ patch applied"], ["b", "Done."]], no: [["d", "  Patch discarded."], ["b", "Done."]], done: "Patch applied" },
    dev: { title: "npm run dev", lines: [["d", "$ npm run dev"], ["f", "  ready on http://localhost:3000"]] },
  };
  const I = {
    right: '<path d="M2.5 3.5h11v9h-11zM8 3.5v9"/>', down: '<path d="M2.5 3.5h11v9h-11zM2.5 8h11"/>',
    web: '<circle cx="8" cy="8" r="5.5"/><path d="M2.5 8h11M8 2.5c2 2 2 9 0 11M8 2.5c-2 2-2 9 0 11"/>', close: '<path d="m4.5 4.5 7 7M11.5 4.5l-7 7"/>',
  };
  const btn = (act, label) => `<button type="button" data-act="${act}" aria-label="${label}" title="${label}"><svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round">${I[act]}</svg></button>`;

  let uid = 0;
  function pane(kind, script, start = 0) {
    const p = { id: ++uid, kind, script: script ? SCRIPTS[script] : null, step: 0, wait: 1, asking: false, tail: null, ring: false };
    p.title = kind === "web" ? "localhost:3000" : p.script ? p.script.title : "zsh";
    p.el = document.createElement("div");
    p.el.className = "pane new";
    p.el.dataset.id = p.id;
    p.el.innerHTML = `<div class="pane-h"><span>${p.title}</span>${btn("right", "Split right (⌘D)")}${btn("down", "Split down (⌘⇧D)")}${btn("web", "Split browser right (⌥⌘D)")}${btn("close", "Close (⌘W)")}</div>` +
      (kind === "web" ? '<div class="web"><div class="web-url">localhost:3000</div><div class="web-page"><b>Workspaces</b><i style="width:82%"></i><i style="width:64%"></i><i style="width:74%"></i><u>New workspace</u></div></div>' : '<div class="term" tabindex="0"></div>');
    p.el.addEventListener("animationend", () => p.el.classList.remove("new"), { once: true });
    p.term = $(".term", p.el);
    if (p.term) { if (!p.script) print(p, "d", "$ ", true); for (let i = 0; i < start; i++) advance(p, null, true); }
    return p;
  }
  function print(p, cls, text, caret) {
    $(".idle", p.term)?.remove();
    const line = document.createElement("p");
    line.className = cls + (caret ? " idle" : "");
    line.textContent = text;
    if (caret) line.insertAdjacentHTML("beforeend", '<span class="caret"></span>');
    p.term.append(line);
    while (p.term.children.length > 40) p.term.firstChild.remove();
  }

  const W = (title, branch, cwd, port, tree, focus) => ({ id: ++uid, title, branch, cwd, port, note: "", status: "", progress: null, tree, focus });
  const a1 = pane("term"), a2 = pane("term", "claude", 3), b1 = pane("term", "codex", 1), c1 = pane("term");
  let spaces = [
    W("fix sidebar hover", "fix/sidebar-hover", "~/cmux", ":3000", { dir: "row", kids: [a1, a2] }, a1.id),
    W("api rate limits", "feat/rate-limit", "~/api", ":8080", b1, b1.id),
    W("docs site", "main", "~/docs", ":4321", c1, c1.id),
  ];
  let active = spaces[0];

  const panesOf = (node, acc = []) => (node.kids ? node.kids.forEach((k) => panesOf(k, acc)) : acc.push(node), acc);
  const find = (id) => { for (const w of spaces) for (const p of panesOf(w.tree)) if (p.id === id) return [w, p]; return []; };
  const ringing = () => spaces.flatMap((w) => panesOf(w.tree).filter((p) => p.ring).map((p) => [w, p]));
  const say = (text, err) => { out.textContent = text; out.classList.toggle("err", !!err); };

  /* drawing: the sidebar is rewritten, the panes keep their elements and are only re-parented */
  function drawSide() {
    side.innerHTML = spaces.map((w, i) => {
      const unread = panesOf(w.tree).some((p) => p.ring);
      return `<button type="button" class="ws${unread ? " unread" : ""}" data-ws="${w.id}" aria-current="${w === active}"><span class="ws-t">${w.title}</span>` +
        (w.note ? `<span class="ws-n">${w.note}</span>` : "") + `<span class="ws-m">${w.branch} · ${w.cwd} · ${w.port}</span>` +
        (w.status ? `<span class="ws-s">${w.status}</span>` : "") + (w.progress != null ? `<span class="ws-p"><i style="transform:scaleX(${w.progress})"></i></span>` : "") + `<span class="sr">workspace ${i + 1}</span></button>`;
    }).join("") + '<button type="button" class="ws-new" data-new>New workspace <kbd>⌘N</kbd></button>';
    const n = ringing().length, badge = $("#bell-n");
    badge.textContent = n || "";
    badge.classList.toggle("on", n > 0);
  }
  function build(node) {
    if (!node.kids) return node.el;
    const el = document.createElement("div");
    el.className = "split" + (node.dir === "col" ? " col" : "");
    el.append(...node.kids.map(build));
    return el;
  }
  function drawPanes() { stage.replaceChildren(build(active.tree)); mark(); }
  function mark() {
    for (const w of spaces) for (const p of panesOf(w.tree)) { p.el.classList.toggle("focus", w === active && p.id === w.focus); p.el.classList.toggle("ring", p.ring); }
    drawSide();
  }

  /* acting on the model */
  function focus(p) { active.focus = p.id; p.ring = false; mark(); }
  function select(w) { active = w; drawPanes(); }
  function split(dir, kind = "term", script) {
    const all = panesOf(active.tree);
    if (all.length >= MAX_PANES()) return say(`This demo stops at ${MAX_PANES()} panes. The real cmux does not.`, true), null;
    const cur = all.find((p) => p.id === active.focus) || all[0], fresh = pane(kind, script);
    const before = dir === "left" || dir === "up", way = dir === "down" || dir === "up" ? "col" : "row";
    const parentOf = (n) => (!n.kids ? null : n.kids.includes(cur) ? n : n.kids.map(parentOf).find(Boolean));
    const parent = parentOf(active.tree);
    // a split along the row or column the pane already sits in joins it as an equal, so panes never get squeezed
    if (parent && parent.dir === way) parent.kids.splice(parent.kids.indexOf(cur) + (before ? 0 : 1), 0, fresh);
    else {
      const node = { dir: way, kids: before ? [fresh, cur] : [cur, fresh] };
      const swapIn = (n) => { if (n === cur) return node; if (n.kids) n.kids = n.kids.map(swapIn); return n; };
      active.tree = swapIn(active.tree);
    }
    active.focus = fresh.id;
    drawPanes();
    return fresh;
  }
  function close(p) {
    const [w] = find(p.id);
    if (!w.tree.kids) return say("That is the workspace's last pane.", true);
    const prune = (n) => { if (!n.kids) return n; const kids = n.kids.filter((k) => k !== p).map(prune); return kids.length === 1 ? kids[0] : ((n.kids = kids), n); };
    w.tree = prune(w.tree);
    if (w.focus === p.id) w.focus = panesOf(w.tree)[0].id;
    drawPanes();
  }
  function addSpace() {
    if (spaces.length >= MAX_WS) return say(`This demo stops at ${MAX_WS} workspaces.`, true);
    const p = pane("term"), w = W("workspace " + (spaces.length + 1), "main", "~", "", p, p.id);
    w.port = "no ports";
    spaces.push(w);
    select(w);
    say(`Created workspace ${spaces.length}.`);
  }
  function notify(w, p, text) { w.note = text; if (!(w === active && w.focus === p.id) || p.asking) p.ring = !(w === active && w.focus === p.id); mark(); }

  /* one step of an agent: its next line, its question, or its ending */
  function advance(p, w, quiet) {
    const s = p.script;
    if (!s || p.asking) return;
    const list = p.tail || s.lines;
    if (p.step < list.length) { print(p, ...list[p.step++]); return; }
    if (!p.tail && s.ask) {
      p.asking = true;
      print(p, "w", "? " + s.ask + " (y/n)");
      p.term.insertAdjacentHTML("beforeend", '<div class="ask"><button type="button" data-a="yes">y</button><button type="button" data-a="no">n</button></div>');
      if (!quiet) notify(w, p, s.ask);
      return;
    }
    if (p.tail && s.done && !quiet) notify(w, p, s.done);
    p.script = null;
    print(p, "d", "$ ", true);
  }
  function answer(p, a) {
    if (!p.asking) return;
    $(".ask", p.term).remove();
    print(p, "f", a === "yes" ? "y" : "n");
    Object.assign(p, { asking: false, tail: p.script[a], step: 0, wait: 1, ring: false });
    const [w] = find(p.id);
    w.note = "";
    mark();
  }
  function start(p, name) { Object.assign(p, { script: SCRIPTS[name], step: 0, tail: null, wait: 1 }); $(".pane-h span", p.el).textContent = SCRIPTS[name].title; }

  /* the clock: agents work in every workspace, in view or not, but only while the demo is on screen */
  let onScreen = false;
  new IntersectionObserver(([e]) => { onScreen = e.isIntersecting; }, { threshold: 0.3 }).observe(root);
  setInterval(() => {
    if (!onScreen || document.hidden) return;
    for (const w of spaces) for (const p of panesOf(w.tree)) if (p.script && !p.asking && --p.wait <= 0) { advance(p, w); p.wait = 1 + (p.id + p.step) % 2; }
  }, 850);

  /* the command line: a small, honest subset of the cmux CLI */
  const flag = (t, name) => { const i = t.indexOf("--" + name); return i < 0 ? null : t[i + 1] ?? ""; };
  function run(raw) {
    const t = (raw.trim().match(/"[^"]*"|'[^']*'|\S+/g) || []).map((x) => x.replace(/^["']|["']$/g, ""));
    if (t[0] === "cmux") t.shift();
    const [cmd, arg] = t, cur = panesOf(active.tree).find((p) => p.id === active.focus);
    const pick = () => spaces[Number(flag(t, "workspace")?.replace("workspace:", "")) - 1];
    switch (cmd) {
      case undefined: return;
      case "help": return say('Try: new-split right|down · new-workspace · select-workspace --workspace 2 · send "claude" · notify --title T --body B · set-status build "compiling" · set-progress 0.5 · log "message" · list-workspaces');
      case "new-split": {
        if (!["left", "right", "up", "down"].includes(arg)) return say("Directions: left, right, up, down.", true);
        const p = split(arg), c = flag(t, "command");
        if (p && c) { print(p, "f", "$ " + c); if (SCRIPTS[c]) start(p, c); else if (/npm run dev/.test(c)) start(p, "dev"); else print(p, "d", "$ ", true); }
        return p && say(`Split ${arg}. The new pane has focus.`);
      }
      case "new-workspace": return addSpace();
      case "list-workspaces": return say(spaces.map((w, i) => `${i + 1} ${w.title}`).join(" · "));
      case "current-workspace": return say(`${spaces.indexOf(active) + 1} ${active.title}`);
      case "select-workspace": { const w = pick(); return w ? (select(w), say(`Switched to ${w.title}.`)) : say("Use --workspace with a number from list-workspaces.", true); }
      case "close-workspace": {
        const w = pick();
        if (!w || spaces.length < 2) return say(w ? "That is the last workspace." : "Use --workspace with a number from list-workspaces.", true);
        spaces = spaces.filter((x) => x !== w);
        if (active === w) active = spaces[0];
        return drawPanes(), say(`Closed ${w.title}.`);
      }
      case "send": {
        if (!cur.term || arg == null) return say(cur.term ? 'Give it some text: send "claude"' : "Focus a terminal pane first.", true);
        if (cur.asking) return answer(cur, /^y/i.test(arg) ? "yes" : "no"), say("Answered the agent.");
        const text = arg.replace(/\\n$/, "");
        print(cur, "f", "$ " + text);
        if (SCRIPTS[text]) start(cur, text); else if (/npm run dev/.test(text)) start(cur, "dev"); else print(cur, "d", "$ ", true);
        return say("Sent to the focused pane.");
      }
      case "notify": { const body = flag(t, "body") || flag(t, "title") || "Notification"; active.note = body; cur.ring = true; mark(); return say("Notified. The pane rings until you click it."); }
      case "clear-notifications": spaces.forEach((w) => panesOf(w.tree).forEach((p) => { p.ring = false; })); return mark(), say("Cleared.");
      case "list-notifications": return say(ringing().map(([w]) => w.title).join(" · ") || "No notifications.");
      case "set-status": return arg ? ((active.status = t[2] ?? arg), drawSide(), say("Status set on the workspace's tab.")) : say('set-status build "compiling"', true);
      case "clear-status": return (active.status = ""), drawSide(), say("Status cleared.");
      case "set-progress": { const n = Number(arg); return n >= 0 && n <= 1 ? ((active.progress = n), drawSide(), say("Progress set on the workspace's tab.")) : say("A number from 0.0 to 1.0.", true); }
      case "clear-progress": return (active.progress = null), drawSide(), say("Progress cleared.");
      case "log": return (active.note = t.filter((x, i) => i > 0 && !x.startsWith("--") && !["info", "progress", "success", "warning", "error"].includes(x)).join(" ")), drawSide(), say("Logged to the sidebar.");
      default: return say(`"${cmd}" is not in this demo. Type help, or read the CLI reference for everything cmux can do.`, true);
    }
  }
  let typing = 0;
  function type(text) {
    clearInterval(typing);
    if (still.matches) { input.value = ""; return run(text); }
    let i = 0;
    input.value = "";
    typing = setInterval(() => { input.value = text.slice(0, ++i); if (i >= text.length) { clearInterval(typing); setTimeout(() => { run(text); input.value = ""; }, 260); } }, 24);
  }

  /* input: everything by delegation */
  root.addEventListener("click", (e) => {
    const t = e.target.closest("button, .pane"), el = e.target.closest(".pane");
    if (!t) return;
    if (t.dataset.ws) return select(spaces.find((w) => w.id === +t.dataset.ws));
    if ("new" in t.dataset) return addSpace();
    if (t.dataset.cmd) return type(t.dataset.cmd);
    if (t.id === "bell") { const last = ringing().pop(); return last ? (select(last[0]), focus(last[1]), say(`Jumped to ${last[0].title}.`)) : say("Nothing unread."); }
    if (!el) return;
    const [, p] = find(+el.dataset.id);
    focus(p);
    if (t.dataset.a) return answer(p, t.dataset.a);
    if (t.dataset.act === "close") return close(p);
    if (t.dataset.act === "web") return split("right", "web") && say("Split a browser to the right.");
    if (t.dataset.act) return split(t.dataset.act) && say(`Split ${t.dataset.act}.`);
  });
  root.addEventListener("keydown", (e) => {
    const el = e.target.closest(".term");
    if (!el || !/^[yn]$/i.test(e.key)) return;
    answer(find(+el.closest(".pane").dataset.id)[1], e.key.toLowerCase() === "y" ? "yes" : "no");
  });
  $("#cmd-form").addEventListener("submit", (e) => { e.preventDefault(); run(input.value); input.value = ""; });

  /* the chips above the demo: each one does the thing, in the demo, and says what it was */
  const PLAY = {
    tabs: ["<b>Vertical tabs.</b> The sidebar shows git branch, working directory, ports, and notification text for every workspace. Click one to switch.", () => {
      side.classList.add("flash");
      setTimeout(() => side.classList.remove("flash"), 1400);
      select(spaces[(spaces.indexOf(active) + 1) % spaces.length]);
    }],
    rings: ["<b>Notification rings.</b> Panes light up when agents need attention. Click the ringing pane and answer it, or use the bell to jump to the latest unread.", () => {
      let hit = spaces.flatMap((w) => panesOf(w.tree).map((p) => [w, p])).find(([w, p]) => p.script?.ask && !p.asking && !p.tail && !(w === active && w.focus === p.id));
      if (!hit) {
        const keep = active.focus, idle = panesOf(active.tree).find((p) => p.term && !p.script && p.id !== keep), p = idle || split("right", "term");
        if (!p) return;
        start(p, "claude");
        active.focus = keep;
        hit = [active, p];
      }
      const [w, p] = hit;
      while (!p.asking && p.script) advance(p, w);
    }],
    split: ["<b>Split panes.</b> Horizontal and vertical splits within each tab. <kbd>⌘</kbd> <kbd>D</kbd> splits right, <kbd>⌘</kbd> <kbd>⇧</kbd> <kbd>D</kbd> splits down.", () => type("cmux new-split right")],
    browser: ["<b>In-app browser.</b> Split a browser alongside your terminal with a scriptable API, so agents can check their own web changes.", () => split("right", "web") && say("Split a browser to the right.")],
    cli: ["<b>Programmable.</b> A CLI and socket API for automation and scripting. Everything you can click here is also a command.", () => type('cmux notify --title "Build" --body "Done"')],
  };
  document.querySelectorAll("[data-play]").forEach((chip) => chip.addEventListener("click", () => {
    document.querySelectorAll("[data-play]").forEach((c) => c.setAttribute("aria-pressed", c === chip));
    const [text, act] = PLAY[chip.dataset.play];
    caption.innerHTML = text;
    act();
  }));

  drawPanes();
})();
