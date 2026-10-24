<?php
/**
 * ============================================================================
 * routes-nusuk.php — Rute domain NUSUK (Edisi Shared Hosting, PHP murni)
 * ----------------------------------------------------------------------------
 * Rekonstruksi Task 30-b-4 — paritas kontrak 1:1 dengan backend Node
 * (src/app/api/nusuk/**) di atas pustaka lib.php + mesin nusuk.php.
 * Tanggal rekonstruksi: 2026-09-21.
 *
 * Endpoint (8 jalur, metode HTTP persis route Node):
 *   GET    /api/nusuk/connection   admin  — status koneksi (?reveal=1 → kunci penuh)
 *   POST   /api/nusuk/connection   admin  — hubungkan { environment: SANDBOX|PRODUCTION }
 *   PUT    /api/nusuk/connection   admin  — perbarui { autoSync }
 *   DELETE /api/nusuk/connection   admin  — putuskan koneksi
 *   POST   /api/nusuk/rotate       admin  — rotasi apiKey + webhookSecret
 *   GET    /api/nusuk/permits      admin  — daftar izin ?status&type&q&page&pageSize
 *   GET    /api/nusuk/public       publik — koneksi + metrik + ekosistem + log + topAnggota
 *   GET    /api/nusuk/verify       publik — cek keaslian izin ?no=NSK-XXX-2026-xxxxxx
 *   POST   /api/nusuk/verify       publik — varian Task 30-b-4: body { no } (ber-rate-limit)
 *   POST   /api/nusuk/sync         admin  — sinkronisasi penuh (respons ringkasan)
 *   GET    /api/nusuk/logs         admin  — log sinkronisasi ?limit
 *   POST   /api/nusuk/webhook      publik — receiver event izin (header X-Nusuk-Signature)
 *
 * Kontrak router (index.php):
 *   - Bukan domain ini (seg[0] !== 'nusuk', jalur tak dikenal, atau metode yang
 *     tidak ada di Node) → return FALSE tanpa output; router mencoba modul
 *     berikutnya / membalas 404.
 *   - Ditangani → ok()/fail() mengirim JSON lalu exit; fungsi return TRUE.
 *   - Guard persis Node: GET connection, permits, logs → guardAdmin();
 *     POST/PUT/DELETE connection, rotate, sync → guardRole(["SUPER_ADMIN","ADMIN"]).
 *   - Masking kredensial persis Node: 12 karakter pertama + "•"×16 + 4 terakhir;
 *     kosong → "—"; kunci penuh hanya via ?reveal=1.
 *   - Tanggal disimpan epoch-ms (format Prisma 6) dan dinormalkan ISO-8601 saat
 *     output (cast_row / iso_from_ms) — JSON identik Prisma/Node.
 *   - Nomor izin & pesan log memakai mesin nusuk.php (nusuk_run_sync,
 *     nusuk_compute_metrics, nusuk_webhook_*) yang sudah paritas 1:1 Node.
 *
 * Deviasi sadar yang diminta Task 30-b-4 (respons API tetap identik Node):
 *   - log_audit() dipanggil pada aksi tulis koneksi (POST/PUT) & rotasi;
 *     Node hanya menulis NusukSyncLog — tambahan ini tidak mengubah respons.
 *   - POST /nusuk/verify adalah superset toleran Task (jalur utama Node tetap
 *     GET ?no=) dan diberi rate_limit 5/60 dtk; Node tidak ber-rate-limit.
 *   - GET /nusuk/public TIDAK menyertakan katalog izin/eligibility — persis
 *     Node (katalog hanya dipakai internal mesin sync & webhook).
 *
 * PHP 7.4+ kompatibel (mulus di PHP 8.x), tanpa dependensi eksternal.
 * ============================================================================
 */

require_once __DIR__ . '/nusuk.php';

/**
 * Router domain Nusuk — satu-satunya fungsi publik modul ini.
 *
 * @param string $method Metode HTTP (sudah uppercase dari index.php).
 * @param array  $seg    Segmen path, contoh: ['nusuk', 'connection'].
 * @return bool TRUE bila request ditangani (respons sudah terkirim), FALSE bila bukan.
 */
