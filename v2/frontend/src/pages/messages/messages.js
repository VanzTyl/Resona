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
function renderMessagesPage(_route, params) {
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

    if (params !== undefined && params.chatWith !== undefined) {
        loadChatThread(params.chatWith, params.friendName || 'Friend');
    } else {
        loadThreadList();
    }
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
            threadItem.setAttribute('data-friend-id', String(friend.id));

            var avatar = document.createElement('img');
            avatar.className = 'search-result-item__avatar';
            avatar.src = friend.avatarUrl || 'assets/default-avatar.svg';
            avatar.alt = '';
            threadItem.appendChild(avatar);

            var info = document.createElement('div');
            info.className = 'search-result-item__info';

            var name = document.createElement('div');
            name.className = 'search-result-item__name';
            name.textContent = friend.displayName;
            info.appendChild(name);

            var status = document.createElement('div');
            status.className = 'search-result-item__username';
            status.textContent = friend.currentlyPlayingTrack
                ? '\u266B ' + friend.currentlyPlayingTrack
                : '';
            info.appendChild(status);

            threadItem.appendChild(info);

            var unreadCount = friend.unreadCount || 0;

            if (unreadCount > 0) {
                var badge = document.createElement('span');
                badge.className = 'bottom-nav__unread-badge';
                badge.style.position = 'static';
                badge.textContent = unreadCount;
                threadItem.appendChild(badge);
            }

            threadItem.addEventListener('click', function () {
                navigateToChat(friend.id, friend.displayName);
            });

            threadListEl.appendChild(threadItem);
        });

        if (typeof initIcons === 'function') {
            initIcons();
        }
    } catch (error) {
        // Clear loading.
        while (threadListEl.firstChild !== null) {
            threadListEl.removeChild(threadListEl.firstChild);
        }

        threadListEl.style.display = 'none';

        if (emptyState !== null) {
            emptyState.style.display = '';
            var suggestText = emptyState.querySelector('.empty-state__text');

            var isAuthErr = error && (error.message || '').includes('Authentication');

            if (isAuthErr) {
                emptyState.querySelector('.empty-state__title').textContent = 'Please log in';
                if (suggestText !== null) {
                    suggestText.textContent = 'Sign in to see your conversations.';
                }
            } else {
                emptyState.querySelector('.empty-state__title').textContent = 'Could not load conversations';
                if (suggestText !== null) {
                    suggestText.textContent = 'Something went wrong. Please try again.';
                }
            }
        }

        console.error('loadThreadList error:', error);
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
    navigateTo('/messages', { chatWith: friendId, friendName: friendName });
}

/**
 * Load a chat thread with a specific friend.
 * Fetches thread ID and messages, populates the chat pane.
 *
 * @param {number} friendId - The friend's user ID.
 * @param {string} friendName - The friend's display name.
 * @returns {Promise<void>}
 */
