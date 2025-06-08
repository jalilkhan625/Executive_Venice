// Main initialization
document.addEventListener('DOMContentLoaded', () => {
    loadComponent('navbar.html', 'navbar-placeholder');
    loadComponent('footer.html', 'footer-placeholder');
    loadComponent('cookies-consent.html', 'cookie-consent-placeholder');

    // Initialize cookie consent
    initializeCookieConsent();

    // Load Google Translate only if cookies are accepted
    if (getCookieConsent() === 'accepted') {
        loadGoogleTranslateScript();
    } else {
        // Listen for cookies being accepted later
        window.addEventListener('cookiesAccepted', () => {
            loadGoogleTranslateScript();
        });
    }

    // Wait for dynamic components to load before initializing visibility checks
    setTimeout(() => {
        initializeSectionVisibility();
    }, 500);
});

// Function to load external HTML files
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
                if (getCookieConsent() === 'accepted') {
                    setTimeout(() => initializeGoogleTranslate(), 500);
                }
            }
            if (elementId === 'footer-placeholder') {
                initializeFooterScroll();
            }
            if (elementId === 'cookie-consent-placeholder') {
                initializeCookieConsent();
                // If a language is already selected and cookies are accepted, translate the content
                if (getCookieConsent() === 'accepted') {
                    const selectedLang = localStorage.getItem('selectedLanguage') || 'en';
                    if (selectedLang !== 'en') {
                        setTimeout(() => translatePage(selectedLang), 500);
                    }
                }
            }

            initializeSectionVisibility();
        })
        .catch(error => {
            console.error('Error loading component:', error);
            document.getElementById(elementId).innerHTML = `<p>Error loading ${elementId.replace('-placeholder', '')}. Please try again later.</p>`;
        });
}

// Initialize cookie consent panel and overlay
function initializeCookieConsent() {
    const cookieConsent = document.getElementById('cookie-consent');
    const acceptButton = document.getElementById('accept-cookies');
    const declineButton = document.getElementById('decline-cookies');

    if (!cookieConsent || !acceptButton || !declineButton) {
        console.warn('Cookie consent elements not found');
        return;
    }

    // Create overlay element if it doesn't exist
    let overlay = document.getElementById('cookie-overlay');
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.id = 'cookie-overlay';
        overlay.style.position = 'fixed';
        overlay.style.top = '0';
        overlay.style.left = '0';
        overlay.style.width = '100%';
        overlay.style.height = '100%';
        overlay.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
        overlay.style.zIndex = '9999';
        overlay.style.pointerEvents = 'auto';
        document.body.appendChild(overlay);
    }

    // Check if user has already made a choice
    const consent = getCookieConsent();
    if (!consent) {
        cookieConsent.style.display = 'block'; // Show cookie consent panel
        overlay.style.display = 'block'; // Show overlay
        cookieConsent.style.zIndex = '10000';
    } else {
        cookieConsent.style.display = 'none'; // Hide panel
        overlay.style.display = consent === 'accepted' ? 'none' : 'block';
        if (consent === 'declined') {
            cookieConsent.style.display = 'block'; // Show panel again if declined
            cookieConsent.style.zIndex = '10000';
        }
    }

    // Handle Accept button
    acceptButton.addEventListener('click', () => {
        localStorage.setItem('cookieConsent', 'accepted');
        sessionStorage.removeItem('cookieConsent'); // Clear sessionStorage if present
        cookieConsent.style.display = 'none';
        overlay.style.display = 'none';
        window.dispatchEvent(new Event('cookiesAccepted'));
        console.log('Cookies accepted');
        // Re-translate page if a language is selected
        const selectedLang = localStorage.getItem('selectedLanguage') || 'en';
        if (selectedLang !== 'en') {
            translatePage(selectedLang);
        }
    });

    // Handle Decline button
    declineButton.addEventListener('click', () => {
        sessionStorage.setItem('cookieConsent', 'declined'); // Use sessionStorage
        localStorage.removeItem('cookieConsent'); // Clear localStorage
        cookieConsent.style.display = 'none';
        overlay.style.display = 'none';
        clearGoogleTranslateCookies(); // Clear any existing cookies
        console.log('Cookies declined');
        // Force translation with the selected language
        const selectedLang = localStorage.getItem('selectedLanguage') || 'en';
        if (selectedLang !== 'en') {
            translatePage(selectedLang); // Call the same translation function
        }
    });
}

