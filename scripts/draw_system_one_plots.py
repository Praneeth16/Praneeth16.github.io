"""Figures for the System One article, drawn from public/system-one/evidence.json with the site's fonts."""
from pathlib import Path
import json
import numpy as np
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import matplotlib.ticker
from matplotlib import font_manager
root=Path(__file__).resolve().parents[1];data=json.loads((root/'public/system-one/evidence.json').read_text());out=root/'public/system-one/figures';out.mkdir(exist_ok=True)
for p in (root/'public/fonts').glob('*.ttf'):font_manager.fontManager.addfont(p)
plt.rcParams.update({'font.family':'Schibsted Grotesk','font.size':11,'axes.labelcolor':'#59605d','text.color':'#292c2b','xtick.color':'#626965','ytick.color':'#626965','axes.edgecolor':'#cbd0cc','axes.spines.top':False,'axes.spines.right':False,'figure.facecolor':'none','axes.facecolor':'none','savefig.transparent':True,'svg.fonttype':'path'})
JEV='#4e8766';LUNA='#a38b6e';SOL='#8a709b';GRAY='#a2a5a4';RUST='#b45445'
def save(fig,name):
 fig.savefig(out/(name+'.svg'),bbox_inches='tight',pad_inches=.16)
 fig.savefig(out/(name+'.png'),dpi=180,bbox_inches='tight',pad_inches=.16)
 plt.close(fig)
def tidy(ax):ax.grid(axis='y',color='#e8ebe7',linewidth=.7);ax.set_axisbelow(True)
A=data['route']['test'];B=data['tier']['test']

fig,ax=plt.subplots(figsize=(7,3.6));x=np.arange(4);keys=['accuracy','macro_f1','oos_recall','oos_precision']
for i,(k,name,col) in enumerate([('jev','Jev 1.13',JEV),('luna','GPT-6 Luna',LUNA)]):
 bars=ax.bar(x+(i-.5)*.34,[A[k][m]*100 for m in keys],.32,label=name,color=col)
 for b in bars:ax.text(b.get_x()+b.get_width()/2,b.get_height()+1.5,f'{b.get_height():.1f}',ha='center',fontsize=10)
ax.set(xticks=x,xticklabels=['Accuracy','Macro-F1','Out-of-scope\nrecall','Out-of-scope\nprecision'],ylabel='Percent',ylim=(0,109));tidy(ax)
ax.legend(frameon=False,loc='upper center',bbox_to_anchor=(.5,-.2),ncol=2,fontsize=10);save(fig,'06-route-accuracy')

fig,ax=plt.subplots(figsize=(7,3.4))
lat=data['route']['concurrent_latency_values'];serial=data['route']['serial_latency']
bins=np.logspace(np.log10(.3),np.log10(4),40)
for k,name,col in [('jev','Jev 1.13',JEV),('luna','GPT-6 Luna',LUNA)]:
 ax.hist(lat[k],bins=bins,color=col,alpha=.85,label=f'{name} · p50 {np.median(lat[k]):.2f} s · p95 {np.percentile(lat[k],95):.2f} s')
ax.set_xscale('log');ax.set_xticks([.3,.4,.5,.7,1,1.5,2,3,4]);ax.set_xticklabels(['0.3','0.4','0.5','0.7','1','1.5','2','3','4']);ax.xaxis.set_minor_formatter(matplotlib.ticker.NullFormatter())
ax.set(xlabel='Seconds per request through OpenRouter (log scale)',ylabel='Requests');tidy(ax)
ax.legend(frameon=False,fontsize=10,loc='upper right');save(fig,'07-route-latency')

fig,axes=plt.subplots(1,2,figsize=(7,3.7),sharey=True)
for ax,k,title,col in zip(axes,['jev','luna'],['Jev 1.13\nprobability of its choice','GPT-6 Luna\nstated confidence'],[JEV,LUNA]):
 rel=A[k]['reliability'];xx=[v['p_mean'] for v in rel];yy=[v['observed'] for v in rel]
 err=np.array([[v['observed']-v['wilson_95'][0] for v in rel],[v['wilson_95'][1]-v['observed'] for v in rel]])
 ax.plot([0,1],[0,1],color='#c2c7c2',ls='--',lw=1);ax.errorbar(xx,yy,yerr=np.maximum(0,err),fmt='o-',color=col,lw=1.5,capsize=2,ms=5)
 for v in rel:ax.annotate(str(v['n']),(v['p_mean'],v['observed']),textcoords='offset points',xytext=(9,-12),ha='left',fontsize=8,color='#777')
 ax.set(xlabel='Stated probability\nthe route is right',title=title,xlim=(-.04,1.04),ylim=(-.05,1.08));tidy(ax)
 ax.text(.03,.95,f"ECE {A[k]['ece_top']:.3f} · Brier {A[k]['brier_top']:.3f}",transform=ax.transAxes,fontsize=10,color='#555')
