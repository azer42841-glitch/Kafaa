<?php
require_admin();
$t = (string)($_GET['t'] ?? 'courses'); $id = (int)($_GET['id'] ?? 0);
function q(string $sql, array $a = []): PDOStatement { $s = db()->prepare($sql); $s->execute($a); return $s; }
function back(array $q): void { redirect('admin', $q); }
function post_s(string $k, int $max): string { return mb_substr(trim((string)($_POST[$k] ?? '')), 0, $max); }

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    csrf_check(); $a = (string)($_POST['a'] ?? ''); $pid = (int)($_POST['id'] ?? 0);
    switch ($a) {
        case 'save_course':
            $slug = strtolower(preg_replace('/[^a-z0-9-]/i', '', post_s('slug', 40))); $tpl = array_key_exists(post_s('template', 30), templates()) ? post_s('template', 30) : 'general';
            if ($slug === '' || post_s('title_ar', 120) === '' || post_s('title_en', 120) === '') { flash('أكمل الحقول المطلوبة', 'err'); back(['t' => 'courses']); }
            $v = [$slug, post_s('title_en', 120), post_s('title_ar', 120), post_s('description_ar', 500), post_s('icon', 16) ?: '📘', $tpl, (int)($_POST['ord'] ?? 0), isset($_POST['published']) ? 1 : 0];
            try {
                if ($pid) q('UPDATE courses SET slug=?, title_en=?, title_ar=?, description_ar=?, icon=?, template=?, ord=?, published=? WHERE id=?', [...$v, $pid]);
                else q('INSERT INTO courses(slug,title_en,title_ar,description_ar,icon,template,ord,published) VALUES(?,?,?,?,?,?,?,?)', $v);
                flash('تم حفظ المساق'); audit('admin', 'save_course', $slug);
            } catch (PDOException $x) { flash('المعرّف (slug) مستخدم مسبقاً', 'err'); }
            back(['t' => 'courses']);
        case 'del_course': q('DELETE FROM courses WHERE id = ?', [$pid]); audit('admin', 'del_course', (string)$pid); flash('حُذف المساق'); back(['t' => 'courses']);
        case 'save_level':
            $cid = (int)($_POST['course_id'] ?? 0);
            if ($pid) q('UPDATE levels SET title_en=?, title_ar=?, description_ar=? WHERE id=?', [post_s('title_en', 120), post_s('title_ar', 120), post_s('description_ar', 500), $pid]);
            else { $o = (int)q('SELECT COALESCE(MAX(ord),0)+1 FROM levels WHERE course_id=?', [$cid])->fetchColumn(); q('INSERT INTO levels(course_id,ord,title_en,title_ar,description_ar) VALUES(?,?,?,?,?)', [$cid, $o, post_s('title_en', 120), post_s('title_ar', 120), post_s('description_ar', 500)]); }
            flash('تم حفظ المستوى'); back(['t' => 'course', 'id' => $cid]);
        case 'del_level': $cid = (int)q('SELECT course_id FROM levels WHERE id=?', [$pid])->fetchColumn(); q('DELETE FROM levels WHERE id=?', [$pid]); flash('حُذف المستوى'); back(['t' => 'course', 'id' => $cid]);
        case 'save_unit':
            $lid = (int)($_POST['level_id'] ?? 0); $cid = (int)q('SELECT course_id FROM levels WHERE id=?', [$lid])->fetchColumn();
            $o = (int)q('SELECT COALESCE(MAX(ord),0)+1 FROM units WHERE level_id=?', [$lid])->fetchColumn();
            q('INSERT INTO units(level_id,ord,title_en,title_ar) VALUES(?,?,?,?)', [$lid, $o, post_s('title_en', 120), post_s('title_ar', 120)]); flash('أُضيفت الوحدة'); back(['t' => 'course', 'id' => $cid]);
        case 'del_unit': $cid = (int)q('SELECT l.course_id FROM units u JOIN levels l ON l.id=u.level_id WHERE u.id=?', [$pid])->fetchColumn(); q('DELETE FROM units WHERE id=?', [$pid]); flash('حُذفت الوحدة'); back(['t' => 'course', 'id' => $cid]);
        case 'add_lesson':
            $uid2 = (int)($_POST['unit_id'] ?? 0); $cid = (int)q('SELECT l.course_id FROM units u JOIN levels l ON l.id=u.level_id WHERE u.id=?', [$uid2])->fetchColumn();
            $o = (int)q('SELECT COALESCE(MAX(ord),0)+1 FROM lessons WHERE unit_id=?', [$uid2])->fetchColumn();
            q('INSERT INTO lessons(unit_id,ord,title_en,title_ar) VALUES(?,?,?,?)', [$uid2, $o, post_s('title_en', 160), post_s('title_ar', 160)]);
            flash('أُضيف الدرس (غير منشور)'); back(['t' => 'lesson', 'id' => (int)db()->lastInsertId()]);
        case 'save_lesson':
            $rv = post_s('reviewed_at', 10); $rv = preg_match('/^\d{4}-\d{2}-\d{2}$/', $rv) ? $rv : null;
            q('UPDATE lessons SET title_en=?, title_ar=?, published=?, standard=?, reviewed_at=? WHERE id=?', [post_s('title_en', 160), post_s('title_ar', 160), isset($_POST['published']) ? 1 : 0, post_s('standard', 20), $rv, $pid]);
            q('DELETE FROM lesson_countries WHERE lesson_id=?', [$pid]);
            foreach ((array)($_POST['lc'] ?? []) as $cc) if (country_valid((string)$cc)) q('INSERT IGNORE INTO lesson_countries(lesson_id, country) VALUES(?,?)', [$pid, (string)$cc]);
            flash('تم حفظ الدرس'); back(['t' => 'lesson', 'id' => $pid]);
        case 'del_lesson': $cid = (int)q('SELECT l.course_id FROM lessons x JOIN units u ON u.id=x.unit_id JOIN levels l ON l.id=u.level_id WHERE x.id=?', [$pid])->fetchColumn(); q('DELETE FROM lessons WHERE id=?', [$pid]); flash('حُذف الدرس'); back(['t' => 'course', 'id' => $cid]);
        case 'save_block':
            $lid = (int)($_POST['lesson_id'] ?? 0); $type = post_s('type', 20);
            if (!isset(block_catalog()[$type])) { flash('نوع غير معروف', 'err'); back(['t' => 'lesson', 'id' => $lid]); }
            $body = mb_substr(str_replace("\r\n", "\n", (string)($_POST['body'] ?? '')), 0, 60000);
            if ($pid) q('UPDATE lesson_blocks SET type=?, title=?, body=?, ord=? WHERE id=? AND lesson_id=?', [$type, post_s('title', 160), $body, (int)($_POST['ord'] ?? 0), $pid, $lid]);
            else { $o = (int)q('SELECT COALESCE(MAX(ord),0)+1 FROM lesson_blocks WHERE lesson_id=?', [$lid])->fetchColumn(); q('INSERT INTO lesson_blocks(lesson_id,ord,type,title,body) VALUES(?,?,?,?,?)', [$lid, $o, $type, post_s('title', 160), $body]); }
            flash('تم حفظ القسم'); back(['t' => 'lesson', 'id' => $lid]);
        case 'del_block': $lid = (int)q('SELECT lesson_id FROM lesson_blocks WHERE id=?', [$pid])->fetchColumn(); q('DELETE FROM lesson_blocks WHERE id=?', [$pid]); flash('حُذف القسم'); back(['t' => 'lesson', 'id' => $lid]);
        case 'save_ai':
            setting_set('ai_master', isset($_POST['master']) ? '1' : '0');
            setting_set('ai_budget_month', (string)max(0, round((float)($_POST['budget'] ?? 0), 2)));
            setting_set('ai_student_cap_month', (string)max(0, round((float)($_POST['student_cap'] ?? 0), 2)));
            foreach (array_keys(ai_features()) as $f) setting_set('ai_lim_' . $f, (string)max(0, min(1000, (int)($_POST['lim_' . $f] ?? 0))));
            $pr = []; foreach ((array)($_POST['pm'] ?? []) as $i => $m) { $m = preg_replace('/[^A-Za-z0-9._-]/', '', (string)$m); if ($m === '') continue; $pr[$m] = [max(0, (float)($_POST['pi'][$i] ?? 0)), max(0, (float)($_POST['po'][$i] ?? 0))]; }
            if ($pr) setting_set('ai_prices', json_encode($pr));
            audit('admin', 'save_ai', 'master=' . (isset($_POST['master']) ? 1 : 0)); flash('تم حفظ إعدادات الذكاء الاصطناعي'); back(['t' => 'ai']);
        case 'grant':
            $em = strtolower(post_s('email', 190)); $lvid = (int)($_POST['level_id'] ?? 0);
            $uu = q('SELECT id FROM users WHERE email=?', [$em])->fetchColumn();
            if (!$uu || !q('SELECT 1 FROM levels WHERE id=?', [$lvid])->fetchColumn()) { flash('الطالب أو المستوى غير موجود', 'err'); back(['t' => 'students']); }
            q('INSERT IGNORE INTO level_access(user_id, level_id) VALUES(?,?)', [$uu, $lvid]); audit('admin', 'grant_level', "$uu:$lvid"); flash('تم فتح المستوى للطالب'); back(['t' => 'students']);
    }
    back(['t' => 'courses']);
}

