/* Maths by Zosiama · Surface Areas & Volumes explainers
 * Problem data and narration scripts (combinations of solids).
 *
 *  say  = what the offline voice reads (never start a sentence with the article "A":
 *         a lone capital A is read as the letter)
 *  cap  = caption shown on screen (defaults to say)
 *  m    = maths line on the board: {r} {h} {l} {a} coloured letters, ((a/b)) stacked fraction
 *  hl   = part(s) that glow while the line plays (part ids, cavity ids, id.ends, all)
 *  show = scene element(s) that appear with the line ('+' joins several):
 *         solid, explode, join, joint, cavity, spill, a part's own show key, dimension ids,
 *         and solved keys that swap a dimension label to its answer
 *  legend = a row on the scene card {icon, s}
 */
(function (root) {
  'use strict';

  const scaleLine = (u, s, word) => ({
    say: `Let us draw it to scale. 1 ${word} is ${s} pixels.`, cap: `Drawn to scale: 1 ${u} = ${s} px.`,
    show: 'solid', legend: { icon: 'ruler', s: `Scale: 1 ${u} = ${s} px` }, sfx: 'whoosh',
  });
  const pause = { say: 'Pause and try it first. Then stay till the end!', cap: 'Pause & try it first! Then stay till the end!' };

  const PROBLEMS = [
    // ------------------------------------------------------------------------ Q1
    {
      id: 'q01', num: 1, slug: 'q01-cube-with-hemisphere-cut-out', title: 'Cube with a bowl cut out',
      question: 'A ⟦hemispherical depression⟧ is cut out from ⟦one face of a cubical wooden block⟧ such that the ⟦diameter l of the hemisphere is equal to the edge of the cube⟧. Determine the ⟦surface area of the remaining solid⟧.',
      scene: {
        unit: 'l', scale: 28, yaw: 35, elev: 24, notToScale: 'Not to scale: l is any length',
        parts: [{ id: 'cube', type: 'box', w: 10, h: 10, d: 10, color: 'wood' }],
        cavities: [{ id: 'bowl', type: 'bowl', r: 5, at: [0, 10, 0], in: 'cube' }],
        dims: [
          { id: 'a', type: 'edge', from: [-5, 0, 5], to: [5, 0, 5], off: [-14, 34], text: 'l' },
          { id: 'a', type: 'vert', from: [-5, 0, 5], to: [-5, 10, 5], off: [-36, 0], label: [-16, 0], align: 'right', text: 'l' },
          { id: 'r', type: 'radius', c: [0, 10, 0], r: 5, color: 'r', label: [0, -32], text: 'r = ((l/2))' },
        ],
      },
      hook: {
        head: ['Cut a bowl out of a cube…', 'Does its surface go UP or DOWN?'], ask: 'New surface area = ?', art: { kind: 'block', spin: true },
        lines: [
          { say: 'Wait! We scoop a bowl out of this wooden cube.' },
          { say: 'Does its surface area go up, or down? Guess!' },
          pause,
        ],
      },
      qLines: [
        { say: 'The bowl is half of a ball, called a hemisphere. It is cut out of one face of a wooden cube.', mark: [0, 1] },
        { say: 'The bowl is as wide as the cube: its diameter is l. Find the surface area of the solid left.', cap: 'The bowl’s diameter l equals the cube’s edge. Find the surface area left.', mark: [2, 3] },
      ],
      sceneLines: [
        { say: 'This picture is not to scale. The cube can be any size, so we call its edge l.', cap: 'Not to scale: the cube’s edge l can be any length.', show: 'solid+a', legend: { icon: 'cube', s: 'cube: every edge = l (any size)' }, sfx: 'whoosh', hl: 'cube' },
        { say: 'Now we carve a bowl into the top face.', show: 'cavity', legend: { icon: 'bowl', s: 'bowl = hemisphere' }, sfx: 'whoosh', hl: 'bowl' },
        { say: 'Its diameter is l, the same as the edge. So its radius is l over 2.', cap: 'Diameter = l, so radius r = l/2.', show: 'r', legend: { icon: 'dim', s: 'radius {r} = ((l/2))' }, hl: 'bowl' },
      ],
      given: [
        { m: 'cube edge = l', say: 'The cube edge is l.', hl: 'cube' },
        { m: 'bowl diameter = l', say: 'The bowl diameter is also l.', hl: 'bowl' },
        { m: '{r} = ((l/2))', say: 'So the radius r is l over 2.', cap: 'So r = l/2.', hl: 'bowl' },
      ],
      find: { m: 'surface area S = ?', say: 'We must find the new surface area. Let us call it S.', cap: 'Find the new surface area S.', hl: 'all' },
      know: [
        { m: 'one face = l × l = l²', say: 'Know this first! One face of the cube is l times l, which is l squared.', cap: 'Know this first! One face = l × l = l².', page: 0, sfx: 'pop', hl: 'cube' },
        { m: 'whole cube = 6l²', say: 'The cube has 6 faces, so its surface is 6 l squared.', cap: '6 faces, so the cube’s surface = 6l².', page: 0, hl: 'cube' },
        { m: 'flat circle = π{r}²', say: 'The flat circle we cut away has area pi r squared.', cap: 'The circle we cut away = πr².', page: 0, hl: 'bowl' },
        { m: 'bowl surface = 2π{r}²', say: 'The inside of the bowl is half a ball. Its area is 2 pi r squared.', cap: 'Inside of the bowl = 2πr².', page: 1, hl: 'bowl' },
        { m: 'S = 6l² − π{r}² + 2π{r}²', say: 'So we take away the circle, and add the bowl. That is our magic rule!', cap: 'Take away the circle, add the bowl: our magic rule!', rule: true, page: 1, sfx: 'ding', hl: 'all' },
      ],
      steps: [
        { m: 'S = 6l² − π{r}² + 2π{r}² = 6l² + π{r}²', say: 'Minus pi r squared, plus 2 pi r squared, leaves plus pi r squared.', cap: '−πr² + 2πr² leaves +πr².' },
        { m: 'S = 6l² + π × ((l²/4))', say: 'The radius is l over 2, so r squared is l squared over 4.', cap: 'r = l/2, so r² = l²/4.', hl: 'bowl' },
        { m: 'S = ((l²/4)) × 24 + ((l²/4)) × π', say: '6 l squared is the same as 24 times l squared over 4.', cap: '6l² = 24 × l²/4.' },
        { m: 'S = ((l²/4))(π + 24)', say: 'Take out l squared over 4. We get l squared over 4, times pi plus 24!', cap: 'Take out l²/4: S = l²/4 × (π + 24)!', solve: true, hl: 'all' },
      ],
      answer: { card: ['S = ((l²/4))(π + 24) sq. units'], say: 'So the surface area is l squared over 4, times pi plus 24, square units.', cap: 'So S = l²/4 × (π + 24) square units.' },
      check: [
        { m: 'before: 6l² · after: 6l² + ((πl²/4))', say: 'Check! Before cutting, the area was 6 l squared. After, it is 6 l squared plus pi l squared over 4.', cap: 'Check! Before: 6l². After: 6l² + πl²/4.' },
        { m: 'the bowl adds ((πl²/4)) ≈ 0.79 l² ✓', say: 'So the area went up! The bowl has more surface than the flat circle.', cap: 'The area went UP: the bowl has more surface than the circle!' },
      ],
    },

    // ------------------------------------------------------------------------ Q2
    {
      id: 'q02', num: 2, slug: 'q02-cone-removed-from-cylinder', title: 'Cone out of a cylinder',
      question: 'From a ⟦solid circular cylinder with height 10 cm⟧ and ⟦radius of the base 6 cm⟧, a ⟦right circular cone of the same height and same base is removed⟧. Find the ⟦volume of the remaining solid⟧. Also, find the ⟦whole surface area⟧.',
      scene: {
        unit: 'cm', scale: 30, hidden: true,
        parts: [{ id: 'cyl', type: 'cyl', r: 6, h: 10, color: 'teal' }],
        cavities: [{ id: 'hole', type: 'conehole', r: 6, h: 10, at: [0, 10, 0], in: 'cyl' }],
        dims: [
          { id: 'r', type: 'radius', c: [0, 10, 0], r: 6, color: 'r', label: [0, -34], text: 'r = 6 cm' },
          { id: 'h', type: 'vert', from: [6, 0, 0], to: [6, 10, 0], off: [42, 0], ext: true, label: [16, 0], align: 'left', color: 'h', text: 'h = 10 cm' },
          { id: 'l', type: 'line', from: [0, 0, 0.1], to: [-6, 10, 0.1], color: 'l', label: [-96, 20], text: 'l', solved: 'lsolved', solvedText: 'l ≈ 11.66 cm' },
        ],
      },
      hook: {
        head: ['Pull a cone out of a cylinder', 'What is left?'], ask: 'Volume & area = ?', art: { kind: 'coneOut', lift: true, fitH: 2.25, dy: 110 },
        lines: [
          { say: 'Wait! We pull a cone right out of this cylinder.' },
          { say: 'How much is left? And how much surface does it have?' },
          pause,
        ],
      },
      qLines: [
        { say: 'The solid cylinder is 10 centimetres tall. Its base has radius 6 centimetres.', cap: 'The cylinder is 10 cm tall, with base radius 6 cm.', mark: [0, 1] },
        { say: 'The cone with the same height and base is removed. Find the volume left, and the whole surface area.', mark: [2, 3, 4] },
      ],
      sceneLines: [
        scaleLine('cm', 30, 'centimetre'),
        { say: 'Here is the cylinder. Its radius is 6 centimetres.', show: 'r', legend: { icon: 'cyl', s: 'cylinder: {r} = 6 cm' }, hl: 'cyl' },
        { say: 'It is 10 centimetres tall.', show: 'h', legend: { icon: 'dim', s: 'height {h} = 10 cm' } },
        { say: 'Now we pull out a cone with the same base and height. Its tip was at the bottom!', show: 'cavity', legend: { icon: 'cone', s: 'cone removed: same {r} and {h}' }, sfx: 'whoosh', hl: 'hole' },
        { say: 'The sloping side of the cone is its slant height, l.', show: 'l', legend: { icon: 'dim', s: 'slant height {l}' }, hl: 'hole' },
      ],
      given: [
        { m: '{r} = 6 cm', say: 'The radius r is 6 centimetres.', cap: 'r = 6 cm.', hl: 'cyl' },
        { m: '{h} = 10 cm', say: 'The height h is 10 centimetres.', cap: 'h = 10 cm.' },
        { m: 'cone: same {r} and {h}', say: 'The cone has the same radius and height.', hl: 'hole' },
      ],
      find: { m: 'V = ?   whole area = ?', say: 'We must find the volume left, and the whole surface area.', cap: 'Find the volume V and the whole surface area.', hl: 'all' },
      know: [
        { m: 'cylinder volume = π{r}²{h}', say: 'Know this first! The volume of a cylinder is pi r squared h.', cap: 'Know this first! Cylinder volume = πr²h.', page: 0, sfx: 'pop', hl: 'cyl' },
        { m: 'cone volume = ((1/3))π{r}²{h}', say: 'The volume of a cone is one third of pi r squared h.', cap: 'Cone volume = ⅓πr²h.', page: 0, hl: 'hole' },
        { m: 'slant {l} = √({r}² + {h}²)', say: 'The slant height l is the square root of r squared plus h squared.', cap: 'Slant height l = √(r² + h²).', page: 0, hl: 'hole' },
        { m: 'cylinder side = 2π{r}{h}', say: 'The curved side of the cylinder has area 2 pi r h.', cap: 'Cylinder side = 2πrh.', page: 1, hl: 'cyl' },
        { m: 'inside of cone = π{r}{l}', say: 'The inside of the cone has area pi r l.', cap: 'Inside of the cone = πrl.', page: 1, hl: 'hole' },
        { m: 'area = 2π{r}{h} + π{r}² + π{r}{l}', say: 'The surface left is the side, the bottom circle, and the inside of the cone. That is our magic rule!', cap: 'Surface left: side + bottom + inside of cone. Our magic rule!', rule: true, page: 2, sfx: 'ding', hl: 'all' },
      ],
      steps: [
        { m: 'V = π{r}²{h} − ((1/3))π{r}²{h} = ((2/3))π{r}²{h}', say: 'Volume left is the cylinder minus the cone. That is two thirds of pi r squared h.', cap: 'Volume left = cylinder − cone = ⅔πr²h.', hl: 'cyl' },
        { m: 'V = ((2/3)) × ((22/7)) × 6² × 10 = ((5280/7))', say: 'Put in the numbers: two thirds, times 22 over 7, times 36, times 10. That is 5280 over 7.', cap: '⅔ × 22/7 × 36 × 10 = 5280/7.' },
        { m: 'V ≈ 754.29 cm³', say: 'That is about 754.29 cubic centimetres!', cap: 'V ≈ 754.29 cm³!', solve: true },
        { m: '{l} = √(6² + 10²) = √136 ≈ 11.66 cm', say: 'Now the slant height: root of 36 plus 100, which is root 136, about 11.66 centimetres.', cap: 'l = √(36 + 100) = √136 ≈ 11.66 cm.', page: 1, hl: 'hole', show: 'lsolved' },
        { m: 'area = π{r}(2{h} + {r} + {l})', say: 'The area is pi r, times 2 h plus r plus l.', cap: 'Area = πr(2h + r + l).', page: 1, hl: 'all' },
        { m: 'area = ((22/7)) × 6 × (20 + 6 + 11.66) ≈ 710.2 cm²', say: 'That is 22 over 7, times 6, times 37.66. About 710.2 square centimetres!', cap: '22/7 × 6 × 37.66 ≈ 710.2 cm²!', page: 1, solve: true },
      ],
      answer: { card: ['V ≈ 754.29 cm³', 'whole area ≈ 710.2 cm²'], say: 'So, the volume left is about 754.29 cubic centimetres, and the whole surface area is about 710.2 square centimetres!', cap: 'V ≈ 754.29 cm³ and whole area ≈ 710.2 cm²!' },
      check: [
        { m: 'cylinder ≈ 1131.43 cm³ · cone = ((1/3)) of it ≈ 377.14 cm³', say: 'Check! The cylinder holds about 1131.43 cubic centimetres. The cone is one third of that, 377.14.', cap: 'Check! Cylinder ≈ 1131.43 cm³, cone = ⅓ of it ≈ 377.14 cm³.' },
        { m: '1131.43 − 377.14 = 754.29 cm³ ✓', say: 'And 1131.43 minus 377.14 is 754.29. It matches!', cap: '1131.43 − 377.14 = 754.29. It matches!' },
      ],
    },

    // ------------------------------------------------------------------------ Q3
    {
      id: 'q03', num: 3, slug: 'q03-polishing-cylinder-with-hemispherical-ends', title: 'Polishing a round-ended solid',
      question: 'A solid is composed of a ⟦cylinder with hemispherical ends⟧. If the ⟦whole length of the solid is 104 cm⟧ and the ⟦radius of each of its hemispherical ends is 7 cm⟧, find the ⟦cost of polishing its surface at the rate of ₹10 per dm²⟧.',
      scene: {
        unit: 'cm', scale: 7,
        parts: [
          { id: 'capL', type: 'hcap', r: 7, dir: -1, x: -45, y: 7, color: 'sun' },
          { id: 'cyl', type: 'hcyl', r: 7, len: 90, at: [0, 7, 0], color: 'teal' },
          { id: 'capR', type: 'hcap', r: 7, dir: 1, x: 45, y: 7, color: 'sun' },
        ],
        explode: { capL: [-10, 0, 0], capR: [10, 0, 0] },
        joints: [{ c: [-45, 7, 0], r: 7, axis: 'x' }, { c: [45, 7, 0], r: 7, axis: 'x' }],
        dims: [
          { id: 'r', type: 'radius', c: [45, 7, 0], r: 7, dir: [0, 1, 0], color: 'r', label: [74, 0], text: 'r = 7 cm' },
          { id: 'L', type: 'horiz', from: [-52, 0, 0], to: [52, 0, 0], off: [0, 44], text: '104 cm' },
          { id: 'h', type: 'horiz', from: [-45, 14, 0], to: [45, 14, 0], off: [0, -40], color: 'h', text: 'h = 90 cm' },
        ],
      },
      hook: {
        head: ['104 cm long, round ends', 'Polish at ₹10 per dm²'], ask: 'Polishing cost = ?', art: { kind: 'polish' },
        lines: [
          { say: 'Wait! We want to polish this long solid with round ends.' },
          { say: 'Polishing costs 10 rupees for each square decimetre. What is the total cost?', cap: 'Polishing costs ₹10 per square decimetre. What is the total cost?' },
          pause,
        ],
      },
      qLines: [
        { say: 'The solid is a cylinder with a hemisphere on each end.', mark: [0] },
        { say: 'It is 104 centimetres long, and each end has radius 7 centimetres. Polishing costs 10 rupees per square decimetre.', cap: '104 cm long, ends of radius 7 cm, polishing ₹10 per dm².', mark: [1, 2, 3] },
      ],
      sceneLines: [
        scaleLine('cm', 7, 'centimetre'),
        { say: 'It is a cylinder in the middle, with a hemisphere on each end.', show: 'explode', legend: { icon: 'capsule', s: 'cylinder + 2 hemispheres' }, hl: 'cyl' },
        { say: 'Each end has radius 7 centimetres.', show: 'r', legend: { icon: 'dim', s: 'radius {r} = 7 cm' }, hl: 'capL+capR' },
        { say: 'The whole length is 104 centimetres.', show: 'L', legend: { icon: 'dim', s: 'whole length = 104 cm' } },
        { say: 'So the cylinder part is 104, minus 7, minus 7. That is 90 centimetres.', cap: 'So the cylinder is 104 − 7 − 7 = 90 cm long.', show: 'h', legend: { icon: 'dim', s: 'cylinder {h} = 90 cm' }, hl: 'cyl' },
      ],
      given: [
        { m: 'whole length = 104 cm', say: 'The whole length is 104 centimetres.', cap: 'Whole length = 104 cm.' },
        { m: '{r} = 7 cm', say: 'The radius r is 7 centimetres.', cap: 'r = 7 cm.', hl: 'capL+capR' },
        { m: 'rate = ₹10 per dm²', say: 'Polishing costs 10 rupees per square decimetre.', cap: 'Rate = ₹10 per dm².' },
      ],
      find: { m: 'cost = ?', say: 'We must find the total cost of polishing.', hl: 'all' },
      know: [
        { m: 'cylinder side = 2π{r}{h}', say: 'Know this first! The curved side of a cylinder is 2 pi r h.', cap: 'Know this first! Cylinder side = 2πrh.', page: 0, sfx: 'pop', hl: 'cyl' },
        { m: 'hemisphere = 2π{r}²', say: 'The curved surface of a hemisphere is 2 pi r squared.', cap: 'Hemisphere surface = 2πr².', page: 0, hl: 'capL+capR' },
        { m: '1 dm = 10 cm, so 1 dm² = 100 cm²', say: 'And 1 decimetre is 10 centimetres, so 1 square decimetre is 100 square centimetres.', cap: '1 dm = 10 cm, so 1 dm² = 100 cm².', page: 0 },
        { m: 'surface = 2π{r}{h} + 2 × 2π{r}²', say: 'The surface is the cylinder side plus two hemispheres. The flat circles are hidden inside! That is our magic rule.', cap: 'Surface = cylinder side + 2 hemispheres (flat circles hidden). Our magic rule!', rule: true, page: 1, sfx: 'ding', hl: 'all', show: 'joint' },
      ],
      steps: [
        { m: '{h} = 104 − 2 × 7 = 90 cm', say: 'The cylinder part is 104 minus 14, which is 90 centimetres.', cap: 'h = 104 − 14 = 90 cm.', hl: 'cyl' },
        { m: 'surface = 2π{r}({h} + 2{r}) = 2 × ((22/7)) × 7 × 104', say: 'The surface is 2 pi r, times h plus 2 r. That is 2 times 22 over 7, times 7, times 104.', cap: 'Surface = 2πr(h + 2r) = 2 × 22/7 × 7 × 104.', hl: 'all' },
        { m: 'surface = 44 × 104 = 4576 cm² = 45.76 dm²', say: 'That is 4576 square centimetres, which is 45.76 square decimetres.', cap: '= 4576 cm² = 45.76 dm².' },
        { m: 'cost = 45.76 × ₹10 = ₹457.60', say: 'So the cost is 45.76 times 10 rupees. That is 457 rupees and 60 paise!', cap: 'Cost = 45.76 × ₹10 = ₹457.60!', solve: true },
      ],
      answer: { card: ['cost = ₹457.60'], say: 'So, polishing costs 457 rupees and 60 paise!', cap: 'So, polishing costs ₹457.60!' },
      check: [
        { m: 'side 2π{r}{h} = 3960 cm² · two ends 4π{r}² = 616 cm²', say: 'Check! The side is 3960 square centimetres, and the two ends are 616.', cap: 'Check! Side = 3960 cm², two ends = 616 cm².' },
        { m: '3960 + 616 = 4576 cm² ✓', say: '3960 plus 616 is 4576. It matches!', cap: '3960 + 616 = 4576. It matches!' },
      ],
    },

    // ------------------------------------------------------------------------ Q4
    {
      id: 'q04', num: 4, slug: 'q04-cylinder-with-hemispheres-scooped-out', title: 'Scooped-out wooden article',
      question: 'A wooden article was made by ⟦scooping out a hemisphere from each end of a solid cylinder⟧. If the ⟦height of the cylinder is 20 cm⟧ and its ⟦base is of radius 3.5 cm⟧, find the ⟦total surface area of the article⟧.',
      scene: {
        unit: 'cm', scale: 17,
        parts: [{ id: 'cyl', type: 'cyl', r: 3.5, h: 20, color: 'wood' }],
        cavities: [
          { id: 'top', type: 'bowl', r: 3.5, at: [0, 20, 0], in: 'cyl' },
          { id: 'bot', type: 'bowlUp', r: 3.5, at: [0, 0, 0], in: 'cyl', hiddenOnly: true },
        ],
        dims: [
          { id: 'h', type: 'vert', from: [3.5, 0, 0], to: [3.5, 20, 0], off: [44, 0], ext: true, label: [16, 0], align: 'left', color: 'h', text: 'h = 20 cm' },
          { id: 'r', type: 'radius', c: [0, 20, 0], r: 3.5, color: 'r', label: [0, -34], text: 'r = 3.5 cm' },
        ],
      },
      hook: {
        head: ['Scoop a bowl out of each end', 'Height 20 cm, radius 3.5 cm'], ask: 'Total surface area = ?', art: { kind: 'scoop' },
        lines: [
          { say: 'Wait! We scoop a bowl out of both ends of this wooden cylinder.' },
          { say: 'What is its total surface area now?' },
          pause,
        ],
      },
      qLines: [
        { say: 'The solid wooden cylinder is 20 centimetres tall. Its base has radius 3.5 centimetres.', cap: 'The wooden cylinder is 20 cm tall, base radius 3.5 cm.', mark: [1, 2] },
        { say: 'Then a hemisphere is scooped out of each end. Find the total surface area.', mark: [0, 3] },
      ],
      sceneLines: [
        scaleLine('cm', 17, 'centimetre'),
        { say: 'Here is the wooden cylinder. It is 20 centimetres tall.', show: 'h', legend: { icon: 'cyl', s: 'cylinder: {h} = 20 cm' }, hl: 'cyl' },
        { say: 'Its radius is 3.5 centimetres.', show: 'r', legend: { icon: 'dim', s: 'radius {r} = 3.5 cm' } },
        { say: 'Now we scoop a hemisphere out of the top, and another out of the bottom.', show: 'cavity', legend: { icon: 'bowl', s: '2 bowls scooped out, {r} = 3.5 cm' }, sfx: 'whoosh', hl: 'top+bot' },
      ],
      given: [
        { m: '{h} = 20 cm', say: 'The height h is 20 centimetres.', cap: 'h = 20 cm.', hl: 'cyl' },
        { m: '{r} = 3.5 cm', say: 'The radius r is 3.5 centimetres.', cap: 'r = 3.5 cm.' },
        { m: 'bowls: {r} = 3.5 cm', say: 'Each bowl has the same radius.', hl: 'top+bot' },
      ],
      find: { m: 'total surface area = ?', say: 'We must find the total surface area.', hl: 'all' },
      know: [
        { m: 'cylinder side = 2π{r}{h}', say: 'Know this first! The curved side of a cylinder is 2 pi r h.', cap: 'Know this first! Cylinder side = 2πrh.', page: 0, sfx: 'pop', hl: 'cyl' },
        { m: 'bowl surface = 2π{r}²', say: 'The inside of a bowl, half a ball, is 2 pi r squared.', cap: 'Inside of a bowl = 2πr².', page: 0, hl: 'top+bot' },
        { m: 'total = 2π{r}{h} + 2 × 2π{r}²', say: 'The flat ends are gone. Instead we get the insides of two bowls. That is our magic rule!', cap: 'Flat ends gone, two bowls added. Our magic rule!', rule: true, page: 1, sfx: 'ding', hl: 'all' },
      ],
      steps: [
        { m: 'total = 2π{r}{h} + 4π{r}² = 2π{r}({h} + 2{r})', say: 'The total is 2 pi r h plus 4 pi r squared. That is 2 pi r, times h plus 2 r.', cap: 'Total = 2πrh + 4πr² = 2πr(h + 2r).', hl: 'all' },
        { m: 'total = 2 × ((22/7)) × 3.5 × (20 + 7)', say: 'Put in the numbers: 2 times 22 over 7, times 3.5, times 27.', cap: '= 2 × 22/7 × 3.5 × 27.' },
        { m: 'total = 22 × 27 = 594 cm²', say: 'That is 22 times 27, which is 594 square centimetres!', cap: '= 22 × 27 = 594 cm²!', solve: true },
      ],
      answer: { card: ['total surface area = 594 cm²'], say: 'So, the total surface area is 594 square centimetres!', cap: 'So, the total surface area = 594 cm²!' },
      check: [
        { m: 'side 2π{r}{h} = 440 cm² · bowls 4π{r}² = 154 cm²', say: 'Check! The side is 440 square centimetres, and the two bowls are 154.', cap: 'Check! Side = 440 cm², two bowls = 154 cm².' },
        { m: '440 + 154 = 594 cm² ✓', say: '440 plus 154 is 594. It matches!', cap: '440 + 154 = 594. It matches!' },
      ],
    },

    // ------------------------------------------------------------------------ Q5
    {
      id: 'q05', num: 5, slug: 'q05-medicine-capsule', title: 'Medicine capsule',
      question: 'A ⟦medicine capsule⟧ is in the shape of a ⟦cylinder with two hemispheres stuck to each of its ends⟧. The ⟦length of the entire capsule is 14 mm⟧ and the ⟦diameter of the capsule is 5 mm⟧. Find its ⟦surface area⟧.',
      scene: {
        unit: 'mm', scale: 50,
        parts: [
          { id: 'capL', type: 'hcap', r: 2.5, dir: -1, x: -4.5, y: 2.5, color: 'coral' },
          { id: 'cyl', type: 'hcyl', r: 2.5, len: 9, at: [0, 2.5, 0], color: 'teal' },
          { id: 'capR', type: 'hcap', r: 2.5, dir: 1, x: 4.5, y: 2.5, color: 'coral' },
        ],
        explode: { capL: [-1.3, 0, 0], capR: [1.3, 0, 0] },
        joints: [{ c: [-4.5, 2.5, 0], r: 2.5, axis: 'x' }, { c: [4.5, 2.5, 0], r: 2.5, axis: 'x' }],
        dims: [
          { id: 'd', type: 'vert', from: [1.2, 0, 2.6], to: [1.2, 5, 2.6], color: 'r', label: [18, 0], align: 'left', text: 'd = 5 mm' },
          { id: 'L', type: 'horiz', from: [-7, 0, 0], to: [7, 0, 0], off: [0, 44], text: '14 mm' },
          { id: 'h', type: 'horiz', from: [-4.5, 5, 0], to: [4.5, 5, 0], off: [0, -40], color: 'h', text: 'h = 9 mm' },
        ],
      },
      hook: {
        head: ['A medicine capsule', '14 mm long, 5 mm wide'], ask: 'Surface area = ?', art: { kind: 'capsule' },
        lines: [
          { say: 'Wait! How much surface does this tiny medicine capsule have?' },
          { say: 'It is only 14 millimetres long!' },
          pause,
        ],
      },
      qLines: [
        { say: 'The capsule is a cylinder with a hemisphere stuck on each end.', mark: [0, 1] },
        { say: 'The whole capsule is 14 millimetres long, and 5 millimetres wide. Find its surface area.', cap: 'It is 14 mm long and 5 mm wide. Find its surface area.', mark: [2, 3, 4] },
      ],
      sceneLines: [
        scaleLine('mm', 50, 'millimetre'),
        { say: 'It has a cylinder in the middle, and a hemisphere on each end.', show: 'explode', legend: { icon: 'capsule', s: 'cylinder + 2 hemispheres' }, hl: 'cyl' },
        { say: 'It is 5 millimetres wide, so the radius is 2.5 millimetres.', cap: '5 mm wide, so radius r = 2.5 mm.', show: 'd', legend: { icon: 'dim', s: 'diameter 5 mm, so {r} = 2.5 mm' }, hl: 'capL+capR' },
        { say: 'The whole capsule is 14 millimetres long.', show: 'L', legend: { icon: 'dim', s: 'whole length = 14 mm' } },
        { say: 'So the cylinder part is 14, minus 2.5, minus 2.5. That is 9 millimetres.', cap: 'So the cylinder is 14 − 2.5 − 2.5 = 9 mm long.', show: 'h', legend: { icon: 'dim', s: 'cylinder {h} = 9 mm' }, hl: 'cyl' },
      ],
      given: [
        { m: 'whole length = 14 mm', say: 'The whole length is 14 millimetres.', cap: 'Whole length = 14 mm.' },
        { m: 'diameter = 5 mm, so {r} = 2.5 mm', say: 'The diameter is 5 millimetres, so r is 2.5 millimetres.', cap: 'Diameter = 5 mm, so r = 2.5 mm.', hl: 'capL+capR' },
      ],
      find: { m: 'surface area = ?', say: 'We must find the surface area.', hl: 'all' },
      know: [
        { m: 'cylinder side = 2π{r}{h}', say: 'Know this first! The curved side of a cylinder is 2 pi r h.', cap: 'Know this first! Cylinder side = 2πrh.', page: 0, sfx: 'pop', hl: 'cyl' },
        { m: 'hemisphere = 2π{r}²', say: 'The curved surface of a hemisphere is 2 pi r squared.', cap: 'Hemisphere surface = 2πr².', page: 0, hl: 'capL+capR' },
        { m: 'surface = 2π{r}{h} + 2 × 2π{r}²', say: 'The surface is the side plus two hemispheres. The flat circles are hidden inside! That is our magic rule.', cap: 'Surface = side + 2 hemispheres (flat circles hidden). Our magic rule!', rule: true, page: 1, sfx: 'ding', hl: 'all', show: 'joint' },
      ],
      steps: [
        { m: '{h} = 14 − 2 × 2.5 = 9 mm', say: 'The cylinder part is 14 minus 5, which is 9 millimetres.', cap: 'h = 14 − 5 = 9 mm.', hl: 'cyl' },
        { m: 'surface = 2π{r}({h} + 2{r}) = 2 × ((22/7)) × 2.5 × 14', say: 'The surface is 2 pi r, times h plus 2 r. That is 2 times 22 over 7, times 2.5, times 14.', cap: 'Surface = 2πr(h + 2r) = 2 × 22/7 × 2.5 × 14.', hl: 'all' },
        { m: 'surface = 220 mm²', say: 'That is 220 square millimetres!', cap: '= 220 mm²!', solve: true },
      ],
      answer: { card: ['surface area = 220 mm²'], say: 'So, the capsule has a surface area of 220 square millimetres!', cap: 'So, the surface area = 220 mm²!' },
      check: [
        { m: 'side = ((990/7)) mm² · ends = ((550/7)) mm²', say: 'Check! The side is 990 over 7, and the two ends are 550 over 7.', cap: 'Check! Side = 990/7 mm², ends = 550/7 mm².' },
        { m: '((990/7)) + ((550/7)) = ((1540/7)) = 220 mm² ✓', say: 'Together that is 1540 over 7, which is 220. It matches!', cap: 'Together 1540/7 = 220. It matches!' },
      ],
    },

    // ------------------------------------------------------------------------ Q6
    {
      id: 'q06', num: 6, slug: 'q06-cone-in-a-vessel-of-water', title: 'Cone in a full vessel',
      question: 'A ⟦cylindrical vessel with internal diameter 10 cm and height 10.5 cm⟧ is ⟦full of water⟧. A ⟦solid cone of base diameter 7 cm and height 6 cm⟧ is ⟦completely immersed⟧ in water. Find the volume of: (i) ⟦water displaced out⟧ of the cylindrical vessel. (ii) ⟦water left⟧ in the cylindrical vessel.',
      scene: {
        unit: 'cm', scale: 28,
        parts: [
          { id: 'cone', type: 'cone', r: 3.5, h: 6, color: 'coral', show: 'cone', drop: 13, hookLift: 13 },
          { id: 'cyl', type: 'cyl', r: 5, h: 10.5, color: 'teal', glass: true },
        ],
        spill: { r: 5, h: 10.5 },
        dims: [
          { id: 'R', type: 'radius', c: [0, 10.5, 0], r: 5, color: 'r', label: [0, -34], text: 'r = 5 cm' },
          { id: 'H', type: 'vert', from: [5, 0, 0], to: [5, 10.5, 0], off: [42, 0], ext: true, label: [16, 0], align: 'left', color: 'h', text: 'h = 10.5 cm' },
          { id: 'rc', type: 'radius', c: [0, 0, 0], r: 3.5, dir: [-1, 0, 0], color: 'r', label: [-40, 34], text: 'r = 3.5 cm' },
          { id: 'rc', type: 'vert', from: [-5, 0, 0], to: [-5, 6, 0], off: [-42, 0], ext: true, label: [-16, 0], align: 'right', color: 'h', text: 'h = 6 cm' },
        ],
      },
      hook: {
        head: ['Drop a cone into a full vessel', 'Water spills out!'], ask: 'Spilled & left = ?', art: { kind: 'water', fitH: 1.9, dy: 60 },
        lines: [
          { say: 'Wait! This vessel is full of water, right to the top. Now we drop a cone in!' },
          { say: 'How much water spills out? And how much is left?' },
          pause,
        ],
      },
      qLines: [
        { say: 'The cylinder vessel is 10 centimetres wide inside, and 10.5 centimetres tall. It is full of water.', cap: 'The vessel is 10 cm wide inside, 10.5 cm tall, and full of water.', mark: [0, 1] },
        { say: 'The solid cone is 7 centimetres wide and 6 centimetres tall, and it goes right under the water. Find the water spilled, and the water left.', cap: 'The cone is 7 cm wide, 6 cm tall, fully under water. Find the water spilled and left.', mark: [2, 3, 4, 5] },
      ],
      sceneLines: [
        scaleLine('cm', 28, 'centimetre'),
        { say: 'Here is the vessel, full of water. Its radius is 5 centimetres.', show: 'R', legend: { icon: 'cyl', s: 'vessel: {r} = 5 cm' }, hl: 'cyl' },
        { say: 'It is 10.5 centimetres tall.', show: 'H', legend: { icon: 'dim', s: 'vessel {h} = 10.5 cm' } },
        { say: 'Now we lower the cone in. It is 6 centimetres tall, with radius 3.5 centimetres.', show: 'cone+rc', legend: { icon: 'cone', s: 'cone: {r} = 3.5 cm, {h} = 6 cm' }, hl: 'cone', sfx: 'whoosh' },
        { say: 'The cone pushes some water out over the top!', show: 'spill', legend: { icon: 'dim', s: 'water spilled = cone’s volume' }, sfx: 'pop' },
      ],
      given: [
        { m: 'vessel: {r} = 5 cm, {h} = 10.5 cm', say: 'The vessel has radius 5 centimetres and height 10.5 centimetres.', cap: 'Vessel: r = 5 cm, h = 10.5 cm.', hl: 'cyl' },
        { m: 'cone: {r} = 3.5 cm, {h} = 6 cm', say: 'The cone has radius 3.5 centimetres and height 6 centimetres.', cap: 'Cone: r = 3.5 cm, h = 6 cm.', hl: 'cone' },
      ],
      find: { m: '(i) spilled = ?   (ii) left = ?', say: 'We must find the water spilled, and the water left.', cap: 'Find (i) the water spilled, (ii) the water left.', hl: 'all' },
      know: [
        { m: 'cone volume = ((1/3))π{r}²{h}', say: 'Know this first! The volume of a cone is one third of pi r squared h.', cap: 'Know this first! Cone volume = ⅓πr²h.', page: 0, sfx: 'pop', hl: 'cone' },
        { m: 'cylinder volume = π{r}²{h}', say: 'The volume of a cylinder is pi r squared h.', cap: 'Cylinder volume = πr²h.', page: 0, hl: 'cyl' },
        { m: 'water spilled = volume of the cone', say: 'The cone takes the place of the water, so the water spilled is the volume of the cone. That is our magic rule!', cap: 'The cone takes the water’s place: spilled = cone volume. Our magic rule!', rule: true, page: 1, sfx: 'ding', hl: 'cone' },
        { m: 'water left = vessel − spilled', say: 'And the water left is the full vessel minus the water spilled.', cap: 'Water left = full vessel − water spilled.', page: 1, hl: 'cyl' },
      ],
      steps: [
        { m: 'spilled = ((1/3)) × ((22/7)) × 3.5² × 6', say: 'The water spilled is one third, times 22 over 7, times 3.5 squared, times 6.', cap: 'Spilled = ⅓ × 22/7 × 3.5² × 6.', hl: 'cone' },
        { m: 'spilled = 77 cm³', say: 'That is 77 cubic centimetres!', cap: '= 77 cm³!', solve: true },
        { m: 'vessel = ((22/7)) × 5² × 10.5 = 825 cm³', say: 'The full vessel is 22 over 7, times 25, times 10.5. That is 825 cubic centimetres.', cap: 'Vessel = 22/7 × 25 × 10.5 = 825 cm³.', hl: 'cyl' },
        { m: 'left = 825 − 77 = 748 cm³', say: 'So the water left is 825 minus 77. That is 748 cubic centimetres!', cap: 'Left = 825 − 77 = 748 cm³!', solve: true },
      ],
      answer: { card: ['(i) water spilled = 77 cm³', '(ii) water left = 748 cm³'], say: 'So, 77 cubic centimetres of water spilled out, and 748 cubic centimetres are left!', cap: 'So: 77 cm³ spilled, 748 cm³ left!' },
      check: [
        { m: 'spilled + left = 77 + 748', say: 'Check! Add the water spilled and the water left.', cap: 'Check! Spilled + left = 77 + 748.' },
        { m: '= 825 cm³ = the full vessel ✓', say: 'That is 825 cubic centimetres, the full vessel. It matches!', cap: '= 825 cm³, the full vessel. It matches!' },
      ],
    },

    // ------------------------------------------------------------------------ Q7
    {
      id: 'q07', num: 7, slug: 'q07-toy-cone-on-hemisphere', title: 'Wobbly toy',
      question: 'A ⟦toy is in the form of a cone mounted on a hemisphere⟧ of ⟦common base radius 7 cm⟧. The ⟦total height of the toy is 31 cm⟧. Find the ⟦total surface area of the toy⟧.',
      scene: {
        unit: 'cm', scale: 12, hidden: true,
        parts: [
          { id: 'hemi', type: 'hemi', r: 7, dir: 'down', at: [0, 7, 0], color: 'teal' },
          { id: 'cone', type: 'cone', r: 7, h: 24, at: [0, 7, 0], color: 'coral' },
        ],
        explode: { cone: [0, 6, 0] },
        joints: [{ c: [0, 7, 0], r: 7 }],
        dims: [
          { id: 'r', type: 'radius', c: [0, 7, 0], r: 7, color: 'r', label: [70, 30], align: 'left', text: 'r = 7 cm' },
          { id: 'H', type: 'vert', from: [-7, 0, 0], to: [-7, 31, 0], off: [-44, 0], ext: true, label: [-16, 0], align: 'right', text: '31 cm' },
          { id: 'h', type: 'vert', from: [7, 7, 0], to: [7, 31, 0], off: [44, 0], ext: true, label: [16, 0], align: 'left', color: 'h', text: 'h = 24 cm' },
          { id: 'l', type: 'line', from: [0, 31, 0], to: [7, 7, 0], off: [10, 0], color: 'l', label: [-64, 0], text: 'l', solved: 'lsolved', solvedText: 'l = 25 cm' },
        ],
      },
      hook: {
        head: ['A wobbly toy', 'Cone on a hemisphere, 31 cm tall'], ask: 'Total surface area = ?', art: { kind: 'wobble', wobble: true },
        lines: [
          { say: 'Wait! This wobbly toy is a cone on top of a hemisphere.' },
          { say: 'How much surface do we need to paint?' },
          pause,
        ],
      },
      qLines: [
        { say: 'The toy is a cone on top of a hemisphere. Both have radius 7 centimetres.', cap: 'The toy is a cone on a hemisphere, both of radius 7 cm.', mark: [0, 1] },
        { say: 'The whole toy is 31 centimetres tall. Find its total surface area.', cap: 'It is 31 cm tall. Find its total surface area.', mark: [2, 3] },
      ],
      sceneLines: [
        scaleLine('cm', 12, 'centimetre'),
        { say: 'The toy has two parts: a hemisphere at the bottom, and a cone on top.', show: 'explode', legend: { icon: 'toy', s: 'hemisphere + cone' }, hl: 'hemi' },
        { say: 'Both have radius 7 centimetres.', show: 'r', legend: { icon: 'dim', s: 'radius {r} = 7 cm' } },
        { say: 'The whole toy is 31 centimetres tall.', show: 'H', legend: { icon: 'dim', s: 'whole height = 31 cm' } },
        { say: 'So the cone is 31 minus 7. That is 24 centimetres tall.', cap: 'So the cone is 31 − 7 = 24 cm tall.', show: 'h', legend: { icon: 'dim', s: 'cone {h} = 24 cm' }, hl: 'cone' },
      ],
      given: [
        { m: '{r} = 7 cm', say: 'The radius r is 7 centimetres.', cap: 'r = 7 cm.', hl: 'hemi' },
        { m: 'whole height = 31 cm', say: 'The whole height is 31 centimetres.', cap: 'Whole height = 31 cm.' },
      ],
      find: { m: 'total surface area = ?', say: 'We must find the total surface area.', hl: 'all' },
      know: [
        { m: 'hemisphere = 2π{r}²', say: 'Know this first! The curved surface of a hemisphere is 2 pi r squared.', cap: 'Know this first! Hemisphere surface = 2πr².', page: 0, sfx: 'pop', hl: 'hemi' },
        { m: 'cone side = π{r}{l}', say: 'The curved side of a cone is pi r l.', cap: 'Cone side = πrl.', page: 0, hl: 'cone' },
        { m: 'slant {l} = √({r}² + {h}²)', say: 'The slant height l is the square root of r squared plus h squared.', cap: 'Slant height l = √(r² + h²).', page: 0, hl: 'cone', show: 'l' },
        { m: 'total = 2π{r}² + π{r}{l}', say: 'The flat circle where they join is hidden inside, so we do not count it! That is our magic rule.', cap: 'The joining circle is hidden, so: total = 2πr² + πrl. Our magic rule!', rule: true, page: 1, sfx: 'ding', hl: 'all', show: 'joint' },
      ],
      steps: [
        { m: '{h} = 31 − 7 = 24 cm', say: 'The cone is 31 minus 7, which is 24 centimetres tall.', cap: 'h = 31 − 7 = 24 cm.', hl: 'cone' },
        { m: '{l} = √(24² + 7²) = √625 = 25 cm', say: 'The slant height is root of 576 plus 49, which is root 625. That is 25 centimetres.', cap: 'l = √(576 + 49) = √625 = 25 cm.', hl: 'cone', show: 'lsolved' },
        { m: 'total = π{r}(2{r} + {l}) = ((22/7)) × 7 × (14 + 25)', say: 'The total is pi r, times 2 r plus l. That is 22 over 7, times 7, times 39.', cap: 'Total = πr(2r + l) = 22/7 × 7 × 39.', hl: 'all' },
        { m: 'total = 22 × 39 = 858 cm²', say: 'That is 22 times 39, which is 858 square centimetres!', cap: '= 22 × 39 = 858 cm²!', solve: true },
      ],
      answer: { card: ['total surface area = 858 cm²'], say: 'So, the toy has a total surface area of 858 square centimetres!', cap: 'So, the total surface area = 858 cm²!' },
      check: [
        { m: 'hemisphere 2π{r}² = 308 cm² · cone π{r}{l} = 550 cm²', say: 'Check! The hemisphere is 308 square centimetres, and the cone is 550.', cap: 'Check! Hemisphere = 308 cm², cone = 550 cm².' },
        { m: '308 + 550 = 858 cm² ✓', say: '308 plus 550 is 858. It matches!', cap: '308 + 550 = 858. It matches!' },
      ],
    },

    // ------------------------------------------------------------------------ Q8
    {
      id: 'q08', num: 8, slug: 'q08-cube-21cm-with-hemisphere-cut-out', title: 'Wooden cube with a bowl',
      question: 'A ⟦hemispherical depression⟧ is cut out from one face of a ⟦cubical wooden block of edge 21 cm⟧, such that the ⟦diameter of the hemisphere is equal to the edge of the cube⟧. Determine the ⟦volume⟧ and ⟦total surface area of the remaining block⟧.',
      scene: {
        unit: 'cm', scale: 14, yaw: 35, elev: 24,
        parts: [{ id: 'cube', type: 'box', w: 21, h: 21, d: 21, color: 'wood' }],
        cavities: [{ id: 'bowl', type: 'bowl', r: 10.5, at: [0, 21, 0], in: 'cube' }],
        dims: [
          { id: 'a', type: 'edge', from: [-10.5, 0, 10.5], to: [10.5, 0, 10.5], off: [-14, 34], color: 'a', text: 'a = 21 cm' },
          { id: 'a', type: 'vert', from: [-10.5, 0, 10.5], to: [-10.5, 21, 10.5], off: [-38, 0], label: [-16, 0], align: 'right', color: 'a', text: '21 cm' },
          { id: 'r', type: 'radius', c: [0, 21, 0], r: 10.5, color: 'r', label: [0, -32], text: 'r = 10.5 cm' },
        ],
      },
      hook: {
        head: ['A 21 cm wooden cube', 'with a bowl carved in the top'], ask: 'Volume & area = ?', art: { kind: 'block', spin: true },
        lines: [
          { say: 'Wait! We carve a bowl into this 21 centimetre wooden cube.' },
          { say: 'What volume is left? And what is its surface area?' },
          pause,
        ],
      },
      qLines: [
        { say: 'The wooden cube has edges of 21 centimetres.', mark: [1] },
        { say: 'Then a hemisphere, as wide as the cube, is cut out of one face. Find the volume and surface area left.', mark: [0, 2, 3, 4] },
      ],
      sceneLines: [
        scaleLine('cm', 14, 'centimetre'),
        { say: 'Here is the wooden cube. Each edge is 21 centimetres.', show: 'a', legend: { icon: 'cube', s: 'cube: edge {a} = 21 cm' }, hl: 'cube' },
        { say: 'We carve a hemisphere into the top face.', show: 'cavity', legend: { icon: 'bowl', s: 'bowl = hemisphere' }, sfx: 'whoosh', hl: 'bowl' },
        { say: 'Its diameter is 21 centimetres, so its radius is 10.5 centimetres.', cap: 'Diameter 21 cm, so radius r = 10.5 cm.', show: 'r', legend: { icon: 'dim', s: 'radius {r} = 10.5 cm' }, hl: 'bowl' },
      ],
      given: [
        { m: 'edge {a} = 21 cm', say: 'The edge a is 21 centimetres.', cap: 'Edge a = 21 cm.', hl: 'cube' },
        { m: 'diameter 21 cm, so {r} = 10.5 cm', say: 'The bowl is 21 centimetres across, so r is 10.5 centimetres.', cap: 'Bowl diameter 21 cm, so r = 10.5 cm.', hl: 'bowl' },
      ],
      find: { m: 'volume V = ?   area A = ?', say: 'We must find the volume and the surface area left.', cap: 'Find the volume V and surface area A.', hl: 'all' },
      know: [
        { m: 'cube volume = {a}³', say: 'Know this first! The volume of a cube is a cubed.', cap: 'Know this first! Cube volume = a³.', page: 0, sfx: 'pop', hl: 'cube' },
        { m: 'hemisphere volume = ((2/3))π{r}³', say: 'The volume of a hemisphere is two thirds pi r cubed.', cap: 'Hemisphere volume = ⅔πr³.', page: 0, hl: 'bowl' },
        { m: 'cube surface = 6{a}²', say: 'The surface of a cube is 6 a squared.', cap: 'Cube surface = 6a².', page: 1, hl: 'cube' },
        { m: 'A = 6{a}² − π{r}² + 2π{r}²', say: 'Take away the flat circle, and add the bowl, which is 2 pi r squared. That is our magic rule!', cap: 'Take away the circle πr², add the bowl 2πr². Our magic rule!', rule: true, page: 1, sfx: 'ding', hl: 'all' },
      ],
      steps: [
        { m: 'V = {a}³ − ((2/3))π{r}³', say: 'The volume left is the cube, minus the hemisphere.', cap: 'V = cube − hemisphere = a³ − ⅔πr³.', hl: 'cube' },
        { m: 'V = 9261 − ((2/3)) × ((22/7)) × 10.5³ = 9261 − 2425.5', say: '21 cubed is 9261. The hemisphere is two thirds, times 22 over 7, times 10.5 cubed, which is 2425.5.', cap: '21³ = 9261; ⅔ × 22/7 × 10.5³ = 2425.5.', hl: 'bowl' },
        { m: 'V = 6835.5 cm³', say: 'So the volume left is 6835.5 cubic centimetres!', cap: 'V = 6835.5 cm³!', solve: true },
        { m: 'A = 6{a}² + π{r}²', say: 'Now the area: minus pi r squared, plus 2 pi r squared, leaves plus pi r squared.', cap: 'A = 6a² − πr² + 2πr² = 6a² + πr².', page: 1, hl: 'all' },
        { m: 'A = 6 × 441 + ((22/7)) × 110.25 = 2646 + 346.5', say: '6 times 441 is 2646. And 22 over 7, times 110.25, is 346.5.', cap: '6 × 441 = 2646; 22/7 × 110.25 = 346.5.', page: 1 },
        { m: 'A = 2992.5 cm²', say: 'So the surface area is 2992.5 square centimetres!', cap: 'A = 2992.5 cm²!', page: 1, solve: true },
      ],
      answer: { card: ['V = 6835.5 cm³', 'A = 2992.5 cm²'], say: 'So, the volume left is 6835.5 cubic centimetres, and the surface area is 2992.5 square centimetres!', cap: 'V = 6835.5 cm³ and A = 2992.5 cm²!' },
      check: [
        { m: 'bowl = ((2/3))π{r}³ = 2425.5 cm³', say: 'Check! The bowl took away 2425.5 cubic centimetres of wood.', cap: 'Check! The bowl took away 2425.5 cm³.' },
        { m: '6835.5 + 2425.5 = 9261 = 21³ ✓', say: 'Put it back: 6835.5 plus 2425.5 is 9261. That is 21 cubed. It matches!', cap: '6835.5 + 2425.5 = 9261 = 21³. It matches!' },
      ],
    },

    // ------------------------------------------------------------------------ Q9
    {
      id: 'q09', num: 9, slug: 'q09-ice-cream-cone', title: 'Ice-cream cone',
      question: 'An ⟦ice-cream cone full of ice-cream⟧ having ⟦radius 5 cm and height 10 cm⟧, as shown. Calculate the ⟦volume of ice-cream⟧, provided that its ⟦1/6 part is left unfilled⟧ with ice-cream.',
      scene: {
        unit: 'cm', scale: 25,
        parts: [
          { id: 'cone', type: 'cone', r: 5, h: -10, at: [0, 10, 0], color: 'wood' },
          { id: 'scoop', type: 'hemi', r: 5, dir: 'up', at: [0, 10, 0], color: 'coral' },
        ],
        explode: { scoop: [0, 4, 0] },
        joints: [{ c: [0, 10, 0], r: 5 }],
        dims: [
          { id: 'r', type: 'radius', c: [0, 10, 0], r: 5, color: 'r', label: [56, 30], align: 'left', text: 'r = 5 cm' },
          { id: 'h', type: 'vert', from: [5, 0, 0], to: [5, 10, 0], off: [40, 0], ext: true, label: [16, 0], align: 'left', color: 'h', text: 'h = 10 cm' },
        ],
      },
      hook: {
        head: ['Ice-cream cone: r 5 cm, h 10 cm', '((1/6)) of it is empty!'], ask: 'Ice-cream volume = ?', art: { kind: 'icecream' },
        lines: [
          { say: 'Wait! How much ice-cream is in this cone?' },
          { say: 'The cone is 10 centimetres tall, and one sixth of it is empty!', cap: 'The cone is 10 cm tall, and ⅙ of it is empty!' },
          pause,
        ],
      },
      qLines: [
        { say: 'The ice-cream cone has radius 5 centimetres and height 10 centimetres, with half a ball of ice-cream on top.', cap: 'Radius 5 cm, height 10 cm, with half a ball of ice-cream on top.', mark: [0, 1] },
        { say: 'One sixth of it is left without ice-cream. Find the volume of ice-cream.', cap: '⅙ of it is left empty. Find the volume of ice-cream.', mark: [2, 3] },
      ],
      sceneLines: [
        scaleLine('cm', 25, 'centimetre'),
        { say: 'The ice-cream fills a cone, and a hemisphere on top.', show: 'explode', legend: { icon: 'icecream', s: 'cone + hemisphere' }, hl: 'cone' },
        { say: 'Both have radius 5 centimetres.', show: 'r', legend: { icon: 'dim', s: 'radius {r} = 5 cm' }, hl: 'scoop' },
        { say: 'The cone is 10 centimetres tall.', show: 'h', legend: { icon: 'dim', s: 'cone height {h} = 10 cm' }, hl: 'cone' },
      ],
      given: [
        { m: '{r} = 5 cm', say: 'The radius r is 5 centimetres.', cap: 'r = 5 cm.', hl: 'scoop' },
        { m: '{h} = 10 cm', say: 'The cone height h is 10 centimetres.', cap: 'h = 10 cm.', hl: 'cone' },
        { m: 'empty part = ((1/6))', say: 'One sixth is empty.', cap: 'Empty part = ⅙.' },
      ],
      find: { m: 'ice-cream volume = ?', say: 'We must find the volume of ice-cream.', hl: 'all' },
      know: [
        { m: 'cone volume = ((1/3))π{r}²{h}', say: 'Know this first! The volume of a cone is one third of pi r squared h.', cap: 'Know this first! Cone volume = ⅓πr²h.', page: 0, sfx: 'pop', hl: 'cone' },
        { m: 'hemisphere volume = ((2/3))π{r}³', say: 'The volume of a hemisphere is two thirds pi r cubed.', cap: 'Hemisphere volume = ⅔πr³.', page: 0, hl: 'scoop' },
        { m: 'ice-cream = ((5/6)) × (cone + hemisphere)', say: 'If one sixth is empty, then five sixths is full of ice-cream. That is our magic rule!', cap: '⅙ empty means ⅚ full. Our magic rule!', rule: true, page: 1, sfx: 'ding', hl: 'all' },
      ],
      steps: [
        { m: 'cone = ((1/3)) × ((22/7)) × 5² × 10 = ((5500/21)) cm³', say: 'The cone is one third, times 22 over 7, times 25, times 10. That is 5500 over 21.', cap: 'Cone = ⅓ × 22/7 × 25 × 10 = 5500/21 cm³.', hl: 'cone' },
        { m: 'hemisphere = ((2/3)) × ((22/7)) × 5³ = ((5500/21)) cm³', say: 'The hemisphere is two thirds, times 22 over 7, times 125. That is 5500 over 21 too. The same!', cap: 'Hemisphere = ⅔ × 22/7 × 125 = 5500/21 cm³. The same!', hl: 'scoop' },
        { m: 'total = ((11000/21)) ≈ 523.81 cm³', say: 'Together, that is 11000 over 21, about 523.81 cubic centimetres.', cap: 'Total = 11000/21 ≈ 523.81 cm³.', hl: 'all' },
        { m: 'ice-cream = ((5/6)) × 523.81 ≈ 436.51 cm³', say: 'Five sixths of that is about 436.51 cubic centimetres!', cap: '⅚ × 523.81 ≈ 436.51 cm³!', solve: true },
      ],
      answer: { card: ['ice-cream ≈ 436.51 cm³'], say: 'So, there are about 436.51 cubic centimetres of ice-cream!', cap: 'So, the ice-cream ≈ 436.51 cm³!' },
      check: [
        { m: 'empty = ((1/6)) × 523.81 ≈ 87.30 cm³', say: 'Check! The empty part is one sixth of 523.81, about 87.30.', cap: 'Check! Empty = ⅙ × 523.81 ≈ 87.30 cm³.' },
        { m: '436.51 + 87.30 = 523.81 cm³ ✓', say: '436.51 plus 87.30 is 523.81. It matches!', cap: '436.51 + 87.30 = 523.81. It matches!' },
      ],
    },

    // ------------------------------------------------------------------------ Q10
    {
      id: 'q10', num: 10, slug: 'q10-toy-cone-two-thirds-of-hemisphere', title: 'Toy with a party-hat cone',
      question: 'A toy is in the form of a ⟦hemisphere surmounted by a right circular cone⟧ of the same base radius as that of the hemisphere. If the ⟦radius of the base of the cone is 21 cm⟧ and its ⟦volume is 2/3 of the volume of the hemisphere⟧, calculate the ⟦height of the cone⟧ and the ⟦surface area of the toy⟧.',
      scene: {
        unit: 'cm', scale: 8, hidden: true,
        parts: [
          { id: 'hemi', type: 'hemi', r: 21, dir: 'down', at: [0, 21, 0], color: 'teal' },
          { id: 'cone', type: 'cone', r: 21, h: 28, at: [0, 21, 0], color: 'coral' },
        ],
        explode: { cone: [0, 8, 0] },
        joints: [{ c: [0, 21, 0], r: 21 }],
        dims: [
          { id: 'r', type: 'radius', c: [0, 21, 0], r: 21, color: 'r', label: [40, 30], align: 'left', text: 'r = 21 cm' },
          { id: 'h', type: 'vert', from: [21, 21, 0], to: [21, 49, 0], off: [40, 0], ext: true, label: [16, 0], align: 'left', color: 'h', text: 'h = ?', solved: 'hsolved', solvedText: 'h = 28 cm' },
          { id: 'l', type: 'line', from: [0, 49, 0], to: [21, 21, 0], off: [10, 0], color: 'l', label: [-70, 0], text: 'l = ?', solved: 'lsolved', solvedText: 'l = 35 cm' },
        ],
      },
      hook: {
        head: ['Cone volume = ((2/3)) of the hemisphere', 'Radius 21 cm'], ask: 'Height & surface = ?', art: { kind: 'toyface' },
        lines: [
          { say: 'Wait! The cone on this toy holds two thirds of the hemisphere’s volume.', cap: 'Wait! This cone holds ⅔ of the hemisphere’s volume.' },
          { say: 'How tall is the cone? And what is the toy’s surface area?' },
          pause,
        ],
      },
      qLines: [
        { say: 'The toy is a hemisphere with a cone on top. Both have radius 21 centimetres.', cap: 'The toy is a hemisphere with a cone on top, both of radius 21 cm.', mark: [0, 1] },
        { say: 'The cone’s volume is two thirds of the hemisphere’s volume. Find the cone’s height, and the toy’s surface area.', cap: 'Cone volume = ⅔ of the hemisphere’s. Find the cone’s height and the surface area.', mark: [2, 3, 4] },
      ],
      sceneLines: [
        scaleLine('cm', 8, 'centimetre'),
        { say: 'The toy has a hemisphere at the bottom, and a cone on top.', show: 'explode', legend: { icon: 'toy', s: 'hemisphere + cone' }, hl: 'hemi' },
        { say: 'Both have radius 21 centimetres.', show: 'r', legend: { icon: 'dim', s: 'radius {r} = 21 cm' } },
        { say: 'We do not know the cone’s height yet. Let us call it h.', show: 'h', legend: { icon: 'dim', s: 'cone height {h} = ?' }, hl: 'cone' },
      ],
      given: [
        { m: '{r} = 21 cm', say: 'The radius r is 21 centimetres.', cap: 'r = 21 cm.', hl: 'hemi' },
        { m: 'cone volume = ((2/3)) × hemisphere volume', say: 'The cone’s volume is two thirds of the hemisphere’s volume.', cap: 'Cone volume = ⅔ × hemisphere volume.', hl: 'cone' },
      ],
      find: { m: '{h} = ?   surface area = ?', say: 'We must find the height h, and the surface area.', cap: 'Find the height h and the surface area.', hl: 'all' },
      know: [
        { m: 'cone volume = ((1/3))π{r}²{h}', say: 'Know this first! The volume of a cone is one third of pi r squared h.', cap: 'Know this first! Cone volume = ⅓πr²h.', page: 0, sfx: 'pop', hl: 'cone' },
        { m: 'hemisphere volume = ((2/3))π{r}³', say: 'The volume of a hemisphere is two thirds pi r cubed.', cap: 'Hemisphere volume = ⅔πr³.', page: 0, hl: 'hemi' },
        { m: 'slant {l} = √({r}² + {h}²)', say: 'The slant height l is the square root of r squared plus h squared.', cap: 'Slant height l = √(r² + h²).', page: 1, hl: 'cone', show: 'l' },
        { m: 'surface = 2π{r}² + π{r}{l}', say: 'The flat circle in the middle is hidden. So the surface is the hemisphere, plus the side of the cone. That is our magic rule!', cap: 'The middle circle is hidden: surface = 2πr² + πrl. Our magic rule!', rule: true, page: 1, sfx: 'ding', hl: 'all', show: 'joint' },
      ],
      steps: [
        { m: '((1/3))π{r}²{h} = ((2/3)) × ((2/3))π{r}³', say: 'The cone volume equals two thirds of the hemisphere volume.', cap: '⅓πr²h = ⅔ × ⅔πr³.', hl: 'cone' },
        { m: '((1/3)){h} = ((4/9)){r}   →   {h} = ((4/3)){r}', say: 'Cancel pi r squared on both sides. One third h equals four ninths r, so h is four thirds of r.', cap: 'Cancel πr²: ⅓h = 4/9 r, so h = 4/3 r.' },
        { m: '{h} = ((4/3)) × 21 = 28 cm', say: 'Four thirds of 21 is 28. The cone is 28 centimetres tall!', cap: 'h = 4/3 × 21 = 28 cm!', solve: true, show: 'hsolved', hl: 'cone' },
        { m: '{l} = √(21² + 28²) = √1225 = 35 cm', say: 'The slant height is root of 441 plus 784, which is root 1225. That is 35 centimetres.', cap: 'l = √(441 + 784) = √1225 = 35 cm.', page: 1, show: 'lsolved', hl: 'cone' },
        { m: 'surface = π{r}(2{r} + {l}) = ((22/7)) × 21 × (42 + 35)', say: 'The surface is pi r, times 2 r plus l. That is 22 over 7, times 21, times 77.', cap: 'Surface = πr(2r + l) = 22/7 × 21 × 77.', page: 1, hl: 'all' },
        { m: 'surface = 66 × 77 = 5082 cm²', say: 'That is 66 times 77, which is 5082 square centimetres!', cap: '= 66 × 77 = 5082 cm²!', page: 1, solve: true },
      ],
      answer: { card: ['cone height = 28 cm', 'surface area = 5082 cm²'], say: 'So, the cone is 28 centimetres tall, and the toy’s surface area is 5082 square centimetres!', cap: 'Cone height = 28 cm, surface area = 5082 cm²!' },
      check: [
        { m: 'cone = 12936 cm³ · hemisphere = 19404 cm³', say: 'Check! The cone holds 12936 cubic centimetres, and the hemisphere holds 19404.', cap: 'Check! Cone = 12936 cm³, hemisphere = 19404 cm³.' },
        { m: '12936 ÷ 19404 = ((2/3)) ✓', say: 'And 12936 divided by 19404 is exactly two thirds. It matches!', cap: '12936 ÷ 19404 = ⅔. It matches!' },
      ],
    },

    // ------------------------------------------------------------------------ Q11
    {
      id: 'q11', num: 11, slug: 'q11-cone-on-hemisphere-volume', title: 'Cone on a hemisphere: volume',
      question: 'A solid is in the shape of a ⟦cone surmounted on a hemisphere⟧, the ⟦radius of each of them being 3.5 cm⟧ and the ⟦total height of the solid is 9.5 cm⟧. Find the ⟦volume of the solid⟧.',
      scene: {
        unit: 'cm', scale: 40, hidden: true,
        parts: [
          { id: 'hemi', type: 'hemi', r: 3.5, dir: 'down', at: [0, 3.5, 0], color: 'coral' },
          { id: 'cone', type: 'cone', r: 3.5, h: 6, at: [0, 3.5, 0], color: 'teal' },
        ],
        explode: { cone: [0, 2, 0] },
        joints: [{ c: [0, 3.5, 0], r: 3.5 }],
        dims: [
          { id: 'r', type: 'radius', c: [0, 3.5, 0], r: 3.5, color: 'r', label: [60, 30], align: 'left', text: 'r = 3.5 cm' },
          { id: 'H', type: 'vert', from: [-3.5, 0, 0], to: [-3.5, 9.5, 0], off: [-44, 0], ext: true, label: [-16, 0], align: 'right', text: '9.5 cm' },
          { id: 'h', type: 'vert', from: [3.5, 3.5, 0], to: [3.5, 9.5, 0], off: [44, 0], ext: true, label: [16, 0], align: 'left', color: 'h', text: 'h = 6 cm' },
        ],
      },
      hook: {
        head: ['Cone on a hemisphere', 'Total height 9.5 cm'], ask: 'Volume = ?', art: { kind: 'ornament' },
        lines: [
          { say: 'Wait! This solid is a cone sitting on a hemisphere.' },
          { say: 'It is 9.5 centimetres tall. How much space does it take up?' },
          pause,
        ],
      },
      qLines: [
        { say: 'The solid is a cone on top of a hemisphere, each with radius 3.5 centimetres.', cap: 'The solid is a cone on a hemisphere, each of radius 3.5 cm.', mark: [0, 1] },
        { say: 'The whole solid is 9.5 centimetres tall. Find its volume.', cap: 'It is 9.5 cm tall. Find its volume.', mark: [2, 3] },
      ],
      sceneLines: [
        scaleLine('cm', 40, 'centimetre'),
        { say: 'It has a hemisphere at the bottom, and a cone on top.', show: 'explode', legend: { icon: 'toy', s: 'hemisphere + cone' }, hl: 'hemi' },
        { say: 'Each has radius 3.5 centimetres.', show: 'r', legend: { icon: 'dim', s: 'radius {r} = 3.5 cm' } },
        { say: 'The whole solid is 9.5 centimetres tall.', show: 'H', legend: { icon: 'dim', s: 'whole height = 9.5 cm' } },
        { say: 'So the cone is 9.5 minus 3.5. That is 6 centimetres tall.', cap: 'So the cone is 9.5 − 3.5 = 6 cm tall.', show: 'h', legend: { icon: 'dim', s: 'cone {h} = 6 cm' }, hl: 'cone' },
      ],
      given: [
        { m: '{r} = 3.5 cm', say: 'The radius r is 3.5 centimetres.', cap: 'r = 3.5 cm.', hl: 'hemi' },
        { m: 'whole height = 9.5 cm', say: 'The whole height is 9.5 centimetres.', cap: 'Whole height = 9.5 cm.' },
      ],
      find: { m: 'volume V = ?', say: 'We must find the volume V.', cap: 'Find the volume V.', hl: 'all' },
      know: [
        { m: 'cone volume = ((1/3))π{r}²{h}', say: 'Know this first! The volume of a cone is one third of pi r squared h.', cap: 'Know this first! Cone volume = ⅓πr²h.', page: 0, sfx: 'pop', hl: 'cone' },
        { m: 'hemisphere volume = ((2/3))π{r}³', say: 'The volume of a hemisphere is two thirds pi r cubed.', cap: 'Hemisphere volume = ⅔πr³.', page: 0, hl: 'hemi' },
        { m: 'V = ((1/3))π{r}²{h} + ((2/3))π{r}³', say: 'The volume is the cone, plus the hemisphere. That is our magic rule!', cap: 'V = cone + hemisphere. Our magic rule!', rule: true, page: 1, sfx: 'ding', hl: 'all' },
      ],
      steps: [
        { m: '{h} = 9.5 − 3.5 = 6 cm', say: 'The cone is 9.5 minus 3.5, which is 6 centimetres tall.', cap: 'h = 9.5 − 3.5 = 6 cm.', hl: 'cone' },
        { m: 'V = ((1/3))π{r}²({h} + 2{r})', say: 'Take out one third pi r squared. V is one third pi r squared, times h plus 2 r.', cap: 'V = ⅓πr²(h + 2r).', hl: 'all' },
        { m: 'V = ((1/3)) × ((22/7)) × 3.5² × 13 = ((1001/6))', say: 'That is one third, times 22 over 7, times 12.25, times 13. That is 1001 over 6.', cap: '= ⅓ × 22/7 × 12.25 × 13 = 1001/6.' },
        { m: 'V ≈ 166.83 cm³', say: 'That is about 166.83 cubic centimetres!', cap: 'V ≈ 166.83 cm³!', solve: true },
      ],
      answer: { card: ['volume ≈ 166.83 cm³'], say: 'So, the volume of the solid is about 166.83 cubic centimetres!', cap: 'So, the volume ≈ 166.83 cm³!' },
      check: [
        { m: 'cone = 77 cm³ · hemisphere ≈ 89.83 cm³', say: 'Check! The cone is 77 cubic centimetres, and the hemisphere is about 89.83.', cap: 'Check! Cone = 77 cm³, hemisphere ≈ 89.83 cm³.' },
        { m: '77 + 89.83 = 166.83 cm³ ✓', say: '77 plus 89.83 is 166.83. It matches!', cap: '77 + 89.83 = 166.83. It matches!' },
      ],
    },

    // ------------------------------------------------------------------------ Q12
    {
      id: 'q12', num: 12, slug: 'q12-shed-cuboid-with-half-cylinder-roof', title: 'The shed',
      question: 'A ⟦shed⟧ is in the shape of a ⟦cuboid surmounted by a half cylinder⟧. If the ⟦base of the shed is of dimension 7 m × 15 m⟧ and the ⟦height of the cuboidal portion is 8 m⟧, find the ⟦volume of air⟧ that the shed can hold. Also, find the ⟦internal surface area excluding the floor⟧.',
      scene: {
        unit: 'm', scale: 24, yaw: 40, elev: 22,
        parts: [
          { id: 'box', type: 'box', w: 7, h: 8, d: 15, color: 'coral' },
          { id: 'roof', type: 'roof', r: 3.5, len: 15, at: [0, 8, 0], color: 'teal' },
        ],
        explode: { roof: [0, 3, 0] },
        dims: [
          { id: 'w', type: 'edge', from: [-3.5, 0, 7.5], to: [3.5, 0, 7.5], off: [-18, 34], text: '7 m' },
          { id: 'w', type: 'edge', from: [3.5, 0, 7.5], to: [3.5, 0, -7.5], off: [24, 30], text: '15 m' },
          { id: 'hw', type: 'vert', from: [-3.5, 0, 7.5], to: [-3.5, 8, 7.5], off: [-34, 0], label: [-16, 0], align: 'right', color: 'h', text: '8 m' },
          { id: 'r', type: 'radius', c: [0, 8, 7.5], r: 3.5, color: 'r', label: [-10, -34], text: 'r = 3.5 m' },
        ],
      },
      hook: {
        head: ['A shed with a round roof', 'Base 7 m × 15 m, walls 8 m high'], ask: 'Air & inside area = ?', art: { kind: 'shed' },
        lines: [
          { say: 'Wait! How much air fits inside this shed with a round roof?' },
          { say: 'And how much wall and roof is there inside?' },
          pause,
        ],
      },
      qLines: [
        { say: 'The shed is a cuboid, with half a cylinder on top.', mark: [0, 1] },
        { say: 'Its base is 7 metres by 15 metres, and the walls are 8 metres high. Find the volume of air, and the inside surface area without the floor.', cap: 'Base 7 m × 15 m, walls 8 m high. Find the air inside, and the inside area without the floor.', mark: [2, 3, 4, 5] },
      ],
      sceneLines: [
        scaleLine('m', 24, 'metre'),
        { say: 'The shed is a cuboid, with half a cylinder as the roof.', show: 'explode', legend: { icon: 'shed', s: 'cuboid + half cylinder' }, hl: 'box' },
        { say: 'The base is 7 metres by 15 metres.', show: 'w', legend: { icon: 'dim', s: 'base = 7 m × 15 m' } },
        { say: 'The walls are 8 metres high.', show: 'hw', legend: { icon: 'dim', s: 'wall height = 8 m' }, hl: 'box' },
        { say: 'The roof is half a cylinder, 7 metres across. So its radius is 3.5 metres.', cap: 'The roof is 7 m across, so its radius r = 3.5 m.', show: 'r', legend: { icon: 'dim', s: 'roof {r} = 3.5 m, 15 m long' }, hl: 'roof' },
      ],
      given: [
        { m: 'base = 7 m × 15 m', say: 'The base is 7 metres by 15 metres.', cap: 'Base = 7 m × 15 m.', hl: 'box' },
        { m: 'wall height = 8 m', say: 'The walls are 8 metres high.', cap: 'Wall height = 8 m.', hl: 'box' },
        { m: 'roof: {r} = 3.5 m, 15 m long', say: 'The roof has radius 3.5 metres, and it is 15 metres long.', cap: 'Roof: r = 3.5 m, 15 m long.', hl: 'roof' },
      ],
      find: { m: 'air V = ?   inside area = ?', say: 'We must find the volume of air, and the inside area without the floor.', cap: 'Find the air volume V and the inside area (no floor).', hl: 'all' },
      know: [
        { m: 'cuboid volume = length × width × height', say: 'Know this first! The volume of a cuboid is length times width times height.', cap: 'Know this first! Cuboid volume = length × width × height.', page: 0, sfx: 'pop', hl: 'box' },
        { m: 'half cylinder volume = ((1/2))π{r}² × length', say: 'Half a cylinder holds one half of pi r squared, times its length.', cap: 'Half cylinder volume = ½πr² × length.', page: 0, hl: 'roof' },
        { m: 'walls = 2(length + width) × height', say: 'The four walls have area 2 times length plus width, times height.', cap: 'Four walls = 2(length + width) × height.', page: 1, hl: 'box' },
        { m: 'curved roof = π{r} × length', say: 'The curved roof is half of 2 pi r, times the length. That is pi r times the length.', cap: 'Curved roof = ½ × 2πr × length = πr × length.', page: 1, hl: 'roof' },
        { m: 'two half-circle ends = π{r}²', say: 'And the two half circle ends make one whole circle: pi r squared.', cap: 'Two half-circle ends = one circle = πr².', page: 1, hl: 'roof.ends' },
      ],
      steps: [
        { m: 'V = 15 × 7 × 8 + ((1/2)) × ((22/7)) × 3.5² × 15', say: 'The air is the cuboid, 15 times 7 times 8, plus half of 22 over 7, times 3.5 squared, times 15.', cap: 'V = 15 × 7 × 8 + ½ × 22/7 × 3.5² × 15.', hl: 'all' },
        { m: 'V = 840 + 288.75 = 1128.75 m³', say: 'That is 840 plus 288.75, which is 1128.75 cubic metres!', cap: 'V = 840 + 288.75 = 1128.75 m³!', solve: true },
        { m: 'walls = 2(15 + 7) × 8 = 352 m²', say: 'The walls are 2 times 22, times 8. That is 352 square metres.', cap: 'Walls = 2 × 22 × 8 = 352 m².', page: 1, hl: 'box' },
        { m: 'roof = ((22/7)) × 3.5 × 15 = 165 m²', say: 'The curved roof is 22 over 7, times 3.5, times 15. That is 165 square metres.', cap: 'Roof = 22/7 × 3.5 × 15 = 165 m².', page: 1, hl: 'roof' },
        { m: 'ends = ((22/7)) × 3.5² = 38.5 m²', say: 'The two ends are 22 over 7, times 3.5 squared. That is 38.5 square metres.', cap: 'Ends = 22/7 × 3.5² = 38.5 m².', page: 1, hl: 'roof.ends' },
        { m: 'inside area = 352 + 165 + 38.5 = 555.5 m²', say: 'Add them up: 352 plus 165 plus 38.5 is 555.5 square metres!', cap: 'Inside area = 352 + 165 + 38.5 = 555.5 m²!', page: 1, solve: true },
      ],
      answer: { card: ['air V = 1128.75 m³', 'inside area = 555.5 m²'], say: 'So, the shed holds 1128.75 cubic metres of air, and its inside area is 555.5 square metres!', cap: 'Air = 1128.75 m³, inside area = 555.5 m²!' },
      check: [
        { m: 'cuboid 840 m³ + roof 288.75 m³ = 1128.75 m³ ✓', say: 'Check! The cuboid part holds 840 cubic metres, and the roof part 288.75. Together, 1128.75. It matches!', cap: 'Check! 840 + 288.75 = 1128.75 m³. It matches!' },
        { m: 'floor 15 × 7 = 105 m² is not counted ✓', say: 'And we did not count the floor, which is 105 square metres. Good!', cap: 'And the floor, 105 m², is not counted. Good!' },
      ],
    },
  ];

  // ----------------------------------------------------------------------------
  // Beats (the storyboard). Timings are filled in by video-kit/audio.py from the voice.
  // ----------------------------------------------------------------------------
  function buildBeats(p) {
    const beats = [];
    const add = (type, title, lines) => beats.push({ type, title, lines });
    add('hook', 'Hook: the object itself + the big question', p.hook.lines.map((l, i) => Object.assign({ sfx: i === 0 ? 'hit' : undefined }, l)));
    add('question', 'Intro + the question', [
      { say: 'Hi! This is Maths by Zosiama. Let us solve it together!', cap: 'Hi! This is Maths by Zosiama. Let’s solve it together!', brand: true, sfx: 'whoosh' },
      { say: 'Here is the question.', mark: [] },
      ...p.qLines,
    ]);
    add('scene', 'The solid, drawn to scale, with its parts and sizes', p.sceneLines);
    add('given', 'What we know + what we must find', [
      { say: 'What do we know?', sfx: 'pop', hl: 'none' },
      ...p.given.map((g) => Object.assign({ sfx: 'pop' }, g)),
      Object.assign({ find: true, sfx: 'pop' }, p.find),
    ]);
    add('know', 'Know first: the formulas and the magic rule', p.know);
    add('solve', 'Solution board, one step per line', p.steps.map((s) => Object.assign({ sfx: 'write' }, s)));
    add('answer', 'Answer card + quick check', [
      Object.assign({ answer: true, sfx: 'ding', hl: 'all' }, p.answer),
      ...p.check.map((c, i) => Object.assign({ check: i, sfx: i === p.check.length - 1 ? 'sparkle' : 'pop' }, c)),
    ]);
    add('outro', 'End card: Follow Maths by Zosiama', [
      { say: 'Great job! You solved it!', sfx: 'tada' },
      { say: 'For more easy maths, follow Maths by Zosiama!', cap: 'For more easy maths… Follow Maths by Zosiama!', follow: true },
    ]);
    beats.forEach((b) => b.lines.forEach((l, li) => { l.id = `${b.type}.${li}`; if (!l.cap) l.cap = l.say; }));
    return beats;
  }

  const api = { PROBLEMS, buildBeats };
  root.SOLIDS = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
