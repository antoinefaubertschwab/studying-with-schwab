const input = document.getElementById('sleep-input');
const dateInput = document.getElementById('date-input');
const addBtn = document.getElementById('add');
const historyEl = document.getElementById('history');
const resultEl = document.getElementById('result');
const weeklyEl = document.getElementById('weekly');
const waterInput = document.getElementById('water-input');
const addWaterBtn = document.getElementById('add-water');
const removeWaterBtn = document.getElementById('remove-water');
const waterFill = document.getElementById('water-fill');
const waterResult = document.getElementById('water-result');
const activityInput = document.getElementById('activity-input');
const addActivityBtn = document.getElementById('add-activity');
const activityResult = document.getElementById('activity-result');
const catInput = document.getElementById('cat-input');
const habitNameInput = document.getElementById('habit-name-input');
const addCustomBtn = document.getElementById('add-custom');
const customList = document.getElementById('custom-list');
const reminderInput = document.getElementById('reminder-input');
const templatesDiv = document.getElementById('templates');
const pointsEl = document.getElementById('points');
const badgeEl = document.getElementById('badge');
const weeklyReportBtn = document.getElementById('weekly-report');
const shareBtn = document.getElementById('share-progress');
const exportBtn = document.getElementById('export-data');
const importBtn = document.getElementById('import-data');
const weeklyReportResult = document.getElementById('weekly-report-result');
const insightsEl = document.getElementById('insights');
let editDate = null;

const KEY = 'sleepEntries';
const WATER_KEY = 'waterEntries';
const ACT_KEY = 'activityEntries';
const CUSTOM_KEY = 'customHabits';
const POINTS_KEY = 'habitPoints';

function loadPoints(){
  return parseInt(localStorage.getItem(POINTS_KEY) || '0',10);
}

function savePoints(v){
  localStorage.setItem(POINTS_KEY, v);
}

function updatePointsDisplay(){
  const pts = loadPoints();
  pointsEl.textContent = pts;
  let badge = '';
  if(pts >= 500) badge = '🥇';
  else if(pts >= 200) badge = '🥈';
  else if(pts >= 100) badge = '🥉';
  badgeEl.textContent = badge;
}

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

function loadActivity(){
  return JSON.parse(localStorage.getItem(ACT_KEY) || '[]');
}

function saveActivity(list){
  localStorage.setItem(ACT_KEY, JSON.stringify(list));
}

