/* ---------- Cookie helpers (store 5 × 5 names) ---------- */
function setCookie(name, value, days = 365) {
  const exp = new Date(Date.now() + days * 864e5).toUTCString();
  document.cookie = `${encodeURIComponent(name)}=${encodeURIComponent(value)};expires=${exp};path=/`;
}
function getCookie(name) {
  const m = document.cookie.match(new RegExp('(?:^|; )' + encodeURIComponent(name) + '=([^;]*)'));
  return m ? decodeURIComponent(m[1]) : null;
}

/* Returns a 5‑element array, each element itself an array of 5 strings.
   Structure: names[groupIdx][rowIdx] */
function loadSavedNames() {
  const raw = getCookie('shiftNames');
  if (!raw) return Array.from({ length: 5 }, () => Array(5).fill(''));
  try {
    const arr = JSON.parse(raw);
    // Validate shape - must be 5×5
    if (Array.isArray(arr) && arr.length === 5 && arr.every(g => Array.isArray(g) && g.length === 5))
      return arr;
    else
      return Array.from({ length: 5 }, () => Array(5).fill(''));
  } catch (e) {
    return Array.from({ length: 5 }, () => Array(5).fill(''));
  }
}
function saveNames(arr) {
  setCookie('shiftNames', JSON.stringify(arr));
}

/* ---------- Populate month / year selectors ---------- */
function populateSelects() {
  const monthSel = document.getElementById('monthSel');
  const yearSel = document.getElementById('yearSel');
  MONTHS.forEach((m, i) => monthSel.add(new Option(m, i)));
  const now = new Date();
  for (let y = now.getFullYear() - 2; y <= now.getFullYear() + 3; y++)
    yearSel.add(new Option(y, y));
  monthSel.value = now.getMonth();
  yearSel.value = now.getFullYear();
}

/* ---------- Build a table for ONE working group ---------- */
function buildGroupTable(month, year, groupIdx, savedNames) {
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const tbl = document.createElement('table');

  /* ---- colgroup (first column = name, rest = days) ---- */
  const cg = document.createElement('colgroup');
  const nameCol = document.createElement('col');
  nameCol.className = 'name-col';
  cg.appendChild(nameCol);
  for (let i = 0; i < daysInMonth; i++) {
    const dayCol = document.createElement('col');
    dayCol.className = 'day-col';
    cg.appendChild(dayCol);
  }
  tbl.appendChild(cg);

  /* ---- Row 1: day numbers ---- */
  const numRow = document.createElement('tr');
  const emptyTh = document.createElement('th');
  emptyTh.className = 'name';
  numRow.appendChild(emptyTh);
  for (let d = 1; d <= daysInMonth; d++) {
    const th = document.createElement('th');
    th.className = 'day-num';
    th.textContent = d;
    numRow.appendChild(th);
  }
  tbl.appendChild(numRow);

  /* ---- Row 2: weekday short names ---- */
  const wkRow = document.createElement('tr');
  const wkEmpty = document.createElement('th');
  wkEmpty.className = 'name';
  wkRow.appendChild(wkEmpty);
  for (let d = 1; d <= daysInMonth; d++) {
    const dateObj = new Date(year, month, d);
    const wd = dateObj.toLocaleString('es-ES', { weekday: 'short' })[0].toUpperCase();
    const th = document.createElement('th');
    th.className = 'day-wk';
    th.textContent = wd;
    wkRow.appendChild(th);
  }
  tbl.appendChild(wkRow);

  /* ---- FIVE rows: one per worker inside this group ---- */
  for (let rowIdx = 0; rowIdx < 5; rowIdx++) {
    const tr = document.createElement('tr');

    // ---- Name cell (editable) ----
    const nameTd = document.createElement('td');
    nameTd.className = 'name';
    nameTd.contentEditable = true;
    nameTd.textContent = savedNames[groupIdx][rowIdx] || '';
    // Save only this exact cell on blur
    nameTd.addEventListener('blur', () => {
      const all = loadSavedNames();          // fetch current full matrix
      all[groupIdx][rowIdx] = nameTd.textContent.trim();
      saveNames(all);
    });
    tr.appendChild(nameTd);

    // ---- Shift cells (editable, will be auto‑filled) ----
    for (let d = 1; d <= daysInMonth; d++) {
      const td = document.createElement('td');
      td.className = 'shift';
      td.contentEditable = true;
      tr.appendChild(td);
    }
    tbl.appendChild(tr);
  }
  return tbl;
}

/* ---------- Autofill shift cells for ONE group ---------- */
function autofillShifts(table, month, year, guardIdx) {
  const mode = document.getElementById('mode').value;
  const rows = table.querySelectorAll('tr');
  // rows[0]=numbers, rows[1]=weekdays, rows[2..6]=worker rows
  for (let r = 2; r < rows.length; r++) {
    const cells = rows[r].querySelectorAll('td.shift');
    for (let d = 0; d < cells.length; d++) {
      const date = new Date(year, month, d + 1);
      const turn = getTurn(mode, guardIdx, date);
      if (turn > 0) {
        cells[d].textContent = turn;
        cells[d].style.color = COLORS[turn];
      } else {
        cells[d].textContent = '';
        cells[d].style.color = '';
      }
    }
  }
}

/* ---------- Main generation routine ---------- */
function generateSheet() {
  const month = parseInt(document.getElementById('monthSel').value);
  const year = parseInt(document.getElementById('yearSel').value);
  const container = document.getElementById('sheetContainer');
  container.innerHTML = '';

  const title = document.createElement('h2');
  title.textContent = `${MONTHS[month]} ${year}`;
  container.appendChild(title);

  const savedNames = loadSavedNames();   // 5 × 5 matrix

  // Create five independent groups
  for (let g = 0; g < 5; g++) {
    const wrapper = document.createElement('div');
    wrapper.className = 'group';
    const hdr = document.createElement('h3');
    hdr.textContent = `Guardia ${g + 1}`;
    wrapper.appendChild(hdr);

    const tbl = buildGroupTable(month, year, g, savedNames);
    wrapper.appendChild(tbl);
    container.appendChild(wrapper);

    autofillShifts(tbl, month, year, g);
  }
}

/* ---------- Event wiring ---------- */
populateSelects();
document.getElementById('generateBtn').addEventListener('click', generateSheet);
document.getElementById('mode').addEventListener('change', generateSheet);

/* ---------- Initial render ---------- */
generateSheet();