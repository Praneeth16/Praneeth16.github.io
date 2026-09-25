"""Jev vs GPT-6 Luna as routers, both called through OpenRouter.

    python run.py smoke                 # a few calls per kind, to check schemas
    python run.py route --split dev     # task A: specialist routing
    python run.py answer --split dev    # task B ground truth: Luna and Sol answer MMLU-Pro
    python run.py tier --split dev      # task B: routers predict whether Luna will be right
    python run.py latency               # serial probe, one request at a time

Every call is appended to run/calls.jsonl and never repeated once it succeeds.
The key comes from OPENROUTER_API_KEY or ~/.openrouter_key and is never written anywhere.
"""
from __future__ import annotations

import argparse
import hashlib
import json
import math
import os
import random
import threading
import time
import urllib.error
import urllib.request
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timezone
from pathlib import Path

import questions as Q

ROOT = Path(__file__).resolve().parent
RUN = ROOT/'run'
CALLS = RUN/'calls.jsonl'
DECISIONS_URL = 'https://openrouter.ai/api/alpha/decisions'
CHAT_URL = 'https://openrouter.ai/api/v1/chat/completions'
JEV = 'typesafe/jev-1.13'
LUNA = 'openai/gpt-6-luna'
SOL = 'openai/gpt-6-sol'
OPENAI_ONLY = {'order': ['OpenAI'], 'allow_fallbacks': False, 'require_parameters': True}
CONFIG = dict(jev=JEV, luna=LUNA, sol=SOL, luna_reasoning='none', sol_reasoning='low',
              workers=8, timeout_s=120, max_calls=4000, seed=20260926)

def digest(value):
    return hashlib.sha256(json.dumps(value, sort_keys=True, separators=(',', ':')).encode()).hexdigest()

QUESTIONS_DIGEST = hashlib.sha256((ROOT/'questions.py').read_bytes()).hexdigest()

def api_key():
    key = os.environ.get('OPENROUTER_API_KEY') or (Path.home()/'.openrouter_key').read_text().strip()
    if not key.startswith('sk-or-'):
        raise SystemExit('No OpenRouter key found.')
    return key

def finite01(x):
    return type(x) in (int, float) and math.isfinite(x) and 0 <= x <= 1

# ---- request builders: (url, payload, parser) --------------------------------------------------

def jev_route(row):
    q = {'type': 'choice', 'instructions': Q.ROUTE_INSTRUCTIONS, 'criteria': Q.ROUTES}
    def parse(body):
        a = body['answers']['route']; p = a['probabilities']
        if a['type'] != 'choice' or set(p) != set(Q.ROUTES) or not all(map(finite01, p.values())):
            raise ValueError('schema')
        # Probabilities arrive rounded to two decimals, so sums and argmax ties drift by rounding.
        if abs(sum(p.values()) - 1) > 0.02 or p[a['choice']] < max(p.values()) - 0.011:
            raise ValueError('inconsistent probabilities')
        return {'route': a['choice'], 'p': p[a['choice']], 'probabilities': p, 'confidence': a['confidence'],
                'choice_is_argmax': p[a['choice']] == max(p.values())}
    return DECISIONS_URL, {'model': JEV, 'state': row['text'], 'questions': {'route': q}}, parse

def chat(model, system, user, schema, effort, max_tokens):
    return {'model': model, 'messages': [{'role': 'system', 'content': system}, {'role': 'user', 'content': user}],
            'reasoning': {'effort': effort}, 'max_tokens': max_tokens, 'provider': OPENAI_ONLY,
            'response_format': {'type': 'json_schema', 'json_schema': {'name': 'answer', 'strict': True, 'schema': schema}}}

def content(body):
    return json.loads(body['choices'][0]['message']['content'])

def luna_route(row):
    schema = {'type': 'object', 'additionalProperties': False, 'required': ['route', 'confidence'],
              'properties': {'route': {'type': 'string', 'enum': list(Q.ROUTES)}, 'confidence': {'type': 'number'}}}
    def parse(body):
        c = content(body)
        if c.get('route') not in Q.ROUTES or not finite01(c.get('confidence')):
            raise ValueError('schema')
        return {'route': c['route'], 'p': float(c['confidence'])}
    return CHAT_URL, chat(LUNA, Q.luna_route_system(), row['text'], schema, 'none', 200), parse

def answer(model, effort, max_tokens):
    def build(row):
        letters = list(Q.LETTERS[:len(row['options'])])
        schema = {'type': 'object', 'additionalProperties': False, 'required': ['answer'],
                  'properties': {'answer': {'type': 'string', 'enum': letters}}}
        def parse(body):
            c = content(body)
            if c.get('answer') not in letters:
                raise ValueError('schema')
            return {'answer': c['answer'], 'correct': c['answer'] == row['answer']}
        return CHAT_URL, chat(model, Q.ANSWER_SYSTEM, Q.mmlu_text(row), schema, effort, max_tokens), parse
    return build

def jev_tier(row):
    q = {'type': 'noul', 'instructions': Q.TIER_INSTRUCTIONS, 'criteria': Q.TIER_CRITERIA}
    def parse(body):
        a = body['answers']['cheap_ok']
        if a['type'] != 'noul' or not finite01(a['noul']):
            raise ValueError('schema')
        return {'p': float(a['noul'])}
    return DECISIONS_URL, {'model': JEV, 'state': Q.mmlu_state(row), 'questions': {'cheap_ok': q}}, parse

