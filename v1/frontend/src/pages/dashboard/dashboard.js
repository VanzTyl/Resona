/**
 * Resona Dashboard Page Controller
 *
 * Displays personal listening statistics and top artists.
 * Implements UI-C-010.
 *
 * @version 1.0.0
 */

let dashboardPeriod = 'all';

/**
 * Render the dashboard page.
 *
 * @returns {void}
 */
function renderDashboardPage() {
    const app = document.getElementById('app');

    const existingPage = document.querySelector('.page--active');

    if (existingPage !== null) {
        existingPage.classList.remove('page--active');
    }

    let page = document.getElementById('page-dashboard');

    if (page === null) {
        page = document.createElement('div');
        page.id = 'page-dashboard';
        page.className = 'page';

        page.innerHTML = '' +
            '<div class="page__header">' +
            '    <h1 class="page__title">Dashboard</h1>' +
            '</div>' +
            '<div class="page__content" id="dashboard-content"></div>';

        app.insertBefore(page, app.firstChild);
    }

    page.classList.add('page--active');

    dashboardPeriod = 'all';

    loadDashboard();
}

/**
 * Load dashboard data.
 *
 * @returns {Promise<void>}
 */
async function loadDashboard() {
    const content = document.getElementById('dashboard-content');

    if (content === null) {
        return;
    }

    content.innerHTML = '' +
        '<div class="rs-skeleton">' +
        '    <div class="stats-grid">' +
        '        <div class="rs-skeleton__item rs-skeleton__item--rectangle" style="height: 100px;"></div>' +
        '        <div class="rs-skeleton__item rs-skeleton__item--rectangle" style="height: 100px;"></div>' +
        '        <div class="rs-skeleton__item rs-skeleton__item--rectangle" style="height: 100px;"></div>' +
        '        <div class="rs-skeleton__item rs-skeleton__item--rectangle" style="height: 100px;"></div>' +
        '    </div>' +
        '    <div class="rs-skeleton__item rs-skeleton__item--text" style="width: 60%; margin-top: 16px;"></div>' +
        '</div>';

    try {
        const [stats, topArtists] = await Promise.all([
            apiGet('/api/dashboard/stats'),
            apiGet('/api/dashboard/top-artists?period=' + dashboardPeriod + '&limit=10'),
        ]);

        content.innerHTML = '';

        // Stats grid.
        const statsGrid = document.createElement('div');
        statsGrid.className = 'stats-grid';

        const statItems = [
            { value: stats.totalTracksPlayed || 0, label: 'Tracks Played' },
            { value: stats.uniqueArtists || 0, label: 'Unique Artists' },
            { value: Math.round(stats.listeningTimeMinutes || 0), label: 'Min Listened' },
            { value: stats.periodDays || 0, label: 'Days Active' },
        ];

        statItems.forEach(function (item) {
            const card = document.createElement('div');
            card.className = 'stat-card';

            card.innerHTML = '' +
                '<div class="stat-card__value">' + item.value + '</div>' +
                '<div class="stat-card__label">' + item.label + '</div>';

            statsGrid.appendChild(card);
        });

        content.appendChild(statsGrid);

        // Period filter.
        const filter = document.createElement('div');
        filter.className = 'period-filter';

        ['all', 'month', 'week'].forEach(function (period) {
            const btn = document.createElement('button');
            btn.className = 'period-btn';

            if (period === dashboardPeriod) {
                btn.classList.add('period-btn--active');
            }

            btn.textContent = period.charAt(0).toUpperCase() + period.slice(1);

            btn.addEventListener('click', function () {
                dashboardPeriod = period;
                loadDashboard();
            });

            filter.appendChild(btn);
        });

        content.appendChild(filter);

        // Top artists section.
        const sectionTitle = document.createElement('h2');
        sectionTitle.className = 'page__title';
        sectionTitle.style.marginBottom = '12px';
        sectionTitle.textContent = 'Top Artists';
        content.appendChild(sectionTitle);

        if (topArtists.length === 0) {
            content.innerHTML += '<p style="color: var(--rs-text-dim);">No artist data yet. Keep listening!</p>';
            return;
        }

        const artistList = document.createElement('div');
        artistList.className = 'artist-list';

        topArtists.forEach(function (artist, index) {
            const item = document.createElement('div');
            item.className = 'artist-item';

            item.innerHTML = '' +
                '<div class="artist-item__rank">' + (index + 1) + '</div>' +
                '<div class="artist-item__name">' + escapeHtml(artist.artist_name) + '</div>' +
                '<div class="artist-item__count">' + artist.play_count + ' plays</div>';

            artistList.appendChild(item);
        });

        content.appendChild(artistList);
    } catch (error) {
        content.innerHTML = '<p style="color: var(--rs-error);">Failed to load dashboard: ' + escapeHtml(error.message) + '</p>';
    }
}

/**
 * Escape HTML special characters.
 *
 * @param {string} unsafe - The unsafe string.
 * @returns {string} The escaped string.
 */
function escapeHtml(unsafe) {
    return unsafe
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}
