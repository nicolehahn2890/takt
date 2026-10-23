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
