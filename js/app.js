/* Takt: App. Screens Start, Training, Fertig; verdrahtet Engine, Ansagen, Ton, Speicher. */
window.Takt = window.Takt || {};
(function (T) {
  'use strict';
  var $ = function (id) { return document.getElementById(id); };
  var RING_C = 2 * Math.PI * 138;

  var data = T.store.load();
  var exIndex = T.indexExercises((T.EXERCISES || []).concat(data.exercisesOwn || []));
  var run = null;          // { workout: {id, name, theme}, engine }
  var timer = null;
  var lastSave = 0;
  var lastIndex = -2;
  var needTap = false;
  var wakeWarned = false;
  var enteredAt = 0;       // Zeitpunkt, an dem der Training-Screen erschien
  var lastStart = null;    // { workout, opts } fuer \u201eNochmal\u201c, auch bei nicht gespeichertem Mix

  /* ---------- Hilfen ---------- */
  function show(name) {
    Array.prototype.forEach.call(document.querySelectorAll('.screen'), function (el) { el.hidden = el.id !== 'screen-' + name; });
    if (name !== 'done') T.figure.unmount($('done-fig'));
    // Leiste unten nur auf den drei Hauptseiten
    var tabbed = name === 'start' || name === 'lib' || name === 'stats';
    $('tabbar').hidden = !tabbed;
    document.body.classList.toggle('has-tabbar', tabbed);
    Array.prototype.forEach.call($('tabbar').children, function (b) { b.classList.toggle('on', b.getAttribute('data-tab') === name); });
  }
  function openTab(tab) {
    if (tab === 'lib' && T.library) return T.library.open();
    if (tab === 'stats') { if (T.statsView) T.statsView.open(); else show('stats'); window.scrollTo(0, 0); return; }
    renderStart();
    show('start');
    window.scrollTo(0, 0);
  }
  function toast(msg) {
    var t = $('toast');
    t.textContent = msg;
    t.hidden = false;
    clearTimeout(toast.h);
    toast.h = setTimeout(function () { t.hidden = true; }, 4500);
  }
  function themeColor(theme) { return (T.THEMES[theme] || T.THEMES.core).color; }
  function allWorkouts() { return (T.TEMPLATES || []).concat(data.workouts || []); }
  function findWorkout(id) { return allWorkouts().filter(function (w) { return w.id === id; })[0] || null; }
  function voiceKeys(steps) {
    var keys = Object.keys(T.VOICE_LINES || {});
    steps.forEach(function (s) {
      var k = s.exId ? 'ex_' + s.exId : null;
      if (k && keys.indexOf(k) < 0) keys.push(k);
    });
    return keys;
  }

  /* ---------- Start ---------- */
  function renderStart() {
    $('brand-logo').innerHTML = '<img src="assets/takt-mark.svg" alt="">';
    if (T.home) T.home.render();
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

  /* Muss aus einem Tipp heraus aufgerufen werden: Ton und Bildschirm-an brauchen das.
     ref: Id oder Workout-Objekt (z. B. ungespeicherter Mix); opts: { intensity, budgetSec } aus dem Anpassen-Fenster */
  function startWorkout(ref, opts) {
    var w = typeof ref === 'string' ? findWorkout(ref) : ref;
    if (!w && lastStart && lastStart.workout.id === ref) w = lastStart.workout;
    if (!w || run) return;
    opts = opts || {};
    lastStart = { workout: w, opts: opts };
    T.audio.unlock();
    wakeOn();
    var steps = T.prepareSteps(w, exIndex, { prepSeconds: data.settings.prepSeconds, intensity: opts.intensity, budgetSec: opts.budgetSec });
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
    enteredAt = Date.now();
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
    if (total > 24) { box.innerHTML = '<div class="dbar"><b id="t-dotbar"></b></div>'; return; }
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
    var ex = target ? T.exerciseFor(target.exId, exIndex, target.name) : null;
    showFigure(ex);
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

  /* Figur der Uebung: eigenes Foto, Atem-Kreis, Haltung oder Standardfigur */
  function showFigure(ex) {
    var fig = $('t-fig'), img = $('t-photo');
    T.figure.unmount(fig);
    if (ex && ex.photoId) {
      fig.style.display = 'none';
      img.hidden = false;
      img.removeAttribute('src');
      T.photos.load(ex.photoId).then(function (u) {
        if (u) { img.src = u; return; }
        img.hidden = true;
        fig.style.display = '';
        T.figure.mount(fig, T.POSE_DEFAULT);
      });
      return;
    }
    img.hidden = true;
    fig.style.display = '';
    var pose = (ex && ex.typ === 'atem' && ex.atem) ? { breath: ex.atem } : ((ex && (T.POSES || {})[ex.id]) || T.POSE_DEFAULT);
    T.figure.mount(fig, pose);
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
    T.figure.unmount($('t-fig'));
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
      activeSec: v.activeSec,
      theme: run.workout.theme || 'core',
      areaSec: T.areaSeconds(steps, run.engine.spentSeconds(), exIndex),
      adjustments: run.engine.adjustments.slice()
    };
    data.log.push(entry);
    T.store.save(data);
    T.store.clearRun();
    T.wake.off();
    stopTimer();
    setNeedTap(false);
    var wid = run.workout.id;
    // Geschafft-Figur (Design v2): Kindhaltung in der Themenfarbe, wird in show() wieder abgemeldet
    $('screen-done').style.setProperty('--theme', themeColor(run.workout.theme));
    T.figure.mount($('done-fig'), (T.POSES || {}).kindhaltung || T.POSE_DEFAULT);
    run = null;
    $('done-sub').textContent = T.fmt(entry.activeSec) + ' trainiert \u00b7 ' + v.workTotal + ' \u00dcbungen';
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
      if (b && !b.disabled) startWorkout(b.getAttribute('data-start'), b.id === 'b-again' && lastStart ? lastStart.opts : null);
    });
    // Mitte tippen = Pause; kurz nach dem Start ignorieren (zweiter Tipp auf Start)
    $('t-mid').addEventListener('click', function () { if (Date.now() - enteredAt > 700) togglePause(); });
    $('b-toggle').addEventListener('click', togglePause);
    $('b-prev').addEventListener('click', function () { if (run) act(run.engine.prev()); });
    $('b-next').addEventListener('click', function () { if (run) act(run.engine.next()); });
    $('b-minus').addEventListener('click', function () { if (run) act(run.engine.adjust(-15)); });
    $('b-plus').addEventListener('click', function () { if (run) act(run.engine.adjust(15)); });
    $('b-close').addEventListener('click', function () {
      if (run && window.confirm('Training beenden?')) abort();
    });
    $('b-home').addEventListener('click', function () { renderStart(); show('start'); });
    $('tabbar').addEventListener('click', function (e) {
      var b = e.target.closest('[data-tab]');
      if (b) openTab(b.getAttribute('data-tab'));
    });
    document.addEventListener('visibilitychange', function () {
      if (document.hidden) return;
      T.audio.resume();
      loop();
      // iOS kann den Ton nach Sperre oder App-Wechsel anhalten; dann braucht es einen Tipp
      setTimeout(function () { if (run && !T.audio.unlocked()) setNeedTap(true); }, 500);
    });
  }

  /* ---------- Start der App ---------- */
  function reindex() {
    exIndex = T.indexExercises((T.EXERCISES || []).concat(data.exercisesOwn || []));
  }

  function init() {
    bind();
    if (T.library) {
      T.library.init({
        data: function () { return data; },
        save: function () { return T.store.save(data); },
        reindex: reindex,
        show: show,
        toast: toast,
        home: function () { renderStart(); show('start'); }
      });
    }
    var api = {
      data: function () { return data; },
      save: function () { return T.store.save(data); },
      exIndex: function () { return exIndex; },
      find: findWorkout,
      start: startWorkout,
      show: show,
      toast: toast,
      home: function () { renderStart(); show('start'); window.scrollTo(0, 0); }
    };
    if (T.home) T.home.init(api);
    if (T.editor) T.editor.init(api);
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
