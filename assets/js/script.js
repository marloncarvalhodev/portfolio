const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

const introShouldPlay = !reduceMotion.matches;

if (introShouldPlay) {
  document.documentElement.classList.add('intro-enabled');
}

document.addEventListener('DOMContentLoaded', () => {
  const themeButton = document.querySelector('.theme-toggle');
  const themeColor = document.querySelector('meta[name="theme-color"]');
  const navigation = document.querySelector('.site-nav');
  const progressBar = document.querySelector('.scroll-progress span');
  const cursorRevealTargets = [...document.querySelectorAll('[data-cursor-text]')];


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
      const nextRevealTarget = event.target.closest('[data-cursor-text]');
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

  function setupSpotlight() {
    const container = document.getElementById('nmw');
    if (!container) return;

    let isHovering = false;
    let lastInteraction = 0;
    let animId = null;
    let isVisible = false;
    const INACTIVE_DELAY = 1800;

    function updateRadius() {
      const isMobile = window.innerWidth <= 680;
      const r = isMobile ? '65px' : '90px';
      container.style.setProperty('--r', r);
    }
    updateRadius();
    window.addEventListener('resize', updateRadius, { passive: true });

    function onPointerMove(e) {
      const rect = container.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      container.style.setProperty('--x', `${x.toFixed(1)}px`);
      container.style.setProperty('--y', `${y.toFixed(1)}px`);
      lastInteraction = performance.now();
      isHovering = true;
    }

    const heroZone = container.closest('.hero__composition') || container;

    heroZone.addEventListener('pointermove', onPointerMove, { passive: true });
    heroZone.addEventListener('pointerenter', (e) => {
      onPointerMove(e);
      isHovering = true;
      lastInteraction = performance.now();
    });
    heroZone.addEventListener('pointerleave', () => {
      isHovering = false;
      lastInteraction = performance.now();
    });

    heroZone.addEventListener('touchmove', (e) => {
      if (e.touches && e.touches[0]) {
        const touch = e.touches[0];
        const rect = container.getBoundingClientRect();
        const x = touch.clientX - rect.left;
        const y = touch.clientY - rect.top;
        container.style.setProperty('--x', `${x.toFixed(1)}px`);
        container.style.setProperty('--y', `${y.toFixed(1)}px`);
        lastInteraction = performance.now();
        isHovering = true;
      }
    }, { passive: true });

    heroZone.addEventListener('touchend', () => {
      isHovering = false;
      lastInteraction = performance.now();
    }, { passive: true });

    function animate(timestamp) {
      if (!isVisible) return;

      const timeSinceInteraction = performance.now() - lastInteraction;
      const shouldAnimateAutonomously = !isHovering || timeSinceInteraction > INACTIVE_DELAY;

      if (shouldAnimateAutonomously && !reduceMotion.matches) {
        const rect = container.getBoundingClientRect();
        const width = rect.width;
        const height = rect.height;

        if (width > 0 && height > 0) {
          const t = timestamp * 0.0016;
          const xPercent = 0.5 + 0.42 * Math.sin(t);
          const yPercent = 0.5 + 0.32 * Math.sin(t * 1.7);

          container.style.setProperty('--x', `${(xPercent * width).toFixed(1)}px`);
          container.style.setProperty('--y', `${(yPercent * height).toFixed(1)}px`);
        }
      }

      animId = requestAnimationFrame(animate);
    }

    function startAnimation() {
      if (!animId) {
        animId = requestAnimationFrame(animate);
      }
    }

    function stopAnimation() {
      if (animId) {
        cancelAnimationFrame(animId);
        animId = null;
      }
    }

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        isVisible = entry.isIntersecting;
        if (isVisible) {
          startAnimation();
        } else {
          stopAnimation();
        }
      });
    }, { threshold: 0.05 });

    observer.observe(container);
  }

  setupSpotlight();

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

  function setupBottomNavHighlight() {
    const bottomNav = document.querySelector('.bottom-nav');
    if (!bottomNav) return;

    const navLinks = bottomNav.querySelectorAll('a');
    const sections = [...navLinks].map((link) => {
      const id = link.getAttribute('href').slice(1);
      return document.getElementById(id);
    }).filter(Boolean);

    const mobileQuery = window.matchMedia('(max-width: 768px)');

    function updateActiveLink() {
      if (!mobileQuery.matches) return;
      const scrollPos = window.scrollY + window.innerHeight * 0.4;
      const isAtBottom = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 60;
      let currentSectionId = '';

      if (isAtBottom) {
        currentSectionId = 'contato';
      } else {
        for (let i = sections.length - 1; i >= 0; i--) {
          const section = sections[i];
          if (section.offsetTop <= scrollPos) {
            currentSectionId = section.id;
            break;
          }
        }
      }

      navLinks.forEach((link) => {
        const targetId = link.getAttribute('href').slice(1);
        link.classList.toggle('is-active', targetId === currentSectionId);
      });
    }

    navLinks.forEach((link) => {
      link.addEventListener('click', () => {
        navLinks.forEach((l) => l.classList.remove('is-active'));
        link.classList.add('is-active');
      });
    });

    window.addEventListener('scroll', updateActiveLink, { passive: true });
    updateActiveLink();
  }

  setupBottomNavHighlight();

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

  function setupMobileStackAnimation() {
    const grupoLinguagens = document.getElementById('grupo-linguagens');
    const grupoFrameworks = document.getElementById('grupo-frameworks');
    const grupoFerramentas = document.getElementById('grupo-ferramentas');
    const secaoContato = document.getElementById('contato');

    if (!grupoLinguagens || !grupoFrameworks || !grupoFerramentas) return;

    const mobileQuery = window.matchMedia('(max-width: 768px)');
    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

    function activateLinguagens() {
      if (!grupoLinguagens.classList.contains('is-active')) {
        grupoLinguagens.classList.add('is-active');
      }
    }

    function activateFrameworks() {
      activateLinguagens();
      if (!grupoFrameworks.classList.contains('is-active')) {
        grupoFrameworks.classList.add('is-active');
      }
    }

    function activateFerramentas() {
      activateFrameworks();
      if (!grupoFerramentas.classList.contains('is-active')) {
        grupoFerramentas.classList.add('is-active');
      }
    }

    function isAllActive() {
      return grupoLinguagens.classList.contains('is-active') &&
             grupoFrameworks.classList.contains('is-active') &&
             grupoFerramentas.classList.contains('is-active');
    }

    // Se preferir movimento reduzido, ativa todos os grupos de imediato sem animação
    if (motionQuery.matches) {
      activateFerramentas();
      return;
    }

    // IntersectionObserver com rootMargin ajustada:
    // 2º Momento: Quando 'Frameworks e Estilo' atinge ~35% da base da tela -> ativa Linguagens
    const observerFrameworks = new IntersectionObserver((entries) => {
      if (!mobileQuery.matches) return;
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          activateLinguagens();
          observerFrameworks.unobserve(entry.target);
        }
      });
    }, { rootMargin: '0px 0px -35% 0px', threshold: 0 });

    // 3º Momento: Quando 'Ferramentas' começa a surgir na tela -> ativa Frameworks
    const observerFerramentas = new IntersectionObserver((entries) => {
      if (!mobileQuery.matches) return;
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          activateFrameworks();
          observerFerramentas.unobserve(entry.target);
        }
      });
    }, { rootMargin: '0px 0px -25% 0px', threshold: 0 });

    // 4º Momento: Quando o usuário avança para 'Contato' -> ativa Ferramentas
    let observerContato = null;
    if (secaoContato) {
      observerContato = new IntersectionObserver((entries) => {
        if (!mobileQuery.matches) return;
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            activateFerramentas();
            observerContato.unobserve(entry.target);
          }
        });
      }, { rootMargin: '0px 0px -15% 0px', threshold: 0 });
      observerContato.observe(secaoContato);
    }

    observerFrameworks.observe(grupoFrameworks);
    observerFerramentas.observe(grupoFerramentas);

    // Monitoramento leve de scroll para precisão contínua no mobile
    let ticking = false;
    function checkScroll() {
      if (!mobileQuery.matches || isAllActive()) return;

      const vh = window.innerHeight;

      // Frameworks atinge ~35% da base da tela (top <= 65% da altura da tela) -> Linguagens ganha cor
      if (!grupoLinguagens.classList.contains('is-active')) {
        const rectFw = grupoFrameworks.getBoundingClientRect();
        if (rectFw.top <= vh * 0.65) {
          activateLinguagens();
        }
      }

      // Ferramentas começa a surgir na tela (top <= 75% da tela) -> Frameworks ganha cor
      if (!grupoFrameworks.classList.contains('is-active')) {
        const rectFer = grupoFerramentas.getBoundingClientRect();
        if (rectFer.top <= vh * 0.75) {
          activateFrameworks();
        }
      }

      // Seção Contato surge na visão (top <= 85% da tela) -> Ferramentas ganha cor
      if (secaoContato && !grupoFerramentas.classList.contains('is-active')) {
        const rectCt = secaoContato.getBoundingClientRect();
        if (rectCt.top <= vh * 0.85) {
          activateFerramentas();
        }
      }
    }

    window.addEventListener('scroll', () => {
      if (mobileQuery.matches && !isAllActive() && !ticking) {
        ticking = true;
        requestAnimationFrame(() => {
          checkScroll();
          ticking = false;
        });
      }
    }, { passive: true });

    // Verificação inicial caso já esteja scrollado na seção
    if (mobileQuery.matches) {
      checkScroll();
    }

    mobileQuery.addEventListener('change', (e) => {
      if (e.matches) {
        checkScroll();
      }
    });
  }

  setupMobileStackAnimation();

  function setupMobileProjectFocus() {
    const projects = [...document.querySelectorAll('.project')];
    if (!projects.length) return;

    const mobileQuery = window.matchMedia('(max-width: 768px)');
    let activeCard = null;

    function updateActiveCard() {
      if (!mobileQuery.matches) {
        if (activeCard) {
          activeCard.classList.remove('is-focused');
          activeCard = null;
        }
        return;
      }

      const viewportCenter = window.innerHeight / 2;
      let closestCard = null;
      let minDistance = Infinity;

      projects.forEach((card) => {
        const rect = card.getBoundingClientRect();
        if (rect.bottom > window.innerHeight * 0.25 && rect.top < window.innerHeight * 0.75) {
          const cardCenter = rect.top + rect.height / 2;
          const dist = Math.abs(cardCenter - viewportCenter);
          if (dist < minDistance) {
            minDistance = dist;
            closestCard = card;
          }
        }
      });

      if (closestCard !== activeCard) {
        if (activeCard) {
          activeCard.classList.remove('is-focused');
        }
        if (closestCard) {
          closestCard.classList.add('is-focused');
        }
        activeCard = closestCard;
      }
    }

    const observer = new IntersectionObserver(() => {
      if (mobileQuery.matches) {
        updateActiveCard();
      }
    }, {
      rootMargin: '-25% 0px -25% 0px',
      threshold: [0, 0.25, 0.5, 0.75, 1]
    });

    projects.forEach((card) => observer.observe(card));

    let ticking = false;
    window.addEventListener('scroll', () => {
      if (mobileQuery.matches && !ticking) {
        ticking = true;
        requestAnimationFrame(() => {
          updateActiveCard();
          ticking = false;
        });
      }
    }, { passive: true });

    window.addEventListener('resize', () => {
      if (!mobileQuery.matches && activeCard) {
        activeCard.classList.remove('is-focused');
        activeCard = null;
      } else if (mobileQuery.matches) {
        updateActiveCard();
      }
    }, { passive: true });
  }

  setupMobileProjectFocus();

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
