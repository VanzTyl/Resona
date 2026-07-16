/**
 * Resona Messages Page Controller
 *
 * Displays chat thread list with unread badges.
 * v2.1: Uses static HTML containers — appends thread items via appendChild.
 *
 * @version 2.1.0
 */

/**
 * Render the messages page.
 * Queries existing static HTML containers; no markup construction.
 *
 * @returns {void}
 */
function renderMessagesPage() {
    const existingPage = document.querySelector('.page--active');

    if (existingPage !== null) {
        existingPage.classList.remove('page--active');
    }

    const page = document.getElementById('page-messages');

    if (page === null) {
        return;
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

    // Hide chat pane on initial load.
    const chatPane = document.getElementById('messages-chat-pane');
    if (chatPane !== null) {
        chatPane.style.display = 'none';
    }

    // Show thread list.
    const threadList = document.getElementById('messages-thread-list');
    if (threadList !== null) {
        threadList.style.display = '';
    }

    // Show loading indicator.
    const emptyState = document.getElementById('messages-empty-state');
    if (emptyState !== null) {
        emptyState.style.display = 'none';
    }

    const loadingMsg = document.createElement('p');
    loadingMsg.id = 'messages-loading';
    loadingMsg.style.color = 'var(--rs-text-dim)';
    loadingMsg.style.padding = '24px 0';
    loadingMsg.textContent = 'Loading conversations...';

    const threadListEl = document.getElementById('messages-thread-list');
    if (threadListEl !== null) {
        // Clear and show loading.
        while (threadListEl.firstChild !== null) {
            threadListEl.removeChild(threadListEl.firstChild);
        }
        threadListEl.appendChild(loadingMsg);
    }

    try {
        const friends = await apiGet('/api/friends?limit=50');

        // Clear loading.
        if (threadListEl !== null) {
            while (threadListEl.firstChild !== null) {
                threadListEl.removeChild(threadListEl.firstChild);
            }
        }

        if (friends.length === 0) {
            if (emptyState !== null) {
                emptyState.style.display = '';
            }
            return;
        }

        friends.forEach(function (friend) {
            const threadItem = document.createElement('div');
            threadItem.className = 'search-result-item';
            threadItem.style.cursor = 'pointer';

            const avatar = document.createElement('img');
            avatar.className = 'search-result-item__avatar';
            avatar.src = friend.avatar_url || 'assets/default-avatar.svg';
            avatar.alt = '';
            threadItem.appendChild(avatar);

            const info = document.createElement('div');
            info.className = 'search-result-item__info';

            const name = document.createElement('div');
            name.className = 'search-result-item__name';
            name.textContent = friend.display_name;
            info.appendChild(name);

            const status = document.createElement('div');
            status.className = 'search-result-item__username';
            status.textContent = friend.currently_playing_track
                ? '\uD83C\uDFB5 ' + friend.currently_playing_track
                : '';
            info.appendChild(status);

            threadItem.appendChild(info);

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

            if (threadListEl !== null) {
                threadListEl.appendChild(threadItem);
            }
        });

        if (typeof initIcons === 'function') {
            initIcons();
        }
    } catch (error) {
        if (threadListEl !== null) {
            while (threadListEl.firstChild !== null) {
                threadListEl.removeChild(threadListEl.firstChild);
            }
        }

        const errorMsg = document.createElement('p');
        errorMsg.style.color = 'var(--rs-error)';
        errorMsg.textContent = 'Failed to load messages.';
        if (threadListEl !== null) {
            threadListEl.appendChild(errorMsg);
        }
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
