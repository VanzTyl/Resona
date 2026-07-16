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
 * Creates page structure via createElement/appendChild if not in DOM.
 *
 * @returns {void}
 */
function renderLoginPage() {
    const existingPage = document.querySelector('.page--active');

    if (existingPage !== null) {
        existingPage.classList.remove('page--active');
    }

    let page = document.getElementById('page-login');

    if (page === null) {
        page = createLoginPageStructure();
        const app = document.getElementById('app');

        if (app === null) {
            return;
        }

        app.insertBefore(page, app.firstChild);
    }

    page.classList.add('page--active');

    const btnContainer = document.getElementById('login-btn-container');

    if (btnContainer !== null) {
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

                var labelEl = loginBtn.querySelector('.rs-btn__label');
                if (labelEl !== null) {
                    labelEl.textContent = 'Redirecting...';
                }

                var baseUrl = (window.__ENV__ && window.__ENV__.RESONA_API_URL) || 'http://localhost:8000';
                window.location.href = baseUrl + '/api/auth/spotify/login';
            },
        });

        btnContainer.appendChild(loginBtn);
    }

    if (typeof initIcons === 'function') {
        initIcons();
    }
}

/**
 * Create the login page DOM structure using createElement/appendChild.
 *
 * @returns {HTMLElement} The page element.
 */
function createLoginPageStructure() {
    const page = document.createElement('div');
    page.id = 'page-login';
    page.className = 'page page--centered';

    const loginPage = document.createElement('div');
    loginPage.className = 'login-page';

    // Logo icon container.
    const logo = document.createElement('div');
    logo.className = 'login-page__logo';
    logo.setAttribute('data-lucide', 'music');
    logo.style.width = '64px';
    logo.style.height = '64px';
    logo.style.color = 'var(--rs-primary)';
    loginPage.appendChild(logo);

    const title = document.createElement('h1');
    title.className = 'login-page__title';
    title.textContent = 'Resona';
    loginPage.appendChild(title);

    const subtitle = document.createElement('p');
    subtitle.className = 'login-page__subtitle';
    subtitle.textContent = "Connect through music. See what your friends are listening to in real time.";
    loginPage.appendChild(subtitle);

    const btnContainer = document.createElement('div');
    btnContainer.id = 'login-btn-container';
    loginPage.appendChild(btnContainer);

    page.appendChild(loginPage);

    return page;
}
