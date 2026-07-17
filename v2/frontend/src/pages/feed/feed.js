/**
 * Resona Feed Page Controller
 *
 * Renders the infinite-scroll friend activity feed.
 * v2.1: Uses static HTML containers — appends feed cards via appendChild.
 *
 * @version 2.1.0
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
 * Creates page structure via createElement/appendChild if not in DOM
 * (supports both standalone .html viewing and SPA hash routing).
 *
 * @returns {void}
 */
function renderFeedPage() {
    const existingPage = document.querySelector('.page--active');

    if (existingPage !== null) {
        existingPage.classList.remove('page--active');
    }

    let page = document.getElementById('page-feed');

    if (page === null) {
        // Create page structure using createElement/appendChild (no innerHTML).
        page = createFeedPageStructure();
        const app = document.getElementById('app');

        if (app === null) {
            return;
        }

        app.insertBefore(page, app.firstChild);
    }

    page.classList.add('page--active');

    // Reset feed state.
    feedState.cursor = null;
    feedState.hasMore = true;
    feedState.cards = [];

    const container = document.getElementById('feed-container');

    if (container !== null) {
        // Clear any previous content (children only, not the container itself).
        while (container.firstChild !== null) {
            container.removeChild(container.firstChild);
        }

        // Show skeleton loading.
        const skeletonContainer = document.getElementById('feed-skeleton-container');

        if (skeletonContainer !== null) {
            skeletonContainer.style.display = '';

            while (skeletonContainer.firstChild !== null) {
                skeletonContainer.removeChild(skeletonContainer.firstChild);
            }

            for (let i = 0; i < 3; i++) {
                skeletonContainer.appendChild(createSkeletonCard());
            }
        }

        // Load now-playing friends section.
        loadNowPlayingFriends();

        // Fetch feed data.
        loadFeedCards();
    }

    // Set up infinite scroll.
    setupInfiniteScroll();
}

/**
 * Create the feed page DOM structure using createElement/appendChild.
 *
 * @returns {HTMLElement} The page element.
 */
function createFeedPageStructure() {
    const page = document.createElement('div');
    page.id = 'page-feed';
    page.className = 'page';

    // Header.
    const header = document.createElement('header');
    header.className = 'page__header';

    const title = document.createElement('h1');
    title.className = 'page__title';
    title.textContent = 'Feed';
    header.appendChild(title);
    page.appendChild(header);

    // Main content.
    const main = document.createElement('main');
    main.className = 'page__content';
    main.id = 'feed-content';

    // Now-playing friends section (hidden by default).
    const nowPlayingSection = document.createElement('div');
    nowPlayingSection.id = 'feed-now-playing';
    nowPlayingSection.className = 'now-playing-friends';
    nowPlayingSection.style.display = 'none';
    main.appendChild(nowPlayingSection);

    // Feed container (cards go here).
    const feedContainer = document.createElement('div');
    feedContainer.id = 'feed-container';
    main.appendChild(feedContainer);

    // Skeleton container.
    const skeletonContainer = document.createElement('div');
    skeletonContainer.id = 'feed-skeleton-container';
    skeletonContainer.className = 'rs-skeleton';
    main.appendChild(skeletonContainer);

    // Empty state (hidden by default).
    const emptyState = document.createElement('div');
    emptyState.id = 'feed-empty-state';
    emptyState.className = 'empty-state';
    emptyState.style.display = 'none';

    const emptyIcon = document.createElement('div');
    emptyIcon.className = 'empty-state__icon';
    emptyIcon.setAttribute('data-lucide', 'music');
    emptyState.appendChild(emptyIcon);

    const emptyTitle = document.createElement('h2');
    emptyTitle.className = 'empty-state__title';
    emptyTitle.textContent = 'No activity yet';
    emptyState.appendChild(emptyTitle);

    const emptyText = document.createElement('p');
    emptyText.className = 'empty-state__text';
    emptyText.textContent = "Add friends to see what they're listening to!";
    emptyState.appendChild(emptyText);

    main.appendChild(emptyState);

    // Discover section (hidden by default).
    const discoverSection = document.createElement('div');
    discoverSection.id = 'feed-discover-section';
    discoverSection.style.display = 'none';
    main.appendChild(discoverSection);

    // Infinite scroll sentinel.
    const sentinel = document.createElement('div');
    sentinel.id = 'feed-sentinel';
    sentinel.style.height = '1px';
    main.appendChild(sentinel);

    page.appendChild(main);

    return page;
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
            skeletonContainer.style.display = 'none';
            while (skeletonContainer.firstChild !== null) {
                skeletonContainer.removeChild(skeletonContainer.firstChild);
            }
        }

        renderFeedCards(data.cards);

        // Start now-playing after feed content is visible.
        if (typeof startNowPlayingPolling === 'function') {
            startNowPlayingPolling();
        }

        if (!feedState.hasMore) {
            if (feedState.cards.length === 0) {
                showEmptyFeed();
            } else {
                showEndOfFeed();
            }
        }
    } catch (error) {
        feedState.isLoading = false;

        // Still start now-playing even if feed fails.
        if (typeof startNowPlayingPolling === 'function') {
            startNowPlayingPolling();
        }

        showToast({
            message: 'Failed to load feed: ' + error.message,
            type: 'error',
        });
    }
}

