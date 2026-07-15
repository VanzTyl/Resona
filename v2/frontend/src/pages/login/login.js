/**
 * Resona Login Page Controller
 *
 * Renders the Spotify login page and initiates OAuth flow.
 * Implements UI-C-001.
 *
 * @version 1.0.0
 */

/**
 * Render the login page.
 *
 * @returns {void}
 */
function renderLoginPage() {
    const app = document.getElementById('app');

    // Remove existing page content.
    const existingPage = document.querySelector('.page--active');

    if (existingPage !== null) {
        existingPage.classList.remove('page--active');
    }

    let page = document.getElementById('page-login');

    if (page === null) {
        page = document.createElement('div');
        page.id = 'page-login';
        page.className = 'page page--centered';

        page.innerHTML = '' +
            '<div class="login-page">' +
            '    <div class="login-page__logo">ðŸŽµ</div>' +
            '    <h1 class="login-page__title">Resona</h1>' +
            '    <p class="login-page__subtitle">Connect through music. See what your friends are listening to in real time.</p>' +
            '    <div id="login-btn-container"></div>' +
            '</div>';

        app.insertBefore(page, app.firstChild);
    }

    const btnContainer = document.getElementById('login-btn-container');

    if (btnContainer !== null) {
        btnContainer.innerHTML = '';

        const loginBtn = createButton({
            label: 'Connect with Spotify',
            variant: 'primary',
            size: 'large',
            isFullWidth: false,
            onClick: function () {
                loginBtn.disabled = true;
                loginBtn.querySelector('.rs-btn__label').textContent = 'Redirecting...';

                var baseUrl = (window.__ENV__ && window.__ENV__.VITE_API_BASE_URL) || 'http://localhost:8000';
                window.location.href = baseUrl + '/api/auth/spotify/login';
            },
        });

        btnContainer.appendChild(loginBtn);
    }

    page.classList.add('page--active');
}
