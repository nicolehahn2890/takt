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
    return (e && e.name) || it.name || '\u00dcbung';
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
      return '<div class="ml-h"><span>' + T.esc(b.label || ('Block ' + (bi + 1))) + '</span>' +
        (b.repeat > 1 ? '<span class="aside">' + b.repeat + ' Runden</span>' : '') + '</div>' +
        b.items.map(function (it) {
          return '<div class="mi"><span class="th">' + (it.exId ? fig(it.exId) : '') + '</span><span class="mn">' + T.esc(itemName(it)) +
            (it.bilateral ? ' <em>beidseitig</em>' : '') + '</span><em>' + it.duration + ' s</em></div>';
        }).join('');
    }).join('');
  }

  /* ---------- Startseite ---------- */
  /* Karte wie WorkoutCard im Design: Titel, Meta mit Themenpunkt, Figuren-Streifen, Start + Anpassen */
  function card(w, title, meta, n, attr) {
    var id = T.esc(w.id);
    return '<article class="wcard" style="--theme:' + theme(w.theme).color + '" ' + attr + '="' + id + '">' +
      '<div><h3>' + T.esc(title) + '</h3><p class="wc-meta"><i></i><span>' + T.esc(meta) + '</span></p></div>' +
      '<div class="strip">' + cardIds(w, n).map(fig).join('') + '</div>' +
      '<div class="wc-btns"><button class="btn-start" data-start="' + id + '">Start</button>' +
      '<button class="b-adj" data-adjust="' + id + '">Anpassen</button></div></article>';
  }
  function ownCard(w) {
    return card(w, w.name, theme(w.theme).label + ' \u00b7 ' + mins(secs(w)) + ' \u00b7 ' + plural(works(w)), 4, 'data-open');
  }
  function tplCard(w) {
    return card(w, w.level === 'lang' ? 'Lang' : 'Kurz', mins(secs(w)), 3, 'data-preview');
  }
  function render() {
    var d = api.data();
    var wk = T.weekStats(d.log);
    $('week').innerHTML = '<b>' + Math.round(wk.seconds / 60) + '<span>Min.</span></b><span>' + (wk.count ?
      'Diese Woche \u00b7 ' + (wk.count === 1 ? '1 Training' : wk.count + ' Trainings') : 'Diese Woche noch kein Training.') + '</span>';
    var canEdit = !!T.editor, canMix = !!(T.home && T.home.mix);
    $('go-new').hidden = !canEdit;
    $('go-mix').hidden = !canMix;
    $('quick').hidden = !canEdit && !canMix;
    var own = d.workouts || [];
    $('my-sec').hidden = !own.length && !canEdit;
    $('my-count').textContent = own.length ? String(own.length) : '';
    $('tpl-count').textContent = String((T.TEMPLATES || []).length);
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
    var full = T.totalSeconds(T.prepareSteps(w, api.exIndex(), { prepSeconds: api.data().settings.prepSeconds }));
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
    var r = $('adj-range'), span = Number(r.max) - Number(r.min);
    r.style.setProperty('--pct', (span > 0 ? (Number(r.value) - Number(r.min)) / span * 100 : 100) + '%');
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

  /* ---------- Mix ---------- */
  var mix = { themes: ['core'], minutes: 15, w: null };
  var MIX_ORDER = ['core', 'vacuum', 'bauch', 'beine', 'ruecken', 'dehnen', 'yoga', 'ganz'];
  var MIX_MINUTES = [5, 10, 15, 20, 30];
  function openMix() {
    var last = api.data().settings.mixLast;
    if (last && Array.isArray(last.themes)) {
      var th = last.themes.filter(function (k) { return MIX_ORDER.indexOf(k) >= 0; });
      if (th.length) mix.themes = th;
      if (MIX_MINUTES.indexOf(last.minutes) >= 0) mix.minutes = last.minutes;
    }
    mix.w = null;
    renderMix();
    openSheet('mix');
  }
  function renderMix() {
    $('mx-chips').innerHTML = MIX_ORDER.map(function (k) {
      return '<button class="chip' + (mix.themes.indexOf(k) >= 0 ? ' on' : '') + '" data-mix="' + k + '">' + T.esc(T.MIX_LABELS[k]) + '</button>';
    }).join('');
    Array.prototype.forEach.call($('mx-seg').children, function (b) { b.classList.toggle('on', Number(b.getAttribute('data-min')) === mix.minutes); });
    $('mx-go').disabled = !mix.themes.length;
    $('mx-go').hidden = !!mix.w;
    $('mx-res').hidden = !mix.w;
    if (!mix.w) return;
    $('mx-name').textContent = mix.w.name;
    $('mx-sum').textContent = T.fmt(secs(mix.w)) + ' Min.';
    $('mx-list').innerHTML = blocksHtml(mix.w);
    drawFigs($('mx-list'));
  }
  function doMix() {
    mix.w = T.makeMix({ themes: mix.themes, minutes: mix.minutes, seed: Math.floor(Math.random() * 2147483647) }, T.EXERCISES);
    api.data().settings.mixLast = { themes: mix.themes.slice(), minutes: mix.minutes };
    api.save();
    renderMix();
  }
  function saveMix() {
    var res = T.validateWorkout(T.copyWorkout(mix.w));
    if (!res.ok) { api.toast(res.errors[0].msg); return; }
    var d = api.data();
    if (!Array.isArray(d.workouts)) d.workouts = [];
    d.workouts.unshift(res.workout);
    if (!api.save()) {
      d.workouts.shift();
      api.toast('Speichern hat nicht geklappt. Ist der Speicher voll oder der private Modus an?');
      return;
    }
    closeSheets();
    render();
    api.toast('Unter \u201eMeine Workouts\u201c gespeichert. Antippen zum \u00c4ndern.');
  }

  /* ---------- Verdrahtung ---------- */
  function bind() {
    $('mx-chips').addEventListener('click', function (e) {
      var b = e.target.closest('[data-mix]');
      if (!b) return;
      var k = b.getAttribute('data-mix'), i = mix.themes.indexOf(k);
      if (i >= 0) mix.themes.splice(i, 1); else mix.themes.push(k);
      mix.w = null;
      renderMix();
    });
    $('mx-seg').addEventListener('click', function (e) {
      var b = e.target.closest('[data-min]');
      if (b) { mix.minutes = Number(b.getAttribute('data-min')); mix.w = null; renderMix(); }
    });
    $('mx-go').addEventListener('click', doMix);
    $('mx-again').addEventListener('click', doMix);
    $('mx-save').addEventListener('click', saveMix);
    $('mx-start').addEventListener('click', function () { var w = mix.w; closeSheets(); api.start(w); });
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
    mix: openMix,
    openSheet: openSheet,
    closeSheets: closeSheets,
    blocksHtml: blocksHtml,
    drawFigs: drawFigs,
    poseFor: poseFor
  };
})(window.Takt);
