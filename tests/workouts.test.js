/* Tests fuer js/workouts.js: Intensitaet, Zeit-Budget, Ablauf vorbereiten */
var WIDS = ['plank', 'dead-bug', 'glute-bridge', 'crunch', 'kniebeuge', 'superman', 'bird-dog', 'reverse-crunch',
  'fahrrad-crunch', 'kobra', 'katze-kuh', 'kindhaltung'];
function wIdx() { return Takt.indexExercises(Takt.EXERCISES); }
function wItems(n, dur) {
  return WIDS.slice(0, n).map(function (id) { return { exId: id, name: null, duration: dur, rest: null, bilateral: false }; });
}
function wFix(blocks, rest) {
  return { id: 'fx', name: 'Fixture', theme: 'core', defaultWork: 40, defaultRest: rest, source: 'own', blocks: blocks };
}
/* wie die Vorlage vacuum-core-kurz aufgebaut: 40 s Arbeit, 15 s Pause */
function wCore() { return wFix([{ repeat: 2, items: wItems(5, 40) }], 15); }
/* genau 600 s: 11 x 40 s + 1 x 50 s Arbeit, 11 x 10 s Pause */
function w600() {
  var items = wItems(12, 40);
  items[11].duration = 50;
  return wFix([{ repeat: 1, items: items }], 10);
}
function wSteps(w, prep) { return Takt.buildSteps(w, wIdx(), { prepSeconds: prep || 0 }); }
function durs(steps, kind) {
  return steps.filter(function (s) { return s.kind === kind; }).map(function (s) { return s.duration; });
}
function uniq(a) { return a.filter(function (x, i) { return a.indexOf(x) === i; }); }

test('applyIntensity hart: Arbeit 40 -> 50, Pause 15 -> 10, prep bleibt', function () {
  var s = Takt.applyIntensity(wSteps(wCore(), 5), 'hart');
  eq(s[0], wSteps(wCore(), 5)[0]);
  eq(uniq(durs(s, 'work')), [50]);
  eq(uniq(durs(s, 'rest')), [10]);
});

test('applyIntensity leicht: Arbeit 40 -> 30, Pause 15 -> 25', function () {
  var s = Takt.applyIntensity(wSteps(wCore()), 'leicht');
  eq(uniq(durs(s, 'work')), [30]);
  eq(uniq(durs(s, 'rest')), [25]);
});

test('applyIntensity unbekannter Level wie normal, Eingabe bleibt unveraendert', function () {
  var orig = wSteps(wCore());
  var copy = JSON.parse(JSON.stringify(orig));
  eq(Takt.applyIntensity(orig, 'quatsch'), copy);
  Takt.applyIntensity(orig, 'hart');
  eq(orig, copy);
});

test('fitBudget kuerzt anteilig', function () {
  var steps = wSteps(w600());
  eq(Takt.totalSeconds(steps), 600);
  var s = Takt.fitBudget(steps, 450);
  ok(Takt.totalSeconds(s) <= 450, 'Summe ' + Takt.totalSeconds(s));
  ok(Takt.totalSeconds(s) >= 420, 'Summe ' + Takt.totalSeconds(s));
  eq(Takt.workCount(s), 12);
});

test('fitBudget streicht Runden', function () {
  var s = Takt.fitBudget(wSteps(wFix([{ repeat: 3, items: wItems(4, 40) }], 15)), 100);
  var works = s.filter(function (x) { return x.kind === 'work'; });
  ok(Math.max.apply(null, works.map(function (x) { return x.round; })) < 3, 'Runden nicht gestrichen');
  ok(Takt.totalSeconds(s) <= 100, 'Summe ' + Takt.totalSeconds(s));
  ok(works.every(function (x) { return x.duration >= 10; }), 'Uebung unter 10 s');
  eq(works.map(function (x) { return x.workIndex; }), works.map(function (x, i) { return i; }));
  eq(uniq(s.map(function (x) { return x.rounds; })), [Math.max.apply(null, works.map(function (x) { return x.round; }))]);
  eq(s[s.length - 1].kind, 'work');
});

test('fitBudget sehr kleines Budget', function () {
  var s = Takt.fitBudget(wSteps(wFix([{ repeat: 1, items: wItems(12, 40) }], 15)), 30);
  ok(Takt.totalSeconds(s) <= 30, 'Summe ' + Takt.totalSeconds(s));
  ok(Takt.workCount(s) >= 1, 'leeres Training');
  ok(durs(s, 'work').every(function (d) { return d >= 10; }), 'Uebung unter 10 s');
});

test('fitBudget groesser als Dauer', function () {
  var steps = wSteps(w600());
  eq(Takt.fitBudget(steps, 10000), steps);
  eq(Takt.fitBudget(steps, 600), steps);
});

test('prepareSteps Reihenfolge', function () {
  var w = w600(), idx = wIdx();
  eq(Takt.prepareSteps(w, idx, { prepSeconds: 5, intensity: 'hart' }),
    Takt.applyIntensity(Takt.buildSteps(w, idx, { prepSeconds: 5 }), 'hart'));
  var s = Takt.prepareSteps(w, idx, { prepSeconds: 5, intensity: 'hart', budgetSec: 300 });
  ok(Takt.totalSeconds(s) <= 300, 'Summe ' + Takt.totalSeconds(s));
  ok(Takt.totalSeconds(s) >= 270, 'Summe ' + Takt.totalSeconds(s));
  eq({ kind: s[0].kind, duration: s[0].duration }, { kind: 'prep', duration: 5 });
});

