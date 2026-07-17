/**
 * Resona Profile Page Controller
 * v2.1: createElement/appendChild fallback for page structure.
 * @version 2.1.0
 */

/** Render the profile page. */
function renderProfilePage() {
    const existingPage = document.querySelector('.page--active');

    if (existingPage !== null) {
        existingPage.classList.remove('page--active');
    }

    let page = document.getElementById('page-profile');

    if (page === null) {
        page = createProfilePageStructure();
        const app = document.getElementById('app');

        if (app === null) {
            return;
        }

        app.insertBefore(page, app.firstChild);

        // Set up container references (must happen after DOM insertion).
        setupProfileContainers();
    }

    page.classList.add('page--active');

    loadProfile();
}

/** Create the profile page DOM structure. @returns {HTMLElement} */
function createProfilePageStructure() {
    var page = createEl('div', { id: 'page-profile', className: 'page' });
    var header = createEl('header', { className: 'page__header' });
    header.appendChild(createEl('h1', { className: 'page__title', text: 'Profile' }));
    page.appendChild(header);

    var main = createEl('main', { className: 'page__content', id: 'profile-content' });
    var sectionIds = [
        'profile-header', 'profile-stats-row', 'profile-interests-tags',
        'profile-genre-tags', 'profile-about-section', 'profile-top-artists',
    ];

    sectionIds.forEach(function (id) {
        main.appendChild(createEl('div', { id: id }));
    });

    // Form.
    var form = createEl('div', { id: 'profile-form', className: 'profile-form' });
    form.appendChild(createEl('h3', {
        className: 'profile-section__title',
        text: 'Edit Profile',
    }));

    // Text input fields.
    var textFields = [
        { id: 'profile-display-name', label: 'Display Name', type: 'text', maxl: '100' },
        { id: 'profile-avatar-url', label: 'Avatar URL', type: 'url', maxl: '500' },
        { id: 'profile-username', label: 'Username', type: 'text', maxl: '20',
            hint: '3-20 characters. Will be lowercased. Can be changed once every 30 days.' },
    ];
    textFields.forEach(function (f) {
        form.appendChild(createFormField(f));
    });

    // Bio textarea.
    form.appendChild(createTextareaField('profile-bio', 'Bio', '200', 'bio-counter', '0/200'));

    // Interests.
    form.appendChild(createTextField('profile-interests', 'Interests',
        'e.g. indie, vinyl collecting, concert photography', '500'));

    // Favorite Genres.
    form.appendChild(createTextField('profile-favorite-genres', 'Favorite Genres',
        'e.g. Indie Rock, Jazz, Hip Hop', '300'));

    // About Me textarea.
    form.appendChild(createTextareaField('profile-about-me', 'About Me', '500'));

    // Privacy.
    form.appendChild(createPrivacySelector());

    // Spotify status.
    var spotifyGroup = createEl('div', { className: 'form-group' });
    spotifyGroup.appendChild(createEl('label', {
        className: 'form-group__label',
        text: 'Spotify Connected',
    }));
    var spotifyStatus = createEl('p', {
        id: 'profile-spotify-status',
        text: 'Checking...',
    });
    spotifyStatus.style.padding = '8px 0';
    spotifyStatus.style.color = 'var(--rs-text-dim)';
    spotifyGroup.appendChild(spotifyStatus);
    form.appendChild(spotifyGroup);

    form.appendChild(createEl('div', { id: 'profile-save-container' }));
    var logoutContainer = createEl('div', { id: 'profile-logout-container' });
    logoutContainer.style.marginTop = 'var(--rs-space-2)';
    form.appendChild(logoutContainer);

    main.appendChild(form);
    page.appendChild(main);

    return page;
}

/**
 * Apply CSS classes after page is inserted into the DOM.
 * Called from renderProfilePage() after app.insertBefore().
 * @returns {void}
 */
