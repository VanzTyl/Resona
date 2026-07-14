# ========================================
# Resona Backend — Dockerfile
# Base: PHP 8.2 Apache
# Target: Render deployment
# ========================================

FROM php:8.2-apache

# === Install required PHP extensions ===
RUN docker-php-ext-install pdo pdo_mysql && docker-php-ext-enable pdo pdo_mysql

# === Enable Apache modules ===
RUN a2enmod rewrite headers

# === [ORDER MATTERS] Enable AllowOverride BEFORE document root changes ===
# The subsequent sed commands rename the <Directory /var/www/> path to
# /var/www/html/src/, so we must set AllowOverride first while the
# original path string still exists.
RUN sed -i '/<Directory \/var\/www\/>/,/<\/Directory>/ s/AllowOverride None/AllowOverride All/' /etc/apache2/apache2.conf

# === Set document root to src/ (where index.php lives) ===
ENV APACHE_DOCUMENT_ROOT=/var/www/html/src
RUN sed -ri -e 's!/var/www/html!${APACHE_DOCUMENT_ROOT}!g' /etc/apache2/sites-available/*.conf
RUN sed -ri -e 's!/var/www/!${APACHE_DOCUMENT_ROOT}!g' /etc/apache2/apache2.conf /etc/apache2/conf-available/*.conf

# === Copy application source ===
WORKDIR /var/www/html
COPY . .

# === Copy .htaccess for URL rewriting ===
COPY src/.htaccess /var/www/html/src/.htaccess

# === Set proper permissions ===
RUN chown -R www-data:www-data /var/www/html \
    && chmod -R 755 /var/www/html

# === Expose port 80 ===
EXPOSE 80

# === Health check ===
HEALTHCHECK --interval=30s --start-period=5s --retries=3 \
    CMD curl -f http://localhost/api/auth/spotify/login || exit 1

# === Start Apache ===
CMD ["apache2-foreground"]
