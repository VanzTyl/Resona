/**
 * Resona Friend Discovery Page Controller
 *
 * Handles user search, incoming requests (accept/reject), and friends list.
 * v2.2: Added incoming requests section with Accept/Reject buttons + friends list.
 *
 * @version 2.2.0
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

    // Load all sections.
    loadIncomingRequests();
    loadFriendsList();
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
    title.textContent = 'Friends';
    header.appendChild(title);
    page.appendChild(header);

    const main = document.createElement('main');
    main.className = 'page__content';

    // --- Search section ---
    const searchSection = document.createElement('section');
    searchSection.className = 'friends-section';

    const searchTitle = document.createElement('h2');
    searchTitle.className = 'friends-section__title';
    searchTitle.textContent = 'Find People';
    searchSection.appendChild(searchTitle);

    const searchInput = document.createElement('input');
    searchInput.type = 'text';
    searchInput.id = 'friend-search-input';
    searchInput.className = 'search-input';
    searchInput.placeholder = 'Search by username...';
    searchInput.autocomplete = 'off';
    searchSection.appendChild(searchInput);

    const searchResults = document.createElement('div');
    searchResults.id = 'search-results';
    searchResults.style.marginTop = '12px';
    searchSection.appendChild(searchResults);

    main.appendChild(searchSection);

    // --- Incoming requests section ---
    const incomingSection = document.createElement('section');
    incomingSection.id = 'incoming-requests-section';
    incomingSection.className = 'friends-section friends-section--requests';
    incomingSection.style.display = 'none';

    // Header row with title + badge
    var headerRow = document.createElement('div');
    headerRow.className = 'friends-section__header-row';

    var incomingTitle = document.createElement('h2');
    incomingTitle.className = 'friends-section__title';
    incomingTitle.textContent = 'Incoming Requests';
    headerRow.appendChild(incomingTitle);

    var badge = document.createElement('span');
    badge.className = 'friends-section__badge';
    badge.id = 'incoming-requests-count';
    badge.style.display = 'none';
    headerRow.appendChild(badge);

    incomingSection.appendChild(headerRow);

    // List container for request cards
    var listContainer = document.createElement('div');
    listContainer.id = 'incoming-requests-list';
    incomingSection.appendChild(listContainer);

    main.appendChild(incomingSection);

    // --- Friends list section ---
    const friendsSection = document.createElement('section');
    friendsSection.id = 'friends-list-section';
    friendsSection.className = 'friends-section';
    main.appendChild(friendsSection);

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
            avatar.src = user.avatarUrl || 'assets/default-avatar.svg';
            avatar.alt = '';
            item.appendChild(avatar);

            const info = document.createElement('div');
            info.className = 'search-result-item__info';

            const name = document.createElement('div');
            name.className = 'search-result-item__name';
            name.textContent = user.displayName;
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
 * Load and display incoming friend requests with Accept/Reject buttons.
 *
 * @returns {Promise<void>}
 */
async function loadIncomingRequests() {
    const section = document.getElementById('incoming-requests-section');

    if (section === null) {
        return;
    }

    try {
        const requests = await apiGet('/api/friends/requests/pending');

        // Find or create the list container and header
        var listContainer = document.getElementById('incoming-requests-list');
        if (listContainer === null) {
            // Create the container structure if it doesn't exist (from HTML template)
            var headerRow = document.createElement('div');
            headerRow.className = 'friends-section__header-row';

            var header = document.createElement('h2');
            header.className = 'friends-section__title';
            header.textContent = 'Incoming Requests';
            headerRow.appendChild(header);

            var badge = document.createElement('span');
            badge.className = 'friends-section__badge';
            badge.id = 'incoming-requests-count';
            headerRow.appendChild(badge);

            listContainer = document.createElement('div');
            listContainer.id = 'incoming-requests-list';

            // Clear section and rebuild
            while (section.firstChild !== null) {
                section.removeChild(section.firstChild);
            }
            section.appendChild(headerRow);
            section.appendChild(listContainer);
        }

        var headerRow = section.querySelector('.friends-section__header-row');
        var headerEl = headerRow ? headerRow.querySelector('.friends-section__title') : null;
        var badgeEl = document.getElementById('incoming-requests-count');

        // Clear list only, keep header
        while (listContainer.firstChild !== null) {
            listContainer.removeChild(listContainer.firstChild);
        }

        if (requests.length === 0) {
            section.style.display = 'none';
            return;
        }

        section.style.display = '';

        // Update header count
        if (headerEl !== null) {
            headerEl.textContent = 'Incoming Requests (' + requests.length + ')';
        }
        if (badgeEl !== null) {
            badgeEl.textContent = requests.length;
            badgeEl.style.display = '';
        }

        requests.forEach(function (req) {
            const item = document.createElement('div');
            item.className = 'friend-request-card';

            // Avatar
            var avatarEl;
            if (req.avatarUrl) {
                avatarEl = document.createElement('img');
                avatarEl.className = 'friend-request-card__avatar';
                avatarEl.src = req.avatarUrl;
                avatarEl.alt = '';
            } else {
                avatarEl = document.createElement('div');
                avatarEl.className = 'friend-request-card__avatar friend-request-card__avatar--fallback';
                avatarEl.textContent = (req.displayName || '?').charAt(0).toUpperCase();
            }
            item.appendChild(avatarEl);

            const info = document.createElement('div');
            info.className = 'friend-request-card__info';

            const name = document.createElement('div');
            name.className = 'friend-request-card__name';
            name.textContent = req.displayName;
            info.appendChild(name);

            const username = document.createElement('div');
            username.className = 'friend-request-card__username';
            username.textContent = '@' + req.username;
            info.appendChild(username);

            item.appendChild(info);

            // Action buttons container
            const actions = document.createElement('div');
            actions.className = 'friend-request-card__actions';

            const acceptBtn = document.createElement('button');
            acceptBtn.className = 'friend-request-btn--accept';
            acceptBtn.textContent = 'Accept';
            acceptBtn.addEventListener('click', function () {
                acceptRequest(req.id, item);
            });
            actions.appendChild(acceptBtn);

            const rejectBtn = document.createElement('button');
            rejectBtn.className = 'friend-request-btn--reject';
            rejectBtn.textContent = 'Reject';
            rejectBtn.addEventListener('click', function () {
                rejectRequest(req.id, item);
            });
            actions.appendChild(rejectBtn);

            item.appendChild(actions);
            listContainer.appendChild(item);
        });
    } catch (_error) {
        // Silently hide section on error.
        section.style.display = 'none';
    }
}

