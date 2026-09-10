# SPEC — REM Cycle Calculator (single source of truth for all builder agents)

A sleep-cycle calculator web app: tells the user when to go to bed or when they'll
wake up, based on 90-minute sleep cycles + sleep latency. **Primary target: iPhone
17 (402×874 CSS px, DPR 3)** — must feel native and flawless there; desktop must
still look excellent.

## Science model (locked — QA asserts these exact numbers)
- Sleep cycle ≈ 90 minutes (cycles vary 80–100 in reality; 90 is the accepted average).
- Sleep latency (time to fall asleep) default 15 min; user-selectable 0/15/30.
- Wake-up mode: bedtime = wake − latency − (cycles × 90). Show 6, 5, 4 cycles.
- Sleep-now mode: wake = now + latency + (cycles × 90). Show 3, 4, 5, 6 cycles.
- Verified reference values (asserted by qa/verify_math.py):
  - wake 6:30 AM, latency 15 → bed 9:15 PM (6c), 10:45 PM (5c), 12:15 AM (4c)
  - wake 6:30 AM, latency 30 → bedtimes 9:00 PM / 10:30 PM / 12:00 AM
  - sleep-now 11:00 PM, latency 15 → wakes 3:45 AM (3c), 5:15 AM (4c), 6:45 AM (5c), 8:15 AM (6c)

## Required file layout (site serves from repo root)
```
index.html      — shell, content, inline CSS + app JS (self-contained page)
js/calc.js      — PURE math functions, no DOM, loaded before inline app JS
qa/             — gitignored, test harness (pre-built, do not modify)
```
No build step, no external JS/CSS assets, no analytics, no remote fonts required
(system font stack strongly preferred for iOS). No CDN dependencies at all.

## Required calc API (js/calc.js — EXACT signatures, math gate depends on it)
```js
// All times are "minutes since local midnight" ints (0..1439).
// Every returned option: { cycles: int, minutes: int(0..1439 wrapped), nextDay: bool, latencyMin: int }
function minutesToClock(totalMin)         // -> "10:45 PM" | "3:45 AM" (12-hour, no leading zero)
function computeBedtimes(wakeMin, latencyMin) // -> [{cycles:6,...},{5},{4}] (bedtimes)
function computeWakeTimes(sleepStartMin, latencyMin) // -> [{cycles:3,...},{4},{5},{6}] (wake times)
```
- `nextDay` semantics: sleep-now mode → true when wake crosses midnight (always for
  overnight). Wake-up mode → true when the bedtime falls on the wake day's calendar
  date after midnight (e.g. 12:15 AM before a 6:30 AM wake); false when the bedtime is
  the previous evening (9:15 PM before 6:30 AM).
- Wrap correctly across midnight in both directions (23:00 + 90 → 00:30).
- Duration helper allowed: `function cyclesToHours(cycles, latencyMin)` → minutes of
  sleep (e.g. 5c + 15 latency = 465 min = "7h 45m").

## Required DOM contract (QA battery queries these — names are load-bearing)
- `<header>` with brand element `.brand`
- Mode tabs: `.mode-tab` ×2 (`data-mode="sleep-now"` default-active, `data-mode="wake-up"`);
  the ACTIVE tab carries `aria-selected="true"`, the inactive one `"false"`
- Time input (sleep-now mode): `#sleepTime` type=time, **defaults to device now**
- Time input (wake-up mode): `#wakeTime` type=time
- Latency control: `#latencySelect` (select, values `0|15|30`, default `15`)
- Results container `.options`; each option row `.option` with REQUIRED data attrs:
  `data-cycles="4" data-time="5:15 AM" data-nextday="1|0" data-minutes="315"`
- Each option row must visually show: target time, total sleep duration (e.g. "7h 45m"),
  and cycles count (e.g. "5 cycles").
- One option visually distinguished as the recommended/best option (e.g. 5–6 cycles
  for wake-up; 5 for sleep-now) — design freedom on treatment.
- `.muted` used for secondary text; `.chip` for small badges (next-day, best, etc.);
  `.footnote` for the fine print at the bottom.
- All interactive elements are real `<button>`/`<input>`/`<select>`/`<label>` and
  render ≥44×44 px on mobile. `input[type=time]` must be ≥44px tall (native iOS picker).
- Live-updating: sleep-now mode shows "time until bedtime" countdown text near results
  (updates each minute is enough; class `.countdown`, content must include "h" or "m").

## Required content
- H1: clear product name (your choice, e.g. "REM Cycle Calculator").
- Short explainer of the model (90-min cycles + 15-min latency) near the results.
- Accuracy note in `.footnote`: cycles vary 80–100 min, latency varies by person,
  estimates only, not medical advice.
- "Add to Home Screen" hint in the footnote for an app-like iPhone experience.
- No lorem ipsum, no fake links, no analytics, no cookies, zero network requests
  after load.

## iPhone-first requirements (hard)
- `<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">`
- Layout respects safe areas: `env(safe-area-inset-*)` padding on the page shell
  (Dynamic Island / home indicator are real on this device).
- `-webkit-text-size-adjust: 100%`; inputs ≥16px font (prevents iOS focus zoom).
- `<meta name="theme-color">` for BOTH light and dark schemes.
- `<link rel="icon">` inline SVG data-URI emoji favicon (e.g. 🌙) is fine.
- Dark AND light schemes both fully supported via `prefers-color-scheme` — no
  manual toggle required, but the page must look intentional in both.
- No hover-only affordances (touch device); tap targets ≥44px; smooth momentum
  scroll; no horizontal overflow at 402px; test at 402×874 DPR 3.
- Desktop (≥1024px): centered readable column (max ~640–760px), generous type scale.

## Quality bar
- Zero console errors; zero pageerrors.
- WCAG contrast: body text 4.5:1, large text 3:1 — including .muted on cards and
  .chip on its background, in BOTH schemes.
- Typography: big readable numerals for the time values (they are the product).
- The page must look premium, not generated: consistent spacing system, one
  restrained accent color, no rainbow palettes, no glassmorphism-by-default,
  no generic SaaS cards, no stock gradients.