function setupProfileContainers() {
    var el = document.getElementById('profile-top-artists');
    if (el !== null) {
        el.className = 'profile-section';
    }

    var statsRow = document.getElementById('profile-stats-row');
    if (statsRow !== null) {
        statsRow.className = 'stats-row';
    }
}

/* Helper functions (createEl, createFormField, createTextField, etc.)
   are now in profile-helpers.js -- loaded via script tag in profile.html. */

/** Load profile and populate form fields. */
async function loadProfile() {
    try {
        const profile = await apiGet('/api/user/profile');

        // Load stats and top artists in parallel.
        let stats = null;
        let topArtists = null;

        try {
            stats = await apiGet('/api/user/stats');
        } catch (_e) {
            // Non-critical.
        }

        try {
            topArtists = await apiGet('/api/dashboard/top-artists?period=all&limit=5');
        } catch (_e) {
            // Non-critical.
        }

        // Populate profile header — Facebook/Instagram layout.
        var profileHeader = document.getElementById('profile-header');
        if (profileHeader !== null) {
            while (profileHeader.firstChild !== null) {
                profileHeader.removeChild(profileHeader.firstChild);
            }

            var cover = document.createElement('div');
            cover.className = 'profile-header__cover';
            profileHeader.appendChild(cover);

            var avatar = document.createElement('img');
            avatar.className = 'profile-header__avatar';
            avatar.src = profile.avatarUrl || 'assets/default-avatar.svg';
            avatar.alt = 'Profile picture';
            profileHeader.appendChild(avatar);

            var info = document.createElement('div');
            info.className = 'profile-header__info';

            var name = document.createElement('h2');
            name.className = 'profile-header__name';
            name.textContent = profile.displayName;
            info.appendChild(name);

            var username = document.createElement('p');
            username.className = 'profile-header__username';
            username.textContent = '@' + profile.username;
            info.appendChild(username);

            if (profile.bio) {
                var bio = document.createElement('p');
                bio.className = 'profile-header__bio';
                bio.textContent = profile.bio;
                info.appendChild(bio);
            }

            profileHeader.appendChild(info);
        }

        // Populate stats row.
        const statsRow = document.getElementById('profile-stats-row');
        if (statsRow !== null && stats !== null) {
            while (statsRow.firstChild !== null) {
                statsRow.removeChild(statsRow.firstChild);
            }

            var statCards = [
                { value: stats.totalTracksPlayed || 0, label: 'Tracks Played' },
                { value: stats.uniqueArtists || 0, label: 'Artists' },
                { value: stats.topGenre || '\u2014', label: 'Top Genre' },
            ];

            statCards.forEach(function (s) {
                var card = document.createElement('div');
                card.className = 'stat-card';

                var val = document.createElement('div');
                val.className = 'stat-card__value';
                val.textContent = s.value;
                card.appendChild(val);

                var lbl = document.createElement('div');
                lbl.className = 'stat-card__label';
                lbl.textContent = s.label;
                card.appendChild(lbl);

                statsRow.appendChild(card);
            });
        }

        // Populate interests tags.
        var interestsContainer = document.getElementById('profile-interests-tags');
        if (interestsContainer !== null) {
            while (interestsContainer.firstChild !== null) {
                interestsContainer.removeChild(interestsContainer.firstChild);
            }

            if (profile.interests) {
                // Add section title
                var interestsTitle = document.createElement('h3');
                interestsTitle.className = 'profile-section__title';
                interestsTitle.textContent = 'Interests';
                interestsContainer.appendChild(interestsTitle);

                profile.interests.split(',').filter(function (t) {
                    return t.trim() !== '';
                }).forEach(function (tag) {
                    var tagEl = document.createElement('span');
                    tagEl.className = 'tag';
                    tagEl.textContent = '#' + tag.trim();
                    interestsContainer.appendChild(tagEl);
                });

                interestsContainer.className = 'tags-card';
            }
        }

        // Populate genre tags.
        var genresContainer = document.getElementById('profile-genre-tags');
        if (genresContainer !== null) {
            while (genresContainer.firstChild !== null) {
                genresContainer.removeChild(genresContainer.firstChild);
            }

            if (profile.favoriteGenres) {
                // Add section title
                var genresTitle = document.createElement('h3');
                genresTitle.className = 'profile-section__title';
                genresTitle.textContent = 'Favorite Genres';
                genresContainer.appendChild(genresTitle);

                profile.favoriteGenres.split(',').filter(function (t) {
                    return t.trim() !== '';
                }).forEach(function (tag) {
                    var tagEl = document.createElement('span');
                    tagEl.className = 'tag tag--genre';
                    tagEl.textContent = tag.trim();
                    genresContainer.appendChild(tagEl);
                });

                genresContainer.className = 'tags-card';
            }
        }

        // Populate about section.
        var aboutSection = document.getElementById('profile-about-section');
        if (aboutSection !== null) {
            while (aboutSection.firstChild !== null) {
                aboutSection.removeChild(aboutSection.firstChild);
            }

            if (profile.aboutMe) {
                var section = document.createElement('div');
                section.className = 'profile-section';

                var aboutDiv = document.createElement('div');
                aboutDiv.className = 'about-section';
                aboutDiv.textContent = profile.aboutMe;
                section.appendChild(aboutDiv);

                aboutSection.appendChild(section);
            }
        }

        // Populate top artists.
        var topArtistsSection = document.getElementById('profile-top-artists');
        if (topArtistsSection !== null) {
            while (topArtistsSection.firstChild !== null) {
                topArtistsSection.removeChild(topArtistsSection.firstChild);
            }

            var sectionTitle = document.createElement('h3');
            sectionTitle.className = 'profile-section__title';
            sectionTitle.textContent = 'My Top Artists';
            topArtistsSection.appendChild(sectionTitle);

            var list = document.createElement('div');
            list.className = 'artist-list';

            if (topArtists !== null && topArtists.length > 0) {
                topArtists.forEach(function (artist, index) {
                    var item = document.createElement('div');
                    item.className = 'artist-item';

                    var rank = document.createElement('div');
                    rank.className = 'artist-item__rank';
                    rank.textContent = (index + 1);
                    item.appendChild(rank);

                    var name = document.createElement('div');
                    name.className = 'artist-item__name';
                    name.textContent = artist.artist_name;
                    item.appendChild(name);

                    var count = document.createElement('div');
                    count.className = 'artist-item__count';
                    count.textContent = artist.play_count + ' plays';
                    item.appendChild(count);

                    list.appendChild(item);
                });
            } else {
                var emptyMsg = document.createElement('p');
                emptyMsg.style.color = 'var(--rs-text-dim)';
                emptyMsg.style.fontSize = 'var(--rs-font-size-sm)';
                emptyMsg.textContent = 'No artist data yet. Keep listening!';
                list.appendChild(emptyMsg);
            }

            topArtistsSection.appendChild(list);
        }

        // Populate form fields.
        var displayNameInput = document.getElementById('profile-display-name');
        if (displayNameInput !== null) {
            displayNameInput.value = profile.displayName || '';
        }

        var avatarUrlInput = document.getElementById('profile-avatar-url');
        if (avatarUrlInput !== null) {
            avatarUrlInput.value = profile.avatarUrl || '';
        }

        var usernameInput = document.getElementById('profile-username');
        if (usernameInput !== null) {
            usernameInput.value = profile.username || '';
            usernameInput.setAttribute('data-original', profile.username || '');
        }

        var bioInput = document.getElementById('profile-bio');
        if (bioInput !== null) {
            bioInput.value = profile.bio || '';
        }

        var bioCounter = document.getElementById('bio-counter');
        if (bioCounter !== null) {
            bioCounter.textContent = (profile.bio ? profile.bio.length : 0) + '/200';
        }

        var interestsInput = document.getElementById('profile-interests');
        if (interestsInput !== null) {
            interestsInput.value = profile.interests || '';
        }

        var genresInput = document.getElementById('profile-favorite-genres');
        if (genresInput !== null) {
            genresInput.value = profile.favoriteGenres || '';
        }

        var aboutMeInput = document.getElementById('profile-about-me');
        if (aboutMeInput !== null) {
            aboutMeInput.value = profile.aboutMe || '';
        }

        // Set privacy level.
        var privacyLevel = profile.privacyLevel || 'friends_only';
        var privacyRadios = document.querySelectorAll('input[name="privacy"]');
        privacyRadios.forEach(function (radio) {
            radio.checked = radio.value === privacyLevel;
            var label = radio.closest('.privacy-option');
            if (label !== null) {
                if (radio.value === privacyLevel) {
                    label.classList.add('privacy-option--selected');
                } else {
                    label.classList.remove('privacy-option--selected');
    }
}

        });

        // Spotify status.
        var spotifyStatus = document.getElementById('profile-spotify-status');
        if (spotifyStatus !== null) {
            spotifyStatus.innerHTML = '';
            var statusIcon = document.createElement('span');
            statusIcon.setAttribute('data-lucide', profile.spotifyConnected ? 'check-circle' : 'x-circle');
            statusIcon.className = 'rs-icon';
            spotifyStatus.appendChild(statusIcon);
            var statusText = document.createTextNode(
                profile.spotifyConnected ? ' Connected' : ' Not connected'
            );
            spotifyStatus.appendChild(statusText);
            spotifyStatus.style.color = profile.spotifyConnected
                ? 'var(--rs-success)' : 'var(--rs-text-dim)';
        }

        // Set up event listeners (only once).
        setupProfileEventListeners();

        // Append save button.
        var saveContainer = document.getElementById('profile-save-container');
        if (saveContainer !== null) {
            while (saveContainer.firstChild !== null) {
                saveContainer.removeChild(saveContainer.firstChild);
            }

            saveContainer.appendChild(createButton({
                label: 'Save Changes',
                variant: 'primary',
                isFullWidth: true,
                onClick: function () {
                    saveProfile();
                },
            }));
        }

        // Append logout button.
        var logoutContainer = document.getElementById('profile-logout-container');
        if (logoutContainer !== null) {
            while (logoutContainer.firstChild !== null) {
                logoutContainer.removeChild(logoutContainer.firstChild);
            }

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

        // v3.1: Edit Profile button — shows/hides the form
        setupEditProfileButton();

        // TREQ-005: Ensure form is hidden after profile load
        hideEditForm();

        if (typeof initIcons === 'function') {
            initIcons();
        }
    } catch (error) {
        var content = document.getElementById('profile-content');
        if (content !== null) {
            while (content.firstChild !== null) {
                content.removeChild(content.firstChild);
            }

            var errorMsg = document.createElement('p');
            errorMsg.style.color = 'var(--rs-error)';
            errorMsg.textContent = 'Failed to load profile: ' + error.message;
            content.appendChild(errorMsg);
        }
    }
}

/** Set up form listeners (once only). */
function setupProfileEventListeners() {
    var bioInput = document.getElementById('profile-bio');
    var bioCounter = document.getElementById('bio-counter');

    if (bioInput !== null && bioCounter !== null
        && bioInput.getAttribute('data-listener') === null) {
        bioInput.setAttribute('data-listener', 'true');
        bioInput.addEventListener('input', function () {
            bioCounter.textContent = bioInput.value.length + '/200';
        });
    }

    var usernameInput = document.getElementById('profile-username');
    if (usernameInput !== null
        && usernameInput.getAttribute('data-listener') === null) {
        usernameInput.setAttribute('data-listener', 'true');
        usernameInput.addEventListener('input', function () {
            var cursorPos = usernameInput.selectionStart;
            usernameInput.value = usernameInput.value.toLowerCase();
            usernameInput.setSelectionRange(cursorPos, cursorPos);
        });
    }

    // Privacy selector styling.
    var privacyOptions = document.querySelectorAll('.privacy-option');
    privacyOptions.forEach(function (opt) {
        if (opt.getAttribute('data-listener') === null) {
            opt.setAttribute('data-listener', 'true');
            var radio = opt.querySelector('input[type="radio"]');
            if (radio !== null) {
                radio.addEventListener('change', function () {
                    privacyOptions.forEach(function (o) {
                        o.classList.remove('privacy-option--selected');
                    });
                    opt.classList.add('privacy-option--selected');
                });
            }
        }
    });

    // TREQ-005: Cancel button in edit form
    var cancelBtn = document.getElementById('profile-cancel-btn');
    if (cancelBtn !== null && cancelBtn.getAttribute('data-listener') === null) {
        cancelBtn.setAttribute('data-listener', 'true');
        cancelBtn.addEventListener('click', function () {
            hideEditForm();
        });
    }
}

/** Save profile changes. */
async function saveProfile() {
    var displayNameInput = document.getElementById('profile-display-name');
    var avatarUrlInput = document.getElementById('profile-avatar-url');

    if (displayNameInput === null || avatarUrlInput === null) {
        return;
    }

    var payload = {};

    var displayName = displayNameInput.value.trim();
    if (displayName !== '') {
        payload.displayName = displayName;
    }

    var avatarUrl = avatarUrlInput.value.trim();
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

    var usernameInput = document.getElementById('profile-username');
    if (usernameInput !== null) {
        var username = usernameInput.value.trim();
        var originalUsername = usernameInput.getAttribute('data-original') || '';
        if (username !== '' && username !== originalUsername) {
            payload.username = username;
        }
    }

    var bioInput = document.getElementById('profile-bio');
    if (bioInput !== null) {
        payload.bio = bioInput.value.trim();
    }

    var interestsInput = document.getElementById('profile-interests');
    if (interestsInput !== null) {
        payload.interests = interestsInput.value.trim();
    }

    var genresInput = document.getElementById('profile-favorite-genres');
    if (genresInput !== null) {
        payload.favoriteGenres = genresInput.value.trim();
    }

    var aboutMeInput = document.getElementById('profile-about-me');
    if (aboutMeInput !== null) {
        payload.aboutMe = aboutMeInput.value.trim();
    }

    var selectedPrivacy = document.querySelector('input[name="privacy"]:checked');
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

        // TREQ-005: Hide form on successful save
        hideEditForm();

        loadProfile();
    } catch (error) {
        showToast({
            message: 'Failed to update profile: ' + error.message,
            type: 'error',
        });
    }
}

