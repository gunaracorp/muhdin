<?php
/**
 * ============================================================================
 * routes-auth.php — Modul rute AUTH & ADMINISTRASI (Edisi Shared Hosting)
 * ----------------------------------------------------------------------------
 * Rekonstruksi Task 30-b-1 (2026-09-21) — paritas kontrak 1:1 dengan backend
 * Node (src/app/api/**) untuk domain auth, users, audit, health, stats,
 * settings, translations, dan whatsapp. Murni PHP 7.4+ (tanpa enum/match/
 * named args), seluruh akses data via helper lib.php, respons JSON via
 * ok()/fail() (bentuk persis Node: fail → {"error": msg}).
 *
 * Domain rute modul ini (segmen path TANPA prefix /api):
 *   GET    auth/me                 — sesi aktif → {user} | {user:null}
 *   POST   auth/login              — rate limit 5/menit per IP+email (bucket "login")
 *   POST   auth/logout             — hapus sesi + catat audit LOGOUT
 *   PUT    auth/password           — ganti password sendiri (alias POST utk
 *                                    kompatibilitas kontrak Task 30-b-1)
 *   GET    users                   — daftar admin (hanya SUPER_ADMIN)
 *   POST   users                   — tambah admin (hanya SUPER_ADMIN)
 *   PATCH  users/{id}              — ubah admin (alias PUT)
 *   DELETE users/{id}              — hapus admin
 *   GET    audit                   — log audit (hanya SUPER_ADMIN), ?take=
 *   GET    health                  — healthcheck (bentuk persis Node)
 *   GET    stats                   — agregasi dashboard (admin)
 *   GET    settings                — peta SiteSetting publik + terjemahan
 *   PUT    settings                — simpan SiteSetting (SUPER_ADMIN/ADMIN)
 *   GET    translations            — status cakupan terjemahan + job
 *   POST   translations            — mulai job terjemahan massal
 *   GET    whatsapp                — konfigurasi WA (token dimasking)
 *   PUT    whatsapp                — simpan konfigurasi WA (alias POST)
 *   POST   whatsapp/test           — kirim pesan uji + catat status terakhir
 *
 * Guard & teks error direplikasi PERSIS dari file route Node terkait —
 * termasuk pengecualian users/{id}: Node memakai requireSuperAdmin() langsung
 * sehingga anonim pun menerima 403 "Hanya Super Admin yang dapat mengelola
 * akun admin." (bukan 401 seperti guardSuperAdmin() pada users/ & audit/).
 * ============================================================================
 */

require_once __DIR__ . '/lib.php';

if (!defined('MUHDIN_AUTH_ROLES')) {
    /** Paritas ROLES src/lib/roles.ts (Task 15-c/17). */
    define('MUHDIN_AUTH_ROLES', array('SUPER_ADMIN', 'ADMIN', 'VERIFIKATOR', 'EDITOR'));
}

/* ===========================================================================
 * DISPATCHER — dipanggil index.php. Return FALSE bila bukan domain modul.
 * ========================================================================= */

/**
 * @param string $method Metode HTTP (sudah uppercase).
 * @param array  $seg    Segmen path tanpa prefix /api.
 * @return bool TRUE bila request ditangani (respons sudah terkirim).
 */
function routes_auth(string $method, array $seg): bool {
    $n = count($seg);
    $head = $n > 0 ? $seg[0] : '';

    /* ---- /api/auth/* ---- */
    if ($head === 'auth') {
        if ($n === 2 && $seg[1] === 'me') {
            if ($method === 'GET') { routes_auth_me(); return true; }
            return routes_auth_405();
        }
        if ($n === 2 && $seg[1] === 'login') {
            if ($method === 'POST') { routes_auth_login(); return true; }
            return routes_auth_405();
        }
        if ($n === 2 && $seg[1] === 'logout') {
            if ($method === 'POST') { routes_auth_logout(); return true; }
            return routes_auth_405();
        }
        if ($n === 2 && $seg[1] === 'password') {
            // Node: PUT — alias POST diterima (kontrak Task 30-b-1).
            if ($method === 'PUT' || $method === 'POST') { routes_auth_password(); return true; }
            return routes_auth_405();
        }
        return false; // /api/auth/<lain> → bukan domain modul ini
    }

    /* ---- /api/users ---- */
    if ($head === 'users') {
        if ($n === 1) {
            if ($method === 'GET') { routes_auth_users_list(); return true; }
            if ($method === 'POST') { routes_auth_users_create(); return true; }
            return routes_auth_405();
        }
        if ($n === 2) {
            // Node: PATCH — alias PUT diterima (kontrak Task 30-b-1).
            if ($method === 'PATCH' || $method === 'PUT') { routes_auth_users_update($seg[1]); return true; }
            if ($method === 'DELETE') { routes_auth_users_delete($seg[1]); return true; }
            return routes_auth_405();
        }
        return false;
    }

    /* ---- /api/audit ---- */
    if ($head === 'audit' && $n === 1) {
        if ($method === 'GET') { routes_auth_audit(); return true; }
        return routes_auth_405();
    }

    /* ---- /api/health ---- */
    if ($head === 'health' && $n === 1) {
        if ($method === 'GET') { routes_auth_health(); return true; }
        return routes_auth_405();
    }

    /* ---- /api/stats ---- */
    if ($head === 'stats' && $n === 1) {
        if ($method === 'GET') { routes_auth_stats(); return true; }
        return routes_auth_405();
    }

    /* ---- /api/settings ---- */
    if ($head === 'settings' && $n === 1) {
        if ($method === 'GET') { routes_auth_settings_get(); return true; }
        if ($method === 'PUT') { routes_auth_settings_put(); return true; }
        return routes_auth_405();
    }

    /* ---- /api/translations ---- */
    if ($head === 'translations' && $n === 1) {
        if ($method === 'GET') { routes_auth_translations_get(); return true; }
        if ($method === 'POST') { routes_auth_translations_post(); return true; }
        return routes_auth_405();
    }

    /* ---- /api/whatsapp[/test] ---- */
    if ($head === 'whatsapp') {
        if ($n === 1) {
            if ($method === 'GET') { routes_auth_wa_get(); return true; }
            // Node: PUT — alias POST diterima (kontrak Task 30-b-1).
            if ($method === 'PUT' || $method === 'POST') { routes_auth_wa_put(); return true; }
            return routes_auth_405();
        }
        if ($n === 2 && $seg[1] === 'test') {
            // Node/kontrak CMS: POST — alias PUT diterima (kontrak Task 30-b-1).
            if ($method === 'POST' || $method === 'PUT') { routes_auth_wa_test(); return true; }
            return routes_auth_405();
        }
        return false;
    }

    return false;
}

