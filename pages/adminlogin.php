<?php
if (is_admin()) redirect('admin');
$err = ''; $ready = setting('admin_hash') !== '';
if ($ready && $_SERVER['REQUEST_METHOD'] === 'POST') {
    csrf_check(); $ip = client_ip();
    if (rate_count("adm:$ip", 900) >= 6) $err = 'محاولات كثيرة. انتظر 15 دقيقة.';
    elseif (hash_equals(setting('admin_user'), (string)($_POST['user'] ?? '')) && admin_password_ok((string)($_POST['pw'] ?? ''))) {
        session_regenerate_id(true);
        $_SESSION['admin'] = 1; $_SESSION['admin_seen'] = time(); $_SESSION['admin_at'] = time();
        $_SESSION['admin_ua'] = hash('sha256', (string)($_SERVER['HTTP_USER_AGENT'] ?? ''));
        audit('admin', 'login', $ip); redirect('admin');
    } else { rate_hit("adm:$ip"); $err = 'بيانات الدخول غير صحيحة'; }
}
page_head('دخول الإدارة', 'authpg');
?>
<div class="auth"><h1>دخول الإدارة</h1>
<?php if (!$ready): ?><div class="flash err">لم يكتمل التثبيت بعد: افتح install.php لإنشاء حساب الإدارة.</div><?php else: ?>
<?php if ($err): ?><div class="flash err"><?= e($err) ?></div><?php endif; ?>
<form method="post"><?= csrf_field() ?><label>اسم المستخدم</label><input name="user" required dir="ltr" autocomplete="username"><label>كلمة المرور</label><input type="password" name="pw" required dir="ltr" autocomplete="current-password"><button class="btn">دخول</button></form>
<?php endif; ?></div>
<?php page_foot();
