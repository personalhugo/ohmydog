/* =====================================================================
   Oh My Dog Spa & Grooming — interactions
   ---------------------------------------------------------------------
   CONFIGURATION (edit here)
   - formEndpoint: URL that receives the contact form and "request a time" as JSON
     (e.g. a Formspree form "https://formspree.io/f/xxxxxxx", or your own backend).
     While empty, both forms open the visitor's email app with the message pre-filled
     and the page says so — nothing pretends to be "sent".
   - whatsappNumber: international number, digits only (e.g. "17805551234").
     While empty, every WhatsApp button stays hidden.
   Bookings themselves happen only in DaySmart (the shop's real calendar).
   ===================================================================== */
'use strict';

const CONFIG = {
  formEndpoint: '',
  whatsappNumber: '',
  email: 'info@ohmydogspa.ca',
  phoneLabel: '(780) 655-1797',
  phoneHref: 'tel:+17806551797',
};

const LOCATIONS = {
  south: {
    name: 'South · Windermere',
    // Official DaySmart Pet booking page for this shop (same one the old site embedded).
    bookingUrl: 'https://plugin.myonlineappointment.com/External/BookingPlugin/?guid=807c47f6-9d88-46c4-8737-ccd060727523',
  },
  north: {
    name: 'North · Mistatim',
    bookingUrl: 'https://plugin.myonlineappointment.com/External/BookingPlugin/?guid=c0d2ba42-2c79-43e4-a521-3af4d860ee05',
  },
};

/* ---------------------------------------------------------------- helpers */
const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
const esc = (v) => String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const mqSmall = window.matchMedia('(max-width: 640px)');
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const isMobileUA = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
const scrollBehavior = () => (reducedMotion.matches ? 'auto' : 'smooth');

function safe(name, fn) {
  try { fn(); } catch (err) { console.error(`[${name}]`, err); }
}

function waLink(text = '') {
  const n = CONFIG.whatsappNumber.replace(/\D/g, '');
  return n ? `https://wa.me/${n}${text ? `?text=${encodeURIComponent(text)}` : ''}` : '';
}

/* ---------------------------------------------------------------- header & navigation */
function initHeader() {
  const header = $('#siteHeader');
  const nav = $('#nav');
  const btn = $('#menuBtn');
  const onScroll = () => header.classList.toggle('is-scrolled', window.scrollY > 12);
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  const setOpen = (open, { returnFocus = false } = {}) => {
    nav.classList.toggle('open', open);
    btn.setAttribute('aria-expanded', String(open));
    document.body.classList.toggle('menu-open', open);
    if (open) nav.querySelector('a')?.focus({ preventScroll: true });
    else if (returnFocus) btn.focus();
  };
  btn.addEventListener('click', () => setOpen(btn.getAttribute('aria-expanded') !== 'true'));
  nav.addEventListener('click', (e) => { if (e.target.closest('a')) setOpen(false); });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && nav.classList.contains('open')) setOpen(false, { returnFocus: true });
  });
  window.matchMedia('(min-width: 1025px)').addEventListener('change', (e) => { if (e.matches) setOpen(false); });

  // Highlight the section currently on screen
  if (!('IntersectionObserver' in window)) return;
  const links = new Map($$('.nav > a[href^="#"]').map((a) => [a.getAttribute('href').slice(1), a]));
  const io = new IntersectionObserver((entries) => {
    entries.forEach((en) => {
      if (!en.isIntersecting) return;
      links.forEach((a) => a.removeAttribute('aria-current'));
      links.get(en.target.id)?.setAttribute('aria-current', 'true');
    });
  }, { rootMargin: '-45% 0px -50% 0px' });
  links.forEach((_, id) => { const s = document.getElementById(id); if (s) io.observe(s); });
}

