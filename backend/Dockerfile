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

# === Copy application source directly into document root ===
# (no fragile sed-based document root changes)
COPY src/ /var/www/html/

# === Set up URL rewriting in Apache config (more reliable than .htaccess) ===
RUN { \
      echo '<Directory /var/www/html/>'; \
      echo '    Options -Indexes'; \
      echo '    AllowOverride None'; \
      echo '    RewriteEngine On'; \
      echo '    RewriteCond %{REQUEST_FILENAME} !-f'; \
      echo '    RewriteCond %{REQUEST_FILENAME} !-d'; \
      echo '    RewriteRule ^(.*)$ index.php [QSA,L]'; \
      echo '</Directory>'; \
    } >> /etc/apache2/apache2.conf

# === Set proper permissions ===
RUN chown -R www-data:www-data /var/www/html && chmod -R 755 /var/www/html

# === Expose port 80 ===
EXPOSE 80

# === Health check ===
HEALTHCHECK --interval=30s --start-period=5s --retries=3 \
    CMD curl -f http://localhost/api/auth/spotify/login || exit 1

# === Start Apache ===
CMD ["apache2-foreground"]
