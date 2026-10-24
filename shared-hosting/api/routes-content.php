<?php
/**
 * ============================================================================
 * routes-content.php — Modul rute KONTEN (Edisi Shared Hosting)
 * ----------------------------------------------------------------------------
 * Rekonstruksi Task 30-b-2 (2026-09-21) — paritas kontrak 1:1 dengan backend
 * Node (src/app/api/**) untuk 12 entitas konten:
 *
 *   articles    GET list (filter status/category/featured/q/limit) · GET by id
 *               · GET by slug (+increment views) · POST · PUT · DELETE
 *   tutorials   GET list (all/category/q) · GET by id · GET by slug (+views)
 *               · POST · PUT · DELETE
 *   faqs        GET list (category) · POST · PUT · DELETE
 *   testimonials GET list (all) · POST (PUBLIK, moderation) · PUT · DELETE
 *   ecosystems  GET list (cluster) · POST · PUT · DELETE
 *   journey     GET list · POST · PUT · DELETE
 *   roadmap     GET list · POST · PUT · DELETE
 *   gallery     GET list (all utk admin) · POST · PUT · DELETE
 *   events      GET list (all utk admin) · POST · PUT · DELETE (epoch-ms)
 *   resources   GET list (all utk admin) · POST · PUT · DELETE
 *               · POST [id]/download (increment counter → kirim fileUrl)
 *   management  GET list · POST · PUT · DELETE
 *   branches    GET list (all utk admin, tanpa terjemahan) · POST · PUT ·
 *               DELETE (+ jejak audit persis Node)
 *
 * Terjemahan konten (ContentTranslation) diterapkan PERSIS route Node yang
 * memanggil applyEntityTranslations — locale dari ?locale=en|ar, entity name,
 * keyOf, dan fields disalin dari masing-masing route (fallback registry
 * $ENTITY_FIELDS di lib.php identik).
 *
 * Kontrak modul: routes_content(string $method, array $seg): bool —
 * FALSE bila bukan domain modul ini (tanpa output); TRUE bila ditangani
 * (respons sudah terkirim via ok()/fail()).
 *
 * DateTime = INTEGER epoch-ms (Prisma 6) di DB; output dinormalkan ke
 * ISO-8601 via cast_row()/cast_rows(). Audit CREATE/UPDATE/DELETE via
 * log_audit(). PHP 7.4+ kompatibel (tanpa match/nullsafe/named args).
 * ============================================================================
 */

/* ===========================================================================
 * HELPER PRIVAT — semantik JS (String/Boolean/parseInt/falsy/Date) agar
 * perilaku input identik dengan route Node.
 * ========================================================================= */

if (!function_exists('_rcon_falsy')) {
    /** Paritas `!x` / `x || y` JavaScript (0, "", null, undefined, false, NaN). */
    function _rcon_falsy($v) {
        if ($v === null || $v === false) return true;
        if (is_int($v) || is_float($v)) return (float) $v === 0.0;
        if (is_string($v)) return $v === '';
        if (is_array($v)) return count($v) === 0;
        return false;
    }
}

if (!function_exists('_rcon_truthy')) {
    function _rcon_truthy($v) { return !_rcon_falsy($v); }
}

if (!function_exists('_rcon_str')) {
    /** Paritas String(v) JavaScript. */
    function _rcon_str($v) {
        if ($v === null) return 'null';
        if (is_bool($v)) return $v ? 'true' : 'false';
        if (is_array($v)) return implode(',', array_map('_rcon_str', $v));
        return (string) $v;
    }
}

if (!function_exists('_rcon_str_or')) {
    /** Paritas String(body.x || "") → falsy JS → fallback string kosong. */
    function _rcon_str_or($v) {
        return _rcon_falsy($v) ? '' : _rcon_str($v);
    }
}

if (!function_exists('_rcon_bool')) {
    /** Paritas Boolean(v) JavaScript (string "0"/"false" apa pun isinya → true). */
    function _rcon_bool($v) {
        if ($v === null || $v === false) return false;
        if ($v === true) return true;
        if (is_int($v) || is_float($v)) return (float) $v !== 0.0;
        if (is_string($v)) return $v !== '';
        return true;
    }
}

if (!function_exists('_rcon_int')) {
    /**
     * Paritas parseInt(v, 10) JavaScript — integer atau NULL (= NaN).
     * parseInt(true/false/null) → NaN; "12abc" → 12; "  7" → 7; "" → NaN.
     */
    function _rcon_int($v) {
        if ($v === null || is_bool($v) || is_array($v)) return null;
        $s = trim((string) $v);
        if (!preg_match('/^[-+]?\d+/', $s, $m)) return null;
        return (int) $m[0];
    }
}

if (!function_exists('_rcon_int_or')) {
    /** Paritas parseInt(v, 10) || fallback (NaN maupun 0 → fallback). */
    function _rcon_int_or($v, $fallback) {
        $n = _rcon_int($v);
        return ($n === null || $n === 0) ? $fallback : $n;
    }
}

if (!function_exists('_rcon_date_ms')) {
    /**
     * Paritas new Date(String(v)).getTime() → epoch-ms integer, atau NULL
     * bila Invalid Date. String tanggal-saja (YYYY-MM-DD) dihitung UTC
     * midnight (identik JS); server dipaksa UTC oleh config.php.
     */
    function _rcon_date_ms($v) {
        if ($v === null || is_array($v)) return null;
        if (is_int($v)) return $v;             // epoch ms langsung (JSON angka)
        if (is_float($v)) return (int) round($v);
        $s = trim((string) $v);
        if ($s === '') return null;
        if (preg_match('/^(\d{4})-(\d{2})-(\d{2})$/', $s, $m)) {
            $t = gmmktime(0, 0, 0, (int) $m[2], (int) $m[3], (int) $m[1]);
            return $t === false ? null : $t * 1000;
        }
        $t = strtotime($s); // TZ server = UTC (config.php)
        return $t === false ? null : $t * 1000;
    }
}

if (!function_exists('_rcon_body')) {
    /** Body JSON sebagai array (paritas `await req.json()`). */
    function _rcon_body() {
        $b = request_json();
        return is_array($b) ? $b : array();
    }
}

if (!function_exists('_rcon_has')) {
    /** Paritas `body.x !== undefined`. */
    function _rcon_has($body, $key) {
        return is_array($body) && array_key_exists($key, $body);
    }
}

if (!function_exists('_rcon_find')) {
    /** findUnique({ where: { id } }) — baris ter-cast atau null. */
    function _rcon_find($table, $id) {
        return db_one(
            'SELECT * FROM "' . str_replace('"', '', $table) . '" WHERE "id" = ? LIMIT 1',
            array($id),
            $table
        );
    }
}

if (!function_exists('_rcon_created')) {
    /** Muat ulang baris hasil INSERT untuk respons 201 (bentuk persis Prisma). */
    function _rcon_created($table, $id) {
        return _rcon_find($table, $id);
    }
}

if (!function_exists('_rcon_localize')) {
    /**
     * cast_rows() + apply_translations() — paritas applyEntityTranslations.
     * $fields/$keyOf null → pakai registry $ENTITY_FIELDS/$ENTITY_KEY_FIELD
     * (isi registry identik dengan keyOf/fields di route Node).
     */
    function _rcon_localize(array $rows, $entity, $fields = null, $key_of = null) {
        $casted = cast_rows($rows, $entity);
        return apply_translations($casted, $entity, locale_from_request(), $key_of, $fields);
    }
}

if (!function_exists('_rcon_bump_views')) {
    /** Increment views dengan error diabaikan — paritas `.catch(() => {})`. */
    function _rcon_bump_views($table, $id) {
        try {
            db_run('UPDATE "' . str_replace('"', '', $table) . '" SET "views" = "views" + 1 WHERE "id" = ?', array($id));
        } catch (Exception $e) {
            /* diabaikan — identik Node */
        }
    }
}

if (!function_exists('_rcon_audit')) {
    /** Jejak audit fire-and-forget (user null → "sistem"). */
    function _rcon_audit($user, $action, $entity, $entityId, $detail = null) {
        try {
            log_audit($user, $action, $entity, $entityId, $detail);
        } catch (Exception $e) {
            /* audit tidak boleh mematahkan respons */
        }
    }
}

if (!function_exists('_rcon_guard_content')) {
    /** guardRole(["SUPER_ADMIN","ADMIN","EDITOR"]) — kembalikan user (fail exit bila ditolak). */
    function _rcon_guard_content() {
        return guard_role(array('SUPER_ADMIN', 'ADMIN', 'EDITOR'));
    }
}

/** Tabel yang punya kolom updatedAt (PUT body kosong tetap mem-bump — paritas @updatedAt Prisma). */
if (!defined('RCON_HAS_UPDATED_AT')) {
    define('RCON_HAS_UPDATED_AT', array(
        'Article', 'Tutorial', 'Ecosystem', 'Gallery', 'Event', 'Resource', 'RegionalBranch',
    ));
}

/* ===========================================================================
 * ARTICLES — src/app/api/articles/**
 * ========================================================================= */

if (!function_exists('_rcon_articles')) {
    function _rcon_articles($method, $seg) {
        $n = count($seg);
        if ($n === 1) {
            if ($method === 'GET')  { _rcon_articles_list();   return true; }
            if ($method === 'POST') { _rcon_articles_create(); return true; }
            return false;
        }
        if ($n === 2) {
            if ($method === 'GET')    { _rcon_articles_show($seg[1]);   return true; }
            if ($method === 'PUT')    { _rcon_articles_update($seg[1]); return true; }
            if ($method === 'DELETE') { _rcon_articles_delete($seg[1]); return true; }
            return false;
        }
        if ($n === 3 && $seg[1] === 'slug' && $method === 'GET') {
            _rcon_articles_by_slug($seg[2]);
            return true;
        }
        return false;
    }
}

