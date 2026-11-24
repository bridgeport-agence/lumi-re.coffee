/* ==========================================================
   LUMIÈRE COFFEE | script.js
   1 Config   2 Helpers   3 Navigation   4 Spline 3D
   5 Reservation form   6 GSAP animations   7 Start
   ========================================================== */
'use strict';

/* 1. CONFIG ------------------------------------------------
   Paste your Spline "Public URL" here (it ends with .splinecode).
   While it is empty, no 3D scene is loaded and the simple CSS cup stays visible. */
const SPLINE_SCENE_URL = '';

/* The Spline viewer web component. For production, pin a specific version
   (for example .../viewer@X.Y.Z/build/spline-viewer.js) so updates cannot break your site. */
const SPLINE_VIEWER_MODULE = 'https://unpkg.com/@splinetool/viewer/build/spline-viewer.js';

/* 2. HELPERS ----------------------------------------------- */
const $ = (selector, scope = document) => scope.querySelector(selector);
const $$ = (selector, scope = document) => Array.from(scope.querySelectorAll(selector));

/* 3. NAVIGATION -------------------------------------------- */
function initNav() {
  const header = $('.site-header');
  const toggle = $('.nav-toggle');
  const nav = $('#site-nav');
  if (!header || !toggle || !nav) return;

  // One function opens/closes the menu and keeps ARIA + body scroll in sync
  function setOpen(open) {
    nav.classList.toggle('is-open', open);
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    document.body.classList.toggle('no-scroll', open);
  }

  toggle.addEventListener('click', () => {
    setOpen(toggle.getAttribute('aria-expanded') !== 'true');
  });

  // Close the menu after choosing a link
  $$('a', nav).forEach((link) => link.addEventListener('click', () => setOpen(false)));

  // Escape closes the menu and returns focus to the button
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && nav.classList.contains('is-open')) {
      setOpen(false);
      toggle.focus();
    }
  });

  // If the window grows to desktop size, make sure the mobile state is reset
  window.matchMedia('(min-width: 900px)').addEventListener('change', (event) => {
    if (event.matches) setOpen(false);
  });

  // Dark background behind the header once the page has scrolled
  function onScroll() {
    header.classList.toggle('is-scrolled', window.scrollY > 40);
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
}

/* 4. SPLINE 3D ---------------------------------------------- */
function initSpline() {
  const stage = $('#spline-stage');
  const note = $('#stage-note');
  if (!stage) return;

  // No URL yet: placeholder mode. Nothing is loaded, so there are no errors.
  if (!SPLINE_SCENE_URL) return;

  // Respect visitors who asked their browser to save data
  if (navigator.connection && navigator.connection.saveData) {
    if (note) note.textContent = '3D scene skipped (data saver is on).';
    return;
  }

  function loadScene() {
    // Dynamic import: the heavy viewer is only downloaded when we need it
    import(SPLINE_VIEWER_MODULE)
      .then(() => {
        const viewer = document.createElement('spline-viewer');
        viewer.setAttribute('url', SPLINE_SCENE_URL);
        stage.appendChild(viewer);
        if (note) note.hidden = true;
      })
      .catch(() => {
        // The site keeps working: the fallback cup stays visible
        if (note) note.textContent = 'The 3D scene could not be loaded.';
      });
  }

  // Load only when the hero stage is visible (better for mobile performance)
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries) => {
      if (entries.some((entry) => entry.isIntersecting)) {
        observer.disconnect();
        loadScene();
      }
    });
    observer.observe(stage);
  } else {
    loadScene();
  }
}