async function loadChatThread(friendId, friendName) {
    var threadList = document.getElementById('messages-thread-list');
    var emptyState = document.getElementById('messages-empty-state');
    var chatPane = document.getElementById('messages-chat-pane');
    var chatHeader = document.getElementById('messages-chat-header');
    var chatThread = document.getElementById('messages-chat-thread');
    var chatInput = document.getElementById('messages-chat-input');

    if (chatPane === null || chatHeader === null || chatThread === null) {
        return;
    }

    // Clear thread list selection highlight.
    if (threadList !== null) {
        var items = threadList.querySelectorAll('.search-result-item');
        items.forEach(function (item) {
            item.classList.remove('search-result-item--active');
        });

        // Find and highlight the selected friend.
        items.forEach(function (item) {
            if (item.getAttribute('data-friend-id') === String(friendId)) {
                item.classList.add('search-result-item--active');
            }
        });
    }

    // Hide empty state, show chat pane.
    if (emptyState !== null) {
        emptyState.style.display = 'none';
    }

    if (threadList !== null) {
        threadList.style.display = '';
    }

    chatPane.style.display = '';
    chatHeader.textContent = friendName;

    // Show loading in chat thread.
    while (chatThread.firstChild !== null) {
        chatThread.removeChild(chatThread.firstChild);
    }

    var loadingEl = document.createElement('p');
    loadingEl.style.color = 'var(--rs-text-dim)';
    loadingEl.style.padding = '24px';
    loadingEl.textContent = 'Loading messages...';
    chatThread.appendChild(loadingEl);

    try {
        // Step 1: Get thread ID for this friend.
        var threadResponse = await apiGet('/api/messages/thread/' + friendId);
        var currentThreadId = threadResponse.threadId;

        // Clear loading.
        while (chatThread.firstChild !== null) {
            chatThread.removeChild(chatThread.firstChild);
        }

        if (currentThreadId === null) {
            // No thread yet.
            var noThreadEl = document.createElement('div');
            noThreadEl.className = 'empty-state';
            noThreadEl.style.padding = '48px 24px';

            var noThreadIcon = document.createElement('div');
            noThreadIcon.className = 'empty-state__icon';
            noThreadIcon.setAttribute('data-lucide', 'message-circle');
            noThreadEl.appendChild(noThreadIcon);

            var noThreadTitle = document.createElement('h2');
            noThreadTitle.className = 'empty-state__title';
            noThreadTitle.textContent = 'Start a conversation';
            noThreadEl.appendChild(noThreadTitle);

            var noThreadText = document.createElement('p');
            noThreadText.className = 'empty-state__text';
            noThreadText.textContent = 'Send a message to ' + friendName + ' to start chatting!';
            noThreadEl.appendChild(noThreadText);

            chatThread.appendChild(noThreadEl);

            if (typeof initIcons === 'function') {
                initIcons();
            }

            setupChatSendHandler(null, friendId, friendName);

            return;
        }

        // Step 2: Fetch messages for this thread.
        var messagesData = await apiGet('/api/messages/' + currentThreadId + '?limit=50');

        var messages = messagesData.messages !== undefined ? messagesData.messages : messagesData;

        if (messages.length === 0) {
            var emptyMsg = document.createElement('div');
            emptyMsg.className = 'empty-state';
            emptyMsg.style.padding = '48px 24px';

            var emptyIcon = document.createElement('div');
            emptyIcon.className = 'empty-state__icon';
            emptyIcon.setAttribute('data-lucide', 'message-circle');
            emptyMsg.appendChild(emptyIcon);

            var emptyTitle = document.createElement('h2');
            emptyTitle.className = 'empty-state__title';
            emptyTitle.textContent = 'No messages yet';
            emptyMsg.appendChild(emptyTitle);

            chatThread.appendChild(emptyMsg);
        } else {
            messages.forEach(function (msg) {
                var msgEl = createMessageElement(msg);
                chatThread.appendChild(msgEl);
            });
        }

        // Scroll to bottom.
        chatThread.scrollTop = chatThread.scrollHeight;

        // Wire up send handler.
        setupChatSendHandler(currentThreadId, friendId, friendName);

        if (typeof initIcons === 'function') {
            initIcons();
        }

        // Start polling for new messages (every 5 seconds).
        if (window._messagePollInterval) {
            clearInterval(window._messagePollInterval);
        }

        window._messagePollInterval = setInterval(async function () {
            if (currentThreadId === null) {
                clearInterval(window._messagePollInterval);
                return;
            }

            try {
                var lastMsgId = 0;
                var lastMsg = chatThread.querySelector('.message:last-child');
                if (lastMsg !== null) {
                    var dataId = lastMsg.getAttribute('data-message-id');
                    if (dataId !== null) {
                        lastMsgId = parseInt(dataId, 10);
                    }
                }

                var newMsgs = await apiGet('/api/messages/' + currentThreadId + '?afterId=' + lastMsgId + '&limit=20');

                var messages = newMsgs.messages !== undefined ? newMsgs.messages : newMsgs;

                if (messages.length > 0) {
                    messages.forEach(function (msg) {
                        var msgEl = createMessageElement(msg);
                        chatThread.appendChild(msgEl);
                    });
                    chatThread.scrollTop = chatThread.scrollHeight;

                    if (typeof initIcons === 'function') {
                        initIcons();
                    }
                }
            } catch (_e) {
                // Silently retry on next interval.
            }
        }, 5000);
    } catch (error) {
        while (chatThread.firstChild !== null) {
            chatThread.removeChild(chatThread.firstChild);
        }

        var errorEl = document.createElement('div');
        errorEl.className = 'empty-state';
        errorEl.style.padding = '48px 24px';

        var errorTitle = document.createElement('h2');
        errorTitle.className = 'empty-state__title';
        errorTitle.textContent = 'Could not load messages';
        errorEl.appendChild(errorTitle);

        chatThread.appendChild(errorEl);
        console.error('loadChatThread error:', error);
    }
}

