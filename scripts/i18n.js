// Basit i18n sistemi (TR & EN)
// Kullanım: import { t, setLang, getLang, onLangChange, applyStaticI18n } from './i18n.js'
const LANG_KEY = 'hlLang';
let current = loadLang();
const listeners = new Set();

function loadLang(){
  try { const v = localStorage.getItem(LANG_KEY); return (v==='en'||v==='tr')?v:'tr'; } catch(_) { return 'tr'; }
}
export function getLang(){ return current; }
export function setLang(l){ if(l!==current && (l==='tr'||l==='en')){ current=l; try{localStorage.setItem(LANG_KEY,l);}catch(_){ } document.documentElement.setAttribute('lang', l==='tr'?'tr':'en'); applyStaticI18n(); listeners.forEach(fn=>{try{fn(l);}catch(_){}});} }
export function onLangChange(fn){ listeners.add(fn); }

const dict = {
  tr: {
    nav_quiz: 'Quiz',
    nav_games: 'Oyunlar',
    nav_table: 'Tüm Tablo',
    hero_title: "Hiragana'yı Etkileşimli Öğren",
    hero_sub: 'Spaced repetition ve mini oyunlarla temel 46 Hiragana karakterini kalıcı öğren.',
    start_quiz: "Quiz'e Başla",
    show_chart: 'Tüm Tablo',
    learning_mode: 'Sıralı Öğren',
    quiz_heading: 'Hiragana Quiz',
    mode_standard: 'Karışık',
    mode_learning: 'Sıralı Öğrenme',
    mode_mastered: 'Tamamlananlar',
    mode_test: 'Test (4 Şık)',
    input_placeholder: 'Okunuş (romaji)',
    skip: 'Atla', reveal: 'Göster', submit: 'Gönder',
    games_heading: 'Mini Oyunlar',
    memory_title: 'Hafıza Eşleştirme', memory_desc: 'Karakteri doğru romaji ile eşleştir, süre dolmadan tüm çiftleri aç.',
    typing_title: 'Hızlı Yaz', typing_desc: 'Beliren karakterleri mümkün olduğunca hızlı ve doğru yaz.',
    flash_title: 'Flash Kart', flash_desc: 'Çevir, tahmin et ve ezberini pekiştir.',
    draw_title: 'Çizim', draw_desc: 'Romajisi verilen karakteri çiz ve otomatik skorla değerlendir.',
    last_score_none: 'Son skor yok', start: 'Başlat', finish: 'Bitir', early_finish: 'Erken bitirdin.',
    duration: 'Süre', pairs: 'Çift', matched_pairs: 'Eşleşen',
    time_up: 'Süre bitti!', congrats_remaining: 'Tebrikler! {sec}s kala bitirdin.',
    reduced_pairs_warning: 'Seçili grup sayısı daha az, çift sayısı otomatik küçültüldü.',
    typing_time_up: 'Süre bitti! Skor: {score}', typing_early_finish: 'Erken bitirdin! Skor: {score}',
    correct_short: 'Doğru!', wrong_with_answer: 'Yanlış. Doğrusu: {answer}', answer_reveal: 'Cevap: {answer}',
    all_mastered: 'Tüm karakterler mastery tamamlandı!', session_done: 'Tebrikler! Oturum bitti.',
    test_finished: 'Test bitti! Skor: {score}/{total}',
    session_stats: 'Doğru: {correct} | Yanlış: {wrong} | Öğrenilen: {learned}/{total} (Mod: {mode})',
    test_status: 'Soru {current}/{total} · Skor {score}',
    learning_active_label: 'Aktif ({count}) -> {list}\nMastered: {mastered}/{total}',
    memory_score_line: 'Hafıza ({pairs} çift) kalan {remaining}s',
    typing_score_line: 'Yaz ({duration}s) - Skor {score}',
    draw_score_line: 'Çizim ({mode} {dur}s) Doğru {correct}/{asked}',
    clear: 'Temizle', no_records: 'Kayıt yok',
    guide: 'Rehber', round: 'Tur', total_mode: 'Toplam', color: 'Renk', thickness: 'Kalınlık', new_btn: 'Yeni', clear_btn: 'Temizle', done_btn: 'Tamam', finish_btn: 'Bitir',
    draw_round_end: ' | Tur bitti', draw_status_score: 'Skor ~{score}',
    modal_auto_score: 'Otomatik skor', modal_score: 'Skor', modal_threshold: 'Eşik', modal_accept_question: 'Doğru kabul edilsin mi?', modal_under_question: 'Eşik altında. Yine de doğru saymak ister misin?', modal_wrong: 'Yanlış', modal_correct: 'Doğru Say',
    flash_prev: 'Önceki', flash_flip: 'Çevir', flash_next: 'Sonraki',
    consent_accept: 'Kabul', consent_reject: 'Reddet', consent_details: 'Detaylar', consent_reset: 'Tercihi Sıfırla', consent_close: 'Kapat',
  manage_consent: 'Çerez Tercihi', privacy: 'Gizlilik', groups_title: 'Harf Grupları', groups_hint: 'Seçtiklerin tüm quiz ve oyunlara uygulanır.', groups_fab: 'Gruplar',
  // Word game
  word_title: 'Kelime Yaz',
  word_desc: 'Gösterilen Hiragana kelimenin okunuşunu yaz ve anlamını öğren.',
  word_check: 'Kontrol',
  word_next: 'Sonraki',
  word_correct: 'Doğru! Anlamı: {meaning}',
  word_wrong: 'Yanlış. Doğrusu: {answer}',
  word_no_words: 'Seçili harf gruplarıyla uygun kelime yok.',
  word_score_line: 'Doğru {correct}/{total}',
  word_score_history_line: 'Kelime ({correct}/{total})'
  , word_length_label: 'Harf sayısı', word_length_any: 'Hepsi', word_no_words_len: 'Bu uzunlukta uygun kelime yok, tüm uzunluklar gösteriliyor.'
  , word_listen: 'Dinle'
  , word_audio_missing: 'Ses bulunamadı (dosya yok).'
  , word_audio_error: 'Ses çalınamadı.'
  , word_packs_label: 'Kelime Paketleri'
  , word_pack_food: 'Yiyecek'
  , word_pack_transport: 'Ulaşım'
  , word_pack_greetings: 'Selamlaşma'
  , word_pack_none_selected: 'Hiç paket seçilmedi.'
  },
  en: {
    nav_quiz: 'Quiz', nav_games: 'Games', nav_table: 'Full Chart',
    hero_title: 'Learn Hiragana Interactively',
    hero_sub: 'Master the core 46 Hiragana with spaced repetition and mini games.',
    start_quiz: 'Start Quiz', show_chart: 'Full Chart', learning_mode: 'Sequential Learn',
    quiz_heading: 'Hiragana Quiz',
    mode_standard: 'Mixed', mode_learning: 'Learning', mode_mastered: 'Mastered', mode_test: 'Test (4 Choices)',
    input_placeholder: 'Reading (romaji)', skip: 'Skip', reveal: 'Reveal', submit: 'Submit',
    games_heading: 'Mini Games',
    memory_title: 'Memory Match', memory_desc: 'Match the character with its romaji before time runs out.',
    typing_title: 'Speed Type', typing_desc: 'Type the appearing characters as fast and accurately as possible.',
    flash_title: 'Flash Cards', flash_desc: 'Flip, guess and reinforce memory.',
    draw_title: 'Drawing', draw_desc: 'Draw the character given its romaji and auto-score.',
    last_score_none: 'No score yet', start: 'Start', finish: 'Finish', early_finish: 'Finished early.',
    duration: 'Time', pairs: 'Pairs', matched_pairs: 'Matched',
    time_up: 'Time is up!', congrats_remaining: 'Congrats! Finished with {sec}s left.',
    reduced_pairs_warning: 'Selected groups fewer than requested; pairs reduced automatically.',
    typing_time_up: 'Time up! Score: {score}', typing_early_finish: 'Finished early! Score: {score}',
    correct_short: 'Correct!', wrong_with_answer: 'Wrong. Answer: {answer}', answer_reveal: 'Answer: {answer}',
    all_mastered: 'All characters fully mastered!', session_done: 'Great! Session complete.',
    test_finished: 'Test finished! Score: {score}/{total}',
    session_stats: 'Correct: {correct} | Wrong: {wrong} | Learned: {learned}/{total} (Mode: {mode})',
    test_status: 'Q {current}/{total} · Score {score}',
    learning_active_label: 'Active ({count}) -> {list}\nMastered: {mastered}/{total}',
    memory_score_line: 'Memory ({pairs} pairs) left {remaining}s',
    typing_score_line: 'Type ({duration}s) - Score {score}',
    draw_score_line: 'Draw ({mode} {dur}s) Correct {correct}/{asked}',
    clear: 'Clear', no_records: 'No records',
    guide: 'Guide', round: 'Round', total_mode: 'Total', color: 'Color', thickness: 'Thickness', new_btn: 'New', clear_btn: 'Clear', done_btn: 'Done', finish_btn: 'Finish',
    draw_round_end: ' | Round over', draw_status_score: 'Score ~{score}',
    modal_auto_score: 'Auto score', modal_score: 'Score', modal_threshold: 'Threshold', modal_accept_question: 'Count as correct?', modal_under_question: 'Below threshold. Count as correct anyway?', modal_wrong: 'Wrong', modal_correct: 'Count Correct',
    flash_prev: 'Prev', flash_flip: 'Flip', flash_next: 'Next',
    consent_accept: 'Accept', consent_reject: 'Reject', consent_details: 'Details', consent_reset: 'Reset Choice', consent_close: 'Close',
  manage_consent: 'Cookie Preference', privacy: 'Privacy', groups_title: 'Letter Groups', groups_hint: 'Selections apply to all quizzes & games.', groups_fab: 'Groups',
  // Word game
  word_title: 'Word Write',
  word_desc: 'Type the romaji reading of the shown Hiragana word to see its meaning.',
  word_check: 'Check',
  word_next: 'Next',
  word_correct: 'Correct! Meaning: {meaning}',
  word_wrong: 'Wrong. Answer: {answer}',
  word_no_words: 'No valid words for selected groups.',
  word_score_line: 'Correct {correct}/{total}',
  word_score_history_line: 'Word ({correct}/{total})'
  , word_length_label: 'Word length', word_length_any: 'All', word_no_words_len: 'No words of that length; showing all.'
  , word_listen: 'Listen'
  , word_audio_missing: 'Audio not found.'
  , word_audio_error: 'Audio playback failed.'
  , word_packs_label: 'Word Packs'
  , word_pack_food: 'Food'
  , word_pack_transport: 'Transport'
  , word_pack_greetings: 'Greetings'
  , word_pack_none_selected: 'No pack selected.'
  }
};

