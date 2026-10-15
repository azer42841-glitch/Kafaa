(function () {
  'use strict';
  // نافذة اختيار الدولة: تمنع تمرير الصفحة خلفها، ويغلقها Esc (في أول زيارة كأنه «تصفّح كل المناهج»)
  var wel = document.getElementById('welcome');
  if (wel) {
    var syncWel = function () { var open = wel.classList.contains('show') || location.hash === '#welcome'; document.documentElement.classList.toggle('wel-open', open); if (open) { var f = wel.querySelector('.wel-c'); if (f) f.focus(); } };
    syncWel(); window.addEventListener('hashchange', syncWel);
    document.addEventListener('keydown', function (e) {
      if (e.key !== 'Escape') return;
      if (wel.classList.contains('show')) { var sk = wel.querySelector('.wel-skip'); if (sk) sk.click(); } else if (location.hash === '#welcome') location.hash = '';
    });
  }
  // اختبار قصير: يظهر الصحيح والخطأ وعدد الإجابات الصحيحة
  document.addEventListener('click', function (e) {
    var b = e.target.closest('.qo'); if (!b) return;
    var q = b.closest('.q'); if (q.dataset.done) return; q.dataset.done = '1';
    var ok = b.dataset.ok === '1'; b.classList.add(ok ? 'good' : 'bad');
    if (!ok) { var g = q.querySelector('.qo[data-ok="1"]'); if (g) g.classList.add('good'); }
    var blk = q.closest('.blk'), all = blk.querySelectorAll('[data-q]'), done = blk.querySelectorAll('[data-q][data-done]');
    if (ok) blk.dataset.right = String((+blk.dataset.right || 0) + 1);
    if (all.length === done.length) blk.querySelector('[data-qres]').textContent = 'نتيجتك: ' + (blk.dataset.right || 0) + ' / ' + all.length;
  });
  // نافذة تأكيد عصرية بدل confirm
  document.addEventListener('submit', function (e) {
    var f = e.target.closest && e.target.closest('form[data-confirm]'); if (!f || f.dataset.ok) return;
    e.preventDefault();
    var d = document.createElement('div'); d.className = 'esdlg';
    var box = document.createElement('div'), p = document.createElement('p'), row = document.createElement('div');
    p.textContent = f.dataset.confirm; row.className = 'row';
    var y = document.createElement('button'), n = document.createElement('button');
    y.type = n.type = 'button'; y.className = 'btn'; n.className = 'btn alt'; y.textContent = 'نعم، تابع'; n.textContent = 'إلغاء';
    row.appendChild(y); row.appendChild(n); box.appendChild(p); box.appendChild(row); d.appendChild(box); document.body.appendChild(d); n.focus();
    function close() { d.remove(); }
    n.onclick = close; d.onclick = function (ev) { if (ev.target === d) close(); };
    y.onclick = function () { f.dataset.ok = '1'; close(); f.submit(); };
  });
  // تلميح صيغة المحتوى في محرر الإدارة
  var sel = document.querySelector('select[data-hint]'), hint = document.getElementById('newhint');
  if (sel && hint) { var upd = function () { hint.textContent = sel.options[sel.selectedIndex].dataset.h || ''; }; sel.addEventListener('change', upd); upd(); }
})();
