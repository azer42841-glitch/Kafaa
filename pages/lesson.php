<?php
$st = db()->prepare('SELECT x.*, u.level_id, u.title_ar utitle, l.ord lord, l.title_ar ltitle, l.course_id, c.slug, c.title_ar ctitle, c.template FROM lessons x JOIN units u ON u.id = x.unit_id JOIN levels l ON l.id = u.level_id JOIN courses c ON c.id = l.course_id WHERE x.id = ? AND x.published = 1 AND c.published = 1');
$st->execute([(int)($_GET['id'] ?? 0)]); $ls = $st->fetch();
if (!$ls) { http_response_code(404); redirect('home'); }
$uid = (int)($_SESSION['uid'] ?? 0);
$lvl = ['id' => $ls['level_id'], 'ord' => $ls['lord']];
if ((int)$ls['lord'] > 1 && !($uid && level_open($uid, $lvl)) && !is_admin()) { flash('هذا المستوى مغلق', 'err'); redirect('level', ['id' => $ls['level_id']]); }
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    csrf_check(); require_student();
    db()->prepare('INSERT IGNORE INTO progress(user_id, lesson_id) VALUES(?,?)')->execute([$uid, $ls['id']]);
    flash('تم تسجيل إتمام الدرس ✓'); redirect('lesson', ['id' => $ls['id']]);
}
$bs = db()->prepare('SELECT * FROM lesson_blocks WHERE lesson_id = ? ORDER BY ord, id'); $bs->execute([$ls['id']]);
$d = false; if ($uid) { $q = db()->prepare('SELECT 1 FROM progress WHERE user_id = ? AND lesson_id = ?'); $q->execute([$uid, $ls['id']]); $d = (bool)$q->fetchColumn(); }
$nx = db()->prepare('SELECT x.id FROM lessons x JOIN units u ON u.id = x.unit_id WHERE u.level_id = ? AND x.published = 1 AND (u.ord > (SELECT ord FROM units WHERE id = ?) OR (u.id = ? AND x.ord > ?)) ORDER BY u.ord, x.ord LIMIT 1');
$nx->execute([$ls['level_id'], $ls['unit_id'], $ls['unit_id'], $ls['ord']]); $next = $nx->fetchColumn();
page_head($ls['title_ar'], 'lessonpg');
?>
<div class="crumb"><a href="index.php?p=course&amp;c=<?= e($ls['slug']) ?>"><?= e($ls['ctitle']) ?></a> ‹ <a href="index.php?p=level&amp;id=<?= (int)$ls['level_id'] ?>">المستوى <?= (int)$ls['lord'] ?></a> ‹ <?= e($ls['utitle']) ?></div>
<h1><?= e($ls['title_ar']) ?></h1><div class="en lt" dir="ltr"><?= e($ls['title_en']) ?></div>
<div class="tags"><?php if ($ls['standard'] !== ''): ?><i class="tag"><?= e($ls['standard']) ?></i><?php endif; ?><?= lesson_flags((int)$ls['id']) ?><?php if ($ls['reviewed_at']): ?><small class="muted">آخر مراجعة: <?= e($ls['reviewed_at']) ?></small><?php endif; ?></div>
<?php foreach ($bs->fetchAll() as $b) echo render_block($b); ?>
<div class="lesson-foot">
<?php if ($uid): ?>
  <form method="post"><?= csrf_field() ?><button class="btn <?= $d ? 'done' : '' ?>" <?= $d ? 'disabled' : '' ?>><?= $d ? '✓ أتممت هذا الدرس' : 'أتممت الدرس ✓' ?></button></form>
<?php else: ?><a class="btn" href="index.php?p=login">سجّل الدخول لحفظ تقدّمك</a><?php endif; ?>
  <a class="btn alt" href="index.php?p=level&amp;id=<?= (int)$ls['level_id'] ?>">العودة إلى الدروس</a>
  <?php if ($next): ?><a class="btn" href="index.php?p=lesson&amp;id=<?= (int)$next ?>">الدرس التالي ←</a><?php endif; ?>
</div>
<?php page_foot();
