// Light Sakura Theme & Petal Effect
const root=document.documentElement;
function applyLight(){
  root.classList.add('light');
}
function spawnPetal(){
  const petal=document.createElement('div');
  petal.className='petal';
  const size=8+Math.random()*14;
  petal.style.width=petal.style.height=size+'px';
  petal.style.left=Math.random()*100+'vw';
  petal.style.animationDuration=6+Math.random()*8+'s';
  petal.style.animationDelay=Math.random()*4+'s';
  document.body.appendChild(petal);
  setTimeout(()=>petal.remove(),15000);
}
for(let i=0;i<14;i++) spawnPetal();
setInterval(()=>{ if(document.hidden) return; spawnPetal(); },2500);
applyLight();
