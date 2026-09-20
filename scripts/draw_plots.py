"""Publication figures drawn from recorded evidence, using the site's font palette."""
from pathlib import Path
import json
import numpy as np
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
from matplotlib import font_manager
root=Path(__file__).resolve().parents[1];data=json.loads((root/'public/jev/evidence.json').read_text());out=root/'public/jev/figures';out.mkdir(exist_ok=True)
for p in (root/'public/fonts').glob('*.ttf'):font_manager.fontManager.addfont(p)
plt.rcParams.update({'font.family':'Schibsted Grotesk','font.size':11,'axes.labelcolor':'#59605d','text.color':'#292c2b','xtick.color':'#626965','ytick.color':'#626965','axes.edgecolor':'#cbd0cc','axes.spines.top':False,'axes.spines.right':False,'figure.facecolor':'white','axes.facecolor':'white','svg.fonttype':'path'})
BLUE='#557f91';PURPLE='#8a709b';GRAY='#a2a5a4';RUST='#b45445';GREEN='#4e8766'
def save(fig,name):
 fig.savefig(out/(name+'.svg'),bbox_inches='tight',pad_inches=.16)
 fig.savefig(out/(name+'.png'),dpi=180,bbox_inches='tight',pad_inches=.16)
 plt.close(fig)
def tidy(ax):ax.grid(axis='y',color='#e8ebe7',linewidth=.7);ax.set_axisbelow(True)
def bar_numbers(ax,bars):
 for b in bars:ax.text(b.get_x()+b.get_width()/2,b.get_height()+1.5,f'{b.get_height():.1f}',ha='center',fontsize=10)
a=data['firstAnalysis'];b=data['secondAnalysis']
fig,ax=plt.subplots(figsize=(10,4.2));x=np.arange(3)
for i,(key,name,col) in enumerate([('baseline_default','Baseline · default',GRAY),('baseline_validation_f1','Baseline · tuned','#a38b6e'),('jev','Original Jev',BLUE)]):
 bars=ax.bar(x+(i-1)*.23,[a[key][k]*100 for k in ['ade_precision','ade_recall','ade_f1']],.215,label=name,color=col);bar_numbers(ax,bars)
ax.set(xticks=x,xticklabels=['Precision','Recall','ADE F1'],ylabel='Percent',ylim=(0,109));tidy(ax);ax.legend(frameon=False,loc='upper center',bbox_to_anchor=(.5,-.11),ncol=3,fontsize=10);save(fig,'04-test-performance')
fig,axes=plt.subplots(1,2,figsize=(10,4.1),sharey=True)
for ax,key,title,col in zip(axes,['baseline','jev'],['Local baseline','Original Jev'],[GRAY,BLUE]):
 bins=a[key+'_reliability'];xx=[v['p_mean'] for v in bins];yy=[v['observed_ade'] for v in bins];error=np.array([[v['observed_ade']-v['wilson_95'][0] for v in bins],[v['wilson_95'][1]-v['observed_ade'] for v in bins]])
 ax.plot([0,1],[0,1],color='#c2c7c2',ls='--',lw=1);ax.errorbar(xx,yy,yerr=np.maximum(0,error),fmt='o-',color=col,lw=1.5,capsize=2,ms=5)
 ax.set(xlabel='Predicted P(ADE)',title=title,xlim=(-.04,1.04),ylim=(-.05,1.05));tidy(ax)
