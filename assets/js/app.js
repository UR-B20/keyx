/* ============================================================================
   KeyX — platform interactions
   Vanilla JS. No dependencies. Progressive, reduced-motion aware.
   ========================================================================== */
(() => {
  'use strict';
  const $  = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const REDUCE = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const clamp = (n, a, b) => Math.max(a, Math.min(b, n));
  const pad = (n) => String(n).padStart(2, '0');
  const store = {
    get(k, d) { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch { return d; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} },
    del(k)    { try { localStorage.removeItem(k); } catch {} },
  };
  const timeStr = (d) => `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;

  /* -------------------------------------------------------------- Toast -- */
  const toaster = $('#toaster');
  function toast(msg, kind = 'ok') {
    if (!toaster) return;
    const t = document.createElement('div');
    t.className = 'toast';
    const icon = kind === 'ok' ? '#i-check' : '#i-alert';
    t.innerHTML = `<svg style="color:var(--${kind === 'ok' ? 'in' : 'warn'})"><use href="${icon}"/></svg><span></span>`;
    t.querySelector('span').textContent = msg;
    while (toaster.children.length > 2) toaster.firstChild.remove();
    toaster.appendChild(t);
    setTimeout(() => { t.style.opacity = '0'; t.style.transform = 'translateY(10px)'; t.style.transition = 'opacity .3s, transform .3s'; }, 2100);
    setTimeout(() => t.remove(), 2500);
  }

  /* -------------------------------------------------------------- Theme -- */
  const themeBtn = $('#themeBtn');
  const savedTheme = store.get('keyx-theme', null);
  if (savedTheme === 'light' || savedTheme === 'dark') {
    document.documentElement.setAttribute('data-theme', savedTheme);
  }
  themeBtn?.addEventListener('click', () => {
    const cur = document.documentElement.getAttribute('data-theme');
    const sysLight = window.matchMedia('(prefers-color-scheme: light)').matches;
    const now = cur ? cur : (sysLight ? 'light' : 'dark');
    const next = now === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    store.set('keyx-theme', next);
  });

  /* ---------------------------------------------------------- Reveal IO -- */
  const io = ('IntersectionObserver' in window) ? new IntersectionObserver((entries) => {
    for (const e of entries) {
      if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
    }
  }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' }) : null;

  function revealIn(view) {
    const items = $$('[data-reveal]:not(.in)', view);
    if (!io || REDUCE) { items.forEach((i) => i.classList.add('in')); return; }
    items.forEach((i) => io.observe(i));
  }

  /* -------------------------------------------------------------- Router -- */
  const views = $$('.view');
  const navLinks = $$('[data-route]');
  const routes = new Set(views.map((v) => v.dataset.view));

  function parseRoute() {
    let h = location.hash.replace(/^#/, '');
    if (!h || h === '/') return '/';
    return routes.has(h) ? h : '/';
  }

  function go(route) {
    views.forEach((v) => v.classList.toggle('active', v.dataset.view === route));
    navLinks.forEach((a) => a.classList.toggle('active', a.dataset.route === route));
    const view = views.find((v) => v.dataset.view === route);
    if (view) revealIn(view);
    window.scrollTo({ top: 0, behavior: REDUCE ? 'auto' : 'smooth' });
  }

  window.addEventListener('hashchange', () => go(parseRoute()));

  /* ===================================================== Hero peg board == */
  const heroPegNames = ['Games Rm','Garage','Armskote','Store A','Comd Rm','Server','Store B','Bunk 1','Bunk 2','MT Line','Ops Rm','Signals'];
  const heroPegs = $('#heroPegs');
  const heroAvail = $('#heroAvail');
  let heroTimer = null;
  function updateHeroCount() {
    if (!heroPegs || !heroAvail) return;
    const avail = $$('.peg', heroPegs).filter((p) => !p.classList.contains('out')).length;
    heroAvail.innerHTML = `<span class="dot"></span>${avail} available`;
  }
  if (heroPegs) {
    const out = new Set([2, 5, 9]);
    heroPegs.innerHTML = heroPegNames.map((n, i) =>
      `<div class="peg${out.has(i) ? ' out' : ''}"><span class="led"></span><span class="lbl">${n}</span></div>`
    ).join('');
    updateHeroCount();
    if (!REDUCE) {
      heroTimer = setInterval(() => {
        const pegs = $$('.peg', heroPegs);
        const p = pegs[Math.floor(Math.random() * pegs.length)];
        if (p) p.classList.toggle('out');
        updateHeroCount();
      }, 2600);
    }
  }

  /* ============================================= Secure transfer demo === */
  (function transferDemo() {
    const ring = $('#qrRing'), prog = $('#qrProg'), count = $('#qrCount');
    const devA = $('#devA'), devB = $('#devB');
    const btnInit = $('#htInitiate'), btnScan = $('#htScan'), btnReset = $('#htReset');
    const aState = $('#devAstate'), bState = $('#devBstate'), aKey = $('#devAkey'), bKey = $('#devBkey');
    const canvas = $('#qrCanvas');
    if (!ring || !prog) return;

    const CIRC = 2 * Math.PI * 61;
    prog.style.strokeDasharray = CIRC;
    prog.style.strokeDashoffset = CIRC;
    let raf = null, running = false;
    const KEY = 'Games Room · Bunch 1';

    function drawQR(seed) {
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      const N = 21;
      ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, N, N);
      ctx.fillStyle = '#0a121e';
      let s = seed >>> 0;
      const rnd = () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
      for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
        const finder = (x < 7 && y < 7) || (x > N - 8 && y < 7) || (x < 7 && y > N - 8);
        if (finder) continue;
        if (rnd() > 0.52) ctx.fillRect(x, y, 1, 1);
      }
      const eye = (ox, oy) => { ctx.fillRect(ox, oy, 7, 1); ctx.fillRect(ox, oy + 6, 7, 1); ctx.fillRect(ox, oy, 1, 7); ctx.fillRect(ox + 6, oy, 1, 7); ctx.fillRect(ox + 2, oy + 2, 3, 3); };
      eye(0, 0); eye(N - 7, 0); eye(0, N - 7);
    }

    function setProg(frac) { prog.style.strokeDashoffset = CIRC * (1 - frac); }

    function stop() { if (raf) cancelAnimationFrame(raf); raf = null; running = false; }

    function reset() {
      stop();
      ring.classList.remove('armed');
      setProg(0);
      prog.style.stroke = 'var(--signal)';
      count.textContent = 'Idle';
      count.style.color = 'var(--signal-2)';
      devA.classList.add('has-key'); devA.classList.remove('done');
      devB.classList.remove('has-key', 'done', 'active');
      aState.className = 'pill signal'; aState.innerHTML = '<span class="dot"></span>Holding';
      bState.className = 'pill'; bState.innerHTML = '<span class="dot"></span>Waiting';
      aKey.textContent = KEY; bKey.textContent = 'No key held';
      btnScan.disabled = true; btnInit.disabled = false;
    }

    function initiate() {
      if (running) return;
      drawQR((Math.random() * 1e9) | 0);
      ring.classList.add('armed');
      devB.classList.add('active');
      bState.className = 'pill signal'; bState.innerHTML = '<span class="dot"></span>Scanning…';
      btnScan.disabled = false; btnInit.disabled = true;
      const DUR = REDUCE ? 3000 : 8000;
      const start = performance.now();
      running = true;
      const tick = (t) => {
        const el = t - start, frac = clamp(el / DUR, 0, 1), rem = Math.ceil(55 * (1 - frac));
        setProg(frac);
        count.textContent = rem + 's';
        if (frac > 0.75) { prog.style.stroke = 'var(--warn)'; count.style.color = 'var(--warn)'; }
        if (frac >= 1) { expire(); return; }
        raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
    }

    function expire() {
      stop();
      prog.style.stroke = 'var(--out)';
      count.textContent = 'Expired'; count.style.color = 'var(--out)';
      bState.className = 'pill out'; bState.innerHTML = '<span class="dot"></span>Window closed';
      btnScan.disabled = true;
      toast('Secure window expired — generate a new code', 'warn');
    }

    function scan() {
      if (!running) return;
      stop();
      setProg(1);
      prog.style.stroke = 'var(--in)';
      count.textContent = 'Verified'; count.style.color = 'var(--in)';
      devA.classList.remove('has-key'); devA.classList.add('done');
      devB.classList.remove('active'); devB.classList.add('has-key', 'done');
      aState.className = 'pill'; aState.innerHTML = '<span class="dot"></span>Released';
      bState.className = 'pill in'; bState.innerHTML = '<span class="dot"></span>Custody taken';
      aKey.textContent = 'Handover complete'; bKey.textContent = KEY;
      btnScan.disabled = true;
      toast('Custody transferred — ledger updated');
    }

    btnInit?.addEventListener('click', initiate);
    btnScan?.addEventListener('click', scan);
    btnReset?.addEventListener('click', reset);
    reset();
  })();

  /* ============================================= Onboarding form ======= */
  (function onboardingForm() {
    const form = document.getElementById('onboardForm');
    if (!form) return;
    const list = document.getElementById('subunits');
    const unitInput = document.getElementById('unitName');
    const WA = 'https://wa.me/6587820742';
    const svg = (id) => '<svg><use href="#' + id + '"/></svg>';

    function adminRow() {
      const row = document.createElement('div');
      row.className = 'admin-row';
      row.innerHTML =
        '<div class="vfield ad-name-f"><input class="ad-name" type="text" autocomplete="off" placeholder="Admin full name"></div>' +
        '<div class="vfield ad-nric-f"><input class="ad-nric" data-validate="nric" type="text" spellcheck="false" autocomplete="off" placeholder="NRIC · ALL CAPS"><div class="vmsg idle"></div></div>' +
        '<button class="ad-remove" type="button" aria-label="Remove admin">' + svg('i-x') + '</button>';
      row.querySelector('.ad-remove').addEventListener('click', () => {
        const listEl = row.parentElement;
        if (listEl.children.length > 1) row.remove();
        else toast('Keep at least one admin', 'warn');
      });
      return row;
    }

    function subunit() {
      const card = document.createElement('div');
      card.className = 'subunit';
      card.innerHTML =
        '<div class="su-head"><span class="su-badge">Sub-unit</span>' +
          '<button class="su-remove" type="button" aria-label="Remove sub-unit">' + svg('i-x') + '</button></div>' +
        '<div class="su-grid">' +
          '<div class="vfield"><label>Branch / Coy</label><input class="su-name" type="text" autocomplete="off" placeholder="e.g. HQ Coy"></div>' +
          '<div class="vfield"><label>Account name <span class="lbl-hint">UNIT_COY</span></label><input class="su-account" data-validate="account" type="text" spellcheck="false" autocomplete="off" placeholder="e.g. 15C4I_HQ_COY"><div class="vmsg idle"></div></div>' +
        '</div>' +
        '<div class="admins"><div class="admins-label">Admin users <span class="hint">Recommended: OC, CSM, S2, INT WO</span></div>' +
          '<div class="admin-list"></div>' +
          '<button class="btn btn-ghost btn-add-admin" type="button">' + svg('i-plus') + 'Add admin</button></div>';
      card.querySelector('.admin-list').appendChild(adminRow());
      card.querySelector('.btn-add-admin').addEventListener('click', () => {
        card.querySelector('.admin-list').appendChild(adminRow());
      });
      card.querySelector('.su-remove').addEventListener('click', () => {
        if (list.children.length > 1) { card.remove(); renumber(); }
        else toast('Keep at least one sub-unit', 'warn');
      });
      return card;
    }

    function renumber() {
      $$('.subunit', list).forEach((c, i) => {
        c.querySelector('.su-badge').textContent = 'Sub-unit ' + (i + 1);
      });
    }

    // Inline validation (delegated) for account names + NRICs
    form.addEventListener('input', (e) => {
      const input = e.target;
      const kind = input.dataset && input.dataset.validate;
      if (!kind) return;
      const msg = input.parentElement.querySelector('.vmsg');
      const v = input.value.trim();
      let ok = null, text = '';
      if (kind === 'account') {
        if (!v) { ok = null; text = ''; }
        else if (/[a-z]/.test(v)) { ok = false; text = 'Use UPPERCASE only — e.g. 15C4I_HQ_COY'; }
        else if (!/^[A-Z0-9]+(?:_[A-Z0-9]+)+$/.test(v)) { ok = false; text = 'Needs the UNIT_COY shape — join parts with underscores.'; }
        else { ok = true; text = 'Valid account name.'; }
      } else if (kind === 'nric') {
        if (!v) { ok = null; text = ''; }
        else if (/[a-z]/.test(v)) { ok = false; text = 'Lowercase locks the user out — NRIC must be ALL CAPS.'; }
        else if (!/^[STFGM][0-9]{7}[A-Z]$/.test(v)) { ok = false; text = 'Expected 1 letter + 7 digits + 1 letter, e.g. S1234567A.'; }
        else { ok = true; text = 'Looks correct.'; }
      }
      input.classList.toggle('ok', ok === true);
      input.classList.toggle('bad', ok === false);
      if (msg) { msg.className = 'vmsg ' + (ok === true ? 'ok' : ok === false ? 'bad' : 'idle'); msg.textContent = text; }
    });

    document.getElementById('addSubunit').addEventListener('click', () => {
      const card = subunit();
      list.appendChild(card); renumber();
      card.querySelector('.su-name').focus();
    });

    function collect() {
      const unit = (unitInput.value || '').trim();
      const subs = [];
      $$('.subunit', list).forEach((c) => {
        const name = c.querySelector('.su-name').value.trim();
        const account = c.querySelector('.su-account').value.trim();
        const admins = $$('.admin-row', c).map((r) => ({
          name: r.querySelector('.ad-name').value.trim(),
          nric: r.querySelector('.ad-nric').value.trim(),
        })).filter((a) => a.name || a.nric);
        if (name || account || admins.length) subs.push({ name, account, admins });
      });
      return { unit, subs };
    }

    function sendToRanee() {
      const { unit, subs } = collect();
      if (!unit) { toast('Add your unit name first', 'warn'); unitInput.focus(); return; }
      if (!subs.some((s) => s.name && s.account)) {
        toast('Add a branch / coy with its account name', 'warn'); return;
      }
      let msg = '*KeyX Onboarding — Step 1: Access request*\n\n';
      msg += 'Unit: ' + unit + '\n\nAccounts to create:\n';
      subs.forEach((s, i) => {
        msg += (i + 1) + ') ' + (s.name || '(unnamed)') + ' — Account: ' + (s.account || '(tbc)') + '\n';
        if (s.admins.length) {
          msg += '   Admins:\n';
          s.admins.forEach((a) => { msg += '   • ' + (a.name || '(name?)') + ' (' + (a.nric || 'NRIC?') + ')\n'; });
        }
        msg += '\n';
      });
      window.open(WA + '?text=' + encodeURIComponent(msg.trim()), '_blank', 'noopener');
      toast('Opening WhatsApp — review, then send');
    }

    document.getElementById('sendStep1').addEventListener('click', sendToRanee);

    // Seed the form with one sub-unit
    list.appendChild(subunit()); renumber();
  })();

  /* ======================================================== Accordion === */
  $$('.acc-head').forEach((h) => h.addEventListener('click', () => {
    const item = h.closest('.acc-item');
    const open = item.classList.toggle('open');
    h.setAttribute('aria-expanded', String(open));
  }));

  /* ============================================ Copy & download utils === */
  function download(text, name, mime = 'text/csv') {
    const blob = new Blob([text], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = name;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  // `download` is a hoisted function declaration, so the dashboard export
  // handler above can call it even though it's defined here.

  document.addEventListener('click', (e) => {
    const copyBtn = e.target.closest('[data-copy]');
    if (copyBtn) {
      e.preventDefault(); e.stopPropagation();
      const text = copyBtn.getAttribute('data-copy');
      navigator.clipboard?.writeText(text).then(() => toast('Copied to clipboard')).catch(() => toast('Copy failed', 'warn'));
      return;
    }
    const dl = e.target.closest('[data-download]');
    if (dl) {
      e.preventDefault(); e.stopPropagation();
      const kind = dl.getAttribute('data-download');
      const fname = dl.getAttribute('data-fname') || 'template.csv';
      let csv;
      if (kind === 'keys') csv = 'KeypressName,NumKeys,Bunch\nDemo Office 4,2,1\nDemo Office 4,3,2\nDemo Office 4,1,3\n';
      else csv = 'KeypressName,Fullname,NRIC\nDemo Office 4,Full Name Here,S1234567A\nDemo Office 1,Full Name Here,T7654321B\n';
      download(csv, fname);
      toast('Template downloaded');
    }
  });

  /* ============================================= User guide + lightbox == */
  (function guide() {
    const shots = $$('.gshot');
    if (!shots.length) return;
    const lb = $('#lightbox'), lbImg = $('#lbImg'), lbCap = $('#lbCap');
    const btnClose = $('#lbClose'), btnPrev = $('#lbPrev'), btnNext = $('#lbNext');
    const parts = $$('.guide-part');
    let list = shots.slice();
    let idx = 0, lastFocus = null;

    // role filter
    $$('.gfilter').forEach((b) => b.addEventListener('click', () => {
      const f = b.dataset.filter;
      $$('.gfilter').forEach((x) => { const on = x === b; x.classList.toggle('active', on); x.setAttribute('aria-selected', String(on)); });
      parts.forEach((p) => { p.hidden = !(f === 'all' || p.dataset.part === f); });
    }));

    const visibleShots = () => shots.filter((s) => !s.closest('.guide-part').hidden);

    function show(i) {
      idx = (i + list.length) % list.length;
      const s = list[idx];
      lbImg.src = s.dataset.img;
      lbImg.alt = s.querySelector('img') ? s.querySelector('img').alt : (s.dataset.title || '');
      lbCap.textContent = s.dataset.title || '';
    }
    function open(s) {
      lastFocus = document.activeElement;
      list = visibleShots();
      show(list.indexOf(s));
      lb.hidden = false; lb.classList.add('open');
      document.body.classList.add('lb-open');
      btnClose.focus();
    }
    function close() {
      lb.classList.remove('open'); lb.hidden = true;
      document.body.classList.remove('lb-open');
      lbImg.src = '';
      if (lastFocus && lastFocus.focus) lastFocus.focus();
    }
    shots.forEach((s) => s.addEventListener('click', () => open(s)));
    btnClose.addEventListener('click', close);
    btnPrev.addEventListener('click', () => show(idx - 1));
    btnNext.addEventListener('click', () => show(idx + 1));
    lb.addEventListener('click', (e) => { if (e.target === lb) close(); });
    document.addEventListener('keydown', (e) => {
      if (lb.hidden) return;
      if (e.key === 'Escape') close();
      else if (e.key === 'ArrowLeft') show(idx - 1);
      else if (e.key === 'ArrowRight') show(idx + 1);
    });
    let sx = null;
    lb.addEventListener('touchstart', (e) => { sx = e.touches[0].clientX; }, { passive: true });
    lb.addEventListener('touchend', (e) => {
      if (sx === null) return;
      const dx = e.changedTouches[0].clientX - sx;
      if (Math.abs(dx) > 45) show(idx + (dx < 0 ? 1 : -1));
      sx = null;
    }, { passive: true });
  })();

  /* ------------------------------------------------------------ Boot ----- */
  go(parseRoute());
})();