/** Path dikenal tetapi metode tidak didukung → 405 body kosong (paritas Next.js). */
function routes_auth_405(): bool {
    if (!headers_sent()) {
        http_response_code(405);
    }
    return true;
}

/* ===========================================================================
 * KONVERSI NILAI — semantik JavaScript String(x) utk data JSON.
 * ========================================================================= */

/** String(x) gaya Node: null → "null", true/false → "true"/"false". */
function routes_auth_js_string($v) {
    if ($v === null) {
        return 'null';
    }
    if (is_bool($v)) {
        return $v ? 'true' : 'false';
    }
    if (is_array($v)) {
        return (string) json_encode($v);
    }
    return (string) $v;
}

/** Panjang string gaya JS .length (≈ jumlah karakter, bukan byte). */
function routes_auth_js_length($s) {
    return function_exists('mb_strlen') ? mb_strlen((string) $s) : strlen((string) $s);
}

/* ===========================================================================
 * AUTH — paritas auth/{me,login,logout,password}/route.ts
 * ========================================================================= */

/** GET auth/me — sesi aktif: {user:{id,email,name,role,isActive}}; tanpa sesi: 200 {user:null} (persis Node). */
function routes_auth_me() {
    $user = current_user();
    if (!$user) {
        ok(array('user' => null));
    }
    ok(array('user' => array(
        'id'       => $user['id'],
        'email'    => $user['email'],
        'name'     => $user['name'],
        'role'     => $user['role'],
        'isActive' => (bool) $user['isActive'],
    )));
}

/** POST auth/login — rate limit 5/menit per IP+email, verifikasi bcrypt, buat sesi, catat audit LOGIN. */
function routes_auth_login() {
    try {
        $body = request_json();
        if (!is_array($body)) {
            // Node: await req.json() melempar pada body bukan JSON → catch → 500.
            fail('Terjadi kesalahan pada server.', 500);
        }
        $email = trim(strtolower(routes_auth_js_string(isset($body['email']) && $body['email'] ? $body['email'] : '')));
        $password = routes_auth_js_string(isset($body['password']) && $body['password'] ? $body['password'] : '');
        if ($email === '' || $password === '') {
            fail('Email dan password wajib diisi.');
        }

        // Task 30-b-1 — rate limit 5/menit per IP+email (bucket "login").
        // auto-reject: 429 {"error":"Terlalu banyak percobaan. Coba lagi beberapa saat."}
        rate_limit('login:' . $email);

        $user = db_one('SELECT * FROM "User" WHERE "email" = ? LIMIT 1', array($email), 'User');
        if (!$user || !verify_password($password, $user['password'])) {
            fail('Email atau password salah.', 401);
        }
        // Multi-admin (Task 15-c): akun nonaktif ditolak.
        if (!(bool) $user['isActive']) {
            fail('Akun Anda dinonaktifkan. Hubungi Super Admin.', 403);
        }
        create_session($user['id']); // cookie muhdin_session diurus lib
        try {
            db_update('User', array('lastLoginAt' => now_ms()), '"id" = ?', array($user['id'])); // paritas .catch(()=>{})
        } catch (Exception $e) {
            /* kegagalan lastLoginAt tidak menggagalkan login */
        }
        log_audit($user, 'LOGIN', 'Auth', $user['id'], null);
        ok(array('user' => array(
            'id'       => $user['id'],
            'email'    => $user['email'],
            'name'     => $user['name'],
            'role'     => $user['role'],
            'isActive' => (bool) $user['isActive'],
        )));
    } catch (Exception $e) {
        fail('Terjadi kesalahan pada server.', 500);
    }
}

