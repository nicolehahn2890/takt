var D_TAGS = ['vacuum', 'atmung', 'core', 'bauch', 'ruecken', 'beine-po', 'dehnen', 'yoga', 'ganzkoerper', 'oberkoerper', 'aufwaermen'];
var D_HILF = ['band', 'stuhl', 'tisch', 'sofa', 'wand', 'matte'];
var D_ICONS = ['core', 'dehnen', 'beine', 'ganz'];
function dSubset(arr, allowed) { return Array.isArray(arr) && arr.every(function (x) { return allowed.indexOf(x) >= 0; }); }

test('data: genau 110 Uebungen mit eindeutigen Ids', function () {
  var ids = Takt.EXERCISES.map(function (e) { return e.id; });
  eq(ids.length, 110);
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
    var times = [];
    for (var i = 0; i < n; i++) { times.push(i * seg * 1000); if (n > 1) times.push((i * seg + hold + move / 2) * 1000); }
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

test('data: Tag yoga hat 15 Uebungen', function () {
  eq(Takt.EXERCISES.filter(function (e) { return e.tags.indexOf('yoga') >= 0; }).length, 15);
});

test('data: jede Uebung hat eine Katja-Ansage', function () {
  var missing = Takt.EXERCISES.filter(function (e) { return !(Takt.VOICE_FILES || {})['ex_' + e.id]; }).map(function (e) { return e.id; });
  eq(missing.length, 0, 'fehlend: ' + missing.slice(0, 5).join(', '));
});
