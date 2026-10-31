// Authored simulations and accounting only. No inference calls or visitor telemetry.
const byId = (id) => document.getElementById(id);
const put = (id, text) => { const node = byId(id); if (node) node.textContent = text; };
const setSelected = (selector, button) => document.querySelectorAll(selector).forEach((b) => b.setAttribute('aria-pressed', String(b === button)));

export function policyDecision(age, actualWindow, contextWindow, guard) {
  const proposed = age <= contextWindow;
  const eligible = age <= actualWindow;
  const committed = proposed && (!guard || eligible);
  return { proposed, eligible, committed, blocked: proposed && guard && !eligible };
}
function renderPolicy() {
  const age = Number(byId('order-age').value);
  const actual = Number(byId('policy-window').value);
  const live = byId('context-mode').value === 'live';
  const context = live ? actual : 30;
  const guard = byId('policy-guard').checked;
  const result = policyDecision(age, actual, context, guard);
  put('age-out', `${age} ${age === 1 ? 'day' : 'days'}`);
  put('request-age', age);
  put('agent-proposal', result.proposed ? 'Create return' : 'Decline return');
  put('proposal-detail', `It sees a ${context}-day window${live ? ' from current policy' : ' from stale context'}.`);
  put('business-outcome', result.blocked ? 'Blocked' : result.committed ? (result.eligible ? 'Valid return' : 'Invalid return') : 'No write');
  put('outcome-detail', result.blocked ? `The tool enforces the ${actual}-day rule.` : result.committed ? (result.eligible ? 'The requested change is permitted.' : `The write violates the ${actual}-day rule.`) : 'The order remains unchanged.');
  let insight;
  if (result.blocked) insight = 'The guard prevents the write. The agent still made a bad proposal: containment is not the same as correct reasoning.';
  else if (result.committed && !result.eligible) insight = 'A stale rule became an invalid transaction. Better wording cannot repair a missing policy check at the write boundary.';
  else if (live) insight = 'Current context produces the correct rule-based decision here. Real model compliance still needs evaluation; the simulator follows its input exactly.';
  else insight = 'The old and current rules happen to agree for this request. An easy example can hide stale context. Try day 21 under the 14-day rule.';
  put('policy-insight', insight);
  byId('ruler-zone').style.width = `${actual / 40 * 100}%`;
  byId('ruler-marker').style.left = `${age / 40 * 100}%`;
  document.querySelector('.policy-stage').dataset.state = result.committed && !result.eligible ? 'bad' : 'good';
}
['order-age','policy-window','context-mode','policy-guard'].forEach(id => byId(id)?.addEventListener('input', renderPolicy));
byId('policy-reset')?.addEventListener('click', () => { byId('order-age').value='21';byId('policy-window').value='14';byId('context-mode').value='stale';byId('policy-guard').checked=true;renderPolicy(); });

