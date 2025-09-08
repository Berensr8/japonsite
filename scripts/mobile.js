// Mobile specific UX enhancements: floating group panel + draw game safeguards
const panel = document.getElementById('groupPanel');
const fab = document.getElementById('groupFab');
const backdrop = document.getElementById('panelBackdrop');

function openPanel(){
  if(!panel) return;
  panel.classList.add('open');
  document.body.classList.add('show-groups');
  backdrop?.classList.add('on');
  fab?.setAttribute('aria-expanded','true');
}
function closePanel(){
  panel.classList.remove('open');
  document.body.classList.remove('show-groups');
  backdrop?.classList.remove('on');
  fab?.setAttribute('aria-expanded','false');
}

fab?.addEventListener('click',()=>{
  if(panel.classList.contains('open')) closePanel(); else openPanel();
});
backdrop?.addEventListener('click',closePanel);
window.addEventListener('keydown',e=>{ if(e.key==='Escape' && panel.classList.contains('open')) closePanel(); });

// Draw game mobile bug mitigation: ensure canvas context is valid before use.
// If other scripts throw because of null context, we can log a graceful warning instead.
(function safeguardDraw(){
  const origGetContext = HTMLCanvasElement.prototype.getContext;
  HTMLCanvasElement.prototype.getContext = function(type, opts){
    const ctx = origGetContext.call(this, type, opts);
    if(!ctx && type==='2d'){
      console.warn('Draw: 2D context alınamadı.');
    }
    return ctx;
  };
})();
