// Yeni minimal consent / analytics yönetimi
const CONSENT_KEY = 'hlabConsentV2';

function readConsent(){
  try { return JSON.parse(localStorage.getItem(CONSENT_KEY)||'{}'); } catch(_){ return {}; }
}
function writeConsent(obj){ try { localStorage.setItem(CONSENT_KEY, JSON.stringify(obj)); } catch(_){} }

const state = readConsent();
// Footer yönetim linki
const manageLink = document.getElementById('manageConsent');
if(manageLink){
  manageLink.addEventListener('click', e=>{
    e.preventDefault();
    // Açık değilse tekrar göster
    if(bar.hidden){
      bar.hidden = false; requestAnimationFrame(()=> bar.classList.add('show'));
      // Detayları kapalı başlat
      if(details){ details.hidden = true; }
    } else {
      // Açıkken tıklarsa kısalt veya detay aç/kapa
      if(details && details.hidden) { details.hidden = false; }
      else if(details){ details.hidden = true; }
    }
  });
}
const bar = document.getElementById('consentBar');
const btnAccept = document.getElementById('consentAccept');
const btnReject = document.getElementById('consentReject');
const btnToggle = document.getElementById('consentDetailsToggle');
const btnReset = document.getElementById('consentReset');
const btnCloseDetails = document.getElementById('consentCloseDetails');
const details = document.getElementById('consentDetails');

function show(el){ if(!el) return; el.hidden=false; requestAnimationFrame(()=>{ el.classList.add('show'); }); }
function hide(el){ if(!el) return; el.classList.remove('show'); setTimeout(()=>{ el.hidden=true; },350); }

function hasAnalytics(){ return state.analytics === true; }

function loadAnalytics(){
  if(window.__analyticsLoaded || !hasAnalytics()) return;
  window.__analyticsLoaded = true;
  const s = document.createElement('script');
  s.async = true; s.src = 'https://www.googletagmanager.com/gtag/js?id=G-9L05BRDJY9';
  document.head.appendChild(s);
  window.dataLayer = window.dataLayer || [];
  function gtag(){ dataLayer.push(arguments); }
  window.gtag = gtag;
  gtag('js', new Date());
  gtag('config', 'G-9L05BRDJY9', { anonymize_ip: true });
}

function persistAndClose(allow){
  state.analytics = allow; writeConsent(state);
  if(allow) loadAnalytics();
  hide(bar);
}

if(state.analytics === undefined){
  bar.hidden = false; show(bar);
} else {
  // Hali hazırda karar var
  if(hasAnalytics()) loadAnalytics();
}

if(btnAccept){ btnAccept.addEventListener('click', ()=> persistAndClose(true)); }
if(btnReject){ btnReject.addEventListener('click', ()=> persistAndClose(false)); }

if(btnToggle){
  btnToggle.addEventListener('click', ()=>{
    const open = !details.hidden;
    if(open){ details.hidden = true; btnToggle.setAttribute('aria-expanded','false'); }
    else { details.hidden = false; btnToggle.setAttribute('aria-expanded','true'); }
  });
}
if(btnCloseDetails){ btnCloseDetails.addEventListener('click', ()=>{ details.hidden = true; btnToggle && btnToggle.setAttribute('aria-expanded','false'); }); }
if(btnReset){
  btnReset.addEventListener('click', ()=>{
    try { localStorage.removeItem(CONSENT_KEY); } catch(_){}
    location.reload();
  });
}

window.addEventListener('keydown', e=>{ if(e.key==='Escape' && bar && !bar.hidden){ hide(bar); }});

// Dışa açık minimal API
export function analyticsAllowed(){ return hasAnalytics(); }
