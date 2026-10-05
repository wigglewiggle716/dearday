from pathlib import Path

p = Path('approved-pages/dear-day-cart.js')
s = p.read_text()
marker = '      /* Home planner selects: scoped branding without touching the planner grid/layout */'
compact = '''      /* Compact footer scale: proportional across desktop/mobile and AR/EN */
      .dd-occ-footer{padding-top:44px!important;padding-bottom:20px!important}
      .dd-occ-footer .footer-top{gap:32px!important}
      .dd-occ-footer .footer-logo img{width:145px!important}
      .dd-occ-footer .footer-note{font-size:12px!important;line-height:1.65!important;max-width:285px!important;margin-top:10px!important}
      .dd-occ-footer .footer-top h4,.dd-occ-footer .dd-social-footer h4,.dd-occ-footer .dd-payment-footer h4{font-size:12.5px!important;margin-bottom:12px!important}
      .dd-occ-footer .footer-top a{font-size:12px!important;margin:8px 0!important}
      .dd-occ-footer .dd-social-footer,.dd-occ-footer .dd-payment-footer{margin-top:20px!important;padding-top:18px!important}
      .dd-occ-footer .dd-social-icons{gap:8px!important}
      .dd-occ-footer .dd-social-icons a{width:33px!important;height:33px!important}
      .dd-occ-footer .dd-social-icons svg{width:17px!important;height:17px!important}
      .dd-occ-footer .dd-social-icons a[data-dd-social="facebook"] svg{width:16px!important;height:16px!important}
      .dd-occ-footer .dd-social-icons a[data-dd-social="x"] svg{width:16px!important;height:16px!important}
      .dd-occ-footer .dd-social-icons a[data-dd-social="youtube"] svg,.dd-occ-footer .dd-social-icons a[data-dd-social="snapchat"] svg{width:18px!important;height:18px!important}
      .dd-occ-footer .dd-payment-icons{gap:8px!important}
      .dd-occ-footer .dd-pay-card{width:64px!important;height:38px!important;border-radius:9px!important}
      .dd-occ-footer .dd-pay-visa{font-size:16px!important}
      .dd-occ-footer .dd-pay-master i,.dd-occ-footer .dd-pay-master b{width:17px!important;height:17px!important;top:10px!important}
      .dd-occ-footer .dd-pay-master i{left:18px!important}.dd-occ-footer .dd-pay-master b{left:28px!important}
      .dd-occ-footer .dd-pay-apple .dd-apple{font-size:16px!important}.dd-occ-footer .dd-pay-apple strong{font-size:12px!important}
      .dd-occ-footer .dd-pay-google strong{font-size:16px!important}.dd-occ-footer .dd-pay-google span{font-size:12px!important}
      .dd-occ-footer .dd-pay-wallet svg{width:22px!important;height:22px!important}
      .dd-occ-footer .footer-bottom{margin-top:28px!important;padding-top:16px!important;gap:16px!important;font-size:11.5px!important}
      @media(max-width:620px){
        .dd-occ-footer{padding-top:36px!important;padding-bottom:18px!important}
        .dd-occ-footer .dd-footer-wrap{width:min(100% - 22px,1180px)!important}
        .dd-occ-footer .footer-logo img{width:130px!important}
        .dd-occ-footer .footer-note{font-size:11.5px!important;max-width:255px!important;margin-top:8px!important}
        .footer-top>div.dd-mobile-footer-accordion>h4{padding:14px 2px!important;font-size:14px!important;gap:12px!important}
        .footer-top>div.dd-mobile-footer-accordion.dd-open>a{padding:7px 2px!important;font-size:12px!important}
        .footer-top>div.dd-mobile-footer-accordion.dd-open>:last-child{margin-bottom:10px!important}
        .dd-occ-footer .dd-social-footer,.dd-occ-footer .dd-payment-footer{margin-top:18px!important;padding-top:16px!important}
        .dd-occ-footer .dd-social-icons a{width:32px!important;height:32px!important}
        .dd-occ-footer .dd-pay-card{width:60px!important;height:36px!important}
        .dd-occ-footer .footer-bottom{margin-top:24px!important;padding-top:14px!important;font-size:11px!important}
      }

'''

if 'Compact footer scale: proportional across desktop/mobile and AR/EN' not in s:
    if marker not in s:
        raise SystemExit('Footer compact insertion anchor not found')
    s = s.replace(marker, compact + marker, 1)

p.write_text(s)
