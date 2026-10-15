<?php
// منهج الدولة: الطالب يختار دولته (يُحفظ في حسابه، وللزائر في الجلسة). الاختيار الفارغ = كل المناهج.
function countries(): array {
    static $c = null;
    if ($c === null) $c = db()->query('SELECT * FROM countries WHERE active = 1 ORDER BY featured DESC, ord, code')->fetchAll();
    return $c;
}
function country_valid(string $code): bool { foreach (countries() as $x) if ($x['code'] === $code) return true; return false; }
function country_row(string $code): ?array { foreach (countries() as $x) if ($x['code'] === $code) return $x; return null; }
function cur_country(): string {
    if (isset($_SESSION['country'])) return (string)$_SESSION['country'];
    if (is_student()) { $s = db()->prepare('SELECT country FROM users WHERE id = ?'); $s->execute([(int)$_SESSION['uid']]); $c = (string)($s->fetchColumn() ?: ''); $_SESSION['country'] = country_valid($c) ? $c : ''; return $_SESSION['country']; }
    return '';
}
function set_country(string $code): void {
    $code = country_valid($code) ? $code : '';
    $_SESSION['country'] = $code;
    if (is_student()) db()->prepare('UPDATE users SET country = ? WHERE id = ?')->execute([$code === '' ? null : $code, (int)$_SESSION['uid']]);
}
// شرط SQL: الدرس مشترك (بلا دول) أو مخصّص للدولة المختارة. بلا اختيار تظهر كل الدروس.
function lesson_country_sql(string $alias, string $country): array {
    if ($country === '') return ['1=1', []];
    return ["(NOT EXISTS (SELECT 1 FROM lesson_countries lc WHERE lc.lesson_id = $alias.id) OR EXISTS (SELECT 1 FROM lesson_countries lc2 WHERE lc2.lesson_id = $alias.id AND lc2.country = ?))", [$country]];
}
function lesson_flags(int $lessonId): string {
    static $cache = null;
    if ($cache === null) { $cache = []; foreach (db()->query('SELECT lc.lesson_id, c.code FROM lesson_countries lc JOIN countries c ON c.code = lc.country ORDER BY c.featured DESC, c.ord')->fetchAll() as $r) $cache[(int)$r['lesson_id']][] = flag_svg($r['code'], 20); }
    return isset($cache[$lessonId]) ? implode(' ', $cache[$lessonId]) : '';   // HTML موثوق من flag_svg
}

