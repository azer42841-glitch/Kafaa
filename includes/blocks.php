<?php
// أنواع أقسام الدرس. كل مساق يختار «قالباً» يحدد الأنواع المتاحة له في محرر الإدارة.
function block_catalog(): array {
    return [
        'objectives' => ['🎯', 'الأهداف', "سطر لكل هدف"],
        'explain'    => ['📖', 'الشرح', "فقرات يفصل بينها سطر فارغ. اكتب بالإنجليزية، ويمكن إضافة ترجمة بعد علامة ||| في آخر الفقرة"],
        'terms'      => ['🔤', 'المصطلحات', "سطر لكل مصطلح بالشكل: Term | المعنى بالعربية"],
        'example'    => ['💡', 'مثال', "فقرات يفصل بينها سطر فارغ"],
        'exercise'   => ['✏️', 'تمرين', "سطر لكل سؤال بالشكل: السؤال || الجواب (يظهر الجواب بالضغط)"],
        'quiz'       => ['✅', 'اختبار', "سطر لكل سؤال: السؤال || خيار1 | خيار2* | خيار3 (النجمة تلحق الصحيح)"],
        'entry'      => ['🧾', 'قيد محاسبي', "سطر لكل حساب: اسم الحساب | مدين | دائن (اترك الخانة فارغة عند عدم وجود قيمة)"],
        'case'       => ['🏢', 'حالة دراسية', "فقرات يفصل بينها سطر فارغ"],
        'framework'  => ['🧭', 'نموذج / إطار', "سطر لكل عنصر بالشكل: العنصر | شرحه"],
        'text'       => ['📜', 'النص الأدبي', "النص الأصلي (من الملك العام أو مقتطف قصير)، فقرات يفصل بينها سطر فارغ"],
        'analysis'   => ['🔍', 'التحليل', "فقرات يفصل بينها سطر فارغ"],
    ];
}
function templates(): array {
    $base = ['objectives', 'explain', 'terms', 'example', 'exercise', 'quiz'];
    return [
        'general'    => ['اسم' => 'عام', 'types' => $base],
        'accounting' => ['اسم' => 'المحاسبة', 'types' => array_merge($base, ['entry'])],
        'business'   => ['اسم' => 'إدارة الأعمال', 'types' => array_merge($base, ['case', 'framework'])],
        'literature' => ['اسم' => 'الأدب الإنجليزي', 'types' => array_merge($base, ['text', 'analysis'])],
    ];
}
function template_types(string $t): array { $all = templates(); return ($all[$t] ?? $all['general'])['types']; }

function paras(string $body): string {
    $out = '';
    foreach (preg_split('/\R{2,}/u', trim($body)) as $p) {
        $p = trim($p); if ($p === '') continue;
        $ar = '';
        if (strpos($p, '|||') !== false) { [$p, $ar] = array_map('trim', explode('|||', $p, 2)); }
        $out .= '<p class="en" dir="ltr">' . nl2br(e($p)) . '</p>' . ($ar !== '' ? '<p class="ar-tr">' . nl2br(e($ar)) . '</p>' : '');
    }
    return $out;
}
function lines(string $body): array { return array_values(array_filter(array_map('trim', preg_split('/\R/u', $body)), fn($l) => $l !== '')); }

function render_block(array $b): string {
    $cat = block_catalog(); $t = $b['type']; if (!isset($cat[$t])) return '';
    [$ico, $label] = $cat[$t]; $title = $b['title'] !== '' ? $b['title'] : $label;
    $h = '<section class="blk blk-' . e($t) . '"><h3>' . $ico . ' ' . e($title) . '</h3>';
    $body = (string)$b['body'];
    switch ($t) {
        case 'objectives':
            $h .= '<ul class="obj">'; foreach (lines($body) as $l) $h .= '<li dir="auto">' . e($l) . '</li>'; $h .= '</ul>'; break;
        case 'terms':
            $h .= '<table class="terms"><tr><th>Term</th><th>المعنى</th></tr>';
            foreach (lines($body) as $l) { $p = array_map('trim', explode('|', $l, 2)); $h .= '<tr><td class="en" dir="ltr">' . e($p[0]) . '</td><td>' . e($p[1] ?? '') . '</td></tr>'; }
            $h .= '</table>'; break;
        case 'exercise':
            foreach (lines($body) as $i => $l) { $p = array_map('trim', explode('||', $l, 2)); $h .= '<details class="ex"><summary dir="auto">' . ($i + 1) . '. ' . e($p[0]) . '</summary><div class="ex-a" dir="auto">' . e($p[1] ?? '—') . '</div></details>'; }
            break;
        case 'quiz':
            foreach (lines($body) as $i => $l) {
                $p = array_map('trim', explode('||', $l, 2)); $opts = array_map('trim', explode('|', $p[1] ?? ''));
                $h .= '<div class="q" data-q><div class="q-t" dir="auto">' . ($i + 1) . '. ' . e($p[0]) . '</div><div class="q-o">';
                foreach ($opts as $o) { $ok = substr($o, -1) === '*'; $h .= '<button type="button" class="qo" data-ok="' . ($ok ? 1 : 0) . '" dir="auto">' . e($ok ? rtrim($o, '*') : $o) . '</button>'; }
                $h .= '</div></div>';
            }
            $h .= '<div class="q-res" data-qres></div>'; break;
        case 'entry':
            $h .= '<table class="entry"><tr><th>الحساب</th><th>مدين</th><th>دائن</th></tr>';
            foreach (lines($body) as $l) { $p = array_map('trim', explode('|', $l)); $h .= '<tr><td dir="auto">' . e($p[0]) . '</td><td class="num">' . e($p[1] ?? '') . '</td><td class="num">' . e($p[2] ?? '') . '</td></tr>'; }
            $h .= '</table>'; break;
        case 'framework':
            $h .= '<div class="fw">'; foreach (lines($body) as $l) { $p = array_map('trim', explode('|', $l, 2)); $h .= '<div class="fw-i"><b dir="auto">' . e($p[0]) . '</b><span dir="auto">' . e($p[1] ?? '') . '</span></div>'; } $h .= '</div>'; break;
        default: $h .= paras($body);
    }
    return $h . '</section>';
}
