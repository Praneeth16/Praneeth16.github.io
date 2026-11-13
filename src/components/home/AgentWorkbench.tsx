// Adapted from StageShow's form-error gold (MIT): fixed validation lane,
// correction in place, button payoff. See ../stageshow/LICENSE.
import { Button as ActionButton } from '@ui-sdk/react/button';
import { CornerDownRight } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Stage } from '../stageshow/kit/stage';
import { Window, Text } from '../stageshow/kit/window';
import { Field } from '../stageshow/kit/controls/Field';
import { Button } from '../stageshow/kit/controls/Button';
import { Badge } from '../stageshow/kit/controls/Badge';
import { States } from '../stageshow/kit/motion/States';
import { Check } from '../stageshow/kit/parts/Check';
import type { Act } from '../stageshow/kit/act';
import './workbench.css';

type S = { rule: string; phase: 'inspect'|'edit'|'run'|'done' };
const initial: S = { rule: '', phase: 'inspect' };
const poster: S = { rule: 'Require a source for every claim', phase: 'done' };
async function script(a: Act<S>) {
  a.mark('inspect'); await a.wait(1800);
  await a.click({at:'rule', x:.4, y:.5});
  a.put({phase:'edit'}); a.mark('edit');
  await a.type('rule', poster.rule, {interval:55});
  await a.wait(850);
  await a.click({at:'run', x:.5, y:.5});
  a.put({phase:'run'}); a.mark('run');
  await a.move({at:'run', x:1.3,y:1.7}); await a.wait(1600);
  a.put({phase:'done'}); a.mark('done'); await a.wait(2500);
}
export default function AgentWorkbench() {
  const [ready,setReady]=useState(false);
  useEffect(()=>setReady(true),[]);
  const [playing,setPlaying]=useState(false);
  const [run,setRun]=useState(0);
  return <div className="workbench-wrap" data-ready={ready||undefined}>
    <div className="workbench-caption"><span><i /> A small experiment</span><span>01 / Evidence</span></div>
    <div role="img" aria-label="Illustrated agent evaluation: an answer without evidence fails. Add a rule requiring a source for every claim, rerun, and the answer includes a source." className="workbench-picture">
      <Stage key={`${run}-${playing}`} width={680} height={390} compact={{below:560,width:358,height:400}} initial={playing?initial:poster} poster={poster} script={playing?script:undefined} play="once" cursor={playing?{at:{wide:{x:620,y:350},compact:{x:330,y:350}},style:'arrow'}:undefined} className="agent-demo" tokens={{'--ss-font':"'Inclusive Sans', sans-serif",'--ss-accent':'#315c43','--ss-accent-text':'#315c43','--ss-canvas':'#faf9f6'}}>
        {(s,_rect,layout)=><Window title="Agent workbench" className="aw-window">
          <div className="aw-body">
            {layout==='wide' && <aside className="aw-sidebar"><span className="aw-sidebar-title">EXPERIMENT 01</span><div className="aw-selected">Answer quality</div><div>Tool use</div><div>Memory</div><div className="aw-sidebar-note">Inspect.<br/>Change one thing.<br/>Measure again.</div></aside>}
            <div className="aw-content">
              <div className="aw-heading"><Text className="aw-title">Is the answer grounded?</Text><Badge tone={s.phase==='done'?'success':'danger'}>{s.phase==='done'?'Pass':'Fail'}</Badge></div>
              <div className="aw-answer"><span className="aw-label">AGENT RESPONSE</span><Text wrap>The trial reduced response time.</Text><div className="aw-evidence"><States value={s.phase==='done'?'yes':'no'} align="start" states={{yes:<span className="aw-good"><CornerDownRight size={11} aria-hidden /> Source attached · trial report, p. 4</span>,no:<span className="aw-bad">No evidence attached</span>}}/></div></div>
              <Field label="Evaluation rule" value={s.rule} placeholder="What should a good answer include?" focused={s.phase==='edit'} status={s.phase==='done'?'valid':undefined} box={{'data-target':'rule'}}/>
              <div className="aw-feedback"><States value={s.phase} align="start" states={{inspect:'A plausible answer is only the beginning.',edit:'Turn the failure into a check.',run:'Checking the answer and its source…',done:'A claim. A source. Something you can verify.'}}/></div>
              <Button variant="primary" size="large" data-target="run" icon={<Check on={s.phase==='done'} pending={s.phase==='run'} size={14}/>}>{s.phase==='done'?'Check passed':s.phase==='run'?'Evaluating…':'Run evaluation'}</Button>
            </div>
          </div>
        </Window>}
      </Stage>
    </div>
    <div className="workbench-controls"><span>Illustrated workflow · sample data</span><div>{playing&&<ActionButton onClick={()=>setPlaying(false)}>Show result</ActionButton>}<ActionButton onClick={()=>{setRun(n=>n+1);setPlaying(true)}}>{playing?'↻ Replay':'▷ Play the experiment'}</ActionButton></div></div>
  </div>
}