/* ---------- Mix ---------- */
function mixIds(block) { return block ? block.items.map(function (i) { return i.exId; }) : []; }
function mixBlock(w, label) { return w.blocks.filter(function (b) { return b.label === label; })[0]; }
function mixAll(w) { return [].concat.apply([], w.blocks.map(mixIds)); }

test('workoutSeconds ohne Vorbereitung', function () {
  eq(Takt.workoutSeconds(w600(), wIdx()), 600);
});

test('rng: gleicher Seed gleiche Folge, Werte zwischen 0 und 1', function () {
  var a = Takt.rng(7), b = Takt.rng(7), c = Takt.rng(8);
  var xa = [a(), a(), a()], xb = [b(), b(), b()];
  eq(xa, xb);
  ok(JSON.stringify(xa) !== JSON.stringify([c(), c(), c()]), 'anderer Seed gleiche Folge');
  ok(xa.every(function (x) { return x >= 0 && x < 1; }), 'Wert ausserhalb');
});

test('mix gleicher seed gleiches Ergebnis', function () {
  var a = Takt.makeMix({ themes: ['core', 'bauch'], minutes: 15, seed: 42 }, Takt.EXERCISES);
  var b = Takt.makeMix({ themes: ['core', 'bauch'], minutes: 15, seed: 42 }, Takt.EXERCISES);
  var c = Takt.makeMix({ themes: ['core', 'bauch'], minutes: 15, seed: 43 }, Takt.EXERCISES);
  eq(a, b);
  ok(JSON.stringify(mixAll(a)) !== JSON.stringify(mixAll(c)), 'anderer Seed gleicher Mix');
});

test('mix keine Uebung doppelt im Hauptblock', function () {
  ['core', 'bauch', 'beine', 'ruecken', 'dehnen', 'yoga', 'ganz'].forEach(function (th) {
    for (var seed = 1; seed <= 15; seed++) {
      var w = Takt.makeMix({ themes: [th], minutes: 20, seed: seed }, Takt.EXERCISES);
      var main = mixIds(mixBlock(w, 'Hauptteil'));
      eq(main.length, 5, th + ' ' + seed);
      var all = mixAll(w);
      eq(all.filter(function (x, i) { return all.indexOf(x) === i; }).length, all.length, 'doppelt bei ' + th + ' ' + seed);
    }
  });
});

test('mix Dauer passt', function () {
  [10, 15, 20, 30].forEach(function (m) {
    for (var seed = 1; seed <= 10; seed++) {
      var s = Takt.workoutSeconds(Takt.makeMix({ themes: ['core', 'ruecken'], minutes: m, seed: seed }, Takt.EXERCISES), wIdx());
      ok(s <= m * 60 && s >= m * 60 * 0.8, m + ' Min. ergibt ' + s + ' s');
    }
  });
});

test('mix nur Zeit-Uebungen mit Figur, ohne Hilfsmittel ausser Matte und Wand', function () {
  var idx = wIdx();
  for (var seed = 1; seed <= 20; seed++) {
    mixAll(Takt.makeMix({ themes: ['ganz', 'yoga', 'ruecken'], minutes: 30, seed: seed }, Takt.EXERCISES)).forEach(function (id) {
      ok(Takt.POSES[id], 'ohne Figur: ' + id);
      eq(idx[id].typ, 'zeit', id);
      ok((idx[id].hilfsmittel || []).every(function (h) { return h === 'matte' || h === 'wand'; }), 'Hilfsmittel bei ' + id);
    });
  }
});

test('mix mit duennem Thema', function () {
  eq(mixIds(mixBlock(Takt.makeMix({ themes: ['yoga'], minutes: 15, seed: 5 }, Takt.EXERCISES), 'Hauptteil')).length, 5);
  var thin = Takt.EXERCISES.filter(function (e) { return e.tags.indexOf('yoga') < 0 || e.id === 'baum' || e.id === 'stuhl'; });
  var main = mixIds(mixBlock(Takt.makeMix({ themes: ['yoga'], minutes: 15, seed: 3 }, thin), 'Hauptteil'));
  eq(main.length, 5);
  eq(main.filter(function (x, i) { return main.indexOf(x) === i; }).length, 5);
  ok(main.indexOf('baum') >= 0 && main.indexOf('stuhl') >= 0, 'Yoga-Uebungen fehlen: ' + main);
});

test('mix Name, Thema, Quelle und Aufbau', function () {
  var w = Takt.makeMix({ themes: ['ganz', 'bauch'], minutes: 10, seed: 1 }, Takt.EXERCISES);
  eq([w.name, w.theme, w.source], ['Mix: Ganzkörper, Bauch', 'core', 'mix']);
  eq(w.blocks.map(function (b) { return [b.label, b.items.length]; }),
    [['Aufwärmen', 2], ['Hauptteil', 5], ['Abschluss', 1]]);
  var idx = wIdx();
  ok(mixBlock(w, 'Aufwärmen').items.every(function (i) { return idx[i.exId].tags.indexOf('aufwaermen') >= 0 && i.duration === 40; }), 'Aufwaermen');
  var cool = mixBlock(w, 'Abschluss').items[0];
  ok(idx[cool.exId].tags.indexOf('dehnen') >= 0 && cool.duration === 60, 'Abschluss');
  ok(mixBlock(w, 'Hauptteil').items.every(function (i) { return i.name === idx[i.exId].name; }), 'Name fehlt');
});
