(function () {
  const bar = document.getElementById('stickyBar') || document.getElementById('sticky');
  const footer = document.querySelector('footer');
  if (!bar || !footer) return;

  // Keep a real, measured space before the footer, even while the bar floats.
  // No absolute document coordinates: image loads and mobile viewport changes
  // must never leave the bar over products or extend the page past its footer.
  const dock = document.createElement('div');
  dock.className = 'dd-selection-dock';
  footer.before(dock);
  dock.appendChild(bar);
  const style = document.createElement('style');
  style.textContent = `
    .dd-selection-dock{clear:both;position:relative;margin:16px 0;box-sizing:border-box}
    .dd-selection-dock > .dd-selection-docked{
      position:relative!important;top:auto!important;bottom:auto!important;
      left:auto!important;right:auto!important;transform:none!important;margin:0 auto!important
    }
    body:has(.dd-selection-dock) .catalog{padding-bottom:16px}
    body:has(.dd-selection-dock) main.main{padding-bottom:16px}
  `;
  document.head.appendChild(style);
  let raf = 0;
  function update() {
    raf = 0;
    const gap = window.innerWidth <= 980 ? 10 : 16;
    const height = bar.getBoundingClientRect().height;
    dock.style.height = Math.ceil(height) + 'px';
    const viewport = window.visualViewport;
    const viewportBottom = viewport ? viewport.offsetTop + viewport.height : window.innerHeight;
    const docked = dock.getBoundingClientRect().top <= viewportBottom - gap - height;
    bar.classList.toggle('dd-selection-docked', docked);
    if (!docked) {
      bar.style.position = 'fixed';
      bar.style.top = 'auto';
      bar.style.bottom = Math.max(gap, window.innerHeight - viewportBottom + gap) + 'px';
      bar.style.left = '50%';
      bar.style.transform = 'translateX(-50%)';
    }
  }
  function request() { if (!raf) raf = requestAnimationFrame(update); }
  window.addEventListener('scroll', request, {passive:true});
  window.addEventListener('resize', request);
  window.addEventListener('load', request);
  if (window.visualViewport) {
    window.visualViewport.addEventListener('resize', request);
    window.visualViewport.addEventListener('scroll', request);
  }
  if (window.ResizeObserver) {
    const observer = new ResizeObserver(request);
    observer.observe(bar);
    observer.observe(document.body);
  }
  update();
})();