/** POST auth/logout — hapus sesi (db + cookie) lalu catat audit LOGOUT. */
function routes_auth_logout() {
    $user = current_user(); // identitas diambil SEBELUM sesi dihapus
    destroy_session();
    if ($user) {
        log_audit($user, 'LOGOUT', 'Auth', $user['id'], null);
    }
    ok(array('success' => true));
}

/**
 * PUT auth/password — ganti password akun yang sedang login.
 * Wajib password lama; semua sesi LAIN dicabut (sesi saat ini dipertahankan) —
 * bentuk respons & teks error persis Node (termasuk pesan zod untuk body
 * bukan objek, zod v4: "Invalid input: expected object, received null").
 */
function routes_auth_password() {
    try {
        $user = guard_admin(); // 401 "Tidak diizinkan — silakan login sebagai admin."

        $body = request_json(); // paritas req.json().catch(() => null)
        if (!is_array($body)) {
            fail('Invalid input: expected object, received null.');
        }
        $currentPassword = routes_auth_js_string(isset($body['currentPassword']) ? $body['currentPassword'] : '');
        $newPassword = routes_auth_js_string(isset($body['newPassword']) ? $body['newPassword'] : '');
        // Urutan pesan zod: currentPassword dulu, lalu newPassword.
        if ($currentPassword === '') {
            fail('Password saat ini wajib diisi.');
        }
        if (routes_auth_js_length($newPassword) < 8) {
            fail('Password baru minimal 8 karakter.');
        }

        $fresh = db_one('SELECT * FROM "User" WHERE "id" = ? LIMIT 1', array($user['id']), 'User');
        if (!$fresh) {
            fail('Akun tidak ditemukan.', 404);
        }
        if (!verify_password($currentPassword, $fresh['password'])) {
            fail('Password saat ini salah.');
        }
        if (verify_password($newPassword, $fresh['password'])) {
            fail('Password baru sama dengan password lama.');
        }

        $currentToken = isset($_COOKIE[MUHDIN_SESSION_COOKIE]) ? (string) $_COOKIE[MUHDIN_SESSION_COOKIE] : '';
        db_update('User', array('password' => hash_password($newPassword)), '"id" = ?', array($fresh['id']));
        // Paritas deleteMany({ userId, token: { not: currentToken } }).
        db_delete('Session', '"userId" = ? AND "token" != ?', array($fresh['id'], $currentToken));

        log_audit($user, 'PASSWORD_CHANGE', 'Auth', $fresh['id'], null);
        ok(array(
            'ok'      => true,
            'message' => 'Password berhasil diperbarui. Semua perangkat lain telah dikeluarkan.',
        ));
    } catch (Exception $e) {
        fail('Terjadi kesalahan pada server.', 500);
    }
}

/* ===========================================================================
 * USERS — paritas users/route.ts + users/[id]/route.ts (hanya SUPER_ADMIN)
 * ========================================================================= */

/** Kolom SELECT identik Prisma `select` pada route users Node. */
function routes_auth_user_cols() {
    return '"id", "email", "name", "role", "isActive", "lastLoginAt", "createdAt"';
}

/** Jumlah Super Admin AKTIF selain $excludeId — paritas otherActiveSuperCount(). */
function routes_auth_other_active_super($excludeId) {
    return db_count('User', '"role" = ? AND "isActive" = 1 AND "id" != ?', array('SUPER_ADMIN', $excludeId));
}

/** GET users — daftar seluruh admin, urut createdAt ASC (hanya SUPER_ADMIN). */
function routes_auth_users_list() {
    try {
        guard_super(); // guardSuperAdmin(): 401 anonim / 403 non-super
        $users = db_all(
            'SELECT ' . routes_auth_user_cols() . ' FROM "User" ORDER BY "createdAt" ASC',
            array(),
            'User'
        );
        ok($users);
    } catch (Exception $e) {
        fail('Gagal memuat daftar admin.', 500);
    }
}

/** POST users — tambah admin baru (hanya SUPER_ADMIN), password bcrypt, audit CREATE. */
function routes_auth_users_create() {
    try {
        $me = guard_super();
        $body = request_json();
        if (!is_array($body)) {
            fail('Gagal menambahkan admin.', 500); // Node: req.json() lempar → catch
        }
        $name = trim(routes_auth_js_string(isset($body['name']) && $body['name'] ? $body['name'] : ''));
        $email = trim(strtolower(routes_auth_js_string(isset($body['email']) && $body['email'] ? $body['email'] : '')));
        $password = routes_auth_js_string(isset($body['password']) && $body['password'] ? $body['password'] : '');
        $role = routes_auth_js_string(isset($body['role']) && $body['role'] ? $body['role'] : 'EDITOR');

        if ($name === '') {
            fail('Nama wajib diisi.');
        }
        if (!preg_match('/^[^@\s]+@[^@\s]+\.[^@\s]+$/', $email)) {
            fail('Format email tidak valid.');
        }
        if (routes_auth_js_length($password) < 8) {
            fail('Password minimal 8 karakter.');
        }
        if (!in_array($role, MUHDIN_AUTH_ROLES, true)) {
            fail('Peran tidak valid.');
        }
        $existing = db_val('SELECT 1 FROM "User" WHERE "email" = ? LIMIT 1', array($email));
        if ($existing) {
            fail('Email sudah terdaftar.', 409);
        }

        $id = db_insert('User', array(
            'name'     => $name,
            'email'    => $email,
            'password' => hash_password($password), // bcrypt (edisi PHP)
            'role'     => $role,
        ));
        $created = db_one(
            'SELECT ' . routes_auth_user_cols() . ' FROM "User" WHERE "id" = ? LIMIT 1',
            array($id),
            'User'
        );
        // Task 18 — jejak audit pembuatan akun admin (identitas = pembuat).
        log_audit($me, 'CREATE', 'User', $created['id'], $created['name'] . ' (' . $created['role'] . ')');
        ok($created, 201);
    } catch (Exception $e) {
        fail('Gagal menambahkan admin.', 500);
    }
}

