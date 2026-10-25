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
        intensity: 'normal', budgetLast: null, showImages: true
      },
      log: [],
      learn: {},
      notes: {},
      badges: {}
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

  var OWN_TAGS = ['vacuum', 'atmung', 'core', 'bauch', 'ruecken', 'beine-po', 'dehnen', 'yoga', 'ganzkoerper', 'oberkoerper', 'aufwaermen'];

  /* Video-Link: ergaenzt https://, erlaubt nur http und https, sonst null */
  function normalizeUrl(s) {
    if (typeof s !== 'string') return null;
    var t = s.trim();
    if (!t || /\s/.test(t)) return null;
    if (!/^[a-z][a-z0-9+.-]*:/i.test(t)) t = 'https://' + t;
    return /^https?:\/\/[^\/\s]+\.[^\/\s]+/i.test(t) ? t : null;
  }

  /* Eigene Uebung pruefen und vollstaendig aufbauen */
  function validateOwn(input) {
    input = input || {};
    var errors = [];
    var name = typeof input.name === 'string' ? input.name.trim() : '';
    if (!name || name.length > 60) errors.push({ field: 'name', msg: 'Bitte einen Namen mit 1 bis 60 Zeichen eingeben.' });
    var beschreibung = typeof input.beschreibung === 'string' ? input.beschreibung.trim() : '';
    if (beschreibung.length > 320) errors.push({ field: 'beschreibung', msg: 'Die Beschreibung darf h\u00f6chstens 320 Zeichen haben.' });
    var tags = Array.isArray(input.tags) ? input.tags : [];
    if (tags.some(function (t) { return OWN_TAGS.indexOf(t) < 0; })) errors.push({ field: 'tags', msg: 'Unbekanntes Thema.' });
    var video = null;
    if (input.videoUrl != null && String(input.videoUrl).trim() !== '') {
      video = normalizeUrl(String(input.videoUrl));
      if (!video) errors.push({ field: 'videoUrl', msg: 'Bitte einen Link mit http oder https eingeben, z. B. https://youtu.be/...' });
    }
    var id = (typeof input.id === 'string' && input.id.indexOf('own-') === 0) ? input.id : T.uid('own-');
    return {
      ok: !errors.length,
      errors: errors,
      exercise: {
        id: id, name: name, alias: [], beschreibung: beschreibung, hinweis: '', tags: tags,
        beidseitig: !!input.beidseitig, typ: 'zeit', atem: null, hilfsmittel: [], bild: null, icon: 'ganz',
        quelle: 'eigen', videoUrl: video, photoId: input.photoId || null
      }
    };
  }

  T.store = {
    KEY: KEY,
    OWN_TAGS: OWN_TAGS,
    normalizeUrl: normalizeUrl,
    validateOwn: validateOwn,
    RUN_KEY: RUN_KEY,
    defaults: defaults,
    load: load,
    save: function (data, s) { return write(KEY, data, s); },
    /* opts.maxAgeMs: aelter gespeicherte Trainings werden verworfen (und geloescht) */
    loadRun: function (s, opts) {
      var r = read(RUN_KEY, s);
      if (!isObj(r)) return null;
      if (opts && opts.maxAgeMs) {
        var now = opts.now != null ? opts.now : Date.now();
        if (typeof r.savedAt !== 'number' || now - r.savedAt > opts.maxAgeMs) {
          T.store.clearRun(s);
          return null;
        }
      }
      return r;
    },
    saveRun: function (snap, s, now) {
      var copy = {};
      Object.keys(snap || {}).forEach(function (k) { copy[k] = snap[k]; });
      copy.savedAt = now != null ? now : Date.now();
      return write(RUN_KEY, copy, s);
    },
    clearRun: function (s) {
      var st = storageOf(s);
      if (!st) return;
      try { st.removeItem(RUN_KEY); } catch (e) { /* egal */ }
    },
    /* Alles zuruecksetzen (wie neu installiert); Fotos loescht der Aufrufer in IndexedDB. true = geklappt */
    reset: function (s) {
      var st = storageOf(s);
      if (!st) return false;
      try {
        st.removeItem(KEY);
        st.removeItem(RUN_KEY);
        return st.getItem(KEY) === null;
      } catch (e) { return false; }
    }
  };
})(window.Takt);
