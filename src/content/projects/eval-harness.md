---
title: "CLEAR-S Eval Harness"
description: "A layered evaluation system for testing agent outputs, trajectories, safety, latency, and cost across prompts, frameworks, and models."
year: 2026
status: active
tags: [MLflow, agents, evaluation, traces]
githubUrl: "https://github.com/Praneeth16/eval-harness"
featured: true
order: 1
---

Most agent evaluations inspect the final answer. CLEAR-S treats the execution path as part of the product.

The harness combines deterministic checks, trace-level invariants, model-based judges, safety tests, latency, and cost into seven practical axes: correctness, latency, execution, adherence, relevance, safety, and cost.

## The question it answers

Did the system improve, or did one metric move while a hidden failure got worse?

Each experiment records the configuration, dataset slice, outputs, traces, and evaluator results. This makes it possible to compare a prompt change, a workflow fix, a held-out domain, or a model swap using the same language.

## Why trajectory checks matter

A policy assistant may cite a valid document without verifying that the document supports its claim. An output check sees a citation. A trajectory check sees whether verification happened before citation.

The harness is designed to make those rules explicit, cheap to run, and easy to inspect.
