/* Takt: Statistik-Seite (Woche/Monat/Jahr, Ring als Vergleich zur Vorperiode, Balken, haeufigster Bereich),
   Abzeichen, Tagebuch und Backup. Rechnet mit Takt.periodStats; bekommt von app.js ein api-Objekt:
   data(), save(), show(name), toast(msg), badges(). */
window.Takt = window.Takt || {};
(function (T) {
  'use strict';
  var $ = function (id) { return document.getElementById(id); };
  var api = null;
  var view = { kind: 'week', offset: 0, selected: null, badge: null };
  var photos = null, photosLoading = null;   // Fotos fuer das Backup, vorab geladen: Teilen braucht einen frischen Tipp
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
      '<p class="st-sel">' + T.esc(selText) + '</p></div>' + top + badgesHtml() + diaryHtml() + backupHtml();
  }

  /* Abzeichen als 4er-Raster mit Fortschritt; Antippen zeigt Name, Bedingung und Datum bzw. Stand */
  function badgesHtml() {
    var got = api.data().badges || {};
    var prog = T.badgeCheck(api.data(), new Date()).progress;
    var all = T.BADGES || [];
    var n = all.filter(function (b) { return got[b.id]; }).length;
    var sel = all.filter(function (b) { return b.id === view.badge; })[0];
    var info = '';
    if (sel) {
      var p = prog[sel.id];
      var state = got[sel.id] ? 'erreicht am ' + T.badgeDate(got[sel.id]) :
        p && p.need > 1 ? T.fmtCount(p.have) + ' von ' + T.fmtCount(p.need) + ' ' + (T.BADGE_UNITS[sel.kind] || '') : 'noch nicht erreicht';
      info = sel.title + ' \u00b7 ' + sel.rule + ' \u00b7 ' + state.trim();
    }
    return '<section class="st-sec"><div class="st-h"><h3>Abzeichen</h3><span>' + n + ' von ' + all.length + '</span></div>' +
      '<div class="bdg-grid">' + all.map(function (b) {
        return T.badgeHtml(b, !!got[b.id], prog[b.id], { tag: 'button', cls: b.id === view.badge ? 'sel' : '' });
      }).join('') + '</div>' +
      '<p class="bdg-info">' + T.esc(info) + '</p></section>';
  }

  /* Tagebuch: die letzten 30 Trainings, neueste oben */
  function diaryHtml() {
    var list = (api.data().log || []).filter(function (e) { return T.entryValid(e); })
      .map(function (e) { return { e: e, t: new Date(e.date).getTime() }; })
      .filter(function (x) { return isFinite(x.t); })
      .sort(function (a, b) { return b.t - a.t; }).slice(0, 30);
    var rows = list.map(function (x) {
      var sec = T.entrySeconds(x.e);
      return '<li><small>' + T.esc(T.dayLabel(new Date(x.t))) + '</small><div class="dy-main"><b>' + T.esc(x.e.name || 'Training') + '</b>' +
        '<span>' + (sec < 60 ? 'unter 1' : mins(sec)) + ' Min.</span></div>' + (x.e.note ? '<p>' + T.esc(x.e.note) + '</p>' : '') + '</li>';
    }).join('');
    return '<section class="st-sec"><div class="st-h"><h3>Tagebuch</h3></div>' +
      (rows ? '<ul class="diary">' + rows + '</ul>' : '<p class="st-empty">Noch keine Trainings.</p>') + '</section>';
  }

  function backupHtml() {
    return '<section class="st-sec"><div class="st-h"><h3>Backup</h3></div>' +
      '<p class="bk-when">' + T.esc(T.backupAgo(api.data().settings.lastBackup, new Date())) + '</p>' +
      '<p class="bk-txt">Sichert Workouts, eigene \u00dcbungen mit Fotos, Tagebuch, Abzeichen und Einstellungen in einer Datei.</p>' +
      '<div class="bk-row"><button class="btn main" data-bk="save"' + (photos ? '>Backup sichern' : ' disabled>Wird vorbereitet \u2026') + '</button>' +
      '<button class="btn" data-bk="load">Backup laden</button></div></section>';
  }

  function preparePhotos() {
    photos = null;
    photosLoading = T.photos && T.photos.all ? T.photos.all().catch(function () { return {}; }) : Promise.resolve({});
    // Erst wenn die Fotos da sind, wird "Backup sichern" aktiv: Teilen muss direkt im Tipp passieren
    photosLoading.then(function (p) { photos = p; if (!$('screen-stats').hidden) render(); });
  }

  /* Nur Fotos, die eine eigene Uebung benutzt */
  function usedPhotos(d, all) {
    var out = {};
    (d.exercisesOwn || []).forEach(function (e) { if (e && e.photoId && all[e.photoId]) out[e.photoId] = all[e.photoId]; });
    return out;
  }

  function saveBackup(all) {
    var d = api.data();
    var b = T.makeBackup(d, usedPhotos(d, all || {}), new Date());
    var file = null;
    try { file = new File([b.text], b.filename, { type: 'application/json' }); } catch (e) { file = null; }
    var canShareFile = false;
    try { canShareFile = !!(file && navigator.share && navigator.canShare && navigator.canShare({ files: [file] })); } catch (e) { canShareFile = false; }
    var standalone = window.navigator.standalone === true || (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches);
    var route = T.backupRoute({ canShareFile: canShareFile, standalone: standalone });
    if (route === 'share') {
      navigator.share({ files: [file] }).then(function () { backupDone('Backup gesichert'); }, function (err) {
        var next = T.backupShareFailed(err && err.name, standalone);
        if (next === 'retry') api.toast('Das Teilen-Men\u00fc hat nicht geklappt. Bitte nochmal auf \u201eBackup sichern\u201c tippen.');
        else if (next === 'download') download(b);
      });
    } else if (route === 'download') download(b);
    else api.toast('Hier kann Takt keine Datei sichern. \u00d6ffne Takt in Safari und sichere dort.');
  }

  function download(b) {
    var url = URL.createObjectURL(new Blob([b.text], { type: 'application/json' }));
    var a = document.createElement('a');
    a.href = url;
    a.download = b.filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 10000);
    backupDone('Backup heruntergeladen');
  }

  function backupDone(msg) {
    api.data().settings.lastBackup = new Date().toISOString();
    api.save();
    if (api.badges) api.badges();   // neue Abzeichen ("Erstes Backup") feiert app.js gross
    render();
    api.toast(msg);
  }

  function plural(n, one, many) { return n + ' ' + (n === 1 ? one : many); }

  function confirmText(r) {
    var rep = r.report;
    var lines = ['Backup vom ' + T.badgeDate(r.data.settings.lastBackup) + ' laden?', '',
      plural(rep.workouts, 'Workout', 'Workouts') + ', ' + plural(rep.exercisesOwn, 'eigene \u00dcbung', 'eigene \u00dcbungen') + ', ' +
      plural(rep.log, 'Training', 'Trainings') + ', ' + plural(rep.photos, 'Foto', 'Fotos') + '.'];
    if (rep.dropped.workouts) lines.push(plural(rep.dropped.workouts, 'ung\u00fcltiges Workout wird', 'ung\u00fcltige Workouts werden') + ' weggelassen.');
    if (rep.dropped.exercisesOwn) lines.push(plural(rep.dropped.exercisesOwn, 'ung\u00fcltige eigene \u00dcbung wird', 'ung\u00fcltige eigene \u00dcbungen werden') + ' weggelassen.');
    lines.push('', 'Deine jetzigen Daten werden dabei ersetzt.');
    return lines.join('\n');
  }

  /* Erst alles pruefen; dann Fotos schreiben, Daten ersetzen, unbenutzte Fotos loeschen, neu laden */
  function loadBackup(file) {
    file.text().then(function (text) {
      var r = T.readBackup(text);
      if (!r.ok) { api.toast(r.error); return; }
      if (!window.confirm(confirmText(r))) return;
      var ids = Object.keys(r.photos);
      var put = !ids.length ? Promise.resolve() : T.photos && T.photos.putDataUrl ?
        Promise.all(ids.map(function (id) { return T.photos.putDataUrl(id, r.photos[id]); })) : Promise.reject(new Error('Fotos'));
      put.then(function () {
        if (!T.store.save(r.data)) throw new Error('Speichern');
        T.store.clearRun();
        var keep = r.data.exercisesOwn.map(function (e) { return e.photoId; }).filter(Boolean);
        return T.photos && T.photos.keepOnly ? T.photos.keepOnly(keep).catch(function () { /* egal */ }) : null;
      }).then(function () { window.location.reload(); }, function () {
        api.toast('Das Backup konnte nicht geladen werden. Deine Daten sind unver\u00e4ndert.');
      });
    }, function () { api.toast('Die Datei konnte nicht gelesen werden.'); });
  }

  function bind() {
    $('bk-file').addEventListener('change', function () {
      var f = this.files && this.files[0];
      this.value = '';
      if (f) loadBackup(f);
    });
    $('stats-body').addEventListener('click', function (e) {
      var b = e.target.closest('[data-kind],[data-nav],[data-bar],[data-badge],[data-bk]');
      if (!b || b.disabled) return;
      if (b.hasAttribute('data-bk')) {
        if (b.getAttribute('data-bk') === 'load') $('bk-file').click();
        else if (photos) saveBackup(photos);
        return;
      }
      if (b.hasAttribute('data-badge')) { var id = b.getAttribute('data-badge'); view.badge = view.badge === id ? null : id; }
      else if (b.hasAttribute('data-kind')) { view.kind = b.getAttribute('data-kind'); view.offset = 0; view.selected = null; }
      else if (b.hasAttribute('data-nav')) { view.offset = Math.min(0, view.offset + Number(b.getAttribute('data-nav'))); view.selected = null; }
      else view.selected = Number(b.getAttribute('data-bar'));
      render();
    });
  }

  T.statsView = {
    init: function (a) { api = a; bind(); },
    open: function () { view.selected = null; view.badge = null; preparePhotos(); render(); api.show('stats'); }
  };
})(window.Takt);
