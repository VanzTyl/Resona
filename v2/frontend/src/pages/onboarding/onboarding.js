/**
 * Resona Onboarding Page Controller
 *
 * 4-step guided onboarding flow for first-time users.
 * v1.1: New page for REV-011.
 *
 * @version 1.1.0
 */

let onboardingState = {
    currentStep: 1,
    totalSteps: 4,
    data: {
        displayName: '',
        username: '',
        bio: '',
        interests: '',
        favoriteGenres: '',
        avatarUrl: '',
        privacyLevel: 'friends_only',
    },
};

/**
 * Render the onboarding page.
 *
 * @returns {void}
 */
function renderOnboardingPage() {
    const app = document.getElementById('app');

    const existingPage = document.querySelector('.page--active');

    if (existingPage !== null) {
        existingPage.classList.remove('page--active');
    }

    let page = document.getElementById('page-onboarding');

    if (page === null) {
        page = document.createElement('div');
        page.id = 'page-onboarding';
        page.className = 'page page--centered';
        app.insertBefore(page, app.firstChild);
    }

    page.classList.add('page--active');

    // Load existing profile data to pre-fill
    loadExistingProfile();
}

/**
 * Load existing profile data to pre-fill onboarding fields.
 *
 * @returns {Promise<void>}
 */
async function loadExistingProfile() {
    try {
        const profile = await apiGet('/api/user/profile');

        onboardingState.data.displayName = profile.display_name || '';
        onboardingState.data.username = profile.username || '';
        onboardingState.data.bio = profile.bio || '';
        onboardingState.data.interests = profile.interests || '';
        onboardingState.data.favoriteGenres = profile.favorite_genres || '';
        onboardingState.data.avatarUrl = profile.avatar_url || '';
        onboardingState.data.privacyLevel = profile.privacy_level || 'friends_only';
        onboardingState.currentStep = profile.onboarding_step || 1;

        renderStep(onboardingState.currentStep);
    } catch (_e) {
        renderStep(1);
    }
}

/**
 * Render a specific onboarding step.
 *
 * @param {number} step - The step number (1-4).
 * @returns {void}
 */
function renderStep(step) {
    onboardingState.currentStep = step;

    const page = document.getElementById('page-onboarding');

    if (page === null) {
        return;
    }

    const stepTitles = {
        1: { title: 'Welcome to Resona!', subtitle: 'Let\'s set up your profile.' },
        2: { title: 'About You', subtitle: 'Tell us a bit about your music taste.' },
        3: { title: 'Privacy & Avatar', subtitle: 'Control your visibility and set your picture.' },
        4: { title: 'You\'re All Set!', subtitle: 'Here\'s a quick summary of your profile.' },
    };

    const current = stepTitles[step] || stepTitles[1];

    // Progress dots
    let progressHtml = '<div class="onboarding__progress">';
    for (let i = 1; i <= onboardingState.totalSteps; i++) {
        const dotClass = i === step ? 'onboarding__step-dot onboarding__step-dot--active'
            : i < step ? 'onboarding__step-dot onboarding__step-dot--completed'
            : 'onboarding__step-dot';
        progressHtml += '<span class="' + dotClass + '"></span>';
    }
    progressHtml += '</div>';

    let stepContent = '';

    switch (step) {
        case 1:
            stepContent = renderStep1();
            break;
        case 2:
            stepContent = renderStep2();
            break;
        case 3:
            stepContent = renderStep3();
            break;
        case 4:
            stepContent = renderStep4();
            break;
    }

    page.innerHTML = '' +
        '<div class="onboarding">' +
        progressHtml +
        '<h1 class="onboarding__title">' + current.title + '</h1>' +
        '<p class="onboarding__subtitle">' + current.subtitle + '</p>' +
        stepContent +
        '</div>';

    // Initialize icons
    if (typeof initIcons === 'function') {
        initIcons();
    }
}

/**
 * Render step 1: Identity (display name + username).
 *
 * @returns {string} HTML content.
 */
