/**
 * Resona API Client
 * 
 * HTTP client for communicating with the backend REST API.
 * Handles authentication, token refresh, and error normalization.
 *
 * @version 1.0.0
 */

const RESONA_API_BASE_URL = (function () {
    // In development, API might be localhost; in production, use backend URL.
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        return 'http://localhost:8000';
    }

    return 'https://resona-tdih.onrender.com';
})();

/**
 * Get the stored access token from sessionStorage.
 *
 * @returns {string|null} The access token or null.
 */
function getAccessToken() {
    return sessionStorage.getItem('resona_access_token');
}

/**
 * Store the access token in sessionStorage.
 *
 * @param {string} token - The JWT access token.
 * @returns {void}
 */
function setAccessToken(token) {
    sessionStorage.setItem('resona_access_token', token);
}

/**
 * Get the stored refresh token.
 *
 * @returns {string|null} The refresh token or null.
 */
function getRefreshToken() {
    return localStorage.getItem('resona_refresh_token');
}

/**
 * Store the refresh token.
 *
 * @param {string} token - The JWT refresh token.
 * @returns {void}
 */
function setRefreshToken(token) {
    localStorage.setItem('resona_refresh_token', token);
}

/**
 * Clear all stored auth tokens.
 *
 * @returns {void}
 */
function clearTokens() {
    sessionStorage.removeItem('resona_access_token');
    localStorage.removeItem('resona_refresh_token');
}

/**
 * Make an authenticated API request with automatic token refresh.
 *
 * @param {string} method - HTTP method (GET, POST, PUT, DELETE).
 * @param {string} path - API endpoint path (e.g., '/api/feed').
 * @param {object|null} [body=null] - Request body for POST/PUT.
 * @param {object} [options={}] - Additional fetch options.
 *
 * @returns {Promise<object>} The parsed JSON response.
 *
 * @throws {Error} If the request fails after token refresh attempt.
 */
async function apiRequest(method, path, body, options) {
    if (body === undefined || body === null) {
        body = null;
    }

    if (options === undefined || options === null) {
        options = {};
    }

    const url = RESONA_API_BASE_URL + path;
    const headers = {
        'Content-Type': 'application/json',
    };

    const token = getAccessToken();

    if (token !== null) {
        headers['Authorization'] = 'Bearer ' + token;
    }

    const fetchOptions = {
        method: method,
        headers: headers,
    };

    if (body !== null && method !== 'GET') {
        fetchOptions.body = JSON.stringify(body);
    }

    let response = await fetch(url, fetchOptions);

    // If 401, attempt token refresh.
    if (response.status === 401) {
        const refreshToken = getRefreshToken();

        if (refreshToken !== null) {
            const refreshResult = await attemptTokenRefresh(refreshToken);

            if (refreshResult.success) {
                // Retry original request with new token.
                headers['Authorization'] = 'Bearer ' + getAccessToken();

                response = await fetch(url, {
                    ...fetchOptions,
                    headers: headers,
                });
            } else {
                clearTokens();
                window.location.hash = '#/login';

                throw new Error('Session expired. Please log in again.');
            }
        } else {
            clearTokens();
            window.location.hash = '#/login';

            throw new Error('Session expired. Please log in again.');
        }
    }

    const data = await response.json();

    if (!data.success) {
        throw new Error(data.error || 'An unknown error occurred');
    }

    return data.data;
}

/**
 * Attempt to refresh the JWT access token using the refresh token.
 *
 * @param {string} refreshToken - The stored refresh token.
 * @returns {Promise<{success: boolean}>} Result of the refresh attempt.
 */
async function attemptTokenRefresh(refreshToken) {
    try {
        const response = await fetch(RESONA_API_BASE_URL + '/api/auth/refresh', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refreshToken: refreshToken }),
        });

        const data = await response.json();

        if (data.success && data.data && data.data.accessToken) {
            setAccessToken(data.data.accessToken);

            return { success: true };
        }

        return { success: false };
    } catch (_error) {
        return { success: false };
    }
}

/**
 * Perform a GET request.
 *
 * @param {string} path - API endpoint path.
 * @returns {Promise<object>} Response data.
 */
function apiGet(path) {
    return apiRequest('GET', path, null);
}

/**
 * Perform a POST request.
 *
 * @param {string} path - API endpoint path.
 * @param {object} body - Request body.
 * @returns {Promise<object>} Response data.
 */
function apiPost(path, body) {
    return apiRequest('POST', path, body);
}

/**
 * Perform a PUT request.
 *
 * @param {string} path - API endpoint path.
 * @param {object} body - Request body.
 * @returns {Promise<object>} Response data.
 */
function apiPut(path, body) {
    return apiRequest('PUT', path, body);
}

/**
 * Perform a DELETE request.
 *
 * @param {string} path - API endpoint path.
 * @returns {Promise<object>} Response data.
 */
function apiDelete(path) {
    return apiRequest('DELETE', path, null);
}