/**
 * PATCH users/{id} — ubah nama/peran/status/password.
 * Guard persis Node: requireSuperAdmin() langsung → anonim pun 403
 * "Hanya Super Admin yang dapat mengelola akun admin."
 * Pagar: tak bisa menurunkan/nonaktifkan diri; Super Admin aktif terakhir
 * dilindungi; nonaktif/reset password mencabut seluruh sesi target.
 */
function routes_auth_users_update($id) {
    try {
        $me = current_user();
        if (!$me || $me['role'] !== 'SUPER_ADMIN') {
            fail('Hanya Super Admin yang dapat mengelola akun admin.', 403);
        }
        $body = request_json();
        if (!is_array($body)) {
            fail('Gagal memperbarui akun admin.', 500); // Node: req.json() lempar → catch
        }
        $target = db_one('SELECT * FROM "User" WHERE "id" = ? LIMIT 1', array($id), 'User');
        if (!$target) {
            fail('Akun tidak ditemukan.', 404);
        }

        $data = array();

        if (array_key_exists('name', $body)) {
            $name = trim(routes_auth_js_string($body['name']));
            if ($name === '') {
                fail('Nama tidak boleh kosong.');
            }
            $data['name'] = $name;
        }

        if (array_key_exists('password', $body) && routes_auth_js_string($body['password']) !== '') {
            $password = routes_auth_js_string($body['password']);
            if (routes_auth_js_length($password) < 8) {
                fail('Password minimal 8 karakter.');
            }
            $data['password'] = hash_password($password);
        }

        if (array_key_exists('role', $body) && routes_auth_js_string($body['role']) !== $target['role']) {
            $role = routes_auth_js_string($body['role']);
            if (!in_array($role, MUHDIN_AUTH_ROLES, true)) {
                fail('Peran tidak valid.');
            }
            if ($id === $me['id']) {
                fail('Anda tidak dapat mengubah peran akun sendiri.');
            }
            if ($target['role'] === 'SUPER_ADMIN' && (bool) $target['isActive'] && $role !== 'SUPER_ADMIN') {
                if (routes_auth_other_active_super($id) === 0) {
                    fail('Minimal harus ada satu Super Admin aktif.');
                }
            }
            $data['role'] = $role;
        }

        if (array_key_exists('isActive', $body) && ((bool) $body['isActive']) !== (bool) $target['isActive']) {
            if ($id === $me['id']) {
                fail('Anda tidak dapat menonaktifkan akun sendiri.');
            }
            if ((bool) $target['isActive'] && $target['role'] === 'SUPER_ADMIN') {
                if (routes_auth_other_active_super($id) === 0) {
                    fail('Minimal harus ada satu Super Admin aktif.');
                }
            }
            $data['isActive'] = ((bool) $body['isActive']) ? 1 : 0;
        }

        if (count($data) === 0) {
            // Tidak ada perubahan → kembalikan baris apa adanya (paritas Node).
            $unchanged = db_one(
                'SELECT ' . routes_auth_user_cols() . ' FROM "User" WHERE "id" = ? LIMIT 1',
                array($id),
                'User'
            );
            ok($unchanged);
        }

        db_update('User', $data, '"id" = ?', array($id));
        // Cabut sesi target ketika dinonaktifkan atau password direset.
        if ((isset($data['isActive']) && ((int) $data['isActive']) === 0) || isset($data['password'])) {
            try {
                revoke_all_for_user($id);
            } catch (Exception $e) {
                /* paritas .catch(() => {}) */
            }
        }

        $updated = db_one(
            'SELECT ' . routes_auth_user_cols() . ' FROM "User" WHERE "id" = ? LIMIT 1',
            array($id),
            'User'
        );
        log_audit($me, 'UPDATE', 'User', $id, $updated['name'] . ' (' . $updated['role'] . ')');
        ok($updated);
    } catch (Exception $e) {
        fail('Gagal memperbarui akun admin.', 500);
    }
}

