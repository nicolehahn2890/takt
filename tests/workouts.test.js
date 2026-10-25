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
function mixShape(w) { return w.blocks.map(function (b) { return [b.label, b.items.length]; }); }
function mixLabels(w) { return w.blocks.map(function (b) { return b.label; }); }
var mixIdx = Takt.indexExercises(Takt.EXERCISES);
function mixRank(id) { return Takt.POSITIONS.indexOf(mixIdx[id].position); }
var MIX_KEYS = ['core', 'vacuum', 'bauch', 'beine', 'ruecken', 'dehnen', 'yoga', 'ganz'];
var MIX_KRAFT = ['core', 'bauch', 'beine', 'ruecken', 'ganz'];
/* alle 255 Themen-Kombinationen, je mit eigenem Seed */
function mixEach(minutes, fn) {
  for (var mask = 1; mask < 256; mask++) {
    var th = MIX_KEYS.filter(function (k, i) { return mask & (1 << i); });
    fn(Takt.makeMix({ themes: th, minutes: minutes, seed: mask * 31 + minutes }, Takt.EXERCISES), th);
  }
}

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

test('mix Dauer passt fuer jede Themen-Kombination: nie laenger, mindestens 90 %', function () {
  var bad = [];
  [5, 10, 15, 20, 30].forEach(function (m) {
    mixEach(m, function (w, th) {
      var s = Takt.workoutSeconds(w, mixIdx);
      if (s > m * 60 || s < m * 60 * 0.9) bad.push(th.join(',') + ' ' + m + ' Min.: ' + s + ' s');
    });
  });
  eq(bad, []);
});

test('mix keine Uebung doppelt, nur Zeit-Uebungen mit Figur, ohne Hilfsmittel ausser Matte und Wand', function () {
  var bad = [];
  [10, 30].forEach(function (m) {
    mixEach(m, function (w, th) {
      var all = mixAll(w);
      if (all.some(function (x, i) { return all.indexOf(x) !== i; })) bad.push('doppelt: ' + th);
      all.forEach(function (id) {
        var e = mixIdx[id];
        if (!Takt.POSES[id] || e.typ !== 'zeit' || !e.hilfsmittel.every(function (h) { return h === 'matte' || h === 'wand'; })) bad.push(id);
      });
    });
  });
  eq(bad, []);
});

test('mix Aufwaermen nur bei Kraft-Themen, nicht bei Dehnen, Vacuum oder Yoga', function () {
  var bad = [];
  [5, 15].forEach(function (m) {
    mixEach(m, function (w, th) {
      var kraft = th.some(function (k) { return MIX_KRAFT.indexOf(k) >= 0; });
      if (kraft !== !!mixBlock(w, 'Aufwärmen')) bad.push(th.join(',') + ' ' + m);
    });
  });
  eq(bad, []);
  eq(mixLabels(Takt.makeMix({ themes: ['vacuum', 'dehnen'], minutes: 15, seed: 1 }, Takt.EXERCISES)), ['Hauptteil', 'Dehnen', 'Abschluss']);
});

test('mix Aufwaermen: erst Puls, dann die Gelenke des Themas, 5 s zum Wechseln', function () {
  var pulse = ['laufen-stelle', 'hampelmann', 'kniehebelauf', 'seilspringen', 'schattenboxen'];
  var mobile = { core: ['hueftkreisen', 'katze-kuh', 'inchworm'], bauch: ['hueftkreisen', 'katze-kuh', 'inchworm'],
    beine: ['hueftkreisen', 'worlds-greatest'], ruecken: ['schulterkreisen', 'armkreisen', 'katze-kuh'],
    ganz: ['armkreisen', 'hueftkreisen', 'inchworm', 'worlds-greatest'] };
  MIX_KRAFT.forEach(function (th) {
    for (var seed = 1; seed <= 10; seed++) {
      var warm = mixBlock(Takt.makeMix({ themes: [th], minutes: 15, seed: seed }, Takt.EXERCISES), 'Aufwärmen').items;
      ok(pulse.indexOf(warm[0].exId) >= 0, th + ': kein Puls ' + warm[0].exId);
      ok(mobile[th].indexOf(warm[1].exId) >= 0, th + ': keine Mobilisation ' + warm[1].exId);
      eq(warm.map(function (i) { return [i.duration, i.rest]; }), [[40, 5], [40, null]], th);
    }
  });
});

