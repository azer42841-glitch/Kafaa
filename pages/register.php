<?php
if (is_student()) redirect('home');
$err = ''; $v = ['name' => '', 'email' => ''];
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    csrf_check();
    $v = ['name' => trim((string)($_POST['name'] ?? '')), 'email' => strtolower(trim((string)($_POST['email'] ?? '')))];
    $pw = (string)($_POST['password'] ?? ''); $pw2 = (string)($_POST['password2'] ?? ''); $ip = client_ip();
    if (rate_count("reg:$ip", 3600) >= 10) $err = 'محاولات كثيرة، حاول لاحقاً.';
    elseif (mb_strlen($v['name']) < 2 || mb_strlen($v['name']) > 80) $err = 'الاسم من حرفين إلى 80 حرفاً';
    elseif (!filter_var($v['email'], FILTER_VALIDATE_EMAIL) || strlen($v['email']) > 190) $err = 'البريد الإلكتروني غير صالح';
    elseif (strlen($pw) < 8) $err = 'كلمة المرور 8 أحرف على الأقل';
    elseif ($pw !== $pw2) $err = 'كلمتا المرور غير متطابقتين';
    else {
        rate_hit("reg:$ip");
        $s = db()->prepare('SELECT 1 FROM users WHERE email = ?'); $s->execute([$v['email']]);
        if ($s->fetchColumn()) $err = 'هذا البريد مسجّل مسبقاً، جرّب تسجيل الدخول';
        else {
            db()->prepare('INSERT INTO users(name, email, password_hash) VALUES(?,?,?)')->execute([$v['name'], $v['email'], password_hash($pw, PASSWORD_DEFAULT)]);
            session_regenerate_id(true); $_SESSION['uid'] = (int)db()->lastInsertId();
            flash('أهلاً بك في منصة سلاسة المعرفية 🎓'); redirect('home');
        }
    }
}
page_head('حساب جديد', 'authpg');
?>
<div class="auth"><h1>إنشاء حساب</h1>
<?php if ($err): ?><div class="flash err"><?= e($err) ?></div><?php endif; ?>
<form method="post"><?= csrf_field() ?>
  <label>الاسم</label><input name="name" required maxlength="80" value="<?= e($v['name']) ?>" autocomplete="name">
  <label>البريد الإلكتروني</label><input type="email" name="email" required dir="ltr" value="<?= e($v['email']) ?>" autocomplete="email">
  <label>كلمة المرور (8 أحرف على الأقل)</label><input type="password" name="password" required minlength="8" dir="ltr" autocomplete="new-password">
  <label>تأكيد كلمة المرور</label><input type="password" name="password2" required minlength="8" dir="ltr" autocomplete="new-password">
  <button class="btn">إنشاء الحساب</button>
</form>
<p class="muted">لديك حساب؟ <a href="index.php?p=login">سجّل الدخول</a></p></div>
<?php page_foot();
