from pathlib import Path
import re

p=Path('approved-pages/dear-day-cart.js')
s=p.read_text(encoding='utf-8')

if 'function normalizeLegalFooter()' not in s:
    marker='  function patchLegalFooterLinks(){\n'
    fn=r'''  function normalizeLegalFooter(){
    const path=String(location.pathname||'');
    const legal=/\/approved-pages\/Dear-Day-(Privacy|Terms|Refunds|Data-Deletion)(?:-en)?\.html$/i.test(path);
    if(!legal)return;
    const english=isEnglishPage();
    document.querySelectorAll('footer,.dd-occ-footer').forEach(footer=>{
      footer.classList.add('dd-occ-footer','dd-unified-legal-footer');
      footer.innerHTML=`<div class="dd-footer-wrap">
        <div class="footer-top">
          <div class="footer-brand"><a class="footer-logo" href="${english?'/index-en.html':'/'}"><img src="/approved-pages/assets/dear-day-wordmark.svg" alt="Dear Day"></a><p class="footer-note">${english?'Every detail, one place.':'كل تفصيلة في مكان واحد.'}</p></div>
          <div><h4>${english?'Dear Day Services':'خدمات Dear Day'}</h4><a href="${english?'/approved-pages/Dear-Day-Gifts-Approved-en.html?standalone=1':'/approved-pages/Dear-Day-Gifts-Approved.html?standalone=1'}">${english?'Gifts':'الهدايا'}</a><a href="${english?'/approved-pages/Dear-Day-Cake-Approved-en.html?standalone=1':'/approved-pages/Dear-Day-Cake-Approved.html?standalone=1'}">${english?'Cake & Sweets':'كيك وحلويات'}</a><a href="${english?'/approved-pages/Dear-Day-Flowers-Approved-en.html?standalone=1':'/approved-pages/Dear-Day-Flowers-Approved.html?standalone=1'}">${english?'Flowers':'الورد'}</a><a href="${english?'/approved-pages/Dear-Day-Venues-Approved-en.html?standalone=1':'/approved-pages/Dear-Day-Venues-Approved.html?standalone=1'}">${english?'Places & Experiences':'أماكن وتجارب'}</a></div>
          <div><h4>${english?'Customer Care':'خدمة العملاء'}</h4><a href="${english?'/approved-pages/Dear-Day-FAQ-en.html':'/approved-pages/Dear-Day-FAQ.html'}">${english?'FAQs':'الأسئلة الشائعة'}</a><a href="${english?'/approved-pages/Dear-Day-Contact-en.html':'/approved-pages/Dear-Day-Contact.html'}">${english?'Contact Us':'تواصل معنا'}</a><a href="${english?'/approved-pages/Dear-Day-Refunds-en.html':'/approved-pages/Dear-Day-Refunds.html'}">${english?'Cancellation & Refund Policy':'سياسة الإلغاء والاسترداد'}</a><a href="${english?'/approved-pages/Dear-Day-Data-Deletion-en.html':'/approved-pages/Dear-Day-Data-Deletion.html'}">${english?'Account & Data Deletion':'حذف الحساب والبيانات'}</a></div>
          <div><h4>${english?'Legal':'القانوني'}</h4><a href="${english?'/approved-pages/Dear-Day-Privacy-en.html':'/approved-pages/Dear-Day-Privacy.html'}">${english?'Privacy Policy':'سياسة الخصوصية'}</a><a href="${english?'/approved-pages/Dear-Day-Terms-en.html':'/approved-pages/Dear-Day-Terms.html'}">${english?'Terms & Conditions':'الشروط والأحكام'}</a></div>
        </div>
        <div class="dd-payment-footer"><h4>${english?'Payment Methods':'وسائل الدفع'}</h4><div class="dd-payment-icons" aria-label="${english?'Accepted payment methods':'وسائل الدفع المقبولة'}"><span class="dd-pay-card dd-pay-visa" aria-label="Visa">VISA</span><span class="dd-pay-card dd-pay-master" aria-label="Mastercard"><i></i><b></b></span><span class="dd-pay-card dd-pay-apple" aria-label="Apple Pay"><span class="dd-apple">●</span><strong>Pay</strong></span><span class="dd-pay-card dd-pay-google" aria-label="Google Pay"><strong>G</strong><span>Pay</span></span><span class="dd-pay-card dd-pay-wallet" aria-label="Wallet"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7.5h14a2 2 0 0 1 2 2v8H4a2 2 0 0 1-2-2v-11A2 2 0 0 1 4 2.5h12v3H4a1 1 0 0 0 0 2z" fill="none" stroke="currentColor" stroke-width="1.7"/><circle cx="16.5" cy="12.5" r="1" fill="currentColor"/></svg></span></div></div>
        <div class="footer-bottom"><span>© 2026 Dear Day</span><span class="dd-legal-links"><a href="${english?'/approved-pages/Dear-Day-Privacy-en.html':'/approved-pages/Dear-Day-Privacy.html'}">${english?'Privacy Policy':'سياسة الخصوصية'}</a><span aria-hidden="true"> · </span><a href="${english?'/approved-pages/Dear-Day-Terms-en.html':'/approved-pages/Dear-Day-Terms.html'}">${english?'Terms & Conditions':'الشروط والأحكام'}</a></span></div>
      </div>`;
    });
  }

'''
    if marker not in s:
        raise SystemExit('legal footer marker not found')
    s=s.replace(marker,fn+marker,1)

