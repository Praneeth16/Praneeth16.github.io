# Rehearsal: Agent workbench

Gold: StageShow `form-error`, pinned upstream 299140fafd08df55a9c234e610c3f64af3f45531. Kept the single cropped window, fixed message lane, field correction and in-place button payoff. Changed signup into a clearly labeled illustrative agent evaluation; added a context sidebar on wide screens only.

Beats: inspect unsupported answer; type an evidence rule; run evaluation; hold the sourced answer. Plays once on request, about 11 seconds, with explicit replay and a stop-to-result control. The initial server-rendered state is the completed result.

Checked in the available browser: desktop composition; 390px and 320px iframe layouts; play, keyboard replay, failure and final success; mobile writing filter; sandboxed no-JavaScript poster. The production build and development build both hydrate successfully after pinning the compatible Astro React integration to 6.0.6. No application errors were reported in the final development browser check.

Checks: `npm test` (2 passing filter wiring/keyboard and agent tests); `npm run build` (0 errors, 0 warnings; one upstream Lucide deprecation hint); StageShow class-clash check (no overlapping namespaces).

Review fixes: missing arrow glyph replaced with Lucide; compact labels enlarged; no-JavaScript compact layout provided with container CSS; pre-hydration playback controls hidden; header About links to its section; footer aligned with the page.

Gate: not run. This environment permits browser control only through its supplied browser surface, so the standalone Playwright film/layout scripts were not used. No claim of `rehearsal passed`.

Not checked: frame-by-frame 40–80ms film sampling, gold-side-by-side screenshot, real touch hardware, OS-level reduced-motion toggle. Reduced-motion behavior is supplied by the StageShow poster path and scoped CSS, and motion starts only by user request.
