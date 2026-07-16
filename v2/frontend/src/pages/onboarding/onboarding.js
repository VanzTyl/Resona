/**
 * Resona Onboarding Page Controller
 *
 * 4-step guided onboarding flow for first-time users.
 * v2.1: Uses static HTML containers — renders steps within static containers.
 *
 * @version 2.1.0
 */

var onboardingState = {
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
 * Queries existing static HTML container; no markup construction.
 *
 * @returns {void}
 */
function renderOnboardingPage() {
    var existingPage = document.querySelector('.page--active');

    if (existingPage !== null) {
        existingPage.classList.remove('page--active');
    }

    var page = document.getElementById('page-onboarding');

    if (page === null) {
        return;
    }

    page.classList.add('page--active');

    loadExistingProfile();
}

/**
 * Load existing profile data to pre-fill onboarding fields.
 *
 * @returns {Promise<void>}
 */
async function loadExistingProfile() {
    try {
        var profile = await apiGet('/api/user/profile');

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
 * Render a specific onboarding step within static containers.
 *
 * @param {number} step - The step number (1-4).
 * @returns {void}
 */
function renderStep(step) {
    onboardingState.currentStep = step;

    var stepTitles = {
        1: { title: 'Welcome to Resona!', subtitle: "Let's set up your profile." },
        2: { title: 'About You', subtitle: "Tell us a bit about your music taste." },
        3: { title: 'Privacy & Avatar', subtitle: 'Control your visibility and set your picture.' },
        4: { title: "You're All Set!", subtitle: "Here's a quick summary of your profile." },
    };

    var current = stepTitles[step] || stepTitles[1];

    // Update progress dots.
    var progressContainer = document.getElementById('onboarding-progress');
    if (progressContainer !== null) {
        while (progressContainer.firstChild !== null) {
            progressContainer.removeChild(progressContainer.firstChild);
        }

        for (var i = 1; i <= onboardingState.totalSteps; i++) {
            var dot = document.createElement('span');
            dot.className = 'onboarding__step-dot';
            if (i === step) {
                dot.classList.add('onboarding__step-dot--active');
            } else if (i < step) {
                dot.classList.add('onboarding__step-dot--completed');
            }
            progressContainer.appendChild(dot);
        }
    }

    // Update title and subtitle.
    var titleEl = document.getElementById('onboarding-title');
    if (titleEl !== null) {
        titleEl.textContent = current.title;
    }

    var subtitleEl = document.getElementById('onboarding-subtitle');
    if (subtitleEl !== null) {
        subtitleEl.textContent = current.subtitle;
    }

    // Render step content.
    var stepContent = document.getElementById('onboarding-step-content');
    if (stepContent !== null) {
        while (stepContent.firstChild !== null) {
            stepContent.removeChild(stepContent.firstChild);
        }

        var contentHtml = '';
        switch (step) {
            case 1:
                contentHtml = renderStep1Html();
                break;
            case 2:
                contentHtml = renderStep2Html();
                break;
            case 3:
                contentHtml = renderStep3Html();
                break;
            case 4:
                contentHtml = renderStep4Html();
                break;
        }

        stepContent.innerHTML = contentHtml;
    }

    // Render action buttons.
    renderActionButtons();

    // Set up event listeners for the current step.
    setupStepEventListeners(step);

    if (typeof initIcons === 'function') {
        initIcons();
    }
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
 * Render step 4 HTML string.
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

/**
 * Render the Next/Back action buttons.
 *
 * @returns {void}
 */
function renderActionButtons() {
    var backContainer = document.getElementById('onboarding-back-btn');
    var nextContainer = document.getElementById('onboarding-next-btn');

    if (backContainer !== null) {
        while (backContainer.firstChild !== null) {
            backContainer.removeChild(backContainer.firstChild);
        }
    }

    if (nextContainer !== null) {
        while (nextContainer.firstChild !== null) {
            nextContainer.removeChild(nextContainer.firstChild);
        }
    }

    // Back button (not on step 1).
    if (onboardingState.currentStep > 1) {
        if (backContainer !== null) {
            backContainer.appendChild(createButton({
                label: 'Back',
                variant: 'secondary',
                onClick: function () {
                    collectStepData(onboardingState.currentStep);
                    renderStep(onboardingState.currentStep - 1);
                },
            }));
        }
    }

    // Next / Complete button.
    if (nextContainer !== null) {
        var isLastStep = onboardingState.currentStep === onboardingState.totalSteps;

        nextContainer.appendChild(createButton({
            label: isLastStep ? 'Start Exploring' : 'Next',
            variant: 'primary',
            isFullWidth: !isLastStep,
            onClick: function () {
                if (isLastStep) {
                    completeOnboarding();
                } else {
                    collectStepData(onboardingState.currentStep);
                    saveAndGoNext(onboardingState.currentStep);
                }
            },
        }));
    }
}

/**
 * Set up event listeners for the current step.
 *
 * @param {number} step - The current step number.
 * @returns {void}
 */
function setupStepEventListeners(step) {
    // Bio counter for step 2.
    if (step === 2) {
        var bioInput = document.getElementById('onboarding-bio');
        var bioCounter = document.getElementById('onboarding-bio-counter');

        if (bioInput !== null && bioCounter !== null) {
            bioInput.addEventListener('input', function () {
                bioCounter.textContent = bioInput.value.length + '/200';
            });
        }
    }

    // Username auto-lowercase + availability check (step 1).
    if (step === 1) {
        var usernameInput = document.getElementById('onboarding-username');
        if (usernameInput !== null) {
            usernameInput.addEventListener('input', function () {
                var cursorPos = usernameInput.selectionStart;
                usernameInput.value = usernameInput.value.toLowerCase();
                usernameInput.setSelectionRange(cursorPos, cursorPos);
                debouncedCheckUsername(usernameInput);
            });
        }
    }

    // Privacy selector styling (step 3).
    if (step === 3) {
        var privacyRadios = document.querySelectorAll('input[name="onboarding-privacy"]');
        privacyRadios.forEach(function (radio) {
            radio.addEventListener('change', function () {
                privacyRadios.forEach(function (r) {
                    var label = r.closest('.privacy-option');
                    if (label !== null) {
                        label.classList.remove('privacy-option--selected');
                    }
                });
                var label = radio.closest('.privacy-option');
                if (label !== null) {
                    label.classList.add('privacy-option--selected');
                }
            });
        });
    }
}

/**
 * Save current step data and navigate to next step.
 *
 * @param {number} step - The step to save.
 * @returns {Promise<void>}
 */
async function saveAndGoNext(step) {
    // Validate step 1.
    if (step === 1) {
        if (!onboardingState.data.displayName || onboardingState.data.displayName.trim() === '') {
            showToast({ message: 'Display name is required', type: 'error' });
            return;
        }
        if (!onboardingState.data.username || onboardingState.data.username.trim() === '') {
            showToast({ message: 'Username is required', type: 'error' });
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
            var dn = document.getElementById('onboarding-display-name');
            var un = document.getElementById('onboarding-username');
            if (dn !== null) onboardingState.data.displayName = dn.value.trim();
            if (un !== null) onboardingState.data.username = un.value.trim();
            break;
        case 2:
            var bio = document.getElementById('onboarding-bio');
            var interests = document.getElementById('onboarding-interests');
            var genres = document.getElementById('onboarding-genres');
            if (bio !== null) onboardingState.data.bio = bio.value.trim();
            if (interests !== null) onboardingState.data.interests = interests.value.trim();
            if (genres !== null) onboardingState.data.favoriteGenres = genres.value.trim();
            break;
        case 3:
            var avatar = document.getElementById('onboarding-avatar');
            var privacy = document.querySelector('input[name="onboarding-privacy"]:checked');
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

/**
 * Debounced username availability check.
 */
var usernameCheckTimeout = null;

/**
 * Check username availability with debouncing.
 *
 * @param {HTMLElement} input - The username input element.
 * @returns {void}
 */
function debouncedCheckUsername(input) {
    if (usernameCheckTimeout !== null) {
        clearTimeout(usernameCheckTimeout);
    }

    usernameCheckTimeout = setTimeout(async function () {
        var username = input.value.trim();
        var indicator = document.getElementById('username-check-indicator');

        if (indicator === null) {
            return;
        }

        if (username.length < 3) {
            indicator.textContent = '';
            indicator.className = 'username-check__indicator';
            return;
        }

        try {
            var result = await apiGet('/api/user/check-username?username=' + encodeURIComponent(username));

            if (result.available) {
                indicator.textContent = '\u2713';
                indicator.className = 'username-check__indicator username-check__indicator--valid';
            } else {
                indicator.textContent = '\u2717';
                indicator.className = 'username-check__indicator username-check__indicator--invalid';
            }
        } catch (_e) {
            indicator.textContent = '';
            indicator.className = 'username-check__indicator';
        }
    }, 300);
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
