var D_TAGS = ['vacuum', 'atmung', 'core', 'bauch', 'ruecken', 'beine-po', 'dehnen', 'yoga', 'ganzkoerper', 'oberkoerper', 'aufwaermen'];
var D_HILF = ['band', 'stuhl', 'tisch', 'sofa', 'wand', 'matte'];
var D_ICONS = ['core', 'dehnen', 'beine', 'ganz'];
function dSubset(arr, allowed) { return Array.isArray(arr) && arr.every(function (x) { return allowed.indexOf(x) >= 0; }); }

test('data: genau 145 Uebungen mit eindeutigen Ids', function () {
  var ids = Takt.EXERCISES.map(function (e) { return e.id; });
  eq(ids.length, 145);
  var dup = ids.filter(function (id, i) { return ids.indexOf(id) !== i; });
  eq(dup, []);
  var bad = ids.filter(function (id) { return !/^[a-z0-9-]+$/.test(id); });
  eq(bad, []);
});

test('data: Ids des Test-Workouts bleiben', function () {
  var ids = Takt.EXERCISES.map(function (e) { return e.id; });
  ['hampelmann', 'plank', 'glute-bridge', 'dead-bug', 'kindhaltung'].forEach(function (id) { ok(ids.indexOf(id) >= 0, id + ' fehlt'); });
});

test('data: Pflichtfelder und erlaubte Werte', function () {
  var errors = [];
  Takt.EXERCISES.forEach(function (e) {
    function bad(msg) { errors.push(e.id + ': ' + msg); }
    if (typeof e.name !== 'string' || e.name.length < 2 || e.name.length > 60) bad('name');
    if (!Array.isArray(e.alias)) bad('alias');
    if (typeof e.beschreibung !== 'string' || e.beschreibung.length < 40 || e.beschreibung.length > 320) bad('beschreibung ' + (e.beschreibung || '').length);
    if (typeof e.hinweis !== 'string' || e.hinweis.length < 5) bad('hinweis');
    if (!Array.isArray(e.tags) || !e.tags.length || !dSubset(e.tags, D_TAGS)) bad('tags');
    if (!dSubset(e.hilfsmittel, D_HILF)) bad('hilfsmittel');
    if (typeof e.beidseitig !== 'boolean') bad('beidseitig');
    if (e.typ !== 'zeit' && e.typ !== 'atem') bad('typ');
    if (e.bild !== null) bad('bild');
    if (D_ICONS.indexOf(e.icon) < 0) bad('icon');
    if (e.quelle !== 'takt') bad('quelle');
  });
  eq(errors, []);
});

test('data: Atem-Uebungen haben einen Rhythmus, Zeit-Uebungen nicht', function () {
  var errors = [];
  Takt.EXERCISES.forEach(function (e) {
    if (e.typ === 'atem') {
      var a = e.atem || {};
      if (![a.ein, a.halten, a.aus, a.haltenLeer].every(function (v) { return typeof v === 'number' && v >= 0; }) || a.ein + a.aus <= 0) errors.push(e.id);
    } else if (e.atem !== null) errors.push(e.id + ' (zeit mit atem)');
  });
  eq(errors, []);
});

test('data: Haltungen fuer jede Zeit-Uebung, keine fuer Atem-Uebungen', function () {
  var errors = [];
  Takt.EXERCISES.forEach(function (e) {
    var p = Takt.POSES[e.id];
    if (e.typ === 'zeit' && !(p && p.frames && p.frames.length)) errors.push(e.id + ' ohne Haltung');
    if (e.typ === 'atem' && p) errors.push(e.id + ' mit Haltung');
  });
  Object.keys(Takt.POSES).forEach(function (id) {
    if (!Takt.EXERCISES.some(function (e) { return e.id === id; })) errors.push(id + ' ohne Uebung');
  });
  eq(errors, []);
});

test('data: jede Haltung bleibt im Bild und ueber dem Boden', function () {
  var errors = [];
  Object.keys(Takt.POSES).forEach(function (id) {
    var p = Takt.POSES[id], n = p.frames.length;
    var hold = p.hold != null ? p.hold : 0.6, move = p.move != null ? p.move : 0.9, seg = hold + move;
    // ganzer Zyklus im 50-ms-Raster, damit auch Zwischenstellungen geprueft werden
    var times = [], cycle = n > 1 ? seg * n * 1000 : 4000;
    for (var t0 = 0; t0 <= cycle; t0 += 50) times.push(t0);
    times.forEach(function (t) {
      var f = Takt.figure.frameAt(p, t);
      var b = Takt.figure.bounds(f, p.scale || Takt.figure.DEFAULT_SCALE);
      var s = Takt.figure.svg(f, p.scale || Takt.figure.DEFAULT_SCALE, p.props);
      if (s.indexOf('NaN') >= 0) errors.push(id + ' NaN bei ' + t);
      if (b.minX < 12 || b.maxX > 228 || b.minY < 18 || b.maxY > 170) {
        errors.push(id + ' bei ' + Math.round(t) + ' ms: x ' + Math.round(b.minX) + '..' + Math.round(b.maxX) + ', y ' + Math.round(b.minY) + '..' + Math.round(b.maxY));
      }
    });
  });
  eq(errors, []);
});

test('data: Tag yoga hat 19 Uebungen', function () {
  eq(Takt.EXERCISES.filter(function (e) { return e.tags.indexOf('yoga') >= 0; }).length, 19);
});

test('data: jede Uebung hat eine Katja-Ansage', function () {
  var missing = Takt.EXERCISES.filter(function (e) { return !(Takt.VOICE_FILES || {})['ex_' + e.id]; }).map(function (e) { return e.id; });
  eq(missing.length, 0, 'fehlend: ' + missing.slice(0, 5).join(', '));
});

