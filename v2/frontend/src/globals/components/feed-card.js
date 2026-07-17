/**
 * Resona FeedCard Component
 * 
 * Displays a friend's music activity card with track info,
 * weekly top, shared interests, and reaction panel.
 * v1.1: Updated to use Lucide icons for reactions.
 *
 * @version 1.1.0
 */

/**
 * Create a feed card element from card data.
 *
 * @param {object} cardData - The feed card data from API.
 * @param {object} cardData.id - Card ID.
 * @param {object} cardData.user - User info {id, username, displayName, avatarUrl}.
 * @param {object} cardData.track - Track info {name, artists, albumName, albumArt}.
 * @param {boolean} cardData.isPlaying - Whether currently playing.
 * @param {object|null} cardData.weeklyTopTrack - Weekly top track data.
 * @param {string[]} cardData.sharedArtists - Shared artist names.
 * @param {number} cardData.overlapScore - Music taste overlap percentage.
 * @param {object} cardData.reactionSummary - {count, topEmojis, userReacted}.
 * @param {string} cardData.createdAt - ISO timestamp.
 * @param {function} onReaction - Callback when reaction is added.
 *
 * @returns {HTMLElement} The feed card element.
 */
function createFeedCard(cardData, onReaction) {
    const card = document.createElement('article');
    card.className = 'feed-card';
    card.dataset.cardId = cardData.id;

    // User header section.
    const header = document.createElement('div');
    header.className = 'feed-card__header';

    const avatar = document.createElement('img');
    avatar.className = 'feed-card__avatar';
    avatar.src = cardData.user.avatarUrl || 'assets/default-avatar.svg';
    avatar.alt = cardData.user.displayName + '\'s avatar';
    avatar.loading = 'lazy';

    const userInfo = document.createElement('div');
    userInfo.className = 'feed-card__user-info';

    const displayName = document.createElement('span');
    displayName.className = 'feed-card__display-name';
    displayName.textContent = cardData.user.displayName;

    const username = document.createElement('span');
    username.className = 'feed-card__username';
    username.textContent = '@' + cardData.user.username;

    userInfo.appendChild(displayName);
    userInfo.appendChild(username);

    const nowPlayingBadge = document.createElement('span');
    nowPlayingBadge.className = 'feed-card__now-playing-badge';

    if (cardData.isPlaying) {
        nowPlayingBadge.textContent = 'NOW PLAYING';
        nowPlayingBadge.classList.add('feed-card__now-playing-badge--active');
    }

    header.appendChild(avatar);
    header.appendChild(userInfo);
    header.appendChild(nowPlayingBadge);

    // Album art section.
    const artSection = document.createElement('div');
    artSection.className = 'feed-card__art';

    const albumImg = document.createElement('img');
    albumImg.className = 'feed-card__album-art';
    albumImg.src = cardData.track.albumArt || 'assets/default-album.svg';
    albumImg.alt = cardData.track.albumName + ' album art';
    albumImg.loading = 'lazy';

    artSection.appendChild(albumImg);

    // Track info section.
    const trackInfo = document.createElement('div');
    trackInfo.className = 'feed-card__track-info';

    const trackName = document.createElement('h3');
    trackName.className = 'feed-card__track-name';
    trackName.textContent = cardData.track.name;

    const artistNames = document.createElement('p');
    artistNames.className = 'feed-card__artists';
    artistNames.textContent = cardData.track.artists.join(', ');

    trackInfo.appendChild(trackName);
    trackInfo.appendChild(artistNames);

    // Weekly top track.
    const statsSection = document.createElement('div');
    statsSection.className = 'feed-card__stats';

    if (cardData.weeklyTopTrack !== null) {
        const weeklyLabel = document.createElement('span');
        weeklyLabel.className = 'feed-card__stat-label';
        weeklyLabel.textContent = 'Weekly Top: ' + cardData.weeklyTopTrack.track_name;
        statsSection.appendChild(weeklyLabel);
    }

    // Shared artists.
    if (cardData.sharedArtists.length > 0) {
        const sharedLabel = document.createElement('span');
        sharedLabel.className = 'feed-card__stat-label feed-card__stat-label--shared';
        sharedLabel.textContent = 'Shared: ' + cardData.sharedArtists.slice(0, 3).join(', ');
        statsSection.appendChild(sharedLabel);
    }

    // Overlap score.
    const overlapBadge = document.createElement('div');
    overlapBadge.className = 'feed-card__overlap';
    overlapBadge.textContent = Math.round(cardData.overlapScore) + '% music match';
    statsSection.appendChild(overlapBadge);

    // Reaction section.
    const reactionSection = document.createElement('div');
    reactionSection.className = 'feed-card__reactions';

    const emojiRow = document.createElement('div');
    emojiRow.className = 'feed-card__emoji-row';

    // v1.1: Lucide icon names for reactions
    const VALID_REACTION_NAMES = ['flame', 'heart', 'music'];

    var userReacted = cardData.reactionSummary.userReacted;

    VALID_REACTION_NAMES.forEach(function (iconName) {
        const emojiBtn = document.createElement('button');
        emojiBtn.className = 'feed-card__emoji-btn';
        emojiBtn.setAttribute('aria-label', 'React with ' + iconName);
        emojiBtn.setAttribute('title', 'React with ' + iconName);

        var isReacted = false;
        if (Array.isArray(userReacted)) {
            isReacted = userReacted.indexOf(iconName) !== -1;
        } else if (typeof userReacted === 'object' && userReacted !== null) {
            isReacted = !!userReacted[iconName];
        } else if (typeof userReacted === 'boolean') {
            isReacted = userReacted;
        }
        if (isReacted) {
            emojiBtn.classList.add('feed-card__emoji-btn--reacted');
        }

        // Use Lucide icon if createIcon is available
        if (typeof createIcon === 'function') {
            const iconEl = createIcon(iconName, { size: 20 });
            emojiBtn.appendChild(iconEl);
        } else {
            emojiBtn.textContent = iconName;
        }

        emojiBtn.addEventListener('click', function () {
            if (typeof onReaction === 'function') {
                onReaction(cardData.id, iconName);
            }
        });

        emojiRow.appendChild(emojiBtn);
    });

    reactionSection.appendChild(emojiRow);

    // Reaction count.
    const countBadge = document.createElement('div');
    countBadge.className = 'feed-card__reaction-count';
    countBadge.textContent = cardData.reactionSummary.count + ' reactions';
    reactionSection.appendChild(countBadge);

    // Assemble card.
    card.appendChild(header);
    card.appendChild(artSection);
    card.appendChild(trackInfo);
    card.appendChild(statsSection);
    card.appendChild(reactionSection);

    return card;
}
