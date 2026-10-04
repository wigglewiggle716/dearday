from pathlib import Path
import re

p=Path('approved-pages/dear-day-cart.js')
s=p.read_text(encoding='utf-8')

if 'function patchHomePlannerSelects()' not in s:
    marker='  function patchReviewConsent(){\n'
    fn=r'''  function patchHomePlannerSelects(){
    const p=String(location.pathname||'/');
    if(!(p==='/'||/\/index(?:-en)?\.html$/i.test(p)))return;
    const english=isEnglishPage();
    const closeAll=(except)=>document.querySelectorAll('.dd-home-select-shell.dd-open').forEach(shell=>{if(shell!==except){shell.classList.remove('dd-open');shell.querySelector('.dd-home-select-trigger')?.setAttribute('aria-expanded','false')}});

    ['area','budget'].forEach(id=>{
      const select=document.getElementById(id);
      if(!select||select.dataset.ddHomeSelectReady==='1')return;
      select.dataset.ddHomeSelectReady='1';
      select.setAttribute('data-dd-native-select','');
      select.classList.add('dd-home-select-native');

      const shell=document.createElement('span');
      shell.className='dd-home-select-shell';
      const trigger=document.createElement('button');
      trigger.type='button';
      trigger.className='dd-home-select-trigger';
      trigger.setAttribute('aria-haspopup','listbox');
      trigger.setAttribute('aria-expanded','false');
      trigger.setAttribute('aria-label',select.getAttribute('aria-label')||select.closest('label')?.textContent?.trim()||id);
      const value=document.createElement('span');
      value.className='dd-home-select-value';
      const chev=document.createElement('span');
      chev.className='dd-home-select-chevron';
      chev.setAttribute('aria-hidden','true');
      const menu=document.createElement('span');
      menu.className='dd-home-select-menu';
      menu.setAttribute('role','listbox');

      select.parentNode.insertBefore(shell,select);
      shell.appendChild(select);
      shell.appendChild(trigger);
      trigger.appendChild(value);
      trigger.appendChild(chev);
      shell.appendChild(menu);

      function sync(){
        const current=select.options[select.selectedIndex]||select.options[0];
        value.textContent=current?current.textContent.trim():'';
        trigger.disabled=!!select.disabled;
        menu.innerHTML='';
        [...select.options].forEach((opt,index)=>{
          const button=document.createElement('button');
          button.type='button';
          button.className='dd-home-select-option';
          button.textContent=opt.textContent.trim();
          button.disabled=!!opt.disabled;
          button.setAttribute('role','option');
          button.setAttribute('aria-selected',String(index===select.selectedIndex));
          button.addEventListener('click',()=>{
            if(button.disabled)return;
            select.selectedIndex=index;
            select.dispatchEvent(new Event('input',{bubbles:true}));
            select.dispatchEvent(new Event('change',{bubbles:true}));
            sync();
            shell.classList.remove('dd-open');
            trigger.setAttribute('aria-expanded','false');
            trigger.focus();
          });
          menu.appendChild(button);
        });
      }

      trigger.addEventListener('click',()=>{
        if(trigger.disabled)return;
        const open=!shell.classList.contains('dd-open');
        closeAll(open?shell:null);
        shell.classList.toggle('dd-open',open);
        trigger.setAttribute('aria-expanded',String(open));
      });
      trigger.addEventListener('keydown',e=>{
        if(e.key==='Escape'){
          shell.classList.remove('dd-open');
          trigger.setAttribute('aria-expanded','false');
        }
      });
      select.addEventListener('change',sync);
      sync();
    });

    if(document.documentElement.dataset.ddHomeSelectOutsideReady!=='1'){
      document.documentElement.dataset.ddHomeSelectOutsideReady='1';
      document.addEventListener('click',e=>{
        if(e.target.closest('.dd-home-select-shell'))return;
        closeAll(null);
      });
      document.addEventListener('keydown',e=>{if(e.key==='Escape')closeAll(null)});
    }
  }

'''
    if marker not in s:
        raise SystemExit('patchReviewConsent marker not found')
    s=s.replace(marker,fn+marker,1)

call='    patchMobileFooterAccordion();\n    patchReviewConsent();'
if call in s and '    patchHomePlannerSelects();\n    patchReviewConsent();' not in s:
    s=s.replace(call,'    patchMobileFooterAccordion();\n    patchHomePlannerSelects();\n    patchReviewConsent();',1)