test('data: Vacuum mit Fersentippen ersetzt Bauchnabel nach innen', function () {
  var ids = Takt.EXERCISES.map(function (e) { return e.id; });
  ok(ids.indexOf('transversus') < 0, 'transversus noch da');
  var e = Takt.EXERCISES.filter(function (x) { return x.id === 'vacuum-fersentippen'; })[0];
  ok(e && e.tags.indexOf('vacuum') >= 0, 'neue Uebung fehlt');
  eq(Takt.POSES['vacuum-fersentippen'].frames.length > 1, true);
});

test('data: jede Vacuum-Uebung zeigt einen Pfeil zum Bauch', function () {
  var missing = Takt.EXERCISES.filter(function (e) { return e.tags.indexOf('vacuum') >= 0 && e.typ === 'zeit'; })
    .filter(function (e) { return !((Takt.POSES[e.id] || {}).props || []).some(function (p) { return p.type === 'pfeil'; }); })
    .map(function (e) { return e.id; });
  eq(missing, []);
});

test('data: die 35 neuen Uebungen vom 2026-10-23 sind da', function () {
  var neu = ['vacuum-vorgebeugt', 'vacuum-kniend', 'vacuum-schneidersitz', 'vacuum-kindhaltung', 'vacuum-unterarmstuetz', 'vacuum-baerenstand',
    'vacuum-glute-bridge', 'vacuum-beckenkippen', 'vacuum-marschieren', 'vacuum-arme-oben', 'vacuum-gehen', 'hypopressive-atmung',
    'plank-knie', 'plank-beinheben', 'reverse-plank', 'knee-tucks', 'tabletop-crunch', 'seitstuetz-knie',
    'glute-bridge-marsch', 'standwaage', 'abduktion-stehend', 'kickback-stehend', 'innenschenkel', 'squat-pulses',
    'knie-zur-brust', 'vorbeuge-stehend', 'waden-dehnung', 'schulter-dehnung', 'brust-dehnung', 'faden-einfaedeln',
    'krieger-3', 'boot', 'sphinx', 'schattenboxen', 'seilspringen'];
  var ids = Takt.EXERCISES.map(function (e) { return e.id; });
  eq(neu.filter(function (id) { return ids.indexOf(id) < 0; }), []);
  eq(Takt.EXERCISES.filter(function (e) { return e.id === 'hypopressive-atmung'; })[0].typ, 'atem');
});

test('data: Eisschnelllaeufer ist entfernt und Krieger heissen ohne Zahlen', function () {
  eq(Takt.EXERCISES.filter(function (e) { return e.id === 'skater'; }).length, 0);
  eq(Takt.POSES.skater, undefined);
  eq(Takt.EXERCISES.filter(function (e) { return /I{1,3}$/.test(e.name); }).map(function (e) { return e.name; }), []);
});

/* ---------- Vorlagen ---------- */
var D_THEMES = ['core', 'bauch', 'dehnen', 'yoga', 'beine', 'ruecken'];

test('data: 12 Vorlagen', function () {
  var ids = Takt.TEMPLATES.map(function (w) { return w.id; });
  eq(ids.length, 12);
  eq(ids.filter(function (id, i) { return ids.indexOf(id) !== i; }), []);
  ok(ids.indexOf('test-core') < 0, 'Test-Workout noch da');
  var idx = Takt.indexExercises(Takt.EXERCISES);
  Takt.TEMPLATES.forEach(function (w) {
    ok(D_THEMES.indexOf(w.theme) >= 0, w.id + ' Thema ' + w.theme);
    ok(w.level === 'kurz' || w.level === 'lang', w.id + ' level');
    eq(w.source, 'template', w.id);
    w.blocks.forEach(function (b) {
      ok(b.items.length > 0, w.id + ' leerer Block');
      b.items.forEach(function (i) { ok(idx[i.exId], w.id + ': unbekannte Uebung ' + i.exId); });
    });
    var v = Takt.validateWorkout(w);
    ok(v.ok, w.id + ' ungueltig: ' + JSON.stringify(v.errors));
  });
  D_THEMES.forEach(function (th) {
    eq(Takt.TEMPLATES.filter(function (w) { return w.theme === th; }).map(function (w) { return w.level; }).sort(), ['kurz', 'lang'], th);
  });
});

test('data: Vorlagen-Dauer', function () {
  var idx = Takt.indexExercises(Takt.EXERCISES);
  Takt.TEMPLATES.forEach(function (w) {
    var min = Takt.workoutSeconds(w, idx) / 60;
    var range = w.level === 'kurz' ? [8, 12] : [17, 23];
    ok(min >= range[0] && min <= range[1], w.id + ': ' + min.toFixed(1) + ' Min.');
  });
});

test('data: Vorlage beidseitig passt zur Bibliothek', function () {
  var idx = Takt.indexExercises(Takt.EXERCISES);
  Takt.TEMPLATES.forEach(function (w) {
    w.blocks.forEach(function (b) { b.items.forEach(function (i) { eq(i.bilateral, !!idx[i.exId].beidseitig, w.id + ' ' + i.exId); }); });
  });
});

test('data: Stomach-Uebungen spricht Katja als Bauch-Vakuum', function () {
  var st = Takt.EXERCISES.filter(function (e) { return /^Stomach Vacuum/.test(e.name); });
  eq(st.length, 15);
  st.forEach(function (e) { eq(e.ansage, e.name.replace('Stomach Vacuum', 'Bauch-Vakuum'), e.id); });
  eq(Takt.EXERCISES.filter(function (e) { return e.id === 'plank'; })[0].ansage, undefined);
});
