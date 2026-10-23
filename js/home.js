/* Takt: Startseite (Wochen-Minuten, Meine Workouts, Vorlagen nach Thema), Vorlagen-Ansicht und Anpassen-Fenster.
   Bekommt von app.js ein api-Objekt: data(), save(), exIndex(), find(id), start(workout, opts), show(name), toast(msg). */
window.Takt = window.Takt || {};
(function (T) {
  'use strict';
  var $ = function (id) { return document.getElementById(id); };
  var api = null;
  var preview = null;   // gezeigte Vorlage
  var adj = null;       // { w, max, lvl }
  var NOTE = { leicht: '\u00dcbungen k\u00fcrzer, Pausen l\u00e4nger', normal: 'wie geplant', hart: '\u00dcbungen l\u00e4nger, Pausen k\u00fcrzer' };

  /* ---------- Helfer ---------- */
  function theme(k) { return T.THEMES[k] || T.THEMES.core; }
  function secs(w) { return T.workoutSeconds(w, api.exIndex()); }
  function works(w) { return T.workCount(T.buildSteps(w, api.exIndex(), {})); }
  function mins(sec) { return Math.max(1, Math.round(sec / 60)) + ' Min.'; }
  function plural(n) { return n === 1 ? '1 \u00dcbung' : n + ' \u00dcbungen'; }
  function itemName(it) {
    var e = it.exId ? api.exIndex()[it.exId] : null;
    return it.name || (e && e.name) || '\u00dcbung';
  }
  function poseFor(exId) {
    var e = api.exIndex()[exId];
    if (e && e.typ === 'atem' && e.atem) return { breath: e.atem };
    return (T.POSES || {})[exId] || T.POSE_DEFAULT;
  }
  function fig(exId) { return '<svg data-fig="' + T.esc(exId) + '" aria-hidden="true"></svg>'; }
  function drawFigs(root) {
    Array.prototype.forEach.call(root.querySelectorAll('svg[data-fig]'), function (s) {
      if (!s.firstChild) T.figure.still(s, poseFor(s.getAttribute('data-fig')));
    });
  }
  /* Bilder fuer Karten: aus dem Block mit den meisten Runden */
  function cardIds(w, n) {
    var out = [];
    (w.blocks || []).filter(function (b) { return (b.items || []).length; }).slice()
      .sort(function (a, b) { return (b.repeat || 1) - (a.repeat || 1); })
      .forEach(function (b) { b.items.forEach(function (i) { if (out.length < n && i.exId && out.indexOf(i.exId) < 0) out.push(i.exId); }); });
    return out;
  }
  function blocksHtml(w) {
    return (w.blocks || []).filter(function (b) { return (b.items || []).length; }).map(function (b, bi) {
      return '<div class="ml-h">' + T.esc(b.label || ('Block ' + (bi + 1))) + (b.repeat > 1 ? ' \u00b7 ' + b.repeat + ' Runden' : '') + '</div>' +
        b.items.map(function (it) {
          return '<div class="mi"><span class="th">' + (it.exId ? fig(it.exId) : '') + '</span><span class="mn">' + T.esc(itemName(it)) +
            (it.bilateral ? ' <em>beidseitig</em>' : '') + '</span><em>' + it.duration + ' s</em></div>';
        }).join('');
    }).join('');
  }

  /* ---------- Startseite ---------- */
  function ownCard(w) {
    var id = T.esc(w.id);
    return '<article class="card wcard" style="--theme:' + theme(w.theme).color + '" data-open="' + id + '">' +
      '<div class="card-main"><h3>' + T.esc(w.name) + '</h3><p>' + mins(secs(w)) + ' \u00b7 ' + plural(works(w)) + '</p>' +
      '<div class="figs">' + cardIds(w, 4).map(fig).join('') + '</div></div>' +
      '<div class="wc-btns"><button class="btn-start" data-start="' + id + '">Start</button>' +
      '<button class="b-adj" data-adjust="' + id + '">Anpassen</button></div></article>';
  }
  function tplCard(w) {
    var id = T.esc(w.id);
    return '<article class="tcard" data-preview="' + id + '"><div class="tt"><b>' + (w.level === 'lang' ? 'Lang' : 'Kurz') +
      '</b><span>' + mins(secs(w)) + '</span></div><div class="figs">' + cardIds(w, 3).map(fig).join('') + '</div>' +
      '<div class="tc-btns"><button class="btn-start" data-start="' + id + '">Start</button>' +
      '<button class="b-adj" data-adjust="' + id + '">Anpassen</button></div></article>';
  }
  function render() {
    var d = api.data();
    var wk = T.weekStats(d.log);
    $('week').innerHTML = wk.count ?
      '<span>Diese Woche</span><b>' + Math.round(wk.seconds / 60) + ' Min.</b><span>\u00b7 ' + (wk.count === 1 ? '1 Training' : wk.count + ' Trainings') + '</span>' :
      '<span>Diese Woche noch kein Training.</span>';
    var canEdit = !!T.editor, canMix = !!(T.home && T.home.mix);
    $('go-new').hidden = !canEdit;
    $('go-mix').hidden = !canMix;
    $('quick').hidden = !canEdit && !canMix;
    var own = d.workouts || [];
    $('my-sec').hidden = !own.length && !canEdit;
    $('my-list').innerHTML = own.length ? own.map(ownCard).join('') :
      '<p class="note-empty">Noch keine eigenen Workouts. Tippe auf \u201e+ Neu\u201c' + (canMix ? ' oder speichere einen Mix' : '') + '.</p>';
    $('tpl-list').innerHTML = T.WORKOUT_THEMES.map(function (k) {
      var list = (T.TEMPLATES || []).filter(function (w) { return w.theme === k; });
      if (!list.length) return '';
      return '<div class="tg" style="--theme:' + theme(k).color + '"><h4><i></i>' + T.esc(theme(k).label) + '</h4><div class="tg-row">' +
        list.map(tplCard).join('') + '</div></div>';
    }).join('');
    drawFigs($('screen-start'));
  }

  /* ---------- Vorlagen-Ansicht ---------- */
  function openPreview(id) {
    preview = api.find(id);
    if (!preview) return;
    $('screen-tpl').style.setProperty('--theme', theme(preview.theme).color);
    $('tpl-name').textContent = preview.name;
    $('tpl-meta').textContent = T.fmt(secs(preview)) + ' Min. \u00b7 ' + plural(works(preview));
    $('tpl-start').setAttribute('data-start', preview.id);
    $('tpl-blocks').innerHTML = blocksHtml(preview);
    $('tpl-foot').hidden = $('tpl-hint').hidden = !T.editor;
    drawFigs($('tpl-blocks'));
    api.show('tpl');
    window.scrollTo(0, 0);
  }

  /* ---------- Anpassen ---------- */
  function budgetLast() {
    var s = api.data().settings;
    if (!s.budgetLast || typeof s.budgetLast !== 'object' || Array.isArray(s.budgetLast)) s.budgetLast = {};
    return s.budgetLast;
  }
  function openSheet(name) { $('sh-' + name).hidden = false; document.body.style.overflow = 'hidden'; }
  function closeSheets() {
    Array.prototype.forEach.call(document.querySelectorAll('.sheet-wrap'), function (s) { s.hidden = true; });
    document.body.style.overflow = '';
  }
  function openAdjust(w) {
    if (!w) return;
    var full = secs(w);
    var last = budgetLast()[w.id] || {};
    var max = Math.max(5, Math.ceil(full / 60));
    adj = { w: w, max: max, lvl: Object.prototype.hasOwnProperty.call(T.INTENSITY, last.intensity) ? last.intensity : 'normal' };
    var r = $('adj-range');
    r.min = 5;
    r.max = max;
    r.value = (typeof last.minutes === 'number' && last.minutes >= 5 && last.minutes < max) ? last.minutes : max;
    $('adj-name').textContent = w.name;
    $('adj-full').textContent = 'Geplant: ' + T.fmt(full) + ' Min.';
    updAdjust();
    openSheet('adj');
  }
  function adjOpts() {
    var m = Number($('adj-range').value);
    return { intensity: adj.lvl, budgetSec: m < adj.max ? m * 60 : null };
  }
  function updAdjust() {
    var o = adjOpts();
    $('adj-min').textContent = o.budgetSec ? (o.budgetSec / 60) + ' Min.' : 'Volle L\u00e4nge';
    Array.prototype.forEach.call($('adj-seg').children, function (b) { b.classList.toggle('on', b.getAttribute('data-lvl') === adj.lvl); });
    $('adj-note').textContent = NOTE[adj.lvl];
    var steps = T.prepareSteps(adj.w, api.exIndex(), { prepSeconds: api.data().settings.prepSeconds, intensity: o.intensity, budgetSec: o.budgetSec });
    $('adj-new').textContent = T.fmt(T.totalSeconds(steps)) + ' Min.';
  }
  function startAdjusted() {
    var o = adjOpts();
    budgetLast()[adj.w.id] = { minutes: o.budgetSec ? o.budgetSec / 60 : null, intensity: o.intensity };
    api.save();
    closeSheets();
    api.start(adj.w, o);
  }

  /* ---------- Verdrahtung ---------- */
  function bind() {
    $('screen-start').addEventListener('click', function (e) {
      var b = e.target.closest('[data-start],[data-adjust],[data-open],[data-preview],#go-new,#go-mix');
      if (!b || b.hasAttribute('data-start')) return;
      if (b.id === 'go-new') return T.editor.open(null);
      if (b.id === 'go-mix') return T.home.mix();
      if (b.hasAttribute('data-adjust')) return openAdjust(api.find(b.getAttribute('data-adjust')));
      if (b.hasAttribute('data-open')) return T.editor ? T.editor.open(b.getAttribute('data-open')) : openPreview(b.getAttribute('data-open'));
      if (b.hasAttribute('data-preview')) return openPreview(b.getAttribute('data-preview'));
    });
    $('tpl-back').addEventListener('click', function () { render(); api.show('start'); });
    $('tpl-adj').addEventListener('click', function () { openAdjust(preview); });
    $('tpl-copy').addEventListener('click', function () { if (T.editor && preview) T.editor.openCopy(preview); });
    Array.prototype.forEach.call(document.querySelectorAll('.sheet-wrap'), function (s) {
      s.addEventListener('click', function (e) { if (e.target === s || e.target.closest('[data-close]')) closeSheets(); });
    });
    $('adj-range').addEventListener('input', updAdjust);
    $('adj-seg').addEventListener('click', function (e) {
      var b = e.target.closest('[data-lvl]');
      if (b) { adj.lvl = b.getAttribute('data-lvl'); updAdjust(); }
    });
    $('adj-go').addEventListener('click', startAdjusted);
  }

  T.home = {
    init: function (a) { api = a; bind(); },
    render: render,
    openPreview: openPreview,
    openAdjust: openAdjust,
    openSheet: openSheet,
    closeSheets: closeSheets,
    blocksHtml: blocksHtml,
    drawFigs: drawFigs,
    poseFor: poseFor
  };
})(window.Takt);
