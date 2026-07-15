/**
 * Resona Button Component
 * 
 * Reusable button component with variants, sizes, and loading state.
 * Part of the Component Library.
 *
 * @version 1.0.0
 */

const RESONA_BUTTON_VARIANTS = {
    PRIMARY: 'primary',
    SECONDARY: 'secondary',
    GHOST: 'ghost',
    DANGER: 'danger',
};

const RESONA_BUTTON_SIZES = {
    SMALL: 'small',
    MEDIUM: 'medium',
    LARGE: 'large',
};

/**
 * Create a button element with the given options.
 *
 * @param {object} options
 * @param {string} options.label - Button text content.
 * @param {string} [options.variant='primary'] - Visual variant.
 * @param {string} [options.size='medium'] - Button size.
 * @param {boolean} [options.isLoading=false] - Show loading spinner.
 * @param {boolean} [options.isDisabled=false] - Disabled state.
 * @param {boolean} [options.isFullWidth=false] - Full width button.
 * @param {function} [options.onClick] - Click handler.
 * @param {string} [options.className] - Additional CSS classes.
 * @param {string} [options.type='button'] - Button type attribute.
 *
 * @returns {HTMLElement} The constructed button element.
 */
function createButton(options) {
    const {
        label = '',
        variant = RESONA_BUTTON_VARIANTS.PRIMARY,
        size = RESONA_BUTTON_SIZES.MEDIUM,
        isLoading = false,
        isDisabled = false,
        isFullWidth = false,
        onClick = null,
        className = '',
        type = 'button',
    } = options;

    const button = document.createElement('button');

    button.type = type;
    button.className = [
        'rs-btn',
        `rs-btn--${variant}`,
        `rs-btn--${size}`,
        isFullWidth ? 'rs-btn--full-width' : '',
        isLoading ? 'rs-btn--loading' : '',
        className,
    ].filter(Boolean).join(' ');

    button.disabled = isDisabled || isLoading;

    if (isLoading) {
        const spinner = document.createElement('span');
        spinner.className = 'rs-btn__spinner';
        spinner.setAttribute('aria-hidden', 'true');
        button.appendChild(spinner);
    }

    const labelSpan = document.createElement('span');
    labelSpan.className = 'rs-btn__label';
    labelSpan.textContent = label;
    button.appendChild(labelSpan);

    if (onClick !== null) {
        button.addEventListener('click', function (event) {
            if (isDisabled || isLoading) {
                return;
            }

            onClick(event);
        });
    }

    return button;
}