page_head('الإدارة', 'adm');
$tabs = ['courses' => 'المساقات', 'students' => 'الطلاب', 'ai' => 'تكاليف الذكاء'];
echo '<div class="admtabs">'; foreach ($tabs as $k => $l) echo '<a class="' . ($t === $k || ($k === 'courses' && in_array($t, ['course', 'lesson'], true)) ? 'on' : '') . '" href="index.php?p=admin&amp;t=' . $k . '">' . $l . '</a>'; echo '<a href="index.php?p=logout">خروج</a></div>';
$tpls = templates();

if ($t === 'ai'):
    $ms = ai_month_start(); $day = gmdate('Y-m-d 00:00:00');
    $tot = (float)q('SELECT COALESCE(SUM(cost_usd),0) FROM ai_usage WHERE created_at >= ?', [$ms])->fetchColumn();
    $today = (float)q('SELECT COALESCE(SUM(cost_usd),0) FROM ai_usage WHERE created_at >= ?', [$day])->fetchColumn();
    $act = (int)q('SELECT COUNT(DISTINCT user_id) FROM ai_usage WHERE created_at >= ? AND user_id IS NOT NULL', [$ms])->fetchColumn();
    $dm = (int)gmdate('j'); $dim = (int)gmdate('t'); $proj = $dm ? $tot / $dm * $dim : 0;
    $byf = q('SELECT feature, COUNT(*) n, SUM(tok_in) ti, SUM(tok_out) tout, SUM(audio_sec) sec, SUM(cost_usd) c, SUM(ok=0) fails FROM ai_usage WHERE created_at >= ? GROUP BY feature ORDER BY c DESC', [$ms])->fetchAll();
    $top = q('SELECT u.name, u.email, COUNT(*) n, SUM(a.cost_usd) c FROM ai_usage a JOIN users u ON u.id=a.user_id WHERE a.created_at >= ? GROUP BY a.user_id ORDER BY c DESC LIMIT 10', [$ms])->fetchAll();
    $feats = ai_features(); $prices = ai_prices(); $budget = (float)setting('ai_budget_month', '50'); ?>
  <h1>تكاليف الذكاء الاصطناعي</h1>
  <p class="muted">كل طلب ذكاء اصطناعي يُسجَّل بتكلفته، وتُحسب الأرقام من الأسعار المدخلة أدناه (حدّثها من لوحة المزوّد). لا يوجد مزوّد مربوط بعد، فالأرقام تبقى صفراً حتى يبدأ الاستخدام.</p>
  <div class="stats">
    <div class="stat"><b>$<?= number_format($tot, 2) ?></b><span>هذا الشهر<?= $budget > 0 ? ' من $' . number_format($budget, 0) : '' ?></span></div>
    <div class="stat"><b>$<?= number_format($today, 2) ?></b><span>اليوم</span></div>
    <div class="stat"><b>$<?= number_format($proj, 2) ?></b><span>المتوقع نهاية الشهر</span></div>
    <div class="stat"><b><?= $act ?></b><span>طلاب استخدموا الخدمة</span></div>
    <div class="stat"><b>$<?= $act ? number_format($tot / $act, 3) : '0.000' ?></b><span>متوسط الطالب</span></div>
  </div>
  <div class="tbl"><table><tr><th>الوظيفة</th><th>الطلبات</th><th>إدخال</th><th>إخراج</th><th>دقائق صوت</th><th>فاشل</th><th>التكلفة</th></tr>
  <?php foreach ($byf as $r): ?><tr><td><?= e($feats[$r['feature']][0] ?? $r['feature']) ?></td><td><?= (int)$r['n'] ?></td><td><?= number_format((int)$r['ti']) ?></td><td><?= number_format((int)$r['tout']) ?></td><td><?= round((int)$r['sec'] / 60, 1) ?></td><td><?= (int)$r['fails'] ?></td><td dir="ltr">$<?= number_format((float)$r['c'], 4) ?></td></tr><?php endforeach; if (!$byf): ?><tr><td colspan="7" class="muted">لا استخدام هذا الشهر بعد</td></tr><?php endif; ?></table></div>
  <h2>أعلى الطلاب استهلاكاً هذا الشهر</h2>
  <div class="tbl"><table><tr><th>الطالب</th><th>البريد</th><th>الطلبات</th><th>التكلفة</th></tr>
  <?php foreach ($top as $r): ?><tr><td><?= e($r['name']) ?></td><td dir="ltr"><?= e($r['email']) ?></td><td><?= (int)$r['n'] ?></td><td dir="ltr">$<?= number_format((float)$r['c'], 4) ?></td></tr><?php endforeach; if (!$top): ?><tr><td colspan="4" class="muted">—</td></tr><?php endif; ?></table></div>
  <h2>الإعدادات والحدود</h2>
  <form method="post" class="box"><?= csrf_field() ?><input type="hidden" name="a" value="save_ai">
    <label class="chkl"><input type="checkbox" name="master" <?= setting('ai_master', '0') === '1' ? 'checked' : '' ?>> تشغيل الخدمات الذكية (مفتاح رئيسي: مطفأ افتراضياً)</label>
    <div class="grid2"><div><label>السقف الشهري العام ($) — 0 = بلا سقف</label><input type="number" step="0.01" min="0" name="budget" value="<?= e((string)$budget) ?>" dir="ltr"></div>
    <div><label>السقف الشهري لكل طالب ($) — 0 = بلا سقف</label><input type="number" step="0.01" min="0" name="student_cap" value="<?= e(setting('ai_student_cap_month', '3')) ?>" dir="ltr"></div></div>
    <h3>الحد اليومي لكل طالب (0 = الخدمة معطّلة)</h3><div class="grid2">
    <?php foreach ($feats as $k => [$nm]): ?><div><label><?= e($nm) ?></label><input type="number" min="0" max="1000" name="lim_<?= e($k) ?>" value="<?= ai_limit($k) ?>" dir="ltr"></div><?php endforeach; ?></div>
    <h3>الأسعار لكل مليون رمز بالدولار (أو للدقيقة للصوت)</h3>
    <?php foreach (array_merge($prices, ['' => [0, 0]]) as $m => $pp): ?><div class="inl"><input name="pm[]" value="<?= e($m) ?>" placeholder="اسم النموذج" dir="ltr"><input type="number" step="0.0001" min="0" name="pi[]" value="<?= e((string)$pp[0]) ?>" dir="ltr" title="إدخال"><input type="number" step="0.0001" min="0" name="po[]" value="<?= e((string)$pp[1]) ?>" dir="ltr" title="إخراج"></div><?php endforeach; ?>
    <small class="hint">آخر سطر فارغ لإضافة نموذج جديد. نموذج غير مسعّر يُحسب بأعلى سعر احتياطاً كي لا تُقدَّر التكلفة بأقل من حقيقتها.</small>
    <button class="btn sm">حفظ</button></form>

