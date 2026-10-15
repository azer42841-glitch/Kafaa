<?php
if (is_student()) redirect('home');
$err = '';
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    csrf_check();
    $email = strtolower(trim((string)($_POST['email'] ?? ''))); $pw = (string)($_POST['password'] ?? ''); $ip = client_ip();
    if (rate_count("login:$ip", 900) >= 15 || rate_count("loginm:$email", 900) >= 8) $err = 'محاولات كثيرة. انتظر 15 دقيقة ثم أعد المحاولة.';
    else {
        $s = db()->prepare('SELECT id, password_hash FROM users WHERE email = ?'); $s->execute([$email]); $u = $s->fetch();
        $ok = password_verify($pw, $u['password_hash'] ?? '$2y$10$abcdefghijklmnopqrstuuWcQWQBo1sQvZJmGBEcIgV9bAQ3pB9H6');
        if ($u && $ok) {
            session_regenerate_id(true); $_SESSION['uid'] = (int)$u['id'];
            db()->prepare('UPDATE users SET last_login_at = ? WHERE id = ?')->execute([now_utc(), $u['id']]);
            redirect('home');
        }
        rate_hit("login:$ip"); rate_hit("loginm:$email"); $err = 'البريد أو كلمة المرور غير صحيحة';
    }
}
page_head('دخول', 'authpg');
?>
<div class="auth"><h1>تسجيل الدخول</h1>
<?php if ($err): ?><div class="flash err"><?= e($err) ?></div><?php endif; ?>
<form method="post"><?= csrf_field() ?>
  <label>البريد الإلكتروني</label><input type="email" name="email" required autocomplete="email" dir="ltr">
  <label>كلمة المرور</label><input type="password" name="password" required autocomplete="current-password" dir="ltr">
  <button class="btn">دخول</button>
</form>
<p class="muted">ليس لديك حساب؟ <a href="index.php?p=register">أنشئ حساباً</a></p></div>
<?php page_foot();
