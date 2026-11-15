# Rehearsal: GEPA weight-editing essay (five scenes)

Status: the scenes were built, filmed and checked in a local harness, and the StageShow gate printed `rehearsal passed` for all five scenes at both widths. The site's own build did not run on the build machine. It ran on GitHub Actions on 15 Nov 2026 (commit 8badac1) and passed, and the live page was then checked with the real controls. `npm test` has still not run. Read "Not checked" before relying on this.

## Why the site build did not run
- The npm registry proxy on the build machine blocks package versions that were published in the last few days. It returned 403 "Blocked by Security Policy" for several versions in `package-lock.json`, and it serves no version of `@ui-sdk/react`. The policy was not bypassed.
- So `astro check`, `astro build` and Vitest never ran there. GitHub Actions runs the real build on push.

## How the scenes were checked instead
A harness outside the repo bundled the real scene files with esbuild and rendered them with React 19 from another local project.
- The page was assembled from `index.astro`: frontmatter values filled in, each island replaced by the scene's server-rendered HTML, then hydrated in the browser. This is close to what Astro does, and it is not the Astro build.
- `@ui-sdk/react/button` and `@ui-sdk/react/segmented-control` were replaced by stand-ins that render the same roles and `data-slot` attributes as the live homepage markup. The real package was not rendered.
- TypeScript: `tsc` passed on `src/components/wsp` and the kit with `strict`, `verbatimModuleSyntax` and `isolatedModules`.

## Gold copied
- Scenes 1 and 2: `form-error` (one window, an in-place button, a held result).
- Scene 4: `payout-flow` (arrivals one after another, a payoff that holds).
- Scenes 3 and 5 are diagrams in the page's style. They use the Stage for the clock, the poster and the controls.

## What changed from the gold
- White theme tokens, grey window lights, code colours limited to ink, muted and green.
- Scene 1 is one window with two panes. Two separate windows failed the framing checks.
- On phones, scenes 1 and 2 use a page-style panel in place of the window. The gate reads a tall narrow window as a squashed desktop app.
- Counters in scene 1 are driven from the state, one value per frame, in a fixed-width box. The kit `Count` shifted the text after it as digits arrived.
- Scene 2's marks are an illustration at the scale of the real scores (9 of 32 right, up from 3). The caption says so.
- Scene 5 breaks ties by the order of `data.ts`. Breaking them by MATH-500 score would flatter the ranking that is being judged.

## Gate (`scripts/film.mjs --gate`, upstream 299140f, Chrome, 500 ms frames, 30 frames)
Each scene was played on load in a film page and filmed at 1280 px (wide design) and 390 px (compact design).

| Scene | Wide | Compact |
|---|---|---|
| 1 Loop | rehearsal passed | rehearsal passed |
| 2 Search step | rehearsal passed | rehearsal passed |
| 3 Layers | rehearsal passed | rehearsal passed |
| 4 Seeds | rehearsal passed | rehearsal passed |
| 5 Split | rehearsal passed | rehearsal passed |

Every run also printed `film: inconclusive; watch the motion and inspect every image before approval`, with sampling gaps above 27 ms and a first stage that existed for about 70 ms before Play. Lines the gate left for judgment:
- Scene 1: the counters change text in one box each frame (intended). A badge label starts 8.6 px right of the line above it (the badge's own padding).
- Scene 4: a dot's label comes to rest at the end of a transform.
- Scene 5: the slope chart redraws each frame during the sort (intended).

## Checked in the harness (Chrome, headless)
- Widths 1440, 768, 390 and 320: no horizontal scroll, no text under 12 px, no console errors, no failed requests, no request to another host. Karrik, Inclusive Sans and DM Mono loaded.
- Every scene at 1440 and 390: poster before Play; Play starts the script; Replay restarts it; the end state matches the poster; Show result returns to the poster and to a single Play button.
- Scene 4 switch by mouse and by arrow key changes the three values, keeps keyboard focus, and Tab then Enter starts Play with a visible focus ring.
- Reduced motion: no controls, no running animations, text stable.
- JavaScript off: all five posters and the full article are in the HTML.
- Screenshots of every poster at four widths, and mid-play and end frames at two widths, were looked at and the faults fixed (overlaps in scene 3, label collisions in scene 4 on phones, overflow in scene 5, unstyled controls).

## Checked on the live page after deploy (15 Nov 2026, Chrome, headless)
- GitHub Actions "Deploy to GitHub Pages" passed for 8badac1, which includes `astro check` and `astro build` with the real packages.
- Widths 1440, 768, 390 and 320: no horizontal scroll, no text under 12 px, no console errors, no failed requests, no request to another host, fonts loaded.
- Every scene at 1440 and 390 with the real `@ui-sdk/react` controls and `client:visible` hydration: Play, Replay and Show result behave as in the harness.
- The three switches change their scene by mouse and by arrow key and keep focus. Checked by `aria-checked` and by screenshots.
- Reduced motion and JavaScript off behave as in the harness.
- Homepage lists the essay first of six, the RSS feed has it first, and the share image loads.

## Not checked
- `npm test`, including `src/test/wsp.test.tsx`, which has never run. The deploy workflow does not run tests.
- Touch hardware, Safari and Firefox, and the OS reduced-motion switch (only Chrome's emulation).
- Frame-by-frame film at 40 to 80 ms, and a side-by-side still with each gold.
- The StageShow gate against the deployed page. It ran against the harness only.
