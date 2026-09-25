/* Maths by Zosiama · Sets explainer videos
 * Problem data and narration scripts for the 10 "n(A∪B)" problems.
 *
 *  say  = what the offline voice reads (plain words, no symbols)
 *  cap  = caption shown on screen (defaults to say)
 *  m    = maths line written on the board. Markup:
 *           {A} {B}  first / second set symbol (coral / teal)
 *           [x]      the unknown (plum)
 *           ((a/b))  a stacked fraction
 *  hl   = Venn region to highlight while the line plays:
 *           A B AB Aonly Bonly union neither U double none
 *  sfx  = sound effect at the start of the line
 */
(function (root) {
  'use strict';

  // ----------------------------------------------------------------------------
  // The 10 problems
  // ----------------------------------------------------------------------------
  const PROBLEMS = [
    {
      id: 'q01', num: 1, slug: 'q01-find-n-A-intersection-B',
      title: 'Find n(A∩B)',
      question: 'If A and B are two sets such that ⟦n(A) = 17⟧, ⟦n(B) = 23⟧ and ⟦n(A∪B) = 38⟧, find ⟦n(A∩B)⟧.',
      A: { s: 'A', label: 'Set A', say: 'set A' },
      B: { s: 'B', label: 'Set B', say: 'set B' },
      U: { label: 'U · all elements', total: null },
      unit: ['element', 'elements'],
      counts: { a: 15, ab: 2, b: 21, n: 0 },
      dot: 1,
      art: { kind: 'tokens', shape: 'marble', a: 17, b: 23 },
      hook: {
        head: ['17 + 23 = 40', 'but n({A}∪{B}) = 38 ?!'],
        ask: 'Where did 2 go?',
        lines: [
          { say: 'Wait! 17 plus 23 is 40.', cap: 'Wait! 17 + 23 = 40…' },
          { say: 'But A union B has only 38 elements. Where did 2 go?', cap: 'But n(A∪B) is only 38. Where did 2 go?' },
          { say: 'Pause and try it first. Then stay till the end!', cap: 'Pause & try it first! Then stay till the end!' },
        ],
      },
      qLines: [
        { say: 'Set A has 17 elements. Set B has 23 elements.', mark: [0, 1] },
        { say: 'A union B has 38 elements. Find A intersection B.', cap: 'n(A∪B) = 38. Find n(A∩B).', mark: [2, 3] },
      ],
      given: [
        { m: 'n({A}) = 17 elements', say: 'n of A is 17 elements.', hl: 'A' },
        { m: 'n({B}) = 23 elements', say: 'n of B is 23 elements.', hl: 'B' },
        { m: 'n({A}∪{B}) = 38 elements', say: 'n of A union B is 38 elements.', hl: 'union' },
      ],
      find: { m: 'n({A}∩{B}) = [x] = ?', say: 'We must find the middle part. Let us call it x.', cap: 'Find the middle part: n(A∩B) = x', hl: 'AB' },
      unknown: 'AB',
      steps: [
        { m: 'n({A}∪{B}) = n({A}) + n({B}) − n({A}∩{B})', say: 'Use the magic rule.', hl: 'union' },
        { m: '38 = 17 + 23 − [x]', say: 'Put in the numbers. 38 equals 17 plus 23 minus x.' },
        { m: '38 = 40 − [x]', say: '17 plus 23 is 40. So 38 equals 40 minus x.' },
        { m: '[x] = 40 − 38 = 2', say: 'So x is 40 minus 38. That is 2!', hl: 'AB', solve: true },
      ],
      answer: {
        card: ['n({A}∩{B}) = 2 elements'],
        say: 'So, n of A intersection B is 2 elements!', cap: 'So, n(A∩B) = 2 elements!',
      },
      check: [
        { m: 'only {A}: 17 − 2 = 15 · only {B}: 23 − 2 = 21', say: 'Check! A only is 17 minus 2, that is 15. B only is 23 minus 2, that is 21.', cap: 'Check! Only A: 17 − 2 = 15. Only B: 23 − 2 = 21.' },
        { m: '15 + 2 + 21 = 38 elements ✓', say: '15 plus 2 plus 21 is 38. It matches!', cap: '15 + 2 + 21 = 38. It matches!' },
      ],
    },

    {
      id: 'q02', num: 2, slug: 'q02-find-n-X-intersection-Y',
      title: 'Find n(X∩Y)',
      question: 'If X and Y are two sets such that ⟦X∪Y has 28 elements⟧, ⟦X has 13 elements⟧ and ⟦Y has 20 elements⟧, how many elements does ⟦X∩Y⟧ have?',
      A: { s: 'X', label: 'Set X', say: 'set X' },
      B: { s: 'Y', label: 'Set Y', say: 'set Y' },
      U: { label: 'U · all elements', total: null },
      unit: ['element', 'elements'],
      counts: { a: 8, ab: 5, b: 15, n: 0 },
      dot: 1,
      art: { kind: 'tokens', shape: 'tile', a: 13, b: 20 },
      hook: {
        head: ['13 + 20 = 33', 'but n({A}∪{B}) = 28 ?!'],
        ask: 'How many are in BOTH?',
        lines: [
          { say: 'Wait! 13 plus 20 is 33.', cap: 'Wait! 13 + 20 = 33…' },
          { say: 'But X union Y has only 28 elements! How many are in both?', cap: 'But n(X∪Y) is only 28! How many are in both?' },
          { say: 'Pause and try it first. Then stay till the end!', cap: 'Pause & try it first! Then stay till the end!' },
        ],
      },
      qLines: [
        { say: 'X union Y has 28 elements. X has 13, and Y has 20.', cap: 'n(X∪Y) = 28. X has 13, Y has 20.', mark: [0, 1, 2] },
        { say: 'How many elements are in X intersection Y?', cap: 'How many are in X∩Y?', mark: [3] },
      ],
      given: [
        { m: 'n({A}) = 13 elements', say: 'n of X is 13 elements.', hl: 'A' },
        { m: 'n({B}) = 20 elements', say: 'n of Y is 20 elements.', hl: 'B' },
        { m: 'n({A}∪{B}) = 28 elements', say: 'n of X union Y is 28 elements.', hl: 'union' },
      ],
      find: { m: 'n({A}∩{B}) = [x] = ?', say: 'We must find the middle part. Let us call it x.', cap: 'Find the middle part: n(X∩Y) = x', hl: 'AB' },
      unknown: 'AB',
      steps: [
        { m: 'n({A}∪{B}) = n({A}) + n({B}) − n({A}∩{B})', say: 'Use the magic rule.', hl: 'union' },
        { m: '28 = 13 + 20 − [x]', say: 'Put in the numbers. 28 equals 13 plus 20 minus x.' },
        { m: '28 = 33 − [x]', say: '13 plus 20 is 33. So 28 equals 33 minus x.' },
        { m: '[x] = 33 − 28 = 5', say: 'So x is 33 minus 28. That is 5!', hl: 'AB', solve: true },
      ],
      answer: {
        card: ['n({A}∩{B}) = 5 elements'],
        say: 'So, X intersection Y has 5 elements!', cap: 'So, n(X∩Y) = 5 elements!',
      },
      check: [
        { m: 'only {A}: 13 − 5 = 8 · only {B}: 20 − 5 = 15', say: 'Check! X only is 13 minus 5, that is 8. Y only is 20 minus 5, that is 15.', cap: 'Check! Only X: 13 − 5 = 8. Only Y: 20 − 5 = 15.' },
        { m: '8 + 5 + 15 = 28 elements ✓', say: '8 plus 5 plus 15 is 28. It matches!', cap: '8 + 5 + 15 = 28. It matches!' },
      ],
    },

    {
      id: 'q03', num: 3, slug: 'q03-football-and-tennis',
      title: 'Football & Tennis',
      question: 'In a class of ⟦40 students⟧, ⟦27 like to play football⟧ and ⟦22 like to play tennis⟧. Also, ⟦each student likes to play at least one⟧ of the two games. How many students like to play ⟦both⟧ football and tennis?',
      A: { s: 'F', label: 'Football', say: 'football lovers' },
      B: { s: 'T', label: 'Tennis', say: 'tennis lovers' },
      U: { label: 'U · class', total: 40, say: 'The big box is the whole class: 40 students.' },
      unit: ['student', 'students'],
      counts: { a: 18, ab: 9, b: 13, n: 0 },
      dot: 1,
      bothSay: 'The middle is for kids who like both games!',
      art: { kind: 'sports' },
      hook: {
        head: ['27 + 22 = 49 kids?', 'But the class has only 40!'],
        ask: 'How many play BOTH?',
        lines: [
          { say: 'Wait! 27 kids love football. 22 love tennis.', cap: 'Wait! 27 kids love football. 22 love tennis.' },
          { say: 'That is 49 kids. But the class has only 40! How?', cap: 'That’s 49 kids… but the class has only 40! How?' },
          { say: 'Pause and try it first. Then stay till the end!', cap: 'Pause & try it first! Then stay till the end!' },
        ],
      },
      qLines: [
        { say: 'There are 40 students in a class. 27 like football, and 22 like tennis.', cap: 'A class has 40 students. 27 like football, 22 like tennis.', mark: [0, 1, 2] },
        { say: 'Every student likes at least one game. How many like both?', mark: [3, 4] },
      ],
      given: [
        { m: 'n(U) = 40 students', say: 'The class has 40 students.', hl: 'U' },
        { m: 'n({A}) = 27 students', say: 'n of F is 27 students.', hl: 'A' },
        { m: 'n({B}) = 22 students', say: 'n of T is 22 students.', hl: 'B' },
      ],
      find: { m: 'n({A}∩{B}) = [x] = ?', say: 'We must find the kids in the middle. Let us call them x.', cap: 'Find the kids in the middle: n(F∩T) = x', hl: 'AB' },
      unknown: 'AB',
      extras: [
        { m: 'at least one game → n({A}∪{B}) = 40 students', say: 'Every kid plays at least one game. So F union T is the whole class, 40!', cap: 'Every kid plays at least one game, so n(F∪T) = 40!', hl: 'union' },
      ],
      steps: [
        { m: 'n({A}∪{B}) = n({A}) + n({B}) − n({A}∩{B})', say: 'Use the magic rule.', hl: 'union' },
        { m: '40 = 27 + 22 − [x]', say: 'Put in the numbers. 40 equals 27 plus 22 minus x.' },
        { m: '40 = 49 − [x]', say: '27 plus 22 is 49. So 40 equals 49 minus x.' },
        { m: '[x] = 49 − 40 = 9', say: 'So x is 49 minus 40. That is 9!', hl: 'AB', solve: true },
      ],
      answer: {
        card: ['n({A}∩{B}) = 9 students'],
        say: 'So, 9 students like both football and tennis!', cap: 'So, 9 students like both games!',
      },
      check: [
        { m: 'only {A}: 27 − 9 = 18 · only {B}: 22 − 9 = 13', say: 'Check! Football only is 27 minus 9, that is 18. Tennis only is 22 minus 9, that is 13.', cap: 'Check! Only football: 27 − 9 = 18. Only tennis: 22 − 9 = 13.' },
        { m: '18 + 9 + 13 = 40 students ✓', say: '18 plus 9 plus 13 is 40. The whole class!', cap: '18 + 9 + 13 = 40. The whole class!' },
      ],
    },

    {
      id: 'q04', num: 4, slug: 'q04-english-and-hindi',
      title: 'English & Hindi',
      question: 'In a group of ⟦400 people⟧, ⟦250 can speak English⟧ and ⟦175 can speak Hindi⟧. How many people can speak ⟦both⟧ English and Hindi?',
      A: { s: 'E', label: 'English', say: 'English speakers' },
      B: { s: 'H', label: 'Hindi', say: 'Hindi speakers' },
      U: { label: 'U · group', total: 400, say: 'The big box is the whole group: 400 people.' },
      unit: ['person', 'people'],
      counts: { a: 225, ab: 25, b: 150, n: 0 },
      dot: 5,
      bothSay: 'The middle is for people who speak both!',
      scaleSay: 'That is too many to draw! So 1 dot means 5 people.',
      art: { kind: 'speech' },
      hook: {
        head: ['250 + 175 = 425 ?', 'But only 400 people!'],
        ask: 'How many speak BOTH?',
        lines: [
          { say: 'Wait! 250 people speak English. 175 speak Hindi.', cap: 'Wait! 250 speak English. 175 speak Hindi.' },
          { say: 'That is 425. But there are only 400 people! How?', cap: 'That’s 425… but there are only 400 people! How?' },
          { say: 'Pause and try it first. Then stay till the end!', cap: 'Pause & try it first! Then stay till the end!' },
        ],
      },
      qLines: [
        { say: 'In a group of 400 people, 250 speak English and 175 speak Hindi.', mark: [0, 1, 2] },
        { say: 'How many speak both?', mark: [3] },
      ],
      given: [
        { m: 'n(U) = 400 people', say: 'The group has 400 people.', hl: 'U' },
        { m: 'n({A}) = 250 people', say: 'n of E is 250 people.', hl: 'A' },
        { m: 'n({B}) = 175 people', say: 'n of H is 175 people.', hl: 'B' },
      ],
      find: { m: 'n({A}∩{B}) = [x] = ?', say: 'We must find the people in the middle. Let us call them x.', cap: 'Find the middle: n(E∩H) = x', hl: 'AB' },
      unknown: 'AB',
      extras: [
        { m: 'everyone speaks one → n({A}∪{B}) = 400 people', say: 'Here, everyone speaks at least one of the two. So E union H is all 400 people.', cap: 'Everyone speaks at least one, so n(E∪H) = 400.', hl: 'union' },
      ],
      steps: [
        { m: 'n({A}∪{B}) = n({A}) + n({B}) − n({A}∩{B})', say: 'Use the magic rule.', hl: 'union' },
        { m: '400 = 250 + 175 − [x]', say: 'Put in the numbers. 400 equals 250 plus 175 minus x.' },
        { m: '400 = 425 − [x]', say: '250 plus 175 is 425. So 400 equals 425 minus x.' },
        { m: '[x] = 425 − 400 = 25', say: 'So x is 425 minus 400. That is 25!', hl: 'AB', solve: true },
      ],
      answer: {
        card: ['n({A}∩{B}) = 25 people'],
        say: 'So, 25 people speak both English and Hindi!', cap: 'So, 25 people speak both!',
      },
      check: [
        { m: 'only {A}: 250 − 25 = 225 · only {B}: 175 − 25 = 150', say: 'Check! English only is 250 minus 25, that is 225. Hindi only is 175 minus 25, that is 150.', cap: 'Check! Only English: 225. Only Hindi: 150.' },
        { m: '225 + 25 + 150 = 400 people ✓', say: '225 plus 25 plus 150 is 400. That is 80 dots, and 80 times 5 is 400!', cap: '225 + 25 + 150 = 400. And 80 dots × 5 = 400!' },
      ],
    },

    {
      id: 'q05', num: 5, slug: 'q05-apple-and-orange-juice',
      title: 'Apple & Orange Juice',
      question: 'In a survey of ⟦600 students⟧ in a school, ⟦150⟧ were listed as taking ⟦apple juice⟧, ⟦300⟧ as taking ⟦orange juice⟧ and ⟦70⟧ were listed as taking ⟦both⟧ apple as well as orange juice. Find how many students were taking ⟦neither⟧ apple nor orange juice.',
      A: { s: 'A', label: 'Apple juice', say: 'apple juice drinkers' },
      B: { s: 'O', label: 'Orange juice', say: 'orange juice drinkers' },
      U: { label: 'U · school survey', total: 600, say: 'The big box is all 600 students.' },
      unit: ['student', 'students'],
      counts: { a: 80, ab: 70, b: 230, n: 220 },
      dot: 10,
      bothSay: 'The middle is for students who drink both!',
      neitherSay: 'Outside the circles? Students who drink neither.',
      scaleSay: 'That is a lot of students! So 1 dot means 10 students.',
      art: { kind: 'juice' },
      hook: {
        head: ['600 students', 'Apple 150 · Orange 300 · Both 70'],
        ask: 'How many drink NEITHER?',
        lines: [
          { say: '600 students. Some drink apple juice. Some drink orange juice. Some drink both!', cap: '600 students. Apple juice, orange juice… or both!' },
          { say: 'So how many drink neither?', cap: 'So how many drink NEITHER?' },
          { say: 'Pause and try it first. Then stay till the end!', cap: 'Pause & try it first! Then stay till the end!' },
        ],
      },
      qLines: [
        { say: '600 students were asked. 150 take apple juice. 300 take orange juice.', cap: '600 students. 150 take apple juice. 300 take orange juice.', mark: [0, 1, 2, 3, 4] },
        { say: '70 take both. How many take neither?', mark: [5, 6, 7] },
      ],
      given: [
        { m: 'n(U) = 600 students', say: 'There are 600 students.', hl: 'U' },
        { m: 'n({A}) = 150 · n({B}) = 300 students', say: 'n of A is 150. n of O is 300.', cap: 'n(A) = 150 students. n(O) = 300 students.', hl: 'A+B' },
        { m: 'n({A}∩{B}) = 70 students', say: 'n of A intersection O is 70 students.', cap: 'n(A∩O) = 70 students.', hl: 'AB' },
      ],
      find: { m: 'neither = [x] = ?', say: 'We must find the students outside both circles. Let us call them x.', cap: 'Find the students outside both circles: x', hl: 'neither' },
      unknown: 'neither',
      extras: [
        { m: 'neither = n(U) − n({A}∪{B})', say: 'Neither means outside both circles. So neither equals total, minus the union.', cap: 'Neither = total − union.', hl: 'neither' },
      ],
      steps: [
        { m: 'n({A}∪{B}) = n({A}) + n({B}) − n({A}∩{B})', say: 'First, use the magic rule.', hl: 'union' },
        { m: 'n({A}∪{B}) = 150 + 300 − 70', say: 'Put in the numbers. 150 plus 300 minus 70.' },
        { m: 'n({A}∪{B}) = 380 students', say: 'That is 380 students inside the circles.', hl: 'union' },
        { m: '[x] = 600 − 380 = 220', say: 'Now, neither is 600 minus 380. That is 220!', hl: 'neither', solve: true },
      ],
      answer: {
        card: ['neither = 220 students'],
        say: 'So, 220 students take neither apple nor orange juice!', cap: 'So, 220 students take neither juice!',
      },
      check: [
        { m: 'only {A}: 150 − 70 = 80 · only {B}: 300 − 70 = 230', say: 'Check! Apple only is 150 minus 70, that is 80. Orange only is 300 minus 70, that is 230.', cap: 'Check! Only apple: 80. Only orange: 230.' },
        { m: '80 + 70 + 230 + 220 = 600 students ✓', say: '80 plus 70 plus 230 plus 220 is 600. Everyone is counted!', cap: '80 + 70 + 230 + 220 = 600. Everyone is counted!' },
      ],
    },

    {
      id: 'q06', num: 6, slug: 'q06-find-n-S-union-T',
      title: 'Find n(S∪T)',
      question: 'If S and T are two sets such that ⟦S has 21 elements⟧, ⟦T has 32 elements⟧ and ⟦S∩T has 11 elements⟧, how many elements does ⟦S∪T⟧ have?',
      A: { s: 'S', label: 'Set S', say: 'set S' },
      B: { s: 'T', label: 'Set T', say: 'set T' },
      U: { label: 'U · all elements', total: null },
      unit: ['element', 'elements'],
      counts: { a: 10, ab: 11, b: 21, n: 0 },
      dot: 1,
      art: { kind: 'tokens', shape: 'star', a: 21, b: 32 },
      hook: {
        head: ['n({A}) = 21, n({B}) = 32', 'Is n({A}∪{B}) = 53 ?'],
        ask: 'Hint: it is NOT 53!',
        lines: [
          { say: 'S has 21 elements. T has 32. So S union T is 53. Right?', cap: 'S has 21. T has 32. So S∪T = 53. Right?' },
          { say: 'Nope! Can you find the real answer?', cap: 'Nope! Can you find the real answer?' },
          { say: 'Pause and try it first. Then stay till the end!', cap: 'Pause & try it first! Then stay till the end!' },
        ],
      },
      qLines: [
        { say: 'S has 21 elements. T has 32. And 11 elements are in both.', cap: 'S has 21. T has 32. S∩T has 11.', mark: [0, 1, 2] },
        { say: 'How many elements does S union T have?', cap: 'How many elements does S∪T have?', mark: [3] },
      ],
      given: [
        { m: 'n({A}) = 21 elements', say: 'n of S is 21 elements.', hl: 'A' },
        { m: 'n({B}) = 32 elements', say: 'n of T is 32 elements.', hl: 'B' },
        { m: 'n({A}∩{B}) = 11 elements', say: 'n of S intersection T is 11 elements.', hl: 'AB' },
      ],
      find: { m: 'n({A}∪{B}) = [x] = ?', say: 'We must find everything inside the circles. Let us call it x.', cap: 'Find everything inside the circles: n(S∪T) = x', hl: 'union' },
      unknown: 'union',
      steps: [
        { m: 'n({A}∪{B}) = n({A}) + n({B}) − n({A}∩{B})', say: 'Use the magic rule.', hl: 'union' },
        { m: '[x] = 21 + 32 − 11', say: 'Put in the numbers. x equals 21 plus 32 minus 11.' },
        { m: '[x] = 53 − 11', say: '21 plus 32 is 53. The middle got counted twice!', hl: 'double' },
        { m: '[x] = 42', say: 'So take away 11 once. 53 minus 11 is 42!', hl: 'union', solve: true },
      ],
      answer: {
        card: ['n({A}∪{B}) = 42 elements'],
        say: 'So, S union T has 42 elements!', cap: 'So, n(S∪T) = 42 elements!',
      },
      check: [
        { m: 'only {A}: 21 − 11 = 10 · only {B}: 32 − 11 = 21', say: 'Check! S only is 21 minus 11, that is 10. T only is 32 minus 11, that is 21.', cap: 'Check! Only S: 21 − 11 = 10. Only T: 32 − 11 = 21.' },
        { m: '10 + 11 + 21 = 42 elements ✓', say: '10 plus 11 plus 21 is 42. It matches!', cap: '10 + 11 + 21 = 42. It matches!' },
      ],
    },

    {
      id: 'q07', num: 7, slug: 'q07-find-n-B',
      title: 'Find n(B)',
      question: 'If A and B are two sets such that ⟦A has 40 elements⟧, ⟦A∪B has 60 elements⟧ and ⟦A∩B has 10 elements⟧, how many elements does ⟦B⟧ have?',
      A: { s: 'A', label: 'Set A', say: 'set A' },
      B: { s: 'B', label: 'Set B', say: 'set B' },
      U: { label: 'U · all elements', total: null },
      unit: ['element', 'elements'],
      counts: { a: 30, ab: 10, b: 20, n: 0 },
      dot: 1,
      art: { kind: 'tokens', shape: 'hex', a: 40, b: '?' },
      hook: {
        head: ['n({A}) = 40, n({A}∪{B}) = 60', 'n({A}∩{B}) = 10'],
        ask: 'n({B}) = ?  (It is NOT 20!)',
        lines: [
          { say: 'A has 40 elements. A union B has 60. 10 are in both.', cap: 'A has 40. A∪B has 60. 10 are in both.' },
          { say: 'So how big is B? Hint: it is not 20!', cap: 'So how big is B? Hint: it’s NOT 20!' },
          { say: 'Pause and try it first. Then stay till the end!', cap: 'Pause & try it first! Then stay till the end!' },
        ],
      },
      qLines: [
        { say: 'Set A has 40 elements. A union B has 60. A intersection B has 10.', cap: 'A has 40. A∪B has 60. A∩B has 10.', mark: [0, 1, 2] },
        { say: 'How many elements does B have?', mark: [3] },
      ],
      given: [
        { m: 'n({A}) = 40 elements', say: 'n of A is 40 elements.', hl: 'A' },
        { m: 'n({A}∪{B}) = 60 elements', say: 'n of A union B is 60 elements.', hl: 'union' },
        { m: 'n({A}∩{B}) = 10 elements', say: 'n of A intersection B is 10 elements.', hl: 'AB' },
      ],
      find: { m: 'n({B}) = [x] = ?', say: 'We must find the whole teal circle, B. Let us call it x.', cap: 'Find the whole circle B: n(B) = x', hl: 'B' },
      unknown: 'B',
      steps: [
        { m: 'n({A}∪{B}) = n({A}) + n({B}) − n({A}∩{B})', say: 'Use the magic rule.', hl: 'union' },
        { m: '60 = 40 + [x] − 10', say: 'Put in the numbers. 60 equals 40 plus x minus 10.' },
        { m: '60 = 30 + [x]', say: '40 minus 10 is 30. So 60 equals 30 plus x.' },
        { m: '[x] = 60 − 30 = 30', say: 'So x is 60 minus 30. That is 30!', hl: 'B', solve: true },
      ],
      answer: {
        card: ['n({B}) = 30 elements'],
        say: 'So, B has 30 elements!', cap: 'So, n(B) = 30 elements!',
      },
      check: [
        { m: 'only {A}: 40 − 10 = 30 · only {B}: 30 − 10 = 20', say: 'Check! A only is 40 minus 10, that is 30. B only is 30 minus 10, that is 20.', cap: 'Check! Only A: 40 − 10 = 30. Only B: 30 − 10 = 20.' },
        { m: '30 + 10 + 20 = 60 elements ✓', say: '30 plus 10 plus 20 is 60. It matches!', cap: '30 + 10 + 20 = 60. It matches!' },
      ],
    },

    {
      id: 'q08', num: 8, slug: 'q08-coffee-and-tea',
      title: 'Coffee & Tea',
      question: 'In a group of ⟦80 people⟧, ⟦37 like coffee⟧, ⟦52 like tea⟧ and ⟦19 like both⟧. How many like (i) ⟦either coffee or tea⟧? (ii) ⟦neither coffee nor tea⟧?',
      A: { s: 'C', label: 'Coffee', say: 'coffee lovers' },
      B: { s: 'T', label: 'Tea', say: 'tea lovers' },
      U: { label: 'U · group', total: 80, say: 'The big box is the whole group: 80 people.' },
      unit: ['person', 'people'],
      counts: { a: 18, ab: 19, b: 33, n: 10 },
      dot: 1,
      bothSay: 'The middle is for people who like both!',
      neitherSay: 'Outside the circles? People who like neither.',
      art: { kind: 'cups' },
      hook: {
        head: ['Coffee 37 · Tea 52 · Both 19', '80 people'],
        ask: 'Either? Neither?',
        lines: [
          { say: '80 people. 37 like coffee. 52 like tea. 19 like both.', cap: '80 people. 37 like coffee. 52 like tea. 19 like both.' },
          { say: 'How many like coffee or tea? And how many like neither?', cap: 'How many like coffee or tea? How many like neither?' },
          { say: 'Pause and try it first. Then stay till the end!', cap: 'Pause & try it first! Then stay till the end!' },
        ],
      },
      qLines: [
        { say: 'In a group of 80 people, 37 like coffee, 52 like tea, and 19 like both.', mark: [0, 1, 2, 3] },
        { say: 'How many like either coffee or tea? And how many like neither?', mark: [4, 5] },
      ],
      given: [
        { m: 'n(U) = 80 people', say: 'The group has 80 people.', hl: 'U' },
        { m: 'n({A}) = 37 · n({B}) = 52 people', say: 'n of C is 37. n of T is 52.', cap: 'n(C) = 37 people. n(T) = 52 people.', hl: 'A+B' },
        { m: 'n({A}∩{B}) = 19 people', say: 'n of C intersection T is 19 people.', cap: 'n(C∩T) = 19 people.', hl: 'AB' },
      ],
      find: { m: '(i) n({A}∪{B}) = ?   (ii) neither = ?', say: 'We must find two things. The union, and the people outside.', cap: 'Find: (i) n(C∪T)  (ii) neither', hl: 'union' },
      unknown: 'neither',
      extras: [
        { m: 'either … or = union: n({A}∪{B})', say: 'Either coffee or tea means the union: everyone inside the circles.', cap: '“Either coffee or tea” = union = inside the circles.', hl: 'union' },
        { m: 'neither = n(U) − n({A}∪{B})', say: 'Neither means outside both circles. So neither equals total, minus the union.', cap: 'Neither = total − union.', hl: 'neither' },
      ],
      steps: [
        { m: '(i) n({A}∪{B}) = n({A}) + n({B}) − n({A}∩{B})', say: 'Part one. Use the magic rule.', hl: 'union' },
        { m: 'n({A}∪{B}) = 37 + 52 − 19', say: 'Put in the numbers. 37 plus 52 minus 19.' },
        { m: 'n({A}∪{B}) = 70 people', say: 'That is 70 people!', hl: 'union' },
        { m: '(ii) neither = 80 − 70 = 10', say: 'Part two. Neither is 80 minus 70. That is 10!', hl: 'neither', solve: true },
      ],
      answer: {
        card: ['(i) coffee or tea = 70 people', '(ii) neither = 10 people'],
        say: 'So, 70 people like coffee or tea. And 10 people like neither!', cap: 'So: 70 like coffee or tea. 10 like neither!',
      },
      check: [
        { m: 'only {A}: 37 − 19 = 18 · only {B}: 52 − 19 = 33', say: 'Check! Coffee only is 37 minus 19, that is 18. Tea only is 52 minus 19, that is 33.', cap: 'Check! Only coffee: 18. Only tea: 33.' },
        { m: '18 + 19 + 33 + 10 = 80 people ✓', say: '18 plus 19 plus 33 plus 10 is 80. Everyone is counted!', cap: '18 + 19 + 33 + 10 = 80. Everyone is counted!' },
      ],
    },

    {
      id: 'q09', num: 9, slug: 'q09-exam-english-and-ict',
      title: 'Exam: English & ICT',
      question: 'In an examination, ⟦63% of the candidates failed in English⟧ and ⟦42% failed in ICT⟧. If ⟦25% failed in both⟧ English and ICT, find the percentage of those who ⟦passed in both⟧ the subjects.',
      A: { s: 'E', label: 'Failed English', say: 'students who failed English' },
      B: { s: 'I', label: 'Failed ICT', say: 'students who failed I C T', legend: 'students who failed ICT' },
      U: { label: 'U · candidates', total: 100, say: 'The big box is all the candidates: 100 percent.' },
      unit: ['%', '%'],
      pct: true,
      counts: { a: 38, ab: 25, b: 17, n: 20 },
      dot: 1,
      bothSay: 'The middle is for students who failed both.',
      neitherSay: 'Outside the circles? They failed neither. They passed both!',
      scaleSay: 'Think of 100 candidates. Then 1 dot is 1 percent.',
      art: { kind: 'exam' },
      hook: {
        head: ['63% + 42% = 105% ?!', 'More than everyone?'],
        ask: 'Who passed BOTH?',
        lines: [
          { say: 'Wait! 63 percent failed English. 42 percent failed I C T.', cap: 'Wait! 63% failed English. 42% failed ICT.' },
          { say: 'That is 105 percent! More than everyone? How many passed both?', cap: 'That’s 105%! More than everyone?! Who passed both?' },
          { say: 'Pause and try it first. Then stay till the end!', cap: 'Pause & try it first! Then stay till the end!' },
        ],
      },
      qLines: [
        { say: '63 percent failed English. 42 percent failed I C T. 25 percent failed both.', cap: '63% failed English. 42% failed ICT. 25% failed both.', mark: [0, 1, 2] },
        { say: 'What percent passed both subjects?', mark: [3] },
      ],
      given: [
        { m: 'n({A}) = 63% = ((63/100))', say: 'n of E is 63 percent. That means 63 out of 100.', cap: 'n(E) = 63% — that means 63 out of 100.', hl: 'A' },
        { m: 'n({B}) = 42% = ((42/100))', say: 'n of I is 42 percent. That is 42 out of 100.', cap: 'n(I) = 42% — 42 out of 100.', hl: 'B' },
        { m: 'n({A}∩{B}) = 25% = ((25/100))', say: 'n of E intersection I is 25 percent.', cap: 'n(E∩I) = 25%.', hl: 'AB' },
      ],
      find: { m: 'passed both = [x]% = ?', say: 'We must find who passed both. Let us call it x percent.', cap: 'Find who passed both: x%', hl: 'neither' },
      unknown: 'neither',
      extras: [
        { m: 'passed both = outside = 100% − n({A}∪{B})', say: 'Passed both means failed neither. They are outside both circles. So it is 100 percent minus the union.', cap: 'Passed both = outside the circles = 100% − union.', hl: 'neither' },
      ],
      steps: [
        { m: 'n({A}∪{B}) = n({A}) + n({B}) − n({A}∩{B})', say: 'First, use the magic rule.', hl: 'union' },
        { m: 'n({A}∪{B}) = 63% + 42% − 25%', say: 'Put in the numbers. 63 plus 42 minus 25.' },
        { m: 'n({A}∪{B}) = 80%', say: 'That is 80 percent. They failed at least one subject.', hl: 'union' },
        { m: '[x] = 100% − 80% = 20%', say: 'So passed both is 100 minus 80. That is 20 percent!', hl: 'neither', solve: true },
      ],
      answer: {
        card: ['passed both = 20%'],
        say: 'So, 20 percent passed in both subjects!', cap: 'So, 20% passed in both subjects!',
      },
      check: [
        { m: 'only {A}: 63 − 25 = 38 · only {B}: 42 − 25 = 17', say: 'Check! English only is 63 minus 25, that is 38. I C T only is 42 minus 25, that is 17.', cap: 'Check! Only English: 38%. Only ICT: 17%.' },
        { m: '38 + 25 + 17 + 20 = 100% ✓', say: '38 plus 25 plus 17 plus 20 is 100 percent. Perfect!', cap: '38 + 25 + 17 + 20 = 100%. Perfect!' },
      ],
    },

    {
      id: 'q10', num: 10, slug: 'q10-badminton-and-chess',
      title: 'Badminton & Chess',
      question: 'In a group of ⟦65 people⟧, ⟦40 like badminton⟧, ⟦10 like both badminton and chess⟧. How many like ⟦chess only⟧ and not badminton? How many like ⟦chess⟧?',
      A: { s: 'B', label: 'Badminton', say: 'badminton lovers' },
      B: { s: 'C', label: 'Chess', say: 'chess lovers' },
      U: { label: 'U · group', total: 65, say: 'The big box is the whole group: 65 people.' },
      unit: ['person', 'people'],
      counts: { a: 30, ab: 10, b: 25, n: 0 },
      dot: 1,
      bothSay: 'The middle is for people who like both!',
      art: { kind: 'games' },
      hook: {
        head: ['65 people · 40 love badminton', '10 love badminton AND chess'],
        ask: 'How many love CHESS?',
        lines: [
          { say: '65 people. 40 love badminton. 10 love badminton and chess.', cap: '65 people. 40 love badminton. 10 love both.' },
          { say: 'So how many love chess? And chess only?', cap: 'So how many love chess? And chess only?' },
          { say: 'Pause and try it first. Then stay till the end!', cap: 'Pause & try it first! Then stay till the end!' },
        ],
      },
      qLines: [
        { say: 'In a group of 65 people, 40 like badminton, and 10 like both badminton and chess.', cap: '65 people. 40 like badminton. 10 like both.', mark: [0, 1, 2] },
        { say: 'How many like chess only? And how many like chess?', mark: [3, 4] },
      ],
      given: [
        { m: 'n(U) = 65 people', say: 'The group has 65 people.', hl: 'U' },
        { m: 'n({A}) = 40 people', say: 'n of B is 40 people.', hl: 'A' },
        { m: 'n({A}∩{B}) = 10 people', say: 'n of B intersection C is 10 people.', cap: 'n(B∩C) = 10 people.', hl: 'AB' },
      ],
      find: { m: 'n({B}) = [x] = ?   only {B} = ?', say: 'We must find the whole chess circle, x. And chess only.', cap: 'Find n(C) = x, and chess only.', hl: 'B' },
      unknown: 'B',
      extras: [
        { m: 'everyone likes one → n({A}∪{B}) = 65 people', say: 'Everyone here likes at least one game. So B union C is all 65 people.', cap: 'Everyone likes at least one, so n(B∪C) = 65.', hl: 'union' },
        { m: 'only {B} = n({B}) − n({A}∩{B})', say: 'And chess only means the chess circle, without the middle.', cap: 'Chess only = n(C) − n(B∩C).', hl: 'Bonly' },
      ],
      steps: [
        { m: 'n({A}∪{B}) = n({A}) + n({B}) − n({A}∩{B})', say: 'Use the magic rule.', hl: 'union' },
        { m: '65 = 40 + [x] − 10', say: 'Put in the numbers. 65 equals 40 plus x minus 10.' },
        { m: '65 = 30 + [x]  →  [x] = 35', say: '40 minus 10 is 30. So 65 equals 30 plus x. x is 35!', hl: 'B', solve: true },
        { m: 'only {B} = 35 − 10 = 25', say: 'Chess only is 35 minus 10. That is 25!', hl: 'Bonly' },
      ],
      answer: {
        card: ['chess only = 25 people', 'n({B}) = 35 people'],
        say: 'So, 25 people like chess only. And 35 people like chess!', cap: 'So: 25 like chess only. 35 like chess!',
      },
      check: [
        { m: 'only {A}: 40 − 10 = 30', say: 'Check! Badminton only is 40 minus 10, that is 30.', cap: 'Check! Only badminton: 40 − 10 = 30.' },
        { m: '30 + 10 + 25 = 65 people ✓', say: '30 plus 10 plus 25 is 65. The whole group!', cap: '30 + 10 + 25 = 65. The whole group!' },
      ],
    },
  ];

  // ----------------------------------------------------------------------------
  // Shared script pieces
  // ----------------------------------------------------------------------------
  const unitOne = (p) => (p.pct ? 'percent' : p.unit[0]);
  const plain = (p, m) => m.replace(/\{A\}/g, p.A.s).replace(/\{B\}/g, p.B.s).replace(/\[x\]/g, 'x').replace(/\(\(([^/]+)\/([^)]+)\)\)/g, '$1/$2');

  function sceneLines(p) {
    const A = p.A, B = p.B;
    const named = !/^Set /.test(A.label);
    const L = [];
    L.push({ id: 'venn', say: 'Let us draw a picture. It is called a Venn diagram.', sfx: 'whoosh', legend: 'venn', hl: 'none' });
    L.push(p.U.total
      ? { say: p.U.say, legend: 'U', hl: 'U' }
      : { say: 'The big box U holds all the elements.', cap: 'The big box U holds all the elements.', legend: 'U', hl: 'U' });
    L.push(named
      ? { say: `The coral circle is ${A.say}. The teal circle is ${B.say}.`, legend: 'AB', hl: 'A+B' }
      : { say: `The coral circle is ${A.say}. The teal circle is ${B.say}.`, cap: `The coral circle is set ${A.s}. The teal circle is set ${B.s}.`, legend: 'AB', hl: 'A+B' });
    L.push({ say: p.bothSay || 'The middle part, where they overlap, is in both sets.', legend: 'mid', hl: 'AB' });
    if (p.neitherSay) L.push({ say: p.neitherSay, legend: 'out', hl: 'neither' });
    const scale = p.scaleSay || `One dot will mean one ${unitOne(p)}.`;
    L.push({ say: scale, cap: scale.replace('1 percent', '1%'), legend: 'scale', hl: 'none', sfx: 'pop' });
    return L;
  }

  function knowLines(p) {
    const a = p.A.s, b = p.B.s;
    const L = [
      { say: 'Know this first! The letter n means: how many.', cap: 'Know this first! n( ) means “how many”.', m: 'n( ) = how many', page: 0, sfx: 'pop', hl: 'none' },
      { say: `The cup sign is union. It means in ${a}, or in ${b}, or in both.`, cap: `∪ is union: in ${a}, or in ${b}, or in both.`, m: '{A}∪{B} = in {A} or {B} or both', page: 0, hl: 'union' },
      { say: `The upside-down cup is intersection. It means in both ${a} and ${b}.`, cap: `∩ is intersection: in both ${a} and ${b}.`, m: '{A}∩{B} = in both {A} and {B}', page: 0, hl: 'AB' },
      { say: `Careful! If we add ${a} and ${b}, the middle gets counted two times!`, cap: `Careful! n(${a}) + n(${b}) counts the middle TWO times!`, m: 'n({A}) + n({B}) counts the middle 2×', page: 1, hl: 'double', sfx: 'uhoh' },
      { say: 'So we take it away once. That gives our magic rule.', cap: 'So we take it away once. That gives our magic rule:', page: 1, hl: 'union' },
      { say: `n of ${a} union ${b} equals n of ${a}, plus n of ${b}, minus n of ${a} intersection ${b}.`, cap: `n(${a}∪${b}) = n(${a}) + n(${b}) − n(${a}∩${b})`, m: 'n({A}∪{B}) = n({A}) + n({B}) − n({A}∩{B})', rule: true, page: 1, hl: 'union', sfx: 'ding' },
    ];
    (p.extras || []).forEach((e) => L.push(Object.assign({ page: 2 }, e)));
    return L;
  }

  // ----------------------------------------------------------------------------
  // Beats (the storyboard). Timings are filled in by audio.py from the voice.
  // ----------------------------------------------------------------------------
  function buildBeats(p) {
    const beats = [];
    const add = (type, title, lines, extra) => beats.push(Object.assign({ type, title, lines }, extra || {}));

    add('hook', 'Hook: the question’s own subject + big question', p.hook.lines.map((l, i) => Object.assign({ sfx: i === 0 ? 'hit' : undefined }, l)));

    add('question', 'Intro + the question', [
      { say: 'Hi! This is Maths by Zosiama. Let us solve it together!', cap: 'Hi! This is Maths by Zosiama. Let’s solve it together!', brand: true, sfx: 'whoosh' },
      { say: 'Here is the question.', mark: [] },
      ...p.qLines,
    ]);

    add('scene', 'The scene: Venn diagram drawn to scale', sceneLines(p));

    add('given', 'What we know + what we must find', [
      { say: 'What do we know?', sfx: 'pop', hl: 'none' },
      ...p.given.map((g) => Object.assign({ sfx: 'pop', cap: plain(p, g.m) + '.' }, g)),
      Object.assign({ find: true, sfx: 'pop' }, p.find),
    ]);

    add('know', 'Know first: symbols, double counting, the rule', knowLines(p));

    add('solve', 'Solution board, one step per line', p.steps.map((s) => Object.assign({ sfx: 'write' }, s)));

    add('answer', 'Answer card + quick check (dots to scale)', [
      Object.assign({ answer: true, sfx: 'ding' }, p.answer),
      ...p.check.map((c, i) => Object.assign({ check: i, sfx: i === p.check.length - 1 ? 'sparkle' : 'pop' }, c)),
    ]);

    add('outro', 'End card: Follow Maths by Zosiama', [
      { say: 'Great job! You solved it!', sfx: 'tada' },
      { say: 'For more easy maths, follow Maths by Zosiama!', cap: 'For more easy maths… Follow Maths by Zosiama!', follow: true },
    ]);

    // give every line a stable id
    beats.forEach((b, bi) => b.lines.forEach((l, li) => { l.id = l.id ? `${b.type}.${l.id}` : `${b.type}.${li}`; if (!l.cap) l.cap = l.say; }));
    return beats;
  }

  const api = { PROBLEMS, buildBeats };
  root.SETS = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
