/* Tests fuer js/learn.js: lernende Dauer */
function lw(repeat) {
  return { id: 'w-lern', name: 'Morgen-Core', source: 'own', defaultWork: 40, defaultRest: 10,
    blocks: [{ repeat: repeat || 1, items: [{ exId: 'plank', name: null, duration: 40, rest: null }, { exId: 'crunch', name: null, duration: 30, rest: null }] }] };
}
function ll(wid, deltas, extra) {
  var e = { id: 'l' + Math.random(), workoutId: wid, name: 'x', date: '2026-10-20T08:00:00Z', plannedSec: 100, actualSec: 100,
    adjustments: deltas.map(function (d) { return { exId: d[0], delta: d[1] }; }) };
  Object.keys(extra || {}).forEach(function (k) { e[k] = extra[k]; });
  return e;
}
var LIDX = Takt.indexExercises(Takt.EXERCISES);

test('learn dreimal laenger', function () {
  var log = [ll('w-lern', [['plank', 15]]), ll('w-lern', [['plank', 15]]), ll('w-lern', [['plank', 15], ['plank', 15]])];
  eq(Takt.learnSuggestion(log, lw(), {}, LIDX), { exId: 'plank', name: 'Plank', from: 40, to: 60, direction: 1 });
});

test('learn gemischt keine Frage', function () {
  var log = [ll('w-lern', [['plank', 15]]), ll('w-lern', [['plank', -15]]), ll('w-lern', [['plank', 15]])];
  eq(Takt.learnSuggestion(log, lw(), {}, LIDX), null);
  var netto0 = [ll('w-lern', [['plank', 15]]), ll('w-lern', [['plank', 15], ['plank', -15]]), ll('w-lern', [['plank', 15]])];
  eq(Takt.learnSuggestion(netto0, lw(), {}, LIDX), null, 'Netto 0 zaehlt nicht als verlaengert');
  eq(Takt.learnSuggestion(log.slice(0, 2), lw(), {}, LIDX), null, 'weniger als 3 Trainings');
  var anderes = [ll('w-lern', [['plank', 15]]), ll('w-x', [['plank', 15]]), ll('w-lern', [['plank', 15]])];
  eq(Takt.learnSuggestion(anderes, lw(), {}, LIDX), null, 'nur Trainings dieses Workouts');
});

test('learn gekuerzt und groesste Aenderung', function () {
  var log = [ll('w-lern', [['crunch', -15], ['plank', 15]]), ll('w-lern', [['crunch', -15], ['plank', 15]]), ll('w-lern', [['crunch', -15], ['plank', 30]])];
  eq(Takt.learnSuggestion(log, lw(), {}, LIDX), { exId: 'plank', name: 'Plank', from: 40, to: 60, direction: 1 });
  var kurz = [ll('w-lern', [['crunch', -15]]), ll('w-lern', [['crunch', -15]]), ll('w-lern', [['crunch', -15]])];
  eq(Takt.learnSuggestion(kurz, lw(), {}, LIDX), { exId: 'crunch', name: 'Crunch', from: 30, to: 15, direction: -1 });
});

test('learn je Vorkommen bei Runden', function () {
  var log = [ll('w-lern', [['plank', 30]]), ll('w-lern', [['plank', 30]]), ll('w-lern', [['plank', 15], ['plank', 15]])];
  eq(Takt.learnSuggestion(log, lw(2), {}, LIDX).to, 55);
});

test('learn Anpassen zaehlt nicht', function () {
  var log = [ll('w-lern', [['plank', 15]]), ll('w-lern', [['plank', 15]], { adjusted: true }), ll('w-lern', [['plank', 15]])];
  eq(Takt.learnSuggestion(log, lw(), {}, LIDX), null);
  log.unshift(ll('w-lern', [['plank', 15]]));
  eq(Takt.learnSuggestion(log, lw(), {}, LIDX).to, 55, 'angepasstes Training wird uebersprungen');
});

