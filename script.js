/* ── Typewriter ── */
const phrases = [
  'Data Analyst',
  'Data Science Enthusiast',
  'Python Developer',
  'AWS ML Engineer (in training)',
];

let phraseIdx = 0, charIdx = 0, deleting = false;
const el = document.getElementById('typewriter');

function type() {
  const current = phrases[phraseIdx];
  if (!deleting) {
    el.textContent = current.slice(0, ++charIdx);
    if (charIdx === current.length) {
      setTimeout(() => { deleting = true; }, 1800);
      setTimeout(type, 2200);
      return;
    }
  } else {
    el.textContent = current.slice(0, --charIdx);
    if (charIdx === 0) {
      deleting = false;
      phraseIdx = (phraseIdx + 1) % phrases.length;
    }
  }
  setTimeout(type, deleting ? 55 : 90);
}
type();

/* ── Intersection Observer: reveal ── */
const revealEls = document.querySelectorAll(
  '.section-title, .about-grid, .skills-grid, .proficiency-bars, .projects-grid, .timeline-item, .contact-card, .about-stats, .contact-intro'
);
revealEls.forEach(el => el.classList.add('reveal'));

const io = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      io.unobserve(entry.target);
    }
  });
}, { threshold: 0.1 });

document.querySelectorAll('.reveal').forEach(el => io.observe(el));

/* ── Skill bars animation ── */
const barObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      const bars = entry.target.querySelectorAll('.bar-fill');
      bars.forEach(bar => {
        bar.style.width = bar.dataset.width + '%';
      });
      barObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.3 });

const barsSection = document.querySelector('.proficiency-bars');
if (barsSection) barObserver.observe(barsSection);

/* ── SVG gradient definition ── */
const svgNS = 'http://www.w3.org/2000/svg';
const ringSvgs = document.querySelectorAll('.ring-svg');
ringSvgs.forEach(svg => {
  const defs = document.createElementNS(svgNS, 'defs');
  const grad = document.createElementNS(svgNS, 'linearGradient');
  grad.id = 'ringGrad';
  grad.setAttribute('x1', '0%'); grad.setAttribute('y1', '0%');
  grad.setAttribute('x2', '100%'); grad.setAttribute('y2', '100%');
  const s1 = document.createElementNS(svgNS, 'stop');
  s1.setAttribute('offset', '0%'); s1.setAttribute('stop-color', '#6378ff');
  const s2 = document.createElementNS(svgNS, 'stop');
  s2.setAttribute('offset', '100%'); s2.setAttribute('stop-color', '#a78bfa');
  grad.appendChild(s1); grad.appendChild(s2);
  defs.appendChild(grad);
  svg.insertBefore(defs, svg.firstChild);
});

/* ── Navbar shadow on scroll ── */
window.addEventListener('scroll', () => {
  const nav = document.getElementById('navbar');
  nav.style.boxShadow = window.scrollY > 20
    ? '0 4px 30px rgba(0,0,0,0.4)'
    : 'none';
});

/* ── Mobile nav toggle ── */
const hamburger = document.getElementById('hamburger');
const navLinks  = document.querySelector('.nav-links');
hamburger.addEventListener('click', () => {
  const open = navLinks.style.display === 'flex';
  navLinks.style.display = open ? 'none' : 'flex';
  navLinks.style.flexDirection = 'column';
  navLinks.style.position = 'absolute';
  navLinks.style.top = '64px';
  navLinks.style.left = '0';
  navLinks.style.right = '0';
  navLinks.style.background = 'rgba(10,14,26,0.98)';
  navLinks.style.padding = '1.5rem 2rem';
  navLinks.style.gap = '1.5rem';
  navLinks.style.borderBottom = '1px solid rgba(99,120,255,0.15)';
  if (open) navLinks.style.display = 'none';
});

navLinks.querySelectorAll('a').forEach(a => {
  a.addEventListener('click', () => {
    navLinks.style.display = 'none';
  });
});

/* ── Active nav link highlight on scroll ── */
const sections = document.querySelectorAll('section[id]');
const navAnchors = document.querySelectorAll('.nav-links a');

window.addEventListener('scroll', () => {
  let current = '';
  sections.forEach(section => {
    if (window.scrollY >= section.offsetTop - 100) current = section.id;
  });
  navAnchors.forEach(a => {
    a.style.color = a.getAttribute('href') === `#${current}` ? '#6378ff' : '';
  });
});
