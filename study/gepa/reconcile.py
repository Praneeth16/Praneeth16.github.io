"""Recover original response records from redundant saved outputs, without reruns.

The append journal in this hosted run omitted ten records. Preserve it and
reconcile only byte-equivalent original records saved elsewhere. Do not invent
missing usage/latency or substitute new API responses.
"""
from pathlib import Path
import json,pickle,shutil
from experiment import ROOT,digest,write_json

run=ROOT/'run';original=run/'calls.original.jsonl'
if not original.exists():shutil.copy2(run/'calls.jsonl',original)
records={};sources={}
def add(record,source):
 key=(record['candidate_id'],record['id'])
 if key in records and records[key] != record:raise ValueError('Conflicting saved response records.')
 records[key]=record;sources.setdefault(key,[]).append(source)
for line in original.read_text().splitlines():add(json.loads(line),'append journal')
for line in (run/'calls.jsonl').read_text().splitlines():add(json.loads(line),'current reconciled journal')
g=json.loads((run/'gepa_result.json').read_text())
for entries in g['best_outputs_valset'].values():
 for _,r in entries:add(r,'GEPA result')
for p in (run/'gepa/generated_best_outputs_valset').rglob('*.json'):add(json.loads(p.read_text()),'GEPA saved best-output history')
for name in ['original','gepa']:
 for r in json.loads((run/f'test_{name}.json').read_text()):add(r,'frozen test snapshot')
expected={}
for i in range(1,5):
 request=json.loads((run/f'reflection/request_{i:02d}.json').read_text())
 proposal=json.loads((run/f'reflection/response_{i:02d}.json').read_text())
 for candidate in [request['candidate'],proposal]:
  for x in request['examples']:expected[(digest(candidate),x['id'])]='train'
manifest=json.loads((run/'split_manifest.json').read_text())
for c in g['candidates']:
 for id in manifest['validation']['ids']:expected[(digest(c),id)]='validation'
for name in ['original','gepa']:
 for r in json.loads((run/f'test_{name}.json').read_text()):expected[(r['candidate_id'],r['id'])]='test'
if set(records)-set(expected):raise ValueError('Unexpected records during reconciliation.')
missing=[{'candidate_id':key[0],'id':key[1],'split':expected[key]} for key in sorted(set(expected)-set(records))]
report={'append_journal_records':sum(1 for _ in original.read_text().splitlines()),
        'successful_evaluation_calls':len(expected),'recovered_full_records':len(records),
        'missing_full_records':missing,'test_records_complete':not any(x['split']=='test' for x in missing),
        'note':'Original response objects recovered from GEPA outputs and frozen test snapshots. No API calls repeated. Root cause of the incomplete append journal was not established. Usage and latency totals cover preserved records only.'}
write_json(run/'record_integrity.json',report)
tmp=run/'calls.reconciled.tmp'
tmp.write_text(''.join(json.dumps(r)+'\n' for r in records.values()))
tmp.replace(run/'calls.jsonl')
# This checkpoint was written locally by our own completed GEPA process.
checkpoint=run/'gepa/gepa_state.bin'
if checkpoint.exists():
 state=pickle.loads(checkpoint.read_bytes())
 write_json(run/'gepa_program_trace.json',state['full_program_trace'])
print(json.dumps(report,indent=2))