call='    patchGiftLanguageLinks();\n    patchLegalFooterLinks();'
repl='    patchGiftLanguageLinks();\n    normalizeLegalFooter();\n    patchLegalFooterLinks();'
if call not in s:
    raise SystemExit('patchPage marker not found')
s=s.replace(call,repl,1)

style_marker='      .dd-occ-footer{background:#5D0C1D!important}\n'
extra=r'''      .dd-unified-legal-footer{background:#5D0C1D!important;color:#f8e8eb!important;padding:52px 0 24px!important}
      .dd-unified-legal-footer .dd-footer-wrap{width:min(1180px,calc(100% - 40px))!important;margin:auto!important}
      .dd-unified-legal-footer .footer-top{display:grid!important;grid-template-columns:1.2fr repeat(3,1fr)!important;gap:40px!important}
      .dd-unified-legal-footer .footer-logo img{width:170px!important;filter:brightness(0) invert(1)!important}
      .dd-unified-legal-footer .footer-note{color:#efd9de!important;line-height:1.8!important;font-size:14px!important;max-width:330px!important;margin-top:12px!important}
      .dd-unified-legal-footer .footer-top h4,.dd-unified-legal-footer .dd-payment-footer h4{margin:0 0 16px!important;color:#fff!important;font-size:14px!important}
      .dd-unified-legal-footer .footer-top a{display:block!important;color:#efd9de!important;margin:10px 0!important;font-size:14px!important;text-decoration:none!important}
      .dd-payment-footer{grid-column:1/-1!important;width:100%!important;margin-top:24px!important;padding-top:22px!important;border-top:1px solid rgba(255,255,255,.16)!important}
      .dd-payment-icons{display:flex!important;gap:10px!important;flex-wrap:wrap!important;align-items:center!important}
      .dd-pay-card{width:74px!important;height:44px!important;border-radius:10px!important;background:#fff!important;color:#6B3540!important;display:flex!important;align-items:center!important;justify-content:center!important;position:relative!important;font-family:Arial,sans-serif!important;font-weight:800!important;box-shadow:0 2px 0 rgba(0,0,0,.03)!important}
      .dd-pay-visa{color:#1a2c83!important;font-size:18px!important;font-style:italic!important}
      .dd-pay-master i,.dd-pay-master b{width:20px!important;height:20px!important;border-radius:50%!important;position:absolute!important;top:12px!important}.dd-pay-master i{left:21px!important;background:#e6392f!important}.dd-pay-master b{left:33px!important;background:#f79e1b!important;opacity:.92!important}
      .dd-pay-apple{gap:4px!important;color:#111!important}.dd-pay-apple .dd-apple{font-size:18px!important;line-height:1!important}.dd-pay-apple strong{font-size:14px!important}
      .dd-pay-google{gap:4px!important;color:#111!important}.dd-pay-google strong{font-size:18px!important}.dd-pay-google span{font-size:14px!important;font-weight:700!important}
      .dd-pay-wallet svg{width:25px!important;height:25px!important}
      .dd-unified-legal-footer .footer-bottom{border-top:1px solid rgba(255,255,255,.25)!important;margin-top:34px!important;padding-top:20px!important;display:flex!important;justify-content:space-between!important;gap:20px!important;flex-wrap:wrap!important;color:#dcc2c8!important;font-size:13px!important}
      @media(max-width:980px){.dd-unified-legal-footer .footer-top{grid-template-columns:repeat(2,1fr)!important}}
      @media(max-width:620px){.dd-unified-legal-footer .dd-footer-wrap{width:min(100% - 24px,1180px)!important}.dd-unified-legal-footer .footer-top{grid-template-columns:1fr!important}.dd-pay-card{width:70px!important;height:42px!important}}
'''
if style_marker not in s:
    raise SystemExit('style marker not found')
s=s.replace(style_marker,style_marker+extra,1)

p.write_text(s,encoding='utf-8')

for f in Path('.').rglob('*.html'):
    if '.git' in f.parts:
        continue
    txt=f.read_text(encoding='utf-8')
    upd=re.sub(r'dear-day-cart\.js\?v=[0-9-]+','dear-day-cart.js?v=20261004-3',txt)
    if upd!=txt:
        f.write_text(upd,encoding='utf-8')
