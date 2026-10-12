/* Woven Blocks — site behaviour. The live move (index), the tray you can turn, the streak row,
   and the footer wordmark whose tiles turn when tapped (every page). */
(() => {
  const RM = matchMedia('(prefers-reduced-motion: reduce)');
  const reduce = () => RM.matches;
  const tileHTML = (k, cls = '') => `<span class="t k${k}${cls ? ' ' + cls : ''}"><svg aria-hidden="true"><use href="#g${k}"/></svg></span>`;
  const fmt = n => n.toLocaleString('en-US');
  const wait = ms => new Promise(r => setTimeout(r, ms));
  const pieceHTML = (m, k) => `<div class="pc" style="grid-template-columns:repeat(${m[0].length},auto)">` +
    m.flat().map(v => v ? tileHTML(k) : '<span class="gap"></span>').join('') + '</div>';
  const $ = id => document.getElementById(id);

  const TRAY = [{ m: [[1,1,1]], k: 4 }, { m: [[1,1],[1,0]], k: 2 }, { m: [[1,1,1],[0,1,0]], k: 6 }];

  /* ---------- the live move: the real board from the app's screenshots (1,240 -> 1,363) ---------- */
  if ($('d-board')) {
    const PRE = [
      [0,0,0,5,5,0,0,0],
      [0,0,2,2,5,0,0,1],
      [0,3,3,2,0,0,1,1],
      [4,4,3,6,6,6,0,1],
      [0,4,7,7,0,6,0,0],
      [2,2,2,7,1,1,0,3],
      [5,0,6,6,1,4,4,3],
      [5,5,6,0,0,4,3,3],
    ];
    const PLACE = [[3,6],[4,6],[5,6]], PK = 4;           // the blue I, turned upright
    const STEPS = [
      'A tray of three. Every tray fits.',
      'Tap: a quarter turn. Turning is free.',
      'Placed: 3 cells, +1 each.',
      'Rows 4 and 6 are full. They clear together.',
      'The score shows its working.',
    ];
    const board = $('d-board'), idx = $('d-idx').children, slots = $('d-tray').children;
    const cells = [];
    for (let i = 0; i < 64; i++) { const c = document.createElement('span'); c.className = 'cell'; board.appendChild(c); cells.push(c); }
    const set = (r, c, k, cls) => { cells[r * 8 + c].innerHTML = k ? tileHTML(k, cls) : ''; };
    const step = n => { $('d-step').innerHTML = `<b>${n}/4</b><span>${STEPS[n]}</span>`; };
    const fuse = n => [...$('d-fuse').children].forEach((f, i) => f.classList.toggle('on', i < n));
    let token = 0, state = 'before';

    const before = () => {
      PRE.forEach((row, r) => row.forEach((k, c) => set(r, c, k)));
      [...board.querySelectorAll('.thread')].forEach(t => t.remove());
      [...idx].forEach(li => li.classList.remove('hit'));
      TRAY.forEach((p, i) => { slots[i].innerHTML = pieceHTML(p.m, p.k); });
      $('d-score').textContent = '1,240'; $('d-combo').textContent = '×2';
      $('d-eq').textContent = ''; $('d-eq').classList.remove('on');
      fuse(2); $('d-left').textContent = '2 moves left';
      step(0); state = 'before';
    };
    const after = () => {
      PRE.forEach((row, r) => row.forEach((k, c) => set(r, c, (r === 3 || r === 5) ? 0 : k)));
      set(4, 6, PK);
      [...board.querySelectorAll('.thread')].forEach(t => t.remove());
      [...idx].forEach((li, i) => li.classList.toggle('hit', i === 3 || i === 5));
      slots[0].innerHTML = '';
      slots[1].innerHTML = pieceHTML(TRAY[1].m, TRAY[1].k);
      slots[2].innerHTML = pieceHTML(TRAY[2].m, TRAY[2].k);
      $('d-score').textContent = '1,363'; $('d-combo').textContent = '×3';
      $('d-eq').textContent = '+123 = 3 + 10 × 2² × 3';
      fuse(3); $('d-left').textContent = '3 moves left';
      step(4); state = 'after';
    };
    const countTo = (from, to, ms) => {
      const el = $('d-score'), t0 = performance.now();
      const tick = now => { const p = Math.min(1, (now - t0) / ms), e = 1 - Math.pow(1 - p, 3);
        el.textContent = fmt(Math.round(from + (to - from) * e)); if (p < 1) requestAnimationFrame(tick); };
      requestAnimationFrame(tick);
    };
    const play = async () => {
      const me = ++token; const live = () => me === token;
      before(); await wait(700); if (!live()) return;
      // 1 · turn the blue I a quarter turn (tiles counter-rotate so their marks stay upright)
      const pc = slots[0].firstElementChild;
      step(1); pc.style.transform = 'rotate(90deg)'; pc.querySelectorAll('.t').forEach(t => t.style.transform = 'rotate(-90deg)');
      await wait(420); if (!live()) return;
      pc.style.transition = 'none'; pc.querySelectorAll('.t').forEach(t => { t.style.transition = 'none'; t.style.transform = ''; });
      pc.style.gridTemplateColumns = 'auto'; pc.style.transform = '';
      void pc.offsetWidth; pc.style.transition = ''; pc.querySelectorAll('.t').forEach(t => t.style.transition = '');
      await wait(520); if (!live()) return;
      // 2 · a shadow shows where it lands, then it drops in
      PLACE.forEach(([r, c]) => set(r, c, PK, 'ghost')); await wait(480); if (!live()) return;
      pc.classList.add('gone'); PLACE.forEach(([r, c]) => set(r, c, PK, 'drop')); step(2);
      await wait(760); if (!live()) return;
      // 3 · both full rows get a thread, then fold flat
      step(3);
      [3, 5].forEach(r => { idx[r].classList.add('hit');
        const th = document.createElement('span'); th.className = 'thread'; th.style.top = `calc(${(r + .5) * 12.5}%)`; board.appendChild(th);
        requestAnimationFrame(() => requestAnimationFrame(() => th.classList.add('on'))); });
      await wait(560); if (!live()) return;
      [3, 5].forEach(r => { for (let c = 0; c < 8; c++) { const t = cells[r * 8 + c].firstElementChild; if (t) { t.style.transitionDelay = `${c * 28}ms`; t.classList.add('fold'); } } });
      await wait(520); if (!live()) return;
      [3, 5].forEach(r => { for (let c = 0; c < 8; c++) set(r, c, 0); });
      [...board.querySelectorAll('.thread')].forEach(t => t.remove());
      slots[0].innerHTML = '';
      // 4 · the sum prints under the score
      $('d-eq').textContent = '+123 = 3 + 10 × 2² × 3'; $('d-eq').classList.add('on');
      $('d-combo').textContent = '×3'; fuse(3); $('d-left').textContent = '3 moves left';
      countTo(1240, 1363, 620); step(4); state = 'after';
    };

    const btnL = $('d-replay-l');
    const syncBtn = () => { btnL.textContent = reduce() ? (state === 'after' ? 'Show before' : 'Show the move') : 'Replay'; };
    $('d-replay').addEventListener('click', () => {
      if (reduce()) { token++; state === 'after' ? before() : after(); }
      else play();
      syncBtn();
    });
    if (reduce()) { after(); syncBtn(); }
    else {
      before(); syncBtn();
      let played = false;
      const io = new IntersectionObserver(es => es.forEach(e => {
        if (e.isIntersecting && !played) { played = true; play(); io.disconnect(); }
      }), { threshold: .45 });
      io.observe($('demo'));
    }
    RM.addEventListener?.('change', () => { token++; reduce() ? after() : before(); syncBtn(); });
  }

  /* ---------- fig. 1: a tray you can turn ---------- */
  const tt = $('turn-tray');
  if (tt) TRAY.forEach((p, i) => {
    const b = document.createElement('button');
    b.type = 'button'; b.className = 'tslot';
    b.setAttribute('aria-label', `Turn piece ${i + 1} a quarter turn`);
    b.innerHTML = `<span class="n" aria-hidden="true">${i + 1}</span>` + pieceHTML(i === 0 ? [[1],[1],[1]] : p.m, p.k);
    let turns = 0;
    b.addEventListener('click', () => {
      turns++; const pc = b.querySelector('.pc');
      pc.style.transform = `rotate(${turns * 90}deg)`;
      pc.querySelectorAll('.t').forEach(t => t.style.transform = `rotate(${-turns * 90}deg)`);
    });
    tt.appendChild(b);
  });

  /* ---------- daily streak: eight days, eight cells ---------- */
  const sk = $('streak');
  if (sk) {
    const DAYS = [['M',1320,1],['T',980,2],['W',1710,3],['T',1460,4],['F',2210,5],['S',1890,6],['S',2040,7],['M',2040,1]];
    sk.innerHTML = DAYS.map(([d, s, k], i) =>
      `<span class="d${i === 7 ? ' today' : ''}" aria-hidden="true">${tileHTML(k)}<span class="dl">${d}</span><span class="ds">${fmt(s)}</span></span>`).join('');
  }

  /* ---------- footer wordmark: tap a tile, it turns ---------- */
  document.querySelectorAll('#foot-wm .wm-t').forEach(t => {
    let n = 0; t.addEventListener('click', () => { n++; t.style.transform = `rotate(${n * 90}deg)`; });
  });
})();
