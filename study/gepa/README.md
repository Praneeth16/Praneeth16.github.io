# Jev + GEPA study

Open `Jev_GEPA_Results.html` for the illustrated findings and `Jev_GEPA_Experiment.ipynb` for the executed analysis. The notebook defaults to reading saved responses without API calls.

This is a separate follow-up to the original Jev HLS experiment. All 500 previously evaluated Jev sentences were excluded. The new partitions have 100 training, 100 validation, and 300 test examples. The primary optimization metric was Brier score. Four reflection proposals were supplied by the conversation assistant through GEPA 0.1.4's documented custom-proposer interface; GEPA controlled search and selection. The reflection model version and cost were not available.

## Recompute

Install `requirements.txt` in a virtual environment, then run:

```bash
python analyze.py
python build_deliverables.py
python build_notebook.py
```

The analysis and report use saved responses. They make no Jev API calls. The notebook generator executes only the default replay cells and leaves live execution disabled.

Run `python -m unittest discover -s tests` for the offline integration checks: request boundaries, credential-free logging, model pinning, cache reuse, fixed label keys, and exclusion of test examples from reflection.

## New live experiment

Use the notebook's final section and configure `GENERATE_REFLECTION`, `REFLECTION_MODEL_LABEL`, and `TYPESAFE_API_KEY`. The generative callable accepts a reflection request string and returns a JSON string containing `instructions`, `ade_related`, and `not_related`. It is provider-independent. This callable must be configured before any live Jev requests.

Alternatively, `python experiment.py --run-dir NEW_DIRECTORY` uses the file-proposer workflow from the recorded pilot. It prompts for a TypeSafe key with echo disabled, then writes numbered reflection requests and waits for an external assistant to write corresponding JSON responses. This CLI mode is not unattended. The optional `--test-frozen` flag finishes the test phase from an existing frozen candidate and cached completed responses. Missing requests can incur new charges. No automatic retries are used.

`experiment.py --prepare-only --run-dir NEW_DIRECTORY` prepares the pinned corpus and disjoint partitions without Jev calls. Reusing these now-observed test examples is a replication; reserve new data before another claim of generalization.

## Records and limitations

`run/calls.jsonl` preserves labels, row hashes, candidate hashes, validated responses, usage, and client-observed latency. `gepa_result.json` stores candidate ancestry and selection scores. `frozen_candidate.json` records the selected prompt and freeze time. Reflection inputs preserve training row identifiers, gold labels, and output feedback; source sentences are omitted. They can be recovered from the pinned public corpus. All candidate outputs are included in full.

The initial append journal contained 1,250 of 1,260 successful evaluation calls. Seven original records were recovered from redundant GEPA/test outputs, leaving three missing optimization response payloads. `record_integrity.json` identifies them. All 600 final test responses and the original/selected validation sets are complete. Cost and latency use 1,257 preserved full records; cost is a lower bound. The original journal is retained separately. The supplied runner adds atomic batch and final response snapshots to improve future record preservation. No model calls were repeated during reconciliation.

The raw dataset, API key, virtual environment, and binary engine checkpoints are not included. The dataset card lists its license as unknown. The lack of article identifiers prevents document-level separation. Label agreement is not a clinical validation. Cost estimates exclude reflection cost and are not billing records. Inference variability and alternate search seeds were not evaluated.

The two result figures were inspected. HTML image embedding and notebook execution were checked; a rendered browser screenshot was unavailable in this environment.
