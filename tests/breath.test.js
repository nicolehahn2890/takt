/* Tests fuer js/breath.js: Atem-Uhr und Toene */
function cues(list) { return list.map(function (c) { return c.tone + ' ' + c.atMs; }); }

test('breathCues Rhythmus 4-4-4-4', function () {
  eq(cues(Takt.breathCues({ ein: 4, halten: 4, aus: 4, haltenLeer: 4 }, 0, 20000, 2000)), ['in 2000', 'out 10000', 'in 18000']);
});

test('breathCues ohne Halten', function () {
  eq(cues(Takt.breathCues({ ein: 4, halten: 0, aus: 6, haltenLeer: 0 }, 0, 20000, 2000)), ['in 2000', 'out 6000', 'in 12000', 'out 16000']);
});

test('breathCues vor Start keine und halboffenes Intervall', function () {
  var a = { ein: 4, halten: 4, aus: 4, haltenLeer: 4 };
  eq(Takt.breathCues(a, 0, 1999, 2000), []);
  eq(cues(Takt.breathCues(a, 2000, 10000, 2000)), ['out 10000']);
  eq(cues(Takt.breathCues(a, -1, 2000, 2000)), ['in 2000']);
});

test('breathClock', function () {
  ok(Takt.breathClock(1000, 2000) <= 0, 'vor dem Start');
  eq(Takt.breathClock(5000, 2000), 3000);
});

test('buildSteps traegt Atem-Rhythmus', function () {
  var idx = Takt.indexExercises(Takt.EXERCISES);
  var w = { defaultWork: 30, defaultRest: 0, blocks: [{ repeat: 1, items: [{ exId: 'bauchatmung', duration: 60 }, { exId: 'plank', duration: 30 }] }] };
  var s = Takt.buildSteps(w, idx, {});
  eq([s[0].atem, s[1].atem], [idx.bauchatmung.atem, null]);
});

test('engine Atem-Uebung ohne warn und count', function () {
  var c = { t: 0 };
  var e = Takt.Engine([{ kind: 'work', duration: 30, exId: 'bauchatmung', name: 'B', atem: { ein: 4, halten: 0, aus: 6, haltenLeer: 0 } }],
    { now: function () { return c.t; } });
  e.start();
  var all = [];
  for (var t = 1000; t < 30000; t += 1000) { c.t = t; all = all.concat(e.tick().map(function (x) { return x.type; })); }
  eq(all.filter(function (x) { return x === 'warn' || x === 'count'; }), []);
  c.t = 5000;
});

test('engine view elapsedMs', function () {
  var c = { t: 0 };
  var e = Takt.Engine([{ kind: 'work', duration: 30, exId: 'a', name: 'A' }], { now: function () { return c.t; } });
  e.start(); c.t = 4500;
  eq(e.view().elapsedMs, 4500);
});
