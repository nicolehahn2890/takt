function testWorkout() { return Takt.TEMPLATES.filter(function (w) { return w.id === 'test-core'; })[0]; }
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
