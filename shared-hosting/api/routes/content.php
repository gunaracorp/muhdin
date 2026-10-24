<?php
/** routes/content.php — mirror konten publik+admin Node (paritas 1:1) */
/**
 * ============================================================================
 * routes/content.php — Mirror 1:1 route KONTEN Node (src/app/api/**)
 * ----------------------------------------------------------------------------
 * Sumber mirror (dibaca baris demi baris):
 *   articles (route.ts, [id], slug/[slug]) · tutorials (idem) · ecosystems ·
 *   journey · roadmap · faqs · testimonials · management · branches ·
 *   gallery · events · resources (+ :id/download) · settings · translations
 *
 * Kontrak dijaga persis: bentuk respons (array polos / {success:true} / map
 * key→value), filter & pagination query param, pesan error & status code,
 * guard per aksi (guardAdmin → guard_admin, guardRole([...]) → guard_role),
 * slugify + akhiran unik `${slug}-${Date.now().toString(36)}`, increment
 * views/downloads, ORDER BY identik, audit RegionalBranch & Settings.
 *
 * i18n (paritas applyEntityTranslations — src/lib/i18n-server.ts):
 *   Article   → entity "Article",   keyOf slug,          fields title/excerpt/content
 *   Tutorial  → entity "Tutorial",  keyOf slug,          fields title/summary/content
 *   Ecosystem → entity "Ecosystem", keyOf String(number),fields name/scope/standard/description
 *   JourneyStep→entity "JourneyStep",keyOf String(step), fields title/activity/output
 *   Roadmap   → entity "Roadmap",   keyOf id             fields phase/focus/deliverables
 *   Faq       → entity "Faq",       keyOf id             fields question/answer
 *   Testimonial→entity "Testimonial",keyOf id            fields role/content
 *   Management→ entity "Management",keyOf id             fields position/bio
 *   SiteSetting→entity "SiteSetting",keyOf key, field value, allowlist SETTING_TRANSLATABLE
 * Entity ber-keyOf id memakai apply_translations() lib.php (ekuivalen penuh).
 * Entity ber-keyOf slug/number/step/key memakai content_localize() di bawah
 * (lib.php apply_translations memakai id??slug — tidak cocok untuk itu).
 * Varian PHP tanpa AI: hanya cache ContentTranslation yang diterapkan;
 * field tanpa terjemahan tetap teks Indonesia (fallback, sesuai edisi PHP).
 *
 * Tanggal: epoch-ms (now_ms()/date_to_ms()); UPDATE model berupdatedAt
 * selalu set updatedAt=now_ms() (paritas @updatedAt Prisma). Model tanpa
 * kolom updatedAt (JourneyStep, Roadmap, Faq, Testimonial, Management,
 * SiteSetting) tidak menulisnya — persis Prisma.
 * ============================================================================
 */
declare(strict_types=1);

/** @var Router $router */
global $router;

/* ================================================================ konstanta */
/** Allowlist key SiteSetting yang boleh diterjemahkan (paritas SETTING_TRANSLATABLE Node). */
const CONTENT_SETTING_TRANSLATABLE = [
    'heroTitle', 'heroSubtitle', 'vision', 'mission', 'tagline',
    'nusuk_tagline', 'nusuk_desc', 'nusuk_api_note',
];

/** Registry terjemahan (paritas ENTITY_REGISTRY/ENTITY_NAMES Node — urutan sama). */
const CONTENT_I18N_ENTITIES = [
    'Article'     => ['table' => 'Article',     'fields' => ['title', 'excerpt', 'content']],
    'Tutorial'    => ['table' => 'Tutorial',    'fields' => ['title', 'summary', 'content']],
    'Ecosystem'   => ['table' => 'Ecosystem',   'fields' => ['name', 'scope', 'standard', 'description']],
    'JourneyStep' => ['table' => 'JourneyStep', 'fields' => ['title', 'activity', 'output']],
    'Roadmap'     => ['table' => 'Roadmap',     'fields' => ['phase', 'focus', 'deliverables']],
    'Member'      => ['table' => 'Member',      'fields' => ['description']],
    'Faq'         => ['table' => 'Faq',         'fields' => ['question', 'answer']],
    'Testimonial' => ['table' => 'Testimonial', 'fields' => ['role', 'content']],
    'Management'  => ['table' => 'Management',  'fields' => ['position', 'bio']],
    'SiteSetting' => ['table' => 'SiteSetting', 'fields' => ['value']],
];

/* ================================================================== helpers */
/**
 * Mirror applyEntityTranslations Node utk keyOf non-id (slug/number/step/key)
 * — varian PHP tanpa AI: hanya cache ContentTranslation (entity+locale,
 * entityKey IN keys, field IN fields) yang menimpa nilai baris.
 * $onlyKeys = allowlist (SiteSetting): baris di luar allowlist tak tersentuh.
 */
if (!function_exists('content_localize')) {
    function content_localize(array $rows, string $entity, string $locale, callable $keyOf, array $fields, ?array $onlyKeys = null): array
    {
        if ($locale === 'id' || $rows === []) return $rows;
        $keys = [];
        foreach ($rows as $r) {
            $k = (string) $keyOf($r);
            if ($onlyKeys === null || in_array($k, $onlyKeys, true)) $keys[$k] = true;
        }
        if ($keys === []) return $rows;
        $map = [];
        foreach (array_chunk(array_keys($keys), 200) as $chunk) {
            $inKeys = implode(',', array_fill(0, count($chunk), '?'));
            $inFields = implode(',', array_fill(0, count($fields), '?'));
            $saved = q_all(
                "SELECT entityKey, field, value FROM ContentTranslation WHERE entity = ? AND locale = ? AND entityKey IN ($inKeys) AND field IN ($inFields)",
                array_merge([$entity, $locale], $chunk, $fields)
            );
            foreach ($saved as $s) {
                $map[$s['entityKey']][$s['field']] = $s['value'];
            }
        }
        if ($map === []) return $rows;
        foreach ($rows as $i => $row) {
            $k = (string) $keyOf($row);
            if ($onlyKeys !== null && !in_array($k, $onlyKeys, true)) continue;
            foreach ($fields as $f) {
                if (isset($map[$k][$f]) && $map[$k][$f] !== null && $map[$k][$f] !== '') {
                    $rows[$i][$f] = $map[$k][$f];
                }
            }
        }
        return $rows;
    }
}

if (!function_exists('content_falsy')) {
    /** Falsy gaya JavaScript utk nilai JSON: null/false/''/0/0.0 ([] & "0" tetap truthy). */
    function content_falsy($v): bool
    {
        return $v === null || $v === false || $v === '' || $v === 0 || $v === 0.0;
    }
}

if (!function_exists('content_js_string')) {
    /** Paritas String(v) JavaScript utk nilai JSON (null→"null", true→"true", dst). */
    function content_js_string($v): string
    {
        if (is_string($v)) return $v;
        if (is_int($v)) return (string) $v;
        if (is_float($v)) return json_encode($v);
        if ($v === true) return 'true';
        if ($v === false) return 'false';
        if ($v === null) return 'null';
        return '';
    }
}

if (!function_exists('content_str')) {
    /** Paritas String(body.x || default): falsy → default, selain itu String(x). */
    function content_str(string $key, string $default = ''): string
    {
        $v = body($key);
        return content_falsy($v) ? $default : content_js_string($v);
    }
}

if (!function_exists('content_parse_int')) {
    /** Paritas parseInt(v, 10) JavaScript → int atau null (NaN). */
    function content_parse_int($v): ?int
    {
        if (is_int($v)) return $v;
        if (is_float($v)) $v = json_encode($v);
        if (!is_string($v)) return null;
        return preg_match('/^\s*([+-]?\d+)/', $v, $m) ? (int) $m[1] : null;
    }
}

if (!function_exists('content_int_or')) {
    /** Paritas `parseInt(body.x, 10) || fallback` Node (NaN & 0 → fallback). */
    function content_int_or(string $key, int $fallback): int
    {
        $n = content_parse_int(body($key));
        return ($n === null || $n === 0) ? $fallback : $n;
    }
}

if (!function_exists('content_slug_suffix')) {
    /** Paritas Date.now().toString(36) — akhiran slug unik Node. */
    function content_slug_suffix(): string
    {
        return base_convert((string) now_ms(), 10, 36);
    }
}