/**
 * v3.2: Set up the Edit Profile button that opens a modal popup.
 * Uses createModal() for the edit form instead of inline collapse.
 *
 * @returns {void}
 */
/**
 * v3.3: Set up the Edit Profile button that toggles inline form visibility.
 * TREQ-005: Form hidden by default, shown on edit click, hidden on save/cancel.
 * TREQ-006: Form wrapped in profile-form-container with proper styling.
 *
 * @returns {void}
 */
function setupEditProfileButton() {
    var formContainer = document.getElementById('profile-form');
    var header = document.getElementById('profile-header');

    if (header === null) {
        return;
    }

    // Check if edit button already exists (from HTML template or previous render)
    var existingEditBtn = header.querySelector('.profile-header__edit-btn');
    if (existingEditBtn !== null) {
        // Re-wire the click handler on existing button
        var btn = existingEditBtn.querySelector('.profile-edit-btn');
        if (btn !== null) {
            // Remove old listener by replacing with clone
            var newBtn = btn.cloneNode(true);
            btn.parentNode.replaceChild(newBtn, btn);
            newBtn.addEventListener('click', function () {
                toggleEditForm();
            });
        }
        return;
    }

    // Fallback: create button dynamically if not in HTML
    var editBtnContainer = document.createElement('div');
    editBtnContainer.className = 'profile-header__edit-btn';

    var editBtn = document.createElement('button');
    editBtn.className = 'profile-edit-btn';
    editBtn.id = 'profile-edit-toggle-btn';
    editBtn.textContent = 'Edit Profile';
    editBtn.addEventListener('click', function () {
        toggleEditForm();
    });

    editBtnContainer.appendChild(editBtn);

    var infoEl = header.querySelector('.profile-header__info');
    if (infoEl !== null) {
        header.insertBefore(editBtnContainer, infoEl.nextSibling);
    } else {
        header.appendChild(editBtnContainer);
    }
}

