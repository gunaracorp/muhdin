<?php
/** routes/admin.php — mirror /api/admin/[entity] + /api/whatsapp (paritas Node 1:1) */
declare(strict_types=1);

/** @var Router $router */
global $router;

/**
 * ============================================================================
 * routes/admin.php — ADMIN GENERIK + WHATSAPP (MUHDIN PHP Edition)
 * ----------------------------------------------------------------------------
 * Mirror 1:1 seluruh kontrak admin CRUD Node (src/app/api/<entity>/**) dan
 * konfigurasi WhatsApp (src/app/api/whatsapp/route.ts) dalam SATU dispatcher
 * generik berpola 'admin/:entity' + route whatsapp.
 *
 * Node asli menaruh CRUD per-entity pada /api/<entity>; di edisi PHP satu file
 * ini memuat SEMUA handler admin tsb di belakang pattern 'admin/:entity'
 * (dan 'admin/:entity/:id') dengan ENTITY_MAP whitelist — kontrak per entity
 * (guard, kolom yang boleh ditulis, validasi, pesan error, status code, titik
 * audit log, filter & urutan, terjemahan konten) disalin persis dari handler
 * Node, baris demi baris.
 *
 * Penanggalan: CREATE → id=new_id(), createdAt=now_ms(); UPDATE → updatedAt=
 * now_ms() (hanya utk model yang punya kolom tsb, paritas @updatedAt Prisma).
 * Kolom tanggal lain → date_to_ms(); boolean → 0/1 (bool_int / js-bool).
 * Respons selalu cast_row()/cast_rows() agar DateTime epoch-ms → ISO-8601.
 * ============================================================================
 */

/* ============================================================== ENTITY MAP */
/**
 * Whitelist entity → tabel SQLite (= nama model Prisma) + kolom yang boleh
 * ditulis — salinan PERSIS kumpulan field yang di-set handler Node
 * (union create+update per entity). 'created'/'touch' = keberadaan kolom
 * createdAt/updatedAt pada model (@default(now()) / @updatedAt Prisma).
 */
const ADMIN_ENTITY_MAP = [
    'articles'     => ['table' => 'Article',                'fields' => ['title', 'slug', 'excerpt', 'content', 'category', 'cover', 'status', 'featured', 'author'],
                       'created' => true,  'touch' => true],
    'ecosystems'   => ['table' => 'Ecosystem',              'fields' => ['number', 'name', 'cluster', 'scope', 'standard', 'icon', 'color', 'description', 'image'],
                       'created' => true,  'touch' => true],
    'journey'      => ['table' => 'JourneyStep',            'fields' => ['step', 'title', 'activity', 'actor', 'output', 'icon'],
                       'created' => false, 'touch' => false],
    'roadmap'      => ['table' => 'Roadmap',                'fields' => ['phase', 'period', 'focus', 'deliverables', 'order'],
                       'created' => false, 'touch' => false],
    'members'      => ['table' => 'Member',                 'fields' => ['name', 'type', 'city', 'province', 'licenseNo', 'phone', 'email', 'website', 'description', 'rating', 'status', 'memberSince'],
                       'created' => true,  'touch' => true],
    'applications' => ['table' => 'MembershipApplication',  'fields' => ['orgName', 'type', 'contactName', 'email', 'phone', 'city', 'province', 'licenseNo', 'message', 'ticketCode', 'status', 'reviewNote', 'reviewedBy', 'reviewedAt'],
                       'created' => true,  'touch' => true],
    'tutorials'    => ['table' => 'Tutorial',               'fields' => ['title', 'slug', 'category', 'level', 'duration', 'summary', 'content', 'order', 'published'],
                       'created' => true,  'touch' => true],
    'messages'     => ['table' => 'ContactMessage',         'fields' => ['name', 'email', 'phone', 'subject', 'message', 'status'],
                       'created' => true,  'touch' => false],
    'complaints'   => ['table' => 'Complaint',              'fields' => ['name', 'email', 'phone', 'targetMember', 'category', 'content', 'status', 'responseNote', 'respondedBy', 'respondedAt'],
                       'created' => true,  'touch' => true],
    'subscribers'  => ['table' => 'Subscriber',             'fields' => ['email', 'isActive'],
                       'created' => true,  'touch' => false],
    'faqs'         => ['table' => 'Faq',                    'fields' => ['question', 'answer', 'category', 'order'],
                       'created' => true,  'touch' => false],
    'testimonials' => ['table' => 'Testimonial',            'fields' => ['name', 'role', 'content', 'rating', 'published'],
                       'created' => true,  'touch' => false],
    'management'   => ['table' => 'Management',             'fields' => ['name', 'position', 'bio', 'order'],
                       'created' => false, 'touch' => false],
    'branches'     => ['table' => 'RegionalBranch',         'fields' => ['name', 'code', 'province', 'city', 'officeName', 'address', 'picName', 'picPhone', 'email', 'description', 'order', 'published'],
                       'created' => true,  'touch' => true],
    'gallery'      => ['table' => 'Gallery',                'fields' => ['title', 'caption', 'category', 'imageUrl', 'order', 'published'],
                       'created' => true,  'touch' => true],
    'events'       => ['table' => 'Event',                  'fields' => ['title', 'description', 'location', 'startsAt', 'endsAt', 'category', 'published'],
                       'created' => true,  'touch' => true],
    'resources'    => ['table' => 'Resource',               'fields' => ['title', 'description', 'category', 'fileUrl', 'fileType', 'published'],
                       'created' => true,  'touch' => true],
    'users'        => ['table' => 'User',                   'fields' => ['name', 'email', 'password', 'role', 'isActive'],
                       'created' => true,  'touch' => true],
    'settings'     => ['table' => 'SiteSetting',            'fields' => ['key', 'value'],
                       'created' => false, 'touch' => false],
    'audit'        => ['table' => 'AuditLog',               'fields' => [],
                       'created' => false, 'touch' => false],
];

/** Alias nama entity → nama kanonik (id menu CMS 'agenda' memakai /api/events). */
const ADMIN_ENTITY_ALIASES = ['agenda' => 'events'];

/** Ekspos juga di nama ENTITY_MAP / ENTITY_ALIASES bila belum terpakai file lain. */
if (!defined('ENTITY_MAP')) {
    define('ENTITY_MAP', ADMIN_ENTITY_MAP);
}
if (!defined('ENTITY_ALIASES')) {
    define('ENTITY_ALIASES', ADMIN_ENTITY_ALIASES);
}

/** Peran valid (paritas ROLES src/lib/roles.ts). */
const ADMIN_ROLES = ['SUPER_ADMIN', 'ADMIN', 'VERIFIKATOR', 'EDITOR'];

/** Allowlist key SiteSetting yang boleh diterjemahkan (paritas SETTING_TRANSLATABLE). */
const ADMIN_SETTING_TRANSLATABLE = [
    'heroTitle', 'heroSubtitle', 'vision', 'mission', 'tagline',
    'nusuk_tagline', 'nusuk_desc', 'nusuk_api_note',
];

/* ================================================= koersi nilai gaya JS */
/**
 * Handler Node memakai semantik JavaScript (String(), Boolean(), parseInt(),
 * truthiness `||`). Helper berikut menirunya agar paritas tetap 1:1.
 */

/** String(x) gaya JavaScript untuk nilai body yang sudah defined. */
function admin_js_str($v): string
{
    if (is_bool($v)) return $v ? 'true' : 'false';
    if (is_array($v)) return ''; // kasus objek/array tak relevan utk kolom teks CMS
    return (string) $v;
}

/** Truthiness JavaScript: '', 0, null → falsy; "0", "false" → truthy. */
function admin_js_truthy($v): bool
{
    if (is_bool($v)) return $v;
    if ($v === null) return false;
    if (is_int($v) || is_float($v)) return ((float) $v) !== 0.0;
    if (is_string($v)) return $v !== '';
    return true; // array/objek non-null
}

/** Boolean(x) gaya JavaScript. */
function admin_js_bool($v): bool
{
    return admin_js_truthy($v);
}

/** parseInt(x, 10) gaya JavaScript → null bila NaN. */
function admin_js_parse_int($v): ?int
{
    if ($v === null || is_bool($v) || is_array($v)) return null;
    $s = is_string($v) ? ltrim((string) $v) : (string) $v;
    if ($s === '') return null;
    if (!preg_match('/^[+-]?[0-9]+/', $s, $m)) return null;
    return (int) $m[0];
}

/** parseFloat(x) gaya JavaScript → null bila NaN. */
function admin_js_parse_float($v): ?float
{
    if ($v === null || is_bool($v) || is_array($v)) return null;
    $s = ltrim((string) $v);
    if ($s === '') return null;
    if (!preg_match('/^[+-]?([0-9]+(\.[0-9]*)?|\.[0-9]+)([eE][+-]?[0-9]+)?/', $s, $m)) return null;
    return (float) $m[0];
}

/** parseInt(body.x, 10) || default — 0/NaN jatuh ke default (paritas JS `||`). */
function admin_body_int(string $key, int $default): int
{
    $n = admin_js_parse_int(body($key));
    return ($n !== null && admin_js_truthy($n)) ? $n : $default;
}

/** parseFloat(body.x) || default — 0/NaN jatuh ke default (paritas JS `||`). */
function admin_body_float(string $key, float $default): float
{
    $f = admin_js_parse_float(body($key));
    return ($f !== null && admin_js_truthy($f)) ? $f : $default;
}

/** body ada (tidak undefined) — paritas `body.x !== undefined` Node. */
function admin_body_has(string $key): bool
{
    return array_key_exists($key, json_body());
}

/** String(body.x || fallback) — truthiness JavaScript. */
function admin_body_str(string $key, string $fallback = ''): string
{
    $v = body($key);
    return admin_js_str(admin_js_truthy($v) ? $v : $fallback);
}

/** String(body.x) persis (dipakai Node setelah cek !== undefined; null → "null"). */
function admin_body_str_raw(string $key): string
{
    return admin_js_str(body($key));
}

/** body.x ? String(body.x) : null — paritas kolom nullable Node. */
function admin_body_nullable(string $key): ?string
{
    $v = body($key);
    return admin_js_truthy($v) ? admin_js_str($v) : null;
}

/* ==================================================== SQL baris generik */
function admin_quote_col(string $c): string
{
    return '"' . str_replace('"', '', $c) . '"';
}

/** Baris menurut id (paritas db.x.findUnique/update where id). */
function admin_find(string $table, string $id): ?array
{
    return q_one('SELECT * FROM ' . admin_quote_col($table) . ' WHERE "id" = ? LIMIT 1', [$id]);
}

/**
 * INSERT baris baru: id = new_id() + createdAt/updatedAt = now_ms() sesuai
 * kolom model (paritas @default(now()) / @updatedAt Prisma). Return id baru.
 */
function admin_insert_row(string $table, array $data, bool $hasCreatedAt = true, bool $hasUpdatedAt = true): string
{
    $id = new_id();
    $now = now_ms();
    if ($hasCreatedAt) $data['createdAt'] = $now;
    if ($hasUpdatedAt) $data['updatedAt'] = $now;
    $cols = array_merge(['id'], array_keys($data));
    $sql = 'INSERT INTO ' . admin_quote_col($table)
        . ' (' . implode(', ', array_map('admin_quote_col', $cols)) . ') VALUES ('
        . implode(', ', array_fill(0, count($cols), '?')) . ')';
    q_exec($sql, array_merge([$id], array_values($data)));
    return $id;
}

