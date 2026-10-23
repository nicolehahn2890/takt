// Uhr wird von Hand gestellt: c.t in Millisekunden
function mkEngine() {
  var c = { t: 0 };
  var steps = [
    { kind: 'work', duration: 30, exId: 'a', name: 'A' },
    { kind: 'rest', duration: 10, exId: null, name: 'Pause' },
    { kind: 'work', duration: 30, exId: 'b', name: 'B' }
  ];
  var e = Takt.Engine(steps, { now: function () { return c.t; } });
  return { c: c, e: e };
}

test('engine: start liefert ersten Schritt', function () {
  var m = mkEngine();
  eq(m.e.start(), [{ type: 'step', index: 0, catchUp: false }]);
  eq(m.e.view().remaining, 30);
});

test('engine: warn bei 10 Restsekunden', function () {
  var m = mkEngine(); m.e.start();
  m.c.t = 19000; eq(m.e.tick(), []);
  m.c.t = 20000; eq(m.e.tick(), [{ type: 'warn' }]);
});

test('engine: count 3 2 1', function () {
  var m = mkEngine(); m.e.start();
  m.c.t = 20000; m.e.tick();
  m.c.t = 27000; eq(m.e.tick(), [{ type: 'count', n: 3 }]);
  m.c.t = 28000; eq(m.e.tick(), [{ type: 'count', n: 2 }]);
  m.c.t = 29000; eq(m.e.tick(), [{ type: 'count', n: 1 }]);
});

test('engine: kein warn wenn ein tick von 12 auf 2 springt', function () {
  var m = mkEngine(); m.e.start();
  m.c.t = 18000; m.e.tick();
  m.c.t = 28000; eq(m.e.tick(), [{ type: 'count', n: 2 }]);
});

test('engine: Wechsel ohne Drift', function () {
  var m = mkEngine(); m.e.start();
  m.c.t = 29000; m.e.tick();
  m.c.t = 30500; eq(m.e.tick(), [{ type: 'step', index: 1, catchUp: false }]);
  eq(m.e.view().remaining, 10);
});

test('engine: catch-up nach 95 s endet mit done', function () {
  var m = mkEngine(); m.e.start();
  m.c.t = 95000; eq(m.e.tick(), [{ type: 'done' }]);
});

test('engine: catch-up ueber zwei Schritte', function () {
  var m = mkEngine(); m.e.start();
  m.c.t = 45000; eq(m.e.tick(), [{ type: 'step', index: 2, catchUp: true }]);
  eq(m.e.view().remaining, 25);
});

test('engine: Pause haelt die Zeit an', function () {
  var m = mkEngine(); m.e.start();
  m.c.t = 5000; eq(m.e.toggle(), true);
  m.c.t = 65000; eq(m.e.tick(), []);
  eq(m.e.view().remaining, 25);
  eq(m.e.toggle(), false);
  m.c.t = 66000; eq(m.e.view().remaining, 24);
  eq(m.e.view().pausedSec, 60);
});

test('engine: next und prev', function () {
  var m = mkEngine(); m.e.start();
  m.c.t = 2000; eq(m.e.next(), [{ type: 'step', index: 1, catchUp: false }]);
  m.c.t = 6000; m.e.prev();
  eq([m.e.view().index, m.e.view().remaining], [1, 10]);
  m.c.t = 7000; m.e.prev();
  eq([m.e.view().index, m.e.view().remaining], [0, 30]);
});

test('engine: next in der Pause bleibt pausiert', function () {
  var m = mkEngine(); m.e.start();
  m.c.t = 5000; m.e.toggle();
  m.c.t = 6000; m.e.next();
  m.c.t = 20000;
  eq([m.e.view().index, m.e.view().remaining, m.e.view().paused], [1, 10, true]);
});

test('engine: adjust plus verlaengert und wird notiert', function () {
  var m = mkEngine(); m.e.start();
  m.c.t = 10000; eq(m.e.adjust(15), []);
  eq(m.e.view().remaining, 35);
  eq(m.e.adjustments, [{ exId: 'a', delta: 15 }]);
});

