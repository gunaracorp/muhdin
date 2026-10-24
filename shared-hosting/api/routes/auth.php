<?php
/** routes/auth.php — mirror /api/auth/*, /api/users, /api/audit (paritas Node 1:1) */
declare(strict_types=1);

/** @var Router $router */
global $router;

/*
 * Pemetaan file Node → pattern (method = export di route.ts):
 *   src/app/api/auth/login/route.ts      POST   → auth/login
 *   src/app/api/auth/logout/route.ts     POST   → auth/logout
 *   src/app/api/auth/me/route.ts         GET    → auth/me
 *   src/app/api/auth/password/route.ts   PUT    → auth/password
 *   src/app/api/users/route.ts           GET    → users
 *   src/app/api/users/route.ts           POST   → users
 *   src/app/api/users/[id]/route.ts      PATCH  → users/:id
 *   src/app/api/users/[id]/route.ts      DELETE → users/:id
 *   src/app/api/audit/route.ts           GET    → audit
 *
 * Catatan paritas terhadap Node:
 *   - auth/login Node TIDAK memakai rateLimit (route.ts tanpa import
 *     rateLimit) → PHP pun tidak memanggil rate_limit().
 *   - guardSuperAdmin (users GET/POST, audit GET): tanpa sesi → 401
 *     "Tidak diizinkan — silakan login sebagai admin.", sesi non-super →
 *     403 "Hanya Super Admin yang dapat mengelola akun admin." — identik
 *     guard_super() lib.php.
 *   - users/:id PATCH/DELETE memakai requireSuperAdmin() langsung: request
 *     TANPA sesi pun dijawab 403 (bukan 401) → direplikasi persis di sini,
 *     sengaja TIDAK lewat guard_super().
 *   - Hash scrypt warisan Node ("salt:hash") tidak dapat diverifikasi PHP —
 *     verify_password() mengembalikan false → diperlakukan seperti password
 *     salah (401), sesuai perilaku terdokumentasi (worklog Task 29 +
 *     INSTALL.txt: akun demo di-rehash bcrypt saat build).
 *   - Tanggal disimpan epoch-ms (now_ms()); UPDATE selalu set
 *     updatedAt = now_ms() (paritas @updatedAt Prisma); output dilewati
 *     cast_row()/cast_rows() → ISO-8601 + bool.
 */

/* Bentuk user sesi/login Node: { id, email, name, role, isActive } saja. */
$auth_shape_user = static function (array $u): array {
    return [
        'id'       => (string) $u['id'],
        'email'    => (string) $u['email'],
        'name'     => (string) $u['name'],
        'role'     => (string) $u['role'],
        'isActive' => (bool) ((int) ($u['isActive'] ?? 0)),
    ];
};

/* Paritas String(v || "") Node: nilai falsy JS (null/false/0/'') → "". */
$auth_js_str = static function ($v): string {
    if ($v === null || $v === false || $v === 0 || $v === '') return '';
    return is_scalar($v) ? (string) $v : '';
};

/* Paritas ROLES (src/lib/roles.ts). */
$auth_is_role = static function (string $r): bool {
    return in_array($r, ['SUPER_ADMIN', 'ADMIN', 'VERIFIKATOR', 'EDITOR'], true);
};

/* Paritas otherActiveSuperCount(excludeId): jumlah Super Admin aktif lain. */
$auth_other_active_super = static function (string $excludeId): int {
    $row = q_one(
        'SELECT COUNT(*) AS c FROM User WHERE role = ? AND isActive = 1 AND id <> ?',
        ['SUPER_ADMIN', $excludeId]
    );
    return (int) ($row['c'] ?? 0);
};

/* ============================================================ auth/login */
/* Mirror src/app/api/auth/login/route.ts (POST) */
$router->on('POST', 'auth/login', static function (array $params) use ($auth_shape_user, $auth_js_str): void {
    try {
        $email    = strtolower(trim($auth_js_str(body('email'))));
        $password = $auth_js_str(body('password'));
        if ($email === '' || $password === '') fail('Email dan password wajib diisi.');

        $user = q_one('SELECT * FROM User WHERE email = ? LIMIT 1', [$email]);
        if ($user === null || !verify_password($password, (string) $user['password'])) {
            fail('Email atau password salah.', 401);
        }
        // Multi-admin (Task 15-c): akun nonaktif ditolak.
        if (!((int) $user['isActive'])) {
            fail('Akun Anda dinonaktifkan. Hubungi Super Admin.', 403);
        }
        create_session((string) $user['id']);
        try {
            q_exec('UPDATE User SET lastLoginAt = ? WHERE id = ?', [now_ms(), $user['id']]);
        } catch (Throwable $e) { /* paritas .catch(() => {}) Node */ }
        ok(['user' => $auth_shape_user($user)]);
    } catch (Throwable $e) {
        fail('Terjadi kesalahan pada server.', 500);
    }
});

