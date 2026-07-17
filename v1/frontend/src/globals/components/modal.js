/**
 * Resona Modal Component
 * 
 * Accessible modal dialog with overlay, close button, and keyboard trap.
 *
 * @version 1.0.0
 */

/**
 * Create a modal dialog element.
 *
 * @param {object} options
 * @param {string} options.title - Modal title.
 * @param {HTMLElement|string} options.content - Body content.
 * @param {boolean} [options.isClosable=true] - Show close button.
 * @param {function} [options.onClose] - Callback on close.
 *
 * @returns {{ element: HTMLElement, open: function, close: function }} Modal controls.
 */
function createModal(options) {
    const {
        title = '',
        content = '',
        isClosable = true,
        onClose = null,
    } = options;

    const overlay = document.createElement('div');
    overlay.className = 'rs-modal-overlay';
    overlay.setAttribute('role', 'presentation');

    const modal = document.createElement('div');
    modal.className = 'rs-modal';
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-modal', 'true');
    modal.setAttribute('aria-labelledby', 'modal-title');

    const header = document.createElement('div');
    header.className = 'rs-modal__header';

    const titleEl = document.createElement('h2');
    titleEl.id = 'modal-title';
    titleEl.className = 'rs-modal__title';
    titleEl.textContent = title;

    header.appendChild(titleEl);

    if (isClosable) {
        const closeBtn = document.createElement('button');
        closeBtn.className = 'rs-modal__close';
        closeBtn.setAttribute('aria-label', 'Close modal');
        closeBtn.innerHTML = '&times;';

        closeBtn.addEventListener('click', close);

        header.appendChild(closeBtn);
    }

    const body = document.createElement('div');
    body.className = 'rs-modal__body';

    if (content instanceof HTMLElement) {
        body.appendChild(content);
    } else {
        body.innerHTML = content;
    }

    modal.appendChild(header);
    modal.appendChild(body);
    overlay.appendChild(modal);

    /**
     * Open the modal by appending it to the document body.
     *
     * @returns {void}
     */
    function open() {
        document.body.appendChild(overlay);
        document.body.style.overflow = 'hidden';

        // Focus trap: focus the first focusable element.
        requestAnimationFrame(function () {
            const firstFocusable = modal.querySelector(
                'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
            );

            if (firstFocusable !== null) {
                firstFocusable.focus();
            }
        });
    }

    /**
     * Close the modal by removing it from the document.
     *
     * @returns {void}
     */
    function close() {
        if (overlay.parentNode !== null) {
            overlay.parentNode.removeChild(overlay);
        }

        document.body.style.overflow = '';

        if (onClose !== null) {
            onClose();
        }
    }

    // Close on overlay click (not modal click).
    overlay.addEventListener('click', function (event) {
        if (event.target === overlay && isClosable) {
            close();
        }
    });

    // Close on Escape key.
    document.addEventListener('keydown', function (event) {
        if (event.key === 'Escape' && overlay.parentNode !== null && isClosable) {
            close();
        }
    });

    return {
        element: overlay,
        open: open,
        close: close,
    };
}
