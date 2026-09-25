"""Serve render.html and save what it POSTs into public/system-one/diagrams. Local use only."""
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
import re
ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT/'public/system-one/diagrams'
class Handler(SimpleHTTPRequestHandler):
    def __init__(self, *a, **k): super().__init__(*a, directory=str(ROOT), **k)
    def do_POST(self):
        name = self.path.rsplit('/', 1)[-1]
        if not re.fullmatch(r'[\w.-]+\.(svg|png|excalidraw)', name):
            self.send_error(400); return
        (OUT/name).write_bytes(self.rfile.read(int(self.headers['Content-Length'])))
        self.send_response(204); self.end_headers()
ThreadingHTTPServer(('127.0.0.1', 8766), Handler).serve_forever()
