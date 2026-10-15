<?php
function csp_nonce(): string { static $n = null; return $n ??= base64_encode(random_bytes(12)); }
function send_security_headers(): void {
    header('X-Content-Type-Options: nosniff');
    header('X-Frame-Options: DENY');
    header('Referrer-Policy: same-origin');
    header('Permissions-Policy: camera=(self), microphone=(self), geolocation=()');
    header("Content-Security-Policy: default-src 'self'; img-src 'self' data:; style-src 'self' 'unsafe-inline'; script-src 'self' 'nonce-" . csp_nonce() . "'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'");
    if (!empty($_SERVER['HTTPS'])) header('Strict-Transport-Security: max-age=31536000');
}
function csrf_token(): string { return $_SESSION['csrf'] ??= bin2hex(random_bytes(16)); }
function csrf_field(): string { return '<input type="hidden" name="csrf" value="' . e(csrf_token()) . '">'; }
function csrf_check(): void {
    $t = (string)($_POST['csrf'] ?? $_SERVER['HTTP_X_CSRF'] ?? '');
    if ($t === '' || !hash_equals(csrf_token(), $t)) { http_response_code(419); exit('انتهت صلاحية الجلسة، ارجع للصفحة السابقة وأعد المحاولة.'); }
}
