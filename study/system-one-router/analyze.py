"""Recompute every reported number from run/calls.jsonl. Makes no API calls.

Writes run/analysis.json and the public evidence index used by the article's figures and explorers.
Stored responses are re-validated with the current parsers in run.py, so a validator fix never
requires paying for a call again.
"""
from __future__ import annotations

import json
from collections import Counter, defaultdict
from pathlib import Path

import numpy as np
from sklearn.metrics import f1_score, roc_auc_score, confusion_matrix

import questions as Q
from run import KINDS, CALLS, ROOT

SITE = ROOT.parents[1]/'public/system-one/evidence.json'
RNG_SEED = 20260926
BOOT = 5000

def load():
    rows = {name: {r['id']: r for r in json.loads((ROOT/'inputs'/f'{name}.json').read_text())} for name in ('clinc', 'mmlu')}
    latest = {}
    for line in CALLS.read_text().splitlines():
        r = json.loads(line)
        if 'response' in r:
            latest[(r['kind'], r['id'], r.get('probe', 0))] = r
    out = defaultdict(dict)
    for (kind, rid, probe), r in latest.items():
        dataset, build = KINDS[kind]
        _, _, parse = build(rows[dataset][rid])
        try:
            r = {**r, 'parsed': parse(r['response']), 'status': 'ok'}
        except (ValueError, KeyError, TypeError, json.JSONDecodeError) as e:
            r = {**r, 'status': 'invalid', 'error': repr(e)}
        out[(kind, probe)][rid] = r
    return rows, out

def wilson(k, n, z=1.96):
    if n == 0:
        return [0.0, 1.0]
    p = k/n; d = 1 + z*z/n; c = (p + z*z/(2*n))/d; h = z*np.sqrt(p*(1-p)/n + z*z/(4*n*n))/d
    return [float(c-h), float(c+h)]

def reliability(p, y, bins=10):
    p, y = np.asarray(p, float), np.asarray(y, float)
    idx = np.minimum((p*bins).astype(int), bins-1)
    out, ece = [], 0.0
    for b in range(bins):
        m = idx == b
        if m.any():
            out.append({'bin': b, 'n': int(m.sum()), 'p_mean': float(p[m].mean()), 'observed': float(y[m].mean()),
                        'wilson_95': wilson(int(y[m].sum()), int(m.sum()))})
            ece += m.mean()*abs(p[m].mean() - y[m].mean())
    return out, float(ece)

def pct(values, q):
    return float(np.percentile(values, q)) if len(values) else None

def cost(records):
    return float(sum((r.get('usage') or {}).get('cost') or 0 for r in records))

def boot_diff(a, b, stat, seed=RNG_SEED):
    rng = np.random.default_rng(seed); n = len(a); diffs = []
    for _ in range(BOOT):
        i = rng.integers(0, n, n)
        diffs.append(stat(a[i]) - stat(b[i]))
    return [float(np.percentile(diffs, 2.5)), float(np.percentile(diffs, 97.5))]

def selective(p, correct):
    """Auto-route only calls whose probability clears t; the rest go to a person. Ties move together."""
    p, c = np.asarray(p, float), np.asarray(correct, float)
    curve = []
    for t in sorted(set(np.round(p, 4)), reverse=True):
        keep = p >= t
        curve.append({'t': float(t), 'coverage': float(keep.mean()), 'accuracy': float(c[keep].mean())})
    at = {str(g): min((x for x in curve if x['coverage'] >= g), key=lambda x: x['coverage']) for g in (0.5, 0.8, 0.9)}
    return curve, at