test('mix jeder Teil vom Stehen zum Liegen, Aufwaermen und Abschluss ohne Aufstehen', function () {
  var bad = [];
  [10, 20].forEach(function (m) {
    mixEach(m, function (w, th) {
      w.blocks.forEach(function (b) {
        var r = b.items.map(function (i) { return mixRank(i.exId); });
        if (r.some(function (x, i) { return i && x < r[i - 1]; })) bad.push(th + ' ' + b.label + ': ' + mixIds(b));
      });
      var warm = mixIds(mixBlock(w, 'Aufwärmen')), main = mixIds(mixBlock(w, 'Hauptteil')), cool = mixIds(mixBlock(w, 'Abschluss'));
      if (warm.length && mixRank(warm[warm.length - 1]) > mixRank(main[0])) bad.push(th + ': Aufwaermen tiefer als der Hauptteil');
      if (mixRank(cool[0]) < mixRank(main[main.length - 1])) bad.push(th + ': Abschluss hoeher als der Hauptteil');
    });
  });
  eq(bad, []);
});

test('mix Dehnen und Yoga: ein Durchgang, mind. 30 s je Seite, 5 s Wechsel, am Ende Totenstellung', function () {
  ['dehnen', 'yoga'].forEach(function (th) {
    for (var seed = 1; seed <= 10; seed++) {
      var w = Takt.makeMix({ themes: [th], minutes: 15, seed: seed }, Takt.EXERCISES);
      var main = mixBlock(w, 'Hauptteil');
      eq([mixLabels(w), main.repeat, w.defaultRest], [['Hauptteil', 'Abschluss'], 1, 5], th);
      ok(main.items.length >= 8, th + ': nur ' + main.items.length + ' Uebungen');
      main.items.forEach(function (i) {
        var e = mixIdx[i.exId];
        ok((i.bilateral ? i.duration / 2 : i.duration) >= 30 && i.rest === null, i.exId + ' ' + i.duration);
        if (th === 'dehnen') {
          ok(e.tags.indexOf('dehnen') >= 0 && !['aufwaermen', 'vacuum', 'ganzkoerper'].some(function (t) { return e.tags.indexOf(t) >= 0; }),
            'keine Dehnung: ' + i.exId);
        }
      });
      eq(mixIds(mixBlock(w, 'Abschluss')), ['totenstellung'], th);
      if (th === 'yoga') eq(main.items[0].exId, 'sonnengruss');
    }
  });
});

test('mix Yoga: Kraft- und Balance-Haltungen bleiben kurz, nur Dehnungen werden laenger', function () {
  for (var seed = 1; seed <= 10; seed++) {
    mixBlock(Takt.makeMix({ themes: ['yoga'], minutes: 30, seed: seed }, Takt.EXERCISES), 'Hauptteil').items.forEach(function (i) {
      var stretch = mixIdx[i.exId].tags.indexOf('dehnen') >= 0 || i.exId === 'sonnengruss';
      ok(i.duration <= (stretch ? 2 : 1) * (i.bilateral ? (stretch ? 90 : 60) : (stretch ? 60 : 45)), i.exId + ' ' + i.duration);
    });
  }
});

test('mix Kombi: erst der Zirkel, dann Dehnen fuer die Muskeln, die gearbeitet haben', function () {
  var legs = ['quad-dehnung', 'hueftbeuger-dehnung', 'taube', 'hamstring-dehnung', 'huefte-90-90', 'figur-vier'];
  for (var seed = 1; seed <= 10; seed++) {
    var w = Takt.makeMix({ themes: ['beine', 'dehnen'], minutes: 20, seed: seed }, Takt.EXERCISES);
    eq(mixLabels(w), ['Aufwärmen', 'Hauptteil', 'Dehnen', 'Abschluss']);
    ok(mixIds(mixBlock(w, 'Hauptteil')).every(function (id) { return mixIdx[id].tags.indexOf('beine-po') >= 0; }), 'Hauptteil');
    var d = mixBlock(w, 'Dehnen').items;
    ok(d.every(function (i) { return i.rest === 5; }), '5 s Wechsel');
    // Beine zuerst; passt die letzte Bein-Dehnung nicht mehr, darf eine kuerzere andere nachruecken
    ok(d.filter(function (i) { return legs.indexOf(i.exId) >= 0; }).length >= Math.min(d.length, legs.length) - 1,
      'Beine zuerst: ' + mixIds(mixBlock(w, 'Dehnen')));
    eq(mixIds(mixBlock(w, 'Abschluss')), ['totenstellung']);
  }
});

