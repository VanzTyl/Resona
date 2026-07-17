/**
 * Resona Desktop Sidebar
 *
 * v2.1: Desktop sidebar with nav, user profile, theme toggle, and logout.
 * Extracted from script.js to comply with 500-line hard limit.
 *
 * @version 2.1.0
 */

/**
 * Render the desktop sidebar navigation.
 *
 * @param {string} activeRoute - Currently active route.
 * @returns {void}
 */
function renderDesktopSidebar(activeRoute) {
    var existingSidebar = document.querySelector('.desktop-sidebar');

    if (existingSidebar !== null) {
        existingSidebar.remove();
    }

    var hideNavRoutes = ['/login', '/callback', '/onboarding'];

    if (hideNavRoutes.includes(activeRoute)) {
        return;
    }

    if (window.innerWidth < 1024) {
        return;
    }

    var sidebar = document.createElement('aside');
    sidebar.className = 'desktop-sidebar';
    sidebar.setAttribute('aria-label', 'Desktop navigation');

    // Brand section.
    var brand = document.createElement('div');
    brand.className = 'desktop-sidebar__brand';

    var logo = document.createElement('div');
    logo.className = 'desktop-sidebar__logo';

    if (typeof createIcon === 'function') {
        var logoIcon = createIcon('music', { size: 22 });
        logo.appendChild(logoIcon);
    } else {
        logo.textContent = 'R';
    }

    brand.appendChild(logo);

    var appName = document.createElement('span');
    appName.className = 'desktop-sidebar__app-name';
    appName.textContent = 'Resona';
    brand.appendChild(appName);

    sidebar.appendChild(brand);

    // Nav items.
    var nav = document.createElement('nav');
    nav.className = 'desktop-sidebar__nav';
    nav.setAttribute('aria-label', 'Main navigation');

    RESONA_NAV_ITEMS.forEach(function (item) {
        var isActive = activeRoute === item.route;

        var navItem = document.createElement('a');
        navItem.className = 'desktop-sidebar__nav-item';

        if (isActive) {
            navItem.classList.add('desktop-sidebar__nav-item--active');
        }

        navItem.setAttribute('href', '#!' + item.route);
        navItem.setAttribute('aria-label', item.label);
        navItem.setAttribute('aria-current', isActive ? 'page' : 'false');

        if (typeof createIcon === 'function') {
            var iconEl = createIcon(item.icon, { size: 20 });
            navItem.appendChild(iconEl);
        } else {
            var iconPlaceholder = document.createElement('span');
            iconPlaceholder.className = 'rs-icon';
            iconPlaceholder.textContent = item.icon;
            navItem.appendChild(iconPlaceholder);
        }

        var label = document.createElement('span');
        label.className = 'desktop-sidebar__nav-label';
        label.textContent = item.label;
        navItem.appendChild(label);

        nav.appendChild(navItem);
    });

    sidebar.appendChild(nav);

    // User section.
    var userSection = document.createElement('div');
    userSection.className = 'desktop-sidebar__user-section';

    var userInfo = document.createElement('div');
    userInfo.className = 'desktop-sidebar__user-info';

    var avatar = document.createElement('img');
    avatar.className = 'desktop-sidebar__user-avatar';
    avatar.src = 'assets/default-avatar.svg';
    avatar.alt = 'Your avatar';

    loadSidebarUserProfile(avatar, userInfo);

    var userDetails = document.createElement('div');
    userDetails.className = 'desktop-sidebar__user-details';

    var userName = document.createElement('div');
    userName.className = 'desktop-sidebar__user-name';
    userName.id = 'sidebar-user-name';
    userName.textContent = 'Loading...';
    userDetails.appendChild(userName);

    var userUsername = document.createElement('div');
    userUsername.className = 'desktop-sidebar__user-username';
    userUsername.id = 'sidebar-user-username';
    userUsername.textContent = '@...';
    userDetails.appendChild(userUsername);

    userInfo.appendChild(avatar);
    userInfo.appendChild(userDetails);
    userSection.appendChild(userInfo);

    sidebar.appendChild(userSection);

    // Actions row.
    var actions = document.createElement('div');
    actions.className = 'desktop-sidebar__actions';

    var themeBtn = document.createElement('button');
    themeBtn.className = 'desktop-sidebar__theme-btn';
    themeBtn.setAttribute('aria-label', 'Toggle theme');
    themeBtn.setAttribute('title', 'Toggle light/dark mode');

    var currentTheme = document.documentElement.dataset.theme === 'light' ? 'light' : 'dark';

    if (typeof createIcon === 'function') {
        var themeIcon = createIcon(currentTheme === 'dark' ? 'sun' : 'moon', { size: 20 });
        themeBtn.appendChild(themeIcon);
    } else {
        themeBtn.textContent = currentTheme === 'dark' ? '\u2600' : '\uD83C\uDF19';
    }

    themeBtn.addEventListener('click', function () {
        toggleTheme();
        var newTheme = document.documentElement.dataset.theme === 'light' ? 'light' : 'dark';

        while (themeBtn.firstChild !== null) {
            themeBtn.removeChild(themeBtn.firstChild);
        }

        if (typeof createIcon === 'function') {
            var newIcon = createIcon(newTheme === 'dark' ? 'sun' : 'moon', { size: 20 });
            themeBtn.appendChild(newIcon);
        } else {
            themeBtn.textContent = newTheme === 'dark' ? '\u2600' : '\uD83C\uDF19';
        }

        if (typeof initIcons === 'function') {
            initIcons();
        }
    });

    actions.appendChild(themeBtn);

    var logoutBtn = document.createElement('button');
    logoutBtn.className = 'desktop-sidebar__logout-btn';
    logoutBtn.setAttribute('aria-label', 'Log out');

    if (typeof createIcon === 'function') {
        var logoutIcon = createIcon('log-out', { size: 18 });
        logoutBtn.appendChild(logoutIcon);
    }

    var logoutLabel = document.createTextNode('Log out');
    logoutBtn.appendChild(logoutLabel);

    logoutBtn.addEventListener('click', function () {
        // Stop now-playing polling immediately on logout
        if (typeof stopNowPlayingPolling === 'function') {
            stopNowPlayingPolling();
        }
        if (typeof hideNowPlaying === 'function') {
            hideNowPlaying();
        }
        clearTokens();
        showToast({
            message: 'Logged out successfully',
            type: 'info',
        });
        navigateTo('/login');
    });

    actions.appendChild(logoutBtn);
    sidebar.appendChild(actions);

    document.getElementById('app').appendChild(sidebar);

    if (typeof initIcons === 'function') {
        initIcons();
    }
}

