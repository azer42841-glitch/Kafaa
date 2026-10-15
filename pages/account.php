<?php
require_student(); $u = cur_user();
$n = db()->prepare('SELECT COUNT(*) FROM progress WHERE user_id = ?'); $n->execute([$u['id']]); $done = (int)$n->fetchColumn();
page_head('حسابي');
?>
<h1>حسابي</h1>
<div class="box"><p><b>الاسم:</b> <?= e($u['name']) ?></p><p><b>البريد:</b> <span dir="ltr"><?= e($u['email']) ?></span></p><p><b>الدروس المُتمَّة:</b> <?= $done ?></p></div>
<?php page_foot();
