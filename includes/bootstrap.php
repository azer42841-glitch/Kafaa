<?php
declare(strict_types=1);
require __DIR__ . '/config.php';
ini_set('display_errors', DEBUG ? '1' : '0'); ini_set('log_errors', '1'); error_reporting(E_ALL);
require __DIR__ . '/helpers.php';
require __DIR__ . '/db.php';
require __DIR__ . '/security.php';
require __DIR__ . '/auth.php';
require __DIR__ . '/blocks.php';
require __DIR__ . '/ai_meter.php';
require __DIR__ . '/country.php';

$__own = dirname(__DIR__) . '/data/sessions';
if (is_dir($__own) && is_writable($__own)) session_save_path($__own);
if (session_status() !== PHP_SESSION_ACTIVE) {
    ini_set('session.use_strict_mode', '1'); ini_set('session.use_only_cookies', '1');
    session_name('KAFAASESS');
    session_set_cookie_params(['lifetime' => 0, 'path' => '/', 'httponly' => true, 'samesite' => 'Lax', 'secure' => !empty($_SERVER['HTTPS'])]);
    session_start();
}
send_security_headers();
if (!empty($_SESSION['admin'])) {
    $idle = time() - (int)($_SESSION['admin_seen'] ?? 0);
    $uaBad = isset($_SESSION['admin_ua']) && !hash_equals((string)$_SESSION['admin_ua'], hash('sha256', (string)($_SERVER['HTTP_USER_AGENT'] ?? '')));
    if ($idle > SESSION_IDLE_ADMIN || $uaBad || (int)($_SESSION['admin_at'] ?? 0) < (int)setting('admin_pw_epoch', '0')) {
        unset($_SESSION['admin'], $_SESSION['admin_seen'], $_SESSION['admin_ua'], $_SESSION['admin_at']);
    } else $_SESSION['admin_seen'] = time();
}
