/* Takt: entscheidet je Engine-Ereignis, welche Sprachdateien und Toene kommen.
   Rein logisch, spielt nichts ab. Modi: full, name, beeps, silent. */
window.Takt = window.Takt || {};
(function (T) {
  'use strict';

  T.announce = function (ev, ctx) {
    ctx = ctx || {};
    var settings = ctx.settings || {};
    var mode = settings.announce || 'full';
    var sounds = settings.sounds !== false;
    var has = ctx.hasClip || function () { return false; };
    var steps = ctx.steps || [];
    if (mode === 'silent' || !ev) return [];

    var out = [];
    function beep(tone) { out.push({ type: 'beep', tone: tone }); }
    function clip(key) { out.push({ type: 'clip', key: key }); }
    function exKey(step) { return step && step.exId ? 'ex_' + step.exId : null; }
    function nextWorkAfter(i) {
      for (var j = i + 1; j < steps.length; j++) if (steps[j].kind === 'work') return steps[j];
      return null;
    }

    if (ev.type === 'step') {
      var i = ev.index != null ? ev.index : ctx.index;
      var s = steps[i];
      if (!s) return [];
      if (s.kind === 'work') {
        beep('go');
        if (mode !== 'beeps') clip(exKey(s));
      } else if (s.kind === 'rest') {
        if (mode === 'full') {
          clip('pause');
          var nk = exKey(nextWorkAfter(i));
          if (nk && has(nk)) { clip('next'); clip(nk); }
        } else {
          beep('rest');
        }
      } else if (s.kind === 'prep') {
        if (mode === 'full') { clip('ready'); clip(exKey(s)); }
        else if (mode === 'name') clip(exKey(s));
      }
    } else if (ev.type === 'warn') {
      if (mode === 'full') clip('warn10');
      else if (mode === 'beeps') beep('warn');
    } else if (ev.type === 'count') {
      beep('tick');
    } else if (ev.type === 'done') {
      beep('end');
      if (mode === 'full') clip('done');
    }

    return out.filter(function (a) {
      if (a.type === 'beep') return sounds;
      return !!a.key && has(a.key);
    });
  };
})(window.Takt);
