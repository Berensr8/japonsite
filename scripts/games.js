import { HIRAGANA, getRomajiList, markAttempt, loadProgress, getEnabledCharsFromGroups } from './data.js';

// Basit skor geçmişi
const SCORE_KEY = 'hiraganaGameScoresV1';
function loadScores(){ try{return JSON.parse(localStorage.getItem(SCORE_KEY)||'[]');}catch(e){return [];} }
function saveScore(entry){ const arr = loadScores(); arr.unshift(entry); while(arr.length>100) arr.pop(); localStorage.setItem(SCORE_KEY, JSON.stringify(arr)); renderScoreHistory(); }
// Analytics helper (no-op if gtag missing)
function track(event, params={}){ try{ if(typeof gtag==='function'){ gtag('event', event, params); } }catch(e){} }
function latestScoreFor(game){
  const list = loadScores();
  return list.find(s=>s.game===game);
}
function refreshTileScores(){
  document.querySelectorAll('.game-tile').forEach(tile=>{
    const span = tile.querySelector('.last-score');
    if(!span) return;
    const g = tile.dataset.game;
    const data = latestScoreFor(g);
    if(!data){ span.textContent='Son skor yok'; return; }
    let text='';
    if(g==='typing') text=`${data.score} puan / ${data.duration}s`;
    else if(g==='memory') text=`${data.pairs} çift • +${data.remaining}s`;
    else if(g==='draw') text=`${data.correct||0}/${data.asked||0}`;
    else if(g==='flash') text='—';
    span.textContent=text;
  });
}
function renderScoreHistory(){
  const box = document.getElementById('scoreHistory');
  if(!box) return;
  const data = loadScores().slice(0,10);
  box.innerHTML='';
  const head = document.createElement('div'); head.innerHTML='<h4>Son Skorlar</h4>';
  const clearBtn = document.createElement('button'); clearBtn.textContent='Temizle'; clearBtn.className='ghost'; clearBtn.style.marginLeft='10px';
  clearBtn.addEventListener('click',()=>{ localStorage.removeItem(SCORE_KEY); renderScoreHistory(); });
  head.appendChild(clearBtn); box.appendChild(head);
  if(!data.length){ const empty=document.createElement('div'); empty.className='score-item'; empty.textContent='Kayıt yok'; box.appendChild(empty); return; }
  const list=document.createElement('div'); list.className='score-list';
  data.forEach(s=>{
    const d=new Date(s.ts); const time=d.toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'});
    let line='';
    if(s.game==='typing') line=`Yaz (${s.duration}s) - Skor ${s.score}`;
    else if(s.game==='memory') line=`Hafıza (${s.pairs} çift) kalan ${s.remaining}s`;
    else if(s.game==='draw') line=`Çizim (${s.mode==='total'?'Toplam':'Tur'} ${s.totalDuration||s.duration}s) Doğru ${s.correct}/${s.asked}`;
    const div=document.createElement('div'); div.className='score-item'; div.textContent=`${time} · ${line}`; list.appendChild(div);
  });
  box.appendChild(list);
}

const gameArea = document.getElementById('gameArea');
const gameTiles = document.querySelectorAll('.game-tile');
let progressCache = loadProgress();

function shuffle(arr){
  for(let i=arr.length-1;i>0;i--){
    const j = Math.floor(Math.random()* (i+1));
    [arr[i],arr[j]]=[arr[j],arr[i]];
  }
  return arr;
}

// Aktif oyun temizlikçisi (oyun değişince artıkları durdurmak için)
let activeCleanup = null;

function registerCleanup(fn){
  if(typeof activeCleanup === 'function'){
    try{ activeCleanup('switch'); }catch(e){}
  }
  activeCleanup = fn;
}