/**
 * Create a message DOM element.
 *
 * @param {object} msg - Message object from API.
 * @returns {HTMLElement} The message element.
 */
function createMessageElement(msg) {
    var msgEl = document.createElement('div');
    msgEl.className = 'chat-message';

    var senderId = msg.senderId || msg.sender_id || msg.userId;
    var currentUserId = getCurrentUserId();
    var isOwn = senderId === currentUserId;

    msgEl.classList.add('message', isOwn ? 'message--sent' : 'message--received');

    if (msg.id !== undefined) {
        msgEl.setAttribute('data-message-id', msg.id);
    }

    var bubble = document.createElement('div');
    bubble.className = 'message__bubble';

    var content = document.createElement('p');
    content.className = 'message__content';
    content.textContent = msg.content || msg.text || '';
    bubble.appendChild(content);

    var time = document.createElement('span');
    time.className = 'message__time';

    if (msg.createdAt !== undefined) {
        time.textContent = formatMessageTime(msg.createdAt);
    } else if (msg.created_at !== undefined) {
        time.textContent = formatMessageTime(msg.created_at);
    }

    bubble.appendChild(time);
    msgEl.appendChild(bubble);

    return msgEl;
}

/**
 * Format a timestamp for message display.
 *
 * @param {string} timestamp - ISO timestamp.
 * @returns {string} Formatted time string.
 */
function formatMessageTime(timestamp) {
    try {
        var date = new Date(timestamp);
        var now = new Date();
        var diffMs = now.getTime() - date.getTime();
        var diffDays = Math.floor(diffMs / 86400000);

        if (diffDays === 0) {
            return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        } else if (diffDays === 1) {
            return 'Yesterday';
        } else if (diffDays < 7) {
            return date.toLocaleDateString([], { weekday: 'short' });
        } else {
            return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
        }
    } catch (_e) {
        return '';
    }
}

/**
 * Get the current user's ID from the JWT token.
 *
 * @returns {number|null} User ID or null if not authenticated.
 */
function getCurrentUserId() {
    try {
        var token = getAccessToken();

        if (token === null) {
            return null;
        }

        var parts = token.split('.');

        if (parts.length !== 3) {
            return null;
        }

        var payload = JSON.parse(atob(parts[1]));

        return payload.userId !== undefined ? payload.userId : null;
    } catch (_e) {
        return null;
    }
}

/**
 * Set up chat send button handler.
 *
 * @param {number} threadId - The current thread ID.
 * @param {number} friendId - The friend's user ID.
 * @param {string} friendName - The friend's display name.
 * @returns {void}
 */
function setupChatSendHandler(threadId, friendId, friendName) {
    var sendBtn = document.getElementById('chat-send-btn');
    var inputField = document.getElementById('chat-input-field');

    if (sendBtn === null || inputField === null) {
        return;
    }

    // Remove existing listeners by cloning.
    var newSendBtn = sendBtn.cloneNode(true);
    sendBtn.parentNode.replaceChild(newSendBtn, sendBtn);

    var newInputField = inputField.cloneNode(true);
    inputField.parentNode.replaceChild(newInputField, inputField);

    // Focus the input.
    newInputField.focus();

    // Send function.
    async function sendMessage() {
        var content = newInputField.value.trim();

        if (content === '') {
            return;
        }

        newSendBtn.disabled = true;

        try {
            var payload = {
                content: content,
            };

            if (threadId !== null) {
                payload.threadId = threadId;
            } else {
                payload.friendId = friendId;
            }

            await apiPost('/api/messages/send', payload);

            newInputField.value = '';
            await loadChatThread(friendId, friendName);
        } catch (error) {
            showToast({
                message: 'Failed to send message: ' + (error.message || 'Unknown error'),
                type: 'error',
            });
        } finally {
            newSendBtn.disabled = false;
            newInputField.focus();
        }
    }

    newSendBtn.addEventListener('click', sendMessage);

    // Enter to send, Shift+Enter for newline.
    newInputField.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });
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
