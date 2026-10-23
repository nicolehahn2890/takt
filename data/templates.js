/* Takt: 12 fertige Workouts (Vorlagen), je Thema kurz (~10 Min.) und lang (~20 Min.).
   Schreibgeschützt: „Bearbeiten“ legt eine Kopie unter „Meine Workouts“ an.
   Block: [Name, Runden, [[Übungs-Id, Sekunden], ...]]. Übungsnamen und „beidseitig“ kommen aus der Bibliothek.
   Dauer prüft der Test „data: Vorlagen-Dauer“ (kurz 8–12, lang 17–23 Min.). */
window.Takt = window.Takt || {};
(function (T) {
  'use strict';
  var BS = {};
  (T.EXERCISES || []).forEach(function (e) { BS[e.id] = !!e.beidseitig; });

  function V(id, name, theme, level, rest, blocks) {
    return {
      id: id, name: name, theme: theme, level: level, defaultWork: 40, defaultRest: rest, source: 'template',
      blocks: blocks.map(function (b) {
        return { label: b[0], repeat: b[1], items: b[2].map(function (x) {
          return { exId: x[0], name: null, duration: x[1], rest: null, bilateral: !!BS[x[0]] };
        }) };
      })
    };
  }
  var A = 'Aufwärmen', H = 'Hauptteil', Z = 'Abschluss', K = 'Ankommen', S = 'Sonnengruß', P = 'Haltungen';

  T.TEMPLATES = [
    V('vacuum-core-kurz', 'Vacuum & Core kurz', 'core', 'kurz', 15, [
      [A, 1, [['bauchatmung', 60], ['katze-kuh', 45]]],
      [H, 2, [['vacuum-vierfuessler', 30], ['dead-bug', 40], ['vacuum-liegend', 30], ['plank', 30], ['vacuum-fersentippen', 40]]],
      [Z, 1, [['kindhaltung', 45]]]]),
    V('vacuum-core-lang', 'Vacuum & Core lang', 'core', 'lang', 15, [
      [A, 1, [['bauchatmung', 60], ['katze-kuh', 45], ['hueftkreisen', 40]]],
      [H, 3, [['vacuum-vorgebeugt', 30], ['vacuum-vierfuessler', 30], ['dead-bug', 40], ['bird-dog', 40],
        ['vacuum-unterarmstuetz', 30], ['vacuum-glute-bridge', 40]]],
      [Z, 1, [['hypopressive-atmung', 90], ['kindhaltung', 60]]]]),
    V('bauch-kurz', 'Bauch kurz', 'bauch', 'kurz', 15, [
      [A, 1, [['hampelmann', 40], ['mountain-climbers', 30]]],
      [H, 2, [['crunch', 40], ['reverse-crunch', 40], ['fahrrad-crunch', 40], ['plank', 40]]],
      [Z, 1, [['kobra', 40]]]]),
    V('bauch-lang', 'Bauch lang', 'bauch', 'lang', 15, [
      [A, 1, [['hampelmann', 45], ['kniehebelauf', 30], ['hueftkreisen', 30]]],
      [H, 3, [['tabletop-crunch', 40], ['beinheben', 40], ['russian-twist', 40], ['fahrrad-crunch', 40],
        ['flutter-kicks', 30], ['plank-shoulder-taps', 40]]],
      [Z, 1, [['kobra', 45], ['liegender-twist', 60]]]]),
    V('dehnen-kurz', 'Dehnen & Rücken kurz', 'dehnen', 'kurz', 5, [
      ['', 1, [['katze-kuh', 60], ['kindhaltung', 60], ['faden-einfaedeln', 90], ['hueftbeuger-dehnung', 90],
        ['herabschauender-hund', 45], ['liegender-twist', 90], ['knie-zur-brust', 60], ['totenstellung', 60]]]]),
    V('dehnen-lang', 'Dehnen & Rücken lang', 'dehnen', 'lang', 5, [
      ['', 1, [['schulterkreisen', 40], ['nacken-dehnung', 90], ['katze-kuh', 60], ['open-book', 90], ['faden-einfaedeln', 90],
        ['herabschauender-hund', 45], ['hueftbeuger-dehnung', 90], ['taube', 120], ['hamstring-dehnung', 90], ['figur-vier', 90],
        ['schmetterling', 60], ['liegender-twist', 90], ['knie-zur-brust', 60], ['totenstellung', 90]]]]),
    V('yoga-kurz', 'Yoga & Atmung kurz', 'yoga', 'kurz', 5, [
      [K, 1, [['bauchatmung', 60]]],
      [S, 2, [['sonnengruss', 90]]],
      [P, 1, [['krieger-1', 60], ['krieger-2', 60], ['baum', 60]]],
      [Z, 1, [['kindhaltung', 60], ['lange-ausatmung', 90]]]]),
    V('yoga-lang', 'Yoga & Atmung lang', 'yoga', 'lang', 5, [
      [K, 1, [['box-atmung', 90], ['katze-kuh', 60]]],
      [S, 2, [['sonnengruss', 90]]],
      [P, 1, [['krieger-1', 60], ['krieger-2', 60], ['dreieck', 60], ['krieger-3', 60], ['stuhl', 45], ['baum', 60],
        ['sphinx', 60], ['heuschrecke', 40]]],
      [Z, 1, [['happy-baby', 60], ['totenstellung', 120], ['atmung-478', 90]]]]),
    V('beine-kurz', 'Beine & Po kurz', 'beine', 'kurz', 15, [
      [A, 1, [['hampelmann', 40], ['kniebeuge', 40]]],
      [H, 2, [['kniebeuge', 40], ['glute-bridge', 40], ['ausfallschritt-rueck', 40], ['fire-hydrants', 60]]],
      [Z, 1, [['figur-vier', 60]]]]),
    V('beine-lang', 'Beine & Po lang', 'beine', 'lang', 15, [
      [A, 1, [['hampelmann', 45], ['hueftkreisen', 30], ['squat-jacks', 30]]],
      [H, 3, [['sumo-kniebeuge', 40], ['glute-bridge-einbeinig', 60], ['curtsy-lunge', 40], ['clamshells', 60], ['squat-pulses', 30]]],
      [Z, 1, [['hueftbeuger-dehnung', 60], ['taube', 60]]]]),
    V('ruecken-kurz', 'Starker Rücken kurz', 'ruecken', 'kurz', 15, [
      [A, 1, [['schulterkreisen', 40], ['katze-kuh', 45]]],
      [H, 2, [['superman', 40], ['bird-dog', 40], ['ytw', 40], ['snow-angels', 40]]],
      [Z, 1, [['kindhaltung', 60]]]]),
    V('ruecken-lang', 'Starker Rücken lang', 'ruecken', 'lang', 15, [
      [A, 1, [['schulterkreisen', 40], ['armkreisen', 40], ['katze-kuh', 45]]],
      [H, 2, [['superman', 40], ['swimmer', 30], ['ytw', 45], ['snow-angels', 40], ['prone-cobra', 30], ['bird-dog', 40],
        ['wall-angels', 40], ['good-morning', 40]]],
      [Z, 1, [['sphinx', 60], ['kindhaltung', 60], ['knie-zur-brust', 60]]]])
  ];
})(window.Takt);
