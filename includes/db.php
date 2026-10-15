<?php
function db(): PDO {
    static $pdo = null;
    if ($pdo === null) {
        $pdo = new PDO('mysql:host=' . DB_HOST . ';port=' . (int)DB_PORT . ';dbname=' . DB_NAME . ';charset=utf8mb4', DB_USER, DB_PASS, [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES => false,
        ]);
        $pdo->exec("SET time_zone = '+00:00', sql_mode = 'STRICT_ALL_TABLES,NO_ZERO_DATE,NO_ZERO_IN_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION'");
    }
    return $pdo;
}
set_exception_handler(function (Throwable $e): void {
    error_log((string)$e);
    while (ob_get_level() > 0) ob_end_clean();
    if (!headers_sent()) { http_response_code(500); header('Content-Type: text/html; charset=utf-8'); }
    echo '<!DOCTYPE html><html lang="ar" dir="rtl"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>' . e(SITE_NAME) . '</title>'
       . '<body style="font-family:system-ui,Tahoma;display:grid;place-items:center;min-height:100vh;margin:0;background:#f4f7fb"><div style="background:#fff;padding:24px;border-radius:14px;max-width:480px;line-height:1.8"><h2>' . e(SITE_NAME) . '</h2><p>حدث خطأ غير متوقع. حاول مرة أخرى بعد قليل.</p>'
       . (DEBUG ? '<pre dir="ltr">' . e($e->getMessage()) . '</pre>' : '') . '</div></body></html>';
});
function setting(string $k, string $d = ''): string { $s = db()->prepare('SELECT v FROM settings WHERE k = ?'); $s->execute([$k]); $v = $s->fetchColumn(); return $v === false ? $d : (string)$v; }
function setting_set(string $k, string $v): void { db()->prepare('INSERT INTO settings(k,v) VALUES(?,?) ON DUPLICATE KEY UPDATE v = VALUES(v)')->execute([$k, $v]); }
