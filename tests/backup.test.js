/* Tests fuer js/backup.js: Backup schreiben und lesen, Hinweis "Letztes Backup" */
function bkData() {
  var w = Takt.validateWorkout({ name: 'Morgen', theme: 'yoga', blocks: [{ repeat: 2, items: [{ exId: 'plank', duration: 40 }] }] }, new Date(2026, 9, 1, 9)).workout;
  var own = Takt.store.validateOwn({ name: 'Wand-Sitz', tags: ['beine-po'], photoId: 'ph-a' }).exercise;
  var d = Takt.store.defaults();
  d.workouts = [w];
  d.exercisesOwn = [own];
  d.log = [{ id: 'l1', workoutId: w.id, name: 'Morgen', date: '2026-10-20T08:00:00.000Z', plannedSec: 80, actualSec: 85, activeSec: 80, note: 'Knie' }];
  d.badges = { first: '2026-10-20T08:00:00.000Z' };
  d.learn = { 'w-x|plank': { since: 3 } };
  d.notes = { plank: 'Bauch fest' };
  d.settings.announce = 'name';
  return d;
}
var BK_PH = { 'ph-a': 'data:image/jpeg;base64,/9j/AAA=' };
var BK_NOW = new Date(2026, 9, 24, 10, 30);

test('backup rund', function () {
  var d = bkData();
  var b = Takt.makeBackup(d, BK_PH, BK_NOW);
  eq(b.filename, 'takt-backup-2026-10-24.json');
  var r = Takt.readBackup(b.text);
  ok(r.ok, 'ok');
  var exp = JSON.parse(JSON.stringify(d));
  exp.settings.lastBackup = BK_NOW.toISOString();
  eq(r.data, exp);
  eq(r.photos, BK_PH);
  eq(r.report, { workouts: 1, exercisesOwn: 1, log: 1, photos: 1, dropped: { workouts: 0, exercisesOwn: 0 } });
  eq(d.settings.lastBackup, undefined, 'Original unveraendert');
});

test('backup keine Takt-Datei', function () {
  eq(Takt.readBackup('{"app":"peach","version":1,"data":{}}'), { ok: false, error: 'Das ist keine Takt-Sicherung.' });
  eq(Takt.readBackup('[1,2]').error, 'Das ist keine Takt-Sicherung.');
});

test('backup neuere Version', function () {
  eq(Takt.readBackup('{"app":"takt","version":2,"data":{}}').error, 'Diese Sicherung ist von einer neueren Takt-Version.');
});

test('backup kaputt', function () {
  eq(Takt.readBackup('{"app":"takt",').error, 'Die Datei ist beschädigt.');
  eq(Takt.readBackup('{"app":"takt","version":1}').error, 'Die Datei ist beschädigt.');
  eq(Takt.readBackup('{"app":"takt","version":"eins","data":{}}').error, 'Die Datei ist beschädigt.');
  eq(Takt.readBackup('').ok, false);
});

test('backup ungueltige Eintraege weggelassen und gezaehlt', function () {
  var d = bkData();
  d.workouts.push({ name: '' }, 'x');
  d.exercisesOwn.push({ name: '' });
  var photos = { 'ph-a': BK_PH['ph-a'], 'ph-b': 'javascript:alert(1)', 'ph-c': 5 };
  var r = Takt.readBackup(Takt.makeBackup(d, photos, BK_NOW).text);
  ok(r.ok, 'trotzdem ladbar');
  eq(r.report, { workouts: 1, exercisesOwn: 1, log: 1, photos: 1, dropped: { workouts: 2, exercisesOwn: 1 } });
  eq(Object.keys(r.photos), ['ph-a']);
  eq(r.data.workouts.length, 1);
});

test('backup Foto fehlt bleibt Verweis', function () {
  var r = Takt.readBackup(Takt.makeBackup(bkData(), {}, BK_NOW).text);
  eq(r.data.exercisesOwn[0].photoId, 'ph-a');
  eq(r.photos, {});
  eq(r.report.photos, 0);
});

test('backup lastBackup aus Datei', function () {
  var d = bkData();
  d.settings.lastBackup = '2026-01-01T10:00:00.000Z';
  var r = Takt.readBackup(Takt.makeBackup(d, {}, BK_NOW).text);
  eq(r.data.settings.lastBackup, BK_NOW.toISOString());
});

test('backupAgo Hinweis', function () {
  var now = new Date(2026, 9, 24, 10);
  eq(Takt.backupAgo(null, now), 'Noch kein Backup');
  eq(Takt.backupAgo(new Date(2026, 9, 24, 8).toISOString(), now), 'Letztes Backup: heute');
  eq(Takt.backupAgo(new Date(2026, 9, 23, 22).toISOString(), now), 'Letztes Backup: gestern');
  eq(Takt.backupAgo(new Date(2026, 9, 12, 12).toISOString(), now), 'Letztes Backup: vor 12 Tagen');
});

test('dayLabel fuer das Tagebuch', function () {
  eq(Takt.dayLabel(new Date(2026, 9, 24, 10)), 'Sa, 24. Okt.');
  eq(Takt.dayLabel(new Date(2026, 9, 19, 10)), 'Mo, 19. Okt.');
});
