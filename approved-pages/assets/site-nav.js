(function(){
  function syncNav(){
    if(window.DDCart&&typeof window.DDCart.normalizeHeader==='function'){
      window.DDCart.normalizeHeader();
      if(typeof window.DDCart.paint==='function')window.DDCart.paint();
    }
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',syncNav);
  else syncNav();
})();