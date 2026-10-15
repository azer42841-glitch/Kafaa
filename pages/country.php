<?php
// تغيير منهج الدولة (POST + CSRF). يعود المستخدم إلى الصفحة التي كان فيها إن كانت من الموقع نفسه.
if ($_SERVER['REQUEST_METHOD'] !== 'POST') redirect('home');
csrf_check();
$_SESSION['welcomed'] = 1;
if (!isset($_POST['skip'])) set_country(trim((string)($_POST['c'] ?? '')));
$back = (string)($_POST['back'] ?? '');
if ($back !== '' && $back[0] === '/' && substr($back, 0, 2) !== '//' && strpos($back, "\n") === false && strpos($back, "\r") === false) { header('Location: ' . $back); exit; }
redirect('home');
