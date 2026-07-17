/**
 * Resona Auth Callback Page Controller
 *
 * Handles the OAuth callback, stores tokens, and redirects to feed or onboarding.
 * v2.1: Uses static HTML containers — manages state transitions within existing elements.
 *
 * @version 2.1.0
 */

/**
 * Render the auth callback page.
 * Creates page structure via createElement/appendChild if not in DOM.
 *
 * @returns {void}
 */
function renderCallbackPage() {
    const existingPage = document.querySelector('.page--active');

    if (existingPage !== null) {
        existingPage.classList.remove('page--active');
    }

    let page = document.getElementById('page-callback');

    if (page === null) {
        page = createCallbackPageStructure();
        const app = document.getElementById('app');

        if (app === null) {
            return;
        }

        app.insertBefore(page, app.firstChild);
    }

    page.classList.add('page--active');

    // Show loading state, hide error state.
    const loading = document.getElementById('callback-loading');
    const errorDiv = document.getElementById('callback-error');

    if (loading !== null) {
        loading.style.display = '';
    }
    if (errorDiv !== null) {
        errorDiv.style.display = 'none';
    }

    // Extract tokens from URL query parameters.
    const urlParams = new URLSearchParams(window.location.search);
    const accessToken = urlParams.get('access_token');
    const refreshToken = urlParams.get('refresh_token');
    const error = urlParams.get('error');

    if (error !== null) {
        // Show error state.
        if (loading !== null) {
            loading.style.display = 'none';
        }
        if (errorDiv !== null) {
            errorDiv.style.display = '';

            const errorMsg = document.getElementById('callback-error-message');
            if (errorMsg !== null) {
                errorMsg.textContent = error;
            }

            const retryContainer = document.getElementById('callback-retry-container');
            if (retryContainer !== null) {
                while (retryContainer.firstChild !== null) {
                    retryContainer.removeChild(retryContainer.firstChild);
                }

                retryContainer.appendChild(createButton({
                    label: 'Try Again',
                    variant: 'primary',
                    onClick: function () {
                        var baseUrl = (window.__ENV__ && window.__ENV__.RESONA_API_URL) || 'http://localhost:8000';
                        window.location.href = baseUrl + '/api/auth/spotify/login';
                    },
                }));
            }
        }

        if (typeof initIcons === 'function') {
            initIcons();
        }

        return;
    }

    if (accessToken !== null && refreshToken !== null) {
        setAccessToken(accessToken);
        setRefreshToken(refreshToken);

        // Clear URL parameters.
        window.history.replaceState({}, document.title, window.location.pathname);

        // Check onboarding status before redirecting.
        setTimeout(function () {
            checkOnboardingAndRedirect();
        }, 500);
    } else {
        // Show error state.
        if (loading !== null) {
            loading.style.display = 'none';
        }
        if (errorDiv !== null) {
            errorDiv.style.display = '';

            const errorMsg = document.getElementById('callback-error-message');
            if (errorMsg !== null) {
                errorMsg.textContent = 'No tokens received. Please try logging in again.';
            }

            const retryContainer = document.getElementById('callback-retry-container');
            if (retryContainer !== null) {
                while (retryContainer.firstChild !== null) {
                    retryContainer.removeChild(retryContainer.firstChild);
                }

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

    if (typeof initIcons === 'function') {
        initIcons();
    }
}

/**
 * Check onboarding status and redirect accordingly.
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
        navigateTo('/feed');
    }
}

/**
 * Create the callback page DOM structure using createElement/appendChild.
 *
 * @returns {HTMLElement} The page element.
 */
function createCallbackPageStructure() {
    const page = document.createElement('div');
    page.id = 'page-callback';
    page.className = 'page page--centered';

    const loginPage = document.createElement('div');
    loginPage.className = 'login-page';
    loginPage.id = 'callback-content';

    // Loading state.
    const loading = document.createElement('div');
    loading.id = 'callback-loading';

    const spinner = document.createElement('div');
    spinner.className = 'app-loading__spinner';
    loading.appendChild(spinner);

    const loadingText = document.createElement('p');
    loadingText.className = 'login-page__subtitle';
    loadingText.textContent = 'Connecting your Spotify account...';
    loading.appendChild(loadingText);

    loginPage.appendChild(loading);

    // Error state (hidden).
    const errorDiv = document.createElement('div');
    errorDiv.id = 'callback-error';
    errorDiv.style.display = 'none';

    const errorTitle = document.createElement('h1');
    errorTitle.className = 'login-page__title';
    errorTitle.textContent = 'Connection Failed';
    errorDiv.appendChild(errorTitle);

    const errorMsg = document.createElement('p');
    errorMsg.className = 'login-page__subtitle';
    errorMsg.id = 'callback-error-message';
    errorDiv.appendChild(errorMsg);

    const retryContainer = document.createElement('div');
    retryContainer.id = 'callback-retry-container';
    errorDiv.appendChild(retryContainer);

    loginPage.appendChild(errorDiv);
    page.appendChild(loginPage);

    return page;
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
