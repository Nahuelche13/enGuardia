// Elements
const yearTitle = document.getElementById('yearTitle');
const calendarContainer = document.getElementById('calendarContainer');
const daysCounter = document.getElementById('daysCounter');
const prevBtn = document.getElementById('prevBtn');
const nextBtn = document.getElementById('nextBtn');

// State
let displayedYear = new Date().getFullYear();

window.location.hash = "#"+new Date().getMonth();

// Render the whole year
function renderYear(year) {
    let freeDays = 0;
    let workDays = 0;

    yearTitle.textContent = year;
    calendarContainer.innerHTML = ''; // clear previous months

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
        const dayNames = ['Dom', 'Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab'];
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

            let turn = getTurn(mode.value, guard.value, new Date(year, m, d));

            color = COLORS[turn];
            if (color) {
                dayCell.classList.add(color);
            }
            if (turn == 0) {
                freeDays++
            }
            if (turn != 0) {
                workDays++
            }

            // Highlight today if applicable
            const today = new Date();
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

    wrkLabel = document.createElement('p')
    wrkLabel.textContent = "Dias de trabajo: " + workDays
    freLabel = document.createElement('p')
    freLabel.textContent = "Dias libres: " + freeDays

    daysCounter.innerHTML = ''
    daysCounter.appendChild(wrkLabel)
    daysCounter.appendChild(freLabel)
    // daysCounter.appendChild("Dias totales: " + (freeDays + workDays))
}

// Navigation handlers
prevBtn.onclick = () => { displayedYear--; renderYear(displayedYear); };
nextBtn.onclick = () => { displayedYear++; renderYear(displayedYear); };

// Initial render
renderYear(displayedYear);