<?php
// يملأ المساقات والمستويات الأولية (آمن للتكرار: لا يضيف إلا ما هو ناقص)
function kafaa_seed(): void {
    $courses = [
        ['accounting', 'Accounting', 'المحاسبة', 'من القيد المزدوج حتى المراجعة والتحليل المالي، مع المصطلحات الإنجليزية التي يحتاجها المحاسب.', '🧮', 'accounting', [
            ['Accounting Basics', 'أساسيات المحاسبة', 'القيد المزدوج، الأصول والخصوم وحقوق الملكية، دفتر اليومية.'],
            ['Financial Accounting', 'المحاسبة المالية', 'القوائم المالية: الميزانية وقائمة الدخل والتدفقات النقدية.'],
            ['Cost Accounting', 'محاسبة التكاليف', 'تصنيف التكاليف وتحليل التعادل والموازنات.'],
            ['Intermediate Accounting', 'المحاسبة المتوسطة', 'الأصول الثابتة والمخزون والالتزامات بتفصيل أعمق.'],
            ['Auditing & Financial Analysis', 'المراجعة والتحليل المالي', 'أساسيات المراجعة والنسب المالية وتفسير القوائم.']]],
        ['business', 'Business Administration', 'إدارة الأعمال', 'مبادئ الإدارة والتسويق والموارد البشرية والعمليات والاستراتيجية بلغة الأعمال الإنجليزية.', '📊', 'business', [
            ['Principles of Management', 'مبادئ الإدارة', 'وظائف الإدارة الأربع والقيادة واتخاذ القرار.'],
            ['Marketing & Sales', 'التسويق والمبيعات', 'المزيج التسويقي وتحليل السوق وإدارة المبيعات.'],
            ['Human Resources', 'الموارد البشرية', 'التوظيف والتقييم والتحفيز وثقافة المنظمة.'],
            ['Operations & Project Management', 'العمليات والمشاريع', 'سلاسل الإمداد وإدارة الجودة والمشاريع.'],
            ['Strategy & Entrepreneurship', 'الاستراتيجية وريادة الأعمال', 'التخطيط الاستراتيجي ونماذج الأعمال وبدء المشاريع.']]],
        ['literature', 'English Literature', 'الأدب الإنجليزي', 'من أساسيات القصة إلى الرواية والمسرح والعصور الأدبية والنقد، بنصوص من الملك العام.', '📚', 'literature', [
            ['Introduction to Literature', 'مدخل إلى الأدب', 'عناصر القصة والحبكة والشخصيات بنصوص مبسطة.'],
            ['Short Story & Poetry', 'القصة القصيرة والشعر', 'التحليل والرمزية والأسلوب.'],
            ['Novel & Drama', 'الرواية والمسرح', 'روايات كلاسيكية ومسرح شكسبير.'],
            ['Literary Periods', 'العصور الأدبية', 'من الأدب الإنجليزي القديم إلى الحديث.'],
            ['Criticism & Academic Writing', 'النقد والكتابة الأكاديمية', 'النظريات النقدية وكتابة المقال والبحث.']]],
    ];
    $db = db(); $o = 0;
    foreach ($courses as [$slug, $en, $ar, $desc, $ico, $tpl, $levels]) {
        $o++;
        $db->prepare('INSERT IGNORE INTO courses(slug, title_en, title_ar, description_ar, icon, template, ord) VALUES(?,?,?,?,?,?,?)')->execute([$slug, $en, $ar, $desc, $ico, $tpl, $o]);
        $cid = (int)$db->query('SELECT id FROM courses WHERE slug = ' . $db->quote($slug))->fetchColumn();
        foreach ($levels as $i => [$len, $lar, $ldesc])
            $db->prepare('INSERT IGNORE INTO levels(course_id, ord, title_en, title_ar, description_ar) VALUES(?,?,?,?,?)')->execute([$cid, $i + 1, $len, $lar, $ldesc]);
    }
}
function kafaa_schema(): void {
    foreach (array_filter(array_map('trim', explode(';', (string)file_get_contents(__DIR__ . '/schema.sql')))) as $sql) {
        $sql = preg_replace('/^--.*$/m', '', $sql); if (trim($sql) !== '') db()->exec($sql);
    }
}

// ترقية قاعدة موجودة: يضيف الأعمدة الجديدة إن لم تكن موجودة (CREATE IF NOT EXISTS لا يعدّل الجداول القائمة)
function kafaa_migrate(): void {
    $has = function (string $t, string $c): bool {
        $s = db()->prepare('SELECT 1 FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = ? AND column_name = ?'); $s->execute([$t, $c]); return (bool)$s->fetchColumn();
    };
    if (!$has('users', 'country')) db()->exec('ALTER TABLE users ADD country CHAR(2) NULL');
    if (!$has('countries', 'featured')) db()->exec('ALTER TABLE countries ADD featured TINYINT(1) NOT NULL DEFAULT 0');
    if (!$has('lessons', 'standard')) db()->exec("ALTER TABLE lessons ADD standard VARCHAR(20) NOT NULL DEFAULT ''");
    if (!$has('lessons', 'reviewed_at')) db()->exec('ALTER TABLE lessons ADD reviewed_at DATE NULL');
}
function kafaa_seed_countries(): void {
    // الأربع الأولى (featured) هي أسواق الإطلاق وتظهر بطاقات كبيرة، وبقية الدول العربية في قائمة مدمجة
    $list = [['ps', 'فلسطين', 'Palestine', 1], ['eg', 'مصر', 'Egypt', 1], ['ye', 'اليمن', 'Yemen', 1], ['sa', 'السعودية', 'Saudi Arabia', 1],
        ['jo', 'الأردن', 'Jordan', 0], ['lb', 'لبنان', 'Lebanon', 0], ['sy', 'سوريا', 'Syria', 0], ['iq', 'العراق', 'Iraq', 0], ['kw', 'الكويت', 'Kuwait', 0], ['bh', 'البحرين', 'Bahrain', 0],
        ['qa', 'قطر', 'Qatar', 0], ['ae', 'الإمارات', 'United Arab Emirates', 0], ['om', 'عُمان', 'Oman', 0], ['ly', 'ليبيا', 'Libya', 0], ['tn', 'تونس', 'Tunisia', 0], ['dz', 'الجزائر', 'Algeria', 0],
        ['ma', 'المغرب', 'Morocco', 0], ['mr', 'موريتانيا', 'Mauritania', 0], ['sd', 'السودان', 'Sudan', 0], ['so', 'الصومال', 'Somalia', 0], ['dj', 'جيبوتي', 'Djibouti', 0], ['km', 'جزر القمر', 'Comoros', 0]];
    foreach ($list as $i => [$c, $ar, $en, $f])
        db()->prepare('INSERT INTO countries(code, name_ar, name_en, ord, featured) VALUES(?,?,?,?,?) ON DUPLICATE KEY UPDATE name_ar = VALUES(name_ar), name_en = VALUES(name_en), ord = VALUES(ord), featured = VALUES(featured)')->execute([$c, $ar, $en, $i + 1, $f]);
}