function renderStep1() {
    return '' +
        '<div class="form-group">' +
        '    <label class="form-group__label" for="onboarding-display-name">Display Name</label>' +
        '    <input class="form-group__input" type="text" id="onboarding-display-name" value="' + escapeHtml(onboardingState.data.displayName) + '" maxlength="100" placeholder="Your name" />' +
        '</div>' +
        '<div class="form-group">' +
        '    <label class="form-group__label" for="onboarding-username">Username</label>' +
        '    <div class="username-check">' +
        '        <input class="form-group__input" type="text" id="onboarding-username" value="' + escapeHtml(onboardingState.data.username) + '" maxlength="20" pattern="[a-z0-9_]+" placeholder="your_username" style="flex: 1;" />' +
        '        <span class="username-check__indicator" id="username-check-indicator"></span>' +
        '    </div>' +
        '    <span class="form-group__hint">3-20 characters, lowercase letters, numbers, and underscores</span>' +
        '</div>' +
        '<div class="onboarding__actions">' +
        '    <div id="onboarding-next-1"></div>' +
        '</div>';
}

/**
 * Render step 2: About you (bio, interests, genres).
 *
 * @returns {string} HTML content.
 */
function renderStep2() {
    return '' +
        '<div class="form-group">' +
        '    <label class="form-group__label" for="onboarding-bio">Bio</label>' +
        '    <textarea class="form-group__input form-group__input--textarea" id="onboarding-bio" maxlength="200" placeholder="Tell people about yourself...">' + escapeHtml(onboardingState.data.bio) + '</textarea>' +
        '    <span class="character-counter" id="onboarding-bio-counter">' + onboardingState.data.bio.length + '/200</span>' +
        '</div>' +
        '<div class="form-group">' +
        '    <label class="form-group__label" for="onboarding-interests">Interests</label>' +
        '    <input class="form-group__input" type="text" id="onboarding-interests" value="' + escapeHtml(onboardingState.data.interests) + '" placeholder="e.g. indie, vinyl collecting, concert photography" maxlength="500" />' +
        '</div>' +
        '<div class="form-group">' +
        '    <label class="form-group__label" for="onboarding-genres">Favorite Genres</label>' +
        '    <input class="form-group__input" type="text" id="onboarding-genres" value="' + escapeHtml(onboardingState.data.favoriteGenres) + '" placeholder="e.g. Indie Rock, Jazz, Hip Hop" maxlength="300" />' +
        '</div>' +
        '<div class="onboarding__actions">' +
        '    <div id="onboarding-back-2"></div>' +
        '    <div id="onboarding-next-2"></div>' +
        '</div>';
}

/**
 * Render step 3: Privacy & Avatar.
 *
 * @returns {string} HTML content.
 */
function renderStep3() {
    const privacy = onboardingState.data.privacyLevel || 'friends_only';

    return '' +
        '<div class="form-group">' +
        '    <label class="form-group__label" for="onboarding-avatar">Avatar URL</label>' +
        '    <input class="form-group__input" type="url" id="onboarding-avatar" value="' + escapeHtml(onboardingState.data.avatarUrl) + '" placeholder="https://..." maxlength="500" />' +
        '</div>' +
        '<div class="form-group">' +
        '    <label class="form-group__label">Privacy</label>' +
        '    <div class="privacy-selector">' +
        '        <label class="privacy-option ' + (privacy === 'public' ? 'privacy-option--selected' : '') + '">' +
        '            <input type="radio" name="onboarding-privacy" value="public" ' + (privacy === 'public' ? 'checked' : '') + ' />' +
        '            <div><strong>Public</strong><br /><span style="font-size: var(--rs-font-size-sm); color: var(--rs-text-dim);">Anyone can see your activity</span></div>' +
        '        </label>' +
        '        <label class="privacy-option ' + (privacy === 'friends_only' ? 'privacy-option--selected' : '') + '">' +
        '            <input type="radio" name="onboarding-privacy" value="friends_only" ' + (privacy === 'friends_only' ? 'checked' : '') + ' />' +
        '            <div><strong>Friends Only</strong><br /><span style="font-size: var(--rs-font-size-sm); color: var(--rs-text-dim);">Only friends can see your activity</span></div>' +
        '        </label>' +
        '        <label class="privacy-option ' + (privacy === 'private' ? 'privacy-option--selected' : '') + '">' +
        '            <input type="radio" name="onboarding-privacy" value="private" ' + (privacy === 'private' ? 'checked' : '') + ' />' +
        '            <div><strong>Private</strong><br /><span style="font-size: var(--rs-font-size-sm); color: var(--rs-text-dim);">Only you can see your activity</span></div>' +
        '        </label>' +
        '    </div>' +
        '</div>' +
        '<div class="onboarding__actions">' +
        '    <div id="onboarding-back-3"></div>' +
        '    <div id="onboarding-next-3"></div>' +
        '</div>';
}