/** DELETE users/{id} — hapus admin + seluruh sesinya (paritas cascade), audit DELETE. */
function routes_auth_users_delete($id) {
    try {
        $me = current_user();
        if (!$me || $me['role'] !== 'SUPER_ADMIN') {
            fail('Hanya Super Admin yang dapat mengelola akun admin.', 403);
        }
        if ($id === $me['id']) {
            fail('Anda tidak dapat menghapus akun sendiri.');
        }
        $target = db_one('SELECT * FROM "User" WHERE "id" = ? LIMIT 1', array($id), 'User');
        if (!$target) {
            fail('Akun tidak ditemukan.', 404);
        }
        if ($target['role'] === 'SUPER_ADMIN' && (bool) $target['isActive']) {
            if (routes_auth_other_active_super($id) === 0) {
                fail('Minimal harus ada satu Super Admin aktif.');
            }
        }
        // Sesi target dihapus eksplisit (paritas onDelete: Cascade).
        db_delete('Session', '"userId" = ?', array($id));
        db_delete('User', '"id" = ?', array($id));
        log_audit($me, 'DELETE', 'User', $id, $target['name'] . ' (' . $target['role'] . ')');
        ok(array('deleted' => true, 'id' => $id));
    } catch (Exception $e) {
        fail('Gagal menghapus akun admin.', 500);
    }
}

/* ===========================================================================
 * AUDIT — paritas audit/route.ts (hanya SUPER_ADMIN, ?take= 1..500, default 100)
 * ========================================================================= */

function routes_auth_audit() {
    try {
        guard_super();
        $takeRaw = isset($_GET['take']) ? $_GET['take'] : null;
        $take = parse_int_or($takeRaw === null ? null : (string) $takeRaw, 100);
        $take = min(max($take, 1), 500);
        $logs = db_all(
            'SELECT * FROM "AuditLog" ORDER BY "createdAt" DESC LIMIT ' . (int) $take,
            array(),
            'AuditLog'
        );
        ok($logs);
    } catch (Exception $e) {
        fail('Gagal memuat log audit.', 500);
    }
}

/* ===========================================================================
 * HEALTH — paritas health/route.ts (bentuk JSON persis; status 200/503)
 * ========================================================================= */

function routes_auth_health() {
    $t0 = microtime(true);
    $dbOk = false;
    $dbLatencyMs = 0;
    $dbError = null;
    try {
        db_val('SELECT 1');
        $dbOk = true;
        $dbLatencyMs = (int) round((microtime(true) - $t0) * 1000);
    } catch (Exception $e) {
        $dbError = function_exists('mb_substr') ? mb_substr((string) $e->getMessage(), 0, 200) : substr((string) $e->getMessage(), 0, 200);
    }

    $reqTime = isset($_SERVER['REQUEST_TIME_FLOAT']) ? (float) $_SERVER['REQUEST_TIME_FLOAT'] : $t0;
    json_out(array(
        'ok'        => $dbOk,
        'service'   => 'muhdin.web.id',
        'checks'    => array(
            'database' => array('ok' => $dbOk, 'latencyMs' => $dbLatencyMs, 'error' => $dbError),
        ),
        'runtime'   => array(
            'node'     => 'PHP ' . PHP_VERSION,      // runtime asli edisi PHP
            'nodeEnv'  => MUHDIN_EDITION,           // paritas NODE_ENV
            'platform' => php_uname('s') . '-' . php_uname('m'),
            'uptimeSec' => max(0, (int) round(microtime(true) - $reqTime)),
            'memoryMb'  => (int) round(memory_get_usage(true) / (1024 * 1024)),
        ),
        'timestamp' => iso_from_ms(now_ms()),
    ), $dbOk ? 200 : 503);
}

/* ===========================================================================
 * STATS — paritas stats/route.ts (guard admin, agregasi count seluruh tabel)
 * ========================================================================= */

function routes_auth_stats() {
    try {
        guard_admin();

        $articles = db_count('Article');
        $tutorials = db_count('Tutorial');
        $members = db_count('Member');
        $pendingMembers = db_count('Member', '"status" = ?', array('PENDING'));
        $unreadMessages = db_count('ContactMessage', '"status" = ?', array('UNREAD'));
        $pendingApplications = db_count('MembershipApplication', '"status" = ?', array('PENDING'));
        $unreadComplaints = db_count('Complaint', '"status" = ?', array('UNREAD')); // Task 18
        $subscribers = db_count('Subscriber'); // Task 18
        $testimonials = db_count('Testimonial');
        $faqs = db_count('Faq');
        $ecosystems = db_count('Ecosystem');

        // totalViews = Σ views(Article) + Σ views(Tutorial); byCategory urut
        // kemunculan pertama (paritas Map + findMany tanpa orderBy).
        $totalViews = (int) db_val('SELECT COALESCE(SUM("views"), 0) FROM "Tutorial"');
        $catMap = array();
        foreach (db_all('SELECT "views", "category" FROM "Article"') as $a) {
            $totalViews += (int) $a['views'];
            $c = (string) $a['category'];
            $catMap[$c] = (isset($catMap[$c]) ? $catMap[$c] : 0) + 1;
        }
        $byCategory = array();
        foreach ($catMap as $c => $cnt) {
            $byCategory[] = array('category' => $c, 'count' => $cnt);
        }

        // memberByType — groupBy type (urut kemunculan pertama).
        $memberByType = array();
        foreach (db_all('SELECT "type", COUNT(*) AS "n" FROM "Member" GROUP BY "type" ORDER BY MIN("rowid") ASC') as $m) {
            $memberByType[] = array('type' => (string) $m['type'], 'count' => (int) $m['n']);
        }

        $recentMessages = db_all(
            'SELECT * FROM "ContactMessage" ORDER BY "createdAt" DESC LIMIT 5',
            array(),
            'ContactMessage'
        );
        $recentApplications = db_all(
            'SELECT * FROM "MembershipApplication" ORDER BY "createdAt" DESC LIMIT 5',
            array(),
            'MembershipApplication'
        );

        ok(array(
            'articles'            => $articles,
            'tutorials'           => $tutorials,
            'members'             => $members,
            'pendingMembers'      => $pendingMembers,
            'unreadMessages'      => $unreadMessages,
            'pendingApplications' => $pendingApplications,
            'unreadComplaints'    => $unreadComplaints,
            'subscribers'         => $subscribers,
            'testimonials'        => $testimonials,
            'faqs'                => $faqs,
            'ecosystems'          => $ecosystems,
            'totalViews'          => $totalViews,
            'byCategory'          => $byCategory,
            'memberByType'        => $memberByType,
            'recentMessages'      => $recentMessages,
            'recentApplications'  => $recentApplications,
        ));
    } catch (Exception $e) {
        fail('Gagal memuat statistik dashboard.', 500);
    }
}

