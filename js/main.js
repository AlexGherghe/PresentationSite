// ========================================
// Navigation
// ========================================
document.addEventListener('DOMContentLoaded', () => {
  const nav = document.querySelector('.nav');
  const toggle = document.querySelector('.nav__toggle');
  const links = document.querySelector('.nav__links');
  const themeToggle = document.querySelector('.theme-toggle');

  // Scroll-based nav styling
  const onScroll = () => {
    if (window.scrollY > 20) {
      nav.classList.add('scrolled');
    } else {
      nav.classList.remove('scrolled');
    }
  };

  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  // Mobile menu toggle
  if (toggle && links) {
    toggle.addEventListener('click', () => {
      toggle.classList.toggle('open');
      links.classList.toggle('open');
      document.body.style.overflow = links.classList.contains('open') ? 'hidden' : '';
    });

    // Close menu when a link is clicked
    links.querySelectorAll('.nav__link').forEach(link => {
      link.addEventListener('click', () => {
        toggle.classList.remove('open');
        links.classList.remove('open');
        document.body.style.overflow = '';
      });
    });
  }

  // ========================================
  // Theme Toggle
  // ========================================
  if (themeToggle) {
    themeToggle.addEventListener('click', () => {
      const html = document.documentElement;
      const currentTheme = html.getAttribute('data-theme');
      const newTheme = currentTheme === 'light' ? null : 'light';

      if (newTheme) {
        html.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
      } else {
        html.removeAttribute('data-theme');
        localStorage.removeItem('theme');
      }
    });
  }

  // ========================================
  // Scroll Animations (IntersectionObserver)
  // ========================================
  const fadeElements = document.querySelectorAll('.fade-in');

  if (fadeElements.length > 0 && 'IntersectionObserver' in window) {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            observer.unobserve(entry.target);
          }
        });
      },
      {
        threshold: 0.05,
        rootMargin: '50px 0px 0px 0px'
      }
    );

    // Small delay to ensure layout is settled before observing
    requestAnimationFrame(() => {
      fadeElements.forEach(el => observer.observe(el));
    });
  } else {
    // Fallback: just show everything
    fadeElements.forEach(el => el.classList.add('visible'));
  }

  // ========================================
  // Code Block: Copy to Clipboard
  // ========================================
  document.querySelectorAll('.code-block__copy').forEach(btn => {
    btn.addEventListener('click', () => {
      const codeBlock = btn.closest('.code-block');
      const code = codeBlock.querySelector('code');
      const text = code.textContent;

      navigator.clipboard.writeText(text).then(() => {
        btn.classList.add('copied');
        btn.querySelector('.code-block__copy-text').textContent = 'Copied!';

        setTimeout(() => {
          btn.classList.remove('copied');
          btn.querySelector('.code-block__copy-text').textContent = 'Copy';
        }, 2000);
      });
    });
  });

  // ========================================
  // Code Block: Collapsible (max 300px)
  // ========================================
  const CODE_COLLAPSE_HEIGHT = 300;

  function initCollapsibleCodeBlocks() {
    document.querySelectorAll('.code-block').forEach(block => {
      const body = block.querySelector('.code-block__body');
      const expandBtn = block.querySelector('.code-block__expand');
      if (!body || !expandBtn) return;

      // Measure natural height
      const naturalHeight = body.scrollHeight;

      if (naturalHeight <= CODE_COLLAPSE_HEIGHT) {
        // Short block — hide the expand button entirely
        expandBtn.style.display = 'none';
        return;
      }

      // Tall block — collapse it
      block.classList.add('code-block--collapsed');

      expandBtn.addEventListener('click', () => {
        const isCollapsed = block.classList.contains('code-block--collapsed');

        if (isCollapsed) {
          // Expand: set explicit height for transition, then remove
          body.style.maxHeight = naturalHeight + 'px';
          block.classList.remove('code-block--collapsed');
          block.classList.add('code-block--expanded');
          expandBtn.querySelector('span').textContent = 'Show less';

          // After transition, remove max-height so content can reflow
          body.addEventListener('transitionend', function handler() {
            body.style.maxHeight = 'none';
            body.removeEventListener('transitionend', handler);
          });
        } else {
          // Collapse: set current height first, then animate to collapsed
          body.style.maxHeight = body.scrollHeight + 'px';
          // Force reflow
          body.offsetHeight;
          body.style.maxHeight = CODE_COLLAPSE_HEIGHT + 'px';
          block.classList.add('code-block--collapsed');
          block.classList.remove('code-block--expanded');
          expandBtn.querySelector('span').textContent = 'Show more';

          // Scroll the block into view if it's now above viewport
          setTimeout(() => {
            const rect = block.getBoundingClientRect();
            if (rect.top < 0) {
              block.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
          }, 300);
        }
      });
    });
  }

  // ========================================
  // Code Block: Horizontal Scroll Hint
  // ========================================
  function initScrollHints() {
    document.querySelectorAll('.code-block__body').forEach(body => {
      const pre = body.querySelector('pre');
      if (!pre) return;

      function updateScrollHint() {
        const hasOverflow = pre.scrollWidth > pre.clientWidth;
        const atEnd = pre.scrollLeft + pre.clientWidth >= pre.scrollWidth - 2;

        if (hasOverflow && !atEnd) {
          body.classList.add('has-overflow');
        } else {
          body.classList.remove('has-overflow');
        }
      }

      pre.addEventListener('scroll', updateScrollHint, { passive: true });
      updateScrollHint();

      // Re-check after Prism highlighting finishes
      window.addEventListener('load', updateScrollHint);
    });
  }

  // Wait a tick for Prism to finish highlighting, then init
  // (Prism scripts are `defer`, so they run after DOM parse but we need
  //  them to finish before measuring heights)
  if (document.querySelectorAll('.code-block').length > 0) {
    window.addEventListener('load', () => {
      // Give Prism + line-numbers plugin a frame to render
      requestAnimationFrame(() => {
        initCollapsibleCodeBlocks();
        initScrollHints();
      });
    });
  }
});
