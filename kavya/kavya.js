(function () {
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var narrow = window.matchMedia('(max-width: 860px)');

  /* ---------- Reveal on scroll ---------- */
  var rvs = document.querySelectorAll('.rv');
  if ('IntersectionObserver' in window && !reduce) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });
    rvs.forEach(function (el) { io.observe(el); });
  } else {
    rvs.forEach(function (el) { el.classList.add('in'); });
  }

  /* ---------- Nav: black tab slides to the section in view ---------- */
  var nav = document.getElementById('sections');
  var links = Array.prototype.slice.call(nav.querySelectorAll('a'));
  var targets = links.map(function (a) { return document.querySelector(a.getAttribute('href')); });
  var current = -1;
  function placeTab(i) {
    if (i === current) return;
    current = i;
    var a = links[i];
    nav.style.setProperty('--tx', a.offsetLeft + 'px');
    nav.style.setProperty('--tw', a.offsetWidth + 'px');
    links.forEach(function (l, j) { l.classList.toggle('on', j === i); });
  }

  /* ---------- Hero timecode (runs with time + scroll) ---------- */
  var tc = document.getElementById('timecode');
  var start = performance.now();
  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function tick(now) {
    var t = (now - start) / 1000 + window.scrollY / 40;
    var h = Math.floor(t / 3600), m = Math.floor(t / 60) % 60, s = Math.floor(t) % 60, f = Math.floor((t % 1) * 25);
    tc.textContent = pad(h) + ':' + pad(m) + ':' + pad(s) + ':' + pad(f);
    if (!reduce) requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);

  /* ---------- Story: vertical scroll drives a horizontal film strip ---------- */
  var story = document.getElementById('story');
  var track = document.getElementById('track');
  var bar = document.querySelector('.scrub');
  var travel = 0;
  function sizeStory() {
    if (narrow.matches) { story.style.removeProperty('--story-h'); track.style.transform = ''; return; }
    travel = Math.max(0, track.scrollWidth - window.innerWidth);
    story.style.setProperty('--story-h', (window.innerHeight + travel) + 'px');
  }
  function moveStory() {
    if (narrow.matches) return;
    var r = story.getBoundingClientRect();
    var span = story.offsetHeight - window.innerHeight;
    var p = span > 0 ? Math.min(1, Math.max(0, -r.top / span)) : 0;
    track.style.transform = 'translate3d(' + (-p * travel) + 'px,0,0)';
    bar.style.setProperty('--p', p);
  }

  /* ---------- Count-up numbers ---------- */
  var counted = false;
  var numbers = document.querySelector('.numbers');
  function countUp() {
    if (counted) return;
    var r = numbers.getBoundingClientRect();
    if (r.top > window.innerHeight * 0.8) return;
    counted = true;
    if (reduce) return;
    numbers.querySelectorAll('[data-count]').forEach(function (dd) {
      var end = parseFloat(dd.dataset.count), suf = dd.dataset.suffix, dec = String(end).indexOf('.') > -1 ? 1 : 0;
      var t0 = performance.now(), dur = 1400;
      (function step(now) {
        var k = Math.min(1, (now - t0) / dur), e = 1 - Math.pow(1 - k, 3);
        dd.textContent = (end * e).toFixed(dec) + suf;
        if (k < 1) requestAnimationFrame(step);
      })(t0);
    });
  }

  /* ---------- Scroll loop ---------- */
  var ticking = false;
  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(function () {
      ticking = false;
      moveStory();
      countUp();
      var mid = window.innerHeight * 0.4, active = 0;
      targets.forEach(function (t, i) { if (t && t.getBoundingClientRect().top <= mid) active = i; });
      placeTab(active);
    });
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', function () { current = -1; sizeStory(); onScroll(); });
  window.addEventListener('load', function () { sizeStory(); current = -1; onScroll(); });
  sizeStory();
  onScroll();

  /* ---------- Phones: a fanned stack you can flip through ---------- */
  var phones = Array.prototype.slice.call(document.querySelectorAll('.phone'));
  var top = 0, timer;
  function lay() {
    var n = phones.length, wide = !narrow.matches;
    phones.forEach(function (ph, i) {
      var d = (i - top + n) % n;            // 0 = front
      var side = d === 0 ? 0 : (d % 2 ? 1 : -1) * Math.ceil(d / 2);
      var x = side * (wide ? 120 : 62);
      ph.style.zIndex = String(n - Math.abs(side) * 2 - (side < 0 ? 1 : 0));
      ph.style.translate = x + 'px ' + (Math.abs(side) * 14) + 'px';
      ph.style.rotate = side * 6 + 'deg';
      ph.style.scale = String(1 - Math.abs(side) * 0.08);
      ph.style.opacity = Math.abs(side) > 2 ? '0' : '1';
    });
  }
  function next() { top = (top + 1) % phones.length; lay(); }
  phones.forEach(function (ph, i) {
    ph.addEventListener('click', function () { top = i; lay(); restart(); });
  });
  function restart() { clearInterval(timer); if (!reduce) timer = setInterval(next, 3200); }
  lay();
  restart();
  narrow.addEventListener('change', function () { lay(); sizeStory(); });
})();
