// === DOM Ready Initialization ===
document.addEventListener('DOMContentLoaded', () => {
    loadComponent('navbar.html', 'navbar-placeholder');
    loadComponent('footer.html', 'footer-placeholder');
    loadComponent('cookies-consent.html', 'cookie-consent-placeholder');

    // ✅ Always load Google Translate (even if cookies declined)
    loadGoogleTranslateScript();

    setTimeout(() => {
        initializeSectionVisibility();
    }, 500);
});

// === Load External HTML Components ===
function loadComponent(url, elementId) {
    fetch(url)
        .then(response => {
            if (!response.ok) throw new Error(`HTTP error ${response.status}`);
            return response.text();
        })
        .then(data => {
            document.getElementById(elementId).innerHTML = data;

            if (elementId === 'navbar-placeholder') {
                initializeNavbarScroll();
                initializeLanguageSelector();
                setTimeout(() => initializeGoogleTranslate(), 500);
            }

            if (elementId === 'footer-placeholder') {
                initializeFooterScroll();
            }

            if (elementId === 'cookie-consent-placeholder') {
                initializeCookieConsent();

                const savedLang = getStoredLanguage();
                if (savedLang && savedLang !== 'en') {
                    setTimeout(() => translatePage(savedLang), 500);
                }
            }

            initializeSectionVisibility();
        })
        .catch(error => {
            console.error('Error loading component:', error);
            document.getElementById(elementId).innerHTML = `<p>Error loading ${elementId.replace('-placeholder', '')}.</p>`;
        });
}

// === Cookie Consent Logic ===
function initializeCookieConsent() {
    const consentBox = document.getElementById('cookie-consent');
    const acceptBtn = document.getElementById('accept-cookies');
    const declineBtn = document.getElementById('decline-cookies');

    if (!consentBox || !acceptBtn || !declineBtn) return;

    let overlay = document.getElementById('cookie-overlay');
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.id = 'cookie-overlay';
        overlay.style.cssText = `
            position: fixed; top: 0; left: 0;
            width: 100%; height: 100%;
            background-color: rgba(0, 0, 0, 0.5);
            z-index: 9999;
        `;
        document.body.appendChild(overlay);
    }

    const consent = getCookieConsent();
    if (!consent) {
        consentBox.style.display = 'block';
        overlay.style.display = 'block';
    } else {
        consentBox.style.display = 'none';
        overlay.style.display = 'none'; // ✅ Always hide overlay if consent exists
    }

    acceptBtn.addEventListener('click', () => {
        localStorage.setItem('cookieConsent', 'accepted');
        sessionStorage.removeItem('cookieConsent');
        consentBox.style.display = 'none';
        overlay.style.display = 'none';
        window.dispatchEvent(new Event('cookiesAccepted'));

        const lang = getStoredLanguage();
        if (lang && lang !== 'en') translatePage(lang);
    });

    declineBtn.addEventListener('click', () => {
        sessionStorage.setItem('cookieConsent', 'declined');
        localStorage.removeItem('cookieConsent');
        consentBox.style.display = 'none';
        overlay.style.display = 'none';

        const lang = getStoredLanguage();
        if (lang && lang !== 'en') translatePage(lang);
    });
}

function getCookieConsent() {
    const session = sessionStorage.getItem('cookieConsent');
    if (session === 'declined') return 'declined';
    return localStorage.getItem('cookieConsent');
}

// === Google Translate Loader ===
function loadGoogleTranslateScript() {
    if (!window.googleTranslateLoaded) {
        window.googleTranslateLoaded = true;
        const script = document.createElement('script');
        script.src = "https://translate.google.com/translate_a/element.js?cb=initializeGoogleTranslate";
        script.async = true;
        script.defer = true;
        script.onerror = () => console.error('Google Translate script failed to load');
        document.head.appendChild(script);
    }
}

function initializeGoogleTranslate() {
    if (!document.getElementById('google_translate_element')) {
        const el = document.createElement('div');
        el.id = 'google_translate_element';
        el.style.display = 'none';
        document.body.appendChild(el);
    }

    if (!window.googleTranslateInitialized && typeof google !== 'undefined' && google.translate) {
        new google.translate.TranslateElement({
            pageLanguage: 'en',
            autoDisplay: false
        }, 'google_translate_element');
        window.googleTranslateInitialized = true;
    }
}

