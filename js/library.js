/* Takt: Bibliothek, Uebungs-Detail und eigene Uebungen.
   Bekommt von app.js ein api-Objekt: data(), save(), reindex(), show(name), toast(msg), home(), badges(). */
window.Takt = window.Takt || {};
(function (T) {
  'use strict';
  var $ = function (id) { return document.getElementById(id); };
  var api = null;
  var filter = 'alle';
  var query = '';
  var current = null;
  var editing = null;
  var pendingPhoto = null;
  var selectedTags = [];
  var noteTimer = null;
  var listScroll = 0;       // Scroll-Position der Liste fuer das Zurueck aus dem Detail
  var SAVE_FAIL = 'Speichern hat nicht geklappt. Ist der Speicher voll oder der private Modus an?';

  var CHIPS = [
    ['alle', 'Alle', null], ['core', 'Core', ['core']], ['bauch', 'Bauch', ['bauch']], ['ruecken', 'R\u00fccken', ['ruecken']],
    ['beine-po', 'Beine & Po', ['beine-po']], ['dehnen', 'Dehnen', ['dehnen']], ['yoga', 'Yoga', ['yoga']],
    ['atmung', 'Atmung & Vacuum', ['atmung', 'vacuum']], ['ganz', 'Ganzk\u00f6rper', ['ganzkoerper', 'oberkoerper']], ['eigen', 'Eigene', null]
  ];
  var TAG_LABEL = { vacuum: 'Vacuum', atmung: 'Atmung', core: 'Core', bauch: 'Bauch', ruecken: 'R\u00fccken', 'beine-po': 'Beine & Po',
    dehnen: 'Dehnen', yoga: 'Yoga', ganzkoerper: 'Ganzk\u00f6rper', oberkoerper: 'Oberk\u00f6rper', aufwaermen: 'Aufw\u00e4rmen' };
  var HILF_LABEL = { band: 'Band', stuhl: 'Stuhl', tisch: 'Tisch', sofa: 'Sofa', wand: 'Wand', matte: 'Matte', stab: 'Besenstiel' };

  /* Suche ohne Gross/Klein und ohne Umlaut-Unterschied */
  function norm(s) {
    return String(s || '').toLowerCase()
      .replace(/\u00e4/g, 'a').replace(/\u00f6/g, 'o').replace(/\u00fc/g, 'u').replace(/\u00df/g, 'ss')
      .replace(/[^a-z0-9]+/g, ' ').trim();
  }

  function allExercises() { return (T.EXERCISES || []).concat(api.data().exercisesOwn || []); }
  function byId(id) { return allExercises().filter(function (e) { return e.id === id; })[0] || null; }
  function poseFor(e) {
    if (e.typ === 'atem' && e.atem) return { breath: e.atem };
    return (T.POSES || {})[e.id] || T.POSE_DEFAULT;
  }

  /* Filter und Suche, auch fuer die Uebungs-Auswahl im Editor */
  function matchesWith(e, chipKey, q) {
    if (chipKey === 'eigen' && e.quelle !== 'eigen') return false;
    var chip = CHIPS.filter(function (c) { return c[0] === chipKey; })[0];
    if (chip && chip[2] && !(e.tags || []).some(function (t) { return chip[2].indexOf(t) >= 0; })) return false;
    if (!q) return true;
    var hay = norm([e.name].concat(e.alias || []).join(' '));
    return norm(q).split(' ').every(function (w) { return hay.indexOf(w) >= 0; });
  }
  function matches(e) { return matchesWith(e, filter, query); }

  /* ---------- Liste ---------- */
  function renderChips() {
    $('lib-chips').innerHTML = CHIPS.map(function (c) {
      return '<button class="chip' + (c[0] === filter ? ' on' : '') + '" data-chip="' + c[0] + '">' + T.esc(c[1]) + '</button>';
    }).join('');
  }

  function renderList() {
    var box = $('lib-list');
    var list = allExercises().filter(matches);
    $('lib-count').textContent = list.length === 1 ? '1 \u00dcbung' : list.length + ' \u00dcbungen';
    box.innerHTML = '';
    if (!list.length) { box.innerHTML = '<p class="empty">Keine \u00dcbung gefunden.</p>'; return; }
    var frag = document.createDocumentFragment();
    list.forEach(function (e) {
      var row = document.createElement('button');
      row.className = 'lib-item';
      row.setAttribute('data-ex', e.id);
      var hil = (e.hilfsmittel || []).filter(function (h) { return h !== 'matte'; }).map(function (h) { return HILF_LABEL[h]; }).join(', ');
      var sub = (e.alias || []).join(' \u00b7 ') + (hil ? ' \u00b7 braucht ' + hil : '') + (e.quelle === 'eigen' ? ' \u00b7 eigene' : '');
      row.innerHTML = '<span class="lib-thumb">' + (e.photoId ? '<img alt="">' : '<svg aria-hidden="true"></svg>') + '</span>' +
        '<span class="lib-text"><b>' + T.esc(e.name) + '</b><small>' + T.esc(sub) + '</small></span>';
      frag.appendChild(row);
      var svg = row.querySelector('svg');
      if (svg) T.figure.still(svg, poseFor(e));
      var img = row.querySelector('img');
      if (img) T.photos.load(e.photoId).then(function (u) { if (u) img.src = u; });
    });
    box.appendChild(frag);
  }

  /* keepScroll: beim Zurueck aus dem Detail an dieselbe Stelle der Liste */
  function openLib(keepScroll) {
    stopDetail();
    renderChips();
    renderList();
    api.show('lib');
    window.scrollTo(0, keepScroll === true ? listScroll : 0);
  }

  /* ---------- Detail ---------- */
  function stopDetail() { T.figure.unmount($('ex-svg')); }

  function openEx(id) {
    var e = byId(id);
    if (!e) { openLib(); return; }
    if (!$('screen-lib').hidden) listScroll = window.scrollY;
    current = e;
    $('ex-title').textContent = e.name;
    $('ex-alias').textContent = (e.alias || []).join(' \u00b7 ');
    var badges = (e.tags || []).map(function (t) { return TAG_LABEL[t] || t; });
    if (e.beidseitig) badges.push('beidseitig');
    (e.hilfsmittel || []).forEach(function (h) { badges.push(HILF_LABEL[h]); });
    $('ex-badges').innerHTML = badges.map(function (b) { return '<span class="badge">' + T.esc(b) + '</span>'; }).join('');
    $('ex-desc').textContent = e.beschreibung || '';
    $('ex-hint').textContent = e.hinweis || '';
    $('ex-hint').hidden = !e.hinweis;
    var rh = $('ex-rhythm');
    if (e.typ === 'atem' && e.atem) {
      var a = e.atem, parts = [a.ein + ' s ein'];
      if (a.halten) parts.push(a.halten + ' s halten');
      parts.push(a.aus + ' s aus');
      if (a.haltenLeer) parts.push(a.haltenLeer + ' s halten');
      rh.textContent = 'Rhythmus: ' + parts.join(' \u00b7 ');
      rh.hidden = false;
    } else rh.hidden = true;

    var svg = $('ex-svg'), img = $('ex-photo');
    stopDetail();
    if (e.photoId) {
      svg.style.display = 'none';
      img.hidden = false;
      img.removeAttribute('src');
      T.photos.load(e.photoId).then(function (u) {
        if (u) img.src = u;
        else { img.hidden = true; svg.style.display = ''; T.figure.mount(svg, T.POSE_DEFAULT); }
      });
    } else {
      img.hidden = true;
      svg.style.display = '';
      T.figure.mount(svg, poseFor(e));
    }
    var v = $('ex-video');
    if (e.videoUrl) { v.hidden = false; v.href = e.videoUrl; } else { v.hidden = true; v.removeAttribute('href'); }
    $('ex-note').value = (api.data().notes || {})[e.id] || '';
    $('ex-own').hidden = e.quelle !== 'eigen';
    $('ex-listen').hidden = !T.audio.hasClip('ex_' + e.id);
    api.show('ex');
    window.scrollTo(0, 0);
  }

  function saveNote() {
    clearTimeout(noteTimer);
    noteTimer = setTimeout(function () {
      if (!current) return;
      var d = api.data();
      d.notes = d.notes || {};
      var v = $('ex-note').value.trim();
      if (v) d.notes[current.id] = v; else delete d.notes[current.id];
      if (!api.save()) api.toast(SAVE_FAIL);
    }, 400);
  }

  function listen() {
    if (!current) return;
    var key = 'ex_' + current.id;
    T.audio.unlock();
    T.audio.load([key]).then(function () { T.audio.play([{ type: 'clip', key: key }]); });
  }

  function removeCurrent() {
    if (!current || current.quelle !== 'eigen') return;
    if (!window.confirm('\u00dcbung \u201e' + current.name + '\u201c l\u00f6schen?')) return;
    var d = api.data(), gone = current;
    var beforeList = d.exercisesOwn || [], beforeNote = d.notes ? d.notes[gone.id] : undefined;
    d.exercisesOwn = beforeList.filter(function (x) { return x.id !== gone.id; });
    if (d.notes) delete d.notes[gone.id];
    if (!api.save()) {
      d.exercisesOwn = beforeList;
      if (beforeNote !== undefined) d.notes[gone.id] = beforeNote;
      api.toast(SAVE_FAIL);
      return;
    }
    if (gone.photoId) T.photos.remove(gone.photoId);
    api.reindex();
    current = null;
    openLib();
    api.toast('\u00dcbung gel\u00f6scht.');
  }

  /* ---------- Eigene Uebung ---------- */
  function renderOwnTags() {
    $('own-tags').innerHTML = T.store.OWN_TAGS.map(function (t) {
      return '<button type="button" class="chip' + (selectedTags.indexOf(t) >= 0 ? ' on' : '') + '" data-tag="' + t + '">' + T.esc(TAG_LABEL[t]) + '</button>';
    }).join('');
  }

  function clearErrors() {
    ['name', 'beschreibung', 'tags', 'videoUrl', 'photo'].forEach(function (f) { $('own-err-' + f).textContent = ''; });
  }

  function showPreview(url) {
    var prev = $('own-preview');
    if (url) { prev.src = url; prev.hidden = false; } else { prev.hidden = true; prev.removeAttribute('src'); }
    $('own-photo-remove').hidden = !url;
  }

  function openOwn(ex) {
    stopDetail();
    editing = ex || null;
    pendingPhoto = null;
    $('own-title').textContent = ex ? '\u00dcbung bearbeiten' : 'Eigene \u00dcbung';
    $('own-name').value = ex ? ex.name : '';
    $('own-desc').value = ex ? (ex.beschreibung || '') : '';
    $('own-video').value = ex && ex.videoUrl ? ex.videoUrl : '';
    $('own-bilateral').checked = !!(ex && ex.beidseitig);
    $('own-photo').value = '';
    selectedTags = ex ? (ex.tags || []).slice() : [];
    renderOwnTags();
    clearErrors();
    showPreview(null);
    if (ex && ex.photoId) T.photos.load(ex.photoId).then(function (u) { if (u) showPreview(u); });
    api.show('own');
    window.scrollTo(0, 0);
  }

  function saveOwn() {
    clearErrors();
    var input = {
      id: editing ? editing.id : null,
      name: $('own-name').value,
      beschreibung: $('own-desc').value,
      tags: selectedTags.slice(),
      beidseitig: $('own-bilateral').checked,
      videoUrl: $('own-video').value,
      photoId: editing ? editing.photoId : null
    };
    var r = T.store.validateOwn(input);
    if (!r.ok) {
      r.errors.forEach(function (e) { $('own-err-' + e.field).textContent = e.msg; });
      return;
    }
    var btn = $('own-save');
    btn.disabled = true;
    var oldPhoto = editing ? editing.photoId : null;
    var isNew = !!(pendingPhoto && pendingPhoto !== 'remove');
    var photo;
    if (isNew) photo = T.photos.save(pendingPhoto);
    else if (pendingPhoto === 'remove') photo = Promise.resolve(null);
    else photo = Promise.resolve(oldPhoto);
    photo.then(function (photoId) {
      var ex = r.exercise;
      ex.photoId = photoId || null;
      var d = api.data();
      var before = d.exercisesOwn || [];
      d.exercisesOwn = before.filter(function (x) { return x.id !== ex.id; }).concat([ex]);
      if (!api.save()) {
        // nichts gespeichert: alten Stand behalten, neues Foto wieder entfernen
        d.exercisesOwn = before;
        if (isNew && photoId) T.photos.remove(photoId);
        btn.disabled = false;
        api.toast(SAVE_FAIL);
        return;
      }
      if (oldPhoto && oldPhoto !== photoId) T.photos.remove(oldPhoto);
      api.reindex();
      btn.disabled = false;
      openEx(ex.id);
      var fresh = api.badges ? api.badges() : [];   // neue Abzeichen feiert app.js gross
      if (!fresh.length) api.toast('Gespeichert.');
    }, function (err) {
      btn.disabled = false;
      $('own-err-photo').textContent = (err && err.message) || 'Das Foto konnte nicht gespeichert werden.';
    });
  }

  /* ---------- Verdrahtung ---------- */
  function bind() {
    $('lib-back').addEventListener('click', function () { api.home(); });
    $('lib-add').addEventListener('click', function () { openOwn(null); });
    $('lib-search').addEventListener('input', function () { query = this.value; renderList(); });
    $('lib-chips').addEventListener('click', function (e) {
      var b = e.target.closest('[data-chip]');
      if (!b) return;
      filter = b.getAttribute('data-chip');
      renderChips();
      renderList();
    });
    $('lib-list').addEventListener('click', function (e) {
      var b = e.target.closest('[data-ex]');
      if (b) openEx(b.getAttribute('data-ex'));
    });
    $('ex-back').addEventListener('click', function () { openLib(true); });
    $('ex-listen').addEventListener('click', listen);
    $('ex-note').addEventListener('input', saveNote);
    $('ex-edit').addEventListener('click', function () { if (current) openOwn(current); });
    $('ex-delete').addEventListener('click', removeCurrent);
    $('own-back').addEventListener('click', function () { if (editing) openEx(editing.id); else openLib(); });
    $('own-cancel').addEventListener('click', function () { if (editing) openEx(editing.id); else openLib(); });
    $('own-save').addEventListener('click', saveOwn);
    $('own-tags').addEventListener('click', function (e) {
      var b = e.target.closest('[data-tag]');
      if (!b) return;
      var t = b.getAttribute('data-tag'), i = selectedTags.indexOf(t);
      if (i >= 0) selectedTags.splice(i, 1); else selectedTags.push(t);
      renderOwnTags();
    });
    $('own-photo').addEventListener('change', function () {
      var f = this.files && this.files[0];
      if (!f) return;
      pendingPhoto = f;
      $('own-err-photo').textContent = '';
      showPreview(URL.createObjectURL(f));
    });
    $('own-photo-remove').addEventListener('click', function () { pendingPhoto = 'remove'; showPreview(null); });
  }

  T.library = {
    init: function (a) { api = a; bind(); },
    open: openLib,
    openEx: openEx,
    norm: norm,
    CHIPS: CHIPS,
    matches: matchesWith
  };
})(window.Takt);
