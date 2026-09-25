"""Build the two routing benchmarks from pinned public data. No model calls.

Task A: CLINC150 (plus) utterances routed to one of ten specialist domains or out_of_scope.
Task B: MMLU-Pro questions, later labelled by whether a cheap model answers them correctly.
"""
from __future__ import annotations

import hashlib
import json
import re
import urllib.request
from pathlib import Path

import pandas as pd

ROOT = Path(__file__).resolve().parent
CACHE = ROOT/'cache'
SEED = 20260926
CLINC_REV = '155b9c710419136e17307b80d0a13e68cd46b4ec'
DOMAINS_REV = '828f8093932c8fe6ca7936c3d2e52903b1c523de'
MMLU_REV = 'b189ec765aa7ed75c8acfea42df31fdae71f97be'
SOURCES = {
    'clinc_test.parquet': (f'https://huggingface.co/datasets/clinc/clinc_oos/resolve/{CLINC_REV}/plus/test-00000-of-00001.parquet',
                           '3e60e45b25bf86543aa5df8ba4fcc674114164e6184f0197690648c2908d0102'),
    'clinc_validation.parquet': (f'https://huggingface.co/datasets/clinc/clinc_oos/resolve/{CLINC_REV}/plus/validation-00000-of-00001.parquet',
                                 'fbd545b46c611c4a7ba4b48cae6c7f09bb5b59f33ff56206ad1cd366c85cdfaa'),
    'clinc_README.md': (f'https://huggingface.co/datasets/clinc/clinc_oos/resolve/{CLINC_REV}/README.md',
                        'e28704a3c04f6b05c286ca2a8891bbf32c69c000dedfc5825d6e1713369b7a89'),
    'domains.json': (f'https://raw.githubusercontent.com/clinc/oos-eval/{DOMAINS_REV}/data/domains.json',
                     'b947b579d3b8e74b06f93b01083d8efaff2888b43a3e362533bd88a6e1211b3a'),
    'mmlu_pro_test.parquet': (f'https://huggingface.co/datasets/TIGER-Lab/MMLU-Pro/resolve/{MMLU_REV}/data/test-00000-of-00001.parquet',
                              '0e24a191921c2f453518a537a8b2117bd137e7714d4ef1565e9ba06c1ecb9ad8'),
}
PER_ROUTE = {'dev': 10, 'test': 30}
MMLU_PER_CATEGORY = {'dev': 7, 'test': 22}

def fetch(name):
    url, sha = SOURCES[name]
    path = CACHE/name
    if not path.exists():
        CACHE.mkdir(exist_ok=True)
        with urllib.request.urlopen(url, timeout=120) as r:
            path.write_bytes(r.read())
    if hashlib.sha256(path.read_bytes()).hexdigest() != sha:
        raise ValueError(f'{name}: checksum mismatch')
    return path

def row_id(*parts):
    return hashlib.sha256('\x1f'.join(map(str, parts)).encode()).hexdigest()[:16]

def intent_names():
    readme = fetch('clinc_README.md').read_text()
    block = readme[readme.index('- config_name: plus'):]
    names = dict(re.findall(r"'(\d+)': '?(\w+)'?", block[:block.index('- config_name:', 10)]))
    return [names[str(i)] for i in range(len(names))]

def clinc():
    names = intent_names()
    domain_of = {i: d for d, intents in json.loads(fetch('domains.json').read_text()).items() for i in intents}
    domain_of['oos'] = 'out_of_scope'
    rows = []
    for split, source in [('dev', 'clinc_validation.parquet'), ('test', 'clinc_test.parquet')]:
        df = pd.read_parquet(fetch(source))
        df['intent_name'] = df.intent.map(lambda i: names[i])
        df['route'] = df.intent_name.map(domain_of)
        assert df.route.notna().all()
        picked = df.groupby('route', group_keys=False).sample(PER_ROUTE[split], random_state=SEED)
        rows += [dict(id=row_id('clinc', split, r.text), split=split, text=r.text, intent=r.intent_name, route=r.route)
                 for r in picked.sort_values(['route', 'text']).itertuples()]
    return rows

def mmlu():
    df = pd.read_parquet(fetch('mmlu_pro_test.parquet'))
    dev = df.groupby('category', group_keys=False).sample(MMLU_PER_CATEGORY['dev'], random_state=SEED)
    test = df.drop(dev.index).groupby('category', group_keys=False).sample(MMLU_PER_CATEGORY['test'], random_state=SEED)
    rows = []
    for split, frame in [('dev', dev), ('test', test)]:
        rows += [dict(id=row_id('mmlu', r.question_id), split=split, question_id=int(r.question_id), category=r.category,
                      question=r.question, options=list(r.options), answer=r.answer)
                 for r in frame.sort_values('question_id').itertuples()]
    return rows

if __name__ == '__main__':
    (ROOT/'inputs').mkdir(exist_ok=True)
    for name, rows in [('clinc', clinc()), ('mmlu', mmlu())]:
        ids = [r['id'] for r in rows]
        assert len(ids) == len(set(ids)), name
        (ROOT/'inputs'/f'{name}.json').write_text(json.dumps(rows, indent=1))
        print(name, {s: sum(r['split'] == s for r in rows) for s in ('dev', 'test')})