// === Translation Handling ===
function translatePage(lang) {
    const maxRetries = 10;
    let retryCount = 0;

    function attemptTranslate() {
        const combo = document.querySelector('.goog-te-combo');
        if (combo) {
            if (combo.value !== lang) {
                combo.value = lang;
                combo.dispatchEvent(new Event('change', { bubbles: true }));
                console.log(`Translated to: ${lang}`);
            }
            saveLanguage(lang);
        } else if (retryCount < maxRetries) {
            retryCount++;
            setTimeout(attemptTranslate, 500);
        } else {
            console.warn('Google Translate combo not found after retries.');
        }
    }

    if (typeof google === 'undefined' || !google.translate) {
        setTimeout(() => translatePage(lang), 500);
    } else {
        attemptTranslate();
    }
}

// === Language Storage ===
function getStoredLanguage() {
    const consent = getCookieConsent();
    return consent === 'accepted'
        ? localStorage.getItem('selectedLanguage')
        : sessionStorage.getItem('selectedLanguage');
}

function saveLanguage(lang) {
    const consent = getCookieConsent();
    if (consent === 'accepted') {
        localStorage.setItem('selectedLanguage', lang);
        sessionStorage.removeItem('selectedLanguage');
    } else {
        sessionStorage.setItem('selectedLanguage', lang);
        localStorage.removeItem('selectedLanguage');
    }
}

// === Language Dropdown ===
function initializeLanguageSelector() {
    const langToggle = document.getElementById('langToggle');
    const dropdown = document.getElementById('languageDropdown');
    const flag = langToggle?.querySelector('.lang-flag');
    const code = langToggle?.querySelector('span');

    if (!langToggle || !dropdown || !flag || !code) return;

    document.querySelectorAll('.lang-option').forEach(option => {
        option.addEventListener('click', e => {
            e.preventDefault();
            const lang = option.getAttribute('data-lang');
            const flagSrc = option.querySelector('.lang-flag').src;
            const langCode = lang.split('-')[0].toUpperCase();

            flag.src = flagSrc;
            code.textContent = langCode;

            saveLanguage(lang);
            translatePage(lang);
            dropdown.style.display = 'none';
        });
    });

    langToggle.addEventListener('click', e => {
        e.preventDefault();
        dropdown.style.display = dropdown.style.display === 'block' ? 'none' : 'block';
    });

    document.addEventListener('click', e => {
        if (!langToggle.contains(e.target) && !dropdown.contains(e.target)) {
            dropdown.style.display = 'none';
        }
    });

    const savedLang = getStoredLanguage();
    if (savedLang && savedLang !== 'en') {
        translatePage(savedLang);
    }
}

// === Section Visibility on Scroll ===
function initializeSectionVisibility() {
    const sections = document.querySelectorAll('.banner-section, .how-it-works, .our-services, .our-fleet, .footer-column');

    function checkVisibility() {
        const viewHeight = window.innerHeight || document.documentElement.clientHeight;

        sections.forEach(section => {
            const rect = section.getBoundingClientRect();
            const isVisible = rect.top <= viewHeight * 0.8 && rect.bottom >= 0;
            section.classList.toggle('visible', isVisible);
        });
    }

    checkVisibility();
    window.addEventListener('scroll', checkVisibility);
}

// === Navbar Scroll Behavior ===
function initializeNavbarScroll() {
    window.addEventListener('scroll', () => {
        const navbar = document.querySelector('.navbar-custom');
        const logo = document.querySelector('.brand-logo');
        const scrolled = window.scrollY > 50;

        if (navbar) navbar.classList.toggle('scrolled', scrolled);
        if (logo) logo.src = scrolled ? '/images/logo_white.png' : '/images/logo_black.png';
    });
}

// === Footer Scroll-to-Top ===
function initializeFooterScroll() {
    const scrollBtn = document.querySelector('.scroll-up');
    if (!scrollBtn) return;

    scrollBtn.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });

    window.addEventListener('scroll', () => {
        scrollBtn.style.display = window.scrollY > 200 ? 'flex' : 'none';
    });
}
