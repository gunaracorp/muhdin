<?php
/**
 * ============================================================================
 * routes-directory.php — Modul rute "directory" MUHDIN (Shared Hosting)
 * ----------------------------------------------------------------------------
 * Rekonstruksi Task 30-b-3 (2026-09-21) — paritas kontrak 1:1 dengan backend
 * Node (src/app/api/**). Satu fungsi publik:
 *
 *   routes_directory(string $method, array $seg): bool
 *     → TRUE  : request ditangani, respons JSON/CSV/XML sudah terkirim
 *               (ok()/fail() exit otomatis — paritas `return ok(...)` Node)
 *     → FALSE : bukan domain modul ini, router mencoba modul berikutnya
 *
 * Rute yang direplikasi (sumber Node → handler):
 *   GET    /api                         → src/app/api/route.ts (info endpoint)
 *   GET    /api/members                 → members/route.ts   (publik; filter
 *           type/status("all"|<status>|default TERVERIFIKASI)/q + log Audit)
 *   POST   /api/members                 → members/route.ts   (SUPER_ADMIN/ADMIN)
 *   GET    /api/members/verify          → members/verify/route.ts (publik)
 *   POST   /api/members/verify          → alias verifikasi/penolakan keanggotaan
 *           (instruksi Task 30-b-3; Node tidak memiliki rute ini — logika
 *           ditiru dari PUT applications/[id], audit VERIFY/REJECT)
 *   GET    /api/members/[id]            → penambahan Task (Node: hanya PUT/DELETE)
 *   PUT    /api/members/[id]            → members/[id]/route.ts (S/A/VERIFIKATOR)
 *   DELETE /api/members/[id]            → members/[id]/route.ts (SUPER_ADMIN/ADMIN)
 *   GET    /api/applications            → applications/route.ts (guardAdmin)
 *   POST   /api/applications            → applications/route.ts (publik + rate
 *           limit + tiket MHD-XXXXXX + notifikasi WA)
 *   GET    /api/applications/track      → applications/track/route.ts (publik)
 *   GET    /api/applications/[id]       → penambahan Task (guardAdmin)
 *   PUT    /api/applications/[id]       → applications/[id]/route.ts (approve →
 *           AUTO-CREATE Member, reject wajib alasan; audit APPROVE/REJECT)
 *   DELETE /api/applications/[id]       → applications/[id]/route.ts (S/A)
 *   GET    /api/messages                → messages/route.ts (guardAdmin)
 *   POST   /api/messages                → messages/route.ts (publik + rate limit
 *           + notifikasi WA)
 *   GET    /api/messages/[id]           → penambahan Task (guardAdmin)
 *   PUT    /api/messages/[id]           → messages/[id]/route.ts (S/A)
 *   DELETE /api/messages/[id]           → messages/[id]/route.ts (S/A + audit)
 *   GET    /api/complaints              → complaints/route.ts (guardAdmin)
 *   POST   /api/complaints              → complaints/route.ts (publik + rate
 *           limit + notifikasi WA)
 *   GET    /api/complaints/[id]         → penambahan Task (guardAdmin)
 *   PUT    /api/complaints/[id]         → complaints/[id]/route.ts (S/A/V;
 *           status UNREAD/PROCESSED/CLOSED + jejak responden + audit)
 *   DELETE /api/complaints/[id]         → complaints/[id]/route.ts (S/A + audit)
 *   GET    /api/subscribers             → subscribers/route.ts (S/A)
 *   POST   /api/subscribers             → subscribers/route.ts (publik + rate
 *           limit; email duplikat → 201 {ok:true,already:true})
 *   PUT    /api/subscribers/[id]        → subscribers/[id]/route.ts (S/A)
 *   DELETE /api/subscribers/[id]        → subscribers/[id]/route.ts (S/A)
 *   GET    /api/export?type=…           → export/route.ts (CSV + BOM + audit)
 *   GET    /api/search?q=…              → search/route.ts (publik, lintas entitas)
 *   GET    /api/rss                     → rss/route.ts (feed RSS 2.0, 20 artikel)
 *
 * Deviasi terdokumentasi (menjaga paritas default):
 *   1) GET members menerima param OPSIONAL province, city (filter eksak) dan
 *      page/limit|pageSize (pagination) sesuai instruksi Task — Node asli
 *      mengabaikannya; TANPA parameter tersebut respons identik Node.
 *   2) GET members/[id], GET applications/[id], GET messages/[id],
 *      GET complaints/[id], POST members/verify tidak ada di Node —
 *      diimplementasikan karena diminta eksplisit oleh Task 30-b-3.
 *   3) LIKE `contains` meng-escape % _ \ (+ ESCAPE '\') — aman wildcard;
 *      perilaku default untuk input biasa identik Prisma.
 *   4) Rute milik modul ini dengan metode tak didukung → fail 405
 *      (Next.js: 405 tanpa body); seg lebih dalam → return false (404 router).
 *
 * Gaya: PHP 7.4+ kompatibel (tanpa enum/readonly/named args/match/nullsafe),
 * DRY via helper privat berprefiks dir_*, tanggal ditulis epoch-ms (now_ms())
 * dan dinormalkan ISO-8601 saat output oleh cast_row() di lib.php.
 * ============================================================================
 */

require_once __DIR__ . '/config.php';
require_once __DIR__ . '/lib.php';

/* ===========================================================================
 * 1. HELPER PRIVAT KECIL — semantik JavaScript (paritas mikro Node)
 * ========================================================================= */

/** Paritas `String(body.x || "")`: nilai falsy JS → "" (catatan: "0" tetap "0"). */
function dir_str($v) {
    if ($v === null || is_array($v)) return '';
    if ($v === false) return '';
    if ($v === true) return 'true';
    if (is_int($v)) return (string) $v;
    if (is_float($v)) return (string) $v;
    if (is_string($v)) return $v; // "0" tetap "0" (berbeda dari falsy PHP)
    return (string) $v;
}

/** Paritas `String(v)` mentah: null → "null", true → "true" (dipakai jalur
 *  update `body.x !== undefined` Node). */
function dir_str_raw($v) {
    if ($v === null) return 'null';
    return dir_str($v);
}

/** Paritas truthiness JavaScript: "0" adalah truthy (berbeda dari PHP!). */
function dir_truthy($v) {
    if ($v === null || $v === false) return false;
    if ($v === true) return true;
    if (is_int($v)) return $v !== 0;
    if (is_float($v)) return !is_nan($v) && $v != 0.0;
    if (is_string($v)) return $v !== '';
    if (is_array($v)) return true;
    return (bool) $v;
}

/** Paritas parseInt(value, 10) + `|| default`: gagal parse / 0 → default. */
function dir_parse_int_or($v, $def) {
    if ($v === null || is_array($v) || $v === false || $v === true) return $def;
    $s = is_string($v) ? $v : (string) $v;
    if (!preg_match('/^\s*([+-]?\d+)/', $s, $m)) return $def; // NaN → default
    $n = (int) $m[1];
    return $n !== 0 ? $n : $def; // 0 falsy di JS
}

/** Paritas parseFloat(value) + `|| default`: gagal parse / 0 → default. */
function dir_parse_float_or($v, $def) {
    if ($v === null || is_array($v) || $v === false || $v === true) return $def;
    $s = is_string($v) ? $v : (string) $v;
    if (!preg_match('/^\s*([+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?)/', $s, $m)) {
        return $def; // NaN → default
    }
    $f = (float) $m[1];
    return $f != 0.0 ? $f : $def; // 0 falsy di JS
}

