// Schritte des Test-Workouts mit 5 s Vorbereitung:
// 0 prep hampelmann, 1 work hampelmann, 2 rest, 3 work plank, ...
function annSteps() {
  return Takt.buildSteps(testWorkout(), Takt.indexExercises(Takt.EXERCISES), { prepSeconds: 5 });
}
function annCtx(mode, opts) {
  opts = opts || {};
  return {
    steps: opts.steps || annSteps(),
    settings: { announce: mode, sounds: opts.sounds !== false },
    hasClip: opts.hasClip || function () { return true; }
  };
}
function stepEv(i) { return { type: 'step', index: i, catchUp: false }; }
var B = function (tone) { return { type: 'beep', tone: tone }; };
var C = function (key) { return { type: 'clip', key: key }; };

test('announce full: Uebung', function () {
  eq(Takt.announce(stepEv(1), annCtx('full')), [B('go'), C('ex_hampelmann')]);
});
test('announce full: Pause mit naechster Uebung', function () {
  eq(Takt.announce(stepEv(2), annCtx('full')), [C('pause'), C('next'), C('ex_plank')]);
});
test('announce full: Pause ohne Datei der naechsten Uebung', function () {
  var ctx = annCtx('full', { hasClip: function (k) { return k !== 'ex_plank'; } });
  eq(Takt.announce(stepEv(2), ctx), [C('pause')]);
});
test('announce full: Vorbereitung', function () {
  eq(Takt.announce(stepEv(0), annCtx('full')), [C('ready'), C('ex_hampelmann')]);
});
test('announce full: warn, count, done', function () {
  var ctx = annCtx('full');
  eq(Takt.announce({ type: 'warn' }, ctx), [C('warn10')]);
  eq(Takt.announce({ type: 'count', n: 3 }, ctx), [B('tick')]);
  eq(Takt.announce({ type: 'done' }, ctx), [B('end'), C('done')]);
});
test('announce: eigene Uebung ohne Datei nur Ton', function () {
  var steps = [{ kind: 'work', duration: 20, exId: 'x', name: 'Mein Ding' }, { kind: 'work', duration: 20, exId: null, name: 'Ohne Id' }];
  var ctx = annCtx('full', { steps: steps, hasClip: function (k) { return k !== 'ex_x'; } });
  eq(Takt.announce(stepEv(0), ctx), [B('go')]);
  eq(Takt.announce(stepEv(1), ctx), [B('go')]);
});
test('announce name: nur Uebungsnamen', function () {
  var ctx = annCtx('name');
  eq(Takt.announce(stepEv(1), ctx), [B('go'), C('ex_hampelmann')]);
  eq(Takt.announce(stepEv(2), ctx), [B('rest')]);
  eq(Takt.announce(stepEv(0), ctx), [C('ex_hampelmann')]);
  eq(Takt.announce({ type: 'warn' }, ctx), []);
  eq(Takt.announce({ type: 'count', n: 2 }, ctx), [B('tick')]);
  eq(Takt.announce({ type: 'done' }, ctx), [B('end')]);
});
test('announce beeps: nur Toene', function () {
  var ctx = annCtx('beeps');
  eq(Takt.announce(stepEv(1), ctx), [B('go')]);
  eq(Takt.announce(stepEv(2), ctx), [B('rest')]);
  eq(Takt.announce(stepEv(0), ctx), []);
  eq(Takt.announce({ type: 'warn' }, ctx), [B('warn')]);
  eq(Takt.announce({ type: 'count', n: 1 }, ctx), [B('tick')]);
  eq(Takt.announce({ type: 'done' }, ctx), [B('end')]);
});
test('announce silent: nichts', function () {
  var ctx = annCtx('silent');
  eq(Takt.announce(stepEv(1), ctx), []);
  eq(Takt.announce({ type: 'done' }, ctx), []);
});
test('announce sounds aus: Toene fallen weg', function () {
  var ctx = annCtx('full', { sounds: false });
  eq(Takt.announce(stepEv(1), ctx), [C('ex_hampelmann')]);
  eq(Takt.announce({ type: 'count', n: 3 }, ctx), []);
  eq(Takt.announce({ type: 'done' }, ctx), [C('done')]);
});
test('VOICE_LINES enthaelt die festen Saetze', function () {
  eq(Object.keys(Takt.VOICE_LINES).sort(), ['done', 'go', 'left', 'next', 'pause', 'ready', 'right', 'side', 'warn10']);
});

/* ---------- Schritt 4: Seitenwechsel-Ansagen ---------- */
test('announce side Reihenfolge', function () {
  var steps = [{ kind: 'work', duration: 40, exId: 'seitstuetz', name: 'Seitstuetz', bilateral: true }];
  eq(Takt.announce({ type: 'side', index: 0 }, annCtx('full', { steps: steps })), [B('go'), C('side'), C('right')]);
  eq(Takt.announce({ type: 'side', index: 0 }, annCtx('beeps', { steps: steps })), [B('go')]);
  eq(Takt.announce({ type: 'side', index: 0 }, annCtx('name', { steps: steps })), [B('go')]);
});

test('announce Links nach Name', function () {
  var steps = [{ kind: 'work', duration: 40, exId: 'seitstuetz', name: 'Seitstuetz', bilateral: true }];
  eq(Takt.announce(stepEv(0), annCtx('full', { steps: steps })), [B('go'), C('ex_seitstuetz'), C('left')]);
});
