<?php
/** routes/nusuk.php — mirror integrasi Nusuk Node (engine + routes, paritas 1:1) */
declare(strict_types=1);
/** @var Router $router */ global $router;

/**
 * ============================================================================
 * Sumber mirror (dibaca baris demi baris):
 *   - src/lib/nusuk-engine.ts            → ENGINE (fungsi nusuk_*)
 *   - src/app/api/nusuk/public/route.ts  → GET  nusuk/public
 *   - src/app/api/nusuk/verify/route.ts  → GET  nusuk/verify
 *   - src/app/api/nusuk/permits/route.ts → GET  nusuk/permits   (guard_admin)
 *   - src/app/api/nusuk/sync/route.ts    → POST nusuk/sync      (guard_role)
 *   - src/app/api/nusuk/connection/*     → GET/POST/PUT/DELETE nusuk/connection
 *   - src/app/api/nusuk/webhook/route.ts → POST nusuk/webhook   (publik + signature)
 *   - src/app/api/nusuk/logs/route.ts    → GET  nusuk/logs      (guard_admin)
 *   - src/app/api/nusuk/rotate/route.ts  → POST nusuk/rotate    (guard_role)
 *
 * Konvensi tanggal: ditulis epoch-ms (Prisma 6 SQLite = INTEGER ms),
 * dibaca kembali via cast_row/cast_rows → ISO-8601 milidetik + bool + int.
 * ============================================================================
 */

if (!function_exists('ok')) {
    require_once __DIR__ . '/../lib.php';
}

/* ==========================================================================
 * ENGINE — NUSUK SYNC ENGINE (mirror src/lib/nusuk-engine.ts)
 * ========================================================================== */

/** PERMIT_CATALOG — katalog izin Nusuk (konstanta identik Node). */
function nusuk_permit_catalog(): array
{
    return [
        'VISA'      => ['code' => 'VSA', 'label' => 'Nusuk Visa Authorization',  'validityDays' => 90,  'ecosystem' => 1, 'icon' => 'passport'],
        'HANDLING'  => ['code' => 'HDL', 'label' => 'Nusuk Handling Clearance', 'validityDays' => 180, 'ecosystem' => 2, 'icon' => 'plane-landing'],
        'MUTAWIF'   => ['code' => 'MTW', 'label' => 'Nusuk Mutawif License',    'validityDays' => 365, 'ecosystem' => 5, 'icon' => 'compass'],
        'HOTEL'     => ['code' => 'HTL', 'label' => 'Nusuk Hotel Contract',     'validityDays' => 365, 'ecosystem' => 6, 'icon' => 'building-2'],
        'TRANSPORT' => ['code' => 'TRN', 'label' => 'Nusuk Transport Permit',   'validityDays' => 120, 'ecosystem' => 7, 'icon' => 'bus'],
        'RAUDAH'    => ['code' => 'RDH', 'label' => 'Nusuk Rawdah Permit',      'validityDays' => 30,  'ecosystem' => 9, 'icon' => 'moon-star'],
    ];
}

/** ELIGIBILITY — peta tipe anggota → jenis permit yang layak disinkronkan. */
function nusuk_eligibility_map(): array
{
    return [
        'PPIU'          => ['VISA', 'HANDLING', 'HOTEL', 'TRANSPORT', 'RAUDAH'],
        'PIHK'          => ['VISA', 'HOTEL', 'TRANSPORT', 'RAUDAH'],
        'KBIHU'         => ['VISA', 'HANDLING'],
        'IPHI'          => ['MUTAWIF'],
        'TRAVEL_WISATA' => ['TRANSPORT', 'HOTEL'],
    ];
}

/** ELIGIBILITY[type] ?? ["VISA"] — fallback persis Node (runSync). */
function nusuk_eligibility(string $type): array
{
    $map = nusuk_eligibility_map();
    return $map[$type] ?? ['VISA'];
}