// MEMORY GAME -------------------------------------------------
function startMemory(){
  gameArea.classList.remove('hidden');
  const durOptions='<option value="30">30s</option><option value="45">45s</option><option value="60" selected>60s</option><option value="90">90s</option><option value="120">120s</option>';
  // Seçili gruplara göre dinamik çift seçenekleri
  const enabledCharsDynamic = getEnabledCharsFromGroups();
  const available = enabledCharsDynamic.length;
  const candidateCounts = [4,6,8,10,12,14,16,20];
  const validCounts = candidateCounts.filter(c=>c<=available);
  let defaultPairs = 8;
  if(!validCounts.includes(defaultPairs)){
    // 8 yoksa en büyük geçerli değeri seç
    defaultPairs = validCounts.length ? validCounts[validCounts.length-1] : available;
  }
  if(available < 4){
    // Çok az harf varsa 2'den başlayarak tümünü tek seçenek yap
    defaultPairs = Math.max(2, available);
  }
  let pairOptions = '';
  if(available < 4){
    pairOptions = `<option value="${defaultPairs}" selected>${defaultPairs}</option>`;
  } else {
    pairOptions = validCounts.map(c=>`<option value="${c}" ${c===defaultPairs?'selected':''}>${c}</option>`).join('');
  }
  gameArea.innerHTML=`<h3>Hafıza Eşleştirme</h3>
    <div class="memory-config">Süre: <select id="memoryDuration">${durOptions}</select> Çift: <select id="memoryPairs">${pairOptions}</select> <button id="memoryStart" class="primary">Başlat</button> <button id="memoryFinish" class="ghost">Bitir</button> <span id="memoryTimer">0</span>s | Eşleşen: <span id="memoryMatched">0</span>/<span id="memoryTotal">0</span></div>
    <div class="memory-columns" id="memoryCols"><div class="mem-col" id="memLeft"></div><div class="mem-col" id="memRight"></div></div>
    <div id="memoryFeedback" class="feedback"></div>`;
  const leftEl = document.getElementById('memLeft');
  const rightEl = document.getElementById('memRight');
  const startBtn = document.getElementById('memoryStart');
  const finishBtn = document.getElementById('memoryFinish');
  const timerEl = document.getElementById('memoryTimer');
  const matchedEl = document.getElementById('memoryMatched');
  const totalEl = document.getElementById('memoryTotal');
  const feedback = document.getElementById('memoryFeedback');
  let selectedLeft=null, selectedRight=null, matched=0, totalPairs=0, running=false, interval=null, time=0;

  function buildBoard(){
    const enabled = getEnabledCharsFromGroups();
    let pool = HIRAGANA.filter(r=>enabled.includes(r[0]));
  const requestedPairs = parseInt(document.getElementById('memoryPairs').value)||8;
  // Havuzdaki gerçek karakter sayısını aşamaz
  const pairCount = Math.min(requestedPairs, pool.length);
  pool = shuffle([...pool]).slice(0,pairCount);
  totalPairs = pairCount;
    matched=0; matchedEl.textContent='0'; totalEl.textContent=totalPairs;
    leftEl.innerHTML=''; rightEl.innerHTML='';
    const leftCards = shuffle(pool.map(p=>({key:p[0], v:p[0]})));
    const rightCards = shuffle(pool.map(p=>({key:p[0], v:getRomajiList(p[0])[0]})));
    leftCards.forEach(c=>{
      const div=document.createElement('div');
      div.className='mem-card side-left';
      div.dataset.key=c.key;
      div.textContent=c.v;
      div.addEventListener('click',()=>selectCard(div,'left'));
      leftEl.appendChild(div);
    });
    rightCards.forEach(c=>{
      const div=document.createElement('div');
      div.className='mem-card side-right';
      div.dataset.key=c.key;
      div.textContent=c.v;
      div.addEventListener('click',()=>selectCard(div,'right'));
      rightEl.appendChild(div);
    });
  }

  function resetSelections(){
    if(selectedLeft) selectedLeft.classList.remove('active');
    if(selectedRight) selectedRight.classList.remove('active');
    selectedLeft=selectedRight=null;
  }

  function selectCard(el, side){
    if(!running || el.classList.contains('matched')) return;
    if(side==='left'){
      if(selectedLeft===el){ el.classList.toggle('active'); selectedLeft = el.classList.contains('active')?el:null; return; }
      if(selectedLeft) selectedLeft.classList.remove('active');
      selectedLeft=el; el.classList.add('active');
    } else {
      if(selectedRight===el){ el.classList.toggle('active'); selectedRight = el.classList.contains('active')?el:null; return; }
      if(selectedRight) selectedRight.classList.remove('active');
      selectedRight=el; el.classList.add('active');
    }
    if(selectedLeft && selectedRight){
      if(selectedLeft.dataset.key===selectedRight.dataset.key){
        selectedLeft.classList.add('matched');
        selectedRight.classList.add('matched');
        matched++; matchedEl.textContent=matched;
        if(matched===totalPairs){
          const remaining = (parseInt(document.getElementById('memoryDuration').value)-time);
          feedback.textContent='Tebrikler! '+remaining+'s kala bitirdin.';
          feedback.className='feedback ok';
          saveScore({game:'memory', pairs:totalPairs, duration:parseInt(document.getElementById('memoryDuration').value), remaining, ts:Date.now()});
          refreshTileScores();
          track('score_submit',{game:'memory', pairs:totalPairs, remaining});
          stop();
        }
      }
      setTimeout(resetSelections, 220);
    }
  }

  function tick(){
    time--; timerEl.textContent=time;
  if(time<=0){ feedback.textContent='Süre bitti!'; feedback.className='feedback err'; saveScore({game:'memory', pairs:totalPairs, duration:parseInt(document.getElementById('memoryDuration').value), remaining:0, ts:Date.now()}); stop(); }
  }

  function stop(){ running=false; clearInterval(interval); interval=null; }

  startBtn.addEventListener('click',()=>{
    if(running) return; feedback.textContent=''; feedback.className='feedback';
    buildBoard(); // kartlar başlangıca kadar gizliydi
    time=parseInt(document.getElementById('memoryDuration').value)||60;
    timerEl.textContent=time; running=true; interval=setInterval(tick,1000);
  track('game_start',{game:'memory', duration:time, pairs:parseInt(document.getElementById('memoryPairs').value)||8});
    if(getEnabledCharsFromGroups().length < (parseInt(document.getElementById('memoryPairs').value)||8)){
      feedback.textContent='Seçili grup sayısı daha az, çift sayısı otomatik küçültüldü.';
      feedback.className='feedback';
    }
  });
  finishBtn.addEventListener('click',()=>{
    if(!running) return;
    feedback.textContent='Erken bitirdin.'; feedback.className='feedback';
    const remaining = time; // kalan süre
    saveScore({game:'memory', pairs:totalPairs, duration:parseInt(document.getElementById('memoryDuration').value), remaining, ts:Date.now()});
  refreshTileScores();
  track('score_submit',{game:'memory', pairs:totalPairs, remaining});
    stop();
  });

  registerCleanup((mode)=>{ if(interval){ clearInterval(interval); interval=null; } running=false; if(mode==='switch'){ /* oyun değişti, skor kaydetme */ } });
}

