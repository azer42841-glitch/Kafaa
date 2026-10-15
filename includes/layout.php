<?php
function page_head(string $title, string $body_class = ''): void {
    $n = csp_nonce();
    echo '<!DOCTYPE html><html lang="ar" dir="rtl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">'
       . '<title>' . e($title) . ' | ' . e(SITE_NAME) . '</title><meta name="theme-color" content="#0f3d6e">'
       . '<link rel="stylesheet" href="assets/style.css?v=' . (int)@filemtime(dirname(__DIR__) . '/public/assets/style.css') . '"></head><body class="' . e($body_class) . '">';
    echo '<nav class="top"><a class="brand" href="index.php"><span class="logo">س</span><b>' . e(SITE_NAME) . '</b><small>منصة معرفية</small></a><div class="links">';
    if (is_student()) echo '<a href="index.php?p=account">حسابي</a><a href="index.php?p=logout">خروج</a>';
    else echo '<a href="index.php?p=login">دخول</a><a class="cta" href="index.php?p=register">ابدأ مجاناً</a>';
    echo '</div></nav>' . country_bar() . welcome_modal() . '<main>';
    foreach ($_SESSION['flash'] ?? [] as [$t, $m]) echo '<div class="flash ' . e($t) . '">' . e($m) . '</div>';
    unset($_SESSION['flash']);
}
function page_foot(): void {
    echo '</main><footer>© ' . gmdate('Y') . ' ' . e(SITE_NAME) . ' — ' . e(SITE_NAME_EN) . '</footer><script nonce="' . e(csp_nonce()) . '" src="assets/app.js?v=' . (int)@filemtime(dirname(__DIR__) . '/public/assets/app.js') . '"></script></body></html>';
}
