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
 *           BC AC AB BC+AC angle right tri none
 *  show = scene element that appears with the line (see engine.js)
 */
(function (root) {
  'use strict';

  const SIMS = [
    {
      id: 'sim01', num: 1, sim: 'sim1', slug: 'sim01-kite-string',
      title: 'The Kite String',
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
  ];

  // ----------------------------------------------------------------------------
  // Beats (the storyboard). Timings are filled in by video-kit/audio.py from the voice.
  // ----------------------------------------------------------------------------
  function buildBeats(p) {
    const beats = [];
    const add = (type, title, lines) => beats.push({ type, title, lines });
    add('hook', 'Hook: the kite, the string and the big question', p.hook.lines.map((l, i) => Object.assign({ sfx: i === 0 ? 'hit' : undefined }, l)));
    add('question', 'Intro + the question', [
      { say: 'Hi! This is Maths by Zosiama. Let us solve it together!', cap: 'Hi! This is Maths by Zosiama. Let’s solve it together!', brand: true, sfx: 'whoosh' },
      { say: 'Here is the question.', mark: [] },
      ...p.qLines,
    ]);
    add('scene', 'The scene, drawn to scale', p.sceneLines);
    add('given', 'What we know + what we must find', [
      { say: 'What do we know?', sfx: 'pop', hl: 'none' },
      ...p.given.map((g) => Object.assign({ sfx: 'pop' }, g)),
      Object.assign({ find: true, sfx: 'pop' }, p.find),
    ]);
    add('know', 'Know first: side names, sine, sin 60°, why not tan', p.know);
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