// أعلام SVG مبسّطة لكل الدول العربية (إيموجي الأعلام لا يظهر على ويندوز). المدخل محصور بالرموز المعروفة.
function svg_star(float $cx, float $cy, float $r, string $fill): string {
    $p = []; for ($i = 0; $i < 10; $i++) { $a = -M_PI / 2 + $i * M_PI / 5; $rr = $i % 2 ? $r * 0.42 : $r; $p[] = round($cx + $rr * cos($a), 2) . ',' . round($cy + $rr * sin($a), 2); }
    return '<polygon points="' . implode(' ', $p) . '" fill="' . $fill . '"/>';
}
function flag_shapes(string $c): string {
    $tri = fn(string $f, float $w = 12) => '<path d="M0 0L' . $w . ' 10L0 20Z" fill="' . $f . '"/>';
    $h3 = fn(string $a, string $b, string $d) => '<rect width="30" height="6.7" fill="' . $a . '"/><rect y="6.7" width="30" height="6.7" fill="' . $b . '"/><rect y="13.4" width="30" height="6.6" fill="' . $d . '"/>';
    switch ($c) {
        case 'ps': return $h3('#111', '#fff', '#0a8f3c') . $tri('#d6262d');
        case 'eg': return $h3('#ce1126', '#fff', '#111') . '<path d="M12.5 12.6c0-2.2.9-3.7 2.5-3.7s2.5 1.5 2.5 3.7M13.6 8.2h2.8M15 8.2V6.6" stroke="#c09300" stroke-width="1.4" fill="none" stroke-linecap="round"/>';
        case 'ye': return $h3('#ce1126', '#fff', '#111');
        case 'sa': return '<rect width="30" height="20" fill="#0b7a3b"/><path d="M8 7h14M10 9.5h10M12 12h6" stroke="#fff" stroke-width="1.3" stroke-linecap="round"/><path d="M8 15.4h13.5" stroke="#fff" stroke-width="1.1" stroke-linecap="round"/><path d="M21.5 14.2v2.4" stroke="#fff" stroke-width="1.1"/>';
        case 'jo': return $h3('#111', '#fff', '#0a7a3a') . $tri('#ce1126', 13) . svg_star(4.2, 10, 2, '#fff');
        case 'lb': return '<rect width="30" height="20" fill="#fff"/><rect width="30" height="5" fill="#e0242c"/><rect y="15" width="30" height="5" fill="#e0242c"/><polygon points="15,5 17.8,9.8 16.4,9.8 18.8,13.2 15.8,13.2 15.8,15 14.2,15 14.2,13.2 11.2,13.2 13.6,9.8 12.2,9.8" fill="#0a8a3a"/>';
        case 'sy': return $h3('#0a8a3a', '#fff', '#111') . svg_star(9, 10, 2, '#ce1126') . svg_star(15, 10, 2, '#ce1126') . svg_star(21, 10, 2, '#ce1126');
        case 'iq': return $h3('#ce1126', '#fff', '#111') . '<path d="M9 10h3m2 0h2.5m2 0h3.5" stroke="#0a8a3a" stroke-width="1.6" stroke-linecap="round"/>';
        case 'kw': return $h3('#0a8a3a', '#fff', '#ce1126') . '<path d="M0 0L8 6.7V13.3L0 20Z" fill="#111"/>';
        case 'bh': return '<rect width="30" height="20" fill="#fff"/><path d="M30 0H10L14 2L10 4L14 6L10 8L14 10L10 12L14 14L10 16L14 18L10 20H30Z" fill="#ce1126"/>';
        case 'qa': return '<rect width="30" height="20" fill="#8a1538"/><path d="M0 0H9L13 1.8L9 3.6L13 5.4L9 7.2L13 9L9 10.8L13 12.6L9 14.4L13 16.2L9 18L13 19.2L9 20H0Z" fill="#fff"/>';
        case 'ae': return '<rect width="30" height="20" fill="#fff"/><rect x="7.5" width="22.5" height="6.7" fill="#00732f"/><rect x="7.5" y="13.4" width="22.5" height="6.6" fill="#111"/><rect width="7.5" height="20" fill="#ff0000"/>';
        case 'om': return '<rect width="30" height="20" fill="#fff"/><rect x="8" y="6.7" width="22" height="6.7" fill="#db161b"/><rect x="8" y="13.4" width="22" height="6.6" fill="#008000"/><rect width="8" height="20" fill="#db161b"/><circle cx="4" cy="4.5" r="1.8" fill="#fff"/>';
        case 'ly': return '<rect width="30" height="5" fill="#e70013"/><rect y="5" width="30" height="10" fill="#111"/><rect y="15" width="30" height="5" fill="#239e46"/><circle cx="14.4" cy="10" r="3.1" fill="#fff"/><circle cx="15.3" cy="10" r="2.6" fill="#111"/>' . svg_star(17.4, 10, 1.6, '#fff');
        case 'tn': return '<rect width="30" height="20" fill="#e70013"/><circle cx="15" cy="10" r="5.6" fill="#fff"/><circle cx="14.6" cy="10" r="3.6" fill="#e70013"/><circle cx="15.5" cy="10" r="3" fill="#fff"/>' . svg_star(15.8, 10, 1.7, '#e70013');
        case 'dz': return '<rect width="15" height="20" fill="#006233"/><rect x="15" width="15" height="20" fill="#fff"/><circle cx="15" cy="10" r="4.6" fill="#d21034"/><circle cx="16.2" cy="10" r="3.7" fill="#fff"/>' . svg_star(16.8, 10, 2, '#d21034');
        case 'ma': return '<rect width="30" height="20" fill="#c1272d"/><polygon points="15,5.4 16.5,9.4 20.7,9.4 17.3,11.9 18.6,15.8 15,13.4 11.4,15.8 12.7,11.9 9.3,9.4 13.5,9.4" fill="none" stroke="#006233" stroke-width="1"/>';
        case 'mr': return '<rect width="30" height="20" fill="#006233"/><rect width="30" height="2.4" fill="#d01c1f"/><rect y="17.6" width="30" height="2.4" fill="#d01c1f"/><circle cx="15" cy="10.6" r="5" fill="#ffc400"/><circle cx="15" cy="8.8" r="5" fill="#006233"/>' . svg_star(15, 7.4, 1.5, '#ffc400');
        case 'sd': return $h3('#d21034', '#fff', '#111') . $tri('#007229', 11);
        case 'so': return '<rect width="30" height="20" fill="#4189dd"/>' . svg_star(15, 10.4, 4.8, '#fff');
        case 'dj': return '<rect width="30" height="10" fill="#6ab2e7"/><rect y="10" width="30" height="10" fill="#12ad2b"/><path d="M0 0L14 10L0 20Z" fill="#fff"/>' . svg_star(4.2, 10, 2, '#d7141a');
        case 'km': return '<rect width="30" height="5" fill="#ffc61e"/><rect y="5" width="30" height="5" fill="#fff"/><rect y="10" width="30" height="5" fill="#ce1126"/><rect y="15" width="30" height="5" fill="#3a75c4"/><path d="M0 0L13 10L0 20Z" fill="#3d8e33"/><circle cx="4" cy="10" r="2.6" fill="#fff"/><circle cx="4.8" cy="10" r="2.2" fill="#3d8e33"/>';
    }
    return '';
}
function flag_svg(string $code, int $w = 28): string {
    $s = flag_shapes($code); if ($s === '') return '';
    return '<svg class="flag" width="' . $w . '" height="' . (int)round($w * 2 / 3) . '" viewBox="0 0 30 20" role="img" aria-hidden="true">' . $s . '</svg>';
}