/** Param GET (null bila absen) — paritas sp.get(name) || undefined. */
function dir_param($name) {
    if (!isset($_GET[$name])) return null;
    $v = $_GET[$name];
    return is_string($v) ? $v : dir_str($v);
}

/** Panjang string paritas JS .length (char, bukan byte). */
function dir_len($s) {
    return function_exists('mb_strlen') ? mb_strlen((string) $s, 'UTF-8') : strlen((string) $s);
}

/** Validasi email — regex PERSIS Node: /^[^@\s]+@[^@\s]+\.[^@\s]+$/ (anchor $ = ujung string). */
function dir_email_valid($email) {
    return preg_match('/^[^@\s]+@[^@\s]+\.[^@\s]+$/D', (string) $email) === 1;
}

/** Pola LIKE `%q%` dengan escape wildcard (paritas `contains` Prisma). */
function dir_like_param($q) {
    $e = str_replace(array('\\', '%', '_'), array('\\\\', '\\%', '\\_'), (string) $q);
    return '%' . $e . '%';
}

/** Klausa `(col LIKE ? ESCAPE '\' OR ...)` untuk daftar kolom. */
function dir_like_clause(array $cols) {
    $parts = array();
    foreach ($cols as $c) {
        $parts[] = '"' . $c . '" LIKE ? ESCAPE \'\\\'';
    }
    return '(' . implode(' OR ', $parts) . ')';
}

/** Tahun berjalan (paritas new Date().getFullYear()). */
function dir_year() {
    return (int) date('Y');
}

/** Baris berdasarkan id (auto-cast per tabel) atau null. */
function dir_row_by_id($table, $id) {
    return db_one('SELECT * FROM "' . $table . '" WHERE "id" = ?', array($id), $table);
}

/** Kirim respons NON-JSON mentah (CSV/RSS) lalu hentikan eksekusi. */
function dir_send_raw($body, $status, array $headers = array()) {
    if (!headers_sent()) {
        http_response_code((int) $status);
        foreach ($headers as $h) {
            header($h);
        }
    }
    echo $body;
    exit;
}

/** Escape sel CSV: bungkus bila mengandung koma/kutip/baris baru (paritas Node). */
function dir_csv_value($v) {
    if ($v === null) return '';          // null/undefined → ""
    if (is_bool($v)) return $v ? '1' : '0'; // boolean → "1"/"0"
    if (is_float($v)) return (string) $v;
    $s = (string) $v;
    if (preg_match('/[",\r\n]/', $s)) {
        return '"' . str_replace('"', '""', $s) . '"';
    }
    return $s;
}

/** Escape karakter khusus XML — urutan persis Node (& pertama!). */
function dir_xml_escape($s) {
    $s = (string) $s;
    $s = str_replace('&', '&amp;', $s);
    $s = str_replace('<', '&lt;', $s);
    $s = str_replace('>', '&gt;', $s);
    $s = str_replace('"', '&quot;', $s);
    $s = str_replace("'", '&apos;', $s);
    return $s;
}

/** ISO-8601 → RFC 1123 (paritas Date.toUTCString(): "Mon, 21 Sep 2026 07:00:00 GMT"). */
function dir_utc_rfc1123($iso) {
    $t = strtotime((string) $iso);
    if ($t === false) $t = time();
    return gmdate('D, d M Y H:i:s', $t) . ' GMT';
}

/* ===========================================================================
 * 2. ANGGOTA — paritas src/app/api/members/**
 * ========================================================================= */

/** GET /api/members — publik; filter type/status/q (+opsi province, city,
 *  page+limit|pageSize sesuai Task). Status: "all" = tanpa filter, selain itu
 *  eksak, default TERVERIFIKASI. Order: status ASC, name ASC. */
function dir_members_list() {
    try {
        $where = array();
        $params = array();

        $type = dir_param('type');
        if ($type !== null && $type !== '') {
            $where[] = '"type" = ?';
            $params[] = $type;
        }
        $province = dir_param('province'); // opsi Task (Node mengabaikan)
        if ($province !== null && $province !== '') {
            $where[] = '"province" = ?';
            $params[] = $province;
        }
        $city = dir_param('city'); // opsi Task (Node mengabaikan)
        if ($city !== null && $city !== '') {
            $where[] = '"city" = ?';
            $params[] = $city;
        }

        $status = dir_param('status');
        if ($status === 'all') {
            /* admin: semua status */
        } elseif ($status !== null && $status !== '') {
            $where[] = '"status" = ?';
            $params[] = $status;
        } else {
            $where[] = '"status" = ?';
            $params[] = 'TERVERIFIKASI';
        }

        $q = dir_param('q');
        if ($q !== null && $q !== '') {
            $like = dir_like_param($q);
            $where[] = dir_like_clause(array('name', 'city', 'licenseNo'));
            array_push($params, $like, $like, $like);
        }

        $sql = 'SELECT * FROM "Member"'
            . (count($where) > 0 ? ' WHERE ' . implode(' AND ', $where) : '')
            . ' ORDER BY "status" ASC, "name" ASC';

        // Pagination opsi Task (Node tidak memilikinya; default = seluruh baris).
        $limit = parse_int_or(dir_param('limit'), parse_int_or(dir_param('pageSize'), 0));
        if ($limit > 0) {
            $page = parse_int_or(dir_param('page'), 1);
            if ($page < 1) $page = 1;
            $sql .= ' LIMIT ' . $limit . ' OFFSET ' . (($page - 1) * $limit);
        }

        $members = db_all($sql, $params, 'Member');
        // Paritas applyEntityTranslations (locale ?locale=en|ar, field description).
        $localized = apply_translations($members, 'Member', locale_from_request(), null, array('description'));
        ok($localized);
    } catch (Exception $e) {
        fail('Gagal memuat anggota.', 500);
    }
}

/** GET /api/members/[id] — publik (penambahan Task). */
function dir_members_get($id) {
    $member = dir_row_by_id('Member', $id);
    if (!$member) {
        fail('Anggota tidak ditemukan.', 404);
    }
    ok($member);
}

/** POST /api/members — SUPER_ADMIN/ADMIN (paritas Node). */
function dir_members_create() {
    $user = guard_role(array('SUPER_ADMIN', 'ADMIN'));
    try {
        $body = request_json();
        if (!is_array($body)) {
            throw new RuntimeException('Body JSON tidak valid.');
        }
        $nameB = isset($body['name']) ? $body['name'] : null;
        $licB = isset($body['licenseNo']) ? $body['licenseNo'] : null;
        if (!dir_truthy($nameB) || !dir_truthy($licB)) {
            fail('Nama dan nomor izin wajib diisi.');
        }
        $typeB = isset($body['type']) ? $body['type'] : null;
        $statusB = isset($body['status']) ? $body['status'] : null;
        $data = array(
            'name'       => dir_str($nameB),
            'type'       => dir_str(dir_truthy($typeB) ? $typeB : 'PPIU'),
            'city'       => dir_str(isset($body['city']) ? $body['city'] : null),
            'province'   => dir_str(isset($body['province']) ? $body['province'] : null),
            'licenseNo'  => dir_str($licB),
            'phone'      => dir_truthy(isset($body['phone']) ? $body['phone'] : null) ? dir_str($body['phone']) : null,
            'email'      => dir_truthy(isset($body['email']) ? $body['email'] : null) ? dir_str($body['email']) : null,
            'website'    => dir_truthy(isset($body['website']) ? $body['website'] : null) ? dir_str($body['website']) : null,
            'description'=> dir_truthy(isset($body['description']) ? $body['description'] : null) ? dir_str($body['description']) : null,
            'rating'     => dir_parse_float_or(isset($body['rating']) ? $body['rating'] : null, 4.5),
            'status'     => dir_str(dir_truthy($statusB) ? $statusB : 'TERVERIFIKASI'),
            'memberSince'=> dir_parse_int_or(isset($body['memberSince']) ? $body['memberSince'] : null, dir_year()),
        );
        $id = db_insert('Member', $data);
        // Task 18 — jejak audit pembuatan anggota.
        log_audit($user, 'CREATE', 'Member', $id, $data['name']);
        ok(dir_row_by_id('Member', $id), 201);
    } catch (Exception $e) {
        fail('Gagal menambah anggota.', 500);
    }
}

