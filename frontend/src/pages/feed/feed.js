/**
 * Resona Feed Page Controller
 *
 * Renders the infinite-scroll friend activity feed.
 * Implements UI-C-003, UI-C-004, UI-C-005.
 *
 * @version 1.0.0
 */

let feedState = {
    cursor: null,
    hasMore: true,
    isLoading: false,
    isLoadingMore: false,
    cards: [],
};

/**
 * Render the feed page.
 *
 * @returns {void}
 */
function renderFeedPage() {
    const app = document.getElementById('app');

    const existingPage = document.querySelector('.page--active');

    if (existingPage !== null) {
        existingPage.classList.remove('page--active');
    }

    let page = document.getElementById('page-feed');

    if (page === null) {
        page = document.createElement('div');
        page.id = 'page-feed';
        page.className = 'page';

        page.innerHTML = '' +
            '<div class="page__header">' +
            '    <h1 class="page__title">Feed</h1>' +
            '</div>' +
            '<div class="page__content" id="feed-container"></div>' +
            '<div id="feed-skeleton-container"></div>';

        app.insertBefore(page, app.firstChild);
    }

    page.classList.add('page--active');

    // Reset feed state.
    feedState.cursor = null;
    feedState.hasMore = true;
    feedState.cards = [];

    const container = document.getElementById('feed-container');

    if (container !== null) {
        // Show skeleton loading.
        container.innerHTML = '';
        const skeletonContainer = document.getElementById('feed-skeleton-container');

        if (skeletonContainer !== null) {
            skeletonContainer.innerHTML = '';

            for (let i = 0; i < 3; i++) {
                skeletonContainer.appendChild(createSkeletonCard());
            }
        }

        // Fetch feed data.
        loadFeedCards();
    }

    // Set up infinite scroll.
    setupInfiniteScroll();
}

/**
 * Load feed cards from the API.
 *
 * @returns {Promise<void>}
 */
async function loadFeedCards() {
    if (feedState.isLoading || !feedState.hasMore) {
        return;
    }

    feedState.isLoading = true;

    try {
        const queryParams = '?limit=10';
        const cursorParam = feedState.cursor !== null ? '&cursor=' + encodeURIComponent(feedState.cursor) : '';

        const data = await apiGet('/api/feed' + queryParams + cursorParam);

        feedState.isLoading = false;
        feedState.cards = feedState.cards.concat(data.cards);
        feedState.cursor = data.nextCursor;
        feedState.hasMore = data.hasMore;

        // Hide skeleton.
        const skeletonContainer = document.getElementById('feed-skeleton-container');

        if (skeletonContainer !== null) {
            skeletonContainer.innerHTML = '';
        }

        renderFeedCards(data.cards);

        if (!feedState.hasMore) {
            showEndOfFeed();
        }
    } catch (error) {
        feedState.isLoading = false;

        showToast({
            message: 'Failed to load feed: ' + error.message,
            type: 'error',
        });
    }
}

/**
 * Render feed cards into the container.
 *
 * @param {Array} cards - Array of card data objects.
 * @returns {void}
 */
function renderFeedCards(cards) {
    const container = document.getElementById('feed-container');

    if (container === null) {
        return;
    }

    if (cards.length === 0 && feedState.cards.length === 0) {
        container.innerHTML = '' +
            '<div class="empty-state">' +
            '    <div class="empty-state__icon">ðŸŽµ</div>' +
            '    <h2 class="empty-state__title">No activity yet</h2>' +
            '    <p class="empty-state__text">Add friends to see what they\'re listening to!</p>' +
            '</div>';

        return;
    }

    cards.forEach(function (cardData) {
        const card = createFeedCard(cardData, handleReaction);
        container.appendChild(card);
    });
}

/**
 * Handle emoji reaction on a feed card.
 *
 * @param {number} cardId - The feed card ID.
 * @param {string} emoji - The emoji character.
 * @returns {Promise<void>}
 */
async function handleReaction(cardId, emoji) {
    try {
        await apiPost('/api/reactions', {
            cardId: cardId,
            emoji: emoji,
        });

        showToast({
            message: 'Reaction added!',
            type: 'success',
            duration: 2000,
        });
    } catch (error) {
        showToast({
            message: 'Failed to add reaction: ' + error.message,
            type: 'error',
        });
    }
}

/**
 * Set up infinite scroll via intersection observer.
 *
 * @returns {void}
 */
function setupInfiniteScroll() {
    const sentinel = document.createElement('div');
    sentinel.id = 'feed-sentinel';
    sentinel.style.height = '1px';

    const container = document.getElementById('feed-container');

    if (container !== null) {
        container.parentNode.appendChild(sentinel);
    }

    const observer = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
            if (entry.isIntersecting && feedState.hasMore && !feedState.isLoading) {
                loadFeedCards();
            }
        });
    }, {
        rootMargin: '200px',
    });

    observer.observe(sentinel);
}

/**
 * Show end of feed indicator.
 *
 * @returns {void}
 */
function showEndOfFeed() {
    const container = document.getElementById('feed-container');

    if (container === null) {
        return;
    }

    const endMarker = document.createElement('p');
    endMarker.style.textAlign = 'center';
    endMarker.style.padding = '24px';
    endMarker.style.color = 'var(--rs-text-dim)';
    endMarker.style.fontSize = 'var(--rs-font-size-sm)';
    endMarker.textContent = 'You\'re all caught up!';

    container.appendChild(endMarker);
}