/**
 * Set up a resize listener to toggle sidebar visibility.
 *
 * @param {string} activeRoute - Currently active route.
 * @returns {void}
 */
function setupSidebarResizeListener(activeRoute) {
    var existingListener = window._sidebarResizeHandler;

    if (existingListener !== undefined) {
        window.removeEventListener('resize', existingListener);
    }

    var handler = function () {
        var sidebar = document.querySelector('.desktop-sidebar');
        var belowThreshold = window.innerWidth < 1024;

        if (belowThreshold && sidebar !== null) {
            sidebar.remove();
        } else if (!belowThreshold && sidebar === null) {
            renderDesktopSidebar(activeRoute);
        }
    };

    window._sidebarResizeHandler = handler;
    window.addEventListener('resize', handler);
}

/**
 * Load user profile data into the sidebar.
 *
 * @param {HTMLElement} avatarEl - The avatar image element.
 * @param {HTMLElement} userInfoEl - The user info container.
 * @returns {Promise<void>}
 */
async function loadSidebarUserProfile(avatarEl, userInfoEl) {
    try {
        var profile = await apiGet('/api/user/profile');

        var userNameEl = document.getElementById('sidebar-user-name');
        var userUsernameEl = document.getElementById('sidebar-user-username');

        if (userNameEl !== null) {
            userNameEl.textContent = profile.displayName || 'User';
        }

        if (userUsernameEl !== null) {
            userUsernameEl.textContent = '@' + (profile.username || 'user');
        }
        if (profile.avatarUrl) {

            avatarEl.src = profile.avatarUrl;
        }
    } catch (_e) {
        // Non-blocking.
    }
}
