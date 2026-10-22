/* Takt: Haltungen der animierten Figur je Übung (Atem-Übungen haben keine).
   Koordinaten im Bild 12..228 x 18..178, Boden bei y = 166 (vor dem Maßstab).
   Grundhaltungen: S stehen (Seite), FR stehen (vorne), SU Rückenlage, SB Rückenlage Knie gebeugt,
   PR Bauchlage, Q Vierfüßler, PL Unterarm-Plank, HP hoher Stütz, SI Langsitz, SL Seitenlage, CS Stuhlsitz.
   Spätere Frames erben fehlende Werte vom vorigen. Prüfen: tools/galerie.html */
window.Takt = window.Takt || {};
(function (T) {
  'use strict';

  function F(base, o) {
    var r = {};
    Object.keys(base).forEach(function (k) { r[k] = base[k]; });
    Object.keys(o || {}).forEach(function (k) { r[k] = o[k]; });
    return r;
  }
  function P(frames, opts) {
    var p = { frames: frames };
    Object.keys(opts || {}).forEach(function (k) { p[k] = opts[k]; });
    return p;
  }

  var B = {
    S: { hip: [120, 84], sh: [120, 34], footN: [121, 162], footF: [125, 162], handN: [126, 90], handF: [123, 89],
      kneeN: -1, kneeF: -1, elbowN: 1, elbowF: 1, footDirN: 0, footDirF: 0 },
    FR: { hip: [120, 82], sh: [120, 32], hipW: 8, shW: 13, footN: [130, 162], footF: [110, 162], handN: [138, 90], handF: [102, 90],
      kneeN: -1, kneeF: 1, elbowN: -1, elbowF: 1, footDirN: 0, footDirF: 180 },
    SU: { hip: [112, 158], sh: [62, 158], headDir: [-1, 0.05], footN: [190, 156], footF: [192, 157], handN: [119, 160], handF: [120, 160],
      kneeN: -1, kneeF: -1, elbowN: -1, elbowF: -1, footDirN: -90, footDirF: -90 },
    PR: { hip: [116, 158], sh: [66, 158], headDir: [-1, -0.15], footN: [194, 158], footF: [196, 159], handN: [123, 160], handF: [124, 160],
      kneeN: 1, kneeF: 1, elbowN: -1, elbowF: -1, footDirN: 70, footDirF: 70 },
    Q: { hip: [140, 122], sh: [80, 106], footN: [182, 162], footF: [186, 162], handN: [80, 162], handF: [84, 162],
      kneeN: 1, kneeF: 1, elbowN: -1, elbowF: -1, footDirN: 0, footDirF: 0 },
    PL: { hip: [136, 147], sh: [78, 134], footN: [212, 158], footF: [214, 159], handN: [106, 162], handF: [109, 162],
      kneeN: -1, kneeF: -1, elbowN: 1, elbowF: 1, footDirN: 100, footDirF: 100 },
    HP: { hip: [138, 129], sh: [80, 106], footN: [212, 160], footF: [214, 160], handN: [82, 162], handF: [85, 162],
      kneeN: -1, kneeF: -1, elbowN: -1, elbowF: -1, footDirN: 100, footDirF: 100 },
    SI: { hip: [104, 156], sh: [96, 107], footN: [182, 158], footF: [184, 159], handN: [76, 161], handF: [80, 161],
      kneeN: -1, kneeF: -1, elbowN: 1, elbowF: 1, footDirN: -80, footDirF: -80 },
    SL: { hip: [118, 152], sh: [68, 148], headDir: [-1, -0.25], footN: [196, 150], footF: [196, 156], handN: [104, 146], handF: [52, 136],
      kneeN: -1, kneeF: 1, elbowN: -1, elbowF: 1, footDirN: 0, footDirF: 0 },
    CS: { hip: [110, 120], sh: [112, 72], footN: [150, 162], footF: [154, 162], handN: [140, 118], handF: [136, 118],
      kneeN: -1, kneeF: -1, elbowN: 1, elbowF: 1, footDirN: 0, footDirF: 0 }
  };
  B.SB = F(B.SU, { footN: [158, 160], footF: [162, 160], footDirN: 0, footDirF: 0 });

  function S(o) { return F(B.S, o); }
  function FR(o) { return F(B.FR, o); }
  function SU(o) { return F(B.SU, o); }
  function SB(o) { return F(B.SB, o); }
  function PR(o) { return F(B.PR, o); }
  function Q(o) { return F(B.Q, o); }
  function PL(o) { return F(B.PL, o); }
  function HP(o) { return F(B.HP, o); }
  function SI(o) { return F(B.SI, o); }
  function SL(o) { return F(B.SL, o); }
  function CS(o) { return F(B.CS, o); }

  var CHAIR = { type: 'stuhl', x: 104, y: 126 };
  var HANDS_HEAD = { headDir: [-1, 0.05], handN: [50, 150], handF: [52, 151], elbowN: 1, elbowF: 1 };

  T.POSES = {
    /* ---------- Vacuum ---------- */
    'vacuum-stehend': P([FR({ handN: [134, 84], handF: [106, 84] })]),
    'vacuum-vierfuessler': P([Q()]),
    'vacuum-liegend': P([SB()]),
    'vacuum-sitzend': P([CS()], { props: [CHAIR] }),
    'transversus': P([SB({ handN: [96, 150], handF: [98, 151] })]),

    /* ---------- Core ---------- */
    'plank': P([PL()]),
    'high-plank': P([HP()]),
    'seitstuetz': P([PL({ hip: [136, 144], handF: [80, 76] })]),
    'seitstuetz-hueftheben': P([PL({ hip: [136, 156], handF: [126, 146] }), { hip: [136, 140], handF: [126, 132] }]),
    'dead-bug': P([SU({ footN: [150, 118], footF: [153, 121], handN: [65, 100], handF: [68, 102], elbowN: 1, elbowF: 1 }),
      { handN: [14, 152], footF: [190, 150], footDirF: -80 }]),
    'bird-dog': P([Q(), { handN: [24, 100], elbowN: 1, footF: [216, 108], kneeF: -1 }]),
    'hollow-hold': P([SU({ sh: [70, 146], hip: [118, 160], headDir: [-0.96, -0.28], handN: [18, 132], handF: [20, 134],
      footN: [194, 138], footF: [196, 140], footDirN: -60, footDirF: -60 })]),
    'hollow-rocks': P([SU({ sh: [70, 152], hip: [118, 160], headDir: [-0.99, -0.16], handN: [18, 140], handF: [20, 142],
      footN: [194, 130], footF: [196, 132], footDirN: -60, footDirF: -60 }),
      { sh: [70, 138], headDir: [-0.9, -0.44], handN: [20, 126], handF: [22, 128], footN: [194, 148], footF: [196, 150] }],
      { hold: 0.2, move: 0.6 }),
    'plank-shoulder-taps': P([HP(), { handN: [86, 118] }, HP(), { handF: [88, 120] }], { hold: 0.3, move: 0.4 }),
    'plank-hip-dips': P([PL(), { hip: [136, 158] }]),
    'baerenstand': P([Q({ hip: [140, 112], footN: [180, 158], footF: [184, 158], footDirN: 70, footDirF: 70 })]),
    'mountain-climbers': P([HP({ footN: [140, 156], kneeN: 1, footDirN: 30 }),
      { footN: [212, 160], kneeN: -1, footDirN: 100, footF: [140, 156], kneeF: 1, footDirF: 30 }], { hold: 0.15, move: 0.35 }),
    'plank-jacks': P([HP(), { footN: [198, 160], footF: [226, 158] }], { hold: 0.2, move: 0.4 }),
    'pallof-press': P([S({ handN: [136, 70], handF: [134, 71] }), { handN: [176, 64], handF: [175, 65] }]),
    'russian-twist': P([SI({ sh: [92, 112], hip: [110, 156], footN: [168, 134], footF: [170, 136], footDirN: -30, footDirF: -30,
      handN: [124, 124], handF: [122, 126] }), { handN: [92, 140], handF: [94, 142] }], { hold: 0.3, move: 0.6 }),
    'spiderman-plank': P([HP(), { footN: [118, 148], kneeN: 1, footDirN: 0 }]),
    'plank-rock': P([PL(), { sh: [66, 132], hip: [124, 146], footN: [202, 158], footF: [204, 159] }]),

    /* ---------- Bauch ---------- */
    'crunch': P([SB(HANDS_HEAD), { sh: [72, 140], headDir: [-0.91, -0.41], handN: [60, 130], handF: [62, 131] }]),
    'reverse-crunch': P([SU({ footN: [150, 118], footF: [153, 121] }), { hip: [116, 150], footN: [118, 108], footF: [121, 110] }]),
    'fahrrad-crunch': P([SB({ sh: [72, 142], headDir: [-0.92, -0.4], handN: [60, 132], handF: [62, 133], elbowN: 1, elbowF: 1,
      footN: [132, 124], footDirN: -60, footF: [190, 146], footDirF: -80 }),
      { footN: [190, 146], footDirN: -80, footF: [132, 124], footDirF: -60 }], { hold: 0.3, move: 0.5 }),
    'beinheben': P([SU({ footN: [190, 148], footF: [192, 149] }), { footN: [120, 80], footF: [122, 81], footDirN: -10, footDirF: -10 }]),
    'flutter-kicks': P([SU({ footN: [190, 136], footF: [192, 150] }), { footN: [190, 150], footF: [192, 136] }], { hold: 0.1, move: 0.35 }),
    'scherenschlag': P([SU({ footN: [184, 124], footF: [192, 146] }), { footN: [192, 146], footF: [184, 124] }], { hold: 0.15, move: 0.4 }),
    'v-ups': P([SU({ handN: [6, 156], handF: [8, 157], elbowN: 1, elbowF: 1 }),
      { hip: [112, 160], sh: [94, 114], headDir: [-0.36, -0.93], handN: [150, 96], handF: [152, 98],
        footN: [164, 100], footF: [166, 102], footDirN: -60, footDirF: -60 }]),
    'sit-up': P([SB({ handN: [86, 150], handF: [88, 151] }),
      { sh: [124, 112], headDir: [0.25, -0.97], handN: [150, 126], handF: [151, 127], elbowN: 1, elbowF: 1 }]),
    'heel-touches': P([SB({ sh: [70, 148], headDir: [-0.97, -0.25], handN: [114, 160], handF: [116, 160] }),
      { handN: [132, 158], handF: [100, 160] }], { hold: 0.2, move: 0.5 }),
    'toe-touches': P([SU({ footN: [120, 80], footF: [122, 81], footDirN: -10, footDirF: -10, handN: [66, 100], handF: [68, 101],
      elbowN: 1, elbowF: 1 }), { sh: [74, 140], headDir: [-0.93, -0.37], handN: [116, 88], handF: [118, 89] }]),
    'scheibenwischer': P([SU({ footN: [120, 80], footF: [122, 81], footDirN: -10, footDirF: -10, handN: [14, 158], handF: [16, 158], elbowN: 1, elbowF: 1 }),
      { footN: [176, 110], footF: [178, 112] }]),
    'seitlicher-crunch': P([SB(HANDS_HEAD), { sh: [74, 144], headDir: [-0.93, -0.36], handN: [66, 128], handF: [96, 134] }]),
    'kreuz-crunch': P([SB(HANDS_HEAD), { sh: [76, 140], headDir: [-0.92, -0.4], handN: [64, 128], handF: [66, 130],
      footN: [124, 128], footDirN: -60 }]),

    /* ---------- Ruecken ---------- */
    'superman': P([PR({ handN: [8, 158], handF: [10, 159], elbowN: 1, elbowF: 1 }),
      { sh: [66, 148], headDir: [-1, -0.3], handN: [10, 138], handF: [12, 140], footN: [192, 142], footF: [194, 144] }]),
    'swimmer': P([PR({ sh: [66, 152], headDir: [-1, -0.25], handN: [10, 140], handF: [8, 158], elbowN: 1, elbowF: 1,
      footN: [194, 158], footF: [192, 142] }), { handN: [8, 158], handF: [10, 140], footN: [192, 142], footF: [194, 158] }],
      { hold: 0.2, move: 0.45 }),
    'ytw': P([PR({ sh: [66, 152], headDir: [-1, -0.2], handN: [12, 136], handF: [14, 138], elbowN: 1, elbowF: 1 }),
      { handN: [66, 98], handF: [68, 100] }, { handN: [78, 128], handF: [80, 130] }]),
    'snow-angels': P([PR({ sh: [66, 150], headDir: [-1, -0.2], handN: [12, 142], handF: [14, 143], elbowN: 1, elbowF: 1 }),
      { handN: [120, 146], handF: [122, 147] }]),
    'rueckenstrecker': P([PR({ handN: [56, 148], handF: [58, 149] }),
      { sh: [70, 140], headDir: [-0.94, -0.34], handN: [58, 128], handF: [60, 129] }]),
    'prone-cobra': P([PR({ sh: [70, 144], headDir: [-0.95, -0.3], handN: [124, 148], handF: [126, 149] })]),
    'wall-angels': P([FR({ handN: [152, 26], handF: [88, 26] }), { handN: [164, -4], handF: [76, -4] }], { scale: 0.8 }),
    'good-morning': P([S({ handN: [112, 22], handF: [114, 23], elbowN: -1, elbowF: -1 }),
      { hip: [104, 86], sh: [148, 66], handN: [150, 52], handF: [152, 53] }]),
    'band-rudern': P([SI({ handN: [152, 122], handF: [154, 123] }), { handN: [110, 124], handF: [112, 125] }]),
    'band-pull-apart': P([FR({ handN: [132, 58], handF: [108, 58] }), { handN: [186, 44], handF: [54, 44] }]),
    'tisch-rudern': P([{ hip: [140, 146], sh: [92, 130], footN: [212, 160], footF: [214, 160], handN: [96, 74], handF: [98, 74],
      kneeN: -1, kneeF: -1, elbowN: -1, elbowF: -1, footDirN: -80, footDirF: -80 },
      { hip: [142, 118], sh: [94, 88] }], { props: [{ type: 'tisch', x: 30, y: 70, w: 82 }] }),
    'arm-bein-bauchlage': P([PR({ handN: [8, 158], handF: [10, 159], elbowN: 1, elbowF: 1 }), { handN: [10, 140], footF: [194, 142] }]),

    /* ---------- Beine und Po ---------- */
    'kniebeuge': P([S({ handN: [176, 46], handF: [175, 48] }), { hip: [96, 126], sh: [118, 80], handN: [174, 84], handF: [173, 86] }]),
    'sumo-kniebeuge': P([FR({ footN: [150, 162], footF: [90, 162], footDirN: 30, footDirF: 150, handN: [126, 64], handF: [114, 64] }),
      { hip: [120, 114], sh: [120, 64], handN: [126, 94], handF: [114, 94] }]),
    'ausfallschritt': P([S({ handN: [122, 84], handF: [120, 84] }),
      { hip: [118, 120], sh: [118, 70], footN: [170, 162], footF: [76, 154], footDirF: 60, handN: [120, 118], handF: [118, 118] }]),
    'ausfallschritt-rueck': P([S({ handN: [122, 84], handF: [120, 84] }),
      { hip: [96, 120], sh: [96, 70], footN: [124, 162], footF: [48, 154], footDirF: 60, handN: [98, 118], handF: [96, 118] }]),
    'seitlicher-ausfallschritt': P([FR({ footN: [156, 162], footF: [84, 162], footDirN: 20, footDirF: 160, handN: [126, 64], handF: [114, 64] }),
      { hip: [142, 112], sh: [136, 64], handN: [148, 94], handF: [134, 94] }]),
    'bulgarian-split-squat': P([S({ hip: [110, 90], sh: [112, 40], footN: [132, 162], footF: [64, 122], handN: [114, 92], handF: [112, 92] }),
      { hip: [106, 120], sh: [110, 70], handN: [110, 122], handF: [108, 122] }], { props: [{ type: 'stuhl', x: 52, y: 124 }] }),
    'glute-bridge': P([SB(), { hip: [106, 124] }]),
    'glute-bridge-einbeinig': P([SB({ footF: [186, 140], footDirF: -60 }), { hip: [106, 124], footF: [178, 104] }]),
    'hip-thrust': P([{ hip: [112, 150], sh: [66, 116], footN: [162, 162], footF: [166, 162], handN: [50, 112], handF: [52, 113],
      kneeN: -1, kneeF: -1, elbowN: -1, elbowF: -1, footDirN: 0, footDirF: 0 }, { hip: [112, 116] }],
      { props: [{ type: 'sofa', x: 18, y: 112, w: 52 }] }),
    'donkey-kicks': P([Q(), { footN: [182, 72], footDirN: -90 }]),
    'fire-hydrants': P([Q(), { footN: [176, 148], kneeN: -1 }]),
    'clamshells': P([SL({ footN: [150, 156], footF: [152, 158], kneeN: -1, kneeF: -1 }), { footN: [146, 140] }]),
    'beinheben-seitlich': P([SL(), { footN: [184, 104], footDirN: -30 }]),
    'wandsitzen': P([{ hip: [104, 122], sh: [100, 72], footN: [144, 162], footF: [148, 162], handN: [126, 120], handF: [124, 121],
      kneeN: -1, kneeF: -1, elbowN: 1, elbowF: 1, footDirN: 0, footDirF: 0 }], { props: [{ type: 'wand', x: 90 }] }),
    'wadenheben': P([S({ hip: [120, 88], sh: [120, 38] }),
      { hip: [120, 82], sh: [120, 32], footN: [121, 156], footF: [125, 156], footDirN: 60, footDirF: 60 }]),
    'step-ups': P([S({ hip: [118, 92], sh: [120, 42], footN: [170, 134] }),
      { hip: [160, 58], sh: [162, 8], footN: [170, 134], footF: [178, 110] }],
      { scale: 0.78, props: [{ type: 'stufe', x: 150, y: 136, w: 60 }] }),
    'frog-pumps': P([SB({ footN: [140, 160], footF: [142, 160] }), { hip: [108, 136] }]),
    'curtsy-lunge': P([FR({ handN: [126, 64], handF: [114, 64] }),
      { hip: [118, 112], sh: [118, 62], footN: [126, 162], footF: [150, 156], kneeF: 1, footDirF: 0, handN: [124, 92], handF: [112, 92] }]),
    'sprung-kniebeuge': P([S({ hip: [96, 126], sh: [118, 80], handN: [96, 128], handF: [98, 129] }),
      { hip: [120, 62], sh: [120, 12], footN: [121, 140], footF: [125, 140], footDirN: 60, footDirF: 60, handN: [126, -44], handF: [124, -43] }],
      { scale: 0.7, hold: 0.3, move: 0.5 }),
    'kickback': P([Q(), { footN: [216, 100], kneeN: -1, footDirN: 10 }]),

    /* ---------- Dehnen ---------- */
    'katze-kuh': P([Q({ bow: -10, headDir: [-0.5, 0.85] }), { bow: 9, headDir: [-0.8, -0.6] }], { hold: 0.8, move: 1.2 }),
    'hueftbeuger-dehnung': P([{ hip: [118, 128], sh: [114, 78], footN: [170, 162], footF: [60, 160], kneeN: -1, kneeF: -1,
      footDirN: 0, footDirF: 180, handN: [156, 124], handF: [154, 125], elbowN: 1, elbowF: 1 }, { hip: [126, 134], sh: [124, 84] }],
      { hold: 1, move: 1.2 }),
    'taube': P([{ hip: [120, 150], sh: [122, 100], footN: [124, 162], footF: [40, 160], kneeN: -1, kneeF: -1, footDirN: 180, footDirF: 180,
      handN: [104, 160], handF: [106, 160], elbowN: 1, elbowF: 1 }, { sh: [166, 140], handN: [214, 162], handF: [212, 162] }],
      { hold: 1, move: 1.2 }),
    'kindhaltung': P([{ hip: [140, 134], sh: [92, 152], footN: [156, 162], footF: [159, 162], kneeN: 1, kneeF: 1, footDirN: 0, footDirF: 0,
      handN: [34, 160], handF: [36, 160], elbowN: -1, elbowF: -1 }]),
    'herabschauender-hund': P([{ hip: [130, 92], sh: [90, 126], footN: [168, 162], footF: [171, 162], kneeN: -1, kneeF: -1,
      footDirN: 180, footDirF: 180, handN: [56, 162], handF: [58, 162], elbowN: 1, elbowF: 1 }]),
    'hamstring-dehnung': P([SI({ handN: [150, 150], handF: [148, 151] }), { sh: [132, 122], handN: [180, 152], handF: [178, 153] }],
      { hold: 1, move: 1.2 }),
    'quad-dehnung': P([S({ footN: [108, 86], footDirN: -90, handN: [108, 88], handF: [170, 60] })]),
    'schmetterling': P([{ hip: [120, 142], sh: [120, 92], hipW: 9, shW: 13, footN: [124, 158], footF: [116, 158], kneeN: -1, kneeF: 1,
      footDirN: 180, footDirF: 0, handN: [126, 154], handF: [114, 154], elbowN: -1, elbowF: 1 }]),
    'figur-vier': P([SU({ footN: [152, 116], footF: [150, 122], footDirN: -90, footDirF: -90, handN: [126, 120], handF: [128, 122] })]),
    'open-book': P([SL({ handN: [70, 92], handF: [72, 96], elbowN: 1 }), { handN: [14, 150] }], { hold: 0.8, move: 1.2 }),
    'nacken-dehnung': P([FR({ headDir: [0, -1] }), { headDir: [0.45, -0.9], handN: [132, 10] }], { hold: 1, move: 1 }),
    'schulterkreisen': P([FR(), { sh: [120, 28], handN: [138, 84], handF: [102, 84] }, { sh: [120, 36] }], { hold: 0.1, move: 0.5 }),
    'armkreisen': P([FR({ handN: [190, 34], handF: [50, 34] }), { handN: [180, 0], handF: [60, 0] },
      { handN: [188, 14], handF: [52, 14] }, { handN: [180, 66], handF: [60, 66] }], { hold: 0.05, move: 0.35, scale: 0.8 }),
    'hueftkreisen': P([FR({ handN: [134, 84], handF: [106, 84] }), { hip: [130, 84] }, { hip: [120, 90] }, { hip: [110, 84] }],
      { hold: 0.05, move: 0.45 }),
    'liegender-twist': P([SU({ footN: [150, 118], footF: [153, 121], handN: [20, 160], handF: [22, 160], elbowN: 1, elbowF: 1 }),
      { footN: [164, 150], footF: [166, 154], footDirN: 0, footDirF: 0 }], { hold: 1, move: 1.2 }),
    'worlds-greatest': P([{ hip: [112, 128], sh: [146, 98], footN: [170, 162], footF: [52, 152], kneeN: -1, kneeF: -1,
      footDirN: 0, footDirF: 60, handN: [150, 160], handF: [154, 160], elbowN: 1, elbowF: 1 }, { handF: [150, 40] }],
      { hold: 0.8, move: 1 }),
    'huefte-90-90': P([{ hip: [120, 156], sh: [118, 106], footN: [176, 160], footF: [66, 160], kneeN: -1, kneeF: 1,
      footDirN: 0, footDirF: 180, handN: [100, 160], handF: [140, 160], elbowN: 1, elbowF: -1 }, { sh: [146, 116] }],
      { hold: 1, move: 1.2 }),
    'seitdehnung': P([FR({ handN: [136, -22] }), { sh: [106, 38], handN: [72, -12] }], { scale: 0.78, hold: 1, move: 1.2 }),

    /* ---------- Yoga ---------- */
    'sonnengruss': P([
      { hip: [120, 84], sh: [120, 34], footN: [121, 162], footF: [125, 162], handN: [124, -22], handF: [122, -21],
        kneeN: -1, kneeF: -1, elbowN: 1, elbowF: 1, footDirN: 0, footDirF: 0 },
      { hip: [118, 86], sh: [140, 128], handN: [150, 162], handF: [148, 162] },
      { hip: [92, 129], sh: [150, 106], footN: [16, 160], footF: [14, 160], footDirN: 80, footDirF: 80, kneeN: 1, kneeF: 1 },
      { hip: [92, 156], sh: [140, 118], footDirN: 180, footDirF: 180 },
      { hip: [100, 92], sh: [136, 124], footN: [40, 162], footF: [38, 162], footDirN: 0, footDirF: 0 },
      { hip: [118, 86], sh: [140, 128], footN: [121, 162], footF: [125, 162], kneeN: -1, kneeF: -1 }
    ], { scale: 0.75, hold: 0.5, move: 0.8 }),
    'krieger-1': P([{ hip: [116, 116], sh: [116, 66], footN: [168, 162], footF: [58, 160], kneeN: -1, kneeF: -1, footDirN: 0, footDirF: 30,
      handN: [118, 8], handF: [116, 9], elbowN: 1, elbowF: 1 }], { scale: 0.8 }),
    'krieger-2': P([FR({ hip: [120, 110], sh: [120, 60], footN: [180, 162], footF: [60, 162], handN: [190, 60], handF: [50, 60] })]),
    'baum': P([FR({ footN: [114, 118], footDirN: 180, footF: [118, 162], handN: [124, 64], handF: [116, 64] })]),
    'dreieck': P([FR({ hip: [120, 100], sh: [150, 62], footN: [180, 162], footF: [60, 162], handN: [172, 140], handF: [128, 8] })], { scale: 0.8 }),
    'stuhl': P([{ hip: [100, 112], sh: [124, 68], footN: [121, 162], footF: [125, 162], kneeN: -1, kneeF: -1, footDirN: 0, footDirF: 0,
      handN: [150, 16], handF: [148, 17], elbowN: 1, elbowF: 1 }]),
    'kobra': P([PR({ handN: [70, 162], handF: [72, 162] }), { sh: [72, 118], headDir: [-0.6, -0.8], handN: [76, 162], handF: [78, 162] }],
      { hold: 0.8, move: 1.2 }),
    'heuschrecke': P([PR({ handN: [120, 160], handF: [122, 160] }),
      { sh: [68, 146], headDir: [-1, -0.25], handN: [122, 146], handF: [124, 147], footN: [192, 142], footF: [194, 144] }]),
    'happy-baby': P([SU({ footN: [96, 96], footF: [100, 98], kneeN: -1, kneeF: -1, handN: [96, 100], handF: [100, 102], elbowN: 1, elbowF: 1 }),
      { footN: [100, 100], footF: [104, 102], handN: [100, 104], handF: [104, 106] }], { hold: 0.6, move: 1 }),
    'totenstellung': P([SU({ handN: [96, 162], handF: [98, 162] })]),

    /* ---------- Ganzkoerper und Oberkoerper ---------- */
    'hampelmann': P([FR({ footN: [126, 162], footF: [114, 162] }),
      { footN: [160, 162], footF: [80, 162], footDirN: 30, footDirF: 150, handN: [162, -16], handF: [78, -16] }],
      { hold: 0.1, move: 0.35, scale: 0.8 }),
    'laufen-stelle': P([S({ footN: [136, 128], footDirN: 60, handN: [108, 86], handF: [146, 80], elbowF: -1 }),
      { footN: [121, 162], footDirN: 0, footF: [140, 128], footDirF: 60, handN: [146, 80], handF: [108, 86], elbowN: -1, elbowF: 1 }],
      { hold: 0.05, move: 0.3 }),
    'kniehebelauf': P([S({ footN: [150, 124], footDirN: 60, handN: [108, 86], handF: [146, 80], elbowF: -1 }),
      { footN: [121, 162], footDirN: 0, footF: [154, 124], footDirF: 60, handN: [146, 80], handF: [108, 86], elbowN: -1, elbowF: 1 }],
      { hold: 0.05, move: 0.3 }),
    'burpees': P([
      S(),
      { hip: [106, 130], sh: [134, 96], handN: [150, 162], handF: [148, 162] },
      { hip: [92, 129], sh: [150, 106], footN: [16, 160], footF: [14, 160], footDirN: 80, footDirF: 80, kneeN: 1, kneeF: 1 },
      { hip: [106, 130], sh: [134, 96], footN: [121, 162], footF: [125, 162], footDirN: 0, footDirF: 0, kneeN: -1, kneeF: -1 },
      { hip: [120, 64], sh: [120, 14], footN: [121, 142], footF: [125, 142], footDirN: 60, footDirF: 60, handN: [126, -42], handF: [124, -41] }
    ], { scale: 0.7, hold: 0.25, move: 0.45 }),
    'squat-jacks': P([FR({ footN: [126, 162], footF: [114, 162], handN: [126, 64], handF: [114, 64] }),
      { hip: [120, 112], sh: [120, 62], footN: [160, 162], footF: [80, 162], footDirN: 30, footDirF: 150, handN: [126, 92], handF: [114, 92] }],
      { hold: 0.15, move: 0.4 }),
    'inchworm': P([
      S({ hip: [80, 84], sh: [80, 34], footN: [81, 162], footF: [85, 162], handN: [86, 90], handF: [83, 89] }),
      { hip: [78, 86], sh: [100, 128], handN: [112, 162], handF: [110, 162] },
      { hip: [106, 112], sh: [150, 118], handN: [160, 162], handF: [158, 162] },
      { hip: [150, 128], sh: [204, 106], handN: [206, 162], handF: [204, 162] },
      { hip: [106, 112], sh: [150, 118], handN: [160, 162], handF: [158, 162] },
      { hip: [78, 86], sh: [100, 128], handN: [112, 162], handF: [110, 162] }
    ], { scale: 0.8, hold: 0.3, move: 0.7 }),
    'liegestuetz': P([HP(), { sh: [80, 138], hip: [138, 146] }]),
    'knie-liegestuetz': P([{ hip: [140, 132], sh: [82, 108], footN: [198, 135], footF: [200, 137], kneeN: 1, kneeF: 1, footDirN: -30, footDirF: -30,
      handN: [82, 162], handF: [85, 162], elbowN: -1, elbowF: -1 }, { sh: [82, 140], hip: [140, 148] }]),
    'stuhl-dips': P([{ hip: [104, 118], sh: [104, 66], footN: [172, 162], footF: [176, 162], kneeN: -1, kneeF: -1, footDirN: 0, footDirF: 0,
      handN: [100, 124], handF: [102, 124], elbowN: 1, elbowF: 1 }, { hip: [104, 148], sh: [104, 98] }],
      { props: [{ type: 'stuhl', x: 82, y: 126 }] }),
    'pike-pushup': P([{ hip: [130, 92], sh: [90, 126], footN: [168, 162], footF: [171, 162], kneeN: -1, kneeF: -1, footDirN: 180, footDirF: 180,
      handN: [56, 162], handF: [58, 162], elbowN: 1, elbowF: 1 }, { sh: [80, 146] }])
  };
})(window.Takt);
