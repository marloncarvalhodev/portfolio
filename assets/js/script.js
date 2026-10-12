const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

const introShouldPlay = !reduceMotion.matches;

if (introShouldPlay) {
  document.documentElement.classList.add('intro-enabled');
}

document.addEventListener('DOMContentLoaded', () => {
  const menuButton = document.querySelector('.menu-toggle');
  const themeButton = document.querySelector('.theme-toggle');
  const themeColor = document.querySelector('meta[name="theme-color"]');
  const navigation = document.querySelector('.site-nav');
  const menuLabel = document.querySelector('.menu-toggle__label');
  const progressBar = document.querySelector('.scroll-progress span');
  const heroTitle = document.querySelector('#hero-title');
  const cursorRevealTargets = [...document.querySelectorAll('#hero-title, [data-cursor-text]')];


  function setupCustomCursor() {
    const precisePointer = window.matchMedia('(hover: hover) and (pointer: fine)');
    if (!precisePointer.matches) return;

    const cursor = document.createElement('div');
    cursor.className = 'custom-cursor';
    cursor.setAttribute('aria-hidden', 'true');
    document.body.appendChild(cursor);

    let currentX = 0;
    let currentY = 0;
    let targetX = 0;
    let targetY = 0;
    let animationFrame = 0;
    let activeRevealTarget = null;

    const interactiveSelector = 'a, button, input, select, textarea, summary, [role="button"], [tabindex]:not([tabindex="-1"])';

    function renderCursor() {
      const smoothing = reduceMotion.matches ? 1 : .34;
      currentX += (targetX - currentX) * smoothing;
      currentY += (targetY - currentY) * smoothing;
      cursor.style.transform = `translate3d(${currentX}px, ${currentY}px, 0) translate(-50%, -50%)`;

      if (activeRevealTarget && !reduceMotion.matches) {
        const bounds = activeRevealTarget.getBoundingClientRect();
        activeRevealTarget.style.setProperty('--cursor-x', `${currentX - bounds.left}px`);
        activeRevealTarget.style.setProperty('--cursor-y', `${currentY - bounds.top}px`);
      }

      if (Math.abs(targetX - currentX) > .1 || Math.abs(targetY - currentY) > .1) {
        animationFrame = requestAnimationFrame(renderCursor);
      } else {
        animationFrame = 0;
      }
    }

    function updateTarget(event) {
      targetX = event.clientX;
      targetY = event.clientY;
      const nextRevealTarget = event.target.closest('#hero-title, [data-cursor-text]');
      if (nextRevealTarget !== activeRevealTarget) {
        cursorRevealTargets.forEach((target) => target.classList.remove('is-cursor-active'));
        activeRevealTarget = nextRevealTarget;
        activeRevealTarget?.classList.toggle('is-cursor-active', !reduceMotion.matches);
      }
      cursor.classList.toggle('is-interactive', Boolean(event.target.closest(interactiveSelector)));

      if (!cursor.classList.contains('is-visible')) {
        currentX = targetX;
        currentY = targetY;
        cursor.classList.add('is-visible');
      }

      if (!animationFrame) animationFrame = requestAnimationFrame(renderCursor);
    }

    window.addEventListener('pointermove', updateTarget, { passive: true });
    document.documentElement.addEventListener('pointerleave', () => {
      cursor.classList.remove('is-visible', 'is-interactive');
      cursorRevealTargets.forEach((target) => target.classList.remove('is-cursor-active'));
      activeRevealTarget = null;
    });
  }

  setupCustomCursor();

  function setTheme(theme, persist = true) {
    const dark = theme === 'dark';
    if (dark) document.documentElement.dataset.theme = 'dark';
    else delete document.documentElement.dataset.theme;
    themeButton.setAttribute('aria-pressed', String(dark));
    themeButton.setAttribute('aria-label', dark ? 'Ativar modo claro' : 'Ativar modo escuro');
    themeColor.content = dark ? '#09090b' : '#f7f6f2';
    if (persist) {
      try { localStorage.setItem('portfolio-theme', dark ? 'dark' : 'light'); } catch {}
    }
  }

  setTheme(document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light', false);
  themeButton.addEventListener('click', () => {
    setTheme(document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark');
  });

  function setMenu(open) {
    menuButton.setAttribute('aria-expanded', String(open));
    navigation.classList.toggle('is-open', open);
    document.body.classList.toggle('menu-open', open);
    menuLabel.textContent = open ? 'Fechar' : 'Menu';
  }

  menuButton.addEventListener('click', () => setMenu(menuButton.getAttribute('aria-expanded') !== 'true'));
  navigation.querySelectorAll('a').forEach((link) => link.addEventListener('click', () => setMenu(false)));
  document.addEventListener('keydown', (event) => { if (event.key === 'Escape') setMenu(false); });

  function updateProgress() {
    const available = document.documentElement.scrollHeight - window.innerHeight;
    const progress = available > 0 ? window.scrollY / available : 0;
    progressBar.style.transform = `scaleX(${Math.min(1, Math.max(0, progress))})`;
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });

  document.querySelectorAll('.reveal').forEach((element) => observer.observe(element));

  function finishIntro(preservedHeroRole = null) {
    if (preservedHeroRole) {
      preservedHeroRole.style.transition = 'none';
      preservedHeroRole.classList.add('is-visible');
    }

    document.documentElement.classList.remove('intro-enabled');
    document.querySelector('.hero__role.intro-target')?.classList.remove('intro-target');
    document.querySelectorAll('header, main, footer').forEach((element) => { element.inert = false; });

    if (preservedHeroRole) {
      requestAnimationFrame(() => requestAnimationFrame(() => {
        preservedHeroRole.style.removeProperty('transition');
      }));
    }
  }

  async function playIntro() {
    const intro = document.querySelector('[data-intro]');
    const introContent = intro?.querySelector('.intro__content');
    const introName = document.querySelector('[data-intro-name]');
    const introRole = document.querySelector('[data-intro-role]');
    const heroTitle = document.querySelector('#hero-title');
    const heroRole = document.querySelector('.hero__role');

    if (!intro || !introContent || !introName || !introRole || !heroTitle || !heroRole) {
      finishIntro();
      return;
    }

    window.scrollTo(0, 0);
    document.querySelectorAll('header, main, footer').forEach((element) => { element.inert = true; });

    await document.fonts.ready;
    heroRole.classList.add('intro-target');

    const introLines = [...introName.querySelectorAll('.hero__line > span')];
    const targetLines = [...heroTitle.querySelectorAll('.hero__name-layer--solid .hero__line > span')];
    introContent.style.opacity = '1';
    introContent.style.transform = 'none';

    const entranceSequence = [
      { element: introLines[0], delay: 0, duration: 500 },
      { element: introLines[1], delay: 350, duration: 500 },
      { element: introRole, delay: 750, duration: 400 }
    ].map(({ element, delay, duration }) => element.animate([
      { opacity: 0, transform: 'translateY(1rem)' },
      { opacity: 1, transform: 'translateY(0)' }
    ], {
      delay,
      duration,
      easing: 'cubic-bezier(.2,.75,.25,1)',
      fill: 'both'
    }));

    await Promise.all(entranceSequence.map((animation) => animation.finished));
    [...introLines, introRole].forEach((element) => {
      element.style.opacity = '1';
      element.style.transform = 'none';
    });
    entranceSequence.forEach((animation) => animation.cancel());
    await new Promise((resolve) => setTimeout(resolve, 650));

    const animations = introLines.map((line, index) => {
      const sourceRange = document.createRange();
      const targetRange = document.createRange();
      sourceRange.selectNodeContents(line);
      targetRange.selectNodeContents(targetLines[index]);

      const source = sourceRange.getBoundingClientRect();
      const target = targetRange.getBoundingClientRect();
      const lineBox = line.getBoundingClientRect();
      const scale = target.width / source.width;
      line.style.transformOrigin = `${source.left - lineBox.left}px ${source.top - lineBox.top}px`;

      return line.animate([
        {
          transform: 'translate(0, 0) scale(1)'
        },
        {
          transform: `translate(${target.left - source.left}px, ${target.top - source.top}px) scale(${scale})`
        }
      ], {
        duration: 800,
        easing: 'cubic-bezier(.2,.75,.25,1)',
        fill: 'forwards'
      });
    });

    const introRoleRange = document.createRange();
    const heroRoleRange = document.createRange();
    introRoleRange.selectNodeContents(introRole);
    heroRoleRange.selectNodeContents(heroRole);
    const introRoleRect = introRoleRange.getBoundingClientRect();
    const heroRoleRect = heroRoleRange.getBoundingClientRect();
    const introRoleBox = introRole.getBoundingClientRect();
    const roleScale = heroRoleRect.width / introRoleRect.width;
    introRole.style.transformOrigin = `${introRoleRect.left - introRoleBox.left}px ${introRoleRect.top - introRoleBox.top}px`;
    animations.push(introRole.animate([
      { transform: 'translate(0, 0) scale(1)' },
      { transform: `translate(${heroRoleRect.left - introRoleRect.left}px, ${heroRoleRect.top - introRoleRect.top}px) scale(${roleScale})` }
    ], {
      duration: 800,
      easing: 'cubic-bezier(.2,.75,.25,1)',
      fill: 'forwards'
    }));

    await Promise.allSettled(animations.map((animation) => animation.finished));
    finishIntro(heroRole);
  }

  if (introShouldPlay) {
    playIntro().catch(() => finishIntro());
  } else {
    finishIntro();
  }

  window.addEventListener('scroll', updateProgress, { passive: true });
  window.addEventListener('resize', () => { updateProgress(); if (window.innerWidth > 680) setMenu(false); });
  updateProgress();
});
