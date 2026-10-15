<?php
$st = db()->prepare('SELECT * FROM courses WHERE slug = ? AND published = 1'); $st->execute([(string)($_GET['c'] ?? '')]); $c = $st->fetch();
if (!$c) { http_response_code(404); redirect('home'); }
$lv = db()->prepare('SELECT l.*, (SELECT COUNT(*) FROM lessons x JOIN units u ON u.id = x.unit_id WHERE u.level_id = l.id AND x.published = 1) nl FROM levels l WHERE course_id = ? ORDER BY ord'); $lv->execute([$c['id']]); $levels = $lv->fetchAll();
$uid = (int)($_SESSION['uid'] ?? 0);
page_head($c['title_ar']);
?>
<div class="crumb"><a href="index.php">الرئيسية</a> ‹ <?= e($c['title_ar']) ?></div>
<div class="course-head"><div class="ico big"><?= e($c['icon']) ?></div><div><h1><?= e($c['title_ar']) ?></h1><div class="en" dir="ltr"><?= e($c['title_en']) ?></div><p><?= e($c['description_ar']) ?></p></div></div>
<h2 class="sec-h">المستويات</h2>
<div class="levels">
<?php foreach ($levels as $l): $open = $uid ? level_open($uid, $l) : ((int)$l['ord'] === 1); ?>
  <a class="card level <?= $open ? '' : 'locked' ?>" href="index.php?p=level&amp;id=<?= (int)$l['id'] ?>">
    <div class="num">المستوى <?= (int)$l['ord'] ?></div>
    <h3><?= e($l['title_ar']) ?></h3><div class="en" dir="ltr"><?= e($l['title_en']) ?></div>
    <p><?= e($l['description_ar']) ?></p>
    <small><?= $open ? ((int)$l['nl'] . ' درساً منشوراً') : '🔒 يُفتح بعد إتمام المستوى السابق أو بموافقة الإدارة' ?></small>
  </a>
<?php endforeach; ?>
</div>
<?php page_foot();
