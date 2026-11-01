/* Storytelling 101 landing page: campaign params onto the checkout links,
   the testimonial rails, the video posters, the sticky bar with its live
   countdown, and the voice notes. The page reads fine with all of this off,
   and every Save my seat link still reaches checkout. */

/* ---------- Checkout links ----------
   utm_*, gclid, fbclid and so on carry through to TagMango, so a sale is
   credited to whatever earned it. A param the link already has wins. */
(function () {
  const page = new URLSearchParams(window.location.search);
  if (![...page.keys()].length) return;
  document.querySelectorAll('[data-buy]').forEach((link) => {
    const target = new URL(link.href, window.location.href);
    page.forEach((value, key) => {
      if (!target.searchParams.has(key)) target.searchParams.set(key, value);
    });
    link.href = target.toString();
  });
})();

/* ---------- Rails: arrows scroll the same strip a finger does ---------- */
document.querySelectorAll('[data-rail]').forEach((rail) => {
  const track = rail.querySelector('[data-rail-track]');
  const prev = rail.querySelector('[data-rail-prev]');
  const next = rail.querySelector('[data-rail-next]');
  if (!track || !prev || !next) return;
  const step = () => Math.max(260, track.clientWidth * 0.8);
  function sync() {
    prev.disabled = track.scrollLeft < 8;
    next.disabled = track.scrollLeft + track.clientWidth > track.scrollWidth - 8;
  }
  prev.addEventListener('click', () => track.scrollBy({ left: -step(), behavior: 'smooth' }));
  next.addEventListener('click', () => track.scrollBy({ left: step(), behavior: 'smooth' }));
  track.addEventListener('scroll', sync, { passive: true });
  window.addEventListener('resize', sync);
  sync();
});

/* ---------- Video posters ----------
   Vimeo's player stays off the page until someone presses play. */
document.querySelectorAll('[data-vimeo]').forEach((poster) => {
  poster.addEventListener('click', () => {
    const frame = document.createElement('iframe');
    frame.src = 'https://player.vimeo.com/video/' + poster.dataset.vimeo +
                '?title=0&portrait=0&badge=0&autoplay=1';
    frame.title = poster.getAttribute('aria-label') || 'Student testimonial';
    frame.allow = 'autoplay; fullscreen; picture-in-picture';
    frame.allowFullscreen = true;
    poster.replaceWith(frame);
    frame.focus({ preventScroll: true });
    document.dispatchEvent(new CustomEvent('st:video'));
  });
});

/* ---------- Sticky bar ----------
   Comes in once the hero's button has been scrolled past, never before it
   has appeared, and stays until the closing band is on screen. It steps aside over the
   price section too, where it would repeat that button in the same pink. The buttons in between don't hide it: that
   made it slide out and back in repeatedly on the way down. */
(function () {
  const bar = document.querySelector('[data-sticky]');
  if (!bar) return;
  if (!('IntersectionObserver' in window)) { bar.classList.add('is-in'); return; }
  const hero = document.querySelector('.st-hero [data-buy]');
  const closing = document.querySelector('.st-final [data-buy]');
  let passedHero = false;
  const price = document.querySelector('#price');
  let closingSeen = false;
  let priceSeen = false;
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (e.target === hero) passedHero = !e.isIntersecting && e.boundingClientRect.top < 0;
      else if (e.target === price) priceSeen = e.isIntersecting;
      else closingSeen = e.isIntersecting || e.boundingClientRect.top < 0;
    });
    bar.classList.toggle('is-in', passedHero && !closingSeen && !priceSeen);
  });
  [hero, closing, price].forEach((el) => el && io.observe(el));
})();

/* ---------- Countdown to the live session ----------
   A real deadline: 22 Nov 2026, 12 PM IST. It goes away once we are live
   rather than sitting at zero. */
(function () {
  const els = document.querySelectorAll('[data-countdown]');
  if (!els.length) return;
  const START = Date.parse('2026-11-22T12:00:00+05:30');
  const pad = (n) => String(n).padStart(2, '0');
  function tick() {
    const left = START - Date.now();
    if (left <= 0) {
      els.forEach((el) => { el.hidden = true; });
      clearInterval(timer);
      return;
    }
    const d = Math.floor(left / 86400000);
    const h = Math.floor(left / 3600000) % 24;
    const m = Math.floor(left / 60000) % 60;
    const s = Math.floor(left / 1000) % 60;
    const text = (d ? d + 'd ' : '') + pad(h) + ':' + pad(m) + ':' + pad(s);
    els.forEach((el) => { el.textContent = text; });
  }
  const timer = setInterval(tick, 1000);
  tick();
})();