<?php elseif ($t === 'students'):
    $us = q('SELECT u.id, u.name, u.email, u.created_at, (SELECT COUNT(*) FROM progress p WHERE p.user_id=u.id) done FROM users u ORDER BY u.id DESC LIMIT 200')->fetchAll();
    $lvs = q('SELECT l.id, l.ord, l.title_ar, c.title_ar ct FROM levels l JOIN courses c ON c.id=l.course_id WHERE l.ord > 1 ORDER BY c.ord, l.ord')->fetchAll(); ?>
  <h2>فتح مستوى لطالب</h2>
  <form method="post" class="inl"><?= csrf_field() ?><input type="hidden" name="a" value="grant"><input type="email" name="email" placeholder="بريد الطالب" required dir="ltr">
    <select name="level_id"><?php foreach ($lvs as $l): ?><option value="<?= (int)$l['id'] ?>"><?= e($l['ct'] . ' — المستوى ' . $l['ord'] . ': ' . $l['title_ar']) ?></option><?php endforeach; ?></select><button class="btn sm">فتح</button></form>
  <h2>الطلاب (<?= count($us) ?>)</h2>
  <div class="tbl"><table><tr><th>الاسم</th><th>البريد</th><th>الدروس المتمة</th><th>التسجيل</th></tr>
  <?php foreach ($us as $u): ?><tr><td><?= e($u['name']) ?></td><td dir="ltr"><?= e($u['email']) ?></td><td><?= (int)$u['done'] ?></td><td dir="ltr"><?= e($u['created_at']) ?></td></tr><?php endforeach; ?></table></div>