/**
 * Accept an incoming friend request.
 *
 * @param {number} requestId - The friendship record ID.
 * @param {HTMLElement} item - The DOM element to remove on success.
 * @returns {Promise<void>}
 */
async function acceptRequest(requestId, item) {
    try {
        await apiPut('/api/friends/request/' + requestId, {
            action: 'accept',
        });

        showToast({
            message: 'Friend request accepted!',
            type: 'success',
        });

        // Reload friends list and remaining incoming requests.
        loadFriendsList();
        loadIncomingRequests();
    } catch (error) {
        showToast({
            message: error.message,
            type: 'error',
        });
    }
}

/**
 * Reject an incoming friend request.
 *
 * @param {number} requestId - The friendship record ID.
 * @param {HTMLElement} item - The DOM element to remove on success.
 * @returns {Promise<void>}
 */
async function rejectRequest(requestId, item) {
    try {
        await apiPut('/api/friends/request/' + requestId, {
            action: 'reject',
        });

        showToast({
            message: 'Friend request rejected.',
            type: 'info',
        });

        // Reload incoming requests to update section.
        loadIncomingRequests();
    } catch (error) {
        showToast({
            message: error.message,
            type: 'error',
        });
    }
}

/**
 * Load and display the accepted friends list with listening status.
 *
 * @returns {Promise<void>}
 */
async function loadFriendsList() {
    const section = document.getElementById('friends-list-section');

    if (section === null) {
        return;
    }

    while (section.firstChild !== null) {
        section.removeChild(section.firstChild);
    }

    // Section header.
    const header = document.createElement('h2');
    header.className = 'friends-section__title';
    header.textContent = 'Your Friends';
    section.appendChild(header);

    // Show a loading indicator while fetching.
    var loadingEl = document.createElement('p');
    loadingEl.style.color = 'var(--rs-text-dim)';
    loadingEl.style.padding = '12px 0';
    loadingEl.textContent = 'Loading...';
    section.appendChild(loadingEl);

    try {
        var friends = await apiGet('/api/friends?limit=50');

        // Remove loading indicator.
        if (loadingEl.parentNode !== null) {
            loadingEl.remove();
        }

        if (friends.length === 0) {
            const emptyMsg = document.createElement('p');
            emptyMsg.style.color = 'var(--rs-text-dim)';
            emptyMsg.style.padding = '12px 0';
            emptyMsg.textContent = 'No friends yet. Search for users above to add friends!';
            section.appendChild(emptyMsg);
            return;
        }

        friends.forEach(function (friend) {
            const item = document.createElement('div');
            item.className = 'search-result-item';

            const avatar = document.createElement('img');
            avatar.className = 'search-result-item__avatar';
            avatar.src = friend.avatarUrl || 'assets/default-avatar.svg';
            avatar.alt = '';
            item.appendChild(avatar);

            const info = document.createElement('div');
            info.className = 'search-result-item__info';

            const name = document.createElement('div');
            name.className = 'search-result-item__name';
            name.textContent = friend.displayName;
            info.appendChild(name);

            // Show currently playing track if available.
            if (friend.currentlyPlayingTrack) {
                const track = document.createElement('div');
                track.className = 'search-result-item__username';
                track.textContent = '\u266B ' + friend.currentlyPlayingTrack;
                track.style.color = 'var(--rs-accent)';
                info.appendChild(track);
            }

            item.appendChild(info);
            section.appendChild(item);
        });
    } catch (error) {
        var isAuthError = error && (error.message || '').includes('Authentication');
        var errorMsg = document.createElement('p');
        errorMsg.style.color = 'var(--rs-error)';
        errorMsg.style.padding = '12px 0';
        errorMsg.textContent = isAuthError
            ? 'Please log in to see your friends list.'
            : 'Could not load friends.';
        section.appendChild(errorMsg);
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