/** UPDATE kolom whitelist + updatedAt=now_ms() (paritas @updatedAt). Return rowCount. */
function admin_update_row(string $table, string $id, array $data, bool $touch = true): int
{
    if ($touch) $data['updatedAt'] = now_ms();
    if ($data === []) return 0;
    $sets = [];
    foreach (array_keys($data) as $col) {
        $sets[] = admin_quote_col((string) $col) . ' = ?';
    }
    $sql = 'UPDATE ' . admin_quote_col($table) . ' SET ' . implode(', ', $sets) . ' WHERE "id" = ?';
    return q_exec($sql, array_merge(array_values($data), [$id]));
}

/* ==================================================== locale + terjemahan */
/** Paritas localeFromRequest Node: HANYA query ?locale=en|ar (default id). */
function admin_locale(): string
{
    $raw = strtolower((string) (qget('locale') ?? ''));
    return ($raw === 'en' || $raw === 'ar') ? $raw : 'id';
}

/**
 * Paritas applyEntityTranslations Node (edisi PHP tanpa AI): hanya menerapkan
 * cache ContentTranslation yang ada; field tanpa terjemahan tetap memakai
 * teks Indonesia (fallback bawaan).
 */
function admin_apply_translations(array $rows, string $entity, string $locale, callable $keyOf, array $fields): array
{
    if ($locale === 'id' || $rows === []) return $rows;
    try {
        $all = q_all(
            'SELECT entityKey, field, value FROM ContentTranslation WHERE entity = ? AND locale = ?',
            [$entity, $locale]
        );
    } catch (Throwable $e) {
        return $rows;
    }
    $map = [];
    foreach ($all as $t) {
        if (in_array($t['field'], $fields, true)) {
            $map[$t['entityKey'] . '::' . $t['field']] = $t['value'];
        }
    }
    if ($map === []) return $rows;
    foreach ($rows as $i => $row) {
        $key = (string) $keyOf($row);
        foreach ($fields as $field) {
            $k = $key . '::' . $field;
            if (isset($map[$k]) && $map[$k] !== '' && array_key_exists($field, $row)) {
                $rows[$i][$field] = $map[$k];
            }
        }
    }
    return $rows;
}

/** @return array<string,string> map key=>value terjemahan SiteSetting (allowlist). */
function admin_setting_translations(string $locale): array
{
    if ($locale === 'id') return [];
    try {
        $all = q_all(
            'SELECT entityKey, field, value FROM ContentTranslation WHERE entity = ? AND locale = ?',
            ['SiteSetting', $locale]
        );
    } catch (Throwable $e) {
        return [];
    }
    $map = [];
    foreach ($all as $t) {
        if ($t['field'] === 'value' && in_array($t['entityKey'], ADMIN_SETTING_TRANSLATABLE, true)) {
            $map[$t['entityKey']] = $t['value'];
        }
    }
    return $map;
}

/* ======================================================= bantu dispatcher */
function admin_resolve_entity(string $raw): ?string
{
    $e = strtolower(trim($raw));
    if (array_key_exists($e, ADMIN_ENTITY_ALIASES)) {
        $e = ADMIN_ENTITY_ALIASES[$e];
    }
    return isset(ADMIN_ENTITY_MAP[$e]) ? $e : null;
}

/** Kombinasi method+entity yang tidak diekspor Node → 404 ala Router. */
function admin_no_endpoint(string $method, string $entity, ?string $id = null): void
{
    fail('Endpoint tidak ditemukan: ' . strtoupper($method) . ' /admin/' . $entity . ($id !== null ? '/' . $id : ''), 404);
}

/** Guard users/[id] Node memakai requireSuperAdmin: 403 utk semua yang gagal. */
function admin_require_super_403(): array
{
    $u = current_user();
    if ($u === null || $u['role'] !== 'SUPER_ADMIN') {
        fail('Hanya Super Admin yang dapat mengelola akun admin.', 403);
    }
    return $u;
}

/** Baris User terproyeksi (tanpa password) — paritas SELECT Node users. */
function admin_user_select_row(string $id): ?array
{
    $row = q_one(
        'SELECT "id", "email", "name", "role", "isActive", "lastLoginAt", "createdAt" FROM "User" WHERE "id" = ? LIMIT 1',
        [$id]
    );
    return $row === null ? null : cast_row('User', $row);
}

/** Jumlah Super Admin aktif selain $excludeId (paritas otherActiveSuperCount). */
function admin_other_active_super_count(string $excludeId): int
{
    $row = q_one(
        'SELECT COUNT(*) AS c FROM "User" WHERE "role" = ? AND "isActive" = 1 AND "id" != ?',
        ['SUPER_ADMIN', $excludeId]
    );
    return (int) ($row['c'] ?? 0);
}

/** Regex email Node /^[^@\s]+@[^@\s]+\.[^@\s]+$/ */
function admin_valid_email(string $email): bool
{
    return preg_match('/^[^@\s]+@[^@\s]+\.[^@\s]+$/', $email) === 1;
}

/* ================================================== GET admin/:entity */
function admin_entity_list(array $p): void
{
    $method = 'GET';
    $entity = admin_resolve_entity((string) ($p['entity'] ?? ''));
    if ($entity === null) {
        fail('Entity tidak dikenal: ' . (string) ($p['entity'] ?? ''), 404);
    }
    $locale = admin_locale();

    switch ($entity) {
        case 'articles':
            try {
                $status = qget('status');
                $where = [];
                $params = [];
                if ($status === 'all') {
                    // admin mode: tampilkan semua
                } elseif ($status !== null) {
                    $where[] = '"status" = ?';
                    $params[] = $status;
                } else {
                    $where[] = '"status" = \'PUBLISHED\'';
                }
                $category = qget('category');
                if ($category !== null) {
                    $where[] = '"category" = ?';
                    $params[] = $category;
                }
                if (qget('featured') === 'true') {
                    $where[] = '"featured" = 1';
                }
                $q = qget('q');
                if ($q !== null) {
                    $like = '%' . $q . '%';
                    $where[] = '("title" LIKE ? OR "excerpt" LIKE ? OR "content" LIKE ?)';
                    array_push($params, $like, $like, $like);
                }
                $sql = 'SELECT * FROM "Article"' . ($where ? ' WHERE ' . implode(' AND ', $where) : '')
                    . ' ORDER BY "featured" DESC, "createdAt" DESC';
                $limit = qget_int('limit', 0);
                if ($limit > 0) $sql .= ' LIMIT ' . $limit;
                $rows = cast_rows('Article', q_all($sql, $params));
                $rows = admin_apply_translations($rows, 'Article', $locale, static fn (array $r) => $r['slug'] ?? '', ['title', 'excerpt', 'content']);
                ok($rows);
            } catch (Throwable $e) {
                fail('Gagal memuat artikel.', 500);
            }
            return;

        case 'ecosystems':
            try {
                $cluster = qget('cluster');
                $sql = 'SELECT * FROM "Ecosystem"' . ($cluster !== null ? ' WHERE "cluster" = ?' : '') . ' ORDER BY "number" ASC';
                $rows = cast_rows('Ecosystem', q_all($sql, $cluster !== null ? [$cluster] : []));
                $rows = admin_apply_translations($rows, 'Ecosystem', $locale, static fn (array $r) => (string) ($r['number'] ?? ''), ['name', 'scope', 'standard', 'description']);
                ok($rows);
            } catch (Throwable $e) {
                fail('Gagal memuat ekosistem.', 500);
            }
            return;

        case 'journey':
            try {
                $rows = cast_rows('JourneyStep', q_all('SELECT * FROM "JourneyStep" ORDER BY "step" ASC'));
                $rows = admin_apply_translations($rows, 'JourneyStep', $locale, static fn (array $r) => (string) ($r['step'] ?? ''), ['title', 'activity', 'output']);
                ok($rows);
            } catch (Throwable $e) {
                fail('Gagal memuat alur perjalanan.', 500);
            }
            return;

        case 'roadmap':
            try {
                $rows = cast_rows('Roadmap', q_all('SELECT * FROM "Roadmap" ORDER BY "order" ASC'));
                $rows = admin_apply_translations($rows, 'Roadmap', $locale, static fn (array $r) => $r['id'] ?? '', ['phase', 'focus', 'deliverables']);
                ok($rows);
            } catch (Throwable $e) {
                fail('Gagal memuat roadmap.', 500);
            }
            return;

        case 'members':
            try {
                $type = qget('type');
                $status = qget('status');
                $where = [];
                $params = [];
                if ($type !== null) {
                    $where[] = '"type" = ?';
                    $params[] = $type;
                }
                if ($status === 'all') {
                    // admin: semua status
                } elseif ($status !== null) {
                    $where[] = '"status" = ?';
                    $params[] = $status;
                } else {
                    $where[] = '"status" = \'TERVERIFIKASI\'';
                }
                $q = qget('q');
                if ($q !== null) {
                    $like = '%' . $q . '%';
                    $where[] = '("name" LIKE ? OR "city" LIKE ? OR "licenseNo" LIKE ?)';
                    array_push($params, $like, $like, $like);
                }
                $sql = 'SELECT * FROM "Member"' . ($where ? ' WHERE ' . implode(' AND ', $where) : '')
                    . ' ORDER BY "status" ASC, "name" ASC';
                $rows = cast_rows('Member', q_all($sql, $params));
                $rows = admin_apply_translations($rows, 'Member', $locale, static fn (array $r) => $r['id'] ?? '', ['description']);
                ok($rows);
            } catch (Throwable $e) {
                fail('Gagal memuat anggota.', 500);
            }
            return;

        case 'tutorials':
            try {
                $where = [];
                $params = [];
                if (qget('all') !== '1') $where[] = '"published" = 1';
                $category = qget('category');
                if ($category !== null) {
                    $where[] = '"category" = ?';
                    $params[] = $category;
                }
                $q = qget('q');
                if ($q !== null) {
                    $like = '%' . $q . '%';
                    $where[] = '("title" LIKE ? OR "summary" LIKE ? OR "content" LIKE ?)';
                    array_push($params, $like, $like, $like);
                }
                $sql = 'SELECT * FROM "Tutorial"' . ($where ? ' WHERE ' . implode(' AND ', $where) : '')
                    . ' ORDER BY "order" ASC';
                $rows = cast_rows('Tutorial', q_all($sql, $params));
                $rows = admin_apply_translations($rows, 'Tutorial', $locale, static fn (array $r) => $r['slug'] ?? '', ['title', 'summary', 'content']);
                ok($rows);
            } catch (Throwable $e) {
                fail('Gagal memuat tutorial.', 500);
            }
            return;

        case 'faqs':
            try {
                $category = qget('category');
                $sql = 'SELECT * FROM "Faq"' . ($category !== null ? ' WHERE "category" = ?' : '') . ' ORDER BY "order" ASC';
                $rows = cast_rows('Faq', q_all($sql, $category !== null ? [$category] : []));
                $rows = admin_apply_translations($rows, 'Faq', $locale, static fn (array $r) => $r['id'] ?? '', ['question', 'answer']);
                ok($rows);
            } catch (Throwable $e) {
                fail('Gagal memuat FAQ.', 500);
            }
            return;

        case 'testimonials':
            try {
                $all = qget('all') === '1';
                $sql = 'SELECT * FROM "Testimonial"' . ($all ? '' : ' WHERE "published" = 1') . ' ORDER BY "createdAt" DESC';
                $rows = cast_rows('Testimonial', q_all($sql));
                $rows = admin_apply_translations($rows, 'Testimonial', $locale, static fn (array $r) => $r['id'] ?? '', ['role', 'content']);
                ok($rows);
            } catch (Throwable $e) {
                fail('Gagal memuat testimoni.', 500);
            }
            return;

        case 'management':
            try {
                $rows = cast_rows('Management', q_all('SELECT * FROM "Management" ORDER BY "order" ASC'));
                $rows = admin_apply_translations($rows, 'Management', $locale, static fn (array $r) => $r['id'] ?? '', ['position', 'bio']);
                ok($rows);
            } catch (Throwable $e) {
                fail('Gagal memuat struktur organisasi.', 500);
            }
            return;

        case 'branches':
            try {
                if (qget('all') === '1' && current_user() !== null) {
                    ok(cast_rows('RegionalBranch', q_all('SELECT * FROM "RegionalBranch" ORDER BY "order" ASC, "createdAt" ASC')));
                }
                $rows = cast_rows('RegionalBranch', q_all('SELECT * FROM "RegionalBranch" WHERE "published" = 1 ORDER BY "order" ASC, "createdAt" ASC'));
                $rows = admin_apply_translations($rows, 'RegionalBranch', $locale, static fn (array $r) => $r['id'] ?? '', ['name', 'officeName', 'address', 'description']);
                ok($rows);
            } catch (Throwable $e) {
                fail('Gagal memuat jaringan daerah.', 500);
            }
            return;

        case 'gallery':
            try {
                if (qget('all') === '1' && current_user() !== null) {
                    ok(cast_rows('Gallery', q_all('SELECT * FROM "Gallery" ORDER BY "order" ASC, "createdAt" ASC')));
                }
                ok(cast_rows('Gallery', q_all('SELECT * FROM "Gallery" WHERE "published" = 1 ORDER BY "order" ASC, "createdAt" ASC')));
            } catch (Throwable $e) {
                fail('Gagal memuat galeri.', 500);
            }
            return;

        case 'events':
            try {
                if (qget('all') === '1' && current_user() !== null) {
                    ok(cast_rows('Event', q_all('SELECT * FROM "Event" ORDER BY "startsAt" ASC')));
                }
                ok(cast_rows('Event', q_all('SELECT * FROM "Event" WHERE "published" = 1 ORDER BY "startsAt" ASC')));
            } catch (Throwable $e) {
                fail('Gagal memuat agenda.', 500);
            }
            return;

        case 'resources':
            try {
                if (qget('all') === '1' && current_user() !== null) {
                    ok(cast_rows('Resource', q_all('SELECT * FROM "Resource" ORDER BY "createdAt" DESC')));
                }
                ok(cast_rows('Resource', q_all('SELECT * FROM "Resource" WHERE "published" = 1 ORDER BY "category" ASC, "createdAt" DESC')));
            } catch (Throwable $e) {
                fail('Gagal memuat dokumen.', 500);
            }
            return;

        case 'messages':
            guard_admin();
            try {
                $status = qget('status');
                $sql = 'SELECT * FROM "ContactMessage"' . ($status !== null ? ' WHERE "status" = ?' : '') . ' ORDER BY "createdAt" DESC';
                ok(cast_rows('ContactMessage', q_all($sql, $status !== null ? [$status] : [])));
            } catch (Throwable $e) {
                fail('Gagal memuat pesan.', 500);
            }
            return;

        case 'complaints':
            guard_admin();
            try {
                $status = qget('status');
                $sql = 'SELECT * FROM "Complaint"' . ($status !== null ? ' WHERE "status" = ?' : '') . ' ORDER BY "createdAt" DESC';
                ok(cast_rows('Complaint', q_all($sql, $status !== null ? [$status] : [])));
            } catch (Throwable $e) {
                fail('Gagal memuat pengaduan.', 500);
            }
            return;

        case 'applications':
            guard_admin();
            try {
                ok(cast_rows('MembershipApplication', q_all('SELECT * FROM "MembershipApplication" ORDER BY "createdAt" DESC')));
            } catch (Throwable $e) {
                fail('Gagal memuat pendaftaran.', 500);
            }
            return;

        case 'subscribers':
            guard_role(['SUPER_ADMIN', 'ADMIN']);
            try {
                ok(cast_rows('Subscriber', q_all('SELECT * FROM "Subscriber" ORDER BY "createdAt" DESC')));
            } catch (Throwable $e) {
                fail('Gagal memuat pelanggan.', 500);
            }
            return;

        case 'users':
            guard_super();
            try {
                $rows = q_all('SELECT "id", "email", "name", "role", "isActive", "lastLoginAt", "createdAt" FROM "User" ORDER BY "createdAt" ASC');
                ok(cast_rows('User', $rows));
            } catch (Throwable $e) {
                fail('Gagal memuat daftar admin.', 500);
            }
            return;

        case 'settings':
            try {
                $rows = q_all('SELECT "key", "value" FROM "SiteSetting"');
                $map = [];
                $trans = admin_setting_translations($locale);
                foreach ($rows as $s) {
                    $key = (string) $s['key'];
                    $map[$key] = isset($trans[$key]) && $trans[$key] !== '' ? $trans[$key] : (string) $s['value'];
                }
                ok($map);
            } catch (Throwable $e) {
                fail('Gagal memuat pengaturan.', 500);
            }
            return;

        case 'audit':
            guard_super();
            try {
                $takeRaw = admin_js_parse_int(qget('take') ?? '100');
                $take = $takeRaw === null ? 100 : $takeRaw;
                $take = max(1, min(500, $take));
                ok(cast_rows('AuditLog', q_all('SELECT * FROM "AuditLog" ORDER BY "createdAt" DESC LIMIT ' . $take)));
            } catch (Throwable $e) {
                fail('Gagal memuat log audit.', 500);
            }
            return;

        default:
            admin_no_endpoint($method, $entity);
    }
}

