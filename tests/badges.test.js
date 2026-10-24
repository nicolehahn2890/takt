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
  eq(Takt.BADGES.length, 22);
  var ids = {};
  Takt.BADGES.forEach(function (b) {
    ok(b.id && b.title && b.rule && b.icon && b.color && b.kind && b.n, 'Felder bei ' + b.id);
    ok(Takt.BADGE_ICONS[b.icon], 'Icon fehlt bei ' + b.id);
    ok(!ids[b.id], 'doppelte Id ' + b.id); ids[b.id] = 1;
  });
  eq(Takt.badgeDate(new Date(2026, 9, 24, 10).toISOString()), '24. Okt. 2026');
  eq([Takt.fmtCount(84), Takt.fmtCount(1000), Takt.fmtCount(12500)], ['84', '1.000', '12.500']);
});

test('badges erstes Training', function () {
  var leer = Takt.badgeCheck(bd([]), BNOW);
  eq([leer.earned, leer.fresh], [{}, []]);
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
  var nichts = Takt.badgeCheck({}, BNOW);
  eq([nichts.earned, nichts.fresh], [{}, []]);
});

test('badges Stufen', function () {
  var log = [];
  for (var i = 0; i < 100; i++) log.push(be(2026, 0, 1 + i, 10, { activeSec: 700 }));
  var r = Takt.badgeCheck(bd(log), BNOW);
  eq([r.earned.t25, r.earned.t50, r.earned.t100], [log[24].date, log[49].date, log[99].date]);
  eq([r.earned.min500, r.earned.min1000], [log[42].date, log[85].date]);
  eq([r.earned.streak14, r.earned.streak30], [log[13].date, log[29].date]);
  r = Takt.badgeCheck(bd(log.slice(0, 99)), BNOW);
  eq(r.earned.t100, undefined);
});

test('badges Entdecken', function () {
  var log = Takt.TEMPLATES.map(function (t, i) { return be(2026, 8, 1 + i * 2, 10, { workoutId: t.id }); });
  eq(Takt.badgeCheck(bd(log), BNOW).earned.tpl12, log[11].date);
  var elf = log.slice(1).concat([be(2026, 9, 28, 10, { workoutId: Takt.TEMPLATES[1].id })]);
  eq(Takt.badgeCheck(bd(elf), BNOW).earned.tpl12, undefined, 'eine Vorlage fehlt, eine doppelt');
  var own = [1, 2, 3, 4].map(function (k) { return { id: 'own-' + k, name: 'E' + k }; });
  eq(Takt.badgeCheck(bd([], { exercisesOwn: own }), BNOW).earned.ownex5, undefined);
  own.push({ id: 'own-5', name: 'E5' });
  eq(Takt.badgeCheck(bd([], { exercisesOwn: own }), BNOW).earned.ownex5, BNOW.toISOString());
  eq(Takt.badgeCheck(bd([], { settings: { lastBackup: '2026-10-20T08:00:00.000Z' } }), BNOW).earned.backup1, '2026-10-20T08:00:00.000Z');
  eq(Takt.badgeCheck(bd([], { settings: { lastBackup: null } }), BNOW).earned.backup1, undefined);
  var notes = [];
  for (var i = 0; i < 11; i++) notes.push(be(2026, 5, 1 + i * 2, 10, { note: i === 3 ? '   ' : 'Notiz ' + i }));
  eq(Takt.badgeCheck(bd(notes), BNOW).earned.notes10, notes[10].date, 'leere Notiz zaehlt nicht');
});

test('badges Fortschritt', function () {
  var log = [be(2026, 10, 28, 10, { activeSec: 1500, theme: 'yoga' }), be(2026, 10, 29, 10, { activeSec: 1500 })];
  var p = Takt.badgeCheck(bd(log), BNOW).progress;
  eq([p.ten, p.min100, p.streak7, p.themes, p.early, p.tpl12], [{ have: 2, need: 10 }, { have: 50, need: 100 }, { have: 2, need: 7 },
    { have: 2, need: 6 }, { have: 0, need: 1 }, { have: 0, need: 12 }]);
  var alt = [be(2026, 10, 20, 10), be(2026, 10, 21, 10)];
  eq(Takt.badgeCheck(bd(alt), BNOW).progress.streak7, { have: 0, need: 7 }, 'Serie ist abgerissen');
  eq(Takt.badgeCheck(bd(log), BNOW).progress.first, { have: 1, need: 1 });
  eq(Takt.badgeCheck(bd([], { exercisesOwn: [{ id: 'own-1' }] }), BNOW).progress.ownex5, { have: 1, need: 5 });
});