/* ===========================================================================
 * SETTINGS — paritas settings/route.ts
 * GET publik: peta {key: value} seluruh SiteSetting + terjemahan ?locale=
 * (hanya kunci allowlist SETTING_TRANSLATABLE yang diterjemahkan — diurus
 * apply_translations()). PUT guard SUPER_ADMIN/ADMIN + audit (kunci saja).
 * ========================================================================= */

function routes_auth_settings_get() {
    try {
        $locale = locale_from_request();
        $settings = db_all('SELECT * FROM "SiteSetting"', array(), 'SiteSetting');
        $localized = apply_translations($settings, 'SiteSetting', $locale, null, array('value'));
        $map = array();
        foreach ($localized as $s) {
            $map[$s['key']] = $s['value'];
        }
        ok($map);
    } catch (Exception $e) {
        fail('Gagal memuat pengaturan.', 500);
    }
}

function routes_auth_settings_put() {
    try {
        $me = guard_role(array('SUPER_ADMIN', 'ADMIN'));
        $body = request_json();
        if (!is_array($body)) {
            fail('Gagal menyimpan pengaturan.', 500); // Node: req.json() lempar → catch
        }
        foreach ($body as $key => $value) {
            $key = (string) $key;
            $val = routes_auth_js_string($value === null ? '' : $value); // paritas String(value ?? "")
            $exists = db_val('SELECT 1 FROM "SiteSetting" WHERE "key" = ? LIMIT 1', array($key));
            if ($exists) {
                db_update('SiteSetting', array('value' => $val), '"key" = ?', array($key));
            } else {
                db_insert('SiteSetting', array('key' => $key, 'value' => $val));
            }
        }
        // Task 18 — jejak audit perubahan pengaturan (hanya nama kunci).
        $keys = array();
        foreach (array_keys($body) as $k) {
            $keys[] = (string) $k;
        }
        $detail = implode(', ', array_slice($keys, 0, 10));
        log_audit($me, 'UPDATE', 'Settings', null,
            function_exists('mb_substr') ? mb_substr($detail, 0, 180) : substr($detail, 0, 180));

        $settings = db_all('SELECT * FROM "SiteSetting"', array(), 'SiteSetting');
        $map = array();
        foreach ($settings as $s) {
            $map[$s['key']] = $s['value'];
        }
        ok($map);
    } catch (Exception $e) {
        fail('Gagal menyimpan pengaturan.', 500);
    }
}

/* ===========================================================================
 * TRANSLATIONS — paritas translations/route.ts + translate-engine.ts
 * GET  : status cakupan {entities, locales, job, entityNames}.
 * POST : mulai job {locale: "en"|"ar", entities?} — edisi PHP TANPA AI: job
 *        ditandai selesai seketika (fallback Indonesia) agar kontrak respons
 *        {started, job} tetap identik dan UI tidak menggantung.
 * ========================================================================= */

/** Daftar entitas terjemahan = urutan ENTITY_REGISTRY Node (= $ENTITY_FIELDS lib.php). */
function routes_auth_entity_names() {
    global $ENTITY_FIELDS;
    return array_keys($ENTITY_FIELDS);
}

/** Muat baris + nilai field per entitas — paritas ENTITY_REGISTRY[..].load(). */
function routes_auth_entity_rows($name) {
    global $ENTITY_FIELDS, $ENTITY_KEY_FIELD;
    $keyField = isset($ENTITY_KEY_FIELD[$name]) ? $ENTITY_KEY_FIELD[$name] : 'id';
    $fields = isset($ENTITY_FIELDS[$name]) ? $ENTITY_FIELDS[$name] : array();

    $cols = array();
    foreach (array_merge(array($keyField), $fields) as $c) {
        $cols[] = '"' . str_replace('"', '', $c) . '"';
    }
    $sql = 'SELECT ' . implode(', ', $cols) . ' FROM "' . str_replace('"', '', $name) . '"';

    // SiteSetting: hanya key pada allowlist yang dihitung (paritas load()).
    $params = array();
    if ($name === 'SiteSetting') {
        $allow = defined('MUHDIN_SETTING_TRANSLATABLE') ? MUHDIN_SETTING_TRANSLATABLE : array();
        if (count($allow) === 0) {
            return array();
        }
        $sql .= ' WHERE "key" IN (' . sql_in(count($allow)) . ')';
        $params = array_values($allow);
    }

    $out = array();
    foreach (db_all($sql, $params) as $r) {
        $values = array();
        foreach ($fields as $f) {
            $values[$f] = isset($r[$f]) ? $r[$f] : null;
        }
        $out[] = array('key' => (string) $r[$keyField], 'values' => $values);
    }
    return $out;
}

