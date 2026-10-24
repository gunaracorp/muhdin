<?php
/**
 * ============================================================================
 * routes/forms.php — mirror form publik + data Node (paritas 1:1)
 * ----------------------------------------------------------------------------
 * Sumber Node: src/app/api/**
 *   - members/route.ts            → GET 'members'  (publik) / POST 'members' (admin)
 *   - members/[id]/route.ts       → PUT/DELETE 'members/:id'
 *   - members/verify/route.ts     → GET 'members/verify'
 *   - search/route.ts             → GET 'search'
 *   - stats/route.ts              → GET 'stats' (admin)
 *   - health/route.ts             → GET 'health'
 *   - rss/route.ts                → GET 'rss' (XML, bukan JSON)
 *   - export/route.ts             → GET 'export' (CSV, admin)
 *   - applications/route.ts       → GET 'applications' (admin) / POST (publik, rate limit)
 *   - applications/[id]/route.ts  → PUT 'applications/:id' (approve/reject) / DELETE
 *   - applications/track/route.ts → GET 'applications/track'
 *   - complaints/route.ts + [id]  → GET/POST 'complaints', PUT/DELETE 'complaints/:id'
 *   - messages/route.ts + [id]    → GET/POST 'messages', PUT/DELETE 'messages/:id'
 *   - subscribers/route.ts + [id] → GET/POST 'subscribers', PUT/DELETE 'subscribers/:id'
 *
 * Kontrak dipertahankan persis: amplop ok()/fail(), pesan validasi verbatim,
 * bucket rate-limit Node ('applications' | 'complaints' | 'messages' |
 * 'subscribers', 5 hit / 60.000 ms per IP), notifikasi WhatsApp di titik yang
 * sama, log_audit dengan action/entity yang sama, dan serialisasi tanggal
 * epoch-ms → ISO-8601 via cast_row().
 * ============================================================================
 */
declare(strict_types=1);

/** @var Router $router */
global $router;

/* ===================================================== helper paritas Node */

/** Pola LIKE ala Prisma SQLite (contains): nilai mentah — % dan _ tetap wildcard. */
function forms_like(string $q): string
{
    return '%' . $q . '%';
}

/** Paritas localeFromRequest Node: HANYA query ?locale= (en|ar) — tanpa cookie. */
function forms_locale_from_query(): string
{
    $raw = qget('locale');
    if ($raw === null) return 'id';
    $l = strtolower($raw);
    return ($l === 'en' || $l === 'ar') ? $l : 'id';
}

/** JS truthiness — string "0" adalah truthy di JS (berbeda dgn PHP). */
function forms_truthy($v): bool
{
    if (is_string($v)) return $v !== '';
    if (is_array($v)) return true; // [] truthy di JS
    return (bool) $v;
}

/** JS String(value) untuk nilai JSON sederhana. */
function forms_js_str($v): string
{
    if (is_string($v)) return $v;
    if (is_bool($v)) return $v ? 'true' : 'false';
    if ($v === null) return '';
    if (is_array($v)) return implode(',', array_map('forms_js_str', $v));
    return (string) $v; // int|float — representasi terpendek, sama dgn JS
}

/** Paritas `String(body.f || "").trim()`. */
function forms_trim_str(string $key): string
{
    $v = body($key);
    return trim(forms_truthy($v) ? forms_js_str($v) : '');
}

/** Paritas `body.f ? String(body.f) : null`. */
function forms_opt_str(string $key): ?string
{
    $v = body($key);
    return forms_truthy($v) ? forms_js_str($v) : null;
}

/** Paritas `parseFloat(body.rating) || 4.5` (NaN/0 → 4.5). */
function forms_rating(string $key): float
{
    $v = body($key);
    $f = is_string($v) || is_int($v) || is_float($v) ? (float) $v : 0.0;
    return $f ?: 4.5;
}

/** Paritas `parseInt(body.memberSince, 10) || new Date().getFullYear()`. */
function forms_year_int(string $key): int
{
    $v = body($key);
    $n = is_string($v) ? intval($v, 10) : (is_int($v) || is_float($v) ? (int) $v : 0);
    return $n ?: (int) date('Y');
}

/** Regex email Node: /^[^@\s]+@[^@\s]+\.[^@\s]+$/ */
function forms_email_valid(string $email): bool
{
    return preg_match('/^[^@\s]+@[^@\s]+\.[^@\s]+$/', $email) === 1;
}

/** 429 dengan pesan Node persis (semua bucket memakai pesan yang sama). */
function forms_rate_limited(string $bucket): bool
{
    if (!rate_limit($bucket)) {
        fail('Terlalu banyak percobaan. Coba lagi beberapa saat.', 429);
        return true;
    }
    return false;
}

/* ============================================================== members === */

// GET /api/members — publik: filter type/status/q, orderBy status asc, name asc.
$router->on('GET', 'members', static function (array $params): void {
    try {
        $type   = qget('type');
        $status = qget('status');
        $qs     = qget('q');

        $where = [];
        $args  = [];
        if ($type !== null) {
            $where[] = 'type = ?';
            $args[] = $type;
        }
        if ($status === 'all') {
            // admin: semua status
        } elseif ($status !== null) {
            $where[] = 'status = ?';
            $args[] = $status;
        } else {
            $where[] = 'status = ?';
            $args[] = 'TERVERIFIKASI';
        }
        if ($qs !== null) {
            $like = forms_like($qs);
            $where[] = '(name LIKE ? OR city LIKE ? OR licenseNo LIKE ?)';
            $args[] = $like;
            $args[] = $like;
            $args[] = $like;
        }

        $sql = 'SELECT * FROM Member'
            . ($where !== [] ? ' WHERE ' . implode(' AND ', $where) : '')
            . ' ORDER BY status ASC, name ASC';
        $rows = cast_rows('Member', q_all($sql, $args));

        // Paritas applyEntityTranslations(fields: ['description']) — hanya
        // field description yang boleh diganti terjemahan.
        $locale = forms_locale_from_query();
        if ($locale !== 'id') {
            $orig  = $rows;
            $rows  = apply_translations($rows, 'Member', $locale);
            foreach ($rows as $i => $row) {
                foreach ($row as $field => $val) {
                    if ($field !== 'description' && array_key_exists($field, $orig[$i]) && $orig[$i][$field] !== $val) {
                        $rows[$i][$field] = $orig[$i][$field];
                    }
                }
            }
        }
        ok($rows);
    } catch (Throwable $e) {
        fail('Gagal memuat anggota.', 500);
    }
});

