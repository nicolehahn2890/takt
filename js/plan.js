/* Takt: Workout -> Schrittliste (prep, work, rest) */
window.Takt = window.Takt || {};
(function (T) {
  'use strict';

  function num(v, fallback) { return (typeof v === 'number' && isFinite(v)) ? v : fallback; }

  T.indexExercises = function (list) {
    var map = {};
    (list || []).forEach(function (e) { if (e && e.id) map[e.id] = e; });
    return map;
  };

  T.buildSteps = function (workout, exIndex, opts) {
    opts = opts || {};
    exIndex = exIndex || {};
    var defWork = num(workout.defaultWork, 40);
    var defRest = num(workout.defaultRest, 10);

    function nameOf(item) {
      if (item.name) return item.name;
      var ex = item.exId ? exIndex[item.exId] : null;
      return (ex && ex.name) || '\u00dcbung';
    }

    // Alle Uebungen in Reihenfolge, Runden aufgeloest
    var works = [];
    (workout.blocks || []).forEach(function (block, bi) {
      var items = block.items || [];
      if (!items.length) return;
      var rounds = Math.max(1, Math.min(10, Math.round(num(block.repeat, 1))));
      for (var r = 1; r <= rounds; r++) {
        items.forEach(function (item) { works.push({ item: item, bi: bi, round: r, rounds: rounds }); });
      }
    });

    var steps = [];
    var prep = Math.max(0, Math.round(num(opts.prepSeconds, 0)));
    if (prep > 0 && works.length) {
      var first = works[0];
      steps.push({ kind: 'prep', duration: prep, exId: first.item.exId || null, name: nameOf(first.item),
        workIndex: null, round: 1, rounds: first.rounds, blockIndex: first.bi });
    }

    works.forEach(function (w, i) {
      steps.push({ kind: 'work', duration: Math.max(1, Math.round(num(w.item.duration, defWork))),
        exId: w.item.exId || null, name: nameOf(w.item),
        workIndex: i, round: w.round, rounds: w.rounds, blockIndex: w.bi });
      var rest = Math.round(num(w.item.rest, defRest));
      if (rest > 0 && i < works.length - 1) {
        steps.push({ kind: 'rest', duration: rest, exId: null, name: 'Pause',
          workIndex: null, round: w.round, rounds: w.rounds, blockIndex: w.bi });
      }
    });
    return steps;
  };

  T.totalSeconds = function (steps) {
    return (steps || []).reduce(function (sum, s) { return sum + s.duration; }, 0);
  };

  T.workCount = function (steps) {
    return (steps || []).filter(function (s) { return s.kind === 'work'; }).length;
  };
})(window.Takt);
