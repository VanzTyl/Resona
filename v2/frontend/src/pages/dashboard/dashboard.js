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
 * Creates page structure via createElement/appendChild if not in DOM.
 *
 * @returns {void}
 */
function renderDashboardPage() {
    const existingPage = document.querySelector('.page--active');

    if (existingPage !== null) {
        existingPage.classList.remove('page--active');
    }

    let page = document.getElementById('page-dashboard');

    if (page === null) {
        page = createDashboardPageStructure();
        const app = document.getElementById('app');

        if (app === null) {
            return;
        }

        app.insertBefore(page, app.firstChild);
    }

    page.classList.add('page--active');

    dashboardPeriod = 'all';

    loadDashboard();
}

/**
 * Create the dashboard page DOM structure using createElement/appendChild.
 *
 * @returns {HTMLElement} The page element.
 */
function createDashboardPageStructure() {
    const page = document.createElement('div');
    page.id = 'page-dashboard';
    page.className = 'page';

    const header = document.createElement('header');
    header.className = 'page__header';

    const title = document.createElement('h1');
    title.className = 'page__title';
    title.textContent = 'Dashboard';
    header.appendChild(title);
    page.appendChild(header);

    const main = document.createElement('main');
    main.className = 'page__content';
    main.id = 'dashboard-content';

    const statsGrid = document.createElement('div');
    statsGrid.id = 'dashboard-stats-grid';
    statsGrid.className = 'stats-grid';

    // Add 4 skeleton stat cards.
    for (var i = 0; i < 4; i++) {
        var card = document.createElement('div');
        card.className = 'stat-card';

        var val = document.createElement('div');
        val.className = 'stat-card__value';
        val.textContent = '--';
        card.appendChild(val);

        var lbl = document.createElement('div');
        lbl.className = 'stat-card__label';
        lbl.textContent = 'Loading...';
        card.appendChild(lbl);

        statsGrid.appendChild(card);
    }

    main.appendChild(statsGrid);

    const filter = document.createElement('div');
    filter.id = 'dashboard-period-filter';
    filter.className = 'period-filter';
    main.appendChild(filter);

    const artistsTitle = document.createElement('h2');
    artistsTitle.className = 'page__title';
    artistsTitle.style.marginBottom = '12px';
    artistsTitle.textContent = 'Top Artists';
    main.appendChild(artistsTitle);

    const artistList = document.createElement('div');
    artistList.id = 'dashboard-artist-list';
    artistList.className = 'artist-list';

    // Add 3 skeleton artist items.
    for (var j = 0; j < 3; j++) {
        var item = document.createElement('div');
        item.className = 'artist-item';

        var rank = document.createElement('div');
        rank.className = 'artist-item__rank';
        rank.textContent = (j + 1).toString();
        item.appendChild(rank);

        var name = document.createElement('div');
        name.className = 'artist-item__name';
        name.textContent = '...';
        item.appendChild(name);

        var count = document.createElement('div');
        count.className = 'artist-item__count';
        count.textContent = '-- plays';
        item.appendChild(count);

        artistList.appendChild(item);
    }

    main.appendChild(artistList);
    page.appendChild(main);

    return page;
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

            // Add podium class for CSS grid layout on top 3
            artistList.classList.add('artist-list--podium');

            // Limit to top 10
            var limitedArtists = topArtists.slice(0, 10);

            limitedArtists.forEach(function (artist, index) {
                const item = document.createElement('div');
                item.className = 'artist-item';

                // Album art thumbnail for top 3 podium items
                if (index < 3) {
                    var artImg = document.createElement('img');
                    artImg.className = 'artist-item__art';
                    // Backend returns 'artist_image_url' from user_artists table.
                    // Keep the img element visible even without src — CSS border+bg acts as placeholder
                    var artUrl = artist.artist_image_url || artist.image_url || '';
                    if (artUrl) {
                        artImg.src = artUrl;
                    }
                    artImg.alt = artist.artist_name + ' album art';
                    item.appendChild(artImg);
                }

                var rank = document.createElement('div');
                rank.className = 'artist-item__rank';
                rank.textContent = (index + 1);
                item.appendChild(rank);

                var name = document.createElement('div');
                name.className = 'artist-item__name';
                name.textContent = artist.artist_name;
                item.appendChild(name);

                var count = document.createElement('div');
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