// POST /api/members — Super Admin / Admin (Task 18: jejak audit).
$router->on('POST', 'members', static function (array $params): void {
    $u = guard_role(['SUPER_ADMIN', 'ADMIN']);
    try {
        $nameV     = body('name');
        $licenseV  = body('licenseNo');
        if (!forms_truthy($nameV) || !forms_truthy($licenseV)) {
            fail('Nama dan nomor izin wajib diisi.');
        }
        $id     = new_id();
        $name   = forms_js_str($nameV);
        $now    = now_ms();
        q_exec(
            'INSERT INTO Member (id, name, type, city, province, licenseNo, phone, email, website, description, rating, status, memberSince, createdAt, updatedAt) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)',
            [
                $id,
                $name,
                forms_truthy(body('type')) ? forms_js_str(body('type')) : 'PPIU',
                forms_truthy(body('city')) ? forms_js_str(body('city')) : '',
                forms_truthy(body('province')) ? forms_js_str(body('province')) : '',
                forms_js_str($licenseV),
                forms_opt_str('phone'),
                forms_opt_str('email'),
                forms_opt_str('website'),
                forms_opt_str('description'),
                forms_rating('rating'),
                forms_truthy(body('status')) ? forms_js_str(body('status')) : 'TERVERIFIKASI',
                forms_year_int('memberSince'),
                $now,
                $now,
            ]
        );
        $member = cast_row('Member', q_one('SELECT * FROM Member WHERE id = ?', [$id]) ?? []);
        // Task 18 — jejak audit pembuatan anggota.
        log_audit($u, 'CREATE', 'Member', $id, $name);
        ok($member, 201);
    } catch (Throwable $e) {
        fail('Gagal menambah anggota.', 500);
    }
});

// PUT /api/members/:id — Super Admin / Admin / VERIFIKATOR (Task 17).
$router->on('PUT', 'members/:id', static function (array $params): void {
    $u  = guard_role(['SUPER_ADMIN', 'ADMIN', 'VERIFIKATOR']);
    $id = $params['id'];
    try {
        $set  = ['updatedAt = ?'];
        $args = [now_ms()];
        $b    = json_body();
        if (array_key_exists('name', $b)) {
            $set[] = 'name = ?';
            $args[] = forms_js_str($b['name']);
        }
        if (array_key_exists('type', $b)) {
            $set[] = 'type = ?';
            $args[] = forms_js_str($b['type']);
        }
        if (array_key_exists('city', $b)) {
            $set[] = 'city = ?';
            $args[] = forms_js_str($b['city']);
        }
        if (array_key_exists('province', $b)) {
            $set[] = 'province = ?';
            $args[] = forms_js_str($b['province']);
        }
        if (array_key_exists('licenseNo', $b)) {
            $set[] = 'licenseNo = ?';
            $args[] = forms_js_str($b['licenseNo']);
        }
        if (array_key_exists('phone', $b)) {
            $set[] = 'phone = ?';
            $args[] = forms_truthy($b['phone']) ? forms_js_str($b['phone']) : null;
        }
        if (array_key_exists('email', $b)) {
            $set[] = 'email = ?';
            $args[] = forms_truthy($b['email']) ? forms_js_str($b['email']) : null;
        }
        if (array_key_exists('website', $b)) {
            $set[] = 'website = ?';
            $args[] = forms_truthy($b['website']) ? forms_js_str($b['website']) : null;
        }
        if (array_key_exists('description', $b)) {
            $set[] = 'description = ?';
            $args[] = forms_truthy($b['description']) ? forms_js_str($b['description']) : null;
        }
        if (array_key_exists('rating', $b)) {
            $set[] = 'rating = ?';
            $args[] = forms_rating('rating');
        }
        if (array_key_exists('status', $b)) {
            $set[] = 'status = ?';
            $args[] = forms_js_str($b['status']);
        }
        if (array_key_exists('memberSince', $b)) {
            $set[] = 'memberSince = ?';
            $args[] = forms_year_int('memberSince');
        }
        $args[] = $id;
        if (q_exec('UPDATE Member SET ' . implode(', ', $set) . ' WHERE id = ?', $args) === 0) {
            fail('Gagal memperbarui anggota.', 500);
        }
        $member = cast_row('Member', q_one('SELECT * FROM Member WHERE id = ?', [$id]) ?? []);
        // Task 18 — jejak audit pemutakhiran anggota.
        log_audit($u, 'UPDATE', 'Member', $id, (string) ($member['name'] ?? ''));
        ok($member);
    } catch (Throwable $e) {
        fail('Gagal memperbarui anggota.', 500);
    }
});