function initReveal() {
  const els = $$('[data-reveal]');
  if (!('IntersectionObserver' in window) || reducedMotion.matches) { els.forEach((el) => el.classList.add('is-visible')); return; }
  const io = new IntersectionObserver((entries) => {
    entries.forEach((en) => { if (en.isIntersecting) { en.target.classList.add('is-visible'); io.unobserve(en.target); } });
  }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
  els.forEach((el) => io.observe(el));
}

function initMobileBar() {
  const bar = $('#mobileBar');
  const hero = $('.hero');
  const book = $('#book');
  if (!bar || !('IntersectionObserver' in window)) { bar?.classList.add('show'); return; }
  document.body.classList.add('has-mobile-bar');
  let heroVisible = true;
  let bookVisible = false;
  const update = () => bar.classList.toggle('show', !heroVisible && !bookVisible);
  new IntersectionObserver(([en]) => { heroVisible = en.isIntersecting; update(); }, { threshold: 0.15 }).observe(hero);
  new IntersectionObserver(([en]) => { bookVisible = en.isIntersecting; update(); }, { threshold: 0.05 }).observe(book);
}

function initWhatsApp() {
  const link = waLink("Hi Oh My Dog! I'd like to ask about grooming.");
  if (!link) return;
  $$('[data-whatsapp]').forEach((el) => { el.hidden = false; });
  $$('[data-whatsapp-link]').forEach((a) => { a.href = link; });
}

/* ---------------------------------------------------------------- price tabs */
function selectTab(tab, focus = false) {
  $$('#priceTabs [role="tab"]').forEach((t) => {
    const on = t === tab;
    t.setAttribute('aria-selected', String(on));
    t.tabIndex = on ? 0 : -1;
    document.getElementById(t.getAttribute('aria-controls')).hidden = !on;
  });
  if (focus) tab.focus();
}

function initTabs() {
  const list = $('#priceTabs');
  const tabs = $$('[role="tab"]', list);
  list.addEventListener('click', (e) => { const t = e.target.closest('[role="tab"]'); if (t) selectTab(t); });
  list.addEventListener('keydown', (e) => {
    const i = tabs.indexOf(document.activeElement);
    if (i < 0) return;
    const map = { ArrowRight: i + 1, ArrowLeft: i - 1, Home: 0, End: tabs.length - 1 };
    if (!(e.key in map)) return;
    e.preventDefault();
    selectTab(tabs[(map[e.key] + tabs.length) % tabs.length], true);
  });
}

/* ---------------------------------------------------------------- service details dialog */
function initServices() {
  const dlg = $('#serviceDialog');
  const bookBtn = $('#dlgBook');
  let current = null;
  $('#services').addEventListener('click', (e) => {
    const btn = e.target.closest('[data-open-service]');
    if (!btn) return;
    const card = btn.closest('.service');
    current = card;
    const img = $('img', card);
    $('#dlgImg').src = img.currentSrc || img.src;
    $('#dlgTitle').textContent = $('h3', card).textContent;
    $('#dlgTagline').textContent = $('.tagline', card).textContent;
    $('#dlgPrice').textContent = $('.from', card).firstChild.textContent.trim();
    const body = $('#dlgBody');
    body.replaceChildren(...[...$('.svc-more', card).children].map((n) => n.cloneNode(true)));
    bookBtn.textContent = card.dataset.pkg === 'walkin' ? 'Walk-in prices' : 'Book now';
    dlg.showModal();
    body.scrollTop = 0;
  });
  dlg.addEventListener('click', (e) => {
    if (e.target === dlg || e.target.closest('[data-close]')) dlg.close();
  });
  bookBtn.addEventListener('click', () => {
    if (!current) return;
    dlg.close();
    if (current.dataset.pkg === 'walkin') {
      selectTab($('#tab-walkin'));
      $('#prices').scrollIntoView({ behavior: scrollBehavior() });
      return;
    }
    Booking.goTo(current.dataset.location);
  });
}

/* ---------------------------------------------------------------- gallery + lightbox */
function initGallery() {
  const grid = $('#galleryGrid');
  const links = $$('a[data-gallery]', grid);
  const lb = $('#lightbox');
  const img = $('#lbImg');
  const more = $('#galleryMore');
  let idx = 0;

  const collapse = () => {
    const small = mqSmall.matches && !grid.dataset.expanded;
    grid.classList.toggle('is-collapsed', small);
    more.hidden = !small;
  };
  collapse();
  mqSmall.addEventListener('change', collapse);
  more.addEventListener('click', () => {
    grid.dataset.expanded = '1';
    collapse();
    links[6]?.focus();
  });

  const show = (i) => {
    idx = (i + links.length) % links.length;
    const a = links[idx];
    const thumb = $('img', a);
    img.src = a.href;
    img.alt = thumb.alt;
    $('#lbCaption').textContent = thumb.alt;
    $('#lbCount').textContent = `${idx + 1} / ${links.length}`;
    [idx + 1, idx - 1].forEach((j) => { const n = links[(j + links.length) % links.length]; new Image().src = n.href; });
  };
  grid.addEventListener('click', (e) => {
    const a = e.target.closest('a[data-gallery]');
    if (!a) return;
    e.preventDefault();
    show(links.indexOf(a));
    lb.showModal();
  });
  $('#lbPrev').addEventListener('click', () => show(idx - 1));
  $('#lbNext').addEventListener('click', () => show(idx + 1));
  lb.addEventListener('click', (e) => { if (e.target === lb || e.target.closest('[data-close]')) lb.close(); });
  lb.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft') show(idx - 1);
    if (e.key === 'ArrowRight') show(idx + 1);
  });
  lb.addEventListener('close', () => links[idx]?.focus({ preventScroll: true }));
  // Swipe
  let x0 = null;
  lb.addEventListener('pointerdown', (e) => { x0 = e.clientX; });
  lb.addEventListener('pointerup', (e) => {
    if (x0 === null) return;
    const dx = e.clientX - x0;
    x0 = null;
    if (Math.abs(dx) > 50) show(idx + (dx < 0 ? 1 : -1));
  });
}

