import { HIRAGANA, HIRAGANA_GROUPS, loadProgress, markAttempt, getRomajiList, getLearningState, getLearningActiveChars, getCharMastery, learningSelectNext, recordLearningAnswer, loadGroupPrefs, saveGroupPrefs, getEnabledCharsFromGroups } from './data.js';

const quizSection = document.getElementById('quiz');
const startQuizBtn = document.getElementById('startQuiz');
const showChartBtn = document.getElementById('showChart');
const currentCharEl = document.getElementById('currentChar');
const answerInput = document.getElementById('answerInput');
const feedbackEl = document.getElementById('feedback');
const submitBtn = document.getElementById('submitBtn');
const skipBtn = document.getElementById('skipBtn');
const revealBtn = document.getElementById('revealBtn');
const progressBar = document.getElementById('progressBar');
const sessionStats = document.getElementById('sessionStats');
const learningStats = document.getElementById('learningStats');
const learningModeBtn = document.getElementById('learningModeBtn');
const tabsContainer = document.querySelector('.mode-tabs');
const groupBoxContainer = document.getElementById('groupCheckboxes'); // removed old inline
const groupBoxContainerGames = document.getElementById('groupCheckboxesGames'); // removed
const groupBoxContainerGlobal = document.getElementById('groupCheckboxesGlobal');
const choiceArea = document.getElementById('choiceArea');
const testStatusEl = document.getElementById('testStatus');
const quizCard = document.getElementById('quizCard');
let mode = 'standard'; // 'standard' | 'learning' | 'mastered' | 'test'

let progress = loadProgress();
let queue = []; // güncel çalışma listesi (standart)
let retry = [];
let currentChar = null;
let sessionCorrect=0, sessionIncorrect=0;
let lastChars = []; // son görülen 2-3 karakteri tutup tekrarını azalt
let testTotal = 20; // test modu soru sayısı
let testAsked = 0; // sorulan soru sayısı

function initGroupCheckboxes(){
  const containers = [groupBoxContainerGlobal].filter(Boolean);
  if(!containers.length) return;
  const prefs = loadGroupPrefs();
  containers.forEach(cont=>{
    cont.innerHTML='';
    HIRAGANA_GROUPS.forEach(g=>{
      const div = document.createElement('label');
      div.className='grp-item';
  const charsHTML = g.chars.map(c=>`<span class="char-mini">${c}</span>`).join('');
  div.innerHTML = `<input type="checkbox" data-gid="${g.id}"> <span class="grp-label">${g.label}</span><div class="grp-chars">${charsHTML}</div>`;
      const cb = div.querySelector('input');
      cb.checked = prefs.enabled.includes(g.id);
      const handler = ()=>{
        const p = loadGroupPrefs();
        if(cb.checked){ if(!p.enabled.includes(g.id)) p.enabled.push(g.id); }
        else { p.enabled = p.enabled.filter(x=>x!==g.id); if(p.enabled.length===0){ p.enabled=[g.id]; cb.checked=true; } }
        saveGroupPrefs(p);
        // sync all containers
        initGroupCheckboxes();
        buildQueue();
      };
      cb.addEventListener('change', handler);
      div.classList.toggle('on', cb.checked);
      cont.appendChild(div);
    });
  });
}

function buildQueue(){
  const enabledSet = new Set(getEnabledCharsFromGroups());
  if(mode === 'standard' || mode === 'test'){
    const all = HIRAGANA.filter(r=>enabledSet.has(r[0]));
    all.sort((a,b)=>{
      const ac = progress.attempts[a[0]]?.incorrect || 0;
      const bc = progress.attempts[b[0]]?.incorrect || 0;
      return bc - ac || Math.random()-0.5;
    });
    queue = all.map(x=>x[0]);
  } else if(mode === 'learning') {
    queue = []; // learning modunda dinamik seçim yapılacak
  } else if(mode === 'mastered') {
    const L = getLearningState(progress);
    queue = L.mastered.filter(c=>enabledSet.has(c));
    shuffle(queue);
  }
}

function shuffle(arr){ for(let i=arr.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); [arr[i],arr[j]]=[arr[j],arr[i]];} }

function pickAvoidRecent(){
  // Küçük bir deneme ile son 2 karma tekrarını azaltır
  const recent = new Set(lastChars);
  if(queue.length<=1) return queue.shift();
  // İlk adaylardan birini bul
  for(let i=0;i<queue.length;i++){
    const c = queue[i];
    if(!recent.has(c)){
      queue.splice(i,1);
      return c;
    }
  }
  return queue.shift();
}