/* 5. RESERVATION FORM ---------------------------------------
   This only validates in the browser. Nothing is sent or saved.
   To receive real reservations you need a backend, for example:
     - a server route (Node/Express, PHP, ...) that receives the data and emails you or stores it, or
     - a form service (Formspree, Netlify Forms, ...).
   Then, inside the submit handler below, replace the "demo" part with:

     fetch('https://YOUR-REAL-ENDPOINT', {
       method: 'POST',
       headers: { 'Content-Type': 'application/json' },
       body: JSON.stringify(Object.fromEntries(new FormData(form)))
     }).then(...).catch(...);
*/
function initReservationForm() {
  const form = $('#reservation-form');
  const status = $('#form-status');
  if (!form || !status) return;

  // Today's date as YYYY-MM-DD in the visitor's local time
  const now = new Date();
  const today = new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
  form.elements.date.min = today;

  // Each rule returns true if valid, or an error message if not
  const rules = {
    name: (v) => v.trim().length >= 2 || 'Enter your name (2 characters minimum).',
    email: (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()) || 'Enter a valid email address.',
    date: (v) => (v !== '' && v >= today) || 'Choose today or a future date.',
    guests: (v) => (Number(v) >= 1 && Number(v) <= 12) || 'Enter a number of guests between 1 and 12.'
  };
  const fields = Object.keys(rules);

  function checkField(name) {
    const input = form.elements[name];
    const result = rules[name](input.value);
    const valid = result === true;
    $('#err-' + name).textContent = valid ? '' : result;
    input.setAttribute('aria-invalid', String(!valid));
    return valid;
  }

  // Validate a field when the visitor leaves it
  fields.forEach((name) => {
    form.elements[name].addEventListener('blur', () => checkField(name));
  });

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    status.textContent = '';

    const invalid = fields.filter((name) => !checkField(name));
    if (invalid.length > 0) {
      form.elements[invalid[0]].focus(); // send keyboard users to the first problem
      return;
    }

    // DEMO ONLY: no data leaves the page (see the comment above for the real version)
    status.textContent = 'Your details look valid. This demo does not send anything: connect a backend to receive reservations.';
    form.reset();
    form.elements.guests.value = 2;
  });
}

function initHeroDepth() {
  const stage = $('#spline-stage');
  const floats = $$('.float');
  if (!stage || floats.length === 0) return;
  if (!window.gsap) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  // quickTo is faster for pointer movement because it reuses one tween per property.
  const moveStageX = gsap.quickTo(stage, 'x', { duration: 0.8, ease: 'power2.out' });
  const moveStageY = gsap.quickTo(stage, 'y', { duration: 0.8, ease: 'power2.out' });
  const tiltStageX = gsap.quickTo(stage, 'rotationX', { duration: 0.8, ease: 'power2.out' });
  const tiltStageY = gsap.quickTo(stage, 'rotationY', { duration: 0.8, ease: 'power2.out' });

  const floatTweens = floats.map((float, index) => {
    const speed = 10 + index * 7;
    return {
      el: float,
      x: gsap.quickTo(float, 'x', { duration: 0.9, ease: 'power2.out' }),
      speed
    };
  });

  stage.addEventListener('pointermove', (event) => {
    const rect = stage.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width - 0.5;
    const y = (event.clientY - rect.top) / rect.height - 0.5;

    // The stage and each background layer travel at a slightly different depth.
    moveStageX(x * 12);
    moveStageY(y * 8);
    tiltStageX(y * -4);
    tiltStageY(x * 6);

    floatTweens.forEach(({ x: moveX, speed }) => {
      moveX(x * speed);
    });
  });

  stage.addEventListener('pointerleave', () => {
    moveStageX(0);
    moveStageY(0);
    tiltStageX(0);
    tiltStageY(0);
    floatTweens.forEach(({ x: moveX }) => {
      moveX(0);
    });
  });
}

/* 6. GSAP ANIMATIONS ----------------------------------------
   gsap.matchMedia() runs animations only when the media query matches,
   so visitors with "reduce motion" get a static page, and parallax is desktop-only.
   Elements are visible by default in CSS: GSAP hides them only while it animates
   (gsap.from), so the page still works if GSAP fails to load. */