// DELETE /api/members/:id — Super Admin / Admin.
$router->on('DELETE', 'members/:id', static function (array $params): void {
    $u  = guard_role(['SUPER_ADMIN', 'ADMIN']);
    $id = $params['id'];
    try {
        if (q_exec('DELETE FROM Member WHERE id = ?', [$id]) === 0) {
            fail('Gagal menghapus anggota.', 500);
        }
        // Task 18 — jejak audit penghapusan anggota.
        log_audit($u, 'DELETE', 'Member', $id);
        ok(['success' => true]);
    } catch (Throwable $e) {
        fail('Gagal menghapus anggota.', 500);
    }
});

// GET /api/members/verify — publik: cek legalitas penyelenggara.
$router->on('GET', 'members/verify', static function (array $params): void {
    try {
        $q = trim((string) (qget('q') ?? ''));
        if (mb_strlen($q) < 3) {
            fail('Masukkan minimal 3 karakter nama penyelenggara atau nomor izin.');
        }
        $like = forms_like($q);
        $matches = q_all(
            'SELECT * FROM Member WHERE (name LIKE ? OR licenseNo LIKE ?) ORDER BY name ASC LIMIT 10',
            [$like, $like]
        );
        $notFound     = $matches === [];
        $allSuspended = !$notFound && array_values(array_unique(array_column($matches, 'status'))) === ['SUSPENDED'];
        ok([
            'query'   => $q,
            'found'   => !$notFound,
            'warning' => $allSuspended
                ? 'Seluruh hasil ditemukan berstatus DITANGGUHKAN. Jangan bertransaksi.'
                : null,
            'results' => cast_rows('Member', $matches),
        ]);
    } catch (Throwable $e) {
        fail('Gagal memverifikasi.', 500);
    }
});

/* =============================================================== search === */

// GET /api/search — pencarian global lintas konten (publik).
$router->on('GET', 'search', static function (array $params): void {
    try {
        $q = trim((string) (qget('q') ?? ''));
        if (mb_strlen($q) < 2) {
            ok(['query' => $q, 'articles' => [], 'tutorials' => [], 'ecosystems' => []]);
        }
        $like = forms_like($q);

        $articles = q_all(
            'SELECT id, title, slug, excerpt, category, cover FROM Article'
            . " WHERE status = 'PUBLISHED' AND (title LIKE ? OR excerpt LIKE ? OR content LIKE ?)"
            . ' ORDER BY createdAt DESC LIMIT 5',
            [$like, $like, $like]
        );
        $tutorials = q_all(
            'SELECT id, title, slug, summary, category, level FROM Tutorial'
            . ' WHERE published = 1 AND (title LIKE ? OR summary LIKE ? OR content LIKE ?)'
            . ' ORDER BY "order" ASC LIMIT 5',
            [$like, $like, $like]
        );
        $ecosystems = q_all(
            'SELECT * FROM Ecosystem WHERE (name LIKE ? OR scope LIKE ? OR description LIKE ?)'
            . ' ORDER BY number ASC LIMIT 5',
            [$like, $like, $like]
        );

        ok([
            'query'      => $q,
            'articles'   => cast_rows('Article', $articles),
            'tutorials'  => cast_rows('Tutorial', $tutorials),
            'ecosystems' => cast_rows('Ecosystem', $ecosystems),
        ]);
    } catch (Throwable $e) {
        fail('Gagal melakukan pencarian.', 500);
    }
});

/* ================================================================ stats === */

// GET /api/stats — ringkasan dashboard (admin). Prisma count/groupBy → SQL COUNT/GROUP BY.
$router->on('GET', 'stats', static function (array $params): void {
    $u = guard_admin();
    $cnt = static function (string $sql, array $args = []): int {
        return (int) (q_one($sql, $args)['c'] ?? 0);
    };
    $articles           = $cnt('SELECT COUNT(*) AS c FROM Article');
    $tutorials          = $cnt('SELECT COUNT(*) AS c FROM Tutorial');
    $members            = $cnt('SELECT COUNT(*) AS c FROM Member');
    $pendingMembers     = $cnt("SELECT COUNT(*) AS c FROM Member WHERE status = 'PENDING'");
    $unreadMessages     = $cnt("SELECT COUNT(*) AS c FROM ContactMessage WHERE status = 'UNREAD'");
    $pendingApplications = $cnt("SELECT COUNT(*) AS c FROM MembershipApplication WHERE status = 'PENDING'");
    $unreadComplaints   = $cnt("SELECT COUNT(*) AS c FROM Complaint WHERE status = 'UNREAD'"); // Task 18
    $subscribers        = $cnt('SELECT COUNT(*) AS c FROM Subscriber'); // Task 18
    $testimonials       = $cnt('SELECT COUNT(*) AS c FROM Testimonial');
    $faqs               = $cnt('SELECT COUNT(*) AS c FROM Faq');
    $ecosystemCount     = $cnt('SELECT COUNT(*) AS c FROM Ecosystem');

    $totalViews = $cnt('SELECT COALESCE(SUM(views), 0) AS c FROM Article')
        + $cnt('SELECT COALESCE(SUM(views), 0) AS c FROM Tutorial');

    // byCategory: Node membangun Map dari findMany tanpa orderBy (urutan rowid
    // alami) → urutan kemunculan pertama; Prisma groupBy (memberByType) memakai
    // urutan GROUP BY SQLite bawaan. Keduanya direplikasi persis.
    $byCategory = array_map(
        static fn (array $r): array => ['category' => $r['category'], 'count' => (int) $r['count']],
        q_all('SELECT category, COUNT(*) AS count FROM Article GROUP BY category ORDER BY MIN(rowid)')
    );
    $memberByType = array_map(
        static fn (array $r): array => ['type' => $r['type'], 'count' => (int) $r['count']],
        q_all('SELECT type, COUNT(*) AS count FROM Member GROUP BY type')
    );

    $recentMessages      = cast_rows('ContactMessage', q_all('SELECT * FROM ContactMessage ORDER BY createdAt DESC LIMIT 5'));
    $recentApplications  = cast_rows('MembershipApplication', q_all('SELECT * FROM MembershipApplication ORDER BY createdAt DESC LIMIT 5'));

    ok([
        'articles'            => $articles,
        'tutorials'           => $tutorials,
        'members'             => $members,
        'pendingMembers'      => $pendingMembers,
        'unreadMessages'      => $unreadMessages,
        'pendingApplications' => $pendingApplications,
        'unreadComplaints'    => $unreadComplaints, // Task 18
        'subscribers'         => $subscribers, // Task 18
        'testimonials'        => $testimonials,
        'faqs'                => $faqs,
        'ecosystems'          => $ecosystemCount,
        'totalViews'          => $totalViews,
        'byCategory'          => $byCategory,
        'memberByType'        => $memberByType,
        'recentMessages'      => $recentMessages,
        'recentApplications'  => $recentApplications,
    ]);
});

