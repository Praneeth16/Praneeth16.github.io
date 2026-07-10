---
title: "LayoutScribe"
description: "A Python package that converts PDF, PowerPoint, and Word files into Markdown and layout-aware JSON using multimodal models."
year: 2025
status: released
tags: [Python, multimodal, documents, PyPI]
githubUrl: "https://github.com/Praneeth16/LayoutScribe"
featured: true
order: 3
---

Document parsing is usually treated as text extraction. Many useful documents communicate through layout: callouts, diagrams, reading order, tables, and relationships between visual blocks.

LayoutScribe uses multimodal models to produce clean Markdown alongside layout-aware JSON. It includes validation, retries, and fallbacks for blank or difficult pages.

The package is designed as a reusable preprocessing layer for retrieval, extraction, and document understanding pipelines where plain OCR loses too much structure.