/**
 * Render step 4: Summary & completion.
 *
 * @returns {string} HTML content.
 */
function renderStep4() {
    const interestsTags = (onboardingState.data.interests || '')
        .split(',')
        .filter(function (t) { return t.trim() !== ''; })
        .map(function (t) { return '<span class="tag">#' + escapeHtml(t.trim()) + '</span>'; })
        .join('');

    const genreTags = (onboardingState.data.favoriteGenres || '')
        .split(',')
        .filter(function (t) { return t.trim() !== ''; })
        .map(function (t) { return '<span class="tag tag--genre">' + escapeHtml(t.trim()) + '</span>'; })
        .join('');

    const privacyLabel = {
        'public': '🌍 Public',
        'friends_only': '👥 Friends Only',
        'private': '🔒 Private',
    };

    return '' +
        '<div style="text-align: center;">' +
        '    <div style="font-size: 64px; margin-bottom: var(--rs-space-4);">🎉</div>' +
        '    <p style="margin-bottom: var(--rs-space-6); color: var(--rs-text-muted);">Your profile is ready!</p>' +
        '</div>' +
        '<div style="background: var(--rs-surface); border-radius: var(--rs-radius-lg); padding: var(--rs-space-4); margin-bottom: var(--rs-space-4);">' +
        '    <p><strong>' + escapeHtml(onboardingState.data.displayName || 'Your Name') + '</strong> <span style="color: var(--rs-text-muted);">@' + escapeHtml(onboardingState.data.username) + '</span></p>' +
        (onboardingState.data.bio ? '<p style="color: var(--rs-text-muted); font-size: var(--rs-font-size-sm); margin-top: var(--rs-space-2);">' + escapeHtml(onboardingState.data.bio) + '</p>' : '') +
        (interestsTags ? '<div class="tags-section" style="margin-top: var(--rs-space-2);">' + interestsTags + '</div>' : '') +
        (genreTags ? '<div class="tags-section">' + genreTags + '</div>' : '') +
        '    <p style="margin-top: var(--rs-space-2); font-size: var(--rs-font-size-sm); color: var(--rs-text-dim);">' + (privacyLabel[onboardingState.data.privacyLevel] || '👥 Friends Only') + '</p>' +
        '</div>' +
        '<div class="onboarding__actions">' +
        '    <div id="onboarding-back-4"></div>' +
        '    <div id="onboarding-next-4"></div>' +
        '</div>';
}

/**
 * Save current step data and navigate to next step.
 *
 * @param {number} step - The step to save.
 * @returns {Promise<void>}
 */
async function saveAndGoNext(step) {
    // Collect data from current step
    collectStepData(step);

    // Validate step 1
    if (step === 1) {
        if (!onboardingState.data.displayName || onboardingState.data.displayName.trim() === '') {
            showToast({ message: 'Display name is required', type: 'error' });
            return;
        }
        if (!onboardingState.data.username || onboardingState.data.username.trim() === '') {
            showToast({ message: 'Username is required', type: 'error' });
            return;
        }
        // Validate username format
        const usernameRegex = /^[a-z0-9_]+$/;
        if (!usernameRegex.test(onboardingState.data.username)) {
            showToast({ message: 'Username can only contain lowercase letters, numbers, and underscores', type: 'error' });
            return;
        }
        if (onboardingState.data.username.length < 3 || onboardingState.data.username.length > 20) {
            showToast({ message: 'Username must be between 3 and 20 characters', type: 'error' });
            return;
        }
    }

    try {
        await apiPost('/api/user/onboarding/step', {
            step: step,
            data: getStepDataPayload(step),
        });

        if (step < onboardingState.totalSteps) {
            renderStep(step + 1);
        }
    } catch (error) {
        showToast({
            message: error.message || 'Failed to save. Please try again.',
            type: 'error',
        });
    }
}