// Helper function to get cookie consent status
function getCookieConsent() {
    // Check sessionStorage first (for declined status in current session)
    const sessionConsent = sessionStorage.getItem('cookieConsent');
    if (sessionConsent === 'declined') {
        return 'declined';
    }
    // Then check localStorage (for accepted status across sessions)
    return localStorage.getItem('cookieConsent'); // Returns 'accepted', 'declined', or null
}

// Helper function to clear Google Translate cookies
function clearGoogleTranslateCookies() {
    document.cookie.split(';').forEach(cookie => {
        const [name] = cookie.trim().split('=');
        if (name.startsWith('_ga') || name.startsWith('googtrans')) {
            document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;
        }
    });
    console.log('Cleared Google Translate-related cookies');
}

// Initialize visibility checks for sections
function initializeSectionVisibility() {
    const sections = document.querySelectorAll('.banner-section, .how-it-works, .our-services, .our-fleet, .footer-column');

    function checkVisibility() {
        const windowHeight = window.innerHeight || document.documentElement.clientHeight;

        sections.forEach(section => {
            const rect = section.getBoundingClientRect();
            const isVisible = (rect.top <= windowHeight * 0.8 && rect.bottom >= 0);

            if (isVisible) {
                section.classList.add('visible');
            } else {
                section.classList.remove('visible');
            }
        });
    }

    checkVisibility();
    window.removeEventListener('scroll', checkVisibility);
    window.addEventListener('scroll', checkVisibility);
}

// Initialize navbar scroll behavior
function initializeNavbarScroll() {
    window.addEventListener('scroll', function () {
        const navbar = document.querySelector('.navbar-custom');
        const logo = document.querySelector('.brand-logo');
        if (navbar && logo) {
            const isScrolled = window.scrollY > 50;
            navbar.classList.toggle('scrolled', isScrolled);
            logo.src = isScrolled ? '/images/logo_white.png' : '/images/logo_black.png';
        }
    });
}

// Initialize footer scroll behavior
function initializeFooterScroll() {
    const scrollUp = document.querySelector('.scroll-up');
    if (scrollUp) {
        scrollUp.addEventListener('click', () => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });

        window.addEventListener('scroll', () => {
            scrollUp.style.display = window.scrollY > 200 ? 'flex' : 'none';
        });
    }
}

// Load Google Translate script dynamically only once
function loadGoogleTranslateScript() {
    if (!window.googleTranslateLoaded) {
        window.googleTranslateLoaded = true;
        const script = document.createElement('script');
        script.src = "https://translate.google.com/translate_a/element.js?cb=initializeGoogleTranslate";
        script.async = true;
        script.defer = true;
        script.onerror = () => console.error('Failed to load Google Translate script');
        document.head.appendChild(script);
    }
}

// Initialize Google Translate only once
function initializeGoogleTranslate() {
    if (!document.getElementById('google_translate_element')) {
        const translateDiv = document.createElement('div');
        translateDiv.id = 'google_translate_element';
        translateDiv.style.display = 'none';
        document.body.appendChild(translateDiv);
    }

    if (!window.googleTranslateInitialized && typeof google !== 'undefined' && google.translate) {
        try {
            new google.translate.TranslateElement(
                {
                    pageLanguage: 'en',
                    autoDisplay: false
                },
                'google_translate_element'
            );
            window.googleTranslateInitialized = true;
            console.log('Google Translate initialized successfully');
        } catch (error) {
            console.error('Google Translate initialization failed:', error);
        }
    }
}

