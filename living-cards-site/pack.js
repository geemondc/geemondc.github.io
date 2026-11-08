/* Living Cards — Pack Gate (sender side only).
   A pack code is the buyer's wallet: no accounts, no passwords.
   Looking and previewing are always free. One finished card = one credit,
   ticked exactly once, at the moment the sender first shares that card.
   Receiving a card NEVER needs a code — this file loads only on shop pages. */
(function () {
  var API = (window.PACK_API || '').replace(/\/+$/, '');
  function live() { return !!API; }
  function store(k, v) {
    try {
      if (v === undefined) return localStorage.getItem(k);
      if (v === null) localStorage.removeItem(k); else localStorage.setItem(k, v);
    } catch (e) { return null; }
    return null;
  }
  function getCode() { return store('lc_pack_code') || ''; }
  function setCode(c) { store('lc_pack_code', c ? String(c).toUpperCase() : null); }
  function call(path, opts) {
    if (!live()) return Promise.reject({ error: 'pack_offline' });
    return fetch(API + path, opts).then(function (r) {
      return r.json().catch(function () { return {}; }).then(function (j) {
        if (!r.ok) { var e = new Error(j.message || j.error || ('http_' + r.status)); e.body = j; e.status = r.status; throw e; }
        return j;
      });
    });
  }
  function balance(code) {
    return call('/api/balance?code=' + encodeURIComponent(code || getCode()));
  }
  /* tick: one card, one credit, once. If the network fails mid-share we queue
     the tick and retry on the next visit — a buyer is never blocked by a
     hiccup, and the queue makes the count right as soon as we're back. */
  function tick(code, cardId, scene) {
    return call('/api/tick', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: code || getCode(), card_id: cardId, scene: scene || null }),
    }).catch(function (e) {
      if (e && e.body && e.body.error === 'pack_finished') throw e;
      var q = [];
      try { q = JSON.parse(store('lc_pack_pending') || '[]'); } catch (err) {}
      if (!q.some(function (x) { return x.card_id === cardId; })) {
        q.push({ code: code || getCode(), card_id: cardId, scene: scene || null });
        store('lc_pack_pending', JSON.stringify(q));
      }
      return { queued: true };
    });
  }
  function flushPending() {
    if (!live()) return;
    var q = [];
    try { q = JSON.parse(store('lc_pack_pending') || '[]'); } catch (e) {}
    if (!q.length) return;
    store('lc_pack_pending', '[]');
    q.forEach(function (x) { tick(x.code, x.card_id, x.scene); });
  }
  function newCardId() {
    return 'card-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 9);
  }
  window.PackGate = { live: live, getCode: getCode, setCode: setCode, balance: balance, tick: tick, flushPending: flushPending, newCardId: newCardId };
  if (document.readyState !== 'loading') flushPending();
  else document.addEventListener('DOMContentLoaded', flushPending);
})();
