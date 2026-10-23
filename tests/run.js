'use strict';
// Mini-Test-Runner fuer Takt: laedt data/*.js und die reinen Logik-Dateien
// in eine gemeinsame vm-Umgebung mit window und fuehrt tests/*.test.js aus.
// Aufruf: node tests/run.js
var fs = require('fs');
var path = require('path');
var vm = require('vm');

var root = path.resolve(__dirname, '..');
var LOGIC = ['js/core.js', 'js/store.js', 'js/plan.js', 'js/workouts.js', 'js/stats.js', 'js/engine.js', 'js/announce.js', 'js/figure.js'];
var tests = [];

function FakeStorage() {
  var m = {};
  return {
    getItem: function (k) { return Object.prototype.hasOwnProperty.call(m, k) ? m[k] : null; },
    setItem: function (k, v) { m[k] = String(v); },
    removeItem: function (k) { delete m[k]; }
  };
}

var ctx = {
  console: console,
  test: function (name, fn) { tests.push([name, fn]); },
  eq: function (actual, expected, msg) {
    var a = JSON.stringify(actual), e = JSON.stringify(expected);
    if (a !== e) throw new Error((msg ? msg + ': ' : '') + 'erwartet ' + e + ', bekommen ' + a);
  },
  ok: function (value, msg) { if (!value) throw new Error(msg || 'ok() fehlgeschlagen'); },
  FakeStorage: FakeStorage
};
ctx.window = ctx;
vm.createContext(ctx);

function jsFiles(dir) {
  var abs = path.join(root, dir);
  if (!fs.existsSync(abs)) return [];
  return fs.readdirSync(abs).filter(function (f) { return /\.js$/.test(f); }).sort()
    .map(function (f) { return dir + '/' + f; });
}
function run(rel) {
  vm.runInContext(fs.readFileSync(path.join(root, rel), 'utf8'), ctx, { filename: rel });
}

var failed = 0, passed = 0;

// Globale Regel: kein Grad-Zeichen in js/ und data/
var degree = jsFiles('js').concat(jsFiles('data')).filter(function (rel) {
  return fs.readFileSync(path.join(root, rel), 'utf8').indexOf('°') >= 0;
});
if (degree.length) { failed++; console.log('FAIL  Grad-Zeichen gefunden in: ' + degree.join(', ')); }

// Globale Regel: js/ nur ASCII (Umlaute als \u-Escapes), data/ darf UTF-8 enthalten
var nonAscii = jsFiles('js').filter(function (rel) {
  return /[^\x00-\x7f]/.test(fs.readFileSync(path.join(root, rel), 'utf8'));
});
if (nonAscii.length) { failed++; console.log('FAIL  Nicht-ASCII-Zeichen (Umlaute als \\u-Escape schreiben) in: ' + nonAscii.join(', ')); }

try {
  jsFiles('data').forEach(run);
  LOGIC.forEach(function (rel) { if (fs.existsSync(path.join(root, rel))) run(rel); });
  jsFiles('tests').filter(function (rel) { return /\.test\.js$/.test(rel); }).forEach(run);
} catch (e) {
  console.log('FAIL  Laden: ' + e.message);
  process.exit(1);
}

tests.forEach(function (t) {
  try { t[1](); passed++; console.log('ok    ' + t[0]); }
  catch (e) { failed++; console.log('FAIL  ' + t[0] + ' -> ' + e.message); }
});
console.log(passed + ' bestanden, ' + failed + ' fehlgeschlagen');
process.exit(failed ? 1 : 0);