/* ================================================= POST admin/:entity */
function admin_entity_create(array $p): void
{
    $entity = admin_resolve_entity((string) ($p['entity'] ?? ''));
    if ($entity === null) {
        fail('Entity tidak dikenal: ' . (string) ($p['entity'] ?? ''), 404);
    }

    switch ($entity) {
        case 'articles':
            guard_admin();
            try {
                $title = trim(admin_body_str('title'));
                if ($title === '') fail('Judul wajib diisi.');
                $slug = slugify(admin_body_str('slug', $title));
                if ($slug === '') $slug = 'artikel-' . now_ms();
                $exists = q_one('SELECT "id" FROM "Article" WHERE "slug" = ? LIMIT 1', [$slug]);
                $excerpt = trim(admin_body_str('excerpt'));
                $data = [
                    'title'    => $title,
                    'slug'     => $exists !== null ? $slug . '-' . base_convert((string) now_ms(), 10, 36) : $slug,
                    'excerpt'  => $excerpt !== '' ? $excerpt : mb_substr($title, 0, 140),
                    'content'  => admin_body_str('content'),
                    'category' => admin_body_str('category', 'Berita'),
                    'cover'    => admin_body_nullable('cover'),
                    'status'   => admin_body_str('status', 'PUBLISHED'),
                    'featured' => admin_js_bool(body('featured')) ? 1 : 0,
                    'author'   => admin_body_str('author', 'Tim MUHDIN'),
                ];
                $id = admin_insert_row('Article', $data);
                ok(cast_row('Article', admin_find('Article', $id) ?? []), 201);
            } catch (Throwable $e) {
                fail('Gagal membuat artikel.', 500);
            }
            return;

        case 'ecosystems':
            guard_admin();
            try {
                $number = admin_js_parse_int(body('number'));
                if (!admin_js_truthy(body('name')) || $number === null) {
                    fail('Nomor dan nama ekosistem wajib diisi.');
                }
                $data = [
                    'number'      => $number,
                    'name'        => admin_body_str('name'),
                    'cluster'     => admin_body_str('cluster', 'Akses & Mobilitas'),
                    'scope'       => admin_body_str('scope'),
                    'standard'    => admin_body_str('standard'),
                    'icon'        => admin_body_str('icon', 'hexagon'),
                    'color'       => admin_body_str('color', 'emerald'),
                    'description' => admin_body_str('description'),
                    'image'       => admin_body_nullable('image'),
                ];
                $id = admin_insert_row('Ecosystem', $data);
                ok(cast_row('Ecosystem', admin_find('Ecosystem', $id) ?? []), 201);
            } catch (Throwable $e) {
                fail('Gagal membuat ekosistem — nomor mungkin sudah dipakai.', 500);
            }
            return;

        case 'journey':
            guard_admin();
            try {
                $step = admin_js_parse_int(body('step'));
                if (!admin_js_truthy(body('title')) || $step === null) {
                    fail('Tahap dan judul wajib diisi.');
                }
                $data = [
                    'step'     => $step,
                    'title'    => admin_body_str('title'),
                    'activity' => admin_body_str('activity'),
                    'actor'    => admin_body_str('actor'),
                    'output'   => admin_body_str('output'),
                    'icon'     => admin_body_str('icon', 'circle'),
                ];
                $id = admin_insert_row('JourneyStep', $data, false, false);
                ok(cast_row('JourneyStep', admin_find('JourneyStep', $id) ?? []), 201);
            } catch (Throwable $e) {
                fail('Gagal membuat tahap — nomor mungkin sudah dipakai.', 500);
            }
            return;

        case 'roadmap':
            guard_admin();
            try {
                $data = [
                    'phase'        => admin_body_str('phase', 'Fase'),
                    'period'       => admin_body_str('period'),
                    'focus'        => admin_body_str('focus'),
                    'deliverables' => admin_body_str('deliverables'),
                    'order'        => admin_body_int('order', 99),
                ];
                $id = admin_insert_row('Roadmap', $data, false, false);
                ok(cast_row('Roadmap', admin_find('Roadmap', $id) ?? []), 201);
            } catch (Throwable $e) {
                fail('Gagal membuat fase roadmap.', 500);
            }
            return;

        case 'members':
            $user = guard_role(['SUPER_ADMIN', 'ADMIN']);
            try {
                $name = admin_body_str('name');
                $licenseNo = admin_body_str('licenseNo');
                if ($name === '' || $licenseNo === '') fail('Nama dan nomor izin wajib diisi.');
                $data = [
                    'name'        => $name,
                    'type'        => admin_body_str('type', 'PPIU'),
                    'city'        => admin_body_str('city'),
                    'province'    => admin_body_str('province'),
                    'licenseNo'   => $licenseNo,
                    'phone'       => admin_body_nullable('phone'),
                    'email'       => admin_body_nullable('email'),
                    'website'     => admin_body_nullable('website'),
                    'description' => admin_body_nullable('description'),
                    'rating'      => admin_body_float('rating', 4.5),
                    'status'      => admin_body_str('status', 'TERVERIFIKASI'),
                    'memberSince' => admin_body_int('memberSince', (int) date('Y')),
                ];
                $id = admin_insert_row('Member', $data);
                // Task 18 — jejak audit pembuatan anggota.
                log_audit($user, 'CREATE', 'Member', $id, $name);
                ok(cast_row('Member', admin_find('Member', $id) ?? []), 201);
            } catch (Throwable $e) {
                fail('Gagal menambah anggota.', 500);
            }
            return;

        case 'tutorials':
            guard_admin();
            try {
                $title = trim(admin_body_str('title'));
                if ($title === '') fail('Judul wajib diisi.');
                $slug = slugify(admin_body_str('slug', $title));
                if ($slug === '') $slug = 'tutorial-' . now_ms();
                $exists = q_one('SELECT "id" FROM "Tutorial" WHERE "slug" = ? LIMIT 1', [$slug]);
                $data = [
                    'title'     => $title,
                    'slug'      => $exists !== null ? $slug . '-' . base_convert((string) now_ms(), 10, 36) : $slug,
                    'category'  => admin_body_str('category', 'Umum'),
                    'level'     => admin_body_str('level', 'Pemula'),
                    'duration'  => admin_body_int('duration', 10),
                    'summary'   => admin_body_str('summary'),
                    'content'   => admin_body_str('content'),
                    'order'     => admin_body_int('order', 99),
                    'published' => admin_body_has('published') ? (admin_js_bool(body('published')) ? 1 : 0) : 1,
                ];
                $id = admin_insert_row('Tutorial', $data);
                ok(cast_row('Tutorial', admin_find('Tutorial', $id) ?? []), 201);
            } catch (Throwable $e) {
                fail('Gagal membuat tutorial.', 500);
            }
            return;

        case 'faqs':
            guard_admin();
            try {
                if (!admin_js_truthy(body('question')) || !admin_js_truthy(body('answer'))) {
                    fail('Pertanyaan dan jawaban wajib diisi.');
                }
                $data = [
                    'question' => admin_body_str('question'),
                    'answer'   => admin_body_str('answer'),
                    'category' => admin_body_str('category', 'Umum'),
                    'order'    => admin_body_int('order', 99),
                ];
                $id = admin_insert_row('Faq', $data, true, false);
                ok(cast_row('Faq', admin_find('Faq', $id) ?? []), 201);
            } catch (Throwable $e) {
                fail('Gagal membuat FAQ.', 500);
            }
            return;

        case 'testimonials':
            // Publik — testimoni masuk sebagai unpublished utk moderasi admin.
            try {
                if (!admin_js_truthy(body('name')) || !admin_js_truthy(body('content'))) {
                    fail('Nama dan isi testimoni wajib diisi.');
                }
                $data = [
                    'name'      => admin_body_str('name'),
                    'role'      => admin_body_str('role', 'Jamaah'),
                    'content'   => admin_body_str('content'),
                    'rating'    => admin_body_int('rating', 5),
                    'published' => 0,
                ];
                $id = admin_insert_row('Testimonial', $data, true, false);
                ok(cast_row('Testimonial', admin_find('Testimonial', $id) ?? []), 201);
            } catch (Throwable $e) {
                fail('Gagal mengirim testimoni.', 500);
            }
            return;

        case 'management':
            guard_admin();
            try {
                if (!admin_js_truthy(body('name')) || !admin_js_truthy(body('position'))) {
                    fail('Nama dan jabatan wajib diisi.');
                }
                $data = [
                    'name'     => admin_body_str('name'),
                    'position' => admin_body_str('position'),
                    'bio'      => admin_body_nullable('bio'),
                    'order'    => admin_body_int('order', 99),
                ];
                $id = admin_insert_row('Management', $data, false, false);
                ok(cast_row('Management', admin_find('Management', $id) ?? []), 201);
            } catch (Throwable $e) {
                fail('Gagal menambah pengurus.', 500);
            }
            return;

        case 'messages':
            // Task 18 — rem spam: maksimal 5 pesan/menit per IP.
            if (!rate_limit('messages')) {
                fail('Terlalu banyak percobaan. Coba lagi beberapa saat.', 429);
            }
            try {
                $name = trim(admin_body_str('name'));
                $email = trim(admin_body_str('email'));
                $message = trim(admin_body_str('message'));
                $subject = trim(admin_body_str('subject'));
                if ($name === '' || $email === '' || $message === '' || $subject === '') {
                    fail('Nama, email, subjek, dan pesan wajib diisi.');
                }
                if (!admin_valid_email($email)) fail('Format email tidak valid.');
                $data = [
                    'name'    => $name,
                    'email'   => $email,
                    'subject' => $subject,
                    'message' => $message,
                    'phone'   => admin_body_nullable('phone'),
                ];
                $id = admin_insert_row('ContactMessage', $data, true, false);
                // Task 15-d — notifikasi WhatsApp (fire-and-forget, gagal-aman).
                wa_notify('contact', [
                    'name'    => $name,
                    'email'   => $email,
                    'phone'   => $data['phone'],
                    'subject' => $subject,
                    'message' => $message,
                ]);
                ok(cast_row('ContactMessage', admin_find('ContactMessage', $id) ?? []), 201);
            } catch (Throwable $e) {
                fail('Gagal mengirim pesan.', 500);
            }
            return;

        case 'complaints':
            // Task 18 — rem spam: maksimal 5 pengaduan/menit per IP.
            if (!rate_limit('complaints')) {
                fail('Terlalu banyak percobaan. Coba lagi beberapa saat.', 429);
            }
            try {
                $name = trim(admin_body_str('name'));
                $email = trim(admin_body_str('email'));
                $content = trim(admin_body_str('content'));
                if ($name === '' || $email === '' || $content === '') {
                    fail('Nama, email, dan isi laporan wajib diisi.');
                }
                if (!admin_valid_email($email)) fail('Format email tidak valid.');
                $data = [
                    'name'         => $name,
                    'email'        => $email,
                    'phone'        => admin_body_nullable('phone'),
                    'targetMember' => admin_body_nullable('targetMember'),
                    'category'     => admin_body_str('category', 'Pelayanan'),
                    'content'      => $content,
                ];
                $id = admin_insert_row('Complaint', $data);
                // Task 15-d/18 — notifikasi WhatsApp (fire-and-forget, gagal-aman).
                wa_notify('complaint', [
                    'name'         => $name,
                    'targetMember' => $data['targetMember'],
                    'category'     => $data['category'],
                ]);
                ok(cast_row('Complaint', admin_find('Complaint', $id) ?? []), 201);
            } catch (Throwable $e) {
                fail('Gagal mengirim pengaduan.', 500);
            }
            return;

        case 'subscribers':
            // Task 18 — rem spam + email duplikat tetap 201 {already:true} (privasi).
            if (!rate_limit('subscribers')) {
                fail('Terlalu banyak percobaan. Coba lagi beberapa saat.', 429);
            }
            try {
                $email = strtolower(trim(admin_body_str('email')));
                if (!admin_valid_email($email)) fail('Format email tidak valid.');
                try {
                    admin_insert_row('Subscriber', ['email' => $email], true, false);
                    ok(['ok' => true, 'already' => false], 201);
                } catch (PDOException $e) {
                    // P2002 (email unik): jangan bocorkan bahwa email sudah terdaftar.
                    if (strpos($e->getMessage(), 'UNIQUE constraint failed') !== false) {
                        ok(['ok' => true, 'already' => true], 201);
                    }
                    throw $e;
                }
            } catch (Throwable $e) {
                fail('Gagal mendaftarkan langganan.', 500);
            }
            return;

        case 'branches':
            $user = guard_role(['SUPER_ADMIN', 'ADMIN', 'EDITOR']);
            try {
                $name = trim(admin_body_str('name'));
                if ($name === '') fail('Nama kepengurusan daerah wajib diisi.');
                $data = [
                    'name'        => $name,
                    'code'        => trim(admin_body_str('code')),
                    'province'    => trim(admin_body_str('province')),
                    'city'        => trim(admin_body_str('city')),
                    'officeName'  => trim(admin_body_str('officeName')),
                    'address'     => trim(admin_body_str('address')),
                    'picName'     => trim(admin_body_str('picName')),
                    'picPhone'    => trim(admin_body_str('picPhone')),
                    'email'       => admin_body_nullable('email') !== null ? trim(admin_body_str('email')) : null,
                    'description' => admin_body_nullable('description'),
                    'order'       => admin_body_int('order', 99),
                    'published'   => admin_body_has('published') ? (admin_js_bool(body('published')) ? 1 : 0) : 1,
                ];
                $id = admin_insert_row('RegionalBranch', $data);
                log_audit($user, 'CREATE', 'RegionalBranch', $id, $name);
                ok(cast_row('RegionalBranch', admin_find('RegionalBranch', $id) ?? []), 201);
            } catch (Throwable $e) {
                fail('Gagal menambah jaringan daerah.', 500);
            }
            return;

        case 'gallery':
            guard_role(['SUPER_ADMIN', 'ADMIN', 'EDITOR']);
            try {
                $title = trim(admin_body_str('title'));
                $imageUrl = trim(admin_body_str('imageUrl'));
                if ($title === '' || $imageUrl === '') fail('Judul dan URL gambar wajib diisi.');
                $data = [
                    'title'     => $title,
                    'caption'   => admin_body_nullable('caption'),
                    'category'  => admin_body_str('category', 'Kegiatan'),
                    'imageUrl'  => $imageUrl,
                    'order'     => admin_js_parse_int(body('order')) ?? 0,
                    'published' => admin_body_has('published') ? (admin_js_bool(body('published')) ? 1 : 0) : 1,
                ];
                $id = admin_insert_row('Gallery', $data);
                ok(cast_row('Gallery', admin_find('Gallery', $id) ?? []), 201);
            } catch (Throwable $e) {
                fail('Gagal menambah galeri.', 500);
            }
            return;

        case 'events':
            guard_role(['SUPER_ADMIN', 'ADMIN', 'EDITOR']);
            try {
                $title = trim(admin_body_str('title'));
                if ($title === '') fail('Judul agenda wajib diisi.');
                $startsAtMs = date_to_ms(admin_body_str('startsAt'));
                if (!admin_js_truthy(body('startsAt')) || $startsAtMs === null) {
                    fail('Tanggal & jam mulai (startsAt) wajib dan harus valid.');
                }
                $endsAtMs = null;
                if (admin_js_truthy(body('endsAt'))) {
                    $endsAtMs = date_to_ms(admin_body_str('endsAt'));
                    if ($endsAtMs === null) fail('Tanggal selesai (endsAt) tidak valid.');
                }
                $data = [
                    'title'       => $title,
                    'description' => trim(admin_body_str('description')),
                    'location'    => trim(admin_body_str('location')),
                    'startsAt'    => $startsAtMs,
                    'endsAt'      => $endsAtMs,
                    'category'    => admin_body_str('category', 'Kegiatan'),
                    'published'   => admin_body_has('published') ? (admin_js_bool(body('published')) ? 1 : 0) : 1,
                ];
                $id = admin_insert_row('Event', $data);
                ok(cast_row('Event', admin_find('Event', $id) ?? []), 201);
            } catch (Throwable $e) {
                fail('Gagal menambah agenda.', 500);
            }
            return;

        case 'resources':
            guard_role(['SUPER_ADMIN', 'ADMIN', 'EDITOR']);
            try {
                $title = trim(admin_body_str('title'));
                $fileUrl = trim(admin_body_str('fileUrl'));
                if ($title === '' || $fileUrl === '') fail('Judul dan URL berkas wajib diisi.');
                $data = [
                    'title'       => $title,
                    'description' => admin_body_nullable('description'),
                    'category'    => admin_body_str('category', 'Formulir'),
                    'fileUrl'     => $fileUrl,
                    'fileType'    => admin_body_str('fileType', 'PDF'),
                    'published'   => admin_body_has('published') ? (admin_js_bool(body('published')) ? 1 : 0) : 1,
                ];
                $id = admin_insert_row('Resource', $data);
                ok(cast_row('Resource', admin_find('Resource', $id) ?? []), 201);
            } catch (Throwable $e) {
                fail('Gagal menambah dokumen.', 500);
            }
            return;

        case 'users':
            $user = guard_super();
            try {
                $name = trim(admin_body_str('name'));
                $email = strtolower(trim(admin_body_str('email')));
                $password = admin_body_str('password');
                $role = admin_body_str('role', 'EDITOR');
                if ($name === '') fail('Nama wajib diisi.');
                if (!admin_valid_email($email)) fail('Format email tidak valid.');
                if (mb_strlen($password) < 8) fail('Password minimal 8 karakter.');
                if (!in_array($role, ADMIN_ROLES, true)) fail('Peran tidak valid.');
                $existing = q_one('SELECT "id" FROM "User" WHERE "email" = ? LIMIT 1', [$email]);
                if ($existing !== null) fail('Email sudah terdaftar.', 409);
                $id = admin_insert_row('User', [
                    'name'     => $name,
                    'email'    => $email,
                    'password' => hash_password($password),
                    'role'     => $role,
                ]);
                // Task 18 — jejak audit pembuatan akun admin (tanpa data sensitif).
                log_audit($user, 'CREATE', 'User', $id, $name . ' (' . $role . ')');
                ok(admin_user_select_row($id) ?? [], 201);
            } catch (Throwable $e) {
                fail('Gagal menambahkan admin.', 500);
            }
            return;

        case 'applications':
            // POST publik (form Gabung) — paritas POST /api/applications.
            if (!rate_limit('applications')) {
                fail('Terlalu banyak percobaan. Coba lagi beberapa saat.', 429);
            }
            try {
                $required = ['orgName', 'type', 'contactName', 'email', 'phone', 'city', 'licenseNo'];
                foreach ($required as $f) {
                    if (trim(admin_body_str($f)) === '') fail('Kolom ' . $f . ' wajib diisi.');
                }
                if (!admin_valid_email(trim(admin_body_str('email')))) fail('Format email tidak valid.');
                $ticketCode = generate_ticket_code();
                $data = [
                    'orgName'     => trim(admin_body_str('orgName')),
                    'type'        => admin_body_str('type'),
                    'contactName' => trim(admin_body_str('contactName')),
                    'email'       => trim(admin_body_str('email')),
                    'phone'       => trim(admin_body_str('phone')),
                    'city'        => trim(admin_body_str('city')),
                    'province'    => trim(admin_body_str('province')),
                    'licenseNo'   => trim(admin_body_str('licenseNo')),
                    'message'     => admin_body_nullable('message'),
                    'ticketCode'  => $ticketCode, // Task 18 — kode pelacakan publik
                ];
                $id = admin_insert_row('MembershipApplication', $data);
                // Task 15-d/18 — notifikasi WhatsApp (fire-and-forget, gagal-aman).
                wa_notify('application', [
                    'orgName'     => $data['orgName'],
                    'type'        => $data['type'],
                    'contactName' => $data['contactName'],
                    'email'       => $data['email'],
                    'phone'       => $data['phone'],
                    'city'        => $data['city'],
                    'licenseNo'   => $data['licenseNo'],
                    'ticketCode'  => $ticketCode,
                ]);
                ok(cast_row('MembershipApplication', admin_find('MembershipApplication', $id) ?? []), 201);
            } catch (Throwable $e) {
                fail('Gagal mengirim pendaftaran.', 500);
            }
            return;

        default:
            // settings/audit tidak punya POST di Node.
            admin_no_endpoint('POST', $entity);
    }
}

