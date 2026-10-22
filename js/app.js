/* Takt: App. Screens Start, Training, Fertig; verdrahtet Engine, Ansagen, Ton, Speicher. */
window.Takt = window.Takt || {};
(function (T) {
  'use strict';
  var $ = function (id) { return document.getElementById(id); };
  var THEMES = { core: '#C0BEA0', bauch: '#C8729A', dehnen: '#A8C4A0', yoga: '#B88CC0', beine: '#C4A882', ruecken: '#8AB4C4' };
  var RING_C = 2 * Math.PI * 138;
  var ICONS = {
    ganz: '<svg viewBox="0 0 48 48"><circle cx="24" cy="8" r="4"/><path d="M24 13v14M24 17l-10-8M24 17l10-8M24 27l-8 14M24 27l8 14"/></svg>',
    core: '<svg viewBox="0 0 48 48"><circle cx="9" cy="19" r="4"/><path d="M13 22l28 8M16 23l-1 10h6M41 30l1 5"/></svg>',
    beine: '<svg viewBox="0 0 48 48"><circle cx="8" cy="33" r="4"/><path d="M12 34l14-10 8 7v9M12 38h7"/></svg>',
    dehnen: '<svg viewBox="0 0 48 48"><circle cx="11" cy="31" r="4"/><path d="M15 33c6-9 15-10 22 3H26M4 37h10"/></svg>'
  };
  var PEACH = [
    '......gg....', '.....g......', '..pppp.ppp..', '.pplppppppp.',
    'pplppppppppd', 'plpppppppppd', 'pppppppppppd', 'pppppppppppd',
    '.pppppppppd.', '.ppppppppdd.', '..pppppddd..', '....dddd....'
  ];
  var PEACH_COLORS = { p: '#C8729A', l: '#E8A6C2', d: '#9A5576', g: '#A8C4A0' };

  var data = T.store.load();
  var exIndex = T.indexExercises((T.EXERCISES || []).concat(data.exercisesOwn || []));
  var run = null;          // { workout: {id, name, theme}, engine }
  var timer = null;
  var lastSave = 0;
  var lastIndex = -2;
  var needTap = false;
  var wakeWarned = false;

  /* ---------- Hilfen ---------- */
  function show(name) {
    ['start', 'train', 'done'].forEach(function (n) { $('screen-' + n).hidden = n !== name; });
  }
  function toast(msg) {
    var t = $('toast');
    t.textContent = msg;
    t.hidden = false;
    clearTimeout(toast.h);
    toast.h = setTimeout(function () { t.hidden = true; }, 4500);
  }
  function themeColor(theme) { return THEMES[theme] || THEMES.core; }
  function allWorkouts() { return (T.TEMPLATES || []).concat(data.workouts || []); }
  function findWorkout(id) { return allWorkouts().filter(function (w) { return w.id === id; })[0] || null; }
  function stepsFor(w) { return T.buildSteps(w, exIndex, { prepSeconds: data.settings.prepSeconds }); }
  function voiceKeys(steps) {
    var keys = Object.keys(T.VOICE_LINES || {});
    steps.forEach(function (s) {
      var k = s.exId ? 'ex_' + s.exId : null;
      if (k && keys.indexOf(k) < 0) keys.push(k);
    });
    return keys;
  }
  function peachSvg() {
    var r = '';
    PEACH.forEach(function (row, y) {
      for (var x = 0; x < row.length; x++) {
        var c = PEACH_COLORS[row[x]];
        if (c) r += '<rect x="' + x + '" y="' + y + '" width="1" height="1" fill="' + c + '"/>';
      }
    });
    return '<svg viewBox="0 0 12 12" aria-hidden="true">' + r + '</svg>';
  }

  /* ---------- Start ---------- */
  function renderStart() {
    $('brand-logo').innerHTML = peachSvg();
    $('start-list').innerHTML = allWorkouts().map(function (w) {
      var steps = stepsFor(w);
      return '<article class="card" style="--theme:' + themeColor(w.theme) + '">' +
        '<div class="card-main"><h3>' + T.esc(w.name) + '</h3>' +
        '<p>' + T.fmt(T.totalSeconds(steps)) + ' \u00b7 ' + T.workCount(steps) + ' \u00dcbungen</p></div>' +
        '<button class="btn-start" data-start="' + T.esc(w.id) + '">Start</button></article>';
    }).join('');
  }

  function setLoading(on) {
    Array.prototype.forEach.call(document.querySelectorAll('[data-start]'), function (b) {
      b.disabled = on;
      if (on) b.setAttribute('data-label', b.textContent);
      b.textContent = on ? 'L\u00e4dt \u2026' : (b.getAttribute('data-label') || b.textContent);
    });
  }

  function wakeOn() {
    T.wake.on().then(function (ok) {
      if (!ok && !wakeWarned) {
        wakeWarned = true;
        toast('Bildschirm bleibt evtl. nicht an. Stromsparmodus aus?');
      }
    });
  }

  /* Muss aus einem Tipp heraus aufgerufen werden: Ton und Bildschirm-an brauchen das */
  function startWorkout(id) {
    var w = findWorkout(id);
    if (!w || run) return;
    T.audio.unlock();
    wakeOn();
    var steps = stepsFor(w);
    setLoading(true);
    var timeout = new Promise(function (res) { setTimeout(res, 2500); });
    Promise.race([T.audio.load(voiceKeys(steps)), timeout]).then(function () {
      setLoading(false);
      run = { workout: { id: w.id, name: w.name, theme: w.theme || 'core' }, engine: T.Engine(steps) };
      enterTraining();
      handle(run.engine.start());
      render();
      save(true);
    });
  }

  /* ---------- Training ---------- */
  function enterTraining() {
    $('screen-train').style.setProperty('--theme', themeColor(run.workout.theme));
    $('t-name').textContent = run.workout.name;
    buildDots();
    lastIndex = -2;
    show('train');
    if (timer) clearInterval(timer);
    timer = setInterval(loop, 250);
    render();
  }

  function loop() {
    if (!run) return;
    handle(run.engine.tick());
    render();
    save(false);
  }

  function handle(events) {
    (events || []).forEach(function (ev) {
      if (!run) return;
      T.audio.play(T.announce(ev, { steps: run.engine.steps, settings: data.settings, hasClip: T.audio.hasClip }));
      if (ev.type === 'done') finish();
    });
  }

  function save(force) {
    if (!run) return;
    var t = Date.now();
    if (!force && t - lastSave < 1000) return;
    lastSave = t;
    T.store.saveRun({ v: 1, workout: run.workout, engine: run.engine.snapshot() });
  }

  function buildDots() {
    var total = run.engine.view().workTotal;
    var box = $('t-dots');
    if (total > 24) { box.innerHTML = '<div class="bar"><b id="t-dotbar"></b></div>'; return; }
    var h = '';
    for (var i = 0; i < total; i++) h += '<i></i>';
    box.innerHTML = h;
  }

  function updateDots(v) {
    var done = v.workPos - 1;   // bei Pause/Vorbereitung zeigt workPos auf die kommende Uebung
    var bar = $('t-dotbar');
    if (bar) { bar.style.width = (100 * done / Math.max(1, v.workTotal)) + '%'; return; }
    Array.prototype.forEach.call($('t-dots').children, function (d, i) {
      d.className = i < done ? 'done' : (i === done ? (v.step.kind === 'work' ? 'cur' : 'up') : '');
    });
  }

  function showExercise(v) {
    var s = v.step;
    var target = s.kind === 'rest' ? v.nextWork : s;
    var ex = target && target.exId ? exIndex[target.exId] : null;
    $('t-icon').innerHTML = ICONS[(ex && ex.icon) || 'ganz'] || ICONS.ganz;
    if (s.kind === 'rest') {
      $('t-ex').textContent = 'Durchatmen';
      $('t-desc').textContent = target ? 'Gleich: ' + target.name : '';
    } else {
      $('t-ex').textContent = s.name;
      $('t-desc').textContent = ex ? ex.beschreibung : '';
    }
    var nw = v.nextWork;
    $('t-next-name').textContent = nw ? nw.name : 'Geschafft!';
    $('t-next-dur').textContent = nw ? T.fmt(nw.duration) : '';
    $('t-next-sub').textContent = (s.kind !== 'rest' && v.next && v.next.kind === 'rest') ?
      'nach ' + T.fmt(v.next.duration) + ' Pause' : '';
  }

  function phaseText(v) {
    var s = v.step;
    if (v.paused) return 'Pausiert';
    if (s.kind === 'prep') return 'Gleich geht\u2019s los';
    if (s.kind === 'rest') return 'Pause';
    return s.rounds > 1 ? 'Runde ' + s.round + ' von ' + s.rounds : '';
  }

  function render() {
    if (!run) return;
    var v = run.engine.view();
    if (v.index < 0) return;
    var scr = $('screen-train');
    scr.classList.toggle('is-rest', v.step.kind === 'rest');
    scr.classList.toggle('is-prep', v.step.kind === 'prep');
    scr.classList.toggle('is-paused', v.paused);
    $('t-sub').textContent = '\u00dcbung ' + v.workPos + ' von ' + v.workTotal + ' \u00b7 noch ' + T.fmt(v.remainingTotal);
    updateDots(v);

    var bar = $('t-bar');
    var offset = RING_C * (1 - (v.duration ? v.remaining / v.duration : 0));
    if (v.index !== lastIndex) {
      bar.style.transition = 'none';
      bar.style.strokeDashoffset = offset;
      bar.getBoundingClientRect();
      bar.style.transition = '';
      showExercise(v);
      lastIndex = v.index;
    } else {
      bar.style.strokeDashoffset = offset;
    }
    $('t-phase').textContent = phaseText(v);
    $('t-time').textContent = T.fmt(v.remaining);
    $('t-of').textContent = 'von ' + T.fmt(v.duration);
    $('b-toggle-ic').textContent = v.paused ? '\u25b6\ufe0e' : '\u275a\u275a';
    $('b-toggle-label').textContent = v.paused ? 'Weiter' : 'Pause';

    var dbg = $('t-debug');
    if (data.settings.debugClock && v.startedAt) {
      dbg.hidden = false;
      dbg.textContent = 'Start ' + new Date(v.startedAt).toLocaleTimeString('de-DE') +
        ' \u00b7 seit Start ' + T.fmt((Date.now() - v.startedAt) / 1000) +
        ' \u00b7 Pausen ' + T.fmt(v.pausedSec) +
        ' \u00b7 Rest gesamt ' + T.fmt(v.remainingTotal);
    } else {
      dbg.hidden = true;
    }
  }

  function act(events) {
    if (!run) return;
    handle(events);
    render();
    save(true);
  }

  function togglePause() {
    if (!run) return;
    run.engine.toggle();
    render();
    save(true);
  }

  function stopTimer() {
    if (timer) clearInterval(timer);
    timer = null;
  }

  function finish() {
    var v = run.engine.view();
    var steps = run.engine.steps;
    var entry = {
      id: T.uid('l'),
      workoutId: run.workout.id,
      name: run.workout.name,
      date: new Date().toISOString(),
      plannedSec: T.totalSeconds(steps),
      actualSec: Math.round((Date.now() - v.startedAt) / 1000),
      adjustments: run.engine.adjustments.slice()
    };
    data.log.push(entry);
    T.store.save(data);
    T.store.clearRun();
    T.wake.off();
    stopTimer();
    setNeedTap(false);
    var wid = run.workout.id;
    run = null;
    $('done-sub').textContent = T.fmt(entry.actualSec) + ' trainiert \u00b7 ' + v.workTotal + ' \u00dcbungen';
    $('b-again').setAttribute('data-start', wid);
    show('done');
  }

  function abort() {
    T.store.clearRun();
    T.wake.off();
    stopTimer();
    setNeedTap(false);
    run = null;
    renderStart();
    show('start');
  }

  /* ---------- Tippen ---------- */
  /* Hinweis "Einmal tippen": nach Neuladen oder wenn iOS den Ton angehalten hat */
  function setNeedTap(on) {
    needTap = on;
    $('banner').hidden = !on;
  }

  function onFirstTap(e) {
    if (!needTap) return;
    setNeedTap(false);
    T.audio.unlock();
    if (run) T.audio.load(voiceKeys(run.engine.steps));
    T.wake.on();
    e.stopPropagation();
    e.preventDefault();
  }

  function bind() {
    document.addEventListener('click', onFirstTap, true);
    document.addEventListener('click', function (e) {
      var b = e.target.closest ? e.target.closest('[data-start]') : null;
      if (b && !b.disabled) startWorkout(b.getAttribute('data-start'));
    });
    $('t-mid').addEventListener('click', togglePause);
    $('b-toggle').addEventListener('click', togglePause);
    $('b-prev').addEventListener('click', function () { if (run) act(run.engine.prev()); });
    $('b-next').addEventListener('click', function () { if (run) act(run.engine.next()); });
    $('b-minus').addEventListener('click', function () { if (run) act(run.engine.adjust(-15)); });
    $('b-plus').addEventListener('click', function () { if (run) act(run.engine.adjust(15)); });
    $('b-close').addEventListener('click', function () {
      if (run && window.confirm('Training beenden?')) abort();
    });
    $('b-home').addEventListener('click', function () { renderStart(); show('start'); });
    document.addEventListener('visibilitychange', function () {
      if (document.hidden) return;
      T.audio.resume();
      loop();
      // iOS kann den Ton nach Sperre oder App-Wechsel anhalten; dann braucht es einen Tipp
      setTimeout(function () { if (run && !T.audio.unlocked()) setNeedTap(true); }, 500);
    });
  }

  /* ---------- Start der App ---------- */
  function init() {
    bind();
    renderStart();
    // Laenger als 30 Minuten liegengebliebene Trainings werden nicht fortgesetzt
    var saved = T.store.loadRun(null, { maxAgeMs: 30 * 60 * 1000 });
    if (saved && saved.engine && !saved.engine.done) {
      try {
        run = { workout: saved.workout || { id: null, name: 'Training', theme: 'core' }, engine: T.Engine.restore(saved.engine) };
        enterTraining();
        T.wake.on();
        setNeedTap(true);
        loop();
        return;
      } catch (e) {
        T.store.clearRun();
        stopTimer();
        setNeedTap(false);
        run = null;
      }
    }
    show('start');
  }

  T.app = { init: init };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})(window.Takt);
