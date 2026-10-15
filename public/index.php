<?php
declare(strict_types=1);
require __DIR__ . '/../includes/bootstrap.php';
require __DIR__ . '/../includes/layout.php';
$pages = ['home', 'course', 'level', 'lesson', 'login', 'register', 'logout', 'account', 'admin', 'adminlogin', 'country'];
$p = (string)($_GET['p'] ?? 'home');
if (!in_array($p, $pages, true)) { http_response_code(404); $p = 'home'; }
require __DIR__ . '/../pages/' . $p . '.php';
