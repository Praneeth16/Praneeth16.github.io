# Jev vs GPT-6 Luna as routers

Companion code for [WTF Is a System One Model?](https://praneeth16.github.io/blog/wtf-is-a-system-one-model/). Both routers were called through OpenRouter on 26 September 2026.

| Task | Data | Routers | Label |
| --- | --- | --- | --- |
| A. Which specialist? | CLINC150 `plus`, 11 routes (10 domains + `out_of_scope`), 110 dev / 330 test | Jev Choice vs Luna JSON schema | CLINC domain of the intent |
| B. Does it need the big model? | MMLU-Pro, 14 subjects, 98 dev / 308 test | Jev Noul vs Luna stated probability | Did Luna (reasoning off) answer correctly? |

GPT-6 Sol (low reasoning) answers Task B questions only to build the ground truth and the cost curve. It is not a router.

## Files

- `prepare.py` downloads the pinned datasets, checks SHA-256, and writes the samples to `inputs/`. No model calls.
- `questions.py` holds the router instructions and criteria. Both routers receive the same text. Its digest is recorded in `run/config.json` and checked on every run.
- `run.py` makes the calls and appends every response to `run/calls.jsonl`. A successful call is never repeated.
- `analyze.py` recomputes every number in the article from `run/calls.jsonl` and writes `run/analysis.json` and `../../public/system-one/evidence.json`. No model calls.
- `tests/` checks response validation, identical criteria, reasoning settings, leakage of benchmark text into criteria, and the metric helpers.

## Reproduce

Offline, from the recorded responses:

```bash
uv venv .venv && uv pip install --python .venv/bin/python pandas pyarrow numpy scikit-learn pytest
.venv/bin/python analyze.py
.venv/bin/python -m pytest -q tests
```

Live, which cost $0.50 in total:

```bash
export OPENROUTER_API_KEY=...        # or put the key in ~/.openrouter_key
.venv/bin/python prepare.py
for phase in route answer tier; do for split in dev test; do .venv/bin/python run.py $phase --split $split; done; done
.venv/bin/python run.py latency
```

Delete or move `run/calls.jsonl` first, or the runner reuses the recorded responses.

## Notes

- Jev returns probabilities rounded to two decimals, so eleven options can sum to 0.99 and the chosen option can sit 0.01 below the maximum. `run.py` accepts rounding-level differences; `analyze.py` re-validates every stored response with the current parser and counts these cases. During the run, five responses failed an earlier, stricter check. They were re-validated from the stored bodies, not bought again.
- Latency is client-observed through OpenRouter with 8 requests in flight, plus a serial probe of 40 requests per router.
- CLINC150 is CC BY 3.0 and MMLU-Pro is MIT. The evidence file bundles the sampled test texts for the article's explorers.
