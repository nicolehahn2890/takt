/* Takt: Ton-Wiedergabe ueber Web Audio (Toene + Sprachdateien).
   Audio-Modus 'ambient', damit Spotify weiterlaeuft (iPhone-Test 2). */
window.Takt = window.Takt || {};
(function (T) {
  'use strict';
  var ctx = null;
  var buffers = {};
  var bounds = {};
  var loading = {};
  var playing = [];
  var TONES = { tick: [880, 0.15], go: [1320, 0.35], warn: [660, 0.25], rest: [520, 0.3], end: [1320, 0.6] };

  function files() { return T.VOICE_FILES || {}; }

  function decode(arrayBuffer) {
    return new Promise(function (resolve, reject) { ctx.decodeAudioData(arrayBuffer, resolve, reject); });
  }

  function forget(node) {
    var i = playing.indexOf(node);
    if (i >= 0) playing.splice(i, 1);
  }

  function stopAll() {
    playing.slice().forEach(function (n) { try { n.stop(); } catch (e) { /* schon fertig */ } });
    playing = [];
  }

  function beepAt(freq, dur, t) {
    var o = ctx.createOscillator();
    var g = ctx.createGain();
    o.type = 'sine';
    o.frequency.value = freq;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.6, t + 0.015);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g);
    g.connect(ctx.destination);
    o.onended = function () { forget(o); };
    playing.push(o);
    o.start(t);
    o.stop(t + dur + 0.05);
  }

  T.audio = {
    /* Muss direkt in einem Tipp aufgerufen werden (iOS-Regel) */
    unlock: function () {
      try { if (navigator.audioSession) navigator.audioSession.type = 'ambient'; } catch (e) { /* aelteres iOS */ }
      if (!ctx) {
        var C = window.AudioContext || window.webkitAudioContext;
        if (!C) return Promise.resolve(false);
        ctx = new C();
      }
      try {
        var b = ctx.createBuffer(1, 1, 22050);
        var s = ctx.createBufferSource();
        s.buffer = b;
        s.connect(ctx.destination);
        s.start(0);
      } catch (e) { /* egal */ }
      var p = ctx.state !== 'running' && ctx.resume ? ctx.resume() : null;
      return Promise.resolve(p).then(function () { return ctx.state === 'running'; }, function () { return false; });
    },

    unlocked: function () { return !!ctx && ctx.state === 'running'; },

    resume: function () {
      if (ctx && ctx.state !== 'running' && ctx.resume) { try { ctx.resume(); } catch (e) { /* egal */ } }
    },

    hasClip: function (key) { return !!files()[key]; },

    /* Laedt und dekodiert Sprachdateien; Fehler werden still uebergangen */
    load: function (keys) {
      if (!ctx) return Promise.resolve(0);
      var jobs = (keys || []).filter(function (k) { return files()[k] && !buffers[k]; }).map(function (k) {
        if (!loading[k]) {
          loading[k] = fetch(files()[k].src)
            .then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.arrayBuffer(); })
            .then(decode)
            .then(function (buf) {
              buffers[k] = buf;
              bounds[k] = T.silenceBounds(buf.getChannelData(0), buf.sampleRate, 0.01, 0.03);
              return 1;
            })
            .catch(function () { delete loading[k]; return 0; });
        }
        return loading[k];
      });
      return Promise.all(jobs).then(function (r) { return r.reduce(function (a, b) { return a + b; }, 0); });
    },

    /* Spielt Aktionen aus Takt.announce nacheinander ab */
    play: function (actions) {
      if (!ctx || !actions || !actions.length) return;
      T.audio.resume();
      if (actions.some(function (a) { return a.type === 'clip'; })) stopAll();
      var t = ctx.currentTime + 0.03;
      actions.forEach(function (a) {
        if (a.type === 'beep') {
          var tone = TONES[a.tone] || TONES.tick;
          beepAt(tone[0], tone[1], t);
          t += tone[1] + 0.06;
        } else if (a.type === 'clip') {
          var buf = buffers[a.key];
          if (!buf) return;
          var b = bounds[a.key];
          var src = ctx.createBufferSource();
          src.buffer = buf;
          src.connect(ctx.destination);
          src.onended = function () { forget(src); };
          playing.push(src);
          src.start(t, b.start, b.end - b.start);
          t += (b.end - b.start) + 0.12;
        }
      });
    }
  };
})(window.Takt);