css_marker='      .dd-social-icons a[data-dd-social="x"] svg{width:18px!important;height:18px!important}\n'
if '.dd-home-select-shell{' not in s:
    css=r'''      /* Home planner selects: scoped branding without touching the planner grid/layout */
      #occasions .filters .dd-home-select-shell{position:relative!important;display:block!important;width:100%!important;min-width:0!important;margin-top:0!important}
      #occasions .filters .dd-home-select-native{position:absolute!important;width:1px!important;height:1px!important;opacity:0!important;pointer-events:none!important;clip:rect(0 0 0 0)!important;clip-path:inset(50%)!important;overflow:hidden!important;white-space:nowrap!important}
      #occasions .filters .dd-home-select-trigger{width:100%!important;height:52px!important;min-height:52px!important;border:1px solid rgba(107,53,64,.18)!important;border-radius:12px!important;background:rgba(255,253,252,.58)!important;color:#6B3540!important;padding:0 15px!important;display:flex!important;align-items:center!important;justify-content:space-between!important;gap:12px!important;font:700 14px/1.35 inherit!important;text-align:start!important;box-shadow:0 5px 14px rgba(76,31,36,.025)!important;cursor:pointer!important;transition:border-color .18s ease,box-shadow .18s ease,background .18s ease!important}
      #occasions .filters .dd-home-select-trigger:hover{border-color:rgba(168,88,61,.55)!important;background:#fffdfb!important}
      #occasions .filters .dd-home-select-shell.dd-open .dd-home-select-trigger,#occasions .filters .dd-home-select-trigger:focus-visible{border-color:#A8583D!important;box-shadow:0 0 0 3px rgba(168,88,61,.10),0 8px 22px rgba(76,31,36,.06)!important;outline:none!important;background:#fff!important}
      #occasions .filters .dd-home-select-value{min-width:0!important;overflow:hidden!important;text-overflow:ellipsis!important;white-space:nowrap!important}
      #occasions .filters .dd-home-select-chevron{position:relative!important;width:18px!important;height:18px!important;flex:0 0 18px!important;color:#A8583D!important;transition:transform .18s ease!important}
      #occasions .filters .dd-home-select-chevron:before,#occasions .filters .dd-home-select-chevron:after{content:''!important;position:absolute!important;top:8px!important;width:7px!important;height:1.5px!important;background:currentColor!important;border-radius:2px!important}
      #occasions .filters .dd-home-select-chevron:before{left:2px!important;transform:rotate(42deg)!important}
      #occasions .filters .dd-home-select-chevron:after{right:2px!important;transform:rotate(-42deg)!important}
      #occasions .filters .dd-home-select-shell.dd-open .dd-home-select-chevron{transform:rotate(180deg)!important}
      #occasions .filters .dd-home-select-menu{position:absolute!important;z-index:2147482500!important;top:calc(100% + 7px)!important;inset-inline:0!important;display:none!important;max-height:min(310px,46vh)!important;overflow:auto!important;padding:7px!important;background:#fffdfc!important;border:1px solid rgba(107,53,64,.16)!important;border-radius:15px!important;box-shadow:0 18px 45px rgba(76,31,36,.16)!important;scrollbar-width:thin!important;scrollbar-color:rgba(107,53,64,.28) transparent!important}
      #occasions .filters .dd-home-select-shell.dd-open .dd-home-select-menu{display:grid!important;gap:3px!important}
      #occasions .filters .dd-home-select-option{width:100%!important;min-height:42px!important;border:0!important;border-radius:10px!important;background:transparent!important;color:#4A3638!important;padding:8px 11px!important;display:flex!important;align-items:center!important;justify-content:space-between!important;gap:10px!important;text-align:start!important;font:600 13px/1.45 inherit!important;cursor:pointer!important}
      #occasions .filters .dd-home-select-option:hover,#occasions .filters .dd-home-select-option:focus-visible{background:#F8EBE6!important;color:#6B3540!important;outline:none!important}
      #occasions .filters .dd-home-select-option[aria-selected="true"]{background:#6B3540!important;color:#fff!important;font-weight:800!important}
      #occasions .filters .dd-home-select-option[aria-selected="true"]:after{content:'✓'!important;font:800 11px/1 Arial,sans-serif!important}
      #occasions .filters .dd-home-select-option:disabled{opacity:.45!important;cursor:not-allowed!important}
      @media(max-width:700px){#occasions .filters .dd-home-select-trigger{height:50px!important;min-height:50px!important}#occasions .filters .dd-home-select-menu{max-height:42svh!important}.dd-home-select-option{min-height:44px!important}}

'''
    if css_marker not in s:
        raise SystemExit('CSS insertion marker not found')
    s=s.replace(css_marker,css+css_marker,1)

p.write_text(s,encoding='utf-8')

for name in ['index.html','index-en.html']:
    f=Path(name)
    x=f.read_text(encoding='utf-8')
    y=re.sub(r'dear-day-cart\.js\?v=[0-9-]+','dear-day-cart.js?v=20261004-5',x)
    f.write_text(y,encoding='utf-8')
