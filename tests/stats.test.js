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

/* ---------- Zeitraeume und Statistik ---------- */
function D(y, m, d, h, mi) { return new Date(y, m - 1, d, h || 0, mi || 0); }
function E(date, sec, area) { var e = { date: date.toISOString(), actualSec: sec + 30, activeSec: sec }; if (area) e.areaSec = area; return e; }
function ymdh(d) { return [d.getFullYear(), d.getMonth() + 1, d.getDate(), d.getHours()]; }

test('periodRange Woche Mo bis So', function () {
  var r = Takt.periodRange('week', 0, D(2026, 10, 22, 12));
  eq([ymdh(r.start), ymdh(r.end)], [[2026, 10, 19, 0], [2026, 10, 26, 0]]);
  var p = Takt.periodRange('week', -1, D(2026, 10, 19, 0, 5));
  eq([ymdh(p.start), ymdh(p.end)], [[2026, 10, 12, 0], [2026, 10, 19, 0]]);
});

test('periodRange Sommerzeit-Ende', function () {
  var log = [E(D(2026, 10, 25, 23, 30), 600), E(D(2026, 10, 26, 0, 30), 300)];
  var now = D(2026, 10, 26, 12);
  eq([Takt.periodStats(log, 'week', -1, now).seconds, Takt.periodStats(log, 'week', 0, now).seconds], [600, 300]);
  var r = Takt.periodRange('week', -1, now);
  eq([ymdh(r.start), ymdh(r.end)], [[2026, 10, 19, 0], [2026, 10, 26, 0]]);
});

test('periodRange Monat und Jahr mit offset', function () {
  var now = D(2026, 1, 15, 9);
  var m = Takt.periodRange('month', -1, now), y = Takt.periodRange('year', -1, now);
  eq([ymdh(m.start), ymdh(m.end), ymdh(y.start), ymdh(y.end)], [[2025, 12, 1, 0], [2026, 1, 1, 0], [2025, 1, 1, 0], [2026, 1, 1, 0]]);
});