// TYPING GAME -------------------------------------------------
function startTyping(){
  gameArea.classList.remove('hidden');
  const durOptions='<option value="15">15s</option><option value="30" selected>30s</option><option value="45">45s</option><option value="60">60s</option><option value="120">120s</option>';
  gameArea.innerHTML=`<h3>Hızlı Yaz</h3>
    <div class="typing-wrap">
    <div class="typing-config">Süre: <select id="typingDuration">${durOptions}</select> <button id="typingStart" class="primary">Başlat</button> <button id="typingFinish" class="ghost">Bitir</button></div>
      <div class="typing-target" id="typingTarget">あ</div>
      <div class="typing-input-wrap"><input id="typingInput" placeholder="romaji" autocomplete="off" /><div class="ti-underline"></div></div>
      <div id="typingFeedback" class="feedback"></div>
      <div class="typing-status"><span id="typingTimer">0</span>s | Skor: <span id="typingScore">0</span></div>
    </div>`;
  const targetEl = document.getElementById('typingTarget');
  const inputEl = document.getElementById('typingInput');
  const feedback = document.getElementById('typingFeedback');
  const startBtn = document.getElementById('typingStart');
  const finishBtn = document.getElementById('typingFinish');
  const timerEl = document.getElementById('typingTimer');
  const scoreEl = document.getElementById('typingScore');
  let time=0, score=0, interval=null, current=null, running=false;
  function enabledPool(){
    const enabled = getEnabledCharsFromGroups();
    const pool = HIRAGANA.filter(r=>enabled.includes(r[0]));
    return pool.length?pool:HIRAGANA;
  }
  function newChar(){
    const pool = enabledPool();
    current = pool[Math.floor(Math.random()*pool.length)][0];
    targetEl.textContent=current;
    inputEl.value=''; inputEl.focus();
  }
  function tick(){
    time--; timerEl.textContent=time;
  if(time<=0){ clearInterval(interval); interval=null; running=false; feedback.textContent='Süre bitti! Skor: '+score; feedback.className='feedback'; saveScore({game:'typing', score, duration:parseInt(document.getElementById('typingDuration').value), ts:Date.now()}); }
  }
  inputEl.addEventListener('keydown', e=>{ if(e.key==='Enter'){ check(); }});
  function check(){
    if(!current || !running) return;
    const val = inputEl.value.trim().toLowerCase();
    const correctList = getRomajiList(current).map(x=>x.toLowerCase());
    if(correctList.includes(val)){
      score++; scoreEl.textContent=score; feedback.textContent='✓'; feedback.className='feedback ok';
      markAttempt(progressCache, current, true);
    } else {
      feedback.textContent='✗ '+correctList[0]; feedback.className='feedback err';
      markAttempt(progressCache, current, false);
    }
    newChar();
  }
  startBtn.addEventListener('click',()=>{
    if(running) return;
    time=parseInt(document.getElementById('typingDuration').value)||30; timerEl.textContent=time; score=0; scoreEl.textContent='0'; feedback.textContent=''; feedback.className='feedback';
    running=true; newChar(); inputEl.focus(); interval=setInterval(tick,1000);
  track('game_start',{game:'typing', duration:time});
  });
  finishBtn.addEventListener('click',()=>{
    if(!running) return;
    clearInterval(interval); interval=null; running=false;
    feedback.textContent='Erken bitirdin! Skor: '+score; feedback.className='feedback';
    saveScore({game:'typing', score, duration:parseInt(document.getElementById('typingDuration').value), ts:Date.now()});
  refreshTileScores();
  track('score_submit',{game:'typing', score});
  });

  registerCleanup(()=>{ if(interval){ clearInterval(interval); } running=false; });
}

