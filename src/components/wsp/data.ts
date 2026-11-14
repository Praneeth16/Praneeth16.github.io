// Every number on the GEPA weight-editing page. Copied by hand from
// 04-content/articles/gepa-edits-weights/site-data.json; keep the two in step.
// Percentages are MATH-500 accuracy (strict grading, 500 problems x 2 samples)
// unless the name says otherwise.

export const MODEL = { name: 'Qwen3.5-0.8B', layers: 24, stateSize: 1024 } as const;

export const BENCHMARK = { name: 'MATH-500', problems: 500, samplesPerProblem: 2, tokenLimit: 32768 } as const;

export const REFERENCES = {
  base: { label: 'No edit, thinking on', math500: 7.1, cutAtLimit: 92.9 },
  thinkingOff: { label: 'No edit, thinking off', math500: 45.6 },
  published: { label: 'Published edit (Sparks post)', math500: 53.3, cutAtLimit: 29.6, finishedWrong: 17.9 },
  best: { label: 'Best edit found (GEPA, seed 1)', math500: 60.6, vsPublished: 7.3, interval95: [4.6, 10.0] as const, fewerTokensPerCorrectPct: 23 },
} as const;

export const EXAMPLE = {
  problem: 'A circular garden is enlarged so that its new diameter is twice the old one. What is the ratio of the original area to the new area?',
  loopLine: 'Wait, r_new = 2 r_old.',
  loopRepeats: 691,
  baseTokens: 16384,
  editedLastLine: 'Therefore, the ratio of the original area to the enlarged area is 1/4.',
  editedTokens: 4636,
} as const;

export const EDITS = {
  published: { layers: [15, 19] as const, parts: ['mlp'] as const, weights: 131072, shareOfModelPct: 0.016 },
  found: { layers: [10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22] as const, parts: ['mlp', 'attention'] as const, weightsApprox: 'about 61 million' },
} as const;

export const SPLIT = {
  feedback: 16,
  selection: 32,
  heldOut: 48,
  rankCorrelation: { searchOwnScore: 0.11, heldOut: 0.77 },
  searches: 12,
} as const;

export type GroupId = 'gepa' | 'gepaFromPublished' | 'noGepa' | 'wrapUpTool';

export const GROUPS: { id: GroupId; label: string }[] = [
  { id: 'gepa', label: 'GEPA, from scratch' },
  { id: 'gepaFromPublished', label: 'GEPA, from the published edit' },
  { id: 'noGepa', label: 'No GEPA, four separate scripts' },
  { id: 'wrapUpTool', label: 'GEPA with the wrap-up tool' },
];

export type Run = {
  group: GroupId;
  seed: number;
  math500: number;
  heldOut: number;
  searchScore: number;
};

// The twelve searches, in the order of site-data.json.
export const RUNS: Run[] = [
  { group: 'gepa', seed: 0, math500: 32.0, heldOut: 16.7, searchScore: 0.190 },
  { group: 'gepa', seed: 1, math500: 60.6, heldOut: 29.2, searchScore: 0.296 },
  { group: 'gepa', seed: 2, math500: 40.6, heldOut: 22.9, searchScore: 0.350 },
  { group: 'gepaFromPublished', seed: 0, math500: 54.3, heldOut: 29.2, searchScore: 0.326 },
  { group: 'gepaFromPublished', seed: 1, math500: 59.9, heldOut: 27.1, searchScore: 0.296 },
  { group: 'gepaFromPublished', seed: 2, math500: 32.5, heldOut: 20.8, searchScore: 0.282 },
  { group: 'noGepa', seed: 0, math500: 59.4, heldOut: 31.2, searchScore: 0.326 },
  { group: 'noGepa', seed: 1, math500: 36.6, heldOut: 16.7, searchScore: 0.316 },
  { group: 'noGepa', seed: 2, math500: 43.3, heldOut: 27.1, searchScore: 0.349 },
  { group: 'wrapUpTool', seed: 0, math500: 43.4, heldOut: 27.1, searchScore: 0.315 },
  { group: 'wrapUpTool', seed: 1, math500: 50.3, heldOut: 37.5, searchScore: 0.450 },
  { group: 'wrapUpTool', seed: 2, math500: 54.1, heldOut: 29.2, searchScore: 0.266 },
];

export const SAMPLE_LINKS = {
  repo: 'https://github.com/Praneeth16/dspy-weightspace',
  sparks: 'https://rikiyat.github.io/blog/weight-space-programming/',
  qwenWsp: 'https://github.com/areu01or00/qwen0.8B-wsp',
  breunig: 'https://pypi.org/project/dspy-wsp/',
  khajavi: 'https://github.com/MatinKhajavi/Weight-Space-Programming',
  nandakishor: 'https://www.kaggle.com/code/nandakishorconvai/engine-transfer',
} as const;
