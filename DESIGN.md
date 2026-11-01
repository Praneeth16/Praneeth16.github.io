# Design

## House system (home, essays)
- Type: Fraunces for headings, Spectral for body, DM Mono for interface text, tables, and measurements. Self-hosted from `public/fonts`.
- Colour: paper background, warm near-black ink, soft ink for secondary text, one blue accent for links and focus. Tokens live in `src/styles/global.css`.
- Layout: single 700px measure, sticky header with a reading-progress line, interactive widgets break out to 960px.
- Motion: none beyond hover and focus.

## Visual story surface (`blog/how-llms-are-built`)
Mode: Experience. The drawings are the page; the interface recedes.
- Type: KevinSans (MIT, from statechart-art) for display and headings, Spectral for body and captions, DM Mono only for data readouts and the angle indicator. No eyebrows or section numbers.
- Colour: the same paper and ink as the house system; `--gold-ink` for emphasis and progress; `--red` reserved for failure states. Each drawing sits on its own dark or warm paper swatch, which comes from the drawing, not the page.
- Layout: one 1180px column. Scenes are a 7:5 grid of drawing and text, stacked under 900px. Interludes bleed the deeper paper tone full width.
- Motion: the cover has the single authored moment (the question writes itself, splits into tokens, and points down). Canvases animate only while in view and stop when the tab is hidden or the reader pauses motion. Detours crossfade the drawing in place; nothing opens a modal.
- Reduced motion: every canvas paints a complete still frame; cover elements appear without animation.
- States: hover and focus on every control, pressed state for the break and machine buttons, a red outline on a broken scene.
- Checks: `node scripts/check-llm-story.mjs` verifies the scene order against the TLA+ lifecycle model and that every drawing is used once.
