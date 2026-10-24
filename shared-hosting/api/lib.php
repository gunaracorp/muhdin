<?php
/**
 * ============================================================================
 * lib.php — Pustaka inti backend PHP MUHDIN (Edisi Shared Hosting)
 * ----------------------------------------------------------------------------
 * Rekonstruksi Task 30-a — paritas kontrak Node (2026-09-21).
 *
 * Replika src/lib/{api-helpers,auth,ratelimit,whatsapp,translate-engine,audit}.ts:
 *   PDO SQLite (foreign_keys ON, WAL) + helper query; now_ms() epoch-ms
 *   (format DateTime Prisma 6) — PHP MENULIS epoch-ms dan menormalkan ke
 *   ISO-8601 saat OUTPUT via cast_row() + DATE_COLS/BOOL_COLS/INT_COLS/
 *   FLOAT_COLS; ok()/fail() bentuk persis Node (fail → {"error": msg}, lalu
 *   exit — paritas `return ok(...)`; fail menerima dua urutan argumen);
 *   sesi DB cookie muhdin_session; guard RBAC 401/403 persis; log_audit
 *   fire-and-forget (identitas dari sesi — paritas audit.ts); rate_limit
 *   tabel SQLite (429 "Terlalu banyak percobaan. Coba lagi beberapa saat.");
 *   WhatsApp 3 provider cURL 10 dtk + template + notifier; apply_translations
 *   tanpa AI (fallback Indonesia, allowlist SETTING_TRANSLATABLE); slugify +
 *   tiket MHD-XXXXXX identik Node (ticket_code() = alias kontrak).
 *   Password: scrypt Node tak terverifikasi PHP → password_verify (bcrypt);
 *   hash scrypt lama gagal dengan pesan yang sama ("Email atau password salah.").
 *   PHP 7.4+ (tanpa enum/readonly/named args/match/nullsafe) & PHP 8.x.
 * ============================================================================
 */

require_once __DIR__ . '/config.php';

/* ---- 1. KONEKSI DATABASE (PDO SQLite) ---- */

/** Singleton PDO SQLite — dipakai seluruh helper di bawah. */
function muhdin_db() {
    static $pdo = null;
    if ($pdo instanceof PDO) {
        return $pdo;
    }
    if (!is_dir(MUHDIN_DB_DIR)) {
        @mkdir(MUHDIN_DB_DIR, 0775, true);
    }
    $pdo = new PDO('sqlite:' . MUHDIN_DB_PATH, null, null, array(
        PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    ));
    /* Paritas integritas referensial Prisma (onDelete Cascade/SetNull). */
    $pdo->exec('PRAGMA foreign_keys = ON');
    $pdo->exec('PRAGMA busy_timeout = 5000');
    /* WAL aman-kan gagal (mis. filesystem tanpa dukungan shared memory). */
    try {
        $pdo->exec('PRAGMA journal_mode = WAL');
    } catch (Exception $e) {
        /* abaikan — SQLite tetap bekerja pada mode journal default */
    }
    return $pdo;
}

/** Jalankan SQL dan kembalikan PDOStatement (untuk kasus khusus). */
function db_exec_stmt($sql, array $params = array()) {
    $stmt = muhdin_db()->prepare($sql);
    $stmt->execute($params);
    return $stmt;
}

/** Ambil SEMUA baris; $table (opsional) → normalisasi via cast_row(). */
function db_all($sql, array $params = array(), $table = null) {
    $rows = db_exec_stmt($sql, $params)->fetchAll();
    return $table === null ? $rows : cast_rows($rows, $table);
}

/** Ambil SATU baris (atau null); $table (opsional) → cast_row(). */
function db_one($sql, array $params = array(), $table = null) {
    $row = db_exec_stmt($sql, $params)->fetch();
    if ($row === false) {
        return null;
    }
    return $table === null ? $row : cast_row($row, $table);
}

/** Ambil satu nilai skalar (kolom pertama baris pertama) atau null. */
function db_val($sql, array $params = array()) {
    $row = db_exec_stmt($sql, $params)->fetch(PDO::FETCH_NUM);
    return $row === false ? null : $row[0];
}

/** Jalankan INSERT/UPDATE/DELETE — kembalikan jumlah baris terdampak. */
function db_run($sql, array $params = array()) {
    return db_exec_stmt($sql, $params)->rowCount();
}

/** INSERT data asosiatif; kolom di-quote; auto id/createdAt/updatedAt. Data kosong (paritas Prisma create({data:{}}), mis. singleton WhatsAppSetting) → cukup id dibuat otomatis, kolom lain memakai default DB. */
function db_insert($table, array $data) {
    $cols = table_columns($table);
    if (count($data) === 0 && in_array('id', $cols, true)) {
        $data['id'] = new_id(); // DEFAULT VALUES tak mungkin: id TEXT NOT NULL
    }
    if (!empty($cols)) {
        if (in_array('id', $cols, true) && !isset($data['id'])) {
            $data['id'] = new_id();
        }
        if (in_array('createdAt', $cols, true) && !isset($data['createdAt'])) {
            $data['createdAt'] = now_ms(); // paritas @default(now()) — epoch ms
        }
        if (in_array('updatedAt', $cols, true) && !isset($data['updatedAt'])) {
            $data['updatedAt'] = now_ms(); // paritas @updatedAt
        }
    }
    $names = array();
    $marks = array();
    foreach (array_keys($data) as $c) {
        $names[] = '"' . str_replace('"', '', $c) . '"';
        $marks[] = '?';
    }
    $sql = 'INSERT INTO "' . $table . '" (' . implode(', ', $names) . ') VALUES (' . implode(', ', $marks) . ')';
    db_exec_stmt($sql, array_values($data));
    return isset($data['id']) ? $data['id'] : null;
}

