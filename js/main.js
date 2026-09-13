// ==========================================================================
// CLIFFEGO — shared behavior across all pages
// ==========================================================================
(function () {
  'use strict';

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Scroll reveal (section headers + key moments only) ---------- */
  if (!reduceMotion && 'IntersectionObserver' in window) {
    const revealEls = document.querySelectorAll('.reveal');
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.2, rootMargin: '0px 0px -8% 0px' }
    );
    revealEls.forEach((el) => io.observe(el));
  } else {
    document.querySelectorAll('.reveal').forEach((el) => el.classList.add('is-visible'));
  }

  /* ---------- Transformation before/after toggle ---------- */
  const toggle = document.querySelector('.transform-toggle');
  if (toggle) {
    const buttons = toggle.querySelectorAll('button');
    const panels = document.querySelectorAll('.transform-panel');
    buttons.forEach((btn) => {
      btn.addEventListener('click', () => {
        const target = btn.dataset.target;
        buttons.forEach((b) => b.classList.toggle('is-active', b === btn));
        panels.forEach((p) => p.classList.toggle('is-active', p.dataset.panel === target));
      });
    });
  }

  /* ---------- Process rail: scroll-driven active step ---------- */
  const rail = document.querySelector('.process-rail');
  if (rail) {
    const steps = Array.from(rail.querySelectorAll('.process-step'));
    const fill = rail.querySelector('.process-rail__fill');

    function setActive(index) {
      steps.forEach((s, i) => s.classList.toggle('is-active', i === index));
      if (fill) fill.style.width = `${(index / (steps.length - 1)) * 100}%`;
    }
    steps.forEach((step, i) => step.addEventListener('click', () => setActive(i)));

    if (!reduceMotion && 'IntersectionObserver' in window) {
      const stepIO = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              const idx = steps.indexOf(entry.target);
              if (idx > -1) setActive(idx);
            }
          });
        },
        { threshold: 0.6, rootMargin: '-20% 0px -20% 0px' }
      );
      steps.forEach((s) => stepIO.observe(s));
    }
    setActive(0);
  }

  /* ---------- Business-problem progression: highlight on scroll ---------- */
  const progression = document.querySelector('.progression');
  if (progression && !reduceMotion && 'IntersectionObserver' in window) {
    const steps = Array.from(progression.querySelectorAll('.progression__step'));
    const progIO = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) entry.target.classList.add('progression__step--active');
        });
      },
      { threshold: 0.7 }
    );
    steps.forEach((s) => progIO.observe(s));
  } else if (progression) {
    progression.querySelectorAll('.progression__step').forEach((s) => s.classList.add('progression__step--active'));
  }

  /* ---------- Contact form validation (frontend-only, no backend wired up) ---------- */
  const form = document.querySelector('.contact-form');
  if (form) {
    const status = form.querySelector('.form-status');
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      let valid = true;
      form.querySelectorAll('[required]').forEach((field) => {
        const wrapper = field.closest('.field');
        const isEmpty = !field.value.trim();
        const isBadEmail = field.type === 'email' && field.value && !/^\S+@\S+\.\S+$/.test(field.value);
        wrapper.classList.toggle('has-error', isEmpty || isBadEmail);
        if (isEmpty || isBadEmail) valid = false;
      });
      if (!status) return;
      if (valid) {
        status.textContent = 'Thanks — this form isn\u2019t connected to a backend yet, so nothing was sent. Wire it up to your email or CRM to go live.';
        status.style.color = 'var(--text-on-light-muted)';
      } else {
        status.textContent = 'Please fill in the required fields above.';
        status.style.color = 'var(--color-copper)';
      }
      status.classList.add('is-visible');
    });
  }

  /* ---------- Header & Footer Dynamic Component Loader ---------- */
  async function loadPartials() {
    const headerPlaceholder = document.getElementById('site-header');
    const footerPlaceholder = document.getElementById('site-footer');

    try {
      if (headerPlaceholder) {
        const res = await fetch('header.html');
        if (res.ok) {
          headerPlaceholder.innerHTML = await res.text();
          
          // Automatically set active class based on current path
          const currentPath = window.location.pathname.split('/').pop() || 'index.html';
          const navLinks = document.querySelectorAll('.nav__links a, .mobile-menu__links a');
          
          navLinks.forEach(link => {
            const href = link.getAttribute('href');
            if (href === currentPath || (currentPath === '' && href === 'index.html')) {
              link.classList.add('is-active');
            } else {
              link.classList.remove('is-active');
            }
          });

          // Initialize Nav scroll behavior AFTER header exists in DOM
          initNavScroll();

          // Re-bind mobile menu toggle listeners after dynamic injection
          initMobileMenu();
        }
      }

      if (footerPlaceholder) {
        const res = await fetch('footer.html');
        if (res.ok) {
          footerPlaceholder.innerHTML = await res.text();
        }
      }
    } catch (e) {
      console.warn('Partial loading skipped or failed:', e);
    }
  }

  function initNavScroll() {
    const nav = document.querySelector('.nav');
    if (nav) {
      const onScroll = () => {
        if (window.scrollY > 12) {
          nav.classList.add('is-scrolled');
        } else {
          nav.classList.remove('is-scrolled');
        }
      };
      onScroll();
      window.addEventListener('scroll', onScroll, { passive: true });
    }
  }

  function initMobileMenu() {
    const menuBtn = document.querySelector('.nav__menu-btn');
    const mobileMenu = document.querySelector('.mobile-menu');
    const nav = document.querySelector('.nav');
    
    if (menuBtn && mobileMenu && nav) {
      menuBtn.addEventListener('click', () => {
        const isOpen = mobileMenu.classList.toggle('is-open');
        nav.classList.toggle('menu-open', isOpen);
        menuBtn.setAttribute('aria-expanded', String(isOpen));
        
        if (isOpen) {
          mobileMenu.style.display = 'flex';
          mobileMenu.setAttribute('aria-hidden', 'false');
          document.body.style.overflow = 'hidden';
          const firstLink = mobileMenu.querySelector('a');
          if (firstLink) firstLink.focus();
        } else {
          mobileMenu.setAttribute('aria-hidden', 'true');
          mobileMenu.style.display = 'none';
          document.body.style.overflow = '';
          menuBtn.focus();
        }
      });

      mobileMenu.querySelectorAll('a').forEach((a) =>
        a.addEventListener('click', () => {
          mobileMenu.classList.remove('is-open');
          nav.classList.remove('menu-open');
          mobileMenu.setAttribute('aria-hidden', 'true');
          mobileMenu.style.display = 'none';
          document.body.style.overflow = '';
        })
      );
    }
  }

  // Execute loading on DOM ready
  loadPartials();
})();