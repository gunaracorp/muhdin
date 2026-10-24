<?php
/**
 * nusuk.php — Mesin integrasi Nusuk MUHDIN (Edisi Shared Hosting, PHP murni).
 * Rekonstruksi Task 30-a — paritas kontrak Node (2026-09-21).
 *
 * Replika src/lib/nusuk-engine.ts + logika webhook
 * (src/app/api/nusuk/webhook/route.ts):
 *   - PERMIT_CATALOG: 6 jenis izin (code/label/validityDays/ecosystem/icon) persis.
 *   - ELIGIBILITY: tipe anggota -> jenis izin yang layak disinkronkan.
 *   - ensure_connection(): baris NusukConnection pertama (order createdAt ASC)
 *     atau dibuat otomatis (SANDBOX + kredensial acak nsk_live_/whsec_).
 *   - build_permit_no(): nomor izin DETERMINISTIK sha256, idempoten antar-sync,
 *     algoritma persis Node: "NSK-<code>-2026-" + 6 digit dari 8-hex pertama
 *     (parseInt(hex,16).toString().padStart(6,'0').slice(0,6)).
 *   - run_sync(): siklus sinkron penuh (terbitkan/perbarui izin per eligibility,
 *     kedaluwarsakan yang lewat, tulis NusukSyncLog, naikkan totalSyncs).
 *   - compute_metrics(): ringkasan metrik dashboard Nusuk.
 *   - Webhook: 2 jalur verifikasi X-Nusuk-Signature — (1) paritas Node persis
 *     (signature == webhookSecret, hash_equals) DAN (2) HMAC-SHA256 body
 *     (hash_hmac 256, kontrak Task 30-a) — keduanya tahan timing.
 *
 * Semua tanggal ditulis epoch-ms (now_ms()) dan dinormalkan ISO-8601 hanya saat
 * output oleh cast_row() di lib.php. PHP 7.4+ tanpa dependensi eksternal.
 */

require_once __DIR__ . '/config.php';
require_once __DIR__ . '/lib.php';

/* ---- 1. KATALOG IZIN & ELIGIBILITY (paritas persis PERMIT_CATALOG / ELIGIBILITY) ---- */

/** 6 jenis izin Nusuk — nilai field identik nusuk-engine.ts. */
function nusuk_permit_catalog() {
    static $catalog = null;
    if ($catalog === null) {
        $catalog = array(
            'VISA'      => array('code' => 'VSA', 'label' => 'Nusuk Visa Authorization', 'validityDays' => 90,  'ecosystem' => 1, 'icon' => 'passport'),
            'HANDLING'  => array('code' => 'HDL', 'label' => 'Nusuk Handling Clearance', 'validityDays' => 180, 'ecosystem' => 2, 'icon' => 'plane-landing'),
            'MUTAWIF'   => array('code' => 'MTW', 'label' => 'Nusuk Mutawif License',    'validityDays' => 365, 'ecosystem' => 5, 'icon' => 'compass'),
            'HOTEL'     => array('code' => 'HTL', 'label' => 'Nusuk Hotel Contract',      'validityDays' => 365, 'ecosystem' => 6, 'icon' => 'building-2'),
            'TRANSPORT' => array('code' => 'TRN', 'label' => 'Nusuk Transport Permit',    'validityDays' => 120, 'ecosystem' => 7, 'icon' => 'bus'),
            'RAUDAH'    => array('code' => 'RDH', 'label' => 'Nusuk Rawdah Permit',      'validityDays' => 30,  'ecosystem' => 9, 'icon' => 'moon-star'),
        );
    }
    return $catalog;
}

/** Tipe anggota → jenis izin yang layak (identik ELIGIBILITY Node). */
function nusuk_eligibility() {
    static $map = null;
    if ($map === null) {
        $map = array(
            'PPIU'          => array('VISA', 'HANDLING', 'HOTEL', 'TRANSPORT', 'RAUDAH'),
            'PIHK'          => array('VISA', 'HOTEL', 'TRANSPORT', 'RAUDAH'),
            'KBIHU'         => array('VISA', 'HANDLING'),
            'IPHI'          => array('MUTAWIF'),
            'TRAVEL_WISATA' => array('TRANSPORT', 'HOTEL'),
        );
    }
    return $map;
}

/* ---- 2. KONEKSI — paritas getConnection() / ensureConnection() / generator ---- */

/** Baris koneksi pertama (order createdAt ASC) atau null. */
function nusuk_get_connection() {
    return db_one(
        'SELECT * FROM "NusukConnection" ORDER BY "createdAt" ASC LIMIT 1',
        array(),
        'NusukConnection'
    );
}

