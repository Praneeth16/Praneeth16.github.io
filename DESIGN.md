# Design

## House system (home, essays)
- Type: Fraunces for headings, Spectral for body, DM Mono for interface text, tables, and measurements. Self-hosted from `public/fonts`.
- Colour: paper background, warm near-black ink, soft ink for secondary text, one blue accent for links and focus. Tokens live in `src/styles/global.css`.
- Layout: single 700px measure, sticky header with a reading-progress line, interactive widgets break out to 960px.
- Motion: none beyond hover and focus.

## Homepage / StageShow
- Karrik headings and Inclusive Sans body copy, self-hosted with their OFL licenses. Homepage styles stay scoped to `.home-stageshow`; essays keep their existing layout and typography.
- A 1280px editorial layout on pale paper with olive and forest-green accents. Hero copy shares the first section with an illustrated agent evaluation, followed by a featured visual story, filterable essay index and a short author introduction.
- StageShow's form-error gold supplies the workbench structure. The scene is explicitly sample data, plays on request, and holds the result. Replay is an explicit reset; Show result stops motion. Reduced motion and pre-hydration show the complete result.
- The narrow workbench is a separate 358px composition without the sidebar. CSS also keeps the server-rendered poster readable before hydration.
- Vercel UI SDK's Segmented Control handles the writing filters, including keyboard navigation and accessible selection. All five essays remain in the server-rendered HTML.

## Visual story surface (`blog/how-llms-are-built`)
- Karrik and Inclusive Sans, with KevinSans lettering inside the existing drawings. Paper, olive, and green connect the article to the homepage. Red identifies the failure experiments.
- The cover introduces tokenization and links to four chapters. Scene cards pair the original canvases with explanatory text and tuck technical transitions into an expandable note. At phone widths the heading comes before the canvas, and chapter links fit a two-column grid.
- Guided reading adds a sticky bar below the masthead. Previous, Next, and Play move through the scenes, and Exit guide returns focus to the current scene. The page remains scrollable and the model and lab stay in the chapter flow.
- Visible canvases animate unless motion is paused or reduced. The controls and explanations remain usable with motion paused.
- `node scripts/check-llm-story.mjs` checks the scene order against the TLA+ model and verifies that every drawing is used once.

## Experiment essay (`blog/gepa-edits-weights`)
- White theme, separate from the paper house system: page #ffffff, panels #fbfbf7, wash #eff2e8, rules #d9dfd1, ink #262d24, muted #596450, accent green #315c43, failure red #9d3029 with wash #fbefeb. Green means the model stops and answers; red means it loops or fails. No dark sections, no other hues.
- System fonts only, after april-zhu.com/pocketcity: Iowan Old Style for headings and text (normal weight, tight letter spacing on headings; Palatino or Georgia where Iowan is missing), Helvetica Neue for labels, captions and controls, and the system monospace for code, measurements and small uppercase labels. Text is 20px on wide screens, 18px below 960px, 17px on phones, with an 880px measure. The four roles are variables at the top of `wsp.css`. The page downloads no fonts and makes no external requests; no analytics.
- Text and scenes share one column. Each figure is sized so that the window or drawing inside it starts and ends on the text edges, and its switch and caption start on the same edge. `SceneFrame` takes `inset` (24 or 0) for the stage's inner gutter.
- Five StageShow scenes in `src/components/wsp`. Each has a wide design (960px) and a compact design (358px) rendered together and switched by container width, so the poster works without JavaScript. Play runs the script once; Replay restarts; Show result returns to the poster; reduced motion and pre-hydration show the poster only. Controls use the Vercel UI SDK, styled through their `data-slot` hooks in `wsp.css`. On wide screens scenes 1 and 2 sit in a kit window with grey lights. On phones they sit in a page-style panel, because a desktop window is squashed at that width.
- Every number comes from `src/components/wsp/data.ts`, copied from `04-content/articles/gepa-edits-weights/site-data.json`.
- A switch above a scene changes the data without remounting the frame, so it keeps keyboard focus. Ties in a ranking keep the order of `data.ts` and are never broken with the score the ranking is compared with.
- Checks: `npx vitest run src/test/wsp.test.tsx` (data invariants, poster rendering, segmented control), `npm run build`, `node scripts/check-llm-story.mjs`, and a grep for dashes in `src/components/wsp` and the page.
