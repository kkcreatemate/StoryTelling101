/* /certificate — fills the Creator Pass from the form and downloads it
   as a PNG. Nothing typed or uploaded here leaves the browser: the photo
   is read locally and the image is drawn on the device. */
(function () {
  const form = document.querySelector('[data-cert-form]');
  const cert = document.querySelector('[data-cert]');
  if (!form || !cert) return;

  const stage = document.querySelector('[data-cert-stage]');
  const scaleBox = document.querySelector('[data-cert-scale]');
  const nameIn = form.elements.name;
  const cityIn = form.elements.city;
  const photoIn = form.elements.photo;
  const status = document.querySelector('[data-cert-status]');
  const button = document.querySelector('[data-cert-download]');
  const photo = cert.querySelector('[data-cert-photo]');
  const photoPh = cert.querySelector('[data-cert-photo-ph]');

  const W = 1280, H = 560;

  /* ---------- Fit the 1280 x 560 pass to the screen ---------- */
  function fit() {
    const s = Math.min(1, stage.clientWidth / W);
    scaleBox.style.transform = 'scale(' + s + ')';
    stage.style.height = Math.round(H * s) + 'px';
  }
  window.addEventListener('resize', fit);
  if (window.ResizeObserver) new ResizeObserver(fit).observe(stage);
  fit();

  /* ---------- Date ----------
     The workshop is watched as a recording, so the pass is dated the day
     it is made rather than one fixed session date. */
  const dateEl = cert.querySelector('[data-cert-date]');
  if (dateEl) {
    dateEl.textContent = new Date()
      .toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
      .replace(/Sept/, 'Sep').toUpperCase();
  }

  /* ---------- QR to the landing page ---------- */
  const qrBox = cert.querySelector('[data-cert-qr]');
  if (qrBox && window.qrcode) {
    const qr = qrcode(0, 'M');
    qr.addData('https://storytelling.kkcreate.in/');
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

  const title = (s) => s.trim().replace(/\s+/g, ' ');

  function render() {
    const name = title(nameIn.value) || 'Your Name';
    const city = title(cityIn.value);
    const n = codeFor(name);
    cert.querySelectorAll('[data-cert-name]').forEach((el) => { el.textContent = name; });
    cert.querySelector('[data-cert-route]').textContent = 'FACE → STORY' + (city ? ' · ' + city : '');
    cert.querySelector('[data-cert-quote]').textContent = city
      ? 'From ' + city + ', the next storyteller people will remember.'
      : 'The next storyteller people will remember.';
    cert.querySelector('[data-cert-code]').textContent = 'KKC-26-ST-' + n;
    cert.querySelector('[data-cert-code-short]').textContent = 'ST-' + n;
  }
  nameIn.addEventListener('input', render);
  cityIn.addEventListener('input', render);
  render();

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
    if (!title(nameIn.value)) { nameIn.focus(); status.textContent = 'Add your name first.'; return; }
    if (!window.htmlToImage) { status.textContent = 'Could not load the image tool. Check your connection and try again.'; return; }

    button.disabled = true;
    status.textContent = 'Drawing your certificate…';
    cert.classList.add('is-capturing');
    const prev = scaleBox.style.transform;
    scaleBox.style.transform = 'none';
    try {
      if (document.fonts && document.fonts.ready) await document.fonts.ready;
      // An <img> with no src (the photo slot before a photo is chosen) makes
      // the renderer fail outright, so it is left out of the drawing.
      const url = await htmlToImage.toPng(cert, {
        width: W, height: H, pixelRatio: 2, cacheBust: true,
        filter: (node) => !(node.tagName === 'IMG' && !node.getAttribute('src'))
      });
      const a = document.createElement('a');
      a.href = url;
      a.download = 'KK-Create-Storytelling-101-Certificate-' + title(nameIn.value).replace(/[^A-Za-z0-9]+/g, '-') + '.png';
      document.body.appendChild(a);
      a.click();
      a.remove();
      status.textContent = 'Downloaded. Share it on your profiles!';
    } catch (err) {
      status.textContent = 'Something went wrong while drawing it. Please try again.';
    } finally {
      scaleBox.style.transform = prev;
      cert.classList.remove('is-capturing');
      button.disabled = false;
    }
  });
})();
