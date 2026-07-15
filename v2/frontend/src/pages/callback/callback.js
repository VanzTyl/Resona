/**
 * Resona Auth Callback Page Controller
 *
 * Handles the OAuth callback, stores tokens, and redirects to feed or onboarding.
 * Implements UI-C-002.
 * v1.1: Added onboarding redirect check for first-time users.
 *
 * @version 1.1.0
 */

/**
 * Render the auth callback page.
 *
 * @returns {void}
 */
function renderCallbackPage() {
    const app = document.getElementById('app');

    const existingPage = document.querySelector('.page--active');

    if (existingPage !== null) {
        existingPage.classList.remove('page--active');
    }

    let page = document.getElementById('page-callback');

    if (page === null) {
        page = document.createElement('div');
        page.id = 'page-callback';
        page.className = 'page page--centered';
        page.innerHTML = '' +
            '<div class="login-page">' +
            '    <div class="app-loading__spinner"></div>' +
            '    <p class="login-page__subtitle">Connecting your Spotify account...</p>' +
            '</div>';

        app.insertBefore(page, app.firstChild);
    }

    page.classList.add('page--active');

    // Extract tokens from URL hash parameters.
    const urlParams = new URLSearchParams(window.location.search);
    const accessToken = urlParams.get('access_token');
    const refreshToken = urlParams.get('refresh_token');
    const error = urlParams.get('error');

    if (error !== null) {
        page.innerHTML = '' +
            '<div class="login-page">' +
            '    <div class="login-page__logo">🎵</div>' +
            '    <h1 class="login-page__title">Connection Failed</h1>' +
            '    <p class="login-page__subtitle">' + escapeHtml(error) + '</p>' +
            '    <div id="retry-btn-container"></div>' +
            '</div>';

        const retryContainer = document.getElementById('retry-btn-container');

        if (retryContainer !== null) {
            retryContainer.appendChild(createButton({
                label: 'Try Again',
                variant: 'primary',
                onClick: function () {
                    window.location.href = getApiBaseUrl() + '/api/auth/spotify/login';
                },
            }));
        }

        return;
    }

    if (accessToken !== null && refreshToken !== null) {
        setAccessToken(accessToken);
        setRefreshToken(refreshToken);

        // Clear URL parameters.
        window.history.replaceState({}, document.title, window.location.pathname);

        // v1.1: Check onboarding status before redirecting
        setTimeout(function () {
            checkOnboardingAndRedirect();
        }, 500);
    } else {
        page.innerHTML = '' +
            '<div class="login-page">' +
            '    <div class="login-page__logo">🎵</div>' +
            '    <h1 class="login-page__title">Authentication Error</h1>' +
            '    <p class="login-page__subtitle">No tokens received. Please try logging in again.</p>' +
            '    <div id="retry-btn-container2"></div>' +
            '</div>';

        const retryContainer = document.getElementById('retry-btn-container2');

        if (retryContainer !== null) {
            retryContainer.appendChild(createButton({
                label: 'Back to Login',
                variant: 'primary',
                onClick: function () {
                    navigateTo('/login');
                },
            }));
        }
    }
}

/**
 * Check onboarding status and redirect accordingly.
 * v1.1: New function — redirects new users to onboarding.
 *
 * @returns {Promise<void>}
 */
async function checkOnboardingAndRedirect() {
    try {
        const status = await apiGet('/api/user/onboarding-status');

        if (status && status.isOnboarded === false) {
            navigateTo('/onboarding');
        } else {
            navigateTo('/feed');
        }
    } catch (_e) {
        // If onboarding check fails, redirect to feed (non-blocking)
        navigateTo('/feed');
    }
}

/**
 * Escape HTML special characters to prevent XSS.
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