/* =============================================================== health === */

// GET /api/health — healthcheck deployment (bentuk respons sama, runtime PHP).
$router->on('GET', 'health', static function (array $params): void {
    $started = microtime(true);

    $dbOk       = false;
    $dbLatencyMs = 0;
    $dbError    = null;
    try {
        q_one('SELECT 1');
        $dbOk = true;
        $dbLatencyMs = (int) round((microtime(true) - $started) * 1000);
    } catch (Throwable $e) {
        $dbError = mb_substr($e->getMessage(), 0, 200);
    }

    ok([
        'ok'        => $dbOk,
        'service'   => 'muhdin.web.id',
        'checks'    => [
            'database' => ['ok' => $dbOk, 'latencyMs' => $dbLatencyMs, 'error' => $dbError],
        ],
        'runtime'   => [
            'node'      => 'php-' . PHP_VERSION, // runtime edisi PHP (bentuk key sama dgn Node)
            'nodeEnv'   => MUHDIN_DEBUG ? 'development' : 'production',
            'platform'  => php_uname('s') . '-' . php_uname('m'),
            'uptimeSec' => (int) round(microtime(true) - (float) ($_SERVER['REQUEST_TIME_FLOAT'] ?? $started)),
            'memoryMb'  => (int) round(memory_get_usage(true) / (1024 * 1024)),
        ],
        'timestamp' => iso_date(now_ms()),
    ], $dbOk ? 200 : 503);
});

/* ================================================================== rss === */

/** Escape karakter khusus XML (& pertama!) — paritas xmlEscape Node. */
function forms_xml_escape(string $s): string
{
    return str_replace(
        ['&', '<', '>', '"', "'"],
        ['&amp;', '&lt;', '&gt;', '&quot;', '&apos;'],
        $s
    );
}

// GET /api/rss — feed RSS 2.0 publik: 20 artikel PUBLISHED terbaru (XML, bukan JSON).
$router->on('GET', 'rss', static function (array $params): void {
    try {
        $base = getenv('NEXT_PUBLIC_SITE_URL') ?: 'https://muhdin.web.id';
        $base = rtrim($base, '/');
        $articles = q_all(
            "SELECT * FROM Article WHERE status = 'PUBLISHED' ORDER BY createdAt DESC LIMIT 20"
        );

        $items = implode("\n", array_map(static function (array $a) use ($base): string {
            $link = $base . '/#/berita/' . $a['slug'];
            $ms   = is_numeric($a['createdAt']) ? (int) $a['createdAt'] : (strtotime((string) $a['createdAt']) ?: 0) * 1000;
            return implode("\n", [
                '    <item>',
                '      <title>' . forms_xml_escape((string) $a['title']) . '</title>',
                '      <link>' . forms_xml_escape($link) . '</link>',
                '      <guid>' . forms_xml_escape($link) . '</guid>',
                '      <pubDate>' . gmdate('D, d M Y H:i:s', (int) floor($ms / 1000)) . ' GMT</pubDate>',
                '      <description>' . forms_xml_escape((string) $a['excerpt']) . '</description>',
                '    </item>',
            ]);
        }, $articles));

        $xml = implode("\n", [
            '<?xml version="1.0" encoding="UTF-8"?>',
            '<rss version="2.0">',
            '  <channel>',
            '    <title>MUHDIN — Berita &amp; Artikel</title>',
            '    <link>' . forms_xml_escape($base) . '</link>',
            '    <description>Berita, artikel, dan pengumuman resmi MUHDIN — asosiasi penyelenggara perjalanan ibadah yang amanah &amp; profesional.</description>',
            '    <lastBuildDate>' . gmdate('D, d M Y H:i:s') . ' GMT</lastBuildDate>',
            $items,
            '  </channel>',
            '</rss>',
        ]);

        http_response_code(200);
        header('Content-Type: application/rss+xml; charset=utf-8');
        header('Cache-Control: no-store');
        echo $xml;
        exit;
    } catch (Throwable $e) {
        $fallback =
            "<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n" .
            '<rss version="2.0"><channel><title>MUHDIN — Berita &amp; Artikel</title></channel></rss>';
        http_response_code(500);
        header('Content-Type: application/rss+xml; charset=utf-8');
        echo $fallback;
        exit;
    }
});

/* =============================================================== export === */

/** Paritas toCell Node: null → '', bool → 1/0, sisanya String(value).
 * Pembingkaian sel CSV diserahkan ke fputcsv di dalam csv_response() —
 * JANGAN pra-escape manual agar tidak terjadi kutip ganda. */
function forms_to_cell($v): string
{
    if ($v === null) return '';
    if (is_bool($v)) return $v ? '1' : '0';
    return forms_js_str($v);
}

