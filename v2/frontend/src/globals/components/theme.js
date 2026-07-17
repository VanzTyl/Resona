/**
 * Resona Theme Manager
 *
 * Handles dark/light mode toggling with persistence.
 * v1.1: New component for REV-006.
 *
 * @version 1.1.0
 */

const RESONA_THEME_STORAGE_KEY = 'resona_theme';

/**
 * Get the user's preferred theme from storage or system preference.
 *
 * @returns {string} 'light' or 'dark'.
 */
function getPreferredTheme() {
    const stored = localStorage.getItem(RESONA_THEME_STORAGE_KEY);
    if (stored === 'light' || stored === 'dark') {
        return stored;
    }
    return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
}

/**
 * Apply a theme to the document.
 *
 * @param {string} theme - 'light' or 'dark'.
 * @returns {void}
 */
function setTheme(theme) {
    document.documentElement.dataset.theme = theme === 'light' ? 'light' : '';
    localStorage.setItem(RESONA_THEME_STORAGE_KEY, theme);
}

/**
 * Toggle between light and dark themes.
 *
 * @returns {void}
 */
function toggleTheme() {
    const current = document.documentElement.dataset.theme === 'light' ? 'light' : 'dark';
    setTheme(current === 'light' ? 'dark' : 'light');
}

// Initialize theme on load.
setTheme(getPreferredTheme());
