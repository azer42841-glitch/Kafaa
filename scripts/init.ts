import { ensureSchema } from '../lib/schema';
import { seedCourses, seedCountries } from '../lib/seed';
(async () => { await ensureSchema(); await seedCourses(); await seedCountries(); console.log('تم إنشاء الجداول وتعبئة المساقات والدول'); process.exit(0); })();
