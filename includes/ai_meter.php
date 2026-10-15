<?php
// قياس تكلفة الذكاء الاصطناعي وضبطها: كل استدعاء يمرّ على ai_quota() قبل التنفيذ ثم ai_log() بعده.
// لا يوجد هنا اتصال بأي مزوّد: هذه الطبقة تسبق ربط المزوّد (المرحلة التالية) كي تُقاس التكلفة من اليوم الأول.

// الوظائف: [الاسم العربي, الحد اليومي الافتراضي لكل طالب (0 = معطّل)]
function ai_features(): array {
    return [
        'tutor'     => ['المساعد الأكاديمي', 10],
        'assess'    => ['تقييم الأعمال', 5],
        'translate' => ['الترجمة السياقية', 40],
        'stt'       => ['تحويل الصوت إلى نص (بالدقائق)', 15],
        'generate'  => ['توليد المحتوى (إدارة)', 0],
    ];
}
// أسعار لكل مليون رمز (إدخال, إخراج) بالدولار. تُعدَّل من الإدارة لأن الأسعار تتغير.
function ai_default_prices(): array {
    return ['gpt-5-mini' => [0.25, 2.0], 'claude-haiku-4-5' => [1.0, 5.0], 'claude-sonnet-4-6' => [3.0, 15.0], 'stt_per_min' => [0.006, 0]];
}
function ai_prices(): array {
    $j = json_decode(setting('ai_prices', ''), true);
    return is_array($j) && $j ? $j : ai_default_prices();
}
function ai_cost(string $model, int $in, int $out, int $audio_sec = 0): float {
    $p = ai_prices();
    if ($audio_sec > 0) return round($audio_sec / 60 * (float)($p['stt_per_min'][0] ?? 0.006), 6);
    if (!isset($p[$model])) return round(($in * 3.0 + $out * 15.0) / 1e6, 6);   // نموذج غير مسعّر: نفترض أعلى سعر كي لا نقلّل التكلفة
    return round(($in * (float)$p[$model][0] + $out * (float)$p[$model][1]) / 1e6, 6);
}
function ai_month_start(): string { return gmdate('Y-m-01 00:00:00'); }
function ai_month_spend(?int $uid = null): float {
    $s = db()->prepare('SELECT COALESCE(SUM(cost_usd),0) FROM ai_usage WHERE created_at >= ?' . ($uid !== null ? ' AND user_id = ?' : ''));
    $s->execute($uid !== null ? [ai_month_start(), $uid] : [ai_month_start()]);
    return (float)$s->fetchColumn();
}
// المفتاح الرئيسي مطفأ افتراضياً، والسقف الشهري العام يوقف كل شيء عند بلوغه
function ai_enabled(): bool {
    if (setting('ai_master', '0') !== '1') return false;
    $cap = (float)setting('ai_budget_month', '50');
    return $cap <= 0 || ai_month_spend() < $cap;
}
function ai_limit(string $feature): int {
    $f = ai_features(); if (!isset($f[$feature])) return 0;
    return max(0, (int)setting('ai_lim_' . $feature, (string)$f[$feature][1]));
}
// هل يُسمح لهذا الطالب بهذه الوظيفة الآن؟ ترجع [مسموح, رسالة, المتبقي اليوم]
function ai_quota(?int $uid, string $feature): array {
    if (!ai_enabled()) return [false, 'الخدمة الذكية متوقفة حالياً', 0];
    $lim = ai_limit($feature);
    if ($lim <= 0) return [false, 'هذه الخدمة غير متاحة حالياً', 0];
    if ($uid === null) return [true, '', $lim];
    $cap = (float)setting('ai_student_cap_month', '3');
    if ($cap > 0 && ai_month_spend($uid) >= $cap) return [false, 'بلغت حدّك الشهري من الخدمات الذكية، يتجدد مع بداية الشهر', 0];
    $s = db()->prepare('SELECT COALESCE(' . ($feature === 'stt' ? 'CEIL(SUM(audio_sec)/60)' : 'COUNT(*)') . ',0) FROM ai_usage WHERE user_id = ? AND feature = ? AND created_at >= ?');
    $s->execute([$uid, $feature, gmdate('Y-m-d 00:00:00')]);
    $used = (int)$s->fetchColumn();
    return $used >= $lim ? [false, 'استنفدت حدّك اليومي لهذه الخدمة (' . $lim . ')، جرّب غداً', 0] : [true, '', $lim - $used];
}
// تسجيل استدعاء فعلي بتكلفته (يُستدعى حتى عند الفشل بـ ok=false لأن بعض المزوّدين يحاسبون على الفاشل)
function ai_log(?int $uid, string $feature, string $model, int $in, int $out, int $audio_sec = 0, bool $ok = true): float {
    $c = ai_cost($model, $in, $out, $audio_sec);
    db()->prepare('INSERT INTO ai_usage(user_id, feature, model, tok_in, tok_out, audio_sec, cost_usd, ok) VALUES(?,?,?,?,?,?,?,?)')
        ->execute([$uid, $feature, mb_substr($model, 0, 80), max(0, $in), max(0, $out), max(0, $audio_sec), $c, $ok ? 1 : 0]);
    return $c;
}