function renderActivity(){
  const today = new Date().toISOString().slice(0,10);
  const entries = loadActivity();
  const week = getWeekKey(today);
  const total = entries.filter(e => getWeekKey(e.date)===week)
                       .reduce((s,e)=>s+e.minutes,0);
  let msg = `${total} min cette semaine`;
  if(total >= 150) msg += ' — Objectif atteint!';
  else msg += ` — ${150-total} min restantes`;
  activityResult.textContent = msg;
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

removeWaterBtn.addEventListener('click', () => {
  const amt = parseInt(waterInput.value,10);
  if(isNaN(amt) || amt<=0){
    alert('Quantité invalide');
    return;
  }
  const today = new Date().toISOString().slice(0,10);
  let entries = loadWater();
  let record = entries.find(e=>e.date===today);
  if(!record){
    alert("Aucune entrée aujourd'hui");
    return;
  }
  record.amount = Math.max(0, record.amount - amt);
  saveWater(entries);
  waterInput.value='';
  renderWater();
});

addActivityBtn.addEventListener('click', () => {
  const mins = parseInt(activityInput.value,10);
  if(isNaN(mins) || mins<=0){
    alert('Durée invalide');
    return;
  }
  const today = new Date().toISOString().slice(0,10);
  let entries = loadActivity();
  let record = entries.find(e=>e.date===today);
  if(!record){
    record = {date:today, minutes:0};
    entries.push(record);
  }
  record.minutes += mins;
  saveActivity(entries);
  activityInput.value='';
  renderActivity();
});

function loadCustom(){
  return JSON.parse(localStorage.getItem(CUSTOM_KEY) || '[]');
}

function saveCustom(list){
  localStorage.setItem(CUSTOM_KEY, JSON.stringify(list));
}

function renderCustom(){
  const data = loadCustom();
  const today = new Date().toISOString().slice(0,10);
  customList.innerHTML = data.map(cat => `
    <div class="custom-category">
      <h3>${cat.name}</h3>
      <ul>${cat.habits.map((h,i)=>{
        const last7 = Array.from({length:7},(_,d)=>{
          return new Date(Date.now()-d*86400000).toISOString().slice(0,10);
        }).reverse();
        const heat = last7.map(day=>`<span class="day ${h.history&&h.history.includes(day)?'done':''}"></span>`).join('');
        const rem = h.reminder?`<span>⏰${h.reminder}</span>`:'';
        return `<li>
          <label><input data-cat="${cat.name}" data-index="${i}" type="checkbox" ${h.lastDone===today?'checked':''}>${h.name} — Série : ${h.streak}</label>
          ${rem}<div class="heatmap">${heat}</div>
        </li>`;
      }).join('')}</ul>
    </div>
  `).join('');
  updateInsights();
}

function updateInsights(){
  const data = loadCustom();
  let best=null, worst=null;
  data.forEach(cat=>cat.habits.forEach(h=>{
    if(!best || h.streak > best.streak) best = h;
    if(!worst || h.streak < worst.streak) worst = h;
  }));
  let msg='';
  if(best) msg += `Meilleure habitude : ${best.name} (${best.streak} jours)`;
  if(worst) msg += (msg?' — ':'') + `À améliorer : ${worst.name}`;
  insightsEl.innerHTML = msg;
}

function scheduleReminders(){
  if('Notification' in window && Notification.permission !== 'granted'){
    Notification.requestPermission();
  }
  setInterval(()=>{
    const now = new Date();
    const time = now.toTimeString().slice(0,5);
    const today = now.toISOString().slice(0,10);
    const data = loadCustom();
    data.forEach(cat=>cat.habits.forEach(h=>{
      if(h.reminder === time && h.lastDone !== today){
        if('Notification' in window && Notification.permission === 'granted'){
          new Notification(`Rappel : ${h.name}`);
        }
      }
    }));
  },60000);
}

addCustomBtn.addEventListener('click', () => {
  const cat = catInput.value.trim();
  const name = habitNameInput.value.trim();
  const reminder = reminderInput.value;
  if(!cat || !name){
    alert('Catégorie ou habitude manquante');
    return;
  }
  const data = loadCustom();
  let category = data.find(c=>c.name===cat);
  if(!category){
    category = {name:cat, habits:[]};
    data.push(category);
  }
  category.habits.push({name, streak:0, lastDone:null, history:[], reminder: reminder || null});
  saveCustom(data);
  catInput.value='';
  habitNameInput.value='';
  reminderInput.value='';
  renderCustom();
});

templatesDiv.addEventListener('click', e => {
  if(e.target.classList.contains('template')){
    const cat = e.target.dataset.cat;
    const name = e.target.dataset.name;
    const data = loadCustom();
    let category = data.find(c=>c.name===cat);
    if(!category){
      category = {name:cat, habits:[]};
      data.push(category);
    }
    category.habits.push({name, streak:0, lastDone:null, history:[], reminder:null});
    saveCustom(data);
    renderCustom();
  }
});

customList.addEventListener('change', e => {
  if(e.target.matches('input[type="checkbox"]')){
    const catName = e.target.dataset.cat;
    const idx = parseInt(e.target.dataset.index,10);
    const data = loadCustom();
    const category = data.find(c=>c.name===catName);
    if(!category) return;
    const habit = category.habits[idx];
    const today = new Date().toISOString().slice(0,10);
    const yesterday = new Date(Date.now()-86400000).toISOString().slice(0,10);
    if(e.target.checked){
      if(habit.lastDone === yesterday) habit.streak += 1;
      else habit.streak = 1;
      habit.lastDone = today;
      habit.history = habit.history || [];
      if(!habit.history.includes(today)) habit.history.push(today);
      const pts = loadPoints() + 10;
      savePoints(pts);
      updatePointsDisplay();
    } else {
      habit.streak = 0;
      habit.lastDone = null;
      if(habit.history) habit.history = habit.history.filter(d=>d!==today);
    }
    saveCustom(data);
    renderCustom();
    updatePointsDisplay();
  }
});

weeklyReportBtn.addEventListener('click', () => {
  const data = loadCustom();
  const today = new Date();
  const last7 = Array.from({length:7},(_,d)=>{
    return new Date(today - d*86400000).toISOString().slice(0,10);
  });
  const report = [];
  data.forEach(cat=>cat.habits.forEach(h=>{
    const count = (h.history||[]).filter(d=>last7.includes(d)).length;
    report.push(`${h.name} : ${count}/7`);
  }));
  weeklyReportResult.innerHTML = report.join('<br>');
});

shareBtn.addEventListener('click', () => {
  const pts = loadPoints();
  const text = `J'ai ${pts} points sur mes habitudes !`;
  if(navigator.share){
    navigator.share({title:'Progrès', text});
  } else {
    navigator.clipboard.writeText(text);
    alert('Progress copié dans le presse‑papier');
  }
});

exportBtn.addEventListener('click', () => {
  const data = {
    sleep: loadEntries(),
    water: loadWater(),
    activity: loadActivity(),
    custom: loadCustom(),
    points: loadPoints()
  };
  const json = JSON.stringify(data);
  navigator.clipboard.writeText(json).then(()=>alert('Données copiées')).catch(()=>alert(json));
});

importBtn.addEventListener('click', () => {
  const json = prompt('Collez les données');
  if(!json) return;
  try {
    const data = JSON.parse(json);
    if(data.sleep) saveEntries(data.sleep);
    if(data.water) saveWater(data.water);
    if(data.activity) saveActivity(data.activity);
    if(data.custom) saveCustom(data.custom);
    if(data.points != null) savePoints(data.points);
    render();
    renderWater();
    renderActivity();
    renderCustom();
    updatePointsDisplay();
    updateInsights();
  } catch(e){
    alert('Données invalides');
  }
});



dateInput.value = new Date().toISOString().slice(0,10);
render();
renderWater();
renderActivity();
renderCustom();
updatePointsDisplay();
scheduleReminders();
