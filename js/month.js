/* ---------- Saved names (5 × 5, kept in localStorage) ---------- */
const emptyNames = () => Array.from({ length: 5 }, () => Array(5).fill(''));
const isNameMatrix = arr =>
  Array.isArray(arr) && arr.length === 5 && arr.every(g => Array.isArray(g) && g.length === 5);

/* Older versions kept the names in a cookie: move them over once */
function migrateCookieNames() {
  const m = document.cookie.match(/(?:^|; )shiftNames=([^;]*)/);
  if (!m) return null;
  try {
    const arr = JSON.parse(decodeURIComponent(m[1]));
    if (!isNameMatrix(arr)) return null;
    saveNames(arr);
    // only drop the cookie once the names are safely stored
    if (loadSetting('names') !== null)
      document.cookie = 'shiftNames=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/';
    return arr;
  } catch (e) {
    return null;
  }
}

/* Returns a 5‑element array, each element itself an array of 5 strings.
   Structure: names[groupIdx][rowIdx] */
function loadSavedNames() {
  const arr = loadJSON('names', null) ?? migrateCookieNames();
  return isNameMatrix(arr) ? arr : emptyNames();
}
function saveNames(arr) {
  saveJSON('names', arr);
}

/* ---------- Hand-edited shift cells ----------
   Stored per modality and month as { "<mode>|<year>-<month>": { "<group>-<row>-<day>": text } } */
function overridesKey(mode, year, month) {
  return `${mode}|${year}-${month + 1}`;
}
function loadOverrides(mode, year, month) {
  return loadJSON('overrides', {})[overridesKey(mode, year, month)] || {};
}
/* text === undefined removes the edit and brings back the computed turn */
function saveOverride(mode, year, month, cellKey, text) {
  const all = loadJSON('overrides', {});
  const key = overridesKey(mode, year, month);
  const edits = all[key] || {};
  if (text === undefined) delete edits[cellKey];
  else edits[cellKey] = text;
  if (Object.keys(edits).length) all[key] = edits;
  else delete all[key];
  saveJSON('overrides', all);
}

/* Shows a cell's hand-edited text, or its computed turn when text is undefined */
function showShift(td, text) {
  const value = text ?? td.dataset.auto;
  td.textContent = value;
  if (['1', '2', '3'].includes(value)) td.dataset.turn = value;
  else delete td.dataset.turn;
  td.classList.toggle('edited', text !== undefined);
  td.title = text !== undefined ? 'Editado a mano · Esc para restablecer' : '';
}

/* Spanish weekday initials, Sunday first (X = miércoles, to tell it from martes) */
const WEEKDAY_INITIALS = ['D', 'L', 'M', 'X', 'J', 'V', 'S'];

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

  // day of the month to highlight, or 0 if today is not in this month
  const now = new Date();
  const today = (now.getFullYear() === year && now.getMonth() === month) ? now.getDate() : 0;

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
    if (d === today) th.classList.add('today');
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
    const th = document.createElement('th');
    th.className = 'day-wk';
    if (d === today) th.classList.add('today');
    th.textContent = WEEKDAY_INITIALS[new Date(year, month, d).getDay()];
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
    // Enter commits the name instead of inserting a line break
    nameTd.addEventListener('keydown', e => {
      if (e.key === 'Enter') {
        e.preventDefault();
        nameTd.blur();
      }
    });
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
      if (d === today) td.classList.add('today');
      td.contentEditable = true;
      // Enter commits the edit, Esc brings back the computed turn
      td.addEventListener('keydown', e => {
        if (e.key === 'Enter' || e.key === 'Escape') {
          e.preventDefault();
          if (e.key === 'Escape') td.dataset.reset = '1';
          td.blur();
        }
      });
      // Remember hand edits; typing the computed value back clears the edit
      td.addEventListener('blur', () => {
        const text = td.textContent.trim();
        const edit = (td.dataset.reset || text === td.dataset.auto) ? undefined : text;
        delete td.dataset.reset;
        const mode = document.getElementById('mode').value;
        saveOverride(mode, year, month, `${groupIdx}-${rowIdx}-${d}`, edit);
        showShift(td, edit);
      });
      tr.appendChild(td);
    }
    tbl.appendChild(tr);
  }
  return tbl;
}

/* ---------- Autofill shift cells for ONE group ---------- */
function autofillShifts(table, month, year, guardIdx) {
  const mode = document.getElementById('mode').value;
  const edits = loadOverrides(mode, year, month);
  const rows = table.querySelectorAll('tr');
  // rows[0]=numbers, rows[1]=weekdays, rows[2..6]=worker rows
  for (let r = 2; r < rows.length; r++) {
    const cells = rows[r].querySelectorAll('td.shift');
    for (let d = 0; d < cells.length; d++) {
      const date = new Date(year, month, d + 1);
      const turn = getTurn(mode, guardIdx, date);
      cells[d].dataset.auto = turn > 0 ? turn : '';
      showShift(cells[d], edits[`${guardIdx}-${r - 2}-${d + 1}`]);
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

  // Legend for the turns used by the current modality
  const mode = document.getElementById('mode').value;
  const legend = document.createElement('ul');
  legend.className = 'legend';
  for (let t = 1; t <= turnsInMode(mode); t++) {
    const li = document.createElement('li');
    const chip = document.createElement('span');
    chip.className = 'chip';
    chip.dataset.turn = t;
    chip.textContent = t;
    li.append(chip, TURN_NAMES[t]);
    legend.appendChild(li);
  }
  container.appendChild(legend);

  const savedNames = loadSavedNames();   // 5 × 5 matrix

  // Create five independent groups
  for (let g = 0; g < 5; g++) {
    const wrapper = document.createElement('div');
    wrapper.className = 'group';
    const hdr = document.createElement('h3');
    hdr.textContent = `Guardia ${g + 1}`;
    wrapper.appendChild(hdr);

    // only the table scrolls sideways, so the group title stays put
    const tbl = buildGroupTable(month, year, g, savedNames);
    const scroller = document.createElement('div');
    scroller.className = 'table-scroll';
    scroller.appendChild(tbl);
    wrapper.appendChild(scroller);
    container.appendChild(wrapper);

    autofillShifts(tbl, month, year, g);
  }
}

/* ---------- Event wiring ---------- */
populateSelects();
bindSetting(document.getElementById('mode'), 'mode');
saveSetting('view', 'month.html');   // index.html reopens the last view
document.getElementById('generateBtn').addEventListener('click', generateSheet);
document.getElementById('mode').addEventListener('change', generateSheet);
document.getElementById('monthSel').addEventListener('change', generateSheet);
document.getElementById('yearSel').addEventListener('change', generateSheet);

/* ---------- Initial render ---------- */
generateSheet();