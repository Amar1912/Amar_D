/* ===================================
   PREMIUM PORTFOLIO - MAIN JAVASCRIPT
   =================================== */

// Delegated resilient handler: attach document-level listeners so the menu-toggle works
// even if elements are added later or scripts run in different orders. Also add
// keyboard support and ARIA attributes for accessibility.
(function(){
  try {
    function toggleMobileMenu(mt) {
      const mn = document.querySelector('.mobile-nav');
      if (!mt) return;
      const isActive = mt.classList.toggle('active');
      if (mn) mn.classList.toggle('active');
      document.body.style.overflow = (mn && mn.classList.contains('active')) ? 'hidden' : '';
      mt.setAttribute('aria-expanded', isActive ? 'true' : 'false');
      console.info('[menu-delegate] toggled', { active: isActive });
    }

    document.addEventListener('click', function(e){
      const mt = e.target.closest('.menu-toggle');
      if (!mt) return;
      toggleMobileMenu(mt);
    }, false);

    document.addEventListener('keydown', function(e){
      // Toggle on Enter or Space when focused on menu-toggle
      if (e.key === 'Enter' || e.key === ' ') {
        const mt = document.activeElement;
        if (mt && mt.classList && mt.classList.contains('menu-toggle')) {
          e.preventDefault();
          toggleMobileMenu(mt);
        }
      }
    }, false);

    // If a menu-toggle exists at parse time, ensure accessibility attributes
    const mtInit = document.querySelector('.menu-toggle');
    if (mtInit) {
      mtInit.setAttribute('role', 'button');
      mtInit.setAttribute('tabindex', '0');
      mtInit.setAttribute('aria-expanded', mtInit.classList.contains('active') ? 'true' : 'false');
    }
  } catch (err) {
    console.warn('[menu-delegate] error attaching handlers', err);
  }
})();

