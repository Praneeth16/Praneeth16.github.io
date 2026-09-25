"""Excalidraw element skeletons for the System One article.

Rendered in a browser with @excalidraw/excalidraw (convertToExcalidrawElements + exportToSvg);
see scripts/render_excalidraw.html. Same palette and idiom as scripts/diagram_specs.py.
"""
from pathlib import Path
import json
OUT=Path(__file__).resolve().parents[1]/'public/system-one/diagrams'
INK='#292c2b';BLUE='#557f91';PURPLE='#80658f';GREEN='#4b7864';RUST='#b45b48';SAND='#a38b6e';GRAY='#666b68'
scenes=[]
class Scene:
 def __init__(self,name):self.name=name;self.elements=[];self.n=0;scenes.append(self)
 def add(self,kind,**kwargs):
  self.n+=1;e={'type':kind,'id':f'{self.name}-{self.n}','roughness':.5,'strokeColor':INK,'strokeWidth':1.5,'seed':20260926+self.n,**kwargs};self.elements.append(e);return e
 def box(self,x,y,w,h,text,color=BLUE,size=22):return self.add('rectangle',x=x,y=y,width=w,height=h,backgroundColor=color,fillStyle='solid',strokeColor=color,roundness={'type':3},label={'text':text,'fontSize':size,'fontFamily':2,'strokeColor':'#ffffff'})
 def outline(self,x,y,w,h,color=GRAY,dashed=True):return self.add('rectangle',x=x,y=y,width=w,height=h,strokeColor=color,strokeStyle='dashed' if dashed else 'solid',roundness={'type':3})
 def text(self,x,y,text,size=21,color=INK,font=1):return self.add('text',x=x,y=y,text=text,fontSize=size,fontFamily=font,strokeColor=color)
 def arrow(self,x,y,dx,dy,points=None,dashed=False,color=INK):return self.add('arrow',x=x,y=y,width=abs(dx),height=abs(dy),points=points or [[0,0],[dx,dy]],endArrowhead='arrow',strokeStyle='dashed' if dashed else 'solid',strokeColor=color)

s=Scene('01-fast-and-slow')
s.text(30,10,'Split the work by how much thinking it needs.',25)
s.box(40,110,340,90,'System 1: decide',GREEN);s.text(48,220,'Fast, automatic, bounded.\nPick from options you defined.\nReturn a probability for each.',20)
s.box(620,110,340,90,'System 2: deliberate',PURPLE);s.text(628,220,'Slow, effortful, open-ended.\nReason in tokens, write text,\ncall tools, plan.',20)
s.text(48,345,'Jev, Laya, a fine-tuned classifier',19,GRAY);s.text(628,345,'Reasoning LLMs such as GPT-6 Sol',19,GRAY)
s.arrow(395,140,210,0,dashed=True);s.text(435,88,'escalate when\nunsure',18)
s.arrow(605,172,-210,0,dashed=True);s.text(435,185,'hand back a\ndecision',18)
s.text(40,420,'An agent loop makes many small decisions and a few hard ones.\nCode decides which side each call goes to.',21)
s.text(40,510,'Kahneman’s terms describe people. Here they are an engineering split.',17,GRAY)

s=Scene('02-output-contract')
s.text(30,10,'Two ways to get a route out of a model.',25)
s.box(40,95,230,80,'User request',BLUE)
s.arrow(280,120,110,-35);s.arrow(280,150,110,190)
s.box(400,40,230,80,'LLM router',PURPLE);s.arrow(640,80,90,0)
s.box(740,40,250,80,'Generated JSON',PURPLE,20)
s.text(742,135,'{"route": "travel",\n "confidence": 0.95}',19,font=3)
s.text(410,140,'Confidence is text\nthe model wrote.\nDecoding enforces\nthe schema.',18,GRAY)
s.box(400,300,230,80,'Decision model',GREEN);s.arrow(640,340,90,0)
s.box(740,300,250,80,'Distribution',GREEN,20)
s.text(742,395,'travel        0.81\nout_of_scope  0.12\nutility       0.07',19,font=3)
s.text(410,400,'Probabilities over\nthe options you sent.\nNo text is generated.',18,GRAY)
s.text(40,500,'Both return something code can branch on. Only one of them was trained to make the number mean something.',17,GRAY)

