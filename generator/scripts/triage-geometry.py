"""Make an exhaustive, counted ledger from the retained raw renderer report."""
from pathlib import Path
from collections import Counter
import json, re

out=Path('qa/geometry-audit')
before=(out/'before.log').read_text(); after=(out/'after.log').read_text()
records=[]; section=None
headers={'clearance:':'clearance','terminals:':'terminal','loose ends:':'loose end','screen folds:':'screen fold','support:':'support','depth order:':'depth order','self-overlap:':'self-overlap','crowding:':'crowding'}
# These are intended mechanical joints or a proxy/metadata limitation, not
# independent physical clashes. Their separate painter-order failures are real.
joined=[
 ('pc.cart.post','pc.cart.shelf'),('pc.cart.post','tray.arm'),
 ('boom.post','boom.arm'),('boom.arm','boom.post.upper'),
 ('collector.upright','collector.crossbar'),('stand.leg','stand.brace'),
 ('stand.brace','side.far'),('stand.brace','side.near'),
 ('collector.housing','collector.motor'),('collector.collar','collector.band.upper'),
 ('prox.x.bracket','prox.x'),('hose.bracket.arm','hose.bracket.arm2')]
for number,line in enumerate(before.splitlines(),1):
    if not line.startswith('  '):
        section=next((v for k,v in headers.items() if line.startswith(k)),None)
        if line.startswith('items with no shape:'):
            for name in line.split('  ',1)[1].split(', '):
                records.append({'line':number,'category':'missing shape','finding':name,'triage':'cosmetic','reason':'Drawing was present; add matching analytic ink/overlay geometry so it participates in the audit.'})
        continue
    if not section: continue
    finding=line.strip(); kind='real defect'; why='Correct exterior geometry, mounting plane or service route; re-audit without masking the pair.'
    category=section
    if section=='clearance' and finding.startswith('close'):
        kind='cosmetic'; why='Already separated in 3D; the audit requests additional legible clearance. Improved with the route correction.'
    elif section in ('screen fold','self-overlap','crowding'):
        kind='cosmetic'; why='Projected line/bend readability rather than a disconnected physical assembly. Broader, separated service routing resolves it.'
    elif section=='support':
        if finding.startswith('loose'):
            category='unsupported solid'
            name=finding.split()[-1]
            if not (name.startswith('xchain.') or name=='ychain.car'):
                kind='false positive'; why='Floor-supported cart/boom/collector had no ground marker, propagating an unsupported-assembly warning. Correct explicit ground metadata; also repair actual contacts separately.'
        elif finding.startswith('hanging'):
            category='hanging tube'; kind='false positive'; why='Rigid stay belonged to the unmarked floor-supported boom; correct ground metadata and add explicit clevis mounting faces.'
        else:
            category='sunk pair'
            pair=finding.removeprefix('sunk').strip().split('   ',1)[0]
            a,b=[x.strip() for x in pair.split('×')]
            if 'axle.' in pair or 'shaft.' in pair:
                kind='false positive'; why='Intended through-shaft/axle inside a plate or motor mount, not two unrelated solids. Draw only the exposed shaft spans; plate faces hide the interior.'
            elif 'dustfoot.brush' in pair:
                kind='false positive'; why='The audit used a filled cylinder for an annular bristle skirt. Replace the proxy with the actual thin annular bristle envelope.'
            elif any({a,b}=={x,y} for x,y in joined):
                kind='false positive'; why='Intended joined/through-mounted assembly. Use exposed spans, segmented members and flush interface faces instead of overlapping filled primitives; separate painter-order warnings remain real defects.'
    records.append({'line':number,'category':category,'finding':finding,'triage':kind,'reason':why})
assert len(records)==226, len(records)
assert re.search(r'audit passed\s*$',after), 'Candidate raw audit does not pass'
for i,r in enumerate(records,1): r['id']=f'B{i:03d}'; r['after']='resolved; raw after report has zero findings'
counts=dict(Counter(r['triage'] for r in records))
categories=dict(Counter(r['category'] for r in records))
(out/'triage.json').write_text(json.dumps({'baseline':'23d731b','before':226,'after':0,'triage_counts':counts,'category_counts':categories,'findings':records},indent=2))
rows=['# Exhaustive baseline finding ledger','', 'Each ID denotes one emitted finding, not an independent mechanical defect. Several findings describe the same bad joint/route. Classification is the primary nature of that emitted finding. All IDs are resolved by the final raw audit; no unresolved findings were removed through an allowlist.','', '| ID | Category | Triage | Baseline line | Finding |','|---|---|---|---:|---|']
for r in records: rows.append(f"| {r['id']} | {r['category']} | {r['triage']} | {r['line']} | {r['finding'].replace('|','/')} |")
rows += ['', '## Reasons', '', 'The machine-readable `triage.json` retains the reason and resolution for every ID.']
(out/'FINDINGS.md').write_text('\n'.join(rows)+'\n')
print(json.dumps({'before':len(records),'after':0,'triage':counts,'categories':categories},indent=2))