/** EVENT_MAP webhook Node (route.ts webhook) — event → status & status log. */
function nusuk_event_map(): array
{
    return [
        'PERMIT.ISSUED'  => ['status' => 'ACTIVE',   'logStatus' => 'SUCCESS'],
        'PERMIT.RENEWED' => ['status' => 'ACTIVE',   'logStatus' => 'SUCCESS'],
        'PERMIT.EXPIRED' => ['status' => 'EXPIRED',  'logStatus' => 'SUCCESS'],
        'PERMIT.REVOKED' => ['status' => 'REJECTED', 'logStatus' => 'SUCCESS'],
    ];
}

/** generateApiKey Node: nsk_live_<randomBytes(24) hex>. */
function nusuk_generate_api_key(): string
{
    return 'nsk_live_' . bin2hex(random_bytes(24));
}

/** generateWebhookSecret Node: whsec_<randomBytes(18) hex>. */
function nusuk_generate_webhook_secret(): string
{
    return 'whsec_' . bin2hex(random_bytes(18));
}

/**
 * buildPermitNo — nomor izin deterministik, idempoten antar-sync.
 * Node: sha256(`${licenseNo}:${type}:nusuk`) → parseInt(hex.slice(0,8),16)
 *   → toString().padStart(6,'0').slice(0,6) → `NSK-${code}-2026-${digits}`.
 * Contoh bentuk: NSK-VSA-2026-482913. (Terverifikasi uji silang Node↔PHP.)
 */
function nusuk_build_permit_no(string $licenseNo, string $type): string
{
    $catalog = nusuk_permit_catalog();
    $code = $catalog[$type]['code'] ?? 'GEN';
    $hash = hash('sha256', $licenseNo . ':' . $type . ':nusuk');
    $num = (int) hexdec(substr($hash, 0, 8)); // 8 hex ≤ 0xFFFFFFFF — aman di PHP 64-bit
    $digits = substr(str_pad((string) $num, 6, '0', STR_PAD_LEFT), 0, 6);
    return "NSK-{$code}-2026-{$digits}";
}

/** getConnection Node: db.nusukConnection.findFirst({ orderBy: createdAt asc }). */
function nusuk_get_connection(): ?array
{
    return q_one('SELECT * FROM NusukConnection ORDER BY createdAt ASC LIMIT 1');
}

/** ensureConnection Node — ambil koneksi tunggal atau seed baris baru. */
function nusuk_ensure_connection(): array
{
    $conn = nusuk_get_connection();
    if ($conn !== null) {
        return $conn;
    }
    $now = now_ms();
    $id = new_id();
    q_exec(
        'INSERT INTO NusukConnection (id, environment, apiKey, webhookSecret, status, autoSync, totalSyncs, lastSyncAt, createdAt, updatedAt) VALUES (?,?,?,?,?,?,?,NULL,?,?)',
        [$id, 'SANDBOX', nusuk_generate_api_key(), nusuk_generate_webhook_secret(), 'DISCONNECTED', 1, 0, $now, $now]
    );
    return q_one('SELECT * FROM NusukConnection WHERE id = ?', [$id]) ?? [];
}

/** Math.random() Node — nilai [0, 1). */
function nusuk_random(): float
{
    return random_int(0, PHP_INT_MAX - 1) / PHP_INT_MAX;
}

/** rollStatus Node — distribusi 86% ACTIVE / 7% PENDING / 5% EXPIRED / 2% REJECTED. */
function nusuk_roll_status(): string
{
    $r = nusuk_random();
    if ($r < 0.86) return 'ACTIVE';
    if ($r < 0.93) return 'PENDING';
    if ($r < 0.98) return 'EXPIRED';
    return 'REJECTED';
}

/** Tulis baris NusukSyncLog (createdAt = now_ms) — mirror nusukSyncLog.create Node. */
function nusuk_write_log(string $connectionId, string $type, string $status, string $message, int $recordsAffected = 0, int $durationMs = 0): string
{
    $id = new_id();
    q_exec(
        'INSERT INTO NusukSyncLog (id, connectionId, type, status, message, recordsAffected, durationMs, createdAt) VALUES (?,?,?,?,?,?,?,?)',
        [$id, $connectionId, $type, $status, $message, $recordsAffected, $durationMs, now_ms()]
    );
    return $id;
}

