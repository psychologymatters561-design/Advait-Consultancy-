/**
 * Advait Consultancy - Advanced Animation System
 * Handles smooth scrolling, parallax effects, text transitions,
 * and horizontal gallery animations
 */

document.addEventListener('DOMContentLoaded', () => {
    // Register GSAP plugins
    gsap.registerPlugin(ScrollTrigger);

    // ===== LENIS SMOOTH SCROLL INITIALIZATION =====
    const lenis = new Lenis({
        lerp: 0.08,
        smoothWheel: true,
        smoothTouch: true,
        touchMultiplier: 1.8,
        infinite: false,
        duration: 1.2,
        easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t))
    });

    function raf(time) {
        lenis.raf(time);
        requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);

    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.lagSmoothing(0);

    // ===== HERO SECTION ANIMATIONS =====
    function initHeroAnimations() {
        const heroBg = document.querySelector('.hero-bg');
        const heroHeadlines = document.querySelectorAll('.hero-headline');
        const scrollIndicator = document.querySelector('.scroll-indicator');

        // Initial parallax - Load parallax on hero background
        gsap.fromTo(heroBg,
            { scale: 1.05, y: 0 },
            {
                scale: 1,
                duration: 2.8,
                ease: 'power2.out',
                delay: 0.1
            }
        );

        // Subtle ongoing parallax
        gsap.to(heroBg, {
            yPercent: 25,
            ease: 'none',
            scrollTrigger: {
                trigger: '.hero',
                start: 'top top',
                end: 'bottom top',
                scrub: 1.2,
                invalidateOnRefresh: true
            }
        });

        // Scroll indicator animation
        gsap.to(scrollIndicator, {
            opacity: 0,
            y: -30,
            duration: 0.6,
            scrollTrigger: {
                trigger: '.hero',
                start: 'top center',
                onEnter: () => gsap.to(scrollIndicator, { opacity: 0, y: -30 }),
                onLeaveBack: () => gsap.to(scrollIndicator, { opacity: 1, y: 0 })
            }
        });

        // Text sequence animation with scroll trigger
        const tl = gsap.timeline({
            scrollTrigger: {
                trigger: '.hero',
                start: 'top top',
                end: '+=400%',
                pin: true,
                scrub: 1.5,
                markers: false
            }
        });

        // Animation sequence
        tl.to(heroHeadlines[0], {
            opacity: 0,
            y: -50,
            duration: 0.8,
            ease: 'power2.inOut'
        }, 0.3)
            .to(heroHeadlines[1], {
                opacity: 1,
                y: 0,
                duration: 0.9,
                ease: 'power2.out'
            }, 0.4)
            .to(heroHeadlines[1], {
                opacity: 0,
                y: -50,
                duration: 0.8,
                ease: 'power2.inOut'
            }, 1.2)
            .to(heroHeadlines[2], {
                opacity: 1,
                y: 0,
                duration: 0.9,
                ease: 'power2.out'
            }, 1.3);
    }

    // ===== HORIZONTAL SCROLL GALLERY =====
    function initHorizontalScroll() {
        const horizontalContainer = document.querySelector('.horizontal-container');
        const horizontalTrack = document.querySelector('.horizontal-track');
        const galleryCards = document.querySelectorAll('.gallery-card');

        if (!horizontalContainer || !horizontalTrack) return;

        // Calculate scroll distance
        const getScrollDistance = () => {
            const trackWidth = horizontalTrack.scrollWidth;
            const containerWidth = window.innerWidth;
            return Math.max(0, trackWidth - containerWidth + (containerWidth * 0.2));
        };

        // Main horizontal scroll animation
        const horizontalTween = gsap.to(horizontalTrack, {
            x: () => -getScrollDistance(),
            ease: 'none',
            scrollTrigger: {
                trigger: horizontalContainer,
                start: 'top top',
                end: () => '+=' + (getScrollDistance() + window.innerHeight * 1.5),
                pin: true,
                pinSpacing: true,
                scrub: 1.5,
                anticipatePin: 1,
                invalidateOnRefresh: true,
                markers: false
            }
        });

        // Individual card parallax and animations
        galleryCards.forEach((card, index) => {
            const cardImg = card.querySelector('.gallery-image');
            const cardContent = card.querySelector('.gallery-content');

            // Image parallax effect
            gsap.fromTo(cardImg,
                { xPercent: -5, scale: 1.12, rotationZ: 0.5 },
                {
                    xPercent: 5,
                    scale: 1.18,
                    rotationZ: -0.5,
                    ease: 'none',
                    scrollTrigger: {
                        trigger: card,
                        containerAnimation: horizontalTween,
                        start: 'left right',
                        end: 'right left',
                        scrub: true,
                        invalidateOnRefresh: true
                    }
                }
            );

            // Stagger fade-in effect
            gsap.from(cardContent, {
                opacity: 0,
                y: 30,
                duration: 0.8,
                ease: 'power2.out',
                delay: index * 0.15 + 0.3
            });

            // Hover animation
            card.addEventListener('mouseenter', () => {
                gsap.to(cardImg, {
                    scale: 1.22,
                    duration: 0.6,
                    ease: 'power2.out'
                });
            });

            card.addEventListener('mouseleave', () => {
                gsap.to(cardImg, {
                    scale: 1.08,
                    duration: 0.6,
                    ease: 'power2.out'
                });
            });
        });

        // Refresh ScrollTrigger on window resize
        window.addEventListener('resize', () => {
            ScrollTrigger.getAll().forEach(trigger => trigger.kill());
            initHorizontalScroll();
        });
    }

    // ===== SERVICES SECTION ANIMATIONS =====
    function initServicesAnimations() {
        const serviceCards = document.querySelectorAll('.service-card');

        serviceCards.forEach((card, index) => {
            gsap.from(card, {
                opacity: 0,
                y: 40,
                duration: 0.8,
                ease: 'power2.out',
                scrollTrigger: {
                    trigger: card,
                    start: 'top 80%',
                    end: 'top 60%',
                    scrub: 1,
                    invalidateOnRefresh: true
                },
                stagger: 0.1
            });

            // Hover effect
            card.addEventListener('mouseenter', () => {
                gsap.to(card, {
                    y: -8,
                    duration: 0.4,
                    ease: 'power2.out'
                });
            });

            card.addEventListener('mouseleave', () => {
                gsap.to(card, {
                    y: 0,
                    duration: 0.4,
                    ease: 'power2.out'
                });
            });
        });
    }

    // ===== NAVIGATION EFFECTS =====
    function initNavEffects() {
        const navbar = document.querySelector('.navbar');
        let lastScrollTop = 0;

        window.addEventListener('scroll', () => {
            const scrollTop = window.scrollY;

            if (scrollTop > 100) {
                navbar.style.borderBottomColor = 'rgba(212, 165, 116, 0.2)';
            } else {
                navbar.style.borderBottomColor = 'rgba(212, 165, 116, 0.1)';
            }

            lastScrollTop = scrollTop;
        });
    }

    // ===== SMOOTH SCROLL LINKS =====
    function initSmoothScroll() {
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', function(e) {
                const href = this.getAttribute('href');
                if (href === '#' || href === '#portfolio' || href === '#services' || href === '#about' || href === '#contact') {
                    e.preventDefault();
                    const target = document.querySelector(href);
                    if (target) {
                        lenis.scrollTo(target, {
                            offset: -80,
                            duration: 1.5,
                            easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t))
                        });
                    }
                }
            });
        });
    }

    // ===== BUTTON INTERACTIONS =====
    function initButtonInteractions() {
        const buttons = document.querySelectorAll('.btn-primary, .btn-secondary, .cta-button');

        buttons.forEach(btn => {
            btn.addEventListener('mouseenter', () => {
                gsap.to(btn, {
                    duration: 0.3,
                    ease: 'power2.out'
                });
            });

            btn.addEventListener('click', function(e) {
                // Create ripple effect
                const ripple = document.createElement('span');
                const rect = this.getBoundingClientRect();
                const size = Math.max(rect.width, rect.height);
                const x = e.clientX - rect.left - size / 2;
                const y = e.clientY - rect.top - size / 2;

                ripple.style.width = ripple.style.height = size + 'px';
                ripple.style.left = x + 'px';
                ripple.style.top = y + 'px';
                ripple.classList.add('ripple');

                gsap.to(ripple, {
                    scale: 4,
                    opacity: 0,
                    duration: 0.6,
                    ease: 'power2.out'
                });
            });
        });
    }

    // ===== INTERSECTION OBSERVER FOR FADE-IN EFFECTS =====
    function initObserver() {
        const observerOptions = {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    gsap.to(entry.target, {
                        opacity: 1,
                        y: 0,
                        duration: 0.8,
                        ease: 'power2.out'
                    });
                    observer.unobserve(entry.target);
                }
            });
        }, observerOptions);

        document.querySelectorAll('.gallery-card, .service-card').forEach(el => {
            gsap.set(el, { opacity: 0, y: 30 });
            observer.observe(el);
        });
    }

    // ===== PERFORMANCE OPTIMIZATION =====
    function optimizePerformance() {
        // Disable animations on low-end devices
        const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        
        if (prefersReducedMotion) {
            gsap.globalTimeline.timeScale(0);
            gsap.to(gsap.globalTimeline, { timeScale: 1, duration: 0 });
        }

        // Handle resize events
        let resizeTimer;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimer);
            resizeTimer = setTimeout(() => {
                ScrollTrigger.refresh();
            }, 250);
        });
    }

    // ===== INITIALIZE ALL ANIMATIONS =====
    function init() {
        initHeroAnimations();
        setTimeout(() => {
            initHorizontalScroll();
            initServicesAnimations();
        }, 100);
        initNavEffects();
        initSmoothScroll();
        initButtonInteractions();
        initObserver();
        optimizePerformance();

        // Refresh ScrollTrigger after all animations are set
        ScrollTrigger.refresh();
    }

    // Start when page is fully loaded
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    // Mobile optimization
    if (window.innerWidth < 768) {
        lenis.options.touchMultiplier = 2;
    }

    // Custom analytics for interactions
    function trackInteraction(action, label) {
        if (window.gtag) {
            window.gtag('event', action, {
                'event_label': label
            });
        }
    }

    // Track CTA clicks
    document.querySelectorAll('.btn-primary, .btn-secondary, .cta-button').forEach(btn => {
        btn.addEventListener('click', function() {
            trackInteraction('cta_click', this.textContent);
        });
    });

    // Expose utilities globally for debugging
    window.advaitAnimations = {
        refreshScrollTrigger: () => ScrollTrigger.refresh(),
        getLenisScroll: () => lenis,
        killAllAnimations: () => gsap.killAll(),
        restartAnimations: init
    };
});

// ===== PRELOAD IMAGES FOR BETTER PERFORMANCE =====
window.addEventListener('load', () => {
    const images = document.querySelectorAll('img, [style*="background-image"]');
    images.forEach(img => {
        // Images are already loaded by browser
        // This is just a checkpoint for monitoring
    });
});

// ===== HANDLE PAGE VISIBILITY CHANGES =====
document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
        gsap.globalTimeline.pause();
    } else {
        gsap.globalTimeline.resume();
    }
});