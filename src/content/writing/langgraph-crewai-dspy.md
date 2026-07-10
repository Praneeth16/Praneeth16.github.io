---
title: "LangGraph vs CrewAI vs DSPy: What 900 Runs Actually Changed"
description: "A framework comparison built around one refund assistant, repeated runs, and the costs hidden by a single successful demo."
publishedAt: 2026-04-25
kind: essay
tags: [agents, benchmarks, dspy, langgraph, crewai]
featured: false
readingMinutes: 11
draft: false
---

Framework comparisons often stop after implementing one happy path. That tells us whether the APIs are pleasant. It tells us much less about how the system behaves repeatedly.

I implemented the same refund assistant in LangGraph, CrewAI, and DSPy, then ran the variants hundreds of times. The goal was not to declare a universal winner. It was to expose the tradeoffs that become visible only after the fifth, fiftieth, and five-hundredth run.

## Hold the task still

Every implementation received the same input distribution, tools, model family, and output contract. I tracked:

- end-to-end latency and tail latency
- input, output, and reasoning tokens
- framework prompt overhead
- task success and tool-call correctness
- setup or compilation cost

The last two are easy to miss. A framework can look inexpensive on the steady-state request while moving cost into system prompts or an optimization phase.

## Architecture is part of the benchmark

LangGraph makes control flow concrete. CrewAI makes role decomposition easy to express. DSPy treats prompts and modules as something that can be optimized against examples.

Those are not merely syntax preferences. They influence where complexity lives and what the team can measure.

The useful question is not “Which framework is best?” It is “Which kind of change do I expect to make most often?”

- Choose explicit state graphs when workflow control and inspection dominate.
- Choose role-oriented composition when the mental model maps naturally to collaborating specialists.
- Choose optimizable modules when examples and a measurable objective are available.

## Repetition changes the answer

A five-step workflow with 90 percent reliability per step succeeds end to end only about 59 percent of the time.

```text
0.9 × 0.9 × 0.9 × 0.9 × 0.9 = 0.59049
```

This is why individual tool-call screenshots are weak evidence. Reliability compounds across the path.

Repeated runs also reveal variance. A slightly slower median may be acceptable. A long and unpredictable tail can make an interactive product feel broken.

## Benchmark your application, not the logo

Frameworks evolve quickly, and application structure matters more than any headline table. Treat comparisons as a method:

1. Define a representative task distribution.
2. Hold models and tools constant.
3. Measure success, trajectory, latency, and cost.
4. Repeat enough times to see variance.
5. Inspect the failures, not only the aggregate.

The result should help you choose where you want control, not give you a permanent ranking.
