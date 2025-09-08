// Hiragana veri ve depolama yardımcıları (ES Module)
export const HIRAGANA = [
  ["あ","a"],["い","i"],["う","u"],["え","e"],["お","o"],
  ["か","ka"],["き","ki"],["く","ku"],["け","ke"],["こ","ko"],
  ["さ","sa"],["し","shi","si"],["す","su"],["せ","se"],["そ","so"],
  ["た","ta"],["ち","chi","ti"],["つ","tsu","tu"],["て","te"],["と","to"],
  ["な","na"],["に","ni"],["ぬ","nu"],["ね","ne"],["の","no"],
  ["は","ha"],["ひ","hi"],["ふ","fu","hu"],["へ","he"],["ほ","ho"],
  ["ま","ma"],["み","mi"],["む","mu"],["め","me"],["も","mo"],
  ["や","ya"],["ゆ","yu"],["よ","yo"],
  ["ら","ra"],["り","ri"],["る","ru"],["れ","re"],["ろ","ro"],
  ["わ","wa"],["を","wo","o"],
  ["ん","n"]
];

// Gruplar (öğrenme sırası blokları)
export const HIRAGANA_GROUPS = [
  { id:'a', label:'a · i · u · e · o', chars:['あ','い','う','え','お'] },
  { id:'ka', label:'ka · ki · ku · ke · ko', chars:['か','き','く','け','こ'] },
  { id:'sa', label:'sa · shi · su · se · so', chars:['さ','し','す','せ','そ'] },
  { id:'ta', label:'ta · chi · tsu · te · to', chars:['た','ち','つ','て','と'] },
  { id:'na', label:'na · ni · nu · ne · no', chars:['な','に','ぬ','ね','の'] },
  { id:'ha', label:'ha · hi · fu · he · ho', chars:['は','ひ','ふ','へ','ほ'] },
  { id:'ma', label:'ma · mi · mu · me · mo', chars:['ま','み','む','め','も'] },
  { id:'ya', label:'ya · yu · yo', chars:['や','ゆ','よ'] },
  { id:'ra', label:'ra · ri · ru · re · ro', chars:['ら','り','る','れ','ろ'] },
  { id:'wa', label:'wa · wo · n', chars:['わ','を','ん'] }
  // İleride: alternatif (ga, za, pa, kya vb.) eklenebilir
];

const STORAGE_KEY = 'hiraganaProgressV1';
const GROUP_KEY = 'hiraganaGroupsV1';

export function loadProgress(){
  let raw = localStorage.getItem(STORAGE_KEY);
  if(!raw){
  const data = { learned: [], attempts: {}, totalCorrect:0, totalIncorrect:0, streak:0, learning: { frontierIndex:-1, requiredMastery:6, perChar:{}, mastered:[], active:[] } };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    return data;
  }
  try{ return JSON.parse(raw); }catch(e){
    console.warn('Bozuk veri, sıfırlanıyor');
    localStorage.removeItem(STORAGE_KEY);
    return loadProgress();
  }
}

export function saveProgress(p){
  localStorage.setItem(STORAGE_KEY, JSON.stringify(p));
}

export function markAttempt(p, char, correct){
  p.attempts[char] = p.attempts[char] || {correct:0, incorrect:0};
  if(correct){
    p.attempts[char].correct++;
    p.totalCorrect++;
    p.streak++;
    if(!p.learned.includes(char)) p.learned.push(char);
  } else {
    p.attempts[char].incorrect++;
    p.totalIncorrect++;
    p.streak = 0;
  }
  saveProgress(p);
  window.dispatchEvent(new CustomEvent('progress-updated', {detail:{progress:p}}));
}

export function getAllChars(){ return HIRAGANA.map(x=>x[0]); }
export function getRomajiList(char){
  const entry = HIRAGANA.find(r=>r[0]===char);
  return entry ? entry.slice(1) : [];
}
export function getAccuracy(p){
  const total = p.totalCorrect + p.totalIncorrect;
  return total ? (p.totalCorrect/total*100) : 0;
}

// --- Group Preferences ---
export function loadGroupPrefs(){
  let raw = localStorage.getItem(GROUP_KEY);
  if(!raw){
    // Varsayılan: sadece ilk grup işaretli (kademeli açılma hissi için)
    const prefs = { enabled: [HIRAGANA_GROUPS[0].id] };
    localStorage.setItem(GROUP_KEY, JSON.stringify(prefs));
    return prefs;
  }
  try { return JSON.parse(raw); } catch(e){
    localStorage.removeItem(GROUP_KEY);
    return loadGroupPrefs();
  }
}