if (!function_exists('content_job_state')) {
    /** Paritas jobState() Node (translate-engine) — PHP request-scoped, tanpa AI. */
    function content_job_state(): array
    {
        return [
            'running' => false, 'locale' => null, 'entity' => null, 'entityIndex' => 0,
            'entityTotal' => 0, 'entityDone' => 0, 'done' => 0, 'total' => 0,
            'translated' => 0, 'failed' => 0, 'errors' => [], 'startedAt' => null, 'finishedAt' => null,
        ];
    }
}

if (!function_exists('content_update_or_404ish')) {
    /**
     * UPDATE berparameter; rowCount 0 berarti record tak ada — Prisma update()
     * melempar P2025 yang ditangkap catch Node → fail(pesan, 500). Mirror sama.
     */
    function content_update_or_404ish(string $sql, array $params, string $errMsg): void
    {
        if (q_exec($sql, $params) === 0) fail($errMsg, 500);
    }
}

/* ================================================================ ARTICLES */
/* Mirror src/app/api/articles/route.ts */

$router->on('GET', 'articles', static function (array $params): void {
    try {
        $status = qget('status');
        $category = qget('category');
        $featured = qget('featured');
        $limit = content_parse_int(qget('limit')) ?? 0;
        $q = qget('q');

        $where = [];
        $args = [];
        if ($status === 'all') {
            // mode admin: tampilkan semua
        } elseif ($status !== null) {
            $where[] = 'status = ?';
            $args[] = $status;
        } else {
            $where[] = "status = 'PUBLISHED'";
        }
        if ($category !== null) {
            $where[] = 'category = ?';
            $args[] = $category;
        }
        if ($featured === 'true') {
            $where[] = 'featured = 1';
        }
        if ($q !== null) {
            $where[] = '(title LIKE ? OR excerpt LIKE ? OR content LIKE ?)';
            $like = '%' . $q . '%';
            array_push($args, $like, $like, $like);
        }

        $sql = 'SELECT * FROM Article'
            . ($where === [] ? '' : ' WHERE ' . implode(' AND ', $where))
            . ' ORDER BY featured DESC, createdAt DESC'
            . ($limit > 0 ? ' LIMIT ' . $limit : '');
        $rows = cast_rows('Article', q_all($sql, $args));
        $localized = content_localize(
            $rows,
            'Article',
            want_locale(),
            static fn (array $r): string => (string) $r['slug'],
            ['title', 'excerpt', 'content']
        );
        ok($localized);
    } catch (Throwable $e) {
        fail('Gagal memuat artikel.', 500);
    }
});

$router->on('POST', 'articles', static function (array $params): void {
    guard_admin();
    try {
        $title = trim(content_str('title', ''));
        if ($title === '') fail('Judul wajib diisi.');
        $suffix = content_slug_suffix();
        $slug = slugify(content_str('slug', $title));
        if ($slug === '') $slug = 'artikel-' . $suffix;
        $exists = q_one('SELECT id FROM Article WHERE slug = ?', [$slug]) !== null;
        $excerpt = trim(content_str('excerpt', ''));
        if ($excerpt === '') $excerpt = mb_substr($title, 0, 140);
        $cover = content_falsy(body('cover')) ? null : content_js_string(body('cover'));
        $now = now_ms();
        $id = new_id();
        q_exec(
            'INSERT INTO Article (id, title, slug, excerpt, content, category, cover, status, featured, views, author, createdAt, updatedAt) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)',
            [
                $id,
                $title,
                $exists ? $slug . '-' . $suffix : $slug,
                $excerpt,
                content_str('content', ''),
                content_str('category', 'Berita'),
                $cover,
                content_str('status', 'PUBLISHED'),
                bool_int('featured', 0),
                0,
                content_str('author', 'Tim MUHDIN'),
                $now,
                $now,
            ]
        );
        ok(cast_row('Article', q_one('SELECT * FROM Article WHERE id = ?', [$id]) ?? []), 201);
    } catch (Throwable $e) {
        fail('Gagal membuat artikel.', 500);
    }
});

/* Mirror src/app/api/articles/[id]/route.ts */

$router->on('GET', 'articles/:id', static function (array $params): void {
    $article = q_one('SELECT * FROM Article WHERE id = ?', [$params['id']]);
    if ($article === null) fail('Artikel tidak ditemukan.', 404);
    ok(cast_row('Article', $article));
});

$router->on('PUT', 'articles/:id', static function (array $params): void {
    guard_admin();
    $id = $params['id'];
    try {
        $b = json_body();
        $set = [];
        $args = [];
        if (array_key_exists('title', $b)) {
            $set[] = 'title = ?';
            $args[] = trim(content_js_string($b['title']));
        }
        if (array_key_exists('excerpt', $b)) {
            $set[] = 'excerpt = ?';
            $args[] = content_js_string($b['excerpt']);
        }
        if (array_key_exists('content', $b)) {
            $set[] = 'content = ?';
            $args[] = content_js_string($b['content']);
        }
        if (array_key_exists('category', $b)) {
            $set[] = 'category = ?';
            $args[] = content_js_string($b['category']);
        }
        if (array_key_exists('cover', $b)) {
            $set[] = 'cover = ?';
            $args[] = content_falsy($b['cover']) ? null : content_js_string($b['cover']);
        }
        if (array_key_exists('status', $b)) {
            $set[] = 'status = ?';
            $args[] = content_js_string($b['status']);
        }
        if (array_key_exists('featured', $b)) {
            $set[] = 'featured = ?';
            $args[] = bool_int('featured', 1);
        }
        if (array_key_exists('author', $b)) {
            $set[] = 'author = ?';
            $args[] = content_js_string($b['author']);
        }
        if (array_key_exists('slug', $b)) {
            $s = slugify(content_js_string($b['slug']));
            if ($s !== '') { // slugify('') → undefined di Node → kolom tak diubah
                $set[] = 'slug = ?';
                $args[] = $s;
            }
        }
        $set[] = 'updatedAt = ?'; // paritas @updatedAt Prisma
        $args[] = now_ms();
        $args[] = $id;
        content_update_or_404ish('UPDATE Article SET ' . implode(', ', $set) . ' WHERE id = ?', $args, 'Gagal memperbarui artikel.');
        ok(cast_row('Article', q_one('SELECT * FROM Article WHERE id = ?', [$id]) ?? []));
    } catch (Throwable $e) {
        fail('Gagal memperbarui artikel.', 500);
    }
});

$router->on('DELETE', 'articles/:id', static function (array $params): void {
    guard_admin();
    $id = $params['id'];
    try {
        if (q_exec('DELETE FROM Article WHERE id = ?', [$id]) === 0) fail('Gagal menghapus artikel.', 500);
        ok(['success' => true]);
    } catch (Throwable $e) {
        fail('Gagal menghapus artikel.', 500);
    }
});

/* Mirror src/app/api/articles/slug/[slug]/route.ts */

$router->on('GET', 'articles/slug/:slug', static function (array $params): void {
    $article = q_one('SELECT * FROM Article WHERE slug = ?', [$params['slug']]);
    if ($article === null) fail('Artikel tidak ditemukan.', 404);
    if ($article['status'] !== 'PUBLISHED') fail('Artikel tidak ditemukan.', 404);
    try {
        q_exec('UPDATE Article SET views = views + 1 WHERE id = ?', [$article['id']]);
    } catch (Throwable $e) {
        // increment views gagal-aman (paritas .catch(() => {}))
    }
    $row = content_localize(
        [cast_row('Article', $article)],
        'Article',
        want_locale(),
        static fn (array $r): string => (string) $r['slug'],
        ['title', 'excerpt', 'content']
    );
    ok($row[0] ?? null);
});

/* =============================================================== TUTORIALS */
/* Mirror src/app/api/tutorials/route.ts */

$router->on('GET', 'tutorials', static function (array $params): void {
    try {
        $category = qget('category');
        $q = qget('q');
        $isAdmin = qget('all') === '1';

        $where = [];
        $args = [];
        if (!$isAdmin) $where[] = 'published = 1';
        if ($category !== null) {
            $where[] = 'category = ?';
            $args[] = $category;
        }
        if ($q !== null) {
            $where[] = '(title LIKE ? OR summary LIKE ? OR content LIKE ?)';
            $like = '%' . $q . '%';
            array_push($args, $like, $like, $like);
        }

        $sql = 'SELECT * FROM Tutorial'
            . ($where === [] ? '' : ' WHERE ' . implode(' AND ', $where))
            . ' ORDER BY "order" ASC';
        $rows = cast_rows('Tutorial', q_all($sql, $args));
        $localized = content_localize(
            $rows,
            'Tutorial',
            want_locale(),
            static fn (array $r): string => (string) $r['slug'],
            ['title', 'summary', 'content']
        );
        ok($localized);
    } catch (Throwable $e) {
        fail('Gagal memuat tutorial.', 500);
    }
});

