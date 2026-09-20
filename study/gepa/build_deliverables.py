"""Build the report and executed analysis notebook from the completed pilot."""
from pathlib import Path
import json,base64,io,contextlib,hashlib,re,shutil,zipfile,importlib.metadata
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import numpy as np
import markdown
from experiment import ROOT,seed_candidate

run=ROOT/'run'
a=json.loads((run/'analysis.json').read_text())
g=json.loads((run/'gepa_result.json').read_text())
frozen=json.loads((run/'frozen_candidate.json').read_text())
base,opt=a['original'],a['gepa']
figures=ROOT/'figures';figures.mkdir(exist_ok=True)
plt.rcParams.update({'font.family':'DejaVu Sans','font.size':11,'axes.spines.top':False,'axes.spines.right':False,'figure.facecolor':'white','axes.facecolor':'white','svg.fonttype':'none'})
teal='#168274';purple='#7861AA';red='#B66958'
fig,ax=plt.subplots(1,2,figsize=(12.5,4.8),gridspec_kw={'width_ratios':[1,1.5]})
scores=[1-v for v in g['val_aggregate_scores']]
ax[0].plot(range(len(scores)),scores,'o-',color=teal,lw=2,ms=8)
ax[0].set(xlabel='Accepted candidate index',ylabel='Validation Brier score',title='Validation score by candidate')
ax[0].set_xticks(range(len(scores)));ax[0].grid(axis='y',alpha=.15)
for i,v in enumerate(scores):ax[0].annotate(f'{v:.3f}',(i,v),xytext=(8 if i==0 else 0,10),textcoords='offset points',ha='left' if i==0 else 'center',fontsize=10)
best_index=frozen['best_index']
ax[0].annotate('Selected',(best_index,scores[best_index]),xytext=(best_index,scores[best_index]-.009),ha='center',fontsize=10,color=red,arrowprops={'arrowstyle':'->','color':red})
ax[0].margins(y=.35)
x=np.arange(3);width=.34
for delta,name,m,c in [(-width/2,'Original Jev',base,purple),(width/2,'GEPA-selected Jev',opt,teal)]:
 values=[100*m[k] for k in ['precision','recall','f1']]
 bars=ax[1].bar(x+delta,values,width,label=name,color=c)
 ax[1].bar_label(bars,fmt='%.1f',padding=3,fontsize=10)
ax[1].set(xticks=x,xticklabels=['Precision','Recall','F1'],ylim=(0,110),ylabel='Percent',title='Fresh test set · threshold 0.5')
ax[1].set_yticks([0,25,50,75,100]);ax[1].legend(loc='lower center',bbox_to_anchor=(.5,-.3),ncol=2,frameon=False,fontsize=10)
fig.suptitle('Can prompt optimization improve Jev?',fontfamily='DejaVu Serif',fontsize=20,x=.05,ha='left')
fig.subplots_adjust(left=.07,right=.98,top=.8,bottom=.24,wspace=.32)
fig.savefig(figures/'01-gepa-results.png',dpi=180);fig.savefig(figures/'01-gepa-results.svg');plt.close(fig)
fig,axes=plt.subplots(1,2,figsize=(10,4.5))
for axis,name,m in zip(axes,['Original Jev','GEPA-selected Jev'],[base,opt]):
 cm=np.array(m['confusion_matrix']);axis.imshow(cm,cmap='BuGn',vmin=0,vmax=239)
 for (i,j),v in np.ndenumerate(cm):axis.text(j,i,str(v),ha='center',va='center',fontsize=25,color='white' if v>130 else '#26373B')
 axis.set(xticks=[0,1],yticks=[0,1],xticklabels=['Not related','ADE-related'],yticklabels=['Not related','ADE-related'],xlabel='Prediction',ylabel='Corpus label',title=name)
 for spine in axis.spines.values():spine.set_visible(False)
fig.suptitle('Which mistakes changed?',fontfamily='DejaVu Serif',fontsize=20,x=.05,ha='left')
fig.tight_layout(rect=[0,0,1,.91]);fig.savefig(figures/'02-errors.png',dpi=180);fig.savefig(figures/'02-errors.svg');plt.close(fig)

delta=a['delta_optimized_minus_original'];cost=a['calls']
def pc(v):return f'{v*100:.1f}%'
def interval(xs,scale=1):
 digits=4 if scale==1 else 2
 return f'[{xs[0]*scale:.{digits}f}, {xs[1]*scale:.{digits}f}]'
table='\n'.join(f'| {label} | {fmt(base[key])} | {fmt(opt[key])} |' for label,key,fmt in [
 ('Brier score, lower is better','brier',lambda x:f'{x:.4f}'),('Precision','precision',pc),('Recall','recall',pc),('ADE F1','f1',pc),('Accuracy','accuracy',pc),('Log loss','log_loss',lambda x:f'{x:.3f}'),('10-bin ECE','ece_10',lambda x:f'{x:.3f}')])
