(function(){
  const SELECTOR='select:not([multiple]):not([data-dd-native-select]):not(.dd-select-native)';
  const upgraded=new WeakMap();
  const managed=new Set();

  function ensureFilterStyles(){
    if(document.querySelector('link[data-dd-filter-controls]'))return;
    const l=document.createElement('link');
    l.rel='stylesheet';
    l.href='/approved-pages/assets/dear-day-filter-controls.css?v=20261003-1';
    l.setAttribute('data-dd-filter-controls','');
    (document.head||document.documentElement).appendChild(l);
  }
  ensureFilterStyles();

  function closeAll(except){
    document.querySelectorAll('.dd-select-shell.dd-select-open').forEach(shell=>{if(shell!==except){shell.classList.remove('dd-select-open');shell.querySelector('.dd-select-trigger')?.setAttribute('aria-expanded','false')}});
  }
  function selectedOption(select){return select.options[select.selectedIndex]||select.options[0]||null}
  function sync(select){
    const ui=upgraded.get(select);if(!ui)return;
    const opt=selectedOption(select),text=opt?opt.textContent.trim():'';
    ui.value.textContent=text;ui.trigger.disabled=!!select.disabled;ui.lastValue=String(select.value);ui.lastIndex=select.selectedIndex;ui.lastDisabled=!!select.disabled;
    ui.menu.innerHTML='';
    [...select.options].forEach((o,i)=>{
      const b=document.createElement('button');b.type='button';b.className='dd-select-option';b.textContent=o.textContent.trim();b.disabled=!!o.disabled;b.dataset.index=String(i);b.setAttribute('role','option');b.setAttribute('aria-selected',String(i===select.selectedIndex));
      b.addEventListener('click',()=>{if(b.disabled)return;select.selectedIndex=i;select.dispatchEvent(new Event('input',{bubbles:true}));select.dispatchEvent(new Event('change',{bubbles:true}));sync(select);ui.shell.classList.remove('dd-select-open');ui.trigger.setAttribute('aria-expanded','false');ui.trigger.focus()});
      ui.menu.appendChild(b);
    });
  }
  function upgrade(select){
    if(!select||upgraded.has(select)||select.closest('.dd-select-shell'))return;
    const shell=document.createElement('span');shell.className='dd-select-shell';
    const trigger=document.createElement('button');trigger.type='button';trigger.className='dd-select-trigger';trigger.setAttribute('aria-haspopup','listbox');trigger.setAttribute('aria-expanded','false');
    const value=document.createElement('span');value.className='dd-select-value';
    const chev=document.createElement('span');chev.className='dd-select-chevron';chev.setAttribute('aria-hidden','true');
    const menu=document.createElement('span');menu.className='dd-select-menu';menu.setAttribute('role','listbox');
    select.parentNode.insertBefore(shell,select);shell.appendChild(select);shell.appendChild(trigger);trigger.appendChild(value);trigger.appendChild(chev);shell.appendChild(menu);select.classList.add('dd-select-native');
    const oldTab=select.getAttribute('tabindex');if(oldTab!==null)select.dataset.ddOldTab=oldTab;select.setAttribute('tabindex','-1');
    upgraded.set(select,{shell,trigger,value,menu,lastValue:null,lastIndex:null,lastDisabled:null});managed.add(select);
    trigger.addEventListener('click',()=>{if(trigger.disabled)return;const open=shell.classList.toggle('dd-select-open');closeAll(open?shell:null);trigger.setAttribute('aria-expanded',String(open));if(open){const active=menu.querySelector('[aria-selected="true"]');active?.scrollIntoView({block:'nearest'})}});
    trigger.addEventListener('keydown',e=>{
      if(!['ArrowDown','ArrowUp','Home','End','Escape'].includes(e.key))return;
      if(e.key==='Escape'){shell.classList.remove('dd-select-open');trigger.setAttribute('aria-expanded','false');return}
      e.preventDefault();if(!shell.classList.contains('dd-select-open')){shell.classList.add('dd-select-open');trigger.setAttribute('aria-expanded','true')}
      const opts=[...menu.querySelectorAll('.dd-select-option:not(:disabled)')];if(!opts.length)return;let idx=opts.findIndex(x=>x===document.activeElement||x.getAttribute('aria-selected')==='true');
      if(e.key==='Home')idx=0;else if(e.key==='End')idx=opts.length-1;else if(e.key==='ArrowDown')idx=Math.min(opts.length-1,Math.max(0,idx+1));else idx=Math.max(0,idx<0?0:idx-1);opts[idx]?.focus();
    });
    select.addEventListener('change',()=>sync(select));
    sync(select);
  }
  function scan(root=document){root.querySelectorAll?.(SELECTOR).forEach(upgrade)}
  function refreshManaged(){
    managed.forEach(select=>{
      if(!select.isConnected){managed.delete(select);return}
      const ui=upgraded.get(select);if(!ui)return;
      if(ui.lastValue!==String(select.value)||ui.lastIndex!==select.selectedIndex||ui.lastDisabled!==!!select.disabled)sync(select);
    });
  }

  function boot(){
    document.body?.classList.add('dd-form-brand-ready');scan();
    document.addEventListener('click',e=>{if(!e.target.closest('.dd-select-shell'))closeAll()});
    document.addEventListener('keydown',e=>{if(e.key==='Escape')closeAll()});
    const mo=new MutationObserver(muts=>{
      for(const m of muts){
        m.addedNodes.forEach(n=>{if(n.nodeType!==1)return;if(n.matches?.(SELECTOR))upgrade(n);scan(n)});
        if(m.target instanceof HTMLOptionElement||m.target instanceof HTMLOptGroupElement){const s=m.target.closest('select');if(s)sync(s)}
      }
    });
    mo.observe(document.documentElement,{subtree:true,childList:true,attributes:true,attributeFilter:['disabled','selected']});
    setInterval(refreshManaged,300);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
