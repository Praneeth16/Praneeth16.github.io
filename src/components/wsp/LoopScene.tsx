// Scene 1: the same problem, two outputs, in one window with two panes. Real
// loop line and closing line; the work in between is placeholder bars, not
// invented text.
import type { ReactNode } from 'react';
import { Window } from '../stageshow/kit/window';
import { Meter } from '../stageshow/kit/parts/Meter';
import { Badge } from '../stageshow/kit/controls/Badge';
import type { Act } from '../stageshow/kit/act';
import { Panel, SceneFrame } from './SceneFrame';
import { EXAMPLE, MODEL } from './data';

type S = {
  leftLines: number;
  leftRepeats: number;
  leftTokens: number;
  leftDone: boolean;
  rightStep: number;
  rightTokens: number;
  rightDone: boolean;
};

const start: S = { leftLines: 0, leftRepeats: 0, leftTokens: 0, leftDone: false, rightStep: 0, rightTokens: 0, rightDone: false };
const poster: S = { leftLines: 6, leftRepeats: EXAMPLE.loopRepeats, leftTokens: EXAMPLE.baseTokens, leftDone: true, rightStep: 4, rightTokens: EXAMPLE.editedTokens, rightDone: true };

const LEFT_MS = 4200;
const RIGHT_MS = 2000;
const FRAME_MS = 16;
const number = (n: number) => Math.round(n).toLocaleString('en-US');

function GreyWindow(props: { title: string; toolbar?: ReactNode; className?: string; children: ReactNode }) {
  return <Window lights="grey" {...props} />;
}

async function script(a: Act<S>) {
  a.mark('start');
  await a.wait(900);
  await Promise.all([
    // The counters run in the state, one value per frame, so each number keeps its box.
    (async () => {
      const frames = Math.round(LEFT_MS / FRAME_MS);
      for (let k = 1; k <= frames; k++) {
        const u = k / frames;
        a.put({
          leftRepeats: EXAMPLE.loopRepeats * u,
          leftTokens: EXAMPLE.baseTokens * u,
          rightTokens: EXAMPLE.editedTokens * Math.min(1, (k * FRAME_MS) / RIGHT_MS),
        });
        await a.wait(FRAME_MS);
      }
      a.mark('cut');
      a.put({ leftDone: true });
    })(),
    (async () => {
      for (let i = 1; i <= 6; i++) {
        a.put({ leftLines: i });
        await a.wait(480);
      }
    })(),
    (async () => {
      for (let i = 1; i <= 3; i++) {
        a.put({ rightStep: i });
        await a.wait(420);
      }
      a.put({ rightStep: 4 });
      await a.wait(RIGHT_MS - 3 * 420);
      a.mark('answered');
      a.put({ rightDone: true });
    })(),
  ]);
  a.mark('hold');
  await a.wait(3800);
}

function Composition({ s, compact }: { s: S; compact: boolean }) {
  const loopRows = Array.from({ length: 6 }, (_, i) => i);
  const limit = number(EXAMPLE.baseTokens);
  const Frame = compact ? Panel : GreyWindow;
  return (
    <div className={`wsp-loop${compact ? ' is-compact' : ''}`}>
      <Frame title="Model output" toolbar={<span className="wsp-tag">{MODEL.name}</span>} className="wsp-loop-win">
        <p className="wsp-loop-problem"><span className="wsp-kicker">Problem</span>{EXAMPLE.problem}</p>
        <div className="wsp-loop-panes">
          <section className="wsp-loop-pane">
            <h4 className="wsp-loop-head">No edit</h4>
            <div className="wsp-loop-lines">
              {loopRows.map((i) => (
                <div key={i} className="wsp-loop-line" data-on={i < s.leftLines || undefined}>{EXAMPLE.loopLine}</div>
              ))}
            </div>
            <div className="wsp-loop-meta">
              <div className="wsp-stat"><span className="wsp-kicker">Repeats</span><span className="wsp-num">{number(s.leftRepeats)}</span></div>
              <div className="wsp-stat"><span className="wsp-kicker">Tokens</span><span className="wsp-num">{number(s.leftTokens)}</span><span className="wsp-of">of {limit}</span></div>
              <Meter value={s.leftTokens / EXAMPLE.baseTokens} tone="danger" className="wsp-meter" />
            </div>
            <div className="wsp-loop-status wsp-fade" data-on={s.leftDone || undefined}><Badge tone="danger">Cut off, no answer</Badge></div>
          </section>
          <section className="wsp-loop-pane">
            <h4 className="wsp-loop-head">Edited</h4>
            <div className="wsp-loop-lines">
              {[0, 1, 2].map((i) => (
                <div key={i} className="wsp-loop-work" data-on={i < s.rightStep || undefined}><span className="wsp-bar" style={{ width: `${[78, 62, 70][i]}%` }} /></div>
              ))}
              <div className="wsp-loop-line wsp-loop-final" data-on={s.rightStep >= 4 || undefined}>{EXAMPLE.editedLastLine}</div>
            </div>
            <div className="wsp-loop-meta">
              <div className="wsp-stat"><span className="wsp-kicker">Tokens</span><span className="wsp-num">{number(s.rightTokens)}</span><span className="wsp-of">of {limit}</span></div>
              <Meter value={s.rightTokens / EXAMPLE.baseTokens} tone="success" className="wsp-meter" />
            </div>
            <div className="wsp-loop-status wsp-fade" data-on={s.rightDone || undefined}><Badge tone="success">Answered</Badge></div>
          </section>
        </div>
      </Frame>
    </div>
  );
}

export default function LoopScene() {
  return (
    <SceneFrame<S>
      label="Two outputs for one problem. Without an edit, the model writes 'Wait, r_new = 2 r_old.' 691 times, is cut off at 16,384 tokens and gives no answer. With the edit, it writes 'Therefore, the ratio of the original area to the enlarged area is 1/4.' and stops after 4,636 tokens."
      caption="Real output from one MATH training problem, with a 16,384-token limit."
      wide={{ width: 960, height: 470 }}
      narrow={{ width: 358, height: 716 }}
      initial={start}
      poster={poster}
      script={script}
    >
      {(s, compact) => <Composition s={s} compact={compact} />}
    </SceneFrame>
  );
}