export function saveGroupPrefs(prefs){
  localStorage.setItem(GROUP_KEY, JSON.stringify(prefs));
}

export function getEnabledCharsFromGroups(){
  const prefs = loadGroupPrefs();
  const set = new Set();
  HIRAGANA_GROUPS.forEach(g=>{ if(prefs.enabled.includes(g.id)) g.chars.forEach(c=>set.add(c)); });
  return Array.from(set);
}

// --- Learning Mode Helpers (Sequential Mastery) ---
function ensureLearning(p){
  if(!p.learning){
    p.learning = { frontierIndex:-1, requiredMastery:6, perChar:{}, mastered:[], active:[] };
  }
  const L = p.learning;
  // Migration from old structure using nextIndex
  if(typeof L.frontierIndex !== 'number'){
    if(typeof L.nextIndex === 'number'){
      L.frontierIndex = L.nextIndex; // reuse
    } else {
      L.frontierIndex = -1;
    }
  }
  if(!Array.isArray(L.active)) L.active = [];
  if(typeof L.requiredMastery !== 'number') L.requiredMastery = 6;
  if(!L.perChar) L.perChar = {};
  if(!Array.isArray(L.mastered)) L.mastered = [];
  // Rebuild active if empty but frontierIndex >=0
  if(L.active.length === 0){
    const introduced = HIRAGANA.slice(0, L.frontierIndex+1).map(r=>r[0]);
    L.active = introduced.filter(c=>!L.mastered.includes(c));
  }
  // If nothing introduced yet, introduce first char
  if(L.frontierIndex === -1){
    introduceNextChar(p, L);
  }
  return L;
}

export function getLearningState(p){ return ensureLearning(p); }

export function getLearningActiveChars(p){
  const L = ensureLearning(p);
  return L.active.slice();
}

function introduceNextChar(p, L){
  if(L.frontierIndex >= HIRAGANA.length-1) return false;
  L.frontierIndex += 1;
  const ch = HIRAGANA[L.frontierIndex][0];
  if(!L.mastered.includes(ch) && !L.active.includes(ch)) L.active.push(ch);
  return true;
}

export function getCharMastery(p, char){
  const L = ensureLearning(p);
  return L.perChar[char] || 0;
}

export function learningSelectNext(p){
  const L = ensureLearning(p);
  if(L.active.length === 0){
    introduceNextChar(p, L);
  }
  if(L.active.length === 0) return null;
  // Weight by remaining mastery requirement
  const weights = L.active.map(c=>{
    const current = L.perChar[c] || 0;
    const remaining = Math.max(1, L.requiredMastery - current);
    return {c, w: remaining};
  });
  const total = weights.reduce((a,b)=>a+b.w,0);
  let r = Math.random()*total;
  for(const item of weights){
    if(r < item.w) return item.c;
    r -= item.w;
  }
  return weights[weights.length-1].c;
}

export function recordLearningAnswer(p, char, correct){
  const L = ensureLearning(p);
  if(!L.active.includes(char) && !L.mastered.includes(char)) return; // ignore
  if(correct){
    if(!L.perChar[char]) L.perChar[char] = 0;
    const before = L.perChar[char];
    L.perChar[char] += 1;
    // If this char is the frontier (newest introduced) and first success -> introduce next char
    const indexOfChar = HIRAGANA.findIndex(r=>r[0]===char);
    if(indexOfChar === L.frontierIndex && before === 0){
      introduceNextChar(p, L);
    }
    // Mastered removal
    if(L.perChar[char] >= L.requiredMastery){
      if(!L.mastered.includes(char)) L.mastered.push(char);
      const pos = L.active.indexOf(char);
      if(pos>-1) L.active.splice(pos,1);
      if(!p.learned.includes(char)) p.learned.push(char);
    }
  } else {
    // wrong -> do nothing, char stays in active
  }
  saveProgress(p);
  window.dispatchEvent(new CustomEvent('learning-updated', {detail:{progress:p, char, correct}}));
}

export function resetLearning(p){
  p.learning = { frontierIndex:-1, requiredMastery:6, perChar:{}, mastered:[], active:[] };
  saveProgress(p);
  window.dispatchEvent(new CustomEvent('learning-updated', {detail:{progress:p}}));
}
