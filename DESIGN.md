---
version: alpha
name: cmux
description: Design system for the cmux marketing site. A dark, hairline, monochrome system with one blue accent taken from the cmux icon.
colors:
  bg: "#0a0a0a"
  bg-1: "#111112"
  bg-2: "#18181a"
  bg-3: "#222224"
  line: "#262628"
  line-2: "#37373b"
  fg: "#ededed"
  fg-2: "#a3a3a8"
  fg-3: "#85858b"
  accent: "#6b8bed"
  accent-ice: "#b4d6f0"
  accent-deep: "#3b4fb8"
  ok: "#54c58d"
  warn: "#e5a13a"
typography:
  sans: Geist
  mono: Geist Mono
  scale: [12, 13, 14, 16, 18, 24, "h3 20-28", "h2 30-48", "h1 40-72"]
rounded: { sm: 6, md: 10, lg: 16, xl: 24, pill: 999 }
spacing: [4, 8, 12, 16, 24, 32, 48, 64, 96, "section 88-168"]
components: [button, chip, card, rule, code, figure, cmux-demo]
---

# cmux design system

Every token lives in the `:root` block of `styles.css`. This file says what each one is for. Where a value was **measured** on cmux.com it says so; the rest is **proposed** for this site. It was written by hand, not extracted by the `awwwards-design-md` capture (that needs Playwright for the awwwards MCP, which is not installed).

## Overview

cmux is a terminal for people running many coding agents. The site should feel like the product: dark, quiet, exact. Chrome is monochrome. Blue appears only where the product itself uses it: the notification ring, the selected workspace, and whatever the pointer has chosen in a drawing.

Three rules hold everything together:

1. **One focal point per section.** The hero's is the working demo. Everywhere else it is the heading or the drawing, never both fighting.
2. **Blue means "this needs you" or "you picked this".** It is never decoration.
3. **Hairlines, not boxes.** One line weight (1px). Depth comes from three steps of grey, not shadows.

## Colors

| Token | Value | Use | Source |
|---|---|---|---|
| `--bg` | `#0a0a0a` | Page ground | measured, cmux.com body |
| `--bg-1` / `--bg-2` / `--bg-3` | `#111112` / `#18181a` / `#222224` | Cards / raised or selected / pressed, wells | proposed |
| `--line` / `--line-2` | `#262628` / `#37373b` | Hairlines / hairlines on hover, dashed rules | proposed |
| `--fg` | `#ededed` | Text, and the primary button's fill | measured, cmux.com body |
| `--fg-2` | `#a3a3a8` | Body copy beside a heading (7.9:1 on bg) | proposed |
| `--fg-3` | `#85858b` | Labels, meta, hints (5.4:1 on bg, 4.8:1 on bg-2: the floor for text) | proposed |
| `--accent` | `#6b8bed` | Ring, selection, the bright stroke in drawings (6.2:1) | sampled from the cmux icon |
| `--accent-ice` / `--accent-deep` | `#b4d6f0` / `#3b4fb8` | The icon's light and dark ends: the hero frame's gradient, the headline's rotating word, the selected row | sampled / proposed |
| `--ok` / `--warn` | `#54c58d` / `#e5a13a` | Terminal output only: a pass, a question | proposed |

- The **primary button is ink** (`--fg` on `--bg`), never blue. A coloured primary would compete with the ring.
- **One gradient on the whole site:** the frame the demo stands on, made of the icon's three blues. Do not add a second.
- `--fg-3` is the dimmest text allowed, and `--bg-2` the lightest surface it may sit on. All ratios above were computed by script.

## Typography

**Geist** for everything read, **Geist Mono** for anything a terminal would say (commands, branches, shortcuts, eyebrow labels). Both are measured from cmux.com.

| Role | Size | Weight | Line | Tracking |
|---|---|---|---|---|
| h1 | 40 → 72 (`--t-h1`) | 500 | 1.04 | −0.035em |
| h2 | 30 → 48 (`--t-h2`) | 500 | 1.08 | −0.025em |
| h3 | 20 → 28 (`--t-h3`) | 500 | 1.2 | −0.015em |
| Lede | 18 | 400 | 1.55 | 0 |
| Body | 16 | 400 | 1.6 | 0 |
| Small | 14 / 13 | 400 | 1.5 | 0 |
| Eyebrow | 12 mono, caps | 500 | 1 | +0.08em |

- Two weights only: 400 and 500 (600 for the wordmark and in-demo titles).
- Headings use `text-wrap: balance`, paragraphs `pretty`, and no paragraph runs wider than 52–62ch.
- Changing numbers use `tabular-nums`.

## Layout

