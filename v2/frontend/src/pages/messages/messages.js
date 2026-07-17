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
 * Creates page structure via createElement/appendChild if not in DOM.
 *
 * @returns {void}
 */
function renderMessagesPage() {
    const existingPage = document.querySelector('.page--active');

    if (existingPage !== null) {
        existingPage.classList.remove('page--active');
    }

    let page = document.getElementById('page-messages');

    if (page === null) {
        page = createMessagesPageStructure();
        const app = document.getElementById('app');

        if (app === null) {
            return;
        }

        app.insertBefore(page, app.firstChild);
    }

    page.classList.add('page--active');

    loadThreadList();
}

/**
 * Create the messages page DOM structure using createElement/appendChild.
 *
 * @returns {HTMLElement} The page element.
 */
function createMessagesPageStructure() {
    const page = document.createElement('div');
    page.id = 'page-messages';
    page.className = 'page';

    const header = document.createElement('header');
    header.className = 'page__header';

    const title = document.createElement('h1');
    title.className = 'page__title';
    title.textContent = 'Messages';
    header.appendChild(title);
    page.appendChild(header);

    const main = document.createElement('main');
    main.className = 'page__content';
    main.id = 'messages-content';

    const threadList = document.createElement('div');
    threadList.id = 'messages-thread-list';
    main.appendChild(threadList);

    const emptyState = document.createElement('div');
    emptyState.id = 'messages-empty-state';
    emptyState.className = 'empty-state';

    const emptyIcon = document.createElement('div');
    emptyIcon.className = 'empty-state__icon';
    emptyIcon.setAttribute('data-lucide', 'message-circle');
    emptyState.appendChild(emptyIcon);

    const emptyTitle = document.createElement('h2');
    emptyTitle.className = 'empty-state__title';
    emptyTitle.textContent = 'No friends yet';
    emptyState.appendChild(emptyTitle);

    const emptyText = document.createElement('p');
    emptyText.className = 'empty-state__text';
    emptyText.textContent = 'Add friends to start a conversation!';
    emptyState.appendChild(emptyText);

    main.appendChild(emptyState);

    // Chat pane for desktop split view.
    const chatPane = document.createElement('div');
    chatPane.id = 'messages-chat-pane';
    chatPane.style.display = 'none';

    const chatHeader = document.createElement('div');
    chatHeader.id = 'messages-chat-header';
    chatHeader.className = 'page__header';
    chatPane.appendChild(chatHeader);

    const chatThread = document.createElement('div');
    chatThread.id = 'messages-chat-thread';
    chatThread.className = 'chat-thread';
    chatPane.appendChild(chatThread);

    const chatInput = document.createElement('div');
    chatInput.id = 'messages-chat-input';
    chatInput.className = 'chat-input';

    const textarea = document.createElement('textarea');
    textarea.className = 'chat-input__field';
    textarea.id = 'chat-input-field';
    textarea.placeholder = 'Type a message...';
    textarea.rows = '1';
    chatInput.appendChild(textarea);

    const sendBtn = document.createElement('button');
    sendBtn.className = 'rs-btn rs-btn--primary';
    sendBtn.id = 'chat-send-btn';
    sendBtn.setAttribute('aria-label', 'Send message');
    chatInput.appendChild(sendBtn);

    chatPane.appendChild(chatInput);
    main.appendChild(chatPane);

    page.appendChild(main);

    return page;
}

/**
 * Load the list of chat threads.
 *
 * @returns {Promise<void>}
 */
async function loadThreadList() {
    const threadListEl = document.getElementById('messages-thread-list');
    const emptyState = document.getElementById('messages-empty-state');
    const chatPane = document.getElementById('messages-chat-pane');

    if (threadListEl === null) {
        return;
    }

    // Hide everything initially.
    if (chatPane !== null) { chatPane.style.display = 'none'; }
    threadListEl.style.display = 'none';
    if (emptyState !== null) { emptyState.style.display = 'none'; }

    // Show loading indicator.
    while (threadListEl.firstChild !== null) {
        threadListEl.removeChild(threadListEl.firstChild);
    }

    var loadingMsg = document.createElement('p');
    loadingMsg.id = 'messages-loading';
    loadingMsg.style.color = 'var(--rs-text-dim)';
    loadingMsg.style.padding = '24px 0';
    loadingMsg.textContent = 'Loading conversations...';
    threadListEl.appendChild(loadingMsg);
    threadListEl.style.display = '';

    try {
        var friends = await apiGet('/api/friends?limit=50');

        // Clear loading.
        while (threadListEl.firstChild !== null) {
            threadListEl.removeChild(threadListEl.firstChild);
        }

        if (friends.length === 0) {
            threadListEl.style.display = 'none';
            if (emptyState !== null) { emptyState.style.display = ''; }
            return;
        }

        // Show thread list with friends.
        threadListEl.style.display = '';

        friends.forEach(function (friend) {
            var threadItem = document.createElement('div');
            threadItem.className = 'search-result-item';
            threadItem.style.cursor = 'pointer';

            var avatar = document.createElement('img');
            avatar.className = 'search-result-item__avatar';
            avatar.src = friend.avatar_url || 'assets/default-avatar.svg';
            avatar.alt = '';
            threadItem.appendChild(avatar);

            var info = document.createElement('div');
            info.className = 'search-result-item__info';

            var name = document.createElement('div');
            name.className = 'search-result-item__name';
            name.textContent = friend.display_name;
            info.appendChild(name);

            var status = document.createElement('div');
            status.className = 'search-result-item__username';
            status.textContent = friend.currently_playing_track
                ? '\u266B ' + friend.currently_playing_track
                : '';
            info.appendChild(status);

            threadItem.appendChild(info);

            var unreadCount = friend.unread_count || 0;

            if (unreadCount > 0) {
                var badge = document.createElement('span');
                badge.className = 'bottom-nav__unread-badge';
                badge.style.position = 'static';
                badge.textContent = unreadCount;
                threadItem.appendChild(badge);
            }

            threadItem.addEventListener('click', function () {
                navigateToChat(friend.id, friend.display_name);
            });

            threadListEl.appendChild(threadItem);
        });

        if (typeof initIcons === 'function') {
            initIcons();
        }
    } catch (_error) {
        // Fall back to empty state on error.
        threadListEl.style.display = 'none';
        if (emptyState !== null) {
            emptyState.style.display = '';
            var suggestText = emptyState.querySelector('.empty-state__text');
            if (suggestText !== null) {
                suggestText.textContent = 'Find friends to connect with on the Friends page.';
            }
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
