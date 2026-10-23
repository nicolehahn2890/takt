/* Tests fuer js/stats.js: Koerperbereiche, Trainingszeit, Zeitraeume */
function sIdx() { return Takt.indexExercises(Takt.EXERCISES); }

test('AREAS Reihenfolge und Farben', function () {
  eq(Takt.AREAS.map(function (a) { return a.key; }), ['core', 'bauch', 'beine', 'ruecken', 'dehnen', 'yoga', 'atmung', 'ganz']);
  eq(Takt.AREAS.map(function (a) { return a.color.toUpperCase(); }),
    ['#C6C5A6', '#BE7B9D', '#C4A882', '#8AB4C4', '#A8C4A0', '#B794C5', '#E2A9C4', '#E3A3BF']);
});

test('areaOf erster Tag der Uebung', function () {
  var idx = sIdx();
  var got = {};
  ['plank', 'crunch', 'glute-bridge', 'katze-kuh', 'vacuum-stehend', 'hampelmann', 'schulterkreisen', 'bauchatmung']
    .forEach(function (id) { got[id] = Takt.areaOf(idx[id]); });
  eq(got, { plank: 'core', crunch: 'bauch', 'glute-bridge': 'beine', 'katze-kuh': 'dehnen', 'vacuum-stehend': 'core',
    hampelmann: 'ganz', schulterkreisen: 'dehnen', bauchatmung: 'atmung' });
  eq(Takt.areaOf({ tags: [] }), 'sonst');
  eq(Takt.areaOf({ tags: ['aufwaermen'] }), 'ganz');
  eq(Takt.areaOf(null), 'sonst');
});

test('areaSeconds nur Uebungen', function () {
  var steps = [
    { kind: 'prep', duration: 5, exId: 'plank' },
    { kind: 'work', duration: 30, exId: 'plank' },
    { kind: 'rest', duration: 10, exId: null },
    { kind: 'work', duration: 40, exId: 'dead-bug' },
    { kind: 'work', duration: 20, exId: 'crunch' },
    { kind: 'work', duration: 20, exId: 'own-weg' }
  ];
  eq(Takt.areaSeconds(steps, [5, 30, 10, 35, 0, 12], sIdx()), { core: 65, sonst: 12 });
  eq(Takt.areaSeconds([], [], sIdx()), {});
});

test('entrySeconds alt und neu', function () {
  eq([Takt.entrySeconds({ activeSec: 100, actualSec: 130 }), Takt.entrySeconds({ actualSec: 130 }),
    Takt.entrySeconds({ activeSec: 'x', actualSec: 50 }), Takt.entrySeconds({}), Takt.entrySeconds(null)], [100, 130, 50, 0, 0]);
});

test('weekStats nutzt activeSec', function () {
  var log = [
    { date: new Date(2026, 9, 20, 8, 0).toISOString(), actualSec: 900, activeSec: 600 },
    { date: new Date(2026, 9, 21, 8, 0).toISOString(), actualSec: 300 }
  ];
  eq(Takt.weekStats(log, new Date(2026, 9, 22, 12, 0)), { seconds: 900, count: 2 });
});