/* ============================================ GET admin/:entity/:id */
function admin_entity_show(array $p): void
{
    $entity = admin_resolve_entity((string) ($p['entity'] ?? ''));
    $id = (string) ($p['id'] ?? '');
    if ($entity === null) {
        fail('Entity tidak dikenal: ' . (string) ($p['entity'] ?? ''), 404);
    }
    // Node hanya mengekspor GET [id] utk articles/ecosystems/tutorials (publik).
    switch ($entity) {
        case 'articles':
            $row = admin_find('Article', $id);
            if ($row === null) fail('Artikel tidak ditemukan.', 404);
            ok(cast_row('Article', $row));
            return;
        case 'ecosystems':
            $row = admin_find('Ecosystem', $id);
            if ($row === null) fail('Ekosistem tidak ditemukan.', 404);
            ok(cast_row('Ecosystem', $row));
            return;
        case 'tutorials':
            $row = admin_find('Tutorial', $id);
            if ($row === null) fail('Tutorial tidak ditemukan.', 404);
            ok(cast_row('Tutorial', $row));
            return;
        default:
            admin_no_endpoint('GET', $entity, $id);
    }
}

/* ============================== PUT/PATCH admin/:entity/:id */
function admin_entity_update(array $p): void
{
    $method = strtoupper($_SERVER['REQUEST_METHOD'] ?? 'PUT');
    $entity = admin_resolve_entity((string) ($p['entity'] ?? ''));
    $id = (string) ($p['id'] ?? '');
    if ($entity === null) {
        fail('Entity tidak dikenal: ' . (string) ($p['entity'] ?? ''), 404);
    }

    switch ($entity) {
        case 'articles':
            guard_admin();
            try {
                $data = [];
                if (admin_body_has('title')) $data['title'] = trim(admin_body_str_raw('title'));
                if (admin_body_has('excerpt')) $data['excerpt'] = admin_body_str_raw('excerpt');
                if (admin_body_has('content')) $data['content'] = admin_body_str_raw('content');
                if (admin_body_has('category')) $data['category'] = admin_body_str_raw('category');
                if (admin_body_has('cover')) $data['cover'] = admin_body_nullable('cover');
                if (admin_body_has('status')) $data['status'] = admin_body_str_raw('status');
                if (admin_body_has('featured')) $data['featured'] = admin_js_bool(body('featured')) ? 1 : 0;
                if (admin_body_has('author')) $data['author'] = admin_body_str_raw('author');
                if (admin_body_has('slug')) {
                    $slug = slugify(admin_body_str_raw('slug'));
                    if ($slug !== '') $data['slug'] = $slug;
                }
                if (admin_update_row('Article', $id, $data) === 0 && admin_find('Article', $id) === null) {
                    fail('Gagal memperbarui artikel.', 500); // Prisma P2025 → catch Node
                }
                ok(cast_row('Article', admin_find('Article', $id) ?? []));
            } catch (Throwable $e) {
                fail('Gagal memperbarui artikel.', 500);
            }
            return;

        case 'ecosystems':
            guard_admin();
            try {
                $data = [];
                if (admin_body_has('number')) {
                    $n = admin_js_parse_int(body('number'));
                    if ($n === null) fail('Gagal memperbarui ekosistem.', 500); // NaN → throw Node
                    $data['number'] = $n;
                }
                if (admin_body_has('name')) $data['name'] = admin_body_str_raw('name');
                if (admin_body_has('cluster')) $data['cluster'] = admin_body_str_raw('cluster');
                if (admin_body_has('scope')) $data['scope'] = admin_body_str_raw('scope');
                if (admin_body_has('standard')) $data['standard'] = admin_body_str_raw('standard');
                if (admin_body_has('icon')) $data['icon'] = admin_body_str_raw('icon');
                if (admin_body_has('color')) $data['color'] = admin_body_str_raw('color');
                if (admin_body_has('description')) $data['description'] = admin_body_str_raw('description');
                if (admin_body_has('image')) $data['image'] = admin_body_nullable('image');
                if (admin_update_row('Ecosystem', $id, $data) === 0 && admin_find('Ecosystem', $id) === null) {
                    fail('Gagal memperbarui ekosistem.', 500);
                }
                ok(cast_row('Ecosystem', admin_find('Ecosystem', $id) ?? []));
            } catch (Throwable $e) {
                fail('Gagal memperbarui ekosistem.', 500);
            }
            return;

        case 'journey':
            guard_admin();
            try {
                $data = [];
                if (admin_body_has('step')) {
                    $n = admin_js_parse_int(body('step'));
                    if ($n === null) fail('Gagal memperbarui tahap.', 500);
                    $data['step'] = $n;
                }
                if (admin_body_has('title')) $data['title'] = admin_body_str_raw('title');
                if (admin_body_has('activity')) $data['activity'] = admin_body_str_raw('activity');
                if (admin_body_has('actor')) $data['actor'] = admin_body_str_raw('actor');
                if (admin_body_has('output')) $data['output'] = admin_body_str_raw('output');
                if (admin_body_has('icon')) $data['icon'] = admin_body_str_raw('icon');
                if (admin_update_row('JourneyStep', $id, $data, false) === 0 && admin_find('JourneyStep', $id) === null) {
                    fail('Gagal memperbarui tahap.', 500);
                }
                ok(cast_row('JourneyStep', admin_find('JourneyStep', $id) ?? []));
            } catch (Throwable $e) {
                fail('Gagal memperbarui tahap.', 500);
            }
            return;

        case 'roadmap':
            guard_admin();
            try {
                $data = [];
                if (admin_body_has('phase')) $data['phase'] = admin_body_str_raw('phase');
                if (admin_body_has('period')) $data['period'] = admin_body_str_raw('period');
                if (admin_body_has('focus')) $data['focus'] = admin_body_str_raw('focus');
                if (admin_body_has('deliverables')) $data['deliverables'] = admin_body_str_raw('deliverables');
                if (admin_body_has('order')) $data['order'] = admin_js_parse_int(body('order')) ?? 0;
                if (admin_update_row('Roadmap', $id, $data, false) === 0 && admin_find('Roadmap', $id) === null) {
                    fail('Gagal memperbarui fase roadmap.', 500);
                }
                ok(cast_row('Roadmap', admin_find('Roadmap', $id) ?? []));
            } catch (Throwable $e) {
                fail('Gagal memperbarui fase roadmap.', 500);
            }
            return;

        case 'members':
            $user = guard_role(['SUPER_ADMIN', 'ADMIN', 'VERIFIKATOR']);
            try {
                $data = [];
                if (admin_body_has('name')) $data['name'] = admin_body_str_raw('name');
                if (admin_body_has('type')) $data['type'] = admin_body_str_raw('type');
                if (admin_body_has('city')) $data['city'] = admin_body_str_raw('city');
                if (admin_body_has('province')) $data['province'] = admin_body_str_raw('province');
                if (admin_body_has('licenseNo')) $data['licenseNo'] = admin_body_str_raw('licenseNo');
                if (admin_body_has('phone')) $data['phone'] = admin_body_nullable('phone');
                if (admin_body_has('email')) $data['email'] = admin_body_nullable('email');
                if (admin_body_has('website')) $data['website'] = admin_body_nullable('website');
                if (admin_body_has('description')) $data['description'] = admin_body_nullable('description');
                if (admin_body_has('rating')) $data['rating'] = admin_body_float('rating', 4.5);
                if (admin_body_has('status')) $data['status'] = admin_body_str_raw('status');
                if (admin_body_has('memberSince')) $data['memberSince'] = admin_body_int('memberSince', (int) date('Y'));
                if (admin_update_row('Member', $id, $data) === 0 && admin_find('Member', $id) === null) {
                    fail('Gagal memperbarui anggota.', 500);
                }
                $row = admin_find('Member', $id) ?? [];
                // Task 18 — jejak audit pemutakhiran anggota.
                log_audit($user, 'UPDATE', 'Member', $id, (string) ($row['name'] ?? ''));
                ok(cast_row('Member', $row));
            } catch (Throwable $e) {
                fail('Gagal memperbarui anggota.', 500);
            }
            return;

        case 'tutorials':
            guard_admin();
            try {
                $data = [];
                if (admin_body_has('title')) $data['title'] = admin_body_str_raw('title');
                if (admin_body_has('category')) $data['category'] = admin_body_str_raw('category');
                if (admin_body_has('level')) $data['level'] = admin_body_str_raw('level');
                if (admin_body_has('duration')) $data['duration'] = admin_body_int('duration', 10);
                if (admin_body_has('summary')) $data['summary'] = admin_body_str_raw('summary');
                if (admin_body_has('content')) $data['content'] = admin_body_str_raw('content');
                if (admin_body_has('order')) $data['order'] = admin_js_parse_int(body('order')) ?? 0;
                if (admin_body_has('published')) $data['published'] = admin_js_bool(body('published')) ? 1 : 0;
                if (admin_body_has('slug')) {
                    $slug = slugify(admin_body_str_raw('slug'));
                    if ($slug !== '') $data['slug'] = $slug;
                }
                if (admin_update_row('Tutorial', $id, $data) === 0 && admin_find('Tutorial', $id) === null) {
                    fail('Gagal memperbarui tutorial.', 500);
                }
                ok(cast_row('Tutorial', admin_find('Tutorial', $id) ?? []));
            } catch (Throwable $e) {
                fail('Gagal memperbarui tutorial.', 500);
            }
            return;

        case 'faqs':
            guard_admin();
            try {
                $data = [];
                if (admin_body_has('question')) $data['question'] = admin_body_str_raw('question');
                if (admin_body_has('answer')) $data['answer'] = admin_body_str_raw('answer');
                if (admin_body_has('category')) $data['category'] = admin_body_str_raw('category');
                if (admin_body_has('order')) $data['order'] = admin_js_parse_int(body('order')) ?? 0;
                if (admin_update_row('Faq', $id, $data, false) === 0 && admin_find('Faq', $id) === null) {
                    fail('Gagal memperbarui FAQ.', 500);
                }
                ok(cast_row('Faq', admin_find('Faq', $id) ?? []));
            } catch (Throwable $e) {
                fail('Gagal memperbarui FAQ.', 500);
            }
            return;

        case 'testimonials':
            guard_admin();
            try {
                $data = [];
                if (admin_body_has('name')) $data['name'] = admin_body_str_raw('name');
                if (admin_body_has('role')) $data['role'] = admin_body_str_raw('role');
                if (admin_body_has('content')) $data['content'] = admin_body_str_raw('content');
                if (admin_body_has('rating')) $data['rating'] = admin_body_int('rating', 5);
                if (admin_body_has('published')) $data['published'] = admin_js_bool(body('published')) ? 1 : 0;
                if (admin_update_row('Testimonial', $id, $data, false) === 0 && admin_find('Testimonial', $id) === null) {
                    fail('Gagal memperbarui testimoni.', 500);
                }
                ok(cast_row('Testimonial', admin_find('Testimonial', $id) ?? []));
            } catch (Throwable $e) {
                fail('Gagal memperbarui testimoni.', 500);
            }
            return;

        case 'management':
            guard_admin();
            try {
                $data = [];
                if (admin_body_has('name')) $data['name'] = admin_body_str_raw('name');
                if (admin_body_has('position')) $data['position'] = admin_body_str_raw('position');
                if (admin_body_has('bio')) $data['bio'] = admin_body_nullable('bio');
                if (admin_body_has('order')) $data['order'] = admin_js_parse_int(body('order')) ?? 0;
                if (admin_update_row('Management', $id, $data, false) === 0 && admin_find('Management', $id) === null) {
                    fail('Gagal memperbarui pengurus.', 500);
                }
                ok(cast_row('Management', admin_find('Management', $id) ?? []));
            } catch (Throwable $e) {
                fail('Gagal memperbarui pengurus.', 500);
            }
            return;

        case 'messages':
            guard_role(['SUPER_ADMIN', 'ADMIN']);
            try {
                $status = admin_body_str('status', 'READ');
                if (admin_update_row('ContactMessage', $id, ['status' => $status], false) === 0 && admin_find('ContactMessage', $id) === null) {
                    fail('Gagal memperbarui pesan.', 500);
                }
                ok(cast_row('ContactMessage', admin_find('ContactMessage', $id) ?? []));
            } catch (Throwable $e) {
                fail('Gagal memperbarui pesan.', 500);
            }
            return;

        case 'complaints':
            $user = guard_role(['SUPER_ADMIN', 'ADMIN', 'VERIFIKATOR']);
            try {
                $existing = admin_find('Complaint', $id);
                if ($existing === null) fail('Pengaduan tidak ditemukan.', 404);
                $data = [];
                $action = 'UPDATE';
                if (admin_body_has('status')) {
                    $status = admin_body_str_raw('status');
                    if (!in_array($status, ['UNREAD', 'PROCESSED', 'CLOSED'], true)) fail('Status tidak valid.');
                    $data['status'] = $status;
                    if ($status !== $existing['status'] && ($status === 'PROCESSED' || $status === 'CLOSED')) {
                        $data['respondedBy'] = (string) ($user['name'] ?? '') !== '' ? (string) $user['name'] : null;
                        $data['respondedAt'] = now_ms();
                        $action = $status; // jejak audit mengikuti status baru
                    }
                }
                if (admin_body_has('responseNote')) $data['responseNote'] = admin_body_nullable('responseNote');
                admin_update_row('Complaint', $id, $data);
                $row = admin_find('Complaint', $id) ?? [];
                log_audit($user, $action, 'Complaint', $id, 'Pengaduan dari ' . (string) ($existing['name'] ?? ''));
                ok(cast_row('Complaint', $row));
            } catch (Throwable $e) {
                fail('Gagal memperbarui pengaduan.', 500);
            }
            return;

        case 'subscribers':
            guard_role(['SUPER_ADMIN', 'ADMIN']);
            try {
                $isActive = admin_js_bool(body('isActive')) ? 1 : 0;
                if (admin_update_row('Subscriber', $id, ['isActive' => $isActive], false) === 0 && admin_find('Subscriber', $id) === null) {
                    fail('Gagal memperbarui pelanggan.', 500);
                }
                ok(cast_row('Subscriber', admin_find('Subscriber', $id) ?? []));
            } catch (Throwable $e) {
                fail('Gagal memperbarui pelanggan.', 500);
            }
            return;

        case 'branches':
            $user = guard_role(['SUPER_ADMIN', 'ADMIN', 'EDITOR']);
            try {
                $data = [];
                if (admin_body_has('name')) $data['name'] = trim(admin_body_str_raw('name'));
                if (admin_body_has('code')) $data['code'] = trim(admin_body_str_raw('code'));
                if (admin_body_has('province')) $data['province'] = trim(admin_body_str_raw('province'));
                if (admin_body_has('city')) $data['city'] = trim(admin_body_str_raw('city'));
                if (admin_body_has('officeName')) $data['officeName'] = trim(admin_body_str_raw('officeName'));
                if (admin_body_has('address')) $data['address'] = trim(admin_body_str_raw('address'));
                if (admin_body_has('picName')) $data['picName'] = trim(admin_body_str_raw('picName'));
                if (admin_body_has('picPhone')) $data['picPhone'] = trim(admin_body_str_raw('picPhone'));
                if (admin_body_has('email')) $data['email'] = admin_body_nullable('email') !== null ? trim(admin_body_str_raw('email')) : null;
                if (admin_body_has('description')) $data['description'] = admin_body_nullable('description');
                if (admin_body_has('order')) $data['order'] = admin_js_parse_int(body('order')) ?? 0;
                if (admin_body_has('published')) $data['published'] = admin_js_bool(body('published')) ? 1 : 0;
                if (admin_update_row('RegionalBranch', $id, $data) === 0 && admin_find('RegionalBranch', $id) === null) {
                    fail('Gagal memperbarui jaringan daerah.', 500);
                }
                $row = admin_find('RegionalBranch', $id) ?? [];
                log_audit($user, 'UPDATE', 'RegionalBranch', $id, (string) ($row['name'] ?? ''));
                ok(cast_row('RegionalBranch', $row));
            } catch (Throwable $e) {
                fail('Gagal memperbarui jaringan daerah.', 500);
            }
            return;

        case 'gallery':
            guard_role(['SUPER_ADMIN', 'ADMIN', 'EDITOR']);
            try {
                $data = [];
                if (admin_body_has('title')) {
                    $title = trim(admin_body_str_raw('title'));
                    if ($title === '') fail('Judul wajib diisi.');
                    $data['title'] = $title;
                }
                if (admin_body_has('imageUrl')) {
                    $imageUrl = trim(admin_body_str_raw('imageUrl'));
                    if ($imageUrl === '') fail('URL gambar wajib diisi.');
                    $data['imageUrl'] = $imageUrl;
                }
                if (admin_body_has('caption')) $data['caption'] = admin_body_nullable('caption');
                if (admin_body_has('category')) $data['category'] = admin_body_str_raw('category');
                if (admin_body_has('order')) $data['order'] = admin_js_parse_int(body('order')) ?? 0;
                if (admin_body_has('published')) $data['published'] = admin_js_bool(body('published')) ? 1 : 0;
                if (admin_update_row('Gallery', $id, $data) === 0 && admin_find('Gallery', $id) === null) {
                    fail('Gagal memperbarui galeri.', 500);
                }
                ok(cast_row('Gallery', admin_find('Gallery', $id) ?? []));
            } catch (Throwable $e) {
                fail('Gagal memperbarui galeri.', 500);
            }
            return;

        case 'events':
            guard_role(['SUPER_ADMIN', 'ADMIN', 'EDITOR']);
            try {
                $data = [];
                if (admin_body_has('title')) {
                    $title = trim(admin_body_str_raw('title'));
                    if ($title === '') fail('Judul agenda wajib diisi.');
                    $data['title'] = $title;
                }
                if (admin_body_has('description')) $data['description'] = admin_body_str_raw('description');
                if (admin_body_has('location')) $data['location'] = admin_body_str_raw('location');
                if (admin_body_has('startsAt')) {
                    $startsAtMs = date_to_ms(admin_body_str_raw('startsAt'));
                    if ($startsAtMs === null) fail('Tanggal & jam mulai (startsAt) tidak valid.');
                    $data['startsAt'] = $startsAtMs;
                }
                if (admin_body_has('endsAt')) {
                    if (!admin_js_truthy(body('endsAt'))) {
                        $data['endsAt'] = null;
                    } else {
                        $endsAtMs = date_to_ms(admin_body_str_raw('endsAt'));
                        if ($endsAtMs === null) fail('Tanggal selesai (endsAt) tidak valid.');
                        $data['endsAt'] = $endsAtMs;
                    }
                }
                if (admin_body_has('category')) $data['category'] = admin_body_str_raw('category');
                if (admin_body_has('published')) $data['published'] = admin_js_bool(body('published')) ? 1 : 0;
                if (admin_update_row('Event', $id, $data) === 0 && admin_find('Event', $id) === null) {
                    fail('Gagal memperbarui agenda.', 500);
                }
                ok(cast_row('Event', admin_find('Event', $id) ?? []));
            } catch (Throwable $e) {
                fail('Gagal memperbarui agenda.', 500);
            }
            return;

        case 'resources':
            guard_role(['SUPER_ADMIN', 'ADMIN', 'EDITOR']);
            try {
                $data = [];
                if (admin_body_has('title')) {
                    $title = trim(admin_body_str_raw('title'));
                    if ($title === '') fail('Judul wajib diisi.');
                    $data['title'] = $title;
                }
                if (admin_body_has('fileUrl')) {
                    $fileUrl = trim(admin_body_str_raw('fileUrl'));
                    if ($fileUrl === '') fail('URL berkas wajib diisi.');
                    $data['fileUrl'] = $fileUrl;
                }
                if (admin_body_has('description')) $data['description'] = admin_body_nullable('description');
                if (admin_body_has('category')) $data['category'] = admin_body_str_raw('category');
                if (admin_body_has('fileType')) $data['fileType'] = admin_body_str_raw('fileType');
                if (admin_body_has('published')) $data['published'] = admin_js_bool(body('published')) ? 1 : 0;
                if (admin_update_row('Resource', $id, $data) === 0 && admin_find('Resource', $id) === null) {
                    fail('Gagal memperbarui dokumen.', 500);
                }
                ok(cast_row('Resource', admin_find('Resource', $id) ?? []));
            } catch (Throwable $e) {
                fail('Gagal memperbarui dokumen.', 500);
            }
            return;

        case 'users':
            // Node users/[id] hanya mengekspor PATCH (bukan PUT).
            if ($method !== 'PATCH') admin_no_endpoint($method, $entity, $id);
            $me = admin_require_super_403();
            try {
                $target = admin_find('User', $id);
                if ($target === null) fail('Akun tidak ditemukan.', 404);
                $data = [];

                if (admin_body_has('name')) {
                    $name = trim(admin_body_str_raw('name'));
                    if ($name === '') fail('Nama tidak boleh kosong.');
                    $data['name'] = $name;
                }

                if (admin_body_has('password') && admin_body_str_raw('password') !== '') {
                    $password = admin_body_str_raw('password');
                    if (mb_strlen($password) < 8) fail('Password minimal 8 karakter.');
                    $data['password'] = hash_password($password);
                }

                if (admin_body_has('role') && admin_body_str_raw('role') !== (string) $target['role']) {
                    $role = admin_body_str_raw('role');
                    if (!in_array($role, ADMIN_ROLES, true)) fail('Peran tidak valid.');
                    if ($id === (string) $me['id']) fail('Anda tidak dapat mengubah peran akun sendiri.', 400);
                    if ((string) $target['role'] === 'SUPER_ADMIN' && (int) $target['isActive'] === 1 && $role !== 'SUPER_ADMIN') {
                        if (admin_other_active_super_count($id) === 0) fail('Minimal harus ada satu Super Admin aktif.', 400);
                    }
                    $data['role'] = $role;
                }

                if (admin_body_has('isActive')) {
                    // Paritas: Boolean(body.isActive) !== target.isActive
                    $isActive = admin_js_bool(body('isActive'));
                    if ($isActive !== ((bool) ((int) $target['isActive']))) {
                        if ($id === (string) $me['id']) fail('Anda tidak dapat menonaktifkan akun sendiri.', 400);
                        if ((int) $target['isActive'] === 1 && (string) $target['role'] === 'SUPER_ADMIN') {
                            if (admin_other_active_super_count($id) === 0) fail('Minimal harus ada satu Super Admin aktif.', 400);
                        }
                        $data['isActive'] = $isActive ? 1 : 0;
                    }
                }

                if ($data === []) {
                    // Tidak ada perubahan → kembalikan baris terproyeksi (paritas Node).
                    ok(admin_user_select_row($id) ?? []);
                }

                admin_update_row('User', $id, $data);
                $updated = admin_find('User', $id) ?? [];

                // Cabut sesi target ketika dinonaktifkan atau password direset.
                if ((isset($data['isActive']) && (int) $data['isActive'] === 0) || isset($data['password'])) {
                    q_exec('DELETE FROM "Session" WHERE "userId" = ?', [$id]);
                }

                // Task 18 — jejak audit perubahan akun admin (tanpa data sensitif).
                log_audit($me, 'UPDATE', 'User', $id, ($updated['name'] ?? '') . ' (' . ($updated['role'] ?? '') . ')');

                ok(admin_user_select_row($id) ?? []);
            } catch (Throwable $e) {
                fail('Gagal memperbarui akun admin.', 500);
            }
            return;

        case 'applications':
            $me = guard_role(['SUPER_ADMIN', 'ADMIN', 'VERIFIKATOR']);
            try {
                $action = admin_body_str_raw('action');
                $note = trim(admin_body_str('reviewNote'));

                if ($action === 'approve') {
                    $upd = [
                        'status'     => 'APPROVED',
                        'reviewNote' => $note !== '' ? $note : null,
                        'reviewedBy' => (string) ($me['name'] ?? '') !== '' ? (string) $me['name'] : null,
                        'reviewedAt' => now_ms(),
                    ];
                    if (admin_update_row('MembershipApplication', $id, $upd) === 0 && admin_find('MembershipApplication', $id) === null) {
                        fail('Gagal memproses pendaftaran.', 500);
                    }
                    $app = admin_find('MembershipApplication', $id) ?? [];
                    // Buat anggota otomatis dari pendaftaran yang disetujui
                    $existing = q_one('SELECT "id" FROM "Member" WHERE "licenseNo" = ? LIMIT 1', [(string) ($app['licenseNo'] ?? '')]);
                    if ($existing === null) {
                        admin_insert_row('Member', [
                            'name'        => (string) ($app['orgName'] ?? ''),
                            'type'        => (string) ($app['type'] ?? ''),
                            'city'        => (string) ($app['city'] ?? ''),
                            'province'    => (string) ($app['province'] ?? ''),
                            'licenseNo'   => (string) ($app['licenseNo'] ?? ''),
                            'phone'       => (string) ($app['phone'] ?? ''),
                            'email'       => (string) ($app['email'] ?? ''),
                            'status'      => 'TERVERIFIKASI',
                            'memberSince' => (int) date('Y'),
                            'description' => $app['message'] ?? null,
                            'rating'      => 4.5,
                        ]);
                    }
                    // Task 18 — jejak audit persetujuan.
                    log_audit($me, 'APPROVE', 'Application', $id, 'Setujui ' . (string) ($app['orgName'] ?? ''));
                    ok(cast_row('MembershipApplication', $app));
                }

                if ($action === 'reject') {
                    if (mb_strlen($note) < 5) {
                        fail('Alasan penolakan wajib diisi (minimal 5 karakter) agar pencalar mendapat kejelasan.');
                    }
                    $upd = [
                        'status'     => 'REJECTED',
                        'reviewNote' => $note,
                        'reviewedBy' => (string) ($me['name'] ?? '') !== '' ? (string) $me['name'] : null,
                        'reviewedAt' => now_ms(),
                    ];
                    if (admin_update_row('MembershipApplication', $id, $upd) === 0 && admin_find('MembershipApplication', $id) === null) {
                        fail('Gagal memproses pendaftaran.', 500);
                    }
                    $app = admin_find('MembershipApplication', $id) ?? [];
                    // Task 18 — jejak audit penolakan.
                    log_audit($me, 'REJECT', 'Application', $id, 'Tolak ' . (string) ($app['orgName'] ?? ''));
                    ok(cast_row('MembershipApplication', $app));
                }

                fail('Aksi tidak dikenal.');
            } catch (Throwable $e) {
                fail('Gagal memproses pendaftaran.', 500);
            }
            return;

        default:
            admin_no_endpoint($method, $entity, $id);
    }
}

