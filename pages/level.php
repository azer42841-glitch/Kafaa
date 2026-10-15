<?php
$st = db()->prepare('SELECT l.*, c.slug, c.title_ar ctitle FROM levels l JOIN courses c ON c.id = l.course_id WHERE l.id = ? AND c.published = 1'); $st->execute([(int)($_GET['id'] ?? 0)]); $lv = $st->fetch();
if (!$lv) { http_response_code(404); redirect('home'); }
$uid = (int)($_SESSION['uid'] ?? 0);
$open = (int)$lv['ord'] === 1 || ($uid && level_open($uid, $lv));
page_head($lv['title_ar']);
?>
<div class="crumb"><a href="index.php">الرئيسية</a> ‹ <a href="index.php?p=course&amp;c=<?= e($lv['slug']) ?>"><?= e($lv['ctitle']) ?></a> ‹ المستوى <?= (int)$lv['ord'] ?></div>
<h1><?= e($lv['title_ar']) ?></h1><div class="en" dir="ltr"><?= e($lv['title_en']) ?></div>
<?php if (!$open): ?>
  <div class="box lock-box">🔒 هذا المستوى مغلق. يُفتح بعد إتمام المستوى السابق أو بموافقة الإدارة.</div>
<?php else:
  $us = db()->prepare('SELECT * FROM units WHERE level_id = ? ORDER BY ord'); $us->execute([$lv['id']]);
  $done = [];
  if ($uid) { $d = db()->prepare('SELECT lesson_id FROM progress WHERE user_id = ?'); $d->execute([$uid]); $done = array_flip(array_column($d->fetchAll(), 'lesson_id')); }
  foreach ($us->fetchAll() as $u):
    [$cw, $cp] = lesson_country_sql('lessons', cur_country()); $ls = db()->prepare('SELECT * FROM lessons WHERE unit_id = ? AND published = 1 AND ' . $cw . ' ORDER BY ord'); $ls->execute(array_merge([$u['id']], $cp)); $lessons = $ls->fetchAll(); ?>
  <div class="unit"><h2>الوحدة <?= (int)$u['ord'] ?>: <?= e($u['title_ar']) ?> <small class="en" dir="ltr"><?= e($u['title_en']) ?></small></h2>
    <?php foreach ($lessons as $x): ?>
      <a class="lrow" href="index.php?p=lesson&amp;id=<?= (int)$x['id'] ?>"><span class="chk"><?= isset($done[$x['id']]) ? '✓' : (int)$x['ord'] ?></span><span><?= e($x['title_ar']) ?><small class="en" dir="ltr"><?= e($x['title_en']) ?></small></span><span class="tags"><?php if ($x['standard'] !== ''): ?><i class="tag"><?= e($x['standard']) ?></i><?php endif; ?><?= lesson_flags((int)$x['id']) ?></span></a>
    <?php endforeach; if (!$lessons): ?><p class="muted">لا توجد دروس منشورة في هذه الوحدة بعد.</p><?php endif; ?>
  </div>
<?php endforeach; endif; page_foot();