// GET /api/export — ekspor CSV CMS (Super Admin / Admin). ?type= members|applications|messages|subscribers|complaints
$router->on('GET', 'export', static function (array $params): void {
    $u = guard_role(['SUPER_ADMIN', 'ADMIN']);
    try {
        $columns = [
            'members' => [
                ['id', 'ID'], ['name', 'Nama Organisasi'], ['type', 'Tipe'], ['city', 'Kota'],
                ['province', 'Provinsi'], ['licenseNo', 'No. Izin'], ['phone', 'Telepon'],
                ['email', 'Email'], ['website', 'Website'], ['status', 'Status'],
                ['memberSince', 'Anggota Sejak'], ['rating', 'Rating'], ['createdAt', 'Dibuat'],
            ],
            'applications' => [
                ['ticketCode', 'Kode Tiket'], ['orgName', 'Organisasi'], ['type', 'Tipe'],
                ['contactName', 'Kontak'], ['email', 'Email'], ['phone', 'Telepon'],
                ['city', 'Kota'], ['licenseNo', 'No. Izin'], ['status', 'Status'],
                ['reviewedBy', 'Diperiksa Oleh'], ['createdAt', 'Dibuat'],
            ],
            'messages' => [
                ['id', 'ID'], ['name', 'Nama'], ['email', 'Email'], ['phone', 'Telepon'],
                ['subject', 'Subjek'], ['message', 'Pesan'], ['status', 'Status'], ['createdAt', 'Dibuat'],
            ],
            'subscribers' => [
                ['id', 'ID'], ['email', 'Email'], ['isActive', 'Aktif'], ['createdAt', 'Dibuat'],
            ],
            'complaints' => [
                ['id', 'ID'], ['name', 'Pelapor'], ['email', 'Email'], ['phone', 'Telepon'],
                ['targetMember', 'Penyelenggara Dilaporkan'], ['category', 'Kategori'],
                ['status', 'Status'], ['responseNote', 'Catatan Respons'],
                ['respondedBy', 'Ditanggapi Oleh'], ['createdAt', 'Dibuat'],
            ],
        ];
        $entityNames = [
            'members'      => 'Member',
            'applications' => 'Application',
            'messages'     => 'Message',
            'subscribers'  => 'Subscriber',
            'complaints'   => 'Complaint',
        ];
        $tables = [
            'members'      => 'Member',
            'applications' => 'MembershipApplication',
            'messages'     => 'ContactMessage',
            'subscribers'  => 'Subscriber',
            'complaints'   => 'Complaint',
        ];

        $type = (string) (qget('type') ?? '');
        if (!isset($columns[$type])) {
            fail('Tipe ekspor tidak valid. Gunakan members|applications|messages|subscribers|complaints.');
        }

        $rows = cast_rows($tables[$type], q_all('SELECT * FROM ' . $tables[$type] . ' ORDER BY createdAt DESC'));
        $cols = $columns[$type];

        // Paritas logAudit Node: action EXPORT, entity sesuai tipe, detail jumlah baris.
        log_audit($u, 'EXPORT', $entityNames[$type], null, 'Ekspor CSV ' . count($rows) . ' baris');

        // csv_response() = BOM UTF-8 + unduhan (kolom & nama file sama dgn Node).
        header('Cache-Control: no-store');
        csv_response(
            'muhdin-' . $type . '-' . date('Ymd') . '.csv',
            array_map(static fn (array $c): string => $c[1], $cols),
            array_map(static function (array $row) use ($cols): array {
                return array_map(static fn (array $c): string => forms_to_cell($row[$c[0]] ?? null), $cols);
            }, $rows)
        );
    } catch (Throwable $e) {
        fail('Gagal mengekspor data.', 500);
    }
});

/* ========================================================== applications === */

// GET /api/applications — admin semua peran.
$router->on('GET', 'applications', static function (array $params): void {
    guard_admin();
    try {
        ok(cast_rows('MembershipApplication', q_all('SELECT * FROM MembershipApplication ORDER BY createdAt DESC')));
    } catch (Throwable $e) {
        fail('Gagal memuat pendaftaran.', 500);
    }
});

// POST /api/applications — publik, rate limit 'applications' 5/menit/IP + WA gagal-aman.
$router->on('POST', 'applications', static function (array $params): void {
    if (forms_rate_limited('applications')) {
        return; // 429 — "Terlalu banyak percobaan. Coba lagi beberapa saat."
    }
    try {
        $required = ['orgName', 'type', 'contactName', 'email', 'phone', 'city', 'licenseNo'];
        foreach ($required as $f) {
            if (forms_trim_str($f) === '') {
                fail('Kolom ' . $f . ' wajib diisi.');
            }
        }
        if (!forms_email_valid(forms_js_str(body('email')))) {
            fail('Format email tidak valid.');
        }
        $id     = new_id();
        $now    = now_ms();
        $ticket = generate_ticket_code();
        q_exec(
            'INSERT INTO MembershipApplication (id, orgName, type, contactName, email, phone, city, province, licenseNo, message, status, ticketCode, reviewNote, reviewedBy, reviewedAt, createdAt, updatedAt) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)',
            [
                $id,
                forms_trim_str('orgName'),
                forms_js_str(body('type')),
                forms_trim_str('contactName'),
                forms_trim_str('email'),
                forms_trim_str('phone'),
                forms_trim_str('city'),
                forms_trim_str('province'),
                forms_trim_str('licenseNo'),
                forms_opt_str('message'),
                'PENDING',
                $ticket,
                null,
                null,
                null,
                $now,
                $now,
            ]
        );
        $app = cast_row('MembershipApplication', q_one('SELECT * FROM MembershipApplication WHERE id = ?', [$id]) ?? []);
        // Task 15-d/18 — notifikasi WhatsApp (fire-and-forget, gagal-aman).
        wa_notify('application', [
            'orgName'    => $app['orgName'],
            'type'       => $app['type'],
            'contactName' => $app['contactName'],
            'email'      => $app['email'],
            'phone'      => $app['phone'],
            'city'       => $app['city'],
            'licenseNo'  => $app['licenseNo'],
            'ticketCode' => $app['ticketCode'],
        ]);
        ok($app, 201);
    } catch (Throwable $e) {
        fail('Gagal mengirim pendaftaran.', 500);
    }
});

