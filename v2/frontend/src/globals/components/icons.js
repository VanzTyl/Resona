/**
 * Resona Icon Helper (Lucide)
 *
 * Provides createIcon() and initIcons() utilities for Lucide SVG icons.
 * v1.1: New component for REV-007.
 *
 * @version 1.1.0
 */

/**
 * Create a Lucide icon element.
 *
 * @param {string} name - The Lucide icon name (e.g., 'heart', 'music').
 * @param {object} [options] - Optional configuration.
 * @param {string} [options.className] - Additional CSS class.
 * @param {number} [options.size] - Icon size in pixels.
 * @returns {HTMLElement} The icon element.
 */
function createIcon(name, options) {
    const iconEl = document.createElement('i');
    iconEl.setAttribute('data-lucide', name);
    iconEl.className = 'rs-icon' + (options && options.className ? ' ' + options.className : '');
    
    if (options && options.size) {
        iconEl.style.setProperty('--rs-icon-size', options.size + 'px');
    }
    
    return iconEl;
}

/**
 * Initialize all Lucide icons on the page.
 * Call after adding dynamic content with [data-lucide] elements.
 *
 * @returns {void}
 */
function initIcons() {
    if (typeof lucide !== 'undefined' && lucide.createIcons) {
        lucide.createIcons();
    }
}
