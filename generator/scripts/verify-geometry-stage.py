"""Read back the exact tailnet files and compare them with the local build."""
from pathlib import Path
import hashlib, json, urllib.request, subprocess, socket
root=Path(__file__).resolve().parents[2]
base='https://mptvpc.tailc30766.ts.net/shopbot-wip/'
host='mptvpc.tailc30766.ts.net'
state=json.loads(subprocess.check_output(['tailscale','status','--json']))
assert state['Self']['DNSName'].rstrip('.')==host
ip=next(ip for ip in state['Self']['TailscaleIPs'] if ':' not in ip)
try:
    socket.getaddrinfo(host,443)
    dns_mode='ordinary system DNS'
except socket.gaierror:
    dns_mode='explicit live Tailscale self-IP mapping; local MagicDNS lookup failed'
reader=[p.relative_to(root).as_posix() for p in root.glob('*.html')]+[p.relative_to(root).as_posix() for p in (root/'light').glob('*.html')]+['shopbot-handbook.pdf','shopbot-wiki.pdf']
review=['TRIAGE.md']+['qa/geometry-audit/'+f for f in ['FINDINGS.md','triage.json','before.log','after.log','after-light.log']]
assert len(reader)==24 and len(set(reader))==24
rows=[]
for rel in reader+review:
    expected=(root/rel).read_bytes()
    if dns_mode=='ordinary system DNS':
        with urllib.request.urlopen(base+rel,timeout=45) as response:
            actual=response.read();status=response.status
    else:
        # Resolve only this request to the live self-IP; keep normal TLS/SNI
        # validation, and do not change host or system DNS configuration.
        raw=subprocess.check_output(['curl','--fail','--silent','--show-error','--max-time','45','--resolve',f'{host}:443:{ip}','--write-out','\n%{http_code}',base+rel])
        actual,code=raw.rsplit(b'\n',1);status=int(code)
    assert status==200 and actual==expected,(rel,status,'served content differs from local build')
    rows.append({'path':rel,'http_status':status,'bytes':len(actual),'sha256':hashlib.sha256(actual).hexdigest()})
result={'base':base,'dns_mode':dns_mode,'ip_fallback':'http://'+ip+'/shopbot-wip/','reader_files_verified':len(reader),'review_files_verified':len(review),'byte_identical':True,'files':rows}
(root/'qa/geometry-audit/tailnet-readback.json').write_text(json.dumps(result,indent=2))
print(json.dumps({k:v for k,v in result.items() if k!='files'},indent=2))
