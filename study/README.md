# Jev + GEPA: the recorded studies

Read the article at https://praneeth16.github.io/blog/adapting-jev-with-gepa/.

- `original/Jev_HLS_ADE_Experiment.ipynb`: the first executed experiment, with 200 validation and 300 test sentences.
- `gepa/Jev_GEPA_Experiment.ipynb`: the executed GEPA follow-up, with 100 reflection training, 100 validation, and 300 different test sentences.

The notebooks preserve their original contents. The first notebook has live-run flags enabled from the recorded run; inspect them before executing it. The GEPA notebook defaults to offline replay. Keys must come from a secret store or hidden input. No credentials are included.

Use each directory's requirements in its own virtual environment. From `original/`, `python analyze_run.py` downloads the pinned source if necessary and recomputes metrics without TypeSafe calls. From `gepa/`, `python analyze.py` recomputes the paired comparison from saved predictions. See `gepa/README.md` for the adapter, reflection callback, and reproduction instructions.

All 600 final GEPA test responses and both original/selected validation sets are complete. Three optimization response payloads remain unavailable; `gepa/run/record_integrity.json` identifies them. GEPA engine scores and all five candidates are retained. Recorded token usage is a lower bound and excludes reflection cost. The conversation assistant supplied the four proposals; its model identity and cost are unavailable.

The website's `public/jev/evidence.json` contains row IDs, source row offsets, labels, saved probabilities, candidate texts, and timings. Original corpus sentences are fetched by the reader from Hugging Face and verified against the recorded hash and label. The corpus itself is not included. Its dataset card lists its license as unknown.

Scores measure agreement with the unchanged corpus labels. Sentence deduplication does not establish article-level separation, and pretraining exposure is unknown.
