/* Takt: Abzeichen als Inhalt. kind + n bestimmen die Regel (umgesetzt in js/badges.js):
   count = Anzahl Trainings, minutes = Minuten gesamt, streak = Tage in Folge, before = Endzeit von 4 Uhr bis vor Stunde n, from = ab Stunde n bis 4 Uhr nachts,
   themes = verschiedene Themen, mix = Trainings aus dem Mix, breath = Atem-Übungen, own = eigenes Workout gespeichert,
   templates = verschiedene Vorlagen trainiert, ownEx = eigene Übungen, backup = Backup gesichert, notes = Trainings mit Notiz.
   icon = Schlüssel in data/badge-icons.js, color = Farbe im erreichten Zustand (je Gruppe eine). */
window.Takt = window.Takt || {};
(function (T) {
  'use strict';
  var TRAIN = '#C6C5A6', MIN = '#C4A882', SERIE = '#BE7B9D', ZEIT = '#B794C5', VIEL = '#A8C4A0', ENTDECKEN = '#8AB4C4';
  T.BADGES = [
    { id: 'first', kind: 'count', n: 1, icon: 'flag', color: TRAIN, title: 'Erstes Training', rule: 'Das erste Training geschafft' },
    { id: 'ten', kind: 'count', n: 10, icon: 'medal', color: TRAIN, title: '10 Trainings', rule: '10 Trainings abgeschlossen' },
    { id: 't25', kind: 'count', n: 25, icon: 'medal-2', color: TRAIN, title: '25 Trainings', rule: '25 Trainings abgeschlossen' },
    { id: 't50', kind: 'count', n: 50, icon: 'award', color: TRAIN, title: '50 Trainings', rule: '50 Trainings abgeschlossen' },
    { id: 't100', kind: 'count', n: 100, icon: 'trophy', color: TRAIN, title: '100 Trainings', rule: '100 Trainings abgeschlossen' },
    { id: 'min100', kind: 'minutes', n: 100, icon: 'clock', color: MIN, title: '100 Minuten', rule: 'Insgesamt 100 Minuten trainiert' },
    { id: 'min500', kind: 'minutes', n: 500, icon: 'hourglass', color: MIN, title: '500 Minuten', rule: 'Insgesamt 500 Minuten trainiert' },
    { id: 'min1000', kind: 'minutes', n: 1000, icon: 'rocket', color: MIN, title: '1.000 Minuten', rule: 'Insgesamt 1.000 Minuten trainiert' },
    { id: 'streak3', kind: 'streak', n: 3, icon: 'flame', color: SERIE, title: '3 Tage in Folge', rule: '3 Tage hintereinander trainiert' },
    { id: 'streak7', kind: 'streak', n: 7, icon: 'calendar-week', color: SERIE, title: '7 Tage in Folge', rule: '7 Tage hintereinander trainiert' },
    { id: 'streak14', kind: 'streak', n: 14, icon: 'bolt', color: SERIE, title: '14 Tage in Folge', rule: '14 Tage hintereinander trainiert' },
    { id: 'streak30', kind: 'streak', n: 30, icon: 'mountain', color: SERIE, title: '30 Tage in Folge', rule: '30 Tage hintereinander trainiert' },
    { id: 'early', kind: 'before', n: 8, icon: 'sunrise', color: ZEIT, title: 'Frühaufsteherin', rule: 'Ein Training zwischen 4 und 8 Uhr beendet' },
    { id: 'night', kind: 'from', n: 21, icon: 'moon-stars', color: ZEIT, title: 'Nachteule', rule: 'Ein Training zwischen 21 und 4 Uhr beendet' },
    { id: 'themes', kind: 'themes', n: 6, icon: 'palette', color: VIEL, title: 'Alle 6 Themen', rule: 'Workouts aus allen 6 Themen trainiert' },
    { id: 'mix5', kind: 'mix', n: 5, icon: 'arrows-shuffle', color: VIEL, title: 'Mix-Meisterin', rule: '5 Mix-Workouts trainiert' },
    { id: 'breath10', kind: 'breath', n: 10, icon: 'wind', color: VIEL, title: 'Atemprofi', rule: '10 Atem-Übungen gemacht' },
    { id: 'own', kind: 'own', n: 1, icon: 'pencil', color: ENTDECKEN, title: 'Eigenes Workout gebaut', rule: 'Ein eigenes Workout gespeichert' },
    { id: 'tpl12', kind: 'templates', n: 12, icon: 'layout-grid', color: ENTDECKEN, title: 'Alle Vorlagen', rule: 'Alle 12 Vorlagen einmal trainiert' },
    { id: 'ownex5', kind: 'ownEx', n: 5, icon: 'stretching', color: ENTDECKEN, title: '5 eigene Übungen', rule: '5 eigene Übungen angelegt' },
    { id: 'backup1', kind: 'backup', n: 1, icon: 'shield-check', color: ENTDECKEN, title: 'Erstes Backup', rule: 'Das erste Backup gesichert' },
    { id: 'notes10', kind: 'notes', n: 10, icon: 'notebook', color: ENTDECKEN, title: '10 Notizen', rule: '10 Trainings mit Notiz' }
  ];
})(window.Takt);
