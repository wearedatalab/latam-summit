// Landing · Influencia que Mueve. Sin dependencias; mejora progresiva (el contenido funciona sin JS).
(() => {
  'use strict';
  document.documentElement.classList.add('js');
  const EVENTO = new Date('2026-10-15T08:30:00-05:00');
  const $ = (s, el = document) => el.querySelector(s);

  // Header sólido al hacer scroll + CTA fijo en móvil cuando el hero sale de vista
  const top = $('.top');
  const sticky = $('.sticky-cta');
  const hero = $('.hero');
  const reg = $('#registro');
  let heroVisible = true, regVisible = false;
  const syncSticky = () => sticky.classList.toggle('is-on', !heroVisible && !regVisible);
  new IntersectionObserver(([e]) => { heroVisible = e.isIntersecting; top.classList.toggle('is-solid', !e.isIntersecting || scrollY > 40); syncSticky(); },
    { rootMargin: '-80px 0px 0px 0px' }).observe(hero);
  new IntersectionObserver(([e]) => { regVisible = e.isIntersecting; syncSticky(); }).observe(reg);
  addEventListener('scroll', () => top.classList.toggle('is-solid', scrollY > 40), { passive: true });

  // Apariciones
  const reveal = document.querySelectorAll('.manifesto__list li, .pillar, .timeline li, .who__list li, .reg__facts li, .h2');
  const io = new IntersectionObserver((entries) => entries.forEach((e) => {
    if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); }
  }), { rootMargin: '0px 0px -8% 0px' });
  reveal.forEach((el, i) => { el.classList.add('reveal'); el.style.transitionDelay = `${(i % 3) * 80}ms`; io.observe(el); });

  // Cuenta regresiva
  const count = $('#countdown');
  const pad = (n) => String(n).padStart(2, '0');
  function tick() {
    const ms = EVENTO - Date.now();
    if (ms <= 0) { count.hidden = true; return; }
    const d = Math.floor(ms / 864e5), h = Math.floor(ms / 36e5) % 24, m = Math.floor(ms / 6e4) % 60;
    $('[data-u="d"]', count).textContent = pad(d);
    $('[data-u="h"]', count).textContent = pad(h);
    $('[data-u="m"]', count).textContent = pad(m);
    count.hidden = false;
  }
  tick(); setInterval(tick, 30_000);

  // ---------- Formulario ----------
  const form = $('#form-registro');
  const status = $('.form__status', form);
  const btn = $('button[type="submit"]', form);
  const startedAt = Date.now();
  const params = new URLSearchParams(location.search);
  const MSG = {
    nombre: 'Escriba su nombre completo.', email: 'Revise el correo corporativo.', empresa: 'Indique su empresa u organización.',
    cargo: 'Indique su cargo.', telefono: 'Revise el teléfono.', consentimiento: 'Necesitamos su autorización para registrarle.',
  };

  function setError(name, msg) {
    const input = form.elements[name];
    const err = $(`#e-${name}`);
    if (!input || !err) return;
    err.textContent = msg || '';
    if (msg) { input.setAttribute('aria-invalid', 'true'); input.setAttribute('aria-describedby', err.id); }
    else { input.removeAttribute('aria-invalid'); input.removeAttribute('aria-describedby'); }
  }

  function checkField(input) {
    const { name } = input;
    let bad = false;
    if (name === 'consentimiento') bad = !input.checked;
    else if (name === 'telefono') bad = input.value.trim() !== '' && !/^[+\d][\d\s().-]{6,19}$/.test(input.value.trim());
    else if (name === 'nombre') bad = input.value.trim().length < 3;
    else if (input.required) bad = !input.value.trim() || !input.checkValidity();
    setError(name, bad ? MSG[name] : '');
    return !bad;
  }

  form.addEventListener('blur', (e) => { if (e.target.name && e.target.value) checkField(e.target); }, true);
  form.addEventListener('input', (e) => { if (e.target.getAttribute('aria-invalid')) checkField(e.target); });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    status.textContent = '';
    const fields = [...form.elements].filter((el) => el.name && el.name !== 'sitio_web');
    const invalid = fields.filter((el) => !checkField(el));
    if (invalid.length) { invalid[0].focus(); status.textContent = 'Revise los campos marcados.'; return; }

    const data = Object.fromEntries(new FormData(form));
    Object.assign(data, {
      consentimiento: form.elements.consentimiento.checked, t: startedAt,
      utm_source: params.get('utm_source') || '', utm_medium: params.get('utm_medium') || '',
      utm_campaign: params.get('utm_campaign') || '', referrer: document.referrer.slice(0, 300),
    });

    // Vista previa estática (GitHub Pages): no hay API; se simula el registro.
    if (/github\.io$/.test(location.hostname)) { showDone(data.nombre); return; }

    btn.disabled = true; btn.firstChild.textContent = 'Enviando… ';
    try {
      const res = await fetch('/api/registro', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        Object.entries(body.errores || {}).forEach(([k, v]) => setError(k, v));
        status.textContent = body.error || 'No pudimos registrarle. Intente de nuevo.';
        return;
      }
      showDone(data.nombre);
    } catch {
      status.textContent = 'Sin conexión. Revise su internet e intente de nuevo.';
    } finally {
      btn.disabled = false; btn.firstChild.textContent = 'Reservar mi cupo ';
    }
  });

  function showDone(nombre) {
    const done = $('#reg-ok');
    $('[data-name]', done).textContent = nombre.split(' ')[0];
    form.hidden = true; done.hidden = false; done.focus();
    const ics = [
      'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Influencia que Mueve//ES', 'BEGIN:VEVENT',
      `UID:influencia-que-mueve-2026@summit`, 'DTSTAMP:' + new Date().toISOString().replace(/[-:]|\.\d+/g, ''),
      'DTSTART:20261015T133000Z', 'DTEND:20261015T170000Z',
      'SUMMARY:Influencia que Mueve · Latam Summit Bogotá', 'LOCATION:Bogotá (sede por confirmar)',
      'DESCRIPTION:1er Summit Regional sobre influencia corporativa. Organiza IDDEA.', 'END:VEVENT', 'END:VCALENDAR',
    ].join('\r\n');
    $('#ics').href = URL.createObjectURL(new Blob([ics], { type: 'text/calendar' }));
  }
})();
