<?php
declare(strict_types=1);
define('SITE_NAME', 'سلاسة');
define('SITE_NAME_EN', 'Salasa Knowledge Platform');
define('SESSION_IDLE_ADMIN', 1800);
if (is_file(__DIR__ . '/config.local.php')) require __DIR__ . '/config.local.php';
if (!defined('DEBUG')) define('DEBUG', false);
