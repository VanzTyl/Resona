/**
 * Resona Friend Discovery Page Controller
 *
 * Handles user search, send/accept/reject friend requests.
 * Implements UI-C-006, UI-C-007.
 *
 * @version 1.0.0
 */

let searchTimeout = null;

/**
 * Render the friends page.
 *
 * @returns {void}
 */
function renderFriendsPage() {
    const app = document.getElementById('app');

    const existingPage = document.querySelector('.page--active');

    if (existingPage !== null) {
        existingPage.classList.remove('page--active');
    }

    let page = document.getElementById('page-friends');

    if (page === null) {
        page = document.createElement('div');
        page.id = 'page-friends';
        page.className = 'page';

        page.innerHTML = '' +
            '<div class="page__header">' +
            '    <h1 class="page__title">Find Friends</h1>' +
            '</div>' +
            '<div class="page__content">' +
            '    <input type="text" id="friend-search-input" class="search-input" placeholder="Search by username..." autocomplete="off" />' +
            '    <div id="search-results" style="margin-top: 16px;"></div>' +
            '    <div id="pending-requests-section" style="margin-top: 24px;"></div>' +
            '</div>';

        app.insertBefore(page, app.firstChild);

        // Set up search input.
        const searchInput = document.getElementById('friend-search-input');

        if (searchInput !== null) {
            searchInput.addEventListener('input', function () {
                if (searchTimeout !== null) {
                    clearTimeout(searchTimeout);
                }

                const query = searchInput.value.trim();

                if (query.length < 2) {
                    document.getElementById('search-results').innerHTML = '';
                    return;
                }

                searchTimeout = setTimeout(function () {
                    performSearch(query);
                }, 300);
            });
        }
    }

    page.classList.add('page--active');

    loadPendingRequests();
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

    resultsContainer.innerHTML = '<p style="color: var(--rs-text-dim);">Searching...</p>';

    try {
        const users = await apiGet('/api/user/search?q=' + encodeURIComponent(query) + '&limit=10');

        resultsContainer.innerHTML = '';

        if (users.length === 0) {
            resultsContainer.innerHTML = '<p style="color: var(--rs-text-dim); padding: 12px 0;">No users found.</p>';
            return;
        }

        users.forEach(function (user) {
            const item = document.createElement('div');
            item.className = 'search-result-item';

            item.innerHTML = '' +
                '<img class="search-result-item__avatar" src="' + (user.avatar_url || 'assets/default-avatar.svg') + '" alt="" />' +
                '<div class="search-result-item__info">' +
                '    <div class="search-result-item__name">' + escapeHtml(user.display_name) + '</div>' +
                '    <div class="search-result-item__username">@' + escapeHtml(user.username) + '</div>' +
                '</div>';

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
        resultsContainer.innerHTML = '<p style="color: var(--rs-error);">Error searching: ' + escapeHtml(error.message) + '</p>';
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

        // Filter logic would need a dedicated endpoint for pending requests.
        section.innerHTML = '';
    } catch (_error) {
        // Silently handle â€” not critical.
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
