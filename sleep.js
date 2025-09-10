const days = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
const container = document.getElementById('days');

days.forEach((d) => {
  const label = document.createElement('label');
  label.textContent = `${d} (heures)`;
  const input = document.createElement('input');
  input.type = 'number';
  input.min = '0';
  input.max = '24';
  input.id = `day-${d}`;
  label.appendChild(input);
  container.appendChild(label);
});

document.getElementById('calc').addEventListener('click', () => {
  let debt = 0;
  let total = 0;
  let count = 0;
  days.forEach((d) => {
    const val = parseFloat(document.getElementById(`day-${d}`).value);
    if (!isNaN(val)) {
      count++;
      total += val;
      debt = Math.max(0, debt + (8 - val));
    }
  });
  const avg = count ? total / count : 0;
  const score = count ? Math.min(100, Math.round((avg / 8) * 100)) : 0;
  const resEl = document.getElementById('result');
  if (count) {
    resEl.textContent = `Score : ${score}/100 — Dette de sommeil : ${debt.toFixed(1)} h`;
  } else {
    resEl.textContent = 'Entrez vos heures de sommeil';
  }
});

document.getElementById('home').addEventListener('click', () => {
  window.location.href = 'index.html';
});