/** Angka bergaya JSON JS: pecahan bulat → int (80.0 diserialisasi "80"). */
function nusuk_num(float $v): int|float
{
    return $v == (int) $v ? (int) $v : $v;
}

/** computeMetrics Node — agregat izin + kesehatan sinkronisasi. */
function nusuk_compute_metrics(): array
{
    $byStatus = q_all('SELECT status, COUNT(*) AS _count FROM NusukPermit GROUP BY status');
    $grouped = q_all('SELECT type, status, COUNT(*) AS _count FROM NusukPermit GROUP BY type, status');
    $logs = q_all('SELECT status, durationMs FROM NusukSyncLog WHERE type = ? ORDER BY createdAt DESC LIMIT 50', ['FULL_SYNC']);
    $logs7d = (int) (q_one('SELECT COUNT(*) AS _count FROM NusukSyncLog WHERE createdAt >= ?', [now_ms() - 7 * 86400000])['_count'] ?? 0);

    $total = 0;
    $statusMap = [];
    foreach ($byStatus as $s) {
        $total += (int) $s['_count'];
        $statusMap[$s['status']] = (int) $s['_count'];
    }
    $get = static fn (string $status): int => $statusMap[$status] ?? 0;

    // typeMap: Map<type, { type, total, active }>
    $typeMap = [];
    foreach ($grouped as $g) {
        $t = (string) $g['type'];
        if (!isset($typeMap[$t])) {
            $typeMap[$t] = ['type' => $t, 'total' => 0, 'active' => 0];
        }
        $typeMap[$t]['total'] += (int) $g['_count'];
        if ($g['status'] === 'ACTIVE') {
            $typeMap[$t]['active'] += (int) $g['_count'];
        }
    }

    $membersConnected = q_all('SELECT DISTINCT memberId FROM NusukPermit WHERE status = ?', ['ACTIVE']);

    $successCount = 0;
    $sumDuration = 0;
    foreach ($logs as $l) {
        if ($l['status'] === 'SUCCESS') {
            $successCount++;
        }
        $sumDuration += (int) $l['durationMs'];
    }
    $n = count($logs);
    $avgDuration = $n ? (int) round($sumDuration / $n) : 0;

    $byType = array_values($typeMap);
    usort($byType, static fn (array $a, array $b): int => strcmp($a['type'], $b['type']));

    return [
        'permitsTotal' => $total,
        'permitsActive' => $get('ACTIVE'),
        'permitsPending' => $get('PENDING'),
        'permitsExpired' => $get('EXPIRED'),
        'permitsRejected' => $get('REJECTED'),
        'membersConnected' => count($membersConnected),
        'successRate' => $n ? nusuk_num(round($successCount / $n * 1000) / 10) : 100,
        'syncsLast7d' => $logs7d,
        'avgDurationMs' => $avgDuration,
        'byType' => $byType,
    ];
}

/**
 * runSync Node — satu siklus sinkronisasi penuh:
 * 1. Ambil anggota TERVERIFIKASI  2. Terbitkan/perbarui izin per eligibility
 * 3. Kedaluwarsakan izin ACTIVE yang lewat masa berlaku  4. Tulis log.
 * Melempar RuntimeException bila koneksi belum CONNECTED (peser identik Node).
 * Catatan: argumen $user disimpan demi konvensi pemanggilan; engine Node tidak
 * menulis AuditLog sehingga logika di sini juga tidak.
 */