if (!function_exists('_rcon_articles_list')) {
    function _rcon_articles_list() {
        try {
            $status   = (isset($_GET['status']) && $_GET['status'] !== '') ? (string) $_GET['status'] : null;
            $category = (isset($_GET['category']) && $_GET['category'] !== '') ? (string) $_GET['category'] : null;
            $featured = isset($_GET['featured']) ? (string) $_GET['featured'] : null;
            $q        = (isset($_GET['q']) && $_GET['q'] !== '') ? (string) $_GET['q'] : null;
            $limit    = _rcon_int(isset($_GET['limit']) && $_GET['limit'] !== '' ? $_GET['limit'] : '0');
            if ($limit === null) $limit = 0; // parseInt("") → NaN → tanpa take

            $where = array(); $params = array();
            if ($status === 'all') {
                /* mode admin: tampilkan semua */
            } elseif ($status !== null) {
                $where[] = '"status" = ?'; $params[] = $status;
            } else {
                $where[] = '"status" = ?'; $params[] = 'PUBLISHED';
            }
            if ($category !== null) { $where[] = '"category" = ?'; $params[] = $category; }
            if ($featured === 'true') { $where[] = '"featured" = 1'; }
            if ($q !== null) {
                $where[] = '("title" LIKE ? OR "excerpt" LIKE ? OR "content" LIKE ?)';
                array_push($params, '%' . $q . '%', '%' . $q . '%', '%' . $q . '%');
            }

            $sql = 'SELECT * FROM "Article"'
                . (count($where) > 0 ? ' WHERE ' . implode(' AND ', $where) : '')
                . ' ORDER BY "featured" DESC, "createdAt" DESC'
                . ($limit > 0 ? ' LIMIT ' . (int) $limit : '');
            $rows = db_all($sql, $params);
            ok(_rcon_localize($rows, 'Article'));
        } catch (Exception $e) {
            fail('Gagal memuat artikel.', 500);
        }
    }
}

if (!function_exists('_rcon_articles_create')) {
    function _rcon_articles_create() {
        $user = guard_admin();
        try {
            $b = _rcon_body();
            $title = trim(_rcon_str_or(isset($b['title']) ? $b['title'] : ''));
            if ($title === '') fail('Judul wajib diisi.');
            $slug = slugify(_rcon_falsy(isset($b['slug']) ? $b['slug'] : '') ? $title : _rcon_str($b['slug']));
            if ($slug === '') $slug = 'artikel-' . now_ms();
            $exists = db_val('SELECT "id" FROM "Article" WHERE "slug" = ?', array($slug));
            if ($exists !== null) $slug .= '-' . base_convert((string) now_ms(), 10, 36);
            $excerpt = trim(_rcon_str_or(isset($b['excerpt']) ? $b['excerpt'] : ''));
            if ($excerpt === '') $excerpt = function_exists('mb_substr') ? mb_substr($title, 0, 140, 'UTF-8') : substr($title, 0, 140);
            $cover = isset($b['cover']) && _rcon_truthy($b['cover']) ? _rcon_str($b['cover']) : null;
            $data = array(
                'id'        => new_id(),
                'title'     => $title,
                'slug'      => $slug,
                'excerpt'   => $excerpt,
                'content'   => _rcon_str_or(isset($b['content']) ? $b['content'] : ''),
                'category'  => _rcon_str_or(isset($b['category']) ? $b['category'] : 'Berita'),
                'cover'     => $cover,
                'status'    => _rcon_str_or(isset($b['status']) ? $b['status'] : 'PUBLISHED'),
                'featured'  => _rcon_bool(isset($b['featured']) ? $b['featured'] : null) ? 1 : 0,
                'views'     => 0,
                'author'    => _rcon_str_or(isset($b['author']) ? $b['author'] : 'Tim MUHDIN'),
            );
            db_insert('Article', $data);
            $row = _rcon_created('Article', $data['id']);
            _rcon_audit($user, 'CREATE', 'Article', $row !== null ? $row['id'] : null, $title);
            ok($row, 201);
        } catch (Exception $e) {
            fail('Gagal membuat artikel.', 500);
        }
    }
}

if (!function_exists('_rcon_articles_show')) {
    function _rcon_articles_show($id) {
        $row = _rcon_find('Article', $id);
        if (!$row) fail('Artikel tidak ditemukan.', 404);
        ok($row);
    }
}

if (!function_exists('_rcon_articles_by_slug')) {
    function _rcon_articles_by_slug($slug) {
        $row = db_one('SELECT * FROM "Article" WHERE "slug" = ? LIMIT 1', array($slug), 'Article');
        if (!$row) fail('Artikel tidak ditemukan.', 404);
        if ($row['status'] !== 'PUBLISHED') fail('Artikel tidak ditemukan.', 404);
        _rcon_bump_views('Article', $row['id']); // .catch(() => {}) — error diabaikan
        $out = _rcon_localize(array($row), 'Article');
        ok(isset($out[0]) ? $out[0] : $row);
    }
}

if (!function_exists('_rcon_articles_update')) {
    function _rcon_articles_update($id) {
        $user = guard_admin();
        try {
            $b = _rcon_body();
            $data = array();
            if (_rcon_has($b, 'title'))     $data['title']   = trim(_rcon_str($b['title']));
            if (_rcon_has($b, 'excerpt'))   $data['excerpt'] = _rcon_str($b['excerpt']);
            if (_rcon_has($b, 'content'))   $data['content'] = _rcon_str($b['content']);
            if (_rcon_has($b, 'category'))  $data['category'] = _rcon_str($b['category']);
            if (_rcon_has($b, 'cover'))     $data['cover']   = _rcon_truthy($b['cover']) ? _rcon_str($b['cover']) : null;
            if (_rcon_has($b, 'status'))    $data['status']  = _rcon_str($b['status']);
            if (_rcon_has($b, 'featured'))  $data['featured'] = _rcon_bool($b['featured']) ? 1 : 0;
            if (_rcon_has($b, 'author'))    $data['author']  = _rcon_str($b['author']);
            if (_rcon_has($b, 'slug')) {
                $s = slugify(_rcon_str($b['slug']));
                if ($s !== '') $data['slug'] = $s; // slugify('') → undefined → diabaikan Prisma
            }
            $existing = _rcon_find('Article', $id);
            if (!$existing) fail('Gagal memperbarui artikel.', 500); // P2025 → catch Node
            if (count($data) > 0 || in_array('Article', RCON_HAS_UPDATED_AT, true)) {
                db_update('Article', $data, '"id" = ?', array($id)); // updatedAt auto (lib)
            }
            $fresh = _rcon_find('Article', $id);
            _rcon_audit($user, 'UPDATE', 'Article', $id, isset($fresh['title']) ? $fresh['title'] : null);
            ok($fresh);
        } catch (Exception $e) {
            fail('Gagal memperbarui artikel.', 500);
        }
    }
}

if (!function_exists('_rcon_articles_delete')) {
    function _rcon_articles_delete($id) {
        $user = guard_admin();
        try {
            $existing = _rcon_find('Article', $id);
            if (!$existing) fail('Gagal menghapus artikel.', 500);
            db_delete('Article', '"id" = ?', array($id));
            _rcon_audit($user, 'DELETE', 'Article', $id, isset($existing['title']) ? $existing['title'] : null);
            ok(array('success' => true));
        } catch (Exception $e) {
            fail('Gagal menghapus artikel.', 500);
        }
    }
}

/* ===========================================================================
 * TUTORIALS — src/app/api/tutorials/**
 * ========================================================================= */

if (!function_exists('_rcon_tutorials')) {
    function _rcon_tutorials($method, $seg) {
        $n = count($seg);
        if ($n === 1) {
            if ($method === 'GET')  { _rcon_tutorials_list();   return true; }
            if ($method === 'POST') { _rcon_tutorials_create(); return true; }
            return false;
        }
        if ($n === 2) {
            if ($method === 'GET')    { _rcon_tutorials_show($seg[1]);   return true; }
            if ($method === 'PUT')    { _rcon_tutorials_update($seg[1]); return true; }
            if ($method === 'DELETE') { _rcon_tutorials_delete($seg[1]); return true; }
            return false;
        }
        if ($n === 3 && $seg[1] === 'slug' && $method === 'GET') {
            _rcon_tutorials_by_slug($seg[2]);
            return true;
        }
        return false;
    }
}

if (!function_exists('_rcon_tutorials_list')) {
    function _rcon_tutorials_list() {
        try {
            $isAdmin = isset($_GET['all']) && $_GET['all'] === '1';
            $category = (isset($_GET['category']) && $_GET['category'] !== '') ? (string) $_GET['category'] : null;
            $q = (isset($_GET['q']) && $_GET['q'] !== '') ? (string) $_GET['q'] : null;

            $where = array(); $params = array();
            if (!$isAdmin) { $where[] = '"published" = 1'; }
            if ($category !== null) { $where[] = '"category" = ?'; $params[] = $category; }
            if ($q !== null) {
                $where[] = '("title" LIKE ? OR "summary" LIKE ? OR "content" LIKE ?)';
                array_push($params, '%' . $q . '%', '%' . $q . '%', '%' . $q . '%');
            }

            $sql = 'SELECT * FROM "Tutorial"'
                . (count($where) > 0 ? ' WHERE ' . implode(' AND ', $where) : '')
                . ' ORDER BY "order" ASC';
            $rows = db_all($sql, $params);
            ok(_rcon_localize($rows, 'Tutorial'));
        } catch (Exception $e) {
            fail('Gagal memuat tutorial.', 500);
        }
    }
}