/** PUT /api/members/[id] — SUPER_ADMIN/ADMIN/VERIFIKATOR (paritas Node Task 17). */
function dir_members_update($id) {
    $user = guard_role(array('SUPER_ADMIN', 'ADMIN', 'VERIFIKATOR'));
    try {
        $body = request_json();
        if (!is_array($body)) {
            throw new RuntimeException('Body JSON tidak valid.');
        }
        // Prisma update pada id tak dikenal melempar error → Node 500.
        if (!dir_row_by_id('Member', $id)) {
            fail('Gagal memperbarui anggota.', 500);
        }
        $data = array();
        if (array_key_exists('name', $body))       $data['name'] = dir_str_raw($body['name']);
        if (array_key_exists('type', $body))       $data['type'] = dir_str_raw($body['type']);
        if (array_key_exists('city', $body))       $data['city'] = dir_str_raw($body['city']);
        if (array_key_exists('province', $body))   $data['province'] = dir_str_raw($body['province']);
        if (array_key_exists('licenseNo', $body))  $data['licenseNo'] = dir_str_raw($body['licenseNo']);
        if (array_key_exists('phone', $body))      $data['phone'] = dir_truthy($body['phone']) ? dir_str_raw($body['phone']) : null;
        if (array_key_exists('email', $body))      $data['email'] = dir_truthy($body['email']) ? dir_str_raw($body['email']) : null;
        if (array_key_exists('website', $body))    $data['website'] = dir_truthy($body['website']) ? dir_str_raw($body['website']) : null;
        if (array_key_exists('description', $body))$data['description'] = dir_truthy($body['description']) ? dir_str_raw($body['description']) : null;
        if (array_key_exists('rating', $body))     $data['rating'] = dir_parse_float_or($body['rating'], 4.5);
        if (array_key_exists('status', $body))     $data['status'] = dir_str_raw($body['status']);
        if (array_key_exists('memberSince', $body))$data['memberSince'] = dir_parse_int_or($body['memberSince'], dir_year());
        db_update('Member', $data, '"id" = ?', array($id));
        $member = dir_row_by_id('Member', $id);
        // Task 18 — jejak audit pemutakhiran anggota.
        log_audit($user, 'UPDATE', 'Member', $id, $member['name']);
        ok($member);
    } catch (Exception $e) {
        fail('Gagal memperbarui anggota.', 500);
    }
}

/** DELETE /api/members/[id] — SUPER_ADMIN/ADMIN (paritas Node). */
function dir_members_delete($id) {
    $user = guard_role(array('SUPER_ADMIN', 'ADMIN'));
    try {
        // Prisma delete pada id tak dikenal melempar error → Node 500.
        if (!dir_row_by_id('Member', $id)) {
            fail('Gagal menghapus anggota.', 500);
        }
        db_delete('Member', '"id" = ?', array($id));
        // Task 18 — jejak audit penghapusan anggota.
        log_audit($user, 'DELETE', 'Member', $id);
        ok(array('success' => true));
    } catch (Exception $e) {
        fail('Gagal menghapus anggota.', 500);
    }
}

/** GET /api/members/verify — publik; cek legalitas penyelenggara (paritas Node). */
function dir_members_verify_get() {
    try {
        $raw = dir_param('q');
        $q = trim((string) ($raw === null ? '' : $raw));
        if (dir_len($q) < 3) {
            fail('Masukkan minimal 3 karakter nama penyelenggara atau nomor izin.');
        }
        $like = dir_like_param($q);
        $matches = db_all(
            'SELECT * FROM "Member" WHERE ' . dir_like_clause(array('name', 'licenseNo')) .
            ' ORDER BY "name" ASC LIMIT 10',
            array($like, $like),
            'Member'
        );
        $notFound = count($matches) === 0;
        $allSuspended = !$notFound;
        foreach ($matches as $m) {
            if ($m['status'] !== 'SUSPENDED') {
                $allSuspended = false;
                break;
            }
        }
        ok(array(
            'query'   => $q,
            'found'   => !$notFound,
            'warning' => $allSuspended
                ? 'Seluruh hasil ditemukan berstatus DITANGGUHKAN. Jangan bertransaksi.'
                : null,
            'results' => $matches,
        ));
    } catch (Exception $e) {
        fail('Gagal memverifikasi.', 500);
    }
}

/**
 * POST /api/members/verify — verifikasi/penolakan keanggotaan dengan alasan
 * (instruksi Task 30-b-3; Node tidak memiliki rute POST ini). Logika ditiru
 * PERSIS dari PUT /api/applications/[id]: approve → status APPROVED + auto
 * create Member; reject → wajib reviewNote ≥ 5 karakter. Aksi audit mengikuti
 * kontrak Task: VERIFY (setujui) / REJECT (tolak).
 * Body: { applicationId|id, action: "approve"|"reject", reviewNote? }
 */
function dir_members_verify_post() {
    $user = guard_role(array('SUPER_ADMIN', 'ADMIN', 'VERIFIKATOR'));
    $body = request_json();
    if (!is_array($body)) {
        $body = array();
    }
    $id = '';
    foreach (array('applicationId', 'id') as $key) {
        if (isset($body[$key]) && trim(dir_str($body[$key])) !== '') {
            $id = trim(dir_str($body[$key]));
            break;
        }
    }
    if ($id === '') {
        fail('ID pendaftaran wajib diisi.');
    }
    $action = strtolower(trim(dir_str(isset($body['action']) ? $body['action'] : '')));
    $note = trim(dir_str(isset($body['reviewNote']) ? $body['reviewNote'] : ''));
    if ($action === 'approve') {
        dir_review_application($user, $id, 'approve', $note, 'VERIFY'); // ok()/fail() exit
    }
    if ($action === 'reject') {
        dir_review_application($user, $id, 'reject', $note, 'REJECT');
    }
    fail('Aksi tidak dikenal.');
}

/* ===========================================================================
 * 3. PENDAFTARAN — paritas src/app/api/applications/**
 * ========================================================================= */

/** GET /api/applications — guardAdmin; order createdAt DESC. */
function dir_applications_list() {
    guard_admin();
    try {
        $applications = db_all(
            'SELECT * FROM "MembershipApplication" ORDER BY "createdAt" DESC',
            array(),
            'MembershipApplication'
        );
        ok($applications);
    } catch (Exception $e) {
        fail('Gagal memuat pendaftaran.', 500);
    }
}

