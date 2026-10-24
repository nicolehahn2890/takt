/* Takt: neue Abzeichen gross feiern. Vollbild ueber allem mit grosser Plakette, Lichtkranz, kleinem Funkenflug
   und kurzem Klang; mehrere Abzeichen nacheinander ("1 von 3"). Nur der Knopf (oder Escape) schliesst,
   damit ein versehentlicher Tipp die Feier nicht wegwischt. */
window.Takt = window.Takt || {};
(function (T) {
  'use strict';
  var $ = function (id) { return document.getElementById(id); };
  var queue = [], pos = 0, opts = {}, lastFocus = null, overflow = '';
  var SPARKS = 12;
  // Aufsteigender Dreiklang, leiser als die Trainings-Toene
  var CHIME = [{ type: 'beep', tone: 'c1' }, { type: 'beep', tone: 'c2' }, { type: 'beep', tone: 'c3' }];

  function sparks() {
    var h = '';
    for (var i = 0; i < SPARKS; i++) {
      // Winkel gleichmaessig, Weite und Groesse abwechselnd, damit es nicht wie ein Stern aussieht
      h += '<i class="mo-spark' + (i % 2 ? ' alt' : '') + '" style="--a:' + (i * 360 / SPARKS + (i % 3) * 7) + 'deg;--d:' +
        (96 + (i % 3) * 22) + 'px"></i>';
    }
    return h;
  }

  function render() {
    var b = queue[pos], el = $('moment');
    var next = T.badgeNext ? T.badgeNext(b, opts.earned) : null;
    var more = pos < queue.length - 1;
    el.style.setProperty('--bc', b.color);
    // Neu aufbauen, damit die Animationen bei jedem Abzeichen von vorn laufen
    $('mo-in').innerHTML =
      '<p class="mo-kick">' + (queue.length > 1 ? 'Neues Abzeichen \u00b7 ' + (pos + 1) + ' von ' + queue.length : 'Neues Abzeichen') + '</p>' +
      '<div class="mo-medal" aria-hidden="true"><i class="mo-rays"></i><i class="mo-halo"></i><i class="mo-halo"></i>' + sparks() +
      '<div class="mo-disc">' + T.badgeIcon(b) + '</div></div>' +
      '<h2 class="mo-title" id="mo-title">' + T.esc(b.title) + '</h2>' +
      '<p class="mo-rule">' + T.esc(b.rule) + '</p>' +
      (next ? '<p class="mo-next">N\u00e4chstes Ziel: ' + T.esc(next.title) + '</p>' : '') +
      '<button class="mo-btn" id="mo-btn">' + (more ? 'N\u00e4chstes Abzeichen' : 'Weiter') + '</button>';
    $('mo-btn').addEventListener('click', advance);
    try { $('mo-btn').focus({ preventScroll: true }); } catch (e) { $('mo-btn').focus(); }
    if (opts.sound && T.audio) T.audio.play(CHIME);
  }

  function advance() {
    if (pos < queue.length - 1) { pos++; render(); return; }
    close();
  }

  function close() {
    var el = $('moment');
    if (el.hidden) return;
    el.hidden = true;
    $('mo-in').innerHTML = '';
    document.body.style.overflow = overflow;
    queue = [];
    if (lastFocus && document.body.contains(lastFocus) && lastFocus.focus) {
      try { lastFocus.focus({ preventScroll: true }); } catch (e) { /* egal */ }
    }
    lastFocus = null;
    var after = opts.onClose;
    opts = {};
    if (after) after();
  }

  T.celebrate = {
    /* badges: Abzeichen-Objekte; o = { earned: data.badges (fuer "Naechstes Ziel"), sound: true|false, onClose } */
    show: function (badges, o) {
      var list = (badges || []).filter(Boolean);
      if (!list.length || !$('moment')) return;
      var el = $('moment');
      if (!el.hidden) {
        // Laeuft schon eine Feier: neue hinten anhaengen, ohne die jetzige zu unterbrechen
        list.forEach(function (b) { if (queue.indexOf(b) < 0) queue.push(b); });
        $('mo-btn').textContent = 'N\u00e4chstes Abzeichen';
        var kick = $('mo-in').querySelector('.mo-kick');
        if (kick) kick.textContent = 'Neues Abzeichen \u00b7 ' + (pos + 1) + ' von ' + queue.length;
        return;
      }
      queue = list;
      pos = 0;
      opts = o || {};
      lastFocus = document.activeElement;
      overflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      el.hidden = false;
      render();
    },
    open: function () { return !!$('moment') && !$('moment').hidden; },
    close: close
  };

  document.addEventListener('keydown', function (e) {
    if ((e.key === 'Escape' || e.key === 'Esc') && T.celebrate.open()) close();
  });
})(window.Takt);