def luna_tier(row):
    schema = {'type': 'object', 'additionalProperties': False, 'required': ['probability'],
              'properties': {'probability': {'type': 'number'}}}
    def parse(body):
        c = content(body)
        if not finite01(c.get('probability')):
            raise ValueError('schema')
        return {'p': float(c['probability'])}
    return CHAT_URL, chat(LUNA, Q.luna_tier_system(), Q.mmlu_text(row), schema, 'none', 200), parse

KINDS = {
    'route_jev': ('clinc', jev_route), 'route_luna': ('clinc', luna_route),
    'answer_luna': ('mmlu', answer(LUNA, 'none', 200)), 'answer_sol': ('mmlu', answer(SOL, 'low', 16000)),
    'tier_jev': ('mmlu', jev_tier), 'tier_luna': ('mmlu', luna_tier),
}

# ---- journal ----------------------------------------------------------------------------------

class Runner:
    def __init__(self, key):
        self.key = key
        self.lock = threading.Lock()
        self.done = {}
        self.calls = 0
        if CALLS.exists():
            for line in CALLS.read_text().splitlines():
                r = json.loads(line)
                self.calls += 1
                if r['status'] == 'ok':
                    self.done[(r['kind'], r['id'], r.get('probe', 0))] = r

    def call(self, kind, row, probe=0):
        ck = (kind, row['id'], probe)
        with self.lock:
            if ck in self.done:
                return self.done[ck]
            if self.calls >= CONFIG['max_calls']:
                raise RuntimeError('call budget exhausted')
            self.calls += 1
        url, payload, parse = KINDS[kind][1](row)
        record = {'kind': kind, 'id': row['id'], 'split': row['split'], 'probe': probe, 'questions_digest': QUESTIONS_DIGEST,
                  'request_digest': digest(payload), 'started_at': datetime.now(timezone.utc).isoformat()}
        req = urllib.request.Request(url, data=json.dumps(payload).encode(), method='POST',
                                     headers={'Content-Type': 'application/json', 'Authorization': 'Bearer ' + self.key,
                                              'X-Title': 'system-one-router-study'})
        body = None
        for attempt in range(4):
            started = time.perf_counter()
            try:
                with urllib.request.urlopen(req, timeout=CONFIG['timeout_s']) as response:
                    body = json.load(response)
                record['latency_s'] = time.perf_counter() - started
                break
            except urllib.error.HTTPError as e:
                record['http_status'] = e.code
                record['error'] = e.read().decode(errors='replace')[:500]
                if e.code not in (408, 429, 500, 502, 503, 529) or attempt == 3:
                    break
            except (urllib.error.URLError, TimeoutError) as e:
                record['error'] = repr(e)[:300]
                if attempt == 3:
                    break
            time.sleep(2 ** attempt + random.random())
        record['attempts'] = attempt + 1
        if body is None:
            record['status'] = 'error'
        else:
            record['response'] = body
            record['model_returned'] = body.get('model')
            record['provider'] = body.get('provider')
            record['usage'] = body.get('usage')
            try:
                record['parsed'] = parse(body)
                record['status'] = 'ok'
            except (ValueError, KeyError, TypeError, json.JSONDecodeError) as e:
                record['status'] = 'invalid'
                record['error'] = repr(e)[:300]
        with self.lock:
            with CALLS.open('a') as f:
                f.write(json.dumps(record) + '\n')
            if record['status'] == 'ok':
                self.done[ck] = record
        return record

    def batch(self, jobs, workers):
        random.Random(CONFIG['seed']).shuffle(jobs)  # interleave the two routers in time
        with ThreadPoolExecutor(workers) as pool:
            results = list(pool.map(lambda j: self.call(*j), jobs))
        bad = [r for r in results if r['status'] != 'ok']
        print(f'{len(results)} calls, {len(bad)} not ok', *(f"  {r['kind']} {r['status']} {r.get('error','')[:160]}" for r in bad[:8]), sep='\n')
        return results

def rows(dataset, split):
    return [r for r in json.loads((ROOT/'inputs'/f'{dataset}.json').read_text()) if r['split'] == split]

def check_frozen():
    RUN.mkdir(exist_ok=True)
    path = RUN/'config.json'
    config = {**CONFIG, 'questions_digest': QUESTIONS_DIGEST}
    if path.exists() and json.loads(path.read_text())['questions_digest'] != QUESTIONS_DIGEST:
        raise SystemExit('questions.py changed after the run began.')
    path.write_text(json.dumps(config, indent=2))

if __name__ == '__main__':
    ap = argparse.ArgumentParser()
    ap.add_argument('phase', choices=['smoke', 'route', 'answer', 'tier', 'latency'])
    ap.add_argument('--split', default='dev', choices=['dev', 'test'])
    args = ap.parse_args()
    check_frozen()
    runner = Runner(api_key())
    if args.phase == 'smoke':
        for kind, (dataset, _) in KINDS.items():
            for r in [runner.call(kind, row) for row in rows(dataset, 'dev')[:3]]:
                print(kind, r['status'], r.get('model_returned'), r.get('parsed', r.get('error')), round(r.get('latency_s', 0), 2), (r.get('usage') or {}).get('cost'))
    elif args.phase == 'latency':
        # One request at a time, alternating routers, on the first 40 test utterances.
        for i, row in enumerate(rows('clinc', 'test')[::8][:40]):
            for kind in (['route_jev', 'route_luna'] if i % 2 else ['route_luna', 'route_jev']):
                runner.call(kind, row, probe=1)
        print('latency probe complete')
    else:
        dataset = 'clinc' if args.phase == 'route' else 'mmlu'
        kinds = [k for k in KINDS if k.startswith(args.phase)]
        runner.batch([(k, row) for row in rows(dataset, args.split) for k in kinds], CONFIG['workers'])