<?php elseif ($t === 'course'):
    $c = q('SELECT * FROM courses WHERE id=?', [$id])->fetch(); if (!$c) redirect('admin');
    $lv = q('SELECT * FROM levels WHERE course_id=? ORDER BY ord', [$id])->fetchAll(); ?>
  <div class="crumb"><a href="index.php?p=admin">المساقات</a> ‹ <?= e($c['title_ar']) ?></div>
  <h1><?= e($c['icon'] . ' ' . $c['title_ar']) ?> <small>(قالب: <?= e($tpls[$c['template']]['اسم'] ?? $c['template']) ?>)</small></h1>
  <?php foreach ($lv as $l): ?>
    <details class="box" open><summary><b>المستوى <?= (int)$l['ord'] ?>:</b> <?= e($l['title_ar']) ?> <span class="en" dir="ltr"><?= e($l['title_en']) ?></span></summary>
      <form method="post" class="grid2"><?= csrf_field() ?><input type="hidden" name="a" value="save_level"><input type="hidden" name="id" value="<?= (int)$l['id'] ?>"><input type="hidden" name="course_id" value="<?= $id ?>">
        <input name="title_ar" value="<?= e($l['title_ar']) ?>" placeholder="العنوان بالعربية" required><input name="title_en" value="<?= e($l['title_en']) ?>" placeholder="Title" dir="ltr" required>
        <input name="description_ar" value="<?= e($l['description_ar']) ?>" placeholder="الوصف" class="full"><button class="btn sm">حفظ المستوى</button></form>
      <?php $us = q('SELECT * FROM units WHERE level_id=? ORDER BY ord', [$l['id']])->fetchAll(); foreach ($us as $u): ?>
        <div class="unit-a"><b>الوحدة <?= (int)$u['ord'] ?>: <?= e($u['title_ar']) ?></b>
          <form method="post" class="delf" data-confirm="حذف الوحدة وكل دروسها؟"><?= csrf_field() ?><input type="hidden" name="a" value="del_unit"><input type="hidden" name="id" value="<?= (int)$u['id'] ?>"><button class="lnk bad">حذف</button></form>
          <?php foreach (q('SELECT * FROM lessons WHERE unit_id=? ORDER BY ord', [$u['id']])->fetchAll() as $x): ?>
            <a class="lrow sm" href="index.php?p=admin&amp;t=lesson&amp;id=<?= (int)$x['id'] ?>"><span class="chk"><?= (int)$x['ord'] ?></span><span><?= e($x['title_ar']) ?> <small><?= $x['published'] ? '✅ منشور' : '📝 مسودة' ?></small></span></a>
          <?php endforeach; ?>
          <form method="post" class="inl"><?= csrf_field() ?><input type="hidden" name="a" value="add_lesson"><input type="hidden" name="unit_id" value="<?= (int)$u['id'] ?>"><input name="title_ar" placeholder="عنوان درس جديد" required><input name="title_en" placeholder="Lesson title" dir="ltr" required><button class="btn sm">+ درس</button></form>
        </div>
      <?php endforeach; ?>
      <form method="post" class="inl"><?= csrf_field() ?><input type="hidden" name="a" value="save_unit"><input type="hidden" name="level_id" value="<?= (int)$l['id'] ?>"><input name="title_ar" placeholder="وحدة جديدة" required><input name="title_en" placeholder="Unit title" dir="ltr" required><button class="btn sm alt">+ وحدة</button></form>
      <form method="post" class="delf" data-confirm="حذف المستوى بكل محتواه؟"><?= csrf_field() ?><input type="hidden" name="a" value="del_level"><input type="hidden" name="id" value="<?= (int)$l['id'] ?>"><button class="lnk bad">حذف المستوى</button></form>
    </details>
  <?php endforeach; ?>
  <h3>مستوى جديد</h3>
  <form method="post" class="grid2"><?= csrf_field() ?><input type="hidden" name="a" value="save_level"><input type="hidden" name="course_id" value="<?= $id ?>"><input name="title_ar" placeholder="العنوان بالعربية" required><input name="title_en" placeholder="Title" dir="ltr" required><input name="description_ar" placeholder="الوصف" class="full"><button class="btn sm">+ مستوى</button></form>

