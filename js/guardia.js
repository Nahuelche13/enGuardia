function daysSinceUTC(date) {
  const start = new Date(2026, 0, 1);
  const target = new Date(date);
  const diff = Math.abs(
    Date.UTC(start.getFullYear(), start.getMonth(), start.getDate()) -
    Date.UTC(target.getFullYear(), target.getMonth(), target.getDate())
  );
  return Math.round(diff / (24 * 60 * 60 * 1000));
}
function computeTurn_3x2(daySince, guardia) {
  daySince += 4 * guardia;
  const p = daySince % 10;
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
  "Julio", "Agosto", "Septiebre", "Octubre", "Noviembre", "Diciembre"
];

const COLORS = ["", "blue", "red", "green"]