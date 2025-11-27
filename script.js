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
            landingScreen.style.display = 'none'; // Hide immediately
            mainContent.style.display = 'block';
            mainContent.style.opacity = '1';
            body.style.overflow = 'auto';

            // Scroll to the hash if present (e.g., #obleceni)
            setTimeout(() => {
                if (window.location.hash) {
                    const targetId = window.location.hash.substring(1);
                    const targetElement = document.getElementById(targetId);
                    if (targetElement) {
                        targetElement.scrollIntoView({ behavior: 'smooth' });
                    }
                }
            }, 100);
        }

        // Clean up URL (remove skipLanding parameter)
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

    // Logo Shine Effect
    if (logo && logoShine) {
        logo.addEventListener('mousemove', (e) => {
            const rect = logo.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;

            // Update gradient position in the mask layer
            logoShine.style.background = `radial-gradient(circle 120px at ${x}px ${y}px, rgba(255, 255, 255, 0.9) 0%, transparent 60%)`;
            logoShine.style.opacity = '1';
        });

        logo.addEventListener('mouseleave', () => {
            logoShine.style.opacity = '0';
        });
    }

    // Enter Site Logic
    // Enter Site Logic
    function triggerEntrance() {
        if (!logo || !landingScreen) return;

        // Prevent multiple triggers
        if (landingScreen.classList.contains('blackout')) return;

        // Play animation
        logo.parentElement.classList.add('clicked');

        // Fade screen to black
        landingScreen.classList.add('blackout');

        // Wait for animation and blackout before entering
        setTimeout(() => {
            enterSite();
        }, 1200); // Wait slightly longer than the blackout transition
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

    // Home Link Logic
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

// Defined outside to be global
function enterSite() {
    const landingScreen = document.getElementById('landing');
    const mainContent = document.getElementById('main-content');
    const body = document.body;

    if (!landingScreen || !mainContent) return;

    // 1. Fade out landing screen
    landingScreen.classList.add('hidden');

    // 2. Show main content
    mainContent.style.display = 'block';

    // Small delay to allow display:block to apply before opacity transition
    setTimeout(() => {
        mainContent.style.opacity = '1';

        // 3. Enable scrolling
        body.style.overflow = 'auto';

        // Navigation Logic
        const navLinks = document.querySelectorAll('.nav-link');
        const clothingSection = document.getElementById('obleceni');
        const aboutSection = document.getElementById('o-nas');

        navLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                const href = link.getAttribute('href');

                if (href === '#o-nas') {
                    e.preventDefault();
                    if (clothingSection) clothingSection.style.display = 'none';
                    if (aboutSection) {
                        aboutSection.style.display = 'block';
                        aboutSection.scrollIntoView({ behavior: 'smooth' });
                    }
                } else if (href === '#obleceni' || href === '#') {
                    e.preventDefault();
                    if (aboutSection) aboutSection.style.display = 'none';
                    if (clothingSection) {
                        clothingSection.style.display = 'block';
                        clothingSection.scrollIntoView({ behavior: 'smooth' });
                    }
                }
            });
        });

        // Check URL hash on load
        if (window.location.hash === '#o-nas') {
            if (clothingSection) clothingSection.style.display = 'none';
            if (aboutSection) aboutSection.style.display = 'block';
        }
    }, 50);
}

function resetSite() {
    const landingScreen = document.getElementById('landing');
    const mainContent = document.getElementById('main-content');
    const logo = document.getElementById('logo-landing');
    const body = document.body;

    if (!landingScreen || !mainContent) return;

    // 1. Hide main content
    mainContent.style.opacity = '0';

    setTimeout(() => {
        mainContent.style.display = 'none';

        // 2. Show landing screen - remove inline styles and reset classes
        landingScreen.style.display = ''; // Remove inline display:none
        landingScreen.classList.remove('hidden');
        landingScreen.classList.remove('blackout'); // Reset blackout

        // 3. Reset logo animation
        if (logo) {
            logo.parentElement.classList.remove('clicked');
        }

        // 4. Disable scrolling
        body.style.overflow = 'hidden';
        window.scrollTo(0, 0);
    }, 500); // Wait for opacity transition
}