function buildChoices(correctChar){
  const enabledChars = getEnabledCharsFromGroups();
  const pool = enabledChars.filter(c=>c!==correctChar);
  shuffle(pool);
  const distractors = pool.slice(0,3);
  const correctRomaji = getRomajiList(correctChar)[0];
  const options = [correctRomaji, ...distractors.map(c=>getRomajiList(c)[0])];
  shuffle(options);
  choiceArea.innerHTML='';
  let locked=false;
  options.forEach(opt=>{
    const btn = document.createElement('button');
    btn.className='choice-btn';
    btn.textContent=opt;
    btn.addEventListener('click', ()=>{
      if(locked) return;
      answerInput.value = opt;
      const list = getRomajiList(currentChar).map(x=>x.toLowerCase());
      const correct = list.includes(opt.toLowerCase());
      locked=true;
      if(correct){
        btn.classList.add('correct');
      } else {
        btn.classList.add('wrong');
        Array.from(choiceArea.children).forEach(ch=>{
          if(list.includes(ch.textContent.toLowerCase())) ch.classList.add('correct');
        });
      }
      submitAnswer(true);
    });
    choiceArea.appendChild(btn);
  });
  choiceArea.classList.remove('hidden');
}

function nextChar(){
  if(mode === 'standard' || mode === 'test'){
    if(!queue.length && retry.length){ queue = retry; retry = []; }
  }
  if(mode === 'learning'){
    currentChar = learningSelectNext(progress);
    // Aynı karakter ard arda gelmesin (aktif >1 ise)
    if(lastChars.length && lastChars[lastChars.length-1]===currentChar){
      const Lactive = getLearningActiveChars(progress);
      if(Lactive.length>1){
        for(let attempt=0; attempt<4 && lastChars[lastChars.length-1]===currentChar; attempt++){
          currentChar = learningSelectNext(progress);
        }
      }
    }
    if(!currentChar){
      feedbackEl.textContent = 'Tüm karakterler mastery tamamlandı!';
      feedbackEl.className = 'feedback ok';
      updateProgressBar();
      return;
    }
  } else {
    if(!queue.length){
      buildQueue();
      if(!queue.length){
        feedbackEl.textContent = 'Tebrikler! Oturum bitti.';
        feedbackEl.className = 'feedback ok';
        updateProgressBar();
        return;
      }
    }
    currentChar = pickAvoidRecent();
  }
  lastChars.push(currentChar); if(lastChars.length>3) lastChars.shift();
  currentCharEl.textContent = currentChar;
  answerInput.value='';
  answerInput.focus();
  feedbackEl.textContent='';
  if(mode === 'test') buildChoices(currentChar); else { choiceArea.classList.add('hidden'); choiceArea.innerHTML=''; }
  updateProgressBar();
  renderLearningStats();
}

function updateProgressBar(){
  const learned = progress.learned.length;
  const total = HIRAGANA.length;
  progressBar.style.width = (learned/total*100).toFixed(1)+'%';
  sessionStats.textContent = `Doğru: ${sessionCorrect} | Yanlış: ${sessionIncorrect} | Öğrenilen: ${learned}/${total} (Mod: ${mode})`;
  window.dispatchEvent(new CustomEvent('session-stats', {detail:{sessionCorrect, sessionIncorrect}}));
}

function updateTestStatus(){
  if(mode!=='test'){ testStatusEl?.classList.add('hidden'); return; }
  testStatusEl.classList.remove('hidden');
  testStatusEl.textContent = `Soru ${testAsked+1}/${testTotal} · Skor ${sessionCorrect}`;
}

function renderLearningStats(){
  if(mode !== 'learning') { learningStats.textContent=''; return; }
  const L = getLearningState(progress);
  const active = getLearningActiveChars(progress);
  const mastered = L.mastered.length;
  const need = L.requiredMastery;
  const activeStr = active.map(c=>`${c}:${getCharMastery(progress,c)||0}/${need}`).join('  ');
  learningStats.textContent = `Aktif (${active.length}) -> ${activeStr}\nMastered: ${mastered}/${HIRAGANA.length}`;
}

