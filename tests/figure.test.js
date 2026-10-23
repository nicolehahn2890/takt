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

test('figure svg: Massstab wickelt die Figur ein, Matte bleibt', function () {
  var s = Takt.figure.svg(Takt.figure.frameAt(standPose(), 0), 0.8);
  ok(s.indexOf('scale(0.8)') > 0, 'scale fehlt');
  ok(s.indexOf('<rect x="14" y="166"') === 0, 'Matte zuerst und unskaliert');
});

test('figure bounds: Massstab um die Bodenmitte', function () {
  var b = Takt.figure.bounds(Takt.figure.frameAt(standPose(), 0), 0.5);
  ok(Math.abs(b.minY - 95) < 0.01, 'minY ' + b.minY);
});

test('figure svg: bow zeichnet den Rumpf als Kurve', function () {
  var f = Takt.figure.frameAt(standPose(), 0);
  f.bow = 10;
  var s = Takt.figure.svg(f);
  eq([s.split('<line').length - 1, s.split('<path').length - 1], [10, 1]);
});

test('figure svg: Hilfsmittel werden gezeichnet', function () {
  var s = Takt.figure.svg(Takt.figure.frameAt(standPose(), 0), 1, [{ type: 'stuhl', x: 80, y: 122 }, { type: 'wand', x: 40 }]);
  ok(s.indexOf('data-prop="stuhl"') > 0 && s.indexOf('data-prop="wand"') > 0, 'Hilfsmittel fehlen');
});

test('figure breathAt: Phasen, Restsekunden und Groesse', function () {
  var a = { ein: 4, halten: 2, aus: 6, haltenLeer: 0 };
  var b0 = Takt.figure.breathAt(a, 0);
  eq([b0.phase, b0.left, b0.k], ['ein', 4, 0]);
  var b1 = Takt.figure.breathAt(a, 2000);
  ok(b1.phase === 'ein' && b1.k > 0.3 && b1.k < 0.7, 'Mitte Einatmen');
  eq([Takt.figure.breathAt(a, 4500).phase, Takt.figure.breathAt(a, 4500).k], ['halten', 1]);
  eq(Takt.figure.breathAt(a, 6000).phase, 'aus');
  eq(Takt.figure.breathAt(a, 12000).phase, 'ein');
});

test('figure draw: Atem-Kreis mit Beschriftung', function () {
  var s = Takt.figure.draw({ breath: { ein: 4, halten: 0, aus: 6, haltenLeer: 0 } }, 0);
  ok(s.indexOf('<circle') >= 0 && s.indexOf('Einatmen') >= 0, 'Kreis und Text');
});

test('figure svg: Vorderansicht hat beide Seiten in derselben Farbe', function () {
  var front = Takt.figure.frameAt({ frames: [{ hip: [120, 82], sh: [120, 32], hipW: 8, shW: 13, footN: [130, 162], footF: [110, 162],
    handN: [138, 90], handF: [102, 90], kneeN: -1, kneeF: 1, elbowN: -1, elbowF: 1 }] }, 0);
  ok(Takt.figure.svg(front).indexOf('#9A6B8C') < 0, 'dunkle Farbe in Vorderansicht');
  ok(Takt.figure.svg(Takt.figure.frameAt(standPose(), 0)).indexOf('#9A6B8C') >= 0, 'Seitenansicht braucht die dunkle Farbe');
});

test('figure draw: Pfeil liegt vor der Figur und bewegt sich', function () {
  var p = standPose();
  p.props = [{ type: 'pfeil', x: 150, y: 70, dir: 'links' }];
  var a = Takt.figure.draw(p, 0), b = Takt.figure.draw(p, 1000);
  ok(a.indexOf('data-prop="pfeil"') > a.lastIndexOf('<circle'), 'Pfeil nach dem Kopf gezeichnet');
  ok(a.slice(a.indexOf('data-prop="pfeil"')) !== b.slice(b.indexOf('data-prop="pfeil"')), 'Pfeil bewegt sich nicht');
});

test('figure geometry: Beine lassen sich verkuerzen (Bein zeigt zum Betrachter)', function () {
  var f = Takt.figure.frameAt(standPose(), 0);
  f.lenN = 0.5; f.shinF = 0.5;
  var g = Takt.figure.geometry(f);
  ok(Math.abs(Math.hypot(g.legN.mid[0] - f.hip[0], g.legN.mid[1] - f.hip[1]) - 20) < 0.01, 'Oberschenkel vorne 20');
  ok(Math.abs(Math.hypot(g.legF.mid[0] - f.hip[0], g.legF.mid[1] - f.hip[1]) - 40) < 0.01, 'Oberschenkel hinten 40');
  ok(Math.abs(Math.hypot(g.legF.end[0] - g.legF.mid[0], g.legF.end[1] - g.legF.mid[1]) - 20) < 0.01, 'Unterschenkel hinten 20');
});

test('Figur-Farben Design v2', function () {
  var withArrow = Takt.POSES['vacuum-stehend'];
  ok(withArrow.props.some(function (p) { return p.type === 'pfeil'; }), 'Testhaltung ohne Pfeil');
  var svg = Takt.figure.draw(withArrow, 0);
  ok(svg.indexOf('#BE7B9D') >= 0, 'Pfeil nicht Rose');
  var breath = Takt.figure.draw({ breath: { ein: 4, halten: 0, aus: 4, haltenLeer: 0 } }, 0);
  ok(breath.indexOf('#B794C5') >= 0 && breath.indexOf('rgba(183,148,197,') >= 0, 'Atemkreis nicht Lavendel');
  ok(breath.indexOf('#B88CC0') < 0 && breath.indexOf('184,140,192') < 0, 'alte Lila-Farbe im Atemkreis');
});
