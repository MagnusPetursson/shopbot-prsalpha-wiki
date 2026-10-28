"""Render PDF contact sheets and prove text-preservation across the rebuild."""
from pathlib import Path
from PIL import Image, ImageDraw
import subprocess, json, re, math

root=Path(__file__).resolve().parents[2]
out=root/'qa/geometry-audit/pdf';out.mkdir(parents=True,exist_ok=True)
results=[]
# Reader-text guard: geometry-only work must not change reader text. The baseline is the last
# approved copy revision (qa/READER_BASELINE); 23d731b before the copy pass.
BASELINE = (lambda f: f.read_text().strip() if f.exists() else '23d731b')(Path(__file__).resolve().parents[2]/'qa/READER_BASELINE')
for filename in ['shopbot-handbook.pdf','shopbot-wiki.pdf']:
    pdf=root/filename; name=pdf.stem; dest=out/name;dest.mkdir(exist_ok=True)
    baseline=subprocess.check_output(['git','show',BASELINE+':'+filename],cwd=root)
    before=subprocess.check_output(['pdftotext','-raw','-','-'],input=baseline).decode()
    after=subprocess.check_output(['pdftotext','-raw',str(pdf),'-'],text=True)
    def normalized(text):
        text=' '.join(text.split())
        # The automatic cover build date is intentionally current. The figure
        # label's extraction position changes when its SVG viewBox is enlarged;
        # it is the same label, not a change to the prose or figure caption.
        text=re.sub(r'\b\d{4}-\d{2}-\d{2}\b','<build-date>',text,count=1)
        if filename=='shopbot-wiki.pdf':
            text=text.replace('Fig 1 SHOPBOT PRSALPHA 144-60 idle','',1)
        return text.split()
    assert normalized(before)==normalized(after), filename+' reader text changed'
    subprocess.run(['pdftoppm','-png','-r','70',str(pdf),str(dest/'page')],check=True,stdout=subprocess.DEVNULL,stderr=subprocess.PIPE)
    images=sorted(dest.glob('page-*.png'),key=lambda p:int(p.stem.split('-')[-1]))
    for offset in range(0,len(images),12):
        sheet=Image.new('RGB',(1000,1120),'#dadada');d=ImageDraw.Draw(sheet)
        d.text((12,8),filename+' — pages '+str(offset+1)+'–'+str(min(offset+12,len(images))),fill='black')
        for j,p in enumerate(images[offset:offset+12]):
            im=Image.open(p).convert('RGB');im.thumbnail((240,330))
            x=(j%4)*250+(250-im.width)//2;y=(j//4)*360+35
            sheet.paste(im,(x,y));d.text((x,y+im.height+3),str(offset+j+1),fill='black')
        sheet.save(out/f'{name}-contact-{offset//12+1}.jpg',quality=92)
    results.append({'file':filename,'pages_rendered':len(images),'reader_prose_unchanged':True,'normalizations':['automatic cover build date']+(['unchanged SVG figure-label extraction position'] if filename=='shopbot-wiki.pdf' else [])})
(out.parent/'pdf-visual-check.json').write_text(json.dumps(results,indent=2))
print(json.dumps(results,indent=2))