$router->on('POST', 'tutorials', static function (array $params): void {
    guard_admin();
    try {
        $title = trim(content_str('title', ''));
        if ($title === '') fail('Judul wajib diisi.');
        $suffix = content_slug_suffix();
        $slug = slugify(content_str('slug', $title));
        if ($slug === '') $slug = 'tutorial-' . $suffix;
        $exists = q_one('SELECT id FROM Tutorial WHERE slug = ?', [$slug]) !== null;
        $published = array_key_exists('published', json_body()) ? bool_int('published', 1) : 1;
        $now = now_ms();
        $id = new_id();
        q_exec(
            'INSERT INTO Tutorial (id, title, slug, category, level, duration, summary, content, "order", published, views, createdAt, updatedAt) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)',
            [
                $id,
                $title,
                $exists ? $slug . '-' . $suffix : $slug,
                content_str('category', 'Umum'),
                content_str('level', 'Pemula'),
                content_int_or('duration', 10),
                content_str('summary', ''),
                content_str('content', ''),
                content_int_or('order', 99),
                $published,
                0,
                $now,
                $now,
            ]
        );
        ok(cast_row('Tutorial', q_one('SELECT * FROM Tutorial WHERE id = ?', [$id]) ?? []), 201);
    } catch (Throwable $e) {
        fail('Gagal membuat tutorial.', 500);
    }
});

/* Mirror src/app/api/tutorials/[id]/route.ts */

$router->on('GET', 'tutorials/:id', static function (array $params): void {
    $tutorial = q_one('SELECT * FROM Tutorial WHERE id = ?', [$params['id']]);
    if ($tutorial === null) fail('Tutorial tidak ditemukan.', 404);
    ok(cast_row('Tutorial', $tutorial));
});

$router->on('PUT', 'tutorials/:id', static function (array $params): void {
    guard_admin();
    $id = $params['id'];
    try {
        $b = json_body();
        $set = [];
        $args = [];
        if (array_key_exists('title', $b)) {
            $set[] = 'title = ?';
            $args[] = content_js_string($b['title']);
        }
        if (array_key_exists('category', $b)) {
            $set[] = 'category = ?';
            $args[] = content_js_string($b['category']);
        }
        if (array_key_exists('level', $b)) {
            $set[] = 'level = ?';
            $args[] = content_js_string($b['level']);
        }
        if (array_key_exists('duration', $b)) {
            $set[] = 'duration = ?';
            $args[] = content_int_or('duration', 10);
        }
        if (array_key_exists('summary', $b)) {
            $set[] = 'summary = ?';
            $args[] = content_js_string($b['summary']);
        }
        if (array_key_exists('content', $b)) {
            $set[] = 'content = ?';
            $args[] = content_js_string($b['content']);
        }
        if (array_key_exists('order', $b)) {
            $set[] = '"order" = ?';
            $args[] = content_int_or('order', 0);
        }
        if (array_key_exists('published', $b)) {
            $set[] = 'published = ?';
            $args[] = bool_int('published', 1);
        }
        if (array_key_exists('slug', $b)) {
            $s = slugify(content_js_string($b['slug']));
            if ($s !== '') {
                $set[] = 'slug = ?';
                $args[] = $s;
            }
        }
        $set[] = 'updatedAt = ?';
        $args[] = now_ms();
        $args[] = $id;
        content_update_or_404ish('UPDATE Tutorial SET ' . implode(', ', $set) . ' WHERE id = ?', $args, 'Gagal memperbarui tutorial.');
        ok(cast_row('Tutorial', q_one('SELECT * FROM Tutorial WHERE id = ?', [$id]) ?? []));
    } catch (Throwable $e) {
        fail('Gagal memperbarui tutorial.', 500);
    }
});

$router->on('DELETE', 'tutorials/:id', static function (array $params): void {
    guard_admin();
    $id = $params['id'];
    try {
        if (q_exec('DELETE FROM Tutorial WHERE id = ?', [$id]) === 0) fail('Gagal menghapus tutorial.', 500);
        ok(['success' => true]);
    } catch (Throwable $e) {
        fail('Gagal menghapus tutorial.', 500);
    }
});

/* Mirror src/app/api/tutorials/slug/[slug]/route.ts */

$router->on('GET', 'tutorials/slug/:slug', static function (array $params): void {
    $tutorial = q_one('SELECT * FROM Tutorial WHERE slug = ?', [$params['slug']]);
    if ($tutorial === null || !((int) $tutorial['published'])) fail('Tutorial tidak ditemukan.', 404);
    try {
        q_exec('UPDATE Tutorial SET views = views + 1 WHERE id = ?', [$tutorial['id']]);
    } catch (Throwable $e) {
        // increment views gagal-aman
    }
    $row = content_localize(
        [cast_row('Tutorial', $tutorial)],
        'Tutorial',
        want_locale(),
        static fn (array $r): string => (string) $r['slug'],
        ['title', 'summary', 'content']
    );
    ok($row[0] ?? null);
});

/* ============================================================== ECOSYSTEMS */
/* Mirror src/app/api/ecosystems/route.ts */

$router->on('GET', 'ecosystems', static function (array $params): void {
    try {
        $cluster = qget('cluster');
        $sql = 'SELECT * FROM Ecosystem' . ($cluster !== null ? ' WHERE cluster = ?' : '') . ' ORDER BY number ASC';
        $rows = cast_rows('Ecosystem', q_all($sql, $cluster !== null ? [$cluster] : []));
        $localized = content_localize(
            $rows,
            'Ecosystem',
            want_locale(),
            static fn (array $r): string => (string) $r['number'],
            ['name', 'scope', 'standard', 'description']
        );
        ok($localized);
    } catch (Throwable $e) {
        fail('Gagal memuat ekosistem.', 500);
    }
});

$router->on('POST', 'ecosystems', static function (array $params): void {
    guard_admin();
    try {
        $number = content_parse_int(body('number'));
        if (content_falsy(body('name')) || $number === null) fail('Nomor dan nama ekosistem wajib diisi.');
        $image = content_falsy(body('image')) ? null : content_js_string(body('image'));
        $now = now_ms();
        $id = new_id();
        q_exec(
            'INSERT INTO Ecosystem (id, number, name, cluster, scope, standard, icon, color, description, image, createdAt, updatedAt) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)',
            [
                $id,
                $number,
                content_js_string(body('name')),
                content_str('cluster', 'Akses & Mobilitas'),
                content_str('scope', ''),
                content_str('standard', ''),
                content_str('icon', 'hexagon'),
                content_str('color', 'emerald'),
                content_str('description', ''),
                $image,
                $now,
                $now,
            ]
        );
        ok(cast_row('Ecosystem', q_one('SELECT * FROM Ecosystem WHERE id = ?', [$id]) ?? []), 201);
    } catch (Throwable $e) {
        fail('Gagal membuat ekosistem — nomor mungkin sudah dipakai.', 500);
    }
});

/* Mirror src/app/api/ecosystems/[id]/route.ts */

$router->on('GET', 'ecosystems/:id', static function (array $params): void {
    $ecosystem = q_one('SELECT * FROM Ecosystem WHERE id = ?', [$params['id']]);
    if ($ecosystem === null) fail('Ekosistem tidak ditemukan.', 404);
    ok(cast_row('Ecosystem', $ecosystem));
});

$router->on('PUT', 'ecosystems/:id', static function (array $params): void {
    guard_admin();
    $id = $params['id'];
    try {
        $b = json_body();
        $set = [];
        $args = [];
        if (array_key_exists('number', $b)) {
            $n = content_parse_int($b['number']);
            if ($n === null) fail('Gagal memperbarui ekosistem.', 500); // Prisma: NaN Int → throw → catch
            $set[] = 'number = ?';
            $args[] = $n;
        }
        if (array_key_exists('name', $b)) {
            $set[] = 'name = ?';
            $args[] = content_js_string($b['name']);
        }
        if (array_key_exists('cluster', $b)) {
            $set[] = 'cluster = ?';
            $args[] = content_js_string($b['cluster']);
        }
        if (array_key_exists('scope', $b)) {
            $set[] = 'scope = ?';
            $args[] = content_js_string($b['scope']);
        }
        if (array_key_exists('standard', $b)) {
            $set[] = 'standard = ?';
            $args[] = content_js_string($b['standard']);
        }
        if (array_key_exists('icon', $b)) {
            $set[] = 'icon = ?';
            $args[] = content_js_string($b['icon']);
        }
        if (array_key_exists('color', $b)) {
            $set[] = 'color = ?';
            $args[] = content_js_string($b['color']);
        }
        if (array_key_exists('description', $b)) {
            $set[] = 'description = ?';
            $args[] = content_js_string($b['description']);
        }
        if (array_key_exists('image', $b)) {
            $set[] = 'image = ?';
            $args[] = content_falsy($b['image']) ? null : content_js_string($b['image']);
        }
        $set[] = 'updatedAt = ?';
        $args[] = now_ms();
        $args[] = $id;
        content_update_or_404ish('UPDATE Ecosystem SET ' . implode(', ', $set) . ' WHERE id = ?', $args, 'Gagal memperbarui ekosistem.');
        ok(cast_row('Ecosystem', q_one('SELECT * FROM Ecosystem WHERE id = ?', [$id]) ?? []));
    } catch (Throwable $e) {
        fail('Gagal memperbarui ekosistem.', 500);
    }
});

