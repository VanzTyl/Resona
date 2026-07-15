/**
 * Resona Now Playing Bar
 *
 * Polls the current track API and displays a now-playing bar above the bottom nav.
 * v1.1: New component for REV-010.
 *
 * @version 1.1.0
 */

const NOW_PLAYING_POLL_INTERVAL = 30000; // 30 seconds
let nowPlayingIntervalId = null;

/**
 * Start polling the currently playing track.
 *
 * @returns {void}
 */
function startNowPlayingPolling() {
    // Immediate fetch
    fetchNowPlaying();

    // Periodic polling
    if (nowPlayingIntervalId === null) {
        nowPlayingIntervalId = setInterval(fetchNowPlaying, NOW_PLAYING_POLL_INTERVAL);
    }
}

/**
 * Stop polling the currently playing track.
 *
 * @returns {void}
 */
function stopNowPlayingPolling() {
    if (nowPlayingIntervalId !== null) {
        clearInterval(nowPlayingIntervalId);
        nowPlayingIntervalId = null;
    }
}

/**
 * Fetch the current track from the API and update the UI.
 *
 * @returns {Promise<void>}
 */
async function fetchNowPlaying() {
    try {
        const data = await apiGet('/api/sync/current-track');

        if (data === null) {
            hideNowPlaying();
            return;
        }

        showNowPlaying(data);
    } catch (_error) {
        hideNowPlaying();
    }
}

/**
 * Show the now-playing bar with track data.
 *
 * @param {object} trackData - The track data from the API.
 * @returns {void}
 */
function showNowPlaying(trackData) {
    let bar = document.getElementById('now-playing-bar');

    if (bar === null) {
        bar = document.createElement('div');
        bar.id = 'now-playing-bar';
        bar.className = 'now-playing';
        document.getElementById('app').appendChild(bar);
    }

    bar.className = 'now-playing';
    bar.innerHTML = '' +
        '<img class="now-playing__art" src="' + (trackData.albumArt || 'assets/default-album.svg') + '" alt="" loading="lazy" />' +
        '<div class="now-playing__info">' +
        '    <div class="now-playing__track">' + escapeHtml(trackData.trackName || 'Unknown Track') + '</div>' +
        '    <div class="now-playing__artist">' + escapeHtml((trackData.artists || []).join(', ')) + '</div>' +
        '</div>' +
        '<div class="now-playing__indicator"></div>';
}

/**
 * Hide the now-playing bar.
 *
 * @returns {void}
 */
function hideNowPlaying() {
    const bar = document.getElementById('now-playing-bar');

    if (bar !== null) {
        bar.classList.add('now-playing--hidden');
    }
}

/**
 * Escape HTML special characters.
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