<?php elseif ($t === 'lesson'):
    $x = q('SELECT x.*, c.template, c.id cid, c.title_ar ct FROM lessons x JOIN units u ON u.id=x.unit_id JOIN levels l ON l.id=u.level_id JOIN courses c ON c.id=l.course_id WHERE x.id=?', [$id])->fetch(); if (!$x) redirect('admin');
    $allowed = template_types($x['template']); $cat = block_catalog(); $blocks = q('SELECT * FROM lesson_blocks WHERE lesson_id=? ORDER BY ord, id', [$id])->fetchAll(); ?>
  <div class="crumb"><a href="index.php?p=admin&amp;t=course&amp;id=<?= (int)$x['cid'] ?>"><?= e($x['ct']) ?></a> ‹ تحرير الدرس</div>
  <form method="post" class="box grid2"><?= csrf_field() ?><input type="hidden" name="a" value="save_lesson"><input type="hidden" name="id" value="<?= $id ?>">
    <input name="title_ar" value="<?= e($x['title_ar']) ?>" required><input name="title_en" value="<?= e($x['title_en']) ?>" dir="ltr" required>
    <div class="full"><b>الدول التي يخصها هذا الدرس</b> <small class="hint">(لا تختر شيئاً = درس مشترك لكل الدول)</small><div class="inl">
      <?php $sel = array_column(q('SELECT country FROM lesson_countries WHERE lesson_id=?', [$id])->fetchAll(), 'country'); foreach (countries() as $cn): ?><label class="chkl"><input type="checkbox" name="lc[]" value="<?= e($cn['code']) ?>" <?= in_array($cn['code'], $sel, true) ? 'checked' : '' ?>> <?= flag_svg($cn['code'], 22) ?> <?= e($cn['name_ar']) ?></label><?php endforeach; ?></div></div>
    <input name="standard" value="<?= e($x['standard']) ?>" placeholder="المعيار (IFRS / EAS / عام…)" maxlength="20" dir="ltr"><input type="date" name="reviewed_at" value="<?= e((string)$x['reviewed_at']) ?>" title="تاريخ آخر مراجعة">
    <label class="chkl"><input type="checkbox" name="published" <?= $x['published'] ? 'checked' : '' ?>> منشور للطلاب</label><button class="btn sm">حفظ</button></form>
  <?php if ($x['published']): ?><a class="lnk" href="index.php?p=lesson&amp;id=<?= $id ?>" target="_blank">معاينة الدرس ↗</a><?php endif; ?>
  <h2>أقسام الدرس</h2>
  <?php foreach ($blocks as $b): ?>
    <form method="post" class="box blk-ed"><?= csrf_field() ?><input type="hidden" name="a" value="save_block"><input type="hidden" name="id" value="<?= (int)$b['id'] ?>"><input type="hidden" name="lesson_id" value="<?= $id ?>">
      <div class="row"><select name="type"><?php foreach ($allowed as $ty): ?><option value="<?= $ty ?>" <?= $ty === $b['type'] ? 'selected' : '' ?>><?= $cat[$ty][0] . ' ' . $cat[$ty][1] ?></option><?php endforeach; ?></select>
        <input name="title" value="<?= e($b['title']) ?>" placeholder="عنوان (اختياري)"><input type="number" name="ord" value="<?= (int)$b['ord'] ?>" class="ord" title="الترتيب"></div>
      <textarea name="body" rows="7" dir="auto"><?= e($b['body']) ?></textarea><small class="hint"><?= e($cat[$b['type']][2] ?? '') ?></small>
      <div class="row"><button class="btn sm">حفظ القسم</button></div></form>
    <form method="post" class="delf" data-confirm="حذف هذا القسم؟"><?= csrf_field() ?><input type="hidden" name="a" value="del_block"><input type="hidden" name="id" value="<?= (int)$b['id'] ?>"><button class="lnk bad">حذف القسم أعلاه</button></form>
  <?php endforeach; ?>
  <h3>قسم جديد</h3>
  <form method="post" class="box blk-ed"><?= csrf_field() ?><input type="hidden" name="a" value="save_block"><input type="hidden" name="lesson_id" value="<?= $id ?>">
    <div class="row"><select name="type" data-hint><?php foreach ($allowed as $ty): ?><option value="<?= $ty ?>" data-h="<?= e($cat[$ty][2]) ?>"><?= $cat[$ty][0] . ' ' . $cat[$ty][1] ?></option><?php endforeach; ?></select><input name="title" placeholder="عنوان (اختياري)"></div>
    <textarea name="body" rows="7" dir="auto" required></textarea><small class="hint" id="newhint"></small><div class="row"><button class="btn sm">+ إضافة القسم</button></div></form>

