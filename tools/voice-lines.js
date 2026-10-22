'use strict';
// Gibt alle Ansagetexte als JSON aus: feste Saetze + ex_<id> fuer jede Uebung.
// Aufruf: node tools/voice-lines.js   (wird von tools/make_voice.py benutzt)
var fs = require('fs');
var path = require('path');
var vm = require('vm');

var root = path.resolve(__dirname, '..');
var ctx = {};
ctx.window = ctx;
vm.createContext(ctx);
['data/strings.js', 'data/exercises.js'].forEach(function (rel) {
  vm.runInContext(fs.readFileSync(path.join(root, rel), 'utf8'), ctx, { filename: rel });
});

var out = {};
Object.keys(ctx.Takt.VOICE_LINES).forEach(function (k) { out[k] = ctx.Takt.VOICE_LINES[k]; });
// Optional: e.ansage, wenn Katja den Namen anders sprechen soll (z. B. Zahlen)
ctx.Takt.EXERCISES.forEach(function (e) { out['ex_' + e.id] = e.ansage || e.name; });
process.stdout.write(JSON.stringify(out));