// Çizim Oyunu -------------------------------------------------
function startDraw(){
  gameArea.classList.remove('hidden');
  gameArea.innerHTML=`<h3>Çizim</h3><div class="draw-wrap"><div class="draw-left"><div id="drawTarget" class="draw-target">a</div>
    <div class="draw-controls">
      <div class="ctrl-groups">
        <div class="ctrl-box"><label>Tur
          <select id="drawDuration"><option value="15">15s</option><option value="20" selected>20s</option><option value="30">30s</option><option value="45">45s</option><option value="60">60s</option></select>
        </label></div>
        <div class="ctrl-box"><label style="display:flex;align-items:center;gap:6px"><input type="checkbox" id="drawTotalMode"> Toplam</label>
          <input id="drawTotalSeconds" type="number" min="30" max="600" step="10" value="120" title="Toplam süre (s)" style="width:80px">s
        </div>
        <div class="ctrl-box small-row">
          <label class="color-label">Renk <input type="color" id="drawColor" value="#ffffff"></label>
          <label>Kalınlık <input type="range" id="drawWidth" min="4" max="28" value="10"></label>
        </div>
        <div class="ctrl-box"><label style="display:flex;align-items:center;gap:6px"><input type="checkbox" id="drawGuide" checked> Rehber</label></div>
  <div class="ctrl-box actions"><button id="drawStart" class="primary">Başlat</button> <button id="drawNext" class="ghost" style="display:none">Yeni</button> <button id="drawClear" class="ghost" style="display:none">Temizle</button> <button id="drawDone" class="primary" style="display:none">Tamam</button> <button id="drawFinish" class="ghost" style="display:none">Bitir</button></div>
      </div>
      <div id="drawStatus" class="draw-status"></div>
    </div></div><canvas id="drawCanvas" width="320" height="320"></canvas></div>`;
  const canvas = document.getElementById('drawCanvas');
  const ctx = canvas.getContext('2d');
  // Bazı mobil tarayıcılarda CSS uygulanmazsa garanti altına al
  canvas.style.touchAction = 'none';
  const targetEl = document.getElementById('drawTarget');
  const doneBtn = document.getElementById('drawDone');
  const clearBtn = document.getElementById('drawClear');
  const nextBtn = document.getElementById('drawNext');
  const finishBtn = document.getElementById('drawFinish');
  const startBtn = document.getElementById('drawStart');
  const durSel = document.getElementById('drawDuration');
  const statusEl = document.getElementById('drawStatus');
  const colorInput = document.getElementById('drawColor');
  const widthInput = document.getElementById('drawWidth');
  const totalModeChk = document.getElementById('drawTotalMode');
  const totalSecondsInput = document.getElementById('drawTotalSeconds');
  const guideChk = document.getElementById('drawGuide');
  let drawing=false, last=[0,0], time=0, interval=null, currentChar='', running=false, correctCount=0, asked=0;
  let strokes=[]; // kullanıcı strokes
  let totalTimer=0, totalInterval=null, totalDuration=0;
  const glyphCache = new Map(); // referans şekil önbellek

  // Tema kontrolü: önceki sürümde getComputedStyle(...).classList kullanımı hatalıydı
  const isLightTheme = () => document.documentElement.classList.contains('light');
  ctx.lineWidth=10; ctx.lineCap='round'; ctx.strokeStyle= isLightTheme() ? '#222' : '#fff';

  function enabledPool(){
    const enabled = getEnabledCharsFromGroups();
    const pool = HIRAGANA.filter(r=>enabled.includes(r[0]));
    return pool.length?pool:HIRAGANA;
  }
  function pick(){
    const pool = enabledPool();
    const item = pool[Math.floor(Math.random()*pool.length)];
    currentChar=item[0];
    targetEl.textContent=item.slice(1)[0]; // romaji göster
  ctx.clearRect(0,0,canvas.width,canvas.height); strokes=[]; if(guideChk.checked) drawGuideChar();
  }
  function tick(){
    time--; statusEl.textContent=`${time}s | Doğru: ${correctCount}/${asked}`;
    if(time<=0){ finishRound(); }
  }
  function startRound(){
  // İlk başlatmada buton görünürlüklerini ayarla
  if(startBtn){ startBtn.style.display='none'; nextBtn.style.display=''; clearBtn.style.display=''; doneBtn.style.display=''; finishBtn.style.display=''; }
    pick(); asked++; running=true; time=parseInt(durSel.value)||30; statusEl.textContent=`${time}s | Doğru: ${correctCount}/${asked-1}`; interval=setInterval(tick,1000);
    if(totalModeChk.checked && !totalInterval){
      totalDuration = parseInt(totalSecondsInput.value)||120; totalTimer = totalDuration;
      totalInterval=setInterval(()=>{ totalTimer--; if(totalTimer<=0){ finishRound(); endSession(); } updateStatusExtra(); },1000);
    }
    updateStatusExtra();
  }
  function updateStatusExtra(){
    if(totalModeChk.checked){ statusEl.textContent = `${time}s | Toplam ${totalTimer}s | Doğru: ${correctCount}/${asked-1}`; }
  }
  function finishRound(){
    running=false; clearInterval(interval); interval=null; statusEl.textContent+= ' | Tur bitti';
  }
  // --- Pointer (mouse + touch + pen) destekli çizim ---
  function pointerPos(evt){
    const e = evt.touches? evt.touches[0] : evt;
    const r = canvas.getBoundingClientRect();
    // Eğer canvas CSS ile ölçeklendiyse doğru koordinat için ölçek uygula
    const scaleX = canvas.width / r.width;
    const scaleY = canvas.height / r.height;
    return [ (e.clientX - r.left) * scaleX, (e.clientY - r.top) * scaleY ];
  }
  function startStroke(e){
    if(!running) return; e.preventDefault();
    drawing=true; const p=pointerPos(e); last=p; strokes.push([[last[0],last[1]]]);
  }
  function moveStroke(e){
    if(!drawing) return; e.preventDefault();
    const p=pointerPos(e); const x=p[0], y=p[1];
    ctx.beginPath(); ctx.moveTo(last[0],last[1]); ctx.lineTo(x,y); ctx.stroke(); last=[x,y]; strokes[strokes.length-1].push([x,y]);
    if(running && strokes.length && strokes[strokes.length-1].length%6===0){
      const sc=similarityScore();
      statusEl.textContent=`${time}s${totalModeChk.checked?` | Toplam ${totalTimer}s`:''} | Skor ~${sc} | Doğru: ${correctCount}/${asked-1}`;
    }
  }
  function endStroke(){ drawing=false; }
  canvas.addEventListener('pointerdown', startStroke, {passive:false});
  canvas.addEventListener('pointermove', moveStroke, {passive:false});
  window.addEventListener('pointerup', endStroke);
  // Eski dokunmatik tarayıcılar için touch fallback
  canvas.addEventListener('touchstart', startStroke, {passive:false});
  canvas.addEventListener('touchmove', moveStroke, {passive:false});
  window.addEventListener('touchend', endStroke);
  clearBtn.addEventListener('click',()=>{ ctx.clearRect(0,0,canvas.width,canvas.height); strokes=[]; if(guideChk.checked) drawGuideChar(); });
  colorInput.addEventListener('input', ()=>{ ctx.strokeStyle=colorInput.value; });
  widthInput.addEventListener('input', ()=>{ ctx.lineWidth=parseInt(widthInput.value)||10; });

  // ----- Gelişmiş Benzerlik (normalizasyon + referans piksel bulutu + DTW) -----
  function getGlyphPoints(ch){
    if(glyphCache.has(ch)) return glyphCache.get(ch);
    const off = document.createElement('canvas'); off.width=160; off.height=160; const c=off.getContext('2d');
    c.fillStyle='#000'; c.font='120px system-ui'; c.textBaseline='alphabetic'; c.clearRect(0,0,160,160);
    c.fillText(ch,15,125);
    const img = c.getImageData(0,0,160,160).data;
    const pts=[];
    for(let y=0;y<160;y+=2){
      for(let x=0;x<160;x+=2){
        const a = img[(y*160+x)*4+3];
        if(a>128) pts.push([x,y]);
      }
    }
    if(!pts.length){ glyphCache.set(ch,[]); return []; }
    // normalize
    let minX=Infinity,minY=Infinity,maxX=-Infinity,maxY=-Infinity;
    pts.forEach(([x,y])=>{ if(x<minX)minX=x; if(y<minY)minY=y; if(x>maxX)maxX=x; if(y>maxY)maxY=y; });
    const w=maxX-minX||1; const h=maxY-minY||1;
    const norm = pts.map(([x,y])=>[(x-minX)/w,(y-minY)/h]);
    norm.sort((a,b)=>a[0]-b[0]||a[1]-b[1]);
    const targetCount=80;
    const step = Math.max(1, Math.floor(norm.length/targetCount));
    const reduced=[]; for(let i=0;i<norm.length && reduced.length<targetCount;i+=step) reduced.push(norm[i]);
    glyphCache.set(ch,reduced);
    return reduced;
  }
  function getUserPoints(){
    if(!strokes.length) return [];
    const flat=[]; strokes.forEach(st=>st.forEach(p=>flat.push(p.slice())));
    // bounding box
    let minX=Infinity,minY=Infinity,maxX=-Infinity,maxY=-Infinity;
    flat.forEach(([x,y])=>{ if(x<minX)minX=x; if(y<minY)minY=y; if(x>maxX)maxX=x; if(y>maxY)maxY=y; });
    const w=maxX-minX||1,h=maxY-minY||1;
    const norm = flat.map(([x,y])=>[(x-minX)/w,(y-minY)/h]);
    norm.sort((a,b)=>a[0]-b[0]||a[1]-b[1]);
    const targetCount=80; const step=Math.max(1,Math.floor(norm.length/targetCount));
    const reduced=[]; for(let i=0;i<norm.length && reduced.length<targetCount;i+=step) reduced.push(norm[i]);
    return reduced;
  }
  function dtw(a,b){
    const n=a.length,m=b.length; if(!n||!m) return Infinity;
    const dp=Array.from({length:n+1},()=>Array(m+1).fill(Infinity));
    dp[0][0]=0;
    for(let i=1;i<=n;i++){
      for(let j=1;j<=m;j++){
        const dx=a[i-1][0]-b[j-1][0]; const dy=a[i-1][1]-b[j-1][1];
        const cost=Math.hypot(dx,dy);
        dp[i][j]=cost+Math.min(dp[i-1][j],dp[i][j-1],dp[i-1][j-1]);
      }
    }
    return dp[n][m];
  }
  function similarityScore(){
    const userPts=getUserPoints(); const glyphPts=getGlyphPoints(currentChar);
    if(userPts.length<8 || glyphPts.length<8){ return 0; }
    const dist = dtw(userPts,glyphPts);
    const maxPossible = Math.sqrt(2)*(Math.max(userPts.length,glyphPts.length));
    let base = 1 - (dist / maxPossible); // 0..1
    base = Math.max(0, Math.min(1, base));
    // stroke count heuristic
    const strokeFactor = Math.min(1, strokes.length/4);
    const final = (base*0.75 + strokeFactor*0.25);
    return Math.round(final*100);
  }
  function drawGuideChar(){
  // currentChar at first load is null; avoid writing 'null' string to canvas
  if(!currentChar || typeof currentChar !== 'string'){ return; }
    ctx.save();
    // Light temada açık zemin üzerinde görünürlüğü artır
    if(isLightTheme()){
      ctx.globalAlpha=0.16; ctx.fillStyle='#000000';
    } else {
      ctx.globalAlpha=0.10; ctx.fillStyle='#ffffff';
    }
    ctx.font='210px system-ui';
    ctx.textBaseline='middle';
    ctx.textAlign='center';
    ctx.translate(canvas.width/2, canvas.height/2+14);
    ctx.fillText(currentChar,0,0);
    ctx.restore();
  }
  guideChk.addEventListener('change',()=>{ if(!running){ ctx.clearRect(0,0,canvas.width,canvas.height); strokes=[]; if(guideChk.checked) drawGuideChar(); } });

  function endSession(){
    saveScore({game:'draw', correct:correctCount, asked, mode: totalModeChk.checked?'total':'round', duration: parseInt(durSel.value), totalDuration: totalDuration||0, ts:Date.now()});
  refreshTileScores();
  track('score_submit',{game:'draw', correct:correctCount, asked});
  }
  doneBtn.addEventListener('click',()=>{
    if(!running) return;
    const auto = similarityScore();
    const threshold=55;
    showDrawResultDialog(auto, threshold).then(accept=>{
      if(accept){ correctCount++; markAttempt(progressCache, currentChar, true); }
      else { markAttempt(progressCache, currentChar, false); }
      finishRound();
      if(totalModeChk.checked){ if(totalTimer>0) startRound(); else endSession(); }
      else startRound();
    });
  });
  nextBtn.addEventListener('click',()=>{ if(running) return; startRound(); });
  startBtn.addEventListener('click',()=>{ if(running) return; startRound(); });

  finishBtn.addEventListener('click',()=>{
    // Tüm oturumu erken bitir
    if(interval){ clearInterval(interval); interval=null; }
    if(totalInterval){ clearInterval(totalInterval); totalInterval=null; }
    if(running){ finishRound(); }
    endSession();
  });

  registerCleanup(()=>{ if(interval){ clearInterval(interval); } if(totalInterval){ clearInterval(totalInterval); } running=false; });
}

