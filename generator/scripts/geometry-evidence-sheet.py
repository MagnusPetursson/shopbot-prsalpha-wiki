from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

root=Path(__file__).resolve().parents[2]
qa=root/'qa/geometry-audit'
fontpath='/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf'
font=ImageFont.truetype(fontpath,18);title=ImageFont.truetype(fontpath,30)
canvas=Image.new('RGB',(1400,1170),'#10161e');d=ImageDraw.Draw(canvas)
d.text((28,18),'Raw renderer audit: 226 → 0',font=title,fill='#edf0f4')
d.text((28,62),'113 real defects · 18 cosmetic · 95 false positives | local branch / private staging only',font=font,fill='#a9b8c8')
for i,(file,label) in enumerate([
 ('webgl-dark-whole.png','Whole machine — revised services and support contacts'),
 ('webgl-light-services.png','Head — revised collars, nozzle and hose holders'),
 ('webgl-dark-collector.png','Collector — bag / housing separation and discharge duct'),
 ('webgl-light-cart.png','Cart — flush shelves, segmented posts and seated base')]):
 im=Image.open(qa/file).convert('RGB')
 # Remove the inspector; retain the actual rendered machine canvas.
 im=im.crop((0,0,1093,1030));im.thumbnail((660,485))
 x=28+(i%2)*690;y=105+(i//2)*520
 canvas.paste(im,(x,y));d.text((x,y+488),label,font=font,fill='#dce4ed')
d.text((28,1140),'Raw parked-model audit + real browser checks; not physical-machine or full-travel certification.',font=font,fill='#a9b8c8')
canvas.save(qa/'GEOMETRY-REVIEW.png')
print(qa/'GEOMETRY-REVIEW.png')