/* ---------------------------------------------------------------- lazy Google Maps */
function initMaps() {
  const maps = $$('.map[data-map-src]');
  const load = (m) => {
    if (m.dataset.loaded) return;
    m.dataset.loaded = '1';
    const f = document.createElement('iframe');
    f.src = m.dataset.mapSrc;
    f.title = m.dataset.mapTitle;
    f.loading = 'lazy';
    f.referrerPolicy = 'no-referrer-when-downgrade';
    m.append(f);
  };
  if (!('IntersectionObserver' in window)) { maps.forEach(load); return; }
  const io = new IntersectionObserver((entries) => {
    entries.forEach((en) => { if (en.isIntersecting) { load(en.target); io.unobserve(en.target); } });
  }, { rootMargin: '400px 0px' });
  maps.forEach((m) => io.observe(m));
}

/* ---------------------------------------------------------------- shared form helpers */
const validators = {
  name: (v) => (v.trim().length >= 2 ? '' : 'Please enter your name.'),
  email: (v) => (/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()) ? '' : 'Please enter a valid email address.'),
  phone: (v, required) => {
    const d = v.replace(/\D/g, '');
    if (!d) return required ? 'Please enter a phone number we can call.' : '';
    return d.length >= 10 && d.length <= 15 ? '' : 'Please enter a valid phone number.';
  },
  message: (v) => (v.trim().length >= 5 ? '' : 'Please write a short message.'),
  date: (v) => {
    if (!v) return '';
    const today = new Date(); today.setHours(0, 0, 0, 0);
    return new Date(`${v}T00:00:00`) >= today ? '' : 'Please choose a date from today onwards.';
  },
};

function setFieldError(input, msg) {
  const err = document.getElementById(`${input.id}-err`);
  input.setAttribute('aria-invalid', msg ? 'true' : 'false');
  if (err) {
    err.textContent = msg;
    if (msg) input.setAttribute('aria-describedby', err.id); else input.removeAttribute('aria-describedby');
  }
  return !msg;
}

function liveValidate(fields) {
  Object.keys(fields).forEach((id) => {
    const el = document.getElementById(id);
    el.addEventListener('blur', () => { if (el.value) setFieldError(el, fields[id](el.value)); });
    el.addEventListener('input', () => { if (el.getAttribute('aria-invalid') === 'true') setFieldError(el, fields[id](el.value)); });
  });
}

function validateAll(fields) {
  let firstBad = null;
  Object.entries(fields).forEach(([id, fn]) => {
    const el = document.getElementById(id);
    if (!setFieldError(el, fn(el.value)) && !firstBad) firstBad = el;
  });
  return firstBad;
}

async function postForm(payload) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 15000);
  try {
    const res = await fetch(CONFIG.formEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(payload),
      signal: ctrl.signal,
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return true;
  } finally {
    clearTimeout(timer);
  }
}

