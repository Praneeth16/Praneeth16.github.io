import json
import sys
from pathlib import Path

import numpy as np
import pytest

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))
import questions as Q
import run
from analyze import reliability, selective, wilson

ROW = {'id': 'x', 'split': 'test', 'text': 'book me a flight to lisbon', 'route': 'travel'}
MMLU = {'id': 'y', 'split': 'test', 'question': 'What is 2+2?', 'options': ['3', '4', '5'], 'answer': 'B'}

def jev_body(probabilities, choice):
    return {'answers': {'route': {'type': 'choice', 'choice': choice, 'confidence': 0.9, 'probabilities': probabilities}}}

def uniform_except(top, p):
    rest = (1 - p) / (len(Q.ROUTES) - 1)
    return {k: (p if k == top else rest) for k in Q.ROUTES}

def test_jev_route_accepts_two_decimal_rounding():
    probs = {k: 0.0 for k in Q.ROUTES}; probs.update(travel=0.93, utility=0.05, meta=0.01)  # sums to 0.99
    parsed = run.jev_route(ROW)[2](jev_body(probs, 'travel'))
    assert parsed['route'] == 'travel' and parsed['p'] == 0.93 and parsed['choice_is_argmax']

def test_jev_route_flags_choice_that_is_not_argmax_by_rounding():
    probs = {k: 0.0 for k in Q.ROUTES}; probs.update(meta=0.44, out_of_scope=0.45, small_talk=0.11)
    assert run.jev_route(ROW)[2](jev_body(probs, 'meta'))['choice_is_argmax'] is False

@pytest.mark.parametrize('probs,choice', [
    ({'travel': 1.0}, 'travel'),                        # missing options
    (uniform_except('travel', 0.2) | {'utility': 0.5}, 'travel'),  # choice far below the max
    ({k: 0.5 for k in Q.ROUTES}, 'travel'),             # does not sum to one
])
def test_jev_route_rejects_bad_schema(probs, choice):
    with pytest.raises(ValueError):
        run.jev_route(ROW)[2](jev_body(probs, choice))

def chat_body(obj):
    return {'choices': [{'message': {'content': json.dumps(obj)}}]}

def test_luna_route_parse_and_reject():
    parse = run.luna_route(ROW)[2]
    assert parse(chat_body({'route': 'travel', 'confidence': 0.8})) == {'route': 'travel', 'p': 0.8}
    for bad in [{'route': 'flights', 'confidence': 0.8}, {'route': 'travel', 'confidence': 1.2}]:
        with pytest.raises(ValueError):
            parse(chat_body(bad))

def test_answer_parser_scores_letter():
    url, payload, parse = run.KINDS['answer_luna'][1](MMLU)
    assert payload['response_format']['json_schema']['schema']['properties']['answer']['enum'] == ['A', 'B', 'C']
    assert parse(chat_body({'answer': 'B'}))['correct'] and not parse(chat_body({'answer': 'A'}))['correct']

def test_routers_get_identical_criteria_text():
    _, jev, _ = run.jev_route(ROW); _, luna, _ = run.luna_route(ROW)
    system = luna['messages'][0]['content']
    assert jev['questions']['route']['criteria'] == Q.ROUTES
    assert all(v in system for v in Q.ROUTES.values()) and Q.ROUTE_INSTRUCTIONS in system
    _, jt, _ = run.jev_tier(MMLU); _, lt, _ = run.luna_tier(MMLU)
    assert jt['questions']['cheap_ok']['instructions'] == Q.TIER_INSTRUCTIONS
    assert Q.TIER_INSTRUCTIONS in lt['messages'][0]['content']

def test_luna_reasoning_is_off_and_provider_pinned():
    for build in (run.luna_route, run.luna_tier, run.KINDS['answer_luna'][1]):
        payload = build(MMLU if build is not run.luna_route else ROW)[1]
        assert payload['reasoning'] == {'effort': 'none'} and payload['provider']['order'] == ['OpenAI']

def test_criteria_contain_no_benchmark_utterance():
    rows = json.loads((ROOT/'inputs/clinc.json').read_text())
    text = ' '.join(Q.ROUTES.values()).lower()
    assert not [r['text'] for r in rows if len(r['text']) > 12 and r['text'].lower() in text]

def test_questions_frozen_for_recorded_run():
    config = json.loads((ROOT/'run/config.json').read_text())
    assert config['questions_digest'] == run.QUESTIONS_DIGEST

def test_reliability_and_wilson():
    bins, ece = reliability([0.05, 0.95, 0.95, 0.95], [0, 1, 1, 0])
    assert [b['n'] for b in bins] == [1, 3] and ece == pytest.approx(0.25*0.05 + 0.75*abs(0.95 - 2/3))
    lo, hi = wilson(8, 10)
    assert lo < 0.8 < hi and 0 <= lo and hi <= 1

def test_selective_moves_ties_together():
    curve, at = selective([1, 1, 0.5, 0.5], [1, 0, 1, 1])
    assert [c['coverage'] for c in curve] == [0.5, 1.0] and curve[0]['accuracy'] == 0.5
    assert at['0.8']['coverage'] == 1.0