$router->on('DELETE', 'ecosystems/:id', static function (array $params): void {
    guard_admin();
    $id = $params['id'];
    try {
        if (q_exec('DELETE FROM Ecosystem WHERE id = ?', [$id]) === 0) fail('Gagal menghapus ekosistem.', 500);
        ok(['success' => true]);
    } catch (Throwable $e) {
        fail('Gagal menghapus ekosistem.', 500);
    }
});

/* ================================================================= JOURNEY */
/* Mirror src/app/api/journey/route.ts */

$router->on('GET', 'journey', static function (array $params): void {
    try {
        $rows = cast_rows('JourneyStep', q_all('SELECT * FROM JourneyStep ORDER BY step ASC'));
        $localized = content_localize(
            $rows,
            'JourneyStep',
            want_locale(),
            static fn (array $r): string => (string) $r['step'],
            ['title', 'activity', 'output']
        );
        ok($localized);
    } catch (Throwable $e) {
        fail('Gagal memuat alur perjalanan.', 500);
    }
});

$router->on('POST', 'journey', static function (array $params): void {
    guard_admin();
    try {
        $step = content_parse_int(body('step'));
        if (content_falsy(body('title')) || $step === null) fail('Tahap dan judul wajib diisi.');
        $id = new_id();
        q_exec(
            'INSERT INTO JourneyStep (id, step, title, activity, actor, output, icon) VALUES (?,?,?,?,?,?,?)',
            [
                $id,
                $step,
                content_js_string(body('title')),
                content_str('activity', ''),
                content_str('actor', ''),
                content_str('output', ''),
                content_str('icon', 'circle'),
            ]
        );
        ok(cast_row('JourneyStep', q_one('SELECT * FROM JourneyStep WHERE id = ?', [$id]) ?? []), 201);
    } catch (Throwable $e) {
        fail('Gagal membuat tahap — nomor mungkin sudah dipakai.', 500);
    }
});

/* Mirror src/app/api/journey/[id]/route.ts — hanya PUT & DELETE (tanpa GET) */

$router->on('PUT', 'journey/:id', static function (array $params): void {
    guard_admin();
    $id = $params['id'];
    try {
        $b = json_body();
        $set = [];
        $args = [];
        if (array_key_exists('step', $b)) {
            $n = content_parse_int($b['step']);
            if ($n === null) fail('Gagal memperbarui tahap.', 500);
            $set[] = 'step = ?';
            $args[] = $n;
        }
        if (array_key_exists('title', $b)) {
            $set[] = 'title = ?';
            $args[] = content_js_string($b['title']);
        }
        if (array_key_exists('activity', $b)) {
            $set[] = 'activity = ?';
            $args[] = content_js_string($b['activity']);
        }
        if (array_key_exists('actor', $b)) {
            $set[] = 'actor = ?';
            $args[] = content_js_string($b['actor']);
        }
        if (array_key_exists('output', $b)) {
            $set[] = 'output = ?';
            $args[] = content_js_string($b['output']);
        }
        if (array_key_exists('icon', $b)) {
            $set[] = 'icon = ?';
            $args[] = content_js_string($b['icon']);
        }
        $args[] = $id;
        content_update_or_404ish('UPDATE JourneyStep SET ' . implode(', ', $set) . ' WHERE id = ?', $args, 'Gagal memperbarui tahap.');
        ok(cast_row('JourneyStep', q_one('SELECT * FROM JourneyStep WHERE id = ?', [$id]) ?? []));
    } catch (Throwable $e) {
        fail('Gagal memperbarui tahap.', 500);
    }
});

$router->on('DELETE', 'journey/:id', static function (array $params): void {
    guard_admin();
    $id = $params['id'];
    try {
        if (q_exec('DELETE FROM JourneyStep WHERE id = ?', [$id]) === 0) fail('Gagal menghapus tahap.', 500);
        ok(['success' => true]);
    } catch (Throwable $e) {
        fail('Gagal menghapus tahap.', 500);
    }
});

/* ================================================================= ROADMAP */
/* Mirror src/app/api/roadmap/route.ts */

$router->on('GET', 'roadmap', static function (array $params): void {
    try {
        $rows = cast_rows('Roadmap', q_all('SELECT * FROM Roadmap ORDER BY "order" ASC'));
        ok(apply_translations($rows, 'Roadmap', want_locale())); // keyOf id → apply_translations ekuivalen
    } catch (Throwable $e) {
        fail('Gagal memuat roadmap.', 500);
    }
});

$router->on('POST', 'roadmap', static function (array $params): void {
    guard_admin();
    try {
        $id = new_id();
        q_exec(
            'INSERT INTO Roadmap (id, phase, period, focus, deliverables, "order") VALUES (?,?,?,?,?,?)',
            [
                $id,
                content_str('phase', 'Fase'),
                content_str('period', ''),
                content_str('focus', ''),
                content_str('deliverables', ''),
                content_int_or('order', 99),
            ]
        );
        ok(cast_row('Roadmap', q_one('SELECT * FROM Roadmap WHERE id = ?', [$id]) ?? []), 201);
    } catch (Throwable $e) {
        fail('Gagal membuat fase roadmap.', 500);
    }
});

/* Mirror src/app/api/roadmap/[id]/route.ts — hanya PUT & DELETE */

$router->on('PUT', 'roadmap/:id', static function (array $params): void {
    guard_admin();
    $id = $params['id'];
    try {
        $b = json_body();
        $set = [];
        $args = [];
        if (array_key_exists('phase', $b)) {
            $set[] = 'phase = ?';
            $args[] = content_js_string($b['phase']);
        }
        if (array_key_exists('period', $b)) {
            $set[] = 'period = ?';
            $args[] = content_js_string($b['period']);
        }
        if (array_key_exists('focus', $b)) {
            $set[] = 'focus = ?';
            $args[] = content_js_string($b['focus']);
        }
        if (array_key_exists('deliverables', $b)) {
            $set[] = 'deliverables = ?';
            $args[] = content_js_string($b['deliverables']);
        }
        if (array_key_exists('order', $b)) {
            $set[] = '"order" = ?';
            $args[] = content_int_or('order', 0);
        }
        $args[] = $id;
        content_update_or_404ish('UPDATE Roadmap SET ' . implode(', ', $set) . ' WHERE id = ?', $args, 'Gagal memperbarui fase roadmap.');
        ok(cast_row('Roadmap', q_one('SELECT * FROM Roadmap WHERE id = ?', [$id]) ?? []));
    } catch (Throwable $e) {
        fail('Gagal memperbarui fase roadmap.', 500);
    }
});

$router->on('DELETE', 'roadmap/:id', static function (array $params): void {
    guard_admin();
    $id = $params['id'];
    try {
        if (q_exec('DELETE FROM Roadmap WHERE id = ?', [$id]) === 0) fail('Gagal menghapus fase roadmap.', 500);
        ok(['success' => true]);
    } catch (Throwable $e) {
        fail('Gagal menghapus fase roadmap.', 500);
    }
});

/* ==================================================================== FAQS */
/* Mirror src/app/api/faqs/route.ts */

$router->on('GET', 'faqs', static function (array $params): void {
    try {
        $category = qget('category');
        $rows = cast_rows('Faq', q_all('SELECT * FROM Faq' . ($category !== null ? ' WHERE category = ?' : '') . ' ORDER BY "order" ASC', $category !== null ? [$category] : []));
        ok(apply_translations($rows, 'Faq', want_locale())); // keyOf id
    } catch (Throwable $e) {
        fail('Gagal memuat FAQ.', 500);
    }
});