/**
 * Mark onboarding as complete and redirect to feed.
 *
 * @returns {Promise<void>}
 */
async function completeOnboarding() {
    try {
        await apiPost('/api/user/onboarding/step', {
            step: 4,
            data: {},
        });

        showToast({
            message: 'Welcome to Resona!',
            type: 'success',
            duration: 3000,
        });

        navigateTo('/feed');
    } catch (error) {
        showToast({
            message: error.message || 'Failed to complete setup',
            type: 'error',
        });
    }
}

/**
 * Collect form data from the current step into state.
 *
 * @param {number} step - Current step number.
 * @returns {void}
 */
function collectStepData(step) {
    switch (step) {
        case 1:
            const dn = document.getElementById('onboarding-display-name');
            const un = document.getElementById('onboarding-username');
            if (dn !== null) onboardingState.data.displayName = dn.value.trim();
            if (un !== null) onboardingState.data.username = un.value.trim();
            break;
        case 2:
            const bio = document.getElementById('onboarding-bio');
            const interests = document.getElementById('onboarding-interests');
            const genres = document.getElementById('onboarding-genres');
            if (bio !== null) onboardingState.data.bio = bio.value.trim();
            if (interests !== null) onboardingState.data.interests = interests.value.trim();
            if (genres !== null) onboardingState.data.favoriteGenres = genres.value.trim();
            break;
        case 3:
            const avatar = document.getElementById('onboarding-avatar');
            const privacy = document.querySelector('input[name="onboarding-privacy"]:checked');
            if (avatar !== null) onboardingState.data.avatarUrl = avatar.value.trim();
            if (privacy !== null) onboardingState.data.privacyLevel = privacy.value;
            break;
    }
}

/**
 * Get the data payload for the current step's API call.
 *
 * @param {number} step - Current step number.
 * @returns {object} The data payload.
 */
function getStepDataPayload(step) {
    switch (step) {
        case 1:
            return {
                displayName: onboardingState.data.displayName,
                username: onboardingState.data.username,
            };
        case 2:
            return {
                bio: onboardingState.data.bio,
                interests: onboardingState.data.interests,
                favoriteGenres: onboardingState.data.favoriteGenres,
            };
        case 3:
            return {
                avatarUrl: onboardingState.data.avatarUrl,
                privacyLevel: onboardingState.data.privacyLevel,
            };
        default:
            return {};
    }
}

// Set up event delegation for onboarding actions (called after render)
document.addEventListener('click', function (event) {
    // Next buttons
    if (event.target.closest('#onboarding-next-1')) {
        const usernameInput = document.getElementById('onboarding-username');
        if (usernameInput !== null) {
            onboardingState.data.username = usernameInput.value.trim();
        }
        saveAndGoNext(1);
    }

    if (event.target.closest('#onboarding-next-2')) {
        collectStepData(2);
        saveAndGoNext(2);
    }

    if (event.target.closest('#onboarding-next-3')) {
        collectStepData(3);
        saveAndGoNext(3);
    }

    if (event.target.closest('#onboarding-next-4')) {
        completeOnboarding();
    }

    // Back buttons
    if (event.target.closest('#onboarding-back-2')) {
        collectStepData(2);
        renderStep(1);
    }

    if (event.target.closest('#onboarding-back-3')) {
        collectStepData(3);
        renderStep(2);
    }

    if (event.target.closest('#onboarding-back-4')) {
        renderStep(3);
    }

    // Username check on input
    const usernameInput = event.target.closest('#onboarding-username');
    if (usernameInput !== null) {
        debouncedCheckUsername(usernameInput);
    }

    // Bio counter
    const bioInput = event.target.closest('#onboarding-bio');
    if (bioInput !== null) {
        const counter = document.getElementById('onboarding-bio-counter');
        if (counter !== null) {
            counter.textContent = bioInput.value.length + '/200';
        }
    }

    // Privacy selector styling
    const privacyRadio = event.target.closest('input[name="onboarding-privacy"]');
    if (privacyRadio !== null) {
        document.querySelectorAll('input[name="onboarding-privacy"]').forEach(function (r) {
            r.closest('.privacy-option').classList.remove('privacy-option--selected');
        });
        privacyRadio.closest('.privacy-option').classList.add('privacy-option--selected');
    }
});

