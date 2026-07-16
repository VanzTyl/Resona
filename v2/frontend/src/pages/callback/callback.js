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
 * Uses the existing static HTML structure; show/hides states with display.
 *
 * @returns {void}
 */
function renderCallbackPage() {
    const existingPage = document.querySelector('.page--active');

    if (existingPage !== null) {
        existingPage.classList.remove('page--active');
    }

    const page = document.getElementById('page-callback');

    if (page === null) {
        return;
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