if (!function_exists('_rcon_tutorials_create')) {
    function _rcon_tutorials_create() {
        $user = guard_admin();
        try {
            $b = _rcon_body();
            $title = trim(_rcon_str_or(isset($b['title']) ? $b['title'] : ''));
            if ($title === '') fail('Judul wajib diisi.');
            $slug = slugify(_rcon_falsy(isset($b['slug']) ? $b['slug'] : '') ? $title : _rcon_str($b['slug']));
            if ($slug === '') $slug = 'tutorial-' . now_ms();
            $exists = db_val('SELECT "id" FROM "Tutorial" WHERE "slug" = ?', array($slug));
            if ($exists !== null) $slug .= '-' . base_convert((string) now_ms(), 10, 36);
            $data = array(
                'id'        => new_id(),
                'title'     => $title,
                'slug'      => $slug,
                'category'  => _rcon_str_or(isset($b['category']) ? $b['category'] : 'Umum'),
                'level'     => _rcon_str_or(isset($b['level']) ? $b['level'] : 'Pemula'),
                'duration'  => _rcon_int_or(isset($b['duration']) ? $b['duration'] : null, 10),
                'summary'   => _rcon_str_or(isset($b['summary']) ? $b['summary'] : ''),
                'content'   => _rcon_str_or(isset($b['content']) ? $b['content'] : ''),
                'order'     => _rcon_int_or(isset($b['order']) ? $b['order'] : null, 99),
                'published' => _rcon_has($b, 'published') ? (_rcon_bool($b['published']) ? 1 : 0) : 1,
                'views'     => 0,
            );
            db_insert('Tutorial', $data);
            $row = _rcon_created('Tutorial', $data['id']);
            _rcon_audit($user, 'CREATE', 'Tutorial', $row !== null ? $row['id'] : null, $title);
            ok($row, 201);
        } catch (Exception $e) {
            fail('Gagal membuat tutorial.', 500);
        }
    }
}

if (!function_exists('_rcon_tutorials_show')) {
    function _rcon_tutorials_show($id) {
        $row = _rcon_find('Tutorial', $id);
        if (!$row) fail('Tutorial tidak ditemukan.', 404);
        ok($row);
    }
}

if (!function_exists('_rcon_tutorials_by_slug')) {
    function _rcon_tutorials_by_slug($slug) {
        $row = db_one('SELECT * FROM "Tutorial" WHERE "slug" = ? LIMIT 1', array($slug), 'Tutorial');
        if (!$row || ((int) $row['published']) !== 1) fail('Tutorial tidak ditemukan.', 404);
        _rcon_bump_views('Tutorial', $row['id']); // .catch(() => {})
        $out = _rcon_localize(array($row), 'Tutorial');
        ok(isset($out[0]) ? $out[0] : $row);
    }
}

if (!function_exists('_rcon_tutorials_update')) {
    function _rcon_tutorials_update($id) {
        $user = guard_admin();
        try {
            $b = _rcon_body();
            $data = array();
            if (_rcon_has($b, 'title'))     $data['title']    = _rcon_str($b['title']);
            if (_rcon_has($b, 'category'))  $data['category'] = _rcon_str($b['category']);
            if (_rcon_has($b, 'level'))     $data['level']    = _rcon_str($b['level']);
            if (_rcon_has($b, 'duration'))  $data['duration'] = _rcon_int_or($b['duration'], 10);
            if (_rcon_has($b, 'summary'))   $data['summary']  = _rcon_str($b['summary']);
            if (_rcon_has($b, 'content'))   $data['content']  = _rcon_str($b['content']);
            if (_rcon_has($b, 'order'))     $data['order']    = _rcon_int_or($b['order'], 0);
            if (_rcon_has($b, 'published')) $data['published'] = _rcon_bool($b['published']) ? 1 : 0;
            if (_rcon_has($b, 'slug')) {
                $s = slugify(_rcon_str($b['slug']));
                if ($s !== '') $data['slug'] = $s;
            }
            $existing = _rcon_find('Tutorial', $id);
            if (!$existing) fail('Gagal memperbarui tutorial.', 500);
            if (count($data) > 0 || in_array('Tutorial', RCON_HAS_UPDATED_AT, true)) {
                db_update('Tutorial', $data, '"id" = ?', array($id));
            }
            $fresh = _rcon_find('Tutorial', $id);
            _rcon_audit($user, 'UPDATE', 'Tutorial', $id, isset($fresh['title']) ? $fresh['title'] : null);
            ok($fresh);
        } catch (Exception $e) {
            fail('Gagal memperbarui tutorial.', 500);
        }
    }
}

if (!function_exists('_rcon_tutorials_delete')) {
    function _rcon_tutorials_delete($id) {
        $user = guard_admin();
        try {
            $existing = _rcon_find('Tutorial', $id);
            if (!$existing) fail('Gagal menghapus tutorial.', 500);
            db_delete('Tutorial', '"id" = ?', array($id));
            _rcon_audit($user, 'DELETE', 'Tutorial', $id, isset($existing['title']) ? $existing['title'] : null);
            ok(array('success' => true));
        } catch (Exception $e) {
            fail('Gagal menghapus tutorial.', 500);
        }
    }
}

/* ===========================================================================
 * FAQS — src/app/api/faqs/** (tanpa GET by id — Node hanya PUT/DELETE)
 * ========================================================================= */

if (!function_exists('_rcon_faqs')) {
    function _rcon_faqs($method, $seg) {
        $n = count($seg);
        if ($n === 1) {
            if ($method === 'GET')  { _rcon_faqs_list();   return true; }
            if ($method === 'POST') { _rcon_faqs_create(); return true; }
            return false;
        }
        if ($n === 2) {
            if ($method === 'PUT')    { _rcon_faqs_update($seg[1]); return true; }
            if ($method === 'DELETE') { _rcon_faqs_delete($seg[1]); return true; }
            return false;
        }
        return false;
    }
}

if (!function_exists('_rcon_faqs_list')) {
    function _rcon_faqs_list() {
        try {
            $category = (isset($_GET['category']) && $_GET['category'] !== '') ? (string) $_GET['category'] : null;
            $sql = 'SELECT * FROM "Faq"' . ($category !== null ? ' WHERE "category" = ?' : '') . ' ORDER BY "order" ASC';
            $rows = db_all($sql, $category !== null ? array($category) : array());
            ok(_rcon_localize($rows, 'Faq'));
        } catch (Exception $e) {
            fail('Gagal memuat FAQ.', 500);
        }
    }
}

if (!function_exists('_rcon_faqs_create')) {
    function _rcon_faqs_create() {
        $user = guard_admin();
        try {
            $b = _rcon_body();
            if (!_rcon_truthy(isset($b['question']) ? $b['question'] : null) || !_rcon_truthy(isset($b['answer']) ? $b['answer'] : null)) {
                fail('Pertanyaan dan jawaban wajib diisi.');
            }
            $data = array(
                'id'       => new_id(),
                'question' => _rcon_str($b['question']),
                'answer'   => _rcon_str($b['answer']),
                'category' => _rcon_str_or(isset($b['category']) ? $b['category'] : 'Umum'),
                'order'    => _rcon_int_or(isset($b['order']) ? $b['order'] : null, 99),
            );
            db_insert('Faq', $data);
            $row = _rcon_created('Faq', $data['id']);
            _rcon_audit($user, 'CREATE', 'Faq', $row !== null ? $row['id'] : null, $data['question']);
            ok($row, 201);
        } catch (Exception $e) {
            fail('Gagal membuat FAQ.', 500);
        }
    }
}

if (!function_exists('_rcon_faqs_update')) {
    function _rcon_faqs_update($id) {
        $user = guard_admin();
        try {
            $b = _rcon_body();
            $data = array();
            if (_rcon_has($b, 'question')) $data['question'] = _rcon_str($b['question']);
            if (_rcon_has($b, 'answer'))   $data['answer']   = _rcon_str($b['answer']);
            if (_rcon_has($b, 'category')) $data['category'] = _rcon_str($b['category']);
            if (_rcon_has($b, 'order'))    $data['order']    = _rcon_int_or($b['order'], 0);
            $existing = _rcon_find('Faq', $id);
            if (!$existing) fail('Gagal memperbarui FAQ.', 500);
            if (count($data) > 0) db_update('Faq', $data, '"id" = ?', array($id));
            $fresh = _rcon_find('Faq', $id);
            _rcon_audit($user, 'UPDATE', 'Faq', $id, isset($fresh['question']) ? $fresh['question'] : null);
            ok($fresh);
        } catch (Exception $e) {
            fail('Gagal memperbarui FAQ.', 500);
        }
    }
}

if (!function_exists('_rcon_faqs_delete')) {
    function _rcon_faqs_delete($id) {
        $user = guard_admin();
        try {
            $existing = _rcon_find('Faq', $id);
            if (!$existing) fail('Gagal menghapus FAQ.', 500);
            db_delete('Faq', '"id" = ?', array($id));
            _rcon_audit($user, 'DELETE', 'Faq', $id, isset($existing['question']) ? $existing['question'] : null);
            ok(array('success' => true));
        } catch (Exception $e) {
            fail('Gagal menghapus FAQ.', 500);
        }
    }
}

