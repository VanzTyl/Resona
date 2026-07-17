/**
 * Resona Onboarding Page Controller
 * 4-step guided onboarding flow. v2.1: static HTML containers with dynamic step content.
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

/** Render the onboarding page. */
function renderOnboardingPage() {
    var existingPage = document.querySelector('.page--active');

    if (existingPage !== null) {
        existingPage.classList.remove('page--active');
    }

    var page = document.getElementById('page-onboarding');

    if (page === null) {
        page = createOnboardingPageStructure();
        var app = document.getElementById('app');

        if (app === null) {
            return;
        }

        app.insertBefore(page, app.firstChild);
    }

    page.classList.add('page--active');

    // TREQ-001: Trigger glitch overlay on heading
    triggerGlitchOnHeading(page);

    loadExistingProfile();
}

/**
 * TREQ-001: Apply glitch overlay animation to the onboarding heading.
 * Plays once on initial mount and resolves after 1.5 seconds.
 *
 * @param {HTMLElement} page - The onboarding page element.
 */
function triggerGlitchOnHeading(page) {
    var titleEl = page.querySelector('#onboarding-title');
    if (titleEl !== null && !titleEl.hasAttribute('data-glitch-played')) {
        titleEl.setAttribute('data-glitch-played', 'true');
        titleEl.setAttribute('data-text', titleEl.textContent);
        titleEl.classList.add('glitch-overlay');
        setTimeout(function () {
            titleEl.classList.remove('glitch-overlay');
            titleEl.removeAttribute('data-text');
        }, 1500);
    }
}

/** Create onboarding page DOM structure. @returns {HTMLElement} */
function createOnboardingPageStructure() {
    var page = document.createElement('div');
    page.id = 'page-onboarding';
    page.className = 'page page--centered';

    var container = document.createElement('div');
    container.className = 'onboarding';
    container.id = 'onboarding-content';

    // Progress dots.
    var progress = document.createElement('div');
    progress.className = 'onboarding__progress';
    progress.id = 'onboarding-progress';
    container.appendChild(progress);

    // Title.
    var title = document.createElement('h1');
    title.className = 'onboarding__title';
    title.id = 'onboarding-title';
    title.textContent = 'Welcome to Resona!';
    container.appendChild(title);

    // Subtitle.
    var subtitle = document.createElement('p');
    subtitle.className = 'onboarding__subtitle';
    subtitle.id = 'onboarding-subtitle';
    subtitle.textContent = "Let's set up your profile.";
    container.appendChild(subtitle);

    // Step content area.
    var stepContent = document.createElement('div');
    stepContent.id = 'onboarding-step-content';
    container.appendChild(stepContent);

    // Action buttons.
    var actions = document.createElement('div');
    actions.className = 'onboarding__actions';
    actions.id = 'onboarding-actions';

    var backBtn = document.createElement('div');
    backBtn.id = 'onboarding-back-btn';
    actions.appendChild(backBtn);

    var nextBtn = document.createElement('div');
    nextBtn.id = 'onboarding-next-btn';
    actions.appendChild(nextBtn);

    container.appendChild(actions);
    page.appendChild(container);

    return page;
}

/** Load existing profile data to pre-fill onboarding. */
async function loadExistingProfile() {
    try {
        var profile = await apiGet('/api/user/profile');

        onboardingState.data.displayName = profile.displayName || '';
        onboardingState.data.username = profile.username || '';
        onboardingState.data.bio = profile.bio || '';
        onboardingState.data.interests = profile.interests || '';
        onboardingState.data.favoriteGenres = profile.favoriteGenres || '';
        onboardingState.data.avatarUrl = profile.avatarUrl || '';
        onboardingState.data.privacyLevel = profile.privacyLevel || 'friends_only';
        onboardingState.currentStep = profile.onboardingStep || 1;

        renderStep(onboardingState.currentStep);
    } catch (_e) {
        renderStep(1);
    }
}

/** Render a specific onboarding step. @param {number} step 1-4. */
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

/* renderStep1Html, renderStep2Html, renderStep3Html, renderStep4Html, escapeHtml
   are now in onboarding-helpers.js -- loaded via script tag in onboarding.html. */

/** Render the Next/Back action buttons. */
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

/** Set up event listeners for the current step. @param {number} step. */
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

/** Save step data and navigate forward. @param {number} step. */
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

/** Mark onboarding complete and redirect to feed. */
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

/** Collect form data from the current step into state. @param {number} step. */
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

/** Get API payload for current step. @param {number} step @returns {object} */
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

var usernameCheckTimeout = null;

/** Check username availability with debouncing. @param {HTMLElement} input */
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