/**
 * Toggle the edit profile form visibility.
 * TREQ-005: Form hidden by default, shown only on edit click.
 */
function toggleEditForm() {
    var formContainer = document.getElementById('profile-form');
    if (formContainer === null) {
        return;
    }
    var isVisible = formContainer.classList.contains('profile-form--visible');
    if (isVisible) {
        hideEditForm();
    } else {
        showEditForm();
    }
}

/**
 * Show the edit profile form.
 */
function showEditForm() {
    var formContainer = document.getElementById('profile-form');
    var editBtns = document.querySelectorAll('.profile-edit-btn');
    if (formContainer !== null) {
        formContainer.classList.add('profile-form--visible');
        formContainer.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
    editBtns.forEach(function (btn) {
        if (btn.id === 'profile-edit-toggle-btn' || btn.closest('.profile-header__edit-btn')) {
            btn.textContent = 'Close';
            btn.style.background = 'var(--rs-surface-elevated)';
            btn.style.color = 'var(--rs-text)';
            btn.style.border = '1px solid var(--rs-border)';
        }
    });
}

/**
 * Hide the edit profile form.
 * Called on Cancel click, save success, or initial page load.
 */
function hideEditForm() {
    var formContainer = document.getElementById('profile-form');
    var editBtns = document.querySelectorAll('.profile-edit-btn');
    if (formContainer !== null) {
        formContainer.classList.remove('profile-form--visible');
    }
    editBtns.forEach(function (btn) {
        if (btn.id === 'profile-edit-toggle-btn' || btn.closest('.profile-header__edit-btn')) {
            btn.textContent = 'Edit Profile';
            btn.style.background = '';
            btn.style.color = '';
            btn.style.border = '';
        }
    });
}

/**
 * Open the edit profile modal using createModal().
 *
 * @param {HTMLElement} form - The profile form element.
 * @returns {void}
 */
function openEditProfileModal(form) {
    var modalContent = document.createElement('div');
    modalContent.className = 'profile-form';
    modalContent.style.display = 'flex';
    modalContent.style.flexDirection = 'column';
    modalContent.style.gap = 'var(--rs-space-4)';
    modalContent.style.maxHeight = '65vh';
    modalContent.style.overflowY = 'auto';
    modalContent.style.padding = '0';

    var fieldMap = {
        'profile-display-name': 'displayName',
        'profile-avatar-url': 'avatarUrl',
        'profile-username': 'username',
        'profile-bio': 'bio',
        'profile-interests': 'interests',
        'profile-favorite-genres': 'favoriteGenres',
        'profile-about-me': 'aboutMe',
    };

    Object.keys(fieldMap).forEach(function (inputId) {
        var sourceField = document.getElementById(inputId);
        if (sourceField === null) { return; }
        var group = sourceField.closest('.form-group');
        if (group !== null) {
            var clone = group.cloneNode(true);
            var clonedInput = clone.querySelector('#' + inputId);
            if (clonedInput !== null) {
                clonedInput.value = sourceField.value;
            }
            modalContent.appendChild(clone);
        }
    });

    var privacySelector = document.getElementById('profile-privacy-selector');
    if (privacySelector !== null) {
        modalContent.appendChild(privacySelector.cloneNode(true));
        var selectedRadio = document.querySelector('input[name="privacy"]:checked');
        if (selectedRadio !== null) {
            var clonedRadio = modalContent.querySelector('input[value="' + selectedRadio.value + '"]');
            if (clonedRadio !== null) {
                clonedRadio.checked = true;
            }
        }
    }

    var saveContainer = document.createElement('div');
    saveContainer.id = 'profile-save-container';
    saveContainer.appendChild(createButton({
        label: 'Save Changes',
        variant: 'primary',
        isFullWidth: true,
        onClick: function () { },
    }));
    modalContent.appendChild(saveContainer);

    var modalInstance = createModal({
        title: 'Edit Profile',
        content: modalContent,
        onClose: function () {
            loadProfile();
        },
    });

    var saveBtn = modalContent.querySelector('#profile-save-container .rs-btn--primary');
    if (saveBtn !== null) {
        saveBtn.addEventListener('click', function () {
            saveProfileFromModal(modalContent, modalInstance);
        });
    }

    modalInstance.open();

    if (typeof initIcons === 'function') {
        initIcons();
    }
}

/**
 * Save profile changes from the modal form.
 *
 * @param {HTMLElement} modalContent - The modal content element.
 * @param {object} modalInstance - The modal instance from createModal().
 * @returns {Promise<void>}
 */
async function saveProfileFromModal(modalContent, modalInstance) {
    var payload = {};

    var displayNameInput = modalContent.querySelector('#profile-display-name');
    if (displayNameInput !== null) {
        var displayName = displayNameInput.value.trim();
        if (displayName !== '') { payload.displayName = displayName; }
    }

    var avatarUrlInput = modalContent.querySelector('#profile-avatar-url');
    if (avatarUrlInput !== null) {
        var avatarUrl = avatarUrlInput.value.trim();
        if (avatarUrl !== '') {
            if (!isValidUrl(avatarUrl)) {
                showToast({ message: 'Please enter a valid URL for the avatar', type: 'error' });
                return;
            }
            payload.avatarUrl = avatarUrl;
        }
    }

    var usernameInput = modalContent.querySelector('#profile-username');
    var originalUsernameInput = document.getElementById('profile-username');
    if (usernameInput !== null && originalUsernameInput !== null) {
        var username = usernameInput.value.trim();
        var originalUsername = originalUsernameInput.getAttribute('data-original') || '';
        if (username !== '' && username !== originalUsername) {
            payload.username = username;
        }
    }

    var bioInput = modalContent.querySelector('#profile-bio');
    if (bioInput !== null) { payload.bio = bioInput.value.trim(); }

    var interestsInput = modalContent.querySelector('#profile-interests');
    if (interestsInput !== null) { payload.interests = interestsInput.value.trim(); }

    var genresInput = modalContent.querySelector('#profile-favorite-genres');
    if (genresInput !== null) { payload.favoriteGenres = genresInput.value.trim(); }

    var aboutMeInput = modalContent.querySelector('#profile-about-me');
    if (aboutMeInput !== null) { payload.aboutMe = aboutMeInput.value.trim(); }

    var selectedPrivacy = modalContent.querySelector('input[name="privacy"]:checked');
    if (selectedPrivacy !== null) { payload.privacyLevel = selectedPrivacy.value; }

    if (Object.keys(payload).length === 0) {
        showToast({ message: 'No fields to update', type: 'error' });
        return;
    }

    try {
        await apiPut('/api/user/profile', payload);
        showToast({ message: 'Profile updated successfully!', type: 'success' });
        modalInstance.close();
    } catch (error) {
        showToast({ message: 'Failed to update profile: ' + error.message, type: 'error' });
    }
}