- Container 1200px, gutter `clamp(16px, 4vw, 32px)`.
- **Between sections:** `--section` = `clamp(88px, 11vw, 168px)` top and bottom, with one dashed `.rule` between major sections. Inside a section: 64 from the head to its content, 16 between cards, 96 between the "how it works" steps.
- Space scale 4, 8, 12, 16, 24, 32, 48, 64, 96. Each step is at least 25% over the last. Never nudge by 1px.
- Breakpoints: 560 (buttons stack), 760 (demo and steps go to one column), 900 (bento, plans, FAQ go to one column), 1000 (the sticky index leaves).
- Checked with no sideways scroll at 320, 360, 390, 768, 1024, 1440 and 1920.

## Elevation & Depth

No shadows and no blur. A surface is raised by its fill (`--bg` → `--bg-1` → `--bg-2`) and a 1px `--line`. The nav gets a solid `--bg` and a hairline once the page has scrolled 24px.

## Shapes

Radii 6 (keys, small controls), 10 (buttons, chips, code), 16 (cards, figures, the demo window), 24 (the hero frame, the closing card), 999 (the one trust pill). The `.rule` divider is a dashed hairline with a 7px square handle at each end: used between sections only, never as a grid over the page.

## Components

- **Button** `.btn` 44px tall (36 with `.btn-sm`). `.btn-ink` is the one primary per view; `.btn-line` is secondary. Press scales to .97. Buttons in a group share a width on phones.
- **Chip** `.chip` 40px. The row above the demo: each one performs its feature in the demo and sets the caption.
- **Card** `.card` / `.plan` / `.q`: `--bg-1`, 1px `--line`, radius 16, padding 32. One card style on the site.
- **Rule** `.rule`: the section divider. It draws in from the left once.
- **Code** `.code`: tabs (CLI / Socket) and a Copy button that says "Copied" only after the clipboard has it.
- **Figure** `.fig` + `[data-fig]`: a Hairline drawing (`figures/*.js` on the unchanged `figures/kernel.js`). Its name sits top left, what the pointer chose top right, and nothing is written inside the drawing. Rules: one stroke, the only highlight is the bright stroke, rest is a composed pose, the hit test reads the rest pose.
- **cmux demo** `.cmux`: the working model in the hero. Sidebar of workspaces, split panes, agents that stop and ask, rings, the bell, and a command line that takes a subset of the real CLI.

## Motion

| Token | Value | Use |
|---|---|---|
| `--ease-out` | `cubic-bezier(.23,1,.32,1)` | Entrances, hover, press |
| `--ease-in-out` | `cubic-bezier(.77,0,.175,1)` | Things that travel or draw: the rule, the rotating word |
| `--d-ui` | 180ms | Hover and press |
| `--d-in` | 700ms | Entrances, staggered 60ms |

- Transform and opacity only. Nothing animates from `scale(0)`.
- Scroll drives two things: the demo's frame stands up (9° → 0) as it enters, and the testimonial columns travel at different rates. One rAF-throttled handler does both.
- The headline and call to action are readable by about 600ms.
- Hover effects sit behind `(hover: hover) and (pointer: fine)`.
- **Reduced motion:** entrances become 300ms fades, the frame and columns hold still, the rotating word stops, loops stop, the drawings land at once.

## Do's and Don'ts

- Do keep one primary button per view, and make it "Download for Mac".
- Do use real numbers and real words from cmux.com and its docs. Nothing on the site is invented except the sample content inside the demo, which is labelled a demo.
- Do let drawings and the demo answer the pointer; that is the site's signature.
- Don't add a second accent, a gradient button, a glow, grain, a dotted or grid background, or glass.
- Don't put words inside a drawing. Names go in the read-out.
- Don't auto-advance anything a visitor can't pause, apart from the hero word.

## Sources

- cmux.com (home, `/pricing.md`, `/docs/api.md`, `/docs/keyboard-shortcuts.md`, `/docs/notifications.md`, `/llms.txt`), read 2026-11-15: copy, testimonials, prices, CLI commands, socket methods, shortcuts, font and ground colours.
- ycombinator.com/companies/cmux: the Y Combinator S24 fact.
- tempo.new: the reference for layout rhythm (dark ground, dashed rules with square handles, a framed product in the hero, a sticky index, a white ink button).

## Coverage and limitations

- Dark theme only. cmux.com has a light theme; this site does not yet.
- The cmux icon and the avatars are loaded from cmux.com, not stored here. The Y Combinator mark is redrawn, not the official file.
- No GitHub star count is fetched live: "28.8k" is what cmux.com showed on 2026-11-15.

## Second pass (2026-11-15): colour, interaction, phones

Added after Syed's review ("delightful to scroll", "a little bit vibrant", "feature section is boring"). Where this section and the ones above disagree, this one wins.

**Colour.** Three hues joined the blue, each with one job: `--violet #9b8cff` (rings), `--cyan #62d4e3` (the browser), `--amber #f0b35a` (session restore). A feature's hue shows on its rail mark, its scene's border and corner tint, and its hint line. Tints, not paint: fills stay under 16%. The hero has a two-colour light (blue left, violet right) and the frame's gradient now runs ice, blue, violet, deep blue. The primary button is still ink.

