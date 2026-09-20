"""Create an executed, credential-free analysis notebook and runnable live cells."""
from pathlib import Path
import base64,contextlib,io,json
from experiment import ROOT

cells=[]
def md(s):cells.append({'cell_type':'markdown','metadata':{},'source':s.splitlines(True)})
def code(s):cells.append({'cell_type':'code','metadata':{},'source':s.splitlines(True),'execution_count':None,'outputs':[]})
md('''# Jev + GEPA: executed experiment and analysis

Praneeth Paikray · 19 September 2026

We used GEPA 0.1.4 to optimize Jev's instructions and two class definitions on public ADE sentences. The live pilot is recorded in `run/`. The cells below replay its results without API calls. Optional live cells at the end show how to run another search with a configured generative reflection callable.

Jev's weights are fixed. GEPA controls search, minibatch acceptance, Pareto candidate selection, and validation. The recorded pilot's four reflection proposals came from the conversation assistant through a custom-proposer callback. Its exact reflection model version and cost are unavailable. This is not a separately reproducible reflection-model benchmark.

Install dependencies if needed: `%pip install gepa==0.1.4 numpy pandas scikit-learn pyarrow matplotlib`. Keep the notebook beside `experiment.py`, `analyze.py`, `inputs/`, and `run/` from the companion package.
''')
code('''from pathlib import Path
import json, sys
import pandas as pd
from IPython.display import display, Image

ROOT = Path.cwd()
if not (ROOT / "experiment.py").exists() and (ROOT / "jev_gepa" / "experiment.py").exists():
    ROOT = ROOT / "jev_gepa"
assert (ROOT / "experiment.py").exists(), "Run beside the companion source files."
sys.path.insert(0, str(ROOT))
RUN = ROOT / "run"
analysis = json.loads((RUN / "analysis.json").read_text())
config = json.loads((RUN / "config.json").read_text())
manifest = json.loads((RUN / "split_manifest.json").read_text())
print("Jev model:", config["model"], "| GEPA:", config["gepa_version"])
print("Primary objective: minimize validation Brier score")
print("Default mode: replay saved results, with no API calls")
''')
md('''## 1. Separation of optimization and testing

All 500 sentences from the original Jev experiment were excluded. We reserved 100 training sentences for reflection, 100 validation sentences for selection, and 300 fresh sentences for testing. The public corpus lacks article IDs, so this is sentence separation, not document separation. Its possible presence in Jev's pretraining data is unknown.
''')
code('''original_split = json.loads((ROOT / "inputs" / "original_split_manifest.json").read_text())
seen = set(original_split["validation_ids"]) | set(original_split["test_ids"])
for split in ["train", "validation", "test"]:
    ids = set(manifest[split]["ids"])
    assert not ids & seen
    seen |= ids
display(pd.DataFrame([{"split":s, "sentences":manifest[s]["n"], "positive_labels":manifest[s]["positive_n"]} for s in ["train","validation","test"]]))
''')
md('''## 2. Actual GEPA search

The adapter returns `1 - (p_ADE - y)**2` for each example. Higher mean score is lower Brier error. We allowed four proposals with 20 reflection examples per round. GEPA tested candidates for strict minibatch improvement before full validation. Crossover was disabled. Only the aggregate validation score selected the final candidate; test labels never entered reflection or selection.
''')
code('''search = json.loads((RUN / "gepa_result.json").read_text())
frozen = json.loads((RUN / "frozen_candidate.json").read_text())
display(pd.DataFrame([{"candidate":i,"parents":search["parents"][i],"validation_brier":1-s,"selected":i==frozen["best_index"]} for i,s in enumerate(search["val_aggregate_scores"])]))
print("Frozen at:", frozen["frozen_at"])
print("Candidate SHA-256:", frozen["candidate_id"])
''')
md('''## 3. Fresh-test comparison

Both prompts receive the identical 300 held-out sentences and the same pinned Jev version. Precision, recall, and F1 use a fixed 0.5 cutoff. These metrics must be read together: a more selective classifier can increase precision while losing recall.
''')
code('''metrics = ["brier","precision","recall","f1","accuracy","log_loss","ece_10"]
display(pd.DataFrame({name:{k:analysis[name][k] for k in metrics} for name in ["original","gepa"]}))
print("Paired changes:", analysis["paired_changes"])
display(Image(filename=str(ROOT / "figures" / "01-gepa-results.png")))
display(Image(filename=str(ROOT / "figures" / "02-errors.png")))
''')
md('''## 4. Uncertainty and review workload

The intervals below use 5,000 paired bootstrap samples, with the same sampled indices for both prompts. They assume independent sentences and do not include variation across prompt searches. The routing policy is evaluated separately: choose each prompt's cutoff on validation to retain at least 95% of positive cases, then freeze it for the fresh test.
''')
code('''print(json.dumps(analysis["delta_optimized_minus_original"], indent=2))
display(pd.DataFrame({name:analysis["routing"][name]["test"] for name in ["original","gepa"]}))
''')
md('''## 5. Inspect the selected prompt and cost

The prompt may better reproduce the corpus's annotation boundary without becoming more clinically correct. Labels were not changed. Inspect all proposed texts under `run/reflection/`; public source sentences are recovered from the pinned dataset using the saved identifiers rather than redistributed in the package.
''')
code('''print(json.dumps(frozen["candidate"], indent=2))
print(json.dumps(analysis["calls"], indent=2))
print("Response-record integrity:", analysis["record_integrity"])
print("Mean test input tokens:", analysis["test_input_tokens_per_request"])
''')
md('''## 6. Recompute the analysis without API calls

This recomputes the same metrics, routing rules, and bootstrap intervals from saved responses. It can take several seconds.
''')
code('''RECOMPUTE = False
if RECOMPUTE:
    from analyze import analyze
    recomputed = analyze(RUN)
    assert recomputed["original"] == analysis["original"]
    assert recomputed["gepa"] == analysis["gepa"]
else:
    print("Saved analysis loaded. Set RECOMPUTE=True to recalculate it.")
''')
md('''## 7. Optional: run a new search

Live execution is off by default. Supply a generative-model callable that accepts a reflection request string and returns **only** a JSON string with `instructions`, `ade_related`, and `not_related`. `CallableProposer` handles the GEPA interface and logs the request and proposal. Jev cannot generate these revised instructions itself.

Configure `TYPESAFE_API_KEY` through your environment or a secret store. In Databricks, retrieve it with `dbutils.secrets.get(...)`. Configure any reflection-provider key in that provider's client. Never write credentials into this notebook.

Reusing these splits is a replication on a now-observed test set. For another claim of generalization, reserve new data and predeclare the protocol before optimization. The live block uses a new directory and will not overwrite this run.
''')
code('''RUN_LIVE = False
GENERATE_REFLECTION = None  # Configure a provider callable: prompt_string -> JSON_string.
REFLECTION_MODEL_LABEL = ""  # Record the provider, model, and version for a live run.

if RUN_LIVE:
    import os
    from datetime import datetime, timezone
    from experiment import (CONFIG, JevAdapter, CallableProposer, prepare_data,
                            run_optimization, evaluate_frozen, write_json)
    assert callable(GENERATE_REFLECTION), "Configure the generative reflection callable first."
    assert REFLECTION_MODEL_LABEL, "Record the reflection model identity first."
    key = os.environ.get("TYPESAFE_API_KEY")
    assert key, "Configure TYPESAFE_API_KEY through a secret store."
    new_run = ROOT / ("rerun_" + datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%S_%fZ"))
    new_run.mkdir()
    live_config = dict(CONFIG, reflection_provider=REFLECTION_MODEL_LABEL)
    write_json(new_run / "config.json", live_config)
    rows = prepare_data(new_run)
    adapter = JevAdapter(key, new_run)
    proposer = CallableProposer(GENERATE_REFLECTION, new_run)
    result = run_optimization(adapter, rows, new_run, proposer=proposer)
    outputs = evaluate_frozen(adapter, rows, new_run)
else:
    print("Live optimization is disabled.")
''')

