# Praneeth Paikray

A minimal personal site and one interactive research article, built with Astro and published to GitHub Pages.

- Home: https://praneeth16.github.io/
- Article: https://praneeth16.github.io/blog/adapting-jev-with-gepa/
- Recorded experiments: `study/`

## Local development

```bash
npm ci
npm run build
```

The GitHub Actions workflow deploys pushes to `main`. The site publishes the introduction, Jev/GEPA article, RSS feed, sitemap, and a 404 page. Earlier content sources remain in git but have no generated public routes.

## Article and evidence

`src/content/jev-article.md` is the complete article source. `scripts/compile_article.py` converts it to the HTML imported by the Astro article page. It requires Python Markdown and Pygments. The article's nine interactive views use plain JavaScript and the recorded `public/jev/evidence.json`; they make no model API calls.

Run `python scripts/compile_article.py` after editing the article source. Run `python scripts/draw_plots.py` to redraw its numerical figures from the saved evidence with Matplotlib and NumPy. `scripts/prepare_evidence.py PATH_TO_ORIGINAL_WORKSPACE` reconstructs the public evidence index from the original study workspace and downloaded pinned corpus.

Source sentences load on demand from the public Hugging Face rows service. The browser verifies the label and normalized-text SHA-256 against the saved study before displaying them. Service availability is external; a direct source link remains available if loading fails. Source corpus text is not bundled in the repository.

## Design

The typography uses self-hosted Spectral, Schibsted Grotesk, and Fragment Mono, with their Open Font Licenses in `public/fonts/`. The font stack and restrained palette were informed by Jasper Lu's GRPO article. The site implementation, diagrams, and study viewers are original.

Five explanatory scenes were sent to the official Excalidraw MCP server (`excalidraw/excalidraw-mcp`, v0.3.2, source commit `157aa23ceb1976008aadc89eb05e3444060f09d6`) through `read_me` and `create_view`. `public/jev/diagrams/` includes scene inputs, editable `.excalidraw` files, SVG and PNG exports, and MCP provenance. Numerical charts are drawn from the saved results; diagrams are conceptual.

No TypeSafe or generative-model API credentials belong in this repository.
