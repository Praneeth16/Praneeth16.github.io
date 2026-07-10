---
title: "Real-Time Agents with FastAPI and WebSockets"
description: "Workshop notes for moving from request-response agents to observable, event-driven systems."
publishedAt: 2026-03-14
kind: workshop
tags: [agents, fastapi, websockets, python]
featured: false
readingMinutes: 7
draft: false
---

Most agent tutorials return one final response. Real applications need to expose the work in between: tool calls, partial answers, approvals, errors, and cancellation.

This workshop builds that path with FastAPI and WebSockets.

## Learning goals

By the end, participants can:

- model an agent run as a stream of typed events
- send progress from the server without coupling the UI to one framework
- pause for human approval and resume the same run
- handle disconnects, cancellation, and tool failures
- persist enough state to debug a failed session

## A small event contract

```python
class AgentEvent(BaseModel):
    run_id: str
    sequence: int
    type: Literal["status", "token", "tool", "approval", "error", "done"]
    payload: dict
```

The event contract is more durable than the internal agent framework. The UI listens to domain events, not private callback objects.

## Workshop flow

1. Build a request-response agent endpoint.
2. Introduce an event bus inside the run.
3. Stream events over a WebSocket.
4. Add a tool approval pause.
5. Simulate a disconnect and resume.
6. Inspect the trace and improve the failure state.

The result is not a chat animation. It is an observable execution protocol.

[View the workshop repository](https://github.com/Praneeth16/agents-api-websockets).
