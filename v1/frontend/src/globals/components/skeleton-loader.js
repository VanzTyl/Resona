/**
 * Resona Skeleton Loader Component
 * 
 * Placeholder loading states for async content.
 *
 * @version 1.0.0
 */

const SKELETON_VARIANTS = {
    TEXT: 'text',
    CARD: 'card',
    CIRCLE: 'circle',
    RECTANGLE: 'rectangle',
};

/**
 * Create a skeleton loader placeholder element.
 *
 * @param {object} options
 * @param {string} [options.variant='text'] - Skeleton shape variant.
 * @param {string} [options.width] - Custom width (e.g., '100%', '200px').
 * @param {string} [options.height] - Custom height.
 * @param {number} [options.count=1] - Number of skeleton items.
 * @param {string} [options.className] - Additional classes.
 *
 * @returns {HTMLElement} The skeleton container.
 */
function createSkeleton(options) {
    const {
        variant = SKELETON_VARIANTS.TEXT,
        width = null,
        height = null,
        count = 1,
        className = '',
    } = options;

    const container = document.createElement('div');
    container.className = [
        'rs-skeleton',
        'rs-skeleton--' + variant,
        className,
    ].filter(Boolean).join(' ');

    container.setAttribute('aria-hidden', 'true');

    for (let i = 0; i < count; i++) {
        const item = document.createElement('div');
        item.className = 'rs-skeleton__item';
        item.classList.add('rs-skeleton__item--' + variant);

        if (width !== null) {
            item.style.width = width;
        }

        if (height !== null) {
            item.style.height = height;
        }

        container.appendChild(item);
    }

    return container;
}

/**
 * Create a skeleton card matching the feed card layout.
 *
 * @returns {HTMLElement} The skeleton card element.
 */
function createSkeletonCard() {
    const card = document.createElement('div');
    card.className = 'feed-card feed-card--skeleton';
    card.setAttribute('aria-hidden', 'true');

    const header = document.createElement('div');
    header.className = 'feed-card__header';

    const avatarSkeleton = document.createElement('div');
    avatarSkeleton.className = 'rs-skeleton__item rs-skeleton__item--circle';
    avatarSkeleton.style.width = '40px';
    avatarSkeleton.style.height = '40px';

    const textGroup = document.createElement('div');
    textGroup.className = 'rs-skeleton__group';

    const nameSkeleton = document.createElement('div');
    nameSkeleton.className = 'rs-skeleton__item rs-skeleton__item--text';
    nameSkeleton.style.width = '120px';
    nameSkeleton.style.height = '16px';

    const usernameSkeleton = document.createElement('div');
    usernameSkeleton.className = 'rs-skeleton__item rs-skeleton__item--text';
    usernameSkeleton.style.width = '80px';
    usernameSkeleton.style.height = '12px';

    textGroup.appendChild(nameSkeleton);
    textGroup.appendChild(usernameSkeleton);

    header.appendChild(avatarSkeleton);
    header.appendChild(textGroup);

    const artSkeleton = document.createElement('div');
    artSkeleton.className = 'rs-skeleton__item rs-skeleton__item--rectangle';
    artSkeleton.style.width = '100%';
    artSkeleton.style.height = '200px';

    const trackSkeleton = document.createElement('div');
    trackSkeleton.className = 'rs-skeleton__item rs-skeleton__item--text';
    trackSkeleton.style.width = '70%';
    trackSkeleton.style.height = '16px';
    trackSkeleton.style.marginTop = '12px';

    card.appendChild(header);
    card.appendChild(artSkeleton);
    card.appendChild(trackSkeleton);

    return card;
}
