# ========================================
# Resona Backend — Dockerfile
# Base: PHP 8.2 Apache
# Target: Render deployment
# ========================================

FROM php:8.2-apache

# === Install system dependencies (SSL certs for Spotify API calls) ===
RUN apt-get update && apt-get install -y ca-certificates curl && rm -rf /var/lib/apt/lists/*

# === Install required PHP extensions ===
RUN docker-php-ext-install pdo pdo_mysql && docker-php-ext-enable pdo pdo_mysql

# === Enable Apache modules ===
RUN a2enmod rewrite headers

# === Copy application source directly into document root ===
COPY src/ /var/www/html/

# === Tell Apache to serve index.php for / requests ===
# (Not all images include index.php in DirectoryIndex by default)
RUN echo "DirectoryIndex index.php" >> /etc/apache2/apache2.conf

# === Enable .htaccess overrides (needed for URL rewriting) ===
RUN sed -i 's/AllowOverride None/AllowOverride All/g' /etc/apache2/apache2.conf

# === Set proper permissions ===
RUN chown -R www-data:www-data /var/www/html && chmod -R 755 /var/www/html

# === Expose port 80 ===
EXPOSE 80

# === Health check (uses index.php directly, no rewrite needed) ===
HEALTHCHECK --interval=30s --start-period=10s --retries=3 \
    CMD curl -f http://localhost/index.php || exit 1

# === Start Apache ===
CMD ["apache2-foreground"]
