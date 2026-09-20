exec(open('make_figures.py').read())
from matplotlib.gridspec import GridSpec

r=json.loads(Path('jev_article/results/analysis.json').read_text())
rows=[json.loads(x) for x in Path('jev_article/results/test_predictions.jsonl').read_text().splitlines()]
y=np.array([x['label'] for x in rows]);bp=np.array([x['baseline_p_ade'] for x in rows]);jp=np.array([x['jev_p_ade'] for x in rows])

fig=plt.figure(figsize=(13,6.2));gs=fig.add_gridspec(1,3,width_ratios=[1.65,1,1],left=.065,right=.97,bottom=.23,top=.72,wspace=.42)
fig.text(.05,.92,'Recall changes the comparison',fontsize=23,fontfamily='DejaVu Serif',weight='bold')
fig.text(.05,.845,'One test set: 61 ADE-related sentences and 239 negatives. No test labels were used to select thresholds.',fontsize=11,color=MUTED)
ax=fig.add_subplot(gs[0]);names=['baseline_default','baseline_validation_f1','jev'];labels=['Baseline, default','Baseline, val. F1','Jev'];colors=['#B8C2C8',PURPLE,TEAL]
xx=np.arange(3)
for i,(name,label,c) in enumerate(zip(names,labels,colors)):
 vals=[r[name][k]*100 for k in ['ade_precision','ade_recall','ade_f1']]
 bars=ax.bar(xx+(i-1)*.24,vals,.22,color=c,label=label)
 for b,v in zip(bars,vals):ax.text(b.get_x()+b.get_width()/2,v+1.5,f'{v:.0f}',ha='center',fontsize=9,color=c)
ax.set(xticks=xx,xticklabels=['Precision','Recall','ADE F1'],ylim=(0,112),ylabel='Percent');ax.spines['top'].set_visible(False)
ax.legend(frameon=False,loc='upper left',bbox_to_anchor=(-.08,-.15),ncol=1,fontsize=9.5)
for i,(name,title) in enumerate([('baseline_validation_f1','Baseline, validation F1'),('jev','Jev, threshold 0.5')]):
 ax=fig.add_subplot(gs[i+1]);rr=r[name];m=np.array([[rr['tn'],rr['fp']],[rr['fn'],rr['tp']]])
 ax.imshow(m,cmap='Greens' if i else 'Purples',vmin=0,vmax=239,alpha=.8)
 for yy in range(2):
  for x in range(2):ax.text(x,yy,str(m[yy,x]),ha='center',va='center',fontsize=21,weight='bold',color='white' if m[yy,x]>150 else INK)
 ax.set(xticks=[0,1],xticklabels=['Negative','ADE'],yticks=[0,1],yticklabels=['Negative','ADE'],xlabel='Predicted',ylabel='True label',title=title)
 for s in ax.spines.values():s.set_visible(False)
save(fig,'04-test-performance','Measured results, 300 sentences. The baseline threshold is selected on 200 validation sentences; Jev uses 0.5.')

fig=plt.figure(figsize=(12,7));gs=fig.add_gridspec(2,2,height_ratios=[3.2,1],left=.08,right=.95,bottom=.14,top=.76,hspace=.15,wspace=.29)
fig.text(.05,.92,'Calibration needs labels, and enough of them',fontsize=22,fontfamily='DejaVu Serif',weight='bold')
fig.text(.05,.855,'Mean predicted ADE probability versus observed ADE frequency; 95% Wilson intervals and bin counts.',fontsize=11,color=MUTED)
for i,(name,title,c) in enumerate([('baseline','TF-IDF + logistic regression',PURPLE),('jev','Jev',TEAL)]):
 bins=r[name+'_reliability'];x=np.array([b['p_mean'] for b in bins]);v=np.array([b['observed_ade'] for b in bins]);lo=np.array([b['wilson_95'][0] for b in bins]);hi=np.array([b['wilson_95'][1] for b in bins])
 ax=fig.add_subplot(gs[0,i]);ax.plot([0,1],[0,1],ls='--',c='#A9B3BB',lw=1)
 ax.errorbar(x,v,yerr=np.maximum(0,np.vstack([v-lo,hi-v])),fmt='o-',lw=1.5,markersize=6,color=c,capsize=3)
 ax.set(xlim=(-.025,1.025),ylim=(-.03,1.03),ylabel='Observed ADE fraction',title=title);ax.tick_params(labelbottom=False)
 bx=fig.add_subplot(gs[1,i],sharex=ax)
 centers=np.array([b['bin']/10+.05 for b in bins]);counts=[b['n'] for b in bins]
 bx.bar(centers,counts,width=.084,color=c,alpha=.65)
 for cx,n in zip(centers,counts):bx.text(cx,n+max(counts)*.035,str(n),ha='center',fontsize=9)
 bx.set(ylim=(0,max(counts)*1.28),ylabel='Count',xlabel='Predicted ADE probability')
save(fig,'05-calibration','300 test sentences. Bins are fixed at width 0.1. Empty bins have no point; narrow intervals at the extremes do not prove general calibration.')

