"""Build public, text-free explorer records from the two preserved experiments.

Run with the original study workspace as the first argument. Sentences are
loaded by the browser from Hugging Face and checked against the stored hash.
"""
from pathlib import Path
import sys,json,hashlib
import pandas as pd

study=Path(sys.argv[1]).resolve()
site=Path(__file__).resolve().parents[1]
read=lambda p:json.loads((study/p).read_text())
lines=lambda p:[json.loads(s) for s in (study/p).read_text().splitlines()]
df=pd.read_parquet(study/'jev_ade_cache/ade_classification.parquet').reset_index(names='sourceRow')
df['normalized']=df.text.str.lower().str.replace(r'\s+',' ',regex=True).str.strip()
df=df.drop_duplicates('normalized').copy()
df['id']=df.normalized.map(lambda s:hashlib.sha256(s.encode()).hexdigest())
source={r.id:{'sourceRow':int(r.sourceRow),'words':len(r.text.split()),'label':int(r.label)} for r in df.itertuples()}
original=read('jev_ade_cache/run_20260919T201046_419655Z/split_manifest.json')
second=read('jev_gepa/run/split_manifest.json')
rows=[]
for stage,manifest,parts in [(1,original,['validation','test']),(2,second,['train','validation','test'])]:
 for split in parts:
  ids=manifest[split+'_ids'] if stage==1 else manifest[split]['ids']
  rows.extend(dict(id=id,stage=stage,split=split,**source[id]) for id in ids)
index={r['id']:r for r in rows}
first_test=lines('jev_article/results/test_predictions.jsonl')
for r in first_test:index[r['id']].update(pOriginal=r['jev_p_ade'],pBaseline=r['baseline_p_ade'],confidence=r['jev_confidence'])
for r in lines('jev_ade_cache/run_20260919T201046_419655Z/validation.jsonl'):
 index[r['id']].update(pOriginal=r['p_ade'],confidence=r['confidence'])
for name,field in [('original','pOriginal'),('gepa','pOptimized')]:
 for r in read(f'jev_gepa/run/test_{name}.json'):index[r['id']][field]=r['p_ade']
frozen=read('jev_gepa/run/frozen_candidate.json')
result=read('jev_gepa/run/gepa_result.json')
def digest(x):return hashlib.sha256(json.dumps(x,sort_keys=True,separators=(',',':')).encode()).hexdigest()
candidate_ids=[digest(c) for c in result['candidates']]
for r in lines('jev_gepa/run/calls.jsonl'):
 if r['split']=='validation' and r['candidate_id'] in [candidate_ids[0],frozen['candidate_id']]:
  index[r['id']]['pOriginal' if r['candidate_id']==candidate_ids[0] else 'pOptimized']=r['p_ade']
assert len(rows)==1000 and len(index)==1000
assert sum(r['label'] for r in rows if r['stage']==2 and r['split']=='test')==61
for r in rows:
 assert 'text' not in r and 'sentence' not in r
 if r['stage']==2 and r['split']=='test':assert 'pOriginal' in r and 'pOptimized' in r
reflections=[]
for i in range(1,5):
 request=read(f'jev_gepa/run/reflection/request_{i:02}.json')
 examples=[]
 for e in request['examples']:
  examples.append({k:v for k,v in e.items() if k not in ['sentence','text']})
 reflections.append({'round':i,'examples':examples,'objective':request['objective']})
data={'schemaVersion':1,'timing':{'first':[r['latency_s'] for r in first_test],'second':[r['latency_s'] for r in lines('jev_gepa/run/calls.jsonl')]},'revision':'4ba01c71687dd7c996597042449448ea312126cf',
 'sourceDataset':'ade-benchmark-corpus/ade_corpus_v2','sourceConfig':'Ade_corpus_v2_classification',
 'corpus':{'raw':23516,'unique':len(df),'positive':int(df.label.sum())},'rows':rows,
 'candidates':[{'index':i,'parent':result['parents'][i][0],'brier':1-result['val_aggregate_scores'][i],
  'selected':i==frozen['best_index'],'text':c,'id':candidate_ids[i]} for i,c in enumerate(result['candidates'])],
 'reflections':reflections,'firstAnalysis':read('jev_article/results/analysis.json'),
 'secondAnalysis':read('jev_gepa/run/analysis.json')}
out=site/'public/jev/evidence.json';out.write_text(json.dumps(data,separators=(',',':')))
print(json.dumps({'path':str(out),'rows':len(rows),'bytes':out.stat().st_size}))