/** UPDATE data asosiatif; auto updatedAt bila kolom ada (paritas @updatedAt). */
function db_update($table, array $data, $where, array $whereParams = array()) {
    $cols = table_columns($table);
    if (!empty($cols) && in_array('updatedAt', $cols, true) && !isset($data['updatedAt'])) {
        $data['updatedAt'] = now_ms();
    }
    $sets = array();
    foreach (array_keys($data) as $c) {
        $sets[] = '"' . str_replace('"', '', $c) . '" = ?';
    }
    $sql = 'UPDATE "' . $table . '" SET ' . implode(', ', $sets) . ' WHERE ' . $where;
    $stmt = db_exec_stmt($sql, array_merge(array_values($data), $whereParams));
    return $stmt->rowCount();
}

/** DELETE baris — kembalikan jumlah baris terhapus. */
function db_delete($table, $where, array $params = array()) {
    return db_exec_stmt('DELETE FROM "' . $table . '" WHERE ' . $where, $params)->rowCount();
}

/** COUNT cepat; $where kosong berarti seluruh tabel. */
function db_count($table, $where = '', array $params = array()) {
    $sql = 'SELECT COUNT(*) FROM "' . $table . '"' . ($where !== '' ? ' WHERE ' . $where : '');
    return (int) db_val($sql, $params);
}

/** Cache kolom tabel via PRAGMA table_info (menghindari query berulang). */
function table_columns($table) {
    static $cache = array();
    if (!isset($cache[$table])) {
        $cache[$table] = array();
        try {
            $rows = db_all('PRAGMA table_info("' . $table . '")');
            foreach ($rows as $r) {
                $cache[$table][] = $r['name'];
            }
        } catch (Exception $e) {
            $cache[$table] = array();
        }
    }
    return $cache[$table];
}

/** Bangun string placeholder "?, ?, ?" untuk klausa IN (...). */
function sql_in($count) {
    return implode(', ', array_fill(0, max(0, (int) $count), '?'));
}

/* ---- 2. WAKTU & NORMALISASI TIPE (epoch-ms ↔ ISO-8601) ---- */

/** Waktu sekarang dalam epoch MILLISEKONDTI — format Prisma 6 di SQLite. */
function now_ms() {
    return (int) round(microtime(true) * 1000);
}

/** Epoch-ms → string ISO-8601 UTC "2026-09-21T07:00:00.000Z" (gaya Node). */
function iso_from_ms($ms) {
    $ms = (int) $ms;
    $sec = (int) floor($ms / 1000);
    $frac = $ms % 1000;
    if ($frac < 0) {
        $frac += 1000;
        $sec -= 1;
    }
    return gmdate('Y-m-d\TH:i:s', $sec) . '.' . sprintf('%03d', $frac) . 'Z';
}

/** DATE_COLS — kolom DateTime per tabel (dari prisma/schema.prisma). Nilainya INTEGER epoch-ms di SQLite dan dinormalkan ke ISO-8601 saat output (boleh null). */
$DATE_COLS = array(
    'User'                  => array('lastLoginAt', 'createdAt', 'updatedAt'),
    'Session'               => array('expiresAt', 'createdAt'),
    'Article'               => array('createdAt', 'updatedAt'),
    'Ecosystem'             => array('createdAt', 'updatedAt'),
    'Member'                => array('createdAt', 'updatedAt'),
    'MembershipApplication' => array('reviewedAt', 'createdAt', 'updatedAt'),
    'Tutorial'              => array('createdAt', 'updatedAt'),
    'ContactMessage'        => array('createdAt'),
    'Faq'                   => array('createdAt'),
    'Testimonial'           => array('createdAt'),
    'NusukConnection'       => array('lastSyncAt', 'createdAt', 'updatedAt'),
    'NusukPermit'           => array('issuedAt', 'expiresAt', 'syncedAt'),
    'NusukSyncLog'          => array('createdAt'),
    'ContentTranslation'    => array('createdAt', 'updatedAt'),
    'WhatsAppSetting'       => array('lastTestAt', 'createdAt', 'updatedAt'),
    'Gallery'               => array('createdAt', 'updatedAt'),
    'Event'                 => array('startsAt', 'endsAt', 'createdAt', 'updatedAt'),
    'Resource'              => array('createdAt', 'updatedAt'),
    'Subscriber'            => array('createdAt'),
    'Complaint'             => array('respondedAt', 'createdAt', 'updatedAt'),
    'AuditLog'              => array('createdAt'),
    'RegionalBranch'        => array('createdAt', 'updatedAt'),
    'JourneyStep' => array(), 'Roadmap' => array(), 'Management' => array(), 'SiteSetting' => array(),
);

/** Kolom Boolean per tabel — dikonversi ke true/false agar JSON identik Node. */
$BOOL_COLS = array(
    'User'            => array('isActive'),
    'Article'         => array('featured'),
    'Tutorial'        => array('published'),
    'Testimonial'     => array('published'),
    'RegionalBranch'  => array('published'),
    'NusukConnection' => array('autoSync'),
    'WhatsAppSetting' => array('enabled', 'notifyContact', 'notifyApplication'),
    'Gallery'         => array('published'),
    'Event'           => array('published'),
    'Resource'        => array('published'),
    'Subscriber'      => array('isActive'),
);