fig=plt.figure(figsize=(12.8,6.4));gs=fig.add_gridspec(1,2,width_ratios=[1.4,1],left=.075,right=.96,bottom=.23,top=.75,wspace=.35)
fig.text(.05,.93,'What enters the lower-priority queue?',fontsize=23,fontfamily='DejaVu Serif',weight='bold')
fig.text(.05,.86,'Select a cutoff on validation, then count deferred work and deferred adverse events on test.',fontsize=11.5,color=MUTED)
ax=fig.add_subplot(gs[0]);ts=np.linspace(0,.4,81)
for name,p,c in [('baseline',bp,PURPLE),('jev',jp,TEAL)]:
 x=[100*(p<=t).mean() for t in ts];z=[int(((p<=t)&(y==1)).sum()) for t in ts]
 ax.plot(x,z,c=c,label='Baseline' if name=='baseline' else 'Jev',lw=2)
 rr=r[name+'_routing'];ax.scatter([rr['lower_priority_fraction']*100],[rr['true_ades_in_lower_priority']],s=85,c=c,edgecolor='white',zorder=5)
ax.set(xlabel='Sentences sent to lower priority (%)',ylabel='True ADEs sent to lower priority',xlim=(0,100),ylim=(-.5,None))
ax.legend(frameon=False);ax.text(.03,.95,'Dots mark validation-selected cutoffs',transform=ax.transAxes,va='top',fontsize=9.5,color=MUTED)
bx=fig.add_subplot(gs[1])
for yy,name in enumerate(['baseline','jev']):
 rr=r[name+'_routing'];review=rr['review_count'];bad=rr['true_ades_in_lower_priority'];low=rr['lower_priority_count']-bad
 bx.barh(yy,review,color=TEAL,height=.35);bx.barh(yy,low,left=review,color='#DCE3E7',height=.35);bx.barh(yy,bad,left=review+low,color=RED,height=.35)
 bx.text(5,yy,f'{review} review',va='center',color='white',fontsize=10)
 bx.text(review+low/2,yy,f'{low}',va='center',ha='center',fontsize=10)
 bx.text(300,yy+.30,f'{bad} true ADEs deferred; cutoff {rr["cutoff"]:.3f}',ha='right',fontsize=10,color=RED)
bx.set(yticks=[0,1],yticklabels=['Baseline','Jev'],xlabel='Test sentences',xlim=(0,300),ylim=(1.65,-.5))
from matplotlib.patches import Patch
bx.legend(handles=[Patch(color=TEAL,label='Review'),Patch(color='#DCE3E7',label='Deferred negative'),Patch(color=RED,label='Deferred ADE')],frameon=False,loc='upper left',bbox_to_anchor=(-.18,-.2),fontsize=8.5,ncol=3)
save(fig,'06-review-workload','Descriptive test curves; cutoffs came from validation. Lower priority means deferred review, not automatic discard.')

fig=plt.figure(figsize=(12,6));gs=fig.add_gridspec(1,2,width_ratios=[1.7,1],left=.08,right=.95,bottom=.21,top=.75,wspace=.30)
fig.text(.05,.92,'Our API measurements include the network',fontsize=23,fontfamily='DejaVu Serif',weight='bold')
fig.text(.05,.85,'End-to-end elapsed time around each HTTP request. Model inference time was not isolated.',fontsize=11.5,color=MUTED)
ax=fig.add_subplot(gs[0])
run=Path('jev_ade_cache/run_20260919T201046_419655Z')
for label,file,c in [('Serial smoke (n=5)','smoke',BLUE),('Test, up to 12 concurrent (n=300)','test',TEAL)]:
 rr=[json.loads(x) for x in (run/(file+'.jsonl')).read_text().splitlines()];a=np.sort([x['latency_ms']/1000 for x in rr]);ec=np.arange(1,len(a)+1)/len(a)*100
 ax.step(np.r_[0,a],np.r_[0,ec],where='post',c=c,lw=2,label=label)
ax.set(xlabel='Seconds per request',ylabel='Requests completed by this time (%)',ylim=(0,105),xlim=(0,None));ax.legend(frameon=False,fontsize=9,loc='lower right')
bx=fig.add_subplot(gs[1]);bx.axis('off')
for yy,big,small in [(.84,f"${r['run']['estimated_cost_usd']:.5f}",'Estimated logged input cost'),(.5,f"{r['run']['input_tokens']:,}",'Input tokens in 505 logged requests'),(.16,f"{r['run']['test_latency_s']['p50']:.2f} s",'Median test request')]:
 bx.text(.02,yy,big,fontsize=28,fontfamily='DejaVu Serif',color=TEAL,weight='bold');bx.text(.02,yy-.115,small,fontsize=10.5,color=MUTED)
save(fig,'07-latency-cost','Cost uses $0.042 per million input tokens. One interrupted in-flight request may have incurred an unlogged charge. This is not an invoice.')
print('Created four result figures.')
