from pathlib import Path
import json
import numpy as np
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
from matplotlib.patches import FancyBboxPatch, FancyArrowPatch

OUT=Path('jev_article/figures');OUT.mkdir(parents=True,exist_ok=True)
INK='#263238';MUTED='#62707B';TEAL='#178479';BLUE='#496DAC';PURPLE='#7861AA';RED='#B95A54'
plt.rcParams.update({'font.family':'DejaVu Sans','font.size':11,'text.color':INK,'axes.labelcolor':INK,
 'axes.edgecolor':'#ABB6BC','xtick.color':MUTED,'ytick.color':MUTED,'axes.spines.top':False,
 'axes.spines.right':False,'figure.facecolor':'white','axes.facecolor':'white','svg.fonttype':'none'})

def canvas(title,subtitle):
 fig,ax=plt.subplots(figsize=(12,6.2));fig.subplots_adjust(left=.04,right=.97,bottom=.10,top=.78)
 ax.set(xlim=(-.18,12.1),ylim=(0,6));ax.axis('off')
 fig.text(.04,.92,title,fontsize=23,fontfamily='DejaVu Serif',weight='bold')
 fig.text(.04,.85,subtitle,fontsize=11.5,color=MUTED)
 return fig,ax
def box(ax,x,y,w,h,title,body='',color='#EDF4F3',edge=TEAL):
 ax.add_patch(FancyBboxPatch((x,y),w,h,boxstyle='round,pad=0.015,rounding_size=0.06',facecolor=color,edgecolor=edge,lw=1.2))
 ax.text(x+w/2,y+h*(.67 if body else .5),title,ha='center',va='center',fontsize=12,weight='bold')
 if body:ax.text(x+w/2,y+h*.30,body,ha='center',va='center',fontsize=10.5,color=MUTED,linespacing=1.5)
def arrow(ax,a,b,color=MUTED,style='-|>',connectionstyle='arc3,rad=0'):
 ax.add_patch(FancyArrowPatch(a,b,arrowstyle=style,mutation_scale=13,lw=1.4,color=color,connectionstyle=connectionstyle))
def save(fig,name,footer):
 fig.text(.04,.025,footer,fontsize=9,color=MUTED)
 fig.savefig(OUT/(name+'.png'),dpi=200,facecolor='white')
 fig.savefig(OUT/(name+'.svg'),facecolor='white');plt.close(fig)

fig,ax=canvas('A decision can have its own model','Jev accepts context and bounded questions. Application code decides what happens next.')
ax.text(0,5.5,'GENERATED RESPONSE',fontsize=10,color=BLUE,weight='bold')
box(ax,0,3.8,2.1,1.2,'Context + prompt',color='#EDF1FA',edge=BLUE)
box(ax,2.9,3.8,2.1,1.2,'Generative model',color='#EDF1FA',edge=BLUE)
for i,t in enumerate(['token 1','token 2','token 3']):
 box(ax,5.8+i*1.2,4.0,1,.8,t,color='#EDF1FA',edge=BLUE)
 if i:arrow(ax,(5.6+i*1.2,4.4),(5.8+i*1.2,4.4),BLUE)
box(ax,10,3.8,1.8,1.2,'Application', 'Reads result',color='#F2F4F5',edge=MUTED)
arrow(ax,(2.1,4.4),(2.9,4.4),BLUE);arrow(ax,(5,4.4),(5.8,4.4),BLUE);arrow(ax,(9.2,4.4),(10,4.4),BLUE)
ax.text(0,2.8,'TYPED DECISIONS',fontsize=10,color=TEAL,weight='bold')
box(ax,0,.7,2.1,1.4,'State','Sentence or record')
box(ax,2.9,.7,2.1,1.4,'Jev','Questions + criteria')
for y,t in [(2.0,'Choice: class probabilities'),(.8,'Noul: yes probability'),(-.4,'Score: rubric expectation')]:
 box(ax,6,y+.6,3,0.8,t,color='#EDF4F3')
 arrow(ax,(5,1.4),(6,y+1.0),TEAL)
box(ax,10,.7,1.8,1.4,'Application','Thresholds\nand review')
arrow(ax,(2.1,1.4),(2.9,1.4),TEAL)
for y in [2.6,1.4,.2]:arrow(ax,(9,y),(10,1.4),TEAL)
save(fig,'01-decision-interface','Conceptual interface, not a reconstruction of Jev internals. Our benchmark uses one Choice per request.')