// GET /api/applications/track — pelacakan publik via kode tiket (field minimal).
$router->on('GET', 'applications/track', static function (array $params): void {
    try {
        $code = strtoupper(trim((string) (qget('code') ?? '')));
        if (mb_strlen($code) < 5) {
            fail('Masukkan kode tiket (contoh: MHD-TKKN8Z). Kode minimal 5 karakter.');
        }
        $app = q_one('SELECT * FROM MembershipApplication WHERE ticketCode = ?', [$code]);
        if ($app === null) {
            fail('Kode tiket tidak ditemukan. Periksa kembali.', 404);
        }
        $c = cast_row('MembershipApplication', $app);
        ok([
            'found'      => true,
            'ticketCode' => $c['ticketCode'],
            'orgName'    => $c['orgName'],
            'type'       => $c['type'],
            'status'     => $c['status'],
            'submittedAt' => $c['createdAt'],
            'reviewedAt' => $c['reviewedAt'],
            'reviewNote' => $c['reviewNote'],
        ]);
    } catch (Throwable $e) {
        fail('Gagal melacak pendaftaran.', 500);
    }
});

// PUT /api/applications/:id — approve/reject (Task 17: VERIFIKATOR ikut boleh).
$router->on('PUT', 'applications/:id', static function (array $params): void {
    $u  = guard_role(['SUPER_ADMIN', 'ADMIN', 'VERIFIKATOR']);
    $id = $params['id'];
    try {
        $action = forms_truthy(body('action')) ? forms_js_str(body('action')) : '';
        $noteV  = body('reviewNote');
        $note   = forms_truthy($noteV) ? trim(forms_js_str($noteV)) : '';

        if ($action === 'approve') {
            $now = now_ms();
            if (q_exec(
                'UPDATE MembershipApplication SET status = ?, reviewNote = ?, reviewedBy = ?, reviewedAt = ?, updatedAt = ? WHERE id = ?',
                ['APPROVED', $note !== '' ? $note : null, $u['name'] ?? null, $now, $now, $id]
            ) === 0) {
                fail('Gagal memproses pendaftaran.', 500);
            }
            $app = q_one('SELECT * FROM MembershipApplication WHERE id = ?', [$id]) ?? [];
            // Buat anggota otomatis dari pendaftaran yang disetujui
            $existing = q_one('SELECT id FROM Member WHERE licenseNo = ? LIMIT 1', [$app['licenseNo']]);
            if ($existing === null) {
                q_exec(
                    'INSERT INTO Member (id, name, type, city, province, licenseNo, phone, email, website, description, rating, status, memberSince, createdAt, updatedAt) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)',
                    [
                        new_id(),
                        $app['orgName'],
                        $app['type'],
                        $app['city'],
                        $app['province'],
                        $app['licenseNo'],
                        $app['phone'],
                        $app['email'],
                        null,
                        $app['message'],
                        4.5,
                        'TERVERIFIKASI',
                        (int) date('Y'),
                        $now,
                        $now,
                    ]
                );
            }
            // Task 18 — jejak audit persetujuan.
            log_audit($u, 'APPROVE', 'Application', $id, 'Setujui ' . $app['orgName']);
            ok(cast_row('MembershipApplication', $app));
        }

        if ($action === 'reject') {
            if (mb_strlen($note) < 5) {
                fail('Alasan penolakan wajib diisi (minimal 5 karakter) agar pencalar mendapat kejelasan.');
            }
            $now = now_ms();
            if (q_exec(
                'UPDATE MembershipApplication SET status = ?, reviewNote = ?, reviewedBy = ?, reviewedAt = ?, updatedAt = ? WHERE id = ?',
                ['REJECTED', $note, $u['name'] ?? null, $now, $now, $id]
            ) === 0) {
                fail('Gagal memproses pendaftaran.', 500);
            }
            $app = q_one('SELECT * FROM MembershipApplication WHERE id = ?', [$id]) ?? [];
            // Task 18 — jejak audit penolakan.
            log_audit($u, 'REJECT', 'Application', $id, 'Tolak ' . $app['orgName']);
            ok(cast_row('MembershipApplication', $app));
        }

        fail('Aksi tidak dikenal.');
    } catch (Throwable $e) {
        fail('Gagal memproses pendaftaran.', 500);
    }
});

// DELETE /api/applications/:id — Super Admin / Admin (tanpa audit, paritas Node).
$router->on('DELETE', 'applications/:id', static function (array $params): void {
    guard_role(['SUPER_ADMIN', 'ADMIN']);
    $id = $params['id'];
    try {
        if (q_exec('DELETE FROM MembershipApplication WHERE id = ?', [$id]) === 0) {
            fail('Gagal menghapus pendaftaran.', 500);
        }
        ok(['success' => true]);
    } catch (Throwable $e) {
        fail('Gagal menghapus pendaftaran.', 500);
    }
});

/* ============================================================ complaints === */

// GET /api/complaints — admin semua peran, filter opsional ?status=.
$router->on('GET', 'complaints', static function (array $params): void {
    guard_admin();
    try {
        $status = qget('status');
        $rows   = $status !== null
            ? q_all('SELECT * FROM Complaint WHERE status = ? ORDER BY createdAt DESC', [$status])
            : q_all('SELECT * FROM Complaint ORDER BY createdAt DESC');
        ok(cast_rows('Complaint', $rows));
    } catch (Throwable $e) {
        fail('Gagal memuat pengaduan.', 500);
    }
});

