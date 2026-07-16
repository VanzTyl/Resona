/**
 * Resona Dashboard Page Controller
 *
 * Displays personal listening statistics and top artists.
 * v2.1: Uses static HTML containers — appends stats and artists via appendChild.
 *
 * @version 2.1.0
 */

let dashboardPeriod = 'all';

/**
 * Render the dashboard page.
 * Queries existing static HTML containers; no markup construction.
 *
 * @returns {void}
 */
function renderDashboardPage() {
    const existingPage = document.querySelector('.page--active');

    if (existingPage !== null) {
        existingPage.classList.remove('page--active');
    }

    const page = document.getElementById('page-dashboard');

    if (page === null) {
        return;
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

    try {
        const [stats, topArtists] = await Promise.all([
            apiGet('/api/dashboard/stats'),
            apiGet('/api/dashboard/top-artists?period=' + dashboardPeriod + '&limit=10'),
        ]);

        // Update stats grid.
        const statsGrid = document.getElementById('dashboard-stats-grid');
        if (statsGrid !== null) {
            while (statsGrid.firstChild !== null) {
                statsGrid.removeChild(statsGrid.firstChild);
            }

            const statItems = [
                { value: stats.totalTracksPlayed || 0, label: 'Tracks Played' },
                { value: stats.uniqueArtists || 0, label: 'Unique Artists' },
                { value: Math.round(stats.listeningTimeMinutes || 0), label: 'Min Listened' },
                { value: stats.periodDays || 0, label: 'Days Active' },
            ];

            statItems.forEach(function (item) {
                const card = document.createElement('div');
                card.className = 'stat-card';

                const valueEl = document.createElement('div');
                valueEl.className = 'stat-card__value';
                valueEl.textContent = item.value;
                card.appendChild(valueEl);

                const labelEl = document.createElement('div');
                labelEl.className = 'stat-card__label';
                labelEl.textContent = item.label;
                card.appendChild(labelEl);

                statsGrid.appendChild(card);
            });
        }

        // Update period filter.
        const filterContainer = document.getElementById('dashboard-period-filter');
        if (filterContainer !== null) {
            while (filterContainer.firstChild !== null) {
                filterContainer.removeChild(filterContainer.firstChild);
            }

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

                filterContainer.appendChild(btn);
            });
        }

        // Update artist list.
        const artistList = document.getElementById('dashboard-artist-list');
        if (artistList !== null) {
            while (artistList.firstChild !== null) {
                artistList.removeChild(artistList.firstChild);
            }

            if (topArtists.length === 0) {
                const emptyMsg = document.createElement('p');
                emptyMsg.style.color = 'var(--rs-text-dim)';
                emptyMsg.textContent = 'No artist data yet. Keep listening!';
                artistList.appendChild(emptyMsg);
                return;
            }

            topArtists.forEach(function (artist, index) {
                const item = document.createElement('div');
                item.className = 'artist-item';

                const rank = document.createElement('div');
                rank.className = 'artist-item__rank';
                rank.textContent = (index + 1);
                item.appendChild(rank);

                const name = document.createElement('div');
                name.className = 'artist-item__name';
                name.textContent = artist.artist_name;
                item.appendChild(name);

                const count = document.createElement('div');
                count.className = 'artist-item__count';
                count.textContent = artist.play_count + ' plays';
                item.appendChild(count);

                artistList.appendChild(item);
            });
        }
    } catch (error) {
        const errorMsg = document.createElement('p');
        errorMsg.style.color = 'var(--rs-error)';
        errorMsg.textContent = 'Failed to load dashboard: ' + error.message;
        content.appendChild(errorMsg);
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
