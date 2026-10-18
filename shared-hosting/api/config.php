<?php
/**
 * ============================================================================
 * config.php — Konfigurasi aplikasi MUHDIN (Edisi Shared Hosting, tanpa Node)
 * ----------------------------------------------------------------------------
 * Rekonstruksi Task 30-a — paritas kontrak Node (2026-09-21).
 *
 * Peran file:
 *   - Satu-satunya tempat konfigurasi deployment backend PHP: lokasi database
 *     SQLite, identitas aplikasi, cookie sesi, pengaturan rate limit, dan
 *     allowlist SiteSetting yang boleh diterjemahkan (SETTING_TRANSLATABLE).
 *   - Di-requir oleh lib.php; tidak membutuhkan ekstensi selain bawaan PHP.
 *
 * Paritas kontrak dengan edisi Node (src/lib/*):
 *   - Cookie sesi              : muhdin_session  (auth.ts → SESSION_COOKIE)
 *   - Masa sesi                : 7 hari          (auth.ts → SESSION_DAYS)
 *   - Rate limit default       : 5 percobaan / 60.000 ms (ratelimit.ts)
 *   - SETTING_TRANSLATABLE     : salinan persis dari translate-engine.ts
 *   - Path database            : data/muhdin.sqlite relatif terhadap root
 *     paket (folder yang memuat api/, data/, index.html, .htaccess).
 * ============================================================================
 */

/* Cegah double-include bila file di-require berulang oleh router. */
if (!defined('MUHDIN_CONFIG_LOADED')) {
    define('MUHDIN_CONFIG_LOADED', '1');

    /* Zona waktu server dipaksa UTC agar epoch-ms dan string ISO-8601 yang
     * ditulis/dibaca identik dengan perilaku Node.js (Date selalu UTC). */
    if (function_exists('date_default_timezone_set')) {
        date_default_timezone_set('UTC');
    }

    /* --------------------------------------------------------------------
     * ROOT PAKET & DATABASE
     * ------------------------------------------------------------------ */
    /** Root paket = folder induk dari api/ (berisi api/, data/, index.html). */
    define('MUHDIN_ROOT', dirname(__DIR__));

    /** Folder tempat file SQLite disimpan (dibuat otomatis bila belum ada). */
    define('MUHDIN_DB_DIR', MUHDIN_ROOT . '/data');

    /** Path database SQLite utama — satu DB untuk seluruh aplikasi. */
    define('MUHDIN_DB_PATH', MUHDIN_DB_DIR . '/muhdin.sqlite');

    /* --------------------------------------------------------------------
     * IDENTITAS APLIKASI
     * ------------------------------------------------------------------ */
    define('MUHDIN_APP_NAME', 'MUHDIN — Masyarakat Umroh Haji Digital Nusantara');
    define('MUHDIN_VERSION', '2.0.0');
    define('MUHDIN_EDITION', 'shared-hosting');

    /* --------------------------------------------------------------------
     * SESI (paritas src/lib/auth.ts)
     * ------------------------------------------------------------------ */
    /** Nama cookie sesi — harus sama dengan yang dipakai frontend CMS. */
    define('MUHDIN_SESSION_COOKIE', 'muhdin_session');

    /** Masa berlaku sesi (hari) — Node: SESSION_DAYS = 7. */
    define('MUHDIN_SESSION_DAYS', 7);

    /**
     * Cookie Secure (hanya dikirim via HTTPS). Node memakai
     * `secure: NODE_ENV === "production"`; di shared hosting production yang
     * sudah HTTPS, ubah ke true. Default false agar preview lokal (http://)
     * tetap bisa login.
     */
    define('MUHDIN_COOKIE_SECURE', false);

    /** Path & SameSite cookie — Node: path "/", sameSite "lax", httpOnly. */
    define('MUHDIN_COOKIE_PATH', '/');
    define('MUHDIN_COOKIE_SAMESITE', 'Lax');

    /* --------------------------------------------------------------------
     * RATE LIMIT (paritas src/lib/ratelimit.ts)
     * Disimpan di tabel SQLite `rate_limit` (bukan memori proses) agar
     * efektif lintas request/proses PHP-FPM/CGI.
     * ------------------------------------------------------------------ */
    /** Maksimum percobaan per bucket per IP dalam satu window. */
    define('MUHDIN_RATE_MAX', 5);

    /** Panjang window rate limit dalam milidetik (60 detik). */
    define('MUHDIN_RATE_WINDOW_MS', 60000);

    /* --------------------------------------------------------------------
     * ALLOWLIST TRANSLASI SITESETTING
     * Salinan persis `SETTING_TRANSLATABLE` dari src/lib/translate-engine.ts.
     * Key identitas/konten/sosmed DIKECUALIKAN (email, telepon, dsb tidak
     * boleh diterjemahkan mesin).
     * ------------------------------------------------------------------ */
    define('MUHDIN_SETTING_TRANSLATABLE', array(
        'heroTitle',
        'heroSubtitle',
        'vision',
        'mission',
        'tagline',
        'nusuk_tagline',
        'nusuk_desc',
        'nusuk_api_note',
    ));

    /* --------------------------------------------------------------------
     * GATEWAY WHATSAPP (paritas src/lib/whatsapp.ts)
     * Provider yang didukung; token & konfigurasi runtime dibaca dari tabel
     * WhatsAppSetting (baris tunggal), bukan dari file ini.
     * ------------------------------------------------------------------ */
    define('MUHDIN_WA_PROVIDERS', 'FONNTE|WABLAS|CUSTOM');

    /** Timeout kirim WhatsApp (detik) — Node: AbortSignal.timeout(10_000). */
    define('MUHDIN_WA_TIMEOUT_SECONDS', 10);

    /* --------------------------------------------------------------------
     * PHP RUNTIME — minimal untuk kebutuhan JSON/UTF-8
     * ------------------------------------------------------------------ */
    if (function_exists('mb_internal_encoding')) {
        mb_internal_encoding('UTF-8');
    }
}