test('mix Zirkel: reihum aus den Themen, 5 Uebungen, ab 30 Min. 6', function () {
  for (var seed = 1; seed <= 10; seed++) {
    var main = mixIds(mixBlock(Takt.makeMix({ themes: ['vacuum', 'beine'], minutes: 15, seed: seed }, Takt.EXERCISES), 'Hauptteil'));
    eq(main.length, 5);
    ok(main.filter(function (id) { return mixIdx[id].tags.indexOf('vacuum') >= 0; }).length >= 2, 'Vacuum ' + main);
    ok(main.filter(function (id) { return mixIdx[id].tags.indexOf('beine-po') >= 0; }).length >= 2, 'Beine ' + main);
  }
  eq(mixIds(mixBlock(Takt.makeMix({ themes: ['core'], minutes: 30, seed: 2 }, Takt.EXERCISES), 'Hauptteil')).length, 6);
});

test('mix mit duennem Thema: Zirkel mit Core und Ganzkoerper aufgefuellt, Durchgang nicht', function () {
  var thin = Takt.EXERCISES.filter(function (e) { return e.tags.indexOf('bauch') < 0 || e.id === 'crunch' || e.id === 'dead-bug'; });
  var main = mixIds(mixBlock(Takt.makeMix({ themes: ['bauch'], minutes: 15, seed: 3 }, thin), 'Hauptteil'));
  eq(main.length, 5);
  eq(main.filter(function (x, i) { return main.indexOf(x) === i; }).length, 5);
  ok(main.indexOf('crunch') >= 0 && main.indexOf('dead-bug') >= 0, 'Bauch-Uebungen fehlen: ' + main);
  var yoga = Takt.EXERCISES.filter(function (e) {
    return e.tags.indexOf('yoga') < 0 || ['baum', 'stuhl', 'sonnengruss', 'totenstellung'].indexOf(e.id) >= 0;
  });
  var w = Takt.makeMix({ themes: ['yoga'], minutes: 15, seed: 5 }, yoga);
  var y = mixIds(mixBlock(w, 'Hauptteil'));
  eq([y[0], y.slice(1).sort()], ['sonnengruss', ['baum', 'stuhl']]);
  ok(Takt.workoutSeconds(w, mixIdx) <= 900, 'zu lang');
});

test('mix Name, Thema, Quelle und Aufbau', function () {
  var w = Takt.makeMix({ themes: ['ganz', 'bauch'], minutes: 10, seed: 1 }, Takt.EXERCISES);
  eq([w.name, w.theme, w.source], ['Mix: Ganzkörper, Bauch', 'core', 'mix']);
  eq(mixShape(w), [['Aufwärmen', 2], ['Hauptteil', 5], ['Abschluss', 1]]);
  var cool = mixBlock(w, 'Abschluss').items[0];
  ok(['vorbeuge-stehend', 'quad-dehnung', 'herabschauender-hund', 'kindhaltung', 'figur-vier', 'kobra', 'sphinx', 'liegender-twist',
    'knie-zur-brust'].indexOf(cool.exId) >= 0 && cool.duration === 60, 'Abschluss ' + cool.exId);
  ok(mixBlock(w, 'Hauptteil').items.every(function (i) { return i.name === mixIdx[i.exId].name; }), 'Name fehlt');
});