const traces = [
  ['SPAN 01 / ORDER TOOL','The order is correct.','order_id: 1042\nitem: headphones\ndays_since_delivery: 21\ncustomer_scope: authorized','The lookup has the right order and item. This is not an entity-resolution failure.','Which policy version entered the model context?'],
  ['SPAN 02 / CONTEXT','The policy is out of date.','retrieved_policy: retail-v1\nreturn_window_days: 30\napplicable_policy: retail-v2\napplicable_window_days: 14','The context loader supplies the obsolete rule. A successful retrieval call is not proof that it retrieved the right version.','Repair policy applicability and freshness before adding training.'],
  ['SPAN 03 / MODEL PROPOSAL','The action follows the wrong rule.','proposed_tool: create_return\norder_id: 1042\nitem: headphones\npolicy_in_context: retail-v1','The proposed write is consistent with the stale context. This example cannot establish a reasoning failure or show that a larger model would know the missing rule.','Separate information availability from model compliance.'],
  ['SPAN 04 / GUARDED WRITE','The tool prevents a bad transaction.','create_return: rejected\nreason: outside_applicable_window\npolicy_checked: retail-v2\ncommitted_mutations: 0','The write guard rechecks the authoritative policy. No return is created. That containment should be credited separately from the agent’s task resolution.','Record the attempted violation even though the write was blocked.'],
  ['SPAN 05 / OUTCOME REVIEW','Safe state. Unresolved request.','unauthorized_attempts: 1\nunauthorized_commits: 0\nrequested_return_created: false\ncustomer_resolution: incomplete','In this authored trace, the agent has not yet explained the rejection or completed an allowed exception workflow. An unchanged database alone does not make the interaction a success.','Add a recovery step, then test the complete task again.']
];
document.querySelectorAll('[data-trace]').forEach(button => button.addEventListener('click', () => {setSelected('[data-trace]',button);const data=traces[Number(button.dataset.trace)];['trace-label','trace-title','trace-json','trace-explanation','trace-action'].forEach((id,i)=>put(id,data[i]));}));
const layers = {
  context:['CURRENT BUSINESS CONTEXT','Governed business data','The application resolves the applicable policy and reads only the customer and order state it is permitted to access. Analytical artifacts live in governed tables; operational writes need transaction checks and a durable ledger.','Policy versions, data permissions, authoritative state, artifact lineage.','That a model obeys retrieved policy. The write tool must enforce its own contract.','https://docs.databricks.com/aws/en/agents'],
  agent:['APPLICATION EXECUTION','Agent Runtime','Hosts the agent application and its orchestration. The application chooses tools, calls a model endpoint, handles interruptions, and records the task. It is distinct from the GPU process generating tokens.','Application state, tool orchestration, request lifecycle.','That a tool is authorized or that the completed task is correct.','https://docs.databricks.com/aws/en/agents'],
  serving:['ONLINE INFERENCE','Model Serving + vLLM','Serves the selected open-weight checkpoint with its inference environment. Validate the parser, chat template, context limits, and concurrency against the actual workload. This custom route is Public Preview at publication.','Loaded weights, inference configuration, endpoint latency and capacity.','Business correctness, free idle capacity, or unlimited throughput.','https://docs.databricks.com/aws/en/machine-learning/model-serving/serve-custom-llms'],
  observe:['MEASUREMENT & DIAGNOSIS','MLflow + outcome tables','Connect traces, assessments, evaluation datasets, and experiment comparisons. Join task and action identifiers to business outcomes. Review failures before deciding whether the intervention belongs in context, tools, or weights.','Evidence, reproducibility, evaluations, and observed regressions.','An automatically correct reward or an automatically connected training loop.','https://docs.databricks.com/aws/en/mlflow3/genai/agent-observability-and-quality'],
  train:['GPU ADAPTATION','AI Runtime','Runs the bounded training experiment on curated data. Save the dataset revision, base checkpoint, recipe, environment, and resulting adapter. A validated artifact can then move into a separate serving deployment.','Training compute, experiment environment, model artifacts.','Generalization, serving economics, or correctness under tomorrow’s policy.','https://docs.databricks.com/aws/en/machine-learning/ai-runtime/overview']
};
document.querySelectorAll('[data-layer]').forEach(button => button.addEventListener('click', () => {setSelected('[data-layer]',button);const data=layers[button.dataset.layer];['layer-kicker','layer-title','layer-body','layer-owns','layer-limit'].forEach((id,i)=>put(id,data[i]));byId('layer-source').href=data[5];}));
const audits = [
 ['Freeze the source, not just the filename.','Record the dataset revision and content hashes, the simulator commit, schemas, licenses, and policy version. A moving repository branch cannot identify the experiment we ran.','Output: immutable source manifest'],
 ['Keep related turns on the same side.','Reassemble source dialogues and related scenario families before splitting. A single conversation can generate several SFT records. Missing lineage means quarantine, not a random split that looks clean.','Output: grouped train / validation / held-out manifest'],
 ['Look for shared tasks, not just duplicate text.','Check source IDs, dialogue prefixes, entities, and near-duplicate action patterns against evaluation tasks. Record excluded families. Our filtering cannot reveal everything in an unknown base-model pretraining corpus.','Output: overlap report + exclusion manifest'],
 ['Replay what can actually be verified.','Where the release provides compatible environment state, replay the proposed tools and inspect the resulting mutations. Review correctness flags rather than accepting them as ground truth. Incompatible snapshots need repair or exclusion.','Output: replay pass / fail / unverified counts'],
 ['Make the learning objective explicit.','Normalize messages and tool calls for the chosen model’s chat template. Review loss masks, truncation, and tool serialization. Supervise the visible behavior; do not assume the separate reasoning field must be copied.','Output: versioned training records + rejected counts']
];
document.querySelectorAll('[data-audit]').forEach(button=>button.addEventListener('click',()=>{setSelected('[data-audit]',button);const data=audits[Number(button.dataset.audit)];['audit-title','audit-body','audit-artifact'].forEach((id,i)=>put(id,data[i]));}));
const experiments = {
 os:['What happens without current context?','The original open model receives the obsolete rule. This is a controlled information failure. Compare it with O / live to estimate the effect of supplying current policy.'],
 ol:['How far does current context take us?','The original open model receives the applicable policy. Compare against O / stale for the context effect, and against S / live for the added contribution of specialization.'],
 ss:['Does specialization amplify an obsolete rule?','The adapted model receives stale context. Compare against O / stale, then inspect whether its training creates an additional preference for old behavior. This is a diagnostic condition, not a deployment plan.'],
 sl:['Does the learned skill survive a business change?','The adapted model receives current policy. Compare against O / live while holding tools and budgets fixed. Test correct actions, violations, consistency, and cost; do not look only at aggregate success.'],
 fl:['Is specialization worth operating?','A frontier reference gets the same current information and comparable task budgets. Compare quality, latency, and complete cost. The practical answer may be to use this reference instead of hosting the specialist.']
};
document.querySelectorAll('[data-cell]').forEach(button=>button.addEventListener('click',()=>{setSelected('[data-cell]',button);const data=experiments[button.dataset.cell];put('cell-title',data[0]);put('cell-body',data[1]);}));