function nusuk_run_sync(?array $user = null): array
{
    $started = now_ms();
    $conn = nusuk_ensure_connection();
    if ($conn['status'] !== 'CONNECTED') {
        throw new RuntimeException('Koneksi Nusuk belum aktif. Hubungkan terlebih dahulu di modul Integrasi Nusuk.');
    }

    $members = q_all("SELECT id, licenseNo, type, name FROM Member WHERE status = 'TERVERIFIKASI'");

    $created = 0;
    $updated = 0;
    $skipped = 0;
    $now = now_ms();

    foreach ($members as $member) {
        $types = nusuk_eligibility((string) $member['type']);
        foreach ($types as $type) {
            $spec = nusuk_permit_catalog()[$type] ?? null;
            if ($spec === null) {
                continue;
            }
            $permitNo = nusuk_build_permit_no((string) $member['licenseNo'], $type);
            $existing = q_one('SELECT * FROM NusukPermit WHERE permitNo = ? LIMIT 1', [$permitNo]);

            // ~8% skip mensimulasikan izin yang belum diajukan siklus ini
            if ($existing === null && nusuk_random() < 0.08) {
                $skipped++;
                continue;
            }

            if ($existing === null) {
                $status = nusuk_roll_status();
                $issuedAt = $now - (int) floor(nusuk_random() * 40) * 86400000;
                $expiresAt = $status === 'EXPIRED'
                    ? $now - 86400000
                    : $now + ((int) $spec['validityDays']) * 86400000;
                $quota = (int) ceil((((int) substr($permitNo, -4)) % 40) + 12);
                q_exec(
                    'INSERT INTO NusukPermit (id, memberId, type, permitNo, holderName, meta, status, issuedAt, expiresAt, syncedAt) VALUES (?,?,?,?,?,?,?,?,?,?)',
                    [
                        new_id(),
                        $member['id'],
                        $type,
                        $permitNo,
                        (string) $member['name'],
                        $spec['label'] . ' · quota ' . $quota . ' jamaah',
                        $status,
                        $issuedAt,
                        $expiresAt,
                        $now,
                    ]
                );
                $created++;
            } else {
                $expired = (int) $existing['expiresAt'] < $now;
                q_exec(
                    'UPDATE NusukPermit SET status = ?, syncedAt = ? WHERE permitNo = ?',
                    [$expired ? 'EXPIRED' : (string) $existing['status'], $now, $permitNo]
                );
                $updated++;
            }
        }
    }

    // Kedaluwarsakan izin ACTIVE yang sudah lewat masa berlaku
    $expiredBatch = q_exec("UPDATE NusukPermit SET status = 'EXPIRED' WHERE status = 'ACTIVE' AND expiresAt < ?", [$now]);

    $durationMs = now_ms() - $started;
    $recordsAffected = $created + $updated + $expiredBatch;
    $message = "Sinkronisasi {$conn['environment']}: {$created} izin baru, {$updated} diperbarui, {$expiredBatch} kedaluwarsa dari " . count($members) . " anggota.";

    $logId = nusuk_write_log((string) $conn['id'], 'FULL_SYNC', 'SUCCESS', $message, $recordsAffected, $durationMs);

    q_exec(
        'UPDATE NusukConnection SET lastSyncAt = ?, totalSyncs = totalSyncs + 1, updatedAt = ? WHERE id = ?',
        [$now, now_ms(), $conn['id']]
    );

    return [
        'summary' => [
            'created' => $created,
            'updated' => $updated,
            'expired' => $expiredBatch,
            'skipped' => $skipped,
            'recordsAffected' => $recordsAffected,
            'durationMs' => $durationMs,
        ],
        'logId' => $logId,
        'message' => $message,
    ];
}

/* ==========================================================================
 * ROUTES — mirror src/app/api/nusuk/** (semua route.ts)
 * ========================================================================== */

