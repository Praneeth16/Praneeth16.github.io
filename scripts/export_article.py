"""Build a portable HTML edition after npm run build; recorded charts work offline."""
from pathlib import Path
import base64,json,mimetypes,re
root=Path(__file__).resolve().parents[1]
def data_url(url):
 p=root/'public'/url.lstrip('/')
 mime=mimetypes.guess_type(p)[0] or 'application/octet-stream'
 return f'data:{mime};base64,'+base64.b64encode(p.read_bytes()).decode()
html=(root/'dist/blog/adapting-jev-with-gepa/index.html').read_text()
fonts=(root/'public/fonts/fonts.css').read_text()
fonts=re.sub(r'url\((/fonts/[^)]+)\)',lambda m:'url('+data_url(m[1])+')',fonts)
def css_embed(m):
 css=(root/'dist'/m[1].lstrip('/')).read_text()
 css=re.sub(r'@import\s*url\([^)]*fonts.css[^)]*\);?',lambda _:fonts,css)
 css=re.sub(r'url\((/fonts/[^)]+)\)',lambda m:'url('+data_url(m[1])+')',css)
 return '<style>'+css+'</style>'
html=re.sub(r'<link rel="stylesheet" href="([^"]+)"[^>]*>',css_embed,html)
html=re.sub(r'((?:src|data-expand)=")(/jev/[^" ]+\.svg)(")',lambda m:m[1]+data_url(m[2])+m[3],html)
evidence=(root/'public/jev/evidence.json').read_text().replace('<','\\u003c')
js=(root/'public/jev/explorers.js').read_text()
html=re.sub(r'<script[^>]*src="/jev/explorers.js"[^>]*></script>',lambda _:'<script id="jev-evidence" type="application/json">'+evidence+'</script><script type="module">'+js+'</script>',html)
html=re.sub(r'(href=")(/[^" ]*)(")',r'\1https://praneeth16.github.io\2\3',html)
assert '/fonts/type-' not in html
assert 'id="jev-evidence"' in html
(root/'public/jev/article.html').write_text(html)
print('Portable article:',len(html.encode()),'bytes')