/* ===========================================================================
 * TESTIMONIALS — src/app/api/testimonials/** (POST publik tanpa guard)
 * ========================================================================= */

if (!function_exists('_rcon_testimonials')) {
    function _rcon_testimonials($method, $seg) {
        $n = count($seg);
        if ($n === 1) {
            if ($method === 'GET')  { _rcon_testimonials_list();   return true; }
            if ($method === 'POST') { _rcon_testimonials_create(); return true; }
            return false;
        }
        if ($n === 2) {
            if ($method === 'PUT')    { _rcon_testimonials_update($seg[1]); return true; }
            if ($method === 'DELETE') { _rcon_testimonials_delete($seg[1]); return true; }
            return false;
        }
        return false;
    }
}

if (!function_exists('_rcon_testimonials_list')) {
    function _rcon_testimonials_list() {
        try {
            $all = isset($_GET['all']) && $_GET['all'] === '1';
            $sql = 'SELECT * FROM "Testimonial"' . ($all ? '' : ' WHERE "published" = 1') . ' ORDER BY "createdAt" DESC';
            $rows = db_all($sql);
            ok(_rcon_localize($rows, 'Testimonial'));
        } catch (Exception $e) {
            fail('Gagal memuat testimoni.', 500);
        }
    }
}

if (!function_exists('_rcon_testimonials_create')) {
    function _rcon_testimonials_create() {
        /* PUBLIK — tanpa guard (paritas Node): testimoni masuk unpublished
         * untuk dimoderasi admin. Audit memakai identitas "sistem". */
        try {
            $b = _rcon_body();
            if (!_rcon_truthy(isset($b['name']) ? $b['name'] : null) || !_rcon_truthy(isset($b['content']) ? $b['content'] : null)) {
                fail('Nama dan isi testimoni wajib diisi.');
            }
            $data = array(
                'id'        => new_id(),
                'name'      => _rcon_str($b['name']),
                'role'      => _rcon_str_or(isset($b['role']) ? $b['role'] : 'Jamaah'),
                'content'   => _rcon_str($b['content']),
                'rating'    => _rcon_int_or(isset($b['rating']) ? $b['rating'] : null, 5),
                'published' => 0, // publik → unpublished (moderasi)
            );
            db_insert('Testimonial', $data);
            $row = _rcon_created('Testimonial', $data['id']);
            _rcon_audit(null, 'CREATE', 'Testimonial', $row !== null ? $row['id'] : null, $data['name']);
            ok($row, 201);
        } catch (Exception $e) {
            fail('Gagal mengirim testimoni.', 500);
        }
    }
}

if (!function_exists('_rcon_testimonials_update')) {
    function _rcon_testimonials_update($id) {
        $user = guard_admin();
        try {
            $b = _rcon_body();
            $data = array();
            if (_rcon_has($b, 'name'))      $data['name']      = _rcon_str($b['name']);
            if (_rcon_has($b, 'role'))      $data['role']      = _rcon_str($b['role']);
            if (_rcon_has($b, 'content'))   $data['content']   = _rcon_str($b['content']);
            if (_rcon_has($b, 'rating'))    $data['rating']    = _rcon_int_or($b['rating'], 5);
            if (_rcon_has($b, 'published')) $data['published'] = _rcon_bool($b['published']) ? 1 : 0;
            $existing = _rcon_find('Testimonial', $id);
            if (!$existing) fail('Gagal memperbarui testimoni.', 500);
            if (count($data) > 0) db_update('Testimonial', $data, '"id" = ?', array($id));
            $fresh = _rcon_find('Testimonial', $id);
            _rcon_audit($user, 'UPDATE', 'Testimonial', $id, isset($fresh['name']) ? $fresh['name'] : null);
            ok($fresh);
        } catch (Exception $e) {
            fail('Gagal memperbarui testimoni.', 500);
        }
    }
}

if (!function_exists('_rcon_testimonials_delete')) {
    function _rcon_testimonials_delete($id) {
        $user = guard_admin();
        try {
            $existing = _rcon_find('Testimonial', $id);
            if (!$existing) fail('Gagal menghapus testimoni.', 500);
            db_delete('Testimonial', '"id" = ?', array($id));
            _rcon_audit($user, 'DELETE', 'Testimonial', $id, isset($existing['name']) ? $existing['name'] : null);
            ok(array('success' => true));
        } catch (Exception $e) {
            fail('Gagal menghapus testimoni.', 500);
        }
    }
}

/* ===========================================================================
 * ECOSYSTEMS — src/app/api/ecosystems/**
 * ========================================================================= */

if (!function_exists('_rcon_ecosystems')) {
    function _rcon_ecosystems($method, $seg) {
        $n = count($seg);
        if ($n === 1) {
            if ($method === 'GET')  { _rcon_ecosystems_list();   return true; }
            if ($method === 'POST') { _rcon_ecosystems_create(); return true; }
            return false;
        }
        if ($n === 2) {
            if ($method === 'GET')    { _rcon_ecosystems_show($seg[1]);   return true; }
            if ($method === 'PUT')    { _rcon_ecosystems_update($seg[1]); return true; }
            if ($method === 'DELETE') { _rcon_ecosystems_delete($seg[1]); return true; }
            return false;
        }
        return false;
    }
}

if (!function_exists('_rcon_ecosystems_list')) {
    function _rcon_ecosystems_list() {
        try {
            $cluster = (isset($_GET['cluster']) && $_GET['cluster'] !== '') ? (string) $_GET['cluster'] : null;
            $sql = 'SELECT * FROM "Ecosystem"' . ($cluster !== null ? ' WHERE "cluster" = ?' : '') . ' ORDER BY "number" ASC';
            $rows = db_all($sql, $cluster !== null ? array($cluster) : array());
            ok(_rcon_localize($rows, 'Ecosystem')); // keyOf = String(number), fields registry
        } catch (Exception $e) {
            fail('Gagal memuat ekosistem.', 500);
        }
    }
}

if (!function_exists('_rcon_ecosystems_create')) {
    function _rcon_ecosystems_create() {
        $user = guard_admin();
        try {
            $b = _rcon_body();
            $number = _rcon_int(isset($b['number']) ? $b['number'] : null);
            if (!_rcon_truthy(isset($b['name']) ? $b['name'] : null) || $number === null) {
                fail('Nomor dan nama ekosistem wajib diisi.');
            }
            $data = array(
                'id'          => new_id(),
                'number'      => $number,
                'name'        => _rcon_str($b['name']),
                'cluster'     => _rcon_str_or(isset($b['cluster']) ? $b['cluster'] : 'Akses & Mobilitas'),
                'scope'       => _rcon_str_or(isset($b['scope']) ? $b['scope'] : ''),
                'standard'    => _rcon_str_or(isset($b['standard']) ? $b['standard'] : ''),
                'icon'        => _rcon_str_or(isset($b['icon']) ? $b['icon'] : 'hexagon'),
                'color'       => _rcon_str_or(isset($b['color']) ? $b['color'] : 'emerald'),
                'description' => _rcon_str_or(isset($b['description']) ? $b['description'] : ''),
                'image'       => isset($b['image']) && _rcon_truthy($b['image']) ? _rcon_str($b['image']) : null,
            );
            db_insert('Ecosystem', $data);
            $row = _rcon_created('Ecosystem', $data['id']);
            _rcon_audit($user, 'CREATE', 'Ecosystem', $row !== null ? $row['id'] : null, $data['name']);
            ok($row, 201);
        } catch (Exception $e) {
            fail('Gagal membuat ekosistem — nomor mungkin sudah dipakai.', 500);
        }
    }
}

if (!function_exists('_rcon_ecosystems_show')) {
    function _rcon_ecosystems_show($id) {
        $row = _rcon_find('Ecosystem', $id);
        if (!$row) fail('Ekosistem tidak ditemukan.', 404);
        ok($row);
    }
}

if (!function_exists('_rcon_ecosystems_update')) {
    function _rcon_ecosystems_update($id) {
        $user = guard_admin();
        try {
            $b = _rcon_body();
            $data = array();
            if (_rcon_has($b, 'number')) {
                $number = _rcon_int($b['number']);
                if ($number === null) fail('Gagal memperbarui ekosistem.', 500); // NaN → Prisma throw → catch
                $data['number'] = $number;
            }
            if (_rcon_has($b, 'name'))        $data['name']        = _rcon_str($b['name']);
            if (_rcon_has($b, 'cluster'))     $data['cluster']     = _rcon_str($b['cluster']);
            if (_rcon_has($b, 'scope'))       $data['scope']       = _rcon_str($b['scope']);
            if (_rcon_has($b, 'standard'))    $data['standard']    = _rcon_str($b['standard']);
            if (_rcon_has($b, 'icon'))        $data['icon']        = _rcon_str($b['icon']);
            if (_rcon_has($b, 'color'))       $data['color']       = _rcon_str($b['color']);
            if (_rcon_has($b, 'description')) $data['description'] = _rcon_str($b['description']);
            if (_rcon_has($b, 'image'))       $data['image']       = _rcon_truthy($b['image']) ? _rcon_str($b['image']) : null;
            $existing = _rcon_find('Ecosystem', $id);
            if (!$existing) fail('Gagal memperbarui ekosistem.', 500);
            if (count($data) > 0 || in_array('Ecosystem', RCON_HAS_UPDATED_AT, true)) {
                db_update('Ecosystem', $data, '"id" = ?', array($id));
            }
            $fresh = _rcon_find('Ecosystem', $id);
            _rcon_audit($user, 'UPDATE', 'Ecosystem', $id, isset($fresh['name']) ? $fresh['name'] : null);
            ok($fresh);
        } catch (Exception $e) {
            fail('Gagal memperbarui ekosistem.', 500);
        }
    }
}

