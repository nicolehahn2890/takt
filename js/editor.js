/* Takt: Workout-Editor und \u00dcbungs-Auswahl.
   Bekommt von app.js ein api-Objekt: data(), save(), exIndex(), find(id), start(workout, opts), show(name), toast(msg), home(). */
window.Takt = window.Takt || {};
(function (T) {
  'use strict';
  var $ = function (id) { return document.getElementById(id); };
  var api = null;
  var ed = null;        // Workout in Bearbeitung (eigene Kopie)
  var dirty = false;
  var isCopy = false;
  var pick = { block: 0, ids: [], chip: 'alle', q: '', scroll: 0 };
  var LIM = { duration: [10, 600], rest: [0, 120], repeat: [1, 10] };
  var NEW = { work: 40, rest: 15 };
  var SAVE_FAIL = 'Speichern hat nicht geklappt. Ist der Speicher voll oder der private Modus an?';

  /* ---------- Helfer ---------- */
  function clamp(v, r) { return Math.max(r[0], Math.min(r[1], v)); }
  function clone(o) { return JSON.parse(JSON.stringify(o)); }
  function entries() { return ed.blocks.reduce(function (n, b) { return n + b.items.length; }, 0); }
  function restOf(it) { return it.rest == null ? ed.defaultRest : it.rest; }
  function exOf(id) { return id ? api.exIndex()[id] : null; }
  function itemName(it) { var e = exOf(it.exId); return (e && e.name) || it.name || '\u00dcbung'; }
  function own() { var d = api.data(); if (!Array.isArray(d.workouts)) d.workouts = []; return d.workouts; }
  function thumb(exId) {
    var e = exOf(exId);
    if (e && e.photoId) return '<img data-photo="' + T.esc(e.photoId) + '" alt="">';
    return '<svg data-fig="' + T.esc(exId || '') + '" aria-hidden="true"></svg>';
  }
  function drawThumbs(root) {
    T.home.drawFigs(root);
    Array.prototype.forEach.call(root.querySelectorAll('img[data-photo]'), function (img) {
      if (img.getAttribute('src')) return;
      T.photos.load(img.getAttribute('data-photo')).then(function (u) { if (u) img.src = u; }, function () {});
    });
  }
  function keepScroll(fn) { var y = window.scrollY; fn(); window.scrollTo(0, y); }

  /* ---------- Oeffnen ---------- */
  function blank() {
    return { id: null, name: '', theme: 'core', defaultWork: NEW.work, defaultRest: NEW.rest, source: 'own',
      blocks: [{ label: '', repeat: 1, items: [] }] };
  }
  function begin(w, asCopy) {
    ed = w;
    if (!Array.isArray(ed.blocks) || !ed.blocks.length) ed.blocks = [{ label: '', repeat: 1, items: [] }];
    if (typeof ed.defaultWork !== 'number') ed.defaultWork = NEW.work;
    if (typeof ed.defaultRest !== 'number') ed.defaultRest = NEW.rest;
    dirty = asCopy;
    isCopy = asCopy;
    $('ed-name').value = ed.name || '';
    showErrors([]);
    render();
    api.show('edit');
    window.scrollTo(0, 0);
  }
  function open(id) {
    var w = id ? own().filter(function (x) { return x.id === id; })[0] : null;
    if (id && !w) {
      var other = api.find(id);
      if (other) return openCopy(other);
    }
    begin(w ? clone(w) : blank(), false);
  }
  function openCopy(w) { begin(T.copyWorkout(w), true); }

  /* ---------- Darstellung ---------- */
  function entryHtml(it, bi, ii) {
    var last = bi === ed.blocks.length - 1 && ii === ed.blocks[bi].items.length - 1;
    var d = ' data-b="' + bi + '" data-i="' + ii + '"';
    return '<div class="ent"><div class="e1"><span class="th">' + thumb(it.exId) + '</span>' +
      '<div class="en"><b>' + T.esc(itemName(it)) + '</b>' + (it.bilateral ? '<small>beidseitig</small>' : '') + '</div>' +
      '<button class="ed-ic" data-act="up"' + d + (bi === 0 && ii === 0 ? ' disabled' : '') + ' aria-label="nach oben">&#8593;</button>' +
      '<button class="ed-ic" data-act="down"' + d + (last ? ' disabled' : '') + ' aria-label="nach unten">&#8595;</button>' +
      '<button class="ed-ic" data-act="del"' + d + ' aria-label="entfernen">&#10005;</button></div>' +
      '<div class="e2"><div class="val"><button data-act="dur-"' + d + ' aria-label="k\u00fcrzer">&minus;</button><span class="sv"><b>' + it.duration +
      ' s</b><small>Dauer</small></span><button data-act="dur+"' + d + ' aria-label="l\u00e4nger">+</button></div>' +
      '<div class="val"><button data-act="rest-"' + d + ' aria-label="Pause k\u00fcrzer">&minus;</button><span class="sv"><b>' + restOf(it) +
      ' s</b><small>Pause danach</small></span><button data-act="rest+"' + d + ' aria-label="Pause l\u00e4nger">+</button></div></div></div>';
  }
  function blockHtml(b, bi) {
    return '<div class="blk"><div class="bh"><b>' + T.esc(b.label || ('Block ' + (bi + 1))) + '</b>' +
      '<div class="rep"><button data-act="rep-" data-b="' + bi + '" aria-label="weniger Runden">&minus;</button><span class="sv"><b>' + b.repeat +
      '&times;</b><small>Runden</small></span><button data-act="rep+" data-b="' + bi + '" aria-label="mehr Runden">+</button></div>' +
      '<button class="ed-ic" data-act="delblock" data-b="' + bi + '" aria-label="Block l\u00f6schen">&#10005;</button></div>' +
      (b.items.length ? b.items.map(function (it, ii) { return entryHtml(it, bi, ii); }).join('') :
        '<p class="note-empty">Noch keine \u00dcbung in diesem Block.</p>') +
      '<button class="add" data-act="add" data-b="' + bi + '">+ \u00dcbung</button></div>';
  }
  function updSum() {
    var n = T.workCount(T.buildSteps(ed, api.exIndex(), {}));
    $('ed-sum').textContent = 'Gesamt ' + T.fmt(T.workoutSeconds(ed, api.exIndex())) + ' Min. \u00b7 ' + (n === 1 ? '1 \u00dcbung' : n + ' \u00dcbungen');
    $('ed-go').disabled = entries() === 0;
  }
  function render() {
    var exists = !!ed.id && own().some(function (w) { return w.id === ed.id; });
    $('ed-title').textContent = exists ? 'Workout bearbeiten' : (isCopy ? 'Kopie bearbeiten' : 'Neues Workout');
    $('ed-themes').innerHTML = T.WORKOUT_THEMES.map(function (k) {
      return '<button class="th-chip' + (ed.theme === k ? ' on' : '') + '" style="--c:' + T.THEMES[k].color + '" data-theme="' + k + '"><i></i>' +
        T.esc(T.THEMES[k].label) + '</button>';
    }).join('');
    $('ed-defw').textContent = ed.defaultWork + ' s';
    $('ed-defr').textContent = ed.defaultRest + ' s';
    $('ed-blocks').innerHTML = ed.blocks.map(blockHtml).join('');
    drawThumbs($('ed-blocks'));
    $('ed-del').hidden = !exists;
    updSum();
  }
  function changed() { dirty = true; keepScroll(render); }
  function showErrors(errors) {
    var nameErr = errors.filter(function (e) { return e.field === 'name'; })[0];
    $('ed-name').classList.toggle('bad', !!nameErr);
    $('ed-err-name').textContent = nameErr ? nameErr.msg : '';
    $('ed-err').textContent = errors.filter(function (e) { return e.field !== 'name'; }).map(function (e) { return e.msg; })
      .filter(function (m, i, a) { return a.indexOf(m) === i; }).join(' ');
  }

  /* ---------- Bearbeiten ---------- */
  function moveItem(bi, ii, d) {
    var items = ed.blocks[bi].items, x = items[ii], j = ii + d;
    if (j >= 0 && j < items.length) { items[ii] = items[j]; items[j] = x; return; }
    var nb = bi + d;
    if (nb < 0 || nb >= ed.blocks.length) return;
    items.splice(ii, 1);
    if (d < 0) ed.blocks[nb].items.push(x); else ed.blocks[nb].items.unshift(x);
  }
  function onBlocks(e) {
    var b = e.target.closest('[data-act]');
    if (!b || b.disabled) return;
    var bi = Number(b.getAttribute('data-b')), ii = Number(b.getAttribute('data-i'));
    var blk = ed.blocks[bi], it = blk && blk.items[ii];
    switch (b.getAttribute('data-act')) {
      case 'rep-': blk.repeat = clamp(blk.repeat - 1, LIM.repeat); break;
      case 'rep+': blk.repeat = clamp(blk.repeat + 1, LIM.repeat); break;
      case 'delblock':
        if (blk.items.length && !window.confirm('Block mit ' + (blk.items.length === 1 ? '1 \u00dcbung' : blk.items.length + ' \u00dcbungen') + ' l\u00f6schen?')) return;
        ed.blocks.splice(bi, 1);
        if (!ed.blocks.length) ed.blocks.push({ label: '', repeat: 1, items: [] });
        break;
      case 'add': openPicker(bi); return;
      case 'del': blk.items.splice(ii, 1); break;
      case 'up': moveItem(bi, ii, -1); break;
      case 'down': moveItem(bi, ii, 1); break;
      case 'dur-': it.duration = clamp(it.duration - 5, LIM.duration); break;
      case 'dur+': it.duration = clamp(it.duration + 5, LIM.duration); break;
      case 'rest-': it.rest = clamp(restOf(it) - 5, LIM.rest); break;
      case 'rest+': it.rest = clamp(restOf(it) + 5, LIM.rest); break;
      default: return;
    }
    changed();
  }
  function onDefaults(e) {
    var b = e.target.closest('[data-def]');
    if (!b) return;
    var k = b.getAttribute('data-def');
    if (k === 'w-') ed.defaultWork = clamp(ed.defaultWork - 5, LIM.duration);
    if (k === 'w+') ed.defaultWork = clamp(ed.defaultWork + 5, LIM.duration);
    if (k === 'r-') ed.defaultRest = clamp(ed.defaultRest - 5, LIM.rest);
    if (k === 'r+') ed.defaultRest = clamp(ed.defaultRest + 5, LIM.rest);
    changed();
  }

  /* ---------- Speichern, Loeschen, Zurueck ---------- */
  function save(andStart) {
    ed.name = $('ed-name').value;
    var res = T.validateWorkout(ed);
    showErrors(res.errors);
    if (!res.ok) {
      if (res.errors[0].field === 'name') $('ed-name').focus();
      else $('ed-err').scrollIntoView({ block: 'center' });
      return;
    }
    var w = res.workout, list = own();
    var i = -1;
    list.forEach(function (x, k) { if (x.id === w.id) i = k; });
    var before = i >= 0 ? list[i] : null;
    if (i >= 0) list[i] = w; else list.unshift(w);
    if (!api.save()) {
      if (i >= 0) list[i] = before; else list.shift();
      api.toast(SAVE_FAIL);
      return;
    }
    dirty = false;
    ed = clone(w);
    api.home();
    if (andStart) api.start(w); else api.toast('Gespeichert');
  }
  function remove() {
    if (!window.confirm('\u201e' + (ed.name || 'Workout') + '\u201c l\u00f6schen?')) return;
    var d = api.data();
    d.workouts = own().filter(function (w) { return w.id !== ed.id; });
    if (d.settings.budgetLast && typeof d.settings.budgetLast === 'object') delete d.settings.budgetLast[ed.id];
    if (!api.save()) { api.toast(SAVE_FAIL); return; }
    dirty = false;
    api.home();
    api.toast('Gel\u00f6scht');
  }
  function back() {
    if (dirty && !window.confirm('\u00c4nderungen verwerfen?')) return;
    dirty = false;
    api.home();
  }

  /* ---------- Uebungs-Auswahl ---------- */
  function allEx() { return (T.EXERCISES || []).concat(api.data().exercisesOwn || []); }
  function openPicker(bi) {
    pick.block = bi;
    pick.ids = [];
    pick.q = '';
    pick.scroll = window.scrollY;
    $('pk-q').value = '';
    renderChips();
    renderPick();
    api.show('pick');
    window.scrollTo(0, 0);
  }
  function renderChips() {
    $('pk-chips').innerHTML = T.library.CHIPS.map(function (c) {
      return '<button class="chip' + (c[0] === pick.chip ? ' on' : '') + '" data-chip="' + c[0] + '">' + T.esc(c[1]) + '</button>';
    }).join('');
  }
  function renderPick() {
    var list = allEx().filter(function (e) { return T.library.matches(e, pick.chip, pick.q); });
    $('pk-count').textContent = list.length === 1 ? '1 \u00dcbung' : list.length + ' \u00dcbungen';
    $('pk-list').innerHTML = list.length ? list.map(function (e) {
      var sub = (e.alias || []).concat(e.beidseitig ? ['beidseitig'] : [], e.quelle === 'eigen' ? ['eigene'] : []).join(' \u00b7 ');
      return '<button class="lib-item pk" data-pick="' + T.esc(e.id) + '"><span class="lib-thumb">' + thumb(e.id) + '</span>' +
        '<span class="lib-text"><b>' + T.esc(e.name) + '</b><small>' + T.esc(sub) + '</small></span><span class="ck"></span></button>';
    }).join('') : '<p class="empty">Keine \u00dcbung gefunden.</p>';
    drawThumbs($('pk-list'));
    updPick();
  }
  function updPick() {
    Array.prototype.forEach.call($('pk-list').querySelectorAll('.pk'), function (b) {
      var n = pick.ids.indexOf(b.getAttribute('data-pick')) + 1;
      b.classList.toggle('on', n > 0);
      b.querySelector('.ck').textContent = n ? String(n) : '';
    });
    var k = pick.ids.length;
    $('pk-add').disabled = !k;
    $('pk-add').textContent = k ? (k === 1 ? '1 \u00dcbung hinzuf\u00fcgen' : k + ' \u00dcbungen hinzuf\u00fcgen') : '\u00dcbungen antippen';
  }
  function backToEditor() { api.show('edit'); window.scrollTo(0, pick.scroll); }
  function addPicked() {
    var idx = api.exIndex(), block = ed.blocks[pick.block] || ed.blocks[ed.blocks.length - 1];
    pick.ids.forEach(function (id) {
      var e = idx[id];
      if (e) block.items.push({ exId: id, name: e.name, duration: ed.defaultWork, rest: null, bilateral: !!e.beidseitig });
    });
    var k = pick.ids.length;
    dirty = true;
    render();
    backToEditor();
    api.toast(k === 1 ? '1 \u00dcbung hinzugef\u00fcgt' : k + ' \u00dcbungen hinzugef\u00fcgt');
  }

  /* ---------- Verdrahtung ---------- */
  function bind() {
    $('ed-blocks').addEventListener('click', onBlocks);
    $('ed-defs').addEventListener('click', onDefaults);
    $('ed-themes').addEventListener('click', function (e) {
      var b = e.target.closest('[data-theme]');
      if (b) { ed.theme = b.getAttribute('data-theme'); changed(); }
    });
    $('ed-name').addEventListener('input', function () {
      ed.name = $('ed-name').value;
      dirty = true;
      $('ed-name').classList.remove('bad');
      $('ed-err-name').textContent = '';
    });
    $('ed-addblock').addEventListener('click', function () { ed.blocks.push({ label: '', repeat: 1, items: [] }); changed(); });
    $('ed-save').addEventListener('click', function () { save(false); });
    $('ed-go').addEventListener('click', function () { save(true); });
    $('ed-del').addEventListener('click', remove);
    $('ed-back').addEventListener('click', back);
    $('pk-back').addEventListener('click', backToEditor);
    $('pk-add').addEventListener('click', addPicked);
    $('pk-list').addEventListener('click', function (e) {
      var b = e.target.closest('[data-pick]');
      if (!b) return;
      var id = b.getAttribute('data-pick'), i = pick.ids.indexOf(id);
      if (i >= 0) pick.ids.splice(i, 1); else pick.ids.push(id);
      updPick();
    });
    $('pk-chips').addEventListener('click', function (e) {
      var b = e.target.closest('[data-chip]');
      if (b) { pick.chip = b.getAttribute('data-chip'); renderChips(); renderPick(); }
    });
    $('pk-q').addEventListener('input', function () { pick.q = $('pk-q').value; renderPick(); });
    $('pk-q').addEventListener('keydown', function (e) { if (e.key === 'Enter') $('pk-q').blur(); });
  }

  T.editor = {
    init: function (a) { api = a; bind(); },
    open: open,
    openCopy: openCopy
  };
})(window.Takt);