/** Kolom Integer per tabel — dipaksa (int) agar JSON bukan string. */
$INT_COLS = array(
    'Article'         => array('views'),
    'Ecosystem'       => array('number'),
    'JourneyStep'     => array('step'),
    'Roadmap'         => array('order'),
    'Tutorial'        => array('duration', 'order', 'views'),
    'Faq'             => array('order'),
    'Testimonial'     => array('rating'),
    'Management'      => array('order'),
    'RegionalBranch'  => array('order'),
    'NusukConnection' => array('totalSyncs'),
    'NusukSyncLog'    => array('recordsAffected', 'durationMs'),
    'Gallery'         => array('order'),
    'Resource'        => array('downloads'),
    'Member'          => array('memberSince'),
);

/** Kolom Float per tabel. */
$FLOAT_COLS = array(
    'Member' => array('rating'),
);

/** Normalisasi satu baris hasil query menjadi bentuk JSON yang identik dengan output Prisma/Node: epoch-ms → ISO-8601, 0/1 → bool, angka → int/float. */
function cast_row(array $row, $table) {
    global $DATE_COLS, $BOOL_COLS, $INT_COLS, $FLOAT_COLS;
    $specs = array(
        array(isset($DATE_COLS[$table]) ? $DATE_COLS[$table] : array(), 'date'),
        array(isset($BOOL_COLS[$table]) ? $BOOL_COLS[$table] : array(), 'bool'),
        array(isset($INT_COLS[$table]) ? $INT_COLS[$table] : array(), 'int'),
        array(isset($FLOAT_COLS[$table]) ? $FLOAT_COLS[$table] : array(), 'float'),
    );
    foreach ($specs as $spec) {
        list($cols, $kind) = $spec;
        foreach ($cols as $c) {
            if (!array_key_exists($c, $row) || $row[$c] === null || $row[$c] === '') {
                continue;
            }
            if ($kind === 'date') {
                if (is_numeric($row[$c])) $row[$c] = iso_from_ms($row[$c]);
            } elseif ($kind === 'bool') {
                $row[$c] = ((int) $row[$c]) === 1;
            } elseif ($kind === 'int') {
                $row[$c] = (int) $row[$c];
            } else {
                $row[$c] = (float) $row[$c];
            }
        }
    }
    return $row;
}

/** cast_row untuk kumpulan baris. */
function cast_rows(array $rows, $table) {
    $out = array();
    foreach ($rows as $r) {
        $out[] = cast_row($r, $table);
    }
    return $out;
}

/** ID unik bergaya cuid (25 char, prefiks "c") — kompatibel kolom Prisma. */
function new_id() {
    $ts = base_convert((string) now_ms(), 10, 36);
    $rand = '';
    for ($i = 0; $i < 2; $i++) {
        $rand .= bin2hex(random_bytes(6));
    }
    $id = 'c' . $ts . $rand;
    return substr($id, 0, 25);
}

/* ---- 3. RESPONS JSON — ok()/fail() paritas src/lib/api-helpers.ts ---- */

/** Kirim payload JSON mentah dengan status HTTP (tanpa wrapper). */
function json_out($payload, $status = 200) {
    if (!headers_sent()) {
        http_response_code((int) $status);
        header('Content-Type: application/json; charset=utf-8');
        header('X-Content-Type-Options: nosniff');
    }
    echo json_encode(
        $payload,
        JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_INVALID_UTF8_SUBSTITUTE
    );
}

/** Paritas ok(data, init?) — mengirim lalu MENGHENTIKAN eksekusi. */
function ok($data, $status = 200) {
    json_out($data, $status);
    exit;
}

/**
 * Paritas fail(message, status=400) → {"error": message} lalu exit.
 * Urutan argumen Node: fail(message, status). Kontrak Task 30-a menulis
 * fail(status, message) — KEDUA urutan diterima agar tidak pernah salah:
 *   fail('Tidak ada.', 404)  → {"error":"Tidak ada."} 404 (gaya Node)
 *   fail(404, 'Tidak ada.')  → identik (gaya Task)
 */
function fail($a = 400, $b = 'Permintaan tidak valid.') {
    if (is_string($a)) {
        $message = $a;
        $status = is_int($b) ? $b : 400;
    } else {
        $status = is_int($a) ? $a : 400;
        $message = is_string($b) ? $b : 'Permintaan tidak valid.';
    }
    json_out(array('error' => $message), $status);
    exit;
}

/** Body JSON dari request saat ini (array) atau null bila bukan JSON valid. */
function request_json() {
    static $cache = null;
    if ($cache !== null) {
        return $cache;
    }
    $raw = file_get_contents('php://input');
    $decoded = json_decode((string) $raw, true);
    $cache = is_array($decoded) ? $decoded : null;
    return $cache;
}

/** IP klien — paritas ratelimit.ts: header x-forwarded-for atau "local". */
function client_ip() {
    $xff = isset($_SERVER['HTTP_X_FORWARDED_FOR']) ? $_SERVER['HTTP_X_FORWARDED_FOR'] : '';
    if ($xff !== '') {
        $parts = explode(',', $xff);
        $ip = trim($parts[0]);
        if ($ip !== '') {
            return $ip;
        }
    }
    if (!empty($_SERVER['REMOTE_ADDR'])) {
        return $_SERVER['REMOTE_ADDR'];
    }
    return 'local';
}

/** Paritas localeFromRequest: ?locale=en|ar → locale; selain itu "id". */
function locale_from_request() {
    $raw = isset($_GET['locale']) ? strtolower(trim((string) $_GET['locale'])) : '';
    return ($raw === 'en' || $raw === 'ar') ? $raw : 'id';
}