function routes_nusuk(string $method, array $seg): bool {
    // Bukan domain ini, atau kedalaman path tidak valid (/api/nusuk saja atau
    // /api/nusuk/x/y) → serahkan ke modul lain / 404 dari router induk.
    if (!isset($seg[0]) || $seg[0] !== 'nusuk' || !isset($seg[1]) || isset($seg[2])) {
        return false;
    }
    $sub = $seg[1];

    switch ($sub) {

        /* ====================================================================
         * 1) CONNECTION — replika src/app/api/nusuk/connection/route.ts
         *    GET    guardAdmin                — status + mask kredensial
         *    POST   guardRole([SA, ADMIN])    — { environment } → CONNECTED
         *    PUT    guardRole([SA, ADMIN])    — { autoSync }
         *    DELETE guardRole([SA, ADMIN])    — putuskan koneksi
         * ==================================================================== */
        case 'connection':
            if ($method === 'GET') {
                guard_admin(); // 401 bila belum login — paritas guardAdmin()
                $conn = nusuk_ensure_connection();
                $reveal = (isset($_GET['reveal']) && $_GET['reveal'] === '1');

                // Paritas mask() Node: slice(0,12) + "•"×16 + slice(-4); kosong → "—".
                $apiKey = (string) (isset($conn['apiKey']) ? $conn['apiKey'] : '');
                $masked = ($apiKey === '')
                    ? '—'
                    : substr($apiKey, 0, 12) . str_repeat('•', 16) . substr($apiKey, -4);

                $payload = array(
                    'id'           => $conn['id'],
                    'environment'  => $conn['environment'],
                    'status'       => $conn['status'],
                    'autoSync'     => $conn['autoSync'],
                    'totalSyncs'   => $conn['totalSyncs'],
                    'lastSyncAt'   => $conn['lastSyncAt'],
                    'apiKeyMasked' => $masked,
                );
                if ($reveal) {
                    $payload['apiKey']        = $apiKey;
                    $payload['webhookSecret'] = (string) (isset($conn['webhookSecret']) ? $conn['webhookSecret'] : '');
                }
                ok(array('connection' => $payload));
                return true;
            }

            if ($method === 'POST') {
                $user = guard_role(array('SUPER_ADMIN', 'ADMIN'));
                $body = request_json();
                if (!is_array($body)) {
                    $body = array(); // paritas req.json().catch(() => ({}))
                }
                $environment = (isset($body['environment']) && $body['environment'] === 'PRODUCTION')
                    ? 'PRODUCTION'
                    : 'SANDBOX';
                $conn = nusuk_ensure_connection();
                db_update('NusukConnection', array(
                    'environment' => $environment,
                    'status'      => 'CONNECTED',
                ), '"id" = ?', array($conn['id']));
                db_insert('NusukSyncLog', array(
                    'connectionId' => $conn['id'],
                    'type'         => 'CONNECTION',
                    'status'       => 'SUCCESS',
                    'message'      => 'Terhubung ke Nusuk ' . $environment . ' — handshake berhasil.',
                ));
                log_audit($user, 'UPDATE', 'NusukConnection', $conn['id'], 'environment=' . $environment);
                $row = db_one('SELECT * FROM "NusukConnection" WHERE "id" = ?', array($conn['id']), 'NusukConnection');
                unset($row['apiKey'], $row['webhookSecret']); // paritas apiKey: undefined
                ok(array('connection' => $row));
                return true;
            }

            if ($method === 'PUT') {
                $user = guard_role(array('SUPER_ADMIN', 'ADMIN'));
                $body = request_json();
                if (!is_array($body)) {
                    $body = array();
                }
                $autoSync = array_key_exists('autoSync', $body) ? (bool) $body['autoSync'] : false; // paritas Boolean(body.autoSync)
                $conn = nusuk_ensure_connection();
                db_update('NusukConnection', array(
                    'autoSync' => $autoSync ? 1 : 0,
                ), '"id" = ?', array($conn['id']));
                log_audit($user, 'UPDATE', 'NusukConnection', $conn['id'], 'autoSync=' . ($autoSync ? 'true' : 'false'));
                $row = db_one('SELECT * FROM "NusukConnection" WHERE "id" = ?', array($conn['id']), 'NusukConnection');
                unset($row['apiKey'], $row['webhookSecret']);
                ok(array('connection' => $row));
                return true;
            }

            if ($method === 'DELETE') {
                guard_role(array('SUPER_ADMIN', 'ADMIN'));
                $conn = nusuk_ensure_connection();
                db_update('NusukConnection', array(
                    'status' => 'DISCONNECTED',
                ), '"id" = ?', array($conn['id']));
                db_insert('NusukSyncLog', array(
                    'connectionId' => $conn['id'],
                    'type'         => 'CONNECTION',
                    'status'       => 'FAILED',
                    'message'      => 'Koneksi Nusuk diputus manual oleh administrator.',
                ));
                $row = db_one('SELECT * FROM "NusukConnection" WHERE "id" = ?', array($conn['id']), 'NusukConnection');
                unset($row['apiKey'], $row['webhookSecret']);
                ok(array('connection' => $row));
                return true;
            }
            return false;

        /* ====================================================================
         * 2) ROTATE — replika src/app/api/nusuk/rotate/route.ts
         *    POST guardRole([SA, ADMIN]) — regenerasi apiKey + webhookSecret.
         *    Generator persis Node: nsk_live_<48hex> / whsec_<36hex>.
         * ==================================================================== */
        case 'rotate':
            if ($method !== 'POST') {
                return false;
            }
            $user = guard_role(array('SUPER_ADMIN', 'ADMIN'));
            $conn = nusuk_ensure_connection();
            db_update('NusukConnection', array(
                'apiKey'        => nusuk_generate_api_key(),
                'webhookSecret' => nusuk_generate_webhook_secret(),
            ), '"id" = ?', array($conn['id']));
            db_insert('NusukSyncLog', array(
                'connectionId' => $conn['id'],
                'type'         => 'CONNECTION',
                'status'       => 'SUCCESS',
                'message'      => 'Rotasi kredensial API — kunci lama dicabut otomatis.',
            ));
            log_audit($user, 'ROTATE', 'NusukConnection', $conn['id'], 'Rotasi apiKey & webhookSecret Nusuk.');
            ok(array('message' => 'Kredensial Nusuk berhasil dirotasi.'));
            return true;

        /* ====================================================================
         * 3) PERMITS — replika src/app/api/nusuk/permits/route.ts
         *    GET guardAdmin — ?status&type&q&page&pageSize (pageSize ≤ 50).
         *    q: LIKE permitNo (uppercase) / holderName / member.name; JOIN Member;
         *    urut syncedAt DESC; respons { permits(+member), total, page, pageSize, pages }.
         * ==================================================================== */
        case 'permits':
            if ($method !== 'GET') {
                return false;
            }
            guard_admin();
            $status = isset($_GET['status']) ? (string) $_GET['status'] : '';
            $type   = isset($_GET['type']) ? (string) $_GET['type'] : '';
            $q      = isset($_GET['q']) ? trim((string) $_GET['q']) : '';
            $page     = parse_int_or(isset($_GET['page']) ? $_GET['page'] : null, 1);
            $pageSize = min(parse_int_or(isset($_GET['pageSize']) ? $_GET['pageSize'] : null, 10), 50);

            $where  = array();
            $params = array();
            if ($status !== '') {
                $where[]  = 'p."status" = ?';
                $params[] = $status;
            }
            if ($type !== '') {
                $where[]  = 'p."type" = ?';
                $params[] = $type;
            }
            if ($q !== '') {
                // Paritas contains Prisma (SQLite LIKE): escape \, %, _ dengan
                // ESCAPE '\'; permitNo memakai q.toUpperCase() persis Node.
                $likeNo = '%' . str_replace(array('\\', '%', '_'), array('\\\\', '\\%', '\\_'), strtoupper($q)) . '%';
                $likeQ  = '%' . str_replace(array('\\', '%', '_'), array('\\\\', '\\%', '\\_'), $q) . '%';
                $where[] = "(p.\"permitNo\" LIKE ? ESCAPE '\\' OR p.\"holderName\" LIKE ? ESCAPE '\\' OR m.\"name\" LIKE ? ESCAPE '\\')";
                $params[] = $likeNo;
                $params[] = $likeQ;
                $params[] = $likeQ;
            }
            $whereSql = count($where) > 0 ? ' WHERE ' . implode(' AND ', $where) : '';
            $join     = ' FROM "NusukPermit" p LEFT JOIN "Member" m ON m."id" = p."memberId"';

            $total = (int) db_val('SELECT COUNT(*)' . $join . $whereSql, $params);

            // skip = (page-1)*pageSize, take = pageSize (diklem ≥ 0 agar SQL valid).
            $take   = max(0, (int) $pageSize);
            $offset = max(0, ((int) $page - 1) * $take);
            $rows = db_all(
                'SELECT p.*, m."id" AS "__mId", m."name" AS "__mName", m."type" AS "__mType", ' .
                'm."city" AS "__mCity", m."licenseNo" AS "__mLicenseNo"' . $join . $whereSql .
                ' ORDER BY p."syncedAt" DESC LIMIT ' . $take . ' OFFSET ' . $offset,
                $params
            );

            $permits = array();
            foreach (cast_rows($rows, 'NusukPermit') as $row) {
                // include member { id, name, type, city, licenseNo } — null bila hilang.
                $member = null;
                if ($row['__mId'] !== null) {
                    $member = array(
                        'id'        => $row['__mId'],
                        'name'      => $row['__mName'],
                        'type'      => $row['__mType'],
                        'city'      => $row['__mCity'],
                        'licenseNo' => $row['__mLicenseNo'],
                    );
                }
                unset($row['__mId'], $row['__mName'], $row['__mType'], $row['__mCity'], $row['__mLicenseNo']);
                $row['member'] = $member;
                $permits[] = $row;
            }

            // pages = Math.ceil(total/pageSize); pageSize ≤ 0 → Infinity → JSON null (paritas Node).
            $pages = ($pageSize > 0) ? (int) ceil($total / $pageSize) : null;

            ok(array(
                'permits'  => $permits,
                'total'    => $total,
                'page'     => $page,
                'pageSize' => $pageSize,
                'pages'    => $pages,
            ));
            return true;

        /* ====================================================================
         * 4) PUBLIC — replika src/app/api/nusuk/public/route.ts (tanpa guard).
         *    connection(status/environment/lastSyncAt/totalSyncs/autoSync) +
         *    metrics + ecosystems + recentLogs(6) + topMembers (maks 6, sort
         *    stabil menurun berdasarkan activePermits).
         * ==================================================================== */
        case 'public':
            if ($method !== 'GET') {
                return false;
            }
            $conn       = nusuk_ensure_connection();
            $metrics    = nusuk_compute_metrics();
            $ecosystems = cast_rows(
                db_all('SELECT "number", "name", "icon", "cluster" FROM "Ecosystem" ORDER BY "number" ASC'),
                'Ecosystem'
            );
            $recentLogs = db_all(
                'SELECT * FROM "NusukSyncLog" ORDER BY "createdAt" DESC LIMIT 6',
                array(),
                'NusukSyncLog'
            );
            $groups = db_all(
                'SELECT "memberId", "status", COUNT(*) AS cnt FROM "NusukPermit" GROUP BY "memberId", "status"'
            );

            // Paritas memberMap Node: { active, total } per anggota.
            $memberMap = array();
            foreach ($groups as $g) {
                $mid = $g['memberId'];
                if (!isset($memberMap[$mid])) {
                    $memberMap[$mid] = array('active' => 0, 'total' => 0);
                }
                $memberMap[$mid]['total'] += (int) $g['cnt'];
                if ($g['status'] === 'ACTIVE') {
                    $memberMap[$mid]['active'] += (int) $g['cnt'];
                }
            }
            $memberIds = array();
            foreach ($memberMap as $mid => $stat) {
                if ($stat['active'] > 0) {
                    $memberIds[] = $mid;
                }
            }

            $members = array();
            if (count($memberIds) > 0) {
                $members = db_all(
                    'SELECT "id", "name", "type", "city", "rating" FROM "Member" ' .
                    'WHERE "id" IN (' . sql_in(count($memberIds)) . ') AND "status" = ?',
                    array_merge($memberIds, array('TERVERIFIKASI'))
                );
            }

            // usort PHP < 8 belum stabil → dekorasi indeks untuk paritas sort
            // stabil JavaScript, lalu slice(0, 6).
            $top = array();
            $idx = 0;
            foreach ($members as $m) {
                $stat = isset($memberMap[$m['id']]) ? $memberMap[$m['id']] : array('active' => 0, 'total' => 1);
                $top[] = array(
                    'i'   => $idx++,
                    'row' => array(
                        'id'            => $m['id'],
                        'name'          => $m['name'],
                        'type'          => $m['type'],
                        'city'          => $m['city'],
                        'activePermits' => (int) $stat['active'],
                        'compliance'    => (int) round(((int) $stat['active'] / max(1, (int) $stat['total'])) * 100),
                        'rating'        => (float) $m['rating'],
                    ),
                );
            }
            usort($top, function ($a, $b) {
                $d = $b['row']['activePermits'] - $a['row']['activePermits'];
                return ($d !== 0) ? $d : ($a['i'] - $b['i']);
            });
            $topMembers = array();
            foreach (array_slice($top, 0, 6) as $t) {
                $topMembers[] = $t['row'];
            }

            ok(array(
                'connection' => array(
                    'status'      => $conn['status'],
                    'environment' => $conn['environment'],
                    'lastSyncAt'  => $conn['lastSyncAt'],
                    'totalSyncs'  => $conn['totalSyncs'],
                    'autoSync'    => $conn['autoSync'],
                ),
                'metrics'    => $metrics,
                'ecosystems' => $ecosystems,
                'recentLogs' => $recentLogs,
                'topMembers' => $topMembers,
            ));
            return true;

        /* ====================================================================
         * 5) VERIFY — replika src/app/api/nusuk/verify/route.ts (PUBLIK).
         *    GET  ?no=           — jalur utama Node (tanpa rate limit, persis Node).
         *    POST { no }         — varian Task 30-b-4, ber-rate-limit 5/60 dtk.
         *    Regex nomor \z (bukan $) agar persis semantik anchor Node.
         * ==================================================================== */
        case 'verify':
            if ($method !== 'GET' && $method !== 'POST') {
                return false;
            }
            if ($method === 'POST') {
                rate_limit('nusuk_verify'); // 429 otomatis, pesan persis Node
                $body = request_json();
                $no = (is_array($body) && isset($body['no']) && is_string($body['no']))
                    ? $body['no']
                    : (isset($_GET['no']) ? (string) $_GET['no'] : '');
            } else {
                $no = isset($_GET['no']) ? (string) $_GET['no'] : '';
            }
            $no = strtoupper(trim($no)); // paritas trim().toUpperCase()
            if ($no === '') {
                fail('Nomor izin wajib diisi.', 400);
            }
            if (!preg_match('/^NSK-[A-Z]{3}-\d{4}-\d{4,8}\z/', $no)) {
                fail('Format nomor izin tidak valid. Contoh: NSK-VSA-2026-482913', 422);
            }
            $permit = nusuk_find_permit($no); // trim+uppercase internal; baris ter-cast (ISO)
            if (!$permit) {
                fail('Izin tidak ditemukan dalam registri Nusuk-MUHDIN.', 404);
            }
            $member = db_one(
                'SELECT "name", "type", "city", "licenseNo", "status" FROM "Member" WHERE "id" = ?',
                array($permit['memberId'])
            );
            $nowMs  = now_ms();
            $nowIso = iso_from_ms($nowMs);
            // stillValid = status ACTIVE && expiresAt > now. ISO-8601 UTC
            // berformat tetap → urutan leksikal == urutan waktu (paritas Node).
            $stillValid       = ($permit['status'] === 'ACTIVE') && ((string) $permit['expiresAt'] > $nowIso);
            $effectiveStatus  = (($permit['status'] === 'ACTIVE') && !$stillValid) ? 'EXPIRED' : $permit['status'];
            ok(array(
                'permit' => array(
                    'permitNo'   => $permit['permitNo'],
                    'type'       => $permit['type'],
                    'holderName' => $permit['holderName'],
                    'status'     => $effectiveStatus,
                    'meta'       => $permit['meta'],
                    'issuedAt'   => $permit['issuedAt'],
                    'expiresAt'  => $permit['expiresAt'],
                    'lastSync'   => $permit['syncedAt'],
                ),
                'member'      => $member,
                'checkedAt'   => $nowIso,
                'environment' => 'NUSUK SANDBOX REGISTRY',
            ));
            return true;

        /* ====================================================================
         * 6) SYNC — replika src/app/api/nusuk/sync/route.ts
         *    POST guardRole([SA, ADMIN]) — nusuk_run_sync(); gagal → log
         *    FULL_SYNC/FAILED + fail(message, 400) persis Node.
         * ==================================================================== */
        case 'sync':
            if ($method !== 'POST') {
                return false;
            }
            guard_role(array('SUPER_ADMIN', 'ADMIN'));
            try {
                ok(nusuk_run_sync()); // { summary{created,updated,expired,skipped,recordsAffected,durationMs}, logId, message }
            } catch (Exception $e) {
                $message = ($e->getMessage() !== '') ? $e->getMessage() : 'Sinkronisasi gagal.';
                $conn = nusuk_get_connection();
                if ($conn) {
                    db_insert('NusukSyncLog', array(
                        'connectionId' => $conn['id'],
                        'type'         => 'FULL_SYNC',
                        'status'       => 'FAILED',
                        'message'      => $message,
                        'durationMs'   => 0,
                    ));
                }
                fail($message, 400);
            }
            return true;

        /* ====================================================================
         * 7) LOGS — replika src/app/api/nusuk/logs/route.ts
         *    GET guardAdmin — ?limit (default 25, maks 100), createdAt DESC.
         * ==================================================================== */
        case 'logs':
            if ($method !== 'GET') {
                return false;
            }
            guard_admin();
            $limit = min(parse_int_or(isset($_GET['limit']) ? $_GET['limit'] : null, 25), 100);
            // Diklem ≥ 0: SQLite LIMIT negatif berarti tanpa batas.
            $limit = max(0, (int) $limit);
            $logs = db_all(
                'SELECT * FROM "NusukSyncLog" ORDER BY "createdAt" DESC LIMIT ' . $limit,
                array(),
                'NusukSyncLog'
            );
            ok(array('logs' => $logs));
            return true;

        /* ====================================================================
         * 8) WEBHOOK — replika src/app/api/nusuk/webhook/route.ts (PUBLIK).
         *    Header X-Nusuk-Signature diverifikasi nusuk_verify_webhook_signature
         *    (paritas Node: sama dengan webhookSecret + jalur HMAC-SHA256 body).
         *    401 signature salah, 422 payload/event tak valid, 404 izin tak ada.
         * ==================================================================== */
        case 'webhook':
            if ($method !== 'POST') {
                return false;
            }
            $conn = nusuk_ensure_connection();
            $signature = '';
            if (isset($_SERVER['HTTP_X_NUSUK_SIGNATURE'])) {
                $signature = (string) $_SERVER['HTTP_X_NUSUK_SIGNATURE'];
            } elseif (isset($_SERVER['REDIRECT_HTTP_X_NUSUK_SIGNATURE'])) {
                $signature = (string) $_SERVER['REDIRECT_HTTP_X_NUSUK_SIGNATURE'];
            }
            $rawBody = (string) file_get_contents('php://input');
            if (!nusuk_verify_webhook_signature($signature, $conn, $rawBody)) {
                fail('Signature webhook tidak valid.', 401);
            }

            $body = json_decode($rawBody, true); // paritas req.json().catch(() => null)
            if (!is_array($body)
                || !isset($body['permitNo']) || !is_string($body['permitNo'])
                || !isset($body['event']) || !is_string($body['event'])) {
                fail('Payload webhook tidak lengkap: permitNo & event wajib.', 422);
            }

            $permitNo = strtoupper(trim($body['permitNo']));
            // Baris MENTAH (epoch-ms) dibutuhkan nusuk_webhook_expires_at() untuk
            // meneruskan nilai lama pada event ISSUED/REVOKED — nusuk_find_permit()
            // meng-cast tanggal ke ISO sehingga tidak dipakai di jalur ini.
            $permit = db_one('SELECT * FROM "NusukPermit" WHERE "permitNo" = ?', array($permitNo));
            if (!$permit) {
                fail('Izin ' . $permitNo . ' tidak ditemukan.', 404);
            }

            $event   = $body['event'];
            $eventMap = nusuk_webhook_event_map();
            if (!isset($eventMap[$event])) {
                fail('Event tidak dikenal: ' . $event, 422);
            }
            $mapped = $eventMap[$event];

            $nowMs     = now_ms();
            $expiresAt = nusuk_webhook_expires_at($event, $permit, $nowMs);
            db_update('NusukPermit', array(
                'status'    => $mapped['status'],
                'expiresAt' => $expiresAt,
                'syncedAt'  => $nowMs,
            ), '"permitNo" = ?', array($permitNo));

            $note = (isset($body['note']) && is_scalar($body['note'])) ? $body['note'] : null;
            db_insert('NusukSyncLog', array(
                'connectionId'    => $conn['id'],
                'type'            => 'WEBHOOK',
                'status'          => $mapped['logStatus'],
                'message'         => nusuk_webhook_log_message($event, $permitNo, $mapped['status'], $note),
                'recordsAffected' => 1,
                'durationMs'      => nusuk_webhook_duration(), // paritas Math.max(1, Date.now() % 97)
            ));

            ok(array(
                'received'  => true,
                'permitNo'  => $permitNo,
                'event'     => $event,
                'status'    => $mapped['status'],
                'expiresAt' => iso_from_ms($expiresAt),
            ));
            return true;
    }

    // /api/nusuk/<tidak-dikenal> → bukan endpoint kita; router induk membalas 404.
    return false;
}