/** GET /api/applications/[id] — guardAdmin (penambahan Task). */
function dir_applications_get($id) {
    guard_admin();
    $app = dir_row_by_id('MembershipApplication', $id);
    if (!$app) {
        fail('Pendaftaran tidak ditemukan.', 404);
    }
    ok($app);
}

/** POST /api/applications — publik; rate limit 5/menit/IP; tiket MHD-XXXXXX;
 *  notifikasi WhatsApp gagal-aman (paritas Node Task 18). */
function dir_applications_create() {
    // Task 18 — rem spam: maksimal 5 pendaftaran/menit per IP.
    if (!rate_limit('applications')) {
        fail('Terlalu banyak percobaan. Coba lagi beberapa saat.', 429);
    }
    try {
        $body = request_json();
        if (!is_array($body)) {
            throw new RuntimeException('Body JSON tidak valid.');
        }
        $required = array('orgName', 'type', 'contactName', 'email', 'phone', 'city', 'licenseNo');
        foreach ($required as $f) {
            $val = isset($body[$f]) ? $body[$f] : null;
            if (trim(dir_str($val)) === '') {
                fail('Kolom ' . $f . ' wajib diisi.');
            }
        }
        $email = trim(dir_str($body['email']));
        if (!dir_email_valid($email)) {
            fail('Format email tidak valid.');
        }
        $msgB = isset($body['message']) ? $body['message'] : null;
        $provB = isset($body['province']) ? $body['province'] : null;
        $data = array(
            'orgName'     => trim(dir_str($body['orgName'])),
            'type'        => trim(dir_str($body['type'])),
            'contactName' => trim(dir_str($body['contactName'])),
            'email'       => $email,
            'phone'       => trim(dir_str($body['phone'])),
            'city'        => trim(dir_str($body['city'])),
            'province'    => trim(dir_str($provB)),
            'licenseNo'   => trim(dir_str($body['licenseNo'])),
            'message'     => dir_truthy($msgB) ? dir_str($msgB) : null,
            'ticketCode'  => ticket_code(), // Task 18 — kode pelacakan publik
        );
        $id = db_insert('MembershipApplication', $data);
        $app = dir_row_by_id('MembershipApplication', $id);
        // Task 15-d/18 — notifikasi WhatsApp (fire-and-forget, gagal-aman).
        notify_membership_application(array(
            'orgName'     => $app['orgName'],
            'type'        => $app['type'],
            'contactName' => $app['contactName'],
            'email'       => $app['email'],
            'phone'       => $app['phone'],
            'city'        => $app['city'],
            'licenseNo'   => $app['licenseNo'],
            'ticketCode'  => $app['ticketCode'],
        ));
        ok($app, 201);
    } catch (Exception $e) {
        fail('Gagal mengirim pendaftaran.', 500);
    }
}

/** GET /api/applications/track?code=… — PUBLIK; info terbatas non-sensitif. */
function dir_applications_track() {
    try {
        $raw = dir_param('code');
        $code = strtoupper(trim((string) ($raw === null ? '' : $raw)));
        if (dir_len($code) < 5) {
            fail('Masukkan kode tiket (contoh: MHD-TKKN8Z). Kode minimal 5 karakter.');
        }
        // Kode tiket tersimpan huruf besar; input di-uppercase → pencarian eksak.
        $app = db_one(
            'SELECT * FROM "MembershipApplication" WHERE "ticketCode" = ? LIMIT 1',
            array($code),
            'MembershipApplication'
        );
        if (!$app) {
            fail('Kode tiket tidak ditemukan. Periksa kembali.', 404);
        }
        ok(array(
            'found'       => true,
            'ticketCode'  => $app['ticketCode'],
            'orgName'     => $app['orgName'],
            'type'        => $app['type'],
            'status'      => $app['status'],
            'submittedAt' => $app['createdAt'],
            'reviewedAt'  => $app['reviewedAt'],
            'reviewNote'  => $app['reviewNote'],
        ));
    } catch (Exception $e) {
        fail('Gagal melacak pendaftaran.', 500);
    }
}

/**
 * Inti review pendaftaran — paritas PUT /api/applications/[id] Node:
 *   approve → status APPROVED (+ auto-create Member bila licenseNo belum ada),
 *             audit "APPROVE" detail "Setujui {orgName}"
 *   reject  → reviewNote wajib ≥ 5 karakter, status REJECTED,
 *             audit "REJECT" detail "Tolak {orgName}"
 * $auditApprove: "APPROVE" (rute Node) atau "VERIFY" (alias POST members/verify).
 */
function dir_review_application($me, $id, $action, $note, $auditApprove) {
    try {
        $existing = dir_row_by_id('MembershipApplication', $id);
        // Prisma update pada id tak dikenal melempar error → Node 500.
        if (!$existing) {
            fail('Gagal memproses pendaftaran.', 500);
        }
        $reviewedBy = (isset($me['name']) && dir_str($me['name']) !== '') ? $me['name'] : null;

        if ($action === 'approve') {
            db_update('MembershipApplication', array(
                'status'     => 'APPROVED',
                'reviewNote' => $note !== '' ? $note : null,
                'reviewedBy' => $reviewedBy,
                'reviewedAt' => now_ms(),
            ), '"id" = ?', array($id));
            // Buat anggota otomatis dari pendaftaran yang disetujui (findFirst licenseNo).
            $dup = db_val('SELECT 1 FROM "Member" WHERE "licenseNo" = ? LIMIT 1', array($existing['licenseNo']));
            if (!$dup) {
                db_insert('Member', array(
                    'name'        => $existing['orgName'],
                    'type'        => $existing['type'],
                    'city'        => $existing['city'],
                    'province'    => $existing['province'],
                    'licenseNo'   => $existing['licenseNo'],
                    'phone'       => $existing['phone'],
                    'email'       => $existing['email'],
                    'status'      => 'TERVERIFIKASI',
                    'memberSince' => dir_year(),
                    'description' => $existing['message'],
                ));
            }
            $app = dir_row_by_id('MembershipApplication', $id);
            // Task 18 — jejak audit persetujuan.
            log_audit($me, $auditApprove, 'Application', $id, 'Setujui ' . $app['orgName']);
            ok($app);
        }

        if ($action === 'reject') {
            if (dir_len($note) < 5) {
                fail('Alasan penolakan wajib diisi (minimal 5 karakter) agar pencalar mendapat kejelasan.');
            }
            db_update('MembershipApplication', array(
                'status'     => 'REJECTED',
                'reviewNote' => $note,
                'reviewedBy' => $reviewedBy,
                'reviewedAt' => now_ms(),
            ), '"id" = ?', array($id));
            $app = dir_row_by_id('MembershipApplication', $id);
            // Task 18 — jejak audit penolakan.
            log_audit($me, 'REJECT', 'Application', $id, 'Tolak ' . $app['orgName']);
            ok($app);
        }

        fail('Aksi tidak dikenal.');
    } catch (Exception $e) {
        fail('Gagal memproses pendaftaran.', 500);
    }
}

/** PUT /api/applications/[id] — S/A/VERIFIKATOR; approve/reject (paritas Node Task 17). */
function dir_applications_update($id) {
    $me = guard_role(array('SUPER_ADMIN', 'ADMIN', 'VERIFIKATOR'));
    $body = request_json();
    if (!is_array($body)) {
        fail('Gagal memproses pendaftaran.', 500); // Node: req.json() gagal → catch
    }
    $action = dir_str(isset($body['action']) ? $body['action'] : '');
    $note = trim(dir_str(isset($body['reviewNote']) ? $body['reviewNote'] : ''));
    if ($action === 'approve') {
        dir_review_application($me, $id, 'approve', $note, 'APPROVE');
    }
    if ($action === 'reject') {
        dir_review_application($me, $id, 'reject', $note, 'REJECT');
    }
    fail('Aksi tidak dikenal.');
}