/* =========================================================== auth/logout */
/* Mirror src/app/api/auth/logout/route.ts (POST) */
$router->on('POST', 'auth/logout', static function (array $params): void {
    destroy_session();
    ok(['success' => true]);
});

/* =============================================================== auth/me */
/* Mirror src/app/api/auth/me/route.ts (GET) */
$router->on('GET', 'auth/me', static function (array $params) use ($auth_shape_user): void {
    $user = current_user();
    if ($user === null) ok(['user' => null]);
    ok(['user' => $auth_shape_user($user)]);
});

/* ========================================================= auth/password */
/* Mirror src/app/api/auth/password/route.ts (PUT) — ganti password akun
 * yang sedang login; semua sesi di perangkat LAIN dicabut. */
$router->on('PUT', 'auth/password', static function (array $params): void {
    try {
        $user = current_user();
        if ($user === null) fail('Tidak diizinkan — silakan login sebagai admin.', 401);

        // Paritas zod: currentPassword min 1, newPassword min 8.
        $currentPassword = body('currentPassword');
        if (!is_string($currentPassword) || $currentPassword === '') {
            fail('Password saat ini wajib diisi.');
        }
        $newPassword = body('newPassword');
        if (!is_string($newPassword) || strlen($newPassword) < 8) {
            fail('Password baru minimal 8 karakter.');
        }

        $fresh = q_one('SELECT * FROM User WHERE id = ? LIMIT 1', [$user['id']]);
        if ($fresh === null) fail('Akun tidak ditemukan.', 404);

        if (!verify_password($currentPassword, (string) $fresh['password'])) {
            fail('Password saat ini salah.', 400);
        }
        if (verify_password($newPassword, (string) $fresh['password'])) {
            fail('Password baru sama dengan password lama.');
        }

        $currentToken = read_cookie(MUHDIN_SESSION_COOKIE) ?? '';

        // Paritas db.$transaction: ganti password + cabut sesi lain
        // (sesi saat ini dipertahankan — token <> currentToken).
        $pdo = db();
        $pdo->beginTransaction();
        try {
            q_exec(
                'UPDATE User SET password = ?, updatedAt = ? WHERE id = ?',
                [hash_password($newPassword), now_ms(), $fresh['id']]
            );
            q_exec(
                'DELETE FROM Session WHERE userId = ? AND token <> ?',
                [$fresh['id'], $currentToken]
            );
            $pdo->commit();
        } catch (Throwable $e) {
            $pdo->rollBack();
            throw $e;
        }

        ok([
            'ok'      => true,
            'message' => 'Password berhasil diperbarui. Semua perangkat lain telah dikeluarkan.',
        ]);
    } catch (Throwable $e) {
        fail('Terjadi kesalahan pada server.', 500);
    }
});

/* ============================================================ users (GET) */
/* Mirror src/app/api/users/route.ts (GET) — daftar akun admin. */
$router->on('GET', 'users', static function (array $params): void {
    guard_super(); // 401 tanpa sesi / 403 non-super (paritas guardSuperAdmin)
    try {
        $rows = q_all(
            'SELECT id, email, name, role, isActive, lastLoginAt, createdAt FROM User ORDER BY createdAt ASC'
        );
        ok(cast_rows('User', $rows));
    } catch (Throwable $e) {
        fail('Gagal memuat daftar admin.', 500);
    }
});

