"""Render a deterministic article share card with the site's own fonts."""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont
root=Path(__file__).resolve().parents[1]
im=Image.new('RGB',(1200,630),'#fdfcfb');d=ImageDraw.Draw(im)
def text(x,y,s,size=22,font='type-02.ttf',fill='#34312d'):
 d.text((x,y),s,font=ImageFont.truetype(str(root/'public/fonts'/font),size),fill=fill)
text(72,48,'Praneeth Paikray',25,'type-07.ttf')
text(72,146,'Adapting Jev to Your',62,'type-07.ttf')
text(72,224,'Domain with GEPA',62,'type-07.ttf')
text(72,334,'A medical-literature experiment in prompt optimization',26)
text(72,374,'and probability calibration.',26)
d.line((72,456,1128,456),fill='#dcdad4',width=1)
text(72,496,'F1  69.1 → 79.7',24,fill='#557f91')
text(427,496,'Brier  .136 → .075',24,fill='#8a709b')
text(816,496,'Missed ADEs  4 → 6',24,fill='#b45445')
text(72,562,'300 paired test sentences · Explore the results',18,fill='#716e68')
im.save(root/'public/jev/og.png')