/** GET /api/nusuk/public — data publik untuk Nusuk Hub (tanpa kredensial). */
$router->on('GET', 'nusuk/public', static function (): void {
    $conn = nusuk_ensure_connection();
    $metrics = nusuk_compute_metrics();
    $ecosystems = array_map(
        static fn (array $e): array => [
            'number' => (int) $e['number'],
            'name' => (string) $e['name'],
            'icon' => (string) $e['icon'],
            'cluster' => (string) $e['cluster'],
        ],
        q_all('SELECT number, name, icon, cluster FROM Ecosystem ORDER BY number ASC')
    );
    $recentLogs = cast_rows('NusukSyncLog', q_all('SELECT * FROM NusukSyncLog ORDER BY createdAt DESC LIMIT 6'));
    $permitGroup = q_all('SELECT memberId, status, COUNT(*) AS _count FROM NusukPermit GROUP BY memberId, status');

    $memberMap = [];
    foreach ($permitGroup as $g) {
        $mid = (string) $g['memberId'];
        if (!isset($memberMap[$mid])) {
            $memberMap[$mid] = ['active' => 0, 'total' => 0];
        }
        $memberMap[$mid]['total'] += (int) $g['_count'];
        if ($g['status'] === 'ACTIVE') {
            $memberMap[$mid]['active'] += (int) $g['_count'];
        }
    }
    $memberIds = [];
    foreach ($memberMap as $k => $v) {
        if ($v['active'] > 0) {
            $memberIds[] = $k;
        }
    }

    $members = [];
    if ($memberIds !== []) {
        $ph = implode(',', array_fill(0, count($memberIds), '?'));
        $members = q_all("SELECT id, name, type, city, rating FROM Member WHERE id IN ($ph) AND status = 'TERVERIFIKASI'", $memberIds);
    }

    // topMembers — sort stabil menurun menurut activePermits (paritas Array.sort JS)
    $rows = [];
    $i = 0;
    foreach ($members as $m) {
        $stat = $memberMap[$m['id']] ?? ['active' => 0, 'total' => 1];
        $rows[] = ['i' => $i++, 'm' => [
            'id' => (string) $m['id'],
            'name' => (string) $m['name'],
            'type' => (string) $m['type'],
            'city' => (string) $m['city'],
            'activePermits' => (int) $stat['active'],
            'compliance' => (int) round(((int) $stat['active'] / max(1, (int) $stat['total'])) * 100),
            'rating' => (float) $m['rating'],
        ]];
    }
    usort($rows, static fn (array $a, array $b): int => [$b['m']['activePermits'], $a['i']] <=> [$a['m']['activePermits'], $b['i']]);
    $topMembers = array_slice(array_column($rows, 'm'), 0, 6);

    $c = cast_row('NusukConnection', $conn);
    ok([
        'connection' => [
            'status' => $c['status'],
            'environment' => $c['environment'],
            'lastSyncAt' => $c['lastSyncAt'],
            'totalSyncs' => (int) $c['totalSyncs'],
            'autoSync' => $c['autoSync'],
        ],
        'metrics' => $metrics,
        'ecosystems' => $ecosystems,
        'recentLogs' => $recentLogs,
        'topMembers' => $topMembers,
    ]);
});

/** GET /api/nusuk/verify — cek keaslian izin secara publik ?no=NSK-VSA-2026-xxxxxx. */
$router->on('GET', 'nusuk/verify', static function (): void {
    $no = strtoupper(trim(qget('no') ?? ''));
    if ($no === '') {
        fail('Nomor izin wajib diisi.', 400);
    }
    if (!preg_match('/^NSK-[A-Z]{3}-\d{4}-\d{4,8}$/', $no)) {
        fail('Format nomor izin tidak valid. Contoh: NSK-VSA-2026-482913', 422);
    }

    $permit = q_one(
        'SELECT p.*, m.name AS __member_name, m.type AS __member_type, m.city AS __member_city, m.licenseNo AS __member_licenseNo, m.status AS __member_status'
        . ' FROM NusukPermit p JOIN Member m ON m.id = p.memberId WHERE p.permitNo = ? LIMIT 1',
        [$no]
    );
    if ($permit === null) {
        fail('Izin tidak ditemukan dalam registri Nusuk-MUHDIN.', 404);
    }

    $now = now_ms();
    $stillValid = $permit['status'] === 'ACTIVE' && (int) $permit['expiresAt'] > $now;
    $effectiveStatus = ($permit['status'] === 'ACTIVE' && !$stillValid) ? 'EXPIRED' : $permit['status'];

    ok([
        'permit' => [
            'permitNo' => (string) $permit['permitNo'],
            'type' => (string) $permit['type'],
            'holderName' => (string) $permit['holderName'],
            'status' => $effectiveStatus,
            'meta' => $permit['meta'],
            'issuedAt' => iso_date((int) $permit['issuedAt']),
            'expiresAt' => iso_date((int) $permit['expiresAt']),
            'lastSync' => iso_date((int) $permit['syncedAt']),
        ],
        'member' => [
            'name' => (string) $permit['__member_name'],
            'type' => (string) $permit['__member_type'],
            'city' => (string) $permit['__member_city'],
            'licenseNo' => (string) $permit['__member_licenseNo'],
            'status' => (string) $permit['__member_status'],
        ],
        'checkedAt' => iso_date($now),
        'environment' => 'NUSUK SANDBOX REGISTRY',
    ]);
});

