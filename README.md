# Praneeth Paikray

Personal portfolio and technical publication built with Astro and deployed on GitHub Pages.

Live site: <https://praneeth16.github.io>

## Write a new post

Add a Markdown file to `src/content/writing/`. Use one of three formats:

- `essay` for long-form technical writing
- `note` for short research findings
- `workshop` for session notes and teaching material

Start with this frontmatter:

```yaml
---
title: "Your title"
description: "A concise summary for the archive and search."
publishedAt: 2026-07-10
kind: essay
tags: [agents, evaluation]
featured: false
readingMinutes: 8
draft: true
---
```

Set `draft: false` when the post is ready. Every push to `main` rebuilds and publishes the site.

## Run locally

```bash
npm install
npm run dev
```

Use `npm run build` before publishing.