const mailto = (subject, body) => `mailto:${CONFIG.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
const setStatus = (el, type, html) => { el.className = `form-status full ${type}`; el.innerHTML = html; };
const contactFallback = (mailHref) => `please call <a href="${CONFIG.phoneHref}">${CONFIG.phoneLabel}</a> or <a href="${mailHref}">email ${CONFIG.email}</a>`;

/* ---------------------------------------------------------------- contact form */
function initContact() {
  const form = $('#contactForm');
  const status = $('#contactStatus');
  const btn = $('button[type="submit"]', form);
  if (!CONFIG.formEndpoint) $('#contactNote').textContent = 'Sending opens your email app with the message ready to go. We only use your details to reply.';

  const fields = {
    cName: (v) => validators.name(v),
    cEmail: (v) => validators.email(v),
    cPhone: (v) => validators.phone(v, false),
    cMsg: (v) => validators.message(v),
  };
  liveValidate(fields);

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const firstBad = validateAll(fields);
    if (firstBad) { setStatus(status, 'err', 'Please check the highlighted fields.'); firstBad.focus(); return; }

    const data = Object.fromEntries(new FormData(form));
    if (data.website) { form.reset(); setStatus(status, 'ok', 'Thank you! Your message has been sent.'); return; } // honeypot: silently drop bots
    const body = `${data.message.trim()}\n\n— ${data.name.trim()}\n${data.email.trim()}${data.phone ? `\n${data.phone.trim()}` : ''}`;
    const subject = data.subject?.trim() || 'Website enquiry';

    if (!CONFIG.formEndpoint) {
      window.location.href = mailto(subject, body);
      setStatus(status, 'info', `Your email app should open with the message ready — just press <strong>Send</strong>. If nothing opened, ${contactFallback(`mailto:${CONFIG.email}`)}.`);
      return;
    }
    btn.classList.add('is-loading');
    btn.disabled = true;
    try {
      await postForm({ form: 'contact', _subject: `Website: ${subject}`, name: data.name.trim(), email: data.email.trim(), phone: data.phone.trim(), subject, message: data.message.trim() });
      form.reset();
      setStatus(status, 'ok', 'Thank you! Your message has been sent — we will get back to you soon.');
    } catch {
      setStatus(status, 'err', `Sorry, we couldn't send your message right now — ${contactFallback(mailto(subject, body))}.`);
    } finally {
      btn.classList.remove('is-loading');
      btn.disabled = false;
    }
  });
}

/* =====================================================================
   BOOKING — DaySmart is the only place where appointments are made.
   Location cards are links to the DaySmart page (new tab: phones, tablets, no-JS).
   On desktop the same click opens that calendar inline instead.
   ===================================================================== */
