test('load mit leerem Speicher liefert Standardwerte', function () {
  eq(Takt.store.load(FakeStorage()), Takt.store.defaults());
});

test('load mit kaputtem JSON liefert Standardwerte', function () {
  var s = FakeStorage();
  s.setItem('takt_v1', '{kaputt');
  eq(Takt.store.load(s), Takt.store.defaults());
});

test('load ergaenzt fehlende Felder und settings', function () {
  var s = FakeStorage();
  s.setItem('takt_v1', JSON.stringify({ settings: { announce: 'beeps' } }));
  var d = Takt.store.load(s);
  eq(d.settings.announce, 'beeps');
  eq(d.settings.defaultRest, 10);
  eq(d.workouts, []);
});

test('save und load behalten Workouts', function () {
  var s = FakeStorage();
  var d = Takt.store.defaults();
  d.workouts.push({ id: 'w1', name: 'Mein Workout' });
  ok(Takt.store.save(d, s), 'save meldet Fehler');
  eq(Takt.store.load(s).workouts, [{ id: 'w1', name: 'Mein Workout' }]);
});

test('laufendes Training speichern und loeschen', function () {
  var s = FakeStorage();
  Takt.store.saveRun({ a: 1 }, s);
  eq(Takt.store.loadRun(s).a, 1);
  Takt.store.clearRun(s);
  eq(Takt.store.loadRun(s), null);
});

test('saveRun stempelt savedAt', function () {
  var s = FakeStorage();
  Takt.store.saveRun({ a: 1 }, s, 5000);
  eq(Takt.store.loadRun(s).savedAt, 5000);
});

test('loadRun verwirft Trainings, die zu alt sind', function () {
  var s = FakeStorage();
  Takt.store.saveRun({ a: 1 }, s, 0);
  eq(Takt.store.loadRun(s, { maxAgeMs: 1800000, now: 1800001 }), null);
  eq(s.getItem('takt_run_v1'), null);
});

test('loadRun behaelt frische Trainings', function () {
  var s = FakeStorage();
  Takt.store.saveRun({ a: 1 }, s, 0);
  eq(Takt.store.loadRun(s, { maxAgeMs: 1800000, now: 1799999 }).a, 1);
});

test('loadRun verwirft Trainings ohne savedAt, wenn ein Alter verlangt ist', function () {
  var s = FakeStorage();
  s.setItem('takt_run_v1', JSON.stringify({ a: 1 }));
  eq(Takt.store.loadRun(s, { maxAgeMs: 1800000, now: 10 }), null);
});

test('load alter Daten ohne notes ergaenzt leeres Objekt', function () {
  var s = FakeStorage();
  s.setItem('takt_v1', JSON.stringify({ settings: {} }));
  eq(Takt.store.load(s).notes, {});
});

test('normalizeUrl ergaenzt https und lehnt Unsinn ab', function () {
  var n = Takt.store.normalizeUrl;
  eq(n('youtu.be/x'), 'https://youtu.be/x');
  eq(n('  https://a.b/c '), 'https://a.b/c');
  eq(n('http://x.de/v?t=30'), 'http://x.de/v?t=30');
  eq(n('javascript:alert(1)'), null);
  eq(n('ftp://x.de'), null);
  eq(n(''), null);
  eq(n('kein link'), null);
  eq(n(null), null);
});

test('validateOwn verlangt einen Namen', function () {
  var r = Takt.store.validateOwn({});
  eq(r.ok, false);
  ok(r.errors.some(function (e) { return e.field === 'name'; }), 'Fehler am Namen');
});

test('validateOwn begrenzt den Namen auf 60 Zeichen', function () {
  eq(Takt.store.validateOwn({ name: new Array(62).join('x') }).ok, false);
});

test('validateOwn lehnt unbekannte Tags und kaputte Links ab', function () {
  var r = Takt.store.validateOwn({ name: 'Test', tags: ['quatsch'], videoUrl: 'javascript:x' });
  eq(r.errors.map(function (e) { return e.field; }).sort(), ['tags', 'videoUrl']);
});

test('validateOwn baut eine eigene Uebung', function () {
  var r = Takt.store.validateOwn({ name: '  Mein Ding ', beschreibung: 'Langsam', tags: ['core'], beidseitig: true, videoUrl: 'youtu.be/x' });
  eq(r.ok, true);
  var e = r.exercise;
  ok(e.id.indexOf('own-') === 0, 'id');
  eq([e.name, e.quelle, e.typ, e.beidseitig, e.videoUrl, e.tags], ['Mein Ding', 'eigen', 'zeit', true, 'https://youtu.be/x', ['core']]);
});

test('validateOwn behaelt die Id beim Bearbeiten', function () {
  eq(Takt.store.validateOwn({ id: 'own-abc', name: 'Neu' }).exercise.id, 'own-abc');
});

test('reset loescht Daten und laufendes Training', function () {
  var s = FakeStorage();
  var d = Takt.store.defaults();
  d.workouts.push({ id: 'w-1', name: 'X' });
  d.badges.first = '2026-10-24T08:00:00.000Z';
  Takt.store.save(d, s);
  Takt.store.saveRun({ v: 1 }, s);
  s.setItem('fremd', 'bleibt');
  eq(Takt.store.reset(s), true);
  eq(s.getItem('takt_v1'), null);
  eq(s.getItem('takt_run_v1'), null);
  eq(s.getItem('fremd'), 'bleibt', 'nur Takt-Keys');
  eq(Takt.store.load(s), Takt.store.defaults());
});
