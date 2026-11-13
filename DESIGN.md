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