/**
 * Show empty feed state using existing static HTML.
 *
 * @returns {void}
 */
function showEmptyFeed() {
    const emptyState = document.getElementById('feed-empty-state');

    if (emptyState !== null) {
        emptyState.style.display = '';
    }

    // Load discover section below empty state.
    loadDiscoverSection();
}

/**
 * Render feed cards into the container using appendChild.
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
        showEmptyFeed();
        return;
    }

    cards.forEach(function (cardData) {
        const card = createFeedCard(cardData, handleReaction);
        container.appendChild(card);
    });

    // Initialize icons for the new cards.
    if (typeof initIcons === 'function') {
        initIcons();
    }
}

/**
 * Handle emoji reaction on a feed card.
 *
 * @param {number} cardId - The feed card ID.
 * @param {string} emoji - The emoji/Lucide icon name.
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

        var cardEl = document.querySelector('[data-card-id="' + cardId + '"]');
        if (cardEl !== null) {
            var countBadge = cardEl.querySelector('.feed-card__reaction-count');
            if (countBadge !== null) {
                var match = countBadge.textContent.match(/(\d+)/);
                var currentCount = match !== null ? parseInt(match[1], 10) : 0;
                countBadge.textContent = (currentCount + 1) + ' reactions';
            }

            var emojiBtns = cardEl.querySelectorAll('.feed-card__emoji-btn');
            emojiBtns.forEach(function (btn) {
                var iconEl = btn.querySelector('[data-lucide]');
                if (iconEl !== null && iconEl.getAttribute('data-lucide') === emoji) {
                    btn.classList.add('feed-card__emoji-btn--active');
                }
            });
        }
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
    const sentinel = document.getElementById('feed-sentinel');

    if (sentinel === null) {
        return;
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
    endMarker.style.padding = '16px 24px 8px';
    endMarker.style.color = 'var(--rs-text-dim)';
    endMarker.style.fontSize = 'var(--rs-font-size-sm)';
    endMarker.textContent = "You're all caught up!";

    container.appendChild(endMarker);

    // Refresh button to scroll to top and reload.
    var refreshWrapper = document.createElement('div');
    refreshWrapper.style.textAlign = 'center';
    refreshWrapper.style.padding = '12px 24px 24px';

    var refreshBtn = document.createElement('button');
    refreshBtn.className = 'rs-btn rs-btn--secondary';
    refreshBtn.textContent = 'Refresh Feed';
    refreshBtn.addEventListener('click', function () {
        window.scrollTo({ top: 0, behavior: 'smooth' });

        // Reload feed cards after a brief delay for scroll to complete.
        setTimeout(function () {
            feedState.cursor = null;
            feedState.hasMore = true;
            feedState.cards = [];

            while (container.firstChild !== null) {
                container.removeChild(container.firstChild);
            }

            loadFeedCards();
        }, 400);
    });

    refreshWrapper.appendChild(refreshBtn);
    container.appendChild(refreshWrapper);
}

/**
 * Load the discover section for finding new people.
 *
 * @returns {Promise<void>}
 */