test('mix 5 Min.: passt, Kraft mit einer Aufwaerm-Uebung, Vacuum ohne, Yoga als Durchgang', function () {
  var shapes = { core: [['Aufwärmen', 1], ['Hauptteil', 4], ['Abschluss', 1]], vacuum: [['Hauptteil', 4], ['Abschluss', 1]] };
  shapes.ganz = shapes.core;
  ['core', 'ganz', 'vacuum', 'yoga'].forEach(function (th) {
    for (var seed = 1; seed <= 10; seed++) {
      var w = Takt.makeMix({ themes: [th], minutes: 5, seed: seed }, Takt.EXERCISES);
      var s = Takt.workoutSeconds(w, mixIdx);
      ok(s <= 300 && s >= 270, th + ' ' + seed + ': ' + s + ' s');
      if (th === 'yoga') eq([mixLabels(w), mixBlock(w, 'Abschluss').items[0].duration], [['Hauptteil', 'Abschluss'], 40]);
      else {
        eq(mixShape(w), shapes[th], th + ' ' + seed);
        ok(mixBlock(w, 'Hauptteil').items.every(function (i) { return i.duration >= 20; }), 'Hauptteil zu kurz');
      }
    }
  });
});

test('mix nur Vacuum: nur Vacuum-Uebungen, ohne Aufwaermen, 15 s zum Durchatmen', function () {
  for (var seed = 1; seed <= 20; seed++) {
    var w = Takt.makeMix({ themes: ['vacuum'], minutes: 10, seed: seed }, Takt.EXERCISES);
    var main = mixIds(mixBlock(w, 'Hauptteil'));
    eq(main.length, 5);
    ok(main.every(function (id) { return mixIdx[id].tags.indexOf('vacuum') >= 0; }), 'kein Vacuum: ' + main);
    eq([w.name, w.theme, w.defaultRest, mixLabels(w)], ['Mix: Vacuum', 'core', 15, ['Hauptteil', 'Abschluss']]);
  }
});

/* ---------- Workouts pruefen und kopieren ---------- */
function vIn(blocks, name) {
  return { name: name === undefined ? 'Mein Workout' : name, theme: 'bauch', defaultWork: 40, defaultRest: 15, blocks: blocks };
}
function vErr(res, field) { return res.errors.filter(function (e) { return e.field === field; }).length > 0; }

test('validateWorkout leer', function () {
  var r = Takt.validateWorkout(vIn([{ repeat: 1, items: [] }]));
  eq(r.ok, false);
  ok(vErr(r, 'blocks'), JSON.stringify(r.errors));
  ok(vErr(Takt.validateWorkout(vIn([])), 'blocks'), 'ohne Bloecke');
});

test('validateWorkout Name zu lang oder leer', function () {
  var items = [{ repeat: 1, items: wItems(1, 40) }];
  ok(vErr(Takt.validateWorkout(vIn(items, new Array(42).join('x'))), 'name'), 'zu lang');
  ok(vErr(Takt.validateWorkout(vIn(items, '   ')), 'name'), 'leer');
  eq(Takt.validateWorkout(vIn(items, new Array(41).join('x'))).ok, true);
});

test('validateWorkout setzt name aus Bibliothek', function () {
  var r = Takt.validateWorkout(vIn([{ repeat: 1, items: [{ exId: 'plank', name: null, duration: 40, rest: null }] }]));
  eq(r.ok, true);
  eq(r.workout.blocks[0].items[0].name, 'Plank');
  var r2 = Takt.validateWorkout(vIn([{ repeat: 1, items: [{ exId: 'own-weg', name: null, duration: 40, rest: null }] }]));
  eq(r2.ok, false);
});

test('validateWorkout Grenzen fuer Runden, Dauer und Pause', function () {
  function one(item, repeat) { return Takt.validateWorkout(vIn([{ repeat: repeat || 1, items: [item] }])); }
  ok(vErr(one({ exId: 'plank', duration: 5, rest: null }), 'duration'), 'Dauer 5');
  ok(vErr(one({ exId: 'plank', duration: 601, rest: null }), 'duration'), 'Dauer 601');
  ok(vErr(one({ exId: 'plank', duration: 40, rest: 121 }), 'rest'), 'Pause 121');
  ok(vErr(one({ exId: 'plank', duration: 40, rest: null }, 11), 'repeat'), 'Runden 11');
  ok(vErr(one({ exId: 'plank', duration: 40, rest: null }, -1), 'repeat'), 'Runden -1');
  eq(one({ exId: 'plank', duration: 10, rest: 0 }, 10).ok, true);
});

