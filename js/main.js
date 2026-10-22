/* Studio Riflesso — script principale. Nessuna libreria esterna.
   Legge i dati da config.js (window.SITE) e costruisce i contenuti. */
(() => {
  'use strict';
  const C = window.SITE;
  if (!C) return;
  window.SR_READY = true;

  /* ---------- Utilità ---------- */
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const html = document.documentElement;
  const S = C.salone;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = matchMedia('(hover: hover) and (pointer: fine)').matches;
  const MODO = html.dataset.modo === 'donna' || html.dataset.modo === 'uomo' ? html.dataset.modo : 'misto';
  let G = MODO === 'misto' ? (html.dataset.genere === 'uomo' ? 'uomo' : 'donna') : MODO;

  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const slug = s => String(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const easeIO = t => (t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
  const euro = n => '€' + (Number.isInteger(n) ? n : Number(n).toFixed(2).replace('.', ','));
  const durata = m => (m < 60 ? `${m} min` : `${Math.floor(m / 60)} h${m % 60 ? ' ' + (m % 60) + ' min' : ''}`);
  const testo = key => {
    const own = C.testi[G] && C.testi[G][key];
    return own !== undefined ? own : (C.testi.comune || {})[key];
  };
  // Campi che aprono la tastiera (non caselle, scelte o pulsanti)
  const isTextField = el => !!(el && el.matches && el.matches('textarea, select, input:not([type="checkbox"]):not([type="radio"]):not([type="button"]):not([type="submit"]):not([type="hidden"])'));
  const ico = id => `<svg class="ico" aria-hidden="true"><use href="#i-${id}"/></svg>`;
  const img = (base, alt, sizes, extra = '') =>
    `<img src="${base}-sm.webp" srcset="${base}-sm.webp 600w, ${base}.webp 1080w" sizes="${sizes}" alt="${esc(alt)}" width="600" height="750" loading="lazy" decoding="async"${extra}>`;

  /* ---------- Date e orari (sempre ora di Roma) ---------- */
  const romeFmt = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Europe/Rome', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23'
  });
  const romeNow = () => {
    const p = {};
    romeFmt.formatToParts(new Date()).forEach(x => { p[x.type] = x.value; });
    return { key: `${p.year}-${p.month}-${p.day}`, min: (+p.hour % 24) * 60 + +p.minute };
  };
  const parseKey = k => { const [y, m, d] = k.split('-').map(Number); return new Date(Date.UTC(y, m - 1, d)); };
  const addDays = (k, n) => { const d = parseKey(k); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); };
  const dowOf = k => parseKey(k).getUTCDay();
  const toMin = s => { const [h, m] = String(s).split(':').map(Number); return h * 60 + m; };
  const hm = m => `${Math.floor(m / 60)}:${String(m % 60).padStart(2, '0')}`;
  const hhmm = m => `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
  const ranges = dow => (C.orari[dow] || []).map(([a, b]) => [toMin(a), toMin(b)]);
  const GIORNI = ['domenica', 'lunedì', 'martedì', 'mercoledì', 'giovedì', 'venerdì', 'sabato'];
  const cap = s => s.charAt(0).toUpperCase() + s.slice(1);
  const dateLong = k => new Intl.DateTimeFormat('it-IT', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'UTC' }).format(parseKey(k));
  const dayShort = k => new Intl.DateTimeFormat('it-IT', { weekday: 'short', timeZone: 'UTC' }).format(parseKey(k)).replace('.', '');
  const monShort = k => new Intl.DateTimeFormat('it-IT', { month: 'short', timeZone: 'UTC' }).format(parseKey(k)).replace('.', '');
  const rangesText = rs => (rs.length ? rs.map(([a, b]) => `${hm(a)} – ${hm(b)}`).join(' e ') : 'Chiuso');

  function openStatus() {
    const n = romeNow();
    const now = ranges(dowOf(n.key)).find(([a, b]) => n.min >= a && n.min < b);
    if (now) return { open: true, text: `Aperto ora, chiude alle ${hm(now[1])}` };
    for (let i = 0; i < 8; i++) {
      const k = addDays(n.key, i);
      const next = ranges(dowOf(k)).find(([a]) => i > 0 || a > n.min);
      if (next) {
        const quando = i === 0 ? 'oggi' : i === 1 ? 'domani' : GIORNI[dowOf(k)];
        return { open: false, text: `Chiuso, riapre ${quando} alle ${hm(next[0])}` };
      }
    }
    return { open: false, text: 'Chiuso' };
  }

  /* ---------- Dati derivati ---------- */
  const SVC = {}, SVC_ID = {};
  ['donna', 'uomo'].forEach(g => {
    SVC[g] = (C.servizi[g] || []).map(cat => ({
      ...cat,
      voci: cat.voci.map(v => {
        const item = { ...v, id: `${g}-${slug(cat.categoria)}-${slug(v.nome)}`, cat: cat.categoria, g };
        SVC_ID[item.id] = item;
        return item;
      })
    }));
  });
  C.operatori.forEach(o => { o.id = slug(o.nome); });
  const operatori = () => C.operatori.filter(o => o.genere === 'entrambi' || o.genere === G);
  const opById = id => C.operatori.find(o => o.id === id);

  const tel = 'tel:' + String(S.telefono).replace(/[^\d+]/g, '');
  const waNum = String(S.whatsapp).replace(/\D/g, '');
  const waLink = msg => `https://wa.me/${waNum}?text=${encodeURIComponent(msg)}`;
  const I = S.indirizzo;
  const indirizzo = `${I.via}, ${I.cap} ${I.citta} (${I.provincia})`;
  const mapsQuery = encodeURIComponent(`${I.via}, ${I.cap} ${I.citta}`);

  /* =====================================================================
     CONTENUTI FISSI (non cambiano con Donna / Uomo)
     ===================================================================== */
  function renderStatic() {
    if (MODO !== 'misto') $$('[data-switch]').forEach(el => el.remove());

    if (C.seo) {
      document.title = C.seo.titolo[MODO] || document.title;
      const d = $('meta[name="description"]');
      if (d && C.seo.descrizione[MODO]) d.setAttribute('content', C.seo.descrizione[MODO]);
    }

    $$('[data-tel]').forEach(a => { a.href = tel; });
    $$('[data-wa]').forEach(a => { a.href = waLink(`Ciao ${S.nome}, vorrei un'informazione.`); });
    $$('[data-mail]').forEach(a => { a.href = 'mailto:' + S.email; });
    $$('[data-directions]').forEach(a => { a.href = `https://www.google.com/maps/dir/?api=1&destination=${mapsQuery}`; });
    $$('[data-salon]').forEach(el => { const v = S[el.dataset.salon]; if (v != null) el.textContent = v; });
    $$('[data-address]').forEach(el => { el.textContent = indirizzo; });
    $$('[data-year]').forEach(el => { el.textContent = new Date().getFullYear(); });
    $$('.menu__nav a').forEach((a, i) => a.style.setProperty('--i', i));

    // Social
    const soc = [['instagram', 'ig', 'Instagram'], ['facebook', 'fb', 'Facebook'], ['tiktok', 'tt', 'TikTok']]
      .filter(([k]) => S.social && S.social[k])
      .map(([k, i, n]) => `<a href="${esc(S.social[k])}" target="_blank" rel="noopener" aria-label="${n}">${ico(i)}</a>`).join('');
    $$('[data-socials]').forEach(el => { el.innerHTML = soc; });

    // Orari (lunedì → domenica) con il giorno di oggi evidenziato
    const todayDow = dowOf(romeNow().key);
    const order = [1, 2, 3, 4, 5, 6, 0];
    const table = $('[data-hours]');
    if (table) {
      table.innerHTML = `<caption class="sr-only">Orari di apertura</caption><tbody>${order.map(d => {
        const today = d === todayDow;
        return `<tr${today ? ' class="is-today"' : ''}><th scope="row">${cap(GIORNI[d])}${today ? '<span class="today-tag">Oggi</span>' : ''}</th><td>${rangesText(ranges(d))}</td></tr>`;
      }).join('')}</tbody>`;
    }
    // Orari in breve per il footer
    const groups = [];
    order.forEach(d => {
      const txt = rangesText(ranges(d));
      const last = groups[groups.length - 1];
      if (last && last.txt === txt && txt !== 'Chiuso') last.days.push(d); else groups.push({ txt, days: [d] });
    });
    const open = groups.filter(gr => gr.txt !== 'Chiuso').map(gr => {
      const name = gr.days.length > 1 ? `${cap(GIORNI[gr.days[0]])} – ${GIORNI[gr.days[gr.days.length - 1]]}` : cap(GIORNI[gr.days[0]]);
      return `<p>${name}: ${gr.txt}</p>`;
    });
    const closed = order.filter(d => !ranges(d).length).map(d => GIORNI[d]);
    if (closed.length) open.push(`<p>${cap(closed.join(' e ').replace(/ e (?=.* e )/g, ', '))}: chiuso</p>`);
    $$('[data-hours-short]').forEach(el => { el.innerHTML = open.join(''); });

    // Mappa
    const map = $('[data-map]');
    if (map) map.innerHTML = `<iframe src="https://www.google.com/maps?q=${mapsQuery}&output=embed" loading="lazy" referrerpolicy="no-referrer-when-downgrade" title="Mappa: ${esc(indirizzo)}"></iframe>`;

    // Foto della prenotazione
    const bm = $('[data-book-media]');
    if (bm && C.media.prenota) bm.innerHTML = `<div class="media__zoom"><div class="media__par" data-parallax=".07">${img(C.media.prenota, C.media.prenotaAlt, '(min-width: 960px) 36vw, 1px')}</div></div>`;

    // Contatori
    const stats = $('[data-stats]');
    if (stats) {
      const nOps = MODO === 'misto' ? C.operatori.length : C.operatori.filter(o => o.genere === 'entrambi' || o.genere === MODO).length;
      stats.innerHTML = C.numeri.map((n, i) => {
        const v = n.valore === 'operatori' ? nOps : Number(n.valore);
        return `<div class="stat" data-reveal style="--i:${i}"><dt>${esc(n.testo)}</dt><dd data-count="${v}" data-suffix="${esc(n.suffisso || '')}">${reduce ? v.toLocaleString('it-IT') + (n.suffisso || '') : '0'}</dd></div>`;
      }).join('');
    }

    // Stato aperto / chiuso
    const st = () => {
      const s = openStatus();
      $$('[data-status-text]').forEach(el => { el.textContent = s.text; });
      html.classList.toggle('is-open-now', s.open);
    };
    st();
    setInterval(st, 60000);

    // Dati strutturati per Google (HairSalon)
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const ohs = [];
    [0, 1, 2, 3, 4, 5, 6].forEach(d => (C.orari[d] || []).forEach(([a, b]) => ohs.push({ '@type': 'OpeningHoursSpecification', dayOfWeek: `https://schema.org/${days[d]}`, opens: a, closes: b })));
    const ld = document.createElement('script');
    ld.type = 'application/ld+json';
    ld.textContent = JSON.stringify({
      '@context': 'https://schema.org', '@type': 'HairSalon', name: S.nome, slogan: S.slogan, url: S.url,
      image: S.url + 'assets/img/og.jpg', logo: S.url + 'assets/logo.svg', telephone: S.telefono, email: S.email,
      priceRange: S.fasciaPrezzo,
      address: { '@type': 'PostalAddress', streetAddress: I.via, postalCode: I.cap, addressLocality: I.citta, addressRegion: I.provincia, addressCountry: 'IT' },
      areaServed: I.citta, openingHoursSpecification: ohs,
      sameAs: Object.values(S.social || {}).filter(Boolean)
    });
    document.head.append(ld);
  }

  /* =====================================================================
     TESTI CHE ENTRANO PAROLA PER PAROLA / RIGA PER RIGA
     ===================================================================== */
  function splitWords(el, text) {
    const words = String(text).trim().split(/\s+/);
    el.classList.add('is-split');
    el.innerHTML = `<span class="sr-only">${esc(text)}</span>` +
      words.map((w, i) => `<span class="w" aria-hidden="true"><span class="wi" style="--w:${i}">${esc(w)}</span></span>`).join(' ');
  }
  function renderTexts() {
    $$('[data-t]').forEach(el => {
      const v = testo(el.dataset.t);
      if (v == null) return;
      if (el.hasAttribute('data-lines') || el.hasAttribute('data-words')) {
        el.classList.remove('is-in');
        splitWords(el, v);
      } else {
        el.textContent = v;
      }
    });
    const h1 = $('.hero__title'), refl = $('[data-reflect]');
    if (h1 && refl) refl.innerHTML = $$('.w', h1).map(w => w.outerHTML).join(' ');
  }

  /* =====================================================================
     ANIMAZIONI DI INGRESSO (IntersectionObserver)
     ===================================================================== */
  function countUp(el) {
    const end = Number(el.dataset.count) || 0, suf = el.dataset.suffix || '';
    if (reduce) { el.textContent = end.toLocaleString('it-IT') + suf; return; }
    const t0 = performance.now(), dur = 1800;
    const tick = now => {
      const p = clamp((now - t0) / dur), e = 1 - Math.pow(2, -10 * p);
      el.textContent = Math.round(end * (p === 1 ? 1 : e)).toLocaleString('it-IT') + suf;
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }
  function reveal(el) {
    if (el.hasAttribute('data-lines')) {
      let top = null, line = -1;
      $$('.w', el).forEach(w => {
        const y = w.offsetTop;
        if (top === null || y > top + 3) { line++; top = y; }
        w.style.setProperty('--l', line);
      });
    }
    if (el.hasAttribute('data-count')) countUp(el);
    el.classList.add('is-in');
  }
  const io = 'IntersectionObserver' in window
    ? new IntersectionObserver(entries => entries.forEach(e => {
      if (e.isIntersecting) { io.unobserve(e.target); reveal(e.target); }
    }), { rootMargin: '0px 0px -8% 0px', threshold: 0.08 })
    : null;
  function observe(root = document) {
    $$('[data-reveal], [data-lines], [data-curtain], [data-count]', root).forEach(el => {
      if (el.classList.contains('is-in')) return;
      if (io) io.observe(el); else reveal(el);
    });
  }

  /* =====================================================================
     HERO: video, foto di riserva con effetto Ken Burns, dissolvenze
     ===================================================================== */
  const heroMedia = $('[data-hero-media]');
  const portrait = matchMedia('(max-aspect-ratio: 4/5)').matches;
  const saveData = !!(navigator.connection && navigator.connection.saveData);
  let heroVisible = true;

  function heroLayer(g) {
    let layer = $(`.hero__layer[data-g="${g}"]`, heroMedia);
    if (layer) return layer;
    const m = C.media[g];
    layer = document.createElement('div');
    layer.className = 'hero__layer';
    layer.dataset.g = g;
    layer.innerHTML = `<picture><source media="(max-aspect-ratio: 4/5)" srcset="${m.heroFotoMobile}"><img src="${m.heroFoto}" alt="" decoding="async" fetchpriority="high"></picture>`;
    heroMedia.append(layer);
    if (!reduce && !saveData && m.heroVideo) {
      const v = document.createElement('video');
      v.muted = true; v.defaultMuted = true; v.loop = true; v.playsInline = true; v.preload = 'auto';
      ['muted', 'playsinline', 'loop', 'disablepictureinpicture'].forEach(a => v.setAttribute(a, ''));
      v.setAttribute('aria-hidden', 'true');
      v.src = portrait && m.heroVideoMobile ? m.heroVideoMobile : m.heroVideo;
      const kenBurns = () => layer.classList.add('is-kb');
      v.addEventListener('playing', () => { v.classList.add('is-playing'); layer.classList.remove('is-kb'); });
      v.addEventListener('error', () => { kenBurns(); v.remove(); layer._video = null; }, { once: true });
      setTimeout(() => { if (!v.classList.contains('is-playing')) kenBurns(); }, 2500);
      layer.append(v);
      layer._video = v;
    } else if (!reduce) {
      layer.classList.add('is-kb');
    }
    return layer;
  }
  function playVideo(layer) {
    const v = layer && layer._video;
    if (!v) return;
    const p = v.play();
    if (p && p.catch) p.catch(() => layer.classList.add('is-kb'));
  }
  function showHero(g) {
    const active = heroLayer(g);
    $$('.hero__layer', heroMedia).forEach(l => {
      const on = l === active;
      l.classList.toggle('is-on', on);
      if (on && heroVisible) playVideo(l);
      if (!on && l._video) setTimeout(() => { if (!l.classList.contains('is-on')) l._video.pause(); }, 1500);
    });
  }
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(([e]) => {
      heroVisible = e.isIntersecting;
      const l = $('.hero__layer.is-on', heroMedia);
      if (!l || !l._video) return;
      if (heroVisible) playVideo(l); else l._video.pause();
    }).observe($('.hero'));
  }

  /* =====================================================================
     LO SPECCHIO (Chi siamo): foto che si allarga allo scorrimento
     ===================================================================== */
  const M = {
    el: $('[data-mirror]'), sticky: $('.mirror__sticky'), frame: $('[data-mirror-frame]'), zoom: $('[data-mirror-zoom]'),
    veil: $('[data-mirror-veil]'), cap: $('[data-mirror-caption]'), glint: $('[data-mirror-glint]'),
    top: 0, h: 0, sw: 0, sh: 0, aw: 0, ah: 0
  };
  function mirrorLayer(g) {
    let l = $(`.mirror__layer[data-g="${g}"]`, M.zoom);
    if (l) return l;
    const m = C.media[g];
    l = document.createElement('div');
    l.className = 'mirror__layer';
    l.dataset.g = g;
    l.innerHTML = `<picture><source media="(max-aspect-ratio: 1/1)" srcset="${m.chiSiamo}-mobile.webp"><img src="${m.chiSiamo}.webp" alt="${esc(m.chiSiamoAlt)}" loading="lazy" decoding="async"></picture>`;
    M.zoom.append(l);
    return l;
  }
  function showMirror(g) {
    const a = mirrorLayer(g);
    $$('.mirror__layer', M.zoom).forEach(l => l.classList.toggle('is-on', l === a));
  }

  /* =====================================================================
     CONTENUTI CHE CAMBIANO CON DONNA / UOMO
     ===================================================================== */
  function swapImage(par, base, alt, sizes) {
    if (!par) return;
    const old = $$('img', par);
    if (old.length && old[old.length - 1].dataset.base === base) return;
    const wrap = document.createElement('div');
    wrap.innerHTML = img(base, alt, sizes, ` data-base="${base}"`);
    const n = wrap.firstChild;
    if (old.length) {
      n.classList.add('is-new');
      n.addEventListener('load', () => {
        requestAnimationFrame(() => n.classList.remove('is-new'));
        setTimeout(() => old.forEach(o => o.remove()), 900);
      }, { once: true });
      n.loading = 'eager';
    }
    par.append(n);
  }

  function renderAbout() {
    const box = $('[data-about-text]');
    if (box) box.innerHTML = (testo('chiSiamoTesto') || []).map(p => `<p>${esc(p)}</p>`).join('');
    const pts = $('[data-points]');
    if (pts) pts.innerHTML = (testo('punti') || []).map((p, i) =>
      `<li class="point" data-reveal style="--i:${i}"><h3>${esc(p.titolo)}</h3><p>${esc(p.testo)}</p></li>`).join('');
  }

  function renderTicker() {
    const track = $('.ticker__track');
    if (!track) return;
    const names = SVC[G].map(c => c.categoria);
    const group = names.map(n => `<span class="ticker__item">${esc(n)}</span><span class="ticker__sep"></span>`).join('');
    track.innerHTML = `<div class="ticker__group">${group}${group}</div><div class="ticker__group">${group}${group}</div>`;
  }

  const svcRow = v => `<li class="svc">
      <span class="svc__name">${esc(v.nome)}</span><span class="svc__lead" aria-hidden="true"></span>
      <span class="svc__price"><small>da</small>${euro(v.prezzo)}</span>
      <span class="svc__meta">${durata(v.durata)}</span>
      <button class="svc__book" type="button" data-book-service="${v.id}" aria-label="Prenota questo: ${esc(v.nome)}">Prenota questo</button>
    </li>`;
  const catFrom = cat => Math.min(...cat.voci.map(v => v.prezzo));

  function renderServices() {
    const cats = SVC[G];
    const main = cats.filter(c => c.inEvidenza);
    const rest = cats.filter(c => !c.inEvidenza);
    const box = $('[data-cats]');
    if (box) box.innerHTML = main.map((c, i) => `
      <article class="cat" data-reveal style="--i:${i}">
        <div class="cat__head"><h3 class="cat__name">${esc(c.categoria)}</h3><span class="cat__from">da ${euro(catFrom(c))}</span></div>
        <p class="cat__desc">${esc(c.descrizione)}</p>
        <ul>${c.voci.slice(0, 2).map(svcRow).join('')}</ul>
      </article>`).join('');
    const total = cats.reduce((n, c) => n + c.voci.length, 0);
    const more = $('[data-more-text]');
    if (more) more.textContent = rest.length
      ? `Nel listino completo anche: ${rest.map(c => c.categoria.toLowerCase()).join(', ')}.`
      : `Il listino completo ha ${total} servizi.`;
    const btn = $('[data-open-listino]');
    if (btn) btn.textContent = `Vedi tutto il listino (${total})`;

    const media = $('[data-services-media]');
    if (media) {
      if (!$('.media__par', media)) media.innerHTML = '<div class="media__zoom"><div class="media__par" data-parallax=".06"></div></div>';
      swapImage($('.media__par', media), C.media[G].servizi, C.media[G].serviziAlt, '(min-width: 900px) 40vw, 100vw');
    }
    if (listino.open) renderListino();
  }

  function renderTeam() {
    const box = $('[data-team]');
    if (!box) return;
    box.innerHTML = operatori().map((o, i) => `
      <article class="member" data-reveal style="--i:${i}">
        <div class="member__photo media" data-curtain style="--i:${i}"><div class="media__zoom">${img(o.foto, o.alt, '(min-width: 900px) 30vw, 76vw')}</div></div>
        <h3 class="member__name">${esc(o.nome)}</h3>
        <p class="member__role">${esc(o.ruolo)}</p>
        <p class="member__spec">${esc(o.specialita)}</p>
        <button class="btn btn--line btn--sm" type="button" data-book-op="${o.id}">Prenota con me</button>
      </article>`).join('');
    box.scrollLeft = 0;
  }

  /* ---------- Galleria ---------- */
  const gal = { track: $('[data-gal]'), items: [], now: $('[data-gal-now]'), tot: $('[data-gal-tot]'), bar: $('[data-gal-bar]'), idx: 0, ticking: false };
  const pad2 = n => String(n).padStart(2, '0');
  function renderGallery() {
    if (!gal.track) return;
    const list = C.galleria[G] || [];
    gal.track.innerHTML = list.map((f, i) => `
      <figure class="gal__item" aria-label="${i + 1} di ${list.length}">
        <div class="gal__fig">
          <div class="gal__img media">${img(f.foto, f.alt, '(min-width: 900px) 31vw, 74vw', i < 2 ? ' fetchpriority="low"' : '')}</div>
          <figcaption class="gal__cap"><strong>${esc(f.titolo)}</strong><span>${esc(f.servizio)}</span></figcaption>
        </div>
      </figure>`).join('');
    gal.items = $$('.gal__item', gal.track).map(el => ({ el, fig: $('.gal__fig', el) }));
    gal.tot.textContent = pad2(list.length);
    gal.track.scrollLeft = 0;
    galMeasure();
    galUpdate();
  }
  function galMeasure() {
    gal.items.forEach(it => { it.c = it.el.offsetLeft + it.el.offsetWidth / 2; it.w = it.el.offsetWidth; });
  }
  function galUpdate() {
    gal.ticking = false;
    if (!gal.items.length) return;
    const center = gal.track.scrollLeft + gal.track.clientWidth / 2;
    let best = 0, bestD = Infinity;
    gal.items.forEach((it, i) => {
      const d = (it.c - center) / (it.w || 1);
      const a = Math.min(Math.abs(d), 1);
      if (!reduce) {
        it.fig.style.transform = `scale(${(1 - a * 0.1).toFixed(4)})`;
        it.fig.style.opacity = (1 - a * 0.5).toFixed(3);
      }
      if (Math.abs(d) < bestD) { bestD = Math.abs(d); best = i; }
    });
    gal.idx = best;
    gal.now.textContent = pad2(best + 1);
    gal.bar.style.transform = `scaleX(${((best + 1) / gal.items.length).toFixed(4)})`;
  }
  function galGo(dir) {
    const next = clamp(gal.idx + dir, 0, gal.items.length - 1);
    const it = gal.items[next];
    if (!it) return;
    gal.track.scrollTo({ left: it.c - gal.track.clientWidth / 2, behavior: reduce ? 'auto' : 'smooth' });
  }
  if (gal.track) {
    gal.track.addEventListener('scroll', () => { if (!gal.ticking) { gal.ticking = true; requestAnimationFrame(galUpdate); } }, { passive: true });
    $('[data-gal-prev]').addEventListener('click', () => galGo(-1));
    $('[data-gal-next]').addEventListener('click', () => galGo(1));
    gal.track.addEventListener('keydown', e => {
      if (e.key === 'ArrowRight') { e.preventDefault(); galGo(1); }
      if (e.key === 'ArrowLeft') { e.preventDefault(); galGo(-1); }
    });
    // Trascinamento con il mouse (sul telefono lo scorrimento è nativo)
    let drag = null;
    gal.track.addEventListener('pointerdown', e => {
      if (e.pointerType !== 'mouse' || e.button !== 0) return;
      drag = { x: e.clientX, left: gal.track.scrollLeft, moved: false };
    });
    window.addEventListener('pointermove', e => {
      if (!drag) return;
      const dx = e.clientX - drag.x;
      if (!drag.moved && Math.abs(dx) > 4) { drag.moved = true; gal.track.classList.add('is-drag'); }
      if (drag.moved) gal.track.scrollLeft = drag.left - dx;
    });
    window.addEventListener('pointerup', () => {
      if (!drag) return;
      const moved = drag.moved;
      drag = null;
      if (!moved) return;
      gal.track.classList.remove('is-drag');
      const it = gal.items[gal.idx];
      if (it) gal.track.scrollTo({ left: it.c - gal.track.clientWidth / 2, behavior: reduce ? 'auto' : 'smooth' });
    });
  }

  /* ---------- Avanzamento del carosello team (telefono) ---------- */
  const teamTrack = $('[data-team]'), teamBar = $('[data-track-bar="team"]');
  function teamProgress() {
    if (!teamTrack || !teamBar) return;
    const max = teamTrack.scrollWidth - teamTrack.clientWidth;
    const vis = teamTrack.clientWidth / (teamTrack.scrollWidth || 1);
    const p = max > 0 ? teamTrack.scrollLeft / max : 0;
    teamBar.style.transform = `translate3d(${(p * (1 - vis) * 100).toFixed(2)}%, 0, 0) scaleX(${vis.toFixed(4)})`;
  }
  if (teamTrack) teamTrack.addEventListener('scroll', () => requestAnimationFrame(teamProgress), { passive: true });

  /* ---------- Recensioni ---------- */
  const rv = { stage: $('[data-rv-stage]'), dots: $('[data-rv-dots]'), i: 0, n: 0, timer: null, paused: false, visible: false };
  function renderReviews() {
    if (!rv.stage) return;
    const list = C.recensioni[G] || [];
    rv.n = list.length;
    rv.i = 0;
    const stars = Array.from({ length: 5 }, () => ico('star')).join('');
    rv.stage.innerHTML = list.map((r, i) => `
      <figure class="rv__slide${i === 0 ? ' is-active' : ''}" role="group" aria-roledescription="recensione" aria-label="${i + 1} di ${list.length}"${i ? ' aria-hidden="true"' : ''}>
        <blockquote class="rv__quote"><p>«${esc(r.testo)}»</p></blockquote>
        <div class="rv__stars" aria-label="5 stelle su 5">${stars}</div>
        <figcaption class="rv__who">${esc(r.autore)} <span>per ${esc(r.servizio)}</span></figcaption>
      </figure>`).join('');
    rv.dots.innerHTML = list.map((_, i) => `<button type="button" aria-label="Recensione ${i + 1}"${i === 0 ? ' aria-current="true"' : ''}></button>`).join('');
  }
  function rvShow(i) {
    if (!rv.n) return;
    rv.i = (i + rv.n) % rv.n;
    $$('.rv__slide', rv.stage).forEach((s, k) => { s.classList.toggle('is-active', k === rv.i); s.setAttribute('aria-hidden', String(k !== rv.i)); });
    $$('button', rv.dots).forEach((b, k) => (k === rv.i ? b.setAttribute('aria-current', 'true') : b.removeAttribute('aria-current')));
  }
  function rvAuto() {
    clearInterval(rv.timer);
    if (!reduce && rv.visible && !rv.paused) rv.timer = setInterval(() => rvShow(rv.i + 1), 7000);
  }
  if (rv.stage) {
    $('[data-rv-prev]').addEventListener('click', () => { rvShow(rv.i - 1); rvAuto(); });
    $('[data-rv-next]').addEventListener('click', () => { rvShow(rv.i + 1); rvAuto(); });
    rv.dots.addEventListener('click', e => { const b = e.target.closest('button'); if (b) { rvShow($$('button', rv.dots).indexOf(b)); rvAuto(); } });
    const box = $('[data-rv]');
    box.addEventListener('pointerenter', () => { rv.paused = true; rvAuto(); });
    box.addEventListener('pointerleave', () => { rv.paused = false; rvAuto(); });
    box.addEventListener('focusin', () => { rv.paused = true; rvAuto(); });
    box.addEventListener('focusout', () => { rv.paused = false; rvAuto(); });
    let sx = null;
    rv.stage.addEventListener('pointerdown', e => { sx = e.clientX; });
    rv.stage.addEventListener('pointerup', e => {
      if (sx === null) return;
      const dx = e.clientX - sx;
      sx = null;
      if (Math.abs(dx) > 40) { rvShow(rv.i + (dx < 0 ? 1 : -1)); rvAuto(); }
    });
    if ('IntersectionObserver' in window) new IntersectionObserver(([e]) => { rv.visible = e.isIntersecting; rvAuto(); }).observe(box);
  }

  /* ---------- Domande frequenti ---------- */
  function renderFaq() {
    const box = $('[data-faq]');
    if (!box) return;
    box.innerHTML = C.faq.filter(f => f.genere === 'tutti' || f.genere === G).map((f, i) => {
      const r = typeof f.risposta === 'string' ? f.risposta : f.risposta[G];
      return `<div class="qa" data-reveal style="--i:${i}">
        <h3><button class="qa__btn" type="button" aria-expanded="false" aria-controls="qa-${i}" id="qa-b-${i}">${esc(f.domanda)}<span class="qa__icon">${ico('plus')}</span></button></h3>
        <div class="qa__panel" id="qa-${i}" role="region" aria-labelledby="qa-b-${i}" inert><div><p>${esc(r)}</p></div></div>
      </div>`;
    }).join('');
  }
  document.addEventListener('click', e => {
    const b = e.target.closest('.qa__btn');
    if (!b) return;
    const open = b.getAttribute('aria-expanded') !== 'true';
    const panel = document.getElementById(b.getAttribute('aria-controls'));
    b.setAttribute('aria-expanded', String(open));
    panel.classList.toggle('is-open', open);
    open ? panel.removeAttribute('inert') : panel.setAttribute('inert', '');
    setTimeout(measure, 600);
  });

  /* ---------- Listino completo ---------- */
  const listino = { dlg: $('[data-listino]'), open: false };
  function renderListino() {
    $('[data-listino-title]').textContent = 'Listino completo';
    $('[data-listino-body]').innerHTML = SVC[G].map(c => `
      <section class="cat">
        <div class="cat__head"><h3 class="cat__name">${esc(c.categoria)}</h3><span class="cat__from">da ${euro(catFrom(c))}</span></div>
        <p class="cat__desc">${esc(c.descrizione)}</p>
        <ul>${c.voci.map(svcRow).join('')}</ul>
      </section>`).join('') + '<p class="sheet__note">Prezzi di partenza, IVA inclusa. Il totale dipende da lunghezza e quantità dei capelli.</p>';
  }
  function openListino() {
    const d = listino.dlg;
    if (!d || listino.open) return;
    renderListino();
    listino.open = true;
    d.showModal();
    html.classList.add('sheet-open');
    requestAnimationFrame(() => requestAnimationFrame(() => d.classList.add('is-open')));
    $('[data-listino-body]').scrollTop = 0;
  }
  function closeListino() {
    const d = listino.dlg;
    if (!d || !listino.open) return;
    listino.open = false;
    d.classList.remove('is-open');
    html.classList.remove('sheet-open');
    setTimeout(() => { if (!listino.open && d.open) d.close(); }, reduce ? 260 : 620);
  }
  if (listino.dlg) {
    $('[data-open-listino]').addEventListener('click', openListino);
    $('[data-close-listino]').addEventListener('click', closeListino);
    listino.dlg.addEventListener('cancel', e => { e.preventDefault(); closeListino(); });
    listino.dlg.addEventListener('click', e => { if (e.target === listino.dlg) closeListino(); });
  }

  /* =====================================================================
     PRENOTAZIONE A PASSAGGI
     Con Agendo attivo (config.js → agendo) il modulo legge servizi, operatori
     e orari liberi da Agendo e salva lì la richiesta. Se Agendo non risponde,
     torna da solo a WhatsApp. Con Agendo spento funziona come prima
     (Web3Forms o modalità demo, più WhatsApp).
     ===================================================================== */
  const P = C.prenotazione || {};
  const KEY = String(P.web3formsKey || '').trim();
  const DEMO = !KEY;
  const STEP_NAMES = ['Servizio', 'Operatore', 'Giorno e ora', 'I tuoi dati'];
  const B = { step: 1, svc: null, op: 'any', date: null, time: null, cat: null };
  const F = $('[data-bform]');
  const ui = F && {
    err: $('[data-error]', F), help: $('[data-error-actions]', F), back: $('[data-back]', F), next: $('[data-next]', F), wa: $('[data-wa-book]', F),
    bar: $('[data-step-bar]', F), label: $('[data-step-label]', F), nav: $('[data-nav-row]', F), note: $('[data-demo-note]', F),
    cats: $('[data-svc-cats]', F), opts: $('[data-svc-opts]', F), ops: $('[data-op-opts]', F),
    days: $('[data-days]', F), dateIn: $('[data-date-input]', F), slots: $('[data-slots]', F),
    name: $('[data-in="name"]', F), phone: $('[data-in="phone"]', F), notes: $('[data-in="notes"]', F), privacy: $('[data-in="privacy"]', F),
    summary: $('[data-summary]', F), doneSummary: $('[data-done-summary]', F),
    sumTitle: $('[data-summary-title]', F), sumNote: $('[data-summary-note]', F),
    doneText: $('[data-done-text]', F), addcal: $('[data-addcal]', F), after: $('[data-done-after]', F)
  };
  let recap = null;

  const todayKey = () => romeNow().key;
  const forG = g => g === G || g === 'entrambi';
  const withTimeout = (p, ms) => Promise.race([p, new Promise((_, no) => setTimeout(() => no(new Error('timeout')), ms))]);
  // Scrive l'HTML solo se è cambiato (così gli aggiornamenti in tempo reale non fanno sfarfallare)
  const setHTML = (el, h) => { if (el._h !== h) { el._h = h; el.innerHTML = h; } };
  const cleanName = v => v.trim().replace(/\s+/g, ' ').slice(0, 80);
  const cleanPhone = v => {
    let p = v.replace(/[^\d+ ]/g, ' ').replace(/(?!^)\+/g, '').replace(/\s+/g, ' ').trim();
    if (p.length > 20) p = p.replace(/ /g, '');
    return p;
  };

  /* ---------- Agendo ---------- */
  const AGC = C.agendo || {};
  // Stato: 'off' (non usato), 'idle', 'loading', 'ready', 'failed' (si torna a WhatsApp)
  const AG = { state: AGC.attivo === true && AGC.idSalone && AGC.firebase ? 'idle' : 'off', mod: null, api: null, svc: {}, busy: {}, stops: {}, timers: {}, other: null };
  const agOn = () => AG.state === 'idle' || AG.state === 'loading' || AG.state === 'ready';
  const agReady = () => AG.state === 'ready';
  const waOnly = () => AG.state === 'failed';
  // Conferma automatica accesa in Agendo (Impostazioni → Sito web): niente "richiesta", prenotazione subito confermata
  const autoConfirm = () => agReady() && AG.api.business.website?.autoConfirm === true;

  // Firebase si scarica solo qui: quando il visitatore arriva alla prenotazione
  function agStart() {
    if (AG.state !== 'idle') return;
    AG.state = F.dataset.agendo = 'loading';
    withTimeout((async () => {
      const mod = await import(new URL('js/agendo.js', document.baseURI).href);
      const api = await mod.connect({ idSalone: AGC.idSalone, firebase: AGC.firebase, appCheckSiteKey: AGC.appCheckSiteKey });
      return { mod, api };
    })(), 12000).then(({ mod, api }) => {
      if (AG.state !== 'loading') return;
      AG.mod = mod;
      AG.api = api;
      api.business.services.forEach(s => {
        AG.svc[s.id] = { id: s.id, nome: s.name, durata: s.durationMin, prezzo: s.price, da: s.priceFrom !== false, cat: s.category || 'Servizi', g: s.gender || 'entrambi', raw: s };
      });
      AG.state = F.dataset.agendo = 'ready';
      agWatch('strip', todayKey(), addDays(todayKey(), 13));
      agRefresh(true);
    }).catch(agFail);
  }
  function agFail(err) {
    if (!agOn()) return;
    console.warn('Agendo non risponde: il modulo passa a WhatsApp.', err);
    AG.state = F.dataset.agendo = 'failed';
    Object.values(AG.stops).forEach(stop => stop());
    Object.values(AG.timers).forEach(clearTimeout);
    AG.stops = {};
    agRefresh(true);
  }
  // Orari occupati in tempo reale per un intervallo di giorni
  function agWatch(key, from, to) {
    if (!agReady() || AG.stops[key]) return;
    AG.timers[key] = setTimeout(() => agFail(new Error('orari non arrivati')), 12000);
    AG.stops[key] = AG.api.watchBusy(from, to, byDate => {
      clearTimeout(AG.timers[key]);
      for (let k = from; k <= to; k = addDays(k, 1)) AG.busy[k] = byDate[k] || {};
      agRefresh(false);
    }, agFail);
  }
  // Giorno scelto dal calendario, oltre i 14 della striscia
  function agWatchOther(k) {
    if (!agReady() || !k || k <= addDays(todayKey(), 13) || AG.other === k) return;
    if (AG.stops.other) { AG.stops.other(); clearTimeout(AG.timers.other); delete AG.stops.other; }
    if (AG.other) delete AG.busy[AG.other];
    AG.other = k;
    agWatch('other', k, k);
  }
  // Ridisegna il modulo con i dati nuovi, senza perdere le scelte fatte
  function agRefresh(full) {
    if (!F) return;
    if (!full) { if (B.step === 3) renderStep3(); return; }
    showNote();
    if (B.svc && !bkSvc(B.svc)) { B.svc = null; B.time = null; }
    if (B.op !== 'any' && !bkOps().some(o => o.id === B.op)) B.op = 'any';
    go(B.step >= 2 && B.step <= 5 && !B.svc ? 1 : B.step, { focus: false });
  }
  // Un giorno con Agendo: orari liberi (null = dati ancora in arrivo)
  function agDay(k) {
    const s = AG.svc[B.svc], biz = AG.api.business;
    if (!s || !AG.mod.openRanges(biz, k).length) return { free: [], slots: [], why: 'chiuso' };
    const busy = AG.busy[k];
    if (!busy) return null;
    const staff = biz.staff.filter(p => forG(p.gender || 'entrambi'));
    const list = AG.mod.eligibleStaff(s.raw, staff, B.op === 'any' ? null : B.op);
    const slots = AG.mod.appointmentSlots(biz, k, s.raw, list, busy);
    const free = slots.filter(x => x.free).map(x => x.start);
    return { free, slots, why: free.length ? '' : slots.some(x => x.reason === 'full') ? 'pieno' : 'chiuso' };
  }

  /* ---------- Servizi e operatori: da Agendo o da config.js ---------- */
  const bkSvc = id => (agReady() ? AG.svc[id] : SVC_ID[id]);
  function bkCats() {
    if (!agReady()) return SVC[G];
    const cats = [];
    Object.values(AG.svc).filter(s => forG(s.g)).forEach(s => {
      let c = cats.find(x => x.categoria === s.cat);
      if (!c) cats.push(c = { categoria: s.cat, voci: [] });
      c.voci.push(s);
    });
    return cats;
  }
  const agPerson = p => ({ id: p.id, nome: p.name, ruolo: p.role || '', foto: (opById(p.id) || {}).foto });
  function bkOps() {
    if (!agReady()) return operatori();
    const s = AG.svc[B.svc];
    const staff = AG.api.business.staff.filter(p => forG(p.gender || 'entrambi'));
    return (s ? AG.mod.eligibleStaff(s.raw, staff) : staff).map(agPerson);
  }
  function bkOp(id) {
    if (!agReady()) return opById(id);
    const p = AG.api.business.staff.find(x => x.id === id);
    return p && agPerson(p);
  }
  const priceText = s => (s.prezzo == null ? '' : `${s.da === false ? '' : 'da '}${euro(s.prezzo)}`);

  /* ---------- Giorni e orari ---------- */
  const maxDays = () => (agReady() ? AG.api.business.booking.maxDaysAhead : P.giorniPrenotabili || 60);
  const maxKey = () => addDays(todayKey(), maxDays());
  // Orari liberi di un giorno, in minuti (null = in arrivo da Agendo)
  function slotsFor(k) {
    if (agOn()) {
      if (!agReady()) return null;
      const d = agDay(k);
      return d && d.free;
    }
    const n = romeNow();
    if (!k || k < n.key || k > maxKey()) return [];
    const dur = (SVC_ID[B.svc] || {}).durata || 30;
    const step = P.intervalloMinuti || 30;
    const minStart = k === n.key ? n.min + (P.anticipoMinimoMinuti || 0) : 0;
    const out = [];
    ranges(dowOf(k)).forEach(([a, b]) => {
      for (let m = a; m + Math.min(dur, b - a) <= b; m += step) if (m >= minStart) out.push(m);
    });
    return out;
  }
  function dayState(k) {
    if (agReady()) {
      const d = agDay(k);
      return !d || d.free.length ? { ok: true, label: monShort(k) } : { ok: false, label: d.why };
    }
    if (agOn()) return ranges(dowOf(k)).length ? { ok: true, label: monShort(k) } : { ok: false, label: 'chiuso' };
    return slotsFor(k).length ? { ok: true, label: monShort(k) } : { ok: false, label: 'chiuso' };
  }
  function dateError(k) {
    if (!k) return 'Scegli il giorno.';
    if (k < todayKey()) return 'Questa data è già passata: scegline un\'altra.';
    if (k > maxKey()) return `Si può prenotare fino a ${maxDays()} giorni in anticipo.`;
    if (agReady()) {
      const why = (AG.api.business.closedDays || {})[k];
      if (why != null) return `${cap(dateLong(k))} siamo chiusi${why ? ` (${why})` : ''}: scegli un altro giorno.`;
      if (!AG.mod.openRanges(AG.api.business, k).length) return `Il ${GIORNI[dowOf(k)]} siamo chiusi: scegli un altro giorno.`;
    } else if (!agOn() && !ranges(dowOf(k)).length) return `Il ${GIORNI[dowOf(k)]} siamo chiusi: scegli un altro giorno.`;
    const list = slotsFor(k);
    if (list && !list.length) return 'Per questo giorno non ci sono più orari liberi: scegline un altro.';
    return '';
  }

  function waMessage() {
    const s = bkSvc(B.svc), o = bkOp(B.op);
    const rows = [`Ciao ${S.nome}, vorrei prenotare:`];
    if (s) rows.push(`Servizio: ${s.nome}`);
    rows.push(`Operatore: ${o ? o.nome : 'nessuna preferenza'}`);
    if (B.date) rows.push(`Giorno: ${dateLong(B.date)}`);
    if (B.time) rows.push(`Ora: ${B.time}`);
    if (ui.name.value.trim()) rows.push(`Nome: ${ui.name.value.trim()}`);
    if (ui.phone.value.trim()) rows.push(`Telefono: ${ui.phone.value.trim()}`);
    if (ui.notes.value.trim()) rows.push(`Note: ${ui.notes.value.trim()}`);
    return rows.join('\n');
  }
  function updateRecap() {
    const s = bkSvc(B.svc), o = bkOp(B.op);
    if (!recap) return;
    const show = s && B.step >= 2 && B.step <= 4;
    recap.hidden = !show;
    if (show) recap.innerHTML = `<strong>${esc(s.nome)}</strong>, ${durata(s.durata)}${s.prezzo == null ? '' : `, ${priceText(s)}`}${o ? `, con ${esc(o.nome.split(' ')[0])}` : ''}`;
    ui.wa.href = waLink(waMessage());
  }
  function bookTexts() {
    const conf = autoConfirm();
    const t = $('[data-t="prenotaTesto"]');
    const txt = testo(conf ? 'prenotaTestoConfermata' : 'prenotaTesto') || testo('prenotaTesto');
    if (t && txt && t.textContent !== txt) t.textContent = txt;
    ui.sumTitle.textContent = conf ? 'Controlla e conferma' : 'Controlla e invia';
    ui.sumNote.textContent = conf
      ? 'Confermando, l\'appuntamento entra subito nella nostra agenda.'
      : 'È una richiesta: ti richiamiamo per confermare l\'orario.';
  }
  function showNote() {
    const n = ui.note;
    if (waOnly()) {
      n.hidden = false;
      n.innerHTML = '<strong>Prenotazione online non disponibile in questo momento.</strong> Scegli servizio e orario: alla fine invii la richiesta su WhatsApp e ti rispondiamo noi.';
    } else if (AG.state === 'off' && DEMO) {
      n.hidden = false;
      n.innerHTML = '<strong>Modalità demo.</strong> Le richieste non vengono spedite: per attivarle inserisci la chiave Web3Forms in config.js. Il pulsante WhatsApp funziona già.';
    } else n.hidden = true;
  }

  function renderStep1() {
    const cats = bkCats();
    if (!cats.length) {
      ui.cats.innerHTML = '';
      ui.opts.innerHTML = '<p class="slots__empty">Al momento nessun servizio si prenota online: chiamaci o scrivici su WhatsApp.</p>';
      return;
    }
    const sel = bkSvc(B.svc);
    if (!B.cat || !cats.some(c => c.categoria === B.cat)) B.cat = (sel && cats.some(c => c.categoria === sel.cat) && sel.cat) || cats[0].categoria;
    ui.cats.innerHTML = cats.map(c => `<button type="button" class="chip" data-cat="${esc(c.categoria)}" aria-pressed="${c.categoria === B.cat}">${esc(c.categoria)}</button>`).join('');
    const cat = cats.find(c => c.categoria === B.cat);
    ui.opts.innerHTML = cat.voci.map(v => `
      <label class="opt"><input type="radio" name="servizio" value="${v.id}"${v.id === B.svc ? ' checked' : ''}>
        <span class="opt__name">${esc(v.nome)}</span><span class="opt__meta">${durata(v.durata)}</span>
        ${v.prezzo == null ? '' : `<span class="opt__price">${v.da === false ? '' : '<small>da</small> '}${euro(v.prezzo)}</span>`}</label>`).join('');
  }
  function renderStep2() {
    const list = bkOps();
    if (B.op !== 'any' && !list.some(o => o.id === B.op)) B.op = 'any';
    const any = `<label class="opt"><input type="radio" name="operatore" value="any"${B.op === 'any' ? ' checked' : ''}>
      <span class="opt__any" aria-hidden="true"><svg><use href="#i-mark"/></svg></span>
      <span class="opt__name">Nessuna preferenza</span><span class="opt__meta">Ti assegniamo il primo operatore libero</span></label>`;
    ui.ops.innerHTML = any + list.map(o => `
      <label class="opt"><input type="radio" name="operatore" value="${o.id}"${B.op === o.id ? ' checked' : ''}>
        ${o.foto ? `<img src="${o.foto}-sm.webp" alt="" width="52" height="52" loading="lazy" decoding="async">` : '<span class="opt__any" aria-hidden="true"><svg><use href="#i-mark"/></svg></span>'}
        <span class="opt__name">${esc(o.nome)}</span><span class="opt__meta">${esc(o.ruolo)}</span></label>`).join('');
  }
  function renderStep3() {
    const start = todayKey();
    const days = [];
    for (let i = 0; i < 14; i++) days.push(addDays(start, i));
    setHTML(ui.days, days.map(k => {
      const st = dayState(k);
      return `<button type="button" class="day" data-day="${k}" aria-pressed="${k === B.date}"${st.ok ? '' : ' disabled'} aria-label="${cap(dateLong(k))}${st.ok ? '' : `, ${st.label}`}">
        <span class="day__dow">${dayShort(k)}</span><span class="day__num">${Number(k.slice(8))}</span><span class="day__mon">${st.label}</span></button>`;
    }).join(''));
    ui.dateIn.min = start;
    ui.dateIn.max = maxKey();
    if (B.date && !days.includes(B.date)) { ui.dateIn.value = B.date; agWatchOther(B.date); }
    renderSlots();
  }
  function renderSlots() {
    if (!B.date) { setHTML(ui.slots, '<p class="slots__empty">Scegli prima un giorno: qui compaiono gli orari liberi.</p>'); return; }
    const list = slotsFor(B.date);
    if (!list) { setHTML(ui.slots, '<p class="slots__empty">Carico gli orari liberi…</p>'); return; }
    if (B.time && !list.includes(toMin(B.time))) B.time = null;
    setHTML(ui.slots, list.length
      ? list.map(m => `<button type="button" class="slot" data-time="${hhmm(m)}" aria-pressed="${hhmm(m) === B.time}">${hm(m)}</button>`).join('')
      : '<p class="slots__empty">Per questo giorno non ci sono orari liberi.</p>');
  }
  function renderSummary() {
    const s = bkSvc(B.svc), o = bkOp(B.op);
    const rows = [
      ['Servizio', s ? `${s.nome} (${durata(s.durata)}${s.prezzo == null ? '' : `, ${priceText(s)}`})` : '', 1],
      ['Operatore', o ? o.nome : 'Nessuna preferenza', 2],
      ['Giorno e ora', B.date ? `${cap(dateLong(B.date))}, ore ${hm(toMin(B.time))}` : '', 3],
      ['Nome', ui.name.value.trim(), 4],
      ['Telefono', ui.phone.value.trim(), 4]
    ];
    if (ui.notes.value.trim()) rows.push(['Note', ui.notes.value.trim(), 4]);
    ui.summary.innerHTML = rows.map(([k, v, st]) =>
      `<div><dt>${k}</dt><dd>${esc(v)}</dd><button class="link-btn" type="button" data-edit="${st}">Modifica</button></div>`).join('');
  }

  // help = true: sotto il messaggio compaiono i pulsanti Chiama e WhatsApp
  function setError(msg, help = false) {
    ui.err.textContent = msg || '';
    if (!ui.help) return;
    ui.help.hidden = !help;
    if (help) $('[data-wa-help]', ui.help).href = waLink(waMessage());
  }
  function validate(step) {
    if (step === 1 && !bkSvc(B.svc)) return 'Scegli un servizio per continuare.';
    if (step === 3) {
      const e = dateError(B.date);
      if (e) return e;
      const list = slotsFor(B.date);
      if (!list) return 'Un attimo: sto caricando gli orari liberi.';
      if (!B.time || !list.includes(toMin(B.time))) return 'Scegli un orario tra quelli disponibili.';
    }
    if (step === 4) {
      const bad = [];
      const phone = cleanPhone(ui.phone.value);
      const nameOk = cleanName(ui.name.value).length >= 2;
      const phoneOk = /^[+]?[0-9 ]{6,20}$/.test(phone) && phone.replace(/\D/g, '').length >= 8;
      ui.name.setAttribute('aria-invalid', String(!nameOk));
      ui.phone.setAttribute('aria-invalid', String(!phoneOk));
      if (!nameOk) bad.push('il nome');
      if (!phoneOk) bad.push('un numero di telefono valido');
      if (bad.length) return `Inserisci ${bad.join(' e ')}.`;
      if (!ui.privacy.checked) return 'Per prenotare conferma di aver letto l\'informativa privacy.';
    }
    return '';
  }

  function go(n, opts = {}) {
    B.step = n;
    $$('[data-step]', F).forEach(s => s.classList.toggle('is-active', Number(s.dataset.step) === n));
    $$('[data-step-dot]', F).forEach(d => {
      const k = Number(d.dataset.stepDot);
      d.classList.toggle('is-active', k === n);
      d.classList.toggle('is-done', k < n);
      k === n ? d.setAttribute('aria-current', 'step') : d.removeAttribute('aria-current');
    });
    ui.bar.style.transform = `scaleX(${Math.min(n, 4) / 4})`;
    ui.label.textContent = n <= 4 ? `Passo ${n} di 4: ${STEP_NAMES[n - 1]}` : n === 5 ? 'Riepilogo' : '';
    ui.nav.hidden = n === 6;
    ui.back.hidden = n === 1;
    ui.wa.hidden = n !== 5;
    // Senza Agendo raggiungibile, l'ultimo passo è il pulsante WhatsApp
    ui.next.hidden = n === 5 && waOnly();
    ui.wa.classList.toggle('btn--dark', waOnly());
    ui.wa.classList.toggle('btn--line', !waOnly());
    ui.next.textContent = n < 4 ? 'Avanti' : n === 4 ? 'Vedi il riepilogo' : autoConfirm() ? 'Conferma la prenotazione' : 'Invia la richiesta';
    bookTexts();
    if (n === 1) renderStep1();
    if (n === 2) renderStep2();
    if (n === 3) renderStep3();
    if (n === 5) renderSummary();
    setError('');
    updateRecap();
    // Si scorre solo qui, al cambio di passaggio e una volta sola
    if (opts.focus !== false) {
      const r = F.getBoundingClientRect();
      if (r.top < 0 || r.top > VH * .6) F.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
      focusTitle(reduce ? 0 : 450);
    }
    measureSoon();
  }
  // Porta il lettore di schermo sul titolo del passaggio, ma non se il cliente
  // ha già toccato un campo: rubargli il fuoco chiuderebbe la tastiera
  let titleTimer = null;
  function focusTitle(delay) {
    clearTimeout(titleTimer);
    const title = $('.step.is-active .step__title', F);
    if (!title) return;
    titleTimer = setTimeout(() => { if (!isTextField(document.activeElement)) title.focus({ preventScroll: true }); }, delay);
  }

  async function submit() {
    for (const s of [1, 3, 4]) {
      const e = validate(s);
      if (e) { go(s); setError(e); return; }
    }
    // Trappola anti-bot compilata: non si salva niente, ma il messaggio è quello di sempre
    if ($('[data-hp]', F).value.trim()) { fakeDone(); return; }
    if (agReady()) { await submitAgendo(); return; }
    if (DEMO) { done(true); return; }
    const s = bkSvc(B.svc), o = bkOp(B.op);
    const label = ui.next.textContent;
    F.classList.add('is-sending');
    ui.next.textContent = 'Invio in corso…';
    try {
      const res = await fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({
          access_key: KEY,
          subject: `Richiesta di prenotazione: ${s.nome}, ${dateLong(B.date)} ore ${B.time}`,
          from_name: `${S.nome} (sito)`,
          Servizio: `${s.nome} (${durata(s.durata)}, da ${euro(s.prezzo)})`,
          Operatore: o ? o.nome : 'Nessuna preferenza',
          Giorno: cap(dateLong(B.date)),
          Ora: B.time,
          Nome: ui.name.value.trim(),
          Telefono: ui.phone.value.trim(),
          Note: ui.notes.value.trim() || '-'
        })
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || data.success === false) throw new Error(data.message || 'Errore');
      done(false);
    } catch (err) {
      setError(`Invio non riuscito. Riprova tra poco, prenota su WhatsApp o chiamaci al ${S.telefono}.`);
    } finally {
      F.classList.remove('is-sending');
      if (B.step === 5) ui.next.textContent = label;
    }
  }

  // Invio ad Agendo: prenotazione "in attesa" e fasce da 30 minuti in una transazione
  async function submitAgendo() {
    const s = AG.svc[B.svc], start = toMin(B.time);
    const day = agDay(B.date);
    const slot = day && day.slots.find(x => x.start === start && x.free);
    if (!slot) { slotTaken(); return; }
    const staffIds = B.op === 'any' ? AG.mod.orderStaffForBooking(slot.freeStaffIds, AG.busy[B.date] || {}) : [B.op];
    const label = ui.next.textContent;
    F.classList.add('is-sending');
    ui.next.textContent = 'Invio in corso…';
    setError('');
    try {
      const res = await withTimeout(AG.api.book({
        service: s.raw, staffIds, date: B.date, start,
        name: cleanName(ui.name.value), phone: cleanPhone(ui.phone.value),
        notes: ui.notes.value.trim().slice(0, 500), noPreference: B.op === 'any'
      }), 25000);
      doneAgendo(res);
    } catch (err) {
      if (err && err.code === 'slot-taken') slotTaken();
      else {
        console.warn('Invio ad Agendo non riuscito.', err);
        setError('Non siamo riusciti a completare la prenotazione. Riprova tra poco, oppure chiamaci o scrivici su WhatsApp: ti fissiamo noi l\'appuntamento.', true);
      }
    } finally {
      F.classList.remove('is-sending');
      if (B.step === 5) ui.next.textContent = label;
    }
  }
  function slotTaken() {
    const k = B.date;
    B.time = null;
    go(3);
    setError('Questo orario è appena stato prenotato, scegline un altro.');
    // Ricarica subito dal server gli orari di quel giorno
    AG.api.fetchBusy(k, k).then(byDate => {
      AG.busy[k] = byDate[k] || {};
      if (B.step === 3) renderStep3();
    }).catch(() => {});
  }
  function doneAgendo(res) {
    const ok = res.status === 'confirmed';
    const s = AG.svc[B.svc], start = toMin(B.time);
    $('[data-done-title]', F).textContent = ok ? 'Prenotazione confermata!' : 'Richiesta inviata!';
    ui.doneText.textContent = ok ? '' : 'Ti richiamiamo per confermare l\'appuntamento.';
    ui.doneText.hidden = ok;
    const rows = [
      ['Servizio', s.nome],
      ['Operatore', res.staffName],
      ['Giorno e ora', `${cap(dateLong(B.date))}, ore ${hm(start)}`],
      ['Nome', cleanName(ui.name.value)],
      ['Telefono', cleanPhone(ui.phone.value)]
    ];
    ui.doneSummary.innerHTML = rows.map(([k, v]) => `<div><dt>${k}</dt><dd>${esc(v)}</dd></div>`).join('');
    ui.doneSummary.hidden = false;
    doneExtras(ok);
    if (ok) {
      calendarLinks({ id: res.id, s, op: res.staffName, date: B.date, start });
      $('[data-wa-after]', F).href = waLink(`Ciao ${S.nome}, vorrei spostare o disdire la prenotazione: ${s.nome}, ${dateLong(B.date)} alle ${hm(start)}.`);
    }
    go(6);
  }
  function fakeDone() {
    if (!agReady()) { done(DEMO); return; }
    const o = bkOp(B.op);
    doneAgendo({ id: 'nessuno', staffName: o ? o.nome : 'Nessuna preferenza', status: autoConfirm() ? 'confirmed' : 'pending' });
  }
  // Calendario, frase finale: solo per le prenotazioni già confermate
  function doneExtras(ok) {
    ui.addcal.hidden = !ok;
    ui.addcal.open = false;
    ui.after.hidden = !ok;
  }

  /* ---------- Aggiungi al calendario: file .ics e Google Calendar ---------- */
  const calStamp = d => d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
  const icsText = v => String(v).replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n');
  // Righe del file .ics al massimo di 75 byte: si va a capo con uno spazio davanti
  const icsFold = line => {
    const out = [];
    while (line.length > 60) { out.push(line.slice(0, 60)); line = ' ' + line.slice(60); }
    return out.concat(line).join('\r\n');
  };
  function calendarLinks({ id, s, op, date, start }) {
    const from = AG.mod.romeToDate(date, start), to = AG.mod.romeToDate(date, start + s.durata);
    const title = `${s.nome} da ${S.nome}`;
    const info = `Con ${op}. Per spostarla o disdirla chiamaci al ${S.telefono} o scrivici su WhatsApp.`;
    const ics = [
      'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Studio Riflesso//Prenotazioni//IT', 'CALSCALE:GREGORIAN', 'METHOD:PUBLISH',
      'BEGIN:VEVENT', `UID:${id}@studio-riflesso`, `DTSTAMP:${calStamp(new Date())}`,
      `DTSTART:${calStamp(from)}`, `DTEND:${calStamp(to)}`,
      `SUMMARY:${icsText(title)}`, `LOCATION:${icsText(indirizzo)}`, `DESCRIPTION:${icsText(info)}`,
      'BEGIN:VALARM', 'ACTION:DISPLAY', 'DESCRIPTION:Promemoria appuntamento', 'TRIGGER:-PT2H', 'END:VALARM',
      'END:VEVENT', 'END:VCALENDAR'
    ].map(icsFold).join('\r\n');
    $('[data-cal-ics]', F).href = 'data:text/calendar;charset=utf-8,' + encodeURIComponent(ics);
    $('[data-cal-google]', F).href = 'https://calendar.google.com/calendar/render?' + new URLSearchParams({
      action: 'TEMPLATE', text: title, dates: `${calStamp(from)}/${calStamp(to)}`, details: info, location: indirizzo
    });
  }
  function done(demo) {
    const s = bkSvc(B.svc);
    $('[data-done-title]', F).textContent = demo ? 'Modalità demo: richiesta non inviata.' : 'Richiesta inviata, grazie.';
    $('[data-done-text]', F).textContent = demo
      ? 'In questa bozza il modulo non spedisce nulla. Con la chiave Web3Forms in config.js la richiesta arriva per email al salone. Intanto puoi provare il pulsante “Prenota su WhatsApp”.'
      : `Ti richiamiamo al ${ui.phone.value.trim()} per confermare ${s.nome}, ${dateLong(B.date)} alle ${B.time}.`;
    ui.doneText.hidden = false;
    ui.doneSummary.hidden = true;
    doneExtras(false);
    go(6);
  }

  function bookPreset({ svc, op }) {
    agStart();
    let missing = false;
    if (svc) {
      if (bkSvc(svc)) { B.svc = svc; B.cat = bkSvc(svc).cat; B.time = null; } else missing = true;
    }
    if (op) B.op = op;
    if (B.op !== 'any' && !bkOps().some(o => o.id === B.op)) B.op = 'any';
    closeListino();
    const has = !!bkSvc(B.svc);
    const target = missing || !has ? 1 : svc ? (B.op !== 'any' ? 3 : 2) : 3;
    go(target, { focus: false });
    if (missing) setError('Questo servizio al momento non si prenota online: scegline un altro oppure chiamaci.');
    F.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
    focusTitle(reduce ? 0 : 900);
  }

  function bookingOnGender() {
    const s = bkSvc(B.svc);
    if (B.svc && (!s || !forG(s.g))) { B.svc = null; B.time = null; B.cat = null; }
    if (B.op !== 'any' && !bkOps().some(o => o.id === B.op)) B.op = 'any';
    const target = B.step >= 2 && B.step <= 5 && !B.svc ? 1 : B.step;
    go(target, { focus: false });
  }

  function initBooking() {
    if (!F) return;
    recap = document.createElement('p');
    recap.className = 'recap';
    recap.hidden = true;
    ui.label.after(recap);
    showNote();
    // Badge di reCAPTCHA nascosto: al suo posto la frase di Google sotto il pulsante
    $('[data-rc-note]', F).hidden = AG.state === 'off';
    // Agendo si collega quando la prenotazione è vicina (o al primo tocco sul modulo)
    if (AG.state === 'idle') {
      const sec = $('#prenota');
      if ('IntersectionObserver' in window && sec) {
        const ob = new IntersectionObserver(es => { if (es.some(e => e.isIntersecting)) { ob.disconnect(); agStart(); } }, { rootMargin: '0px 0px 100% 0px' });
        ob.observe(sec);
      } else agStart();
      F.addEventListener('focusin', agStart, { once: true });
    }
    F.addEventListener('submit', e => e.preventDefault());
    F.addEventListener('change', e => {
      const t = e.target;
      if (t.name === 'servizio') { B.svc = t.value; B.time = null; setError(''); updateRecap(); }
      if (t.name === 'operatore') { B.op = t.value; B.time = null; updateRecap(); }
      if (t === ui.dateIn && t.value) {
        const err = dateError(t.value);
        if (err) { setError(err); t.value = ''; return; }
        B.date = t.value; B.time = null; setError('');
        $$('.day', ui.days).forEach(d => d.setAttribute('aria-pressed', String(d.dataset.day === B.date)));
        agWatchOther(B.date);
        renderSlots();
        updateRecap();
      }
      if (t === ui.privacy) setError('');
    });
    F.addEventListener('input', e => {
      if (e.target === ui.name || e.target === ui.phone) e.target.removeAttribute('aria-invalid');
      updateRecap();
    });
    F.addEventListener('click', e => {
      const chip = e.target.closest('[data-cat]');
      if (chip) { B.cat = chip.dataset.cat; renderStep1(); return; }
      const day = e.target.closest('[data-day]');
      if (day && !day.disabled) {
        B.date = day.dataset.day; B.time = null; ui.dateIn.value = ''; setError('');
        $$('.day', ui.days).forEach(d => d.setAttribute('aria-pressed', String(d === day)));
        renderSlots(); updateRecap(); measureSoon();
        return;
      }
      const slot = e.target.closest('[data-time]');
      if (slot) {
        B.time = slot.dataset.time; setError('');
        $$('.slot', ui.slots).forEach(s => s.setAttribute('aria-pressed', String(s === slot)));
        updateRecap();
        return;
      }
      const edit = e.target.closest('[data-edit]');
      if (edit) { go(Number(edit.dataset.edit)); return; }
      if (e.target.closest('[data-restart]')) {
        Object.assign(B, { svc: null, op: 'any', date: null, time: null, cat: null });
        ui.name.value = ''; ui.phone.value = ''; ui.notes.value = ''; ui.privacy.checked = false;
        ui.doneSummary.hidden = true;
        ui.doneText.hidden = false;
        doneExtras(false);
        go(1);
      }
    });
    ui.back.addEventListener('click', () => go(Math.max(1, B.step - 1)));
    ui.next.addEventListener('click', () => {
      if (F.classList.contains('is-sending')) return;
      if (B.step === 5) { submit(); return; }
      const e = validate(B.step);
      if (e) { setError(e); return; }
      go(B.step + 1);
    });
    go(1, { focus: false });
  }

  document.addEventListener('click', e => {
    const s = e.target.closest('[data-book-service]');
    if (s) { e.preventDefault(); bookPreset({ svc: s.dataset.bookService }); return; }
    const o = e.target.closest('[data-book-op]');
    if (o) { e.preventDefault(); bookPreset({ op: o.dataset.bookOp }); }
  });

  /* =====================================================================
     CAMBIO DONNA / UOMO con dissolvenza cinematografica
     ===================================================================== */
  function updateSwitch() {
    $$('[data-set-genere]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.setGenere === G)));
  }
  function renderGender() {
    $$('[data-t]').forEach(el => el.setAttribute('data-swap', ''));
    renderTexts();
    renderAbout();
    renderTicker();
    renderServices();
    renderTeam();
    renderGallery();
    renderReviews();
    renderFaq();
    if (F) bookingOnGender();
    observe();
    registerParallax();
    teamProgress();
  }
  let switching = false;
  function setGenere(g) {
    if (MODO !== 'misto' || g === G || switching) return;
    switching = true;
    G = g;
    html.dataset.genere = g;
    try { localStorage.setItem('sr-genere', g); } catch (e) { /* memoria non disponibile */ }
    updateSwitch();
    showHero(g);
    showMirror(g);
    const blade = $('[data-blade]');
    if (blade && !reduce) { blade.classList.remove('is-run'); void blade.offsetWidth; blade.classList.add('is-run'); }
    html.classList.add('is-switching');
    setTimeout(() => {
      html.classList.remove('hero-in');
      renderGender();
      measure();
      requestAnimationFrame(() => {
        html.classList.remove('is-switching');
        requestAnimationFrame(() => { html.classList.add('hero-in'); switching = false; requestFrame(); });
      });
    }, reduce ? 180 : 340);
  }
  $$('[data-set-genere]').forEach(b => b.addEventListener('click', () => setGenere(b.dataset.setGenere)));

  /* =====================================================================
     SCORRIMENTO: header, hero, specchio, parallasse (solo transform)
     ===================================================================== */
  const header = $('[data-header]');
  const heroEl = $('.hero'), heroContent = $('[data-hero-content]');
  let heroH = heroEl.offsetHeight, lastY = scrollY, ticking = false, pars = [], lastW = 0, menuOpen = false;
  /* Larghezza e altezza dello schermo lette solo all'avvio e quando cambia la
     LARGHEZZA (rotazione, finestra): la tastiera del telefono e le barre del
     browser cambiano solo l'altezza e non devono far ricalcolare nulla. */
  let VW = innerWidth, VH = document.documentElement.clientHeight;

  function registerParallax() {
    pars = reduce ? [] : $$('[data-parallax]').map(el => ({ el, box: el.closest('.media') || el.parentElement, f: parseFloat(el.dataset.parallax) || .06, top: 0, h: 0 }));
    measure();
  }
  function measure() {
    const y = scrollY;
    heroH = heroEl.offsetHeight;
    if (M.el) {
      const r = M.el.getBoundingClientRect();
      M.top = r.top + y; M.h = r.height;
      M.sh = M.sticky.clientHeight; M.sw = M.sticky.clientWidth;
      if (M.sw !== lastW || !M.aw) {
        lastW = M.sw;
        M.aw = Math.min(M.sw * .64, (M.sh * .62) / 1.45, 440);
        M.ah = M.aw * 1.45;
        M.glint.style.left = `${(M.sw + M.aw) / 2 - M.aw * .36}px`;
        M.glint.style.top = `${(M.sh - M.ah) / 2 + M.aw * .1}px`;
      }
    }
    pars.forEach(p => { const r = p.box.getBoundingClientRect(); p.top = r.top + y; p.h = r.height; });
    if (gal.track) galMeasure();
    requestFrame();
  }
  let measureTimer = null;
  function measureSoon() { clearTimeout(measureTimer); measureTimer = setTimeout(measure, 120); }

  function frame() {
    ticking = false;
    const y = scrollY, vh = VH;
    if (header) {
      header.classList.toggle('is-scrolled', y > 30);
      if (!menuOpen) {
        if (y > lastY + 4 && y > vh * .8) header.classList.add('is-hidden');
        else if (y < lastY - 4 || y < 80) header.classList.remove('is-hidden');
      }
    }
    lastY = y;
    if (reduce) return;

    // Hero: il contenuto sale e sfuma, il video scende più lento (parallasse)
    if (y <= heroH * 1.05) {
      const p = clamp(y / heroH);
      heroContent.style.transform = `translate3d(0, ${(-p * heroH * .2).toFixed(1)}px, 0)`;
      heroContent.style.opacity = (1 - p * 1.6).toFixed(3);
      heroMedia.style.transform = `translate3d(0, ${(p * heroH * .3).toFixed(1)}px, 0) scale(${(1 + p * .06).toFixed(4)})`;
    }

    // Specchio: la foto parte ad arco e si allarga fino a riempire lo schermo
    if (M.el && M.aw && y + vh > M.top && y < M.top + M.h) {
      const p = clamp((y - M.top) / Math.max(1, M.h - M.sh));
      const e = easeIO(clamp(p / .78));
      const ix = ((M.sw - M.aw) / 2) * (1 - e), iy = ((M.sh - M.ah) / 2) * (1 - e);
      const r = (M.aw / 2) * (1 - e), rb = 4 * (1 - e);
      M.frame.style.clipPath = `inset(${iy.toFixed(1)}px ${ix.toFixed(1)}px ${iy.toFixed(1)}px ${ix.toFixed(1)}px round ${r.toFixed(1)}px ${r.toFixed(1)}px ${rb.toFixed(1)}px ${rb.toFixed(1)}px)`;
      M.zoom.style.transform = `scale(${(1.3 - .3 * e).toFixed(4)})`;
      M.glint.style.opacity = clamp(1 - p * 7).toFixed(3);
      const c = clamp((p - .7) / .24);
      M.veil.style.opacity = (c * .95).toFixed(3);
      M.cap.style.opacity = c.toFixed(3);
      M.cap.style.transform = `translate3d(0, ${((1 - c) * 36).toFixed(1)}px, 0)`;
    }

    // Parallasse leggera sulle foto
    for (const p of pars) {
      if (y + vh < p.top - 80 || y > p.top + p.h + 80) continue;
      const off = clamp((p.top + p.h / 2 - y - vh / 2) * -p.f, -p.h * .075, p.h * .075);
      p.el.style.transform = `translate3d(0, ${off.toFixed(1)}px, 0)`;
    }
  }
  function requestFrame() { if (!ticking) { ticking = true; requestAnimationFrame(frame); } }
  addEventListener('scroll', requestFrame, { passive: true });
  function onWidth() {
    if (innerWidth === VW) return;
    VW = innerWidth;
    VH = document.documentElement.clientHeight;
    measureSoon();
    requestFrame();
  }
  addEventListener('resize', onWidth);
  addEventListener('orientationchange', () => setTimeout(onWidth, 200));
  addEventListener('load', measure);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(measure);

  /* Tastiera aperta (campo di testo con il fuoco): la barra in basso sparisce.
     Spostarsi da un campo all'altro non la fa lampeggiare. */
  let kbTimer = null;
  document.addEventListener('focusin', e => {
    if (!isTextField(e.target)) return;
    clearTimeout(kbTimer);
    clearTimeout(titleTimer);
    html.classList.add('kb-open');
  });
  document.addEventListener('focusout', e => {
    if (!isTextField(e.target)) return;
    clearTimeout(kbTimer);
    kbTimer = setTimeout(() => { if (!isTextField(document.activeElement)) html.classList.remove('kb-open'); }, 150);
  });

  // Nastro: in pausa quando non si vede
  const ticker = $('[data-ticker]');
  if (ticker && 'IntersectionObserver' in window) new IntersectionObserver(([e]) => ticker.classList.toggle('is-visible', e.isIntersecting)).observe(ticker);

  /* ---------- Menu a tutto schermo ---------- */
  const burger = $('[data-burger]'), menu = $('[data-menu]');
  function setMenu(open) {
    menuOpen = open;
    burger.setAttribute('aria-expanded', String(open));
    $('.sr-only', burger).textContent = open ? 'Chiudi il menu' : 'Apri il menu';
    menu.classList.toggle('is-open', open);
    open ? menu.removeAttribute('inert') : menu.setAttribute('inert', '');
    html.classList.toggle('menu-open', open);
    if (open) header.classList.remove('is-hidden');
  }
  if (burger && menu) {
    burger.addEventListener('click', () => setMenu(!menuOpen));
    $$('a', menu).forEach(a => a.addEventListener('click', () => setMenu(false)));
    document.addEventListener('keydown', e => { if (e.key === 'Escape' && menuOpen) { setMenu(false); burger.focus(); } });
    matchMedia('(min-width: 1100px)').addEventListener('change', e => { if (e.matches && menuOpen) setMenu(false); });
  }

  /* ---------- Pulsanti "magnetici" (solo computer) ---------- */
  if (finePointer && !reduce) {
    $$('.btn--magnet, .header__cta').forEach(b => {
      b.addEventListener('pointermove', e => {
        const r = b.getBoundingClientRect();
        const x = (e.clientX - r.left - r.width / 2) / (r.width / 2);
        const y = (e.clientY - r.top - r.height / 2) / (r.height / 2);
        b.style.setProperty('--mx', `${(x * 7).toFixed(1)}px`);
        b.style.setProperty('--my', `${(y * 6).toFixed(1)}px`);
      });
      b.addEventListener('pointerleave', () => { b.style.setProperty('--mx', '0px'); b.style.setProperty('--my', '0px'); });
    });
  }

  /* =====================================================================
     AVVIO
     ===================================================================== */
  renderStatic();
  updateSwitch();
  showHero(G);
  showMirror(G);
  initBooking();
  renderGender();
  measure();

  // Intro: si salta toccando lo schermo, una sola volta per visita
  const startHero = () => html.classList.add('hero-in');
  const intro = $('[data-intro]');
  if (html.classList.contains('intro-on') && intro) {
    try { sessionStorage.setItem('sr-intro', '1'); } catch (e) { /* ignora */ }
    let ended = false;
    const end = () => { if (ended) return; ended = true; html.classList.remove('intro-on'); };
    const skip = () => {
      intro.classList.add('is-skip');
      startHero();
      setTimeout(end, 560);
      ['pointerdown', 'keydown', 'wheel', 'touchstart'].forEach(ev => removeEventListener(ev, skip));
    };
    ['pointerdown', 'keydown', 'wheel', 'touchstart'].forEach(ev => addEventListener(ev, skip, { passive: true, once: true }));
    setTimeout(startHero, 800);
    setTimeout(() => { end(); ['pointerdown', 'keydown', 'wheel', 'touchstart'].forEach(ev => removeEventListener(ev, skip)); }, 1550);
  } else {
    html.classList.remove('intro-on');
    requestAnimationFrame(() => requestAnimationFrame(startHero));
  }
})();