// Function to trigger translation with retry mechanism
function translatePage(lang) {
    const maxRetries = 10;
    let retryCount = 0;

    function attemptTranslate() {
        const googleTranslateFrame = document.querySelector('.goog-te-combo');
        if (googleTranslateFrame) {
            if (googleTranslateFrame.value !== lang) {
                googleTranslateFrame.value = lang;
                const changeEvent = new Event('change', { bubbles: true });
                googleTranslateFrame.dispatchEvent(changeEvent);
                console.log(`Translated to language: ${lang}`);
                localStorage.setItem('selectedLanguage', lang); // Store selected language
            } else {
                console.log(`Language already set to: ${lang}`);
            }
        } else if (retryCount < maxRetries) {
            retryCount++;
            console.warn(`Google Translate dropdown not found, retrying (${retryCount}/${maxRetries})...`);
            setTimeout(attemptTranslate, 500);
        } else {
            console.error('Google Translate dropdown not found after maximum retries.');
        }
    }

    if (typeof google === 'undefined' || !google.translate) {
        console.warn('Google Translate not yet loaded, waiting...');
        setTimeout(() => translatePage(lang), 500);
    } else {
        attemptTranslate();
    }
}

// Initialize language selector with flag and language code update
function initializeLanguageSelector() {
    const langToggle = document.getElementById('langToggle');
    const languageDropdown = document.getElementById('languageDropdown');
    const flagImg = langToggle.querySelector('.lang-flag');
    const langSpan = langToggle.querySelector('span');

    if (langToggle && languageDropdown && flagImg && langSpan) {
        const isPhone = window.innerWidth < 768;
        const isTablet = window.innerWidth >= 768 && window.innerWidth < 1024;

        languageDropdown.style.maxHeight = isPhone ? '150px' : isTablet ? '200px' : '250px';
        languageDropdown.style.width = isPhone ? '120px' : isTablet ? '140px' : '150px';
        languageDropdown.style.overflowY = 'auto';
        languageDropdown.style.position = 'absolute';
        languageDropdown.style.backgroundColor = '#fff';
        languageDropdown.style.border = '1px solid #ccc';
        languageDropdown.style.borderRadius = '4px';
        languageDropdown.style.zIndex = '10001'; // Above overlay and cookie consent
        languageDropdown.style.display = 'none';
        languageDropdown.style.boxShadow = '0 2px 5px rgba(0,0,0,0.2)';
        languageDropdown.style.fontSize = isPhone ? '14px' : '16px';

        // Ensure langToggle is above overlay
        langToggle.style.zIndex = '10001';

        document.querySelectorAll('.lang-option').forEach(option => {
            option.style.padding = isPhone ? '6px 10px' : '8px 12px';
            option.style.cursor = 'pointer';
            option.style.transition = 'background-color 0.2s';
            option.style.display = 'flex';
            option.style.alignItems = 'center';
            option.style.textDecoration = 'none';
            option.querySelector('.lang-flag').style.marginRight = '8px';

            option.addEventListener('mouseenter', () => {
                if (!isPhone && !isTablet) {
                    option.style.backgroundColor = '#f0f0f0';
                }
            });
            option.addEventListener('mouseleave', () => {
                option.style.backgroundColor = '';
            });
            option.addEventListener('touchstart', () => {
                option.style.backgroundColor = '#e0e0e0';
            });
            option.addEventListener('touchend', () => {
                setTimeout(() => {
                    option.style.backgroundColor = '';
                }, 100);
            });
        });

        langToggle.addEventListener('click', function (e) {
            e.preventDefault();
            const isVisible = languageDropdown.style.display === 'block';
            languageDropdown.style.display = isVisible ? 'none' : 'block';
            console.log('Dropdown toggled:', languageDropdown.style.display);
        });

        document.addEventListener('click', function (e) {
            if (!langToggle.contains(e.target) && !languageDropdown.contains(e.target)) {
                languageDropdown.style.display = 'none';
                console.log('Dropdown closed (click outside)');
            }
        });

        document.querySelectorAll('.lang-option').forEach(option => {
            option.addEventListener('click', function (e) {
                e.preventDefault();
                const selectedLang = this.getAttribute('data-lang');
                const flagSrc = this.querySelector('.lang-flag').src;
                const flagAlt = this.querySelector('.lang-flag').alt;
                const langCode = selectedLang.split('-')[0].toUpperCase();

                flagImg.src = flagSrc;
                flagImg.alt = flagAlt;
                langSpan.textContent = langCode;

                if (getCookieConsent() === 'accepted') {
                    translatePage(selectedLang);
                } else {
                    localStorage.setItem('selectedLanguage', selectedLang); // Store language even if cookies not accepted
                }
                languageDropdown.style.display = 'none';
                console.log('Language selected:', selectedLang, 'Flag:', flagSrc);
            });

            option.setAttribute('tabindex', '0');
            option.addEventListener('keydown', function (e) {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    const selectedLang = this.getAttribute('data-lang');
                    const flagSrc = this.querySelector('.lang-flag').src;
                    const flagAlt = this.querySelector('.lang-flag').alt;
                    const langCode = selectedLang.split('-')[0].toUpperCase();

                    flagImg.src = flagSrc;
                    flagImg.alt = flagAlt;
                    langSpan.textContent = langCode;

                    if (getCookieConsent() === 'accepted') {
                        translatePage(selectedLang);
                    } else {
                        localStorage.setItem('selectedLanguage', selectedLang); // Store language even if cookies not accepted
                    }
                    languageDropdown.style.display = 'none';
                    console.log('Language selected (keyboard):', selectedLang);
                }
            });
        });

        langToggle.setAttribute('tabindex', '0');
        langToggle.addEventListener('keydown', function (e) {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                const isVisible = languageDropdown.style.display === 'block';
                languageDropdown.style.display = isVisible ? 'none' : 'block';
                console.log('Dropdown toggled (keyboard):', languageDropdown.style.display);
            }
        });

        languageDropdown.style.webkitOverflowScrolling = 'touch';

        window.addEventListener('resize', () => {
            const newIsPhone = window.innerWidth < 768;
            const newIsTablet = window.innerWidth >= 768 && window.innerWidth < 1024;
            languageDropdown.style.maxHeight = newIsPhone ? '150px' : newIsTablet ? '200px' : '250px';
            languageDropdown.style.width = newIsPhone ? '120px' : newIsTablet ? '140px' : '150px';
            languageDropdown.style.fontSize = newIsPhone ? '14px' : '16px';
            document.querySelectorAll('.lang-option').forEach(option => {
                option.style.padding = newIsPhone ? '6px 10px' : '8px 12px';
            });
        });

        // Restore previously selected language
        const savedLang = localStorage.getItem('selectedLanguage');
        if (savedLang && savedLang !== 'en') {
            document.querySelectorAll('.lang-option').forEach(option => {
                if (option.getAttribute('data-lang') === savedLang) {
                    const flagSrc = option.querySelector('.lang-flag').src;
                    const flagAlt = option.querySelector('.lang-flag').alt;
                    const langCode = savedLang.split('-')[0].toUpperCase();
                    flagImg.src = flagSrc;
                    flagImg.alt = flagAlt;
                    langSpan.textContent = langCode;
                    if (getCookieConsent() === 'accepted') {
                        translatePage(savedLang); // Translate only if cookies accepted
                    }
                }
            });
        }
    } else {
        console.warn('Language selector elements not found:', { langToggle, languageDropdown, flagImg, langSpan });
    }
}