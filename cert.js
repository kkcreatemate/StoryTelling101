/* /certificate — two steps.

   1. Feedback: a rating plus text, a voice note or a video. It goes to
      the KK Create team's WhatsApp: text as a prefilled chat, a recording
      through the phone's share sheet (or saved, with the chat opened, on
      devices that can't share files). Sending it unlocks step 2, and the
      unlock is remembered on this device.
   2. The Storyteller's Pass: filled from the form and downloaded as a PNG.
      The photo is read locally and the image is drawn on the device.
   3. Sharing: the pass and a ready caption, tagged @kk.create. */
(function () {
  const SUPPORT_WA = '918700105418';
  const UNLOCK_KEY = 'st-cert-unlocked';

  const gate = document.querySelector('[data-gate]');
  const form = document.querySelector('[data-cert-form]');
  const cert = document.querySelector('[data-cert]');
  if (!gate || !form || !cert) return;

  const store = {
    get() { try { return JSON.parse(localStorage.getItem(UNLOCK_KEY) || 'null'); } catch (e) { return null; } },
    set(v) { try { localStorage.setItem(UNLOCK_KEY, JSON.stringify(v)); } catch (e) { /* private mode: unlocks for this visit only */ } }
  };
  const tidy = (s) => s.trim().replace(/\s+/g, ' ');

  /* ================= Step 1: feedback ================= */
  const gateStatus = gate.querySelector('[data-gate-status]');
  const say = (msg, isError) => { gateStatus.textContent = msg; gateStatus.classList.toggle('is-error', !!isError); };

  // Rating
  let rating = 0;
  const stars = [...gate.querySelectorAll('[data-star]')];
  stars.forEach((btn) => btn.addEventListener('click', () => {
    rating = Number(btn.dataset.star);
    stars.forEach((s) => {
      const on = Number(s.dataset.star) <= rating;
      s.classList.toggle('is-on', on);
      s.setAttribute('aria-checked', String(Number(s.dataset.star) === rating));
    });
  }));

  // Tabs
  let mode = 'text';
  const tabs = [...gate.querySelectorAll('[data-tab]')];
  tabs.forEach((tab) => tab.addEventListener('click', () => {
    mode = tab.dataset.tab;
    tabs.forEach((t) => t.setAttribute('aria-selected', String(t === tab)));
    gate.querySelectorAll('[data-pane]').forEach((p) => { p.hidden = p.dataset.pane !== mode; });
    say('');
  }));

  // Recorders: one for the voice note, one for the video. Each ends up
  // holding a Blob, from the microphone/camera or from an uploaded file.
  const recorders = {};
  gate.querySelectorAll('[data-rec]').forEach((box) => {
    const kind = box.dataset.rec;
    const toggle = box.querySelector('[data-rec-toggle]');
    const label = toggle.querySelector('span');
    const timeEl = box.querySelector('[data-rec-time]');
    const preview = box.querySelector('[data-rec-preview]');
    const live = box.querySelector('[data-rec-live]');
    const fileIn = box.querySelector('[data-rec-file]');
    const limit = kind === 'video' ? 60 : 180;
    const idleLabel = label.textContent;
    const state = { blob: null, name: '' };
    let rec = null, stream = null, timer = null, started = 0;

    function show(blob, name) {
      state.blob = blob;
      state.name = name;
      preview.src = URL.createObjectURL(blob);
      preview.hidden = false;
    }

    function stopStream() {
      if (stream) stream.getTracks().forEach((t) => t.stop());
      stream = null;
      if (live) { live.srcObject = null; live.hidden = true; }
    }

    async function start() {
      if (!navigator.mediaDevices || !window.MediaRecorder) {
        say('Recording isn’t supported in this browser. Upload a file instead.', true);
        return;
      }
      try {
        stream = await navigator.mediaDevices.getUserMedia(kind === 'video'
          ? { video: { facingMode: 'user' }, audio: true }
          : { audio: true });
      } catch (e) {
        say('We couldn’t reach your ' + (kind === 'video' ? 'camera' : 'microphone') + '. Allow access, or upload a file instead.', true);
        return;
      }
      if (live) { live.srcObject = stream; live.hidden = false; live.play().catch(() => {}); }
      preview.hidden = true;
      const chunks = [];
      rec = new MediaRecorder(stream);
      rec.ondataavailable = (e) => { if (e.data.size) chunks.push(e.data); };
      rec.onstop = () => {
        const type = rec.mimeType || (kind === 'video' ? 'video/webm' : 'audio/webm');
        const ext = /mp4/.test(type) ? (kind === 'video' ? 'mp4' : 'm4a') : (/ogg/.test(type) ? 'ogg' : 'webm');
        show(new Blob(chunks, { type }), 'feedback.' + ext);
        stopStream();
      };
      rec.start();
      started = Date.now();
      toggle.classList.add('is-on');
      label.textContent = 'Stop recording';
      say('');
      timer = setInterval(() => {
        const s = Math.floor((Date.now() - started) / 1000);
        timeEl.textContent = Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0');
        if (s >= limit) stop();
      }, 250);
    }

    function stop() {
      clearInterval(timer);
      if (rec && rec.state !== 'inactive') rec.stop();
      toggle.classList.remove('is-on');
      label.textContent = 'Record again';
    }

    toggle.addEventListener('click', () => (rec && rec.state === 'recording' ? stop() : start()));
    fileIn.addEventListener('change', () => {
      const f = fileIn.files && fileIn.files[0];
      if (f) { show(f, f.name); label.textContent = idleLabel; timeEl.textContent = '0:00'; }
    });
    recorders[kind] = state;
  });

  function message(name, extra) {
    const lines = ['Storytelling 101 feedback', 'Name: ' + name];
    if (rating) lines.push('Rating: ' + '★'.repeat(rating) + ' (' + rating + '/5)');
    if (extra) lines.push('', extra);
    return lines.join('\n');
  }

  function openChat(text) {
    window.open('https://wa.me/' + SUPPORT_WA + '?text=' + encodeURIComponent(text), '_blank', 'noopener');
  }

  gate.addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = tidy(gate.elements.name.value);
    if (!name) { gate.elements.name.focus(); say('Add your name first.', true); return; }
    if (!rating) { say('Pick a rating from 1 to 5 stars.', true); return; }

    if (mode === 'text') {
      const text = tidy(gate.elements.text.value);
      if (text.length < 20) { gate.elements.text.focus(); say('Write at least 20 characters, so we know what worked for you.', true); return; }
      openChat(message(name, text));
      unlock(name);
      return;
    }

    const media = recorders[mode];
    if (!media || !media.blob) { say(mode === 'video' ? 'Record or upload a short video first.' : 'Record or upload a voice note first.', true); return; }
    const ext = (media.name.split('.').pop() || 'webm').toLowerCase();
    const file = new File([media.blob], 'Storytelling-101-feedback-' + name.replace(/[^A-Za-z0-9]+/g, '-') + '.' + ext, { type: media.blob.type });
    const what = mode === 'video' ? 'video' : 'voice note';

    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      try {
        await navigator.share({ files: [file], text: message(name, 'My ' + what + ' is attached.') + '\nPlease send to KK Create: +91 8700105418' });
        unlock(name);
      } catch (err) {
        if (err && err.name === 'AbortError') say('Sharing was cancelled. Send it to KK Create on WhatsApp to unlock your certificate.', true);
        else say('That didn’t send. Try again, or switch to Write.', true);
      }
      return;
    }

    // No file sharing here (most desktops): save the file and open the chat.
    const a = document.createElement('a');
    a.href = URL.createObjectURL(file);
    a.download = file.name;
    document.body.appendChild(a);
    a.click();
    a.remove();
    openChat(message(name, 'I’m attaching my ' + what + ' here.'));
    say('We saved your ' + what + ' as ' + file.name + '. Attach it in the WhatsApp chat we just opened.');
    unlock(name);
  });

  /* ================= Step 2: the pass ================= */
  const stage = document.querySelector('[data-cert-stage]');
  const lock = document.querySelector('[data-lock]');
  const scaleBox = document.querySelector('[data-cert-scale]');
  const nameIn = form.elements.name;
  const cityIn = form.elements.city;
  const photoIn = form.elements.photo;
  const status = document.querySelector('[data-cert-status]');
  const button = document.querySelector('[data-cert-download]');
  const photo = cert.querySelector('[data-cert-photo]');
  const photoPh = cert.querySelector('[data-cert-photo-ph]');
  const bigName = cert.querySelector('[data-fit]');
  let unlocked = false;

  const W = 1280, H = 600;

  const shareCard = document.querySelector('[data-share]');

  // The tracker: step n is current, everything before it is done.
  function setStep(n) {
    document.querySelectorAll('[data-step]').forEach((s) => {
      const k = Number(s.dataset.step);
      s.classList.toggle('is-now', k === n);
      s.classList.toggle('is-done', k < n);
    });
  }

  function setLocked(locked) {
    unlocked = !locked;
    stage.classList.toggle('is-locked', locked);
    lock.hidden = !locked;
    form.hidden = locked;
    shareCard.hidden = locked;
    document.querySelector('[data-unlocked]').hidden = locked;
    setStep(locked ? 1 : 2);
  }

  function unlock(name) {
    store.set({ name: name, at: Date.now() });
    gate.hidden = true;
    setLocked(false);
    if (!tidy(nameIn.value)) { nameIn.value = name; render(); }
    form.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  /* ---------- Fit the 1280 x 600 pass to the screen ---------- */
  function fit() {
    const s = Math.min(1, stage.clientWidth / W);
    scaleBox.style.transform = 'scale(' + s + ')';
    stage.style.height = Math.round(H * s) + 'px';
  }
  window.addEventListener('resize', fit);
  if (window.ResizeObserver) new ResizeObserver(fit).observe(stage);
  fit();

  /* ---------- QR to the landing page ---------- */
  const qrBox = cert.querySelector('[data-cert-qr]');
  if (qrBox && window.qrcode) {
    const qr = qrcode(0, 'M');
    qr.addData('https://storytelling101.vercel.app/');
    qr.make();
    qrBox.innerHTML = qr.createSvgTag({ cellSize: 4, margin: 0, scalable: true });
  }

  /* ---------- Certificate code ----------
     Derived from the name, so the same name always gets the same code
     and a re-download matches the first one. */
  function codeFor(name) {
    let h = 2166136261;
    const s = name.trim().toLowerCase();
    for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
    return String((h >>> 0) % 10000).padStart(4, '0');
  }

  // The big name shrinks until it fits beside the photo.
  function fitName() {
    let size = 74;
    bigName.style.fontSize = size + 'px';
    while (bigName.scrollWidth > bigName.clientWidth + 1 && size > 36) {
      size -= 2;
      bigName.style.fontSize = size + 'px';
    }
  }

  function render() {
    const name = tidy(nameIn.value) || 'Your Name';
    const city = tidy(cityIn.value);
    cert.querySelectorAll('[data-cert-name]').forEach((el) => { el.textContent = name; });
    cert.querySelector('[data-cert-city]').textContent = city || 'Kahanikaar';
    cert.querySelector('[data-cert-quote]').textContent = city
      ? 'From ' + city + ', the next storyteller people will remember.'
      : 'The next storyteller people will remember.';
    cert.querySelector('[data-cert-code]').textContent = 'KKC-26-ST-' + codeFor(name);
    fitName();
  }
  nameIn.addEventListener('input', render);
  cityIn.addEventListener('input', render);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(fitName);

  photoIn.addEventListener('change', () => {
    const file = photoIn.files && photoIn.files[0];
    if (!file) { photo.hidden = true; photoPh.style.display = ''; return; }
    const reader = new FileReader();
    reader.onload = () => {
      photo.src = reader.result;
      photo.hidden = false;
      photoPh.style.display = 'none';
    };
    reader.readAsDataURL(file);
  });

  /* ---------- Download ---------- */
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!unlocked) return;
    if (!tidy(nameIn.value)) { nameIn.focus(); status.textContent = 'Add your name first.'; return; }
    if (!window.htmlToImage) { status.textContent = 'Could not load the image tool. Check your connection and try again.'; return; }

    button.disabled = true;
    status.textContent = 'Drawing your certificate…';
    try {
      const a = document.createElement('a');
      a.href = await drawPng();
      a.download = fileName();
      document.body.appendChild(a);
      a.click();
      a.remove();
      status.textContent = 'Downloaded. Now share it and tag us!';
      setStep(3);
    } catch (err) {
      status.textContent = 'Something went wrong while drawing it. Please try again.';
    } finally {
      button.disabled = false;
    }
  });

  const fileName = () => 'KK-Create-Storytelling-101-Certificate-' + tidy(nameIn.value).replace(/[^A-Za-z0-9]+/g, '-') + '.png';

  // The pass at full size, as a PNG data URL.
  async function drawPng() {
    const prev = scaleBox.style.transform;
    scaleBox.style.transform = 'none';
    try {
      if (document.fonts && document.fonts.ready) await document.fonts.ready;
      // An <img> with no src (the photo slot before a photo is chosen) makes
      // the renderer fail outright, so it is left out of the drawing.
      return await htmlToImage.toPng(cert, {
        width: W, height: H, pixelRatio: 2, cacheBust: true,
        filter: (node) => !(node.tagName === 'IMG' && !node.getAttribute('src'))
      });
    } finally {
      scaleBox.style.transform = prev;
    }
  }

  /* ================= Step 3: share ================= */
  const shareStatus = shareCard.querySelector('[data-share-status]');
  const caption = shareCard.querySelector('[data-caption]').textContent;
  const copyBtn = shareCard.querySelector('[data-copy-caption]');
  const shareBtn = shareCard.querySelector('[data-share-png]');

  async function copyCaption() {
    try { await navigator.clipboard.writeText(caption); return true; } catch (e) { return false; }
  }

  copyBtn.addEventListener('click', async () => {
    const label = copyBtn.textContent;
    copyBtn.textContent = (await copyCaption()) ? 'Copied!' : 'Copy failed';
    setTimeout(() => { copyBtn.textContent = label; }, 2000);
  });

  /* Phones get the share sheet with the image and caption attached. Where
     files can't be shared, the image downloads and the caption is copied,
     ready to paste into a post. */
  shareBtn.addEventListener('click', async () => {
    if (!tidy(nameIn.value)) { nameIn.focus(); shareStatus.textContent = 'Add your name to the certificate first.'; return; }
    if (!window.htmlToImage) { shareStatus.textContent = 'Could not load the image tool. Check your connection and try again.'; return; }
    shareBtn.disabled = true;
    shareStatus.textContent = 'Drawing your certificate…';
    try {
      const url = await drawPng();
      const file = new File([await (await fetch(url)).blob()], fileName(), { type: 'image/png' });
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await copyCaption();
        await navigator.share({ files: [file], text: caption });
        shareStatus.textContent = 'Shared! Don’t forget to tag @kk.create.';
      } else {
        const a = document.createElement('a');
        a.href = url;
        a.download = file.name;
        document.body.appendChild(a);
        a.click();
        a.remove();
        shareStatus.textContent = (await copyCaption())
          ? 'Saved your certificate and copied the caption. Post it and tag @kk.create.'
          : 'Saved your certificate. Post it with the caption above and tag @kk.create.';
      }
      setStep(3);
    } catch (err) {
      shareStatus.textContent = err && err.name === 'AbortError' ? '' : 'That didn’t work. Try Download certificate instead.';
    } finally {
      shareBtn.disabled = false;
    }
  });

  /* ---------- Start ---------- */
  const saved = store.get();
  if (saved && saved.name) {
    gate.hidden = true;
    setLocked(false);
    nameIn.value = saved.name;
  } else {
    setLocked(true);
  }
  render();
})();