/** Paritas parseIntOr(value, fallback). */
function parse_int_or($value, $fallback) {
    if ($value === null) {
        return $fallback;
    }
    $n = intval($value);
    // intval("abc") = 0 sedangkan Node parseInt → NaN → fallback; tiru itu.
    if (!preg_match('/^\s*-?\d+/', (string) $value)) {
        return $fallback;
    }
    return $n;
}

/* ---- 4. SESI & AUTH — paritas src/lib/auth.ts ---- */

/** Ambil user aktif dari cookie muhdin_session → tabel Session → join User. Sesi kadaluarsa / akun nonaktif langsung dibersihkan (paritas auth.ts). Selalu null-safe: kegagalan DB → null. */
function current_user() {
    try {
        $token = isset($_COOKIE[MUHDIN_SESSION_COOKIE]) ? $_COOKIE[MUHDIN_SESSION_COOKIE] : null;
        if (!$token) {
            return null;
        }
        $row = db_one(
            'SELECT u.*, s."id" AS "__sid", s."expiresAt" AS "__sexp" FROM "Session" s ' .
            'JOIN "User" u ON u."id" = s."userId" WHERE s."token" = ? LIMIT 1',
            array($token),
            'User'
        );
        if (!$row) {
            return null;
        }
        $sessionId = $row['__sid'];
        $sessionExpires = (int) $row['__sexp'];
        unset($row['__sid'], $row['__sexp']);
        // Sesi kadaluarsa → baris sesi ikut dihapus (paritas auth.ts).
        if ($sessionExpires < now_ms()) {
            db_delete('Session', '"id" = ?', array($sessionId));
            return null;
        }
        // Multi-admin: akun dinonaktifkan → semua sesinya dibersihkan.
        if (!$row['isActive']) { // cast_row('User') → bool
            revoke_all_for_user($row['id']);
            return null;
        }
        return $row;
    } catch (Exception $e) {
        return null;
    }
}

/** Buat sesi baru (token 64-hex, 7 hari) + set cookie — paritas createSession. */
function create_session($userId) {
    $token = bin2hex(random_bytes(32)); // Node: randomBytes(32).toString("hex")
    $expiresAt = now_ms() + MUHDIN_SESSION_DAYS * 24 * 60 * 60 * 1000;
    db_insert('Session', array(
        'token'     => $token,
        'userId'    => $userId,
        'expiresAt' => $expiresAt,
    ));
    setcookie(MUHDIN_SESSION_COOKIE, $token, array(
        'expires'  => time() + MUHDIN_SESSION_DAYS * 24 * 60 * 60,
        'path'     => MUHDIN_COOKIE_PATH,
        'secure'   => (bool) MUHDIN_COOKIE_SECURE,
        'httponly' => true,
        'samesite' => MUHDIN_COOKIE_SAMESITE,
    ));
    return $token;
}

/** Hapus sesi berdasarkan token (tanpa menyentuh cookie). */
function revoke_session($token) {
    return db_delete('Session', '"token" = ?', array($token));
}

/** Hapus SEMUA sesi milik satu user (paritas deleteMany by userId). */
function revoke_all_for_user($userId) {
    return db_delete('Session', '"userId" = ?', array($userId));
}

/** Paritas destroySession: hapus sesi + kedaluwarsakan cookie. */
function destroy_session() {
    $token = isset($_COOKIE[MUHDIN_SESSION_COOKIE]) ? $_COOKIE[MUHDIN_SESSION_COOKIE] : null;
    if ($token) {
        revoke_session($token);
    }
    if (!headers_sent()) {
        setcookie(MUHDIN_SESSION_COOKIE, '', array(
            'expires'  => time() - 3600,
            'path'     => MUHDIN_COOKIE_PATH,
            'secure'   => (bool) MUHDIN_COOKIE_SECURE,
            'httponly' => true,
            'samesite' => MUHDIN_COOKIE_SAMESITE,
        ));
    }
}

/** Buang kolom password sebelum user dikirim ke klien. */
function safe_user(array $user) {
    unset($user['password']);
    return $user;
}

/** Guard admin — paritas guardAdmin(): kembalikan user ATAU mengirim JSON 401 lalu exit. Pemakaian PHP: $user = guard_admin(); (lanjut tanpa cek null). */
function guard_admin() {
    $user = current_user();
    if (!$user) {
        fail('Tidak diizinkan — silakan login sebagai admin.', 401);
    }
    return $user;
}

/** Paritas guardRole(allowed): 401 bila belum login, 403 bila peran tak sesuai. */
function guard_role($allowed) {
    $user = current_user();
    if (!$user) {
        fail('Tidak diizinkan — silakan login sebagai admin.', 401);
    }
    if (!in_array($user['role'], (array) $allowed, true)) {
        fail('Peran Anda tidak memiliki akses ke aksi ini.', 403);
    }
    return $user;
}

/** Paritas guardSuperAdmin(): hanya SUPER_ADMIN yang lolos. */
function guard_super() {
    $user = current_user();
    if (!$user || $user['role'] !== 'SUPER_ADMIN') {
        if ($user) {
            fail('Hanya Super Admin yang dapat mengelola akun admin.', 403);
        }
        fail('Tidak diizinkan — silakan login sebagai admin.', 401);
    }
    return $user;
}

/* ---- 5. AUDIT — paritas src/lib/audit.ts (fire-and-forget) ---- */

