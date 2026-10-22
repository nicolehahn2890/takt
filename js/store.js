/* Takt: Speicher. Keys takt_v1 und takt_run_v1 NIE umbenennen. */
window.Takt = window.Takt || {};
(function (T) {
  'use strict';
  var KEY = 'takt_v1';
  var RUN_KEY = 'takt_run_v1';

  function defaults() {
    return {
      version: 1,
      workouts: [],
      exercisesOwn: [],
      settings: {
        lang: 'de', announce: 'full', sounds: true,
        defaultWork: 40, defaultRest: 10, prepSeconds: 5,
        debugClock: true, intensity: 'normal', budgetLast: null, showImages: true
      },
      log: [],
      learn: {}
    };
  }

  function isObj(v) { return v !== null && typeof v === 'object' && !Array.isArray(v); }

  function storageOf(s) {
    if (s) return s;
    try { return window.localStorage || null; } catch (e) { return null; }
  }

  function read(key, s) {
    var st = storageOf(s);
    if (!st) return null;
    try {
      var raw = st.getItem(key);
      return raw == null ? null : JSON.parse(raw);
    } catch (e) { return null; }
  }

  function write(key, value, s) {
    var st = storageOf(s);
    if (!st) return false;
    try { st.setItem(key, JSON.stringify(value)); return true; } catch (e) { return false; }
  }

  /* Gespeicherte Daten laden; Fehlendes oder Kaputtes wird mit Standardwerten ersetzt */
  function load(s) {
    var d = defaults();
    var raw = read(KEY, s);
    if (!isObj(raw)) return d;
    Object.keys(raw).forEach(function (k) {
      var def = d[k], val = raw[k];
      if (k === 'settings') {
        if (isObj(val)) Object.keys(val).forEach(function (sk) { d.settings[sk] = val[sk]; });
      } else if (Array.isArray(def)) {
        if (Array.isArray(val)) d[k] = val;
      } else if (isObj(def)) {
        if (isObj(val)) d[k] = val;
      } else if (val !== undefined) {
        d[k] = val;
      }
    });
    return d;
  }

  T.store = {
    KEY: KEY,
    RUN_KEY: RUN_KEY,
    defaults: defaults,
    load: load,
    save: function (data, s) { return write(KEY, data, s); },
    loadRun: function (s) { var r = read(RUN_KEY, s); return isObj(r) ? r : null; },
    saveRun: function (snap, s) { return write(RUN_KEY, snap, s); },
    clearRun: function (s) {
      var st = storageOf(s);
      if (!st) return;
      try { st.removeItem(RUN_KEY); } catch (e) { /* egal */ }
    }
  };
})(window.Takt);