/* ============================================ DELETE admin/:entity/:id */
function admin_entity_delete(array $p): void
{
    $entity = admin_resolve_entity((string) ($p['entity'] ?? ''));
    $id = (string) ($p['id'] ?? '');
    if ($entity === null) {
        fail('Entity tidak dikenal: ' . (string) ($p['entity'] ?? ''), 404);
    }

    switch ($entity) {
        case 'articles':
            guard_admin();
            try {
                if (q_exec('DELETE FROM "Article" WHERE "id" = ?', [$id]) === 0) fail('Gagal menghapus artikel.', 500);
                ok(['success' => true]);
            } catch (Throwable $e) {
                fail('Gagal menghapus artikel.', 500);
            }
            return;

        case 'ecosystems':
            guard_admin();
            try {
                if (q_exec('DELETE FROM "Ecosystem" WHERE "id" = ?', [$id]) === 0) fail('Gagal menghapus ekosistem.', 500);
                ok(['success' => true]);
            } catch (Throwable $e) {
                fail('Gagal menghapus ekosistem.', 500);
            }
            return;

        case 'journey':
            guard_admin();
            try {
                if (q_exec('DELETE FROM "JourneyStep" WHERE "id" = ?', [$id]) === 0) fail('Gagal menghapus tahap.', 500);
                ok(['success' => true]);
            } catch (Throwable $e) {
                fail('Gagal menghapus tahap.', 500);
            }
            return;

        case 'roadmap':
            guard_admin();
            try {
                if (q_exec('DELETE FROM "Roadmap" WHERE "id" = ?', [$id]) === 0) fail('Gagal menghapus fase roadmap.', 500);
                ok(['success' => true]);
            } catch (Throwable $e) {
                fail('Gagal menghapus fase roadmap.', 500);
            }
            return;

        case 'members':
            $user = guard_role(['SUPER_ADMIN', 'ADMIN']);
            try {
                if (q_exec('DELETE FROM "Member" WHERE "id" = ?', [$id]) === 0) fail('Gagal menghapus anggota.', 500);
                // Task 18 — jejak audit penghapusan anggota.
                log_audit($user, 'DELETE', 'Member', $id);
                ok(['success' => true]);
            } catch (Throwable $e) {
                fail('Gagal menghapus anggota.', 500);
            }
            return;

        case 'tutorials':
            guard_admin();
            try {
                if (q_exec('DELETE FROM "Tutorial" WHERE "id" = ?', [$id]) === 0) fail('Gagal menghapus tutorial.', 500);
                ok(['success' => true]);
            } catch (Throwable $e) {
                fail('Gagal menghapus tutorial.', 500);
            }
            return;

        case 'faqs':
            guard_admin();
            try {
                if (q_exec('DELETE FROM "Faq" WHERE "id" = ?', [$id]) === 0) fail('Gagal menghapus FAQ.', 500);
                ok(['success' => true]);
            } catch (Throwable $e) {
                fail('Gagal menghapus FAQ.', 500);
            }
            return;

        case 'testimonials':
            guard_admin();
            try {
                if (q_exec('DELETE FROM "Testimonial" WHERE "id" = ?', [$id]) === 0) fail('Gagal menghapus testimoni.', 500);
                ok(['success' => true]);
            } catch (Throwable $e) {
                fail('Gagal menghapus testimoni.', 500);
            }
            return;

        case 'management':
            guard_admin();
            try {
                if (q_exec('DELETE FROM "Management" WHERE "id" = ?', [$id]) === 0) fail('Gagal menghapus pengurus.', 500);
                ok(['success' => true]);
            } catch (Throwable $e) {
                fail('Gagal menghapus pengurus.', 500);
            }
            return;

        case 'messages':
            $user = guard_role(['SUPER_ADMIN', 'ADMIN']);
            try {
                if (q_exec('DELETE FROM "ContactMessage" WHERE "id" = ?', [$id]) === 0) fail('Gagal menghapus pesan.', 500);
                // Task 18 — jejak audit penghapusan pesan.
                log_audit($user, 'DELETE', 'Message', $id);
                ok(['success' => true]);
            } catch (Throwable $e) {
                fail('Gagal menghapus pesan.', 500);
            }
            return;

        case 'complaints':
            $user = guard_role(['SUPER_ADMIN', 'ADMIN']);
            try {
                if (q_exec('DELETE FROM "Complaint" WHERE "id" = ?', [$id]) === 0) fail('Gagal menghapus pengaduan.', 500);
                log_audit($user, 'DELETE', 'Complaint', $id);
                ok(['success' => true]);
            } catch (Throwable $e) {
                fail('Gagal menghapus pengaduan.', 500);
            }
            return;

        case 'subscribers':
            guard_role(['SUPER_ADMIN', 'ADMIN']);
            try {
                if (q_exec('DELETE FROM "Subscriber" WHERE "id" = ?', [$id]) === 0) fail('Gagal menghapus pelanggan.', 500);
                ok(['success' => true]);
            } catch (Throwable $e) {
                fail('Gagal menghapus pelanggan.', 500);
            }
            return;

        case 'applications':
            guard_role(['SUPER_ADMIN', 'ADMIN']);
            try {
                if (q_exec('DELETE FROM "MembershipApplication" WHERE "id" = ?', [$id]) === 0) fail('Gagal menghapus pendaftaran.', 500);
                ok(['success' => true]);
            } catch (Throwable $e) {
                fail('Gagal menghapus pendaftaran.', 500);
            }
            return;

        case 'branches':
            $user = guard_role(['SUPER_ADMIN', 'ADMIN', 'EDITOR']);
            try {
                $row = admin_find('RegionalBranch', $id);
                if ($row === null) fail('Gagal menghapus jaringan daerah.', 500);
                q_exec('DELETE FROM "RegionalBranch" WHERE "id" = ?', [$id]);
                log_audit($user, 'DELETE', 'RegionalBranch', $id, (string) ($row['name'] ?? ''));
                ok(['success' => true]);
            } catch (Throwable $e) {
                fail('Gagal menghapus jaringan daerah.', 500);
            }
            return;

        case 'gallery':
            guard_role(['SUPER_ADMIN', 'ADMIN', 'EDITOR']);
            try {
                if (q_exec('DELETE FROM "Gallery" WHERE "id" = ?', [$id]) === 0) fail('Gagal menghapus galeri.', 500);
                ok(['success' => true]);
            } catch (Throwable $e) {
                fail('Gagal menghapus galeri.', 500);
            }
            return;

        case 'events':
            guard_role(['SUPER_ADMIN', 'ADMIN', 'EDITOR']);
            try {
                if (q_exec('DELETE FROM "Event" WHERE "id" = ?', [$id]) === 0) fail('Gagal menghapus agenda.', 500);
                ok(['success' => true]);
            } catch (Throwable $e) {
                fail('Gagal menghapus agenda.', 500);
            }
            return;

        case 'resources':
            guard_role(['SUPER_ADMIN', 'ADMIN', 'EDITOR']);
            try {
                if (q_exec('DELETE FROM "Resource" WHERE "id" = ?', [$id]) === 0) fail('Gagal menghapus dokumen.', 500);
                ok(['success' => true]);
            } catch (Throwable $e) {
                fail('Gagal menghapus dokumen.', 500);
            }
            return;

        case 'users':
            $me = admin_require_super_403();
            try {
                if ($id === (string) $me['id']) fail('Anda tidak dapat menghapus akun sendiri.', 400);
                $target = admin_find('User', $id);
                if ($target === null) fail('Akun tidak ditemukan.', 404);
                if ((string) $target['role'] === 'SUPER_ADMIN' && (int) $target['isActive'] === 1) {
                    if (admin_other_active_super_count($id) === 0) fail('Minimal harus ada satu Super Admin aktif.', 400);
                }
                // Sessions terhapus otomatis (onDelete: Cascade).
                if (q_exec('DELETE FROM "User" WHERE "id" = ?', [$id]) === 0) fail('Gagal menghapus akun admin.', 500);
                // Task 18 — jejak audit penghapusan akun admin (tanpa data sensitif).
                log_audit($me, 'DELETE', 'User', $id, ($target['name'] ?? '') . ' (' . ($target['role'] ?? '') . ')');
                ok(['deleted' => true, 'id' => $id]);
            } catch (Throwable $e) {
                fail('Gagal menghapus akun admin.', 500);
            }
            return;

        default:
            admin_no_endpoint('DELETE', $entity, $id);
    }
}

