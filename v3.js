/* cmux site, third pass: the typed headline, the shortcut keyboard, the notification over the window, the footer's prompt. */
(() => {
  const $ = (s, el = document) => el.querySelector(s), $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const still = matchMedia("(prefers-reduced-motion: reduce)");

  /* 1. the headline types its last words, the way cmux.com's does */
  const typed = $("#typed");
  if (typed && !still.matches) {
    const WORDS = ["coding agents", "multitasking", "organization", "programmability"];
    let w = 0, n = WORDS[0].length, dir = -1, wait = 40;
    setInterval(() => {
      if (document.hidden || wait-- > 0) return;
      n = Math.max(0, n + (dir < 0 ? -2 : 1)); // deleting runs at twice the speed
      typed.textContent = WORDS[w].slice(0, n);
      if (n === 0) { dir = 1; w = (w + 1) % WORDS.length; wait = 6; }
      else if (dir > 0 && n >= WORDS[w].length) { dir = -1; wait = 44; }
    }, 55);
  }

  /* 2. the keyboard. Pick a shortcut, or press it: its keys light. All eight are cmux's defaults. */
  const kb = $("#kb"), list = $("#sc"), read = $("#kb-read");
  if (kb) {
    const ROWS = [
      ["`", "1", "2", "3", "4", "5", "6", "7", "8", "9", "0", "-", "=", "⌫:1.6"],
      ["⇥:1.6", "Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P", "[", "]", "\\"],
      ["⇪:1.9", "A", "S", "D", "F", "G", "H", "J", "K", "L", ";", "'", "↩:1.9"],
      ["⇧:2.4", "Z", "X", "C", "V", "B", "N", "M", ",", ".", "/", "⇧:2.4"],
      ["fn", "⌃", "⌥", "⌘:1.4", " :6.2", "⌘:1.4", "⌥", "←", "→"],
    ];
    const SHORTCUTS = [
      ["Split right", "⌘ D"], ["Split down", "⌘ ⇧ D"], ["Split browser right", "⌥ ⌘ D"], ["New workspace", "⌘ N"],
      ["Toggle sidebar", "⌘ B"], ["Jump to latest unread", "⌘ ⇧ U"], ["Command palette", "⌘ ⇧ P"], ["Zoom the pane", "⌘ ⇧ ↩"],
    ];
    kb.innerHTML = ROWS.map((row) => `<div class="kb-row">${row.map((k) => { const [c, g] = k.split(":"); return `<span class="key" data-k="${c === '"' ? "&quot;" : c}"${g ? ` style="flex-grow:${g}"` : ""}>${c}</span>`; }).join("")}</div>`).join("");
    list.innerHTML = SHORTCUTS.map(([name, keys], i) => `<li><button type="button" data-i="${i}" aria-pressed="false">${name}<span>${keys.split(" ").map((k) => `<kbd>${k}</kbd>`).join("")}</span></button></li>`).join("");
    const keys = $$(".key", kb), btns = $$("button", list);
    const light = (set) => {
      // of two keys with the same legend (⌘, ⇧, ⌥), light the one nearest the shortcut's own key, so the lit keys sit together
      const cx = (k) => { const r = k.getBoundingClientRect(); return r.left + r.width / 2; };
      const anchor = keys.find((k) => k.dataset.k === set[set.length - 1]);
      const chosen = set.map((c) => keys.filter((k) => k.dataset.k === c).sort((a, b) => Math.abs(cx(a) - cx(anchor || a)) - Math.abs(cx(b) - cx(anchor || b)))[0]);
      keys.forEach((k) => k.classList.toggle("on", chosen.includes(k)));
    };
    let cur = -1, timer = 0, taken = false;
    const pick = (i) => {
      cur = i;
      btns.forEach((b, k) => b.setAttribute("aria-pressed", k === i));
      light(SHORTCUTS[i][1].split(" "));
      read.innerHTML = `<b>${SHORTCUTS[i][1]}</b> &nbsp;${SHORTCUTS[i][0]}`;
    };
    btns.forEach((b) => { const go = () => { taken = true; clearInterval(timer); pick(+b.dataset.i); }; b.addEventListener("click", go); b.addEventListener("pointerenter", (e) => e.pointerType === "mouse" && go()); });
    // a real keyboard: the keys you hold light up, and a full shortcut selects itself. Nothing is prevented.
    let onScreen = false;
    const MOD = { Meta: "⌘", Shift: "⇧", Alt: "⌥", Control: "⌃", Enter: "↩" };
    addEventListener("keydown", (e) => {
      if (!onScreen || e.target.closest("input, textarea")) return;
      const held = [e.metaKey || e.ctrlKey ? "⌘" : "", e.shiftKey ? "⇧" : "", e.altKey ? "⌥" : ""].filter(Boolean), c = MOD[e.key] || e.key.toUpperCase();
      const combo = [...new Set([...held, c])];
      const i = SHORTCUTS.findIndex(([, k]) => { const want = k.split(" "); return want.length === combo.length && want.every((x) => combo.includes(x)); });
      taken = true; clearInterval(timer);
      if (i >= 0) pick(i); else { light(combo); btns.forEach((b) => b.setAttribute("aria-pressed", "false")); read.textContent = combo.join(" "); }
    });
    new IntersectionObserver(([e]) => {
      onScreen = e.isIntersecting;
      clearInterval(timer);
      if (onScreen && !taken && !still.matches) timer = setInterval(() => pick((cur + 1) % SHORTCUTS.length), 1900);
    }, { threshold: 0.3 }).observe(kb);
    pick(0);
  }

  /* 3. the notification over the window: there while an agent is waiting, and a click takes you to it */
  const toast = $("#toast"), badge = $("#bell-n");
  if (toast && badge) {
    const sync = () => {
      const n = +badge.textContent || 0, note = $(".ws.unread .ws-n") || $(".ws .ws-n"), title = $(".ws.unread .ws-t") || $(".ws .ws-t");
      toast.classList.toggle("show", n > 0);
      if (n > 0 && title) { $("b", toast).textContent = title.textContent; $("span", toast).textContent = note ? note.textContent : "An agent needs your attention"; }
    };
    new MutationObserver(sync).observe(badge, { childList: true, characterData: true, subtree: true });
    toast.addEventListener("click", () => $("#bell").click());
    sync();
  }

  /* 4. the footer's prompt reads out the link under the pointer, as a command */
  const cmd = $("#foot-cmd");
  if (cmd) {
    const say = (a) => { cmd.textContent = a && a.getAttribute("href")[0] === "#" ? "cd ~" : a ? "open " + a.href.replace(/^https?:\/\/(www\.)?|^mailto:/, "").replace(/\/$/, "").replace(/\?.*/, "") : "ls"; };
    $$(".foot a").forEach((a) => { a.addEventListener("pointerenter", () => say(a)); a.addEventListener("focus", () => say(a)); a.addEventListener("pointerleave", () => say()); a.addEventListener("blur", () => say()); });
  }
})();
