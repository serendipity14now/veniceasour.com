const menuButton = document.querySelector('.menu-toggle');
const siteNav = document.querySelector('.site-nav');

const themeButtons = [...document.querySelectorAll('[data-theme]')];
const availableThemes = new Set(themeButtons.map((button) => button.dataset.theme));
const THEME_KEY = 'marketing-recipes-theme';
let savedTheme = null;
try { savedTheme = localStorage.getItem(THEME_KEY); } catch (error) { /* storage blocked: default theme */ }

function setTheme(theme) {
  const nextTheme = availableThemes.has(theme) ? theme : 'paper';
  document.documentElement.dataset.theme = nextTheme;
  try { localStorage.setItem(THEME_KEY, nextTheme); } catch (error) { /* storage blocked */ }
  themeButtons.forEach((button) => {
    const isActive = button.dataset.theme === nextTheme;
    button.classList.toggle('is-active', isActive);
    button.setAttribute('aria-pressed', String(isActive));
  });
}

setTheme(savedTheme || 'paper');
themeButtons.forEach((button) => button.addEventListener('click', () => setTheme(button.dataset.theme)));

menuButton?.addEventListener('click', () => {
  const isOpen = menuButton.getAttribute('aria-expanded') === 'true';
  menuButton.setAttribute('aria-expanded', String(!isOpen));
  siteNav.classList.toggle('open', !isOpen);
  menuButton.querySelector('.sr-only').textContent = isOpen ? 'Open menu' : 'Close menu';
});

siteNav?.querySelectorAll('a').forEach((link) => link.addEventListener('click', () => {
  menuButton?.setAttribute('aria-expanded', 'false');
  siteNav.classList.remove('open');
}));

document.querySelectorAll('.case-toggle').forEach((button) => {
  button.addEventListener('click', () => {
    const details = document.getElementById(button.getAttribute('aria-controls'));
    const shouldOpen = button.getAttribute('aria-expanded') !== 'true';
    button.setAttribute('aria-expanded', String(shouldOpen));
    details.hidden = !shouldOpen;
    button.firstChild.textContent = shouldOpen ? 'Close case file ' : 'Open case file ';
    button.querySelector('span').textContent = shouldOpen ? '−' : '＋';
  });
});

document.querySelectorAll('.service-list article').forEach((row, index) => {
  // Prefer the native <button> inside the heading; fall back to the older div markup.
  const nativeButton = row.querySelector('.service-toggle');
  const trigger = nativeButton || row.querySelector('.service-title-block');
  const panel = row.querySelector('.service-detail');
  if (!trigger || !panel) return;

  const panelId = panel.id || `service-detail-${index + 1}`;
  panel.id = panelId;
  panel.hidden = true;
  if (!nativeButton) {
    trigger.setAttribute('role', 'button');
    trigger.setAttribute('tabindex', '0');
  }
  trigger.setAttribute('aria-controls', panelId);
  trigger.setAttribute('aria-expanded', 'false');

  function toggleService() {
    const shouldOpen = trigger.getAttribute('aria-expanded') !== 'true';
    trigger.setAttribute('aria-expanded', String(shouldOpen));
    panel.hidden = !shouldOpen;
    row.classList.toggle('is-open', shouldOpen);
  }

  trigger.addEventListener('click', toggleService);
  if (!nativeButton) {
    trigger.addEventListener('keydown', (event) => {
      if (event.key !== 'Enter' && event.key !== ' ') return;
      event.preventDefault();
      toggleService();
    });
  }
});

const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

const fitBoxes = [...document.querySelectorAll('.fit-list input[type="checkbox"]')];
let confettiFired = false;

function fireConfetti() {
  if (reduceMotion.matches || document.querySelector('.confetti-burst')) return;
  const burst = document.createElement('img');
  burst.src = 'confetti-alternative.svg';
  burst.alt = '';
  burst.className = 'confetti-burst';
  document.body.appendChild(burst);
  setTimeout(() => burst.remove(), 4200);
}

const fitMatch = document.querySelector('.fit-match');

fitBoxes.forEach((box) => box.addEventListener('change', () => {
  const allChecked = fitBoxes.every((item) => item.checked);
  if (allChecked && !confettiFired) { confettiFired = true; fireConfetti(); }
  if (!allChecked) confettiFired = false;
  if (fitMatch) fitMatch.hidden = !allChecked;
}));

const confessionViewport = document.querySelector('.confession-viewport');
const confessionCards = [...document.querySelectorAll('.confession-card')];
let dragStartX = 0;
let dragStartScroll = 0;
let dragging = false;

function moveConfessions(direction) {
  confessionViewport?.scrollBy({ left: direction * Math.min(390, window.innerWidth * .75), behavior: reduceMotion.matches ? 'auto' : 'smooth' });
}

document.querySelector('[data-confession-prev]')?.addEventListener('click', () => moveConfessions(-1));
document.querySelector('[data-confession-next]')?.addEventListener('click', () => moveConfessions(1));

confessionViewport?.addEventListener('keydown', (event) => {
  if (event.key === 'ArrowLeft') { event.preventDefault(); moveConfessions(-1); }
  if (event.key === 'ArrowRight') { event.preventDefault(); moveConfessions(1); }
});

confessionViewport?.addEventListener('pointerdown', (event) => {
  dragging = true;
  dragStartX = event.clientX;
  dragStartScroll = confessionViewport.scrollLeft;
  confessionViewport.setPointerCapture(event.pointerId);
  confessionViewport.classList.add('is-dragging');
});

confessionViewport?.addEventListener('pointermove', (event) => {
  if (!dragging) return;
  confessionViewport.scrollLeft = dragStartScroll - (event.clientX - dragStartX) * 1.15;
});

function endDrag(event) {
  if (!dragging) return;
  dragging = false;
  confessionViewport.classList.remove('is-dragging');
  if (confessionViewport.hasPointerCapture?.(event.pointerId)) confessionViewport.releasePointerCapture(event.pointerId);
}

confessionViewport?.addEventListener('pointerup', endDrag);
confessionViewport?.addEventListener('pointercancel', endDrag);

function updateCardMotion() {
  if (!confessionViewport || reduceMotion.matches) return;
  const viewportCenter = confessionViewport.getBoundingClientRect().left + confessionViewport.clientWidth / 2;
  confessionCards.forEach((card) => {
    const box = card.getBoundingClientRect();
    const distance = Math.abs((box.left + box.width / 2) - viewportCenter);
    card.style.setProperty('--lift', `${Math.min(22, distance / 35)}px`);
  });
}

confessionViewport?.addEventListener('scroll', updateCardMotion, { passive: true });
window.addEventListener('resize', updateCardMotion);
updateCardMotion();
