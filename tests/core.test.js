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
