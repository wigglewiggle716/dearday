from pathlib import Path
import re

p=Path('approved-pages/dear-day-cart.js')
s=p.read_text(encoding='utf-8')

old="const isSupport=english ? (heading==='customer service'||heading.includes('customer service')) : heading==='خدمة العملاء';"
new="const isSupport=english ? (heading==='customer service'||heading.includes('customer service')||heading==='customer care'||heading.includes('customer care')) : heading==='خدمة العملاء';"
if old not in s:
    raise SystemExit('Expected support heading condition not found')
s=s.replace(old,new,1)

if 'function patchAccountDeletionLink()' not in s:
    marker='  function patchSocialFooter(){\n'
    fn="""  function patchAccountDeletionLink(){
    const english=isEnglishPage();
    document.querySelectorAll('.footer-top>div').forEach(col=>{
      const heading=String(col.querySelector('h4')?.textContent||'').replace(/\\s+/g,' ').trim().toLowerCase();
      const isSupport=english ? (heading==='customer service'||heading.includes('customer service')||heading==='customer care'||heading.includes('customer care')) : heading==='خدمة العملاء';
      if(!isSupport)return;
      const href=english?'/approved-pages/Dear-Day-Data-Deletion-en.html':'/approved-pages/Dear-Day-Data-Deletion.html';
      if(col.querySelector(`a[href=\\"${href}\\"]`))return;
      const link=document.createElement('a');
      link.href=href;
      link.textContent=english?'Account & Data Deletion':'حذف الحساب والبيانات';
      col.appendChild(link);
    });
  }

"""
    if marker not in s:
        raise SystemExit('Social footer marker not found')
    s=s.replace(marker,fn+marker,1)

call_old='    patchRefundPolicyLink();\n    patchSocialFooter();'
call_new='    patchRefundPolicyLink();\n    patchAccountDeletionLink();\n    patchSocialFooter();'
if call_old not in s:
    raise SystemExit('patchPage call marker not found')
s=s.replace(call_old,call_new,1)

p.write_text(s,encoding='utf-8')

for f in Path('.').rglob('*.html'):
    if '.git' in f.parts:
        continue
    text=f.read_text(encoding='utf-8')
    updated=re.sub(r'dear-day-cart\.js\?v=[0-9-]+','dear-day-cart.js?v=20261004-2',text)
    if updated!=text:
        f.write_text(updated,encoding='utf-8')
