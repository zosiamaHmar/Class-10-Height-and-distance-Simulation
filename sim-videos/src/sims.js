/* Maths by Zosiama · Heights & Distances explainers
 * Problem data and narration scripts, one entry per simulation turned into a video.
 *
 *  say  = what the offline voice reads (plain words; a lone capital A is read "ay")
 *  cap  = caption shown on screen (defaults to say)
 *  m    = maths line on the board. Markup:
 *           {BC} {AC} {AB}        triangle sides (coral / plum / teal)
 *           {Opp} {Hyp} {Adj}     side names in the same colours
 *           [x]                   the unknown (plum)
 *           ((a/b))               a stacked fraction
 *  hl   = what glows in the scene while the line plays:
 *           kite:    BC AC AB BC+AC angle right tri none
 *           balloon: PM QN EM EN MN PQ EP h88 eye angles a60 a30 tri1 tri2 (+ Opp Adj Hyp theta
 *                    on the idea picture), joined with +
 *  show = scene element that appears with the line (see engine.js / balloon.js)
 *  min  = the line lasts at least this long (s), so the voice waits for a drawing
 *
 *  scene.engine picks the stage: engine.js (one right triangle, the kite) or balloon.js
 *  (two right triangles sharing a height). legacyIntro keeps the first video's intro
 *  ("Hi! This is Maths by Zosiama"); newer videos say the name only in the outro.
 */
