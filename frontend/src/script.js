/**
 * Resona Main Application Script
 *
 * Single-page application router and app initialization.
 * Handles navigation, auth guard, and page lifecycle.
 *
 * @version 1.0.0
 */

// Import component library (loaded via script tags in index.html).
// Components available globally: createButton, createFeedCard, createModal, showToast, createSkeleton, createSkeletonCard
// API client available globally: apiGet, apiPost, apiPut, apiDelete, getAccessToken, setAccessToken, clearTokens

/* ========================================
   Route Definitions
   ======================================== */

const RESONA_ROUTES = {
    '/login': {
        controller: 'login',
        requiresAuth: false,
        title: 'Resona â€” Login',
    },
    '/callback': {
        controller: 'callback',
        requiresAuth: false,
        title: 'Resona â€” Connecting',
    },
    '/feed': {
        controller: 'feed',
        requiresAuth: true,
        title: 'Resona â€” Feed',
    },
    '/friends': {
        controller: 'friends',
        requiresAuth: true,
        title: 'Resona â€” Find Friends',
    },
    '/messages': {
        controller: 'messages',
        requiresAuth: true,
        title: 'Resona â€” Messages',
    },
    '/dashboard': {
        controller: 'dashboard',
        requiresAuth: true,
        title: 'Resona â€” Dashboard',
    },
    '/profile': {
        controller: 'profile',
        requiresAuth: true,
        title: 'Resona â€” Profile',
    },
};

const RESONA_PAGE_SCRIPTS = {
    login: 'pages/login/login.js',
    callback: 'pages/callback/callback.js',
    feed: 'pages/feed/feed.js',
    friends: 'pages/friends/friends.js',
    messages: 'pages/messages/messages.js',
    dashboard: 'pages/dashboard/dashboard.js',
    profile: 'pages/profile/profile.js',
};

const RESONA_NAV_ITEMS = [
    { route: '/feed', label: 'Feed', icon: 'â™«' },
    { route: '/friends', label: 'Friends', icon: 'âŠ•' },
    { route: '/messages', label: 'Messages', icon: 'âœ‰' },
    { route: '/dashboard', label: 'Stats', icon: 'â‰¡' },
];

/* ========================================
   Application State
   ======================================== */

const appState = {
    currentRoute: null,
    currentController: null,
    pageScriptsLoaded: {},
    isLoading: true,
};

/* ========================================
   Router
   ======================================== */

/**
 * Initialize the hash-based router.
 *
 * @returns {void}
 */
function initRouter() {
    window.addEventListener('hashchange', handleRouteChange);
    window.addEventListener('load', handleRouteChange);
}

/**
 * Navigate to a given route.
 *
 * @param {string} route - Route hash (e.g., '/feed').
 * @param {object} [params={}] - Optional params to pass to controller.
 * @returns {void}
 */
function navigateTo(route, params) {
    if (params === undefined) {
        params = {};
    }

    // Store params in session for the next page.
    if (Object.keys(params).length > 0) {
        sessionStorage.setItem('resona_nav_params', JSON.stringify(params));
    }

    window.location.hash = '#!' + route;
}

/**
 * Handle route changes from hash or initial load.
 *
 * @returns {Promise<void>}
 */