export function calculateCosts({volume,gpu,hours,training,other,success,reference,refsuccess}) {
 const fixed=gpu*hours+training;
 const specialist=(fixed+volume*other)/(volume*success);
 const ref=reference/refsuccess;
 const contribution=success*ref-other;
 const threshold=contribution>0?fixed/contribution:null;
 return {fixed,specialist,reference:ref,threshold};
}
const costDefaults={volume:10000,gpu:2,hours:730,training:100,other:0.03,success:85,reference:0.15,refsuccess:90};
function costInputs(){const result={};Object.keys(costDefaults).forEach(key=>{const input=byId(`cost-${key}`);const val=Number(input.value);result[key]=Math.min(Number(input.max),Math.max(Number(input.min),Number.isFinite(val)?val:costDefaults[key]));});result.success/=100;result.refsuccess/=100;return result;}
function renderCost(){
 const inputs=costInputs();const result=calculateCosts(inputs);const money=n=>`$${n.toFixed(3)}`;
 put('volume-out',inputs.volume.toLocaleString('en-US'));put('specialist-cost',money(result.specialist));put('reference-cost',money(result.reference));
 const difference=result.specialist-result.reference;
 put('cost-verdict',Math.abs(difference)<0.0000001?'The two options have equal cost per verified success under these assumptions.':difference>0?'At these assumptions, the specialist costs more per verified success. Lower inference cost alone would not justify it.':'At these assumptions, the specialist costs less per verified success. This is an accounting result, not evidence that the modeled traffic or success rate is achievable.');
 put('cost-break-even',result.threshold===null?'There is no finite traffic break-even: the specialist’s variable cost per success is at least the reference cost.':`Algebraic break-even: ${Math.max(0,Math.ceil(result.threshold)).toLocaleString('en-US')} tasks/month. Confirm capacity and latency before using this threshold.`);
 const maxCost=Math.max(calculateCosts({...inputs,volume:1000}).specialist,result.reference,0.01)*1.08;
 const x=v=>50+(v-1000)/99000*410;const y=c=>190-c/maxCost*160;
 const points=Array.from({length:100},(_,i)=>{const v=1000+i*1000;return `${i?'L':'M'}${x(v).toFixed(2)} ${y(calculateCosts({...inputs,volume:v}).specialist).toFixed(2)}`;}).join(' ');
 byId('specialist-line').setAttribute('d',points);byId('reference-line').setAttribute('d',`M50 ${y(result.reference)}H460`);byId('cost-point').setAttribute('cx',String(x(inputs.volume)));byId('cost-point').setAttribute('cy',String(y(result.specialist)));put('cost-axis-top',`$${maxCost<1?maxCost.toFixed(2):maxCost.toFixed(0)}`);
 put('cost-chart-description',`Hypothetical cost per verified success. At ${inputs.volume.toLocaleString('en-US')} tasks per month: specialist ${money(result.specialist)}, reference ${money(result.reference)}. Fixed capacity cost makes specialist cost fall as volume rises. Capacity is not modeled.`);
}
Object.keys(costDefaults).forEach(key=>{
 const input=byId(`cost-${key}`);if(!input)return;
 input.addEventListener('input',renderCost);
 input.addEventListener('change',()=>{const value=Number(input.value);input.value=String(Math.min(Number(input.max),Math.max(Number(input.min),Number.isFinite(value)?value:costDefaults[key])));renderCost();});
});
byId('cost-reset')?.addEventListener('click',()=>{Object.entries(costDefaults).forEach(([key,value])=>byId(`cost-${key}`).value=String(value));renderCost();});
if(byId('policy-lab'))renderPolicy();if(byId('cost-lab'))renderCost();
const progress=byId('reading-progress');
function readingProgress(){const article=byId('agent-article');if(!article||!progress)return;const start=article.offsetTop;const range=article.offsetHeight-window.innerHeight;const percent=Math.max(0,Math.min(100,(window.scrollY-start)/Math.max(1,range)*100));progress.style.width=`${percent}%`;}
window.addEventListener('scroll',readingProgress,{passive:true});window.addEventListener('resize',readingProgress);readingProgress();