function format(str, params){ return str.replace(/\{(\w+)\}/g,(m,k)=> (params&&k in params)? params[k]: m); }
export function t(key, params){ const langDict = dict[current]||{}; const base = (langDict[key]!==undefined?langDict[key]: (dict.tr[key]|| key)); if(!params) return base; return format(base, params); }

// Statik elemanları güncelle
export function applyStaticI18n(){
  document.querySelectorAll('[data-i18n]').forEach(el=>{
    const key = el.getAttribute('data-i18n');
    if(!key) return;
    const trn = t(key);
    if(el.tagName==='INPUT' || el.tagName==='TEXTAREA'){
      if(el.hasAttribute('placeholder')) el.setAttribute('placeholder', trn);
      else el.value=trn;
    } else {
      el.textContent = trn;
    }
  });
  // Özel placeholder mapping
  const answerInput = document.getElementById('answerInput');
  if(answerInput) answerInput.setAttribute('placeholder', t('input_placeholder'));
  // Game tiles descriptions
  document.querySelectorAll('[data-i18n-desc]').forEach(el=>{ const key=el.getAttribute('data-i18n-desc'); el.textContent=t(key); });
  // Consent bar buttons if present
  const cbAccept = document.getElementById('consentAccept'); if(cbAccept) cbAccept.textContent=t('consent_accept');
  const cbReject = document.getElementById('consentReject'); if(cbReject) cbReject.textContent=t('consent_reject');
  const cbDetails = document.getElementById('consentDetailsToggle'); if(cbDetails) cbDetails.textContent=t('consent_details');
  const cbReset = document.getElementById('consentReset'); if(cbReset) cbReset.textContent=t('consent_reset');
  const cbClose = document.getElementById('consentCloseDetails'); if(cbClose) cbClose.textContent=t('consent_close');
  const manageConsent = document.getElementById('manageConsent'); if(manageConsent) manageConsent.textContent=t('manage_consent');
  const groupPanelTitle = document.querySelector('#groupPanel h4'); if(groupPanelTitle) groupPanelTitle.textContent=t('groups_title');
  const groupHint = document.querySelector('#groupPanel .panel-hint'); if(groupHint) groupHint.textContent=t('groups_hint');
  const groupFab = document.getElementById('groupFab'); if(groupFab) groupFab.textContent=t('groups_fab');
}

// Dil toggle butonu (index.html patch ile #langToggle eklenecek)
export function initLangToggle(){
  let btn = document.getElementById('langToggle');
  if(!btn){
    btn = document.createElement('button'); btn.id='langToggle'; btn.className='ghost';
    document.querySelector('header nav')?.appendChild(btn);
  }
  function sync(){ btn.textContent = current==='tr' ? 'EN' : 'TR'; }
  btn.addEventListener('click', ()=>{ setLang(current==='tr'?'en':'tr'); sync(); });
  sync();
}

document.addEventListener('DOMContentLoaded', ()=>{ applyStaticI18n(); initLangToggle(); });

// Otomatik ilk lang attr
document.documentElement.setAttribute('lang', current==='tr'?'tr':'en');