$router->on('POST', 'faqs', static function (array $params): void {
    guard_admin();
    try {
        if (content_falsy(body('question')) || content_falsy(body('answer'))) fail('Pertanyaan dan jawaban wajib diisi.');
        $now = now_ms();
        $id = new_id();
        q_exec(
            'INSERT INTO Faq (id, question, answer, category, "order", createdAt) VALUES (?,?,?,?,?,?)',
            [
                $id,
                content_js_string(body('question')),
                content_js_string(body('answer')),
                content_str('category', 'Umum'),
                content_int_or('order', 99),
                $now,
            ]
        );
        ok(cast_row('Faq', q_one('SELECT * FROM Faq WHERE id = ?', [$id]) ?? []), 201);
    } catch (Throwable $e) {
        fail('Gagal membuat FAQ.', 500);
    }
});

/* Mirror src/app/api/faqs/[id]/route.ts — hanya PUT & DELETE */

$router->on('PUT', 'faqs/:id', static function (array $params): void {
    guard_admin();
    $id = $params['id'];
    try {
        $b = json_body();
        $set = [];
        $args = [];
        if (array_key_exists('question', $b)) {
            $set[] = 'question = ?';
            $args[] = content_js_string($b['question']);
        }
        if (array_key_exists('answer', $b)) {
            $set[] = 'answer = ?';
            $args[] = content_js_string($b['answer']);
        }
        if (array_key_exists('category', $b)) {
            $set[] = 'category = ?';
            $args[] = content_js_string($b['category']);
        }
        if (array_key_exists('order', $b)) {
            $set[] = '"order" = ?';
            $args[] = content_int_or('order', 0);
        }
        $args[] = $id;
        content_update_or_404ish('UPDATE Faq SET ' . implode(', ', $set) . ' WHERE id = ?', $args, 'Gagal memperbarui FAQ.');
        ok(cast_row('Faq', q_one('SELECT * FROM Faq WHERE id = ?', [$id]) ?? []));
    } catch (Throwable $e) {
        fail('Gagal memperbarui FAQ.', 500);
    }
});

$router->on('DELETE', 'faqs/:id', static function (array $params): void {
    guard_admin();
    $id = $params['id'];
    try {
        if (q_exec('DELETE FROM Faq WHERE id = ?', [$id]) === 0) fail('Gagal menghapus FAQ.', 500);
        ok(['success' => true]);
    } catch (Throwable $e) {
        fail('Gagal menghapus FAQ.', 500);
    }
});

/* ============================================================ TESTIMONIALS */
/* Mirror src/app/api/testimonials/route.ts */

$router->on('GET', 'testimonials', static function (array $params): void {
    try {
        $all = qget('all') === '1';
        $rows = cast_rows('Testimonial', q_all('SELECT * FROM Testimonial' . ($all ? '' : ' WHERE published = 1') . ' ORDER BY createdAt DESC'));
        ok(apply_translations($rows, 'Testimonial', want_locale())); // keyOf id
    } catch (Throwable $e) {
        fail('Gagal memuat testimoni.', 500);
    }
});

$router->on('POST', 'testimonials', static function (array $params): void {
    // PUBLIK tanpa guard — testimoni masuk sebagai unpublished utk moderasi admin
    try {
        if (content_falsy(body('name')) || content_falsy(body('content'))) fail('Nama dan isi testimoni wajib diisi.');
        $id = new_id();
        q_exec(
            'INSERT INTO Testimonial (id, name, role, content, rating, published, createdAt) VALUES (?,?,?,?,?,?,?)',
            [
                $id,
                content_js_string(body('name')),
                content_str('role', 'Jamaah'),
                content_js_string(body('content')),
                content_int_or('rating', 5),
                0, // published: false (moderasi)
                now_ms(),
            ]
        );
        ok(cast_row('Testimonial', q_one('SELECT * FROM Testimonial WHERE id = ?', [$id]) ?? []), 201);
    } catch (Throwable $e) {
        fail('Gagal mengirim testimoni.', 500);
    }
});

/* Mirror src/app/api/testimonials/[id]/route.ts — hanya PUT & DELETE */

$router->on('PUT', 'testimonials/:id', static function (array $params): void {
    guard_admin();
    $id = $params['id'];
    try {
        $b = json_body();
        $set = [];
        $args = [];
        if (array_key_exists('name', $b)) {
            $set[] = 'name = ?';
            $args[] = content_js_string($b['name']);
        }
        if (array_key_exists('role', $b)) {
            $set[] = 'role = ?';
            $args[] = content_js_string($b['role']);
        }
        if (array_key_exists('content', $b)) {
            $set[] = 'content = ?';
            $args[] = content_js_string($b['content']);
        }
        if (array_key_exists('rating', $b)) {
            $set[] = 'rating = ?';
            $args[] = content_int_or('rating', 5);
        }
        if (array_key_exists('published', $b)) {
            $set[] = 'published = ?';
            $args[] = bool_int('published', 1);
        }
        $args[] = $id;
        content_update_or_404ish('UPDATE Testimonial SET ' . implode(', ', $set) . ' WHERE id = ?', $args, 'Gagal memperbarui testimoni.');
        ok(cast_row('Testimonial', q_one('SELECT * FROM Testimonial WHERE id = ?', [$id]) ?? []));
    } catch (Throwable $e) {
        fail('Gagal memperbarui testimoni.', 500);
    }
});

$router->on('DELETE', 'testimonials/:id', static function (array $params): void {
    guard_admin();
    $id = $params['id'];
    try {
        if (q_exec('DELETE FROM Testimonial WHERE id = ?', [$id]) === 0) fail('Gagal menghapus testimoni.', 500);
        ok(['success' => true]);
    } catch (Throwable $e) {
        fail('Gagal menghapus testimoni.', 500);
    }
});

/* ============================================================== MANAGEMENT */
/* Mirror src/app/api/management/route.ts */

$router->on('GET', 'management', static function (array $params): void {
    try {
        $rows = cast_rows('Management', q_all('SELECT * FROM Management ORDER BY "order" ASC'));
        ok(apply_translations($rows, 'Management', want_locale())); // keyOf id
    } catch (Throwable $e) {
        fail('Gagal memuat struktur organisasi.', 500);
    }
});

$router->on('POST', 'management', static function (array $params): void {
    guard_admin();
    try {
        if (content_falsy(body('name')) || content_falsy(body('position'))) fail('Nama dan jabatan wajib diisi.');
        $id = new_id();
        q_exec(
            'INSERT INTO Management (id, name, position, bio, "order") VALUES (?,?,?,?,?)',
            [
                $id,
                content_js_string(body('name')),
                content_js_string(body('position')),
                content_falsy(body('bio')) ? null : content_js_string(body('bio')),
                content_int_or('order', 99),
            ]
        );
        ok(cast_row('Management', q_one('SELECT * FROM Management WHERE id = ?', [$id]) ?? []), 201);
    } catch (Throwable $e) {
        fail('Gagal menambah pengurus.', 500);
    }
});

/* Mirror src/app/api/management/[id]/route.ts — hanya PUT & DELETE */

$router->on('PUT', 'management/:id', static function (array $params): void {
    guard_admin();
    $id = $params['id'];
    try {
        $b = json_body();
        $set = [];
        $args = [];
        if (array_key_exists('name', $b)) {
            $set[] = 'name = ?';
            $args[] = content_js_string($b['name']);
        }
        if (array_key_exists('position', $b)) {
            $set[] = 'position = ?';
            $args[] = content_js_string($b['position']);
        }
        if (array_key_exists('bio', $b)) {
            $set[] = 'bio = ?';
            $args[] = content_falsy($b['bio']) ? null : content_js_string($b['bio']);
        }
        if (array_key_exists('order', $b)) {
            $set[] = '"order" = ?';
            $args[] = content_int_or('order', 0);
        }
        $args[] = $id;
        content_update_or_404ish('UPDATE Management SET ' . implode(', ', $set) . ' WHERE id = ?', $args, 'Gagal memperbarui pengurus.');
        ok(cast_row('Management', q_one('SELECT * FROM Management WHERE id = ?', [$id]) ?? []));
    } catch (Throwable $e) {
        fail('Gagal memperbarui pengurus.', 500);
    }
});

$router->on('DELETE', 'management/:id', static function (array $params): void {
    guard_admin();
    $id = $params['id'];
    try {
        if (q_exec('DELETE FROM Management WHERE id = ?', [$id]) === 0) fail('Gagal menghapus pengurus.', 500);
        ok(['success' => true]);
    } catch (Throwable $e) {
        fail('Gagal menghapus pengurus.', 500);
    }
});