// ---- UI Helpers (Modal) ----
function showDrawResultDialog(score, threshold){
  return new Promise(resolve=>{
    // Önce varsa eski modalı kaldır
    const existing = document.querySelector('.modal-overlay');
    if(existing) existing.remove();
    const ov = document.createElement('div');
    ov.className='modal-overlay';
    const box = document.createElement('div');
    box.className='modal glass';
    const success = score >= threshold;
    box.innerHTML = `
      <h4>${success? 'Otomatik skor' : 'Skor'} ≈${score}</h4>
      <div class="score-badge" aria-label="skor">${score}</div>
      <div class="modal-text">Eşik: <strong>${threshold}</strong><br>${success? 'Doğru kabul edilsin mi?' : 'Eşik altında. Yine de doğru saymak ister misin?'}</div>
      <div class="actions">
        <button class="ghost" data-act="no">Yanlış</button>
        <button class="primary" data-act="yes">Doğru Say</button>
      </div>`;
    ov.appendChild(box); document.body.appendChild(ov);
    const focusBtn = box.querySelector('[data-act="yes"]');
    setTimeout(()=>focusBtn.focus(),50);
    function close(val){ ov.classList.add('closing'); resolve(val); setTimeout(()=>ov.remove(),120); }
    ov.addEventListener('click',e=>{ if(e.target===ov) close(false); });
    box.addEventListener('click',e=>{
      const btn = e.target.closest('button[data-act]');
      if(!btn) return;
      const act = btn.dataset.act==='yes';
      close(act);
    });
    window.addEventListener('keydown', function esc(e){ if(e.key==='Escape'){ close(false); window.removeEventListener('keydown',esc);} });
  });
}

