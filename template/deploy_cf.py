#!/usr/bin/env python3
"""Deploy public/ to Cloudflare Pages as a single _worker.js (no asset-upload step needed).
Stock photos are served from the Unsplash CDN (Unsplash license; hotlinking is Unsplash's preferred method).
Env: CLOUDFLARE_ACCOUNT_ID (default below), CLOUDFLARE_API_TOKEN (proxy-injected in the cloud session).
Usage: python3 template/deploy_cf.py [--dry]"""
import base64, gzip, io, json, mimetypes, os, re, subprocess, sys
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PUB = os.path.join(ROOT, 'public')
ACC = os.environ.get('CLOUDFLARE_ACCOUNT_ID', '70238d989f7ccbb2b697b1f303200692')
TOK = os.environ.get('CLOUDFLARE_API_TOKEN', 'proxy-injected')
PROJECT = 'bytevia-demos'
IMG = json.load(open(os.path.join(ROOT, 'template', 'images.json')))
cdn = lambda m: f"https://images.unsplash.com/photo-{IMG[m.group(1)]}?w=1400&q=65&auto=format&fit=crop"

def small_logo(path):
    try:
        from PIL import Image
        im = Image.open(path)
        if im.format in ('PNG', 'JPEG', 'WEBP', 'ICO', 'GIF'):
            im = im.convert('RGBA'); im.thumbnail((240, 240)); b = io.BytesIO(); im.save(b, 'PNG', optimize=True)
            return b.getvalue(), 'image/png'
    except Exception:
        pass
    return open(path, 'rb').read(), mimetypes.guess_type(path)[0] or 'application/octet-stream'

files = {}
for dp, _, fs in os.walk(PUB):
    for f in fs:
        p = os.path.join(dp, f); rel = '/' + os.path.relpath(p, PUB).replace(os.sep, '/')
        if rel.startswith('/assets/img/') or f in ('_headers', 'logo.tmp'):
            continue
        if f.endswith('.html'):
            s = open(p, encoding='utf-8').read()
            s = re.sub(r"(?:\.\./)+assets/img/([\w-]+)\.jpg", cdn, s)
            files[rel] = ['text/html; charset=utf-8', 0, s]
        elif f.endswith(('.css', '.txt', '.js')):
            files[rel] = [(mimetypes.guess_type(p)[0] or 'text/plain') + '; charset=utf-8', 0, open(p, encoding='utf-8').read()]
        else:
            data, ct = small_logo(p) if f.startswith('logo.') else (open(p, 'rb').read(), mimetypes.guess_type(p)[0] or 'application/octet-stream')
            files[rel] = [ct, 1, base64.b64encode(data).decode()]

worker = "const F=" + json.dumps(files, ensure_ascii=False, separators=(',', ':')) + """;
const H={'x-robots-tag':'noindex, nofollow','cache-control':'public, max-age=300'};
function b64(s){const b=atob(s),u=new Uint8Array(b.length);for(let i=0;i<b.length;i++)u[i]=b.charCodeAt(i);return u}
export default{async fetch(req){const u=new URL(req.url);let p=decodeURIComponent(u.pathname);
if(p.endsWith('/'))p+='index.html';let f=F[p];
if(!f&&F[p+'/index.html'])return Response.redirect(u.origin+u.pathname+'/'+u.search,301);
if(!f)return new Response('Not found',{status:404,headers:H});
return new Response(f[1]?b64(f[2]):f[2],{headers:{...H,'content-type':f[0]}})}};"""
out = os.path.join(ROOT, 'data', '_worker.js')
open(out, 'w', encoding='utf-8').write(worker)
raw = len(worker.encode()); gz = len(gzip.compress(worker.encode(), 9))
print(f'{len(files)} files packed; worker {raw/1e6:.2f} MB raw / {gz/1e6:.2f} MB gzip (free plan limit 3 MB gzip)')
if '--dry' in sys.argv:
    sys.exit()
r = subprocess.run(['curl', '-sS', '-X', 'POST', '-H', f'Authorization: Bearer {TOK}',
                    f'https://api.cloudflare.com/client/v4/accounts/{ACC}/pages/projects/{PROJECT}/deployments',
                    '-F', 'manifest={}', '-F', f'_worker.js=@{out};filename=_worker.js;type=application/javascript+module',
                    '-F', 'branch=main'], capture_output=True, text=True)
d = json.loads(r.stdout or '{}')
print('success' if d.get('success') else 'FAILED', d.get('errors'), (d.get('result') or {}).get('url'), f'→ https://{PROJECT}.pages.dev')