function submitAnswer(fromChoice=false){
  const val = answerInput.value.trim().toLowerCase();
  if(!currentChar || !val) return;
  const list = getRomajiList(currentChar).map(x=>x.toLowerCase());
  const correct = list.includes(val);
  if(correct){
    feedbackEl.textContent = 'Doğru!';
    feedbackEl.className = 'feedback ok';
    sessionCorrect++;
    markAttempt(progress, currentChar, true);
    if(mode === 'learning') recordLearningAnswer(progress, currentChar, true);
  } else {
    feedbackEl.textContent = 'Yanlış. Doğrusu: '+list[0];
    feedbackEl.className = 'feedback err';
    sessionIncorrect++;
    markAttempt(progress, currentChar, false);
    if(mode === 'standard'){
      if(!retry.includes(currentChar)) retry.push(currentChar);
    } else if(mode === 'learning') recordLearningAnswer(progress, currentChar, false);
  }
  if(mode==='test'){
    testAsked++;
    updateTestStatus();
  }
  updateProgressBar();
  renderLearningStats();
  if(mode==='test'){
    if(testAsked>=testTotal){
      feedbackEl.textContent = `Test bitti! Skor: ${sessionCorrect}/${testTotal}`;
      feedbackEl.className='feedback ok';
      choiceArea.classList.add('hidden');
      return;
    }
  }
  if(!fromChoice) setTimeout(nextChar, 650); else setTimeout(nextChar, 800);
}

submitBtn.addEventListener('click', submitAnswer);
answerInput.addEventListener('keydown', e=>{
  if(e.key==='Enter') submitAnswer();
});

skipBtn.addEventListener('click', ()=>{
  if(currentChar && (mode==='standard' || mode==='test')) queue.push(currentChar);
  nextChar();
});

revealBtn.addEventListener('click', ()=>{
  if(!currentChar) return;
  feedbackEl.textContent = 'Cevap: '+ getRomajiList(currentChar)[0];
  feedbackEl.className='feedback';
});

function start(modeToUse){
  mode = modeToUse;
  document.querySelectorAll('.mode-tabs .tab').forEach(t=>{
    t.classList.toggle('active', t.dataset.mode===mode);
  });
  quizSection.classList.remove('hidden');
  sessionCorrect=sessionIncorrect=0; retry=[]; currentChar=null; lastChars=[]; testAsked=0;
  if(mode==='test'){
    answerInput.classList.add('hidden'); submitBtn.classList.add('hidden'); revealBtn.classList.add('hidden');
    quizCard?.classList.add('test-layout');
    updateTestStatus();
  } else {
    answerInput.classList.remove('hidden'); submitBtn.classList.remove('hidden'); revealBtn.classList.remove('hidden');
    quizCard?.classList.remove('test-layout');
    updateTestStatus();
  }
  buildQueue();
  nextChar();
  window.scrollTo({top:quizSection.offsetTop-60,behavior:'smooth'});
}

startQuizBtn.addEventListener('click', ()=> start('standard'));
learningModeBtn.addEventListener('click', ()=> start('learning'));

if(tabsContainer){
  tabsContainer.addEventListener('click', e=>{
    const btn = e.target.closest('.tab');
    if(!btn) return;
    start(btn.dataset.mode);
  });
}

showChartBtn.addEventListener('click', ()=>{
  document.getElementById('tablo').scrollIntoView({behavior:'smooth'});
});

function renderHiraganaTable(){
  const container = document.getElementById('hiraganaTable');
  if(!container) return;
  container.innerHTML='';
  const wrap = document.createElement('div');
  wrap.className='table-grid';
  HIRAGANA_GROUPS.forEach(g=>{
    const groupDiv = document.createElement('div');
    groupDiv.className='table-group';
    const title = document.createElement('div');
    title.className='group-head';
    title.textContent = g.label;
    groupDiv.appendChild(title);
    const row = document.createElement('div');
    row.className='group-row';
    g.chars.forEach(c=>{
      const cell = document.createElement('div');
      cell.className='kana-cell';
      cell.innerHTML = `<span class="kana">${c}</span><span class="romaji">${getRomajiList(c)[0]}</span>`;
      row.appendChild(cell);
    });
    groupDiv.appendChild(row);
    wrap.appendChild(groupDiv);
  });
  container.appendChild(wrap);
}

initGroupCheckboxes();
updateProgressBar();
renderLearningStats();
renderHiraganaTable();
