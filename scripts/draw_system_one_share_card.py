"""Share card for the System One article, same layout as draw_share_card.py in the site fonts."""
from pathlib import Path
import json
from PIL import Image, ImageDraw, ImageFont
root=Path(__file__).resolve().parents[1];e=json.loads((root/'public/system-one/evidence.json').read_text())
A=e['route']['test'];B=e['tier']['test']
im=Image.new('RGB',(1200,630),'#fdfcfb');d=ImageDraw.Draw(im)
def text(x,y,s,size=22,font='dmmono-400.ttf',fill='#34312d'):
 f=ImageFont.truetype(str(root/'public/fonts'/font),size)
 if font=='fraunces-variable.ttf':f.set_variation_by_axes([size,500,0,1])
 d.text((x,y),s,font=f,fill=fill)
text(72,48,'Praneeth Paikray',25,'fraunces-variable.ttf')
text(72,146,'WTF Is a System One',62,'fraunces-variable.ttf')
text(72,224,'Model?',62,'fraunces-variable.ttf')
text(72,334,'What a decision model is, where it came from, and',24)
text(72,374,'Jev vs GPT-6 Luna as routers on two tasks',24)
d.line((72,456,1128,456),fill='#dcdad4',width=1)
text(72,496,f"Routing accuracy  {A['luna']['accuracy']*100:.1f} -> {A['jev']['accuracy']*100:.1f}",21,fill='#4e8766')
text(560,496,f"Hard-question AUROC  {B['luna']['auroc']:.2f} -> {B['jev']['auroc']:.2f}",21,fill='#8a709b')
text(72,562,'Luna -> Jev · 330 routing requests · 308 MMLU-Pro questions · $0.50 total',16,fill='#716e68')
im.save(root/'public/system-one/og.png')
