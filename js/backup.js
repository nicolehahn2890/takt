/* Takt: Backup als JSON-Datei { app: 'takt', version: 1, exportedAt, data: <takt_v1>, photos: { photoId: dataURL } }.
   Lesen prueft alles vorab; ungueltige Workouts und eigene Uebungen fallen weg und werden gezaehlt. */
window.Takt = window.Takt || {};
(function (T) {
  'use strict';

  var VERSION = 1;
  T.BACKUP_VERSION = VERSION;

  function isObj(v) { return v !== null && typeof v === 'object' && !Array.isArray(v); }
  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function validDate(d) { return d instanceof Date && !isNaN(d.getTime()); }

  T.makeBackup = function (data, photos, now) {
    now = validDate(now) ? now : new Date();
    var text = JSON.stringify({ app: 'takt', version: VERSION, exportedAt: now.toISOString(), data: data || {}, photos: photos || {} });
    return { filename: 'takt-backup-' + now.getFullYear() + '-' + pad(now.getMonth() + 1) + '-' + pad(now.getDate()) + '.json', text: text };
  };

  function fail(msg) { return { ok: false, error: msg }; }

  T.readBackup = function (text) {
    var raw;
    try { raw = JSON.parse(String(text)); } catch (e) { return fail('Die Datei ist besch\u00e4digt.'); }
    if (!isObj(raw) || raw.app !== 'takt') return fail('Das ist keine Takt-Sicherung.');
    if (typeof raw.version === 'number' && raw.version > VERSION) return fail('Diese Sicherung ist von einer neueren Takt-Version.');
    if (raw.version !== VERSION || !isObj(raw.data)) return fail('Die Datei ist besch\u00e4digt.');

    // Dieselbe Pruefung wie beim normalen Laden: fehlende oder falsche Teile bekommen Standardwerte
    var mem = { getItem: function () { return JSON.stringify(raw.data); }, setItem: function () {}, removeItem: function () {} };
    var data = T.store.load(mem);
    var dropped = { workouts: 0, exercisesOwn: 0 };

    data.workouts = data.workouts.filter(function (w) {
      var ok = isObj(w) && T.validateWorkout(w).ok;
      if (!ok) dropped.workouts++;
      return ok;
    }).map(function (w) {
      var at = new Date(w.updatedAt);
      return T.validateWorkout(w, validDate(at) ? at : undefined).workout;
    });
    data.exercisesOwn = data.exercisesOwn.filter(function (e) {
      var ok = isObj(e) && T.store.validateOwn(e).ok;
      if (!ok) dropped.exercisesOwn++;
      return ok;
    }).map(function (e) { return T.store.validateOwn(e).exercise; });
    data.log = data.log.filter(isObj);
    if (!isObj(data.settings)) data.settings = T.store.defaults().settings;
    if (validDate(new Date(raw.exportedAt))) data.settings.lastBackup = new Date(raw.exportedAt).toISOString();

    var photos = {};
    if (isObj(raw.photos)) {
      Object.keys(raw.photos).forEach(function (id) {
        var v = raw.photos[id];
        if (typeof v === 'string' && /^data:image\/[a-z+.-]+;base64,/i.test(v)) photos[id] = v;
      });
    }
    return {
      ok: true, data: data, photos: photos,
      report: { workouts: data.workouts.length, exercisesOwn: data.exercisesOwn.length, log: data.log.length,
        photos: Object.keys(photos).length, dropped: dropped }
    };
  };

  /* "Noch kein Backup" / "Letztes Backup: heute | gestern | vor 12 Tagen" (Kalendertage, Ortszeit) */
  T.backupAgo = function (iso, now) {
    var d = iso ? new Date(iso) : null;
    if (!validDate(d)) return 'Noch kein Backup';
    now = validDate(now) ? now : new Date();
    var day = function (x) { return Math.round(Date.UTC(x.getFullYear(), x.getMonth(), x.getDate()) / 864e5); };
    var n = Math.max(0, day(now) - day(d));
    return 'Letztes Backup: ' + (n === 0 ? 'heute' : n === 1 ? 'gestern' : 'vor ' + n + ' Tagen');
  };
})(window.Takt);
