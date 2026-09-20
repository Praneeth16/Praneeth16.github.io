"""Recompute paired GEPA comparisons from saved responses, without API calls."""
from pathlib import Path
import json
import numpy as np
from sklearn.metrics import f1_score
from experiment import ROOT, CONFIG, metrics, write_json, digest, seed_candidate

def routing(y, p, cutoff):
    lower = p <= cutoff
    return {'cutoff':float(cutoff), 'review_n':int((~lower).sum()), 'deferred_n':int(lower.sum()),
            'deferred_positive_n':int((lower & (y==1)).sum()),
            'positive_retention':float((~lower & (y==1)).sum()/y.sum())}

def selected_cutoff(records):
    y=np.array([r['label'] for r in records]);p=np.array([r['p_ade'] for r in records])
    choices=[t for t in np.linspace(0,.4,81) if routing(y,p,t)['positive_retention']>=.95]
    return float(max(choices,default=-1))

def analyze(run_dir=ROOT/'run'):
    run_dir=Path(run_dir)
    a=json.loads((run_dir/'test_original.json').read_text())
    b=json.loads((run_dir/'test_gepa.json').read_text())
    if [r['id'] for r in a] != [r['id'] for r in b]:raise ValueError('Unpaired test outputs.')
    if [r['label'] for r in a] != [r['label'] for r in b]:raise ValueError('Label mismatch.')
    y=np.array([r['label'] for r in a]);pa=np.array([r['p_ade'] for r in a]);pb=np.array([r['p_ade'] for r in b])
    rng=np.random.default_rng(CONFIG['seed']); bootstrap=[]
    for _ in range(5000):
        ix=rng.integers(0,len(y),size=len(y));ys=y[ix]
        delta_brier=np.mean((pb[ix]-ys)**2-(pa[ix]-ys)**2)
        delta_f1=f1_score(ys,pb[ix]>=.5,zero_division=0)-f1_score(ys,pa[ix]>=.5,zero_division=0)
        bootstrap.append([delta_brier,delta_f1])
    boot=np.asarray(bootstrap)
    calls=[json.loads(line) for line in (run_dir/'calls.jsonl').read_text().splitlines()]
    valid=[r for r in calls if r['status']=='ok']
    config=json.loads((run_dir/'config.json').read_text())
    integrity=json.loads((run_dir/'record_integrity.json').read_text()) if (run_dir/'record_integrity.json').exists() else None
    frozen=json.loads((run_dir/'frozen_candidate.json').read_text())
    ids={'original':digest(seed_candidate()),'gepa':frozen['candidate_id']}
    routes={}
    for name, records in [('original',a),('gepa',b)]:
        validation=[r for r in valid if r['split']=='validation' and r['candidate_id']==ids[name]]
        if len(validation)!=config['validation_n']:raise ValueError('Incomplete candidate validation data.')
        t=selected_cutoff(validation)
        routes[name]={'validation':routing(np.array([r['label'] for r in validation]),np.array([r['p_ade'] for r in validation]),t),
                      'test':routing(y,pa if name=='original' else pb,t)}
    input_tokens=sum(r['response'].get('usage',{}).get('input_tokens',0) for r in valid)
    # Excludes conversation/reflection cost; the service price is an estimate, not an invoice.
    results={'protocol':config,'original':metrics(a),'gepa':metrics(b),
      'selected_candidate_changed':ids['original']!=ids['gepa'],
      'delta_optimized_minus_original':{'brier':float(np.mean((pb-y)**2-(pa-y)**2)),
      'brier_bootstrap_95':np.quantile(boot[:,0],[.025,.975]).tolist(),
      'f1':float(f1_score(y,pb>=.5)-f1_score(y,pa>=.5)),
      'f1_bootstrap_95':np.quantile(boot[:,1],[.025,.975]).tolist()},
      'routing':routes,
      'calls':{'n':len(calls),'validated_n':len(valid),'error_n':len(calls)-len(valid),
      'input_tokens':input_tokens,'estimated_jev_input_usd':input_tokens*.042/1e6,
      'reflection_cost_included':False,
      'p50_latency_s':float(np.median([r['latency_s'] for r in valid])),
      'p95_latency_s':float(np.percentile([r['latency_s'] for r in valid],95))},
      'paired_changes':{'original_wrong_gepa_right':int((((pa>=.5)!=y)&((pb>=.5)==y)).sum()),
                        'original_right_gepa_wrong':int((((pa>=.5)==y)&((pb>=.5)!=y)).sum())}}
    results['calls']['by_split']={split:sum(r['split']==split for r in calls) for split in ['train','validation','test']}
    results['record_integrity']=integrity
    results['calls']['usage_is_lower_bound']=bool(integrity and integrity['missing_full_records'])
    results['test_input_tokens_per_request']={name:float(np.mean([r['response']['usage']['input_tokens'] for r in records])) for name,records in [('original',a),('gepa',b)]}
    write_json(run_dir/'analysis.json',results)
    print(json.dumps(results,indent=2))
    return results

if __name__=='__main__':analyze()