/** GET /api/nusuk/permits — daftar izin Nusuk (admin) ?status&type&q&page&pageSize. */
$router->on('GET', 'nusuk/permits', static function (): void {
    guard_admin();
    $status = qget('status') ?? '';
    $type = qget('type') ?? '';
    $q = trim(qget('q') ?? '');
    $page = qget_int('page', 1);
    $pageSize = max(0, min(qget_int('pageSize', 10), 50));

    $where = [];
    $params = [];
    if ($status !== '') {
        $where[] = 'NusukPermit.status = ?';
        $params[] = $status;
    }
    if ($type !== '') {
        $where[] = 'NusukPermit.type = ?';
        $params[] = $type;
    }
    if ($q !== '') {
        // LIKE SQLite: case-insensitive ASCII — paritas contains Prisma
        $where[] = '(NusukPermit.permitNo LIKE ? OR NusukPermit.holderName LIKE ? OR Member.name LIKE ?)';
        array_push($params, '%' . strtoupper($q) . '%', '%' . $q . '%', '%' . $q . '%');
    }
    $whereSql = $where === [] ? '' : ' WHERE ' . implode(' AND ', $where);

    $total = (int) (q_one(
        'SELECT COUNT(*) AS _count FROM NusukPermit LEFT JOIN Member ON Member.id = NusukPermit.memberId' . $whereSql,
        $params
    )['_count'] ?? 0);
    $rows = q_all(
        'SELECT NusukPermit.*, Member.id AS __member_id, Member.name AS __member_name, Member.type AS __member_type, Member.city AS __member_city, Member.licenseNo AS __member_licenseNo'
        . ' FROM NusukPermit LEFT JOIN Member ON Member.id = NusukPermit.memberId' . $whereSql
        . ' ORDER BY NusukPermit.syncedAt DESC LIMIT ' . $pageSize . ' OFFSET ' . (($page - 1) * $pageSize),
        $params
    );

    $permits = array_map(static function (array $r): array {
        $member = [
            'id' => (string) $r['__member_id'],
            'name' => (string) $r['__member_name'],
            'type' => (string) $r['__member_type'],
            'city' => (string) $r['__member_city'],
            'licenseNo' => (string) $r['__member_licenseNo'],
        ];
        unset($r['__member_id'], $r['__member_name'], $r['__member_type'], $r['__member_city'], $r['__member_licenseNo']);
        $p = cast_row('NusukPermit', $r);
        $p['member'] = $member;
        return $p;
    }, $rows);

    ok([
        'permits' => $permits,
        'total' => $total,
        'page' => $page,
        'pageSize' => $pageSize,
        'pages' => (int) ceil($total / max(1, $pageSize)),
    ]);
});

/** POST /api/nusuk/sync — jalankan sinkronisasi penuh dengan Nusuk. */
$router->on('POST', 'nusuk/sync', static function (): void {
    $user = guard_role(['SUPER_ADMIN', 'ADMIN']);
    try {
        ok(nusuk_run_sync($user));
    } catch (Throwable $e) {
        $message = $e->getMessage() !== '' ? $e->getMessage() : 'Sinkronisasi gagal.';
        $conn = q_one('SELECT * FROM NusukConnection LIMIT 1');
        if ($conn !== null) {
            nusuk_write_log((string) $conn['id'], 'FULL_SYNC', 'FAILED', $message, 0, 0);
        }
        fail($message, 400);
    }
});

/** Masking kredensial — mirror mask() Node connection/route.ts. */
function nusuk_mask_key(string $key): string
{
    if ($key === '') {
        return '—';
    }
    return substr($key, 0, 12) . str_repeat('•', 16) . substr($key, -4);
}