if (!function_exists('_rcon_ecosystems_delete')) {
    function _rcon_ecosystems_delete($id) {
        $user = guard_admin();
        try {
            $existing = _rcon_find('Ecosystem', $id);
            if (!$existing) fail('Gagal menghapus ekosistem.', 500);
            db_delete('Ecosystem', '"id" = ?', array($id));
            _rcon_audit($user, 'DELETE', 'Ecosystem', $id, isset($existing['name']) ? $existing['name'] : null);
            ok(array('success' => true));
        } catch (Exception $e) {
            fail('Gagal menghapus ekosistem.', 500);
        }
    }
}

/* ===========================================================================
 * JOURNEY (JourneyStep) — src/app/api/journey/** (tanpa GET by id)
 * ========================================================================= */

if (!function_exists('_rcon_journey')) {
    function _rcon_journey($method, $seg) {
        $n = count($seg);
        if ($n === 1) {
            if ($method === 'GET')  { _rcon_journey_list();   return true; }
            if ($method === 'POST') { _rcon_journey_create(); return true; }
            return false;
        }
        if ($n === 2) {
            if ($method === 'PUT')    { _rcon_journey_update($seg[1]); return true; }
            if ($method === 'DELETE') { _rcon_journey_delete($seg[1]); return true; }
            return false;
        }
        return false;
    }
}

if (!function_exists('_rcon_journey_list')) {
    function _rcon_journey_list() {
        try {
            $rows = db_all('SELECT * FROM "JourneyStep" ORDER BY "step" ASC');
            ok(_rcon_localize($rows, 'JourneyStep')); // keyOf = String(step)
        } catch (Exception $e) {
            fail('Gagal memuat alur perjalanan.', 500);
        }
    }
}

if (!function_exists('_rcon_journey_create')) {
    function _rcon_journey_create() {
        $user = guard_admin();
        try {
            $b = _rcon_body();
            $step = _rcon_int(isset($b['step']) ? $b['step'] : null);
            if (!_rcon_truthy(isset($b['title']) ? $b['title'] : null) || $step === null) {
                fail('Tahap dan judul wajib diisi.');
            }
            $data = array(
                'id'       => new_id(),
                'step'     => $step,
                'title'    => _rcon_str($b['title']),
                'activity' => _rcon_str_or(isset($b['activity']) ? $b['activity'] : ''),
                'actor'    => _rcon_str_or(isset($b['actor']) ? $b['actor'] : ''),
                'output'   => _rcon_str_or(isset($b['output']) ? $b['output'] : ''),
                'icon'     => _rcon_str_or(isset($b['icon']) ? $b['icon'] : 'circle'),
            );
            db_insert('JourneyStep', $data);
            $row = _rcon_created('JourneyStep', $data['id']);
            _rcon_audit($user, 'CREATE', 'JourneyStep', $row !== null ? $row['id'] : null, $data['title']);
            ok($row, 201);
        } catch (Exception $e) {
            fail('Gagal membuat tahap — nomor mungkin sudah dipakai.', 500);
        }
    }
}

if (!function_exists('_rcon_journey_update')) {
    function _rcon_journey_update($id) {
        $user = guard_admin();
        try {
            $b = _rcon_body();
            $data = array();
            if (_rcon_has($b, 'step')) {
                $step = _rcon_int($b['step']);
                if ($step === null) fail('Gagal memperbarui tahap.', 500); // NaN → Prisma throw
                $data['step'] = $step;
            }
            if (_rcon_has($b, 'title'))    $data['title']    = _rcon_str($b['title']);
            if (_rcon_has($b, 'activity')) $data['activity'] = _rcon_str($b['activity']);
            if (_rcon_has($b, 'actor'))    $data['actor']    = _rcon_str($b['actor']);
            if (_rcon_has($b, 'output'))   $data['output']   = _rcon_str($b['output']);
            if (_rcon_has($b, 'icon'))     $data['icon']     = _rcon_str($b['icon']);
            $existing = _rcon_find('JourneyStep', $id);
            if (!$existing) fail('Gagal memperbarui tahap.', 500);
            if (count($data) > 0) db_update('JourneyStep', $data, '"id" = ?', array($id));
            $fresh = _rcon_find('JourneyStep', $id);
            _rcon_audit($user, 'UPDATE', 'JourneyStep', $id, isset($fresh['title']) ? $fresh['title'] : null);
            ok($fresh);
        } catch (Exception $e) {
            fail('Gagal memperbarui tahap.', 500);
        }
    }
}

if (!function_exists('_rcon_journey_delete')) {
    function _rcon_journey_delete($id) {
        $user = guard_admin();
        try {
            $existing = _rcon_find('JourneyStep', $id);
            if (!$existing) fail('Gagal menghapus tahap.', 500);
            db_delete('JourneyStep', '"id" = ?', array($id));
            _rcon_audit($user, 'DELETE', 'JourneyStep', $id, isset($existing['title']) ? $existing['title'] : null);
            ok(array('success' => true));
        } catch (Exception $e) {
            fail('Gagal menghapus tahap.', 500);
        }
    }
}

/* ===========================================================================
 * ROADMAP — src/app/api/roadmap/**
 * ========================================================================= */

if (!function_exists('_rcon_roadmap')) {
    function _rcon_roadmap($method, $seg) {
        $n = count($seg);
        if ($n === 1) {
            if ($method === 'GET')  { _rcon_roadmap_list();   return true; }
            if ($method === 'POST') { _rcon_roadmap_create(); return true; }
            return false;
        }
        if ($n === 2) {
            if ($method === 'PUT')    { _rcon_roadmap_update($seg[1]); return true; }
            if ($method === 'DELETE') { _rcon_roadmap_delete($seg[1]); return true; }
            return false;
        }
        return false;
    }
}

if (!function_exists('_rcon_roadmap_list')) {
    function _rcon_roadmap_list() {
        try {
            $rows = db_all('SELECT * FROM "Roadmap" ORDER BY "order" ASC');
            ok(_rcon_localize($rows, 'Roadmap'));
        } catch (Exception $e) {
            fail('Gagal memuat roadmap.', 500);
        }
    }
}

if (!function_exists('_rcon_roadmap_create')) {
    function _rcon_roadmap_create() {
        $user = guard_admin();
        try {
            $b = _rcon_body();
            $data = array(
                'id'           => new_id(),
                'phase'        => _rcon_str_or(isset($b['phase']) ? $b['phase'] : 'Fase'),
                'period'       => _rcon_str_or(isset($b['period']) ? $b['period'] : ''),
                'focus'        => _rcon_str_or(isset($b['focus']) ? $b['focus'] : ''),
                'deliverables' => _rcon_str_or(isset($b['deliverables']) ? $b['deliverables'] : ''),
                'order'        => _rcon_int_or(isset($b['order']) ? $b['order'] : null, 99),
            );
            db_insert('Roadmap', $data);
            $row = _rcon_created('Roadmap', $data['id']);
            _rcon_audit($user, 'CREATE', 'Roadmap', $row !== null ? $row['id'] : null, $data['phase']);
            ok($row, 201);
        } catch (Exception $e) {
            fail('Gagal membuat fase roadmap.', 500);
        }
    }
}

if (!function_exists('_rcon_roadmap_update')) {
    function _rcon_roadmap_update($id) {
        $user = guard_admin();
        try {
            $b = _rcon_body();
            $data = array();
            if (_rcon_has($b, 'phase'))        $data['phase']        = _rcon_str($b['phase']);
            if (_rcon_has($b, 'period'))       $data['period']       = _rcon_str($b['period']);
            if (_rcon_has($b, 'focus'))        $data['focus']        = _rcon_str($b['focus']);
            if (_rcon_has($b, 'deliverables')) $data['deliverables'] = _rcon_str($b['deliverables']);
            if (_rcon_has($b, 'order'))        $data['order']        = _rcon_int_or($b['order'], 0);
            $existing = _rcon_find('Roadmap', $id);
            if (!$existing) fail('Gagal memperbarui fase roadmap.', 500);
            if (count($data) > 0) db_update('Roadmap', $data, '"id" = ?', array($id));
            $fresh = _rcon_find('Roadmap', $id);
            _rcon_audit($user, 'UPDATE', 'Roadmap', $id, isset($fresh['phase']) ? $fresh['phase'] : null);
            ok($fresh);
        } catch (Exception $e) {
            fail('Gagal memperbarui fase roadmap.', 500);
        }
    }
}

if (!function_exists('_rcon_roadmap_delete')) {
    function _rcon_roadmap_delete($id) {
        $user = guard_admin();
        try {
            $existing = _rcon_find('Roadmap', $id);
            if (!$existing) fail('Gagal menghapus fase roadmap.', 500);
            db_delete('Roadmap', '"id" = ?', array($id));
            _rcon_audit($user, 'DELETE', 'Roadmap', $id, isset($existing['phase']) ? $existing['phase'] : null);
            ok(array('success' => true));
        } catch (Exception $e) {
            fail('Gagal menghapus fase roadmap.', 500);
        }
    }
}