def route_task(rows, calls):
    routes = list(Q.ROUTES)
    out = {}
    for split in ('dev', 'test'):
        ids = [i for i, r in rows['clinc'].items() if r['split'] == split]
        truth = np.array([rows['clinc'][i]['route'] for i in ids])
        res = {'n': len(ids)}
        preds, ps = {}, {}
        for name in ('jev', 'luna'):
            recs = [calls[(f'route_{name}', 0)].get(i) for i in ids]
            ok = [r is not None and r['status'] == 'ok' for r in recs]
            pred = np.array([r['parsed']['route'] if o else 'invalid' for r, o in zip(recs, ok)])
            p = np.array([r['parsed']['p'] if o else 0.0 for r, o in zip(recs, ok)])
            correct = pred == truth
            oos_pred, oos_true = pred == 'out_of_scope', truth == 'out_of_scope'
            rel, ece = reliability(p, correct)
            lat = [r['latency_s'] for r in recs if r and 'latency_s' in r]
            m = {'accuracy': float(correct.mean()), 'accuracy_wilson': wilson(int(correct.sum()), len(ids)),
                 'macro_f1': float(f1_score(truth, pred, labels=routes, average='macro', zero_division=0)),
                 'in_scope_accuracy': float(correct[~oos_true].mean()),
                 'oos_recall': float((oos_pred & oos_true).sum()/oos_true.sum()),
                 'oos_precision': float((oos_pred & oos_true).sum()/max(1, oos_pred.sum())),
                 'invalid': int(len(ids) - sum(ok)), 'missing': int(sum(r is None for r in recs)),
                 'brier_top': float(np.mean((p - correct)**2)), 'ece_top': ece, 'reliability': rel,
                 'mean_p': float(p.mean()), 'p_at_1': int((p >= 0.99).sum()), 'wrong_at_p_ge_0.9': int(((p >= 0.9) & ~correct).sum()),
                 'latency_p50': pct(lat, 50), 'latency_p95': pct(lat, 95),
                 'cost_total': cost([r for r in recs if r]), 'cost_per_1k': cost([r for r in recs if r])/len(ids)*1000,
                 'prompt_tokens_mean': float(np.mean([(r.get('usage') or {}).get('input_tokens') or (r.get('usage') or {}).get('prompt_tokens') or 0 for r in recs if r])),
                 'per_route_accuracy': {k: float(correct[truth == k].mean()) for k in routes},
                 'confusion': confusion_matrix(truth, pred, labels=routes).tolist()}
            if name == 'jev':
                probs = [r['parsed']['probabilities'] if o else None for r, o in zip(recs, ok)]
                m['brier_multiclass'] = float(np.mean([sum((q.get(k, 0) - (k == t))**2 for k in routes) for q, t in zip(probs, truth) if q]))
                m['choice_not_argmax'] = int(sum(o and not r['parsed']['choice_is_argmax'] for r, o in zip(recs, ok)))
                m['rounded_sum_off'] = int(sum(o and abs(sum(r['parsed']['probabilities'].values()) - 1) > 1e-9 for r, o in zip(recs, ok)))
                m['models_returned'] = dict(Counter(r.get('model_returned') for r in recs if r))
            m['selective'], m['selective_at'] = selective(p, correct)
            res[name] = m; preds[name] = pred; ps[name] = p
        cj, cl = preds['jev'] == truth, preds['luna'] == truth
        res['agreement'] = float((preds['jev'] == preds['luna']).mean())
        res['only_jev_right'] = int((cj & ~cl).sum()); res['only_luna_right'] = int((cl & ~cj).sum())
        res['accuracy_diff_ci'] = boot_diff(cj.astype(float), cl.astype(float), np.mean)
        # Cascade: accept Jev when its probability clears t, otherwise pay for Luna's answer as well.
        jev_cost = np.array([(calls[('route_jev', 0)][i].get('usage') or {}).get('cost', 0) for i in ids])
        luna_cost = np.array([(calls[('route_luna', 0)][i].get('usage') or {}).get('cost', 0) for i in ids])
        cascade = []
        for t in np.round(np.arange(0, 1.0001, 0.01), 2):
            keep = ps['jev'] >= t
            acc = float(np.where(keep, cj, cl).mean())
            cascade.append({'t': float(t), 'jev_share': float(keep.mean()), 'accuracy': acc,
                            'cost_per_1k': float((jev_cost.sum() + luna_cost[~keep].sum())/len(ids)*1000)})
        res['cascade'] = cascade
        res['_ids'] = ids; res['_p'] = ps; res['_correct'] = {'jev': cj, 'luna': cl}
        res['cascade_best'] = max(cascade, key=lambda c: (round(c['accuracy'], 6), c['jev_share']))
        out[split] = res
    # Selective routing with the threshold fixed on dev, then applied to test.
    out['selective_dev_selected'] = {}
    for name in ('jev', 'luna'):
        for g, point in out['dev'][name]['selective_at'].items():
            keep = out['test']['_p'][name] >= point['t']
            out['selective_dev_selected'][f'{name}/{g}'] = {'t': point['t'], 'coverage': float(keep.mean()),
                                                           'accuracy': float(out['test']['_correct'][name][keep].mean())}
    for split in ('dev', 'test'):
        del out[split]['_p'], out[split]['_correct']
    best = max(out['dev']['cascade'], key=lambda c: (round(c['accuracy'], 6), c['jev_share']))
    out['dev_threshold'] = best['t']
    out['test_at_dev_threshold'] = next(c for c in out['test']['cascade'] if c['t'] == best['t'])
    serial = {name: [r['latency_s'] for r in calls[(f'route_{name}', 1)].values() if 'latency_s' in r] for name in ('jev', 'luna')}
    out['serial_latency'] = {k: {'n': len(v), 'p50': pct(v, 50), 'p95': pct(v, 95), 'min': min(v) if v else None, 'max': max(v) if v else None, 'values': v}
                             for k, v in serial.items()}
    out['concurrent_latency_values'] = {name: [calls[(f'route_{name}', 0)][i]['latency_s'] for i in out['test']['_ids']] for name in ('jev', 'luna')}
    return out

