# Thugil Designers — PHP Admin Panel

A standalone PHP admin panel that talks **directly to the same Neon Postgres**
the FastAPI app uses. Built to drop onto your existing IONOS PHP hosting.

It manages:

- **Orders** — approve placed orders (`placed → confirmed`), assign a tailor
  (`confirmed → assigned`), and mark delivered (awards customer credits).
- **Approvals** — approve/reject tailors and delivery partners
  (`under_review → approved/rejected`).
- **Dashboard** — live counts of everything that needs attention.

The actions replicate the backend's `AdminService` logic exactly (status
transitions, the assignment record, and the credit-earn-on-delivery hook), so
the panel and the app stay consistent.

---

## Requirements

- PHP **8.0+** with the **`pdo_pgsql`** extension enabled
- Outbound network access to Neon (port 5432, SSL)

Check the extension on your host:
```php
<?php var_dump(extension_loaded('pdo_pgsql')); // must be true
```
On IONOS, enable PostgreSQL/PDO in the hosting control panel if it's off, or
pick a PHP version that bundles it.

---

## Setup

1. **Create the config** from the template:
   ```bash
   cp config.example.php config.php
   ```

2. **Fill in `config.php`:**
   - `db` — host / dbname / user / password from Railway's `DATABASE_URL`
     (the Neon connection string). Keep `sslmode => 'require'`.
   - `admins` — generate a bcrypt hash for each admin:
     ```bash
     php -r "echo password_hash('your-strong-password', PASSWORD_DEFAULT), PHP_EOL;"
     ```
     Paste it as `'username' => '<hash>'`.
   - `app_secret` — any long random string.

3. **Syntax-check before uploading** (optional but recommended):
   ```bash
   for f in *.php lib/*.php; do php -l "$f"; done
   ```

---

## Hosting on IONOS (alongside your existing site)

Your existing Thugil site lives in the web root (e.g. `/`). Put the panel in a
**subfolder** so it's reachable at `https://yourdomain.com/admin/`.

1. In IONOS **File Manager** or via **SFTP**, create a folder `admin/` under
   your web root (e.g. `htdocs/admin` or `/clickandbuilds/.../admin`).
2. Upload the **contents** of this `web-admin/` directory into `admin/`:
   ```
   admin/
   ├── .htaccess
   ├── config.php          ← the one you filled in (do NOT upload config.example only)
   ├── index.php
   ├── login.php
   ├── logout.php
   ├── orders.php
   ├── approvals.php
   ├── assets/style.css
   └── lib/{db,auth,helpers}.php
   ```
3. Visit `https://yourdomain.com/admin/` → you'll get the login screen.

The included **`.htaccess`** already:
- blocks direct access to `config.php` and the `lib/` includes,
- forces HTTPS,
- defaults the folder to the login page.

> If IONOS uses Nginx instead of Apache for your plan, `.htaccess` is ignored —
> tell me and I'll give you the equivalent Nginx `location` rules. (Most IONOS
> shared/PHP plans are Apache, so `.htaccess` works.)

---

## Security notes

- `config.php` is gitignored and `.htaccess`-blocked — never commit or expose it.
- Auth is session-based with bcrypt password verification + CSRF tokens on every
  action.
- All DB access uses prepared statements; all output is HTML-escaped.
- Use a strong admin password and keep the panel on HTTPS only.

---

## What it does NOT do (yet)

- It does not send push notifications when you approve/assign (the app's FCM
  hook is backend-only). The status changes are reflected in the app on next refresh.
- It's read/write on the core tables only — it doesn't touch AI generation or
  payments. Ask if you want those surfaced too.
