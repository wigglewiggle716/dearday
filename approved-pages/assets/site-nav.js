(function(){
  function syncNav(){
    // Navigation comes from page HTML. Never normalize/rebuild it here.
    if(window.DDCart&&typeof window.DDCart.paint==='function')window.DDCart.paint();
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',syncNav);
  else syncNav();
})();