const Booking = (() => {
  let panel, wrap, current = null, timer;
  const canEmbed = () => window.innerWidth >= 900 && !isMobileUA;

  function show(loc) {
    const l = LOCATIONS[loc];
    if (!l) return;
    $$('.book-loc').forEach((a) => a.classList.toggle('is-active', a.dataset.bookLocation === loc));
    $$('.book-loc').forEach((a) => (a.dataset.bookLocation === loc ? a.setAttribute('aria-current', 'true') : a.removeAttribute('aria-current')));
    panel.hidden = false;
    $('#calName').textContent = l.name;
    $('#calNewTab').href = l.bookingUrl;
    if (current === loc) return;
    current = loc;
    clearTimeout(timer);
    wrap.classList.remove('is-loaded');
    const loading = $('#calLoading');
    loading.textContent = 'Loading live calendar…';
    $('iframe', wrap)?.remove();
    const f = document.createElement('iframe');
    f.title = `Live booking calendar — ${l.name}`;
    f.src = l.bookingUrl;
    f.addEventListener('load', () => { clearTimeout(timer); wrap.classList.add('is-loaded'); });
    wrap.prepend(f);
    timer = setTimeout(() => {
      if (wrap.classList.contains('is-loaded')) return;
      loading.innerHTML = `<span>The calendar is taking longer than usual.</span><a class="btn btn-gold btn-sm" href="${l.bookingUrl}" target="_blank" rel="noopener noreferrer">Open it in a new tab</a><span>or call <a href="${CONFIG.phoneHref}">${CONFIG.phoneLabel}</a></span>`;
    }, 15000);
  }

  /** From buttons elsewhere on the page (service dialog). */
  function goTo(loc) {
    if (loc && canEmbed()) {
      show(loc);
      panel.scrollIntoView({ behavior: scrollBehavior(), block: 'start' });
    } else {
      document.getElementById('book').scrollIntoView({ behavior: scrollBehavior() });
    }
  }

  function initRequest() {
    const form = $('#reqForm');
    const status = $('#reqStatus');
    const btn = $('button[type="submit"]', form);
    const today = new Date();
    $('#rDate').min = new Date(today.getTime() - today.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
    if (!CONFIG.formEndpoint) $('#reqNote').textContent = "Sending opens your email app with your request ready to go. We'll call or email you to confirm a time.";

    const fields = {
      rName: (v) => validators.name(v),
      rPhone: (v) => validators.phone(v, true),
      rEmail: (v) => validators.email(v),
      rDate: (v) => validators.date(v),
    };
    liveValidate(fields);
    const locErr = $('#rLoc-err');
    form.addEventListener('change', (e) => { if (e.target.name === 'location') locErr.textContent = ''; });

    const confirm = (sent, data, mailHref) => {
      $('#requestBody').innerHTML = `
        <div class="confirm" tabindex="-1" id="reqConfirm">
          <div class="confirm-icon"><svg class="i" aria-hidden="true"><use href="#i-${sent ? 'check' : 'mail'}"/></svg></div>
          <h3 class="panel-title">${sent ? 'Request received!' : 'Almost done — please send the email'}</h3>
          <p class="hint">${sent
            ? `Thank you, ${esc(data.name.trim().split(' ')[0])}! Your request for ${esc(data.location)} is with our team.`
            : `Your email app should have opened with your request to ${CONFIG.email}. Press <strong>Send</strong> to deliver it. Nothing opened? <a href="${mailHref}">Try again</a> or call <a href="${CONFIG.phoneHref}">${CONFIG.phoneLabel}</a>.`}</p>
          <p class="hint">We'll call or email you to confirm the date and time.</p>
        </div>`;
      $('#reqConfirm').focus();
    };

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const firstBad = validateAll(fields);
      const loc = form.querySelector('input[name="location"]:checked');
      locErr.textContent = loc ? '' : 'Please choose a location.';
      if (!loc || firstBad) {
        setStatus(status, 'err', 'Please check the highlighted fields.');
        (loc ? firstBad : form.querySelector('input[name="location"]')).focus();
        return;
      }
      const data = Object.fromEntries(new FormData(form));
      if (data.website) { confirm(true, data); return; } // honeypot: silently drop bots
      const subject = `Booking request — ${data.location}`;
      const details = [
        `Location: ${data.location}`,
        `Service: ${data.service}`,
        data.pet.trim() && `Pet: ${data.pet.trim()}`,
        `Preferred date: ${data.date || 'Flexible'}`,
        `Preferred time: ${data.time}`,
        data.notes.trim() && `Notes: ${data.notes.trim()}`,
      ].filter(Boolean);
      const contact = [`Name: ${data.name.trim()}`, `Phone: ${data.phone.trim()}`, `Email: ${data.email.trim()}`];
      const text = `${details.join('\n')}\n\n${contact.join('\n')}`;

      if (!CONFIG.formEndpoint) {
        const href = mailto(subject, text);
        window.location.href = href;
        confirm(false, data, href);
        return;
      }
      btn.classList.add('is-loading');
      btn.disabled = true;
      try {
        await postForm({
          form: 'booking-request', _subject: subject,
          location: data.location, service: data.service, pet: data.pet.trim(),
          preferredDate: data.date || 'Flexible', preferredTime: data.time, notes: data.notes.trim(),
          name: data.name.trim(), phone: data.phone.trim(), email: data.email.trim(),
        });
        confirm(true, data);
      } catch {
        setStatus(status, 'err', `Sorry, we couldn't send your request right now — ${contactFallback(mailto(subject, text))}.`);
        btn.classList.remove('is-loading');
        btn.disabled = false;
      }
    });
  }

  function init() {
    panel = $('#calendarPanel');
    wrap = $('#calWrap');
    // Any "book at location" link on the page: inline calendar on desktop, DaySmart in a new tab elsewhere.
    document.addEventListener('click', (e) => {
      const a = e.target.closest('a[data-book-location]');
      if (!a || !canEmbed() || e.metaKey || e.ctrlKey || e.shiftKey) return;
      e.preventDefault();
      show(a.dataset.bookLocation);
      if (!a.closest('#booker')) panel.scrollIntoView({ behavior: scrollBehavior(), block: 'start' });
    });
    initRequest();
  }

  return { init, goTo };
})();

/* ---------------------------------------------------------------- boot */
document.addEventListener('DOMContentLoaded', () => {
  safe('year', () => { $('#year').textContent = new Date().getFullYear(); });
  safe('header', initHeader);
  safe('reveal', initReveal);
  safe('mobileBar', initMobileBar);
  safe('whatsapp', initWhatsApp);
  safe('tabs', initTabs);
  safe('services', initServices);
  safe('gallery', initGallery);
  safe('maps', initMaps);
  safe('contact', initContact);
  safe('booking', Booking.init);
});