routes='\n'.join(f"| {label} | {a['routing'][name]['test']['cutoff']:.3f} | {a['routing'][name]['test']['review_n']} | {a['routing'][name]['test']['deferred_n']} | {a['routing'][name]['test']['deferred_positive_n']} |" for name,label in [('original','Original Jev'),('gepa','GEPA-selected Jev')])
change=a['paired_changes']
verdict=('GEPA reduced Brier error on the fresh test set.' if delta['brier']<0 else 'GEPA did not reduce Brier error on the fresh test set.')
uncertainty=('The paired bootstrap interval for Brier change stays below zero.' if delta['brier_bootstrap_95'][1]<0 else 'The paired bootstrap interval for Brier change includes zero or favors the original prompt; this run does not establish a reliable Brier improvement.')
report=f'''# Jev + GEPA: a measured prompt-optimization pilot

Praneeth Paikray · September 19, 2026

{verdict} The original prompt scored {base['brier']:.4f}; the selected prompt scored {opt['brier']:.4f}. ADE F1 changed from {pc(base['f1'])} to {pc(opt['f1'])}, while recall changed from {pc(base['recall'])} to {pc(opt['recall'])}. These results come from 300 fresh sentences, not the test set used in the first article.

## What we combined

Jev performs the sentence classification. GEPA revises the question instructions and the two class definitions, tests candidate revisions, and selects a candidate using validation scores. Jev's model weights and the two output labels stay fixed. This is prompt optimization, not model fine-tuning.

The integration uses the actual `gepa` Python package, version 0.1.4, through its custom adapter and custom-proposer interfaces. GEPA controls minibatch sampling, acceptance, candidate selection from the Pareto frontier, and validation scoring. The conversation assistant supplied the four reflection proposals. This was an assistant-driven pilot, not a run using an independently versioned reflection-model API. The package includes a callable-proposer alternative for automating that part with a configured generative model. [GEPA source and integration interfaces](https://github.com/gepa-ai/gepa)

Jev cannot provide that reflection itself because it does not generate the revised instruction text. Its role remains the inexpensive decision model being evaluated. [Jev's decision interface](https://docs.typesafe.ai/models)

The feedback contains the training sentence, its corpus label, and Jev's probabilities. It contains no model rationale: the API does not return a reasoning trace for us to inspect.

## Protocol fixed before testing

The source is the same pinned ADE Corpus V2 revision as the original experiment. We excluded all 500 sentences previously evaluated with Jev and selected another 500 from the unused Jev pool. Identical normalized sentences cannot cross the new partitions.

| Partition | Sentences | Positive labels | Purpose |
| --- | ---: | ---: | --- |
| Training | 100 | 20 | Reflection examples |
| Validation | 100 | 21 | Candidate selection and review cutoffs |
| Fresh test | 300 | 61 | Final paired comparison |

The optimizer maximizes `1 - (p_ADE - label)^2` per example. Averaged over validation, this is equivalent to minimizing Brier score. It penalizes confident mistakes without optimizing ordinary accuracy on a dataset dominated by negatives. Brier also reflects discrimination and prevalence; it is not an isolated measure of calibration.

We limited the search to four proposals, 20 reflection examples per round, and at most 700 optimization metric calls. GEPA used strict minibatch improvement and Pareto candidate selection. Crossover was disabled for this small run. A proposed candidate could be rejected before a full validation evaluation. The fresh test was evaluated only after the selected candidate was saved with a timestamp and hash. The original and selected prompts were interleaved at up to 24 concurrent requests, with `jev-1.13.0` pinned throughout.

## Fresh-test results

| Metric | Original Jev | GEPA-selected Jev |
| --- | ---: | ---: |
{table}

Classification uses the same fixed probability threshold of 0.5 for both prompts. ECE and log loss are descriptive secondary measures. Exact zero/one probabilities are numerically clipped by scikit-learn when computing log loss.

![Validation candidate scores and fresh-test precision, recall, and F1.](figures/01-gepa-results.png)

The primary paired difference, optimized minus original Brier, is {delta['brier']:+.4f}; its 95% bootstrap interval is {interval(delta['brier_bootstrap_95'])}. {uncertainty} F1 changed by {delta['f1']*100:+.2f} percentage points, with a 95% bootstrap interval of {interval(delta['f1_bootstrap_95'],100)} points.

We resampled the same 300 sentence indices for both prompts in 5,000 paired bootstrap replicates. These intervals assume sentence-level independence and do not account for shared source articles or prompt-search variability. One search seed and one small corpus cannot establish a general advantage.

![Confusion matrices for the two prompts on the identical fresh test sentences.](figures/02-errors.png)

The revised prompt corrected {change['original_wrong_gepa_right']} original classification errors and introduced {change['original_right_gepa_wrong']} new ones. Errors here mean disagreements with the supplied corpus labels. We kept every label unchanged.

## What happened to review workload?

For each prompt, we reused the earlier review policy: choose the largest validation cutoff from 0 to 0.4, in 0.005 steps, that retains at least 95% of positive cases. A sentence with probability at or below the cutoff goes to lower priority.

| Prompt | Cutoff | Review | Lower priority | Positive cases deferred |
| --- | ---: | ---: | ---: | ---: |
{routes}

This is a secondary outcome, not the objective GEPA optimized. A lower Brier score does not guarantee a better screening policy. With only 21 validation positives, the retention target permits at most one positive case to be deferred. Lower priority means deferred review or audit, not removal from the literature workflow.

## What the revisions learned

The first reflected revision made the drug, harmful effect, and relationship explicit. It discouraged inferring causality from a drug level and an abnormal finding merely appearing together. Later proposals tested the wording for compact titles, treatment benefits, vague adverse-effect references, and background discussion. These are changes to the annotation decision boundary, not discoveries about drug safety. The selected text and all four proposed candidates are included so readers can inspect the actual changes.

The original prompt has {sum(map(len,seed_candidate().values())):,} characters across its three text components; the selected prompt has {sum(map(len,frozen['candidate'].values())):,}. On the final test calls, average input-token usage was {a['test_input_tokens_per_request']['original']:.1f} for the original and {a['test_input_tokens_per_request']['gepa']:.1f} for the selected prompt. Any accuracy gain therefore comes with its measured prompt-length cost.

## Cost, scope, and reproduction

The completed search and paired test account for 1,260 successful Jev evaluations. Full response records are preserved for {cost['validated_n']:,} of them. The append journal omitted ten records; seven were recovered from GEPA's saved outputs and the final test snapshots. Three optimization response payloads remain unavailable. All 600 final test responses and both 100-example validation sets used for the reported routing comparison are complete. No API calls were repeated to repair the logs.

Preserved usage totals {cost['input_tokens']:,} input tokens, approximately ${cost['estimated_jev_input_usd']:.5f} at $0.042 per million. This is a lower bound because those three optimization payloads lack usage metadata. It also excludes reflection cost and is not an invoice. On preserved records, median client-observed latency was {cost['p50_latency_s']:.2f} seconds; the 95th percentile was {cost['p95_latency_s']:.2f} seconds. Those timings include network and service effects. The supplied runner now writes atomic batch snapshots in addition to its append journal.

The dataset's missing article identifiers prevent a document-level split. Jev's possible pretraining exposure is unknown, and some annotations have boundaries that need expert review. GEPA can become better at matching those labels without becoming more clinically correct. We did not compare optimizers, search seeds, reflection models, or model fine-tuning.

Open `Jev_GEPA_Experiment.ipynb` to inspect the executed analysis. `experiment.py` contains the adapter, data preparation, bounded live runner, and custom proposer. `analyze.py` recomputes metrics and intervals without API calls. The default notebook mode reads saved outputs; a live run requires an explicitly configured generative reflection callable and a TypeSafe key from a secret store. The raw corpus and credentials are not included.

Sources: [GEPA paper](https://arxiv.org/abs/2507.19457), [GEPA implementation](https://github.com/gepa-ai/gepa), [ADE Corpus V2](https://huggingface.co/datasets/ade-benchmark-corpus/ade_corpus_v2).
'''
(ROOT/'Jev_GEPA_Results.md').write_text(report)
body=markdown.markdown(report,extensions=['tables','fenced_code'])
for p in figures.glob('*.png'):
 body=body.replace('src="figures/'+p.name+'"','src="data:image/png;base64,'+base64.b64encode(p.read_bytes()).decode()+'"')
css='body{margin:55px auto;max-width:840px;padding:0 24px;background:white;color:#293338;font:18px/1.75 Georgia,serif}h1{font-size:43px;line-height:1.15}h2{font-size:28px;margin-top:50px}a{color:#147768}img{width:100%;height:auto}table{border-collapse:collapse;width:100%;font:13px/1.6 Arial,sans-serif;margin:25px 0}th,td{text-align:left;padding:12px;border-bottom:1px solid #dce4e4}th{background:#edf4f1}pre{overflow:auto;padding:18px;background:#f4f6f7}code{font-size:13px}@media(max-width:600px){body{font-size:17px;margin-top:30px}h1{font-size:34px}table{font-size:11px}th,td{padding:8px}}'
(ROOT/'Jev_GEPA_Results.html').write_text('<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Jev + GEPA results</title><style>'+css+'</style><body>'+body+'</body></html>')
print('Built report and two measured figures.')
