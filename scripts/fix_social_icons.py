from pathlib import Path
import re

p=Path('approved-pages/dear-day-cart.js')
s=p.read_text(encoding='utf-8')

old="""  function patchSocialFooter(){
    const english=isEnglishPage();
    document.querySelectorAll('footer,.dd-occ-footer').forEach(footer=>{
      if(footer.querySelector('.dd-social-footer'))return;
      const host=footer.querySelector('.footer-top')||footer.querySelector('.wrap')||footer;
      if(!host)return;
      const social=document.createElement('div');
      social.className='dd-social-footer';
      const icons=[['facebook','Facebook','f'],['instagram','Instagram','◎'],['x','X','𝕏'],['youtube','YouTube','▶'],['snapchat','Snapchat','◉'],['linkedin','LinkedIn','in']];
      social.innerHTML=`<h4>${english?'Social Media':'وسائل التواصل الاجتماعي'}</h4><div class=\"dd-social-icons\" aria-label=\"${english?'Dear Day social media':'وسائل التواصل الاجتماعي الخاصة بـ Dear Day'}\">${icons.map(([key,label,glyph])=>`<a href=\"#\" data-dd-social=\"${key}\" aria-label=\"${label}\" title=\"${label}\"><span aria-hidden=\"true\">${glyph}</span></a>`).join('')}</div>`;
      host.appendChild(social);
      social.querySelectorAll('a[data-dd-social]').forEach(a=>a.addEventListener('click',e=>e.preventDefault()));
    });
  }
"""

new="""  function patchSocialFooter(){
    const english=isEnglishPage();
    const icons={
      facebook:'<svg viewBox=\"0 0 24 24\" aria-hidden=\"true\"><path fill=\"currentColor\" d=\"M13.7 21v-8h2.7l.4-3h-3.1V8.1c0-.9.3-1.5 1.6-1.5H17V4c-.3 0-1.5-.1-2.7-.1-2.7 0-4.5 1.6-4.5 4.6V10H7.2v3h2.6v8h3.9z\"/></svg>',
      instagram:'<svg viewBox=\"0 0 24 24\" aria-hidden=\"true\"><rect x=\"3.5\" y=\"3.5\" width=\"17\" height=\"17\" rx=\"5\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.8\"/><circle cx=\"12\" cy=\"12\" r=\"4\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.8\"/><circle cx=\"17.4\" cy=\"6.8\" r=\"1.05\" fill=\"currentColor\"/></svg>',
      x:'<svg viewBox=\"0 0 24 24\" aria-hidden=\"true\"><path fill=\"currentColor\" d=\"M5.1 4h3.4l4.2 5.6L17.5 4h1.4l-5.6 6.6L19.2 20h-3.4l-4.6-6.1L6 20H4.6l5.9-7.1L5.1 4zm2.2 1.1 9 13.8h1.8L9.1 5.1H7.3z\"/></svg>',
      youtube:'<svg viewBox=\"0 0 24 24\" aria-hidden=\"true\"><path fill=\"currentColor\" d=\"M21 8.2c-.2-1.4-1.1-2.4-2.4-2.6C16.7 5.3 14.8 5.2 12 5.2s-4.7.1-6.6.4C4.1 5.8 3.2 6.8 3 8.2c-.2 1-.3 2.2-.3 3.8s.1 2.8.3 3.8c.2 1.4 1.1 2.4 2.4 2.6 1.9.3 3.8.4 6.6.4s4.7-.1 6.6-.4c1.3-.2 2.2-1.2 2.4-2.6.2-1 .3-2.2.3-3.8s-.1-2.8-.3-3.8zM10.1 15.5v-7l5.6 3.5-5.6 3.5z\"/></svg>',
      snapchat:'<svg viewBox=\"0 0 24 24\" aria-hidden=\"true\"><path fill=\"currentColor\" d=\"M12 3.2c-3 0-5 2.2-5 5.4 0 1.7.2 3.1-.3 4.1-.4.8-1.1 1.3-2.2 1.7-.8.2-1 1.2-.2 1.7.9.5 1.8.5 2.4 1.6.7 1.3 1.6 2.1 3.1 2.1.7 0 1.3-.2 2.2-.2s1.5.2 2.2.2c1.5 0 2.4-.8 3.1-2.1.6-1.1 1.5-1.1 2.4-1.6.8-.5.6-1.5-.2-1.7-1.1-.4-1.8-.9-2.2-1.7-.5-1-.3-2.4-.3-4.1 0-3.2-2-5.4-5-5.4z\"/></svg>',
      linkedin:'<svg viewBox=\"0 0 24 24\" aria-hidden=\"true\"><path fill=\"currentColor\" d=\"M6.2 8.2H3.3V21h2.9V8.2zM4.8 3A1.8 1.8 0 1 0 4.8 6.6 1.8 1.8 0 0 0 4.8 3zM20.7 13.6c0-3.9-2.1-5.7-4.8-5.7-2.2 0-3.2 1.2-3.8 2.1V8.2H9.2V21h2.9v-6.4c0-1.7.3-3.3 2.4-3.3 2 0 2.1 1.9 2.1 3.4V21h2.9v-7.4z\"/></svg>'
    };
    const platforms=[['facebook','Facebook'],['instagram','Instagram'],['x','X'],['youtube','YouTube'],['snapchat','Snapchat'],['linkedin','LinkedIn']];
    document.querySelectorAll('footer,.dd-occ-footer').forEach(footer=>{
      const existing=footer.querySelector('.dd-social-footer');
      if(existing)existing.remove();
      const host=footer.querySelector('.footer-top')||footer.querySelector('.wrap')||footer;
      if(!host)return;
      const social=document.createElement('div');
      social.className='dd-social-footer';
      social.innerHTML=`<h4>${english?'Social Media':'وسائل التواصل الاجتماعي'}</h4><div class=\"dd-social-icons\" aria-label=\"${english?'Dear Day social media':'وسائل التواصل الاجتماعي الخاصة بـ Dear Day'}\">${platforms.map(([key,label])=>`<a href=\"#\" data-dd-social=\"${key}\" aria-label=\"${label}\" title=\"${label}\">${icons[key]}</a>`).join('')}</div>`;
      host.appendChild(social);
      social.querySelectorAll('a[data-dd-social]').forEach(a=>a.addEventListener('click',e=>e.preventDefault()));
    });
  }
"""