# Execute the safe replay cells and retain their actual text/table/image outputs.
scope={};count=0
for cell_index,cell in enumerate(cells):
 cell['id']=f'cell-{cell_index:02d}'
 if cell['cell_type']!='code':continue
 count+=1;outputs=[];buf=io.StringIO()
 def capture_display(obj):
  if hasattr(obj,'_repr_png_'):
   blob=obj._repr_png_()
   if blob is not None:
    image_metadata={}
    if isinstance(blob,tuple):blob,image_metadata=blob
    encoded=blob if isinstance(blob,str) else base64.b64encode(blob).decode()
    assert base64.b64decode(encoded).startswith(b'\x89PNG')
    outputs.append({'output_type':'display_data','metadata':image_metadata,'data':{'image/png':encoded,'text/plain':['Recorded result figure']}});return
  if hasattr(obj,'to_html'):
   outputs.append({'output_type':'display_data','metadata':{},'data':{'text/html':[obj.to_html(index=True)],'text/plain':[obj.to_string()]}})
  else:outputs.append({'output_type':'display_data','metadata':{},'data':{'text/plain':[str(obj)]}})
 source=''.join(cell['source'])
 # Replace the display import in the execution copy only.
 execution_source=source.replace('from IPython.display import display, Image','from IPython.display import Image')
 scope['display']=capture_display
 with contextlib.redirect_stdout(buf):exec(compile(execution_source,f'cell_{count}','exec'),scope)
 if buf.getvalue():outputs.insert(0,{'output_type':'stream','name':'stdout','text':buf.getvalue().splitlines(True)})
 cell['execution_count']=count;cell['outputs']=outputs
nb={'cells':cells,'metadata':{'kernelspec':{'display_name':'Python 3','language':'python','name':'python3'},'language_info':{'name':'python','version':'3.12'}},'nbformat':4,'nbformat_minor':5}
(ROOT/'Jev_GEPA_Experiment.ipynb').write_text(json.dumps(nb,indent=1))
print(f'Created executed analysis notebook with {count} code cells.')