/** Kredensial acak gaya Node: nsk_live_<48 hex> / whsec_<36 hex>. */
function nusuk_generate_api_key() {
    return 'nsk_live_' . bin2hex(random_bytes(24));
}

function nusuk_generate_webhook_secret() {
    return 'whsec_' . bin2hex(random_bytes(18));
}

/** Ambil koneksi atau buat baris default SANDBOX baru (idempoten). */
function nusuk_ensure_connection() {
    $conn = nusuk_get_connection();
    if ($conn) {
        return $conn;
    }
    db_insert('NusukConnection', array(
        'environment'   => 'SANDBOX',
        'apiKey'        => nusuk_generate_api_key(),
        'webhookSecret' => nusuk_generate_webhook_secret(),
        'status'        => 'DISCONNECTED',
        'autoSync'      => 1,
        'totalSyncs'    => 0,
    ));
    return nusuk_get_connection();
}

/* ---- 3. NOMOR IZIN DETERMINISTIK — paritas buildPermitNo() ---- */

/** "NSK-<code>-2026-<6 digit>" dari sha256(licenseNo:type:nusuk). Node: parseInt(hash.slice(0,8),16).toString().padStart(6,'0').slice(0,6) PHP : hexdec 8-hex pertama (aman 64-bit), pad 6, ambil 6 karakter pertama. */
function nusuk_build_permit_no($licenseNo, $type) {
    $catalog = nusuk_permit_catalog();
    $code = isset($catalog[$type]['code']) ? $catalog[$type]['code'] : 'GEN';
    $hash = hash('sha256', $licenseNo . ':' . $type . ':nusuk');
    $digits = str_pad((string) (int) hexdec(substr($hash, 0, 8)), 6, '0', STR_PAD_LEFT);
    $digits = substr($digits, 0, 6);
    return 'NSK-' . $code . '-2026-' . $digits;
}

/** Simulasi status penerbitan (paritas rollStatus): 86% ACTIVE, 7% PENDING, 5% EXPIRED, 4% REJECTED. */
function nusuk_roll_status() {
    $r = mt_rand() / mt_getrandmax();
    if ($r < 0.86) return 'ACTIVE';
    if ($r < 0.93) return 'PENDING';
    if ($r < 0.98) return 'EXPIRED';
    return 'REJECTED';
}

/* ---- 4. SINKRONISASI PENUH — paritas runSync() ---- */

/**
 * Jalankan satu siklus sinkronisasi penuh:
 *  1. Ambil anggota TERVERIFIKASI
 *  2. Terbitkan/perbarui izin per eligibility (+~8% skip simulasi)
 *  3. Kedaluwarsakan izin ACTIVE yang lewat masa berlaku
 *  4. Tulis NusukSyncLog + perbarui lastSyncAt/totalSyncs
 * Lempar Exception bila koneksi belum CONNECTED (pesan persis Node).
 */