// FLASH CARDS -------------------------------------------------
function startFlash(){
  gameArea.classList.remove('hidden');
  gameArea.innerHTML='<h3>Flash Kart</h3><div class="flash-wrap"><div class="flash-card" id="flashCard"><div class="flash-inner"><div class="flash-face">あ</div><div class="flash-face flash-back">romaji</div></div></div><div><button id="flashPrev" class="ghost">Önceki</button><button id="flashFlip" class="primary">Çevir</button><button id="flashNext" class="ghost">Sonraki</button></div></div>';
  const card = document.getElementById('flashCard');
  const inner = card.querySelector('.flash-inner');
  const front = inner.querySelector('.flash-face');
  const back = inner.querySelector('.flash-back');
  const prevBtn = document.getElementById('flashPrev');
  const nextBtn = document.getElementById('flashNext');
  const flipBtn = document.getElementById('flashFlip');
  let idx=0;
  function render(){
    const item = HIRAGANA[idx];
    front.textContent=item[0];
    back.textContent=item.slice(1).join(', ');
    card.classList.remove('flipped');
  }
  prevBtn.addEventListener('click',()=>{ idx=(idx-1+HIRAGANA.length)%HIRAGANA.length; render(); });
  nextBtn.addEventListener('click',()=>{ idx=(idx+1)%HIRAGANA.length; render(); });
  flipBtn.addEventListener('click',()=>{ card.classList.toggle('flipped'); });
  card.addEventListener('click',()=>{ card.classList.toggle('flipped'); });
  render();
}

const dispatch = { memory:startMemory, typing:startTyping, flash:startFlash, draw:startDraw };
renderScoreHistory();
refreshTileScores();

gameTiles.forEach(tile=>{
  tile.querySelector('button').addEventListener('click',()=>{
    const g = tile.dataset.game;
    if(dispatch[g]) dispatch[g]();
    gameArea.scrollIntoView({behavior:'smooth'});
  });
});
