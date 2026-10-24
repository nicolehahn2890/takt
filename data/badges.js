/* Takt: Abzeichen als Inhalt. kind + n bestimmen die Regel (umgesetzt in js/badges.js):
   count = Anzahl Trainings, streak = Tage in Folge, minutes = Minuten gesamt, before/from = Endzeit vor/ab Stunde n,
   themes = verschiedene Themen, own = eigenes Workout gespeichert, mix = Trainings aus dem Mix, breath = Atem-Übungen.
   face = große Zahl oder kurzes Wort auf der Plakette, color = Farbe im erreichten Zustand. */
window.Takt = window.Takt || {};
(function (T) {
  'use strict';
  T.BADGES = [
    { id: 'first', kind: 'count', n: 1, face: '1', title: 'Erstes Training', rule: 'Das erste Training geschafft', color: '#C6C5A6' },
    { id: 'streak3', kind: 'streak', n: 3, face: '3', title: '3 Tage in Folge', rule: '3 Tage hintereinander trainiert', color: '#BE7B9D' },
    { id: 'streak7', kind: 'streak', n: 7, face: '7', title: '7 Tage in Folge', rule: '7 Tage hintereinander trainiert', color: '#B794C5' },
    { id: 'ten', kind: 'count', n: 10, face: '10', title: '10 Trainings', rule: '10 Trainings abgeschlossen', color: '#A8C4A0' },
    { id: 'min100', kind: 'minutes', n: 100, face: '100', title: '100 Minuten', rule: 'Insgesamt 100 Minuten trainiert', color: '#C4A882' },
    { id: 'early', kind: 'before', n: 8, face: 'Früh', title: 'Frühaufsteherin', rule: 'Ein Training vor 8 Uhr beendet', color: '#C6C5A6' },
    { id: 'night', kind: 'from', n: 21, face: 'Nacht', title: 'Nachteule', rule: 'Ein Training ab 21 Uhr beendet', color: '#B794C5' },
    { id: 'themes', kind: 'themes', n: 6, face: '6', title: 'Alle 6 Themen', rule: 'Workouts aus allen 6 Themen trainiert', color: '#8AB4C4' },
    { id: 'own', kind: 'own', n: 1, face: 'Neu', title: 'Eigenes Workout gebaut', rule: 'Ein eigenes Workout gespeichert', color: '#BE7B9D' },
    { id: 'mix5', kind: 'mix', n: 5, face: '5', title: 'Mix-Meisterin', rule: '5 Mix-Workouts trainiert', color: '#C4A882' },
    { id: 'breath10', kind: 'breath', n: 10, face: '10', title: 'Atemprofi', rule: '10 Atem-Übungen gemacht', color: '#A8C4A0' }
  ];
})(window.Takt);
