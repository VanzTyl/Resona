/**
 * Resona Toast Notification Component
 * 
 * Non-intrusive notification toast with auto-dismiss.
 *
 * @version 1.0.0
 */

const TOAST_TYPES = {
    SUCCESS: 'success',
    ERROR: 'error',
    INFO: 'info',
    WARNING: 'warning',
};

const TOAST_DEFAULT_DURATION = 4000;
const TOAST_MAX_VISIBLE = 3;

/**
 * Show a toast notification.
 *
 * @param {object} options
 * @param {string} options.message - Toast message text.
 * @param {string} [options.type='info'] - Toast type.
 * @param {number} [options.duration=4000] - Auto-dismiss time in ms.
 * @param {function} [options.onDismiss] - Callback when dismissed.
 *
 * @returns {{ dismiss: function }} Toast controls.
 */
function showToast(options) {
    const {
        message = '',
        type = TOAST_TYPES.INFO,
        duration = TOAST_DEFAULT_DURATION,
        onDismiss = null,
    } = options;

    if (message === '') {
        return { dismiss: function () {} };
    }

    // Get or create toast container.
    let container = document.getElementById('rs-toast-container');

    if (container === null) {
        container = document.createElement('div');
        container.id = 'rs-toast-container';
        container.className = 'rs-toast-container';
        container.setAttribute('aria-live', 'polite');
        container.setAttribute('aria-relevant', 'additions');
        document.body.appendChild(container);
    }

    // Enforce max visible toasts.
    while (container.children.length >= TOAST_MAX_VISIBLE) {
        const firstChild = container.firstChild;

        if (firstChild !== null) {
            container.removeChild(firstChild);
        }
    }

    const toast = document.createElement('div');
    toast.className = 'rs-toast rs-toast--' + type;
    toast.setAttribute('role', 'alert');

    const iconMap = {
        success: '✓',
        error: '✕',
        info: 'ℹ',
        warning: '⚠',
    };

    const icon = document.createElement('span');
    icon.className = 'rs-toast__icon';
    icon.textContent = iconMap[type] || '';

    const text = document.createElement('span');
    text.className = 'rs-toast__message';
    text.textContent = message;

    toast.appendChild(icon);
    toast.appendChild(text);

    container.appendChild(toast);

    // Trigger entrance animation.
    requestAnimationFrame(function () {
        toast.classList.add('rs-toast--visible');
    });

    let dismissTimer = null;

    /**
     * Dismiss the toast with exit animation.
     *
     * @returns {void}
     */
    function dismiss() {
        if (dismissTimer !== null) {
            clearTimeout(dismissTimer);
            dismissTimer = null;
        }

        toast.classList.remove('rs-toast--visible');
        toast.classList.add('rs-toast--dismissing');

        setTimeout(function () {
            if (toast.parentNode !== null) {
                toast.parentNode.removeChild(toast);
            }

            if (onDismiss !== null) {
                onDismiss();
            }
        }, 300);
    }

    // Auto-dismiss after duration.
    if (duration > 0) {
        dismissTimer = setTimeout(dismiss, duration);
    }

    // Dismiss on click.
    toast.addEventListener('click', function () {
        dismiss();
    });

    return {
        dismiss: dismiss,
    };
}
