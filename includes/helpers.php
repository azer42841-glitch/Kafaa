<?php
function e($s): string { return htmlspecialchars((string)$s, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8'); }
function redirect(string $p, array $q = []): void { header('Location: index.php?p=' . rawurlencode($p) . ($q ? '&' . http_build_query($q) : '')); exit; }
function flash(string $msg, string $type = 'ok'): void { $_SESSION['flash'][] = [$type, $msg]; }
function now_utc(): string { return gmdate('Y-m-d H:i:s'); }
function client_ip(): string { return (string)($_SERVER['REMOTE_ADDR'] ?? '0.0.0.0'); }
function audit(string $actor, string $action, string $detail = ''): void {
    db()->prepare('INSERT INTO audit_log(actor, action, detail) VALUES(?,?,?)')->execute([mb_substr($actor, 0, 80), mb_substr($action, 0, 80), mb_substr($detail, 0, 300)]);
}
// تحديد المعدل: عدد المحاولات خلال نافذة زمنية
function rate_count(string $k, int $win): int { $s = db()->prepare('SELECT COUNT(*) FROM rate_events WHERE k = ? AND at > ?'); $s->execute([$k, time() - $win]); return (int)$s->fetchColumn(); }
function rate_hit(string $k): void { db()->prepare('INSERT INTO rate_events(k, at) VALUES(?,?)')->execute([$k, time()]); if (random_int(1, 50) === 1) db()->prepare('DELETE FROM rate_events WHERE at < ?')->execute([time() - 172800]); }
