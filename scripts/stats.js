import { loadProgress, getAccuracy, HIRAGANA } from './data.js';

const learnedCount = document.getElementById('learnedCount');
const remainingCount = document.getElementById('remainingCount');
const accuracyRate = document.getElementById('accuracyRate');
const streakEl = document.getElementById('streak');

function render(){
  const p = loadProgress();
  learnedCount.textContent = p.learned.length;
  remainingCount.textContent = HIRAGANA.length - p.learned.length;
  accuracyRate.textContent = getAccuracy(p).toFixed(1)+'%';
  streakEl.textContent = p.streak;
}

window.addEventListener('progress-updated', render);
window.addEventListener('session-stats', render);

render();