async function handleRouteChange() {
    // Extract route from hash. Default to /feed if authenticated, /login if not.
    let hash = window.location.hash.replace(/^#!/, '');

    if (hash === '' || hash === '#') {
        const token = getAccessToken();
        // Check if this is a callback URL with tokens (no hash, query params present)
        if (window.location.search.includes('access_token=')) {
            hash = '/callback';
        } else {
            hash = token !== null ? '/feed' : '/login';
        }
    }

    const routeConfig = RESONA_ROUTES[hash];

    if (routeConfig === undefined) {
        navigateTo('/feed');
        return;
    }

    // Auth guard.
    if (routeConfig.requiresAuth) {
        const token = getAccessToken();

        if (token === null) {
            navigateTo('/login');
            return;
        }
    }

    // Update document title.
    document.title = routeConfig.title;

    // Hide app loading if visible.
    const appLoading = document.getElementById('app-loading');

    if (appLoading !== null) {
        appLoading.style.display = 'none';
    }

    appState.isLoading = false;
    appState.currentRoute = hash;

    // Remove active class from all pages.
    const activePages = document.querySelectorAll('.page--active');

    activePages.forEach(function (page) {
        page.classList.remove('page--active');
    });

    // Load and initialize the page controller.
    const controllerName = routeConfig.controller;

    await loadPageScript(controllerName);
    initPage(controllerName, hash);
    renderBottomNav(hash);
}

/**
 * Dynamically load a page controller script.
 *
 * @param {string} controllerName - Name of the controller to load.
 * @returns {Promise<void>}
 */
function loadPageScript(controllerName) {
    return new Promise(function (resolve, reject) {
        if (appState.pageScriptsLoaded[controllerName]) {
            resolve();
            return;
        }

        const scriptPath = RESONA_PAGE_SCRIPTS[controllerName];

        if (scriptPath === undefined) {
            resolve();
            return;
        }

        const script = document.createElement('script');
        script.src = scriptPath;
        script.async = false;
        script.defer = false;

        script.onload = function () {
            appState.pageScriptsLoaded[controllerName] = true;
            resolve();
        };

        script.onerror = function () {
            console.error('Failed to load page script: ' + scriptPath);
            reject();
        };

        document.head.appendChild(script);
    });
}

/**
 * Initialize a page by calling its controller function.
 *
 * @param {string} controllerName - Controller name.
 * @param {string} route - Current route hash.
 * @returns {void}
 */
function initPage(controllerName, route) {
    const controllerFn = window['render' + capitalize(controllerName) + 'Page'];

    if (typeof controllerFn !== 'function') {
        return;
    }

    // Get stored navigation params.
    let params = {};
    const storedParams = sessionStorage.getItem('resona_nav_params');

    if (storedParams !== null) {
        try {
            params = JSON.parse(storedParams);
            sessionStorage.removeItem('resona_nav_params');
        } catch (_e) {
            params = {};
        }
    }

    controllerFn(route, params);
}

/**
 * Render the bottom navigation bar.
 *
 * @param {string} activeRoute - Currently active route.
 * @returns {void}
 */
function renderBottomNav(activeRoute) {
    const existingNav = document.querySelector('.bottom-nav');

    if (existingNav !== null) {
        existingNav.remove();
    }

    // Only show nav on main app pages, not login or callback.
    const hideNavRoutes = ['/login', '/callback'];

    if (hideNavRoutes.includes(activeRoute)) {
        return;
    }

    const nav = document.createElement('nav');
    nav.className = 'bottom-nav';
    nav.setAttribute('aria-label', 'Main navigation');

    RESONA_NAV_ITEMS.forEach(function (item) {
        const isActive = activeRoute === item.route;

        const navItem = document.createElement('a');
        navItem.className = 'bottom-nav__item';

        if (isActive) {
            navItem.classList.add('bottom-nav__item--active');
        }

        navItem.setAttribute('href', '#!' + item.route);
        navItem.setAttribute('aria-label', item.label);
        navItem.setAttribute('role', 'tab');
        navItem.setAttribute('aria-selected', isActive ? 'true' : 'false');

        const icon = document.createElement('span');
        icon.className = 'bottom-nav__icon';
        icon.textContent = item.icon;

        const label = document.createElement('span');
        label.textContent = item.label;

        navItem.appendChild(icon);
        navItem.appendChild(label);
        nav.appendChild(navItem);
    });

    document.getElementById('app').appendChild(nav);
}

/**
 * Capitalize a string.
 *
 * @param {string} str - The string to capitalize.
 * @returns {string} Capitalized string.
 */
function capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

/* ========================================
   Boot
   ======================================== */

// Initialize the router when the DOM is ready.
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initRouter);
} else {
    initRouter();
}