// Debounced username availability check
let usernameCheckTimeout = null;

function debouncedCheckUsername(input) {
    if (usernameCheckTimeout !== null) {
        clearTimeout(usernameCheckTimeout);
    }

    usernameCheckTimeout = setTimeout(async function () {
        const username = input.value.trim();
        const indicator = document.getElementById('username-check-indicator');

        if (indicator === null) {
            return;
        }

        if (username.length < 3) {
            indicator.textContent = '';
            indicator.className = 'username-check__indicator';
            return;
        }

        try {
            const result = await apiGet('/api/user/check-username?username=' + encodeURIComponent(username));

            if (result.available) {
                indicator.textContent = '✓';
                indicator.className = 'username-check__indicator username-check__indicator--valid';
            } else {
                indicator.textContent = '✗';
                indicator.className = 'username-check__indicator username-check__indicator--invalid';
            }
        } catch (_e) {
            indicator.textContent = '';
            indicator.className = 'username-check__indicator';
        }
    }, 300);
}

// Render the next/back buttons after the HTML is in the DOM
// These are re-invoked after each renderStep call
function renderActionButtons() {
    // Step 1: next only
    const next1 = document.getElementById('onboarding-next-1');
    if (next1 !== null) {
        next1.innerHTML = '';
        next1.appendChild(createButton({
            label: 'Next',
            variant: 'primary',
            isFullWidth: true,
            onClick: function () {
                const usernameInput = document.getElementById('onboarding-username');
                if (usernameInput !== null) {
                    onboardingState.data.username = usernameInput.value.trim();
                }
                saveAndGoNext(1);
            },
        }));
    }

    // Step 2: back + next
    const back2 = document.getElementById('onboarding-back-2');
    if (back2 !== null) {
        back2.innerHTML = '';
        back2.appendChild(createButton({
            label: 'Back',
            variant: 'secondary',
            onClick: function () {
                collectStepData(2);
                renderStep(1);
            },
        }));
    }

    const next2 = document.getElementById('onboarding-next-2');
    if (next2 !== null) {
        next2.innerHTML = '';
        next2.appendChild(createButton({
            label: 'Next',
            variant: 'primary',
            onClick: function () {
                collectStepData(2);
                saveAndGoNext(2);
            },
        }));
    }

    // Step 3: back + next
    const back3 = document.getElementById('onboarding-back-3');
    if (back3 !== null) {
        back3.innerHTML = '';
        back3.appendChild(createButton({
            label: 'Back',
            variant: 'secondary',
            onClick: function () {
                collectStepData(3);
                renderStep(2);
            },
        }));
    }

    const next3 = document.getElementById('onboarding-next-3');
    if (next3 !== null) {
        next3.innerHTML = '';
        next3.appendChild(createButton({
            label: 'Next',
            variant: 'primary',
            onClick: function () {
                collectStepData(3);
                saveAndGoNext(3);
            },
        }));
    }

    // Step 4: back + start
    const back4 = document.getElementById('onboarding-back-4');
    if (back4 !== null) {
        back4.innerHTML = '';
        back4.appendChild(createButton({
            label: 'Back',
            variant: 'secondary',
            onClick: function () {
                renderStep(3);
            },
        }));
    }

    const next4 = document.getElementById('onboarding-next-4');
    if (next4 !== null) {
        next4.innerHTML = '';
        next4.appendChild(createButton({
            label: 'Start Exploring',
            variant: 'primary',
            onClick: function () {
                completeOnboarding();
            },
        }));
    }
}

// Override the default renderStep to also render action buttons
const originalRenderStep = renderStep;
renderStep = function (step) {
    originalRenderStep(step);
    // Render action buttons after content is in DOM
    setTimeout(renderActionButtons, 0);
};

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
