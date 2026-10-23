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
})(window.Takt);
