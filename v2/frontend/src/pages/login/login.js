/**
 * Resona Login Page Controller
 *
 * Renders the Spotify login page and initiates OAuth flow.
 * v2.1: Uses static HTML containers — appends login button via appendChild.
 *
 * @version 2.1.0
 */

/**
 * Render the login page.
 * Queries existing static HTML containers; no markup construction.
 *
 * @returns {void}
 */
function renderLoginPage() {
    const existingPage = document.querySelector('.page--active');

    if (existingPage !== null) {
        existingPage.classList.remove('page--active');
    }

    const page = document.getElementById('page-login');

    if (page === null) {
        return;
    }

    page.classList.add('page--active');

    const btnContainer = document.getElementById('login-btn-container');

    if (btnContainer !== null) {
        // Clear any previous buttons.
        while (btnContainer.firstChild !== null) {
            btnContainer.removeChild(btnContainer.firstChild);
        }

        const loginBtn = createButton({
            label: 'Connect with Spotify',
            variant: 'primary',
            size: 'large',
            isFullWidth: false,
            onClick: function () {
                loginBtn.disabled = true;
                loginBtn.querySelector('.rs-btn__label').textContent = 'Redirecting...';

                var baseUrl = (window.__ENV__ && window.__ENV__.RESONA_API_URL) || 'http://localhost:8000';
                window.location.href = baseUrl + '/api/auth/spotify/login';
            },
        });

        btnContainer.appendChild(loginBtn);
    }

    // Initialize Lucide icons.
    if (typeof initIcons === 'function') {
        initIcons();
    }
}
