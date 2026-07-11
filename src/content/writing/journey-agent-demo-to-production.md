---
title: "Journey of an Agent: From Demo to Production"
description: "A practical map of what changes when an agent leaves the notebook and starts serving real users."
publishedAt: 2026-06-02
kind: essay
tags: [agents, evaluation, mlflow, production]
featured: true
readingMinutes: 12
externalUrl: "https://pub.towardsai.net/journey-of-an-agent-from-demo-to-production-9606ea8df8eb"
draft: false
---

The first version of an agent is usually a convincing conversation. The production version is a system that can explain what it did, recover when a dependency fails, and stay inside the boundaries we gave it.

That difference is not solved by a larger prompt. It is solved by changing what we treat as the product.

## The demo optimizes for possibility

A demo answers one useful question: *can the model do this at all?* It is intentionally forgiving. The happy path is known, the tools are available, and a human is watching closely enough to rescue the run.

Production asks a different set of questions:

- What happens when the user is ambiguous?
- Can the agent distinguish evidence from an attractive guess?
- Which actions require verification or approval?
- How do we reproduce a failure from last Tuesday?
- Does the behavior hold after a model or prompt change?

The work moves from prompt design to systems design.

## Make the loop explicit

The most useful architectural change is to pull important control flow out of the model. If verification must happen before a citation is returned, that rule should be visible in code and observable in the trace.

```python
def answer(question: str) -> Answer:
    proposal = agent.propose(question)
    evidence = verifier.check(proposal.claims)
    return finalizer.compose(proposal, evidence)
```

The model still does the work that benefits from language understanding. Code owns the invariant.

This produces a cleaner contract. The agent may choose *how* to investigate, but it cannot skip the verification gate.

## Evaluate the path, not only the answer

Two agents can return the same paragraph through very different trajectories. One retrieves evidence before making a claim. The other writes the claim first and finds a plausible source afterward.

An output-only evaluator may accept both. A trajectory evaluator can distinguish them.

For production agents, I group checks into four layers:

1. **Deterministic checks** for schema, tool arguments, citations, and policy invariants.
2. **Trajectory checks** for ordering, retries, verification, and forbidden actions.
3. **Judges** for relevance, clarity, and task-specific quality.
4. **Safety checks** for data handling and harmful behavior.

The cheapest reliable check should run first. A judge should not be asked to rediscover a condition that code can verify exactly.

## Keep a ledger of experiments

Every meaningful change should leave behind more than a good screenshot. Record the prompt, model, tools, dataset slice, evaluator versions, trace, latency, and cost.

This gives the team a shared language for changes:

> The new verifier improved the execution axis on the held-out framework, but reviewer acceptance dropped after the answer became too cautious.

That sentence is actionable. “The new prompt feels better” is not.

## Production is a series of gates

I find it useful to think about the journey as a sequence of gates:

| Gate | Question |
| --- | --- |
| Capability | Can the agent complete representative tasks? |
| Reproducibility | Can we rerun and explain the result? |
| Robustness | Does behavior survive held-out inputs and model changes? |
| Operations | Can we observe, limit, and recover the system? |
| Adoption | Does the workflow improve a real user outcome? |

The final gate matters most. A reliable agent attached to the wrong workflow is still the wrong product.

## What changes in practice

The production version of an agent usually has more ordinary software around it: typed inputs, explicit states, queues, timeouts, retries, permissions, traces, evaluation datasets, and interfaces designed for correction.

That is not a failure of agent autonomy. It is what makes useful autonomy possible.
