/* Takt: Timer-Engine. Rechnet immer aus Zeitstempeln, zaehlt nie hoch.
   Liefert Ereignisse: step, warn, count, side (Seitenwechsel), done. Keine Browser-Abhaengigkeit. */
window.Takt = window.Takt || {};
(function (T) {
  'use strict';

  function clone(o) { return JSON.parse(JSON.stringify(o)); }

  function make(st, opts) {
    var now = (opts && opts.now) || function () { return Date.now(); };
    // Verbrachte Zeit je Schritt (ms, ohne Pausieren); aeltere gespeicherte Staende haben sie noch nicht
    if (!Array.isArray(st.spent) || st.spent.length !== st.steps.length) st.spent = st.steps.map(function () { return 0; });
    // Seitenwechsel: Index des Schritts, dessen Wechsel schon kam (-1 = noch nicht in diesem Durchlauf)
    if (typeof st.sideDone !== 'number') st.sideDone = -1;

    function durMs(i) { return st.durations[i] * 1000; }
    function elapsedMs() {
      var ref = st.paused ? st.pausedAt : now();
      return Math.max(0, ref - st.stepStart);
    }
    function remainingSec() {
      if (st.index < 0 || st.done) return 0;
      return Math.max(0, Math.ceil((durMs(st.index) - elapsedMs()) / 1000));
    }
    /* Zeit eines Schritts verbuchen, hoechstens seine Dauer */
    function book(i, ms) {
      if (i >= 0 && i < st.spent.length) st.spent[i] += Math.max(0, Math.min(ms, durMs(i)));
    }
    function finish() {
      if (!st.done && st.index >= 0) book(st.index, elapsedMs());
      st.done = true;
      if (st.paused) { st.pausedMs += now() - st.pauseBegan; st.paused = false; }
      return [{ type: 'done' }];
    }
    /* Manueller Sprung: neuer Schritt beginnt jetzt, Pause bleibt bestehen */
    function go(i) {
      if (i >= st.steps.length) return finish();
      if (st.index >= 0) book(st.index, elapsedMs());
      var t = now();
      st.index = i;
      st.sideDone = -1;
      st.stepStart = t;
      if (st.paused) st.pausedAt = t;
      st.lastWhole = st.durations[i];
      return [{ type: 'step', index: i }];
    }
    function isWork(i) { return st.steps[i] && st.steps[i].kind === 'work'; }
    function isBi(i) { return isWork(i) && !!st.steps[i].bilateral; }
    function isAtem(i) { return isWork(i) && !!st.steps[i].atem; }
    /* Seitenwechsel zur Haelfte der aktuellen Dauer, je Durchlauf eines Schritts genau einmal */
    function sideEvent() {
      var i = st.index;
      if (!isBi(i) || st.sideDone === i || elapsedMs() < durMs(i) / 2) return [];
      st.sideDone = i;
      return [{ type: 'side', index: i }];
    }

    var api = {
      steps: st.steps,
      adjustments: st.adjustments,

      start: function () {
        if (st.index >= 0 || st.done) return [];
        var t = now();
        st.startedAt = t;
        if (!st.steps.length) return finish();
        st.index = 0;
        st.stepStart = t;
        st.lastWhole = st.durations[0];
        return [{ type: 'step', index: 0 }];
      },

      tick: function () {
        if (st.index < 0 || st.done || st.paused) return [];
        var advanced = 0;
        while (elapsedMs() >= durMs(st.index)) {
          var endAt = st.stepStart + durMs(st.index);
          if (st.index + 1 >= st.steps.length) return finish();
          book(st.index, durMs(st.index));
          st.index++;
          st.sideDone = -1;
          st.stepStart = endAt;   // Zeit mitnehmen: kein Drift
          advanced++;
        }
        var rem = remainingSec();
        if (advanced) {
          st.lastWhole = rem;
          return [{ type: 'step', index: st.index }].concat(sideEvent());
        }
        var ev = [];
        var prev = st.lastWhole == null ? st.durations[st.index] : st.lastWhole;
        if (rem < prev) {
          var dur = st.durations[st.index];
          // "Noch zehn Sekunden" entfaellt, wenn der Seitenwechsel weniger als 4 s entfernt ist
          var nearSide = isBi(st.index) && Math.abs(dur / 2 - 10) < 4;
          // Atem-Uebungen: kein "Noch zehn Sekunden" und kein 3-2-1, die Atem-Toene fuehren
          if (isWork(st.index) && dur >= 20 && prev > 10 && rem <= 10 && rem > 3 && !nearSide && !isAtem(st.index)) ev.push({ type: 'warn' });
          if (dur > 3 && !isAtem(st.index)) {
            var n = null;
            [3, 2, 1].forEach(function (k) { if (prev > k && rem <= k) n = k; });
            if (n !== null) ev.push({ type: 'count', n: n });
          }
        }
        st.lastWhole = rem;
        return sideEvent().concat(ev);
      },

      pause: function () {
        if (st.paused || st.index < 0 || st.done) return;
        var t = now();
        st.paused = true;
        st.pausedAt = t;
        st.pauseBegan = t;
      },

      resume: function () {
        if (!st.paused) return;
        var t = now();
        st.stepStart += t - st.pausedAt;
        st.pausedMs += t - st.pauseBegan;
        st.paused = false;
        st.pausedAt = null;
        st.pauseBegan = null;
      },

      toggle: function () {
        if (st.paused) api.resume(); else api.pause();
        return st.paused;
      },

      next: function () {
        if (st.index < 0 || st.done) return [];
        return go(st.index + 1);
      },

      /* Vorzeitig beenden (Training zaehlt schon): bucht die laufende Uebung und endet wie am Schluss */
      stop: function () {
        if (st.index < 0 || st.done) return [];
        return finish();
      },

      prev: function () {
        if (st.index < 0 || st.done) return [];
        if (elapsedMs() > 3000) return go(st.index);
        return go(Math.max(0, st.index - 1));
      },

      adjust: function (delta) {
        if (st.index < 0 || st.done) return [];
        if (isWork(st.index)) st.adjustments.push({ exId: st.steps[st.index].exId, delta: delta });
        var nd = st.durations[st.index] + delta;
        if (nd * 1000 <= elapsedMs()) return go(st.index + 1);
        st.durations[st.index] = Math.max(1, nd);
        st.lastWhole = remainingSec();
        return [];
      },

      view: function () {
        var i = st.index, j, k;
        var workTotal = 0, workPos = 0, nextWork = null;
        for (j = 0; j < st.steps.length; j++) if (isWork(j)) workTotal++;
        for (j = Math.max(i + 1, 0); j < st.steps.length; j++) {
          if (isWork(j)) { nextWork = st.steps[j]; break; }
        }
        var posIndex = (i >= 0 && isWork(i)) ? i : (nextWork ? j : -1);
        if (posIndex < 0) workPos = workTotal;
        else for (k = 0; k <= posIndex; k++) if (isWork(k)) workPos++;
        var rem = remainingSec();
        var total = st.done ? 0 : rem;
        if (!st.done) for (j = Math.max(i + 1, 0); j < st.steps.length; j++) total += st.durations[j];
        var pausedMs = st.pausedMs + (st.paused ? now() - st.pauseBegan : 0);
        var activeMs = st.spent.reduce(function (a, b) { return a + b; }, 0);
        if (i >= 0 && !st.done) activeMs += Math.min(elapsedMs(), durMs(i));
        return {
          index: i,
          step: i >= 0 ? st.steps[i] : null,
          next: st.steps[i + 1] || null,
          nextWork: nextWork,
          remaining: rem,
          duration: i >= 0 ? st.durations[i] : 0,
          paused: st.paused,
          done: st.done,
          workPos: workPos,
          workTotal: workTotal,
          remainingTotal: total,
          startedAt: st.startedAt,
          pausedSec: Math.round(pausedMs / 1000),
          side: isBi(i) && !st.done ? (st.sideDone === i ? 'rechts' : 'links') : null,
          elapsedMs: i >= 0 && !st.done ? elapsedMs() : 0,
          activeSec: Math.round(activeMs / 1000)
        };
      },

      spentSeconds: function () { return st.spent.map(function (ms) { return Math.round(ms / 1000); }); },

      snapshot: function () { return clone(st); }
    };
    return api;
  }

  T.Engine = function (steps, opts) {
    var list = clone(steps || []);
    return make({
      steps: list,
      durations: list.map(function (s) { return s.duration; }),
      index: -1, stepStart: 0, startedAt: null,
      paused: false, pausedAt: null, pauseBegan: null, pausedMs: 0,
      done: false, lastWhole: null, adjustments: [], spent: list.map(function () { return 0; })
    }, opts);
  };

  T.Engine.restore = function (snap, opts) { return make(clone(snap), opts); };
})(window.Takt);
