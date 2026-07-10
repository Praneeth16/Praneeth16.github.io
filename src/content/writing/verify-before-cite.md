---
title: "Verify Before You Cite"
description: "A small trajectory rule that caught a large class of polished agent failures."
publishedAt: 2026-06-18
kind: note
tags: [evaluation, agents, traces, citations]
featured: false
readingMinutes: 4
draft: false
---

A citation can resolve perfectly and still support the wrong claim.

While evaluating a policy assistant, I found that output checks were giving full credit to answers with valid links. The failure lived earlier in the trajectory: the agent wrote the conclusion first, then searched for something that looked compatible.

The fix was an explicit invariant:

> Evidence must be retrieved and verified before the final answer cites it.

This produced a deterministic trajectory check:

```python
def verify_before_cite(trace) -> bool:
    verified_at = first_timestamp(trace, event="evidence.verified")
    cited_at = first_timestamp(trace, event="answer.citation_added")
    return verified_at is not None and verified_at < cited_at
```

In the initial single-call baseline, this behavior was nearly absent. Moving to a propose, verify, finalize loop made the ordering visible and enforceable.

The broader lesson is that many “hallucination” problems are workflow problems. Evaluate the path the model took, not only the paragraph it returned.