axes[0].set_ylabel('Observed positive fraction');fig.tight_layout();save(fig,'05-calibration')
fig,axes=plt.subplots(1,2,figsize=(10,3.6),gridspec_kw={'width_ratios':[1.5,1]})
rows=[a['baseline_routing'],a['jev_routing']];names=['Local baseline','Original Jev'];review=[r['review_count'] for r in rows];defer=[r['lower_priority_count'] for r in rows]
axes[0].barh(names,review,color=BLUE,label='Review');axes[0].barh(names,defer,left=review,color='#d9ddda',label='Lower priority');axes[0].invert_yaxis();axes[0].set(xlim=(0,300),xlabel='Sentences')
for i,(rev,de) in enumerate(zip(review,defer)):axes[0].text(rev/2,i,str(rev),ha='center',va='center',color='white');axes[0].text(rev+de/2,i,str(de),ha='center',va='center')
axes[0].legend(frameon=False,fontsize=10,loc='upper center',bbox_to_anchor=(.5,-.18),ncol=2)
axes[1].bar(names,[6,3],color=RUST);axes[1].set(ylabel='Positive cases deferred',ylim=(0,7),yticks=range(0,8));tidy(axes[1]);fig.tight_layout(w_pad=3);save(fig,'06-review-workload')
fig,axes=plt.subplots(1,2,figsize=(10,3.8))
for ax,key,title,col in zip(axes,['first','second'],['Experiment 1 · 300 test calls','Experiment 2 · 1,257 preserved calls'],[BLUE,PURPLE]):
 values=data['timing'][key];ax.hist(values,bins=16,color=col,rwidth=.94);ax.set(title=title,xlabel='Seconds per request',ylabel='Requests');tidy(ax)
 fig.text(.09 if key=='first' else .58,.02,f'Median {np.median(values):.2f} s · p95 {np.percentile(values,95):.2f} s',fontsize=10,color='#666d68')
fig.tight_layout(rect=(0,.065,1,1));save(fig,'07-latency-cost')
fig,axes=plt.subplots(1,2,figsize=(10,3.9),gridspec_kw={'width_ratios':[1,1.35]})
c=data['candidates'];axes[0].plot([r['index'] for r in c],[r['brier'] for r in c],'o-',color=PURPLE,lw=1.6);axes[0].set(xlabel='Candidate index',ylabel='Validation Brier',xticks=range(5),ylim=(.07,.14));tidy(axes[0]);axes[0].annotate('Selected',xy=(2,c[2]['brier']),xytext=(2,.073),ha='center',fontsize=10,color=PURPLE,arrowprops={'arrowstyle':'->','color':PURPLE,'lw':1})
x=np.arange(3)
for i,(key,name,col) in enumerate([('original','Original',BLUE),('gepa','GEPA-selected',PURPLE)]):
 bars=axes[1].bar(x+(i-.5)*.32,[b[key][k]*100 for k in ['precision','recall','f1']],.30,label=name,color=col);bar_numbers(axes[1],bars)
axes[1].set(xticks=x,xticklabels=['Precision','Recall','ADE F1'],ylim=(0,106),ylabel='Fresh test · percent');axes[1].legend(frameon=False,loc='upper center',bbox_to_anchor=(.5,-.12),ncol=2,fontsize=10);tidy(axes[1]);fig.tight_layout(w_pad=3);save(fig,'10-gepa-search-results')
fig,axes=plt.subplots(1,2,figsize=(9.5,4.4))
from matplotlib.colors import LinearSegmentedColormap
cmap=LinearSegmentedColormap.from_list('quiet',['#f6f8f5','#dbe8df','#4b7864'])
for ax,key,title in zip(axes,['original','gepa'],['Original Jev','GEPA-selected Jev']):
 matrix=np.array(b[key]['confusion_matrix']);ax.imshow(matrix,cmap=cmap,vmin=0,vmax=239)
 for i in range(2):
  for j in range(2):ax.text(j,i,str(matrix[i,j]),ha='center',va='center',fontsize=27,color='white' if matrix[i,j]>150 else '#303833')
 ax.set(xticks=[0,1],yticks=[0,1],xticklabels=['Not related','ADE-related'],yticklabels=['Not related','ADE-related'],xlabel='Prediction',ylabel='Corpus label',title=title)
 for spine in ax.spines.values():spine.set_visible(False)
fig.tight_layout(w_pad=3);save(fig,'11-gepa-errors')
print('Rendered six figures in PNG and SVG')
