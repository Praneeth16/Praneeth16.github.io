from pathlib import Path
import re,json,math,html,sys
import markdown
root=Path(__file__).resolve().parents[1]
ARTICLES={
 'jev':dict(source='src/content/jev-article.md',out='src/generated',assets='/jev/',attr='data-jev',
  widgets={'04-test-performance':'metrics','05-calibration':'calibration','06-review-workload':'routing','07-latency-cost':'latency','10-gepa-search-results':'paired','11-gepa-errors':'errors'},
  explorers=[('dataset','dataset',''),('prompts','prompts',''),('routing2','routing',' data-stage="2"')],
  explorer_note='Enable JavaScript to explore the saved study records. Numerical results are in the adjacent tables.',
  labels=['What Jev is','Defining a decision','Confidence and calibration','The dataset and baseline','Baseline results','Inspecting confident errors',
   'Setting a review threshold','Adapting Jev with GEPA','Data splits and objective','The selected prompt','Fresh-test results','The review trade-off',
   'Latency and cost','Lessons for a domain workflow','Reproduce the experiments','References'],
  count=9,done='Compiled article with nine interactive views'),
 'system-one':dict(source='src/content/system-one-article.md',out='src/generated/system-one',assets='/system-one/',attr='data-s1',
  widgets={'06-route-accuracy':'routeMetrics','07-route-latency':'latency','09-route-selective':'selective','10-tier-frontier':'frontier'},
  explorers=[('disagreements','disagreements',''),('tier','tier','')],
  explorer_note='Enable JavaScript to explore the recorded benchmark calls. Numerical results are in the adjacent tables.',
  labels=['The short answer','Why a System 1','The System 2 detour','What a decision model is','Several ways to build one','Inside a harness',
   'Benchmark design','Task A: which specialist','What confidence is worth','Task B: which model','Limits','When to use which','Reproduce','References'],
  count=6,done='Compiled the System One article with six interactive views'),
}
def compile(name):
 c=ARTICLES[name];out=root/c['out'];out.mkdir(parents=True,exist_ok=True)
 s=(root/c['source']).read_text()
 subtitle=s.split('\n\n',3)[1].strip('*')
 # The page layout owns the title, subtitle, and byline.
 s=s.split('\n\n',3)[3]
 md=markdown.Markdown(extensions=['tables','fenced_code','codehilite','toc'],extension_configs={'codehilite':{'guess_lang':False}})
 body=md.convert(s)
 body=re.sub(r'<a href="#ref-(\d+)">(\d+)</a>',r'<a class="citation" href="#ref-\1" aria-label="Reference \1">[\2]</a>',body)
 body=re.sub(r'<table>(.*?)</table>',r'<div class="table-wrap"><table>\1</table></div>',body,flags=re.S)
 def image(m):
  alt,src=m.groups();url=c['assets']+src
  name=Path(src).stem
  if name in c['widgets']:
   return f'<div class="interactive" {c["attr"]}="{c["widgets"][name]}" data-stage="1"><img src="{url}" alt="{alt}" loading="lazy"/><noscript><p class="widget-note">Enable JavaScript to explore these saved results.</p></noscript></div>'
  if src.startswith('figures/'):
   return f'<figure class="breakout"><img src="{url}" alt="{alt}" loading="lazy"/></figure>'
  source=c['assets']+str(Path(src).with_suffix('.excalidraw'))
  return f'<figure class="breakout diagram"><img src="{url}" alt="{alt}" loading="lazy"/><div class="figure-tools"><button class="inline-link" data-expand="{url}" data-alt="{alt}">Expand diagram</button><a href="{source}" download>Editable Excalidraw ↗</a></div></figure>'
 body=re.sub(r'<p><img alt="([^"]*)" src="([^"]+)" /></p>',image,body)
 body=re.sub(r'<p><em>((?:Figure \d+|Table \d+|Interactive companion)\.(?:(?!</p>).)*?)</em></p>',r'<p class="caption">\1</p>',body,flags=re.S)
 for marker,kind,extra in c['explorers']:
  body=body.replace(f'<!-- explorer:{marker} -->',f'<div class="interactive" {c["attr"]}="{kind}"{extra}><noscript><p class="widget-note">{c["explorer_note"]}</p></noscript></div>')
 body=body.replace('<h2 id="references">References</h2>','<section class="references" aria-labelledby="references"><h2 id="references">References</h2>')+'</section>'
 (out/'article.html').write_text(body)
 labels=c['labels']
 assert len(md.toc_tokens)==len(labels)
 contents='<ul>\n'+''.join(f'<li><a href="#{html.escape(section["id"])}">{html.escape(label)}</a></li>\n' for section,label in zip(md.toc_tokens,labels))+'</ul>\n'
 (out/'contents.html').write_text(contents)
 (out/'article-meta.json').write_text(json.dumps({'readingMinutes':math.ceil(len(s.split('## References')[0].split())/220),'subtitle':subtitle})+'\n')
 if c['count'] is not None:assert body.count(c['attr']+'=')==c['count']
 print(c['done'])
for name in sys.argv[1:] or ['jev']:compile(name)