test('periodStats Balken', function () {
  var log = [E(D(2026, 10, 19, 8), 600), E(D(2026, 10, 19, 19), 300), E(D(2026, 10, 22, 8), 1200), E(D(2026, 3, 3, 8), 900)];
  var now = D(2026, 10, 22, 20);
  var w = Takt.periodStats(log, 'week', 0, now), m = Takt.periodStats(log, 'month', 0, now), y = Takt.periodStats(log, 'year', 0, now);
  eq([w.bars.length, m.bars.length, y.bars.length], [7, 31, 12]);
  eq(w.bars.map(function (b) { return b.seconds; }), [900, 0, 0, 1200, 0, 0, 0]);
  eq(w.bars.map(function (b) { return b.label; }), ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So']);
  eq([w.seconds, w.count, m.seconds, y.seconds, y.bars[2].seconds, y.bars[9].seconds], [2100, 3, 2100, 3000, 900, 2100]);
  eq([w.bars[3].today, w.selected, w.label, m.label, y.label], [true, 3, 'Diese Woche', 'Oktober 2026', '2026']);
  eq([w.bars[3].title, y.bars[9].title], ['Do, 22. Okt.', 'Oktober 2026']);
});

test('periodStats Vergleich gleiche Spanne', function () {
  var log = [E(D(2026, 10, 19, 8), 600), E(D(2026, 10, 20, 8), 600),
    E(D(2026, 10, 12, 8), 540), E(D(2026, 10, 13, 8), 540), E(D(2026, 10, 14, 8), 3000)];
  var s = Takt.periodStats(log, 'week', 0, D(2026, 10, 20, 18));
  eq([s.compare.prevSeconds, s.compare.pct, s.compare.state, s.compare.text], [1080, 11, 'up', '+11 % zur Vorwoche (bis Dienstag)']);
  ok(Math.abs(s.ring - 1) < 1e-9, 'Ring voll bei mehr als Vorperiode');
  var m = Takt.periodStats([E(D(2026, 10, 3, 8), 1000), E(D(2026, 9, 2, 8), 2000), E(D(2026, 9, 25, 8), 5000)], 'month', 0, D(2026, 10, 21, 9));
  eq([m.compare.prevSeconds, m.compare.text], [2000, '−50 % zum Vormonat (bis zum 21.)']);
  ok(Math.abs(m.ring - 0.5) < 1e-9, 'Ring halb');
  var y = Takt.periodStats([E(D(2026, 3, 1, 8), 1300), E(D(2025, 2, 1, 8), 1000), E(D(2025, 11, 1, 8), 9000)], 'year', 0, D(2026, 10, 23, 9));
  eq(y.compare.text, '+30 % zum Vorjahr (bis 23. Okt.)');
});

test('periodStats Vormonat kuerzer', function () {
  var log = [E(D(2026, 3, 30, 8), 600), E(D(2026, 2, 28, 20), 600), E(D(2026, 2, 1, 8), 600)];
  var s = Takt.periodStats(log, 'month', 0, D(2026, 3, 31, 12));
  eq([s.compare.prevSeconds, s.compare.state, s.compare.text], [1200, 'down', '−50 % zum Vormonat (bis zum 31.)']);
  var leap = Takt.periodStats([E(D(2028, 2, 29, 8), 600), E(D(2027, 2, 28, 8), 600), E(D(2027, 3, 1, 8), 600)], 'year', 0, D(2028, 2, 29, 12));
  eq(leap.compare.prevSeconds, 600);
});

test('periodStats vergangen ganz gegen ganz', function () {
  var log = [E(D(2026, 10, 13, 8), 600), E(D(2026, 10, 17, 8), 600), E(D(2026, 10, 6, 8), 600)];
  var s = Takt.periodStats(log, 'week', -1, D(2026, 10, 20, 9));
  eq([s.current, s.label, s.compare.prevSeconds, s.compare.text, s.selected], [false, 'Letzte Woche', 600, '+100 % zur Vorwoche', 5]);
  var older = Takt.periodStats(log, 'week', -2, D(2026, 10, 20, 9));
  eq([older.label, older.compare.text], ['5.–11. Okt.', 'Vorwoche ohne Training']);
  eq(Takt.periodStats([], 'week', -2, D(2026, 11, 10, 9)).label, '26. Okt.–1. Nov.');
});

test('periodStats leer und alt', function () {
  var now = D(2026, 10, 22, 12);
  var s = Takt.periodStats([], 'week', 0, now);
  eq([s.seconds, s.count, s.compare.state, s.compare.text, s.ring, s.top, s.selected], [0, 0, 'empty', 'Noch kein Training', 0, null, 3]);
  eq(Takt.periodStats([], 'week', -1, now).compare.text, 'Kein Training');
  var bad = [null, {}, { date: 'kaputt', actualSec: 100 }, { date: D(2026, 10, 20, 8).toISOString(), actualSec: 'x' }, { date: D(2026, 10, 20, 9).toISOString(), actualSec: 600 }];
  var b = Takt.periodStats(bad, 'week', 0, now);
  eq([b.seconds, b.count, b.top, b.compare.state, b.compare.text, b.ring], [600, 1, null, 'noprev', 'Vorwoche ohne Training', 1]);
  var same = Takt.periodStats([E(D(2026, 10, 19, 8), 1000), E(D(2026, 10, 12, 8), 990)], 'week', 0, now);
  eq([same.compare.state, same.compare.text], ['same', 'gleich viel wie in der Vorwoche']);
});

test('periodStats Bereich Anteil', function () {
  var now = D(2026, 10, 22, 12);
  var log = [E(D(2026, 10, 20, 8), 700, { core: 300, bauch: 100 }), E(D(2026, 10, 21, 8), 900, { bauch: 200, sonst: 500 }), E(D(2026, 10, 21, 9), 400)];
  var top = Takt.periodStats(log, 'week', 0, now).top;
  eq([top.key, top.label, top.color, top.share, top.seconds], ['core', 'Core & Vacuum', '#C6C5A6', 27, 300]);
  var only = Takt.periodStats([E(D(2026, 10, 20, 8), 700, { sonst: 500 })], 'week', 0, now).top;
  eq([only.key, only.share], ['sonst', 100]);
});

/* ---------- Schritt 4: Fertig-Screen ---------- */
test('adjustSummary netto', function () {
  var idx = Takt.indexExercises(Takt.EXERCISES);
  var adj = [{ exId: 'plank', delta: 15 }, { exId: 'crunch', delta: -15 }, { exId: 'plank', delta: 15 },
    { exId: 'dead-bug', delta: 15 }, { exId: 'dead-bug', delta: -15 }, { exId: 'own-weg', delta: 15 }];
  eq(Takt.adjustSummary(adj, idx), ['Plank 2× verlängert', 'Crunch 1× gekürzt', 'Übung 1× verlängert']);
  eq(Takt.adjustSummary(null, idx), []);
});