def tier_task(rows, calls):
    out = {}
    for split in ('dev', 'test'):
        ids = [i for i, r in rows['mmlu'].items() if r['split'] == split]
        luna_ok = np.array([calls[('answer_luna', 0)][i]['parsed']['correct'] for i in ids], float)
        sol_ok = np.array([calls[('answer_sol', 0)][i]['parsed']['correct'] for i in ids], float)
        luna_c = np.array([calls[('answer_luna', 0)][i]['usage']['cost'] for i in ids])
        sol_c = np.array([calls[('answer_sol', 0)][i]['usage']['cost'] for i in ids])
        res = {'n': len(ids), 'luna_accuracy': float(luna_ok.mean()), 'sol_accuracy': float(sol_ok.mean()),
               'oracle_accuracy': float(np.maximum(luna_ok, sol_ok).mean()),
               'both_wrong': int(((luna_ok == 0) & (sol_ok == 0)).sum()), 'luna_right_sol_wrong': int(((luna_ok == 1) & (sol_ok == 0)).sum()),
               'luna_cost_per_1k': float(luna_c.mean()*1000), 'sol_cost_per_1k': float(sol_c.mean()*1000),
               'sol_completion_tokens_mean': float(np.mean([calls[('answer_sol', 0)][i]['usage'].get('completion_tokens', 0) for i in ids])),
               'sol_latency_p50': pct([calls[('answer_sol', 0)][i]['latency_s'] for i in ids], 50),
               'luna_latency_p50': pct([calls[('answer_luna', 0)][i]['latency_s'] for i in ids], 50),
               # A perfect router picks one answering model up front: Luna when Luna is right, otherwise Sol.
               'oracle_cost_per_1k': float(np.where(luna_ok == 1, luna_c, sol_c).mean()*1000),
               'per_category': {}}
        cats = np.array([rows['mmlu'][i]['category'] for i in ids])
        for c in sorted(set(cats)):
            res['per_category'][c] = {'n': int((cats == c).sum()), 'luna': float(luna_ok[cats == c].mean()), 'sol': float(sol_ok[cats == c].mean())}
        ps = {}
        for name in ('jev', 'luna'):
            recs = [calls[(f'tier_{name}', 0)][i] for i in ids]
            p = np.array([r['parsed']['p'] for r in recs])
            router_c = np.array([r['usage']['cost'] for r in recs])
            rel, ece = reliability(p, luna_ok)
            frontier = []
            for t in sorted(set(np.round(p, 4)) | {0.0, 1.01}):
                to_luna = p >= t
                frontier.append({'t': float(t), 'luna_share': float(to_luna.mean()),
                                 'accuracy': float(np.where(to_luna, luna_ok, sol_ok).mean()),
                                 'cost_per_1k': float((router_c + np.where(to_luna, luna_c, sol_c)).mean()*1000)})
            ps[name] = p
            res[name] = {'auroc': float(roc_auc_score(luna_ok, p)), 'brier': float(np.mean((p - luna_ok)**2)), 'ece': ece,
                         'reliability': rel, 'mean_p': float(p.mean()), 'distinct_values': int(len(set(np.round(p, 4)))),
                         'value_counts': dict(Counter(map(lambda v: f'{v:.2f}', p)).most_common(8)),
                         'router_cost_per_1k': float(router_c.mean()*1000),
                         'latency_p50': pct([r['latency_s'] for r in recs], 50), 'latency_p95': pct([r['latency_s'] for r in recs], 95),
                         'frontier': frontier}
        rng = np.random.default_rng(RNG_SEED); diffs = []
        for _ in range(BOOT):
            i = rng.integers(0, len(ids), len(ids))
            if 0 < luna_ok[i].sum() < len(i):
                diffs.append(roc_auc_score(luna_ok[i], ps['jev'][i]) - roc_auc_score(luna_ok[i], ps['luna'][i]))
        res['auroc_diff_ci'] = [float(np.percentile(diffs, 2.5)), float(np.percentile(diffs, 97.5))]
        res['_ids'] = ids
        out[split] = res
    # Operating point chosen on dev: the cheapest threshold whose accuracy is within 2 points of always-Sol.
    for name in ('jev', 'luna'):
        target = out['dev']['sol_accuracy'] - 0.02
        ok = [f for f in out['dev'][name]['frontier'] if f['accuracy'] >= target]
        t = min(ok, key=lambda f: f['cost_per_1k'])['t'] if ok else 0.0
        test = out['test'][name]['frontier']
        p = np.array([calls[(f'tier_{name}', 0)][i]['parsed']['p'] for i in out['test']['_ids']])
        luna_ok = np.array([calls[('answer_luna', 0)][i]['parsed']['correct'] for i in out['test']['_ids']], float)
        sol_ok = np.array([calls[('answer_sol', 0)][i]['parsed']['correct'] for i in out['test']['_ids']], float)
        luna_c = np.array([calls[('answer_luna', 0)][i]['usage']['cost'] for i in out['test']['_ids']])
        sol_c = np.array([calls[('answer_sol', 0)][i]['usage']['cost'] for i in out['test']['_ids']])
        rc = np.array([calls[(f'tier_{name}', 0)][i]['usage']['cost'] for i in out['test']['_ids']])
        to_luna = p >= t
        out[f'{name}_operating_point'] = {'t': t, 'luna_share': float(to_luna.mean()), 'accuracy': float(np.where(to_luna, luna_ok, sol_ok).mean()),
                                          'cost_per_1k': float((rc + np.where(to_luna, luna_c, sol_c)).mean()*1000)}
        del test
    return out

