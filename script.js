// Global functions for accessibility
window.enterSite = enterSite;
window.resetSite = resetSite;

document.addEventListener('DOMContentLoaded', () => {
    // Check if we should skip landing screen (after login/register/logout)
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('skipLanding') === 'true') {
        skipLandingScreen();
    }

    // Initialize elements and event listeners
    initializeLandingInteractions();
    initializeScrollAnimations();
});

function skipLandingScreen() {
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
            handleInitialHash();
        }, 100);
    }

    const cleanUrl = window.location.pathname + window.location.hash;
    window.history.replaceState({}, document.title, cleanUrl);
}

function handleInitialHash() {
    if (window.location.hash) {
        const targetId = window.location.hash.substring(1);
        const targetElement = document.getElementById(targetId);
        if (targetElement) {
            targetElement.scrollIntoView({ behavior: 'smooth' });
        }
    }
}

function initializeLandingInteractions() {
    const logo = document.getElementById('logo-landing');
    const logoShine = document.querySelector('.logo-shine-layer');
    const landingScreen = document.getElementById('landing');

    // Logo Shine Effect
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

        // Play click sound if available
        if (window.audioManager) window.audioManager.playClick();

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
            if (landingScreen && !landingScreen.classList.contains('hidden')) {
                triggerEntrance();
            }
        }
    });
}

function initializeScrollAnimations() {
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
}

function setupNavigation() {
    const navLinks = document.querySelectorAll('.nav-link');
    const clothingSection = document.getElementById('obleceni');
    const aboutSection = document.getElementById('o-nas');

    // Clean up old listeners by cloning
    navLinks.forEach(link => {
        const newLink = link.cloneNode(true);
        link.parentNode.replaceChild(newLink, link);
    });

    // Re-attach listeners with audio
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', (e) => {
            // Play sound
            if (window.audioManager) window.audioManager.playClick();

            const href = link.getAttribute('href');

            // HOME Button Logic
            if (link.id === 'nav-home' || href === '#') {
                e.preventDefault();
                resetSite();
                return;
            }

            // Section Navigation Logic
            if (href.includes('#')) {
                const hash = href.split('#')[1];

                if (hash === 'o-nas' || hash === 'obleceni') {
                    e.preventDefault();

                    // Toggle sections
                    if (clothingSection) clothingSection.style.display = hash === 'obleceni' ? 'block' : 'none';
                    if (aboutSection) aboutSection.style.display = hash === 'o-nas' ? 'block' : 'none';

                    // Scroll to section
                    const targetSection = hash === 'obleceni' ? clothingSection : aboutSection;
                    if (targetSection) targetSection.scrollIntoView({ behavior: 'smooth' });

                    // Update URL
                    window.history.pushState(null, null, `#${hash}`);
                }
            }
        });
    });

    // Initial state check
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

        // Clear URL hash and params to ensure clean state
        window.history.pushState({}, document.title, window.location.pathname);
    }, 500);
}
