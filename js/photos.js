/* Takt: Fotos eigener Uebungen in IndexedDB (nur Browser).
   Fotos werden auf die laengste Seite 600 px verkleinert und als JPEG gespeichert. */
window.Takt = window.Takt || {};
(function (T) {
  'use strict';
  var DB = 'takt_photos_v1';
  var STORE = 'photos';
  var MAX = 600;
  var dbPromise = null;

  function open() {
    if (dbPromise) return dbPromise;
    dbPromise = new Promise(function (resolve, reject) {
      if (!window.indexedDB) { reject(new Error('Fotos werden von diesem Browser nicht unterst\u00fctzt.')); return; }
      var req = indexedDB.open(DB, 1);
      req.onupgradeneeded = function () { req.result.createObjectStore(STORE); };
      req.onsuccess = function () { resolve(req.result); };
      req.onerror = function () { reject(req.error || new Error('Fotospeicher nicht verf\u00fcgbar.')); };
    });
    return dbPromise;
  }

  function tx(mode, fn) {
    return open().then(function (db) {
      return new Promise(function (resolve, reject) {
        var t = db.transaction(STORE, mode);
        var result;
        t.oncomplete = function () { resolve(result); };
        t.onerror = function () { reject(t.error); };
        // Voller Speicher bricht die Transaktion oft nur ab (ohne error): sonst haengt "Speichern" fuer immer
        t.onabort = function () { reject(new Error('Der Fotospeicher ist voll oder nicht verf\u00fcgbar.')); };
        result = fn(t.objectStore(STORE));
      });
    });
  }

  /* Bild laden (auch HEIC auf dem iPhone, weil Safari es im <img> anzeigen kann) */
  function decode(blob) {
    return new Promise(function (resolve, reject) {
      var url = URL.createObjectURL(blob);
      var img = new Image();
      img.onload = function () { resolve({ img: img, url: url }); };
      img.onerror = function () { URL.revokeObjectURL(url); reject(new Error('Das Foto konnte nicht gelesen werden.')); };
      img.src = url;
    });
  }

  function shrink(blob) {
    return decode(blob).then(function (d) {
      var w = d.img.naturalWidth, h = d.img.naturalHeight;
      var k = Math.min(1, MAX / Math.max(w, h));
      var canvas = document.createElement('canvas');
      canvas.width = Math.max(1, Math.round(w * k));
      canvas.height = Math.max(1, Math.round(h * k));
      canvas.getContext('2d').drawImage(d.img, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(d.url);
      return new Promise(function (resolve, reject) {
        canvas.toBlob(function (b) {
          if (b) resolve({ blob: b, width: canvas.width, height: canvas.height });
          else reject(new Error('Das Foto konnte nicht verkleinert werden.'));
        }, 'image/jpeg', 0.82);
      });
    });
  }

  var urls = {};
  function forget(id) { if (urls[id]) { URL.revokeObjectURL(urls[id]); delete urls[id]; } }

  function toDataUrl(blob) {
    return new Promise(function (resolve) {
      if (!blob) { resolve(null); return; }
      var r = new FileReader();
      r.onload = function () { resolve(typeof r.result === 'string' ? r.result : null); };
      r.onerror = function () { resolve(null); };
      r.readAsDataURL(blob);
    });
  }

  function fromDataUrl(u) {
    var m = /^data:([^;,]+);base64,(.*)$/.exec(String(u || ''));
    if (!m) throw new Error('Ein Foto im Backup ist besch\u00e4digt.');
    var bin = atob(m[2]), arr = new Uint8Array(bin.length);
    for (var i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
    return new Blob([arr], { type: m[1] });
  }

  T.photos = {
    MAX: MAX,

    /* Speichert ein Foto, liefert die neue Id */
    save: function (blob) {
      return shrink(blob).then(function (r) {
        var id = T.uid('ph-');
        return tx('readwrite', function (store) { store.put({ blob: r.blob, width: r.width, height: r.height }, id); })
          .then(function () { return id; });
      });
    },

    /* Liefert eine Bild-Adresse fuer <img> oder null */
    load: function (id) {
      if (!id) return Promise.resolve(null);
      if (urls[id]) return Promise.resolve(urls[id]);
      return tx('readonly', function (store) {
        var req = store.get(id);
        return req;
      }).then(function (req) {
        var rec = req && req.result;
        if (!rec || !rec.blob) return null;
        urls[id] = URL.createObjectURL(rec.blob);
        return urls[id];
      }).catch(function () { return null; });
    },

    remove: function (id) {
      if (!id) return Promise.resolve();
      forget(id);
      return tx('readwrite', function (store) { store.delete(id); }).catch(function () { /* egal */ });
    },

    /* Alle Fotos als { id: dataURL } (fuer das Backup) */
    all: function () {
      return tx('readonly', function (store) { return { keys: store.getAllKeys(), vals: store.getAll() }; }).then(function (r) {
        var keys = r.keys.result || [], vals = r.vals.result || [];
        return Promise.all(keys.map(function (k, i) { return toDataUrl(vals[i] && vals[i].blob).then(function (u) { return [k, u]; }); }));
      }).then(function (pairs) {
        var out = {};
        pairs.forEach(function (p) { if (p[1]) out[p[0]] = p[1]; });
        return out;
      });
    },

    /* Foto aus dem Backup unter seiner alten Id speichern; scheitert, wenn das Bild nicht lesbar ist */
    putDataUrl: function (id, dataUrl) {
      var blob;
      try { blob = fromDataUrl(dataUrl); } catch (e) { return Promise.reject(e); }
      return decode(blob).then(function (d) {
        var rec = { blob: blob, width: d.img.naturalWidth, height: d.img.naturalHeight };
        URL.revokeObjectURL(d.url);
        forget(id);
        return tx('readwrite', function (store) { store.put(rec, id); });
      });
    },

    /* Alle Fotos loeschen, die nicht in ids stehen */
    keepOnly: function (ids) {
      var keep = {};
      (ids || []).forEach(function (id) { if (id) keep[id] = true; });
      return tx('readwrite', function (store) {
        var req = store.getAllKeys();
        req.onsuccess = function () {
          (req.result || []).forEach(function (k) { if (!keep[k]) { forget(k); store.delete(k); } });
        };
      });
    }
  };
})(window.Takt);
