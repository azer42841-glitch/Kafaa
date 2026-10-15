import { exec, q1 } from './db';

type Course = [string, string, string, string, string, string, [string, string, string][]];
const COURSES: Course[] = [
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
// آمن للتكرار: لا يضيف إلا ما هو ناقص
export async function seedCourses() {
  let o = 0;
  for (const [slug, en, ar, desc, ico, tpl, levels] of COURSES) {
    o++;
    await exec('INSERT INTO courses(slug,title_en,title_ar,description_ar,icon,template,ord) VALUES($1,$2,$3,$4,$5,$6,$7) ON CONFLICT (slug) DO NOTHING', [slug, en, ar, desc, ico, tpl, o]);
    const cid = (await q1('SELECT id FROM courses WHERE slug=$1', [slug]))!.id;
    for (let i = 0; i < levels.length; i++)
      await exec('INSERT INTO levels(course_id,ord,title_en,title_ar,description_ar) VALUES($1,$2,$3,$4,$5) ON CONFLICT (course_id,ord) DO NOTHING', [cid, i + 1, ...levels[i]]);
  }
}
// الأربع الأولى (featured) هي أسواق الإطلاق وتظهر بطاقات كبيرة، وبقية الدول العربية في قائمة مدمجة
const COUNTRIES: [string, string, string, number][] = [['ps', 'فلسطين', 'Palestine', 1], ['eg', 'مصر', 'Egypt', 1], ['ye', 'اليمن', 'Yemen', 1], ['sa', 'السعودية', 'Saudi Arabia', 1],
  ['jo', 'الأردن', 'Jordan', 0], ['lb', 'لبنان', 'Lebanon', 0], ['sy', 'سوريا', 'Syria', 0], ['iq', 'العراق', 'Iraq', 0], ['kw', 'الكويت', 'Kuwait', 0], ['bh', 'البحرين', 'Bahrain', 0],
  ['qa', 'قطر', 'Qatar', 0], ['ae', 'الإمارات', 'United Arab Emirates', 0], ['om', 'عُمان', 'Oman', 0], ['ly', 'ليبيا', 'Libya', 0], ['tn', 'تونس', 'Tunisia', 0], ['dz', 'الجزائر', 'Algeria', 0],
  ['ma', 'المغرب', 'Morocco', 0], ['mr', 'موريتانيا', 'Mauritania', 0], ['sd', 'السودان', 'Sudan', 0], ['so', 'الصومال', 'Somalia', 0], ['dj', 'جيبوتي', 'Djibouti', 0], ['km', 'جزر القمر', 'Comoros', 0]];
export async function seedCountries() {
  for (let i = 0; i < COUNTRIES.length; i++) {
    const [c, ar, en, f] = COUNTRIES[i];
    await exec('INSERT INTO countries(code,name_ar,name_en,ord,featured) VALUES($1,$2,$3,$4,$5) ON CONFLICT (code) DO UPDATE SET name_ar=EXCLUDED.name_ar, name_en=EXCLUDED.name_en, ord=EXCLUDED.ord, featured=EXCLUDED.featured', [c, ar, en, i + 1, f]);
  }
}