fig,ax=canvas('A probability is a claim we can test','Concentration describes one prediction. Calibration requires predictions and observed labels.')
box(ax,.2,3.1,3.2,2.1,'Probability distribution','P(ADE) = 0.80\nP(no ADE) = 0.20',color='#EDF4F3')
box(ax,4.4,3.1,3.2,2.1,'Confidence statistic','A summary of how much\nprobability is concentrated',color='#F2EEF8',edge=PURPLE)
arrow(ax,(3.4,4.2),(4.4,4.2),PURPLE)
ax.text(8.4,4.8,'One prediction',fontsize=14,fontfamily='DejaVu Serif',weight='bold')
ax.text(8.4,4.15,'The returned confidence\nis not a measured\ncorrectness rate.',fontsize=12,linespacing=1.6,va='top')
box(ax,.2,.35,7.4,1.65,'Calibration across many examples','Among cases assigned about 0.80, is roughly 80% ADE-related?',color='#EDF1FA',edge=BLUE)
ax.text(8.4,1.45,'Many predictions + labels',fontsize=13,fontfamily='DejaVu Serif',weight='bold')
ax.text(8.4,.8,'Evaluate on your workload.',fontsize=11.5,color=MUTED)
save(fig,'02-probability-calibration','Illustrative probabilities only. TypeSafe documents confidence as a function of the output distribution.')

fig,ax=canvas('The labels stay outside the API request','Deduplicate first. Use validation to select thresholds, then evaluate the frozen rule on test data.')
box(ax,0,3.8,2.35,1.35,'23,516 rows','Public ADE corpus',color='#F2F4F5',edge=MUTED)
box(ax,3.1,3.8,2.65,1.35,'20,895 sentences','Unique normalized text',color='#F2F4F5',edge=MUTED)
arrow(ax,(2.35,4.48),(3.1,4.48))
for y,h,t,b,c in [(4.4,1.2,'20,395 train','TF-IDF + logistic regression',BLUE),(2.5,1.2,'200 validation','Threshold selection',PURPLE),(.6,1.2,'300 test','Final comparison',TEAL)]:
 box(ax,7,y,4.7,h,t,b,color={BLUE:'#EDF1FA',PURPLE:'#F2EEF8',TEAL:'#EDF4F3'}[c],edge=c)
 arrow(ax,(5.75,4.48),(7,y+h/2),c)
ax.text(.2,2.5,'One sentence per Jev request',fontsize=16,fontfamily='DejaVu Serif',weight='bold')
ax.text(.2,1.5,'Text enters state.\nLabels, row IDs, and split metadata stay local.',fontsize=12,linespacing=1.7)
save(fig,'03-experiment-design','Sentence-level pilot. Article IDs are absent in this HF configuration, so article-level separation is not established.')

fig,ax=canvas('Where I would put Jev in a literature workflow','A proposed extension: keep the review policy in code and validate each added decision separately.')
box(ax,.1,3.9,2.4,1.25,'Retrieve literature','Preserve source IDs',color='#F2F4F5',edge=MUTED)
box(ax,3.1,3.9,2.6,1.25,'Jev screening','P(ADE) per sentence')
box(ax,6.45,3.9,2.4,1.25,'Routing policy','Frozen threshold',color='#F2EEF8',edge=PURPLE)
box(ax,9.55,3.9,2.3,1.25,'Review queue','Positive + uncertain')
for a,b in [((2.5,4.53),(3.1,4.53)),((5.7,4.53),(6.45,4.53)),((8.85,4.53),(9.55,4.53))]:arrow(ax,a,b)
box(ax,6.45,1.15,2.4,1.25,'Lower priority','Retain for audit',color='#F6F0E8',edge='#AA814D')
arrow(ax,(7.65,3.9),(7.65,2.4),PURPLE)
box(ax,9.55,1.15,2.3,1.25,'Evidence review','Human or separate\nvalidated workflow')
arrow(ax,(10.7,3.9),(10.7,2.4),TEAL)
ax.text(.2,2.6,'Separate measured and proposed behavior',fontsize=14,fontfamily='DejaVu Serif',weight='bold')
ax.text(.2,2.05,'Measured here: sentence classification.\nStill to test: evidence checks, synthesis,\nand performance on newly published reports.',fontsize=11.5,linespacing=1.6,va='top')
save(fig,'08-literature-workflow','This experiment does not validate clinical decisions, automated case closure, or downstream report generation.')
print('Created four conceptual figures.')