// نافذة اختيار الدولة: تظهر تلقائياً مرة لمن لم يختر، وتُفتح بعدها من زر «تغيير» (الرابط #welcome بلا حاجة لجافاسكربت)
function welcome_modal(): string {
    $first = cur_country() === '' && empty($_SESSION['welcomed']);
    if (!in_array((string)($_GET['p'] ?? 'home'), ['home', 'course', 'level', 'lesson'], true)) return '';
    $h = '<div class="wel' . ($first ? ' show' : '') . '" id="welcome" role="dialog" aria-modal="true" aria-labelledby="wel-t"><div class="wel-bg" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i><i></i></div>'
       . '<form method="post" action="index.php?p=country" class="wel-card">' . csrf_field()
       . '<input type="hidden" name="back" value="' . e((string)($_SERVER['REQUEST_URI'] ?? '')) . '"><a class="wel-x" href="#" aria-label="إغلاق">✕</a>'
       . '<div class="wel-logo">س</div><h2 id="wel-t">أهلاً بك في <span>منصة سلاسة المعرفية</span></h2>'
       . '<p class="wel-s">اختر دولتك لنعرض لك المنهج الذي يناسب جامعتك</p><div class="wel-grid">';
    $i = 0; $other = '';
    foreach (countries() as $c) {
        if ((int)$c['featured'] === 1) $h .= '<button name="c" value="' . e($c['code']) . '" class="wel-c" style="--i:' . $i++ . '">' . flag_svg($c['code'], 64) . '<b>' . e($c['name_ar']) . '</b><small dir="ltr">' . e($c['name_en']) . '</small></button>';
        else $other .= '<button name="c" value="' . e($c['code']) . '" class="wel-o">' . flag_svg($c['code'], 28) . '<span>' . e($c['name_ar']) . '</span></button>';
    }
    $h .= '</div>';
    if ($other !== '') $h .= '<div class="wel-more"><span>دول عربية أخرى</span></div><div class="wel-others">' . $other . '</div>';
    return $h . '<button name="skip" value="1" class="wel-skip">تصفّح كل المناهج الآن</button></form></div>';
}
// الشريط العلوي: الدولة الحالية وزر تغيير يفتح النافذة
function country_bar(): string {
    $cur = cur_country(); $row = $cur !== '' ? country_row($cur) : null;
    $now = $row ? flag_svg($cur, 22) . ' ' . e($row['name_ar']) : '🌍 كل الدول';
    return '<div class="cbar"><span class="cbar-l">منهج الدولة:</span><b class="cbar-n">' . $now . '</b><a class="cbar-b" href="#welcome">تغيير ▾</a></div>';
}
