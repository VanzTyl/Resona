/**
 * Resona Environment Configuration
 *
 * Overwritten at deploy time by Cloudflare Pages build command.
 * The build command injects RESONA_API_URL from the dashboard env vars.
 *
 * Local fallback: http://localhost:8000
 *
 * @version 1.0.0
 */

window.__ENV__ = window.__ENV__ || {
    RESONA_API_URL: 'http://localhost:8000',
    RESONA_APP_URL: window.location.origin,
};
