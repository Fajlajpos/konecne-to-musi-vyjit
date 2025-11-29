// Global functions for accessibility
window.enterSite = enterSite;
window.resetSite = resetSite;

document.addEventListener('DOMContentLoaded', () => {
    console.log('Site loaded successfully');

    // Check if we should skip landing screen (after login/register/logout)
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('skipLanding') === 'true') {
        // Immediately enter site and skip landing screen
        const landingScreen = document.getElementById('landing');
        const mainContent = document.getElementById('main-content');
        const body = document.body;

        if (landingScreen && mainContent) {
            landingScreen.classList.add('hidden');
            landingScreen.style.display = 'none';
            mainContent.style.display = 'block';
            mainContent.style.opacity = '1';
            body.style.overflow = 'auto';

            setTimeout(() => {
                setupNavigation();
                if (window.location.hash) {
                    const targetId = window.location.hash.substring(1);
                    const targetElement = document.getElementById(targetId);
                    if (targetElement) {
                        targetElement.scrollIntoView({ behavior: 'smooth' });
                    }
                }
            }, 100);
        }

        const cleanUrl = window.location.pathname + window.location.hash;
        window.history.replaceState({}, document.title, cleanUrl);
    }

    // Elements
    const logo = document.getElementById('logo-landing');
    const logoShine = document.querySelector('.logo-shine-layer');
    const homeLink = document.getElementById('nav-home');
    const landingScreen = document.getElementById('landing');
    const cartBadge = document.querySelector('.cart-badge');
    let cartCount = 0;

    // Logo Shine Effect - FIXED
    if (logo && logoShine) {
        logo.addEventListener('mousemove', (e) => {
            const rect = logo.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;

            logoShine.style.background = `radial-gradient(circle 120px at ${x}px ${y}px, rgba(255, 255, 255, 0.9) 0%, transparent 60%)`;
            logoShine.style.opacity = '1';
        });

        logo.addEventListener('mouseleave', () => {
            logoShine.style.opacity = '0';
        });
    }

    // Enter Site Logic
    function triggerEntrance() {
        if (!logo || !landingScreen) return;
        if (landingScreen.classList.contains('blackout')) return;

        logo.parentElement.classList.add('clicked');
        landingScreen.classList.add('blackout');

        setTimeout(() => {
            enterSite();
        }, 1200);
    }

    if (logo) {
        logo.addEventListener('click', triggerEntrance);
    }

    // Enter key support
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            const landingScreen = document.getElementById('landing');
            if (landingScreen && !landingScreen.classList.contains('hidden')) {
                triggerEntrance();
            }
        }
    });

    // Home Link Logic - FIXED: return to landing screen
    if (homeLink) {
        homeLink.addEventListener('click', (e) => {
            e.preventDefault();
            resetSite();
        });
    }

    // Smooth scroll for navigation links
    document.querySelectorAll('.nav-link:not(#nav-home)').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const targetId = link.getAttribute('href').substring(1);
            const targetElement = document.getElementById(targetId);
            if (targetElement) {
                targetElement.scrollIntoView({ behavior: 'smooth' });
            }
        });
    });

    // Entrance animations for sections
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, observerOptions);

    document.querySelectorAll('.clothing-item, .about-text').forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(30px)';
        el.style.transition = 'opacity 0.8s ease, transform 0.8s ease';
        observer.observe(el);
    });
});

function setupNavigation() {
    const navLinks = document.querySelectorAll('.nav-link');
    const clothingSection = document.getElementById('obleceni');
    const aboutSection = document.getElementById('o-nas');

    navLinks.forEach(link => {
        const newLink = link.cloneNode(true);
        link.parentNode.replaceChild(newLink, link);
    });

    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', (e) => {
            const href = link.getAttribute('href');

            if (link.id === 'nav-home' || href === '#') {
                e.preventDefault();
                window.scrollTo({ top: 0, behavior: 'smooth' });
                return;
            }

            if (href.includes('#')) {
                const hash = href.split('#')[1];
                if (hash === 'o-nas') {
                    e.preventDefault();
                    if (clothingSection) clothingSection.style.display = 'none';
                    if (aboutSection) {
                        aboutSection.style.display = 'block';
                        aboutSection.scrollIntoView({ behavior: 'smooth' });
                    }
                    window.history.pushState(null, null, '#o-nas');
                } else if (hash === 'obleceni') {
                    e.preventDefault();
                    if (aboutSection) aboutSection.style.display = 'none';
                    if (clothingSection) {
                        clothingSection.style.display = 'block';
                        clothingSection.scrollIntoView({ behavior: 'smooth' });
                    }
                    window.history.pushState(null, null, '#obleceni');
                }
            }
        });
    });

    if (window.location.hash === '#o-nas') {
        if (clothingSection) clothingSection.style.display = 'none';
        if (aboutSection) aboutSection.style.display = 'block';
    }
}

function enterSite() {
    const landingScreen = document.getElementById('landing');
    const mainContent = document.getElementById('main-content');
    const body = document.body;

    if (!landingScreen || !mainContent) return;

    landingScreen.classList.add('hidden');
    mainContent.style.display = 'block';

    setTimeout(() => {
        mainContent.style.opacity = '1';
        body.style.overflow = 'auto';
        setupNavigation();
    }, 50);
}

function resetSite() {
    const landingScreen = document.getElementById('landing');
    const mainContent = document.getElementById('main-content');
    const logo = document.getElementById('logo-landing');
    const body = document.body;

    if (!landingScreen || !mainContent) return;

    mainContent.style.opacity = '0';

    setTimeout(() => {
        mainContent.style.display = 'none';
        landingScreen.style.display = '';
        landingScreen.classList.remove('hidden');
        landingScreen.classList.remove('blackout');

        if (logo) {
            logo.parentElement.classList.remove('clicked');
        }

        body.style.overflow = 'hidden';
        window.scrollTo(0, 0);
    }, 500);
}