// POST /api/complaints — publik, rate limit 'complaints' 5/menit/IP + WA gagal-aman.
$router->on('POST', 'complaints', static function (array $params): void {
    if (forms_rate_limited('complaints')) {
        return; // 429 — "Terlalu banyak percobaan. Coba lagi beberapa saat."
    }
    try {
        $name    = forms_trim_str('name');
        $email   = forms_trim_str('email');
        $content = forms_trim_str('content');
        if ($name === '' || $email === '' || $content === '') {
            fail('Nama, email, dan isi laporan wajib diisi.');
        }
        if (!forms_email_valid(forms_js_str(body('email')))) {
            fail('Format email tidak valid.');
        }
        $id  = new_id();
        $now = now_ms();
        q_exec(
            'INSERT INTO Complaint (id, name, email, phone, targetMember, category, content, status, responseNote, respondedBy, respondedAt, createdAt, updatedAt) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)',
            [
                $id,
                $name,
                $email,
                forms_opt_str('phone'),
                forms_opt_str('targetMember'),
                forms_truthy(body('category')) ? forms_js_str(body('category')) : 'Pelayanan',
                $content,
                'UNREAD',
                null,
                null,
                null,
                $now,
                $now,
            ]
        );
        $complaint = cast_row('Complaint', q_one('SELECT * FROM Complaint WHERE id = ?', [$id]) ?? []);
        // Task 15-d/18 — notifikasi WhatsApp (fire-and-forget, gagal-aman).
        wa_notify('complaint', [
            'name'        => $name,
            'targetMember' => $complaint['targetMember'],
            'category'    => $complaint['category'],
        ]);
        ok($complaint, 201);
    } catch (Throwable $e) {
        fail('Gagal mengirim pengaduan.', 500);
    }
});

// PUT /api/complaints/:id — tindak lanjut (UNREAD/PROCESSED/CLOSED) + catatan respons.
$router->on('PUT', 'complaints/:id', static function (array $params): void {
    $u  = guard_role(['SUPER_ADMIN', 'ADMIN', 'VERIFIKATOR']);
    $id = $params['id'];
    try {
        $existing = q_one('SELECT * FROM Complaint WHERE id = ?', [$id]);
        if ($existing === null) {
            fail('Pengaduan tidak ditemukan.', 404);
        }
        $b      = json_body();
        $set    = ['updatedAt = ?']; // Prisma @updatedAt
        $args   = [now_ms()];
        $action = 'UPDATE';
        if (array_key_exists('status', $b)) {
            $status = forms_js_str($b['status']);
            if (!in_array($status, ['UNREAD', 'PROCESSED', 'CLOSED'], true)) {
                fail('Status tidak valid.');
            }
            $set[]  = 'status = ?';
            $args[] = $status;
            if ($status !== $existing['status'] && ($status === 'PROCESSED' || $status === 'CLOSED')) {
                $set[]  = 'respondedBy = ?';
                $args[] = $u['name'] ?? null;
                $set[]  = 'respondedAt = ?';
                $args[] = now_ms();
                $action = $status; // jejak audit mengikuti status baru
            }
        }
        if (array_key_exists('responseNote', $b)) {
            $set[]  = 'responseNote = ?';
            $args[] = forms_truthy($b['responseNote']) ? forms_js_str($b['responseNote']) : null;
        }
        $args[] = $id;
        q_exec('UPDATE Complaint SET ' . implode(', ', $set) . ' WHERE id = ?', $args);
        $complaint = cast_row('Complaint', q_one('SELECT * FROM Complaint WHERE id = ?', [$id]) ?? []);
        log_audit($u, $action, 'Complaint', $id, 'Pengaduan dari ' . $existing['name']);
        ok($complaint);
    } catch (Throwable $e) {
        fail('Gagal memperbarui pengaduan.', 500);
    }
});

// DELETE /api/complaints/:id — Super Admin / Admin.
$router->on('DELETE', 'complaints/:id', static function (array $params): void {
    $u  = guard_role(['SUPER_ADMIN', 'ADMIN']);
    $id = $params['id'];
    try {
        if (q_exec('DELETE FROM Complaint WHERE id = ?', [$id]) === 0) {
            fail('Gagal menghapus pengaduan.', 500);
        }
        log_audit($u, 'DELETE', 'Complaint', $id);
        ok(['success' => true]);
    } catch (Throwable $e) {
        fail('Gagal menghapus pengaduan.', 500);
    }
});

/* ============================================================== messages === */

// GET /api/messages — admin semua peran, filter opsional ?status=.
$router->on('GET', 'messages', static function (array $params): void {
    guard_admin();
    try {
        $status = qget('status');
        $rows   = $status !== null
            ? q_all('SELECT * FROM ContactMessage WHERE status = ? ORDER BY createdAt DESC', [$status])
            : q_all('SELECT * FROM ContactMessage ORDER BY createdAt DESC');
        ok(cast_rows('ContactMessage', $rows));
    } catch (Throwable $e) {
        fail('Gagal memuat pesan.', 500);
    }
});