/* ===========================================================================
 * GALLERY — src/app/api/gallery/** (Task 18; tanpa terjemahan)
 * GET list: ?all=1 mengembalikan semua BILA peminta sesi admin sah.
 * ========================================================================= */

if (!function_exists('_rcon_gallery')) {
    function _rcon_gallery($method, $seg) {
        $n = count($seg);
        if ($n === 1) {
            if ($method === 'GET')  { _rcon_gallery_list();   return true; }
            if ($method === 'POST') { _rcon_gallery_create(); return true; }
            return false;
        }
        if ($n === 2) {
            if ($method === 'PUT')    { _rcon_gallery_update($seg[1]); return true; }
            if ($method === 'DELETE') { _rcon_gallery_delete($seg[1]); return true; }
            return false;
        }
        return false;
    }
}

if (!function_exists('_rcon_gallery_list')) {
    function _rcon_gallery_list() {
        try {
            $all = isset($_GET['all']) && $_GET['all'] === '1';
            if ($all && current_user() !== null) { // requireAdmin() → user/null
                ok(db_all('SELECT * FROM "Gallery" ORDER BY "order" ASC, "createdAt" ASC', array(), 'Gallery'));
            }
            $rows = db_all('SELECT * FROM "Gallery" WHERE "published" = 1 ORDER BY "order" ASC, "createdAt" ASC', array(), 'Gallery');
            ok($rows);
        } catch (Exception $e) {
            fail('Gagal memuat galeri.', 500);
        }
    }
}

if (!function_exists('_rcon_gallery_create')) {
    function _rcon_gallery_create() {
        $user = _rcon_guard_content();
        try {
            $b = _rcon_body();
            $title = trim(_rcon_str_or(isset($b['title']) ? $b['title'] : ''));
            $imageUrl = trim(_rcon_str_or(isset($b['imageUrl']) ? $b['imageUrl'] : ''));
            if ($title === '' || $imageUrl === '') fail('Judul dan URL gambar wajib diisi.');
            $data = array(
                'id'        => new_id(),
                'title'     => $title,
                'caption'   => isset($b['caption']) && _rcon_truthy($b['caption']) ? _rcon_str($b['caption']) : null,
                'category'  => _rcon_str_or(isset($b['category']) ? $b['category'] : 'Kegiatan'),
                'imageUrl'  => $imageUrl,
                'order'     => _rcon_int_or(isset($b['order']) ? $b['order'] : null, 0),
                'published' => !_rcon_has($b, 'published') ? 1 : (_rcon_bool($b['published']) ? 1 : 0),
            );
            db_insert('Gallery', $data);
            $row = _rcon_created('Gallery', $data['id']);
            _rcon_audit($user, 'CREATE', 'Gallery', $row !== null ? $row['id'] : null, $title);
            ok($row, 201);
        } catch (Exception $e) {
            fail('Gagal menambah galeri.', 500);
        }
    }
}

if (!function_exists('_rcon_gallery_update')) {
    function _rcon_gallery_update($id) {
        $user = _rcon_guard_content();
        try {
            $b = _rcon_body();
            $data = array();
            if (_rcon_has($b, 'title')) {
                $title = trim(_rcon_str($b['title']));
                if ($title === '') fail('Judul wajib diisi.');
                $data['title'] = $title;
            }
            if (_rcon_has($b, 'imageUrl')) {
                $imageUrl = trim(_rcon_str($b['imageUrl']));
                if ($imageUrl === '') fail('URL gambar wajib diisi.');
                $data['imageUrl'] = $imageUrl;
            }
            if (_rcon_has($b, 'caption'))   $data['caption']  = _rcon_truthy($b['caption']) ? _rcon_str($b['caption']) : null;
            if (_rcon_has($b, 'category'))  $data['category'] = _rcon_str($b['category']);
            if (_rcon_has($b, 'order'))     $data['order']    = _rcon_int_or($b['order'], 0);
            if (_rcon_has($b, 'published')) $data['published'] = _rcon_bool($b['published']) ? 1 : 0;
            $existing = _rcon_find('Gallery', $id);
            if (!$existing) fail('Gagal memperbarui galeri.', 500);
            if (count($data) > 0 || in_array('Gallery', RCON_HAS_UPDATED_AT, true)) {
                db_update('Gallery', $data, '"id" = ?', array($id));
            }
            $fresh = _rcon_find('Gallery', $id);
            _rcon_audit($user, 'UPDATE', 'Gallery', $id, isset($fresh['title']) ? $fresh['title'] : null);
            ok($fresh);
        } catch (Exception $e) {
            fail('Gagal memperbarui galeri.', 500);
        }
    }
}

if (!function_exists('_rcon_gallery_delete')) {
    function _rcon_gallery_delete($id) {
        $user = _rcon_guard_content();
        try {
            $existing = _rcon_find('Gallery', $id);
            if (!$existing) fail('Gagal menghapus galeri.', 500);
            db_delete('Gallery', '"id" = ?', array($id));
            _rcon_audit($user, 'DELETE', 'Gallery', $id, isset($existing['title']) ? $existing['title'] : null);
            ok(array('success' => true));
        } catch (Exception $e) {
            fail('Gagal menghapus galeri.', 500);
        }
    }
}

/* ===========================================================================
 * EVENTS — src/app/api/events/** (Task 18; startsAt/endsAt = epoch-ms)
 * ========================================================================= */

if (!function_exists('_rcon_events')) {
    function _rcon_events($method, $seg) {
        $n = count($seg);
        if ($n === 1) {
            if ($method === 'GET')  { _rcon_events_list();   return true; }
            if ($method === 'POST') { _rcon_events_create(); return true; }
            return false;
        }
        if ($n === 2) {
            if ($method === 'PUT')    { _rcon_events_update($seg[1]); return true; }
            if ($method === 'DELETE') { _rcon_events_delete($seg[1]); return true; }
            return false;
        }
        return false;
    }
}

if (!function_exists('_rcon_events_list')) {
    function _rcon_events_list() {
        try {
            $all = isset($_GET['all']) && $_GET['all'] === '1';
            if ($all && current_user() !== null) { // requireAdmin()
                ok(db_all('SELECT * FROM "Event" ORDER BY "startsAt" ASC', array(), 'Event'));
            }
            $rows = db_all('SELECT * FROM "Event" WHERE "published" = 1 ORDER BY "startsAt" ASC', array(), 'Event');
            ok($rows);
        } catch (Exception $e) {
            fail('Gagal memuat agenda.', 500);
        }
    }
}

if (!function_exists('_rcon_events_create')) {
    function _rcon_events_create() {
        $user = _rcon_guard_content();
        try {
            $b = _rcon_body();
            $title = trim(_rcon_str_or(isset($b['title']) ? $b['title'] : ''));
            if ($title === '') fail('Judul agenda wajib diisi.');
            $startsRaw = isset($b['startsAt']) ? $b['startsAt'] : null;
            if (_rcon_falsy($startsRaw)) fail('Tanggal & jam mulai (startsAt) wajib dan harus valid.');
            $startsAt = _rcon_date_ms($startsRaw);
            if ($startsAt === null) fail('Tanggal & jam mulai (startsAt) wajib dan harus valid.');
            $endsAt = null;
            if (isset($b['endsAt']) && _rcon_truthy($b['endsAt'])) {
                $endsAt = _rcon_date_ms($b['endsAt']);
                if ($endsAt === null) fail('Tanggal selesai (endsAt) tidak valid.');
            }
            $data = array(
                'id'          => new_id(),
                'title'       => $title,
                'description' => trim(_rcon_str_or(isset($b['description']) ? $b['description'] : '')),
                'location'    => trim(_rcon_str_or(isset($b['location']) ? $b['location'] : '')),
                'startsAt'    => $startsAt,
                'endsAt'      => $endsAt,
                'category'    => _rcon_str_or(isset($b['category']) ? $b['category'] : 'Kegiatan'),
                'published'   => !_rcon_has($b, 'published') ? 1 : (_rcon_bool($b['published']) ? 1 : 0),
            );
            db_insert('Event', $data);
            $row = _rcon_created('Event', $data['id']);
            _rcon_audit($user, 'CREATE', 'Event', $row !== null ? $row['id'] : null, $title);
            ok($row, 201);
        } catch (Exception $e) {
            fail('Gagal menambah agenda.', 500);
        }
    }
}

if (!function_exists('_rcon_events_update')) {
    function _rcon_events_update($id) {
        $user = _rcon_guard_content();
        try {
            $b = _rcon_body();
            $data = array();
            if (_rcon_has($b, 'title')) {
                $title = trim(_rcon_str($b['title']));
                if ($title === '') fail('Judul agenda wajib diisi.');
                $data['title'] = $title;
            }
            if (_rcon_has($b, 'description')) $data['description'] = _rcon_str($b['description']);
            if (_rcon_has($b, 'location'))    $data['location']    = _rcon_str($b['location']);
            if (_rcon_has($b, 'startsAt')) {
                $startsAt = _rcon_date_ms($b['startsAt']);
                if ($startsAt === null) fail('Tanggal & jam mulai (startsAt) tidak valid.');
                $data['startsAt'] = $startsAt;
            }
            if (_rcon_has($b, 'endsAt')) {
                if (_rcon_falsy($b['endsAt'])) {
                    $data['endsAt'] = null;
                } else {
                    $endsAt = _rcon_date_ms($b['endsAt']);
                    if ($endsAt === null) fail('Tanggal selesai (endsAt) tidak valid.');
                    $data['endsAt'] = $endsAt;
                }
            }
            if (_rcon_has($b, 'category'))  $data['category']  = _rcon_str($b['category']);
            if (_rcon_has($b, 'published')) $data['published'] = _rcon_bool($b['published']) ? 1 : 0;
            $existing = _rcon_find('Event', $id);
            if (!$existing) fail('Gagal memperbarui agenda.', 500);
            if (count($data) > 0 || in_array('Event', RCON_HAS_UPDATED_AT, true)) {
                db_update('Event', $data, '"id" = ?', array($id));
            }
            $fresh = _rcon_find('Event', $id);
            _rcon_audit($user, 'UPDATE', 'Event', $id, isset($fresh['title']) ? $fresh['title'] : null);
            ok($fresh);
        } catch (Exception $e) {
            fail('Gagal memperbarui agenda.', 500);
        }
    }
}

