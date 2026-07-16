/**
 * Resona Friend Discovery Page Controller
 *
 * Handles user search, send/accept/reject friend requests.
 * v2.1: Uses static HTML containers — appends search results via appendChild.
 *
 * @version 2.1.0
 */

let searchTimeout = null;

/**
 * Render the friends page.
 * Creates page structure via createElement/appendChild if not in DOM.
 *
 * @returns {void}
 */
function renderFriendsPage() {
    const existingPage = document.querySelector('.page--active');

    if (existingPage !== null) {
        existingPage.classList.remove('page--active');
    }

    let page = document.getElementById('page-friends');

    if (page === null) {
        page = createFriendsPageStructure();
        const app = document.getElementById('app');

        if (app === null) {
            return;
        }

        app.insertBefore(page, app.firstChild);
    }

    page.classList.add('page--active');

    // Set up search input event (only once).
    const searchInput = document.getElementById('friend-search-input');

    if (searchInput !== null && searchInput.getAttribute('data-listener') === null) {
        searchInput.setAttribute('data-listener', 'true');
        searchInput.addEventListener('input', function () {
            if (searchTimeout !== null) {
                clearTimeout(searchTimeout);
            }

            const query = searchInput.value.trim();

            if (query.length < 2) {
                const results = document.getElementById('search-results');

                if (results !== null) {
                    while (results.firstChild !== null) {
                        results.removeChild(results.firstChild);
                    }
                }
                return;
            }

            searchTimeout = setTimeout(function () {
                performSearch(query);
            }, 300);
        });
    }

    loadPendingRequests();
}

/**
 * Create the friends page DOM structure using createElement/appendChild.
 *
 * @returns {HTMLElement} The page element.
 */
function createFriendsPageStructure() {
    const page = document.createElement('div');
    page.id = 'page-friends';
    page.className = 'page';

    const header = document.createElement('header');
    header.className = 'page__header';

    const title = document.createElement('h1');
    title.className = 'page__title';
    title.textContent = 'Find Friends';
    header.appendChild(title);
    page.appendChild(header);

    const main = document.createElement('main');
    main.className = 'page__content';

    const searchInput = document.createElement('input');
    searchInput.type = 'text';
    searchInput.id = 'friend-search-input';
    searchInput.className = 'search-input';
    searchInput.placeholder = 'Search by username...';
    searchInput.autocomplete = 'off';
    main.appendChild(searchInput);

    const searchResults = document.createElement('div');
    searchResults.id = 'search-results';
    searchResults.style.marginTop = '16px';
    main.appendChild(searchResults);

    const pendingSection = document.createElement('div');
    pendingSection.id = 'pending-requests-section';
    pendingSection.style.marginTop = '24px';
    main.appendChild(pendingSection);

    page.appendChild(main);

    return page;
}

/**
 * Perform a user search via API.
 *
 * @param {string} query - The search query.
 * @returns {Promise<void>}
 */
async function performSearch(query) {
    const resultsContainer = document.getElementById('search-results');

    if (resultsContainer === null) {
        return;
    }

    // Clear container.
    while (resultsContainer.firstChild !== null) {
        resultsContainer.removeChild(resultsContainer.firstChild);
    }

    // Show loading indicator.
    const loadingMsg = document.createElement('p');
    loadingMsg.style.color = 'var(--rs-text-dim)';
    loadingMsg.textContent = 'Searching...';
    resultsContainer.appendChild(loadingMsg);

    try {
        const users = await apiGet('/api/user/search?q=' + encodeURIComponent(query) + '&limit=10');

        // Clear loading message.
        while (resultsContainer.firstChild !== null) {
            resultsContainer.removeChild(resultsContainer.firstChild);
        }

        if (users.length === 0) {
            const noResults = document.createElement('p');
            noResults.style.color = 'var(--rs-text-dim)';
            noResults.style.padding = '12px 0';
            noResults.textContent = 'No users found.';
            resultsContainer.appendChild(noResults);
            return;
        }

        users.forEach(function (user) {
            const item = document.createElement('div');
            item.className = 'search-result-item';

            const avatar = document.createElement('img');
            avatar.className = 'search-result-item__avatar';
            avatar.src = user.avatar_url || 'assets/default-avatar.svg';
            avatar.alt = '';
            item.appendChild(avatar);

            const info = document.createElement('div');
            info.className = 'search-result-item__info';

            const name = document.createElement('div');
            name.className = 'search-result-item__name';
            name.textContent = user.display_name;
            info.appendChild(name);

            const username = document.createElement('div');
            username.className = 'search-result-item__username';
            username.textContent = '@' + user.username;
            info.appendChild(username);

            item.appendChild(info);

            const addBtn = createButton({
                label: 'Add Friend',
                variant: 'secondary',
                size: 'small',
                onClick: function () {
                    sendFriendRequest(user.username);
                },
            });

            item.appendChild(addBtn);
            resultsContainer.appendChild(item);
        });
    } catch (error) {
        while (resultsContainer.firstChild !== null) {
            resultsContainer.removeChild(resultsContainer.firstChild);
        }

        const errorMsg = document.createElement('p');
        errorMsg.style.color = 'var(--rs-error)';
        errorMsg.textContent = 'Error searching: ' + error.message;
        resultsContainer.appendChild(errorMsg);
    }
}

/**
 * Send a friend request.
 *
 * @param {string} username - The target username.
 * @returns {Promise<void>}
 */
async function sendFriendRequest(username) {
    try {
        await apiPost('/api/friends/request', { username: username });

        showToast({
            message: 'Friend request sent!',
            type: 'success',
        });
    } catch (error) {
        showToast({
            message: error.message,
            type: 'error',
        });
    }
}

/**
 * Load and display pending friend requests.
 *
 * @returns {Promise<void>}
 */
async function loadPendingRequests() {
    const section = document.getElementById('pending-requests-section');

    if (section === null) {
        return;
    }

    try {
        const friends = await apiGet('/api/friends?limit=50');
        // Pending requests display uses same container.
        while (section.firstChild !== null) {
            section.removeChild(section.firstChild);
        }
    } catch (_error) {
        // Silently handle — not critical.
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