/* ================================================================ BRANCHES */
/* Mirror src/app/api/branches/route.ts (Task 19 — jaringan daerah + audit) */

$router->on('GET', 'branches', static function (array $params): void {
    try {
        $all = qget('all') === '1';
        if ($all) {
            $user = current_user(); // paritas requireAdmin — null → jatuh ke jalur publik
            if ($user !== null) {
                ok(cast_rows('RegionalBranch', q_all('SELECT * FROM RegionalBranch ORDER BY "order" ASC, createdAt ASC')));
            }
        }
        $rows = cast_rows('RegionalBranch', q_all('SELECT * FROM RegionalBranch WHERE published = 1 ORDER BY "order" ASC, createdAt ASC'));
        $localized = content_localize(
            $rows,
            'RegionalBranch',
            want_locale(),
            static fn (array $r): string => (string) $r['id'],
            ['name', 'officeName', 'address', 'description']
        );
        ok($localized);
    } catch (Throwable $e) {
        fail('Gagal memuat jaringan daerah.', 500);
    }
});

$router->on('POST', 'branches', static function (array $params): void {
    $user = guard_role(['SUPER_ADMIN', 'ADMIN', 'EDITOR']);
    try {
        $name = trim(content_str('name', ''));
        if ($name === '') fail('Nama kepengurusan daerah wajib diisi.');
        $published = array_key_exists('published', json_body()) ? bool_int('published', 1) : 1;
        $now = now_ms();
        $id = new_id();
        q_exec(
            'INSERT INTO RegionalBranch (id, name, code, province, city, officeName, address, picName, picPhone, email, description, published, "order", createdAt, updatedAt) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)',
            [
                $id,
                $name,
                trim(content_str('code', '')),
                trim(content_str('province', '')),
                trim(content_str('city', '')),
                trim(content_str('officeName', '')),
                trim(content_str('address', '')),
                trim(content_str('picName', '')),
                trim(content_str('picPhone', '')),
                content_falsy(body('email')) ? null : trim(content_js_string(body('email'))),
                content_falsy(body('description')) ? null : content_js_string(body('description')),
                $published,
                content_int_or('order', 99),
                $now,
                $now,
            ]
        );
        log_audit($user, 'CREATE', 'RegionalBranch', $id, $name);
        ok(cast_row('RegionalBranch', q_one('SELECT * FROM RegionalBranch WHERE id = ?', [$id]) ?? []), 201);
    } catch (Throwable $e) {
        fail('Gagal menambah jaringan daerah.', 500);
    }
});

/* Mirror src/app/api/branches/[id]/route.ts — hanya PUT & DELETE (+ audit) */

$router->on('PUT', 'branches/:id', static function (array $params): void {
    $user = guard_role(['SUPER_ADMIN', 'ADMIN', 'EDITOR']);
    $id = $params['id'];
    try {
        $b = json_body();
        $set = [];
        $args = [];
        if (array_key_exists('name', $b)) {
            $set[] = 'name = ?';
            $args[] = trim(content_js_string($b['name']));
        }
        if (array_key_exists('code', $b)) {
            $set[] = 'code = ?';
            $args[] = trim(content_js_string($b['code']));
        }
        if (array_key_exists('province', $b)) {
            $set[] = 'province = ?';
            $args[] = trim(content_js_string($b['province']));
        }
        if (array_key_exists('city', $b)) {
            $set[] = 'city = ?';
            $args[] = trim(content_js_string($b['city']));
        }
        if (array_key_exists('officeName', $b)) {
            $set[] = 'officeName = ?';
            $args[] = trim(content_js_string($b['officeName']));
        }
        if (array_key_exists('address', $b)) {
            $set[] = 'address = ?';
            $args[] = trim(content_js_string($b['address']));
        }
        if (array_key_exists('picName', $b)) {
            $set[] = 'picName = ?';
            $args[] = trim(content_js_string($b['picName']));
        }
        if (array_key_exists('picPhone', $b)) {
            $set[] = 'picPhone = ?';
            $args[] = trim(content_js_string($b['picPhone']));
        }
        if (array_key_exists('email', $b)) {
            $set[] = 'email = ?';
            $args[] = content_falsy($b['email']) ? null : trim(content_js_string($b['email']));
        }
        if (array_key_exists('description', $b)) {
            $set[] = 'description = ?';
            $args[] = content_falsy($b['description']) ? null : content_js_string($b['description']);
        }
        if (array_key_exists('order', $b)) {
            $set[] = '"order" = ?';
            $args[] = content_int_or('order', 0);
        }
        if (array_key_exists('published', $b)) {
            $set[] = 'published = ?';
            $args[] = bool_int('published', 1);
        }
        $set[] = 'updatedAt = ?';
        $args[] = now_ms();
        $args[] = $id;
        content_update_or_404ish('UPDATE RegionalBranch SET ' . implode(', ', $set) . ' WHERE id = ?', $args, 'Gagal memperbarui jaringan daerah.');
        $item = q_one('SELECT * FROM RegionalBranch WHERE id = ?', [$id]) ?? [];
        log_audit($user, 'UPDATE', 'RegionalBranch', $id, (string) ($item['name'] ?? ''));
        ok(cast_row('RegionalBranch', $item));
    } catch (Throwable $e) {
        fail('Gagal memperbarui jaringan daerah.', 500);
    }
});

$router->on('DELETE', 'branches/:id', static function (array $params): void {
    $user = guard_role(['SUPER_ADMIN', 'ADMIN', 'EDITOR']);
    $id = $params['id'];
    try {
        $item = q_one('SELECT * FROM RegionalBranch WHERE id = ?', [$id]);
        if ($item === null) fail('Gagal menghapus jaringan daerah.', 500); // Prisma P2025 → catch
        q_exec('DELETE FROM RegionalBranch WHERE id = ?', [$id]);
        log_audit($user, 'DELETE', 'RegionalBranch', $id, (string) $item['name']);
        ok(['success' => true]);
    } catch (Throwable $e) {
        fail('Gagal menghapus jaringan daerah.', 500);
    }
});

/* ================================================================= GALLERY */
/* Mirror src/app/api/gallery/route.ts (Task 18 — galeri kegiatan) */

$router->on('GET', 'gallery', static function (array $params): void {
    try {
        $all = qget('all') === '1';
        if ($all) {
            $user = current_user();
            if ($user !== null) {
                ok(cast_rows('Gallery', q_all('SELECT * FROM Gallery ORDER BY "order" ASC, createdAt ASC')));
            }
        }
        ok(cast_rows('Gallery', q_all('SELECT * FROM Gallery WHERE published = 1 ORDER BY "order" ASC, createdAt ASC')));
    } catch (Throwable $e) {
        fail('Gagal memuat galeri.', 500);
    }
});

$router->on('POST', 'gallery', static function (array $params): void {
    $user = guard_role(['SUPER_ADMIN', 'ADMIN', 'EDITOR']);
    try {
        $title = trim(content_str('title', ''));
        $imageUrl = trim(content_str('imageUrl', ''));
        if ($title === '' || $imageUrl === '') fail('Judul dan URL gambar wajib diisi.');
        $published = array_key_exists('published', json_body()) ? bool_int('published', 1) : 1;
        $now = now_ms();
        $id = new_id();
        q_exec(
            'INSERT INTO Gallery (id, title, caption, category, imageUrl, "order", published, createdAt, updatedAt) VALUES (?,?,?,?,?,?,?,?,?)',
            [
                $id,
                $title,
                content_falsy(body('caption')) ? null : content_js_string(body('caption')),
                content_str('category', 'Kegiatan'),
                $imageUrl,
                content_int_or('order', 0),
                $published,
                $now,
                $now,
            ]
        );
        ok(cast_row('Gallery', q_one('SELECT * FROM Gallery WHERE id = ?', [$id]) ?? []), 201);
    } catch (Throwable $e) {
        fail('Gagal menambah galeri.', 500);
    }
});

/* Mirror src/app/api/gallery/[id]/route.ts — hanya PUT & DELETE */

