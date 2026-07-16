/**
 * Resona Onboarding Page Helper Functions
 *
 * HTML template rendering and shared utilities for onboarding.
 * v2.1: Extracted from onboarding.js to comply with 500-line hard limit.
 *
 * @version 2.1.0
 */

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

/**
 * Render step 1 HTML string.
 *
 * @returns {string} HTML content.
 */
function renderStep1Html() {
    return '<div class="form-group">' +
        '<label class="form-group__label" for="onboarding-display-name">Display Name</label>' +
        '<input class="form-group__input" type="text" id="onboarding-display-name" value="' +
        escapeHtml(onboardingState.data.displayName) + '" maxlength="100" placeholder="Your name" />' +
        '</div>' +
        '<div class="form-group">' +
        '<label class="form-group__label" for="onboarding-username">Username</label>' +
        '<div class="username-check">' +
        '<input class="form-group__input" type="text" id="onboarding-username" value="' +
        escapeHtml(onboardingState.data.username) + '" maxlength="20" placeholder="your_username" style="flex: 1;" />' +
        '<span class="username-check__indicator" id="username-check-indicator"></span>' +
        '</div>' +
        '<span class="form-group__hint">3-20 characters. Will be lowercased automatically.</span>' +
        '</div>';
}

/**
 * Render step 2 HTML string.
 *
 * @returns {string} HTML content.
 */
function renderStep2Html() {
    return '<div class="form-group">' +
        '<label class="form-group__label" for="onboarding-bio">Bio</label>' +
        '<textarea class="form-group__input form-group__input--textarea" id="onboarding-bio" maxlength="200" placeholder="Tell people about yourself...">' +
        escapeHtml(onboardingState.data.bio) + '</textarea>' +
        '<span class="character-counter" id="onboarding-bio-counter">' +
        onboardingState.data.bio.length + '/200</span>' +
        '</div>' +
        '<div class="form-group">' +
        '<label class="form-group__label" for="onboarding-interests">Interests</label>' +
        '<input class="form-group__input" type="text" id="onboarding-interests" value="' +
        escapeHtml(onboardingState.data.interests) + '" placeholder="e.g. indie, vinyl collecting, concert photography" maxlength="500" />' +
        '</div>' +
        '<div class="form-group">' +
        '<label class="form-group__label" for="onboarding-genres">Favorite Genres</label>' +
        '<input class="form-group__input" type="text" id="onboarding-genres" value="' +
        escapeHtml(onboardingState.data.favoriteGenres) + '" placeholder="e.g. Indie Rock, Jazz, Hip Hop" maxlength="300" />' +
        '</div>';
}

/**
 * Render step 3 HTML string.
 *
 * @returns {string} HTML content.
 */
function renderStep3Html() {
    var privacy = onboardingState.data.privacyLevel || 'friends_only';

    return '<div class="form-group">' +
        '<label class="form-group__label" for="onboarding-avatar">Avatar URL</label>' +
        '<input class="form-group__input" type="url" id="onboarding-avatar" value="' +
        escapeHtml(onboardingState.data.avatarUrl) + '" placeholder="https://..." maxlength="500" />' +
        '</div>' +
        '<div class="form-group">' +
        '<label class="form-group__label">Privacy</label>' +
        '<div class="privacy-selector">' +
        '<label class="privacy-option ' + (privacy === 'public' ? 'privacy-option--selected' : '') + '">' +
        '<input type="radio" name="onboarding-privacy" value="public" ' + (privacy === 'public' ? 'checked' : '') + ' />' +
        '<div><strong>Public</strong><br /><span style="font-size: var(--rs-font-size-sm); color: var(--rs-text-dim);">Anyone can see your activity</span></div>' +
        '</label>' +
        '<label class="privacy-option ' + (privacy === 'friends_only' ? 'privacy-option--selected' : '') + '">' +
        '<input type="radio" name="onboarding-privacy" value="friends_only" ' + (privacy === 'friends_only' ? 'checked' : '') + ' />' +
        '<div><strong>Friends Only</strong><br /><span style="font-size: var(--rs-font-size-sm); color: var(--rs-text-dim);">Only friends can see your activity</span></div>' +
        '</label>' +
        '<label class="privacy-option ' + (privacy === 'private' ? 'privacy-option--selected' : '') + '">' +
        '<input type="radio" name="onboarding-privacy" value="private" ' + (privacy === 'private' ? 'checked' : '') + ' />' +
        '<div><strong>Private</strong><br /><span style="font-size: var(--rs-font-size-sm); color: var(--rs-text-dim);">Only you can see your activity</span></div>' +
        '</label>' +
        '</div>' +
        '</div>';
}

/**
 * Render step 4 HTML string (summary).
 *
 * @returns {string} HTML content.
 */
function renderStep4Html() {
    var interestsTags = (onboardingState.data.interests || '')
        .split(',')
        .filter(function (t) { return t.trim() !== ''; })
        .map(function (t) { return '<span class="tag">#' + escapeHtml(t.trim()) + '</span>'; })
        .join('');

    var genreTags = (onboardingState.data.favoriteGenres || '')
        .split(',')
        .filter(function (t) { return t.trim() !== ''; })
        .map(function (t) { return '<span class="tag tag--genre">' + escapeHtml(t.trim()) + '</span>'; })
        .join('');

    var privacyLabels = {
        'public': 'Public',
        'friends_only': 'Friends Only',
        'private': 'Private',
    };

    return '<div style="text-align: center;">' +
        '<div data-lucide="party-popper" style="width: 64px; height: 64px; color: var(--rs-primary); margin: 0 auto var(--rs-space-4);"></div>' +
        '<p style="margin-bottom: var(--rs-space-6); color: var(--rs-text-muted);">Your profile is ready!</p>' +
        '</div>' +
        '<div style="background: var(--rs-surface); border-radius: var(--rs-radius-lg); padding: var(--rs-space-4); margin-bottom: var(--rs-space-4);">' +
        '<p><strong>' + escapeHtml(onboardingState.data.displayName || 'Your Name') + '</strong> ' +
        '<span style="color: var(--rs-text-muted);">@' + escapeHtml(onboardingState.data.username) + '</span></p>' +
        (onboardingState.data.bio ? '<p style="color: var(--rs-text-muted); font-size: var(--rs-font-size-sm); margin-top: var(--rs-space-2);">' +
        escapeHtml(onboardingState.data.bio) + '</p>' : '') +
        (interestsTags ? '<div class="tags-section" style="margin-top: var(--rs-space-2);">' + interestsTags + '</div>' : '') +
        (genreTags ? '<div class="tags-section">' + genreTags + '</div>' : '') +
        '<p style="margin-top: var(--rs-space-2); font-size: var(--rs-font-size-sm); color: var(--rs-text-dim);">' +
        (privacyLabels[onboardingState.data.privacyLevel] || 'Friends Only') + '</p>' +
        '</div>';
}
