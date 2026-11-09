(function () {
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var clamp = function (v, a, b) { return Math.min(b, Math.max(a, v)); };

  /* ================= The tapes ================= */
  var TAPES = [
    { cls: 'c-band', img: '/kavya/img/memory-2.webp', word: '2022', title: 'Where it all began', sub: 'A phone, a desk, a corner',
      lines: ['It started with a phone.', 'No crew. No studio. Just a desk in the corner of a room.', 'And a story I really wanted to tell.', 'Every video taught me something the last one didn’t.', 'Turns out, that’s the only way anyone learns.'] },
    { cls: 'c-paper', img: '/kavya/img/memory-4.webp', marks: 'Har district,<br>ek kahani!', title: 'Every district has a story', sub: 'Markets, trains, deserts, mines',
      lines: ['Nani-dadi ki kahaniyan. Nobody ever skipped those.', 'So I went looking for India’s stories.', 'Markets, trains, deserts, mines. One district at a time.', 'Not the famous places. The people in them.', 'Faces get forgotten. Stories stay.'] },
    { cls: 'c-big', img: '/assets/kk/desert.jpg', pos: '30% 50%', word: 'Kahani', title: 'On the road', sub: 'Red dupatta, hot sand',
      lines: ['Most of my life now happens on the road.', 'A new place every week. A new story in every place.', 'Seventy-four hours on India’s longest train.', 'Inside Asia’s largest diamond mine, and the world’s largest salt desert.', 'And somehow, the smallest rooms told the biggest stories.'] },
    { cls: 'c-red', img: '/kavya/img/yt-1.webp', pos: '50% 60%', word: '36M views', title: 'The one that broke out', sub: 'Watched till the end',
      lines: ['Some stories you tell. Some stories tell themselves.', 'Our most watched video crossed 36 million views.', 'Almost half an hour long, and people stayed for all of it.', 'Long videos don’t lose people. Boring ones do.'] },
    { cls: 'c-right', img: '/assets/vk/studio-wide.jpg', pos: '50% 60%', word: '7 → 40+', title: 'From seven to forty', sub: 'Building the team',
      lines: ['For a long time, it was just a handful of us.', 'Then Varun joined, and we set up long-form video together.', 'Seven people became forty.', 'Now there’s a studio, a team, and a lot more chai.'] },
    { cls: 'c-big', img: '/kavya/img/memory-1.webp', pos: '50% 35%', word: '1M', title: 'The gold button', sub: '2025, one million subscribers',
      lines: ['In 2025, a box arrived at the office.', 'A gold play button. One million subscribers.', 'I couldn’t stop smiling. The photo says so.', 'Every one of those people chose to listen to a story.'] },
    { cls: 'c-green', img: '/kavya/img/forbes.webp', pos: '55% 40%', word: 'Forbes <b>30 Under 30</b>', title: 'A list I’d only read about', sub: 'For the stories, not just me',
      lines: ['Forbes 30 Under 30.', 'A list I had only ever read about.', 'Not because of one video, but because of every story before it.', 'It belongs to the whole team.'] },
    { cls: 'c-bonus', img: '/kavya/img/live.webp', pos: '50% 30%', word: 'Bonus', title: 'Bonus track', sub: 'Teaching it forward',
      lines: ['Now we teach what took us years to figure out.', 'Storytelling 101. Live, in Hinglish, on Zoom.', 'Students turn their cameras on and ask questions face to face.', 'They call me Kavya di. I’ll take it.', 'Your story deserves to be told. Start with the one you already have.'] }
  ];

  var rail = $('#rail');
  var playIcon = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 4l13 8-13 8z"/></svg>';
  rail.innerHTML = TAPES.map(function (t, n) {
    var no = (n < 9 ? '0' : '') + (n + 1);
    var cover = '<div class="cover ' + t.cls + '"><img class="full" src="' + t.img + '" alt="" loading="' + (n < 2 ? 'eager' : 'lazy') + '"' + (t.pos ? ' style="object-position:' + t.pos + '"' : '') + '>' +
      (t.marks ? '<p class="marks">' + t.marks + '</p>' : '<p class="word">' + t.word + '</p>') + '</div>';
    var script = t.lines.map(function (l) {
      return '<span>' + l.split(' ').map(function (w, k) { return '<i style="--d:' + (k * 0.06).toFixed(2) + 's">' + w + '</i>'; }).join(' ') + ' </span>';
    }).join('');
    return '<article class="card" data-n="' + n + '">' +
      '<div class="shot"><div class="flipper">' +
        '<div class="face front">' + cover + '<span class="tapeno">Tape ' + no + '</span></div>' +
        '<div class="face back"><p class="tag"><span>Tape ' + no + '</span><span class="dur"></span></p><div class="lines"><div class="script">' + script + '</div></div><i class="bar"></i></div>' +
      '</div>' +
      (n === 0 ? '<p class="hear-note" aria-hidden="true">start<br>here<svg viewBox="0 0 46 23" fill="none" stroke-linecap="round" stroke-linejoin="round"><path d="M2 6C14 3 30 6 40 14"/><path d="M32 16L41 15L38 6"/></svg></p>' : '') +
      '<button class="key note hear' + (n === 0 ? ' first' : '') + '" type="button"><i>' + playIcon + '</i><span>Hear it</span></button>' +
      '<button class="read" type="button">Read it</button>' +
      '</div><h3>' + t.title + '</h3><p class="sub">' + t.sub + '</p></article>';
  }).join('');
  var cards = $$('.card', rail);

  // durations: a relaxed speaking pace, about 2.6 words a second
  TAPES.forEach(function (t, n) {
    var words = t.lines.join(' ').split(' ').length;
    t.secs = Math.round(words / 2.6 + t.lines.length * 0.6);
    $('.dur', cards[n]).textContent = '0:' + (t.secs < 10 ? '0' : '') + t.secs;
  });

  /* ================= Layout: pinned rail ================= */
  var works = $('#story'), pin = $('#pin');
  var travel = 0, railX = 0;
  function sizeRail() {
    travel = Math.max(0, rail.scrollWidth - window.innerWidth);
    works.style.setProperty('--works-h', (window.innerHeight + travel) + 'px');
  }
  function moveRail() {
    var r = works.getBoundingClientRect();
    var span = works.offsetHeight - window.innerHeight;
    var p = span > 0 ? clamp(-r.top / span, 0, 1) : 0;
    railX = -p * travel;
    rail.style.transform = 'translate3d(' + railX + 'px,0,0)';
  }

  /* ================= The film strip ================= */
  var canvas = $('#tape'), ctx = canvas.getContext('2d');
  var FRAME = 74, BAND = 56;
  var FRAMES = ['/kavya/img/memory-1.webp', '/kavya/img/memory-2.webp', '/kavya/img/memory-3.webp', '/kavya/img/memory-4.webp', '/kavya/img/memory-5.webp', '/kavya/img/memory-6.webp', '/kavya/img/memory-7.webp', '/assets/vk/snow.jpg', '/assets/vk/fields.jpg', '/assets/vk/boat-laugh.jpg', '/assets/vk/garden-lights.jpg', '/assets/vk/trophy.jpg', '/assets/vk/saree-night.jpg', '/assets/vk/home-hug.jpg', '/kavya/img/reel-7.webp', '/kavya/img/reel-8.webp', '/kavya/img/reel-9.webp'];
  var frameImgs = FRAMES.map(function (src) { var im = new Image(); im.src = src; im.onload = queue; return im; });
  var probe = document.createElementNS('http://www.w3.org/2000/svg', 'path');

  function sample(d) {
    probe.setAttribute('d', d);
    var L = probe.getTotalLength(), fine = [], frames = [];
    for (var s = 0; s <= L; s += 8) { var p = probe.getPointAtLength(s); fine.push([p.x, p.y, s]); }
    for (var f = FRAME / 2, i = 0; f < L; f += FRAME, i++) {
      var a = probe.getPointAtLength(f - 2), b = probe.getPointAtLength(f + 2);
      var c = probe.getPointAtLength(f);
      frames.push([c.x, c.y, Math.atan2(b.y - a.y, b.x - a.x), f, i]);
    }
    return { L: L, fine: fine, frames: frames };
  }

  var segs = {};
  function buildPaths() {
    var vw = window.innerWidth, vh = window.innerHeight;
    // A: out of the cassette, down through the hero
    var hero = $('#top'), cas = $('#cassette'), hr = hero.getBoundingClientRect(), cr = cas.getBoundingClientRect();
    var sx = cr.left + cr.width / 2 - hr.left, sy = cr.bottom - hr.top - cr.height * 0.12, h = hero.offsetHeight;
    segs.A = sample('M' + sx + ',' + sy + ' C' + sx + ',' + (sy + 90) + ' ' + (vw * 0.62) + ',' + (sy + 40) + ' ' + (vw * 0.7) + ',' + (h * 0.84) +
      ' S' + (vw * 0.42) + ',' + (h + 60) + ' ' + (vw * 0.18) + ',' + (h + 220) + ' S' + (vw * 0.1) + ',' + (h + 520) + ' -80,' + (h + 640));
    // B: through the story rail, looping above and below the cards (rail coordinates)
    var first = cards[0], ch = $('.shot', first).offsetHeight, y0 = rail.offsetTop, W = rail.scrollWidth + vw;
    var low = y0 + ch + 120, high = y0 - 40, cw = first.offsetWidth + 40;
    var d = 'M-80,' + (low - 40) + ' C' + (cw * 0.2) + ',' + (low + 30) + ' ' + (cw * 0.5) + ',' + low + ' ' + (cw * 0.8) + ',' + (low - 10);
    for (var x = cw * 0.8, k = 0; x < W; x += cw, k++) {
      var nx = x + cw, ny = k % 3 === 1 ? high : low + (k % 2 ? 20 : -10);
      d += ' S' + (nx - cw * 0.35) + ',' + ny + ' ' + nx + ',' + ny;
    }
    segs.B = sample(d);
    // C: snaking through Beyond and Social
    var after = $('#after'), ah = after.offsetHeight;
    segs.C = sample('M-80,' + (ah * 0.04) + ' C' + (vw * 0.3) + ',' + (ah * 0.0) + ' ' + (vw * 0.62) + ',' + (ah * 0.02) + ' ' + (vw * 0.6) + ',' + (ah * 0.13) +
      ' S' + (vw * 0.98) + ',' + (ah * 0.3) + ' ' + (vw * 0.9) + ',' + (ah * 0.42) + ' S' + (vw * 0.3) + ',' + (ah * 0.47) + ' ' + (vw * 0.12) + ',' + (ah * 0.56) +
      ' S' + (vw * 0.05) + ',' + (ah * 0.8) + ' ' + (vw * 0.5) + ',' + (ah * 0.9) + ' S' + (vw + 40) + ',' + (ah * 0.92) + ' ' + (vw + 100) + ',' + (ah * 0.98));
  }

  function drawSeg(seg, ox, oy, upto) {
    var vw = window.innerWidth, vh = window.innerHeight, pad = 120;
    var fine = seg.fine, i, started = false;
    // band and its shadow
    for (var pass = 0; pass < 2; pass++) {
      ctx.beginPath(); started = false;
      for (i = 0; i < fine.length && fine[i][2] <= upto; i++) {
        var x = fine[i][0] + ox, y = fine[i][1] + oy + (pass ? 0 : 10);
        if (!started) { ctx.moveTo(x, y); started = true; } else ctx.lineTo(x, y);
      }
      ctx.lineWidth = pass ? BAND : BAND + 6;
      ctx.strokeStyle = pass ? '#151413' : 'rgba(30, 25, 60, .14)';
      ctx.lineJoin = 'round'; ctx.lineCap = 'butt';
      ctx.stroke();
    }
    // frames
    var fr = seg.frames;
    for (i = 0; i < fr.length && fr[i][3] <= upto; i++) {
      var fx = fr[i][0] + ox, fy = fr[i][1] + oy;
      if (fx < -pad || fx > vw + pad || fy < -pad || fy > vh + pad) continue;
      ctx.save(); ctx.translate(fx, fy); ctx.rotate(fr[i][2]);
      var im = frameImgs[fr[i][4] % frameImgs.length];
      var w = FRAME - 8, h = BAND - 22;
      if (im.complete && im.naturalWidth) {
        var s = Math.max(w / im.naturalWidth, h / im.naturalHeight), sw = w / s, sh = h / s;
        ctx.drawImage(im, (im.naturalWidth - sw) / 2, (im.naturalHeight - sh) / 3, sw, sh, -w / 2, -h / 2, w, h);
      } else { ctx.fillStyle = '#3a3633'; ctx.fillRect(-w / 2, -h / 2, w, h); }
      ctx.fillStyle = '#f4f1ea';
      for (var k = 0; k < 4; k++) {
        var hx = -FRAME / 2 + 6 + k * (FRAME / 4);
        ctx.fillRect(hx, -BAND / 2 + 3.5, 8, 5); ctx.fillRect(hx, BAND / 2 - 8.5, 8, 5);
      }
      ctx.restore();
    }
  }

  function sizeCanvas() {
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(window.innerWidth * dpr); canvas.height = Math.round(window.innerHeight * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function drawTape() {
    var vh = window.innerHeight, y = window.scrollY;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    var hr = $('#top').getBoundingClientRect();
    if (hr.bottom + 700 > 0) drawSeg(segs.A, hr.left, hr.top, segs.A.L * clamp(0.14 + y / (hr.height * 0.9), 0.14, 1));
    var pr = pin.getBoundingClientRect();
    if (pr.bottom > 0 && pr.top < vh) drawSeg(segs.B, railX, pr.top, -railX + window.innerWidth * 1.15 + (pr.top > 0 ? 0 : 0));
    var ar = $('#after').getBoundingClientRect();
    if (ar.top < vh && ar.bottom > -200) drawSeg(segs.C, ar.left, ar.top, segs.C.L * clamp((vh * 0.95 - ar.top) / (ar.height * 0.8), 0, 1));
  }

  /* ================= Cassette reels ================= */
  var hubL = $('#hubL'), hubR = $('#hubR'), packL = $('#packL circle'), packR = $('#packR circle'), cas = $('#cassette');
  var spin = 0;
  function moveCassette() {
    var p = clamp(window.scrollY / window.innerHeight, 0, 1);
    var a = (window.scrollY * 0.7 + spin) % 360;
    hubL.style.transform = 'rotate(' + a + 'deg)'; hubR.style.transform = 'rotate(' + a + 'deg)';
    packL.setAttribute('r', (30 - p * 12).toFixed(1)); packR.setAttribute('r', (16 + p * 12).toFixed(1));
    cas.style.setProperty('--rot', (-4 + p * 8).toFixed(2) + 'deg');
    $('#soundNote').classList.toggle('gone', window.scrollY > 40);
  }

  /* ================= Nav tab ================= */
  var nav = $('#sections'), links = $$('a', nav), targets = links.map(function (a) { return $(a.getAttribute('href')); }), current = -1;
  function placeTab() {
    var mid = window.innerHeight * 0.45, active = 0;
    targets.forEach(function (t, i) { if (t.getBoundingClientRect().top <= mid) active = i; });
    if (active === current) return;
    current = active;
    var a = links[active];
    nav.style.setProperty('--tx', a.offsetLeft + 'px'); nav.style.setProperty('--tw', a.offsetWidth + 'px');
    links.forEach(function (l, j) { l.classList.toggle('on', j === active); });
  }

  /* ================= Deck ================= */
  var keys = $('#keys'), nowText = $('#nowText'), clock = $('#clock'), screen = $('#screen');
  var muted = false, player = null;
  function fmt(s) { s = Math.max(0, Math.floor(s)); return (s < 600 ? '0' : '') + Math.floor(s / 60) + ':' + (s % 60 < 10 ? '0' : '') + (s % 60); }
  function setScreen(html) { nowText.innerHTML = html; }

  function stop(keepFlip) {
    if (!player) return;
    cancelAnimationFrame(player.raf);
    if (player.audio) { player.audio.pause(); }
    var c = player.card;
    c.style.removeProperty('--p');
    $('.hear span', c).textContent = 'Hear it';
    $('.hear', c).classList.remove('on');
    $$('.script span', c).forEach(function (s) { s.classList.remove('cur', 'past'); });
    $('.script', c).style.transform = '';
    if (!keepFlip) c.classList.remove('flip');
    keys.classList.remove('playing');
    screen.style.setProperty('--p', 0);
    clock.textContent = '00:00';
    setScreen('<span>Ready &ndash;</span> Pick a tape');
    player = null;
  }

  function play(card) {
    var n = +card.dataset.n, t = TAPES[n];
    stop();
    cards.forEach(function (c) { if (c !== card) c.classList.remove('flip', 'reading'); });
    card.classList.remove('reading'); card.classList.add('flip');
    rail.classList.add('heard');
    keys.classList.add('playing');
    $('.hear span', card).textContent = 'Stop';
    $('.hear', card).classList.add('on');
    setScreen('Tape ' + (n < 9 ? '0' : '') + (n + 1) + ' &ndash; ' + t.title);
    // weight each line by its words, so the highlight keeps pace with the voice
    var spans = $$('.script span', card), weights = t.lines.map(function (l) { return l.split(' ').length + 1.5; });
    var total = weights.reduce(function (a, b) { return a + b; }, 0), acc = 0;
    var bounds = weights.map(function (w) { acc += w; return acc / total; });
    var p = { card: card, t0: performance.now(), dur: t.secs, audio: null, line: -1 };
    player = p;
    // a real voice note plays if one has been added at /kavya/audio/tape-0N.mp3
    var au = new Audio('/kavya/audio/tape-' + (n < 9 ? '0' : '') + (n + 1) + '.mp3');
    au.muted = muted;
    au.play().then(function () { if (player === p) p.audio = au; else au.pause(); }).catch(function () {});
    var script = $('.script', card);
    (function tick(now) {
      if (player !== p) return;
      var el, dur;
      if (p.audio && p.audio.duration) { el = p.audio.currentTime; dur = p.audio.duration; } else { el = (now - p.t0) / 1000; dur = p.dur; }
      var k = clamp(el / dur, 0, 1), line = 0;
      while (line < bounds.length - 1 && k > bounds[line]) line++;
      if (line !== p.line) {
        p.line = line;
        spans.forEach(function (s, i) { s.classList.toggle('cur', i === line); s.classList.toggle('past', i < line); });
        script.style.transform = 'translateY(' + (-spans[line].offsetTop + 30) + 'px)';
      }
      card.style.setProperty('--p', k);
      $('.bar', card).style.setProperty('--p', k);
      screen.style.setProperty('--p', k);
      clock.textContent = fmt(el);
      if (k >= 1 || (p.audio && p.audio.ended)) { setTimeout(function () { if (player === p) stop(); }, 900); return; }
      p.raf = requestAnimationFrame(tick);
    })(p.t0);
  }

  rail.addEventListener('click', function (e) {
    var card = e.target.closest('.card'); if (!card) return;
    if (e.target.closest('.hear')) {
      if (player && player.card === card) stop(); else play(card);
    } else if (e.target.closest('.read')) {
      if (player && player.card === card) stop(true);
      var on = !card.classList.contains('reading');
      cards.forEach(function (c) { if (c !== card) c.classList.remove('flip', 'reading'); });
      card.classList.toggle('reading', on); card.classList.toggle('flip', on);
      $('.read', card).textContent = on ? 'Close' : 'Read it';
      rail.classList.add('heard');
    }
  });

  $('#kStop').addEventListener('click', function () { stop(); });
  $('#kSound').addEventListener('click', function () {
    muted = !muted;
    document.documentElement.classList.toggle('muted', muted);
    this.setAttribute('aria-pressed', String(!muted));
    this.setAttribute('aria-label', muted ? 'Turn sound on' : 'Turn sound off');
    if (player && player.audio) player.audio.muted = muted;
  });
  var rewinding = false;
  $('#kRew').addEventListener('click', function () {
    stop();
    rewinding = true; keys.classList.add('rewinding');
    setScreen('Rewinding');
    window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' });
  });

  function deckState() {
    var fr = $('#foot').getBoundingClientRect();
    keys.classList.toggle('ending', fr.top < window.innerHeight * 0.7 && !rewinding);
    if (rewinding) {
      spin -= 9;
      if (window.scrollY < 4) { rewinding = false; keys.classList.remove('rewinding'); setScreen('<span>Ready &ndash;</span> Pick a tape'); }
    }
  }

  /* ================= Reveal ================= */
  var rvs = $$('.rv');
  if ('IntersectionObserver' in window && !reduce) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
    }, { threshold: 0.15 });
    rvs.forEach(function (el) { io.observe(el); });
  } else rvs.forEach(function (el) { el.classList.add('in'); });

  /* ================= Social slider ================= */
  var slides = $$('.slide'), top = 0, timer;
  function lay() {
    var n = slides.length, w = slides[0].offsetWidth;
    slides.forEach(function (s, i) {
      var d = (i - top + n) % n; if (d > n / 2) d -= n;
      s.style.zIndex = String(10 - Math.abs(d));
      s.style.translate = 'calc(-50% + ' + d * w * 0.42 + 'px) ' + Math.abs(d) * 18 + 'px';
      s.style.rotate = d * 5 + 'deg';
      s.style.scale = String(1 - Math.abs(d) * 0.1);
      s.style.opacity = Math.abs(d) > 2 ? '0' : '1';
    });
  }
  function go(dir) { top = (top + dir + slides.length) % slides.length; lay(); restart(); }
  function restart() { clearInterval(timer); if (!reduce) timer = setInterval(function () { go(1); }, 3800); }
  $('#prev').addEventListener('click', function () { go(-1); });
  $('#next').addEventListener('click', function () { go(1); });
  slides.forEach(function (s, i) { s.addEventListener('click', function () { top = i; lay(); restart(); }); });

  /* ================= YouTube ================= */
  $('#ytPlay').addEventListener('click', function () {
    stop();
    var yt = $('#yt'), f = document.createElement('iframe');
    f.src = 'https://www.youtube-nocookie.com/embed/rfc38bcR74E?autoplay=1&rel=0';
    f.title = 'KK Create on YouTube';
    f.allow = 'autoplay; encrypted-media; picture-in-picture';
    f.allowFullscreen = true;
    yt.appendChild(f); yt.classList.add('on');
  });

  /* ================= Loop ================= */
  var queued = false;
  function frame() {
    queued = false;
    moveRail(); moveCassette(); drawTape(); placeTab(); deckState();
    if (rewinding) queue();
  }
  function queue() { if (!queued) { queued = true; requestAnimationFrame(frame); } }
  function layout() { sizeCanvas(); sizeRail(); moveRail(); buildPaths(); lay(); current = -1; queue(); }
  window.addEventListener('scroll', queue, { passive: true });
  window.addEventListener('resize', layout);
  window.addEventListener('load', layout);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(layout);
  layout();
  restart();
  // the reels idle-turn a little so the hero never looks frozen
  if (!reduce) setInterval(function () { if (window.scrollY < window.innerHeight) { spin += 1.2; queue(); } }, 60);
})();