test('validateWorkout baut ein sauberes eigenes Workout', function () {
  var r = Takt.validateWorkout(vIn([{ repeat: 2, items: wItems(2, 40) }, { repeat: 1, items: [] }], '  Morgen  '),
    new Date('2026-10-23T08:00:00Z'));
  eq(r.ok, true);
  var w = r.workout;
  ok(/^w-/.test(w.id), w.id);
  eq([w.name, w.theme, w.source, w.blocks.length, w.createdAt, w.updatedAt],
    ['Morgen', 'bauch', 'own', 1, '2026-10-23T08:00:00.000Z', '2026-10-23T08:00:00.000Z']);
  var again = Takt.validateWorkout(w, new Date('2026-10-24T08:00:00Z')).workout;
  eq([again.id, again.createdAt, again.updatedAt], [w.id, '2026-10-23T08:00:00.000Z', '2026-10-24T08:00:00.000Z']);
});

test('copyWorkout Vorlage', function () {
  var t = Takt.TEMPLATES.filter(function (x) { return x.id === 'vacuum-core-kurz'; })[0];
  var c = Takt.copyWorkout(t);
  ok(c.id !== t.id && /^w-/.test(c.id), c.id);
  eq([c.name, c.source, c.level], [t.name, 'own', undefined]);
  eq(Takt.workoutSeconds(c, wIdx()), Takt.workoutSeconds(t, wIdx()));
  ok(c.blocks[0].items.every(function (i) { return !!i.name; }), 'Namen fehlen');
  c.blocks[0].items[0].duration = 999;
  ok(t.blocks[0].items[0].duration !== 999, 'Vorlage wurde veraendert');
});

test('copyWorkout eigenes Workout heisst (Kopie)', function () {
  var w = Takt.validateWorkout(vIn([{ repeat: 1, items: wItems(1, 40) }], 'Abend')).workout;
  eq(Takt.copyWorkout(w).name, 'Abend (Kopie)');
  var long = Takt.validateWorkout(vIn([{ repeat: 1, items: wItems(1, 40) }], new Array(41).join('y'))).workout;
  ok(Takt.copyWorkout(long).name.length <= 40, 'Name zu lang');
});

test('buildSteps mit geloeschter eigener Uebung', function () {
  var w = vIn([{ repeat: 1, items: [{ exId: 'own-weg', name: 'Meine Übung', duration: 30, rest: null }] }]);
  var s = Takt.buildSteps(w, wIdx(), {});
  eq([s[0].name, s[0].exId], ['Meine Übung', 'own-weg']);
  eq(Takt.exerciseFor('own-weg', wIdx(), s[0].name).name, 'Meine Übung');
});

/* ---------- Startseite ---------- */
test('weekStats zaehlt ab Montag 0 Uhr', function () {
  var log = [
    { date: new Date(2026, 9, 19, 8, 0).toISOString(), actualSec: 600 },
    { date: new Date(2026, 9, 18, 23, 0).toISOString(), actualSec: 900 },
    { date: new Date(2026, 9, 23, 10, 0).toISOString(), actualSec: 1230 },
    { date: 'kaputt', actualSec: 100 },
    { actualSec: 100 },
    { date: new Date(2026, 9, 20, 9, 0).toISOString(), actualSec: 'x' }
  ];
  eq(Takt.weekStats(log, new Date(2026, 9, 23, 12, 0)), { seconds: 1830, count: 2 });
  eq(Takt.weekStats(log, new Date(2026, 9, 25, 21, 0)), { seconds: 1830, count: 2 });
  eq(Takt.weekStats(log, new Date(2026, 9, 26, 7, 0)), { seconds: 0, count: 0 });
  eq(Takt.weekStats(null, new Date()), { seconds: 0, count: 0 });
});

