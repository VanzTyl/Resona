/**
 * Resona Profile Page Controller
 *
 * Displays and allows editing user profile settings.
 * Implements UI-C-011.
 * v1.1: Added bio, username editing, privacy selector, interests, genres,
 *       about me section, top artists display, stats summary, logout button.
 *
 * @version 1.1.0
 */

/**
 * Render the profile page.
 *
 * @returns {void}
 */
function renderProfilePage() {
    const app = document.getElementById('app');

    const existingPage = document.querySelector('.page--active');

    if (existingPage !== null) {
        existingPage.classList.remove('page--active');
    }

    let page = document.getElementById('page-profile');

    if (page === null) {
        page = document.createElement('div');
        page.id = 'page-profile';
        page.className = 'page';

        page.innerHTML = '' +
            '<div class="page__header">' +
            '    <h1 class="page__title">Profile</h1>' +
            '</div>' +
            '<div class="page__content" id="profile-content"></div>';

        app.insertBefore(page, app.firstChild);
    }

    page.classList.add('page--active');

    loadProfile();
}

/**
 * Load the user's profile data.
 *
 * @returns {Promise<void>}
 */
async function loadProfile() {
    const content = document.getElementById('profile-content');

    if (content === null) {
        return;
    }

    content.innerHTML = '<p style="color: var(--rs-text-dim);">Loading profile...</p>';

    try {
        const profile = await apiGet('/api/user/profile');

        // v1.1: Load stats and top artists in parallel
        let stats = null;
        let topArtists = null;

        try {
            stats = await apiGet('/api/user/stats');
        } catch (_e) {
            // Non-critical
        }

        try {
            topArtists = await apiGet('/api/dashboard/top-artists?period=all&limit=5');
        } catch (_e) {
            // Non-critical
        }

        // Bio display
        const bioHtml = profile.bio
            ? '<p class="profile-header__bio">' + escapeHtml(profile.bio) + '</p>'
            : '';

        // v1.1: Stats row
        let statsHtml = '';
        if (stats !== null) {
            statsHtml = '' +
                '<div class="stats-row">' +
                '    <div class="stat-card">' +
                '        <div class="stat-card__value">' + (stats.totalTracksPlayed || 0) + '</div>' +
                '        <div class="stat-card__label">Tracks Played</div>' +
                '    </div>' +
                '    <div class="stat-card">' +
                '        <div class="stat-card__value">' + (stats.uniqueArtists || 0) + '</div>' +
                '        <div class="stat-card__label">Artists</div>' +
                '    </div>' +
                '    <div class="stat-card">' +
                '        <div class="stat-card__value">' + escapeHtml(stats.topGenre || '—') + '</div>' +
                '        <div class="stat-card__label">Top Genre</div>' +
                '    </div>' +
                '</div>';
        }

        // v1.1: Top artists section
        let topArtistsHtml = '';
        if (topArtists !== null && topArtists.length > 0) {
            topArtistsHtml = '' +
                '<div class="profile-section">' +
                '    <h3 class="profile-section__title">My Top Artists</h3>' +
                '    <div class="artist-list">';

            topArtists.forEach(function (artist, index) {
                topArtistsHtml += '' +
                    '<div class="artist-item">' +
                    '    <div class="artist-item__rank">' + (index + 1) + '</div>' +
                    '    <div class="artist-item__name">' + escapeHtml(artist.artist_name) + '</div>' +
                    '    <div class="artist-item__count">' + artist.play_count + ' plays</div>' +
                    '</div>';
            });

            topArtistsHtml += '    </div></div>';
        } else {
            topArtistsHtml = '' +
                '<div class="profile-section">' +
                '    <h3 class="profile-section__title">My Top Artists</h3>' +
                '    <p style="color: var(--rs-text-dim); font-size: var(--rs-font-size-sm);">No artist data yet. Keep listening!</p>' +
                '</div>';
        }

        // v1.1: Tags (interests, genres, about me)
        const interestsTags = (profile.interests || '')
            .split(',')
            .filter(function (t) { return t.trim() !== ''; })
            .map(function (t) { return '<span class="tag">#' + escapeHtml(t.trim()) + '</span>'; })
            .join('');

        const genreTags = (profile.favorite_genres || '')
            .split(',')
            .filter(function (t) { return t.trim() !== ''; })
            .map(function (t) { return '<span class="tag tag--genre">' + escapeHtml(t.trim()) + '</span>'; })
            .join('');

        const aboutHtml = profile.about_me
            ? '<div class="profile-section"><div class="about-section">' + escapeHtml(profile.about_me) + '</div></div>'
            : '';

        content.innerHTML = '' +
            '<div class="profile-header">' +
            '    <img class="profile-header__avatar" src="' + (profile.avatar_url || 'assets/default-avatar.svg') + '" alt="Profile picture" />' +
            '    <h2 class="profile-header__name">' + escapeHtml(profile.display_name) + '</h2>' +
            '    <p class="profile-header__username">@' + escapeHtml(profile.username) + '</p>' +
            bioHtml +
            '</div>' +
            statsHtml +
            (interestsTags ? '<div class="tags-section">' + interestsTags + '</div>' : '') +
            (genreTags ? '<div class="tags-section">' + genreTags + '</div>' : '') +
            aboutHtml +
            topArtistsHtml +
            '<div class="profile-form" id="profile-form">' +
            '    <h3 class="profile-section__title">Edit Profile</h3>' +

            // Display Name
            '    <div class="form-group">' +
            '        <label class="form-group__label" for="profile-display-name">Display Name</label>' +
            '        <input class="form-group__input" type="text" id="profile-display-name" value="' + escapeHtml(profile.display_name) + '" maxlength="100" />' +
            '    </div>' +

            // Avatar URL
            '    <div class="form-group">' +
            '        <label class="form-group__label" for="profile-avatar-url">Avatar URL</label>' +
            '        <input class="form-group__input" type="url" id="profile-avatar-url" value="' + escapeHtml(profile.avatar_url) + '" maxlength="500" />' +
            '    </div>' +

            // v1.1: Username
            '    <div class="form-group">' +
            '        <label class="form-group__label" for="profile-username">Username</label>' +
            '        <input class="form-group__input" type="text" id="profile-username" value="' + escapeHtml(profile.username) + '" maxlength="20" />' +
            '        <span class="form-group__hint">3-20 characters. Will be lowercased automatically. Can only be changed once every 30 days.</span>' +
            '    </div>' +

            // v1.1: Bio
            '    <div class="form-group">' +
            '        <label class="form-group__label" for="profile-bio">Bio</label>' +
            '        <textarea class="form-group__input form-group__input--textarea" id="profile-bio" maxlength="200">' + escapeHtml(profile.bio || '') + '</textarea>' +
            '        <span class="character-counter" id="bio-counter">' + (profile.bio ? profile.bio.length : 0) + '/200</span>' +
            '    </div>' +

            // v1.1: Interests
            '    <div class="form-group">' +
            '        <label class="form-group__label" for="profile-interests">Interests</label>' +
            '        <input class="form-group__input" type="text" id="profile-interests" value="' + escapeHtml(profile.interests || '') + '" placeholder="e.g. indie, vinyl collecting, concert photography" maxlength="500" />' +
            '    </div>' +

            // v1.1: Favorite Genres
            '    <div class="form-group">' +
            '        <label class="form-group__label" for="profile-favorite-genres">Favorite Genres</label>' +
            '        <input class="form-group__input" type="text" id="profile-favorite-genres" value="' + escapeHtml(profile.favorite_genres || '') + '" placeholder="e.g. Indie Rock, Jazz, Hip Hop" maxlength="300" />' +
            '    </div>' +

            // v1.1: About Me
            '    <div class="form-group">' +
            '        <label class="form-group__label" for="profile-about-me">About Me</label>' +
            '        <textarea class="form-group__input form-group__input--textarea" id="profile-about-me" maxlength="500">' + escapeHtml(profile.about_me || '') + '</textarea>' +
            '    </div>' +

            // v1.1: Privacy selector
            '    <div class="form-group">' +
            '        <label class="form-group__label">Privacy</label>' +
            '        <div class="privacy-selector" id="profile-privacy-selector">' +
            '            <label class="privacy-option ' + (profile.privacy_level === 'public' ? 'privacy-option--selected' : '') + '">' +
            '                <input type="radio" name="privacy" value="public" ' + (profile.privacy_level === 'public' ? 'checked' : '') + ' />' +
            '                <div><strong>Public</strong><br /><span style="font-size: var(--rs-font-size-sm); color: var(--rs-text-dim);">Anyone can see your activity</span></div>' +
            '            </label>' +
            '            <label class="privacy-option ' + (profile.privacy_level === 'friends_only' || !profile.privacy_level ? 'privacy-option--selected' : '') + '">' +
            '                <input type="radio" name="privacy" value="friends_only" ' + (profile.privacy_level === 'friends_only' || !profile.privacy_level ? 'checked' : '') + ' />' +
            '                <div><strong>Friends Only</strong><br /><span style="font-size: var(--rs-font-size-sm); color: var(--rs-text-dim);">Only friends can see your activity</span></div>' +
            '            </label>' +
            '            <label class="privacy-option ' + (profile.privacy_level === 'private' ? 'privacy-option--selected' : '') + '">' +
            '                <input type="radio" name="privacy" value="private" ' + (profile.privacy_level === 'private' ? 'checked' : '') + ' />' +
            '                <div><strong>Private</strong><br /><span style="font-size: var(--rs-font-size-sm); color: var(--rs-text-dim);">Only you can see your activity</span></div>' +
            '            </label>' +
            '        </div>' +
            '    </div>' +

            // Spotify status
            '    <div class="form-group">' +
            '        <label class="form-group__label">Spotify Connected</label>' +
            '        <p style="color: ' + (profile.spotify_connected ? 'var(--rs-success)' : 'var(--rs-text-dim)') + '; padding: 8px 0;">' +
            (profile.spotify_connected ? '✅ Connected' : '❌ Not connected') +
            '        </p>' +
            '    </div>' +

            // Save button
            '    <div id="profile-save-container"></div>' +
            // v1.1: Logout button
            '    <div id="profile-logout-container" style="margin-top: var(--rs-space-2);"></div>' +
            '</div>';

        // Set up bio character counter
        const bioInput = document.getElementById('profile-bio');
        const bioCounter = document.getElementById('bio-counter');

        if (bioInput !== null && bioCounter !== null) {
            bioInput.addEventListener('input', function () {
                bioCounter.textContent = bioInput.value.length + '/200';
            });
        }

        // Auto-lowercase username as user types
        const usernameInput = document.getElementById('profile-username');
        if (usernameInput !== null) {
            usernameInput.addEventListener('input', function () {
                var cursorPos = usernameInput.selectionStart;
                usernameInput.value = usernameInput.value.toLowerCase();
                usernameInput.setSelectionRange(cursorPos, cursorPos);
            });
        }

        // Set up privacy selector styling
        const privacyOptions = document.querySelectorAll('.privacy-option');
        privacyOptions.forEach(function (opt) {
            const radio = opt.querySelector('input[type="radio"]');
            if (radio !== null) {
                radio.addEventListener('change', function () {
                    privacyOptions.forEach(function (o) {
                        o.classList.remove('privacy-option--selected');
                    });
                    opt.classList.add('privacy-option--selected');
                });
            }
        });

        // Save button
        const saveContainer = document.getElementById('profile-save-container');

        if (saveContainer !== null) {
            const saveBtn = createButton({
                label: 'Save Changes',
                variant: 'primary',
                isFullWidth: true,
                onClick: function () {
                    saveProfile();
                },
            });

            saveContainer.appendChild(saveBtn);
        }

        // v1.1: Logout button
        const logoutContainer = document.getElementById('profile-logout-container');

        if (logoutContainer !== null) {
            logoutContainer.appendChild(createButton({
                label: 'Log Out',
                variant: 'danger',
                isFullWidth: true,
                onClick: function () {
                    clearTokens();
                    showToast({
                        message: 'Logged out successfully',
                        type: 'info',
                    });
                    navigateTo('/login');
                },
            }));
        }
    } catch (error) {
        content.innerHTML = '<p style="color: var(--rs-error);">Failed to load profile: ' + escapeHtml(error.message) + '</p>';
    }
}