(function (root) {
  'use strict';

  const SIMS = [
    {
      id: 'sim01', num: 1, sim: 'sim1', slug: 'sim01-kite-string',
      title: 'The Kite String', legacyIntro: true,
      titles: { hook: 'the kite, the string and the big question', know: 'side names, sine, sin 60°, why not tan' },
      shows: {
        hook: 'The kite high in the sky, the string down to the peg, 60 m and 60° marked, a big “?”, “Pause & try it first!” sticker, progress bar',
        question: 'Maths by Zosiama badge, full question card; key facts highlighted as they are read',
        scene: 'Sky scene drawn to scale (1 m = 6 px): peg A, the kite C flies in, B drops below it, right triangle ABC',
        given: '“What we know” card with units; 60 m height arrow, 60° angle, right-angle mark, x = ? on the string',
        know: '“Know first!”: Opposite / Hypotenuse / Adjacent tags on the triangle, sin θ = Opposite/Hypotenuse, sin 60° = √3/2, √3 ≈ 1.732, why not tan',
        solve: 'Solution board, one line per step with real fractions; the sides used glow on the triangle',
        answer: 'Answer card, sine check, and the 60 m height laid along the string to show the string is longer',
        outro: '“Follow Maths by Zosiama” end card with tapping follow button; dissolves back into the hook to loop',
      },
      question: 'A kite is flying at a ⟦height of 60 m⟧ above the ground. The string attached to the kite is temporarily ⟦tied to a point on the ground⟧. The ⟦inclination of the string with the ground is 60°⟧. Find the ⟦length of the string⟧, assuming that there is ⟦no slack⟧ in the string.',
      // the scene, drawn to scale: A = where the string is tied, B = ground point below the kite, C = the kite
      scene: { kind: 'kite', scale: 6, height: 60, angle: 60 },
      unknown: { side: 'AC', value: '40√3 ≈ 69.28 m', approx: '≈ 69.28 m' },
      hook: {
        head: ['Kite 60 m up · string at 60°', 'Is the string longer than 60 m?'],
        ask: 'String length = ?',
        lines: [
          { say: 'Wait! This kite is 60 metres up. Its string makes 60 degrees.', cap: 'Wait! This kite is 60 m up. Its string makes 60°.' },
          { say: 'So how long is the string? More than 60 metres, or less?', cap: 'How long is the string? More than 60 m, or less?' },
          { say: 'Pause and try it first. Then stay till the end!', cap: 'Pause & try it first! Then stay till the end!' },
        ],
      },
      qLines: [
        { say: 'The kite is 60 metres high. Its string is tied to the ground.', cap: 'The kite is 60 m high. Its string is tied to the ground.', mark: [0, 1] },
        { say: 'It makes 60 degrees with the ground, with no slack. How long is it?', cap: 'It makes 60° with the ground, no slack. How long is it?', mark: [2, 4, 3] },
      ],
      sceneLines: [
        { say: 'Let us draw it to scale. 1 metre is 6 pixels.', cap: 'Let’s draw it to scale: 1 m = 6 px.', show: 'ground', legend: 'scale', sfx: 'whoosh' },
        { say: 'Point A is where the string is tied to the ground.', show: 'A', legend: 'A', sfx: 'pop' },
        { say: 'Point C is the kite, flying 60 metres up.', show: 'C', legend: 'C', sfx: 'whoosh' },
        { say: 'Point B is on the ground, right below the kite.', show: 'B', legend: 'B', sfx: 'pop' },
        { say: 'A, B and C make a right triangle, with the right angle at B!', cap: 'A, B and C make a right triangle, right angle at B!', show: 'tri', legend: 'tri', hl: 'tri' },
      ],
      given: [
        { m: '{BC} = 60 m (height)', say: 'BC, the height, is 60 metres.', cap: 'BC = 60 m, the height.', hl: 'BC', show: 'height' },
        { m: '∠A = 60°', say: 'Angle A, at the ground, is 60 degrees.', cap: '∠A = 60°, at the ground.', hl: 'angle', show: 'angle' },
        { m: '∠B = 90°', say: 'Angle B is a right angle, 90 degrees.', cap: '∠B = 90°, a right angle.', hl: 'right', show: 'right' },
      ],
      find: { m: '{AC} = [x] = ?  (the string)', say: 'We must find AC, the string. Let us call it x.', cap: 'Find AC, the string. Call it x.', hl: 'AC', show: 'x' },
      know: [
        { m: '{Opp} → faces θ → {BC}', say: 'Know this first! The side facing angle A is the opposite. That is BC.', cap: 'Know this first! The side facing the angle is the Opposite: BC.', page: 0, hl: 'BC', show: 'opp', sfx: 'pop' },
        { m: '{Hyp} → longest side → {AC}', say: 'The longest side is the hypotenuse. That is AC, the string.', cap: 'The longest side is the Hypotenuse: AC, the string.', page: 0, hl: 'AC', show: 'hyp' },
        { m: '{Adj} → next to θ → {AB}', say: 'The side next to angle A is the adjacent. That is AB.', cap: 'The side next to the angle is the Adjacent: AB.', page: 0, hl: 'AB', show: 'adj' },
        { m: 'sin θ = (({Opp}/{Hyp}))', say: 'Sine is opposite over hypotenuse. Our magic rule!', cap: 'Sine = Opposite ÷ Hypotenuse. Our magic rule!', rule: true, page: 1, hl: 'BC+AC', sfx: 'ding' },
        { m: 'sin 60° = ((√3/2))', say: 'Also know: sine of 60 degrees is root 3 over 2.', cap: 'Also know: sin 60° = √3/2.', page: 1 },
        { m: '√3 ≈ 1.732', say: 'And root 3 is about 1.732.', cap: 'And √3 ≈ 1.732.', page: 1 },
        { m: 'tan θ = (({Opp}/{Adj}))  → ground, not string ✗', say: 'Why not tan? Tan uses the adjacent: the ground, not the string!', cap: 'Why not tan? Tan uses the Adjacent: the ground, not the string!', page: 2, hl: 'AB', sfx: 'uhoh' },
      ],
      steps: [
        { m: 'sin 60° = (({BC}/{AC})) = ((60/[x]))', say: 'Sine 60 degrees is BC over AC. That is 60 over x.', cap: 'sin 60° = BC/AC = 60/x.', hl: 'BC+AC' },
        { m: '((√3/2)) = ((60/[x]))   →   [x] = ((120/√3))', say: 'So root 3 over 2 equals 60 over x. Cross multiply: x is 120 over root 3.', cap: 'So √3/2 = 60/x. Cross multiply: x = 120/√3.', hl: 'AC' },
        { m: '[x] = ((120 × √3/√3 × √3)) = ((120√3/3)) = 40√3', say: 'Times root 3 on top and bottom: x is 40 root 3!', cap: 'Multiply top and bottom by √3: x = 40√3!', hl: 'AC' },
        { m: '[x] ≈ 40 × 1.732 = 69.28 m', say: 'Root 3 is about 1.732, so x is about 69.28 metres!', cap: '√3 ≈ 1.732, so x ≈ 69.28 m!', hl: 'AC', solve: true, show: 'solved' },
      ],
      answer: {
        card: ['{AC} = 40√3 m ≈ 69.28 m'],
        say: 'So, the string is 40 root 3 metres, about 69.28 metres!', cap: 'So, the string AC = 40√3 m ≈ 69.28 m!',
      },
      check: [
        { m: 'sin 60° = ((60/69.28)) ≈ 0.866', say: 'Check! 60 divided by 69.28 is 0.866.', cap: 'Check! 60 ÷ 69.28 ≈ 0.866.', hl: 'BC+AC' },
        { m: '0.866 = ((√3/2)) = sin 60° ✓', say: 'That is root 3 over 2. It matches!', cap: 'That’s √3/2 = sin 60°. It matches!' },
        { m: '{AC} = 69.28 m > {BC} = 60 m ✓', say: 'And the string is longer than the height. The hypotenuse is always the longest side!', cap: 'The string is longer than the height: the hypotenuse is always the longest!', hl: 'BC+AC', show: 'compare' },
      ],
    },
    {
      id: 'sim15', num: 15, sim: 'sim15', slug: 'sim15-drifting-balloon',
      title: 'The Drifting Balloon',
      question: 'A ⟦1.2 m tall girl⟧ spots a balloon moving with the wind in a ⟦horizontal line⟧ at a ⟦height of 88.2 m⟧ from the ground. The angle of elevation of the balloon from the ⟦eyes of the girl⟧ at any instant is ⟦60°⟧. After some time, the angle of elevation ⟦reduces to 30°⟧. Find the ⟦distance travelled by the balloon⟧ during the interval.',
      // the scene, drawn to scale: E = her eyes, P and Q = the balloon at 60° and at 30°,
      // M and N = the points at her eye level straight below P and Q
      scene: {
        kind: 'balloon', engine: 'balloon.js', scale: 4, height: 88.2, eye: 1.2, a1: 60, a2: 30,
        run1: '29√3', run2: '87√3', dExact: '58√3', dApprox: '100.46',
      },
      titles: { hook: 'the girl, the drifting balloon and the big question', know: 'side names, tan, tan 60°, tan 30°, √3, PQ = MN' },
      shows: {
        hook: 'The girl looking up, the balloon drifting from its first spot (ghost) to where it is now, 60° and 30° at her eyes, 88.2 m marked, a big “?” on its path, “Pause & try it first!” sticker, progress bar',
        question: 'Maths by Zosiama badge, full question card; key facts highlighted as they are read',
        scene: 'Sky scene drawn to scale (1 m = 4 px): the tiny girl and a ×20 zoom bubble showing her eyes E 1.2 m up; the balloon at P, 88.2 m up, 60° line of sight; the wind carries it to Q while the live angle drops to 30°; drops to M and N at her eye level, right triangles EMP and ENQ',
        given: '“What we know” card with units; the 88.2 m arrow, the 1.2 m bubble and both angles glow; d = ? on the balloon’s path',
        know: '“Know first!”: an idea picture (one right triangle with Opposite / Adjacent / Hypotenuse, θ at an eye, the right-angle mark, a balloon on top), tan θ = Opposite/Adjacent, tan 60° = √3, tan 30° = 1/√3, √3 ≈ 1.732; back to the scene for PQ = MN',
        solve: 'Solution board over three pages, real fractions; each step lights up its triangle (EMP, then ENQ) and the new length appears on the scene: 87 m, EM = 29√3 m, EN = 87√3 m, MN = d = 58√3 m',
        answer: 'Answer card d = 58√3 m ≈ 100.46 m, then the check: 87 ÷ 50.23 ≈ 1.732 = tan 60° and 87 ÷ 150.69 ≈ 0.577 = tan 30°',
        outro: '“Follow Maths by Zosiama” end card with tapping follow button; dissolves back into the hook to loop',
      },
      unknown: { value: '58√3 ≈ 100.46 m' },
      hook: {
        head: ['A balloon: 60° → 30°', 'How far did it fly?'],
        ask: 'Distance flown: d = ? m',
        lines: [
          { say: 'This balloon drifts from 60 degrees to 30 degrees.', cap: 'This balloon drifts from 60° to 30°.' },
          { say: 'How far did it fly, with just two angles? Pause and try it first!', cap: 'How far did it fly, with just two angles? Pause & try it first!' },
        ],
      },
      qLines: [
        { say: 'A girl, 1.2 metres tall, sees a balloon 88.2 metres up.', cap: 'A girl, 1.2 m tall, sees a balloon 88.2 m up.', mark: [0, 2] },
        { say: 'It drifts along a flat line.', mark: [1] },
        { say: 'From her eyes: first 60 degrees, later 30 degrees.', cap: 'From her eyes: first 60°, later 30°.', mark: [3, 4, 5] },
        { say: 'How far did the balloon travel?', mark: [6] },
      ],
      sceneLines: [
        { say: 'Drawn to scale: 1 metre is 4 pixels.', cap: 'Drawn to scale: 1 m = 4 px.', show: 'ground', legend: 'scale', sfx: 'whoosh' },
        { say: 'Here is the girl. She is tiny, so let us zoom in!', cap: 'Here’s the girl. She’s tiny, so let’s zoom in!', show: 'girl', sfx: 'pop' },
        { say: 'Her eyes, E, are 1.2 metres above the ground.', cap: 'Her eyes, E, are 1.2 m above the ground.', show: 'zoom', legend: 'E', hl: 'eye', sfx: 'pop' },
        { say: 'The balloon is at P, 88.2 metres up.', cap: 'The balloon is at P, 88.2 m up.', show: 'P', legend: 'P', hl: 'h88', sfx: 'whoosh' },
        { say: 'She looks up at 60 degrees.', cap: 'She looks up at 60°.', show: 'sight1', hl: 'a60', sfx: 'pop' },
        { say: 'Then the wind blows it along, to Q.', show: 'drift', legend: 'Q', min: 4.6, sfx: 'whoosh' },
        { say: 'Now the angle is only 30 degrees.', cap: 'Now the angle is only 30°.', show: 'sight2', hl: 'a30', sfx: 'pop' },
        { say: 'Drop down to her eye level, at M and N. Two right triangles!', show: 'drops', legend: 'tri', hl: 'tri1+tri2', min: 2.2 },
      ],
      given: [
        { m: 'Balloon height = 88.2 m', say: 'The balloon: 88.2 metres up.', cap: 'The balloon: 88.2 m up.', hl: 'h88' },
        { m: 'Her eyes = 1.2 m above the ground', say: 'Her eyes: 1.2 metres up.', cap: 'Her eyes: 1.2 m up.', hl: 'eye' },
        { m: '∠PEM = 60°,  ∠QEN = 30°', say: 'The angles: 60 degrees, then 30.', cap: 'The angles: 60°, then 30°.', hl: 'angles' },
      ],
      find: { m: '{d} = {PQ} = ?  (how far it flew)', say: 'Find P Q, how far it flew. Call it dee.', cap: 'Find PQ, how far it flew. Call it d.', hl: 'PQ', show: 'd' },
      know: [
        { m: '{Opp} → faces θ → the height', say: 'Know this first! The side facing the angle is the opposite: the height.', cap: 'Know this first! The side facing the angle is the Opposite: the height.', page: 0, hl: 'Opp', show: 'opp', sfx: 'pop' },
        { m: '{Adj} → next to θ → along the ground', say: 'The side next to it is the adjacent: along the ground.', cap: 'The side next to it is the Adjacent: along the ground.', page: 0, hl: 'Adj', show: 'adj' },
        { m: '{Hyp} → longest → the line of sight', say: 'The longest side is the hypotenuse: her line of sight.', cap: 'The longest side is the Hypotenuse: her line of sight.', page: 0, hl: 'Hyp', show: 'hyp' },
        { m: 'tan θ = (({Opp}/{Adj}))', say: 'Tan is opposite over adjacent: height over ground. Our magic rule!', cap: 'tan θ = Opposite ÷ Adjacent: height over ground. Our magic rule!', rule: true, page: 1, hl: 'Opp+Adj', sfx: 'ding' },
        { m: 'tan 60° = √3', say: 'Tan 60 degrees is root 3.', cap: 'tan 60° = √3.', page: 1, hl: 'theta' },
        { m: 'tan 30° = ((1/√3))', say: 'And tan 30 degrees is 1 over root 3.', cap: 'And tan 30° = 1/√3.', page: 1, hl: 'theta' },
        { m: '√3 ≈ 1.732', say: 'Root 3 is about 1.732.', cap: '√3 ≈ 1.732.', page: 2 },
        { m: 'Flat flight → {PQ} = {MN}', say: 'It flies flat, so P Q equals M N.', cap: 'It flies flat, so PQ = MN.', page: 2, hl: 'PQ+MN', show: 'mn', sfx: 'whoosh' },
      ],
      steps: [
        { m: '{PM} = {QN} = 88.2 − 1.2 = 87 m', say: 'Above her eyes: 88.2 minus 1.2 is 87 metres.', cap: 'Above her eyes: 88.2 − 1.2 = 87 m.', hl: 'PM+QN+eye', show: 'h87', page: 0 },
        { m: '△EMP: tan 60° = (({PM}/{EM})) = ((87/{EM}))', say: 'In triangle E M P, tan 60 degrees is 87 over E M.', cap: 'In △EMP: tan 60° = 87/EM.', hl: 'tri1+a60', page: 0 },
        { m: '{EM} = ((87/√3)) = ((87√3/3)) = 29√3 m', say: 'So E M is 87 over root 3. That is 29 root 3 metres.', cap: 'So EM = 87/√3 = 29√3 m.', hl: 'EM', show: 'EMv', page: 0 },
        { m: '△ENQ: tan 30° = (({QN}/{EN})) = ((87/{EN}))', say: 'In triangle E N Q, tan 30 degrees is 87 over E N.', cap: 'In △ENQ: tan 30° = 87/EN.', hl: 'tri2+a30', page: 1 },
        { m: '((1/√3)) = ((87/{EN}))  →  {EN} = 87√3 m', say: 'So E N is 87 root 3 metres.', cap: 'So EN = 87√3 m.', hl: 'EN', show: 'ENv', page: 1 },
        { m: '{d} = {MN} = {EN} − {EM}', say: 'The balloon flew M N: E N take away E M.', cap: 'The balloon flew MN = EN − EM.', hl: 'MN+EN', page: 2 },
        { m: '{d} = 87√3 − 29√3 = 58√3 m', say: '87 root 3 minus 29 root 3 is 58 root 3 metres!', cap: '87√3 − 29√3 = 58√3 m!', hl: 'MN', show: 'dval', page: 2 },
        { m: '{d} ≈ 58 × 1.732 ≈ 100.46 m', say: 'That is about 100.46 metres!', cap: 'That’s about 100.46 m!', hl: 'PQ', solve: true, show: 'solved', page: 2 },
      ],
      answer: {
        card: ['{d} = 58√3 m ≈ 100.46 m'],
        say: 'The balloon flew 58 root 3 metres, about 100.46 metres!', cap: 'The balloon flew d = 58√3 m ≈ 100.46 m!',
      },
      check: [
        { m: '{PM} ÷ {EM} = ((87/50.23)) ≈ 1.732 = tan 60° ✓', say: 'Check! 87 over 50.23 is 1.732: tan 60 degrees!', cap: 'Check! 87 ÷ 50.23 ≈ 1.732 = tan 60°.', hl: 'tri1' },
        { m: '{QN} ÷ {EN} = ((87/150.69)) ≈ 0.577 = tan 30° ✓', say: '87 over 150.69 is 0.577: tan 30 degrees! It fits!', cap: '87 ÷ 150.69 ≈ 0.577 = tan 30°. It fits!', hl: 'tri2' },
      ],
    },
  ];

  // ----------------------------------------------------------------------------
  // Beats (the storyboard). Timings are filled in by video-kit/audio.py from the voice.
  // ----------------------------------------------------------------------------
  function buildBeats(p) {
    const beats = [];
    const add = (type, title, lines) => beats.push({ type, title, lines });
    add('hook', `Hook: ${p.titles.hook}`, p.hook.lines.map((l, i) => Object.assign({ sfx: i === 0 ? 'hit' : undefined }, l)));
    add('question', 'Intro + the question', [
      p.legacyIntro
        ? { say: 'Hi! This is Maths by Zosiama. Let us solve it together!', cap: 'Hi! This is Maths by Zosiama. Let’s solve it together!', brand: true, sfx: 'whoosh' }
        : { say: 'Let us solve it together, step by step!', cap: 'Let’s solve it together, step by step!', brand: true, sfx: 'whoosh' },
      { say: 'Here is the question.', mark: [] },
      ...p.qLines,
    ]);
    add('scene', 'The scene, drawn to scale', p.sceneLines);
    add('given', 'What we know + what we must find', [
      { say: 'What do we know?', sfx: 'pop', hl: 'none' },
      ...p.given.map((g) => Object.assign({ sfx: 'pop' }, g)),
      Object.assign({ find: true, sfx: 'pop' }, p.find),
    ]);
    add('know', `Know first: ${p.titles.know}`, p.know);
    add('solve', 'Solution board, one step per line', p.steps.map((s) => Object.assign({ sfx: 'write' }, s)));
    add('answer', 'Answer card + quick check', [
      Object.assign({ answer: true, sfx: 'ding' }, p.answer),
      ...p.check.map((c, i) => Object.assign({ check: i, sfx: i === p.check.length - 1 ? 'sparkle' : 'pop' }, c)),
    ]);
    add('outro', 'End card: Follow Maths by Zosiama', [
      { say: 'Great job! You solved it!', sfx: 'tada' },
      { say: 'For more easy maths, follow Maths by Zosiama!', cap: 'For more easy maths… Follow Maths by Zosiama!', follow: true },
    ]);
    beats.forEach((b) => b.lines.forEach((l, li) => { l.id = `${b.type}.${li}`; if (!l.cap) l.cap = l.say; }));
    return beats;
  }

  const api = { SIMS, buildBeats };
  root.SIMS = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
