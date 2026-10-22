/* Takt: fertige Workouts (Vorlagen). In Schritt 3 kommen die 12 Themen-Vorlagen dazu. */
window.Takt = window.Takt || {};
Takt.TEMPLATES = [
  {
    id: 'test-core',
    name: 'Test: Core kurz',
    theme: 'core',
    defaultWork: 30,
    defaultRest: 10,
    source: 'template',
    blocks: [
      { repeat: 1, items: [
        { exId: 'hampelmann', name: null, duration: 30, rest: null, bilateral: false }
      ] },
      { repeat: 2, items: [
        { exId: 'plank', name: null, duration: 30, rest: null, bilateral: false },
        { exId: 'glute-bridge', name: null, duration: 30, rest: null, bilateral: false },
        { exId: 'dead-bug', name: null, duration: 30, rest: null, bilateral: false }
      ] },
      { repeat: 1, items: [
        { exId: 'kindhaltung', name: null, duration: 40, rest: 0, bilateral: false }
      ] }
    ]
  }
];