/* =========================================================== users (POST) */
/* Mirror src/app/api/users/route.ts (POST) — tambah akun admin. */
$router->on('POST', 'users', static function (array $params) use ($auth_is_role, $auth_js_str): void {
    $me = guard_super();
    try {
        $name     = trim($auth_js_str(body('name')));
        $email    = strtolower(trim($auth_js_str(body('email'))));
        $password = $auth_js_str(body('password'));
        $role     = $auth_js_str(body('role'));
        if ($role === '') $role = 'EDITOR'; // paritas String(body.role || "EDITOR")

        if ($name === '') fail('Nama wajib diisi.');
        if (!preg_match('/^[^@\s]+@[^@\s]+\.[^@\s]+$/', $email)) fail('Format email tidak valid.');
        if (strlen($password) < 8) fail('Password minimal 8 karakter.');
        if (!$auth_is_role($role)) fail('Peran tidak valid.');

        $existing = q_one('SELECT id FROM User WHERE email = ? LIMIT 1', [$email]);
        if ($existing !== null) fail('Email sudah terdaftar.', 409);

        $id  = new_id();
        $now = now_ms();
        q_exec(
            'INSERT INTO User (id, email, password, name, role, isActive, lastLoginAt, createdAt, updatedAt) VALUES (?,?,?,?,?,1,NULL,?,?)',
            [$id, $email, hash_password($password), $name, $role, $now, $now]
        );
        // Task 18 — jejak audit pembuatan akun admin (tanpa data sensitif).
        log_audit($me, 'CREATE', 'User', $id, $name . ' (' . $role . ')');

        $created = q_one(
            'SELECT id, email, name, role, isActive, lastLoginAt, createdAt FROM User WHERE id = ?',
            [$id]
        );
        ok(cast_row('User', $created ?? []), 201);
    } catch (Throwable $e) {
        fail('Gagal menambahkan admin.', 500);
    }
});

/* ======================================================== users/:id PATCH */
/* Mirror src/app/api/users/[id]/route.ts (PATCH) — ubah nama/peran/
 * status/password. Pagar: tidak bisa menurunkan/menonaktifkan diri sendiri;
 * Super Admin aktif terakhir tidak bisa diturunkan/dinonaktifkan. */
$router->on('PATCH', 'users/:id', static function (array $params) use ($auth_is_role, $auth_other_active_super): void {
    // Paritas requireSuperAdmin Node: TANPA sesi pun 403 (bukan 401).
    $me = current_user();
    if ($me === null || $me['role'] !== 'SUPER_ADMIN') {
        fail('Hanya Super Admin yang dapat mengelola akun admin.', 403);
    }
    try {
        $id   = (string) ($params['id'] ?? '');
        $body = json_body();

        $target = q_one('SELECT * FROM User WHERE id = ? LIMIT 1', [$id]);
        if ($target === null) fail('Akun tidak ditemukan.', 404);

        $sets          = [];    // kolom SQL → nilai
        $isActiveFalse = false; // paritas data.isActive === false
        $hasPassword   = false; // paritas data.password terisi

        if (array_key_exists('name', $body)) {
            $name = trim(is_scalar($body['name']) ? (string) $body['name'] : '');
            if ($name === '') fail('Nama tidak boleh kosong.');
            $sets['name'] = $name;
        }

        if (array_key_exists('password', $body) && $body['password'] !== '') {
            $password = is_scalar($body['password']) ? (string) $body['password'] : '';
            if (strlen($password) < 8) fail('Password minimal 8 karakter.');
            $sets['password'] = hash_password($password);
            $hasPassword      = true;
        }

        if (array_key_exists('role', $body)) {
            $role = is_scalar($body['role']) ? (string) $body['role'] : '';
            if ($role !== (string) $target['role']) {
                if (!$auth_is_role($role)) fail('Peran tidak valid.');
                if ($id === (string) $me['id']) fail('Anda tidak dapat mengubah peran akun sendiri.', 400);
                if ((string) $target['role'] === 'SUPER_ADMIN' && (int) $target['isActive'] === 1 && $role !== 'SUPER_ADMIN') {
                    if ($auth_other_active_super($id) === 0) fail('Minimal harus ada satu Super Admin aktif.', 400);
                }
                $sets['role'] = $role;
            }
        }

        if (array_key_exists('isActive', $body)) {
            $newActive = (bool) $body['isActive']; // paritas Boolean(...) JS
            if ($newActive !== (bool) ((int) $target['isActive'])) {
                if ($id === (string) $me['id']) fail('Anda tidak dapat menonaktifkan akun sendiri.', 400);
                if ((int) $target['isActive'] === 1 && (string) $target['role'] === 'SUPER_ADMIN') {
                    if ($auth_other_active_super($id) === 0) fail('Minimal harus ada satu Super Admin aktif.', 400);
                }
                $sets['isActive'] = $newActive ? 1 : 0;
                if (!$newActive) $isActiveFalse = true;
            }
        }

        if ($sets === []) {
            // Tidak ada perubahan → kembalikan baris apa adanya (tanpa audit).
            $unchanged = q_one(
                'SELECT id, email, name, role, isActive, lastLoginAt, createdAt FROM User WHERE id = ?',
                [$id]
            );
            ok(cast_row('User', $unchanged ?? []));
        }

        $cols = [];
        $vals = [];
        foreach ($sets as $col => $val) {
            $cols[] = $col . ' = ?';
            $vals[] = $val;
        }
        $vals[] = now_ms(); // updatedAt (paritas @updatedAt Prisma)
        $vals[] = $id;
        q_exec('UPDATE User SET ' . implode(', ', $cols) . ', updatedAt = ? WHERE id = ?', $vals);

        // Cabut sesi target ketika dinonaktifkan atau password direset.
        if ($isActiveFalse || $hasPassword) {
            q_exec('DELETE FROM Session WHERE userId = ?', [$id]);
        }

        $updated = q_one(
            'SELECT id, email, name, role, isActive, lastLoginAt, createdAt FROM User WHERE id = ?',
            [$id]
        );
        $updated = $updated ?? [];

        // Task 18 — jejak audit perubahan akun admin (tanpa data sensitif).
        log_audit(
            $me,
            'UPDATE',
            'User',
            $id,
            (string) ($updated['name'] ?? '') . ' (' . (string) ($updated['role'] ?? '') . ')'
        );

        ok(cast_row('User', $updated));
    } catch (Throwable $e) {
        fail('Gagal memperbarui akun admin.', 500);
    }
});

