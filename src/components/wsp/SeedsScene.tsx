// Scene 4: the three runs of one group, dropped onto a MATH-500 axis. Plain DOM
// for the axis; the Stage keeps the clock, the poster and the controls.
import { useState } from 'react';
import { SegmentedControl, SegmentedControlItem } from '@ui-sdk/react/segmented-control';
import type { Act } from '../stageshow/kit/act';
import { SceneFrame } from './SceneFrame';
import { GROUPS, REFERENCES, RUNS, type GroupId } from './data';

const AXIS_MAX = 70;
const LOW = REFERENCES.thinkingOff.math500;
const HIGH = REFERENCES.published.math500;
const SHORT: Record<GroupId, string> = {
  gepa: 'GEPA',
  gepaFromPublished: 'From the published edit',
  noGepa: 'No GEPA',
  wrapUpTool: 'With the wrap-up tool',
};

type S = { shown: number };
const initial: S = { shown: 0 };
const poster: S = { shown: 3 };

function scriptFor(group: GroupId) {
  const count = RUNS.filter((r) => r.group === group).length;
  return async function script(a: Act<S>) {
    a.mark('drop');
    await a.wait(600);
    for (let i = 1; i <= count; i++) {
      a.put({ shown: i });
      await a.wait(850);
    }
    a.mark('done');
    await a.wait(3800);
  };
}
const scripts = Object.fromEntries(GROUPS.map((g) => [g.id, scriptFor(g.id)])) as Record<GroupId, (a: Act<S>) => Promise<void>>;

const toneOf = (v: number) => (v < LOW ? 'low' : v > HIGH ? 'high' : 'mid');

function Composition({ group, s, compact }: { group: GroupId; s: S; compact: boolean }) {
  const runs = RUNS.filter((r) => r.group === group);
  const width = compact ? 358 : 912;
  const x = (v: number) => (v / AXIS_MAX) * width;
  const ticks = Array.from({ length: AXIS_MAX / 10 + 1 }, (_, i) => i * 10);
  const axisY = compact ? 176 : 186;
  // Value labels that would touch are stacked on higher rows, lowest free row first.
  const gap = compact ? 54 : 66;
  const lastX: number[] = [];
  const rowOf = new Map<number, number>();
  for (const r of [...runs].sort((p, q) => p.math500 - q.math500)) {
    let row = 0;
    while (lastX[row] !== undefined && x(r.math500) - lastX[row] < gap) row++;
    lastX[row] = x(r.math500);
    rowOf.set(r.seed, row);
  }
  return (
    <div className={`wsp-seeds${compact ? ' is-compact' : ''}`} style={{ ['--axis-w' as string]: `${width}px`, ['--axis-y' as string]: `${axisY}px` }}>
      <div className="wsp-seeds-axis">
        <div className="wsp-seeds-line" />
        {ticks.map((t) => (
          <span key={t} className="wsp-seeds-tick" data-edge={t === 0 ? 'start' : t === AXIS_MAX ? 'end' : undefined} style={{ left: x(t) }}><i />{t}%</span>
        ))}
        <span className="wsp-ref wsp-ref-low" style={{ left: x(LOW) }}>
          <b>{compact ? 'Thinking off' : 'Thinking off, no edit'}</b><b>{LOW}%</b>
        </span>
        <span className="wsp-ref-rule wsp-ref-rule-low" style={{ left: x(LOW) }} />
        <span className="wsp-ref wsp-ref-high" style={{ left: x(HIGH) }}>
          <b>Published edit</b><b>{HIGH}%</b>
        </span>
        <span className="wsp-ref-rule wsp-ref-rule-high" style={{ left: x(HIGH) }} />
        <span className="wsp-base" style={{ left: x(REFERENCES.base.math500) }}>
          <i />Base model, thinking on: {REFERENCES.base.math500}%
        </span>
        {runs.map((r, i) => (
          <span
            key={r.seed}
            className="wsp-run"
            data-on={i < s.shown || undefined}
            data-tone={toneOf(r.math500)}
            data-row={rowOf.get(r.seed)}
            style={{ left: x(r.math500) }}
          >
            <span className="wsp-run-value">{r.math500.toFixed(1)}%</span>
            <span className="wsp-run-dot" />
          </span>
        ))}
      </div>
    </div>
  );
}

export default function SeedsScene() {
  const [group, setGroup] = useState<GroupId>('gepa');
  const runs = RUNS.filter((r) => r.group === group);
  const values = runs.map((r) => `${r.math500.toFixed(1)}%`).join(', ');
  return (
    <SceneFrame<S>
      variant={group}
      label={`MATH-500 scores of three searches in the group ${SHORT[group]}, on an axis from 0% to 70%. Reference lines mark 45.6% with thinking off and no edit, and 53.3% for the published edit. The base model scores 7.1%. The three runs score ${values}.`}
      caption="MATH-500, 500 problems, 2 samples each. Each dot is one search. The last two groups are explained in the next section."
      toolbar={
        <SegmentedControl aria-label="Choose a group of runs" value={group} onValueChange={(v: string | null) => { if (v) setGroup(v as GroupId); }}>
          {GROUPS.map((g) => (
            <SegmentedControlItem key={g.id} value={g.id}>{SHORT[g.id]}</SegmentedControlItem>
          ))}
        </SegmentedControl>
      }
      wide={{ width: 960, height: 278 }}
      narrow={{ width: 358, height: 268 }}
      initial={initial}
      poster={poster}
      script={scripts[group]}
    >
      {(s, compact) => <Composition group={group} s={s} compact={compact} />}
    </SceneFrame>
  );
}
