<?php
function is_student(): bool { return !empty($_SESSION['uid']); }
function is_admin(): bool { return !empty($_SESSION['admin']); }
function require_student(): void { if (!is_student()) { flash('سجّل الدخول أولاً', 'err'); redirect('login'); } }
function require_admin(): void { if (!is_admin()) redirect('adminlogin'); }
function cur_user(): ?array { static $u = false; if ($u === false) { $s = db()->prepare('SELECT id, name, email FROM users WHERE id = ?'); $s->execute([(int)($_SESSION['uid'] ?? 0)]); $u = $s->fetch() ?: null; } return $u; }
function admin_password_ok(string $p): bool { $h = setting('admin_hash'); return $h !== '' && password_verify($p, $h); }
// المستوى الأول من كل مساق مفتوح، وبقية المستويات تُفتح بمنح من الإدارة (أو بإتمام المستوى السابق)
function level_open(int $uid, array $lvl): bool {
    if ((int)$lvl['ord'] === 1) return true;
    $s = db()->prepare('SELECT 1 FROM level_access WHERE user_id = ? AND level_id = ?'); $s->execute([$uid, (int)$lvl['id']]);
    return (bool)$s->fetchColumn();
}
