/* Google Analytics 4 — the "KK Create New" stream on kkcreate.works@gmail.com,
   the same property the Editing 101 site reports to. The ID lives here and
   nowhere else.

   Injected after window load: gtag.js is ~150 KB and nothing on the page
   needs it to render, so it waits until the paint is done. */
(function () {
  var GA_ID = 'G-3XTGKHTD6S';

  window.dataLayer = window.dataLayer || [];
  window.gtag = function () { window.dataLayer.push(arguments); };
  window.gtag('js', new Date());
  window.gtag('config', GA_ID);

  function inject() {
    var s = document.createElement('script');
    s.async = true;
    s.src = 'https://www.googletagmanager.com/gtag/js?id=' + GA_ID;
    document.head.appendChild(s);
  }

  if (document.readyState === 'complete') setTimeout(inject, 0);
  else window.addEventListener('load', function () { setTimeout(inject, 0); }, { once: true });
})();