/** DELETE /api/applications/[id] — SUPER_ADMIN/ADMIN (paritas Node). */
function dir_applications_delete($id) {
    guard_role(array('SUPER_ADMIN', 'ADMIN'));
    try {
        // Prisma delete pada id tak dikenal melempar error → Node 500.
        if (!dir_row_by_id('MembershipApplication', $id)) {
            fail('Gagal menghapus pendaftaran.', 500);
        }
        db_delete('MembershipApplication', '"id" = ?', array($id));
        ok(array('success' => true));
    } catch (Exception $e) {
        fail('Gagal menghapus pendaftaran.', 500);
    }
}

/* ===========================================================================
 * 4. PESAN KONTAK — paritas src/app/api/messages/**
 * ========================================================================= */

/** GET /api/messages — guardAdmin; filter status opsional; createdAt DESC. */
function dir_messages_list() {
    guard_admin();
    try {
        $status = dir_param('status');
        $params = array();
        $sql = 'SELECT * FROM "ContactMessage"';
        if ($status !== null && $status !== '') {
            $sql .= ' WHERE "status" = ?';
            $params[] = $status;
        }
        $sql .= ' ORDER BY "createdAt" DESC';
        ok(db_all($sql, $params, 'ContactMessage'));
    } catch (Exception $e) {
        fail('Gagal memuat pesan.', 500);
    }
}

/** POST /api/messages — publik; rate limit 5/menit/IP + notifikasi WA. */
function dir_messages_create() {
    // Task 18 — rem spam: maksimal 5 pesan/menit per IP.
    if (!rate_limit('messages')) {
        fail('Terlalu banyak percobaan. Coba lagi beberapa saat.', 429);
    }
    try {
        $body = request_json();
        if (!is_array($body)) {
            throw new RuntimeException('Body JSON tidak valid.');
        }
        $name = trim(dir_str(isset($body['name']) ? $body['name'] : null));
        $email = trim(dir_str(isset($body['email']) ? $body['email'] : null));
        $message = trim(dir_str(isset($body['message']) ? $body['message'] : null));
        $subject = trim(dir_str(isset($body['subject']) ? $body['subject'] : null));
        if ($name === '' || $email === '' || $message === '' || $subject === '') {
            fail('Nama, email, subjek, dan pesan wajib diisi.');
        }
        if (!dir_email_valid($email)) {
            fail('Format email tidak valid.');
        }
        $phoneB = isset($body['phone']) ? $body['phone'] : null;
        $id = db_insert('ContactMessage', array(
            'name'    => $name,
            'email'   => $email,
            'subject' => $subject,
            'message' => $message,
            'phone'   => dir_truthy($phoneB) ? dir_str($phoneB) : null,
        ));
        $msg = dir_row_by_id('ContactMessage', $id);
        // Task 15-d — notifikasi WhatsApp (fire-and-forget, gagal-aman).
        notify_contact_message(array(
            'name'    => $name,
            'email'   => $email,
            'phone'   => $msg['phone'],
            'subject' => $subject,
            'message' => $message,
        ));
        ok($msg, 201);
    } catch (Exception $e) {
        fail('Gagal mengirim pesan.', 500);
    }
}

/** GET /api/messages/[id] — guardAdmin (penambahan Task). */
function dir_messages_get($id) {
    guard_admin();
    $msg = dir_row_by_id('ContactMessage', $id);
    if (!$msg) {
        fail('Pesan tidak ditemukan.', 404);
    }
    ok($msg);
}

/** PUT /api/messages/[id] — S/A; ubah status (default "READ" — paritas Node). */
function dir_messages_update($id) {
    guard_role(array('SUPER_ADMIN', 'ADMIN'));
    try {
        // Prisma update pada id tak dikenal melempar error → Node 500.
        if (!dir_row_by_id('ContactMessage', $id)) {
            fail('Gagal memperbarui pesan.', 500);
        }
        $body = request_json();
        if (!is_array($body)) {
            throw new RuntimeException('Body JSON tidak valid.');
        }
        $statusB = isset($body['status']) ? $body['status'] : null;
        $status = dir_str(dir_truthy($statusB) ? $statusB : 'READ');
        db_update('ContactMessage', array('status' => $status), '"id" = ?', array($id));
        ok(dir_row_by_id('ContactMessage', $id));
    } catch (Exception $e) {
        fail('Gagal memperbarui pesan.', 500);
    }
}

/** DELETE /api/messages/[id] — S/A + audit (paritas Node Task 18). */
function dir_messages_delete($id) {
    $user = guard_role(array('SUPER_ADMIN', 'ADMIN'));
    try {
        // Prisma delete pada id tak dikenal melempar error → Node 500.
        if (!dir_row_by_id('ContactMessage', $id)) {
            fail('Gagal menghapus pesan.', 500);
        }
        db_delete('ContactMessage', '"id" = ?', array($id));
        // Task 18 — jejak audit penghapusan pesan.
        log_audit($user, 'DELETE', 'Message', $id);
        ok(array('success' => true));
    } catch (Exception $e) {
        fail('Gagal menghapus pesan.', 500);
    }
}

/* ===========================================================================
 * 5. PENGADUAN JAMAAH — paritas src/app/api/complaints/**
 * ========================================================================= */

/** GET /api/complaints — guardAdmin; filter status opsional; createdAt DESC. */
function dir_complaints_list() {
    guard_admin();
    try {
        $status = dir_param('status');
        $params = array();
        $sql = 'SELECT * FROM "Complaint"';
        if ($status !== null && $status !== '') {
            $sql .= ' WHERE "status" = ?';
            $params[] = $status;
        }
        $sql .= ' ORDER BY "createdAt" DESC';
        ok(db_all($sql, $params, 'Complaint'));
    } catch (Exception $e) {
        fail('Gagal memuat pengaduan.', 500);
    }
}

/** POST /api/complaints — publik; rate limit 5/menit/IP + notifikasi WA. */
function dir_complaints_create() {
    // Task 18 — rem spam: maksimal 5 pengaduan/menit per IP.
    if (!rate_limit('complaints')) {
        fail('Terlalu banyak percobaan. Coba lagi beberapa saat.', 429);
    }
    try {
        $body = request_json();
        if (!is_array($body)) {
            throw new RuntimeException('Body JSON tidak valid.');
        }
        $name = trim(dir_str(isset($body['name']) ? $body['name'] : null));
        $email = trim(dir_str(isset($body['email']) ? $body['email'] : null));
        $content = trim(dir_str(isset($body['content']) ? $body['content'] : null));
        if ($name === '' || $email === '' || $content === '') {
            fail('Nama, email, dan isi laporan wajib diisi.');
        }
        if (!dir_email_valid($email)) {
            fail('Format email tidak valid.');
        }
        $phoneB = isset($body['phone']) ? $body['phone'] : null;
        $targetB = isset($body['targetMember']) ? $body['targetMember'] : null;
        $catB = isset($body['category']) ? $body['category'] : null;
        $id = db_insert('Complaint', array(
            'name'         => $name,
            'email'        => $email,
            'phone'        => dir_truthy($phoneB) ? dir_str($phoneB) : null,
            'targetMember' => dir_truthy($targetB) ? dir_str($targetB) : null,
            'category'     => dir_str(dir_truthy($catB) ? $catB : 'Pelayanan'),
            'content'      => $content,
        ));
        $complaint = dir_row_by_id('Complaint', $id);
        // Task 15-d/18 — notifikasi WhatsApp (fire-and-forget, gagal-aman).
        notify_complaint(array(
            'name'        => $name,
            'targetMember' => $complaint['targetMember'],
            'category'    => $complaint['category'],
        ));
        ok($complaint, 201);
    } catch (Exception $e) {
        fail('Gagal mengirim pengaduan.', 500);
    }
}