/* ======================================================= users/:id DELETE */
/* Mirror src/app/api/users/[id]/route.ts (DELETE) — HARD DELETE
 * (paritas db.user.delete), sesi ikut terhapus (onDelete: Cascade). */
$router->on('DELETE', 'users/:id', static function (array $params) use ($auth_other_active_super): void {
    // Paritas requireSuperAdmin Node: TANPA sesi pun 403 (bukan 401).
    $me = current_user();
    if ($me === null || $me['role'] !== 'SUPER_ADMIN') {
        fail('Hanya Super Admin yang dapat mengelola akun admin.', 403);
    }
    try {
        $id = (string) ($params['id'] ?? '');
        if ($id === (string) $me['id']) fail('Anda tidak dapat menghapus akun sendiri.', 400);

        $target = q_one('SELECT * FROM User WHERE id = ? LIMIT 1', [$id]);
        if ($target === null) fail('Akun tidak ditemukan.', 404);

        if ((string) $target['role'] === 'SUPER_ADMIN' && (int) $target['isActive'] === 1) {
            if ($auth_other_active_super($id) === 0) fail('Minimal harus ada satu Super Admin aktif.', 400);
        }

        // Hard delete — jaga FK Session cascade (dihapus eksplisit + transaksi).
        $pdo = db();
        $pdo->beginTransaction();
        try {
            q_exec('DELETE FROM Session WHERE userId = ?', [$id]);
            q_exec('DELETE FROM User WHERE id = ?', [$id]);
            $pdo->commit();
        } catch (Throwable $e) {
            $pdo->rollBack();
            throw $e;
        }

        // Task 18 — jejak audit penghapusan akun admin (tanpa data sensitif).
        log_audit(
            $me,
            'DELETE',
            'User',
            $id,
            (string) $target['name'] . ' (' . (string) $target['role'] . ')'
        );
        ok(['deleted' => true, 'id' => $id]);
    } catch (Throwable $e) {
        fail('Gagal menghapus akun admin.', 500);
    }
});

/* ================================================================== audit */
/* Mirror src/app/api/audit/route.ts (GET) — ?take= default 100, min 1, max 500. */
$router->on('GET', 'audit', static function (array $params): void {
    guard_super(); // 401 tanpa sesi / 403 non-super (paritas guardSuperAdmin)
    try {
        $raw  = qget('take');
        $take = ($raw === null || !is_numeric($raw)) ? 100 : (int) $raw;
        $take = max(1, min(500, $take));
        $rows = q_all('SELECT * FROM AuditLog ORDER BY createdAt DESC LIMIT ' . $take);
        ok(cast_rows('AuditLog', $rows));
    } catch (Throwable $e) {
        fail('Gagal memuat log audit.', 500);
    }
});
