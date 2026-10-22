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