/**
 * Tulis jejak audit ke tabel AuditLog (paritas logAudit() Node: identitas
 * diambil dari SESI — bila tak ada sesi, dicatat sebagai "sistem").
 * Argumen pertama fleksibel: array baris User (hasil guard_admin()), string
 * userId, atau null → ambil current_user() secara otomatis. Kegagalan TIDAK
 * BOLEH menggagalkan operasi utama — dibungkus try/catch senyap.
 */
function log_audit($user = null, $action = '', $entity = '', $entityId = null, $detail = null) {
    try {
        $userName = 'sistem';
        $role = '';
        if (is_array($user)) {
            $userId = isset($user['id']) ? $user['id'] : null;
            $userName = isset($user['name']) && $user['name'] !== '' ? $user['name'] : 'sistem';
            $role = isset($user['role']) ? $user['role'] : '';
        } else {
            $userId = $user ? (string) $user : null;
            if ($userId) {
                $u = db_one('SELECT "name", "role" FROM "User" WHERE "id" = ?', array($userId));
                if ($u) {
                    $userName = $u['name'];
                    $role = $u['role'];
                }
            } else {
                $sessionUser = current_user(); // paritas Node: requireAdmin()
                if ($sessionUser) {
                    $userId = $sessionUser['id'];
                    $userName = $sessionUser['name'];
                    $role = $sessionUser['role'];
                }
            }
        }
        db_insert('AuditLog', array(
            'userId'   => $userId,
            'userName' => $userName,
            'role'     => $role,
            'action'   => $action,
            'entity'   => $entity,
            'entityId' => $entityId,
            'detail'   => $detail,
        ));
    } catch (Exception $e) {
        /* log audit tidak boleh mengganggu alur utama */
    }
}

/* ---- 6. PASSWORD (bcrypt) — keterangan lihat header file ---- */

/** Verifikasi password login. Hash scrypt Node otomatis gagal (by design). */
function verify_password($password, $stored) {
    if (!is_string($stored) || $stored === '') {
        return false;
    }
    // Hash gaya Node "salt:hash" (scrypt) tidak berformat bcrypt → false.
    return password_verify((string) $password, $stored);
}

/** Hash password baru (bcrypt) — untuk create/reset akun admin dari CMS PHP. */
function hash_password($password) {
    return password_hash((string) $password, PASSWORD_BCRYPT);
}

/* ---- 7. SLUG & KODE TIKET — paritas api-helpers.ts + applications/route.ts ---- */

/** Slugify identik Node: lowercase → buang non [a-z0-9\s-] → dash → trim. */
function slugify($text) {
    $t = function_exists('mb_strtolower') ? mb_strtolower((string) $text, 'UTF-8') : strtolower((string) $text);
    if (!is_string($t)) {
        return '';
    }
    $t = trim($t);
    $t = preg_replace('/[^a-z0-9\s-]/', '', $t); // buang non [a-z0-9 spasi dash]
    $t = is_string($t) ? preg_replace('/[\s_]+/', '-', $t) : null; // spasi/_ → dash
    $t = is_string($t) ? preg_replace('/-+/', '-', $t) : null;     // dash beruntun
    if (!is_string($t)) {
        return ''; // UTF-8 rusak dsb. — jangan pernah melempar error
    }
    $t = preg_replace('/^-/', '', $t);
    $t = preg_replace('/-$/', '', $t);
    return is_string($t) ? $t : '';
}

/** Kode tiket unik "MHD-XXXXXX" (6 alfanumerik uppercase) — loop cek unik di tabel MembershipApplication maksimal 25 percobaan, lalu fallback dari timestamp. Paritas generateTicketCode() Node. */
function generate_ticket_code() {
    // Alfabet: A-Z tanpa I/O + angka 2-9 (hindari salah baca).
    $chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    $len = strlen($chars);
    for ($attempt = 0; $attempt < 25; $attempt++) {
        $code = 'MHD-';
        for ($i = 0; $i < 6; $i++) {
            $code .= $chars[mt_rand(0, $len - 1)];
        }
        $exists = db_val('SELECT 1 FROM "MembershipApplication" WHERE "ticketCode" = ? LIMIT 1', array($code));
        if (!$exists) {
            return $code;
        }
    }
    // Cadangan (praktis tak terpakai): turunkan dari timestamp, tetap sah.
    $n = now_ms();
    $fallback = '';
    for ($i = 0; $i < 6; $i++) {
        $fallback = $chars[$n % $len] . $fallback;
        $n = (int) ($n / $len);
    }
    return 'MHD-' . $fallback;
}

/** Nama kontrak Task 30-a — alias persis generate_ticket_code(). */
function ticket_code() {
    return generate_ticket_code();
}

/* ---- 8. RATE LIMIT — tabel SQLite (paritas src/lib/ratelimit.ts) ---- */

/** Pastikan tabel rate_limit ada (dibuat sekali, on-demand). */
function ensure_rate_limit_table() {
    static $done = false;
    if ($done) {
        return;
    }
    muhdin_db()->exec(
        'CREATE TABLE IF NOT EXISTS "rate_limit" (' .
        '"key" TEXT PRIMARY KEY NOT NULL, ' .
        '"count" INTEGER NOT NULL DEFAULT 0, ' .
        '"window_start" INTEGER NOT NULL DEFAULT 0)'
    );
    $done = true;
}

/**
 * Rate limit per bucket+IP — tabel SQLite rate_limit(key, count, window_start).
 * Default 5 percobaan / 60.000 ms (paritas ratelimit.ts).
 * Bila kuota habis: $auto_reject = true (default kontrak Task 30-a) → langsung
 * membalas HTTP 429 {"error":"Terlalu banyak percobaan. Coba lagi beberapa
 * saat."} PERSIS Node lalu exit; $auto_reject = false → perilaku Node murni
 * (hanya mengembalikan FALSE, pemanggil yang membalas 429).
 */