/** GET /api/complaints/[id] — guardAdmin (penambahan Task). */
function dir_complaints_get($id) {
    guard_admin();
    $complaint = dir_row_by_id('Complaint', $id);
    if (!$complaint) {
        fail('Pengaduan tidak ditemukan.', 404);
    }
    ok($complaint);
}

/** PUT /api/complaints/[id] — S/A/VERIFIKATOR; status + catatan respons + jejak. */
function dir_complaints_update($id) {
    $me = guard_role(array('SUPER_ADMIN', 'ADMIN', 'VERIFIKATOR'));
    try {
        $body = request_json();
        if (!is_array($body)) {
            throw new RuntimeException('Body JSON tidak valid.');
        }
        $existing = dir_row_by_id('Complaint', $id);
        if (!$existing) {
            fail('Pengaduan tidak ditemukan.', 404); // paritas Node: pre-check 404
        }
        $allowed = array('UNREAD', 'PROCESSED', 'CLOSED');
        $data = array();
        $action = 'UPDATE';
        if (array_key_exists('status', $body)) {
            $status = dir_str($body['status']);
            if (!in_array($status, $allowed, true)) {
                fail('Status tidak valid.');
            }
            $data['status'] = $status;
            if ($status !== $existing['status'] && ($status === 'PROCESSED' || $status === 'CLOSED')) {
                $data['respondedBy'] = (isset($me['name']) && dir_str($me['name']) !== '') ? $me['name'] : null;
                $data['respondedAt'] = now_ms();
                $action = $status; // jejak audit mengikuti status baru
            }
        }
        if (array_key_exists('responseNote', $body)) {
            $data['responseNote'] = dir_truthy($body['responseNote']) ? dir_str_raw($body['responseNote']) : null;
        }
        db_update('Complaint', $data, '"id" = ?', array($id));
        $complaint = dir_row_by_id('Complaint', $id);
        log_audit($me, $action, 'Complaint', $id, 'Pengaduan dari ' . $existing['name']);
        ok($complaint);
    } catch (Exception $e) {
        fail('Gagal memperbarui pengaduan.', 500);
    }
}

/** DELETE /api/complaints/[id] — S/A + audit (paritas Node). */
function dir_complaints_delete($id) {
    $user = guard_role(array('SUPER_ADMIN', 'ADMIN'));
    try {
        // Prisma delete pada id tak dikenal melempar error → Node 500.
        if (!dir_row_by_id('Complaint', $id)) {
            fail('Gagal menghapus pengaduan.', 500);
        }
        db_delete('Complaint', '"id" = ?', array($id));
        log_audit($user, 'DELETE', 'Complaint', $id);
        ok(array('success' => true));
    } catch (Exception $e) {
        fail('Gagal menghapus pengaduan.', 500);
    }
}

/* ===========================================================================
 * 6. PELANGGAN NEWSLETTER — paritas src/app/api/subscribers/**
 * ========================================================================= */

/** GET /api/subscribers — SUPER_ADMIN/ADMIN; createdAt DESC. */
function dir_subscribers_list() {
    guard_role(array('SUPER_ADMIN', 'ADMIN'));
    try {
        ok(db_all('SELECT * FROM "Subscriber" ORDER BY "createdAt" DESC', array(), 'Subscriber'));
    } catch (Exception $e) {
        fail('Gagal memuat pelanggan.', 500);
    }
}

/** POST /api/subscribers — publik + rate limit; email duplikat → 201
 *  {ok:true,already:true} agar keberadaan email tak bisa diuji coba (Node P2002). */
function dir_subscribers_create() {
    // Task 18 — rem spam: maksimal 5 langganan/menit per IP.
    if (!rate_limit('subscribers')) {
        fail('Terlalu banyak percobaan. Coba lagi beberapa saat.', 429);
    }
    try {
        $body = request_json();
        if (!is_array($body)) {
            throw new RuntimeException('Body JSON tidak valid.');
        }
        $email = strtolower(trim(dir_str(isset($body['email']) ? $body['email'] : null)));
        if (!dir_email_valid($email)) {
            fail('Format email tidak valid.');
        }
        try {
            db_insert('Subscriber', array('email' => $email));
            ok(array('ok' => true, 'already' => false), 201);
        } catch (PDOException $e) {
            // Paritas P2002 (email unik): jangan bocorkan bahwa email sudah terdaftar.
            $code = $e->getCode();
            $info = $e->errorInfo;
            $constraint = ($code === '23000') || (isset($info[1]) && (int) $info[1] === 19);
            if ($constraint) {
                ok(array('ok' => true, 'already' => true), 201);
            }
            throw $e; // kesalahan lain → 500 di catch luar
        }
    } catch (Exception $e) {
        fail('Gagal mendaftarkan langganan.', 500);
    }
}

/** PUT /api/subscribers/[id] — S/A; aktifkan/nonaktifkan (paritas Node). */
function dir_subscribers_update($id) {
    guard_role(array('SUPER_ADMIN', 'ADMIN'));
    try {
        // Prisma update pada id tak dikenal melempar error → Node 500.
        if (!dir_row_by_id('Subscriber', $id)) {
            fail('Gagal memperbarui pelanggan.', 500);
        }
        $body = request_json();
        if (!is_array($body)) {
            throw new RuntimeException('Body JSON tidak valid.');
        }
        $isActive = dir_truthy(isset($body['isActive']) ? $body['isActive'] : null) ? 1 : 0;
        db_update('Subscriber', array('isActive' => $isActive), '"id" = ?', array($id));
        ok(dir_row_by_id('Subscriber', $id));
    } catch (Exception $e) {
        fail('Gagal memperbarui pelanggan.', 500); // pesan sama persis Node (juga untuk DELETE)
    }
}

/** DELETE /api/subscribers/[id] — S/A (paritas Node; pesan error identik PUT). */
function dir_subscribers_delete($id) {
    guard_role(array('SUPER_ADMIN', 'ADMIN'));
    try {
        // Prisma delete pada id tak dikenal melempar error → Node 500
        // (pesan Node: "Gagal memperbarui pelanggan." — quirk disalin PERSIS).
        if (!dir_row_by_id('Subscriber', $id)) {
            fail('Gagal memperbarui pelanggan.', 500);
        }
        db_delete('Subscriber', '"id" = ?', array($id));
        ok(array('success' => true));
    } catch (Exception $e) {
        fail('Gagal memperbarui pelanggan.', 500);
    }
}

/* ===========================================================================
 * 7. EKSPOR CSV — paritas src/app/api/export/route.ts (S/A)
 * ========================================================================= */

