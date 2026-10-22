// Elements
const yearTitle = document.getElementById('yearTitle');
const calendarContainer = document.getElementById('calendarContainer');
const daysCounter = document.getElementById('daysCounter');
const prevBtn = document.getElementById('prevBtn');
const nextBtn = document.getElementById('nextBtn');
const mode = document.getElementById('mode');
const guard = document.getElementById('guard');
const todayBtn = document.getElementById('todayBtn');
const exportBtn = document.getElementById('exportBtn');

// State
let displayedYear = new Date().getFullYear();

window.location.hash = "#"+new Date().getMonth();

// Render the whole year
function renderYear(year) {
    const counts = [0, 0, 0, 0]; // days per turn, index 0 = free

    yearTitle.textContent = year;
    calendarContainer.innerHTML = ''; // clear previous months
    const today = new Date();

    for (let m = 0; m < 12; m++) {
        const monthDiv = document.createElement('div');
        monthDiv.className = 'month';

        // Month title
        const title = document.createElement('h2');
        title.textContent = `${MONTHS[m]} ${year}`;
        title.id = m
        monthDiv.appendChild(title);

        // Day names header
        const daysGrid = document.createElement('div');
        daysGrid.className = 'days';
        const dayNames = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
        dayNames.forEach(d => {
            const dn = document.createElement('div');
            dn.className = 'day-name';
            dn.textContent = d;
            daysGrid.appendChild(dn);
        });

        // Compute first weekday and number of days
        const firstDay = new Date(year, m, 1).getDay(); // 0=Sun
        const daysInMonth = new Date(year, m + 1, 0).getDate();

        // Fill leading empty cells
        for (let i = 0; i < firstDay; i++) {
            const empty = document.createElement('div');
            empty.className = 'inactive';
            daysGrid.appendChild(empty);
        }

        // Fill actual days
        for (let d = 1; d <= daysInMonth; d++) {
            const dayCell = document.createElement('div');
            dayCell.className = 'day';
            dayCell.textContent = d;

            const turn = getTurn(mode.value, guard.value, new Date(year, m, d));
            counts[turn]++;

            if (turn > 0) {
                dayCell.classList.add(COLORS[turn]);
                dayCell.title = TURN_NAMES[turn];
                // the colour is not the only cue: name the turn for screen readers
                const label = document.createElement('span');
                label.className = 'visually-hidden';
                label.textContent = ', ' + TURN_NAMES[turn];
                dayCell.appendChild(label);
            }

            // Highlight today if applicable
            if (
                year === today.getFullYear() &&
                m === today.getMonth() &&
                d === today.getDate()
            ) {
                dayCell.classList.add('active');
            }

            daysGrid.appendChild(dayCell);
        }

        monthDiv.appendChild(daysGrid);
        calendarContainer.appendChild(monthDiv);
    }

    const workDays = counts[1] + counts[2] + counts[3];
    const rows = [];
    for (let t = 1; t <= turnsInMode(mode.value); t++) {
        rows.push([TURN_NAMES[t], counts[t]]);
    }
    rows.push(
        ["Días de trabajo", workDays],
        ["Días libres", counts[0]],
        ["Horas de trabajo", workDays * shiftHours(mode.value)],
    );

    daysCounter.innerHTML = '';
    for (const [label, value] of rows) {
        const row = document.createElement('p');
        const num = document.createElement('span');
        num.className = 'value';
        num.textContent = value.toLocaleString('es');
        row.append(label, num);
        daysCounter.appendChild(row);
    }
}

// Download the displayed year's shifts as an iCalendar file (all-day events)
function exportICS() {
    const pad = n => String(n).padStart(2, '0');
    const ymd = d => `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}`;
    const guardName = guard.options[guard.selectedIndex].text;
    const stamp = new Date().toISOString().replace(/[-:]|\.\d+/g, '');
    const lines = [
        'BEGIN:VCALENDAR',
        'VERSION:2.0',
        'PRODID:-//enGuardia//ES',
        'CALSCALE:GREGORIAN',
        `X-WR-CALNAME:enGuardia - ${guardName} guardia`,
    ];
    for (let d = new Date(displayedYear, 0, 1); d.getFullYear() === displayedYear; d.setDate(d.getDate() + 1)) {
        const turn = getTurn(mode.value, guard.value, d);
        if (!turn) continue;
        const next = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1);
        lines.push(
            'BEGIN:VEVENT',
            // stable per day, modality and guard so re-importing updates instead of duplicating
            `UID:${ymd(d)}-${mode.value.replace(/\W/g, '')}-${guard.value}@enGuardia`,
            `DTSTAMP:${stamp}`,
            `DTSTART;VALUE=DATE:${ymd(d)}`,
            `DTEND;VALUE=DATE:${ymd(next)}`,
            `SUMMARY:${TURN_NAMES[turn]} (${shiftHours(mode.value)}hs)`,
            'END:VEVENT',
        );
    }
    lines.push('END:VCALENDAR');

    const blob = new Blob([lines.join('\r\n') + '\r\n'], { type: 'text/calendar' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `enGuardia-${guardName}-${displayedYear}.ics`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 0);
}

function showYear(year) {
    displayedYear = year;
    renderYear(year);
    todayBtn.hidden = year === new Date().getFullYear();
}

// Navigation handlers
prevBtn.onclick = () => showYear(displayedYear - 1);
nextBtn.onclick = () => showYear(displayedYear + 1);
todayBtn.onclick = () => {
    showYear(new Date().getFullYear());
    document.getElementById(new Date().getMonth()).scrollIntoView({ behavior: 'smooth' });
};
exportBtn.onclick = exportICS;

// ← / → change the year, unless a drop-down has focus
document.addEventListener('keydown', e => {
    if (e.altKey || e.ctrlKey || e.metaKey || e.target.closest('select, input, textarea')) return;
    if (e.key === 'ArrowLeft') prevBtn.click();
    if (e.key === 'ArrowRight') nextBtn.click();
});

// Remember modality and guard between visits
bindSetting(mode, 'mode');
bindSetting(guard, 'guard');
saveSetting('view', 'year.html');   // index.html reopens the last view

// Initial render
showYear(displayedYear);