function rate_limit($bucket, $max = MUHDIN_RATE_MAX, $windowMs = MUHDIN_RATE_WINDOW_MS, $ip = null, $auto_reject = true) {
    ensure_rate_limit_table();
    if ($ip === null) {
        $ip = client_ip();
    }
    $key = $bucket . ':' . $ip;
    $now = now_ms();

    $row = db_one('SELECT "count", "window_start" FROM "rate_limit" WHERE "key" = ?', array($key));
    if ($row && ($now - (int) $row['window_start']) < $windowMs) {
        // Node: bila hits.length >= max → tolak TANPA mencatat hit baru.
        if ((int) $row['count'] >= $max) {
            if ($auto_reject) {
                fail('Terlalu banyak percobaan. Coba lagi beberapa saat.', 429);
            }
            return false;
        }
        db_run('UPDATE "rate_limit" SET "count" = "count" + 1 WHERE "key" = ?', array($key));
        return true;
    }
    // Window baru (atau entri kadaluarsa) — mulai hitung dari 1.
    db_exec_stmt(
        'INSERT OR REPLACE INTO "rate_limit" ("key", "count", "window_start") VALUES (?, ?, ?)',
        array($key, 1, $now)
    );

    // Housekeeping ringan (paritas pembersihan bucket Node): buang entri basi.
    if (mt_rand(1, 10) === 1) {
        db_run('DELETE FROM "rate_limit" WHERE "window_start" < ?', array($now - max($windowMs, 3600000)));
    }
    return true;
}

/** Bantu cepat: balas 429 otomatis bila limit tercapai (rate_limit default sudah auto-reject — guard tinggal alias semantik). */
function rate_limit_guard($bucket, $max = MUHDIN_RATE_MAX, $windowMs = MUHDIN_RATE_WINDOW_MS) {
    return rate_limit($bucket, $max, $windowMs, null, true);
}

/* ---- 9. WHATSAPP — paritas src/lib/whatsapp.ts (3 provider, cURL 10 detik) ---- */

/** Ambil konfigurasi WhatsApp singleton (buat baris default bila belum ada). */
function get_whatsapp_setting() {
    $cfg = db_one('SELECT * FROM "WhatsAppSetting" ORDER BY "createdAt" ASC LIMIT 1', array(), 'WhatsAppSetting');
    if ($cfg) {
        return $cfg;
    }
    db_insert('WhatsAppSetting', array()); // default: FONNTE, nonaktif
    return db_one('SELECT * FROM "WhatsAppSetting" ORDER BY "createdAt" ASC LIMIT 1', array(), 'WhatsAppSetting');
}

/** Normalisasi nomor Indonesia: buang non-digit; 0/8 awal → awalan 62. */
function normalize_wa_number($raw) {
    $digits = preg_replace('/\D/', '', (string) $raw);
    if (substr($digits, 0, 1) === '0') {
        $digits = '62' . substr($digits, 1);
    } elseif (substr($digits, 0, 1) === '8') {
        $digits = '62' . $digits;
    }
    return $digits;
}

/** POST ke gateway dengan cURL, timeout 10 detik. Logika penilaian hasil identik whatsapp.ts: HTTP non-2xx gagal; HTTP 200 dengan body JSON status=false/"false"/0 juga gagal; selain itu sukses. */
function wa_post($url, array $headers, $body) {
    $ch = curl_init($url);
    curl_setopt_array($ch, array(
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_POST           => true,
        CURLOPT_POSTFIELDS     => $body,
        CURLOPT_HTTPHEADER     => $headers,
        CURLOPT_TIMEOUT        => MUHDIN_WA_TIMEOUT_SECONDS,
        CURLOPT_CONNECTTIMEOUT => MUHDIN_WA_TIMEOUT_SECONDS,
        CURLOPT_FOLLOWLOCATION => true,
        CURLOPT_SSL_VERIFYPEER => true,
    ));
    $text = curl_exec($ch);
    if ($text === false) {
        $errno = curl_errno($ch);
        $errmsg = curl_error($ch);
        curl_close($ch);
        if ($errno === CURLE_OPERATION_TIMEDOUT) {
            return array('sent' => false, 'detail' => 'Timeout — gateway tidak merespons 10 detik.');
        }
        return array('sent' => false, 'detail' => 'cURL error ' . $errno . ': ' . $errmsg);
    }
    $http = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    $text = (string) $text;

    if ($http < 200 || $http >= 300) {
        $snippet = mb_substr($text, 0, 160);
        return array('sent' => false, 'detail' => 'HTTP ' . $http . ' — ' . ($snippet !== '' ? $snippet : 'tanpa isi'));
    }
    // Beberapa gateway membalas 200 dengan flag kegagalan di body.
    $json = json_decode($text, true);
    if (is_array($json) && array_key_exists('status', $json)) {
        $s = $json['status'];
        if ($s === false || $s === 'false' || $s === 0 || $s === '0') {
            $reason = isset($json['reason']) && $json['reason'] ? $json['reason'] : (isset($json['message']) && $json['message'] ? $json['message'] : 'Gateway menolak pesan.');
            return array('sent' => false, 'detail' => $reason);
        }
    }
    $snippet = mb_substr($text, 0, 200);
    return array('sent' => true, 'detail' => ($snippet !== '' ? $snippet : 'OK'));
}