test('THEMES hat Farbe und Name fuer alle Workout-Themen', function () {
  Takt.WORKOUT_THEMES.forEach(function (k) {
    ok(/^#[0-9A-F]{6}$/i.test(Takt.THEMES[k].color), k);
    ok(Takt.THEMES[k].label.length > 2, k);
  });
});

/* ---------- Funde aus der Abschlusspruefung ---------- */
test('fitBudget nutzt das Budget aus (mind. 90 %)', function () {
  var idx = wIdx();
  function tpl(id) { return Takt.TEMPLATES.filter(function (w) { return w.id === id; })[0]; }
  var a = Takt.prepareSteps(tpl('vacuum-core-kurz'), idx, { prepSeconds: 5, intensity: 'normal', budgetSec: 420 });
  var b = Takt.prepareSteps(tpl('ruecken-lang'), idx, { prepSeconds: 5, intensity: 'leicht', budgetSec: 300 });
  ok(Takt.totalSeconds(a) <= 420 && Takt.totalSeconds(a) >= 378, 'vacuum-core-kurz 7 Min.: ' + Takt.totalSeconds(a));
  ok(Takt.totalSeconds(b) <= 300 && Takt.totalSeconds(b) >= 270, 'ruecken-lang leicht 5 Min.: ' + Takt.totalSeconds(b));
  var bad = [];
  Takt.TEMPLATES.forEach(function (w) {
    ['leicht', 'normal', 'hart'].forEach(function (lvl) {
      var full = Takt.totalSeconds(Takt.prepareSteps(w, idx, { prepSeconds: 5, intensity: lvl }));
      for (var m = 5; m * 60 < full; m++) {
        var s = Takt.prepareSteps(w, idx, { prepSeconds: 5, intensity: lvl, budgetSec: m * 60 });
        var t = Takt.totalSeconds(s);
        if (t > m * 60 || t < m * 60 * 0.9) bad.push(w.id + ' ' + lvl + ' ' + m + ' Min.: ' + t);
        if (s.some(function (x) { return x.kind === 'work' && x.duration < 10; })) bad.push(w.id + ' ' + lvl + ' ' + m + ' unter 10 s');
      }
    });
  });
  eq(bad, []);
});

test('fitBudget verlaengert nie ueber die geplante Dauer', function () {
  var steps = wSteps(w600());
  var s = Takt.fitBudget(steps, 450);
  s.forEach(function (x, i) { ok(x.duration <= steps[i].duration, 'Schritt ' + i + ' laenger als geplant'); });
});

test('mix Name passt immer in 40 Zeichen und laesst sich speichern', function () {
  var keys = ['core', 'vacuum', 'bauch', 'beine', 'ruecken', 'dehnen', 'yoga', 'ganz'];
  for (var mask = 1; mask < 256; mask++) {
    var th = keys.filter(function (k, i) { return mask & (1 << i); });
    var w = Takt.makeMix({ themes: th, minutes: 15, seed: mask }, Takt.EXERCISES);
    ok(w.name.length <= 40, w.name);
    var v = Takt.validateWorkout(Takt.copyWorkout(w));
    ok(v.ok, th.join(',') + ': ' + JSON.stringify(v.errors));
  }
  eq(Takt.makeMix({ themes: ['core', 'bauch'], minutes: 10, seed: 1 }, Takt.EXERCISES).name, 'Mix: Core, Bauch');
});

/* ---------- Design v2 ---------- */
test('THEMES nach Design v2', function () {
  var c = {};
  Object.keys(Takt.THEMES).forEach(function (k) { c[k] = Takt.THEMES[k].color.toUpperCase(); });
  eq(c, { core: '#C6C5A6', bauch: '#BE7B9D', dehnen: '#A8C4A0', yoga: '#B794C5', beine: '#C4A882', ruecken: '#8AB4C4' });
});

test('validateWorkout behaelt origin mix', function () {
  var r = Takt.validateWorkout({ name: 'Mix: Core', theme: 'core', origin: 'mix', blocks: [{ repeat: 1, items: wItems(1, 40) }] });
  eq([r.workout.origin, r.workout.source], ['mix', 'own']);
  eq(Takt.validateWorkout({ name: 'X', blocks: [{ repeat: 1, items: wItems(1, 40) }] }).workout.origin, undefined);
});

test('copyWorkout Mix setzt origin', function () {
  var m = Takt.makeMix({ themes: ['core'], minutes: 10, seed: 3 }, Takt.EXERCISES);
  var c = Takt.copyWorkout(m);
  eq([c.origin, c.source, Takt.validateWorkout(c).workout.origin], ['mix', 'own', 'mix']);
});
