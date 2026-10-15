<?php
declare(strict_types=1);
require __DIR__ . '/../includes/bootstrap.php';
require __DIR__ . '/../database/seed.php';
try { kafaa_schema(); kafaa_migrate(); kafaa_seed(); kafaa_seed_countries(); } catch (Throwable $x) { http_response_code(500); exit('تعذّر إعداد قاعدة البيانات، راجع includes/config.local.php'); }
if (setting('admin_hash') !== '') { http_response_code(403); exit('التثبيت مكتمل ومقفل.'); }
$err = '';
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    csrf_check();
    $u = trim((string)($_POST['user'] ?? '')); $p = (string)($_POST['pw'] ?? '');
    if (!preg_match('/^[A-Za-z0-9_.-]{3,30}$/', $u)) $err = 'اسم المستخدم 3-30 حرفاً لاتينياً أو أرقاماً';
    elseif (strlen($p) < 10) $err = 'كلمة المرور 10 أحرف على الأقل';
    elseif ($p !== (string)($_POST['pw2'] ?? '')) $err = 'كلمتا المرور غير متطابقتين';
    else {
        setting_set('admin_user', $u); setting_set('admin_hash', password_hash($p, PASSWORD_DEFAULT)); setting_set('admin_pw_epoch', (string)time());
        audit('install', 'admin_created', $u); header('Location: index.php?p=adminlogin'); exit;
    }
}
header('Content-Type: text/html; charset=utf-8');
?><!DOCTYPE html><html lang="ar" dir="rtl"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>تثبيت منصة سلاسة</title>
<link rel="stylesheet" href="assets/style.css"><body class="authpg"><main><div class="auth"><h1>تثبيت منصة سلاسة</h1><p class="muted">تم إنشاء الجداول والمساقات. اختر حساب الإدارة:</p>
<?php if ($err): ?><div class="flash err"><?= e($err) ?></div><?php endif; ?>
<form method="post"><?= csrf_field() ?><label>اسم مستخدم الإدارة</label><input name="user" required dir="ltr"><label>كلمة المرور (10 أحرف على الأقل)</label><input type="password" name="pw" required minlength="10" dir="ltr"><label>تأكيد كلمة المرور</label><input type="password" name="pw2" required minlength="10" dir="ltr"><button class="btn">إنشاء حساب الإدارة</button></form></div></main></body></html>