/** GET /api/nusuk/connection — status koneksi (admin) ?reveal=1 untuk kunci penuh. */
$router->on('GET', 'nusuk/connection', static function (): void {
    guard_admin();
    $conn = nusuk_ensure_connection();
    $c = cast_row('NusukConnection', $conn);
    $reveal = qget('reveal') === '1';
    $payload = [
        'id' => $c['id'],
        'environment' => $c['environment'],
        'status' => $c['status'],
        'autoSync' => $c['autoSync'],
        'totalSyncs' => (int) $c['totalSyncs'],
        'lastSyncAt' => $c['lastSyncAt'],
        'apiKeyMasked' => nusuk_mask_key((string) $c['apiKey']),
    ];
    if ($reveal) {
        $payload['apiKey'] = $c['apiKey'];
        $payload['webhookSecret'] = $c['webhookSecret'];
    }
    ok(['connection' => $payload]);
});

/** POST /api/nusuk/connection — hubungkan ke Nusuk { environment }. */
$router->on('POST', 'nusuk/connection', static function (): void {
    guard_role(['SUPER_ADMIN', 'ADMIN']);
    $environment = body('environment') === 'PRODUCTION' ? 'PRODUCTION' : 'SANDBOX';
    $conn = nusuk_ensure_connection();
    $now = now_ms();
    q_exec(
        'UPDATE NusukConnection SET environment = ?, status = ?, updatedAt = ? WHERE id = ?',
        [$environment, 'CONNECTED', $now, $conn['id']]
    );
    $updated = q_one('SELECT * FROM NusukConnection WHERE id = ?', [$conn['id']]) ?? [];
    nusuk_write_log((string) $updated['id'], 'CONNECTION', 'SUCCESS', "Terhubung ke Nusuk {$environment} — handshake berhasil.");
    $c = cast_row('NusukConnection', $updated);
    unset($c['apiKey'], $c['webhookSecret']);
    ok(['connection' => $c]);
});

/** PUT /api/nusuk/connection — perbarui autoSync { autoSync }. */
$router->on('PUT', 'nusuk/connection', static function (): void {
    guard_role(['SUPER_ADMIN', 'ADMIN']);
    $conn = nusuk_ensure_connection();
    $auto = body('autoSync');
    $now = now_ms();
    q_exec(
        'UPDATE NusukConnection SET autoSync = ?, updatedAt = ? WHERE id = ?',
        [$auto ? 1 : 0, $now, $conn['id']]
    );
    $updated = q_one('SELECT * FROM NusukConnection WHERE id = ?', [$conn['id']]) ?? [];
    $c = cast_row('NusukConnection', $updated);
    unset($c['apiKey'], $c['webhookSecret']);
    ok(['connection' => $c]);
});

/** DELETE /api/nusuk/connection — putuskan koneksi. */
$router->on('DELETE', 'nusuk/connection', static function (): void {
    guard_role(['SUPER_ADMIN', 'ADMIN']);
    $conn = nusuk_ensure_connection();
    $now = now_ms();
    q_exec(
        "UPDATE NusukConnection SET status = 'DISCONNECTED', updatedAt = ? WHERE id = ?",
        [$now, $conn['id']]
    );
    $updated = q_one('SELECT * FROM NusukConnection WHERE id = ?', [$conn['id']]) ?? [];
    nusuk_write_log((string) $updated['id'], 'CONNECTION', 'FAILED', 'Koneksi Nusuk diputus manual oleh administrator.');
    $c = cast_row('NusukConnection', $updated);
    unset($c['apiKey'], $c['webhookSecret']);
    ok(['connection' => $c]);
});

/**
 * POST /api/nusuk/webhook — webhook receiver Nusuk (endpoint publik + signature).
 * Header : X-Nusuk-Signature
 * Body   : { permitNo, event: PERMIT.ISSUED|PERMIT.RENEWED|PERMIT.EXPIRED|PERMIT.REVOKED, note? }
 *
 * Verifikasi signature (hash_equals konstan-waktu):
 *   1. Paritas Node   : header === webhookSecret (dipakai uji webhook CMS).
 *   2. Mode HMAC edisi PHP: hash_hmac('sha256', RAW BODY, webhookSecret) hex.
 */