test('learn nach Ja neu zaehlen', function () {
  var log = [ll('w-lern', [['plank', 15]]), ll('w-lern', [['plank', 15]]), ll('w-lern', [['plank', 15]])];
  var learn = {}; learn[Takt.learnKey('w-lern', 'plank')] = { since: 3 };
  eq(Takt.learnSuggestion(log, lw(), learn, LIDX), null);
  log.push(ll('w-lern', [['plank', 15]]), ll('w-lern', [['plank', 15]]));
  eq(Takt.learnSuggestion(log, lw(), learn, LIDX), null, 'erst 2 neue');
  log.push(ll('w-lern', [['plank', 15]]));
  eq(Takt.learnSuggestion(log, lw(), learn, LIDX).to, 55);
});

test('learn Nein 10 Trainings', function () {
  var log = [ll('w-lern', [['plank', 15]]), ll('w-lern', [['plank', 15]]), ll('w-lern', [['plank', 15]])];
  var learn = {}; learn[Takt.learnKey('w-lern', 'plank')] = { snoozeUntil: 13 };
  for (var i = 4; i <= 13; i++) {
    log.push(ll('w-lern', [['plank', 15]]));
    eq(Takt.learnSuggestion(log, lw(), learn, LIDX), null, 'Training ' + i);
  }
  log.push(ll('w-x', [['plank', 15]]));
  eq(Takt.learnSuggestion(log, lw(), learn, LIDX), null, 'anderes Workout zaehlt nicht mit');
  log.push(ll('w-lern', [['plank', 15]]));
  eq(Takt.learnSuggestion(log, lw(), learn, LIDX).to, 55, 'Training 14');
  eq(Takt.learnSuggestion(log.slice(0, 3), lw(), learn, LIDX), null);
});

test('learn Vorlage Kopie', function () {
  var tpl = Takt.TEMPLATES[0];
  var before = JSON.stringify(tpl);
  var log = [ll(tpl.id, [['dead-bug', 30]]), ll(tpl.id, [['dead-bug', 30]]), ll(tpl.id, [['dead-bug', 30]])];   // 2 Runden: +15 je Vorkommen
  var s = Takt.learnSuggestion(log, tpl, {}, LIDX);
  eq([s.exId, s.from, s.to], ['dead-bug', 40, 55]);
  var c = Takt.applyLearn(Takt.copyWorkout(tpl), s.exId, s.to);
  eq(c.source, 'own');
  ok(c.id !== tpl.id, 'neue Id');
  eq(JSON.stringify(tpl), before, 'Vorlage unveraendert');
  var d = [];
  c.blocks.forEach(function (b) { b.items.forEach(function (it) { if (it.exId === 'dead-bug') d.push(it.duration); }); });
  ok(d.length && d.every(function (x) { return x === 55; }), 'Kopie hat 55 s');
});

test('learn Mix keine Frage', function () {
  var mix = Takt.makeMix({ themes: ['core'], minutes: 10, seed: 3 }, Takt.EXERCISES);
  var w = mix.w || mix;
  var ex = w.blocks[0].items[0].exId;
  var log = [ll(w.id, [[ex, 15]]), ll(w.id, [[ex, 15]]), ll(w.id, [[ex, 15]])];
  eq(Takt.learnSuggestion(log, w, {}, LIDX), null);
});

test('learn geloeschte Uebung keine Frage', function () {
  var w = lw(); w.blocks[0].items[0].exId = 'own-weg';
  var log = [ll('w-lern', [['own-weg', 15]]), ll('w-lern', [['own-weg', 15]]), ll('w-lern', [['own-weg', 15]])];
  eq(Takt.learnSuggestion(log, w, {}, LIDX), null);
  eq(Takt.learnSuggestion(log, null, {}, LIDX), null, 'Workout geloescht');
});

test('applyLearn alle Eintraege', function () {
  var w = lw(2);
  w.blocks.push({ repeat: 1, items: [{ exId: 'plank', name: null, duration: 20, rest: null }] });
  var c = Takt.applyLearn(w, 'plank', 60);
  eq([c.blocks[0].items[0].duration, c.blocks[0].items[1].duration, c.blocks[1].items[0].duration], [60, 30, 60]);
  eq(w.blocks[1].items[0].duration, 20, 'Original unveraendert');
});
