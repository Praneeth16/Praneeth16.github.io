# Website validation

The static Astro build passed with zero errors, warnings, or hints. Chromium checks at 1440 × 1000 and 390 × 844 verified the homepage's single article, self-hosted fonts, and absence of page-level horizontal overflow.

Nine evidence viewers initialized without JavaScript exceptions or failed local assets. Checks covered metric switching, candidate selection and exact prompt lengths, dataset filters and empty search results, error-group selection, confusion-matrix cells, both review cutoffs, and diagram expansion.

Browser calculations reproduce the paired test: original TP/FP/TN/FN = 57/47/192/4; selected = 55/22/217/6; 28 corrected and five introduced errors. Starting review counts are 112 in Experiment 1 and 78 for the GEPA-selected prompt in Experiment 2.

The browser loaded a source sentence from Hugging Face and verified its label and normalized SHA-256 against the saved study. Cross-origin checks remained enabled. The managed test browser required a local HTTPS certificate override for its network proxy; the public service also returned HTTP 200 through the standard trusted HTTP client. This test-browser setting is not part of the website.

Charts and controls operate on recorded outputs. No new model evaluations were made during the website redesign.