/* ================================================ PUT admin/settings */
/** Paritas PUT /api/settings — upsert peta {key: value} + audit nama kunci. */
function admin_settings_put(array $p = []): void
{
    $user = guard_role(['SUPER_ADMIN', 'ADMIN']);
    try {
        $body = json_body();
        foreach ($body as $k => $v) {
            $key = (string) $k;
            // Node: String(value ?? "") — null/undefined → string kosong.
            $value = $v === null ? '' : (is_scalar($v) ? (string) $v : '');
            $exists = q_one('SELECT "id" FROM "SiteSetting" WHERE "key" = ? LIMIT 1', [$key]);
            if ($exists === null) {
                q_exec(
                    'INSERT INTO "SiteSetting" ("id", "key", "value") VALUES (?,?,?)',
                    [new_id(), $key, $value]
                );
            } else {
                q_exec('UPDATE "SiteSetting" SET "value" = ? WHERE "key" = ?', [$value, $key]);
            }
        }
        // Task 18 — jejak audit perubahan pengaturan (hanya nama kunci, tanpa isi).
        $keys = array_map('strval', array_keys($body));
        log_audit($user, 'UPDATE', 'Settings', null, mb_substr(implode(', ', array_slice($keys, 0, 10)), 0, 180));
        $rows = q_all('SELECT "key", "value" FROM "SiteSetting"');
        $map = [];
        foreach ($rows as $s) {
            $map[(string) $s['key']] = (string) $s['value'];
        }
        ok($map);
    } catch (Throwable $e) {
        fail('Gagal menyimpan pengaturan.', 500);
    }
}