s=Scene('03-family')
s.text(30,10,'One interface, several ways to build it.',25)
s.text(40,70,'Everything below takes a state plus typed options and returns probabilities.',19,GRAY)
s.box(40,120,290,80,'Trained for decisions',GREEN,21);s.text(48,215,'Jev (TypeSafe)\nhosted, RLCD, jev-1.13\n\nLaya (ConvAI)\nopen encoders,\n322M to 421M params',18)
s.box(360,120,290,80,'Repurposed generator',PURPLE,21);s.text(368,215,'DiffusionGemma-as-Jev\nvLLM patch,\none denoising step\n\nAny LLM with logprobs\nread the option tokens',18)
s.box(680,120,290,80,'Fine-tuned small LM',SAND,21);s.text(688,215,'Tev1-4B (Together)\nQwen3.5 4B,\nabout $17 to train\n\nYour own classifier\nfixed labels, needs data',18)
s.outline(25,108,960,320)
s.text(40,460,'“System One” names a contract. Only some of these were trained for it.',21)

s=Scene('04-diffusion-canvas')
s.text(30,10,'DiffusionGemma as a decision model.',25)
s.text(40,70,'Pin every token you already know. Leave one slot open. Denoise once. Read the slot.',19,GRAY)
xs=[40,150,260,370,480,590,700]
toks=['Q: route','this','request','Answer:','[ ? ]','</s>','pad']
for i,(x,t) in enumerate(zip(xs,toks)):
 s.box(x,130,100,70,t,RUST if t=='[ ? ]' else BLUE,18)
s.text(40,215,'pinned',18,GRAY);s.text(482,215,'open slot',18,RUST)
s.arrow(530,235,0,95);s.text(548,262,'one denoising step,\nlogprobs at temperature 1',18)
s.box(390,345,280,80,'P(slot = option token)',GREEN,20)
s.text(700,350,'A  travel        0.81\nB  out_of_scope  0.12\nC  utility       0.07',19,font=3)
s.text(40,470,'Options must map to single tokens so the canvas cannot shift. Low entropy: answer. High entropy: sample again.',17,GRAY)
s.text(40,510,'From Matt Mastracci’s vLLM pull request #57250. Illustrative values.',17,GRAY)

s=Scene('05-router-harness')
s.text(30,10,'Where a decision model sits in an agent harness.',25)
s.box(30,190,190,80,'Request',BLUE);s.arrow(230,230,80,0)
s.box(320,170,230,120,'Jev\nroute + cheap_ok\none call',GREEN,20)
s.arrow(560,210,110,-110);s.arrow(560,230,110,0);s.arrow(560,250,110,110)
s.box(680,60,300,80,'Specialist agent',BLUE,20);s.text(690,150,'confidence ≥ threshold',17,GRAY)
s.box(680,195,300,80,'Cheap model (Luna)',SAND,20);s.text(690,285,'cheap_ok is likely',17,GRAY)
s.box(680,330,300,80,'Big model or a person',PURPLE,20);s.text(690,420,'unsure, or hard',17,GRAY)
s.text(30,330,'Code owns the branches.\nThe model only supplies\nthe probabilities.',20)
s.text(30,480,'Both questions go in the same request and are answered in parallel.',17,GRAY)

s=Scene('06-benchmark-design')
s.text(30,10,'Two routing jobs. The same two routers on each.',25)
s.box(30,80,440,80,'A  Which specialist?',BLUE);s.text(40,175,'CLINC150 utterances, 11 routes:\n10 domains + out_of_scope\n110 dev · 330 test (30 per route)',19)
s.box(520,80,440,80,'B  Does it need the big model?',PURPLE,21);s.text(530,175,'MMLU-Pro, 14 subjects\n98 dev · 308 test\nlabel = did Luna answer correctly?',19)
s.box(30,330,200,75,'Jev 1.13',GREEN);s.box(260,330,210,75,'GPT-6 Luna',SAND);s.text(40,420,'Choice over routes · Noul for B\nvs JSON schema + stated confidence\nsame criteria text, frozen before test',18)
s.box(520,330,200,75,'Luna answers',SAND,20);s.box(750,330,210,75,'Sol answers',PURPLE,20);s.text(530,420,'Ground truth only.\nRouters never see an answer.',18)
s.text(30,520,'All calls through OpenRouter, reasoning off for Luna, 8 in flight.',17,GRAY)

OUT.mkdir(parents=True,exist_ok=True)
(OUT/'scenes.json').write_text(json.dumps([{'name':s.name,'elements':s.elements} for s in scenes]))
print(f'Prepared {len(scenes)} Excalidraw scenes')