/** Definisi kolom & nama entitas audit per tipe ekspor — salinan persis Node. */
function dir_export_meta() {
    static $meta = null;
    if ($meta === null) {
        $meta = array(
            'members' => array(
                'entity' => 'Member',
                'table'  => 'Member',
                'cols'   => array(
                    array('id', 'ID'),
                    array('name', 'Nama Organisasi'),
                    array('type', 'Tipe'),
                    array('city', 'Kota'),
                    array('province', 'Provinsi'),
                    array('licenseNo', 'No. Izin'),
                    array('phone', 'Telepon'),
                    array('email', 'Email'),
                    array('website', 'Website'),
                    array('status', 'Status'),
                    array('memberSince', 'Anggota Sejak'),
                    array('rating', 'Rating'),
                    array('createdAt', 'Dibuat'),
                ),
            ),
            'applications' => array(
                'entity' => 'Application',
                'table'  => 'MembershipApplication',
                'cols'   => array(
                    array('ticketCode', 'Kode Tiket'),
                    array('orgName', 'Organisasi'),
                    array('type', 'Tipe'),
                    array('contactName', 'Kontak'),
                    array('email', 'Email'),
                    array('phone', 'Telepon'),
                    array('city', 'Kota'),
                    array('licenseNo', 'No. Izin'),
                    array('status', 'Status'),
                    array('reviewedBy', 'Diperiksa Oleh'),
                    array('createdAt', 'Dibuat'),
                ),
            ),
            'messages' => array(
                'entity' => 'Message',
                'table'  => 'ContactMessage',
                'cols'   => array(
                    array('id', 'ID'),
                    array('name', 'Nama'),
                    array('email', 'Email'),
                    array('phone', 'Telepon'),
                    array('subject', 'Subjek'),
                    array('message', 'Pesan'),
                    array('status', 'Status'),
                    array('createdAt', 'Dibuat'),
                ),
            ),
            'subscribers' => array(
                'entity' => 'Subscriber',
                'table'  => 'Subscriber',
                'cols'   => array(
                    array('id', 'ID'),
                    array('email', 'Email'),
                    array('isActive', 'Aktif'),
                    array('createdAt', 'Dibuat'),
                ),
            ),
            'complaints' => array(
                'entity' => 'Complaint',
                'table'  => 'Complaint',
                'cols'   => array(
                    array('id', 'ID'),
                    array('name', 'Pelapor'),
                    array('email', 'Email'),
                    array('phone', 'Telepon'),
                    array('targetMember', 'Penyelenggara Dilaporkan'),
                    array('category', 'Kategori'),
                    array('status', 'Status'),
                    array('responseNote', 'Catatan Respons'),
                    array('respondedBy', 'Ditanggapi Oleh'),
                    array('createdAt', 'Dibuat'),
                ),
            ),
        );
    }
    return $meta;
}

/** GET /api/export?type=… — CSV UTF-8 + BOM, CRLF, nama berkas muhdin-{type}-{Ymd}.csv. */
function dir_export() {
    $user = guard_role(array('SUPER_ADMIN', 'ADMIN'));
    try {
        $type = (string) (dir_param('type') === null ? '' : dir_param('type'));
        $meta = dir_export_meta();
        if (!isset($meta[$type])) {
            fail('Tipe ekspor tidak valid. Gunakan members|applications|messages|subscribers|complaints.');
        }
        $spec = $meta[$type];
        $rows = db_all(
            'SELECT * FROM "' . $spec['table'] . '" ORDER BY "createdAt" DESC',
            array(),
            $spec['table']
        );
        $cols = $spec['cols'];

        $lines = array();
        $head = array();
        foreach ($cols as $c) {
            $head[] = dir_csv_value($c[1]); // label
        }
        $lines[] = implode(',', $head);
        foreach ($rows as $row) {
            $cells = array();
            foreach ($cols as $c) {
                $key = $c[0];
                $cells[] = dir_csv_value(isset($row[$key]) ? $row[$key] : null);
            }
            $lines[] = implode(',', $cells);
        }
        // BOM \uFEFF agar Excel mengenali UTF-8; pemisah CRLF.
        $csv = "\xEF\xBB\xBF" . implode("\r\n", $lines);

        $yyyymmdd = date('Ymd');
        // Task 18 — setiap ekspor dicatat ke log audit.
        log_audit($user, 'EXPORT', $spec['entity'], null, 'Ekspor CSV ' . count($rows) . ' baris');

        dir_send_raw($csv, 200, array(
            'Content-Type: text/csv; charset=utf-8',
            'Content-Disposition: attachment; filename="muhdin-' . $type . '-' . $yyyymmdd . '.csv"',
            'Cache-Control: no-store',
        ));
    } catch (Exception $e) {
        fail('Gagal mengekspor data.', 500);
    }
}

/* ===========================================================================
 * 8. PENCARIAN LINTAS ENTITAS — paritas src/app/api/search/route.ts (publik)
 * ========================================================================= */

/** GET /api/search?q=… — artikel PUBLISHED, tutorial published, ekosistem; 5 each. */
function dir_search() {
    try {
        $raw = dir_param('q');
        $q = trim((string) ($raw === null ? '' : $raw));
        if (dir_len($q) < 2) {
            ok(array('query' => $q, 'articles' => array(), 'tutorials' => array(), 'ecosystems' => array()));
        }
        $like = dir_like_param($q);

        $articles = db_all(
            'SELECT "id", "title", "slug", "excerpt", "category", "cover" FROM "Article" ' .
            'WHERE "status" = \'PUBLISHED\' AND ' . dir_like_clause(array('title', 'excerpt', 'content')) . ' ' .
            'ORDER BY "createdAt" DESC LIMIT 5',
            array($like, $like, $like),
            'Article'
        );
        $tutorials = db_all(
            'SELECT "id", "title", "slug", "summary", "category", "level" FROM "Tutorial" ' .
            'WHERE "published" = 1 AND ' . dir_like_clause(array('title', 'summary', 'content')) . ' ' .
            'ORDER BY "order" ASC LIMIT 5',
            array($like, $like, $like),
            'Tutorial'
        );
        $ecosystems = db_all(
            'SELECT * FROM "Ecosystem" WHERE ' . dir_like_clause(array('name', 'scope', 'description')) . ' ' .
            'ORDER BY "number" ASC LIMIT 5',
            array($like, $like, $like),
            'Ecosystem'
        );

        ok(array(
            'query'      => $q,
            'articles'   => $articles,
            'tutorials'  => $tutorials,
            'ecosystems' => $ecosystems,
        ));
    } catch (Exception $e) {
        fail('Gagal melakukan pencarian.', 500);
    }
}

/* ===========================================================================
 * 9. FEED RSS — paritas src/app/api/rss/route.ts (publik)
 * ========================================================================= */

