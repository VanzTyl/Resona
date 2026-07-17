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

        // Populate profile header.
        const profileHeader = document.getElementById('profile-header');
        if (profileHeader !== null) {
            while (profileHeader.firstChild !== null) {
                profileHeader.removeChild(profileHeader.firstChild);
            }

            const avatar = document.createElement('img');
            avatar.className = 'profile-header__avatar';
            avatar.src = profile.avatarUrl || 'assets/default-avatar.svg';
            avatar.alt = 'Profile picture';
            profileHeader.appendChild(avatar);

            const name = document.createElement('h2');
            name.className = 'profile-header__name';
            name.textContent = profile.displayName;
            profileHeader.appendChild(name);

            const username = document.createElement('p');
            username.className = 'profile-header__username';
            username.textContent = '@' + profile.username;
            profileHeader.appendChild(username);

            if (profile.bio) {
                const bio = document.createElement('p');
                bio.className = 'profile-header__bio';
                bio.textContent = profile.bio;
                profileHeader.appendChild(bio);
            }
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

        loadProfile();
    } catch (error) {
        showToast({
            message: 'Failed to update profile: ' + error.message,
            type: 'error',
        });
    }
}

/**
 * v3.1: Set up the Edit Profile button that toggles the form visibility.
 * Creates an edit bar with a button, inserted before the form.
 * Also adds a Cancel button inside the form to hide it.
 *
 * @returns {void}
 */
function setupEditProfileButton() {
    var form = document.getElementById('profile-form');
    var content = document.getElementById('profile-content');

    if (form === null || content === null) {
        return;
    }

    // Remove any existing edit bar (from previous page renders).
    var existingBar = document.querySelector('.profile-edit-bar');
    if (existingBar !== null) {
        existingBar.remove();
    }

    // Create the edit button bar.
    var editBar = document.createElement('div');
    editBar.className = 'profile-edit-bar';

    var editBtn = document.createElement('button');
    editBtn.className = 'profile-edit-btn';
    editBtn.textContent = 'Edit Profile';
    editBtn.addEventListener('click', function () {
        if (form !== null) {
            form.classList.remove('profile-form--collapsible');
            form.classList.add('profile-form--visible');
        }
        if (editBar !== null) {
            editBar.style.display = 'none';
        }
    });

    editBar.appendChild(editBtn);

    // Insert the edit bar before the form.
    form.parentNode.insertBefore(editBar, form);

    // Add a Cancel button inside the form if not already present.
    var existingCancel = form.querySelector('.profile-edit-btn--cancel');
    if (existingCancel === null) {
        var cancelSection = document.createElement('div');
        cancelSection.style.display = 'flex';
        cancelSection.style.gap = 'var(--rs-space-3)';
        cancelSection.style.marginTop = 'var(--rs-space-3)';

        var cancelBtn = document.createElement('button');
        cancelBtn.className = 'profile-edit-btn profile-edit-btn--cancel';
        cancelBtn.textContent = 'Cancel';
        cancelBtn.addEventListener('click', function () {
            form.classList.add('profile-form--collapsible');
            form.classList.remove('profile-form--visible');
            if (editBar !== null) {
                editBar.style.display = '';
            }
        });

        cancelSection.appendChild(cancelBtn);
        form.appendChild(cancelSection);
    }
}


