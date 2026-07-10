---
title: "Real-Time Agent APIs"
description: "A reference implementation for streaming agent events, tool activity, approvals, and errors through FastAPI and WebSockets."
year: 2026
status: released
tags: [FastAPI, WebSockets, Python, agents]
githubUrl: "https://github.com/Praneeth16/agents-api-websockets"
featured: true
order: 4
---

A production agent is a process, not a single response. This project defines a small event protocol for exposing that process to a user interface.

It demonstrates streaming tokens and status, tool-call visibility, human approval, cancellation, disconnect handling, and trace persistence without tying the interface to one agent framework.

The repository also supports a hands-on workshop on event-driven agents.