$router->on('PUT', 'gallery/:id', static function (array $params): void {
    $user = guard_role(['SUPER_ADMIN', 'ADMIN', 'EDITOR']);
    $id = $params['id'];
    try {
        $b = json_body();
        $set = [];
        $args = [];
        if (array_key_exists('title', $b)) {
            $title = trim(content_js_string($b['title']));
            if ($title === '') fail('Judul wajib diisi.');
            $set[] = 'title = ?';
            $args[] = $title;
        }
        if (array_key_exists('imageUrl', $b)) {
            $imageUrl = trim(content_js_string($b['imageUrl']));
            if ($imageUrl === '') fail('URL gambar wajib diisi.');
            $set[] = 'imageUrl = ?';
            $args[] = $imageUrl;
        }
        if (array_key_exists('caption', $b)) {
            $set[] = 'caption = ?';
            $args[] = content_falsy($b['caption']) ? null : content_js_string($b['caption']);
        }
        if (array_key_exists('category', $b)) {
            $set[] = 'category = ?';
            $args[] = content_js_string($b['category']);
        }
        if (array_key_exists('order', $b)) {
            $set[] = '"order" = ?';
            $args[] = content_int_or('order', 0);
        }
        if (array_key_exists('published', $b)) {
            $set[] = 'published = ?';
            $args[] = bool_int('published', 1);
        }
        $set[] = 'updatedAt = ?';
        $args[] = now_ms();
        $args[] = $id;
        content_update_or_404ish('UPDATE Gallery SET ' . implode(', ', $set) . ' WHERE id = ?', $args, 'Gagal memperbarui galeri.');
        ok(cast_row('Gallery', q_one('SELECT * FROM Gallery WHERE id = ?', [$id]) ?? []));
    } catch (Throwable $e) {
        fail('Gagal memperbarui galeri.', 500);
    }
});

$router->on('DELETE', 'gallery/:id', static function (array $params): void {
    $user = guard_role(['SUPER_ADMIN', 'ADMIN', 'EDITOR']);
    $id = $params['id'];
    try {
        if (q_exec('DELETE FROM Gallery WHERE id = ?', [$id]) === 0) fail('Gagal menghapus galeri.', 500);
        ok(['success' => true]);
    } catch (Throwable $e) {
        fail('Gagal menghapus galeri.', 500);
    }
});

/* ================================================================== EVENTS */
/* Mirror src/app/api/events/route.ts (Task 18 — agenda kegiatan) */

$router->on('GET', 'events', static function (array $params): void {
    try {
        $all = qget('all') === '1';
        if ($all) {
            $user = current_user();
            if ($user !== null) {
                ok(cast_rows('Event', q_all('SELECT * FROM Event ORDER BY startsAt ASC')));
            }
        }
        ok(cast_rows('Event', q_all('SELECT * FROM Event WHERE published = 1 ORDER BY startsAt ASC')));
    } catch (Throwable $e) {
        fail('Gagal memuat agenda.', 500);
    }
});

$router->on('POST', 'events', static function (array $params): void {
    $user = guard_role(['SUPER_ADMIN', 'ADMIN', 'EDITOR']);
    try {
        $title = trim(content_str('title', ''));
        if ($title === '') fail('Judul agenda wajib diisi.');
        $startsAt = content_falsy(body('startsAt')) ? null : date_to_ms(content_js_string(body('startsAt')));
        if ($startsAt === null) fail('Tanggal & jam mulai (startsAt) wajib dan harus valid.');
        $endsAt = null;
        if (!content_falsy(body('endsAt'))) {
            $endsAt = date_to_ms(content_js_string(body('endsAt')));
            if ($endsAt === null) fail('Tanggal selesai (endsAt) tidak valid.');
        }
        $published = array_key_exists('published', json_body()) ? bool_int('published', 1) : 1;
        $now = now_ms();
        $id = new_id();
        q_exec(
            'INSERT INTO Event (id, title, description, location, startsAt, endsAt, category, published, createdAt, updatedAt) VALUES (?,?,?,?,?,?,?,?,?,?)',
            [
                $id,
                $title,
                trim(content_str('description', '')),
                trim(content_str('location', '')),
                $startsAt,
                $endsAt,
                content_str('category', 'Kegiatan'),
                $published,
                $now,
                $now,
            ]
        );
        ok(cast_row('Event', q_one('SELECT * FROM Event WHERE id = ?', [$id]) ?? []), 201);
    } catch (Throwable $e) {
        fail('Gagal menambah agenda.', 500);
    }
});

/* Mirror src/app/api/events/[id]/route.ts — hanya PUT & DELETE */

$router->on('PUT', 'events/:id', static function (array $params): void {
    $user = guard_role(['SUPER_ADMIN', 'ADMIN', 'EDITOR']);
    $id = $params['id'];
    try {
        $b = json_body();
        $set = [];
        $args = [];
        if (array_key_exists('title', $b)) {
            $title = trim(content_js_string($b['title']));
            if ($title === '') fail('Judul agenda wajib diisi.');
            $set[] = 'title = ?';
            $args[] = $title;
        }
        if (array_key_exists('description', $b)) {
            $set[] = 'description = ?';
            $args[] = content_js_string($b['description']);
        }
        if (array_key_exists('location', $b)) {
            $set[] = 'location = ?';
            $args[] = content_js_string($b['location']);
        }
        if (array_key_exists('startsAt', $b)) {
            $startsAt = date_to_ms(content_js_string($b['startsAt']));
            if ($startsAt === null) fail('Tanggal & jam mulai (startsAt) tidak valid.');
            $set[] = 'startsAt = ?';
            $args[] = $startsAt;
        }
        if (array_key_exists('endsAt', $b)) {
            if (content_falsy($b['endsAt'])) {
                $set[] = 'endsAt = ?';
                $args[] = null;
            } else {
                $endsAt = date_to_ms(content_js_string($b['endsAt']));
                if ($endsAt === null) fail('Tanggal selesai (endsAt) tidak valid.');
                $set[] = 'endsAt = ?';
                $args[] = $endsAt;
            }
        }
        if (array_key_exists('category', $b)) {
            $set[] = 'category = ?';
            $args[] = content_js_string($b['category']);
        }
        if (array_key_exists('published', $b)) {
            $set[] = 'published = ?';
            $args[] = bool_int('published', 1);
        }
        $set[] = 'updatedAt = ?';
        $args[] = now_ms();
        $args[] = $id;
        content_update_or_404ish('UPDATE Event SET ' . implode(', ', $set) . ' WHERE id = ?', $args, 'Gagal memperbarui agenda.');
        ok(cast_row('Event', q_one('SELECT * FROM Event WHERE id = ?', [$id]) ?? []));
    } catch (Throwable $e) {
        fail('Gagal memperbarui agenda.', 500);
    }
});

$router->on('DELETE', 'events/:id', static function (array $params): void {
    $user = guard_role(['SUPER_ADMIN', 'ADMIN', 'EDITOR']);
    $id = $params['id'];
    try {
        if (q_exec('DELETE FROM Event WHERE id = ?', [$id]) === 0) fail('Gagal menghapus agenda.', 500);
        ok(['success' => true]);
    } catch (Throwable $e) {
        fail('Gagal menghapus agenda.', 500);
    }
});

/* =============================================================== RESOURCES */
/* Mirror src/app/api/resources/route.ts (Task 18 — pusat unduhan) */

$router->on('GET', 'resources', static function (array $params): void {
    try {
        $all = qget('all') === '1';
        if ($all) {
            $user = current_user();
            if ($user !== null) {
                ok(cast_rows('Resource', q_all('SELECT * FROM Resource ORDER BY createdAt DESC')));
            }
        }
        ok(cast_rows('Resource', q_all('SELECT * FROM Resource WHERE published = 1 ORDER BY category ASC, createdAt DESC')));
    } catch (Throwable $e) {
        fail('Gagal memuat dokumen.', 500);
    }
});

$router->on('POST', 'resources', static function (array $params): void {
    $user = guard_role(['SUPER_ADMIN', 'ADMIN', 'EDITOR']);
    try {
        $title = trim(content_str('title', ''));
        $fileUrl = trim(content_str('fileUrl', ''));
        if ($title === '' || $fileUrl === '') fail('Judul dan URL berkas wajib diisi.');
        $published = array_key_exists('published', json_body()) ? bool_int('published', 1) : 1;
        $now = now_ms();
        $id = new_id();
        q_exec(
            'INSERT INTO Resource (id, title, description, category, fileUrl, fileType, published, downloads, createdAt, updatedAt) VALUES (?,?,?,?,?,?,?,?,?,?)',
            [
                $id,
                $title,
                content_falsy(body('description')) ? null : content_js_string(body('description')),
                content_str('category', 'Formulir'),
                $fileUrl,
                content_str('fileType', 'PDF'),
                $published,
                0,
                $now,
                $now,
            ]
        );
        ok(cast_row('Resource', q_one('SELECT * FROM Resource WHERE id = ?', [$id]) ?? []), 201);
    } catch (Throwable $e) {
        fail('Gagal menambah dokumen.', 500);
    }
});

