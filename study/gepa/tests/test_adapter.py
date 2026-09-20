"""Offline checks of integration boundaries; no credentials or paid calls."""
from contextlib import contextmanager
from pathlib import Path
import io,json,sys,tempfile,unittest
from unittest.mock import patch

sys.path.insert(0,str(Path(__file__).resolve().parents[1]))
from experiment import CONFIG,JevAdapter,seed_candidate,validate_candidate

def response(model=None):
    return {'model':model or CONFIG['model'], 'answers':{'ade':{'type':'choice',
            'probabilities':{'ade_related':.75,'not_related':.25},'choice':'ade_related','confidence':.5}},
            'usage':{'input_tokens':20,'output_tokens':2}}

class AdapterBoundaryTests(unittest.TestCase):
    def test_batch_snapshot_recovers_an_incomplete_journal(self):
        calls=[]
        @contextmanager
        def serve(req,timeout):
            calls.append(req)
            yield io.BytesIO(json.dumps(response()).encode())
        with tempfile.TemporaryDirectory() as tmp,patch('urllib.request.urlopen',serve):
            adapter=JevAdapter('offline-placeholder',Path(tmp))
            rows=[{'id':str(i),'label':i,'text':'Example '+str(i),'split':'train'} for i in range(2)]
            evaluated=adapter.evaluate(rows,seed_candidate())
            (Path(tmp)/'calls.jsonl').write_text('')
            recovered=JevAdapter('offline-placeholder',Path(tmp))
            self.assertEqual(recovered.call(rows[0],seed_candidate()),evaluated.outputs[0])
            self.assertEqual(recovered.call(rows[1],seed_candidate()),evaluated.outputs[1])
            self.assertEqual(len(calls),2)

    def test_request_keeps_labels_local_and_reuses_completed_response(self):
        captured=[]
        @contextmanager
        def serve(req,timeout):
            captured.append((dict(req.header_items()),json.loads(req.data)))
            yield io.BytesIO(json.dumps(response()).encode())
        with tempfile.TemporaryDirectory() as tmp,patch('urllib.request.urlopen',serve):
            adapter=JevAdapter('offline-placeholder',Path(tmp))
            row={'id':'local-id','label':1,'text':'Public test sentence.','split':'train'}
            first=adapter.call(row,seed_candidate());second=adapter.call(row,seed_candidate())
            self.assertEqual(first,second);self.assertEqual(len(captured),1)
            self.assertEqual(captured[0][1]['state'],'Public test sentence.')
            self.assertEqual(set(captured[0][1]),{'model','state','questions'})
            self.assertNotIn('offline-placeholder',(Path(tmp)/'calls.jsonl').read_text())
            self.assertNotIn('Public test sentence.',(Path(tmp)/'calls.jsonl').read_text())

    def test_returned_model_must_match_pin(self):
        @contextmanager
        def serve(req,timeout):yield io.BytesIO(json.dumps(response('different-model')).encode())
        with tempfile.TemporaryDirectory() as tmp,patch('urllib.request.urlopen',serve):
            adapter=JevAdapter('offline-placeholder',Path(tmp))
            with self.assertRaises(RuntimeError):
                adapter.call({'id':'x','label':0,'text':'Example.','split':'validation'},seed_candidate())
            logged=json.loads((Path(tmp)/'calls.jsonl').read_text())
            self.assertEqual(logged['status'],'error');self.assertFalse(adapter.cache)

    def test_test_examples_cannot_enter_reflection(self):
        from gepa.core.adapter import EvaluationBatch
        batch=EvaluationBatch(outputs=[{}],scores=[.9],trajectories=[{'row':{'split':'test'},'result':{}}])
        with tempfile.TemporaryDirectory() as tmp:
            adapter=JevAdapter('offline-placeholder',Path(tmp))
            with self.assertRaises(ValueError):adapter.make_reflective_dataset(seed_candidate(),batch,['instructions'])

    def test_optimizer_cannot_change_label_keys(self):
        with self.assertRaises(ValueError):validate_candidate({'instructions':'x','yes':'a','no':'b'})

if __name__=='__main__':unittest.main()
