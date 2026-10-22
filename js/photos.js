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

    /* Groesse eines gespeicherten Fotos (fuer Pruefungen) */
    size: function (id) {
      return tx('readonly', function (store) { return store.get(id); }).then(function (req) {
        var rec = req && req.result;
        return rec ? { width: rec.width, height: rec.height } : null;
      });
    },

    remove: function (id) {
      if (!id) return Promise.resolve();
      if (urls[id]) { URL.revokeObjectURL(urls[id]); delete urls[id]; }
      return tx('readwrite', function (store) { store.delete(id); }).catch(function () { /* egal */ });
    }
  };
})(window.Takt);