function nusuk_run_sync() {
    $started = now_ms();
    $conn = nusuk_ensure_connection();
    if ($conn['status'] !== 'CONNECTED') {
        throw new Exception('Koneksi Nusuk belum aktif. Hubungkan terlebih dahulu di modul Integrasi Nusuk.');
    }

    $members = db_all(
        'SELECT "id", "licenseNo", "type", "name" FROM "Member" WHERE "status" = ?',
        array('TERVERIFIKASI')
    );
    $eligibility = nusuk_eligibility();
    $catalog = nusuk_permit_catalog();

    $created = 0;
    $updated = 0;
    $skipped = 0;
    $now = now_ms();

    foreach ($members as $member) {
        $types = isset($eligibility[$member['type']]) ? $eligibility[$member['type']] : array('VISA');
        foreach ($types as $type) {
            if (!isset($catalog[$type])) {
                continue;
            }
            $spec = $catalog[$type];
            $permitNo = nusuk_build_permit_no($member['licenseNo'], $type);
            $existing = db_one('SELECT * FROM "NusukPermit" WHERE "permitNo" = ?', array($permitNo));

            // ~8% skip mensimulasikan izin yang belum diajukan siklus ini.
            if (!$existing && (mt_rand() / mt_getrandmax()) < 0.08) {
                $skipped++;
                continue;
            }

            if (!$existing) {
                $status = nusuk_roll_status();
                $issuedAt = $now - mt_rand(0, 39) * 86400000; // ≤40 hari lalu
                $expiresAt = ($status === 'EXPIRED')
                    ? $now - 86400000
                    : $now + $spec['validityDays'] * 86400000;
                $quotaTail = (int) substr($permitNo, -4); // paritas parseInt(slice(-4))
                $quota = (int) ceil(($quotaTail % 40) + 12);
                db_insert('NusukPermit', array(
                    'memberId'   => $member['id'],
                    'type'       => $type,
                    'permitNo'   => $permitNo,
                    'holderName' => $member['name'],
                    'meta'       => $spec['label'] . ' · quota ' . $quota . ' jamaah',
                    'status'     => $status,
                    'issuedAt'   => $issuedAt,
                    'expiresAt'  => $expiresAt,
                    'syncedAt'   => $now,
                ));
                $created++;
            } else {
                $expired = (int) $existing['expiresAt'] < $now;
                db_run(
                    'UPDATE "NusukPermit" SET "status" = ?, "syncedAt" = ? WHERE "permitNo" = ?',
                    array($expired ? 'EXPIRED' : $existing['status'], $now, $permitNo)
                );
                $updated++;
            }
        }
    }

    // Kedaluwarsakan izin ACTIVE yang sudah lewat masa berlaku (batch).
    $expired = db_run(
        'UPDATE "NusukPermit" SET "status" = ? WHERE "status" = ? AND "expiresAt" < ?',
        array('EXPIRED', 'ACTIVE', $now)
    );

    $durationMs = now_ms() - $started;
    $recordsAffected = $created + $updated + $expired;
    $message = 'Sinkronisasi ' . $conn['environment'] . ': ' . $created . ' izin baru, ' .
        $updated . ' diperbarui, ' . $expired . ' kedaluwarsa dari ' . count($members) . ' anggota.';

    $logId = db_insert('NusukSyncLog', array(
        'connectionId'    => $conn['id'],
        'type'            => 'FULL_SYNC',
        'status'          => 'SUCCESS',
        'message'         => $message,
        'recordsAffected' => $recordsAffected,
        'durationMs'      => $durationMs,
    ));

    db_run(
        'UPDATE "NusukConnection" SET "lastSyncAt" = ?, "totalSyncs" = "totalSyncs" + 1 WHERE "id" = ?',
        array($now, $conn['id'])
    );

    return array(
        'summary' => array(
            'created'         => $created,
            'updated'         => $updated,
            'expired'         => $expired,
            'skipped'         => $skipped,
            'recordsAffected' => $recordsAffected,
            'durationMs'      => (int) $durationMs,
        ),
        'logId'   => $logId,
        'message' => $message,
    );
}

/* ---- 5. METRIK DASHBOARD — paritas computeMetrics() ---- */

/** Ringkasan metrik izin & sinkronisasi (bentuk output identik Node). */
function nusuk_compute_metrics() {
    $byStatusRows = db_all(
        'SELECT "status", COUNT(*) AS cnt FROM "NusukPermit" GROUP BY "status"'
    );
    $grouped = db_all(
        'SELECT "type", "status", COUNT(*) AS cnt FROM "NusukPermit" GROUP BY "type", "status"'
    );
    $logs = db_all(
        'SELECT "status", "durationMs" FROM "NusukSyncLog" WHERE "type" = ? ' .
        'ORDER BY "createdAt" DESC LIMIT 50',
        array('FULL_SYNC')
    );
    $logs7d = (int) db_val(
        'SELECT COUNT(*) FROM "NusukSyncLog" WHERE "createdAt" >= ?',
        array(now_ms() - 7 * 86400000)
    );
    $membersConnected = (int) db_val(
        'SELECT COUNT(DISTINCT "memberId") FROM "NusukPermit" WHERE "status" = ?',
        array('ACTIVE')
    );

    $total = 0;
    $getMap = array();
    foreach ($byStatusRows as $r) {
        $getMap[$r['status']] = (int) $r['cnt'];
        $total += (int) $r['cnt'];
    }

    // Agregasi per tipe (paritas typeMap Node) lalu urut berdasarkan type.
    $typeMap = array();
    foreach ($grouped as $g) {
        $t = $g['type'];
        if (!isset($typeMap[$t])) {
            $typeMap[$t] = array('type' => $t, 'total' => 0, 'active' => 0);
        }
        $typeMap[$t]['total'] += (int) $g['cnt'];
        if ($g['status'] === 'ACTIVE') {
            $typeMap[$t]['active'] += (int) $g['cnt'];
        }
    }
    $byType = array_values($typeMap);
    usort($byType, function ($a, $b) {
        return strcmp($a['type'], $b['type']); // paritas localeCompare utk ASCII
    });

    $logCount = count($logs);
    $successCount = 0;
    $sumDuration = 0;
    foreach ($logs as $l) {
        if ($l['status'] === 'SUCCESS') $successCount++;
        $sumDuration += (int) $l['durationMs'];
    }
    // Node: Math.round((success/len)*1000)/10 — utuh saat kelipatan 10.
    $successRate = 100;
    if ($logCount > 0) {
        $rate = round(($successCount / $logCount) * 1000) / 10;
        $successRate = ((int) $rate === (float) $rate) ? (int) $rate : $rate;
    }

    return array(
        'permitsTotal'     => $total,
        'permitsActive'    => isset($getMap['ACTIVE']) ? $getMap['ACTIVE'] : 0,
        'permitsPending'   => isset($getMap['PENDING']) ? $getMap['PENDING'] : 0,
        'permitsExpired'   => isset($getMap['EXPIRED']) ? $getMap['EXPIRED'] : 0,
        'permitsRejected'  => isset($getMap['REJECTED']) ? $getMap['REJECTED'] : 0,
        'membersConnected' => $membersConnected,
        'successRate'      => $successRate,
        'syncsLast7d'      => $logs7d,
        'avgDurationMs'    => $logCount > 0 ? (int) round($sumDuration / $logCount) : 0,
        'byType'           => $byType,
    );
}

