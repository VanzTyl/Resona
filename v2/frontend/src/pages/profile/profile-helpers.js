/**
 * Resona Profile Page Helper Functions
 *
 * Shared element creation utilities for the profile page.
 * v2.1: Extracted from profile.js to comply with 500-line hard limit.
 *
 * @version 2.1.0
 */

/**
 * Create an element with attributes.
 *
 * @param {string} tag - HTML tag name.
 * @param {object} attrs - Attributes: id, className, text, etc.
 * @returns {HTMLElement} The created element.
 */
function createEl(tag, attrs) {
    var el = document.createElement(tag);
    if (!attrs) return el;
    if (attrs.id) el.id = attrs.id;
    if (attrs.className) el.className = attrs.className;
    if (attrs.text) el.textContent = attrs.text;
    if (attrs.type) el.type = attrs.type;
    if (attrs.for) el.setAttribute('for', attrs.for);
    if (attrs.placeholder) el.placeholder = attrs.placeholder;
    if (attrs.maxl) el.maxLength = attrs.maxl;
    if (attrs.name) el.name = attrs.name;
    if (attrs.checked) el.checked = true;
    if (attrs.value !== undefined) el.value = attrs.value;
    return el;
}

/**
 * Create a form input group.
 *
 * @param {object} f - Field config {id, label, type, maxl, hint}.
 * @returns {HTMLElement} The form group.
 */
function createFormField(f) {
    var group = createEl('div', { className: 'form-group' });
    group.appendChild(createEl('label', {
        className: 'form-group__label',
        for: f.id,
        text: f.label,
    }));
    group.appendChild(createEl('input', {
        className: 'form-group__input',
        type: f.type,
        id: f.id,
        maxl: f.maxl,
    }));
    if (f.hint) {
        group.appendChild(createEl('span', {
            className: 'form-group__hint',
            text: f.hint,
        }));
    }
    return group;
}

/**
 * Create a text input field group.
 *
 * @param {string} id - Element ID.
 * @param {string} label - Label text.
 * @param {string} placeholder - Placeholder text.
 * @param {string} maxlength - Max length.
 * @returns {HTMLElement} The form group.
 */
function createTextField(id, label, placeholder, maxlength) {
    var group = createEl('div', { className: 'form-group' });
    group.appendChild(createEl('label', {
        className: 'form-group__label',
        for: id,
        text: label,
    }));
    group.appendChild(createEl('input', {
        className: 'form-group__input',
        type: 'text',
        id: id,
        placeholder: placeholder,
        maxl: maxlength,
    }));
    return group;
}

/**
 * Create a textarea field group.
 *
 * @param {string} id - Element ID.
 * @param {string} label - Label text.
 * @param {string} maxlength - Max length.
 * @param {string} counterId - Optional counter element ID.
 * @param {string} counterText - Optional counter initial text.
 * @returns {HTMLElement} The form group.
 */
function createTextareaField(id, label, maxlength, counterId, counterText) {
    var group = createEl('div', { className: 'form-group' });
    group.appendChild(createEl('label', {
        className: 'form-group__label',
        for: id,
        text: label,
    }));
    var textarea = createEl('textarea', {
        className: 'form-group__input form-group__input--textarea',
        id: id,
        maxl: maxlength,
    });
    group.appendChild(textarea);
    if (counterId) {
        group.appendChild(createEl('span', {
            className: 'character-counter',
            id: counterId,
            text: counterText || '',
        }));
    }
    return group;
}

/**
 * Create the privacy selector section.
 *
 * @returns {HTMLElement} The privacy form group.
 */
function createPrivacySelector() {
    var group = createEl('div', { className: 'form-group' });
    group.appendChild(createEl('label', {
        className: 'form-group__label',
        text: 'Privacy',
    }));

    var selector = createEl('div', {
        className: 'privacy-selector',
        id: 'profile-privacy-selector',
    });

    var options = [
        { value: 'public', label: 'Public', desc: 'Anyone can see your activity' },
        { value: 'friends_only', label: 'Friends Only', desc: 'Only friends can see your activity' },
        { value: 'private', label: 'Private', desc: 'Only you can see your activity' },
    ];

    options.forEach(function (opt) {
        var pLabel = createEl('label', { className: 'privacy-option' });
        if (opt.value === 'friends_only') {
            pLabel.classList.add('privacy-option--selected');
        }
        pLabel.appendChild(createEl('input', {
            type: 'radio',
            name: 'privacy',
            value: opt.value,
            checked: opt.value === 'friends_only',
        }));

        var descDiv = createEl('div');
        var strong = createEl('strong', { text: opt.label });
        descDiv.appendChild(strong);
        descDiv.appendChild(document.createElement('br'));
        var span = createEl('span', { text: opt.desc });
        span.style.fontSize = 'var(--rs-font-size-sm)';
        span.style.color = 'var(--rs-text-dim)';
        descDiv.appendChild(span);

        pLabel.appendChild(descDiv);
        selector.appendChild(pLabel);
    });

    group.appendChild(selector);
    return group;
}

/**
 * Fill a container with children from an array.
 *
 * @param {string} containerId - The container element ID.
 * @param {Array<HTMLElement>} children - Elements to append.
 * @returns {void}
 */
function fillContainer(containerId, children) {
    var container = document.getElementById(containerId);
    if (container === null) return;
    while (container.firstChild !== null) {
        container.removeChild(container.firstChild);
    }
    children.forEach(function (child) {
        container.appendChild(child);
    });
}

/**
 * Validate URL string.
 *
 * @param {string} url - URL to validate.
 * @returns {boolean} True if valid URL.
 */
function isValidUrl(url) {
    try {
        new URL(url);
        return true;
    } catch (_e) {
        return false;
    }
}
