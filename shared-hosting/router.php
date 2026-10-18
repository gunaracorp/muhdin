<?php
/**
 * router.php — pengujian lokal paket MUHDIN Shared Hosting Edition.
 *
 * Jalankan dari folder paket (yang berisi index.html + api/ + data/):
 *
 *     php -S 127.0.0.1:3010 -t deploy/muhdin-shared-hosting shared-hosting/router.php
 *
 * Perilaku:
 *   - File/folder nyata      → dilayani langsung (return false)
 *   - /api/*                 → api/index.php (PATH_INFO di-set)
 *   - Selain itu             → index.html (SPA hash routing)
 * Rekonstruksi Task 30 (2026-09-21).
 *
 * CATATAN: router ini TIDAK ikut dalam paket zip (pengujian lokal saja);
 * __DIR__ menunjuk folder sumber proyek, maka docroot diambil dari
 * DOCUMENT_ROOT (folder -t) — bukan __DIR__.
 */

$docroot = rtrim((string) ($_SERVER['DOCUMENT_ROOT'] ?? getcwd()), '/');
if ($docroot === '' || !is_file($docroot . '/index.html')) {
    $docroot = getcwd(); // fallback: cwd adalah folder paket
}

$uri = parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH) ?: '/';
$file = $docroot . $uri;

if ($uri !== '/' && is_file($file)) {
    return false; // aset statis: css, js, gambar, zip, dll.
}

if (preg_match('#^/?api(/|$)#i', $uri)) {
    $_SERVER['PATH_INFO'] = preg_replace('#^/?api#i', '', $uri);
    $_SERVER['SCRIPT_NAME'] = '/api/index.php';
    require $docroot . '/api/index.php';
    return true;
}

if (is_dir($file)) {
    return false; // biarkan php -S melayani index folder bila ada
}

// SPA fallback — frontend statis ber-hash-routing selalu kembali ke index.html
$_SERVER['PATH_INFO'] = '/';
require $docroot . '/index.html';
return true;
