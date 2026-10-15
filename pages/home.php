<?php
page_head('الرئيسية', 'home');
$courses = db()->query('SELECT c.*, (SELECT COUNT(*) FROM levels l WHERE l.course_id = c.id) nl FROM courses c WHERE published = 1 ORDER BY ord, id')->fetchAll();
?>
<section class="hero">
  <h1>تعلّم تخصصك <span>بالإنجليزية</span></h1>
  <p>مساقات أكاديمية ومهنية متدرجة المستويات: تتقن فيها المادة العلمية ومصطلحاتها الإنجليزية معاً، بشرح واضح وتمارين وقيود محلولة واختبارات.</p>
  <a class="btn" href="#courses">استعرض المساقات</a>
</section>
<h2 id="courses" class="sec-h">المساقات</h2>
<div class="cards">
<?php foreach ($courses as $c): ?>
  <a class="card course" href="index.php?p=course&amp;c=<?= e($c['slug']) ?>">
    <div class="ico"><?= e($c['icon']) ?></div>
    <h3><?= e($c['title_ar']) ?></h3><div class="en" dir="ltr"><?= e($c['title_en']) ?></div>
    <p><?= e($c['description_ar']) ?></p>
    <small><?= (int)$c['nl'] ?> مستويات</small>
  </a>
<?php endforeach; if (!$courses): ?><p class="muted">لا توجد مساقات منشورة بعد.</p><?php endif; ?>
</div>
<?php page_foot();
