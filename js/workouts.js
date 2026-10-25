/* Takt: Workouts als reine Logik: Intensitaet, Zeit-Budget, Ablauf vorbereiten, Themen und Wochen-Minuten,
   Workouts pruefen und kopieren, Mix */
window.Takt = window.Takt || {};
(function (T) {
  'use strict';

  T.INTENSITY = { leicht: { work: 0.8, rest: 1.5 }, normal: { work: 1, rest: 1 }, hart: { work: 1.2, rest: 0.6 } };
  var MIN = { work: 10, rest: 5 };

  function copy(s) {
    var c = {};
    Object.keys(s).forEach(function (k) { c[k] = s[k]; });
    return c;
  }
  function total(steps) { return T.totalSeconds(steps); }
  function scalable(s) { return s.kind === 'work' || s.kind === 'rest'; }
  /* Mindestdauer gilt nur, wenn der Schritt vorher laenger war: nie verlaengern */
  function atLeast(s, value) { return Math.max(Math.min(MIN[s.kind], s.duration), value); }

  T.applyIntensity = function (steps, level) {
    steps = steps || [];
    var f = Object.prototype.hasOwnProperty.call(T.INTENSITY, level) ? T.INTENSITY[level] : null;
    if (!f || level === 'normal') return steps.map(copy);
    return steps.map(function (s) {
      var c = copy(s);
      if (scalable(s)) c.duration = atLeast(s, Math.round(s.duration * f[s.kind] / 5) * 5);
      return c;
    });
  };

  /* Arbeit und Pause mit Faktor k, auf 5 s abgerundet */
  function scaled(steps, k) {
    return steps.map(function (s) {
      var c = copy(s);
      if (scalable(s)) c.duration = atLeast(s, Math.floor(s.duration * k / 5) * 5);
      return c;
    });
  }

  /* Groesster Faktor bis 1, bei dem alles ins Budget passt; null, wenn nicht einmal die Mindestdauern passen */
  function scaleToFit(steps, budget) {
    if (total(scaled(steps, 0)) > budget) return null;
    var lo = 0, hi = 1;
    for (var i = 0; i < 30; i++) {
      var mid = (lo + hi) / 2;
      if (total(scaled(steps, mid)) <= budget) lo = mid; else hi = mid;
    }
    return topUp(steps, scaled(steps, lo), budget);
  }

  /* Restzeit in 5-s-Schritten an die am staerksten gekuerzten Schritte geben, nie ueber die geplante Dauer */
  function topUp(base, fit, budget) {
    var left = budget - total(fit);
    while (left >= 5) {
      var best = -1, ratio = 0;
      for (var i = 0; i < fit.length; i++) {
        if (!scalable(fit[i]) || fit[i].duration + 5 > base[i].duration) continue;
        var r = base[i].duration / fit[i].duration;
        if (r > ratio) { ratio = r; best = i; }
      }
      if (best < 0) break;
      fit[best].duration += 5;
      left -= 5;
    }
    return fit;
  }

  /* Keine Pause am Ende, Uebungen neu durchzaehlen, Rundenzahl je Block neu bestimmen */
  function tidy(steps) {
    var out = steps.slice();
    while (out.length && out[out.length - 1].kind === 'rest') out.pop();
    var maxRound = {};
    out.forEach(function (s) {
      if (s.kind === 'work') maxRound[s.blockIndex] = Math.max(maxRound[s.blockIndex] || 0, s.round);
    });
    var n = 0;
    return out.map(function (s) {
      var c = copy(s);
      if (maxRound[s.blockIndex]) c.rounds = maxRound[s.blockIndex];
      if (s.kind === 'work') c.workIndex = n++;
      return c;
    });
  }

  /* Letzte Runde des Blocks mit den meisten Runden entfernen (bei Gleichstand der hintere Block) */
  function dropLastRound(steps) {
    var block = -1, rounds = 1;
    steps.forEach(function (s) {
      if (s.kind === 'work' && s.rounds > 1 && s.rounds >= rounds) { rounds = s.rounds; block = s.blockIndex; }
    });
    if (block < 0) return null;
    return tidy(steps.filter(function (s) {
      return s.kind === 'prep' || !(s.blockIndex === block && s.round === rounds);
    }));
  }

  function dropLastWork(steps) {
    var out = steps.slice();
    for (var i = out.length - 1; i >= 0; i--) {
      if (out[i].kind === 'work') { out.splice(i, 1); break; }
    }
    return tidy(out);
  }

  /* Harte Obergrenze: erst anteilig kuerzen, dann Runden streichen, dann Pausen weg, dann Uebungen von hinten */
  T.fitBudget = function (steps, budgetSec) {
    steps = steps || [];
    var budget = Math.floor(Number(budgetSec));
    if (!isFinite(budget) || total(steps) <= budget) return steps;
    var base = steps, fit, fewer;
    for (;;) {
      fit = scaleToFit(base, budget);
      if (fit) return fit;
      fewer = dropLastRound(base);
      if (!fewer) break;
      base = fewer;
    }
    base = tidy(base.filter(function (s) { return s.kind !== 'rest'; }));
    for (;;) {
      fit = scaleToFit(base, budget);
      if (fit) return fit;
      if (T.workCount(base) <= 1) break;
      base = dropLastWork(base);
    }
    return scaled(base, 0);
  };

  /* Das Budget gilt fuer das Training ohne die Vorbereitung, wie alle angezeigten Dauern (Karte, Vorschau, Mix, Editor) */
  T.prepareSteps = function (workout, exIndex, opts) {
    opts = opts || {};
    var steps = T.applyIntensity(T.buildSteps(workout, exIndex, { prepSeconds: opts.prepSeconds }), opts.intensity);
    if (!opts.budgetSec) return steps;
    var fit = T.fitBudget(steps.filter(function (s) { return s.kind !== 'prep'; }), opts.budgetSec);
    var first = fit.filter(function (s) { return s.kind === 'work'; })[0];
    return steps.filter(function (s) { return s.kind === 'prep'; }).map(function (p) {
      var c = copy(p);
      if (first) c.rounds = first.rounds;
      return c;
    }).concat(fit);
  };

  /* Gesamtdauer ohne Vorbereitung */
  T.workoutSeconds = function (workout, exIndex) {
    return T.totalSeconds(T.buildSteps(workout, exIndex, { prepSeconds: 0 }));
  };

  /* ---------- Themen und Wochen-Minuten ---------- */
  T.WORKOUT_THEMES = ['core', 'bauch', 'dehnen', 'yoga', 'beine', 'ruecken'];
  T.THEMES = {
    core: { label: 'Vacuum & Core', color: '#C6C5A6' },
    bauch: { label: 'Bauch', color: '#BE7B9D' },
    dehnen: { label: 'Dehnen & R\u00fccken', color: '#A8C4A0' },
    yoga: { label: 'Yoga & Atmung', color: '#B794C5' },
    beine: { label: 'Beine & Po', color: '#C4A882' },
    ruecken: { label: 'Starker R\u00fccken', color: '#8AB4C4' }
  };

  /* Trainings seit Montag 0 Uhr (Ortszeit) */
  T.weekStats = function (log, now) {
    now = now instanceof Date ? now : new Date();
    var monday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - ((now.getDay() + 6) % 7)).getTime();
    var res = { seconds: 0, count: 0 };
    (Array.isArray(log) ? log : []).forEach(function (e) {
      var t = e && e.date ? new Date(e.date).getTime() : NaN;
      if (!isFinite(t) || t < monday || t > now.getTime() || !T.entryValid(e)) return;
      res.seconds += T.entrySeconds(e);
      res.count++;
    });
    return res;
  };

  /* ---------- Workouts pruefen und kopieren ---------- */
  var LIMIT = { name: 40, label: 30, repeat: [1, 10], duration: [10, 600], rest: [0, 120] };
  var COPY = ' (Kopie)';

  function isInt(v) { return typeof v === 'number' && isFinite(v) && Math.floor(v) === v; }
  function inRange(v, r) { return isInt(v) && v >= r[0] && v <= r[1]; }
  function stampOf(now) { return (now instanceof Date && !isNaN(now.getTime()) ? now : new Date()).toISOString(); }

  /* Prueft eine Eingabe aus dem Editor und baut daraus ein sauberes eigenes Workout.
     Leere Bloecke fallen weg, fehlende Namen kommen aus der Bibliothek. */
  T.validateWorkout = function (input, now) {
    input = input || {};
    var errors = [];
    function err(field, msg, block, item) {
      var e = { field: field, msg: msg };
      if (block != null) e.block = block;
      if (item != null) e.item = item;
      errors.push(e);
    }
    var idx = T.indexExercises(T.EXERCISES);
    var name = String(input.name == null ? '' : input.name).trim();
    if (!name) err('name', 'Bitte gib dem Workout einen Namen.');
    else if (name.length > LIMIT.name) err('name', 'Der Name darf h\u00f6chstens 40 Zeichen haben.');
    var defWork = inRange(input.defaultWork, LIMIT.duration) ? input.defaultWork : 40;
    var defRest = inRange(input.defaultRest, LIMIT.rest) ? input.defaultRest : 15;

    var blocks = [];
    (Array.isArray(input.blocks) ? input.blocks : []).forEach(function (b, bi) {
      var items = b && Array.isArray(b.items) ? b.items : [];
      if (!items.length) return;
      var repeat = b.repeat == null ? 1 : b.repeat;
      if (!inRange(repeat, LIMIT.repeat)) err('repeat', 'Runden: 1 bis 10.', bi);
      blocks.push({
        label: String(b.label || '').trim().slice(0, LIMIT.label),
        repeat: repeat,
        items: items.map(function (it, ii) {
          it = it || {};
          var exId = typeof it.exId === 'string' && it.exId ? it.exId : null;
          var ex = exId ? idx[exId] : null;
          var nm = String(it.name || '').trim() || (ex ? ex.name : '');
          if (!nm) err('itemName', 'Eine \u00dcbung hat keinen Namen.', bi, ii);
          var duration = it.duration == null ? defWork : it.duration;
          if (!inRange(duration, LIMIT.duration)) err('duration', 'Dauer: 10 bis 600 Sekunden.', bi, ii);
          var rest = it.rest == null ? null : it.rest;
          if (rest !== null && !inRange(rest, LIMIT.rest)) err('rest', 'Pause: 0 bis 120 Sekunden.', bi, ii);
          return { exId: exId, name: nm, duration: duration, rest: rest, bilateral: T.itemBilateral(it, idx) };
        })
      });
    });
    if (!blocks.length) err('blocks', 'F\u00fcge mindestens eine \u00dcbung hinzu.');

    var stamp = stampOf(now);
    var workout = {
      id: typeof input.id === 'string' && /^w-/.test(input.id) ? input.id : T.uid('w-'),
      name: name,
      theme: T.WORKOUT_THEMES.indexOf(input.theme) >= 0 ? input.theme : 'core',
      defaultWork: defWork,
      defaultRest: defRest,
      source: 'own',
      blocks: blocks,
      createdAt: typeof input.createdAt === 'string' && input.createdAt ? input.createdAt : stamp,
      updatedAt: stamp
    };
    if (input.origin === 'mix') workout.origin = 'mix';   // Herkunft fuer das Abzeichen "Mix-Meisterin"
    return { ok: !errors.length, errors: errors, workout: workout };
  };

  /* Kopie als eigenes Workout; Vorlagen und Mixe behalten ihren Namen, eigene heissen "... (Kopie)" */
  T.copyWorkout = function (workout) {
    var c = JSON.parse(JSON.stringify(workout || {}));
    var idx = T.indexExercises(T.EXERCISES);
    var name = String(c.name || '').trim();
    if (c.source === 'own' || !c.source) name = name.slice(0, LIMIT.name - COPY.length).trim() + COPY;
    var stamp = stampOf();
    if (c.source === 'mix') c.origin = 'mix';
    c.id = T.uid('w-');
    c.name = name;
    c.source = 'own';
    delete c.level;
    c.createdAt = stamp;
    c.updatedAt = stamp;
    (c.blocks || []).forEach(function (b) {
      (b.items || []).forEach(function (i) { if (!i.name && i.exId && idx[i.exId]) i.name = idx[i.exId].name; });
    });
    return c;
  };

  /* ---------- Mix ---------- */

  /* Zufallszahlen mit Seed (mulberry32), damit ein Mix nachvollziehbar bleibt */
  T.rng = function (seed) {
    var a = (Math.floor(Number(seed)) || 0) >>> 0;
    return function () {
      a = (a + 0x6D2B79F5) >>> 0;
      var t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  };

  /* Core enthaelt auch die Vacuum-Uebungen (sie sind Core-Uebungen); Vacuum allein nur diese */
  T.MIX_THEMES = { core: ['core', 'vacuum'], vacuum: ['vacuum'], bauch: ['bauch'], beine: ['beine-po'], ruecken: ['ruecken'],
    dehnen: ['dehnen'], yoga: ['yoga'], ganz: ['ganzkoerper', 'oberkoerper'] };
  T.MIX_LABELS = { core: 'Core', vacuum: 'Vacuum', bauch: 'Bauch', beine: 'Beine & Po', ruecken: 'R\u00fccken', dehnen: 'Dehnen',
    yoga: 'Yoga', ganz: 'Ganzk\u00f6rper' };
  /* Farbe des Mix: Vacuum und Ganzkoerper haben keine eigene Workout-Farbe */
  var MIX_COLOR = { core: 'core', vacuum: 'core', bauch: 'bauch', beine: 'beine', ruecken: 'ruecken', dehnen: 'dehnen', yoga: 'yoga',
    ganz: 'core' };
  /* Aufbau (Nicole, 2026-10-25):
     - Kraft-Themen (Core, Bauch, Beine & Po, Ruecken, Ganzkoerper) und Vacuum laufen als Zirkel in Runden.
     - Dehnen und Yoga laufen als ein Durchgang: lange Haltezeiten (mind. 30 s je Seite, Empfehlung des ACSM), 5 s zum Wechseln,
       am Ende die Totenstellung; Yoga beginnt mit dem Sonnengruss. Neben einem Zirkel kommt der Durchgang danach,
       die Zeit teilt sich nach Anzahl der Themen.
     - Aufwaermen nur bei Kraft-Themen: erst den Puls heben, dann die Gelenke des Themas bewegen. Dehnen und Vacuum brauchen keins.
     - Jeder Teil laeuft vom Stehen zum Liegen (T.POSITIONS). Das Aufwaermen endet nicht tiefer, als der Zirkel beginnt,
       die Dehnung zum Abschluss beginnt nicht hoeher, als er endet.
     - Je Thema kommen verschiedene Bewegungsmuster bzw. Koerperregionen dran (MIX_MUSTER, MIX_FOKUS). */
  var KRAFT = ['core', 'bauch', 'beine', 'ruecken', 'ganz'];
  var FLOW = ['dehnen', 'yoga'];
  /* Nicht im Durchgang: beim Dehnen Aufwaerm-, Vacuum- und Ganzkoerper-Uebungen (Armkreisen, Inchworm),
     beim Yoga Sonnengruss und Totenstellung (sie kommen an Anfang und Ende) */
  var MIX_SKIP = { dehnen: ['aufwaermen', 'vacuum', 'ganzkoerper'], yoga: ['aufwaermen', 'atmung'] };
  var MIX_OPEN = 'sonnengruss', MIX_END = 'totenstellung';
  var MIX_PULSE = ['laufen-stelle', 'hampelmann', 'kniehebelauf', 'seilspringen', 'schattenboxen'];
  /* Mobilisation fuer die Gelenke, die im Zirkel arbeiten */
  var MIX_MOBILE = { core: ['hueftkreisen', 'katze-kuh', 'inchworm'], bauch: ['hueftkreisen', 'katze-kuh', 'inchworm'],
    beine: ['hueftkreisen', 'worlds-greatest'], ruecken: ['schulterkreisen', 'armkreisen', 'katze-kuh', 'stab-durchzug'],
    ganz: ['armkreisen', 'hueftkreisen', 'inchworm', 'worlds-greatest', 'stab-durchzug'] };
  /* Abschluss nach einem Zirkel: Dehnung fuer die Muskeln, die gearbeitet haben */
  var MIX_COOL = { core: ['kindhaltung', 'knie-zur-brust', 'liegender-twist', 'happy-baby'],
    vacuum: ['kindhaltung', 'knie-zur-brust', 'happy-baby'], bauch: ['kobra', 'sphinx', 'liegender-twist', 'knie-zur-brust'],
    beine: ['quad-dehnung', 'hueftbeuger-dehnung', 'taube', 'hamstring-dehnung', 'huefte-90-90', 'figur-vier'],
    ruecken: ['kindhaltung', 'faden-einfaedeln', 'knie-zur-brust', 'liegender-twist', 'happy-baby', 'stab-kindhaltung'],
    ganz: ['vorbeuge-stehend', 'quad-dehnung', 'herabschauender-hund', 'kindhaltung', 'figur-vier', 'stab-brust'] };
  /* Schwerpunkte je Thema in dieser Reihenfolge (Muster und Fokus in data/exercises.js), damit ein Mix Hand und Fuss hat
     (Nicole, 2026-10-25): z. B. Beine & Po erst Kniebeuge, Bruecke, Ausfallschritt, Abspreizen, Hueftbeuge. Was doppelt
     steht, darf doppelt vorkommen; danach beginnt die Liste von vorn. Uebungen ohne Muster (Dehnungen) kommen nicht in den Zirkel. */
  var MIX_MUSTER = {
    core: ['stabil', 'seitlich', 'vakuum-halten', 'drehen', 'gegengleich', 'huefte-strecken'],
    vacuum: ['vakuum-halten', 'vakuum-bewegt', 'vakuum-halten', 'vakuum-stuetz', 'vakuum-halten', 'vakuum-bewegt'],
    bauch: ['beugen', 'stabil', 'drehen', 'beine-heben', 'seitlich', 'beugen'],
    beine: ['kniebeuge', 'huefte-strecken', 'ausfallschritt', 'abspreizen', 'hueftbeuge', 'anziehen', 'wade'],
    ruecken: ['strecken', 'schulterblatt', 'gegengleich', 'hueftbeuge', 'schulterblatt', 'strecken'],
    ganz: ['kniebeuge', 'druecken', 'cardio', 'stabil', 'cardio', 'huefte-strecken']
  };
  /* Im Durchgang reihum die Koerperregionen (Dehnen) bzw. Arten von Haltungen (Yoga) */
  var MIX_FOKUS = {
    dehnen: ['beine-hinten', 'huefte-vorne', 'huefte', 'wirbelsaeule', 'oben', 'seite'],
    yoga: ['stand', 'rueckbeuge', 'huefte', 'beine-hinten', 'balance', 'wirbelsaeule', 'seite', 'oben', 'rumpf']
  };
  /* Haltezeit im Durchgang: Dehnungen hold (beidseitig holdSide je Seite), bei Restzeit bis zum Doppelten;
     Kraft- und Balance-Haltungen (Boot, Krieger) pose (poseSide je Seite); notfalls mindestens holdMin je Seite */
  var MIX = { warm: 2, main: 5, work: 40, rest: 15, warmWork: 40, warmRest: 5, coolWork: 60, maxWork: 60, minWork: 20, maxRounds: 4,
    hold: 60, holdSide: 45, pose: 45, poseSide: 30, holdMin: 30, flowRest: 5 };
  /* Kurzer Mix (bis 5 Min.): eine Aufwaerm-Uebung, vier im Zirkel, kuerzerer Abschluss; langer (ab 30 Min.): sechs im Zirkel */
  var MIX_SHORT = { warm: 1, main: 4, warmWork: 30, coolWork: 40 };
  var MIX_LONG = { warm: 2, main: 6, warmWork: 40, coolWork: 60 };
  var LABEL = { warm: 'Aufw\u00e4rmen', main: 'Hauptteil', cool: 'Abschluss' };

  function hasTag(e, tags) { return (e.tags || []).some(function (t) { return tags.indexOf(t) >= 0; }); }
  function inTheme(e, k) { return hasTag(e, T.MIX_THEMES[k]) && !hasTag(e, MIX_SKIP[k] || []); }
  /* nur Zeit-Uebungen mit Figur, ohne Hilfsmittel ausser Matte und Wand; den Stab (Besenstiel) nur mit Schalter im Mix-Fenster */
  function mixable(e, stab) {
    return e && e.typ === 'zeit' && !!(T.POSES || {})[e.id] &&
      (e.hilfsmittel || []).every(function (h) { return h === 'matte' || h === 'wand' || (stab && h === 'stab'); });
  }
  function hasStab(e) { return (e.hilfsmittel || []).indexOf('stab') >= 0; }
  function rank(e) { return (T.POSITIONS || []).indexOf(e.position); }
  /* vom Stehen zum Liegen; in gleicher Position bleibt die Reihenfolge */
  function byPosition(list) {
    return list.map(function (e, i) { return [rank(e), i, e]; })
      .sort(function (a, b) { return a[0] - b[0] || a[1] - b[1]; })
      .map(function (x) { return x[2]; });
  }
  /* Uebungen in Position r, sonst in der naechst tieferen, notfalls in der naechst hoeheren */
  function nearest(list, r) {
    var low = list.filter(function (e) { return rank(e) >= r; });
    var src = low.length ? low : list;
    var best = (low.length ? Math.min : Math.max).apply(null, src.map(rank));
    return src.filter(function (e) { return rank(e) === best; });
  }
  function stretch(e) { return hasTag(e, ['dehnen']) || e.id === MIX_OPEN; }
  function holdFor(e) {
    return stretch(e) ? (e.beidseitig ? 2 * MIX.holdSide : MIX.hold) : (e.beidseitig ? 2 * MIX.poseSide : MIX.pose);
  }
  /* "Mix: Core, Bauch"; bei vielen Themen gekuerzt ("Mix: Core, Bauch +3"), damit der Name in 40 Zeichen passt */
  function mixName(themes) {
    var labels = themes.map(function (k) { return T.MIX_LABELS[k]; });
    for (var k = labels.length; k >= 1; k--) {
      var name = 'Mix: ' + labels.slice(0, k).join(', ') + (k < labels.length ? ' +' + (labels.length - k) : '');
      if (name.length <= LIMIT.name) return name;
    }
    return 'Mix';
  }
  function mixItem(e, duration, rest) {
    return { exId: e.id, name: e.name, duration: duration, rest: rest == null ? null : rest, bilateral: !!e.beidseitig };
  }

  T.makeMix = function (opts, exercises) {
    opts = opts || {};
    var rand = T.rng(opts.seed);
    var themes = (opts.themes || []).filter(function (k) { return Object.prototype.hasOwnProperty.call(T.MIX_THEMES, k); });
    if (!themes.length) themes = ['core'];
    var minutes = Number(opts.minutes) > 0 ? Number(opts.minutes) : 15;
    var size = minutes <= 5 ? MIX_SHORT : minutes >= 30 ? MIX_LONG : MIX;
    var stab = !!opts.stab;
    var pool = (exercises || []).filter(function (e) { return mixable(e, stab); });
    var used = [];
    function free(list) { return list.filter(function (e) { return used.indexOf(e.id) < 0; }); }
    function pick(list) {
      var c = free(list), e = c.length ? c[Math.floor(rand() * c.length)] : null;
      if (e) used.push(e.id);
      return e;
    }
    function ofIds(ids) { return pool.filter(function (e) { return ids.indexOf(e.id) >= 0; }); }
    function idsOf(map, keys) { return [].concat.apply([], keys.map(function (k) { return map[k] || []; })); }
    /* Reihum aus den Themen; ist eins aufgebraucht, springt das naechste ein. Je Thema das erste Muster (field) seiner Liste,
       das in diesem Teil noch seltener vorkam, als die Liste bis dahin verlangt; Muster anderer Themen zaehlen mit.
       Muster mit Uebungen aus prefer kommen zuerst dran, innerhalb eines Musters zuerst diese Uebungen. */
    function drawer(keys, field, lists, prefer) {
      var count = {}, i = 0;
      prefer = prefer || [];
      function isPref(x) { return prefer.indexOf(x.id) >= 0; }
      function choose(list) {
        var e = pick(list.filter(isPref)) || pick(list);
        if (e) count[e[field]] = (count[e[field]] || 0) + 1;
        return e;
      }
      function nextFor(k) {
        var cands = free(pool.filter(function (x) { return inTheme(x, k) && x[field]; }));
        var list = lists[k] || [];
        var first = list.filter(function (m) { return cands.some(function (x) { return x[field] === m && isPref(x); }); });
        list = first.concat(list.filter(function (m) { return first.indexOf(m) < 0; }));
        var need = {}, seq = list.concat(list, list, list);
        for (var j = 0; j < seq.length; j++) {
          var m = seq[j], group = cands.filter(function (x) { return x[field] === m; });
          need[m] = (need[m] || 0) + 1;
          if (group.length && (count[m] || 0) < need[m]) return choose(group);
        }
        return choose(cands);
      }
      return function () {
        for (var n = 0; n < keys.length; n++) {
          var e = nextFor(keys[i++ % keys.length]);
          if (e) return e;
        }
        return null;
      };
    }

    var circ = themes.filter(function (k) { return FLOW.indexOf(k) < 0; });
    var flow = themes.filter(function (k) { return FLOW.indexOf(k) >= 0; });
    var kraft = themes.filter(function (k) { return KRAFT.indexOf(k) >= 0; });
    var warmB = { label: LABEL.warm, repeat: 1, items: [] };
    var mainB = { label: LABEL.main, repeat: 1, items: [] };
    var flowB = { label: circ.length ? flow.map(function (k) { return T.MIX_LABELS[k]; }).join(' & ') : LABEL.main, repeat: 1, items: [] };
    var coolB = { label: LABEL.cool, repeat: 1, items: [] };
    var workout = {
      id: 'mix-' + ((Math.floor(Number(opts.seed)) || 0) >>> 0),
      name: mixName(themes),
      theme: MIX_COLOR[themes[0]], defaultWork: MIX.work, defaultRest: circ.length ? MIX.rest : MIX.flowRest, source: 'mix',
      blocks: [warmB, mainB, flowB, coolB]
    };
    var target = minutes * 60;
    var secs = function () { return T.workoutSeconds(workout); };

    /* Zirkel: reihum aus den Themen nach ihren Mustern, bei duennen Themen mit Core und Ganzkoerper aufgefuellt, vom Stehen zum Liegen */
    var main = [], e;
    if (circ.length) {
      var next = drawer(circ, 'muster', MIX_MUSTER);
      while (main.length < size.main && (e = next())) main.push(e);
      var fill = pool.filter(function (x) { return x.muster && hasTag(x, T.MIX_THEMES.core.concat(T.MIX_THEMES.ganz)); });
      while (main.length < size.main && (e = pick(fill))) main.push(e);
      main = byPosition(main);
    }

    /* Aufwaermen nur bei Kraft-Themen: erst Puls, dann Mobilisation, die nicht tiefer liegt, als der Zirkel beginnt */
    if (kraft.length && main.length) {
      var mobile = ofIds(idsOf(MIX_MOBILE, kraft));
      var warm = [size.warm > 1 ? pick(ofIds(MIX_PULSE)) : null,
        pick(mobile.filter(function (x) { return rank(x) <= rank(main[0]); })) || pick(mobile)].filter(Boolean);
      warmB.items = warm.map(function (x, i) { return mixItem(x, size.warmWork, i < warm.length - 1 ? MIX.warmRest : null); });
    }

    /* Abschluss: nach Dehnen oder Yoga die Totenstellung, sonst eine Dehnung fuer die Themen, dort, wo der Zirkel endet */
    var cool = flow.length ? pick(ofIds([MIX_END])) :
      main.length ? pick(nearest(free(ofIds(idsOf(MIX_COOL, circ))), rank(main[main.length - 1]))) : null;
    if (cool) coolB.items = [mixItem(cool, size.coolWork)];

    /* Zirkel: je Rundenzahl die laengste Arbeitszeit (5-s-Schritte), die passt. Davon die, die die Zeit bis auf 5 % fuellen,
       und darunter die Arbeitszeit am naechsten an 40 s. Neben einem Durchgang bekommt er nur seinen Anteil nach Anzahl der Themen.
       Beidseitige Uebungen bekommen wie in den Vorlagen das Anderthalbfache (40 s, beidseitig 60 s = 30 s je Seite). */
    if (main.length) {
      var limit = target - (flow.length ? Math.round((target - secs()) * flow.length / themes.length) : 0);
      mainB.items = main.map(function (x) { return mixItem(x, MIX.work); });
      var setWork = function (d) {
        mainB.items.forEach(function (i) { i.duration = i.bilateral ? Math.round(d * 1.5 / 5) * 5 : d; });
      };
      var fits = [];
      for (var r = 1; r <= MIX.maxRounds; r++) {
        mainB.repeat = r;
        for (var w = MIX.maxWork; w >= MIX.minWork; w -= 5) {
          setWork(w);
          if (secs() <= limit) { fits.push({ r: r, w: w, s: secs() }); break; }
        }
      }
      var top = Math.max.apply(null, fits.map(function (f) { return f.s; }));
      var best = fits.filter(function (f) { return f.s >= top - target * 0.05; }).sort(function (a, b) {
        return Math.abs(a.w - MIX.work) - Math.abs(b.w - MIX.work) || b.s - a.s;
      })[0] || { r: 1, w: MIX.minWork };
      mainB.repeat = best.r;
      setWork(best.w);
    }

    /* Durchgang: so viele Uebungen, wie mit voller Haltezeit in die Restzeit passen, dann vom Stehen zum Liegen sortiert.
       Nach einem Kraft-Zirkel zuerst Dehnungen fuer die Muskeln, die gearbeitet haben, mit Schalter Besenstiel zuerst die mit Stab.
       Ohne Aufwaermen beginnt Yoga mit dem Sonnengruss. */
    if (flow.length) {
      var prefer = idsOf(MIX_COOL, kraft).concat(pool.filter(hasStab).map(function (x) { return x.id; }));
      var picked = [], nextFlow = drawer(flow, 'fokus', MIX_FOKUS, prefer);
      var x = flow.indexOf('yoga') >= 0 && !warmB.items.length ? pick(ofIds([MIX_OPEN])) : null;
      for (x = x || nextFlow(); x; x = nextFlow()) {
        var it = mixItem(x, holdFor(x), circ.length ? MIX.flowRest : null);
        flowB.items.push(it);
        var full = secs() <= target;
        if (!full) it.duration = (x.beidseitig ? 2 : 1) * MIX.holdMin;   // die letzte kuerzer, wenn sie so noch passt
        if (secs() > target) { flowB.items.pop(); continue; }   // passt gar nicht: die naechste versuchen
        picked.push(x);
        if (!full) break;
      }
      var items = flowB.items, order = byPosition(picked);
      flowB.items = order.map(function (p) { return items[picked.indexOf(p)]; });
      /* Restzeit in 5-s-Schritten an die relativ kuerzeste Haltezeit; Dehnungen bis zum Doppelten, Haltungen bis zur vollen Zeit */
      for (var left = target - secs(); left >= 5; left -= 5) {
        var low = -1;
        order.forEach(function (p, i) {
          var d = flowB.items[i].duration;
          if (d + 5 <= (stretch(p) ? 2 : 1) * holdFor(p) &&
            (low < 0 || d / holdFor(p) < flowB.items[low].duration / holdFor(order[low]))) low = i;
        });
        if (low < 0) break;
        flowB.items[low].duration += 5;
      }
    }

    workout.blocks = workout.blocks.filter(function (b) { return b.items.length; });
    return workout;
  };
})(window.Takt);