/* ============================================================ WHATSAPP */
/* Mirror src/app/api/whatsapp/route.ts (Task 15-d) + endpoint uji kirim  */
/* yang dipanggil CMS (admin-whatsapp.tsx → POST /api/whatsapp/test).     */

/** Masking token — paritas mask() Node; token penuh TIDAK PERNAH dikirim balik. */
function admin_wa_mask(string $key): string
{
    if ($key === '') return '';
    if (mb_strlen($key) <= 10) return mb_substr($key, 0, 2) . '••••••';
    return mb_substr($key, 0, 6) . '••••••••' . mb_substr($key, -4);
}

/** ISO waktu uji terakhir (kolom lastTestAt — paritas serialisasi Prisma). */
function admin_wa_last_test($v): ?string
{
    if ($v === null || $v === '') return null;
    return is_numeric($v) ? iso_date((int) $v) : (string) $v;
}

/** Bentuk respons konfigurasi (paritas persis dengan Node GET/PUT). */
function admin_wa_payload(array $cfg): array
{
    return [
        'provider'           => (string) $cfg['provider'],
        'apiUrl'             => (string) $cfg['apiUrl'],
        'target'             => (string) $cfg['target'],
        'enabled'            => (bool) ((int) $cfg['enabled']),
        'notifyContact'      => (bool) ((int) $cfg['notifyContact']),
        'notifyApplication'  => (bool) ((int) $cfg['notifyApplication']),
        'hasToken'           => (string) $cfg['token'] !== '',
        'tokenMasked'        => admin_wa_mask((string) $cfg['token']),
        'lastTestAt'         => admin_wa_last_test($cfg['lastTestAt'] ?? null),
        'lastTestStatus'     => (string) ($cfg['lastTestStatus'] ?? ''),
    ];
}

