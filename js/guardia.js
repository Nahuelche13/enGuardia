/* Day the rotation is anchored to: every cycle is counted from here.
   If the real schedule shifts, realign it by changing this date. */
const ROTATION_START = new Date(2026, 4, 1);

function daysSinceUTC(date) {
  const start = ROTATION_START;
  const target = new Date(date);
  // signed, so the rotation keeps going backwards before the start date
  const diff =
    Date.UTC(target.getFullYear(), target.getMonth(), target.getDate()) -
    Date.UTC(start.getFullYear(), start.getMonth(), start.getDate());
  return Math.round(diff / (24 * 60 * 60 * 1000));
}
function computeTurn_3x2(daySince, guardia) {
  daySince += 4 * guardia;
  const p = ((daySince % 10) + 10) % 10;
  if (p === 0 || p === 1) return 1;
  if (p === 5 || p === 6) return 2;
  return 0;
}
function computeTurn_5x3(daySince, groupIdx) {
  daySince = Math.floor(daySince);
  groupIdx = Math.floor(groupIdx) % 5;
  const offset = (groupIdx - (3 * daySince)) % 5;
  const turn = (offset + 5) % 5;
  return (turn >= 0 && turn <= 2) ? turn + 1 : 0;
}
function getTurn(mode, guard, date) {
  const ds = daysSinceUTC(date);
  return mode === "12 2x3" ? computeTurn_3x2(ds, guard)
    : computeTurn_5x3(ds, guard);
}

const MONTHS = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
];

const COLORS = ["", "blue", "red", "green"]
const TURN_NAMES = ["Libre", "Primer turno", "Segundo turno", "Tercer turno"];

/* Hours per shift and number of distinct turns for each modality */
function shiftHours(mode) {
  return mode === "12 2x3" ? 12 : 8;
}
function turnsInMode(mode) {
  return mode === "12 2x3" ? 2 : 3;
}

/* ---------- Remembered settings (shared by both views) ---------- */
function loadSetting(key) {
  try { return localStorage.getItem('enGuardia.' + key); } catch (e) { return null; }
}
function saveSetting(key, value) {
  try { localStorage.setItem('enGuardia.' + key, value); } catch (e) { }
}
/* Restores a <select> from storage and keeps storage in sync with it */
function bindSetting(select, key) {
  const saved = loadSetting(key);
  if (saved !== null && [...select.options].some(o => o.value === saved))
    select.value = saved;
  select.addEventListener('change', () => saveSetting(key, select.value));
}
function loadJSON(key, fallback) {
  try { return JSON.parse(loadSetting(key)) ?? fallback; } catch (e) { return fallback; }
}
function saveJSON(key, value) {
  saveSetting(key, JSON.stringify(value));
}

/* ---------- Offline support ---------- */
if ('serviceWorker' in navigator && location.protocol !== 'file:')
  navigator.serviceWorker.register('sw.js').catch(() => { });