/** Status job terjemahan — paritas jobState() Node (proses PHP stateless). */
function routes_auth_job_state() {
    return array(
        'running'     => false,
        'locale'      => null,
        'entity'      => null,
        'entityIndex' => 0,
        'entityTotal' => 0,
        'entityDone'  => 0,
        'done'        => 0,
        'total'       => 0,
        'translated'  => 0,
        'failed'      => 0,
        'errors'      => array(),
        'startedAt'   => null,
        'finishedAt'  => null,
    );
}

function routes_auth_translations_get() {
    try {
        guard_admin();
        $names = routes_auth_entity_names();
        $entities = array();
        foreach ($names as $name) {
            $total = 0;
            foreach (routes_auth_entity_rows($name) as $row) {
                foreach ($row['values'] as $v) {
                    if (is_string($v) && trim($v) !== '') {
                        $total += 1;
                    }
                }
            }
            $counts = array('en' => 0, 'ar' => 0);
            foreach (db_all(
                'SELECT "locale", COUNT(*) AS "n" FROM "ContentTranslation" WHERE "entity" = ? GROUP BY "locale"',
                array($name)
            ) as $r) {
                $counts[$r['locale']] = (int) $r['n']; // paritas counts[r.locale] = _count._all
            }
            $entities[] = array('entity' => $name, 'total' => $total, 'translated' => $counts);
        }
        ok(array(
            'entities'    => $entities,
            'locales'     => array('en', 'ar'),
            'job'         => routes_auth_job_state(),
            'entityNames' => $names,
        ));
    } catch (Exception $e) {
        fail('Gagal membaca status terjemahan.', 500);
    }
}

function routes_auth_translations_post() {
    try {
        guard_admin();
        $body = request_json();
        if (!is_array($body)) {
            $body = array(); // paritas req.json().catch(() => ({}))
        }
        $locale = isset($body['locale']) ? $body['locale'] : null;
        if ($locale !== 'en' && $locale !== 'ar') {
            fail("Locale harus 'en' atau 'ar'.");
        }

        $names = routes_auth_entity_names();
        $entities = null;
        if (isset($body['entities']) && is_array($body['entities'])) {
            $entities = array();
            foreach ($body['entities'] as $e) {
                if (is_string($e) && in_array($e, $names, true)) {
                    $entities[] = $e;
                }
            }
            if (count($entities) === 0) {
                $entities = null;
            }
        }
        $list = ($entities !== null && count($entities) > 0) ? $entities : $names;

        // Edisi PHP tanpa AI: job selesai seketika — kontrak {started, job} utuh.
        $job = routes_auth_job_state();
        $job['locale'] = $locale;
        $job['entityTotal'] = count($list);
        $now = iso_from_ms(now_ms());
        $job['startedAt'] = $now;
        $job['finishedAt'] = $now;
        $job['errors'] = array('Edisi shared hosting tidak memiliki mesin terjemahan AI — terjemahan tetap fallback Indonesia.');

        ok(array('started' => true, 'job' => $job));
    } catch (Exception $e) {
        fail('Gagal memulai terjemahan.', 500);
    }
}

/* ===========================================================================
 * WHATSAPP — paritas whatsapp/route.ts + whatsapp/test (Task 15-d)
 * ========================================================================= */

/** Masking token persis mask() Node: ≤10 char → 2+••••••; else 6+••••••••+4. */
function routes_auth_wa_mask($key) {
    $key = (string) $key;
    if ($key === '') {
        return '';
    }
    if (routes_auth_js_length($key) <= 10) {
        return routes_auth_mb_substr($key, 0, 2) . '••••••';
    }
    return routes_auth_mb_substr($key, 0, 6) . '••••••••' . routes_auth_mb_substr($key, -4);
}

/** mb_substr aman PHP 7.4 (fallback substr). */
function routes_auth_mb_substr($s, $start, $len = null) {
    if (function_exists('mb_substr')) {
        return $len === null ? mb_substr((string) $s, $start) : mb_substr((string) $s, $start, $len);
    }
    return $len === null ? substr((string) $s, $start) : substr((string) $s, $start, $len);
}