**New components.**
- **Field** `#field`: the hero's background. A grid of terminal characters (`· : ; + = * #`); diagonal bands drift through it and it wakes in violet under the pointer. It is masked off behind the headline and the nav, runs at 30fps only while on screen, and draws one still frame under reduced motion.
- **Rail** `.rail`: the index beside the tour and "how it works". A `❯` prompt slides to the section in view, a caret blinks after its name, and the dashed line fills as you read. Under 1000px it becomes a sticky row of four short labels with a sliding underline.
- **Scene** `.scene`: a feature as a working picture with its text under it. Each plays by itself while on screen and stops the moment it is touched.
- **Key button** `.keybtn`: an action with its real shortcut on a key that presses.
- **Horizon** `.horizon`: the footer. The wordmark sits behind a planet's rim, and the light on the rim follows the pointer along the curve. The one place a glow is allowed.
- **Dock** `.dock`: phones only. Download and GitHub pinned to the foot once the hero's buttons have scrolled away, gone again at the closing call.
- **Menu** `.menu`: phones only, under the nav bar.

**States.** Quotes are black and white at rest and take their colour, a tinted corner and a hue border under the pointer; on touch, the ones in the middle of the screen do. Plans lift 3px. Code lines show their socket twin under the pointer. FAQ answers open to their own height.

**The demo is full screen.** It runs edge to edge and a viewport tall (`clamp(520px, 100svh - 92px, 960px)`), stands up from 10° and 0.9 scale as it enters, and has a button for the browser's real full screen.

**Scroll.** On a mouse or trackpad the wheel sets a target and the window glides to it (`1 - exp(-dt * 9)`, the window's own scroll, never a transformed wrapper). A link to a section travels on an ease-in-out cubic over 0.5 to 1.2s. Touch, keyboard, the scrollbar and reduced motion keep the browser's own scrolling. `window.__smoothStop()` turns it off.

**Phones.** Not the desktop squeezed: a menu, the dock, the rail as a tab row, scenes stacked picture then text, notes under titles, command lists in two columns, 44px targets outside the demo's own chrome.

## Third pass (2026-11-15): back to the brand

Syed's verdict on the second pass: the colours were "very bad", the hero background "AI generic and not premium", the YC badge "not proper", the buttons "ai generic", the footer "cheap", its glow "very bad". This section replaces the second pass's colour, hero, button and footer rules. It lives in `v3.css` and `v3.js`, loaded last.

**Colour: black, white, and the icon's one blue.**
| Token | Value | Note |
|---|---|---|
| `--bg` / `--bg-1` / `--bg-2` / `--bg-3` | `#07080a` / `#0d0e11` / `#14151a` / `#1d1f25` | a cooler, deeper black |
| `--fg` / `--fg-2` / `--fg-3` | `#f5f5f6` / `#a6a8af` / `#7f8189` | brighter text for more contrast |
| `--accent` / `--accent-ice` / `--accent-deep` | `#6b8bed` / `#b4d6f0` / `#2f47b0` | the icon's chevron, light to dark |
The violet, cyan and amber of the second pass are gone (the variables still exist and all point at `--accent`). No light behind the hero, no gradient text, no tinted cards.

**Buttons.** Pills, as on cmux.com. 40px tall, 14px medium. Primary is white on black. Secondary is a 7% white fill with a hairline inside, not an outline. One primary per view.

**Y Combinator.** The official mark (orange square, white Y) at 18px beside "Backed by Y Combinator". No pill, no border.

**Hero.** No background art. The headline sits left and types its last words with a block caret, the way cmux.com's does; the pitch, the two buttons and the note sit right. Under 900px it is one column and the buttons go edge to edge.

**The product.** A Mac window as it is: real traffic lights, a hairline, a deep shadow, no coloured frame. A notification floats over its corner on a blurred backing whenever an agent is waiting, and clicking it jumps to that agent.

**New sections.**
- **Keyboard first** `#keys`: a dim keyboard. Picking one of eight real shortcuts, or pressing it, lights its keys.
- **How it works** `.ill`: a grid of cells that share hairlines, one drawing per cell, with the heading in the first cell and the code in a wide last cell.
- **Changelog** `.log`: the last four releases on a line, each linking to its page. Text, dates and change counts come from cmux.com/docs/changelog (read 2026-11-15) and need refreshing by hand.

**Footer.** The logo and the name as a lockup (never the icon alone, never ghosted), three icon links, the link columns, a prompt line that reads out the link under the pointer as a command, and a grainy dawn in the icon's blues over a dark horizon. Grain is allowed here only. No pointer-following light.

**Debt.** `v3.css` overrides rules in `styles.css` rather than replacing them. Once this direction is approved, fold it in and delete what it overrides (the field, aurora, swap, horizon and hue rules).
