# Plan: GEPA weight-editing essay (`blog/gepa-edits-weights`)

Five StageShow scenes in one article. White theme. Every number comes from `data.ts`, which copies `site-data.json`. Each scene is one file, mounted with `client:visible`, built on `SceneFrame.tsx`.

## Shared frame (`SceneFrame.tsx`)

- Two Stages per scene, a wide twin (960 px design) and a compact twin (358 px design). CSS shows one by the container width (under 560 px is compact). Both are in the server HTML, so the poster works with no JavaScript and before hydration, and no phone page overflows.
- Poster is the finished result: `poster` is the state shown with no script. The script runs only after Play (`play="once"`).
- Controls (Vercel UI SDK `Button`): Play; then Replay and Show result while playing. A `variant` prop switches the data of a scene without remounting the frame, so a switch above the scene keeps keyboard focus. Hidden before mount and under `prefers-reduced-motion`, so no dead buttons.
- Caption under each scene: source line, sentence case, no dashes.
- Figure `role="img"` with a full-sentence `aria-label`.

## 1. LoopScene (after paragraph 2)

- Gold: `form-error` for the single window and the held result.
- Place: one kit `Window` ("Model output", grey lights, the model name as a tag in the toolbar). The problem sits in a row under the bar. Below it are two panes, "No edit" and "Edited". On phones the same content sits in a page-style panel with the panes stacked.
- Real strings only: the loop line, the closing "Therefore" line, the problem. Work lines on the right are placeholder bars, not invented text.
- Numbers: repeats (691) and tokens (16,384; 4,636) count up from the state, one value per frame, in fixed-width boxes. A kit `Meter` shows tokens against the limit.
- Beats (about 9 s): start empty; the left pane writes the loop line (6 rows) while the counters and meter climb; the right pane writes three work bars, then the closing line, and stops at 4,636; left is marked cut off, no answer (red); right is marked answered (green). Hold.
- Poster: left at 691 and 16,384, marked cut off; right at 4,636, marked answered, with the closing line.

## 2. SearchStepScene (after the four-bullet list)

- Gold: `form-error` (one window, an in-place button, a held result).
- One kit `Window` titled `patch.py` with a "Simplified" tag in the toolbar. Body: a 7-line script, shown line by line with kit `Code`; kit `Button` "Run in sandbox"; a row of 32 marks; a "Kept" line. On phones the same content sits in a page-style panel.
- Real: 32 practice problems. The marks are an illustration at the scale of the real search scores: 9 of 32 right, up from 3 in the step before. The caption says the marks are made up.
- Beats (about 9 s): 7 lines appear; Run; marks fill in; "Kept" fades in.
- Poster: script written, 32 marks filled, Kept.

## 3. PatchScene (after the code block and its caption)

- Gold: `bento`/`stacked-cards` for the column layout; the Stage is used for clock, poster and controls, layers are plain DOM in the page style.
- 24 layer columns, each split into attention (top) and MLP (bottom). Changed parts green; others wash.
- Segmented switch (Vercel): "Published edit" (layers 15, 19; MLP only; "131,072 weights, 0.016% of the model") and "Edit found by the search" (layers 10 to 22; MLP and attention; "about 61 million weights").
- Play sweeps layers 0 to 23 and marks each changed layer as its direction is removed.
- Poster: found edit, 13 layers marked.
- Compact: two rows of 12 layers.

## 4. SeedsScene (in "Then I ran it again")

- Gold: `payout-flow` (overlapping arrivals, a payoff that holds).
- MATH-500 axis, 0 to 70%, drawn in plain DOM. Reference lines: 45.6% (thinking off, no edit), 53.3% (published edit). Base model 7.1% as a small fixed mark.
- Segmented switch (Vercel) for four groups. Play drops the three runs one at a time with their values. Colours: below 45.6 red, above 53.3 green, between ink.
- Poster: GEPA group, three dots placed.
- Caption adds one sentence: "The last two groups are explained in the next section."
- Compact: narrower axis, labels stagger on two rows.

## 5. SplitScene (in "How to pick a run")

- Gold: `story` (related objects with a connector).
- Top: three blocks of 16, 32 and 48 problem marks with the three role labels.
- Bottom: slope chart, 12 runs. Left column ordered by a score; right column is the MATH-500 rank. Lines cross for the search's own score (rank correlation 0.11) and sit mostly level for the held-out score (0.77). Both correlations are computed in the test from `data.ts`.
- Segmented switch picks the poster ordering. Play re-sorts the left column from the search's own score to the held-out score with per-frame updates, so the lines untangle.
- Compact: blocks stack; the chart narrows and shows values only.

## Page

- White page, #ffffff. Panels #fbfbf7, wash #eff2e8, rules #d9dfd1, ink #262d24, muted #596450, accent #315c43, red #9d3029, red wash #fbefeb. No other hues.
- Prose column 720 px max; scenes break out to 960 px. Body 18 px desktop, 17 px phone.
- Fonts: Karrik headings, Inclusive Sans body, DM Mono for code and measurements. All self-hosted.