axes[0].set_ylabel('Fraction routed correctly');fig.tight_layout();save(fig,'08-route-calibration')

fig,ax=plt.subplots(figsize=(7,3.6))
for k,name,col in [('jev','Jev 1.13',JEV),('luna','GPT-6 Luna',LUNA)]:
 c=A[k]['selective'];ax.plot([v['coverage']*100 for v in c],[v['accuracy']*100 for v in c],'o-',ms=3,color=col,lw=1.6,label=name)
ax.axvline(80,color='#c2c7c2',ls=':',lw=1)
for k,col in [('jev',JEV),('luna',LUNA)]:
 v=A[k]['selective_at']['0.8'];ax.plot(v['coverage']*100,v['accuracy']*100,'o',color=col);ax.annotate(f"{v['accuracy']*100:.1f}%",(v['coverage']*100,v['accuracy']*100),textcoords='offset points',xytext=(8,4),fontsize=10,color=col)
ax.set(xlabel='Share routed automatically (the rest go to a person), %',ylabel='Accuracy on routed share, %',xlim=(0,101),ylim=(84,101));tidy(ax)
ax.legend(frameon=False,fontsize=10,loc='lower left');save(fig,'09-route-selective')

fig,ax=plt.subplots(figsize=(7,4.2))
for k,name,col in [('jev','Jev 1.13 as router',JEV),('luna','GPT-6 Luna as router',LUNA)]:
 f=sorted(B[k]['frontier'],key=lambda v:v['cost_per_1k']);ax.plot([v['cost_per_1k'] for v in f],[v['accuracy']*100 for v in f],'-',color=col,lw=2,label=name)
pts=[('Always Luna',B['luna_cost_per_1k'],B['luna_accuracy'],LUNA,(6,-18)),('Always Sol',B['sol_cost_per_1k'],B['sol_accuracy'],SOL,(-8,10)),('Oracle',B['oracle_cost_per_1k'],B['oracle_accuracy'],GRAY,(10,-4))]
for name,c,a,col,off in pts:
 ax.plot(c,a*100,'s',color=col,ms=7,zorder=5);ax.annotate(name,(c,a*100),textcoords='offset points',xytext=off,ha='right' if off[0]<0 else 'left',fontsize=10,color='#555')
op=data['tier']['jev_operating_point'];ax.plot(op['cost_per_1k'],op['accuracy']*100,'o',ms=9,mfc='white',mec=JEV,mew=2)
ax.annotate('Jev threshold chosen on dev',(op['cost_per_1k'],op['accuracy']*100),textcoords='offset points',xytext=(-30,-72),ha='right',fontsize=10,color=JEV,arrowprops={'arrowstyle':'->','color':JEV,'lw':1})
ax.set(xlabel='Cost per 1,000 questions, router plus answering model, USD',ylabel='Answered correctly, %',ylim=(55,92));tidy(ax)
ax.legend(frameon=False,fontsize=10,loc='lower right');save(fig,'10-tier-frontier')

fig,axes=plt.subplots(1,2,figsize=(7,3.6),sharey=True)
rows=data['tier']['rows'];ok=np.array([r['lunaOk'] for r in rows])
for ax,k,title in zip(axes,['pJev','pLuna'],['Jev 1.13','GPT-6 Luna']):
 p=np.array([r[k] for r in rows]);b=np.linspace(0,1,21)
 ax.hist(p[ok],bins=b,color=JEV if k=='pJev' else LUNA,alpha=.9,label='Luna was right')
 ax.hist(p[~ok],bins=b,histtype='step',color=RUST,lw=2,label='Luna was wrong')
 ax.set(title=title,xlabel='Predicted probability\nthat Luna answers correctly');tidy(ax);ax.legend(frameon=False,fontsize=9,loc='upper left')
axes[0].set_ylabel('Questions');fig.tight_layout();save(fig,'11-tier-separation')
print('Rendered six figures in PNG and SVG')
