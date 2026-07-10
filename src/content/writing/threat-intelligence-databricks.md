---
title: "Threat Intelligence on Databricks: From Feed to Investigation"
description: "A two-hour workshop that turns fragmented threat feeds into an analyst-ready, agent-assisted investigation workflow."
publishedAt: 2026-07-06
kind: workshop
tags: [cybersecurity, databricks, agents, threat-intelligence]
featured: false
readingMinutes: 6
draft: false
---

Threat intelligence teams rarely lack data. They lack a fast, defensible path from a new indicator to the evidence needed for a decision.

This workshop follows one use case end to end: investigate a suspicious domain, connect it to internal telemetry and external intelligence, then produce an analyst-reviewed case brief.

## The two-hour build

### Step 1: Ingest and normalize

Load structured feeds, unstructured reports, and security telemetry into governed tables. Preserve source, timestamp, confidence, and handling restrictions.

### Step 2: Enrich and correlate

Extract indicators from reports, normalize entities, and link them to DNS, proxy, authentication, or endpoint events. The important output is not a larger feed. It is a smaller set of explainable relationships.

### Step 3: Investigate with an agent

The agent can retrieve context, propose queries, summarize evidence, and surface competing explanations. It cannot silently close the case or invent a source.

### Step 4: Evaluate the workflow

Participants check citation resolution, evidence ordering, tool permissions, and analyst acceptance. Every generated claim must be traceable to a retrieved artifact.

The workshop is designed for experienced cybersecurity practitioners who are new to Databricks. The domain workflow stays central while each platform component earns its place.

[View the demo repository](https://github.com/Praneeth16/auto-threat-intelligence-tesco-demo).
