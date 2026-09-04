/* MoveJS website interactions - progressive enhancement, no dependencies */
(function () {
  'use strict';

  // Copy code blocks
  document.addEventListener('click', function (e) {
    var btn = e.target.closest && e.target.closest('.copy');
    if (!btn) return;
    var block = btn.closest('.code');
    if (!block) return;
    var pre = block.querySelector('pre');
    if (!pre) return;
    var text = pre.textContent.replace(/\n$/, '');
    var done = function () {
      btn.textContent = 'Copied';
      setTimeout(function () { btn.textContent = 'Copy'; }, 1600);
    };
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(done, function () { fallback(text); done(); });
    } else {
      fallback(text);
      done();
    }
  });

  function fallback(text) {
    var ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    try { document.execCommand('copy'); } catch (_) {}
    document.body.removeChild(ta);
  }

  // Highlight active sidebar link + scroll it into view
  var path = location.pathname;
  if (path.length > 1 && path.endsWith('/')) path = path.slice(0, -1);
  var active = document.querySelector('.docs-sidebar a.active');
  if (!active) {
    document.querySelectorAll('.docs-sidebar a').forEach(function (a) {
      if (a.getAttribute('href') === path) a.classList.add('active');
    });
    active = document.querySelector('.docs-sidebar a.active');
  }
  if (active && active.scrollIntoView) {
    setTimeout(function () { active.scrollIntoView({ block: 'center' }); }, 60);
  }
})();