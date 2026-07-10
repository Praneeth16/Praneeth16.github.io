---
title: "Compress the Embedding, Keep the Retrieval"
description: "A research note on reducing vector storage after embeddings are generated."
publishedAt: 2026-05-21
kind: note
tags: [embeddings, retrieval, compression, vector-search]
featured: false
readingMinutes: 4
draft: false
---

Embedding cost does not end at inference. Large collections pay again in storage, memory, transfer, and index operations.

The useful experiment is to compress an existing embedding matrix, then measure retrieval quality against the original index. This separates a storage optimization from a model change.

I track three quantities:

1. bytes per vector
2. recall at a fixed candidate depth
3. end-to-end retrieval latency

The target is not maximum compression. It is the smallest representation that preserves the decisions the application needs to make.

This makes compression a dataset-specific engineering choice. A technique that preserves semantic search may behave differently on near-duplicate matching or long-tail entity retrieval. The evaluation set should look like the queries that matter.