if (!function_exists('_rcon_events_delete')) {
    function _rcon_events_delete($id) {
        $user = _rcon_guard_content();
        try {
            $existing = _rcon_find('Event', $id);
            if (!$existing) fail('Gagal menghapus agenda.', 500);
            db_delete('Event', '"id" = ?', array($id));
            _rcon_audit($user, 'DELETE', 'Event', $id, isset($existing['title']) ? $existing['title'] : null);
            ok(array('success' => true));
        } catch (Exception $e) {
            fail('Gagal menghapus agenda.', 500);
        }
    }
}

/* ===========================================================================
 * RESOURCES — src/app/api/resources/** (Task 18; + POST [id]/download)
 * ========================================================================= */

if (!function_exists('_rcon_resources')) {
    function _rcon_resources($method, $seg) {
        $n = count($seg);
        if ($n === 1) {
            if ($method === 'GET')  { _rcon_resources_list();   return true; }
            if ($method === 'POST') { _rcon_resources_create(); return true; }
            return false;
        }
        if ($n === 2) {
            if ($method === 'PUT')    { _rcon_resources_update($seg[1]); return true; }
            if ($method === 'DELETE') { _rcon_resources_delete($seg[1]); return true; }
            return false;
        }
        if ($n === 3 && $seg[2] === 'download' && $method === 'POST') {
            _rcon_resources_download($seg[1]);
            return true;
        }
        return false;
    }
}

if (!function_exists('_rcon_resources_list')) {
    function _rcon_resources_list() {
        try {
            $all = isset($_GET['all']) && $_GET['all'] === '1';
            if ($all && current_user() !== null) { // requireAdmin()
                ok(db_all('SELECT * FROM "Resource" ORDER BY "createdAt" DESC', array(), 'Resource'));
            }
            $rows = db_all(
                'SELECT * FROM "Resource" WHERE "published" = 1 ORDER BY "category" ASC, "createdAt" DESC',
                array(),
                'Resource'
            );
            ok($rows);
        } catch (Exception $e) {
            fail('Gagal memuat dokumen.', 500);
        }
    }
}

if (!function_exists('_rcon_resources_create')) {
    function _rcon_resources_create() {
        $user = _rcon_guard_content();
        try {
            $b = _rcon_body();
            $title = trim(_rcon_str_or(isset($b['title']) ? $b['title'] : ''));
            $fileUrl = trim(_rcon_str_or(isset($b['fileUrl']) ? $b['fileUrl'] : ''));
            if ($title === '' || $fileUrl === '') fail('Judul dan URL berkas wajib diisi.');
            $data = array(
                'id'          => new_id(),
                'title'       => $title,
                'description' => isset($b['description']) && _rcon_truthy($b['description']) ? _rcon_str($b['description']) : null,
                'category'    => _rcon_str_or(isset($b['category']) ? $b['category'] : 'Formulir'),
                'fileUrl'     => $fileUrl,
                'fileType'    => _rcon_str_or(isset($b['fileType']) ? $b['fileType'] : 'PDF'),
                'published'   => !_rcon_has($b, 'published') ? 1 : (_rcon_bool($b['published']) ? 1 : 0),
                'downloads'   => 0,
            );
            db_insert('Resource', $data);
            $row = _rcon_created('Resource', $data['id']);
            _rcon_audit($user, 'CREATE', 'Resource', $row !== null ? $row['id'] : null, $title);
            ok($row, 201);
        } catch (Exception $e) {
            fail('Gagal menambah dokumen.', 500);
        }
    }
}

if (!function_exists('_rcon_resources_update')) {
    function _rcon_resources_update($id) {
        $user = _rcon_guard_content();
        try {
            $b = _rcon_body();
            $data = array();
            if (_rcon_has($b, 'title')) {
                $title = trim(_rcon_str($b['title']));
                if ($title === '') fail('Judul wajib diisi.');
                $data['title'] = $title;
            }
            if (_rcon_has($b, 'fileUrl')) {
                $fileUrl = trim(_rcon_str($b['fileUrl']));
                if ($fileUrl === '') fail('URL berkas wajib diisi.');
                $data['fileUrl'] = $fileUrl;
            }
            if (_rcon_has($b, 'description')) $data['description'] = _rcon_truthy($b['description']) ? _rcon_str($b['description']) : null;
            if (_rcon_has($b, 'category'))    $data['category']    = _rcon_str($b['category']);
            if (_rcon_has($b, 'fileType'))    $data['fileType']    = _rcon_str($b['fileType']);
            if (_rcon_has($b, 'published'))   $data['published']   = _rcon_bool($b['published']) ? 1 : 0;
            $existing = _rcon_find('Resource', $id);
            if (!$existing) fail('Gagal memperbarui dokumen.', 500);
            if (count($data) > 0 || in_array('Resource', RCON_HAS_UPDATED_AT, true)) {
                db_update('Resource', $data, '"id" = ?', array($id));
            }
            $fresh = _rcon_find('Resource', $id);
            _rcon_audit($user, 'UPDATE', 'Resource', $id, isset($fresh['title']) ? $fresh['title'] : null);
            ok($fresh);
        } catch (Exception $e) {
            fail('Gagal memperbarui dokumen.', 500);
        }
    }
}

if (!function_exists('_rcon_resources_delete')) {
    function _rcon_resources_delete($id) {
        $user = _rcon_guard_content();
        try {
            $existing = _rcon_find('Resource', $id);
            if (!$existing) fail('Gagal menghapus dokumen.', 500);
            db_delete('Resource', '"id" = ?', array($id));
            _rcon_audit($user, 'DELETE', 'Resource', $id, isset($existing['title']) ? $existing['title'] : null);
            ok(array('success' => true));
        } catch (Exception $e) {
            fail('Gagal menghapus dokumen.', 500);
        }
    }
}

if (!function_exists('_rcon_resources_download')) {
    /**
     * Paritas POST /api/resources/[id]/download (Node): catat unduhan —
     * increment counter `downloads` lalu kembalikan URL berkas agar
     * frontend memicu unduhan. Node TIDAK mengirim arsip/streaming file.
     */
    function _rcon_resources_download($id) {
        try {
            $row = db_one('SELECT "fileUrl" FROM "Resource" WHERE "id" = ? LIMIT 1', array($id));
            if (!$row) fail('Dokumen tidak ditemukan.', 404);
            db_run('UPDATE "Resource" SET "downloads" = "downloads" + 1 WHERE "id" = ?', array($id));
            ok(array('ok' => true, 'fileUrl' => $row['fileUrl']));
        } catch (Exception $e) {
            fail('Gagal memproses unduhan.', 500);
        }
    }
}

/* ===========================================================================
 * MANAGEMENT — src/app/api/management/**
 * ========================================================================= */

if (!function_exists('_rcon_management')) {
    function _rcon_management($method, $seg) {
        $n = count($seg);
        if ($n === 1) {
            if ($method === 'GET')  { _rcon_management_list();   return true; }
            if ($method === 'POST') { _rcon_management_create(); return true; }
            return false;
        }
        if ($n === 2) {
            if ($method === 'PUT')    { _rcon_management_update($seg[1]); return true; }
            if ($method === 'DELETE') { _rcon_management_delete($seg[1]); return true; }
            return false;
        }
        return false;
    }
}

if (!function_exists('_rcon_management_list')) {
    function _rcon_management_list() {
        try {
            $rows = db_all('SELECT * FROM "Management" ORDER BY "order" ASC');
            ok(_rcon_localize($rows, 'Management'));
        } catch (Exception $e) {
            fail('Gagal memuat struktur organisasi.', 500);
        }
    }
}

if (!function_exists('_rcon_management_create')) {
    function _rcon_management_create() {
        $user = guard_admin();
        try {
            $b = _rcon_body();
            if (!_rcon_truthy(isset($b['name']) ? $b['name'] : null) || !_rcon_truthy(isset($b['position']) ? $b['position'] : null)) {
                fail('Nama dan jabatan wajib diisi.');
            }
            $data = array(
                'id'       => new_id(),
                'name'     => _rcon_str($b['name']),
                'position' => _rcon_str($b['position']),
                'bio'      => isset($b['bio']) && _rcon_truthy($b['bio']) ? _rcon_str($b['bio']) : null,
                'order'    => _rcon_int_or(isset($b['order']) ? $b['order'] : null, 99),
            );
            db_insert('Management', $data);
            $row = _rcon_created('Management', $data['id']);
            _rcon_audit($user, 'CREATE', 'Management', $row !== null ? $row['id'] : null, $data['name']);
            ok($row, 201);
        } catch (Exception $e) {
            fail('Gagal menambah pengurus.', 500);
        }
    }
}

