test('fmt formatiert Sekunden als m:ss', function () {
  eq(Takt.fmt(0), '0:00');
  eq(Takt.fmt(5), '0:05');
  eq(Takt.fmt(65), '1:05');
  eq(Takt.fmt(600), '10:00');
  eq(Takt.fmt(-3), '0:00');
  eq(Takt.fmt(59.9), '0:59');
});

test('esc maskiert HTML-Zeichen', function () {
  eq(Takt.esc('<a href="x">&\''), '&lt;a href=&quot;x&quot;&gt;&amp;&#39;');
});

test('uid ist eindeutig und beginnt mit dem Praefix', function () {
  var a = Takt.uid('w'), b = Takt.uid('w');
  ok(a !== b, 'zwei uids gleich');
  ok(a.indexOf('w') === 0 && b.indexOf('w') === 0, 'Praefix fehlt');
});

test('silenceBounds schneidet Stille vorn und hinten ab', function () {
  var sr = 100, d = [];
  for (var i = 0; i < 200; i++) d.push(i >= 20 && i < 60 ? 0.5 : 0);
  var b = Takt.silenceBounds(d, sr, 0.01, 0.03);
  eq([b.start.toFixed(2), b.end.toFixed(2)], ['0.17', '0.63']);
});

test('silenceBounds bei reiner Stille liefert alles', function () {
  var b = Takt.silenceBounds([0, 0, 0, 0], 2, 0.01, 0.03);
  eq([b.start, b.end], [0, 2]);
});