$router->on('POST', 'nusuk/webhook', static function (): void {
    $conn = nusuk_ensure_connection();
    $signature = $_SERVER['HTTP_X_NUSUK_SIGNATURE'] ?? '';
    $raw = file_get_contents('php://input') ?: '';

    $secret = (string) $conn['webhookSecret'];
    $hmac = $secret !== '' ? hash_hmac('sha256', $raw, $secret) : '';
    $valid = $signature !== ''
        && (hash_equals($secret, $signature) || ($hmac !== '' && hash_equals($hmac, $signature)));
    if (!$valid) {
        fail('Signature webhook tidak valid.', 401);
    }

    $body = json_decode($raw, true);
    if (!is_array($body) || !is_string($body['permitNo'] ?? null) || !is_string($body['event'] ?? null)) {
        fail('Payload webhook tidak lengkap: permitNo & event wajib.', 422);
    }

    $permitNo = strtoupper(trim($body['permitNo']));
    $permit = q_one('SELECT * FROM NusukPermit WHERE permitNo = ? LIMIT 1', [$permitNo]);
    if ($permit === null) {
        fail("Izin {$permitNo} tidak ditemukan.", 404);
    }

    $mapped = nusuk_event_map()[$body['event']] ?? null;
    if ($mapped === null) {
        fail("Event tidak dikenal: {$body['event']}", 422);
    }

    $now = now_ms();
    $expiresAt = match ((string) $body['event']) {
        'PERMIT.RENEWED' => $now + ((int) (nusuk_permit_catalog()[$permit['type']]['validityDays'] ?? 90)) * 86400000,
        'PERMIT.EXPIRED' => $now,
        default => (int) $permit['expiresAt'],
    };

    q_exec(
        'UPDATE NusukPermit SET status = ?, expiresAt = ?, syncedAt = ? WHERE permitNo = ?',
        [$mapped['status'], $expiresAt, $now, $permitNo]
    );
    $updated = q_one('SELECT * FROM NusukPermit WHERE permitNo = ? LIMIT 1', [$permitNo]) ?? [];

    $note = array_key_exists('note', $body) ? $body['note'] : null;
    $truthyNote = !($note === null || $note === false || $note === 0 || $note === '' || $note === []);
    $message = "{$body['event']} → {$permitNo} status menjadi {$mapped['status']}."
        . ($truthyNote ? ' Catatan: ' . (string) $note : '');

    nusuk_write_log((string) $conn['id'], 'WEBHOOK', $mapped['logStatus'], $message, 1, max(1, now_ms() % 97));

    $u = cast_row('NusukPermit', $updated);
    ok([
        'received' => true,
        'permitNo' => $permitNo,
        'event' => $body['event'],
        'status' => $u['status'],
        'expiresAt' => $u['expiresAt'],
    ]);
});

/** GET /api/nusuk/logs — log sinkronisasi (admin) ?limit. */
$router->on('GET', 'nusuk/logs', static function (): void {
    guard_admin();
    $limit = min(qget_int('limit', 25), 100);
    if ($limit < 0) {
        $limit = 0;
    }
    ok(['logs' => cast_rows('NusukSyncLog', q_all('SELECT * FROM NusukSyncLog ORDER BY createdAt DESC LIMIT ' . $limit))]);
});

/** POST /api/nusuk/rotate — rotasi API key & webhook secret Nusuk. */
$router->on('POST', 'nusuk/rotate', static function (): void {
    guard_role(['SUPER_ADMIN', 'ADMIN']);
    $conn = nusuk_ensure_connection();
    $now = now_ms();
    q_exec(
        'UPDATE NusukConnection SET apiKey = ?, webhookSecret = ?, updatedAt = ? WHERE id = ?',
        [nusuk_generate_api_key(), nusuk_generate_webhook_secret(), $now, $conn['id']]
    );
    nusuk_write_log((string) $conn['id'], 'CONNECTION', 'SUCCESS', 'Rotasi kredensial API — kunci lama dicabut otomatis.');
    ok(['message' => 'Kredensial Nusuk berhasil dirotasi.']);
});