if (!function_exists('_rcon_management_update')) {
    function _rcon_management_update($id) {
        $user = guard_admin();
        try {
            $b = _rcon_body();
            $data = array();
            if (_rcon_has($b, 'name'))     $data['name']     = _rcon_str($b['name']);
            if (_rcon_has($b, 'position')) $data['position'] = _rcon_str($b['position']);
            if (_rcon_has($b, 'bio'))      $data['bio']      = _rcon_truthy($b['bio']) ? _rcon_str($b['bio']) : null;
            if (_rcon_has($b, 'order'))    $data['order']    = _rcon_int_or($b['order'], 0);
            $existing = _rcon_find('Management', $id);
            if (!$existing) fail('Gagal memperbarui pengurus.', 500);
            if (count($data) > 0) db_update('Management', $data, '"id" = ?', array($id));
            $fresh = _rcon_find('Management', $id);
            _rcon_audit($user, 'UPDATE', 'Management', $id, isset($fresh['name']) ? $fresh['name'] : null);
            ok($fresh);
        } catch (Exception $e) {
            fail('Gagal memperbarui pengurus.', 500);
        }
    }
}

if (!function_exists('_rcon_management_delete')) {
    function _rcon_management_delete($id) {
        $user = guard_admin();
        try {
            $existing = _rcon_find('Management', $id);
            if (!$existing) fail('Gagal menghapus pengurus.', 500);
            db_delete('Management', '"id" = ?', array($id));
            _rcon_audit($user, 'DELETE', 'Management', $id, isset($existing['name']) ? $existing['name'] : null);
            ok(array('success' => true));
        } catch (Exception $e) {
            fail('Gagal menghapus pengurus.', 500);
        }
    }
}

/* ===========================================================================
 * BRANCHES (RegionalBranch) — src/app/api/branches/** (Task 19)
 * GET list: ?all=1 utk admin TANPA terjemahan; publik + terjemahan
 * (fields: name, officeName, address, description — keyOf id).
 * ========================================================================= */

if (!function_exists('_rcon_branches')) {
    function _rcon_branches($method, $seg) {
        $n = count($seg);
        if ($n === 1) {
            if ($method === 'GET')  { _rcon_branches_list();   return true; }
            if ($method === 'POST') { _rcon_branches_create(); return true; }
            return false;
        }
        if ($n === 2) {
            if ($method === 'PUT')    { _rcon_branches_update($seg[1]); return true; }
            if ($method === 'DELETE') { _rcon_branches_delete($seg[1]); return true; }
            return false;
        }
        return false;
    }
}

if (!function_exists('_rcon_branches_list')) {
    function _rcon_branches_list() {
        try {
            $all = isset($_GET['all']) && $_GET['all'] === '1';
            if ($all && current_user() !== null) { // requireAdmin() → user/null
                $allRows = db_all('SELECT * FROM "RegionalBranch" ORDER BY "order" ASC, "createdAt" ASC', array(), 'RegionalBranch');
                ok($allRows); // cabang admin: TANPA terjemahan (paritas Node)
            }
            $rows = db_all('SELECT * FROM "RegionalBranch" WHERE "published" = 1 ORDER BY "order" ASC, "createdAt" ASC', array(), 'RegionalBranch');
            ok(_rcon_localize(
                $rows,
                'RegionalBranch',
                array('name', 'officeName', 'address', 'description'),
                null // keyOf id
            ));
        } catch (Exception $e) {
            fail('Gagal memuat jaringan daerah.', 500);
        }
    }
}

if (!function_exists('_rcon_branches_create')) {
    function _rcon_branches_create() {
        $user = _rcon_guard_content();
        try {
            $b = _rcon_body();
            $name = trim(_rcon_str_or(isset($b['name']) ? $b['name'] : ''));
            if ($name === '') fail('Nama kepengurusan daerah wajib diisi.');
            $data = array(
                'id'          => new_id(),
                'name'        => $name,
                'code'        => trim(_rcon_str_or(isset($b['code']) ? $b['code'] : '')),
                'province'    => trim(_rcon_str_or(isset($b['province']) ? $b['province'] : '')),
                'city'        => trim(_rcon_str_or(isset($b['city']) ? $b['city'] : '')),
                'officeName'  => trim(_rcon_str_or(isset($b['officeName']) ? $b['officeName'] : '')),
                'address'     => trim(_rcon_str_or(isset($b['address']) ? $b['address'] : '')),
                'picName'     => trim(_rcon_str_or(isset($b['picName']) ? $b['picName'] : '')),
                'picPhone'    => trim(_rcon_str_or(isset($b['picPhone']) ? $b['picPhone'] : '')),
                'email'       => isset($b['email']) && _rcon_truthy($b['email']) ? trim(_rcon_str($b['email'])) : null,
                'description' => isset($b['description']) && _rcon_truthy($b['description']) ? _rcon_str($b['description']) : null,
                'order'       => _rcon_int_or(isset($b['order']) ? $b['order'] : null, 99),
                'published'   => !_rcon_has($b, 'published') ? 1 : (_rcon_bool($b['published']) ? 1 : 0),
            );
            db_insert('RegionalBranch', $data);
            $row = _rcon_created('RegionalBranch', $data['id']);
            _rcon_audit($user, 'CREATE', 'RegionalBranch', $row !== null ? $row['id'] : null, $name);
            ok($row, 201);
        } catch (Exception $e) {
            fail('Gagal menambah jaringan daerah.', 500);
        }
    }
}

if (!function_exists('_rcon_branches_update')) {
    function _rcon_branches_update($id) {
        $user = _rcon_guard_content();
        try {
            $b = _rcon_body();
            $data = array();
            if (_rcon_has($b, 'name'))       $data['name']       = trim(_rcon_str($b['name']));
            if (_rcon_has($b, 'code'))       $data['code']       = trim(_rcon_str($b['code']));
            if (_rcon_has($b, 'province'))   $data['province']   = trim(_rcon_str($b['province']));
            if (_rcon_has($b, 'city'))       $data['city']       = trim(_rcon_str($b['city']));
            if (_rcon_has($b, 'officeName')) $data['officeName'] = trim(_rcon_str($b['officeName']));
            if (_rcon_has($b, 'address'))    $data['address']    = trim(_rcon_str($b['address']));
            if (_rcon_has($b, 'picName'))    $data['picName']    = trim(_rcon_str($b['picName']));
            if (_rcon_has($b, 'picPhone'))   $data['picPhone']   = trim(_rcon_str($b['picPhone']));
            if (_rcon_has($b, 'email'))      $data['email']      = _rcon_truthy($b['email']) ? trim(_rcon_str($b['email'])) : null;
            if (_rcon_has($b, 'description')) $data['description'] = _rcon_truthy($b['description']) ? _rcon_str($b['description']) : null;
            if (_rcon_has($b, 'order'))      $data['order']      = _rcon_int_or($b['order'], 0);
            if (_rcon_has($b, 'published'))  $data['published']  = _rcon_bool($b['published']) ? 1 : 0;
            $existing = _rcon_find('RegionalBranch', $id);
            if (!$existing) fail('Gagal memperbarui jaringan daerah.', 500);
            if (count($data) > 0 || in_array('RegionalBranch', RCON_HAS_UPDATED_AT, true)) {
                db_update('RegionalBranch', $data, '"id" = ?', array($id));
            }
            $fresh = _rcon_find('RegionalBranch', $id);
            _rcon_audit($user, 'UPDATE', 'RegionalBranch', $id, isset($fresh['name']) ? $fresh['name'] : null);
            ok($fresh);
        } catch (Exception $e) {
            fail('Gagal memperbarui jaringan daerah.', 500);
        }
    }
}

if (!function_exists('_rcon_branches_delete')) {
    function _rcon_branches_delete($id) {
        $user = _rcon_guard_content();
        try {
            $existing = _rcon_find('RegionalBranch', $id);
            if (!$existing) fail('Gagal menghapus jaringan daerah.', 500);
            db_delete('RegionalBranch', '"id" = ?', array($id));
            _rcon_audit($user, 'DELETE', 'RegionalBranch', $id, isset($existing['name']) ? $existing['name'] : null);
            ok(array('success' => true));
        } catch (Exception $e) {
            fail('Gagal menghapus jaringan daerah.', 500);
        }
    }
}

/* ===========================================================================
 * ENTRY POINT MODUL — dispatcher utama
 * ========================================================================= */

/**
 * Router konten: dipanggil index.php untuk SETIAP request.
 * $seg contoh: ['articles'], ['articles','abc123'], ['articles','slug',
 * 'panduan-umrah'], ['resources','abc123','download'].
 * Bukan domain modul ini → return false (tanpa output).
 */
function routes_content(string $method, array $seg): bool {
    $resource = isset($seg[0]) ? (string) $seg[0] : '';
    switch ($resource) {
        case 'articles':    return _rcon_articles($method, $seg);
        case 'tutorials':   return _rcon_tutorials($method, $seg);
        case 'faqs':        return _rcon_faqs($method, $seg);
        case 'testimonials': return _rcon_testimonials($method, $seg);
        case 'ecosystems':  return _rcon_ecosystems($method, $seg);
        case 'journey':     return _rcon_journey($method, $seg);
        case 'roadmap':     return _rcon_roadmap($method, $seg);
        case 'gallery':     return _rcon_gallery($method, $seg);
        case 'events':      return _rcon_events($method, $seg);
        case 'resources':   return _rcon_resources($method, $seg);
        case 'management':  return _rcon_management($method, $seg);
        case 'branches':    return _rcon_branches($method, $seg);
        default:
            return false; // bukan domain modul konten
    }
}
