/* Takt: animierte Figur. Reine Rechnung (ik, frameAt, svg, bounds) ist in Node getestet;
   mount/unmount/still laufen nur im Browser. Haltungen stehen in data/poses.js. */
window.Takt = window.Takt || {};
(function (T) {
  'use strict';

  var SEG = { thigh: 40, shin: 40, upper: 30, fore: 28, neck: 6, head: 10 };
  var COL = { near: '#E3A3BF', far: '#9A6B8C', head: '#F0C4D6', mat: 'rgba(255,255,255,.07)', prop: '#4a3a44', arrow: '#BE7B9D', wall: 'rgba(255,255,255,.05)' };
  var DEFAULT_SCALE = 0.85;
  var WID = { torso: 17, thigh: 11, shin: 10, upper: 9, fore: 8, foot: 7, girdle: 9 };
  var FOOT = 9;
  var VIEWBOX = '12 18 216 160';

  /* Zweigelenk-Kette: Mittelgelenk zwischen a und Ziel c; ausser Reichweite gestreckt */
  function ik(a, c, l1, l2, bend) {
    var dx = c[0] - a[0], dy = c[1] - a[1];
    var d = Math.hypot(dx, dy);
    d = Math.max(Math.abs(l1 - l2) + 0.01, Math.min(d, l1 + l2 - 0.01));
    var ang = Math.atan2(dy, dx);
    var cosA = (l1 * l1 + d * d - l2 * l2) / (2 * l1 * d);
    var A = Math.acos(Math.max(-1, Math.min(1, cosA)));
    var t = ang + (bend < 0 ? -A : A);
    var mid = [a[0] + l1 * Math.cos(t), a[1] + l1 * Math.sin(t)];
    var t2 = Math.atan2(c[1] - mid[1], c[0] - mid[0]);
    return { mid: mid, end: [mid[0] + l2 * Math.cos(t2), mid[1] + l2 * Math.sin(t2)] };
  }

  function lerp(a, b, k) { return a + (b - a) * k; }
  function copy(f) {
    var o = {};
    Object.keys(f).forEach(function (k) { o[k] = Array.isArray(f[k]) ? f[k].slice() : f[k]; });
    return o;
  }

  /* Spaetere Frames erben fehlende Werte vom vorigen */
  function resolve(frames) {
    var out = [], prev = {};
    (frames || []).forEach(function (f) {
      var o = copy(prev);
      Object.keys(f).forEach(function (k) { o[k] = Array.isArray(f[k]) ? f[k].slice() : f[k]; });
      out.push(o);
      prev = o;
    });
    return out;
  }

  function mixFrame(A, B, k) {
    var o = copy(A);
    Object.keys(B).forEach(function (key) {
      var v = A[key], w = B[key];
      if (Array.isArray(v) && Array.isArray(w)) o[key] = [lerp(v[0], w[0], k), lerp(v[1], w[1], k)];
      else if (typeof v === 'number' && typeof w === 'number') o[key] = lerp(v, w, k);
      else if (v === undefined) o[key] = w;
    });
    return o;
  }

  function ease(u) { return u * u * (3 - 2 * u); }

  function frameAt(pose, ms) {
    var fr = resolve(pose && pose.frames);
    if (!fr.length) return null;
    var t = Math.max(0, ms) / 1000;
    if (fr.length === 1) {
      // Halte-Uebung: leichte Atembewegung der Schultern
      var f = copy(fr[0]);
      var b = Math.sin(t * 2 * Math.PI / 4) * 1.4;
      f.sh = [f.sh[0], f.sh[1] - b];
      return f;
    }
    var hold = pose.hold != null ? pose.hold : 0.6;
    var move = pose.move != null ? pose.move : 0.9;
    var seg = hold + move, n = fr.length;
    var x = t % (seg * n);
    var i = Math.min(n - 1, Math.floor(x / seg));
    var u = x - i * seg;
    if (u < hold) return copy(fr[i]);
    return mixFrame(fr[i], fr[(i + 1) % n], ease((u - hold) / move));
  }

  /* Alle Punkte der Figur berechnen */
  function geometry(F) {
    var dx = F.sh[0] - F.hip[0], dy = F.sh[1] - F.hip[1];
    var len = Math.hypot(dx, dy) || 1;
    var dir = [dx / len, dy / len];
    var perp = [-dir[1], dir[0]];
    var hw = F.hipW || 0, sw = F.shW || 0;
    var hipN = [F.hip[0] + perp[0] * hw, F.hip[1] + perp[1] * hw];
    var hipF = [F.hip[0] - perp[0] * hw, F.hip[1] - perp[1] * hw];
    var shN = [F.sh[0] + perp[0] * sw, F.sh[1] + perp[1] * sw];
    var shF = [F.sh[0] - perp[0] * sw, F.sh[1] - perp[1] * sw];
    // lenN/lenF verkuerzen das ganze Bein, shinN/shinF nur den Unterschenkel (zeigt zum Betrachter)
    var ln = F.lenN || 1, lf = F.lenF || 1;
    var legN = ik(hipN, F.footN, SEG.thigh * ln, SEG.shin * ln * (F.shinN || 1), F.kneeN || -1);
    var legF = ik(hipF, F.footF, SEG.thigh * lf, SEG.shin * lf * (F.shinF || 1), F.kneeF || -1);
    var armN = ik(shN, F.handN, SEG.upper, SEG.fore, F.elbowN || 1);
    var armF = ik(shF, F.handF, SEG.upper, SEG.fore, F.elbowF || 1);
    function tip(p, deg) {
      var r = (deg || 0) * Math.PI / 180;
      return [p[0] + FOOT * Math.cos(r), p[1] + FOOT * Math.sin(r)];
    }
    var hd = F.headDir || dir;
    var hl = Math.hypot(hd[0], hd[1]) || 1;
    var head = [F.sh[0] + hd[0] / hl * (SEG.neck + SEG.head), F.sh[1] + hd[1] / hl * (SEG.neck + SEG.head)];
    return {
      hipN: hipN, hipF: hipF, shN: shN, shF: shF, hip: F.hip, sh: F.sh,
      legN: legN, legF: legF, armN: armN, armF: armF,
      toeN: tip(legN.end, F.footDirN), toeF: tip(legF.end, F.footDirF),
      head: head, girdle: sw > 0 || hw > 0
    };
  }

  function n1(v) { return (Math.round(v * 10) / 10).toString(); }
  function line(p, q, w, c) {
    return '<line x1="' + n1(p[0]) + '" y1="' + n1(p[1]) + '" x2="' + n1(q[0]) + '" y2="' + n1(q[1]) +
      '" stroke="' + c + '" stroke-width="' + w + '" stroke-linecap="round"/>';
  }

  /* Hilfsmittel (Stuhl, Wand, Sofa, Tisch, Stufe) hinter der Figur */
  function rect(x, y, w, h, type) {
    return '<rect data-prop="' + type + '" x="' + n1(x) + '" y="' + n1(y) + '" width="' + n1(w) + '" height="' + n1(h) +
      '" rx="2" fill="' + COL.prop + '"/>';
  }
  function propSvg(p) {
    var x = p.x || 0, y = p.y || 120, w = p.w || 44;
    if (p.type === 'wand') return rect(x - 3, 18, 6, 148, 'wand');
    if (p.type === 'stuhl') {
      var back = p.back === 'right' ? x + w / 2 - 5 : x - w / 2;
      return rect(x - w / 2, y, w, 5, 'stuhl') + rect(back, y - 36, 5, 36, 'stuhl') +
        rect(x - w / 2 + 2, y + 5, 4, 166 - y - 5, 'stuhl') + rect(x + w / 2 - 6, y + 5, 4, 166 - y - 5, 'stuhl');
    }
    if (p.type === 'tisch') {
      return rect(x, y, w, 5, 'tisch') + rect(x + 3, y + 5, 4, 166 - y - 5, 'tisch') + rect(x + w - 7, y + 5, 4, 166 - y - 5, 'tisch');
    }
    if (p.type === 'sofa') return rect(x, y, w, 166 - y, 'sofa') + rect(x, y - 22, 10, 22, 'sofa');
    if (p.type === 'stufe') return rect(x, y, w, 166 - y, 'stufe');
    // Wand hinter einer frontal stehenden Figur
    if (p.type === 'wandflaeche') return rect(x - w / 2, 22, w, 144, 'wandflaeche').replace('fill="' + COL.prop + '"', 'fill="' + COL.wall + '"');
    return '';
  }

  /* Pfeil zum Bauch (Vacuum): Spitze bei x/y, zeigt in dir, pendelt leicht zur Spitze hin */
  var ARROW_DIR = { links: [-1, 0], rechts: [1, 0], oben: [0, -1], unten: [0, 1] };
  function arrowSvg(p, ms) {
    var d = ARROW_DIR[p.dir] || ARROW_DIR.links;
    var k = 3 * (1 - Math.cos(2 * Math.PI * (ms || 0) / 1600)) / 2;
    var tip = [p.x + d[0] * k, p.y + d[1] * k];
    var tail = [tip[0] - d[0] * 18, tip[1] - d[1] * 18];
    var side = [-d[1], d[0]];
    var w1 = [tip[0] - d[0] * 7 + side[0] * 6, tip[1] - d[1] * 7 + side[1] * 6];
    var w2 = [tip[0] - d[0] * 7 - side[0] * 6, tip[1] - d[1] * 7 - side[1] * 6];
    function seg(a, b) {
      return '<line data-prop="pfeil" x1="' + n1(a[0]) + '" y1="' + n1(a[1]) + '" x2="' + n1(b[0]) + '" y2="' + n1(b[1]) +
        '" stroke="' + COL.arrow + '" stroke-width="3.5" stroke-linecap="round"/>';
    }
    return seg(tail, tip) + seg(w1, tip) + seg(w2, tip);
  }

  function torso(g, F, w, c) {
    if (!F.bow) return line(g.hip, g.sh, w, c);
    var dx = g.sh[0] - g.hip[0], dy = g.sh[1] - g.hip[1], len = Math.hypot(dx, dy) || 1;
    var cx = (g.hip[0] + g.sh[0]) / 2 - dy / len * F.bow, cy = (g.hip[1] + g.sh[1]) / 2 + dx / len * F.bow;
    return '<path d="M' + n1(g.hip[0]) + ' ' + n1(g.hip[1]) + ' Q' + n1(cx) + ' ' + n1(cy) + ' ' + n1(g.sh[0]) + ' ' + n1(g.sh[1]) +
      '" fill="none" stroke="' + c + '" stroke-width="' + w + '" stroke-linecap="round"/>';
  }

  function svg(F, scale, props, ms) {
    if (!F) return '';
    var g = geometry(F);
    var mat = '<rect x="14" y="166" width="212" height="6" rx="3" fill="' + COL.mat + '"/>';
    var behind = (props || []).filter(function (p) { return p.type !== 'pfeil'; });
    var front = (props || []).filter(function (p) { return p.type === 'pfeil'; });
    // Vorderansicht: beide Seiten gleich nah, also gleiche Farbe
    var far = g.girdle ? COL.near : COL.far;
    var h = behind.map(propSvg).join('');
    h += line(g.shF, g.armF.mid, WID.upper, far) + line(g.armF.mid, g.armF.end, WID.fore, far);
    h += line(g.hipF, g.legF.mid, WID.thigh, far) + line(g.legF.mid, g.legF.end, WID.shin, far) +
      line(g.legF.end, g.toeF, WID.foot, far);
    h += torso(g, F, WID.torso, COL.near);
    if (g.girdle) h += line(g.shN, g.shF, WID.girdle, COL.near) + line(g.hipN, g.hipF, WID.thigh, COL.near);
    h += line(g.hipN, g.legN.mid, WID.thigh, COL.near) + line(g.legN.mid, g.legN.end, WID.shin, COL.near) +
      line(g.legN.end, g.toeN, WID.foot, COL.near);
    h += line(g.shN, g.armN.mid, WID.upper, COL.near) + line(g.armN.mid, g.armN.end, WID.fore, COL.near);
    h += '<circle cx="' + n1(g.head[0]) + '" cy="' + n1(g.head[1]) + '" r="' + SEG.head + '" fill="' + COL.head + '"/>';
    h += front.map(function (p) { return arrowSvg(p, ms); }).join('');
    if (scale && scale !== 1) {
      h = '<g transform="translate(120 166) scale(' + scale + ') translate(-120 -166)">' + h + '</g>';
    }
    return mat + h;
  }

  function bounds(F, scale) {
    var b = rawBounds(F), s = scale || 1;
    return {
      minX: 120 + (b.minX - 120) * s, maxX: 120 + (b.maxX - 120) * s,
      minY: 166 + (b.minY - 166) * s, maxY: 166 + (b.maxY - 166) * s
    };
  }

  function rawBounds(F) {
    var g = geometry(F);
    var pts = [g.hip, g.sh, g.hipN, g.hipF, g.shN, g.shF, g.legN.mid, g.legN.end, g.legF.mid, g.legF.end,
      g.armN.mid, g.armN.end, g.armF.mid, g.armF.end, g.toeN, g.toeF];
    var b = { minX: Infinity, maxX: -Infinity, minY: Infinity, maxY: -Infinity };
    pts.forEach(function (p) {
      b.minX = Math.min(b.minX, p[0]); b.maxX = Math.max(b.maxX, p[0]);
      b.minY = Math.min(b.minY, p[1]); b.maxY = Math.max(b.maxY, p[1]);
    });
    b.minX = Math.min(b.minX, g.head[0] - SEG.head); b.maxX = Math.max(b.maxX, g.head[0] + SEG.head);
    b.minY = Math.min(b.minY, g.head[1] - SEG.head); b.maxY = Math.max(b.maxY, g.head[1] + SEG.head);
    return b;
  }

  /* ---------- Browser: Animation ---------- */
  var mounted = [];
  var raf = null;

  function now() { return (typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now(); }

  function loop() {
    var t = now();
    mounted = mounted.filter(function (m) { return m.el.isConnected !== false; });
    mounted.forEach(function (m) { m.el.innerHTML = draw(m.pose, t - m.start); });
    raf = mounted.length ? requestAnimationFrame(loop) : null;
  }

  /* Atem-Kreis: Phase, Restsekunden und Groesse (k 0..1) zu einer Zeit */
  var BREATH_LABEL = { ein: 'Einatmen', halten: 'Halten', aus: 'Ausatmen', leer: 'Halten' };
  function breathAt(a, ms) {
    var parts = [['ein', a.ein || 0], ['halten', a.halten || 0], ['aus', a.aus || 0], ['leer', a.haltenLeer || 0]]
      .filter(function (p) { return p[1] > 0; });
    var total = parts.reduce(function (sum, p) { return sum + p[1]; }, 0) || 1;
    var t = (Math.max(0, ms) / 1000) % total;
    for (var i = 0; i < parts.length; i++) {
      var p = parts[i];
      if (t < p[1]) {
        var u = t / p[1];
        var k = p[0] === 'ein' ? ease(u) : (p[0] === 'halten' ? 1 : (p[0] === 'aus' ? 1 - ease(u) : 0));
        return { phase: p[0], label: BREATH_LABEL[p[0]], left: Math.ceil(p[1] - t - 1e-9), k: k };
      }
      t -= p[1];
    }
    return { phase: 'ein', label: BREATH_LABEL.ein, left: a.ein || 0, k: 0 };
  }

  function breathSvg(a, ms) {
    var b = breathAt(a, ms);
    var r = 28 + 44 * b.k;
    return '<circle cx="120" cy="96" r="74" fill="none" stroke="rgba(183,148,197,.18)" stroke-width="2"/>' +
      '<circle cx="120" cy="96" r="' + n1(r) + '" fill="rgba(183,148,197,.32)" stroke="#B794C5" stroke-width="3"/>' +
      '<text x="120" y="92" text-anchor="middle" fill="#f6edf1" font-size="15" font-weight="700">' + b.label + '</text>' +
      '<text x="120" y="114" text-anchor="middle" fill="#f6edf1" font-size="19" font-weight="700">' + b.left + '</text>';
  }

  function draw(pose, ms) {
    if (pose.breath) return breathSvg(pose.breath, ms);
    return svg(frameAt(pose, ms), pose.scale || DEFAULT_SCALE, pose.props, ms);
  }

  function prepare(el) {
    el.setAttribute('viewBox', VIEWBOX);
    el.setAttribute('preserveAspectRatio', 'xMidYMid meet');
  }

  T.figure = {
    SEG: SEG,
    VIEWBOX: VIEWBOX,
    DEFAULT_SCALE: DEFAULT_SCALE,
    draw: draw,
    breathAt: breathAt,
    geometry: geometry,
    ik: ik,
    frameAt: frameAt,
    svg: svg,
    bounds: bounds,

    /* Stehendes Bild (erster Frame), z. B. fuer Listen */
    still: function (el, pose) {
      prepare(el);
      el.innerHTML = draw(pose, 0);
    },

    mount: function (el, pose) {
      T.figure.unmount(el);
      prepare(el);
      mounted.push({ el: el, pose: pose, start: now() });
      el.innerHTML = draw(pose, 0);
      if (!raf && typeof requestAnimationFrame === 'function') raf = requestAnimationFrame(loop);
    },

    unmount: function (el) {
      mounted = mounted.filter(function (m) { return m.el !== el; });
    },

    running: function () {
      mounted = mounted.filter(function (m) { return m.el.isConnected !== false; });
      return mounted.length;
    }
  };
})(window.Takt);
