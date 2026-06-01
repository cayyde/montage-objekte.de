/* ============================================================
   MONTAGE & OBJEKTE — Main JS
   ============================================================ */

// ── Scroll Reveal ──
const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('revealed');
      revealObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

document.querySelectorAll('[data-reveal]').forEach(el => revealObserver.observe(el));

// ── Scroll Progress Bar ──
const bar = document.querySelector('.scroll-progress');
if (bar) {
  window.addEventListener('scroll', () => {
    const pct = window.scrollY / (document.body.scrollHeight - window.innerHeight) * 100;
    bar.style.width = Math.min(pct, 100) + '%';
  }, { passive: true });
}

// ── Nav Shrink on Scroll ──
const nav = document.querySelector('.nav');
if (nav) {
  window.addEventListener('scroll', () => {
    nav.classList.toggle('scrolled', window.scrollY > 60);
  }, { passive: true });
}

// ── Button Ripple ──
document.querySelectorAll('.btn').forEach(btn => {
  btn.addEventListener('click', function(e) {
    const r = document.createElement('span');
    r.className = 'ripple';
    const rect = this.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    r.style.cssText = `width:${size}px;height:${size}px;left:${e.clientX-rect.left-size/2}px;top:${e.clientY-rect.top-size/2}px`;
    this.appendChild(r);
    setTimeout(() => r.remove(), 600);
  });
});

// ── Mobile Menu ──
function openMobile() {
  document.getElementById('mobile-menu').classList.add('open');
  document.body.style.overflow = 'hidden';
}
function closeMobile() {
  document.getElementById('mobile-menu').classList.remove('open');
  document.body.style.overflow = '';
}

// ── Index page dual menus ──
function openMenu(id) {
  ['montage-menu','objekte-menu'].forEach(m => {
    const el = document.getElementById(m);
    if (el) { el.classList.remove('open'); }
  });
  const target = document.getElementById(id);
  if (target) {
    target.classList.add('open');
    document.body.style.overflow = 'hidden';
  }
}
function closeMenus() {
  ['montage-menu','objekte-menu'].forEach(m => {
    const el = document.getElementById(m);
    if (el) el.classList.remove('open');
  });
  document.body.style.overflow = '';
}

// Close on ESC
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') { closeMenus(); closeMobile && closeMobile(); }
});

// ── Smooth counter (if needed) ──
function animateCount(el, target, duration = 1500) {
  let start = 0;
  const step = timestamp => {
    if (!start) start = timestamp;
    const progress = Math.min((timestamp - start) / duration, 1);
    el.textContent = Math.floor(progress * target);
    if (progress < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}

// ── Stagger card reveals ──
document.querySelectorAll('.cards-grid .card').forEach((card, i) => {
  card.setAttribute('data-reveal', 'up');
  card.setAttribute('data-delay', String(Math.min(i + 1, 6)));
});
document.querySelectorAll('.objekte-grid .objekte-card').forEach((card, i) => {
  card.setAttribute('data-reveal', 'up');
  card.setAttribute('data-delay', String((i % 3) + 1));
  revealObserver.observe(card);
});
// Re-observe staggered cards
document.querySelectorAll('.cards-grid .card').forEach(el => revealObserver.observe(el));

// ── Parallax hero bg (subtle) ──
const heroBgs = document.querySelectorAll('.hero-bg');
if (heroBgs.length) {
  window.addEventListener('scroll', () => {
    const y = window.scrollY;
    heroBgs.forEach(bg => {
      bg.style.transform = `translateY(${y * 0.25}px)`;
    });
  }, { passive: true });
}