<?php else: // courses
    $cs = q('SELECT * FROM courses ORDER BY ord, id')->fetchAll(); ?>
  <h2>المساقات</h2>
  <?php foreach ($cs as $c): ?>
    <details class="box"><summary><?= e($c['icon'] . ' ' . $c['title_ar']) ?> <span class="en" dir="ltr"><?= e($c['title_en']) ?></span> <small><?= $c['published'] ? '✅' : '🚫 مخفي' ?></small></summary>
      <a class="btn sm" href="index.php?p=admin&amp;t=course&amp;id=<?= (int)$c['id'] ?>">المستويات والدروس ←</a>
      <form method="post" class="grid2"><?= csrf_field() ?><input type="hidden" name="a" value="save_course"><input type="hidden" name="id" value="<?= (int)$c['id'] ?>">
        <input name="title_ar" value="<?= e($c['title_ar']) ?>" required><input name="title_en" value="<?= e($c['title_en']) ?>" dir="ltr" required>
        <input name="slug" value="<?= e($c['slug']) ?>" dir="ltr" required><input name="icon" value="<?= e($c['icon']) ?>" maxlength="8">
        <select name="template"><?php foreach ($tpls as $k => $tp): ?><option value="<?= $k ?>" <?= $k === $c['template'] ? 'selected' : '' ?>>قالب: <?= e($tp['اسم']) ?></option><?php endforeach; ?></select><input type="number" name="ord" value="<?= (int)$c['ord'] ?>">
        <input name="description_ar" value="<?= e($c['description_ar']) ?>" class="full"><label class="chkl"><input type="checkbox" name="published" <?= $c['published'] ? 'checked' : '' ?>> منشور</label><button class="btn sm">حفظ</button></form>
      <form method="post" class="delf" data-confirm="حذف المساق بكل محتواه؟ لا يمكن التراجع."><?= csrf_field() ?><input type="hidden" name="a" value="del_course"><input type="hidden" name="id" value="<?= (int)$c['id'] ?>"><button class="lnk bad">حذف المساق</button></form>
    </details>
  <?php endforeach; ?>
  <h3>مساق جديد</h3>
  <form method="post" class="grid2 box"><?= csrf_field() ?><input type="hidden" name="a" value="save_course">
    <input name="title_ar" placeholder="الاسم بالعربية" required><input name="title_en" placeholder="Course title" dir="ltr" required><input name="slug" placeholder="slug-latin" dir="ltr" required><input name="icon" placeholder="🎓" maxlength="8">
    <select name="template"><?php foreach ($tpls as $k => $tp): ?><option value="<?= $k ?>">قالب: <?= e($tp['اسم']) ?></option><?php endforeach; ?></select><input type="number" name="ord" value="9">
    <input name="description_ar" placeholder="وصف قصير" class="full"><label class="chkl"><input type="checkbox" name="published" checked> منشور</label><button class="btn sm">+ إضافة</button></form>
<?php endif;
page_foot();
