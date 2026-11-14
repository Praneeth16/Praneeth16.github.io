// Scene 5: three sets of problems, and twelve runs ranked two ways. The left
// column re-sorts from the search's own score to the held-out score; the right
// column is the MATH-500 rank. Ranks come from data.ts.
import { useState } from 'react';
import { SegmentedControl, SegmentedControlItem } from '@ui-sdk/react/segmented-control';
import { Roll } from '../stageshow/kit/motion/Roll';
import type { Act } from '../stageshow/kit/act';
import { SceneFrame } from './SceneFrame';
import { REFERENCES, RUNS, SPLIT } from './data';

type S = { t: number };
type Sort = 'held' | 'search';

const initial: S = { t: 0 };
const poster: Record<Sort, S> = { held: { t: 1 }, search: { t: 0 } };

const ABBR: Record<string, string> = { gepa: 'GEPA', gepaFromPublished: 'GEPA from published', noGepa: 'No GEPA', wrapUpTool: 'Wrap-up tool' };
const LOW = REFERENCES.thinkingOff.math500;
const HIGH = REFERENCES.published.math500;
const toneOf = (v: number) => (v < LOW ? 'low' : v > HIGH ? 'high' : 'mid');

// Slot (0 = top) of each run in an ordering of indices, best first. Ties keep the order of data.ts, so a tie is
// never broken with the MATH-500 score the ranking is being compared with.
const slotsBy = (key: (i: number) => number) => {
  const order = RUNS.map((_, i) => i).sort((a, b) => key(b) - key(a) || a - b);
  const slot = new Array<number>(RUNS.length);
  order.forEach((idx, pos) => { slot[idx] = pos; });
  return slot;
};
const rightSlot = slotsBy((i) => RUNS[i].math500);
const searchSlot = slotsBy((i) => RUNS[i].searchScore);
const heldSlot = slotsBy((i) => RUNS[i].heldOut);

async function script(a: Act<S>) {
  a.mark('search');
  await a.wait(1400);
  a.mark('sort');
  const steps = 90;
  for (let k = 1; k <= steps; k++) {
    const u = k / steps;
    a.put({ t: u * u * (3 - 2 * u) });
    await a.wait(16);
  }
  a.mark('held');
  await a.wait(3800);
}

function Blocks({ compact }: { compact: boolean }) {
  const sets = [
    { n: SPLIT.feedback, role: 'The strong model learns from these' },
    { n: SPLIT.selection, role: 'The search keeps edits by these' },
    { n: SPLIT.heldOut, role: 'You choose between runs with these' },
  ];
  return (
    <>
      {sets.map((set, i) => (
        <div
          key={set.n}
          className="wsp-split-block"
          style={compact ? { left: 0, top: i * 150, width: 358 } : { left: i * 328, top: 0, width: 304 }}
        >
          <p className="wsp-split-label"><span className="wsp-kicker">{set.n} problems</span><span>{set.role}</span></p>
          <div className="wsp-split-grid" aria-hidden="true">
            {Array.from({ length: set.n }, (_, k) => <span key={k} className="wsp-split-cell" />)}
          </div>
        </div>
      ))}
    </>
  );
}

function Chart({ t, compact }: { t: number; compact: boolean }) {
  const L = compact ? 16 : 262;
  const R = compact ? 290 : 700;
  const top = compact ? 496 : 222;
  const row = compact ? 20 : 22;
  const y = (slot: number) => top + slot * row + row / 2;
  const yLeft = (i: number) => y(searchSlot[i] + (heldSlot[i] - searchSlot[i]) * t);
  const yRight = (i: number) => y(rightSlot[i]);
  const headY = compact ? 462 : 188;
  return (
    <>
      <p className="wsp-split-head wsp-split-head-left" style={{ left: compact ? 0 : L, top: headY }}>
        {compact ? (t < 0.5 ? "By the search's own score" : 'By the held-out score') : <Roll>{t < 0.5 ? "Ranked by the search's own score" : 'Ranked by the held-out score'}</Roll>}
      </p>
      <p className="wsp-split-head wsp-split-head-right" style={{ left: compact ? 358 : R, top: headY }}>MATH-500 rank</p>
      <svg className="wsp-split-svg" viewBox={`0 0 ${compact ? 358 : 960} ${compact ? 790 : 536}`} aria-hidden="true">
        {RUNS.map((r, i) => (
          <line key={`l${i}`} x1={L} y1={yLeft(i)} x2={R} y2={yRight(i)} className="wsp-split-line" data-tone={toneOf(r.math500)} />
        ))}
      </svg>
      {RUNS.map((r, i) => (
        <span key={i} className="wsp-split-node" data-tone={toneOf(r.math500)} style={{ left: L, top: yLeft(i) }} />
      ))}
      {RUNS.map((r, i) => (
        <span key={`r${i}`} className="wsp-split-node" data-tone={toneOf(r.math500)} style={{ left: R, top: yRight(i) }} />
      ))}
      {!compact && RUNS.map((r, i) => (
        <span key={`ll${i}`} className="wsp-split-name" style={{ left: L - 14, top: yLeft(i) }}>{ABBR[r.group]} {r.seed}</span>
      ))}
      {RUNS.map((r, i) => (
        <span key={`rl${i}`} className="wsp-split-value" style={{ left: R + 14, top: yRight(i) }}>{r.math500.toFixed(1)}%</span>
      ))}
      <p className="wsp-split-stat" style={{ top: compact ? 750 : 500 }}>
        <Roll>{`Rank correlation with MATH-500: ${(t < 0.5 ? SPLIT.rankCorrelation.searchOwnScore : SPLIT.rankCorrelation.heldOut).toFixed(2)}`}</Roll>
      </p>
    </>
  );
}

function Composition({ s, compact }: { s: S; compact: boolean }) {
  return (
    <div className={`wsp-split${compact ? ' is-compact' : ''}`}>
      <Blocks compact={compact} />
      <Chart t={s.t} compact={compact} />
    </div>
  );
}

export default function SplitScene() {
  const [sort, setSort] = useState<Sort>('held');
  return (
    <SceneFrame<S>
      variant={sort}
      label="Three sets of problems, sized 16, 32 and 48, with the role of each. Twelve searches ranked by the search's own score and by MATH-500. The search's own score ranks them with a rank correlation of 0.11, so the lines cross. The held-out score ranks them with a rank correlation of 0.77, so the lines mostly stay level."
      caption="MATH-500, 500 problems, 2 samples each. Twelve searches, ranked by their scores against MATH-500 rank."
      toolbar={
        <SegmentedControl aria-label="Choose the ranking" value={sort} onValueChange={(v: string | null) => { if (v === 'held' || v === 'search') setSort(v); }}>
          <SegmentedControlItem value="held">Held-out score</SegmentedControlItem>
          <SegmentedControlItem value="search">Search's own score</SegmentedControlItem>
        </SegmentedControl>
      }
      wide={{ width: 960, height: 536 }}
      narrow={{ width: 358, height: 790 }}
      initial={initial}
      poster={poster[sort]}
      script={script}
    >
      {(s, compact) => <Composition s={s} compact={compact} />}
    </SceneFrame>
  );
}
