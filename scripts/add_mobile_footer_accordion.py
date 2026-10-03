from pathlib import Path
import re

p=Path('approved-pages/dear-day-cart.js')
s=p.read_text(encoding='utf-8')

if 'function patchMobileFooterAccordion()' not in s:
    marker='  function patchReviewConsent(){\n'
    fn=r'''  function patchMobileFooterAccordion(){
    const mobile=window.matchMedia('(max-width: 620px)');
    document.querySelectorAll('footer,.dd-occ-footer').forEach(footer=>{
      const top=footer.querySelector('.footer-top');
      if(!top)return;
      [...top.children].forEach(col=>{
        if(!(col instanceof HTMLElement))return;
        if(col.classList.contains('dd-social-footer')||col.classList.contains('footer-brand')||col.querySelector('.footer-logo'))return;
        const heading=[...col.children].find(el=>el.tagName==='H4');
        if(!heading)return;
        col.classList.add('dd-mobile-footer-accordion');
        if(heading.dataset.ddAccordionReady==='1')return;
        heading.dataset.ddAccordionReady='1';
        heading.setAttribute('role','button');
        heading.setAttribute('tabindex','0');
        heading.setAttribute('aria-expanded','false');
        const toggle=()=>{
          if(!mobile.matches)return;
          const open=col.classList.toggle('dd-open');
          heading.setAttribute('aria-expanded',open?'true':'false');
        };
        heading.addEventListener('click',toggle);
        heading.addEventListener('keydown',e=>{
          if(!mobile.matches)return;
          if(e.key==='Enter'||e.key===' '){e.preventDefault();toggle();}
        });
      });
    });
  }

'''
    if marker not in s:
        raise SystemExit('patchReviewConsent marker not found')
    s=s.replace(marker,fn+marker,1)

call='    patchSocialFooter();\n    patchReviewConsent();'
if call not in s:
    raise SystemExit('patchPage social/review marker not found')
s=s.replace(call,'    patchSocialFooter();\n    patchMobileFooterAccordion();\n    patchReviewConsent();',1)

css_marker='      .dd-social-icons a[data-dd-social="facebook"] svg{width:19px!important;height:19px!important}'
if css_marker not in s:
    raise SystemExit('social css marker not found')
accordion_css=r'''
      @media(max-width:620px){
        .footer-top>div.dd-mobile-footer-accordion{width:100%!important;border-bottom:1px solid rgba(255,255,255,.28)!important;padding:0!important;margin:0!important}
        .footer-top>div.dd-mobile-footer-accordion>h4{margin:0!important;padding:18px 2px!important;display:flex!important;align-items:center!important;justify-content:space-between!important;gap:16px!important;color:#fff!important;font-size:16px!important;font-weight:800!important;line-height:1.35!important;cursor:pointer!important;user-select:none!important;-webkit-tap-highlight-color:transparent!important}
        .footer-top>div.dd-mobile-footer-accordion>h4:after{content:''!important;display:block!important;flex:0 0 auto!important;width:9px!important;height:9px!important;border-right:2px solid currentColor!important;border-bottom:2px solid currentColor!important;transform:rotate(45deg)!important;transition:transform .2s ease!important;margin-inline:5px 3px!important}
        .footer-top>div.dd-mobile-footer-accordion.dd-open>h4:after{transform:rotate(225deg)!important}
        .footer-top>div.dd-mobile-footer-accordion:not(.dd-open)>:not(h4){display:none!important}
        .footer-top>div.dd-mobile-footer-accordion.dd-open>a{display:block!important;margin:0!important;padding:9px 2px!important;color:#efd9de!important;font-size:14px!important}
        .footer-top>div.dd-mobile-footer-accordion.dd-open>:last-child{margin-bottom:14px!important}
        .footer-top>div.dd-mobile-footer-accordion>h4:focus-visible{outline:2px solid rgba(255,255,255,.75)!important;outline-offset:3px!important;border-radius:4px!important}
      }
'''
s=s.replace(css_marker,css_marker+accordion_css,1)

p.write_text(s,encoding='utf-8')

# Cache-bust shared runtime everywhere it is referenced.
for f in Path('.').rglob('*.html'):
    if '.git' in f.parts:
        continue
    text=f.read_text(encoding='utf-8')
    updated=re.sub(r'dear-day-cart\.js\?v=[0-9-]+','dear-day-cart.js?v=20261004-3',text)
    if updated!=text:
        f.write_text(updated,encoding='utf-8')
