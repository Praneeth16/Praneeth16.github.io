import json, contextlib, io
from pathlib import Path
import numpy as np
import pandas as pd
from sklearn.metrics import confusion_matrix, f1_score

ROOT=Path('jev_article');(ROOT/'results').mkdir(parents=True,exist_ok=True)
n=json.loads(Path('Jev_HLS_ADE_Experiment.ipynb').read_text());scope={}
with contextlib.redirect_stdout(io.StringIO()):
 for c in [c for c in n['cells'] if c['cell_type']=='code'][:4]:
  exec(''.join(c['source']),scope)
run=Path('jev_ade_cache/run_20260919T201046_419655Z')
def read(name, frame):
 rows=[json.loads(l) for l in (run/(name+'.jsonl')).read_text().splitlines()]
 by_id={r['id']:r for r in rows}
 assert len(rows)==len(frame)==len(by_id) and all(r['status']=='ok' for r in rows)
 return [by_id[i] for i in frame.id]
val,test=scope['validation'],scope['test']
vr,tr=read('validation',val),read('test',test)
y=test.label.to_numpy();vy=val.label.to_numpy()
bp=np.array(scope['baseline_test_p']);bvp=np.array(scope['baseline_val_p'])
jp=np.array([r['p_ade'] for r in tr]);jvp=np.array([r['p_ade'] for r in vr])
thresholds=np.arange(.01,1,.005)
f1s=np.array([f1_score(vy,bvp>=t,zero_division=0) for t in thresholds])
baseline_f1_threshold=float(thresholds[np.flatnonzero(f1s==f1s.max())[-1]])
def report(y,p,t):
 r=scope['probability_report'](y,p)
 pred=(p>=t).astype(int);tn,fp,fn,tp=confusion_matrix(y,pred,labels=[0,1]).ravel()
 r.update(threshold=t,accuracy=float((pred==y).mean()),ade_precision=float(tp/(tp+fp)),ade_recall=float(tp/(tp+fn)),ade_f1=float(f1_score(y,pred)),macro_f1=float(f1_score(y,pred,average='macro')),tn=int(tn),fp=int(fp),fn=int(fn),tp=int(tp))
 return r
def wilson(k,n,z=1.959963984540054):
 p=k/n;den=1+z*z/n;center=(p+z*z/(2*n))/den
 half=z*np.sqrt(p*(1-p)/n+z*z/(4*n*n))/den
 return [float(center-half),float(center+half)]
results={'baseline_default':report(y,bp,.5),'baseline_validation_f1':report(y,bp,baseline_f1_threshold),'jev':report(y,jp,.5)}
for r in results.values():r['recall_wilson_95']=wilson(r['tp'],r['tp']+r['fn'])
for name,pp,pv in [('baseline',bp,bvp),('jev',jp,jvp)]:
 cutoff=scope['choose_cutoff'](vy,pv)
 rr=scope['routing_report'](y,pp,cutoff)
 rr.update(cutoff=cutoff,lower_priority_count=int((pp<=cutoff).sum()),review_count=int((pp>cutoff).sum()),validation=scope['routing_report'](vy,pv,cutoff))
 results[name+'_routing']=rr
 # Reliability bins include sample counts; retain all nonempty bins.
 bins=[]
 for i in range(10):
  m=np.minimum((pp*10).astype(int),9)==i
  if m.any():
   bins.append({'bin':i,'n':int(m.sum()),'p_mean':float(pp[m].mean()),'observed_ade':float(y[m].mean()),'wilson_95':wilson(int(y[m].sum()),int(m.sum()))})
 results[name+'_reliability']=bins
confidence=np.array([r['confidence'] for r in tr]);correct=(jp>=.5).astype(int)==y
results['jev_confidence']={'errors':int((~correct).sum()),'confidence_1_n':int((confidence==1).sum()),'confidence_1_errors':int(((confidence==1)&~correct).sum()),'confidence_ge_09_n':int((confidence>=.9).sum()),'confidence_ge_09_errors':int(((confidence>=.9)&~correct).sum()),'p_zero_n':int((jp==0).sum()),'p_zero_ades':int(((jp==0)&(y==1)).sum()),'p_one_n':int((jp==1).sum()),'p_one_nonades':int(((jp==1)&(y==0)).sum())}
smoke=[json.loads(l) for l in (run/'smoke.jsonl').read_text().splitlines()]
allrows=smoke+vr+tr
results['run']={'model_ids':sorted(set(r['returned_model'] for r in allrows)), 'logged_requests':len(allrows),'benchmark_requests':len(vr)+len(tr),'input_tokens':sum(r['usage']['input_tokens'] for r in allrows),'benchmark_input_tokens':sum(r['usage']['input_tokens'] for r in vr+tr),'smoke_input_tokens':sum(r['usage']['input_tokens'] for r in smoke),'estimated_cost_usd':sum(r['usage']['input_tokens'] for r in allrows)/1e6*.042,'note':'One interrupted in-flight request before checkpointed concurrency may have been billed and has no logged result. Cost is an estimate from logged usage, not an invoice.'}
for label,rr in [('smoke',smoke),('test',tr),('benchmark',vr+tr)]:
 lat=np.array([r['latency_ms']/1000 for r in rr])
 results['run'][label+'_latency_s']={k:float(v) for k,v in zip(['min','p50','p95','max'],[lat.min(),np.median(lat),np.percentile(lat,95),lat.max()])}
results['run']['timings']={k:json.loads((run/(k+'.timing.json')).read_text()) for k in ['validation','test']}
results['protocol']={'raw_rows':len(scope['df']),'unique_rows':len(scope['clean']),'train_n':len(scope['train']),'val_n':len(val),'test_n':len(test),'val_positive':int(vy.sum()),'test_positive':int(y.sum()),'test_negative':int((y==0).sum()),'dataset_revision':scope['DATASET_REVISION'],'seed':42,'f1_selection':'Largest threshold maximizing validation ADE F1 over [0.01, 0.995] in steps of 0.005; no test labels used for selection.'}
(ROOT/'results'/'analysis.json').write_text(json.dumps(results,indent=2))
preds=[]
for i,r in enumerate(tr):
 preds.append({'id':r['id'],'label':int(y[i]),'baseline_p_ade':float(bp[i]),'jev_p_ade':float(jp[i]),'jev_confidence':float(confidence[i]),'latency_s':r['latency_ms']/1000})
(ROOT/'results'/'test_predictions.jsonl').write_text('\n'.join(json.dumps(r) for r in preds)+'\n')
print(json.dumps({k:v for k,v in results.items() if 'reliability' not in k},indent=2))
print('ERROR INSPECTION (local analysis only)')
for i in np.flatnonzero(~correct):
 print(json.dumps({'id':test.id.iloc[i][:12],'label':int(y[i]),'p':float(jp[i]),'confidence':float(confidence[i]),'text':test.text.iloc[i]}))