/** Bentuk respons konfigurasi WhatsApp — token TIDAK PERNAH dikirim balik. */
function routes_auth_wa_view($cfg) {
    return array(
        'provider'           => (string) $cfg['provider'],
        'apiUrl'             => (string) $cfg['apiUrl'],
        'target'             => (string) $cfg['target'],
        'enabled'            => (bool) $cfg['enabled'],
        'notifyContact'      => (bool) $cfg['notifyContact'],
        'notifyApplication'  => (bool) $cfg['notifyApplication'],
        'hasToken'           => ($cfg['token'] !== '' && $cfg['token'] !== null),
        'tokenMasked'        => routes_auth_wa_mask($cfg['token']),
        'lastTestAt'         => isset($cfg['lastTestAt']) ? $cfg['lastTestAt'] : null,
        'lastTestStatus'     => (string) $cfg['lastTestStatus'],
    );
}

/** GET whatsapp — konfigurasi + status (ADMIN+). */
function routes_auth_wa_get() {
    try {
        guard_role(array('SUPER_ADMIN', 'ADMIN'));
        $cfg = get_whatsapp_setting();
        if (!$cfg) {
            fail('Gagal memuat konfigurasi WhatsApp.', 500);
        }
        ok(routes_auth_wa_view($cfg));
    } catch (Exception $e) {
        fail('Gagal memuat konfigurasi WhatsApp.', 500);
    }
}

/** PUT whatsapp — simpan konfigurasi; token hanya diperbarui bila dikirim non-kosong. */
function routes_auth_wa_put() {
    try {
        guard_role(array('SUPER_ADMIN', 'ADMIN'));
        $cfg = get_whatsapp_setting();
        if (!$cfg) {
            fail('Gagal menyimpan konfigurasi WhatsApp.', 500);
        }
        $body = request_json();
        if (!is_array($body)) {
            fail('Gagal menyimpan konfigurasi WhatsApp.', 500); // Node: req.json() lempar → catch
        }

        $provider = routes_auth_js_string(isset($body['provider']) && $body['provider'] ? $body['provider'] : $cfg['provider']);
        if (!in_array($provider, array('FONNTE', 'WABLAS', 'CUSTOM'), true)) {
            fail('Provider tidak valid.');
        }
        $targetRaw = array_key_exists('target', $body) ? routes_auth_js_string($body['target']) : (string) $cfg['target'];
        if ($targetRaw !== '' && routes_auth_js_length(normalize_wa_number($targetRaw)) < 10) {
            fail('Nomor WhatsApp tujuan tidak valid (contoh: 6281234567890).');
        }

        $apiUrl = array_key_exists('apiUrl', $body) ? trim(routes_auth_js_string($body['apiUrl'])) : (string) $cfg['apiUrl'];
        $target = ($targetRaw !== '') ? normalize_wa_number($targetRaw) : '';
        $enabled = array_key_exists('enabled', $body) ? (bool) $body['enabled'] : (bool) $cfg['enabled'];
        $notifyContact = array_key_exists('notifyContact', $body) ? (bool) $body['notifyContact'] : (bool) $cfg['notifyContact'];
        $notifyApplication = array_key_exists('notifyApplication', $body) ? (bool) $body['notifyApplication'] : (bool) $cfg['notifyApplication'];
        // Kosong = tetap pakai token lama (agar tidak perlu ketik ulang saat edit).
        $token = (string) $cfg['token'];
        if (array_key_exists('token', $body) && trim(routes_auth_js_string($body['token'])) !== '') {
            $token = trim(routes_auth_js_string($body['token']));
        }

        db_update('WhatsAppSetting', array(
            'provider'           => $provider,
            'apiUrl'             => $apiUrl,
            'target'             => $target,
            'enabled'            => $enabled ? 1 : 0,
            'notifyContact'      => $notifyContact ? 1 : 0,
            'notifyApplication'  => $notifyApplication ? 1 : 0,
            'token'              => $token,
        ), '"id" = ?', array($cfg['id']));

        $updated = db_one('SELECT * FROM "WhatsAppSetting" WHERE "id" = ? LIMIT 1', array($cfg['id']), 'WhatsAppSetting');
        ok(routes_auth_wa_view($updated));
    } catch (Exception $e) {
        fail('Gagal menyimpan konfigurasi WhatsApp.', 500);
    }
}

/**
 * POST whatsapp/test — kirim pesan uji ke gateway aktif lalu catat hasil ke
 * lastTestAt/lastTestStatus. Kontrak respons {sent, detail} sesuai pemakaian
 * CMS (admin-whatsapp.tsx). Guard ADMIN+.
 */
function routes_auth_wa_test() {
    try {
        guard_role(array('SUPER_ADMIN', 'ADMIN'));
        $cfg = get_whatsapp_setting();
        if (!$cfg) {
            fail('Gagal menguji WhatsApp.', 500);
        }
        $message = implode("\n", array(
            '✅ *Uji Koneksi — Portal MUHDIN*',
            '',
            'Pesan uji notifikasi WhatsApp berhasil dikirim dari CMS MUHDIN.',
            'Jika Anda menerima pesan ini, konfigurasi gateway WhatsApp sudah benar.',
        ));
        $res = send_wa_message($message);
        wa_record_last_test($cfg['id'], $res['sent'], $res['detail']);
        ok(array('sent' => (bool) $res['sent'], 'detail' => (string) $res['detail']));
    } catch (Exception $e) {
        fail('Gagal menguji WhatsApp.', 500);
    }
}
