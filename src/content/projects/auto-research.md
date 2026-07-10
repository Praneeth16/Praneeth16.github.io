---
title: "Auto Research on Serverless"
description: "An experiment in parallel hypothesis generation and measured iteration using Databricks serverless jobs."
year: 2026
status: research
tags: [research, Databricks, serverless, agents]
githubUrl: "https://github.com/Praneeth16/auto-research-on-databricks-serverless"
featured: false
order: 5
---

This project tests a deterministic research loop where an agent proposes hypotheses, serverless jobs evaluate them in parallel, and a reproducibility gate decides which result can move forward.

The model suggests experiments. The surrounding code owns scheduling, ground truth, comparison, and stopping conditions.