test('engine: adjust unter null springt weiter', function () {
  var m = mkEngine(); m.e.start();
  m.c.t = 20000; eq(m.e.adjust(-15), [{ type: 'step', index: 1, catchUp: false }]);
  eq(m.e.view().remaining, 10);
});

test('engine: done nach dem letzten Schritt', function () {
  var m = mkEngine(); m.e.start();
  m.e.next(); m.e.next();
  eq(m.e.next(), [{ type: 'done' }]);
  eq(m.e.tick(), []);
  eq(m.e.view().done, true);
  eq(m.e.view().remaining, 0);
});

test('engine: snapshot und restore', function () {
  var m = mkEngine(); m.e.start();
  m.c.t = 40000; m.e.tick();
  var snap = JSON.parse(JSON.stringify(m.e.snapshot()));
  var e2 = Takt.Engine.restore(snap, { now: function () { return m.c.t; } });
  eq([e2.view().index, e2.view().remaining], [2, 30]);
  m.c.t = 41000;
  eq(e2.tick(), []);
  eq(e2.view().remaining, 29);
});

test('engine: remainingTotal und Positionen', function () {
  var m = mkEngine(); m.e.start();
  var v = m.e.view();
  eq([v.remainingTotal, v.workPos, v.workTotal, v.next.kind, v.nextWork.exId], [70, 1, 2, 'rest', 'b']);
  m.c.t = 35000; m.e.tick();
  v = m.e.view();
  eq([v.index, v.remainingTotal, v.workPos], [1, 35, 2]);
});

/* ---------- Teil B: verbrachte Zeit je Schritt ---------- */
function mkSpent() {
  var c = { t: 0 };
  var steps = [
    { kind: 'work', duration: 10, exId: 'a', name: 'A' },
    { kind: 'work', duration: 10, exId: 'b', name: 'B' }
  ];
  return { c: c, e: Takt.Engine(steps, { now: function () { return c.t; } }) };
}

test('engine spent volle Schritte', function () {
  var m = mkSpent(); m.e.start();
  m.c.t = 10000; m.e.tick();
  m.c.t = 20000; m.e.tick();
  eq(m.e.view().done, true);
  eq(m.e.spentSeconds(), [10, 10]);
  eq(m.e.view().activeSec, 20);
});

test('engine spent Ueberspringen', function () {
  var m = mkSpent(); m.e.start();
  m.c.t = 4000; m.e.next();
  eq(m.e.spentSeconds(), [4, 0]);
  m.c.t = 6000;
  eq(m.e.view().activeSec, 6);
});

test('engine spent ohne Pausieren', function () {
  var m = mkSpent(); m.e.start();
  m.c.t = 5000; m.e.pause();
  m.c.t = 35000; m.e.resume();
  m.c.t = 40000; m.e.tick();
  eq(m.e.view().activeSec, 10);
  eq(m.e.spentSeconds()[0], 10);
});

test('engine spent nach Ende gesperrt', function () {
  var m = mkSpent(); m.e.start();
  m.c.t = 20000 + 600000; m.e.tick();
  eq(m.e.view().done, true);
  eq(m.e.view().activeSec, 20);
});

test('engine spent mit +15', function () {
  var m = mkSpent(); m.e.start();
  m.c.t = 2000; m.e.adjust(15);
  m.c.t = 25000; m.e.tick();
  eq(m.e.spentSeconds()[0], 25);
});

test('engine spent bleibt nach restore', function () {
  var m = mkSpent(); m.e.start();
  m.c.t = 10000; m.e.tick();
  m.c.t = 13000;
  var snap = m.e.snapshot();
  var e2 = Takt.Engine.restore(snap, { now: function () { return m.c.t; } });
  m.c.t = 20000; e2.tick();
  eq(e2.view().done, true);
  eq(e2.spentSeconds(), [10, 10]);
  eq(e2.view().activeSec, 20);
});

test('engine restore alter Snapshot ohne spent', function () {
  var m = mkSpent(); m.e.start();
  m.c.t = 3000;
  var snap = m.e.snapshot();
  delete snap.spent;
  var e2 = Takt.Engine.restore(snap, { now: function () { return m.c.t; } });
  ok(e2.view().activeSec >= 0, 'activeSec fehlt');
  eq(e2.spentSeconds().length, 2);
});
