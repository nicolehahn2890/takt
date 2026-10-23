/* Takt: Workouts als reine Logik: Intensitaet, Zeit-Budget, Ablauf vorbereiten */
window.Takt = window.Takt || {};
(function (T) {
  'use strict';

  T.INTENSITY = { leicht: { work: 0.8, rest: 1.5 }, normal: { work: 1, rest: 1 }, hart: { work: 1.2, rest: 0.6 } };
  var MIN = { work: 10, rest: 5 };

  function copy(s) {
    var c = {};
    Object.keys(s).forEach(function (k) { c[k] = s[k]; });
    return c;
  }
  function total(steps) { return T.totalSeconds(steps); }
  function scalable(s) { return s.kind === 'work' || s.kind === 'rest'; }
  /* Mindestdauer gilt nur, wenn der Schritt vorher laenger war: nie verlaengern */
  function atLeast(s, value) { return Math.max(Math.min(MIN[s.kind], s.duration), value); }

  T.applyIntensity = function (steps, level) {
    steps = steps || [];
    var f = Object.prototype.hasOwnProperty.call(T.INTENSITY, level) ? T.INTENSITY[level] : null;
    if (!f || level === 'normal') return steps.map(copy);
    return steps.map(function (s) {
      var c = copy(s);
      if (scalable(s)) c.duration = atLeast(s, Math.round(s.duration * f[s.kind] / 5) * 5);
      return c;
    });
  };

  /* Arbeit und Pause mit Faktor k, auf 5 s abgerundet */
  function scaled(steps, k) {
    return steps.map(function (s) {
      var c = copy(s);
      if (scalable(s)) c.duration = atLeast(s, Math.floor(s.duration * k / 5) * 5);
      return c;
    });
  }

  /* Groesster Faktor bis 1, bei dem alles ins Budget passt; null, wenn nicht einmal die Mindestdauern passen */
  function scaleToFit(steps, budget) {
    if (total(scaled(steps, 0)) > budget) return null;
    var lo = 0, hi = 1;
    for (var i = 0; i < 30; i++) {
      var mid = (lo + hi) / 2;
      if (total(scaled(steps, mid)) <= budget) lo = mid; else hi = mid;
    }
    return scaled(steps, lo);
  }

  /* Keine Pause am Ende, Uebungen neu durchzaehlen, Rundenzahl je Block neu bestimmen */
  function tidy(steps) {
    var out = steps.slice();
    while (out.length && out[out.length - 1].kind === 'rest') out.pop();
    var maxRound = {};
    out.forEach(function (s) {
      if (s.kind === 'work') maxRound[s.blockIndex] = Math.max(maxRound[s.blockIndex] || 0, s.round);
    });
    var n = 0;
    return out.map(function (s) {
      var c = copy(s);
      if (maxRound[s.blockIndex]) c.rounds = maxRound[s.blockIndex];
      if (s.kind === 'work') c.workIndex = n++;
      return c;
    });
  }

  /* Letzte Runde des Blocks mit den meisten Runden entfernen (bei Gleichstand der hintere Block) */
  function dropLastRound(steps) {
    var block = -1, rounds = 1;
    steps.forEach(function (s) {
      if (s.kind === 'work' && s.rounds > 1 && s.rounds >= rounds) { rounds = s.rounds; block = s.blockIndex; }
    });
    if (block < 0) return null;
    return tidy(steps.filter(function (s) {
      return s.kind === 'prep' || !(s.blockIndex === block && s.round === rounds);
    }));
  }

  function dropLastWork(steps) {
    var out = steps.slice();
    for (var i = out.length - 1; i >= 0; i--) {
      if (out[i].kind === 'work') { out.splice(i, 1); break; }
    }
    return tidy(out);
  }

  /* Harte Obergrenze: erst anteilig kuerzen, dann Runden streichen, dann Pausen weg, dann Uebungen von hinten */
  T.fitBudget = function (steps, budgetSec) {
    steps = steps || [];
    var budget = Math.floor(Number(budgetSec));
    if (!isFinite(budget) || total(steps) <= budget) return steps;
    var base = steps, fit, fewer;
    for (;;) {
      fit = scaleToFit(base, budget);
      if (fit) return fit;
      fewer = dropLastRound(base);
      if (!fewer) break;
      base = fewer;
    }
    base = tidy(base.filter(function (s) { return s.kind !== 'rest'; }));
    for (;;) {
      fit = scaleToFit(base, budget);
      if (fit) return fit;
      if (T.workCount(base) <= 1) break;
      base = dropLastWork(base);
    }
    return scaled(base, 0);
  };

  T.prepareSteps = function (workout, exIndex, opts) {
    opts = opts || {};
    var steps = T.applyIntensity(T.buildSteps(workout, exIndex, { prepSeconds: opts.prepSeconds }), opts.intensity);
    return opts.budgetSec ? T.fitBudget(steps, opts.budgetSec) : steps;
  };

  /* Gesamtdauer ohne Vorbereitung */
  T.workoutSeconds = function (workout, exIndex) {
    return T.totalSeconds(T.buildSteps(workout, exIndex, { prepSeconds: 0 }));
  };

  /* ---------- Mix ---------- */

  /* Zufallszahlen mit Seed (mulberry32), damit ein Mix nachvollziehbar bleibt */
  T.rng = function (seed) {
    var a = (Math.floor(Number(seed)) || 0) >>> 0;
    return function () {
      a = (a + 0x6D2B79F5) >>> 0;
      var t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  };

  T.MIX_THEMES = { core: ['core', 'vacuum'], bauch: ['bauch'], beine: ['beine-po'], ruecken: ['ruecken'], dehnen: ['dehnen'],
    yoga: ['yoga'], ganz: ['ganzkoerper', 'oberkoerper'] };
  T.MIX_LABELS = { core: 'Core', bauch: 'Bauch', beine: 'Beine & Po', ruecken: 'R\u00fccken', dehnen: 'Dehnen', yoga: 'Yoga',
    ganz: 'Ganzk\u00f6rper' };
  /* Farbe des Mix: Ganzkoerper hat keine eigene Workout-Farbe */
  var MIX_COLOR = { core: 'core', bauch: 'bauch', beine: 'beine', ruecken: 'ruecken', dehnen: 'dehnen', yoga: 'yoga', ganz: 'core' };
  var MIX = { warm: 2, main: 5, work: 40, rest: 15, warmWork: 40, coolWork: 60, maxWork: 60, minWork: 20, maxRounds: 4 };
  var LABEL = { warm: 'Aufw\u00e4rmen', main: 'Hauptteil', cool: 'Abschluss' };

  function hasTag(e, tags) { return (e.tags || []).some(function (t) { return tags.indexOf(t) >= 0; }); }
  /* nur Zeit-Uebungen mit Figur, ohne Hilfsmittel ausser Matte und Wand */
  function mixable(e) {
    return e && e.typ === 'zeit' && !!(T.POSES || {})[e.id] &&
      (e.hilfsmittel || []).every(function (h) { return h === 'matte' || h === 'wand'; });
  }
  function shuffle(list, rand) {
    var a = list.slice();
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(rand() * (i + 1)), t = a[i];
      a[i] = a[j]; a[j] = t;
    }
    return a;
  }
  function mixItem(e, duration) {
    return { exId: e.id, name: e.name, duration: duration, rest: null, bilateral: !!e.beidseitig };
  }

  T.makeMix = function (opts, exercises) {
    opts = opts || {};
    var rand = T.rng(opts.seed);
    var themes = (opts.themes || []).filter(function (k) { return Object.prototype.hasOwnProperty.call(T.MIX_THEMES, k); });
    if (!themes.length) themes = ['core'];
    var minutes = Number(opts.minutes) > 0 ? Number(opts.minutes) : 15;
    var pool = (exercises || []).filter(mixable);
    var used = [];
    function take(list, n) {
      var picked = shuffle(list.filter(function (e) { return used.indexOf(e.id) < 0; }), rand).slice(0, n);
      picked.forEach(function (e) { used.push(e.id); });
      return picked;
    }

    var warm = take(pool.filter(function (e) { return hasTag(e, ['aufwaermen']); }), MIX.warm);
    var tags = [].concat.apply([], themes.map(function (k) { return T.MIX_THEMES[k]; }));
    var main = take(pool.filter(function (e) { return hasTag(e, tags); }), MIX.main);
    if (main.length < MIX.main) {
      var fill = T.MIX_THEMES.core.concat(T.MIX_THEMES.ganz);
      main = main.concat(take(pool.filter(function (e) { return hasTag(e, fill); }), MIX.main - main.length));
    }
    var cool = take(pool.filter(function (e) { return hasTag(e, ['dehnen']) && !hasTag(e, ['aufwaermen']); }), 1);

    var blocks = [];
    if (warm.length) blocks.push({ label: LABEL.warm, repeat: 1, items: warm.map(function (e) { return mixItem(e, MIX.warmWork); }) });
    var mainBlock = { label: LABEL.main, repeat: 1, items: main.map(function (e) { return mixItem(e, MIX.work); }) };
    if (main.length) blocks.push(mainBlock);
    if (cool.length) blocks.push({ label: LABEL.cool, repeat: 1, items: [mixItem(cool[0], MIX.coolWork)] });

    var workout = {
      id: 'mix-' + ((Math.floor(Number(opts.seed)) || 0) >>> 0),
      name: 'Mix: ' + themes.map(function (k) { return T.MIX_LABELS[k]; }).join(', '),
      theme: MIX_COLOR[themes[0]], defaultWork: MIX.work, defaultRest: MIX.rest, source: 'mix', blocks: blocks
    };
    if (!main.length) return workout;

    /* Runden so, dass die Zieldauer am besten passt, dann Arbeitszeit im Hauptteil in 5-s-Schritten anpassen */
    var target = minutes * 60;
    var secs = function () { return T.workoutSeconds(workout); };
    var setWork = function (d) { mainBlock.items.forEach(function (i) { i.duration = d; }); };
    var best = 1;
    for (var r = 1; r <= MIX.maxRounds; r++) {
      mainBlock.repeat = r;
      if (secs() <= target) best = r;
    }
    mainBlock.repeat = best;
    var work = MIX.work;
    while (work < MIX.maxWork) {
      setWork(work + 5);
      if (secs() > target) { setWork(work); break; }
      work += 5;
    }
    while (secs() > target && work > MIX.minWork) { work -= 5; setWork(work); }
    return workout;
  };
})(window.Takt);
