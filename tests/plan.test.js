/* Fester Test-Ablauf (frueher die Vorlage 'Test: Core kurz'), auch von announce.test.js genutzt.
   Bewusst nicht aus data/templates.js, damit Aenderungen an Vorlagen die Tests nicht brechen. */
function testWorkout() {
  function it(id, d, rest) { return { exId: id, name: null, duration: d, rest: rest === undefined ? null : rest, bilateral: false }; }
  return { id: 'test-core', name: 'Test: Core kurz', theme: 'core', defaultWork: 30, defaultRest: 10, source: 'own', blocks: [
    { repeat: 1, items: [it('hampelmann', 30)] },
    { repeat: 2, items: [it('plank', 30), it('glute-bridge', 30), it('dead-bug', 30)] },
    { repeat: 1, items: [it('kindhaltung', 40, 0)] }] };
}
function exIdx() { return Takt.indexExercises(Takt.EXERCISES); }
function kinds(steps) { return steps.map(function (s) { return s.kind; }); }

test('Test-Workout ohne prep: 8 Uebungen, 7 Pausen, 320 s', function () {
  var s = Takt.buildSteps(testWorkout(), exIdx(), { prepSeconds: 0 });
  eq(s.filter(function (x) { return x.kind === 'work'; }).length, 8);
  eq(s.filter(function (x) { return x.kind === 'rest'; }).length, 7);
  eq(Takt.totalSeconds(s), 320);
  eq(Takt.workCount(s), 8);
});

test('Test-Workout mit prep 5 beginnt mit Vorbereitung', function () {
  var s = Takt.buildSteps(testWorkout(), exIdx(), { prepSeconds: 5 });
  eq({ kind: s[0].kind, duration: s[0].duration, exId: s[0].exId }, { kind: 'prep', duration: 5, exId: 'hampelmann' });
  eq(Takt.totalSeconds(s), 325);
});

test('keine Pause nach der letzten Uebung', function () {
  var s = Takt.buildSteps(testWorkout(), exIdx(), { prepSeconds: 0 });
  var last = s[s.length - 1];
  eq({ kind: last.kind, exId: last.exId, duration: last.duration }, { kind: 'work', exId: 'kindhaltung', duration: 40 });
});

test('Runden werden wiederholt und gezaehlt', function () {
  var s = Takt.buildSteps(testWorkout(), exIdx(), {});
  var p = s.filter(function (x) { return x.exId === 'plank' && x.kind === 'work'; });
  eq(p.map(function (x) { return [x.round, x.rounds]; }), [[1, 2], [2, 2]]);
});

test('Namen kommen aus der Bibliothek', function () {
  var s = Takt.buildSteps(testWorkout(), exIdx(), {});
  eq(s[0].name, 'Hampelmann');
  eq(s[1].name, 'Pause');
});

test('rest 0 erzeugt keine Pause', function () {
  var w = { defaultWork: 30, defaultRest: 10, blocks: [{ repeat: 1, items: [
    { exId: null, name: 'A', duration: 20, rest: 0 }, { exId: null, name: 'B', duration: 20, rest: null }] }] };
  eq(kinds(Takt.buildSteps(w, {}, {})), ['work', 'work']);
});

test('rest null nimmt die Standard-Pause', function () {
  var w = { defaultWork: 30, defaultRest: 12, blocks: [{ repeat: 1, items: [
    { exId: null, name: 'A', duration: null, rest: null }, { exId: null, name: 'B', duration: 20, rest: null }] }] };
  var s = Takt.buildSteps(w, {}, {});
  eq(s.map(function (x) { return x.duration; }), [30, 12, 20]);
});

test('repeat 0 wird 1 und repeat 99 wird 10', function () {
  function count(rep) {
    var w = { defaultWork: 30, defaultRest: 0, blocks: [{ repeat: rep, items: [{ exId: null, name: 'A', duration: 20 }] }] };
    return Takt.workCount(Takt.buildSteps(w, {}, {}));
  }
  eq(count(0), 1);
  eq(count(99), 10);
});

test('leerer Block wird uebersprungen', function () {
  var w = { defaultWork: 30, defaultRest: 10, blocks: [{ repeat: 3, items: [] }, { repeat: 1, items: [{ exId: null, name: 'A', duration: 20 }] }] };
  eq(kinds(Takt.buildSteps(w, {}, { prepSeconds: 0 })), ['work']);
});

test('eigener Name ohne exId bleibt erhalten', function () {
  var w = { defaultWork: 30, defaultRest: 10, blocks: [{ repeat: 1, items: [{ exId: null, name: 'Mein Ding', duration: 20 }] }] };
  var s = Takt.buildSteps(w, {}, {});
  eq({ name: s[0].name, exId: s[0].exId }, { name: 'Mein Ding', exId: null });
});

test('unbekannte Uebung ohne Namen heisst Uebung', function () {
  var w = { defaultWork: 30, defaultRest: 10, blocks: [{ repeat: 1, items: [{ exId: 'gibtsnicht', name: null, duration: 20 }] }] };
  eq(Takt.buildSteps(w, {}, {})[0].name, 'Übung');
});

test('workIndex zaehlt nur Uebungen', function () {
  var s = Takt.buildSteps(testWorkout(), exIdx(), { prepSeconds: 5 });
  eq(s.slice(0, 4).map(function (x) { return x.workIndex; }), [null, 0, null, 1]);
});

test('exerciseFor liefert die Uebung oder einen sicheren Ersatz', function () {
  var idx = Takt.indexExercises(Takt.EXERCISES);
  eq(Takt.exerciseFor('plank', idx, 'x').name, 'Plank');
  var e = Takt.exerciseFor('own-geloescht', idx, 'Alter Name');
  eq([e.id, e.name, e.typ, e.beidseitig, e.tags], ['own-geloescht', 'Alter Name', 'zeit', false, []]);
});

test('Bibliotheksname schlaegt gespeicherten Namen (nach Umbenennen)', function () {
  var w = { defaultWork: 30, defaultRest: 10, blocks: [{ repeat: 1, items: [
    { exId: 'plank', name: 'Alter Plank-Name', duration: 20 }, { exId: 'own-weg', name: 'Geloeschte', duration: 20 }] }] };
  var s = Takt.buildSteps(w, exIdx(), { prepSeconds: 5 });
  eq([s[0].name, s[1].name, s[3].name], ['Plank', 'Plank', 'Geloeschte']);
});

test('buildSteps bilateral aus Bibliothek', function () {
  var w = { defaultWork: 30, defaultRest: 0, blocks: [{ repeat: 1, items: [
    { exId: 'seitstuetz', duration: 20 }, { exId: 'plank', duration: 20 }, { exId: 'seitstuetz', duration: 20, bilateral: false }] }] };
  eq(Takt.buildSteps(w, exIdx(), {}).map(function (s) { return s.bilateral; }), [true, false, false]);
});