// POST /api/messages — publik, rate limit 'messages' 5/menit/IP + WA gagal-aman.
$router->on('POST', 'messages', static function (array $params): void {
    if (forms_rate_limited('messages')) {
        return; // 429 — "Terlalu banyak percobaan. Coba lagi beberapa saat."
    }
    try {
        $name    = forms_trim_str('name');
        $email   = forms_trim_str('email');
        $message = forms_trim_str('message');
        $subject = forms_trim_str('subject');
        if ($name === '' || $email === '' || $message === '' || $subject === '') {
            fail('Nama, email, subjek, dan pesan wajib diisi.');
        }
        if (!forms_email_valid(forms_js_str(body('email')))) {
            fail('Format email tidak valid.');
        }
        $id = new_id();
        q_exec(
            'INSERT INTO ContactMessage (id, name, email, phone, subject, message, status, createdAt) VALUES (?,?,?,?,?,?,?,?)',
            [$id, $name, $email, forms_opt_str('phone'), $subject, $message, 'UNREAD', now_ms()]
        );
        $msg = cast_row('ContactMessage', q_one('SELECT * FROM ContactMessage WHERE id = ?', [$id]) ?? []);
        // Task 15-d — notifikasi WhatsApp (fire-and-forget, gagal-aman).
        wa_notify('contact', [
            'name'    => $name,
            'email'   => $email,
            'phone'   => $msg['phone'],
            'subject' => $subject,
            'message' => $message,
        ]);
        ok($msg, 201);
    } catch (Throwable $e) {
        fail('Gagal mengirim pesan.', 500);
    }
});

// PUT /api/messages/:id — tandai terbaca (Super Admin / Admin).
$router->on('PUT', 'messages/:id', static function (array $params): void {
    guard_role(['SUPER_ADMIN', 'ADMIN']);
    $id = $params['id'];
    try {
        $status = forms_truthy(body('status')) ? forms_js_str(body('status')) : 'READ';
        if (q_exec('UPDATE ContactMessage SET status = ? WHERE id = ?', [$status, $id]) === 0) {
            fail('Gagal memperbarui pesan.', 500);
        }
        ok(cast_row('ContactMessage', q_one('SELECT * FROM ContactMessage WHERE id = ?', [$id]) ?? []));
    } catch (Throwable $e) {
        fail('Gagal memperbarui pesan.', 500);
    }
});

// DELETE /api/messages/:id — Super Admin / Admin.
$router->on('DELETE', 'messages/:id', static function (array $params): void {
    $u  = guard_role(['SUPER_ADMIN', 'ADMIN']);
    $id = $params['id'];
    try {
        if (q_exec('DELETE FROM ContactMessage WHERE id = ?', [$id]) === 0) {
            fail('Gagal menghapus pesan.', 500);
        }
        // Task 18 — jejak audit penghapusan pesan.
        log_audit($u, 'DELETE', 'Message', $id);
        ok(['success' => true]);
    } catch (Throwable $e) {
        fail('Gagal menghapus pesan.', 500);
    }
});

/* =========================================================== subscribers === */

// GET /api/subscribers — Super Admin / Admin.
$router->on('GET', 'subscribers', static function (array $params): void {
    guard_role(['SUPER_ADMIN', 'ADMIN']);
    try {
        ok(cast_rows('Subscriber', q_all('SELECT * FROM Subscriber ORDER BY createdAt DESC')));
    } catch (Throwable $e) {
        fail('Gagal memuat pelanggan.', 500);
    }
});

// POST /api/subscribers — publik + rate limit; email duplikat tetap 201 {already:true} (privasi).
$router->on('POST', 'subscribers', static function (array $params): void {
    if (forms_rate_limited('subscribers')) {
        return; // 429 — "Terlalu banyak percobaan. Coba lagi beberapa saat."
    }
    try {
        $emailV = body('email');
        $email  = mb_strtolower(trim(forms_truthy($emailV) ? forms_js_str($emailV) : ''), 'UTF-8');
        if (!forms_email_valid($email)) {
            fail('Format email tidak valid.');
        }
        try {
            q_exec(
                'INSERT INTO Subscriber (id, email, isActive, createdAt) VALUES (?,?,1,?)',
                [new_id(), $email, now_ms()]
            );
            ok(['ok' => true, 'already' => false], 201);
        } catch (PDOException $dup) {
            // Task 18 — pelanggaran UNIQUE (P2002): jangan bocorkan email sudah terdaftar.
            if ($dup->getCode() === '23000' || strpos($dup->getMessage(), 'UNIQUE') !== false) {
                ok(['ok' => true, 'already' => true], 201);
            }
            throw $dup;
        }
    } catch (Throwable $e) {
        fail('Gagal mendaftarkan langganan.', 500);
    }
});

// PUT /api/subscribers/:id — aktifkan/nonaktifkan (Super Admin / Admin).
$router->on('PUT', 'subscribers/:id', static function (array $params): void {
    guard_role(['SUPER_ADMIN', 'ADMIN']);
    $id = $params['id'];
    try {
        // Paritas Boolean(body.isActive) — "false" (string) tetap truthy di JS.
        $isActive = forms_truthy(body('isActive')) ? 1 : 0;
        if (q_exec('UPDATE Subscriber SET isActive = ? WHERE id = ?', [$isActive, $id]) === 0) {
            fail('Gagal memperbarui pelanggan.', 500);
        }
        ok(cast_row('Subscriber', q_one('SELECT * FROM Subscriber WHERE id = ?', [$id]) ?? []));
    } catch (Throwable $e) {
        fail('Gagal memperbarui pelanggan.', 500);
    }
});

// DELETE /api/subscribers/:id — Super Admin / Admin.
$router->on('DELETE', 'subscribers/:id', static function (array $params): void {
    guard_role(['SUPER_ADMIN', 'ADMIN']);
    $id = $params['id'];
    try {
        if (q_exec('DELETE FROM Subscriber WHERE id = ?', [$id]) === 0) {
            fail('Gagal menghapus pelanggan.', 500);
        }
        ok(['success' => true]);
    } catch (Throwable $e) {
        fail('Gagal menghapus pelanggan.', 500);
    }
});
