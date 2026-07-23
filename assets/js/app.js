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
    stopSim();                                  // pause the dashboard sim when leaving demo
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

  /* ================================================ Live dashboard demo == */
  let stopSim = () => {};
  (function dashboard() {
    const grid = $('#bunchGrid'), body = $('#ledgerBody'), empty = $('#ledgerEmpty');
    const kpiIn = $('#kpiIn'), kpiOut = $('#kpiOut'), kpiTotal = $('#kpiTotal');
    const tabs = $$('#kpTabs .tab'), simBtn = $('#simBtn'), resetBtn = $('#resetBtn'), exportBtn = $('#exportBtn');
    if (!grid) return;

    const mk = (n, offset) => Array.from({ length: n }, (_, i) => ({
      name: `Bunch ${i + 1}`, keys: 1 + ((i + offset) % 4), drawn: false,
    }));
    const KP = [
      { label: 'KP1', bunches: mk(24, 0) },
      { label: 'KP2', bunches: mk(16, 2) },
    ];
    let cur = 0;
    let ledger = [];       // {kp, name, keys, out:Date, in:Date|null}
    let simId = null;

    function renderGrid() {
      const bs = KP[cur].bunches;
      grid.innerHTML = bs.map((b, i) =>
        `<button class="bunch${b.drawn ? ' out' : ''}" type="button" data-i="${i}" aria-pressed="${b.drawn}" title="${b.keys} key${b.keys > 1 ? 's' : ''}">
           <span class="led"></span>
           <span class="meta"><span class="nm">${b.name}</span><span class="stt">${b.drawn ? 'Drawn' : 'Available'}</span></span>
         </button>`).join('');
      renderKPIs();
    }
    function renderKPIs() {
      const bs = KP[cur].bunches;
      const drawn = bs.filter((b) => b.drawn).length;
      kpiIn.textContent = bs.length - drawn;
      kpiOut.textContent = drawn;
      kpiTotal.textContent = bs.length;
    }
    function renderLedger() {
      if (!ledger.length) { empty.style.display = ''; body.innerHTML = ''; return; }
      empty.style.display = 'none';
      body.innerHTML = ledger.slice().reverse().slice(0, 40).map((e) =>
        `<tr><td>${e.kp} · ${e.name}</td><td>${e.keys}</td>
           <td class="st-out">${timeStr(e.out)}</td>
           <td>${e.in ? `<span class="st-in">${timeStr(e.in)}</span>` : '<span class="text-muted">— out —</span>'}</td></tr>`
      ).join('');
      const first = body.querySelector('tr');
      if (first && !REDUCE) first.classList.add('newrow');
    }

    function toggleBunch(i, silent) {
      const b = KP[cur].bunches[i];
      const nowD = new Date();
      if (!b.drawn) {
        b.drawn = true;
        ledger.push({ kp: KP[cur].label, name: b.name, keys: b.keys, out: nowD, in: null });
      } else {
        b.drawn = false;
        for (let j = ledger.length - 1; j >= 0; j--) {
          if (ledger[j].kp === KP[cur].label && ledger[j].name === b.name && !ledger[j].in) { ledger[j].in = nowD; break; }
        }
      }
      renderGrid(); renderLedger();
      if (!silent) toast(b.drawn ? `${b.name} signed OUT` : `${b.name} signed IN`);
    }

    grid.addEventListener('click', (e) => {
      const btn = e.target.closest('.bunch'); if (!btn) return;
      toggleBunch(+btn.dataset.i, false);
    });

    tabs.forEach((t) => t.addEventListener('click', () => {
      tabs.forEach((x) => x.classList.remove('active'));
      t.classList.add('active');
      cur = +t.dataset.kp; renderGrid();
    }));

    function startSim() {
      if (simId) return;
      simBtn.innerHTML = '<svg><use href="#i-refresh"/></svg>Stop simulation';
      simBtn.classList.add('btn-in'); simBtn.classList.remove('btn-primary');
      simId = setInterval(() => {
        const bs = KP[cur].bunches;
        const i = Math.floor(Math.random() * bs.length);
        toggleBunch(i, true);
      }, REDUCE ? 1400 : 850);
    }
    function haltSim() {
      if (!simId) return;
      clearInterval(simId); simId = null;
      simBtn.innerHTML = '<svg><use href="#i-play"/></svg>Simulate duty day';
      simBtn.classList.remove('btn-in'); simBtn.classList.add('btn-primary');
    }
    stopSim = haltSim;                            // exposed to router

    simBtn?.addEventListener('click', () => (simId ? haltSim() : startSim()));
    resetBtn?.addEventListener('click', () => {
      haltSim();
      KP.forEach((k) => k.bunches.forEach((b) => (b.drawn = false)));
      ledger = [];
      renderGrid(); renderLedger();
      toast('Board reset');
    });
    exportBtn?.addEventListener('click', () => {
      if (!ledger.length) { toast('Nothing to export yet', 'warn'); return; }
      const rows = [['Keypress', 'Bunch', 'Keys', 'TimeOut', 'TimeIn']];
      ledger.forEach((e) => rows.push([e.kp, e.name, e.keys, e.out.toISOString(), e.in ? e.in.toISOString() : '']));
      const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
      download(csv, 'keyx_audit_ledger.csv', 'text/csv');
      toast('Audit ledger exported');
    });

    renderGrid(); renderLedger();
  })();

  /* ============================================= Onboarding wizard ===== */
  (function onboarding() {
    const checks = $$('.check');
    if (!checks.length) return;
    const REQUIRED = ['s1-accounts', 's1-admins', 's2-register', 's2-roll'];
    const ringEl = $('#readyRing'), pctEl = $('#readyPct'), titleEl = $('#readyTitle'), subEl = $('#readySub');
    const stp1 = $('#stp1'), stp2 = $('#stp2'), stp3 = $('#stp3');
    const RC = 2 * Math.PI * 26;
    if (ringEl) { ringEl.style.strokeDasharray = RC; ringEl.style.strokeDashoffset = RC; }
    let state = store.get('keyx-onboard', {});
    let celebrated = false;

    function apply() {
      checks.forEach((c) => {
        const on = !!state[c.dataset.check];
        c.classList.toggle('on', on);
        c.setAttribute('aria-pressed', String(on));
      });
      const doneReq = REQUIRED.filter((k) => state[k]).length;
      const frac = doneReq / REQUIRED.length;
      if (ringEl) ringEl.style.strokeDashoffset = RC * (1 - frac);
      if (pctEl) pctEl.textContent = Math.round(frac * 100) + '%';
      const s1 = state['s1-accounts'] && state['s1-admins'];
      const s2 = state['s2-register'] && state['s2-roll'];
      stp1?.classList.toggle('done', !!s1);
      stp2?.classList.toggle('done', !!s2);
      stp3?.classList.toggle('done', !!(s1 && s2));
      if (subEl) subEl.textContent = `${doneReq} of ${REQUIRED.length} required items prepared`;
      if (titleEl) titleEl.textContent = (s1 && s2) ? 'Your unit is ready to go live 🎉' : (doneReq ? 'Nicely on your way' : "Let's get your unit ready");
      if (s1 && s2 && !celebrated) { celebrated = true; toast('All set — message Ranee to go live!'); }
      if (!(s1 && s2)) celebrated = false;
    }

    function toggle(c) {
      const k = c.dataset.check;
      state[k] = !state[k];
      if (!state[k]) delete state[k];
      store.set('keyx-onboard', state);
      apply();
    }
    checks.forEach((c) => {
      c.addEventListener('click', (e) => {
        if (e.target.closest('[data-copy],[data-download],a,button')) return; // don't toggle when using an inner control
        toggle(c);
      });
      c.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(c); }
      });
    });

    $('#clearProgress')?.addEventListener('click', () => {
      state = {}; store.del('keyx-onboard'); celebrated = false; apply(); toast('Checklist reset');
    });

    apply();
  })();

  /* ================================================= Format validators == */
  (function validators() {
    const acct = $('#acctIn'), acctMsg = $('#acctMsg');
    const nric = $('#nricIn'), nricMsg = $('#nricMsg');

    function setMsg(input, msgEl, ok, text) {
      input.classList.toggle('ok', ok === true);
      input.classList.toggle('bad', ok === false);
      msgEl.className = 'vmsg ' + (ok === true ? 'ok' : ok === false ? 'bad' : 'idle');
      msgEl.textContent = text;
    }

    acct?.addEventListener('input', () => {
      const v = acct.value.trim();
      if (!v) return setMsg(acct, acctMsg, null, 'Uppercase letters, digits and underscores — at least one underscore.');
      if (/[a-z]/.test(v)) return setMsg(acct, acctMsg, false, 'Use UPPERCASE only — e.g. 15C4I_HQ_COY');
      if (!/^[A-Z0-9]+(?:_[A-Z0-9]+)+$/.test(v)) return setMsg(acct, acctMsg, false, 'Needs the UNIT_COY shape — join parts with underscores.');
      setMsg(acct, acctMsg, true, 'Valid account name.');
    });

    nric?.addEventListener('input', () => {
      const v = nric.value.trim();
      if (!v) return setMsg(nric, nricMsg, null, 'KeyX matches this exact text to the SingPass login — lowercase locks the user out.');
      if (/[a-z]/.test(v)) return setMsg(nric, nricMsg, false, 'Lowercase detected — NRIC MUST be ALL CAPS or the user is locked out.');
      if (!/^[STFGM][0-9]{7}[A-Z]$/.test(v)) return setMsg(nric, nricMsg, false, 'Expected 1 letter + 7 digits + 1 letter, e.g. S1234567A.');
      setMsg(nric, nricMsg, true, 'Format looks correct and is ALL CAPS.');
    });
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

  /* ------------------------------------------------------------ Boot ----- */
  go(parseRoute());
})();