/* Mirror src/app/api/resources/[id]/route.ts — hanya PUT & DELETE */

$router->on('PUT', 'resources/:id', static function (array $params): void {
    $user = guard_role(['SUPER_ADMIN', 'ADMIN', 'EDITOR']);
    $id = $params['id'];
    try {
        $b = json_body();
        $set = [];
        $args = [];
        if (array_key_exists('title', $b)) {
            $title = trim(content_js_string($b['title']));
            if ($title === '') fail('Judul wajib diisi.');
            $set[] = 'title = ?';
            $args[] = $title;
        }
        if (array_key_exists('fileUrl', $b)) {
            $fileUrl = trim(content_js_string($b['fileUrl']));
            if ($fileUrl === '') fail('URL berkas wajib diisi.');
            $set[] = 'fileUrl = ?';
            $args[] = $fileUrl;
        }
        if (array_key_exists('description', $b)) {
            $set[] = 'description = ?';
            $args[] = content_falsy($b['description']) ? null : content_js_string($b['description']);
        }
        if (array_key_exists('category', $b)) {
            $set[] = 'category = ?';
            $args[] = content_js_string($b['category']);
        }
        if (array_key_exists('fileType', $b)) {
            $set[] = 'fileType = ?';
            $args[] = content_js_string($b['fileType']);
        }
        if (array_key_exists('published', $b)) {
            $set[] = 'published = ?';
            $args[] = bool_int('published', 1);
        }
        $set[] = 'updatedAt = ?';
        $args[] = now_ms();
        $args[] = $id;
        content_update_or_404ish('UPDATE Resource SET ' . implode(', ', $set) . ' WHERE id = ?', $args, 'Gagal memperbarui dokumen.');
        ok(cast_row('Resource', q_one('SELECT * FROM Resource WHERE id = ?', [$id]) ?? []));
    } catch (Throwable $e) {
        fail('Gagal memperbarui dokumen.', 500);
    }
});

$router->on('DELETE', 'resources/:id', static function (array $params): void {
    $user = guard_role(['SUPER_ADMIN', 'ADMIN', 'EDITOR']);
    $id = $params['id'];
    try {
        if (q_exec('DELETE FROM Resource WHERE id = ?', [$id]) === 0) fail('Gagal menghapus dokumen.', 500);
        ok(['success' => true]);
    } catch (Throwable $e) {
        fail('Gagal menghapus dokumen.', 500);
    }
});

/* Mirror src/app/api/resources/[id]/download/route.ts — pencatat unduhan publik */

$router->on('POST', 'resources/:id/download', static function (array $params): void {
    $id = $params['id'];
    try {
        $resource = q_one('SELECT fileUrl FROM Resource WHERE id = ?', [$id]);
        if ($resource === null) fail('Dokumen tidak ditemukan.', 404);
        q_exec('UPDATE Resource SET downloads = downloads + 1 WHERE id = ?', [$id]);
        ok(['ok' => true, 'fileUrl' => $resource['fileUrl']]);
    } catch (Throwable $e) {
        fail('Gagal memproses unduhan.', 500);
    }
});

/* ================================================================ SETTINGS */
/* Mirror src/app/api/settings/route.ts — GET publik + PUT SUPER_ADMIN/ADMIN */

$router->on('GET', 'settings', static function (array $params): void {
    try {
        $rows = q_all('SELECT "key", value FROM SiteSetting');
        $localized = content_localize(
            $rows,
            'SiteSetting',
            want_locale(),
            static fn (array $r): string => (string) $r['key'],
            ['value'],
            CONTENT_SETTING_TRANSLATABLE // allowlist — mirror persis Node
        );
        $map = [];
        foreach ($localized as $s) {
            $map[(string) $s['key']] = $s['value'];
        }
        ok($map);
    } catch (Throwable $e) {
        fail('Gagal memuat pengaturan.', 500);
    }
});

$router->on('PUT', 'settings', static function (array $params): void {
    $user = guard_role(['SUPER_ADMIN', 'ADMIN']);
    try {
        $b = json_body();
        foreach ($b as $key => $value) {
            $val = $value === null ? '' : content_js_string($value); // paritas String(value ?? "")
            $key = (string) $key;
            $exists = q_one('SELECT id FROM SiteSetting WHERE "key" = ?', [$key]);
            if ($exists === null) {
                q_exec('INSERT INTO SiteSetting (id, "key", value) VALUES (?,?,?)', [new_id(), $key, $val]);
            } else {
                q_exec('UPDATE SiteSetting SET value = ? WHERE "key" = ?', [$val, $key]);
            }
        }
        // Task 18 — jejak audit perubahan pengaturan (hanya nama kunci, tanpa isi)
        $detail = mb_substr(implode(', ', array_map('strval', array_slice(array_keys($b), 0, 10))), 0, 180);
        log_audit($user, 'UPDATE', 'Settings', null, $detail);
        $map = [];
        foreach (q_all('SELECT "key", value FROM SiteSetting') as $s) {
            $map[(string) $s['key']] = $s['value'];
        }
        ok($map);
    } catch (Throwable $e) {
        fail('Gagal menyimpan pengaturan.', 500);
    }
});

/* ============================================================ TRANSLATIONS */
/* Mirror src/app/api/translations/route.ts — status & job terjemahan konten */

$router->on('GET', 'translations', static function (array $params): void {
    guard_admin();
    try {
        $entities = [];
        foreach (CONTENT_I18N_ENTITIES as $name => $spec) {
            // total = jumlah nilai field non-kosong (paritas translationStatus Node)
            $sums = [];
            foreach ($spec['fields'] as $f) {
                $sums[] = "SUM(CASE WHEN \"$f\" IS NOT NULL AND TRIM(\"$f\") <> '' THEN 1 ELSE 0 END)";
            }
            $sql = 'SELECT COALESCE(' . implode(' + ', $sums) . ', 0) AS total FROM "' . $spec['table'] . '"';
            $args = [];
            if ($name === 'SiteSetting') {
                $in = implode(',', array_fill(0, count(CONTENT_SETTING_TRANSLATABLE), '?'));
                $sql .= ' WHERE "key" IN (' . $in . ')';
                $args = CONTENT_SETTING_TRANSLATABLE;
            }
            $row = q_one($sql, $args);
            $counts = ['en' => 0, 'ar' => 0];
            foreach (q_all('SELECT locale, COUNT(*) AS c FROM ContentTranslation WHERE entity = ? GROUP BY locale', [$name]) as $r) {
                $counts[$r['locale']] = (int) $r['c'];
            }
            $entities[] = ['entity' => $name, 'total' => (int) ($row['total'] ?? 0), 'translated' => $counts];
        }
        ok([
            'entities'    => $entities,
            'locales'     => ['en', 'ar'],
            'job'         => content_job_state(),
            'entityNames' => array_keys(CONTENT_I18N_ENTITIES),
        ]);
    } catch (Throwable $e) {
        fail('Gagal membaca status terjemahan.', 500);
    }
});

$router->on('POST', 'translations', static function (array $params): void {
    guard_admin();
    try {
        $b = json_body();
        $locale = $b['locale'] ?? null;
        if ($locale !== 'en' && $locale !== 'ar') fail("Locale harus 'en' atau 'ar'.");

        $current = content_job_state();
        if ($current['running']) {
            ok(['started' => false, 'job' => $current, 'message' => 'Job lain sedang berjalan.']);
        }

        $entities = $b['entities'] ?? null;
        if (is_array($entities)) {
            $names = array_keys(CONTENT_I18N_ENTITIES);
            $entities = array_values(array_filter($entities, static fn ($e): bool => is_string($e) && in_array($e, $names, true)));
            if ($entities === []) $entities = null;
        }
        $list = ($entities !== null && $entities !== []) ? $entities : array_keys(CONTENT_I18N_ENTITIES);

        // Edisi PHP tanpa mesin AI: job bulk ditandai selesai seketika tanpa
        // mengubah DB — terjemahan tetap tersedia dari cache ContentTranslation.
        $now = now_ms();
        $job = array_merge(content_job_state(), [
            'locale'     => $locale,
            'entityTotal'=> count($list),
            'startedAt'  => iso_date($now),
            'finishedAt' => iso_date($now),
        ]);
        ok(['started' => true, 'job' => $job]);
    } catch (Throwable $e) {
        fail('Gagal memulai terjemahan.', 500);
    }
});
