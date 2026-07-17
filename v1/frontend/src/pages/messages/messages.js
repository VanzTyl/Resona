/**
 * Resona Messages Page Controller
 *
 * Displays chat thread list with unread badges.
 * Implements UI-C-008.
 *
 * @version 1.0.0
 */

/**
 * Render the messages page.
 *
 * @returns {void}
 */
function renderMessagesPage() {
    const app = document.getElementById('app');

    const existingPage = document.querySelector('.page--active');

    if (existingPage !== null) {
        existingPage.classList.remove('page--active');
    }

    let page = document.getElementById('page-messages');

    if (page === null) {
        page = document.createElement('div');
        page.id = 'page-messages';
        page.className = 'page';

        page.innerHTML = '' +
            '<div class="page__header">' +
            '    <h1 class="page__title">Messages</h1>' +
            '</div>' +
            '<div class="page__content" id="messages-content"></div>';

        app.insertBefore(page, app.firstChild);
    }

    page.classList.add('page--active');

    loadThreadList();
}

/**
 * Load the list of chat threads.
 *
 * @returns {Promise<void>}
 */
async function loadThreadList() {
    const content = document.getElementById('messages-content');

    if (content === null) {
        return;
    }

    content.innerHTML = '<p style="color: var(--rs-text-dim); padding: 24px 0;">Loading conversations...</p>';

    try {
        const friends = await apiGet('/api/friends?limit=50');

        content.innerHTML = '';

        if (friends.length === 0) {
            content.innerHTML = '' +
                '<div class="empty-state">' +
                '    <div class="empty-state__icon">ðŸ’¬</div>' +
                '    <h2 class="empty-state__title">No conversations yet</h2>' +
                '    <p class="empty-state__text">React to a friend\'s music to start a conversation!</p>' +
                '</div>';

            return;
        }

        friends.forEach(function (friend) {
            const threadItem = document.createElement('div');
            threadItem.className = 'search-result-item';
            threadItem.style.cursor = 'pointer';

            threadItem.innerHTML = '' +
                '<img class="search-result-item__avatar" src="' + (friend.avatar_url || 'assets/default-avatar.svg') + '" alt="" />' +
                '<div class="search-result-item__info">' +
                '    <div class="search-result-item__name">' + escapeHtml(friend.display_name) + '</div>' +
                '    <div class="search-result-item__username">' +
                (friend.currently_playing_track ? 'ðŸŽµ ' + escapeHtml(friend.currently_playing_track) : '') +
                '    </div>' +
                '</div>';

            const unreadCount = friend.unread_count || 0;

            if (unreadCount > 0) {
                const badge = document.createElement('span');
                badge.className = 'bottom-nav__unread-badge';
                badge.style.position = 'static';
                badge.textContent = unreadCount;
                threadItem.appendChild(badge);
            }

            threadItem.addEventListener('click', function () {
                navigateToChat(friend.id, friend.display_name);
            });

            content.appendChild(threadItem);
        });
    } catch (error) {
        content.innerHTML = '<p style="color: var(--rs-error);">Failed to load messages.</p>';
    }
}

/**
 * Navigate to a chat thread with a specific friend.
 *
 * @param {number} friendId - The friend's user ID.
 * @param {string} friendName - The friend's display name.
 * @returns {void}
 */
function navigateToChat(friendId, friendName) {
    navigateTo('/feed', { chatWith: friendId, friendName: friendName });
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
