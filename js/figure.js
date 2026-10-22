/* Takt: animierte Figur. Reine Rechnung (ik, frameAt, svg, bounds) ist in Node getestet;
   mount/unmount/still laufen nur im Browser. Haltungen stehen in data/poses.js. */
window.Takt = window.Takt || {};
(function (T) {
  'use strict';

  var SEG = { thigh: 40, shin: 40, upper: 30, fore: 28, neck: 6, head: 10 };
  var COL = { near: '#E3A3BF', far: '#9A6B8C', head: '#F0C4D6', mat: 'rgba(255,255,255,.07)' };
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
    var legN = ik(hipN, F.footN, SEG.thigh, SEG.shin, F.kneeN || -1);
    var legF = ik(hipF, F.footF, SEG.thigh, SEG.shin, F.kneeF || -1);
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

  function svg(F) {
    if (!F) return '';
    var g = geometry(F);
    var h = '<rect x="14" y="166" width="212" height="6" rx="3" fill="' + COL.mat + '"/>';
    h += line(g.shF, g.armF.mid, WID.upper, COL.far) + line(g.armF.mid, g.armF.end, WID.fore, COL.far);
    h += line(g.hipF, g.legF.mid, WID.thigh, COL.far) + line(g.legF.mid, g.legF.end, WID.shin, COL.far) +
      line(g.legF.end, g.toeF, WID.foot, COL.far);
    h += line(g.hip, g.sh, WID.torso, COL.near);
    if (g.girdle) h += line(g.shN, g.shF, WID.girdle, COL.near) + line(g.hipN, g.hipF, WID.thigh, COL.near);
    h += line(g.hipN, g.legN.mid, WID.thigh, COL.near) + line(g.legN.mid, g.legN.end, WID.shin, COL.near) +
      line(g.legN.end, g.toeN, WID.foot, COL.near);
    h += line(g.shN, g.armN.mid, WID.upper, COL.near) + line(g.armN.mid, g.armN.end, WID.fore, COL.near);
    h += '<circle cx="' + n1(g.head[0]) + '" cy="' + n1(g.head[1]) + '" r="' + SEG.head + '" fill="' + COL.head + '"/>';
    return h;
  }

  function bounds(F) {
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
    mounted.forEach(function (m) { m.el.innerHTML = svg(frameAt(m.pose, t - m.start)); });
    raf = mounted.length ? requestAnimationFrame(loop) : null;
  }

  function prepare(el) {
    el.setAttribute('viewBox', VIEWBOX);
    el.setAttribute('preserveAspectRatio', 'xMidYMid meet');
  }

  T.figure = {
    SEG: SEG,
    VIEWBOX: VIEWBOX,
    ik: ik,
    frameAt: frameAt,
    svg: svg,
    bounds: bounds,

    /* Stehendes Bild (erster Frame), z. B. fuer Listen */
    still: function (el, pose) {
      prepare(el);
      el.innerHTML = svg(frameAt(pose, 0));
    },

    mount: function (el, pose) {
      T.figure.unmount(el);
      prepare(el);
      mounted.push({ el: el, pose: pose, start: now() });
      el.innerHTML = svg(frameAt(pose, 0));
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
