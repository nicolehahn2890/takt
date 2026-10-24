/* Tests fuer js/badges.js und data/badges.js: Abzeichen */
var BN = 0;
function be(y, m, d, h, extra) {
  var e = { id: 'b' + (BN++), workoutId: 'w-x', name: 'x', date: new Date(y, m, d, h == null ? 10 : h, 0).toISOString(),
    plannedSec: 600, actualSec: 600, activeSec: 600, theme: 'core' };
  Object.keys(extra || {}).forEach(function (k) { e[k] = extra[k]; });
  return e;
}
function bd(log, extra) {
  var d = { log: log, workouts: [], badges: {} };
  Object.keys(extra || {}).forEach(function (k) { d[k] = extra[k]; });
  return d;
}
var BNOW = new Date(2026, 10, 30, 12, 0);

test('badges Liste', function () {
  eq(Takt.BADGES.length, 11);
  var ids = {};
  Takt.BADGES.forEach(function (b) {
    ok(b.id && b.title && b.rule && b.face && b.color && b.kind, 'Felder bei ' + b.id);
    ok(!ids[b.id], 'doppelte Id ' + b.id); ids[b.id] = 1;
  });
  eq(Takt.badgeDate(new Date(2026, 9, 24, 10).toISOString()), '24. Okt. 2026');
});

test('badges erstes Training', function () {
  eq(Takt.badgeCheck(bd([]), BNOW), { earned: {}, fresh: [] });
  var e = be(2026, 9, 20, 10);
  var r = Takt.badgeCheck(bd([e]), BNOW);
  eq(r.earned.first, e.date);
  eq(r.fresh, ['first']);
});

test('badges Serie 3 und 7 ueber Monatsgrenze', function () {
  var log = [be(2026, 9, 29), be(2026, 9, 30), be(2026, 9, 30, 18), be(2026, 9, 31), be(2026, 10, 1), be(2026, 10, 2), be(2026, 10, 3), be(2026, 10, 4)];
  var r = Takt.badgeCheck(bd(log), BNOW);
  eq(r.earned.streak3, log[3].date);
  eq(r.earned.streak7, log[7].date);
  var gap = Takt.badgeCheck(bd([be(2026, 9, 29), be(2026, 9, 30), be(2026, 10, 1)]), BNOW);
  eq([gap.earned.streak3, gap.earned.streak7], [undefined, undefined]);
  var unsorted = Takt.badgeCheck(bd([be(2026, 9, 31), be(2026, 9, 29), be(2026, 9, 30)]), BNOW);
  ok(unsorted.earned.streak3, 'Reihenfolge im Protokoll egal');
});

test('badges 10 Trainings und 100 Minuten', function () {
  var log = [];
  for (var i = 0; i < 10; i++) log.push(be(2026, 0, 1 + i * 2, 10, { activeSec: 700 }));
  var r = Takt.badgeCheck(bd(log), BNOW);
  eq(r.earned.min100, log[8].date);
  eq(r.earned.ten, log[9].date);
  r = Takt.badgeCheck(bd(log.slice(0, 9)), BNOW);
  eq(r.earned.ten, undefined);
});

test('badges frueh und nacht', function () {
  var early = be(2026, 9, 1, 7, {}); early.date = new Date(2026, 9, 1, 7, 59).toISOString();
  var r = Takt.badgeCheck(bd([early]), BNOW);
  ok(r.earned.early && !r.earned.night, '7:59 ist frueh');
  r = Takt.badgeCheck(bd([be(2026, 9, 1, 8)]), BNOW);
  ok(!r.earned.early, '8:00 nicht mehr frueh');
  var late = be(2026, 9, 1, 20); late.date = new Date(2026, 9, 1, 20, 59).toISOString();
  r = Takt.badgeCheck(bd([late]), BNOW);
  ok(!r.earned.night, '20:59 noch keine Nachteule');
  r = Takt.badgeCheck(bd([be(2026, 9, 1, 21)]), BNOW);
  ok(r.earned.night, '21:00 Nachteule');
});