/** GET /api/rss — 20 artikel PUBLISHED terbaru; item → {base}/#/berita/{slug}. */
function dir_rss() {
    try {
        $base = getenv('NEXT_PUBLIC_SITE_URL');
        if ($base === false || $base === '') {
            $base = isset($_ENV['NEXT_PUBLIC_SITE_URL']) ? (string) $_ENV['NEXT_PUBLIC_SITE_URL'] : 'https://muhdin.web.id';
        }
        $base = preg_replace('/\/+$/', '', (string) $base);

        $articles = db_all(
            'SELECT * FROM "Article" WHERE "status" = \'PUBLISHED\' ORDER BY "createdAt" DESC LIMIT 20',
            array(),
            'Article'
        );

        $items = '';
        foreach ($articles as $a) {
            $link = $base . '/#/berita/' . $a['slug'];
            $item = implode("\n", array(
                '    <item>',
                '      <title>' . dir_xml_escape($a['title']) . '</title>',
                '      <link>' . dir_xml_escape($link) . '</link>',
                '      <guid>' . dir_xml_escape($link) . '</guid>',
                '      <pubDate>' . dir_utc_rfc1123($a['createdAt']) . '</pubDate>',
                '      <description>' . dir_xml_escape($a['excerpt']) . '</description>',
                '    </item>',
            ));
            $items .= ($items === '' ? '' : "\n") . $item;
        }

        $xml = implode("\n", array(
            '<?xml version="1.0" encoding="UTF-8"?>',
            '<rss version="2.0">',
            '  <channel>',
            '    <title>MUHDIN — Berita &amp; Artikel</title>',
            '    <link>' . dir_xml_escape($base) . '</link>',
            '    <description>Berita, artikel, dan pengumuman resmi MUHDIN — asosiasi penyelenggara perjalanan ibadah yang amanah &amp; profesional.</description>',
            '    <lastBuildDate>' . gmdate('D, d M Y H:i:s') . ' GMT</lastBuildDate>',
            $items,
            '  </channel>',
            '</rss>',
        ));

        dir_send_raw($xml, 200, array(
            'Content-Type: application/rss+xml; charset=utf-8',
            'Cache-Control: no-store',
        ));
    } catch (Exception $e) {
        $fallback =
            "<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n" .
            '<rss version="2.0"><channel><title>MUHDIN — Berita &amp; Artikel</title></channel></rss>';
        dir_send_raw($fallback, 500, array(
            'Content-Type: application/rss+xml; charset=utf-8',
        ));
    }
}

/* ===========================================================================
 * 10. ROUTER MODUL — satu titik masuk dari index.php
 * ========================================================================= */

/**
 * Dispatcher domain "directory". Urutan pengecekan penting: rute statis
 * (verify, track) SELALU diuji sebelum [id] dinamis — paritas Next.js.
 *
 * @param string $method Metode HTTP (uppercase).
 * @param array  $seg    Segmen path setelah /api, contoh ['members','verify'].
 * @return bool TRUE = ditangani; FALSE = bukan domain modul ini.
 */
function routes_directory(string $method, array $seg): bool {
    $n = count($seg);
    $h0 = $n >= 1 ? (string) $seg[0] : '';
    $h1 = $n >= 2 ? (string) $seg[1] : '';

    // ---- ROOT /api → info endpoint (src/app/api/route.ts) ----
    if ($n === 0) {
        if ($method === 'GET') {
            ok(array('message' => 'Hello, world!'));
        }
        fail(405, 'Metode tidak diizinkan.'); // Next.js: 405 untuk metode tanpa handler
        return true;
    }

    switch ($h0) {
        /* ---------------------------- MEMBERS ---------------------------- */
        case 'members':
            if ($n === 1) {
                if ($method === 'GET')  { dir_members_list();   return true; }
                if ($method === 'POST') { dir_members_create(); return true; }
                fail(405, 'Metode tidak diizinkan.');
                return true;
            }
            if ($n === 2 && $h1 === 'verify') { // rute statis diuji lebih dulu
                if ($method === 'GET')  { dir_members_verify_get();  return true; }
                if ($method === 'POST') { dir_members_verify_post(); return true; }
                fail(405, 'Metode tidak diizinkan.');
                return true;
            }
            if ($n === 2) {
                if ($method === 'GET')    { dir_members_get($h1);    return true; }
                if ($method === 'PUT')    { dir_members_update($h1); return true; }
                if ($method === 'DELETE') { dir_members_delete($h1); return true; }
                fail(405, 'Metode tidak diizinkan.');
                return true;
            }
            return false; // /api/members/a/b → biarkan router membalas 404

        /* -------------------------- APPLICATIONS ------------------------- */
        case 'applications':
            if ($n === 1) {
                if ($method === 'GET')  { dir_applications_list();   return true; }
                if ($method === 'POST') { dir_applications_create(); return true; }
                fail(405, 'Metode tidak diizinkan.');
                return true;
            }
            if ($n === 2 && $h1 === 'track') { // rute statis diuji lebih dulu
                if ($method === 'GET') { dir_applications_track(); return true; }
                fail(405, 'Metode tidak diizinkan.');
                return true;
            }
            if ($n === 2) {
                if ($method === 'GET')    { dir_applications_get($h1);    return true; }
                if ($method === 'PUT')    { dir_applications_update($h1); return true; }
                if ($method === 'DELETE') { dir_applications_delete($h1); return true; }
                fail(405, 'Metode tidak diizinkan.');
                return true;
            }
            return false;

        /* ---------------------------- MESSAGES --------------------------- */
        case 'messages':
            if ($n === 1) {
                if ($method === 'GET')  { dir_messages_list();   return true; }
                if ($method === 'POST') { dir_messages_create(); return true; }
                fail(405, 'Metode tidak diizinkan.');
                return true;
            }
            if ($n === 2) {
                if ($method === 'GET')    { dir_messages_get($h1);    return true; }
                if ($method === 'PUT')    { dir_messages_update($h1); return true; }
                if ($method === 'DELETE') { dir_messages_delete($h1); return true; }
                fail(405, 'Metode tidak diizinkan.');
                return true;
            }
            return false;

        /* --------------------------- COMPLAINTS -------------------------- */
        case 'complaints':
            if ($n === 1) {
                if ($method === 'GET')  { dir_complaints_list();   return true; }
                if ($method === 'POST') { dir_complaints_create(); return true; }
                fail(405, 'Metode tidak diizinkan.');
                return true;
            }
            if ($n === 2) {
                if ($method === 'GET')    { dir_complaints_get($h1);    return true; }
                if ($method === 'PUT')    { dir_complaints_update($h1); return true; }
                if ($method === 'DELETE') { dir_complaints_delete($h1); return true; }
                fail(405, 'Metode tidak diizinkan.');
                return true;
            }
            return false;

        /* -------------------------- SUBSCRIBERS -------------------------- */
        case 'subscribers':
            if ($n === 1) {
                if ($method === 'GET')  { dir_subscribers_list();   return true; }
                if ($method === 'POST') { dir_subscribers_create(); return true; }
                fail(405, 'Metode tidak diizinkan.');
                return true;
            }
            if ($n === 2) {
                if ($method === 'PUT')    { dir_subscribers_update($h1); return true; }
                if ($method === 'DELETE') { dir_subscribers_delete($h1); return true; }
                fail(405, 'Metode tidak diizinkan.');
                return true;
            }
            return false;

        /* ----------------------------- EXPORT ---------------------------- */
        case 'export':
            if ($n === 1) {
                if ($method === 'GET') { dir_export(); return true; }
                fail(405, 'Metode tidak diizinkan.');
                return true;
            }
            return false;

        /* ----------------------------- SEARCH ---------------------------- */
        case 'search':
            if ($n === 1) {
                if ($method === 'GET') { dir_search(); return true; }
                fail(405, 'Metode tidak diizinkan.');
                return true;
            }
            return false;

        /* ------------------------------ RSS ------------------------------ */
        case 'rss':
            if ($n === 1) {
                if ($method === 'GET') { dir_rss(); return true; }
                fail(405, 'Metode tidak diizinkan.');
                return true;
            }
            return false;
    }

    return false; // bukan domain modul ini — router mencoba modul berikutnya
}
