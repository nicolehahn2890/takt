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
  var lastStart = null;
  var noteEntryId = null, noteTimer = null;
  var learnAsk = null;   // offene Frage der lernenden Dauer: { w, s }
  var breathIdx = -1, breathLast = -1;   // Atem-Toene: Schritt und zuletzt gepruefte Schrittzeit    // { workout, opts } fuer \u201eNochmal\u201c, auch bei nicht gespeichertem Mix

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
      run = { workout: { id: w.id, name: w.name, theme: w.theme || 'core',
        source: w.source === 'template' || w.source === 'mix' ? w.source : 'own',
        origin: w.origin === 'mix' || w.source === 'mix' ? 'mix' : null,
        adjusted: !!(opts.budgetSec || (opts.intensity && opts.intensity !== 'normal')) }, engine: T.Engine(steps) };
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
    breathTones();
    render();
    save(false);
  }

  /* Atem-Modus: Ton zu Beginn von Einatmen/Ausatmen; verpasste Toene (z. B. aus dem Hintergrund) nicht nachholen */
  function breathTones() {
    if (!run) return;
    var v = run.engine.view();
    if (!v.step || v.step.kind !== 'work' || !v.step.atem || v.done) { breathIdx = -1; return; }
    if (breathIdx !== v.index) { breathIdx = v.index; breathLast = -1; }
    if (v.paused) return;
    var cues = T.breathCues(v.step.atem, breathLast, v.elapsedMs);
    breathLast = v.elapsedMs;
    var c = cues[cues.length - 1];
    var s = data.settings;
    if (c && v.elapsedMs - c.atMs < 600 && s.sounds !== false && s.announce !== 'silent') T.audio.play([{ type: 'beep', tone: c.tone }]);
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
    var parts = [];
    if (s.rounds > 1) parts.push('Runde ' + s.round + ' von ' + s.rounds);
    if (v.side) parts.push(v.side === 'links' ? 'Links' : 'Rechts');
    return parts.join(' \u00b7 ');
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
    // Atem-Modus: atmender Kreis statt Ring, Phase und deren Sekunden in der Mitte
    var atem = v.step.kind === 'work' && v.step.atem;
    scr.classList.toggle('is-breath', !!atem);
    if (atem) {
      var clock = T.breathClock(v.elapsedMs);
      var b = clock > 0 ? T.figure.breathAt(atem, clock) : { label: 'Einatmen', left: atem.ein || 0, k: 0 };
      $('t-breath').style.transform = 'scale(' + (0.6 + 0.4 * b.k).toFixed(3) + ')';
      if (!v.paused) $('t-phase').textContent = b.label;
      $('t-time').textContent = String(b.left);
      $('t-of').textContent = 'noch ' + T.fmt(v.remaining);
    }
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
      adjustments: run.engine.adjustments.slice(),
      source: run.workout.source || 'own',
      origin: run.workout.origin || null,
      adjusted: !!run.workout.adjusted,
      breathCount: breathDone(steps, run.engine.spentSeconds()),
      startedAt: v.startedAt ? new Date(v.startedAt).toISOString() : null,
      note: ''
    };
    data.log.push(entry);
    var fresh = checkBadges();
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
    $('done-adj').innerHTML = T.adjustSummary(entry.adjustments, exIndex).map(function (t) { return '<li>' + T.esc(t) + '</li>'; }).join('');
    renderFreshBadges(fresh);
    noteEntryId = entry.id;
    $('done-note').value = '';
    $('b-again').setAttribute('data-start', wid);
    renderLearn(wid);
    show('done');
  }

  /* Atem-Uebungen, bei denen mindestens die Haelfte der Zeit gelaufen ist (Abzeichen "Atemprofi") */
  function breathDone(steps, spent) {
    return steps.filter(function (s, i) { return s.kind === 'work' && s.atem && (spent[i] || 0) * 2 >= s.duration; }).length;
  }

  /* Abzeichen pruefen und erreichte merken; gibt die neu erreichten Ids zurueck (Speichern macht der Aufrufer) */
  function checkBadges() {
    var r = T.badgeCheck(data, new Date());
    data.badges = r.earned;
    return r.fresh;
  }
  function badgeById(id) { return (T.BADGES || []).filter(function (b) { return b.id === id; })[0]; }

  /* Neu erreichte Abzeichen im Fertig-Screen, mit kurzer Einblendung */
  function renderFreshBadges(ids) {
    var list = ids.map(badgeById).filter(Boolean);
    $('done-badges').innerHTML = list.length ? '<div class="done-bdg"><p>' + (list.length === 1 ? 'Neues Abzeichen' : 'Neue Abzeichen') + '</p><div class="bdg-row">' +
      list.map(function (b, i) { return T.badgeHtml(b, true, 'div', 'pop', 'animation-delay:' + (i * 120) + 'ms'); }).join('') + '</div></div>' : '';
  }

  /* Lernende Dauer: hoechstens eine Frage im Fertig-Screen (ungespeicherte Mixe haben kein Workout) */
  function renderLearn(wid) {
    var w = wid ? findWorkout(wid) : null;
    var s = w ? T.learnSuggestion(data.log, w, data.learn, exIndex) : null;
    learnAsk = s ? { w: w, s: s } : null;
    if (!s) { $('done-learn').innerHTML = ''; return; }
    var q = w.source === 'template' ? 'als eigenes Workout mit ' + s.to + ' s speichern?' : 'auf ' + s.to + ' s setzen?';
    $('done-learn').innerHTML = '<div class="learn-card">' +
      '<p class="learn-why">Die letzten 3 Male ' + (s.direction > 0 ? 'verl\u00e4ngert' : 'gek\u00fcrzt') + '</p>' +
      '<p class="learn-q">' + T.esc(s.name) + ' in \u201a' + T.esc(w.name) + '\u2018 ' + q + '</p>' +
      '<div class="row"><button class="btn rose" data-learn="yes">Ja</button><button class="btn" data-learn="no">Nein</button></div></div>';
  }

  /* Antwort auf die Frage: "Ja" aendert nur dieses Workout (Vorlage: Kopie), "Nein" fragt 10 Trainings lang nicht */
  function answerLearn(yes) {
    var w = learnAsk.w, s = learnAsk.s, msg;
    learnAsk = null;
    if (!data.learn || typeof data.learn !== 'object') data.learn = {};
    var key = T.learnKey(w.id, s.exId);
    if (!yes) {
      data.learn[key] = { snoozeUntil: T.learnCount(data.log, w.id) + T.LEARN_SNOOZE };
      msg = 'Alles klar, ' + s.name + ' bleibt bei ' + s.from + ' s.';
    } else if (w.source === 'template') {
      var res = T.validateWorkout(T.applyLearn(T.copyWorkout(w), s.exId, s.to));
      if (!res.ok) { toast(res.errors[0].msg); return; }
      data.workouts.unshift(res.workout);
      data.learn[key] = { since: data.log.length };
      $('b-again').setAttribute('data-start', res.workout.id);
      msg = 'Gespeichert als \u201e' + res.workout.name + '\u201c.';
    } else {
      var i = data.workouts.indexOf(w);
      var c = T.applyLearn(w, s.exId, s.to);
      c.updatedAt = new Date().toISOString();
      if (i >= 0) data.workouts[i] = c;
      data.learn[key] = { since: data.log.length };
      msg = 'Gespeichert: ' + s.name + ' jetzt ' + s.to + ' s.';
    }
    T.store.save(data);
    $('done-learn').innerHTML = '<p class="learn-ok">' + T.esc(msg) + '</p>';
  }

  /* Notiz im Fertig-Screen: wird kurz nach dem Tippen im Protokoll gespeichert */
  function saveNote() {
    var e = (data.log || []).filter(function (x) { return x.id === noteEntryId; })[0];
    if (!e) return;
    e.note = $('done-note').value.slice(0, 500);
    T.store.save(data);
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
    $('done-note').addEventListener('input', function () { clearTimeout(noteTimer); noteTimer = setTimeout(saveNote, 400); });
    $('done-note').addEventListener('blur', function () { clearTimeout(noteTimer); saveNote(); });
    $('done-learn').addEventListener('click', function (ev) {
      var b = ev.target.closest('[data-learn]');
      if (b && learnAsk) answerLearn(b.getAttribute('data-learn') === 'yes');
    });
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
      home: function () { renderStart(); show('start'); window.scrollTo(0, 0); },
      badges: function () { var f = checkBadges(); if (f.length) T.store.save(data); return f.map(badgeById).filter(Boolean); }
    };
    if (T.home) T.home.init(api);
    if (T.editor) T.editor.init(api);
    if (T.statsView) T.statsView.init(api);
    // Abzeichen still nachtragen (alte Trainings zaehlen mit, gefeiert wird nur Neues nach einem Training)
    if (checkBadges().length) T.store.save(data);
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