def main():
    rows, calls = load()
    a, b = route_task(rows, calls), tier_task(rows, calls)
    everything = [r for kind in calls.values() for r in kind.values()]
    spend = {'total_usd': cost(everything), 'calls_with_response': len(everything),
             'by_kind': {f'{k}/{p}': round(cost(v.values()), 6) for (k, p), v in sorted(calls.items())}}
    analysis = {'route': a, 'tier': b, 'spend': spend}
    (ROOT/'run/analysis.json').write_text(json.dumps(analysis, indent=1, default=float))
    ex_rows = []
    for i in a['test']['_ids']:
        r, j, l = rows['clinc'][i], calls[('route_jev', 0)][i], calls[('route_luna', 0)][i]
        top = sorted(j['parsed']['probabilities'].items(), key=lambda kv: -kv[1])[:3] if j['status'] == 'ok' else []
        ex_rows.append({'text': r['text'], 'route': r['route'], 'intent': r['intent'],
                        'jev': j['parsed']['route'] if j['status'] == 'ok' else None, 'pJev': j['parsed']['p'] if j['status'] == 'ok' else None,
                        'jevTop': top, 'luna': l['parsed']['route'] if l['status'] == 'ok' else None, 'pLuna': l['parsed']['p'] if l['status'] == 'ok' else None})
    tier_rows = []
    for i in b['test']['_ids']:
        r = rows['mmlu'][i]
        tier_rows.append({'q': r['question'], 'options': r['options'], 'category': r['category'], 'answer': r['answer'],
                          'lunaAnswer': calls[('answer_luna', 0)][i]['parsed']['answer'], 'solAnswer': calls[('answer_sol', 0)][i]['parsed']['answer'],
                          'lunaOk': calls[('answer_luna', 0)][i]['parsed']['correct'], 'solOk': calls[('answer_sol', 0)][i]['parsed']['correct'],
                          'pJev': calls[('tier_jev', 0)][i]['parsed']['p'], 'pLuna': calls[('tier_luna', 0)][i]['parsed']['p']})
    strip = lambda d: {k: v for k, v in d.items() if not k.startswith('_')}
    evidence = {'route': {'test': strip(a['test']), 'dev_threshold': a['dev_threshold'], 'test_at_dev_threshold': a['test_at_dev_threshold'],
                          'selective_dev_selected': a['selective_dev_selected'],
                          'serial_latency': a['serial_latency'], 'concurrent_latency_values': a['concurrent_latency_values'], 'rows': ex_rows,
                          'routes': list(Q.ROUTES)},
                'tier': {'test': strip(b['test']), 'jev_operating_point': b['jev_operating_point'], 'luna_operating_point': b['luna_operating_point'], 'rows': tier_rows},
                'spend': spend}
    SITE.parent.mkdir(parents=True, exist_ok=True)
    SITE.write_text(json.dumps(evidence, separators=(',', ':'), default=float))
    t = a['test']
    print(f"A test  Jev acc {t['jev']['accuracy']:.3f} F1 {t['jev']['macro_f1']:.3f} | Luna acc {t['luna']['accuracy']:.3f} F1 {t['luna']['macro_f1']:.3f} | diff CI {t['accuracy_diff_ci']}")
    t = b['test']
    print(f"B test  Luna {t['luna_accuracy']:.3f} Sol {t['sol_accuracy']:.3f} | AUROC Jev {t['jev']['auroc']:.3f} Luna {t['luna']['auroc']:.3f} diff CI {t['auroc_diff_ci']}")
    print('spend $', round(spend['total_usd'], 4))

if __name__ == '__main__':
    main()