/* ---------- Voice notes ----------
   The first note starts by itself when the chat is mostly in view. Browsers
   only allow sound without a tap once the visitor has interacted with the
   page, so if play() is refused its button pulses and the hint asks for a
   tap. Anyone can pause or play any note, and starting one stops the other,
   as does starting a video. Playback the page began by itself is paused if
   the chat scrolls away; playback the visitor began is left alone. */
(function () {
  const chat = document.querySelector('[data-voice]');
  if (!chat) return;
  const hint = chat.querySelector('[data-voice-hint]');
  const fmt = (s) => Math.floor(s / 60) + ':' + String(Math.floor(s % 60)).padStart(2, '0');

  const notes = [...chat.querySelectorAll('[data-note]')].map((el) => {
    const audio = el.querySelector('audio');
    const toggle = el.querySelector('[data-note-toggle]');
    const wave = el.querySelector('[data-note-wave]');
    const timeEl = el.querySelector('[data-note-time]');
    const speedBtn = el.querySelector('[data-note-speed]');
    const fallback = Number(el.dataset.duration);
    const duration = () => (isFinite(audio.duration) && audio.duration) || fallback;

    /* Loudness of the recording, measured from the file. Stretched so a
       steady talker still reads as a waveform. */
    const levels = el.dataset.levels.split(',').map(Number);
    const lo = Math.min(...levels), hi = Math.max(...levels);
    const bars = levels.map((v, i) => {
      const b = document.createElement('i');
      b.style.height = Math.round(22 + ((v - lo) / (hi - lo)) * 60 + (Math.sin(i * 1.7) + 1) * 8) + '%';
      wave.appendChild(b);
      return b;
    });

    function paint() {
      const p = audio.currentTime / duration();
      const lit = Math.round(p * bars.length);
      bars.forEach((b, i) => b.classList.toggle('on', i < lit));
      timeEl.textContent = fmt(audio.currentTime) + ' / ' + fmt(duration());
      wave.setAttribute('aria-valuenow', String(Math.round(p * 100)));
    }

    const note = { el, audio, toggle, paint };

    toggle.addEventListener('click', () => {
      userTouched = true;
      autoStarted = false;
      if (audio.paused) audio.play().catch(() => {}); else audio.pause();
    });

    const speeds = [1, 1.5, 2];
    speedBtn.addEventListener('click', () => {
      const next = speeds[(speeds.indexOf(audio.playbackRate) + 1) % speeds.length] || 1;
      audio.playbackRate = next;
      speedBtn.textContent = next + '×';
    });

    wave.addEventListener('click', (e) => {
      userTouched = true;
      const r = wave.getBoundingClientRect();
      audio.currentTime = Math.min(1, Math.max(0, (e.clientX - r.left) / r.width)) * duration();
      paint();
    });
    wave.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowRight') audio.currentTime = Math.min(duration(), audio.currentTime + 10);
      else if (e.key === 'ArrowLeft') audio.currentTime = Math.max(0, audio.currentTime - 10);
      else return;
      e.preventDefault();
      paint();
    });

    audio.addEventListener('timeupdate', paint);
    audio.addEventListener('loadedmetadata', paint);
    audio.addEventListener('play', () => {
      notes.forEach((n) => { if (n !== note) n.audio.pause(); n.el.classList.remove('needs-tap'); });
      el.classList.add('is-playing');
      toggle.setAttribute('aria-label', 'Pause the voice note');
      hint.textContent = 'Playing · tap to pause';
    });
    audio.addEventListener('pause', () => {
      el.classList.remove('is-playing');
      toggle.setAttribute('aria-label', 'Play the voice note');
      if (!notes.some((n) => !n.audio.paused)) hint.textContent = 'Paused · tap to resume';
    });
    audio.addEventListener('ended', () => {
      audio.currentTime = 0;
      paint();
      hint.textContent = 'Tap play to listen again';
    });
    return note;
  });

  let autoStarted = false;
  let userTouched = false;

  document.addEventListener('st:video', () => {
    userTouched = true;
    notes.forEach((n) => n.audio.pause());
  });

  if (!('IntersectionObserver' in window) || !notes.length) return;

  new IntersectionObserver(([entry]) => {
    const first = notes[0];
    const anyPlaying = notes.some((n) => !n.audio.paused);
    if (entry.isIntersecting) {
      if (userTouched || anyPlaying) return;
      first.audio.play().then(() => { autoStarted = true; }).catch(() => {
        first.el.classList.add('needs-tap');
        hint.textContent = 'Tap play to listen';
      });
    } else if (autoStarted && anyPlaying) {
      notes.forEach((n) => n.audio.pause());
    }
  }, { threshold: 0.6 }).observe(chat);
})();
