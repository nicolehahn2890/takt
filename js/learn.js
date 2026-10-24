/* Takt: lernende Dauer. Wurde eine Uebung in den letzten 3 Trainings desselben Workouts jedes Mal
   verlaengert (oder jedes Mal gekuerzt), schlaegt der Fertig-Screen eine neue Standard-Dauer vor.
   data.learn[learnKey(workoutId, exId)]: { since: Protokoll-Laenge bei "Ja", snoozeUntil: Trainings dieses Workouts bis wieder gefragt wird } */
window.Takt = window.Takt || {};
(function (T) {
  'use strict';

  var LAST = 3, SNOOZE = 10, MIN = 10, MAX = 600;

  T.LEARN_SNOOZE = SNOOZE;

  T.learnKey = function (workoutId, exId) { return workoutId + '|' + exId; };

  function itemsOf(w) {
    var out = [];
    (w && Array.isArray(w.blocks) ? w.blocks : []).forEach(function (b) {
      var rep = Math.max(1, Number(b && b.repeat) || 1);
      (b && Array.isArray(b.items) ? b.items : []).forEach(function (it) { if (it && it.exId) out.push({ item: it, repeat: rep }); });
    });
    return out;
  }

  function durOf(item, w) {
    var d = Number(item.duration);
    return d > 0 ? d : (Number(w.defaultWork) || 40);
  }

  /* Anzahl Trainings dieses Workouts im Protokoll (auch angepasste) */
  T.learnCount = function (log, workoutId) {
    return (Array.isArray(log) ? log : []).filter(function (e) { return e && e.workoutId === workoutId; }).length;
  };

  /* Hoechstens ein Vorschlag: die Uebung mit der groessten Aenderung, sonst null */
  T.learnSuggestion = function (log, workout, learn, exIndex) {
    if (!workout || !workout.id || workout.source === 'mix') return null;
    log = Array.isArray(log) ? log : [];
    learn = learn || {};
    var count = T.learnCount(log, workout.id);
    // Uebungen des Workouts in Reihenfolge, mit Vorkommen (Runden) und jetziger Dauer des ersten Eintrags
    var order = [], info = {};
    itemsOf(workout).forEach(function (x) {
      var id = x.item.exId;
      if (!info[id]) { info[id] = { n: 0, from: durOf(x.item, workout) }; order.push(id); }
      info[id].n += x.repeat;
    });
    var best = null;
    order.forEach(function (id) {
      var ex = exIndex ? exIndex[id] : null;
      if (!ex) return;
      var st = learn[T.learnKey(workout.id, id)] || {};
      if (typeof st.snoozeUntil === 'number' && count <= st.snoozeUntil) return;
      var since = typeof st.since === 'number' ? st.since : 0;
      var nets = [];
      log.forEach(function (e, i) {
        if (i < since || !e || e.workoutId !== workout.id || e.adjusted) return;
        nets.push((Array.isArray(e.adjustments) ? e.adjustments : []).reduce(function (s, a) {
          return a && a.exId === id && typeof a.delta === 'number' && isFinite(a.delta) ? s + a.delta : s;
        }, 0));
      });
      nets = nets.slice(-LAST);
      if (nets.length < LAST) return;
      var dir = nets.every(function (n) { return n > 0; }) ? 1 : nets.every(function (n) { return n < 0; }) ? -1 : 0;
      if (!dir) return;
      var avg = nets.reduce(function (s, n) { return s + n; }, 0) / LAST / info[id].n;
      var from = info[id].from;
      var to = Math.min(MAX, Math.max(MIN, Math.round((from + avg) / 5) * 5));
      if (to === from) return;
      if (!best || Math.abs(to - from) > Math.abs(best.to - best.from)) best = { exId: id, name: ex.name, from: from, to: to, direction: dir };
    });
    return best;
  };

  /* Neue Kopie des Workouts, in der alle Eintraege der Uebung die neue Dauer haben */
  T.applyLearn = function (workout, exId, to) {
    var c = JSON.parse(JSON.stringify(workout));
    (c.blocks || []).forEach(function (b) {
      (b.items || []).forEach(function (it) { if (it && it.exId === exId) it.duration = to; });
    });
    return c;
  };
})(window.Takt);
