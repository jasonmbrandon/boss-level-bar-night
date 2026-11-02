/* Boss Level Bar Night — interactions, achievements, mini-game, signup */
(function () {
  'use strict';

  var CONFIG = {
    discordUrl: '',           // paste the Discord invite here, e.g. 'https://discord.gg/xxxx'
    goal: 100,
    defaultCity: 'los-angeles'
  };

  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var store = {
    get: function (k, d) { try { var v = localStorage.getItem('bl:' + k); return v === null ? d : JSON.parse(v); } catch (e) { return d; } },
    set: function (k, v) { try { localStorage.setItem('bl:' + k, JSON.stringify(v)); } catch (e) {} }
  };
  document.documentElement.classList.add('js');

  /* ---------- Achievements and XP ---------- */
  var ACH = [
    { id: 'start', name: 'Press start', xp: 50 },
    { id: 'night', name: 'Night owl', xp: 100 },
    { id: 'board', name: 'Board scout', xp: 100 },
    { id: 'unlock', name: 'City watcher', xp: 100 },
    { id: 'main', name: 'Picked a main', xp: 150 },
    { id: 'practice', name: 'Practice round', xp: 150 },
    { id: 'perfect', name: 'Frame perfect', xp: 300 },
    { id: 'hosts', name: 'Talent scout', xp: 100 },
    { id: 'lore', name: 'Lore keeper', xp: 150 },
    { id: 'secret', name: 'Secret found', xp: 250 },
    { id: 'joined', name: 'Party joined', xp: 500 }
  ];
  var got = store.get('ach', {});
  var toastEl = $('[data-toast]');
  var toastTimer;

  function xpTotal() { return ACH.reduce(function (s, a) { return s + (got[a.id] ? a.xp : 0); }, 0); }
  function renderHud() {
    var xp = xpTotal(), lv = Math.floor(xp / 400) + 1, into = (xp % 400) / 400;
    var n = Object.keys(got).length;
    $('[data-lv]').textContent = lv;
    $('[data-ach-n]').textContent = n;
    $('[data-hud-xp]').style.width = (into * 100).toFixed(0) + '%';
    var list = $('[data-ach-list]');
    list.innerHTML = '';
    ACH.forEach(function (a) {
      var li = document.createElement('li');
      if (got[a.id]) li.className = 'got';
      li.innerHTML = '<span>' + (got[a.id] ? a.name : '???') + '</span><span>+' + a.xp + ' XP</span>';
      list.appendChild(li);
    });
    var sub = $('[data-card-sub]');
    if (n === ACH.length) sub.textContent = 'All eleven badges. Title earned: Boss Level founder. It goes on your signup.';
    else sub.textContent = 'Explore the site to earn badges. ' + (ACH.length - n) + ' left for the founder title.';
  }
  function unlock(id) {
    if (got[id]) return;
    var a = ACH.filter(function (x) { return x.id === id; })[0];
    if (!a) return;
    got[id] = Date.now();
    store.set('ach', got);
    renderHud();
    clearTimeout(toastTimer);
    toastEl.textContent = 'Badge unlocked: ' + a.name + '  +' + a.xp + ' XP';
    toastEl.classList.add('is-on');
    toastTimer = setTimeout(function () { toastEl.classList.remove('is-on'); }, 2600);
  }
  renderHud();
  setTimeout(function () { unlock('start'); }, 1400);

  var hudBtn = $('[data-hud-btn]'), card = $('[data-card]');
  hudBtn.addEventListener('click', function () {
    var open = card.hidden;
    card.hidden = !open;
    hudBtn.setAttribute('aria-expanded', String(open));
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && !card.hidden) { card.hidden = true; hudBtn.setAttribute('aria-expanded', 'false'); hudBtn.focus(); }
  });

  /* ---------- Hero entrance ---------- */
  var hero = $('.hero');
  requestAnimationFrame(function () { hero.classList.add('is-in'); });

  /* ---------- Sticky bar takes the chapter colour ---------- */
  var bar = $('[data-bar]');
  var chapters = $$('[data-chapter]');
  var tones = { 'ch-black': ['#000', '#fff'], 'ch-mint': ['#9ae187', '#000'], 'ch-lemon': ['#f3ea7a', '#000'], 'ch-cyan': ['#93f1f7', '#000'], 'ch-orange': ['#fbb65c', '#000'], 'ch-blue': ['#b9c8ff', '#000'] };
  function onScroll() {
    bar.classList.toggle('is-stuck', window.scrollY > window.innerHeight * 0.6);
    var y = 64;
    for (var i = chapters.length - 1; i >= 0; i--) {
      var r = chapters[i].getBoundingClientRect();
      if (r.top <= y) {
        var cls = Object.keys(tones).filter(function (c) { return chapters[i].classList.contains(c); })[0];
        var t = tones[cls] || tones['ch-black'];
        bar.style.setProperty('--bar-bg', t[0]);
        bar.style.setProperty('--bar-ink', t[1]);
        break;
      }
    }
  }

  /* ---------- Section entrances (staggered) + chapter badges ---------- */
  $$('.ch').forEach(function (ch) {
    $$('[data-reveal]', ch).forEach(function (el, i) { el.style.setProperty('--d', (i * 0.075).toFixed(3) + 's'); });
  });
  var chapterBadge = { night: 'night', board: 'board', unlock: 'unlock', hosts: 'hosts' };
  if ('IntersectionObserver' in window && !reduce) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); } });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.12 });
    $$('[data-reveal]').forEach(function (el) { io.observe(el); });
  } else {
    $$('[data-reveal]').forEach(function (el) { el.classList.add('is-in'); });
  }
  if ('IntersectionObserver' in window) {
    var cio = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (!e.isIntersecting) return;
        var id = chapterBadge[e.target.getAttribute('data-chapter')];
        if (id) unlock(id);
        if (e.target.id === 'unlock') loadCount();
      });
    }, { threshold: 0, rootMargin: '-45% 0px -45% 0px' });
    chapters.forEach(function (c) { cio.observe(c); });
  }

  /* ---------- The night: pinned scroll accordion ---------- */
  var night = $('[data-night]');
  var stages = $$('.stage', night);
  var clock = $('[data-clock]'), clockFill = $('[data-clock-fill]');
  var desktop = window.matchMedia('(min-width: 761px)');
  var current = 0;
  function openStage(i) {
    if (i === current && stages[i].classList.contains('is-open')) return;
    current = i;
    stages.forEach(function (s, j) {
      s.classList.toggle('is-open', j === i);
      $('.stage-tab', s).setAttribute('aria-selected', String(j === i));
    });
    clock.textContent = $('.stage-tab', stages[i]).getAttribute('data-time');
  }
  stages.forEach(function (s, i) {
    $('.stage-tab', s).addEventListener('click', function () {
      if (night.hasAttribute('data-pinned')) {
        var dist = night.offsetHeight - window.innerHeight;
        var target = night.getBoundingClientRect().top + window.scrollY + dist * ((i + 0.5) / stages.length);
        window.scrollTo({ top: target, behavior: reduce ? 'auto' : 'smooth' });
      }
      openStage(i);
    });
  });
  function setPinned() {
    if (desktop.matches && !reduce) night.setAttribute('data-pinned', '');
    else night.removeAttribute('data-pinned');
  }
  setPinned();
  desktop.addEventListener('change', setPinned);
  function nightScroll() {
    if (!night.hasAttribute('data-pinned')) return;
    var r = night.getBoundingClientRect();
    var dist = night.offsetHeight - window.innerHeight;
    var p = dist > 0 ? Math.max(0, Math.min(1, -r.top / dist)) : 0;
    clockFill.style.width = (p * 100).toFixed(1) + '%';
    openStage(Math.min(stages.length - 1, Math.floor(p * stages.length)));
  }

  /* ---------- Parallax on the skyline and hero sprite ---------- */
  var para = $$('[data-parallax]'), heroSprite = $('.hero-sprite');
  function parallax() {
    if (reduce) return;
    var y = window.scrollY;
    if (heroSprite && y < window.innerHeight) heroSprite.style.transform = 'translate3d(0,' + (y * 0.25).toFixed(1) + 'px,0) rotate(' + (y * 0.02).toFixed(2) + 'deg)';
    para.forEach(function (el) {
      var r = el.getBoundingClientRect();
      if (r.bottom < 0 || r.top > window.innerHeight) return;
      var c = (r.top + r.height / 2 - window.innerHeight / 2) * -0.08;
      el.style.transform = 'translate3d(0,' + c.toFixed(1) + 'px,0)';
    });
  }

  var ticking = false;
  window.addEventListener('scroll', function () {
    if (ticking) return; ticking = true;
    requestAnimationFrame(function () { onScroll(); nightScroll(); parallax(); ticking = false; });
  }, { passive: true });
  window.addEventListener('resize', function () { nightScroll(); });
  onScroll(); nightScroll();

  /* ---------- Unlock count (live, from the signup list) ---------- */
  var countEl = $('[data-count]'), xpBar = $('[data-xp]'), xpFill = $('[data-xp-fill]'), capEl = $('[data-count-caption]');
  var countLoaded = false;
  function showCount(n) {
    countEl.textContent = String(n);
    var pct = Math.min(100, (n / CONFIG.goal) * 100);
    xpFill.style.width = pct.toFixed(1) + '%';
    xpBar.setAttribute('aria-valuenow', String(n));
  }
  function loadCount() {
    if (countLoaded) return; countLoaded = true;
    fetch('/api/count?city=' + CONFIG.defaultCity).then(function (r) { return r.ok ? r.json() : null; }).then(function (d) {
      if (d && typeof d.count === 'number') showCount(d.count);
      else capEl.textContent = 'The live count turns on when signups open. At 100 Los Angeles players, we book a bar, set the date and email this list first.';
    }).catch(function () {});
  }

  /* ---------- Pick your main ---------- */
  var disc = $('[data-disc]'), discObj = $('[data-disc-obj]'), discFact = $('[data-disc-fact]');
  var mainsSection = $('#mains');
  var chosenMain = store.get('main', 'fighting');
  function pickMain(btn, silent) {
    $$('.main').forEach(function (b) { var on = b === btn; b.classList.toggle('is-on', on); b.setAttribute('aria-pressed', String(on)); });
    mainsSection.style.setProperty('--disc', btn.getAttribute('data-colour'));
    discObj.style.opacity = '0';
    setTimeout(function () {
      discObj.src = 'img/' + btn.getAttribute('data-img') + '.png';
      discObj.alt = btn.getAttribute('data-alt');
      discObj.style.opacity = '1';
    }, reduce ? 0 : 180);
    discFact.textContent = btn.getAttribute('data-fact');
    chosenMain = btn.getAttribute('data-main');
    store.set('main', chosenMain);
    if (!silent) unlock('main');
  }
  $$('.main').forEach(function (b) {
    b.addEventListener('click', function () { pickMain(b); });
    if (b.getAttribute('data-main') === chosenMain) pickMain(b, true);
  });

  /* ---------- Practice round: parry timing game ---------- */
  var game = $('[data-game]'), mark = $('[data-mark]'), lane = $('[data-lane]'), win = $('[data-window]');
  var msg = $('[data-msg]'), parryBtn = $('[data-parry]');
  var swingEl = $('[data-swing]'), scoreEl = $('[data-score]'), hpEl = $('[data-hp]'), bestEl = $('[data-best]');
  var running = false, swing = 0, score = 0, perfects = 0, pos = 0, dir = 1, speed = 0.9, raf = 0, last = 0, winL = 0.62, winW = 0.12;
  var best = store.get('best', 0); bestEl.textContent = best;
  function placeWindow() {
    winL = 0.25 + Math.random() * 0.55; winW = Math.max(0.07, 0.13 - swing * 0.012);
    win.style.left = (winL * 100) + '%'; win.style.width = (winW * 100) + '%';
  }
  function loop(t) {
    if (!running) return;
    var dt = last ? (t - last) / 1000 : 0; last = t;
    pos += dir * speed * dt;
    if (pos >= 1) { pos = 1; dir = -1; } if (pos <= 0) { pos = 0; dir = 1; }
    mark.style.left = 'calc(' + (pos * 100).toFixed(2) + '% - 4px)';
    raf = requestAnimationFrame(loop);
  }
  function startRound() {
    swing = 0; score = 0; perfects = 0; speed = 0.9; pos = 0; dir = 1; last = 0;
    swingEl.textContent = '0'; scoreEl.textContent = '0'; hpEl.style.width = '100%';
    placeWindow(); running = true; parryBtn.textContent = 'Parry';
    msg.textContent = 'Swing incoming. Parry in the window.';
    raf = requestAnimationFrame(loop);
  }
  function parry() {
    if (!running) { startRound(); return; }
    var centre = winL + winW / 2, d = Math.abs(pos - centre);
    var pts, label;
    if (d <= winW * 0.15) { pts = 100; label = 'Perfect parry!'; perfects++; }
    else if (d <= winW / 2) { pts = 50; label = 'Good parry.'; }
    else { pts = 0; label = 'Missed. The boss connects.'; }
    score += pts; swing++;
    swingEl.textContent = String(swing); scoreEl.textContent = String(score);
    hpEl.style.width = Math.max(0, 100 - score / 5) + '%';
    msg.textContent = label;
    if (pts) { game.classList.remove('hit'); void game.offsetWidth; game.classList.add('hit'); }
    unlock('practice');
    if (perfects >= 3) unlock('perfect');
    if (swing >= 5) {
      running = false; cancelAnimationFrame(raf);
      if (score > best) { best = score; store.set('best', best); bestEl.textContent = best; }
      msg.textContent = (score >= 400 ? 'Boss down. ' : 'Round over. ') + score + ' points. Parry to go again.';
      parryBtn.textContent = 'Play again';
      return;
    }
    speed += 0.18; placeWindow();
  }
  parryBtn.addEventListener('click', parry);
  document.addEventListener('keydown', function (e) {
    if (e.code !== 'Space' || e.repeat) return;
    var r = game.getBoundingClientRect();
    var tag = (document.activeElement && document.activeElement.tagName) || '';
    if (/INPUT|TEXTAREA|SELECT|BUTTON|SUMMARY|A/.test(tag)) return;
    if (r.top < window.innerHeight && r.bottom > 0) { e.preventDefault(); parry(); }
  });
  if (reduce) { speed = 0.6; }

  /* ---------- FAQ lore badge ---------- */
  var opened = {};
  $$('details').forEach(function (d, i) {
    d.addEventListener('toggle', function () {
      if (d.open) { opened[i] = 1; if (Object.keys(opened).length >= 3) unlock('lore'); }
    });
  });

  /* ---------- Secrets: footer coin and the code ---------- */
  var coin = $('[data-coin]');
  coin.addEventListener('click', function () { coin.classList.add('got'); unlock('secret'); });
  var seq = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a'], at = 0;
  document.addEventListener('keydown', function (e) {
    var k = e.key.length === 1 ? e.key.toLowerCase() : e.key;
    at = (k === seq[at]) ? at + 1 : (k === seq[0] ? 1 : 0);
    if (at === seq.length) { at = 0; unlock('secret'); }
  });

  /* ---------- Discord link ---------- */
  var disco = $('[data-discord]');
  if (CONFIG.discordUrl) { disco.href = CONFIG.discordUrl; disco.target = '_blank'; disco.rel = 'noopener'; }
  else { disco.href = '#join'; disco.textContent = 'Join the list'; }

  /* ---------- Host link preselects the role ---------- */
  $$('[data-role-link]').forEach(function (a) {
    a.addEventListener('click', function () {
      var r = $('input[name="role"][value="' + a.getAttribute('data-role-link') + '"]');
      if (r) r.checked = true;
    });
  });

  /* ---------- Signup ---------- */
  var form = $('[data-signup]'), formMsg = $('[data-form-msg]');
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var email = form.email.value.trim(), city = form.city.value.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { formMsg.textContent = 'That email doesn\'t look right. Check it and try again.'; form.email.focus(); return; }
    if (!city) { formMsg.textContent = 'Add your city so we know where to count you.'; form.city.focus(); return; }
    var go = $('.cell-go', form); go.disabled = true; go.textContent = 'Joining…';
    var body = {
      email: email, city: city, role: (form.querySelector('input[name="role"]:checked') || {}).value || 'player',
      main: chosenMain, founder: Object.keys(got).length >= ACH.length - 1, website: form.website.value
    };
    fetch('/api/signup', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      .then(function (r) { return r.json().then(function (d) { return { ok: r.ok, d: d }; }); })
      .then(function (res) {
        if (!res.ok) throw new Error(res.d && res.d.error || 'Something went wrong.');
        var d = res.d;
        formMsg.textContent = (d.isPlayer && d.count) ? 'You\'re in. Player ' + d.count + ' of 100 for ' + d.cityName + '.' : (d.isPlayer === false ? 'Thanks. We\'ll be in touch about hosting in ' + d.cityName + '.' : 'You\'re in. We\'ll email you when ' + d.cityName + ' unlocks.');
        if (d.isPlayer && d.citySlug === CONFIG.defaultCity && typeof d.count === 'number') showCount(d.count);
        unlock('joined');
        form.reset(); form.city.value = 'Los Angeles';
      })
      .catch(function (err) { formMsg.textContent = err.message || 'Something went wrong. Try again in a minute.'; })
      .then(function () { go.disabled = false; go.textContent = 'Join the party'; });
  });
})();