/**
 * Save profile changes.
 *
 * @returns {Promise<void>}
 */
async function saveProfile() {
    const displayNameInput = document.getElementById('profile-display-name');
    const avatarUrlInput = document.getElementById('profile-avatar-url');

    if (displayNameInput === null || avatarUrlInput === null) {
        return;
    }

    const payload = {};

    const displayName = displayNameInput.value.trim();
    if (displayName !== '') {
        payload.displayName = displayName;
    }

    const avatarUrl = avatarUrlInput.value.trim();
    if (avatarUrl !== '') {
        if (!isValidUrl(avatarUrl)) {
            showToast({
                message: 'Please enter a valid URL for the avatar',
                type: 'error',
            });
            return;
        }
        payload.avatarUrl = avatarUrl;
    }

    // v1.1: Username
    const usernameInput = document.getElementById('profile-username');
    if (usernameInput !== null) {
        const username = usernameInput.value.trim();
        if (username !== '') {
            payload.username = username;
        }
    }

    // v1.1: Bio
    const bioInput = document.getElementById('profile-bio');
    if (bioInput !== null) {
        payload.bio = bioInput.value.trim();
    }

    // v1.1: Interests
    const interestsInput = document.getElementById('profile-interests');
    if (interestsInput !== null) {
        payload.interests = interestsInput.value.trim();
    }

    // v1.1: Favorite Genres
    const genresInput = document.getElementById('profile-favorite-genres');
    if (genresInput !== null) {
        payload.favoriteGenres = genresInput.value.trim();
    }

    // v1.1: About Me
    const aboutMeInput = document.getElementById('profile-about-me');
    if (aboutMeInput !== null) {
        payload.aboutMe = aboutMeInput.value.trim();
    }

    // v1.1: Privacy level
    const selectedPrivacy = document.querySelector('input[name="privacy"]:checked');
    if (selectedPrivacy !== null) {
        payload.privacyLevel = selectedPrivacy.value;
    }

    if (Object.keys(payload).length === 0) {
        showToast({
            message: 'No fields to update',
            type: 'error',
        });
        return;
    }

    try {
        await apiPut('/api/user/profile', payload);

        showToast({
            message: 'Profile updated successfully!',
            type: 'success',
        });

        // Reload profile to reflect changes.
        loadProfile();
    } catch (error) {
        showToast({
            message: 'Failed to update profile: ' + error.message,
            type: 'error',
        });
    }
}

/**
 * Validate a URL string.
 *
 * @param {string} url - The URL to validate.
 * @returns {boolean} True if valid.
 */
function isValidUrl(url) {
    try {
        new URL(url);
        return true;
    } catch (_e) {
        return false;
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
