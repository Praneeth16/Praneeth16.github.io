from pathlib import Path
import re,json,math
import markdown
root=Path(__file__).resolve().parents[1]
s=(root/'src/content/jev-article.md').read_text()
# The page layout owns the title, subtitle, and byline.
s=s.split('\n\n',3)[3]
md=markdown.Markdown(extensions=['tables','fenced_code','codehilite','toc'],extension_configs={'codehilite':{'guess_lang':False}})
body=md.convert(s)
body=re.sub(r'<a href="#ref-(\d+)">(\d+)</a>',r'<a class="citation" href="#ref-\1" aria-label="Reference \1">[\2]</a>',body)
body=re.sub(r'<table>(.*?)</table>',r'<div class="table-wrap"><table>\1</table></div>',body,flags=re.S)
widgets={'04-test-performance':'metrics','05-calibration':'calibration','06-review-workload':'routing','07-latency-cost':'latency','10-gepa-search-results':'paired','11-gepa-errors':'errors'}
def image(m):
 alt,src=m.groups();url='/jev/'+src
 name=Path(src).stem
 if name in widgets:
  return f'<div class="interactive" data-jev="{widgets[name]}" data-stage="1"><img src="{url}" alt="{alt}" loading="lazy"/><noscript><p class="widget-note">Enable JavaScript to explore these saved results.</p></noscript></div>'
 source='/jev/'+str(Path(src).with_suffix('.excalidraw'))
 return f'<figure class="breakout diagram"><img src="{url}" alt="{alt}" loading="lazy"/><div class="figure-tools"><button class="inline-link" data-expand="{url}" data-alt="{alt}">Expand diagram</button><a href="{source}" download>Editable Excalidraw ↗</a></div></figure>'
body=re.sub(r'<p><img alt="([^"]*)" src="([^"]+)" /></p>',image,body)
body=re.sub(r'<p><em>((?:Figure \d+|Table \d+|Interactive companion)\..*?)</em></p>',r'<p class="caption">\1</p>',body,flags=re.S)
for name,kind in [('dataset','dataset'),('prompts','prompts'),('routing2','routing')]:
 body=body.replace(f'<!-- explorer:{name} -->',f'<div class="interactive" data-jev="{kind}"'+(' data-stage="2"' if name=='routing2' else '')+'><noscript><p class="widget-note">Enable JavaScript to explore the saved study records. Numerical results are in the adjacent tables.</p></noscript></div>')
body=body.replace('<h2 id="references">References</h2>','<section class="references" aria-labelledby="references"><h2 id="references">References</h2>')+'</section>'
(root/'src/generated/article.html').write_text(body)
(root/'src/generated/contents.html').write_text(md.toc)
(root/'src/generated/article-meta.json').write_text(json.dumps({'readingMinutes':math.ceil(len(s.split('## References')[0].split())/220)})+'\n')
assert body.count('data-jev=')==9
print('Compiled article with nine interactive views')
