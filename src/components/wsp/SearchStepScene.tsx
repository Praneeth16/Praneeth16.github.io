// Scene 2: one step of the search, as one product-like window. The script is
// the article's seven lines, shortened for the screen and labelled Simplified.
// The marks are an illustration; only the count of practice problems is real.
import type { ReactNode } from 'react';
import { Window } from '../stageshow/kit/window';
import { Code } from '../stageshow/kit/code';
import { Button } from '../stageshow/kit/controls/Button';
import { Badge } from '../stageshow/kit/controls/Badge';
import { States } from '../stageshow/kit/motion/States';
import type { Act } from '../stageshow/kit/act';
import { Panel, SceneFrame } from './SceneFrame';

const LINES = [
  'for layer in range(10, 23):',
  '    d = load(repetition_dir(layer))',
  '    d = d / d.norm()',
  '    P = I - outer(d, d)',
  '    for part in ["mlp", "attention"]:',
  '        W = load(output_of(layer, part))',
  '        save(output_of(layer, part), P @ W)',
];
// Illustration: which of the 32 practice problems the edited model got right. The count is at the scale of the
// real search scores (about 0.09 with no edit, about 0.30 for the best edits).
const PATTERN = '00100100001001000100101000010010';
const RIGHT = [...PATTERN].filter((c) => c === '1').length;
const BEFORE = 3;

type Phase = 'write' | 'run' | 'kept';
type S = { lines: number; phase: Phase; marks: number };

const start: S = { lines: 0, phase: 'write', marks: 0 };
const poster: S = { lines: LINES.length, phase: 'kept', marks: 32 };

async function script(a: Act<S>) {
  a.mark('type');
  await a.wait(700);
  for (let i = 1; i <= LINES.length; i++) {
    a.put({ lines: i });
    await a.wait(320);
  }
  await a.wait(500);
  a.mark('run');
  a.put({ phase: 'run' });
  for (let i = 1; i <= 32; i++) {
    a.put({ marks: i });
    await a.wait(85);
  }
  a.mark('kept');
  a.put({ phase: 'kept' });
  await a.wait(4000);
}

function GreyWindow(props: { title: string; toolbar?: ReactNode; className?: string; children: ReactNode }) {
  return <Window lights="grey" {...props} />;
}

function Composition({ s, compact }: { s: S; compact: boolean }) {
  const Frame = compact ? Panel : GreyWindow;
  return (
    <div className={`wsp-search${compact ? ' is-compact' : ''}`}>
      <Frame title="patch.py" toolbar={<span className="wsp-tag">Simplified</span>} className="wsp-search-win">
        <div className="wsp-search-body">
          <Code lines={compact ? LINES.map((l) => l.replace(/^ +/, (m) => ' '.repeat(m.length / 2))) : [...LINES]} count={s.lines} numbers={!compact} className="wsp-search-code" />
          <div className="wsp-search-row">
            <Button variant="primary" size="medium">Run in sandbox</Button>
            <span className="wsp-search-status">
              <States value={s.phase} align="start" states={{
                write: <span>{compact ? 'Waiting' : 'Waiting for the script'}</span>,
                run: <span>{compact ? 'Scoring' : 'Scoring 32 practice problems'}</span>,
                kept: <span>{RIGHT} of 32 right</span>,
              }} />
            </span>
          </div>
          <div className="wsp-marks" aria-hidden="true">
            {Array.from({ length: 32 }, (_, i) => (
              <span key={i} className="wsp-mark" data-on={i < s.marks || undefined} data-ok={PATTERN[i] === '1' ? 'yes' : 'no'} />
            ))}
          </div>
          <div className="wsp-search-kept wsp-fade" data-on={s.phase === 'kept' || undefined}>
            <Badge tone="success">Kept</Badge>
            <span>{`The last step had ${BEFORE} right, so the next step starts from this patch.`}</span>
          </div>
        </div>
      </Frame>
    </div>
  );
}

export default function SearchStepScene() {
  return (
    <SceneFrame<S>
      label="One search step. A script named patch.py is typed in and run in a sandbox against 32 practice problems. In this illustration 9 of 32 are right, up from 3 in the step before, so the patch is kept."
      caption="Illustration. The 32 marks are made up, at the scale of the real scores. The script is simplified."
      wide={{ width: 960, height: 372 }}
      narrow={{ width: 358, height: 424 }}
      initial={start}
      poster={poster}
      script={script}
    >
      {(s, compact) => <Composition s={s} compact={compact} />}
    </SceneFrame>
  );
}
