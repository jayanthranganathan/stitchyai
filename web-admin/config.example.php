<?php
/**
 * Thugil Designers — Admin Panel configuration.
 *
 * Copy this file to `config.php` and fill in the values. Never commit config.php.
 *
 * The database values are the SAME Neon Postgres that the FastAPI backend uses
 * (Railway → API service → Variables → DATABASE_URL). Pull the host/db/user/pass
 * out of that connection string.
 */

return [
    // ── Database (Neon Postgres) ─────────────────────────────────────────────
    'db' => [
        'host'     => 'ep-sweet-star-ao2zy0fa-pooler.c-2.ap-southeast-1.aws.neon.tech',
        'port'     => 5432,
        'dbname'   => 'thugil',
        'user'     => 'neondb_owner',
        'password' => 'npg_Hr6BwzSG1TvP',
        'sslmode'  => 'require',   // Neon requires SSL
    ],

    // ── Admin login ──────────────────────────────────────────────────────────
    // Generate a hash on any PHP CLI:
    //   php -r "echo password_hash('your-strong-password', PASSWORD_DEFAULT), PHP_EOL;"
    // Add as many admins as you like: 'username' => 'bcrypt-hash'.
    'admins' => [
        'admin' => '$2y$10$REPLACE_WITH_GENERATED_BCRYPT_HASH',
    ],

    // Random 32+ char string — used to sign sessions / CSRF. Keep secret.
    'app_secret' => 'CHANGE_ME_to_a_long_random_string',
];
