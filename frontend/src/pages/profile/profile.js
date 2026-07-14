/**
 * Resona Profile Page Controller
 *
 * Displays and allows editing user profile settings.
 * Implements UI-C-011.
 *
 * @version 1.0.0
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

        content.innerHTML = '' +
            '<div class="profile-header">' +
            '    <img class="profile-header__avatar" src="' + (profile.avatar_url || 'assets/default-avatar.svg') + '" alt="Profile picture" />' +
            '    <h2 class="profile-header__name">' + escapeHtml(profile.display_name) + '</h2>' +
            '    <p class="profile-header__username">@' + escapeHtml(profile.username) + '</p>' +
            '</div>' +
            '<div class="profile-form" id="profile-form">' +
            '    <div class="form-group">' +
            '        <label class="form-group__label" for="profile-display-name">Display Name</label>' +
            '        <input class="form-group__input" type="text" id="profile-display-name" value="' + escapeHtml(profile.display_name) + '" maxlength="100" />' +
            '    </div>' +
            '    <div class="form-group">' +
            '        <label class="form-group__label" for="profile-avatar-url">Avatar URL</label>' +
            '        <input class="form-group__input" type="url" id="profile-avatar-url" value="' + escapeHtml(profile.avatar_url) + '" maxlength="500" />' +
            '    </div>' +
            '    <div class="form-group">' +
            '        <label class="form-group__label">Spotify Connected</label>' +
            '        <p style="color: ' + (profile.spotify_connected ? 'var(--rs-success)' : 'var(--rs-text-dim)') + '; padding: 8px 0;">' +
            (profile.spotify_connected ? 'âœ… Connected' : 'âŒ Not connected') +
            '        </p>' +
            '    </div>' +
            '    <div id="profile-save-container"></div>' +
            '</div>';

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

    const displayName = displayNameInput.value.trim();
    const avatarUrl = avatarUrlInput.value.trim();

    if (displayName === '') {
        showToast({
            message: 'Display name cannot be empty',
            type: 'error',
        });

        return;
    }

    if (avatarUrl !== '' && !isValidUrl(avatarUrl)) {
        showToast({
            message: 'Please enter a valid URL for the avatar',
            type: 'error',
        });

        return;
    }

    try {
        await apiPut('/api/user/profile', {
            displayName: displayName,
            avatarUrl: avatarUrl,
        });

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