function initAnimations() {
  if (!window.gsap || !window.ScrollTrigger) {
    console.warn('GSAP or ScrollTrigger did not load: the page is shown without animations.');
    return;
  }
  gsap.registerPlugin(ScrollTrigger);

  const mm = gsap.matchMedia();

  mm.add(
    {
      motion: '(prefers-reduced-motion: no-preference)',
      desktop: '(min-width: 768px) and (prefers-reduced-motion: no-preference)'
    },
    (context) => {
      const { motion, desktop } = context.conditions;
      if (!motion) return; // reduced motion: do nothing

      // Hero intro: ONE timeline (no overlapping timelines on the same elements)
      gsap.timeline({ defaults: { ease: 'power3.out' } })
        .from('.hero .line-inner', { yPercent: 110, duration: 1.1, stagger: 0.12 })
        .from('.hero-fade', { y: 24, opacity: 0, duration: 0.9, stagger: 0.12, clearProps: 'transform,opacity' }, '-=0.6')
        .from('.hero-3d', { scale: 0.94, opacity: 0, duration: 1.1, clearProps: 'transform,opacity' }, '-=1')
        .from('.site-header', { opacity: 0, duration: 0.8 }, '-=0.8'); // opacity only: a transform would break the fixed mobile menu

      // Text and blocks fade up when they enter the screen
      $$('.reveal').forEach((el) => {
        gsap.from(el, {
          y: 36, opacity: 0, duration: 1, ease: 'power3.out', clearProps: 'transform,opacity',
          scrollTrigger: { trigger: el, start: 'top 88%', once: true }
        });
      });

      // Groups (menu cards, gallery) enter one after another
      $$('[data-stagger]').forEach((group) => {
        gsap.from(group.children, {
          y: 48, opacity: 0, duration: 0.9, stagger: 0.12, ease: 'power3.out', clearProps: 'transform,opacity',
          scrollTrigger: { trigger: group, start: 'top 82%', once: true }
        });
      });

      // Image reveal: the picture opens from top to bottom
      $$('.img-reveal').forEach((el) => {
        gsap.fromTo(
          el,
          { clipPath: 'inset(0% 0% 100% 0%)' },
          {
            clipPath: 'inset(0% 0% 0% 0%)', duration: 1.2, ease: 'power3.inOut', clearProps: 'clipPath',
            scrollTrigger: { trigger: el, start: 'top 85%', once: true }
          }
        );
      });

      // Parallax: desktop/tablet only, to keep phones comfortable
      if (desktop) {
        $$('[data-speed]').forEach((el) => {
          const speed = parseFloat(el.dataset.speed) || 0;
          gsap.to(el, {
            yPercent: speed * 100, ease: 'none',
            scrollTrigger: { trigger: el.parentElement, start: 'top bottom', end: 'bottom top', scrub: true }
          });
        });
      }

      // Soft floating background shapes
      gsap.to('.float', {
        y: 16, duration: 3.2, ease: 'sine.inOut', yoyo: true, repeat: -1,
        stagger: { each: 0.6 }
      });

      // Story section: counter-images and a gentle editorial parallax
      gsap.from('.story-kicker', {
        y: 18, opacity: 0, duration: 0.8, ease: 'power3.out', clearProps: 'transform,opacity',
        scrollTrigger: { trigger: '.story', start: 'top 78%', once: true }
      });

      gsap.from('.story-value', {
        y: 24, opacity: 0, duration: 0.75, stagger: 0.12, ease: 'power3.out', clearProps: 'transform,opacity',
        scrollTrigger: { trigger: '.story-values', start: 'top 88%', once: true }
      });

      if (desktop) {
        gsap.to('.story-media .parallax-frame:first-child img', {
          yPercent: 6, scale: 1.06, ease: 'none',
          scrollTrigger: { trigger: '.story', start: 'top bottom', end: 'bottom top', scrub: 1 }
        });
        gsap.to('.story-media .parallax-frame--small', {
          y: -55, rotation: 2, ease: 'none',
          scrollTrigger: { trigger: '.story', start: 'top bottom', end: 'bottom top', scrub: 1.2 }
        });
      }
    }
  );

  // Recalculate trigger positions once fonts and images have loaded
  window.addEventListener('load', () => ScrollTrigger.refresh());
}

/* 7. START --------------------------------------------------
   This file is loaded with "defer", so the HTML already exists here. */
const yearEl = $('#year');
if (yearEl) yearEl.textContent = new Date().getFullYear();

initNav();
initSpline();
initReservationForm();
initAnimations();

// Feature 1: layered hero depth, only for fine-pointer desktop devices
if (
  window.matchMedia('(min-width: 768px)').matches &&
  window.matchMedia('(hover: hover) and (pointer: fine)').matches
) {
  initHeroDepth();
}