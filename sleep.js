const input = document.getElementById('sleep-input');
const dateInput = document.getElementById('date-input');
const addBtn = document.getElementById('add');
const historyEl = document.getElementById('history');
const resultEl = document.getElementById('result');
let editDate = null;

const KEY = 'sleepEntries';

function parseDuration(str){
  if(!str) return NaN;
  str = str.trim().toLowerCase();
  let h = 0, m = 0;
  const m1 = str.match(/^(\d+)\s*h\s*(\d+)?$/);
  if(m1){
    h = parseInt(m1[1],10);
    m = parseInt(m1[2]||'0',10);
  } else if(str.includes(':')){
    const parts = str.split(':');
    h = parseInt(parts[0],10);
    m = parseInt(parts[1]||'0',10);
  } else {
    h = parseFloat(str.replace(',', '.'));
  }
  if(isNaN(h) || isNaN(m)) return NaN;
  return h + m/60;
}

function loadEntries(){
  return JSON.parse(localStorage.getItem(KEY) || '[]');
}

function saveEntries(list){
  localStorage.setItem(KEY, JSON.stringify(list));
}

function render(){
  const entries = loadEntries();
  historyEl.innerHTML = entries.map(e => `<li>${e.date} : ${e.hours.toFixed(2)} h <button class="edit" data-date="${e.date}">Modifier</button></li>`).join('');
  let total = 0, debt = 0;
  entries.forEach(e => {
    total += e.hours;
    debt += Math.max(0, 8 - e.hours);
  });
  const count = entries.length;
  const avg = count ? total / count : 0;
  const score = count ? Math.min(100, Math.round((avg / 8) * 100)) : 0;
  resultEl.textContent = count ? `Score : ${score}/100 — Dette de sommeil : ${debt.toFixed(1)} h` : '';
}

addBtn.addEventListener('click', () => {
  const hrs = parseDuration(input.value);
  if(isNaN(hrs)){
    alert('Durée invalide');
    return;
  }
  const date = dateInput.value || new Date().toISOString().slice(0,10);
  let entries = loadEntries();
  if(editDate){
    entries = entries.filter(e => e.date !== editDate);
    editDate = null;
  }
  entries = entries.filter(e => e.date !== date);
  entries.push({date, hours: hrs});
  saveEntries(entries);
  input.value = '';
  dateInput.value = new Date().toISOString().slice(0,10);
  render();
  
});

historyEl.addEventListener('click',(e)=>{
  if(e.target.classList.contains('edit')){
    const date = e.target.dataset.date;
    const entries = loadEntries();
    const entry = entries.find(en => en.date === date);
    if(entry){
      input.value = entry.hours.toFixed(2);
      dateInput.value = entry.date;
      editDate = entry.date;
    }
  }
});

document.getElementById('home').addEventListener('click', () => {
  window.location.href = 'index.html';
});


dateInput.value = new Date().toISOString().slice(0,10);
render();
