/* What this buyer has paid for so far in the Storytelling 101 funnel.

   TagMango sends each checkout back to a fixed URL, so every paid step
   names itself on the way in and the pages after it read the running
   list from localStorage:

     workshop checkout   ->  /bundle                 (starts a new order)
     bundle checkout     ->  /stoto?got=bundle
     playbook checkout   ->  /tykhazana              (<body data-got="kit">)
     30-day challenge    ->  /tystory?got=challenge
     content idea engine ->  /tystory?got=ideas

   On the page, [data-if-got="x"] shows only once x is bought and
   [data-if-not="x"] hides once it is. Unreadable storage (private mode)
   still honours whatever this page's own URL says. */
const ORDER = (function () {
  const KEY = 'st-order';
  const TTL = 3 * 24 * 3600000;
  const KNOWN = ['bundle', 'kit', 'challenge', 'ideas', 'breakdown'];
  const body = document.body.dataset;

  let got = {};
  if (!('orderStart' in body)) {
    try {
      const saved = JSON.parse(localStorage.getItem(KEY) || 'null');
      if (saved && saved.at > Date.now() - TTL) got = saved.got || {};
    } catch (e) { /* private mode */ }
  }

  const fromUrl = new URLSearchParams(window.location.search).get('got') || '';
  (fromUrl + ',' + (body.got || '')).split(',').forEach((k) => {
    k = k.trim();
    if (KNOWN.indexOf(k) !== -1) got[k] = true;
  });

  try { localStorage.setItem(KEY, JSON.stringify({ got: got, at: Date.now() })); } catch (e) { /* private mode */ }

  const has = (k) => !!got[k];
  document.querySelectorAll('[data-if-got]').forEach((el) => { el.hidden = !has(el.dataset.ifGot); });
  document.querySelectorAll('[data-if-not]').forEach((el) => { if (has(el.dataset.ifNot)) el.hidden = true; });

  return { has: has };
})();
