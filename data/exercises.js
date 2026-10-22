/* Takt: Übungsbibliothek (Startbestand für Schritt 1, wird in Schritt 2 erweitert)
   Nach Änderungen an Namen: python tools/make_voice.py */
window.Takt = window.Takt || {};
Takt.EXERCISES = [
  {
    id: 'hampelmann', name: 'Hampelmann', alias: ['Jumping Jacks'],
    beschreibung: 'Aus dem Stand springen, Beine grätschen und die Arme über den Kopf führen. Zurückspringen, Arme an den Körper.',
    hinweis: 'Locker in den Knien landen.',
    tags: ['ganzkoerper', 'aufwaermen'], beidseitig: false, typ: 'zeit', atem: null,
    bild: null, icon: 'ganz', quelle: 'takt'
  },
  {
    id: 'plank', name: 'Plank', alias: ['Unterarmstütz'],
    beschreibung: 'Unterarme unter den Schultern, der Körper bildet eine Linie von Kopf bis Ferse. Bauch und Po fest.',
    hinweis: 'Die Hüfte nicht durchhängen lassen.',
    tags: ['core'], beidseitig: false, typ: 'zeit', atem: null,
    bild: null, icon: 'core', quelle: 'takt'
  },
  {
    id: 'glute-bridge', name: 'Glute Bridge', alias: ['Beckenheben'],
    beschreibung: 'Rückenlage, Füße hüftbreit aufgestellt. Hüfte anheben, bis Knie, Hüfte und Schultern eine Linie bilden, oben den Po anspannen.',
    hinweis: 'Über die Fersen drücken.',
    tags: ['beine-po', 'core'], beidseitig: false, typ: 'zeit', atem: null,
    bild: null, icon: 'beine', quelle: 'takt'
  },
  {
    id: 'dead-bug', name: 'Dead Bug', alias: ['Toter Käfer'],
    beschreibung: 'Rückenlage, Arme zur Decke, Knie über der Hüfte. Gegengleich Arm und Bein langsam strecken, der untere Rücken bleibt am Boden.',
    hinweis: 'Langsam und kontrolliert, ruhig weiteratmen.',
    tags: ['core', 'bauch'], beidseitig: false, typ: 'zeit', atem: null,
    bild: null, icon: 'core', quelle: 'takt'
  },
  {
    id: 'kindhaltung', name: 'Kindhaltung', alias: ["Child's Pose"],
    beschreibung: 'Im Fersensitz den Oberkörper nach vorn ablegen, die Arme lang nach vorn. Ruhig in den Rücken atmen.',
    hinweis: 'Die Knie dürfen weit auseinander.',
    tags: ['dehnen', 'yoga'], beidseitig: false, typ: 'zeit', atem: null,
    bild: null, icon: 'dehnen', quelle: 'takt'
  }
];
