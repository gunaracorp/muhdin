<?php
/**
 * ============================================================================
 * index.php — MUHDIN Shared Hosting Edition · API Router
 * ----------------------------------------------------------------------------
 * Rekonstruksi Task 30 (2026-09-21) — paritas kontrak 1:1 dengan backend
 * Node (src/app/api/**). Murni PHP + PDO SQLite: tanpa Node, tanpa Composer,
 * tanpa MySQL. PHP 7.4+ kompatibel, mulus di PHP 8.x.
 *
 * Arsitektur router:
 *   config.php        → konfigurasi aplikasi
 *   lib.php           → pustaka inti (DB, sesi, guard, rate limit, WA, dst)
 *   nusuk.php         → mesin integrasi Nusuk (katalog izin, sync, webhook)
 *   routes-*.php      → modul rute per domain (auth, content, directory, nusuk)
 *
 * Setiap modul mendefinisikan fungsi routes_<group>(string $method, array $seg)
 * yang mengembalikan TRUE bila request ditangani (output sudah terkirim),
 * FALSE bila bukan domainnya — router mencoba modul berikutnya.
 * ============================================================================
 */

require_once __DIR__ . '/config.php';
require_once __DIR__ . '/lib.php';
require_once __DIR__ . '/nusuk.php';

// ---------------------------------------------------------------------------
// 1) Metode HTTP
// ---------------------------------------------------------------------------
$method = strtoupper($_SERVER['REQUEST_METHOD'] ?? 'GET');

// ---------------------------------------------------------------------------
// 2) Path parsing — toleran terhadap tiga mode pelayanan:
//    a) Apache + .htaccess   : RewriteRule ^api/(.*)$ api/index.php [L]
//       → PATH_INFO bisa kosong; REQUEST_URI tetap "/api/x"
//    b) php -S + router.php  : PATH_INFO di-set eksplisit oleh router.php
//    c) Subfolder cPanel     : "/subdir/api/x" — prefix dihapus toleran
// ---------------------------------------------------------------------------
$path = '';
if (!empty($_SERVER['PATH_INFO'])) {
    $path = (string) $_SERVER['PATH_INFO'];
} else {
    $uri = (string) ($_SERVER['REQUEST_URI'] ?? '/');
    $qpos = strpos($uri, '?');
    if ($qpos !== false) {
        $uri = substr($uri, 0, $qpos);
    }
    $path = $uri;
}
$path = preg_replace('#^/index\.php#', '', $path);   // index.php/x → /x
$path = preg_replace('#^/?api/?#i', '/', $path);     // /api/x → /x
$seg = array_values(array_filter(
    explode('/', trim($path, '/')),
    function ($s) { return $s !== ''; }
));

// ---------------------------------------------------------------------------
// 3) Dispatch ke modul rute — urutan penting:
//    auth (paling spesifik) → nusuk → directory → content (paling umum)
// ---------------------------------------------------------------------------
$modules = array(
    'routes_auth'       => __DIR__ . '/routes-auth.php',
    'routes_nusuk'      => __DIR__ . '/routes-nusuk.php',
    'routes_directory'  => __DIR__ . '/routes-directory.php',
    'routes_content'    => __DIR__ . '/routes-content.php',
);

foreach ($modules as $fn => $file) {
    if (!is_file($file)) {
        continue; // modul opsional boleh absen — router tetap hidup
    }
    require_once $file;
    if ($fn($method, $seg)) {
        return; // ditangani & respons sudah terkirim oleh modul
    }
}

// ---------------------------------------------------------------------------
// 4) Tidak ada modul yang menangani → 404 (bentuk sama dengan Node)
// ---------------------------------------------------------------------------
fail(404, 'Endpoint tidak ditemukan.');