test('badges alle 6 Themen', function () {
  var log = ['core', 'bauch', 'dehnen', 'yoga', 'beine'].map(function (t, i) { return be(2026, 9, 1 + i * 3, 10, { theme: t }); });
  eq(Takt.badgeCheck(bd(log), BNOW).earned.themes, undefined);
  log.push(be(2026, 9, 20, 10, { theme: 'ruecken' }));
  eq(Takt.badgeCheck(bd(log), BNOW).earned.themes, log[5].date);
  var alt = log.slice(1);
  var e = be(2026, 9, 25); delete e.theme; e.workoutId = Takt.TEMPLATES[0].id;   // altes Protokoll: Thema aus der Vorlage
  alt.push(e);
  eq(Takt.badgeCheck(bd(alt), BNOW).earned.themes, e.date);
});

test('badges eigenes Workout und bleibt nach Loeschen', function () {
  var w = { id: 'w-a', name: 'A', source: 'own', createdAt: '2026-10-02T09:00:00.000Z', blocks: [] };
  var r = Takt.badgeCheck(bd([], { workouts: [w] }), BNOW);
  eq([r.earned.own, r.fresh], ['2026-10-02T09:00:00.000Z', ['own']]);
  var mix = { id: 'w-m', name: 'M', source: 'own', origin: 'mix', createdAt: '2026-10-02T09:00:00.000Z', blocks: [] };
  eq(Takt.badgeCheck(bd([], { workouts: [mix] }), BNOW).earned.own, undefined, 'gespeicherter Mix zaehlt nicht');
  var noDate = { id: 'w-b', name: 'B', source: 'own', blocks: [] };
  eq(Takt.badgeCheck(bd([], { workouts: [noDate] }), BNOW).earned.own, BNOW.toISOString());
  r = Takt.badgeCheck(bd([], { workouts: [], badges: { own: '2026-10-02T09:00:00.000Z' } }), BNOW);
  eq([r.earned.own, r.fresh], ['2026-10-02T09:00:00.000Z', []]);
});

test('badges Mix-Meisterin mit origin', function () {
  var log = [be(2026, 9, 1, 10, { source: 'mix' }), be(2026, 9, 3, 10, { source: 'mix' }), be(2026, 9, 5, 10, { source: 'mix' }),
    be(2026, 9, 7, 10, { source: 'own', origin: 'mix' })];
  eq(Takt.badgeCheck(bd(log), BNOW).earned.mix5, undefined);
  log.push(be(2026, 9, 9, 10, { workoutId: 'mix-42' }));   // altes Protokoll: ungespeicherter Mix
  eq(Takt.badgeCheck(bd(log), BNOW).earned.mix5, log[4].date);
  log.splice(4, 1, be(2026, 9, 9, 10, { source: 'template' }));
  eq(Takt.badgeCheck(bd(log), BNOW).earned.mix5, undefined);
});

test('badges Atemprofi', function () {
  var log = [be(2026, 9, 1, 10, { breathCount: 4 }), be(2026, 9, 3, 10, { breathCount: 4 }), be(2026, 9, 5, 10, { breathCount: 2 })];
  eq(Takt.badgeCheck(bd(log), BNOW).earned.breath10, log[2].date);
  log[2].breathCount = 1;
  eq(Takt.badgeCheck(bd(log), BNOW).earned.breath10, undefined);
});

test('badges fresh nur neue', function () {
  var log = [be(2026, 9, 29), be(2026, 9, 30), be(2026, 9, 31)];
  var r = Takt.badgeCheck(bd(log, { badges: { first: '2026-01-01T10:00:00.000Z' } }), BNOW);
  eq(r.fresh, ['streak3']);
  eq(r.earned.first, '2026-01-01T10:00:00.000Z', 'altes Datum bleibt');
});

test('badges altes Protokoll ohne neue Felder', function () {
  var log = [{ id: 'o1', workoutId: 'w-x', name: 'x', date: new Date(2026, 5, 1, 10).toISOString(), plannedSec: 600, actualSec: 590 },
    { id: 'o2', workoutId: 'w-x', name: 'x', date: 'kaputt', plannedSec: 600, actualSec: 590 },
    { id: 'o3', workoutId: 'w-x', name: 'x', date: new Date(2026, 5, 2, 10).toISOString() },
    null];
  var r = Takt.badgeCheck({ log: log }, BNOW);
  eq(r.fresh, ['first']);
  eq(Takt.badgeCheck({}, BNOW), { earned: {}, fresh: [] });
});