/* ---- 6. WEBHOOK — paritas src/app/api/nusuk/webhook/route.ts ---- */

/** Cari izin berdasarkan permitNo (trim + uppercase, paritas route). */
function nusuk_find_permit($permitNo) {
    $permitNo = strtoupper(trim((string) $permitNo));
    if ($permitNo === '') {
        return null;
    }
    return db_one('SELECT * FROM "NusukPermit" WHERE "permitNo" = ?', array($permitNo), 'NusukPermit');
}

/**
 * Verifikasi signature webhook (header "X-Nusuk-Signature").
 * 1. PARITAS NODE PERSIS (src/app/api/nusuk/webhook/route.ts): signature
 *    sama persis dengan conn.webhookSecret → hash_equals (tahan timing).
 * 2. UPGRADE HMAC-SHA256 (kontrak Task 30-a): signature sama dengan
 *    hash_hmac('sha256', rawBody, webhookSecret) — bila $rawBody diberikan.
 * Keduanya diterima agar webhook Node lama & klien HMAC baru sama-sama lolos.
 */
function nusuk_verify_webhook_signature($signature, $conn, $rawBody = null) {
    $secret = is_array($conn)
        ? (isset($conn['webhookSecret']) ? (string) $conn['webhookSecret'] : '')
        : (string) $conn;
    if ($signature === null || (string) $signature === '') {
        return false; // Node: !signature → gagal
    }
    $sig = (string) $signature;
    if ($secret !== '' && hash_equals($secret, $sig)) {
        return true; // kontrak Node: signature == webhookSecret
    }
    if ($rawBody !== null && $secret !== '') {
        $hmac = nusuk_webhook_hmac($rawBody, $secret);
        return hash_equals($hmac, $sig); // HMAC-SHA256 hex atas body mentah
    }
    return false;
}

/** HMAC-SHA256 hex atas body mentah dengan kunci webhookSecret — jalur verifikasi kedua (Task 30-a). */
function nusuk_webhook_hmac($rawBody, $secret) {
    return hash_hmac('sha256', (string) $rawBody, (string) $secret);
}

/** Peta event webhook → status izin & status log (paritas EVENT_MAP). */
function nusuk_webhook_event_map() {
    return array(
        'PERMIT.ISSUED'  => array('status' => 'ACTIVE',   'logStatus' => 'SUCCESS'),
        'PERMIT.RENEWED' => array('status' => 'ACTIVE',   'logStatus' => 'SUCCESS'),
        'PERMIT.EXPIRED' => array('status' => 'EXPIRED',  'logStatus' => 'SUCCESS'),
        'PERMIT.REVOKED' => array('status' => 'REJECTED', 'logStatus' => 'SUCCESS'),
    );
}

/** expiresAt baru akibat event: RENEWED → now + validity izin (default 90), EXPIRED → now, lainnya → nilai lama. Paritas logika route webhook. */
function nusuk_webhook_expires_at($event, array $permit, $nowMs) {
    if ($event === 'PERMIT.RENEWED') {
        $catalog = nusuk_permit_catalog();
        $days = isset($catalog[$permit['type']]['validityDays']) ? $catalog[$permit['type']]['validityDays'] : 90;
        return (int) $nowMs + $days * 86400000;
    }
    if ($event === 'PERMIT.EXPIRED') {
        return (int) $nowMs;
    }
    return (int) $permit['expiresAt'];
}

/** Pesan log sinkron webhook — format persis route Node. */
function nusuk_webhook_log_message($event, $permitNo, $status, $note = null) {
    $msg = $event . ' → ' . $permitNo . ' status menjadi ' . $status . '.';
    if ($note) {
        $msg .= ' Catatan: ' . $note;
    }
    return $msg;
}

/** durationMs log webhook — paritas Math.max(1, Date.now() % 97). */
function nusuk_webhook_duration() {
    return max(1, now_ms() % 97);
}
