function fdist(p, q) { return Math.hypot(p[0] - q[0], p[1] - q[1]); }
function standPose() {
  return { hold: 0.5, move: 1, frames: [
    { hip: [100, 100], sh: [100, 50], footN: [100, 166], footF: [100, 166], handN: [140, 60], handF: [140, 60],
      kneeN: -1, kneeF: -1, elbowN: 1, elbowF: 1, footDirN: 0, footDirF: 0 },
    { hip: [100, 120] }
  ] };
}

test('figure ik: Gliedlaengen stimmen und Ziel wird erreicht', function () {
  var r = Takt.figure.ik([0, 0], [50, 30], 40, 40, -1);
  ok(Math.abs(fdist([0, 0], r.mid) - 40) < 0.01, 'Oberes Glied');
  ok(Math.abs(fdist(r.mid, r.end) - 40) < 0.01, 'Unteres Glied');
  ok(fdist(r.end, [50, 30]) < 0.01, 'Ziel');
});

test('figure ik: ausser Reichweite gestreckt', function () {
  var r = Takt.figure.ik([0, 0], [200, 0], 40, 40, 1);
  ok(Math.abs(r.mid[0] - 40) < 0.1 && Math.abs(r.mid[1]) < 1, 'Mitte auf der Linie');
  ok(Math.abs(r.end[0] - 80) < 0.1, 'Ende bei voller Laenge');
});

test('figure ik: Beugerichtung', function () {
  ok(Takt.figure.ik([0, 0], [50, 0], 40, 40, -1).mid[1] < 0, 'bend -1 nach oben');
  ok(Takt.figure.ik([0, 0], [50, 0], 40, 40, 1).mid[1] > 0, 'bend +1 nach unten');
});

test('figure frameAt: Start, Ziel, Mitte, zurueck', function () {
  var p = standPose();
  eq(Takt.figure.frameAt(p, 0).hip, [100, 100]);
  var b = Takt.figure.frameAt(p, 1500);
  eq([b.hip, b.sh], [[100, 120], [100, 50]]);
  var m = Takt.figure.frameAt(p, 1000).hip[1];
  ok(m > 100 && m < 120, 'Mitte zwischen den Haltungen');
  eq(Takt.figure.frameAt(p, 3000).hip, [100, 100]);
});

test('figure frameAt: einzelne Haltung atmet hoechstens 1,5 px', function () {
  var p = { frames: [standPose().frames[0]] };
  for (var t = 0; t <= 4000; t += 100) {
    var f = Takt.figure.frameAt(p, t);
    ok(fdist(f.sh, [100, 50]) <= 1.5 && fdist(f.hip, [100, 100]) <= 1.5, 'Abweichung bei ' + t);
  }
});

test('figure svg: 11 Striche, 1 Kopf, 1 Matte, kein NaN', function () {
  var s = Takt.figure.svg(Takt.figure.frameAt(standPose(), 0));
  eq([s.split('<line').length - 1, s.split('<circle').length - 1, s.split('<rect').length - 1], [11, 1, 1]);
  ok(s.indexOf('NaN') < 0, 'NaN im SVG');
});

test('figure bounds: Kopf oben eingerechnet', function () {
  var b = Takt.figure.bounds(Takt.figure.frameAt(standPose(), 0));
  ok(Math.abs(b.minY - 24) < 0.01, 'minY ' + b.minY);
  ok(b.maxY >= 166, 'Fuss am Boden');
});