/** Kirim pesan WhatsApp sesuai konfigurasi tersimpan — hasil {sent, detail}. */
function send_wa_message($message) {
    try {
        $cfg = get_whatsapp_setting();
        if (empty($cfg)) {
            return array('sent' => false, 'detail' => 'Konfigurasi WhatsApp belum tersedia.');
        }
        if (!$cfg['enabled']) {
            return array('sent' => false, 'detail' => 'Notifikasi WhatsApp sedang nonaktif.');
        }
        if ($cfg['token'] === '' || $cfg['token'] === null) {
            return array('sent' => false, 'detail' => 'Token gateway belum diisi.');
        }
        if ($cfg['target'] === '' || $cfg['target'] === null) {
            return array('sent' => false, 'detail' => 'Nomor tujuan admin belum diisi.');
        }
        $target = normalize_wa_number($cfg['target']);

        switch ($cfg['provider']) {
            case 'FONNTE':
                return wa_post(
                    'https://api.fonnte.com/send',
                    array('Authorization: ' . $cfg['token'], 'Content-Type: application/x-www-form-urlencoded'),
                    http_build_query(array('target' => $target, 'message' => $message))
                );
            case 'WABLAS':
                return wa_post(
                    'https://console.wablas.com/api/send-message?token=' . rawurlencode($cfg['token']),
                    array('Content-Type: application/json'),
                    json_encode(array('phone' => $target, 'message' => $message), JSON_UNESCAPED_UNICODE)
                );
            case 'CUSTOM':
                if ($cfg['apiUrl'] === '' || $cfg['apiUrl'] === null) {
                    return array('sent' => false, 'detail' => 'URL endpoint CUSTOM belum diisi.');
                }
                return wa_post(
                    $cfg['apiUrl'],
                    array('Content-Type: application/json'),
                    json_encode(array('token' => $cfg['token'], 'target' => $target, 'message' => $message), JSON_UNESCAPED_UNICODE)
                );
            default:
                return array('sent' => false, 'detail' => 'Provider tidak dikenal: ' . $cfg['provider']);
        }
    } catch (Exception $e) {
        $msg = $e->getMessage();
        return array('sent' => false, 'detail' => $msg);
    }
}

/* ------------------------------ TEMPLATE PESAN --------------------------- */

/** Template pesan kontak baru — teks persis waContactTemplate(). */
function wa_contact_template($m) {
    $lines = array(
        '🔔 *Pesan Baru — Portal MUHDIN*',
        '',
        '*Nama:* ' . $m['name'],
        '*Email:* ' . $m['email'],
    );
    if (!empty($m['phone'])) {
        $lines[] = '*Telepon:* ' . $m['phone'];
    }
    $lines[] = '*Subjek:* ' . $m['subject'];
    $lines[] = '';
    $msg = (string) $m['message'];
    $lines[] = mb_strlen($msg) > 500 ? mb_substr($msg, 0, 500) . '…' : $msg;
    $lines[] = '';
    $lines[] = '_Silakan balas melalui CMS MUHDIN → Pesan Masuk._';
    return implode("\n", $lines);
}

/** Template pendaftaran anggota baru — teks persis waApplicationTemplate(). */
function wa_application_template($a) {
    return implode("\n", array(
        '📋 *Pendaftaran Anggota Baru — MUHDIN*',
        '',
        '*Kode Tiket:* ' . $a['ticketCode'],
        '*Organisasi:* ' . $a['orgName'],
        '*Tipe:* ' . $a['type'],
        '*Kontak:* ' . $a['contactName'],
        '*Email:* ' . $a['email'],
        '*Telepon:* ' . $a['phone'],
        '*Kota:* ' . $a['city'],
        '*No. Izin:* ' . $a['licenseNo'],
        '',
        '_Tinjau melalui CMS MUHDIN → Pendaftaran._',
    ));
}

/** Template pengaduan jamaah baru — teks persis waComplaintTemplate(). */
function wa_complaint_template($c) {
    $lines = array(
        '⚠️ *Pengaduan Jamaah Baru — MUHDIN*',
        '',
        '*Pelapor:* ' . $c['name'],
    );
    if (!empty($c['targetMember'])) {
        $lines[] = '*Penyelenggara Dilaporkan:* ' . $c['targetMember'];
    }
    $lines[] = '*Kategori:* ' . $c['category'];
    $lines[] = '';
    $lines[] = '_Tinjau melalui CMS MUHDIN → Pengaduan._';
    return implode("\n", $lines);
}

/* --------------------- NOTIFIER (gagal-aman, fire-and-forget) ------------ */

/** Catat hasil kirim terakhir ke WhatsAppSetting (lastTestAt/lastTestStatus). */
function wa_record_last_test($cfgId, $sent, $detail) {
    try {
        db_update('WhatsAppSetting', array(
            'lastTestAt'     => now_ms(),
            'lastTestStatus' => ($sent ? 'OK' : 'GAGAL') . ' — ' . mb_substr((string) $detail, 0, 180),
        ), '"id" = ?', array($cfgId));
    } catch (Exception $e) {
        /* tidak boleh mengganggu alur utama */
    }
}

/** Notifikasi pesan kontak baru (mengikuti saklar notifyContact). */
function notify_contact_message($m) {
    try {
        $cfg = get_whatsapp_setting();
        if (!$cfg || !$cfg['enabled'] || !$cfg['notifyContact']) return;
        $res = send_wa_message(wa_contact_template($m));
        wa_record_last_test($cfg['id'], $res['sent'], $res['detail']);
    } catch (Exception $e) {
        /* notifikasi tidak boleh mengganggu alur utama */
    }
}

