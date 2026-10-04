from pathlib import Path
import re
p=Path('approved-pages/dear-day-cart.js')
s=p.read_text(encoding='utf-8')
old="""  function ensureBrandedFormControls(){
    if(!document.querySelector('link[data-dd-form-controls]')){"""
new="""  function ensureBrandedFormControls(){
    const p=String(location.pathname||'/');
    if(p==='/'||/\\/index(?:-en)?\\.html$/i.test(p))return;
    if(!document.querySelector('link[data-dd-form-controls]')){"""
if old not in s:
    raise SystemExit('ensureBrandedFormControls marker not found')
s=s.replace(old,new,1)
p.write_text(s,encoding='utf-8')
for f in Path('.').rglob('*.html'):
    if '.git' in f.parts: continue
    x=f.read_text(encoding='utf-8')
    y=re.sub(r'dear-day-cart\.js\?v=[0-9-]+','dear-day-cart.js?v=20261004-4',x)
    if y!=x:f.write_text(y,encoding='utf-8')
