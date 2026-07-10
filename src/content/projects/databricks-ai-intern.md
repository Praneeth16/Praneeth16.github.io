---
title: "Databricks AI Intern"
description: "An autonomous AI and ML engineer that researches, trains, measures, reproduces, and serves what it builds using Databricks-native primitives."
year: 2026
status: active
tags: [Databricks, MLflow, agents, serverless]
githubUrl: "https://github.com/Praneeth16/databricks-ai-intern"
featured: true
order: 2
---

Give the system a goal such as “fine-tune this model on a governed table” or “build a classification model for this dataset.” It runs a measured research loop inside the workspace.

## More than a one-shot agent

The control loop lives in code. Parallel hypotheses run as jobs, evaluation reads ground truth from governed data, and a reproduce gate prevents a lucky run from becoming the reported result.

Every experiment is written to a Delta ledger with MLflow lineage. The system can then plan serving infrastructure, deploy the selected model, and benchmark the endpoint.

The project explores a specific question: how much of an AI engineer’s iterative workflow can be automated without giving the model control over the evidence used to judge itself?
