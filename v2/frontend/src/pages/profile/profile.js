/**
 * Resona Profile Page Controller
 *
 * Displays and allows editing user profile settings.
 * v2.1: Uses static HTML containers — populates form fields and appends sections.
 *
 * @version 2.1.0
 */

/**
 * Render the profile page.
 * Queries existing static HTML containers; no markup construction.
 *
 * @returns {void}
 */
function renderProfilePage() {
    const existingPage = document.querySelector('.page--active');

    if (existingPage !== null) {
        existingPage.classList.remove('page--active');
    }

    const page = document.getElementById('page-profile');

    if (page === null) {
        return;
    }

    page.classList.add('page--active');

    loadProfile();
}

/**
 * Load the user's profile data and populate static form fields.
 *
 * @returns {Promise<void>}
 */
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
            avatar.src = profile.avatar_url || 'assets/default-avatar.svg';
            avatar.alt = 'Profile picture';
            profileHeader.appendChild(avatar);

            const name = document.createElement('h2');
            name.className = 'profile-header__name';
            name.textContent = profile.display_name;
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
                profile.interests.split(',').filter(function (t) {
                    return t.trim() !== '';
                }).forEach(function (tag) {
                    var tagEl = document.createElement('span');
                    tagEl.className = 'tag';
                    tagEl.textContent = '#' + tag.trim();
                    interestsContainer.appendChild(tagEl);
                });
            }
        }

        // Populate genre tags.
        var genresContainer = document.getElementById('profile-genre-tags');
        if (genresContainer !== null) {
            while (genresContainer.firstChild !== null) {
                genresContainer.removeChild(genresContainer.firstChild);
            }

            if (profile.favorite_genres) {
                profile.favorite_genres.split(',').filter(function (t) {
                    return t.trim() !== '';
                }).forEach(function (tag) {
                    var tagEl = document.createElement('span');
                    tagEl.className = 'tag tag--genre';
                    tagEl.textContent = tag.trim();
                    genresContainer.appendChild(tagEl);
                });
            }
        }

        // Populate about section.
        var aboutSection = document.getElementById('profile-about-section');
        if (aboutSection !== null) {
            while (aboutSection.firstChild !== null) {
                aboutSection.removeChild(aboutSection.firstChild);
            }

            if (profile.about_me) {
                var section = document.createElement('div');
                section.className = 'profile-section';

                var aboutDiv = document.createElement('div');
                aboutDiv.className = 'about-section';
                aboutDiv.textContent = profile.about_me;
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
            displayNameInput.value = profile.display_name || '';
        }

        var avatarUrlInput = document.getElementById('profile-avatar-url');
        if (avatarUrlInput !== null) {
            avatarUrlInput.value = profile.avatar_url || '';
        }

        var usernameInput = document.getElementById('profile-username');
        if (usernameInput !== null) {
            usernameInput.value = profile.username || '';
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
            genresInput.value = profile.favorite_genres || '';
        }

        var aboutMeInput = document.getElementById('profile-about-me');
        if (aboutMeInput !== null) {
            aboutMeInput.value = profile.about_me || '';
        }

        // Set privacy level.
        var privacyLevel = profile.privacy_level || 'friends_only';
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
            statusIcon.setAttribute('data-lucide', profile.spotify_connected ? 'check-circle' : 'x-circle');
            statusIcon.className = 'rs-icon';
            spotifyStatus.appendChild(statusIcon);
            var statusText = document.createTextNode(
                profile.spotify_connected ? ' Connected' : ' Not connected'
            );
            spotifyStatus.appendChild(statusText);
            spotifyStatus.style.color = profile.spotify_connected
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

/**
 * Set up profile form event listeners (once only).
 *
 * @returns {void}
 */
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

/**
 * Save profile changes.
 *
 * @returns {Promise<void>}
 */
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
        if (username !== '') {
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
