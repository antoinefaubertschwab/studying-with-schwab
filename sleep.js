const input = document.getElementById('sleep-input');
const dateInput = document.getElementById('date-input');
const addBtn = document.getElementById('add');
const historyEl = document.getElementById('history');
const resultEl = document.getElementById('result');
const weeklyEl = document.getElementById('weekly');
const waterInput = document.getElementById('water-input');
const addWaterBtn = document.getElementById('add-water');
const waterFill = document.getElementById('water-fill');
const waterResult = document.getElementById('water-result');
let editDate = null;

const KEY = 'sleepEntries';
const WATER_KEY = 'waterEntries';

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

function getWeekKey(dateStr){
  const d = new Date(dateStr + 'T00:00:00');
  const firstDay = new Date(d.getFullYear(),0,1);
  const pastDays = (d - firstDay) / 86400000;
  const week = Math.ceil((pastDays + firstDay.getDay() + 1)/7);
  return d.getFullYear() + '-W' + String(week).padStart(2,'0');
}

function drawDebtChart(entries){
  const canvas = document.getElementById('debt-chart');
  if(!canvas) return;
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0,0,canvas.width,canvas.height);
  const debts = [];
  let cum = 0;
  entries.forEach(e=>{
    cum += Math.max(0,8 - e.hours);
    debts.push(cum);
  });
  if(debts.length === 0) return;
  const maxDebt = Math.max(...debts,1);
  const stepX = canvas.width / (debts.length - 1 || 1);
  ctx.beginPath();
  ctx.moveTo(0, canvas.height - (debts[0]/maxDebt)*canvas.height);
  for(let i=1;i<debts.length;i++){
    ctx.lineTo(i*stepX, canvas.height - (debts[i]/maxDebt)*canvas.height);
  }
  ctx.strokeStyle = '#8b5cf6';
  ctx.lineWidth = 2;
  ctx.stroke();
}


function render(){
  const entries = loadEntries();
  entries.sort((a,b)=>a.date.localeCompare(b.date));
  historyEl.innerHTML = entries.map(e => `<li>${e.date} : ${e.hours.toFixed(2)} h <button class="edit" data-date="${e.date}">Modifier</button></li>`).join('');
  let total = 0, debt = 0;
  const weekly = {};
  entries.forEach(e => {
    total += e.hours;
    debt += Math.max(0, 8 - e.hours);
    const wk = getWeekKey(e.date);
    weekly[wk] = weekly[wk] || {total:0,count:0};
    weekly[wk].total += e.hours;
    weekly[wk].count += 1;
  });
  const count = entries.length;
  const avg = count ? total / count : 0;
  const score = count ? Math.min(100, Math.round((avg / 8) * 100)) : 0;
  resultEl.textContent = count ? `Score : ${score}/100 — Dette de sommeil : ${debt.toFixed(1)} h` : '';
    weeklyEl.innerHTML = Object.keys(weekly).map(wk => `${wk} : ${(weekly[wk].total/weekly[wk].count).toFixed(2)} h`).join('<br>');
  drawDebtChart(entries);
}

function loadWater(){
  return JSON.parse(localStorage.getItem(WATER_KEY) || '[]');
}

function saveWater(list){
  localStorage.setItem(WATER_KEY, JSON.stringify(list));
}

function renderWater(){
  const today = new Date().toISOString().slice(0,10);
  const entries = loadWater();
  const record = entries.find(e=>e.date===today);
  const amount = record ? record.amount : 0;
  const pct = Math.min(amount/2000,1)*100;
  waterFill.style.width = pct + '%';
  let msg = '';
  if(amount >= 2500) msg = 'Incroyable';
  else if(amount >= 2000) msg = 'Excellent';
  else if(amount >= 1500) msg = 'Acceptable';
  else msg = `${2000-amount} ml restants`;
  waterResult.textContent = `${amount} ml — ${msg}`;
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

addWaterBtn.addEventListener('click', () => {
  const amt = parseInt(waterInput.value,10);
  if(isNaN(amt) || amt<=0){
    alert('Quantité invalide');
    return;
  }
  const today = new Date().toISOString().slice(0,10);
  let entries = loadWater();
  let record = entries.find(e=>e.date===today);
  if(!record){
    record = {date:today, amount:0};
    entries.push(record);
  }
  record.amount += amt;
  saveWater(entries);
  waterInput.value='';
  renderWater();
});

dateInput.value = new Date().toISOString().slice(0,10);
render();
renderWater();
