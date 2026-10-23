/* Takt: Statistik-Seite (Woche/Monat/Jahr, Ring als Vergleich zur Vorperiode, Balken, haeufigster Bereich).
   Rechnet mit Takt.periodStats; bekommt von app.js ein api-Objekt: data(), show(name). */
window.Takt = window.Takt || {};
(function (T) {
  'use strict';
  var $ = function (id) { return document.getElementById(id); };
  var api = null;
  var view = { kind: 'week', offset: 0, selected: null };
  var RING_C = 2 * Math.PI * 99;
  var KINDS = [['week', 'Woche'], ['month', 'Monat'], ['year', 'Jahr']];

  function mins(sec) { return Math.round(sec / 60); }
  function axisLabel(kind, b, i) {
    if (kind !== 'month') return b.label;
    return [0, 7, 14, 21, 28].indexOf(i) >= 0 ? b.label : '';
  }

  function render() {
    var s = T.periodStats(api.data().log, view.kind, view.offset, new Date());
    var sel = view.selected != null && view.selected < s.bars.length ? view.selected : s.selected;
    var max = s.bars.reduce(function (m, b) { return Math.max(m, b.seconds); }, 0);
    var bars = s.bars.map(function (b, i) {
      var h = max > 0 && b.seconds > 0 ? Math.max(4, Math.round(b.seconds / max * 100)) : 0;
      var cls = (b.today ? ' today' : '') + (i === sel ? ' sel' : '') + (b.seconds ? '' : ' zero');
      return '<button class="st-b' + cls + '" data-bar="' + i + '" aria-label="' + T.esc(b.title) + '"><i style="height:' + h + '%"></i></button>';
    }).join('');
    var axis = s.bars.map(function (b, i) { return '<span>' + T.esc(axisLabel(view.kind, b, i)) + '</span>'; }).join('');
    var selText = sel >= 0 ? s.bars[sel].title + ' \u00b7 ' + (s.bars[sel].seconds ? mins(s.bars[sel].seconds) + ' Min.' : 'kein Training') : '';
    var top = s.top ? '<div class="st-top"><h4>H\u00e4ufigster Bereich</h4><div class="st-top-row"><i style="background:' + s.top.color + '"></i>' +
      '<b>' + T.esc(s.top.label) + '</b><span>' + s.top.share + ' %</span></div><small>' + mins(s.top.seconds) + ' Min. \u00dcbungszeit</small></div>' : '';

    $('stats-body').innerHTML =
      '<div class="seg st-seg" role="radiogroup">' + KINDS.map(function (k) {
        return '<button data-kind="' + k[0] + '" class="' + (k[0] === view.kind ? 'on' : '') + '">' + k[1] + '</button>';
      }).join('') + '</div>' +
      '<div class="st-period"><button class="st-nav" data-nav="-1" aria-label="Fr\u00fcher">&#8249;</button><b>' + T.esc(s.label) + '</b>' +
      '<button class="st-nav" data-nav="1" aria-label="Sp\u00e4ter"' + (view.offset >= 0 ? ' disabled' : '') + '>&#8250;</button></div>' +
      '<div class="st-ring"><svg viewBox="0 0 220 220" aria-hidden="true"><circle class="track" cx="110" cy="110" r="99"/>' +
      '<circle class="bar" cx="110" cy="110" r="99" style="stroke-dashoffset:' + (RING_C * (1 - s.ring)).toFixed(2) + '"/></svg>' +
      '<div class="st-ring-in"><b>' + mins(s.seconds) + '<span>Min.</span></b><small>' + (s.count === 1 ? '1 Training' : s.count + ' Trainings') + '</small></div></div>' +
      '<p class="st-compare">' + T.esc(s.compare.text) + '</p>' +
      '<div class="st-chart st-' + view.kind + '"><div class="st-bars">' + bars + '</div><div class="st-axis">' + axis + '</div>' +
      '<p class="st-sel">' + T.esc(selText) + '</p></div>' + top;
  }

  function bind() {
    $('stats-body').addEventListener('click', function (e) {
      var b = e.target.closest('[data-kind],[data-nav],[data-bar]');
      if (!b || b.disabled) return;
      if (b.hasAttribute('data-kind')) { view.kind = b.getAttribute('data-kind'); view.offset = 0; view.selected = null; }
      else if (b.hasAttribute('data-nav')) { view.offset = Math.min(0, view.offset + Number(b.getAttribute('data-nav'))); view.selected = null; }
      else view.selected = Number(b.getAttribute('data-bar'));
      render();
    });
  }

  T.statsView = {
    init: function (a) { api = a; bind(); },
    open: function () { view.selected = null; render(); api.show('stats'); }
  };
})(window.Takt);
