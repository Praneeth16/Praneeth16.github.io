"""Share card for the Databricks for agents article, in the site fonts and palette."""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont
root=Path(__file__).resolve().parents[1]
im=Image.new('RGB',(1200,630),'#fdfcfb');d=ImageDraw.Draw(im)
def text(x,y,s,size=22,font='dmmono-400.ttf',fill='#34312d'):
 f=ImageFont.truetype(str(root/'public/fonts'/font),size)
 if font=='fraunces-variable.ttf':f.set_variation_by_axes([size,500,0,1])
 d.text((x,y),s,font=f,fill=fill)
text(72,48,'Praneeth Paikray',25,'fraunces-variable.ttf')
text(72,146,'Databricks Is Databricks',62,'fraunces-variable.ttf')
text(72,224,'for Agents',62,'fraunces-variable.ttf')
text(72,334,'What Databricks did for data, it now does for agents.',22)
text(72,372,'One bad tool call, followed around the whole loop.',22)
d.line((72,456,1128,456),fill='#dcdad4',width=1)
x=72
for i,s in enumerate(['Run','Record','Query','Judge','Train','Serve']):
 text(x,496,s,22,fill='#3f6f86' if i==2 else '#34312d');x+=len(s)*13.3+22
 if i<5:text(x-12,496,'·',22,fill='#a2a5a4');x+=14
text(72,562,'Agent Runtime · Unity Catalog · MLflow · AI Runtime · Model Serving',16,fill='#716e68')
im.save(root/'public/agents/og.png')