if old not in s:
    raise SystemExit('Expected social footer block not found')
s=s.replace(old,new,1)

old_css='''      .dd-social-icons span{display:grid!important;place-items:center!important;min-width:18px!important;height:18px!important;font:800 15px/1 Arial,sans-serif!important;letter-spacing:-.03em!important}\n      .dd-social-icons a[data-dd-social="linkedin"] span{font-size:11px!important}\n      .dd-social-icons a[data-dd-social="instagram"] span{font-size:19px!important;font-weight:500!important}\n      .dd-social-icons a[data-dd-social="youtube"] span{font-size:14px!important}\n'''
new_css='''      .dd-social-icons svg{width:20px!important;height:20px!important;display:block!important;overflow:visible!important}\n      .dd-social-icons a[data-dd-social="facebook"] svg{width:19px!important;height:19px!important}\n      .dd-social-icons a[data-dd-social="x"] svg{width:18px!important;height:18px!important}\n      .dd-social-icons a[data-dd-social="youtube"] svg{width:21px!important;height:21px!important}\n      .dd-social-icons a[data-dd-social="snapchat"] svg{width:21px!important;height:21px!important}\n'''
if old_css not in s:
    raise SystemExit('Expected social CSS block not found')
s=s.replace(old_css,new_css,1)
p.write_text(s,encoding='utf-8')

for f in Path('.').rglob('*.html'):
    if '.git' in f.parts:
        continue
    x=f.read_text(encoding='utf-8')
    y=re.sub(r'dear-day-cart\.js\?v=[0-9-]+','dear-day-cart.js?v=20261004-1',x)
    if y!=x:
        f.write_text(y,encoding='utf-8')