document.addEventListener('DOMContentLoaded', function() {
  
  // ===================================
  // PAGE LOADER
  // ===================================
  const pageLoader = document.querySelector('.page-loader');
  
  window.addEventListener('load', function() {
    setTimeout(function() {
      pageLoader.classList.add('loaded');
    }, 500);
  });
  
  // ===================================
  // NAVBAR SCROLL EFFECT
  // ===================================
  const navbar = document.querySelector('.navbar');
  let lastScroll = 0;
  
  window.addEventListener('scroll', function() {
    const currentScroll = window.pageYOffset;
    
    if (currentScroll > 100) {
      navbar.classList.add('scrolled');
    } else {
      navbar.classList.remove('scrolled');
    }
    
    lastScroll = currentScroll;
  });
  
  // ===================================
  // MOBILE MENU TOGGLE
  // ===================================
  const menuToggle = document.querySelector('.menu-toggle');
  const mobileNav = document.querySelector('.mobile-nav');
  const mobileNavLinks = document.querySelectorAll('.mobile-nav-links a');
  
  if (menuToggle && mobileNav) {
    console.info('[main] menuToggle/mobileNav found', { menuToggle: !!menuToggle, mobileNav: !!mobileNav, mobileNavLinks: mobileNavLinks.length });

    // Ensure accessibility attributes
    menuToggle.setAttribute('role', 'button');
    menuToggle.setAttribute('tabindex', '0');
    menuToggle.setAttribute('aria-expanded', menuToggle.classList.contains('active') ? 'true' : 'false');

    function toggleMobileMenu(e) {
      console.info('[main] toggleMobileMenu');
      const isActive = menuToggle.classList.toggle('active');
      mobileNav.classList.toggle('active');
      document.body.style.overflow = mobileNav.classList.contains('active') ? 'hidden' : '';
      menuToggle.setAttribute('aria-expanded', isActive ? 'true' : 'false');
    }

    menuToggle.addEventListener('click', function(e) {
      console.info('[debug-menu] menu-toggle clicked');
      toggleMobileMenu(e);
    });

    // Also support touch devices; do NOT prevent default here (prevents link navigation on some browsers)
    menuToggle.addEventListener('touchstart', function(e) { 
      console.info('[debug-menu] menu-toggle touchstart');
      toggleMobileMenu(e); 
    }, { passive: true });

    // Keyboard support (Enter/Space)
    menuToggle.addEventListener('keydown', function(e) {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        console.info('[debug-menu] menu-toggle keyboard toggle', e.key);
        toggleMobileMenu(e);
      }
    });

    // Close mobile menu when link is clicked (direct listeners)
    mobileNavLinks.forEach(function(link) {
      link.addEventListener('click', function(e) {
        console.info('[debug-menu] mobile-nav link clicked', { href: this.getAttribute('href') });
        // Close menu UI
        menuToggle.classList.remove('active');
        mobileNav.classList.remove('active');
        document.body.style.overflow = '';
        menuToggle.setAttribute('aria-expanded', 'false');

        // Fallback: If the browser doesn't navigate (sometimes happens in responsive emulation),
        // force navigation after a short delay so the link always works in tests.
        const href = this.href;
        const target = this.getAttribute('target');
        setTimeout(function() {
          try {
            if (target === '_blank') {
              window.open(href, '_blank');
            } else if (location.href !== href) {
              window.location.assign(href);
            }
          } catch (err) {
            console.warn('[debug-menu] forced navigation failed', err);
          }
        }, 80);
      });
      // also ensure touch taps close the menu but do not prevent navigation
      link.addEventListener('touchstart', function() {
        // no preventDefault here
        menuToggle.classList.remove('active');
        mobileNav.classList.remove('active');
        document.body.style.overflow = '';
        menuToggle.setAttribute('aria-expanded', 'false');
      }, { passive: true });
    });

    // Delegated backup handler: catch mobile nav link clicks even if listeners aren't attached
    document.addEventListener('click', function(e) {
      const link = e.target.closest('.mobile-nav-links a');
      if (!link) return;

      console.info('[debug-menu] delegated mobile-nav link click', { href: link.href, active: mobileNav.classList.contains('active') });

      // Respect modifier keys (open in new tab etc.)
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;

      // Close UI immediately
      menuToggle.classList.remove('active');
      mobileNav.classList.remove('active');
      document.body.style.overflow = '';
      menuToggle.setAttribute('aria-expanded', 'false');

      // Force navigation quickly when in responsive emulation where default navigation may be suppressed
      const href = link.href;
      const target = link.getAttribute('target');
      setTimeout(function() {
        try {
          if (target === '_blank') {
            window.open(href, '_blank');
          } else if (location.href !== href) {
            window.location.assign(href);
          } else {
            console.info('[debug-menu] same href, no navigation needed');
          }
        } catch (err) {
          console.warn('[debug-menu] delegated forced navigation failed', err);
        }
      }, 40);
    });

    // Pointer-debug and fallback: if a pointerdown occurs on the toggle but the UI doesn't change,
    // toggle the UI after a short delay. Also listen for pointerup as a backup (some devtools modes
    // suppress click events).
    document.addEventListener('pointerdown', function(e) {
      const mt = e.target.closest('.menu-toggle');
      if (!mt) return;
      console.info('[pointer-debug] pointerdown on menu-toggle');

      // If the click didn't toggle the UI, toggle it explicitly
      setTimeout(function() {
        try {
          const mn = document.querySelector('.mobile-nav');
          const mtActive = mt.classList.contains('active');
          if (!mtActive) {
            console.warn('[pointer-debug] fallback: activating menu (toggle on)');
            mt.classList.add('active');
            if (mn) mn.classList.add('active');
            document.body.style.overflow = 'hidden';
            mt.setAttribute('aria-expanded', 'true');
          } else {
            // If active but not matching mobileNav, ensure sync
            if (mn && !mn.classList.contains('active')) {
              console.warn('[pointer-debug] fallback: syncing mobile-nav (activating)');
              mn.classList.add('active');
            }
          }
        } catch (err) {
          console.warn('[pointer-debug] fallback error', err);
        }
      }, 60);
    });

    document.addEventListener('pointerup', function(e) {
      const mt = e.target.closest('.menu-toggle');
      if (!mt) return;
      console.info('[pointer-debug] pointerup on menu-toggle');

      // If pointerup occurs and the menu is not active, trigger the toggle (covers suppressed clicks)
      try {
        const mn = document.querySelector('.mobile-nav');
        if (!mt.classList.contains('active')) {
          console.warn('[pointer-debug] fallback on pointerup: toggling menu');
          mt.classList.add('active');
          if (mn) mn.classList.add('active');
          document.body.style.overflow = 'hidden';
          mt.setAttribute('aria-expanded', 'true');
        } else {
          // if it was active, ensure mobile nav is in sync
          if (mn && !mn.classList.contains('active')) {
            console.warn('[pointer-debug] pointerup: syncing mobile-nav (activating)');
            mn.classList.add('active');
          }
        }
      } catch (err) {
        console.warn('[pointer-debug] pointerup fallback error', err);
      }
    });

    // Observe class changes for debugging
    try {
      const mtObserver = new MutationObserver(function(mutations) {
        mutations.forEach(function(m) {
          if (m.attributeName === 'class') {
            console.info('[observer] menu-toggle class changed', m.target.className);
          }
        });
      });
      const mnObserver = new MutationObserver(function(mutations) {
        mutations.forEach(function(m) {
          if (m.attributeName === 'class') {
            console.info('[observer] mobile-nav class changed', m.target.className);
          }
        });
      });
      if (menuToggle) mtObserver.observe(menuToggle, { attributes: true });
      if (mobileNav) mnObserver.observe(mobileNav, { attributes: true });
    } catch (err) {
      console.warn('[observer] failed to attach mutation observers', err);
    }

    // Close mobile menu if click occurs outside of it
    document.addEventListener('click', function(e) {
      if (mobileNav.classList.contains('active') && !mobileNav.contains(e.target) && !menuToggle.contains(e.target)) {
        menuToggle.classList.remove('active');
        mobileNav.classList.remove('active');
        document.body.style.overflow = '';
        menuToggle.setAttribute('aria-expanded', 'false');
      }
    });
  }
  
  // ===================================
  // SCROLL REVEAL ANIMATIONS
  // ===================================
  const revealElements = document.querySelectorAll('.reveal, .reveal-left, .reveal-right');
  
  const revealObserver = new IntersectionObserver(function(entries, observer) {
    entries.forEach(function(entry) {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
  });
  
  revealElements.forEach(function(el) {
    revealObserver.observe(el);
  });

  // When data is loaded dynamically (via portfolio.json), re-attach observers & handlers
  document.addEventListener('portfolio-data-loaded', function(e) {
    // re-observe reveal elements
    const newReveals = document.querySelectorAll('.reveal, .reveal-left, .reveal-right');
    newReveals.forEach(function(el) {
      if (!el.classList.contains('visible')) revealObserver.observe(el);
    });

    // re-observe skill cards
    const newSkillCards = document.querySelectorAll('.skill-card');
    newSkillCards.forEach(function(card) {
      card.classList.add('reveal');
      skillObserver && skillObserver.observe(card);
    });

    // re-observe stats counters
    const newStatNumbers = document.querySelectorAll('.stat-number');
    newStatNumbers.forEach(function(num) {
      if (num.hasAttribute('data-count')) counterObserver && counterObserver.observe(num);
    });

    // re-observe skill progress items and animate fills
    const newSkillProgressItems = document.querySelectorAll('.skill-progress-item');
    if (newSkillProgressItems.length) {
      if (typeof skillProgressObserver !== 'undefined') {
        newSkillProgressItems.forEach(function(item) {
          skillProgressObserver.observe(item);
        });
      } else {
        const tmpObserver = new IntersectionObserver(function(entries) {
          entries.forEach(function(entry) {
            if (entry.isIntersecting) {
              const progressFill = entry.target.querySelector('.skill-progress-fill');
              const targetWidth = progressFill && progressFill.getAttribute('data-progress');
              if (progressFill && targetWidth !== null) {
                progressFill.style.width = targetWidth + '%';
                entry.target.classList.add('animated');
              }
              tmpObserver.unobserve(entry.target);
            }
          });
        }, { threshold: 0.3 });
        newSkillProgressItems.forEach(function(item) { tmpObserver.observe(item); });
      }
    }

    // re-observe lazy images
    const newLazy = document.querySelectorAll('img[data-src]');
    newLazy.forEach(function(img) {
      imageObserver && imageObserver.observe(img);
    });

    // add hover handlers to new project cards
    const newProjectCards = document.querySelectorAll('.project-card');
    newProjectCards.forEach(function(card) {
      card.addEventListener('mouseenter', function() { this.style.zIndex = '10'; });
      card.addEventListener('mouseleave', function() { this.style.zIndex = '1'; });
    });

    // re-attach cursor hover behavior if cursor exists
    const cursor = document.querySelector('.custom-cursor');
    if (cursor) {
      const interactiveElements = document.querySelectorAll('a, button, .project-card, .skill-card, input, textarea');
      interactiveElements.forEach(function(el) {
        el.addEventListener('mouseenter', function() { cursor.classList.add('hover'); });
        el.addEventListener('mouseleave', function() { cursor.classList.remove('hover'); });
      });
    }

    // re-initialize timeline items observer (minimal replicating logic)
    const timelineEl = document.querySelector('.timeline');
    const timelineItems = document.querySelectorAll('.timeline-item');
    if (timelineEl && timelineItems.length) {
      const localTimelineObserver = new IntersectionObserver(function(entries) {
        entries.forEach(function(entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            localTimelineObserver.unobserve(entry.target);
          }
        });
      }, { threshold: 0.3, rootMargin: '0px 0px -100px 0px' });

      timelineItems.forEach(function(item) {
        localTimelineObserver.observe(item);
      });
    }

    // Ensure testimonials slider initializes after dynamic data loads
    (function initTestimonialsAfterData() {
      const testimonialSlider = document.querySelector('.testimonials-slider');
      if (!testimonialSlider) return;
      if (testimonialSlider.dataset.testimonialsInitialized === 'true') return;

      // Ensure grid is inside a track element the slider code expects
      let track = testimonialSlider.querySelector('.testimonials-track');
      const grid = testimonialSlider.querySelector('.testimonials-grid');
      if (!track && grid) {
        track = document.createElement('div');
        track.className = 'testimonials-track';
        testimonialSlider.insertBefore(track, grid);
        track.appendChild(grid);
      }

      const cards = testimonialSlider.querySelectorAll('.testimonial-card');
      if (!track || cards.length === 0) return;

      // Create dots container if missing
      let dotsContainer = testimonialSlider.querySelector('.testimonial-dots');
      if (!dotsContainer) {
        dotsContainer = document.createElement('div');
        dotsContainer.className = 'testimonial-dots';
        testimonialSlider.appendChild(dotsContainer);
      }

      testimonialSlider.dataset.testimonialsInitialized = 'true';

      let currentIndex = 0;
      let slidesPerView = 3;

      function updateSlidesPerView() {
        if (window.innerWidth <= 768) slidesPerView = 1;
        else if (window.innerWidth <= 1024) slidesPerView = 2;
        else slidesPerView = 3;
      }

      updateSlidesPerView();

      function createDots() {
        const totalDots = Math.ceil(cards.length / slidesPerView);
        dotsContainer.innerHTML = '';
        for (let i = 0; i < totalDots; i++) {
          const dot = document.createElement('button');
          dot.className = 'testimonial-dot' + (i === 0 ? ' active' : '');
          dot.setAttribute('aria-label', 'Go to slide ' + (i + 1));
          dot.addEventListener('click', function() { goToSlide(i * slidesPerView); });
          dotsContainer.appendChild(dot);
        }
      }

      function updateSlider() {
        const cardWidth = cards[0].offsetWidth + 32;
        track.style.transform = 'translateX(-' + (currentIndex * cardWidth) + 'px)';
        const dots = dotsContainer.querySelectorAll('.testimonial-dot');
        dots.forEach(function(dot, index) {
          dot.classList.toggle('active', index === Math.floor(currentIndex / slidesPerView));
        });
      }

      function goToSlide(idx) {
        currentIndex = Math.max(0, Math.min(idx, Math.max(0, cards.length - slidesPerView)));
        updateSlider();
      }

      // Prev/next buttons (optional)
      const prevBtn = testimonialSlider.querySelector('.testimonial-prev');
      const nextBtn = testimonialSlider.querySelector('.testimonial-next');
      if (prevBtn) prevBtn.addEventListener('click', function() { goToSlide(Math.max(0, currentIndex - slidesPerView)); });
      if (nextBtn) nextBtn.addEventListener('click', function() { goToSlide(Math.min(currentIndex + slidesPerView, Math.max(0, cards.length - slidesPerView))); });

      window.addEventListener('resize', function() {
        updateSlidesPerView();
        createDots();
        goToSlide(0);
      });

      createDots();
      updateSlider();
    })();
  });
  
  // ===================================
  // TIMELINE ANIMATIONS
  // ===================================
  const timelineItems = document.querySelectorAll('.timeline-item');
  const timelineLineProgress = document.querySelector('.timeline-line-progress');
  const timeline = document.querySelector('.timeline');
  
  if (timeline && timelineLineProgress) {
    const timelineObserver = new IntersectionObserver(function(entries) {
      entries.forEach(function(entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
        }
      });
    }, {
      threshold: 0.3,
      rootMargin: '0px 0px -100px 0px'
    });
    
    timelineItems.forEach(function(item) {
      timelineObserver.observe(item);
    });
    
    // Animate timeline line on scroll
    window.addEventListener('scroll', function() {
      const timelineRect = timeline.getBoundingClientRect();
      const timelineTop = timelineRect.top;
      const timelineHeight = timeline.offsetHeight;
      const windowHeight = window.innerHeight;
      
      if (timelineTop < windowHeight && timelineTop + timelineHeight > 0) {
        const scrollProgress = Math.min(Math.max((windowHeight - timelineTop) / (timelineHeight + windowHeight), 0), 1);
        timelineLineProgress.style.height = (scrollProgress * timelineHeight) + 'px';
      }
    });
  }
  
  // ===================================
  // SMOOTH SCROLL FOR ANCHOR LINKS
  // ===================================
  document.querySelectorAll('a[href^="#"]').forEach(function(anchor) {
    anchor.addEventListener('click', function(e) {
      e.preventDefault();
      const target = document.querySelector(this.getAttribute('href'));
      if (target) {
        const headerOffset = 100;
        const elementPosition = target.getBoundingClientRect().top;
        const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
        
        window.scrollTo({
          top: offsetPosition,
          behavior: 'smooth'
        });
      }
    });
  });
  
  // ===================================
  // FORM HANDLING
  // ===================================
  const contactForm = document.querySelector('.contact-form');
  
  if (contactForm) {
    contactForm.addEventListener('submit', function(e) {
      e.preventDefault();
      
      // Get form data
      const formData = new FormData(contactForm);
      const data = Object.fromEntries(formData);
      
      // Simple validation
      let isValid = true;
      const inputs = contactForm.querySelectorAll('input, textarea');
      
      inputs.forEach(function(input) {
        if (input.hasAttribute('required') && !input.value.trim()) {
          isValid = false;
          input.style.borderColor = '#E85D04';
        } else {
          input.style.borderColor = '';
        }
      });
      
      if (isValid) {
        // Show success message
        const submitBtn = contactForm.querySelector('.btn-submit');
        const originalText = submitBtn.textContent;
        submitBtn.textContent = 'Message Sent!';
        submitBtn.style.background = '#E85D04';
        
        setTimeout(function() {
          submitBtn.textContent = originalText;
          submitBtn.style.background = '';
          contactForm.reset();
        }, 3000);
      }
    });
    
    // Input focus effects
    const formInputs = contactForm.querySelectorAll('input, textarea');
    formInputs.forEach(function(input) {
      input.addEventListener('focus', function() {
        this.parentElement.classList.add('focused');
      });
      
      input.addEventListener('blur', function() {
        this.parentElement.classList.remove('focused');
      });
    });
  }
  
  // ===================================
  // PROJECT CARD HOVER EFFECTS
  // ===================================
  const projectCards = document.querySelectorAll('.project-card');
  
  projectCards.forEach(function(card) {
    card.addEventListener('mouseenter', function() {
      this.style.zIndex = '10';
    });
    
    card.addEventListener('mouseleave', function() {
      this.style.zIndex = '1';
    });
  });
  
  // ===================================
  // ANIMATED COUNTER
  // ===================================
  const statNumbers = document.querySelectorAll('.stat-number');
  
  const counterObserver = new IntersectionObserver(function(entries) {
    entries.forEach(function(entry) {
      if (entry.isIntersecting) {
        const target = entry.target;
        const finalValue = parseInt(target.getAttribute('data-count'));
        const suffix = target.getAttribute('data-suffix') || '';
        const duration = 2000;
        const increment = finalValue / (duration / 16);
        let currentValue = 0;
        
        const updateCounter = function() {
          currentValue += increment;
          if (currentValue < finalValue) {
            target.textContent = Math.floor(currentValue) + suffix;
            requestAnimationFrame(updateCounter);
          } else {
            target.textContent = finalValue + suffix;
          }
        };
        
        updateCounter();
        counterObserver.unobserve(target);
      }
    });
  }, { threshold: 0.5 });
  
  statNumbers.forEach(function(num) {
    if (num.hasAttribute('data-count')) {
      counterObserver.observe(num);
    }
  });
  
  // ===================================
  // SKILL CARDS STAGGER ANIMATION
  // ===================================
  const skillCards = document.querySelectorAll('.skill-card');
  
  const skillObserver = new IntersectionObserver(function(entries) {
    entries.forEach(function(entry, index) {
      if (entry.isIntersecting) {
        setTimeout(function() {
          entry.target.classList.add('visible');
        }, index * 100);
        skillObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1 });
  
  skillCards.forEach(function(card) {
    card.classList.add('reveal');
    skillObserver.observe(card);
  });
  
  // ===================================
  // CURSOR EFFECT (Desktop only)
  // ===================================
  if (window.innerWidth > 1024) {
    const cursor = document.createElement('div');
    cursor.className = 'custom-cursor';
    cursor.innerHTML = '<div class="cursor-dot"></div><div class="cursor-outline"></div>';
    document.body.appendChild(cursor);
    
    const style = document.createElement('style');
    style.textContent = `
      .custom-cursor {
        position: fixed;
        top: 0;
        left: 0;
        pointer-events: none;
        z-index: 9999;
        mix-blend-mode: difference;
      }
      .cursor-dot {
        width: 8px;
        height: 8px;
        background: #E85D04;
        border-radius: 50%;
        position: absolute;
        transform: translate(-50%, -50%);
        transition: transform 0.1s ease;
      }
      .cursor-outline {
        width: 40px;
        height: 40px;
        border: 1px solid rgba(232, 93, 4, 0.5);
        border-radius: 50%;
        position: absolute;
        transform: translate(-50%, -50%);
        transition: all 0.15s ease;
      }
      .custom-cursor.hover .cursor-dot {
        transform: translate(-50%, -50%) scale(2);
      }
      .custom-cursor.hover .cursor-outline {
        transform: translate(-50%, -50%) scale(1.5);
        border-color: #E85D04;
      }
    `;
    document.head.appendChild(style);
    
    let mouseX = 0, mouseY = 0;
    let cursorX = 0, cursorY = 0;
    
    document.addEventListener('mousemove', function(e) {
      mouseX = e.clientX;
      mouseY = e.clientY;
    });
    
    function animateCursor() {
      cursorX += (mouseX - cursorX) * 0.15;
      cursorY += (mouseY - cursorY) * 0.15;
      cursor.style.transform = `translate(${cursorX}px, ${cursorY}px)`;
      requestAnimationFrame(animateCursor);
    }
    animateCursor();
    
    // Hover effect on interactive elements
    const interactiveElements = document.querySelectorAll('a, button, .project-card, .skill-card, input, textarea');
    interactiveElements.forEach(function(el) {
      el.addEventListener('mouseenter', function() {
        cursor.classList.add('hover');
      });
      el.addEventListener('mouseleave', function() {
        cursor.classList.remove('hover');
      });
    });

    // If portfolio data was loaded before this script executed, trigger the event so
    // dynamic elements get observed and animated correctly (avoids race conditions).
    if (window.__portfolioDataLoaded) {
      document.dispatchEvent(new CustomEvent('portfolio-data-loaded'));
    }
  }
  
  // ===================================
  // ACTIVE NAV LINK HIGHLIGHT
  // ===================================
  const currentPage = window.location.pathname.split('/').pop() || 'index.html';
  const navLinks = document.querySelectorAll('.nav-links a, .mobile-nav-links a');
  
  navLinks.forEach(function(link) {
    const href = link.getAttribute('href');
    if (href === currentPage || (currentPage === '' && href === 'index.html')) {
      link.classList.add('active');
    }
  });
  
  // ===================================
  // PARALLAX EFFECT
  // ===================================
  const parallaxElements = document.querySelectorAll('[data-parallax]');
  
  if (parallaxElements.length > 0) {
    window.addEventListener('scroll', function() {
      const scrolled = window.pageYOffset;
      
      parallaxElements.forEach(function(el) {
        const speed = parseFloat(el.getAttribute('data-parallax')) || 0.5;
        const yPos = -(scrolled * speed);
        el.style.transform = `translateY(${yPos}px)`;
      });
    });
  }
  
  // ===================================
  // LAZY LOADING IMAGES
  // ===================================
  const lazyImages = document.querySelectorAll('img[data-src]');
  
  const imageObserver = new IntersectionObserver(function(entries, observer) {
    entries.forEach(function(entry) {
      if (entry.isIntersecting) {
        const img = entry.target;
        img.src = img.dataset.src;
        img.removeAttribute('data-src');
        observer.unobserve(img);
      }
    });
  });
  
  lazyImages.forEach(function(img) {
    imageObserver.observe(img);
  });
  
  // ===================================
  // KEYBOARD NAVIGATION
  // ===================================
  document.addEventListener('keydown', function(e) {
    // ESC to close mobile menu
    if (e.key === 'Escape' && mobileNav && mobileNav.classList.contains('active')) {
      menuToggle.classList.remove('active');
      mobileNav.classList.remove('active');
      document.body.style.overflow = '';
    }
  });
  
  // ===================================
  // PREFERS REDUCED MOTION
  // ===================================
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  
  if (prefersReducedMotion.matches) {
    document.documentElement.style.setProperty('--transition-fast', '0s');
    document.documentElement.style.setProperty('--transition-smooth', '0s');
    document.documentElement.style.setProperty('--transition-slow', '0s');
    
    // Disable cursor effect
    const customCursor = document.querySelector('.custom-cursor');
    if (customCursor) {
      customCursor.style.display = 'none';
    }
  }
  
});

// ===================================
// SKILL PROGRESS BARS ANIMATION
// ===================================
const skillProgressItems = document.querySelectorAll('.skill-progress-item');

if (skillProgressItems.length > 0) {
  const skillProgressObserver = new IntersectionObserver(function(entries) {
    entries.forEach(function(entry) {
      if (entry.isIntersecting) {
        const progressFill = entry.target.querySelector('.skill-progress-fill');
        const targetWidth = progressFill.getAttribute('data-progress');
        
        setTimeout(function() {
          progressFill.style.width = targetWidth + '%';
          entry.target.classList.add('animated');
        }, 200);
        
        skillProgressObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.3 });
  
  skillProgressItems.forEach(function(item) {
    skillProgressObserver.observe(item);
  });
}

// ===================================
// TESTIMONIALS SLIDER
// ===================================
const testimonialSlider = document.querySelector('.testimonials-slider');

if (testimonialSlider) {
  const track = testimonialSlider.querySelector('.testimonials-track');
  const cards = testimonialSlider.querySelectorAll('.testimonial-card');
  const prevBtn = testimonialSlider.querySelector('.testimonial-prev');
  const nextBtn = testimonialSlider.querySelector('.testimonial-next');
  const dotsContainer = testimonialSlider.querySelector('.testimonial-dots');
  
  if (track && cards.length > 0) {
    let currentIndex = 0;
    const totalSlides = cards.length;
    let slidesPerView = 3;
    
    // Determine slides per view based on screen width
    function updateSlidesPerView() {
      if (window.innerWidth <= 768) {
        slidesPerView = 1;
      } else if (window.innerWidth <= 1024) {
        slidesPerView = 2;
      } else {
        slidesPerView = 3;
      }
    }
    
    updateSlidesPerView();
    
    // Create dots
    if (dotsContainer) {
      const totalDots = Math.ceil(totalSlides / slidesPerView);
      dotsContainer.innerHTML = '';
      for (let i = 0; i < totalDots; i++) {
        const dot = document.createElement('button');
        dot.className = 'testimonial-dot' + (i === 0 ? ' active' : '');
        dot.setAttribute('aria-label', 'Go to slide ' + (i + 1));
        dot.addEventListener('click', function() {
          goToSlide(i * slidesPerView);
        });
        dotsContainer.appendChild(dot);
      }
    }
    
    function updateSlider() {
      const cardWidth = cards[0].offsetWidth + 32; // Include gap
      track.style.transform = 'translateX(-' + (currentIndex * cardWidth) + 'px)';
      
      // Update dots
      const dots = dotsContainer.querySelectorAll('.testimonial-dot');
      dots.forEach(function(dot, index) {
        dot.classList.toggle('active', index === Math.floor(currentIndex / slidesPerView));
      });
      
      // Update buttons
      if (prevBtn) prevBtn.disabled = currentIndex === 0;
      if (nextBtn) nextBtn.disabled = currentIndex >= totalSlides - slidesPerView;
    }
    
    function goToSlide(index) {
      currentIndex = Math.max(0, Math.min(index, totalSlides - slidesPerView));
      updateSlider();
    }
    
    if (prevBtn) {
      prevBtn.addEventListener('click', function() {
        goToSlide(currentIndex - 1);
      });
    }
    
    if (nextBtn) {
      nextBtn.addEventListener('click', function() {
        goToSlide(currentIndex + 1);
      });
    }
    
    // Handle resize
    window.addEventListener('resize', function() {
      updateSlidesPerView();
      goToSlide(0);
    });
    
    // Touch/swipe support
    let touchStartX = 0;
    let touchEndX = 0;
    
    track.addEventListener('touchstart', function(e) {
      touchStartX = e.changedTouches[0].screenX;
    }, { passive: true });
    
    track.addEventListener('touchend', function(e) {
      touchEndX = e.changedTouches[0].screenX;
      handleSwipe();
    }, { passive: true });
    
    function handleSwipe() {
      const swipeThreshold = 50;
      if (touchStartX - touchEndX > swipeThreshold) {
        goToSlide(currentIndex + 1);
      } else if (touchEndX - touchStartX > swipeThreshold) {
        goToSlide(currentIndex - 1);
      }
    }
  }
}

// ===================================
// GENERATE GITHUB CONTRIBUTION GRAPH
// ===================================
const contributionGrid = document.getElementById('contributionGrid');

if (contributionGrid) {
  // Generate 52 weeks of contribution data
  for (let week = 0; week < 52; week++) {
    const weekDiv = document.createElement('div');
    weekDiv.className = 'contribution-week';
    
    for (let day = 0; day < 7; day++) {
      const dayDiv = document.createElement('div');
      // Generate random contribution level (0-4)
      const rand = Math.random();
      let level = 0;
      if (rand > 0.7) level = 1;
      if (rand > 0.8) level = 2;
      if (rand > 0.9) level = 3;
      if (rand > 0.95) level = 4;
      
      dayDiv.className = 'contribution-day level-' + level;
      
      // Add tooltip with fake contribution count
      const contributions = level === 0 ? 0 : Math.floor(level * 2 + Math.random() * 3);
      dayDiv.setAttribute('data-contributions', contributions);
      dayDiv.setAttribute('title', contributions + ' contributions');
      
      weekDiv.appendChild(dayDiv);
    }
    
    contributionGrid.appendChild(weekDiv);
  }
}

// ===================================
// GITHUB CONTRIBUTION GRAPH ANIMATION
// ===================================
const contributionDays = document.querySelectorAll('.contribution-day');

if (contributionDays.length > 0) {
  const contributionObserver = new IntersectionObserver(function(entries) {
    entries.forEach(function(entry) {
      if (entry.isIntersecting) {
        const days = entry.target.querySelectorAll('.contribution-day');
        days.forEach(function(day, index) {
          setTimeout(function() {
            day.style.opacity = '1';
            day.style.transform = 'scale(1)';
          }, index * 5);
        });
        contributionObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1 });
  
  const contributionGrid = document.querySelector('.contribution-grid');
  if (contributionGrid) {
    // Initially hide all days
    contributionDays.forEach(function(day) {
      day.style.opacity = '0';
      day.style.transform = 'scale(0)';
      day.style.transition = 'all 0.2s ease';
    });
    
    contributionObserver.observe(contributionGrid);
  }
}

// ===================================
// GITHUB STATS COUNTER
// ===================================
const githubStatNumbers = document.querySelectorAll('.github-stat-number');

const githubCounterObserver = new IntersectionObserver(function(entries) {
  entries.forEach(function(entry) {
    if (entry.isIntersecting) {
      const target = entry.target;
      const finalValue = parseInt(target.getAttribute('data-count'));
      const suffix = target.getAttribute('data-suffix') || '';
      const duration = 2000;
      const increment = finalValue / (duration / 16);
      let currentValue = 0;
      
      const updateCounter = function() {
        currentValue += increment;
        if (currentValue < finalValue) {
          target.textContent = Math.floor(currentValue) + suffix;
          requestAnimationFrame(updateCounter);
        } else {
          target.textContent = finalValue + suffix;
        }
      };
      
      updateCounter();
      githubCounterObserver.unobserve(target);
    }
  });
}, { threshold: 0.5 });

githubStatNumbers.forEach(function(num) {
  if (num.hasAttribute('data-count')) {
    githubCounterObserver.observe(num);
  }
});

// ===================================
// RESUME ITEMS STAGGER ANIMATION
// ===================================
const resumeItems = document.querySelectorAll('.resume-item');

const resumeObserver = new IntersectionObserver(function(entries) {
  entries.forEach(function(entry, index) {
    if (entry.isIntersecting) {
      setTimeout(function() {
        entry.target.classList.add('visible');
      }, index * 150);
      resumeObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.1 });

resumeItems.forEach(function(item) {
  item.classList.add('reveal');
  resumeObserver.observe(item);
});

// ===================================
// PAGE TRANSITION
// ===================================
function navigateTo(url) {
  const body = document.body;
  body.style.opacity = '0';
  body.style.transition = 'opacity 0.3s ease';
  
  setTimeout(function() {
    window.location.href = url;
  }, 300);
}