/** Notifikasi pendaftaran anggota baru (saklar notifyApplication). */
function notify_membership_application($a) {
    try {
        $cfg = get_whatsapp_setting();
        if (!$cfg || !$cfg['enabled'] || !$cfg['notifyApplication']) return;
        $res = send_wa_message(wa_application_template($a));
        wa_record_last_test($cfg['id'], $res['sent'], $res['detail']);
    } catch (Exception $e) {
        /* notifikasi tidak boleh mengganggu alur utama */
    }
}

/** Notifikasi pengaduan jamaah (mengikuti saklar notifyContact). */
function notify_complaint($c) {
    try {
        $cfg = get_whatsapp_setting();
        if (!$cfg || !$cfg['enabled'] || !$cfg['notifyContact']) return;
        $res = send_wa_message(wa_complaint_template($c));
        wa_record_last_test($cfg['id'], $res['sent'], $res['detail']);
    } catch (Exception $e) {
        /* notifikasi tidak boleh mengganggu alur utama */
    }
}

/* ---- 10. TRANSLASI KONTEN — paritas i18n-server.ts TANPA AI (fallback Indonesia) ---- */

/** Key baris per entitas (paritas keyOf pada route Node): Ecosystem/JourneyStep memakai number/step. */
$ENTITY_KEY_FIELD = array(
    'Article'     => 'slug',
    'Tutorial'    => 'slug',
    'Ecosystem'   => 'number',
    'JourneyStep' => 'step',
    'Roadmap'     => 'id',
    'Member'      => 'id',
    'Faq'         => 'id',
    'Testimonial' => 'id',
    'Management'  => 'id',
    'SiteSetting' => 'key',
);

/** Field yang diterjemahkan per entitas (paritas ENTITY_REGISTRY). */
$ENTITY_FIELDS = array(
    'Article'     => array('title', 'excerpt', 'content'),
    'Tutorial'    => array('title', 'summary', 'content'),
    'Ecosystem'   => array('name', 'scope', 'standard', 'description'),
    'JourneyStep' => array('title', 'activity', 'output'),
    'Roadmap'     => array('phase', 'focus', 'deliverables'),
    'Member'      => array('description'),
    'Faq'         => array('question', 'answer'),
    'Testimonial' => array('role', 'content'),
    'Management'  => array('position', 'bio'),
    'SiteSetting' => array('value'),
);

/** Terapkan terjemahan tersimpan (ContentTranslation) ke kumpulan baris. locale "id" → apa adanya; SiteSetting hanya key allowlist; TANPA AI — nilai yang belum tersimpan dibiarkan Indonesia (fallback). */
function apply_translations($rows, $entity, $locale = 'id', $key_of = null, $fields = null) {
    global $ENTITY_KEY_FIELD, $ENTITY_FIELDS;
    if (!is_array($rows) || count($rows) === 0 || $locale === null || $locale === '' || $locale === 'id') {
        return $rows;
    }
    $translatable = defined('MUHDIN_SETTING_TRANSLATABLE') ? MUHDIN_SETTING_TRANSLATABLE : array();

    if ($fields === null) {
        $fields = isset($ENTITY_FIELDS[$entity]) ? $ENTITY_FIELDS[$entity] : array();
    }
    if (count($fields) === 0) {
        return $rows;
    }
    if ($key_of === null) {
        $keyField = isset($ENTITY_KEY_FIELD[$entity]) ? $ENTITY_KEY_FIELD[$entity] : 'id';
        $key_of = function ($row) use ($keyField) {
            return (string) (is_array($row) && isset($row[$keyField]) ? $row[$keyField] : '');
        };
    }

    // SiteSetting: hanya baris allowlist yang boleh diterjemahkan — baris
    // lain tetap dikembalikan (identitas, email, telepon tak diubah).
    if ($entity === 'SiteSetting') {
        $work = array();
        foreach ($rows as $r) {
            if (in_array((string) $key_of($r), $translatable, true)) {
                $work[] = $r;
            }
        }
    } else {
        $work = $rows;
    }
    if (count($work) === 0) {
        return $rows;
    }

    $keys = array();
    foreach ($work as $r) {
        $k = (string) $key_of($r);
        if ($k !== '') {
            $keys[$k] = true;
        }
    }
    if (count($keys) === 0) {
        return $rows;
    }

    try {
        $saved = db_all(
            'SELECT "entityKey", "field", "value" FROM "ContentTranslation" ' .
            'WHERE "entity" = ? AND "locale" = ? AND "entityKey" IN (' . sql_in(count($keys)) . ') ' .
            'AND "field" IN (' . sql_in(count($fields)) . ')',
            array_merge(array($entity, $locale), array_keys($keys), array_values($fields))
        );
    } catch (Exception $e) {
        return $rows; // tabel belum siap → fallback Indonesia penuh
    }

    $map = array();
    foreach ($saved as $s) {
        $map[$s['entityKey'] . '::' . $s['field']] = $s['value'];
    }
    if (count($map) === 0) {
        return $rows; // tanpa AI: tak ada yang bisa dilengkapi otomatis
    }

    // Salin baris dan ganti field yang punya terjemahan tersimpan.
    $out = array();
    foreach ($rows as $row) {
        $clone = $row;
        $k = (string) $key_of($row);
        foreach ($fields as $f) {
            $lookup = $k . '::' . $f;
            if (isset($map[$lookup]) && is_array($clone) && array_key_exists($f, $clone)) {
                $clone[$f] = $map[$lookup];
            }
        }
        $out[] = $clone;
    }
    return $out;
}