async function loadDiscoverSection() {
    const section = document.getElementById('feed-discover-section');

    if (section === null) {
        return;
    }

    try {
        const users = await apiGet('/api/discover/random?limit=5');

        section.style.display = '';

        // Clear previous content.
        while (section.firstChild !== null) {
            section.removeChild(section.firstChild);
        }

        if (users.length === 0) {
            const noOneMsg = document.createElement('p');
            noOneMsg.style.textAlign = 'center';
            noOneMsg.style.padding = '24px';
            noOneMsg.style.color = 'var(--rs-text-dim)';
            noOneMsg.style.fontSize = 'var(--rs-font-size-sm)';
            noOneMsg.textContent = 'No one to discover yet — invite your friends!';
            section.appendChild(noOneMsg);
            return;
        }

        // Section header.
        const sectionTitle = document.createElement('h2');
        sectionTitle.className = 'discover-section__title';
        sectionTitle.textContent = 'Discover People';
        section.appendChild(sectionTitle);

        const sectionSubtitle = document.createElement('p');
        sectionSubtitle.className = 'discover-section__subtitle';
        sectionSubtitle.textContent = 'Connect with fellow music lovers';
        section.appendChild(sectionSubtitle);

        const grid = document.createElement('div');
        grid.className = 'discover-grid';
        grid.id = 'discover-grid';
        section.appendChild(grid);

        users.forEach(function (user) {
            const card = document.createElement('div');
            card.className = 'discover-card';

            const avatar = document.createElement('img');
            avatar.className = 'discover-card__avatar';
            avatar.src = user.avatarUrl || 'assets/default-avatar.svg';
            avatar.alt = '';
            avatar.loading = 'lazy';
            card.appendChild(avatar);

            const nameEl = document.createElement('div');
            nameEl.className = 'discover-card__name';
            nameEl.textContent = user.displayName;
            card.appendChild(nameEl);

            if (user.interests) {
                const tagsContainer = document.createElement('div');
                tagsContainer.className = 'discover-card__tags';
                user.interests.split(',').filter(function (t) {
                    return t.trim() !== '';
                }).forEach(function (tag) {
                    const tagEl = document.createElement('span');
                    tagEl.className = 'tag';
                    tagEl.textContent = '#' + tag.trim();
                    tagsContainer.appendChild(tagEl);
                });
                card.appendChild(tagsContainer);
            }

            if (user.recentTrack) {
                const trackEl = document.createElement('div');
                trackEl.className = 'discover-card__track';
                trackEl.textContent = 'Into: ' + user.recentTrack.trackName;
                card.appendChild(trackEl);
            }

            const addBtnContainer = document.createElement('div');
            addBtnContainer.className = 'discover-card__add-btn';

            // Add friend request button.
            if (typeof createButton === 'function' && user.username) {
                addBtnContainer.appendChild(createButton({
                    label: 'Add Friend',
                    variant: 'primary',
                    size: 'small',
                    onClick: function () {
                        apiPost('/api/friends/request', { username: user.username })
                            .then(function () {
                                showToast({ message: 'Friend request sent!', type: 'success' });
                                addBtnContainer.innerHTML = '';
                                var sentLabel = document.createElement('span');
                                sentLabel.className = 'discover-card__sent-label';
                                sentLabel.textContent = 'Request Sent';
                                addBtnContainer.appendChild(sentLabel);
                            })
                            .catch(function (error) {
                                showToast({ message: error.message, type: 'error' });
                            });
                    },
                }));
            }

            card.appendChild(addBtnContainer);

            grid.appendChild(card);
        });

        // Initialize icons in discover section.
        if (typeof initIcons === 'function') {
            initIcons();
        }
    } catch (_error) {
        // Silently fail — discover section is non-critical.
    }
}

/** Load and display friends currently playing in horizontal scroll. */
async function loadNowPlayingFriends() {
    var section = document.getElementById('feed-now-playing');
    if (section === null) { return; }

    try {
        var friends = await apiGet('/api/friends?limit=50');
        var nowPlaying = friends.filter(function (f) {
            return f.isPlaying && f.currentlyPlayingTrack;
        });

        if (nowPlaying.length === 0) { section.style.display = 'none'; return; }

        while (section.firstChild !== null) {
            section.removeChild(section.firstChild);
        }

        section.style.display = '';
        section.className = 'now-playing-friends';

        // Left arrow.
        var leftArrow = document.createElement('button');
        leftArrow.className = 'now-playing-friends__arrow now-playing-friends__arrow--left';
        leftArrow.setAttribute('aria-label', 'Scroll left');
        leftArrow.innerHTML = '&#8249;';
        section.appendChild(leftArrow);

        // Track list container.
        var trackList = document.createElement('div');
        trackList.className = 'now-playing-friends__track-list';

        nowPlaying.forEach(function (friend) {
            var item = document.createElement('div');
            item.className = 'now-playing-friends__item';

            var art = document.createElement('img');
            art.className = 'now-playing-friends__art';
            art.src = friend.albumArtUrl || 'assets/default-album.svg';
            art.alt = '';
            art.loading = 'lazy';
            item.appendChild(art);

            var info = document.createElement('div');
            info.className = 'now-playing-friends__info';

            var nameRow = document.createElement('div');
            nameRow.className = 'now-playing-friends__name-row';

            var name = document.createElement('span');
            name.className = 'now-playing-friends__name';
            name.textContent = friend.displayName;
            nameRow.appendChild(name);

            var tag = document.createElement('span');
            tag.className = 'now-playing-friends__tag';
            tag.textContent = 'Now Playing';
            nameRow.appendChild(tag);

            info.appendChild(nameRow);

            var track = document.createElement('div');
            track.className = 'now-playing-friends__track';
            track.textContent = friend.currentlyPlayingTrack;
            info.appendChild(track);

            item.appendChild(info);
            trackList.appendChild(item);
        });

        section.appendChild(trackList);

        // Right arrow.
        var rightArrow = document.createElement('button');
        rightArrow.className = 'now-playing-friends__arrow now-playing-friends__arrow--right';
        rightArrow.setAttribute('aria-label', 'Scroll right');
        rightArrow.innerHTML = '&#8250;';
        section.appendChild(rightArrow);

        // Arrow click handlers.
        leftArrow.addEventListener('click', function () {
            trackList.scrollBy({ left: -300, behavior: 'smooth' });
        });
        rightArrow.addEventListener('click', function () {
            trackList.scrollBy({ left: 300, behavior: 'smooth' });
        });
    } catch (_error) {
        section.style.display = 'none';
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