function admin_whatsapp_get(array $p = []): void
{
    guard_role(['SUPER_ADMIN', 'ADMIN']);
    try {
        ok(admin_wa_payload(get_whatsapp_setting()));
    } catch (Throwable $e) {
        fail('Gagal memuat konfigurasi WhatsApp.', 500);
    }
}

function admin_whatsapp_put(array $p = []): void
{
    guard_role(['SUPER_ADMIN', 'ADMIN']);
    try {
        $cfg = get_whatsapp_setting();

        $provider = admin_body_str('provider', (string) $cfg['provider']);
        if (!in_array($provider, WA_PROVIDERS, true)) {
            fail('Provider tidak valid.');
        }
        $targetRaw = admin_body_has('target') ? admin_js_str(body('target')) : (string) $cfg['target'];
        if ($targetRaw !== '' && mb_strlen(normalize_wa_number($targetRaw)) < 10) {
            fail('Nomor WhatsApp tujuan tidak valid (contoh: 6281234567890).');
        }

        $data = [
            'provider'          => $provider,
            'apiUrl'            => admin_body_has('apiUrl') ? trim(admin_js_str(body('apiUrl'))) : (string) $cfg['apiUrl'],
            'target'            => $targetRaw !== '' ? normalize_wa_number($targetRaw) : '',
            'enabled'           => (admin_body_has('enabled') ? admin_js_bool(body('enabled')) : (bool) ((int) $cfg['enabled'])) ? 1 : 0,
            'notifyContact'     => (admin_body_has('notifyContact') ? admin_js_bool(body('notifyContact')) : (bool) ((int) $cfg['notifyContact'])) ? 1 : 0,
            'notifyApplication' => (admin_body_has('notifyApplication') ? admin_js_bool(body('notifyApplication')) : (bool) ((int) $cfg['notifyApplication'])) ? 1 : 0,
            // Kosong = tetap pakai token lama (agar tidak perlu ketik ulang saat edit).
            'token'             => (admin_body_has('token') && trim(admin_js_str(body('token'))) !== '') ? trim(admin_js_str(body('token'))) : (string) $cfg['token'],
        ];
        q_exec(
            'UPDATE "WhatsAppSetting" SET "provider" = ?, "apiUrl" = ?, "target" = ?, "enabled" = ?, "notifyContact" = ?, "notifyApplication" = ?, "token" = ?, "updatedAt" = ? WHERE "id" = ?',
            [$data['provider'], $data['apiUrl'], $data['target'], $data['enabled'], $data['notifyContact'], $data['notifyApplication'], $data['token'], now_ms(), (string) $cfg['id']]
        );
        $updated = q_one('SELECT * FROM "WhatsAppSetting" WHERE "id" = ? LIMIT 1', [(string) $cfg['id']]) ?? [];
        ok(admin_wa_payload($updated));
    } catch (Throwable $e) {
        fail('Gagal menyimpan konfigurasi WhatsApp.', 500);
    }
}

/** POST /api/whatsapp/test — kirim pesan uji; status tersimpan + respons {sent, detail}. */
function admin_whatsapp_test(array $p = []): void
{
    guard_role(['SUPER_ADMIN', 'ADMIN']);
    try {
        $cfg = get_whatsapp_setting();
        $res = send_wa_message(
            "🔔 *Pesan Uji — MUHDIN*\n\n"
            . "Konfigurasi gateway WhatsApp Anda berfungsi dengan baik.\n"
            . "*Provider:* " . $cfg['provider'] . "\n"
            . "*Waktu:* " . gmdate('Y-m-d H:i:s', (int) floor(now_ms() / 1000)) . ' UTC'
        );
        // Paritas pencatatan lastTestAt/lastTestStatus pada notify* Node.
        q_exec(
            'UPDATE "WhatsAppSetting" SET "lastTestAt" = ?, "lastTestStatus" = ?, "updatedAt" = ? WHERE "id" = ?',
            [now_ms(), ($res['sent'] ? 'OK' : 'GAGAL') . ' — ' . mb_substr($res['detail'], 0, 180), now_ms(), (string) $cfg['id']]
        );
        ok(['sent' => $res['sent'], 'detail' => $res['detail']]);
    } catch (Throwable $e) {
        fail('Gagal menguji WhatsApp.', 500);
    }
}

/* ================================================== pendaftaran route */
/* Pola generik admin (GET/POST/PUT/PATCH/DELETE sesuai export Node per  */
/* entity — kombinasi yang tidak diekspor Node dijawab 404 ala Router).  */

$router->on('GET',    'admin/:entity',     'admin_entity_list');
$router->on('POST',   'admin/:entity',     'admin_entity_create');
$router->on('GET',    'admin/:entity/:id', 'admin_entity_show');
$router->on('PUT',    'admin/:entity/:id', 'admin_entity_update');
$router->on('PATCH',  'admin/:entity/:id', 'admin_entity_update'); // users/[id] memakai PATCH
$router->on('DELETE', 'admin/:entity/:id', 'admin_entity_delete');
$router->on('PUT',    'admin/settings',    'admin_settings_put');  // PUT /api/settings tanpa id

$router->on('GET',    'whatsapp',      'admin_whatsapp_get');
$router->on('PUT',    'whatsapp',      'admin_whatsapp_put');
$router->on('POST',   'whatsapp/test', 'admin_whatsapp_test');
