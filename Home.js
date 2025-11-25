document.addEventListener('DOMContentLoaded', () => {
    // --- Loading Screen ---
    const loadingScreen = document.getElementById('loadingScreen');
    
    // Hide loading screen after 3.1 seconds
    setTimeout(() => {
        if (loadingScreen) {
            loadingScreen.classList.add('fade-out');
            // Remove from DOM after animation completes
            setTimeout(() => {
                loadingScreen.style.display = 'none';
            }, 800);
        }
    }, 3000);

    // --- Navigation Setup ---
    const navLinks = document.querySelectorAll('.nav-links a:not([href$="Login.html"]):not([href$="FAQ.html"])'); // Exclude external links for indicator
    const allNavLinks = document.querySelectorAll('.nav-links a'); // For general purposes
    const mobileLinks = document.querySelectorAll('.mobile-nav-links a');
    const navIndicator = document.querySelector('.nav-indicator');
    const navLinksContainer = document.querySelector('.nav-links');
    const mobileMenuPanel = document.getElementById('mobile-menu-panel');
    const burgerMenu = document.querySelector('.burger-menu');
    const closeMenu = document.querySelector('.close-menu');
    const header = document.querySelector('header');
    const burgerIcon = document.getElementById('burgerIcon');

    let currentActiveLink = null;
    let isMobileMenuOpen = false;
    let isUserNavigatingToHash = false; 
    let scrollEndTimer = null;

    // updated code in order to fix burger menu issue
    function closeMobileMenu() {
        if (mobileMenuPanel) {
            mobileMenuPanel.classList.remove('active');
        }
        if (burgerMenu) {
            burgerMenu.setAttribute('aria-expanded', 'false');
            burgerMenu.classList.remove('active');
            burgerMenu.classList.remove('is-x');
        }
        document.body.style.overflow = '';
        isMobileMenuOpen = false;
        if (burgerIcon) {
            burgerIcon.innerHTML = '☰';
        }
    }

    function updateIndicator(link, isInstant = false) {
        if (!navIndicator || !navLinksContainer || !link || !link.closest('.nav-links')) {
            if (navIndicator) navIndicator.style.opacity = '0';
            return;
        }
        // Only proceed if the link is part of the main nav group that uses the indicator
        if (link.getAttribute('href').endsWith('.html')) { // Don't move indicator for external links
            if (currentActiveLink) { // Keep indicator on the current active internal link
                const linkRect = currentActiveLink.getBoundingClientRect();
                const containerRect = navLinksContainer.getBoundingClientRect();
                navIndicator.style.width = `${linkRect.width}px`;
                navIndicator.style.left = `${linkRect.left - containerRect.left}px`;
                navIndicator.style.opacity = '1';
            } else {
                navIndicator.style.opacity = '0';
            }
            return;
        }

        const linkRect = link.getBoundingClientRect();
        const containerRect = navLinksContainer.getBoundingClientRect();
        const indicatorLeft = linkRect.left - containerRect.left + navLinksContainer.scrollLeft; // Added scrollLeft
        const indicatorWidth = linkRect.width;

        navIndicator.style.transition = isInstant ? 'none' : 'all 0.35s cubic-bezier(0.25, 0.8, 0.25, 1)';
        navIndicator.style.width = `${indicatorWidth}px`;
        navIndicator.style.left = `${indicatorLeft}px`;
        navIndicator.style.opacity = '1';

        if (isInstant) {
            void navIndicator.offsetWidth; // Force reflow
            navIndicator.style.transition = 'all 0.35s cubic-bezier(0.25, 0.8, 0.25, 1)';
        }
    }

    function setActiveLink(targetLink, options = { updateIndicatorState: true, isSectionScroll: false }) {
        if (!targetLink) return;

        const targetHref = targetLink.getAttribute('href');
        const isExternalPageLink = targetHref && (targetHref.endsWith('.html'));

        // Remove 'active' from all desktop and mobile links
        allNavLinks.forEach(l => l.classList.remove('active'));
        mobileLinks.forEach(l => l.classList.remove('active'));

        targetLink.classList.add('active');
        if (!isExternalPageLink) { // Only set currentActiveLink for internal (hash) links
            currentActiveLink = targetLink;
        }


        const correspondingMobileLink = document.querySelector(`.mobile-nav-links a[href="${targetHref}"], .mobile-nav-links a[data-page="${targetLink.dataset.page}"]`);
        if (correspondingMobileLink) {
            correspondingMobileLink.classList.add('active');
        }

        if (options.updateIndicatorState && targetLink.closest('.nav-links') && !isExternalPageLink) {
            updateIndicator(targetLink, !options.isSectionScroll); // Instant if not from scroll
        } else if (isExternalPageLink && navIndicator) {
            // If it's an external link but we have a currentActiveLink (previous page was internal), keep indicator there
            if (currentActiveLink && currentActiveLink !== targetLink) {
                updateIndicator(currentActiveLink, true);
            } else {
                // If the external link itself was somehow set as current, or no current, hide indicator
                const homeLinkForIndicator = document.querySelector('.nav-links a[data-page="home"]');
                if (window.location.pathname.includes(targetLink.getAttribute('href')) && homeLinkForIndicator && targetLink.getAttribute('href').includes('FAQ.html') || targetLink.getAttribute('href').includes('Login.html')) {
                    // If on FAQ/Login page, try to find a "home" or similar to place indicator, or hide
                    // For now, just hide if no clear section on these pages.
                    // Or better: if currentActiveLink is an external page, try to reset indicator to home
                    if (homeLinkForIndicator && currentActiveLink && (currentActiveLink.getAttribute('href').endsWith('FAQ.html') || currentActiveLink.getAttribute('href').endsWith('Login.html'))) {
                        // This case is tricky, for now, if navigating TO an external page, the active class is set, but indicator logic focuses on # links
                        // Let's re-evaluate if currentActiveLink IS an external page link
                        if (currentActiveLink.getAttribute('href').endsWith('.html') && navIndicator) {
                            navIndicator.style.opacity = '0'; // Hide for external pages unless specific logic added
                        }
                    }

                } else if (navIndicator) {
                    navIndicator.style.opacity = '0';
                }

            }
        }
    }


    function initializeActiveLink() {
        const currentPath = window.location.pathname.split('/').pop(); // Get file name or empty if root
        const currentHash = window.location.hash;
        let foundActiveLink = null;

        if (currentHash) {
            foundActiveLink = document.querySelector(`.nav-links a[href="${currentHash}"]`);
        }

        if (!foundActiveLink) {
            allNavLinks.forEach(link => {
                const linkPath = (link.getAttribute('href') || "").split('/').pop();
                const dataPage = link.getAttribute('data-page');

                if (linkPath && currentPath === linkPath && linkPath !== "") { // Matches Login.html or FAQ.html
                    foundActiveLink = link;
                } else if (dataPage === 'home' && (currentPath === '' || currentPath === 'index.html' || currentPath === 'Home.html')) {
                    foundActiveLink = link;
                }
                // Add more specific page checks if needed for other data-page attributes
            });
        }

        // Fallback for root/index page if no hash and no specific file match
        if (!foundActiveLink && (currentPath === '' || currentPath === 'index.html' || currentPath === 'Home.html')) {
            foundActiveLink = document.querySelector('.nav-links a[data-page="home"], .nav-links a[href="#home"]');
        }


        if (foundActiveLink) {
            setActiveLink(foundActiveLink, { updateIndicatorState: true, isSectionScroll: false });
            // Ensure indicator is placed instantly on load for the correct link
            setTimeout(() => {
                if (foundActiveLink.getAttribute('href').startsWith('#')) {
                    updateIndicator(foundActiveLink, true);
                } else if (navIndicator) { // If it's an external page link like FAQ/Login
                    navIndicator.style.opacity = '0'; // Hide indicator for external pages on init
                }
            }, 50);
        } else if (navIndicator) {
            navIndicator.style.opacity = '0';
        }
    }


    function smoothScrollTo(targetElementOrTop) {
        const headerHeight = header ? header.offsetHeight : 70; // Approx height
        let targetPosition = 0;

        if (typeof targetElementOrTop === 'number') {
            targetPosition = targetElementOrTop;
        } else if (targetElementOrTop) {
            const elementRect = targetElementOrTop.getBoundingClientRect();
            targetPosition = elementRect.top + window.pageYOffset - headerHeight;
        }

        window.scrollTo({
            top: targetPosition,
            behavior: 'smooth'
        });
    }

    allNavLinks.forEach(link => {
        link.addEventListener('mouseenter', () => {
            if (link.closest('.nav-links') && !link.getAttribute('href').endsWith('.html')) { // Only for internal hash links
                updateIndicator(link);
            }
        });

        link.addEventListener('click', (e) => {
            const href = link.getAttribute('href');
            if (href && href.startsWith('#')) {
                e.preventDefault();
                const sectionId = href.substring(1);
                const section = document.getElementById(sectionId);

                // Suppress observer updates during programmatic smooth scroll
                isUserNavigatingToHash = true;

                if (section) smoothScrollTo(section);
                else if (href === '#home') smoothScrollTo(0);

                setActiveLink(link);
                if (isMobileMenuOpen && mobileMenuPanel) {
                    mobileMenuPanel.classList.remove('active');
                    burgerMenu.setAttribute('aria-expanded', 'false');
                    burgerMenu.classList.remove('active');
                    isMobileMenuOpen = false;
                }
            } else {
                // For external links like FAQ.html, Login.html
                setActiveLink(link); // This will correctly set active class, indicator hidden by its logic
                if (isMobileMenuOpen && mobileMenuPanel) {
                    mobileMenuPanel.classList.remove('active');
                    burgerMenu.setAttribute('aria-expanded', 'false');
                    burgerMenu.classList.remove('active');
                    isMobileMenuOpen = false;
                }
                // Allow default navigation
            }
        });
    });

    
    
    // Add this code to the click event listener for allNavLinks
allNavLinks.forEach(link => {
    link.addEventListener('click', (e) => {
        const href = link.getAttribute('href');
        if (href && href.startsWith('#')) {
            e.preventDefault();
            const sectionId = href.substring(1);
            const section = document.getElementById(sectionId);

            if (section) smoothScrollTo(section);
            else if (href === '#home') smoothScrollTo(0);

            setActiveLink(link);
            if (isMobileMenuOpen && mobileMenuPanel) {
                mobileMenuPanel.classList.remove('active');
                burgerMenu.setAttribute('aria-expanded', 'false');
                burgerMenu.classList.remove('active');
                burgerMenu.classList.remove('is-x');
                document.body.style.overflow = '';
                isMobileMenuOpen = false;
                burgerIcon.innerHTML = '☰';
            }
        } else {
            // For external links like FAQ.html, Login.html
            setActiveLink(link);
            if (isMobileMenuOpen && mobileMenuPanel) {
                mobileMenuPanel.classList.remove('active');
                burgerMenu.setAttribute('aria-expanded', 'false');
                burgerMenu.classList.remove('active');
                burgerMenu.classList.remove('is-x');
                document.body.style.overflow = '';
                isMobileMenuOpen = false;
                burgerIcon.innerHTML = '☰';
            }
        }
    });
});    

    if (navLinksContainer) {
    navLinksContainer.addEventListener('mouseleave', () => {
        if (currentActiveLink) {
            updateIndicator(currentActiveLink);
        } else if (navIndicator) {
            navIndicator.style.opacity = '0';
        }
    });
}
    if (burgerMenu && mobileMenuPanel) {
        burgerMenu.addEventListener('click', () => {
            if (isMobileMenuOpen) {
                closeMobileMenu();
            } else {
                mobileMenuPanel.classList.add('active');
                burgerMenu.setAttribute('aria-expanded', 'true');
                burgerMenu.classList.add('active');
                burgerMenu.classList.add('is-x');
                document.body.style.overflow = 'hidden';
                isMobileMenuOpen = true;
                burgerIcon.innerHTML = '✕';
            }
        });
    }
    if (closeMenu && mobileMenuPanel) {
        closeMenu.addEventListener('click', () => {
            closeMobileMenu();
        });
    }

    mobileLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            const href = link.getAttribute('href');
            closeMobileMenu();

            if (href && href.startsWith('#')) {
                e.preventDefault();
                const sectionId = href.substring(1);
                const section = document.getElementById(sectionId);
                const desktopLink = document.querySelector(`.nav-links a[href="${href}"], .nav-links a[data-page="${link.dataset.page}"]`);

                if (section) smoothScrollTo(section);
                else if (href === '#home') smoothScrollTo(0);

                if (desktopLink) setActiveLink(desktopLink);
                link.classList.add('active'); // Ensure mobile link itself also gets active
            } else {
                // For external links, find corresponding desktop link to set active
                const desktopLink = document.querySelector(`.nav-links a[href="${href}"]`);
                if (desktopLink) setActiveLink(desktopLink); // Sets active on desktop
                link.classList.add('active'); // also on mobile
                // Allow default navigation for external links
            }
        });
    });

    window.addEventListener('scroll', () => {
        if (header) {
            header.classList.toggle('scrolled', window.scrollY > 50);
        }
        if (isUserNavigatingToHash) {
            if (scrollEndTimer) clearTimeout(scrollEndTimer);
            scrollEndTimer = setTimeout(() => {
                isUserNavigatingToHash = false;
                // After scroll settles, ensure indicator stays on the selected link
                if (currentActiveLink && !currentActiveLink.getAttribute('href').endsWith('.html')) {
                    updateIndicator(currentActiveLink, true);
                }
            }, 200);
        }
    }, { passive: true });

    // Intersection Observer for Active Section Highlighting on Scroll
    const sectionsToObserve = Array.from(navLinks)
        .map(link => {
            const href = link.getAttribute('href');
            if (href && href.startsWith('#') && href !== '#') {
                return document.getElementById(href.substring(1));
            }
            return null;
        })
        .filter(section => section);

    // Add home section explicitly if it exists and not covered by hash links
    const homeSection = document.getElementById('home');
    if (homeSection && !sectionsToObserve.includes(homeSection)) {
        sectionsToObserve.unshift(homeSection); // Add to beginning for priority
    }


    if (sectionsToObserve.length > 0) {
        const observer = new IntersectionObserver((entries) => {
            if (isUserNavigatingToHash) {
                return; // Ignore section-based updates during programmatic navigation
            }
            let mostVisibleEntry = null;
            let maxRatio = 0;
            // Special handling for top of page (Home section)
            if (window.scrollY < window.innerHeight * 0.3) { // If near the top (e.g., 30% of viewport height)
                const homeLink = document.querySelector('.nav-links a[href="#home"], .nav-links a[data-page="home"]');
                if (homeLink && (!currentActiveLink || currentActiveLink !== homeLink)) {
                    setActiveLink(homeLink, { updateIndicatorState: true, isSectionScroll: true });
                }
                return; // Don't process other entries if home is determined by scroll position
            }

            entries.forEach(entry => {
                if (entry.isIntersecting && entry.intersectionRatio > maxRatio) {
                    mostVisibleEntry = entry;
                    maxRatio = entry.intersectionRatio;
                }
            });

            if (mostVisibleEntry) {
                const sectionId = mostVisibleEntry.target.id;
                const correspondingLink = document.querySelector(`.nav-links a[href="#${sectionId}"], .nav-links a[data-page="${sectionId}"]`);
                if (correspondingLink && currentActiveLink !== correspondingLink) {
                    setActiveLink(correspondingLink, { updateIndicatorState: true, isSectionScroll: true });
                }
            }
        }, {
            root: null,
            rootMargin: `-${header ? header.offsetHeight : 70}px 0px -${window.innerHeight * 0.5}px 0px`, // Adjust top margin for header, bottom to trigger sooner
            threshold: 0.05 // Trigger when 10% of the section is visible
        });

        sectionsToObserve.forEach(section => observer.observe(section));
    }


    // --- Pricing Functionality ---
    const pricingCards = document.querySelectorAll('.pricing-card');
    pricingCards.forEach(card => {
        const checkboxes = card.querySelectorAll('.feature-checkbox');
        const priceValueElement = card.querySelector('.price-value');
        const basePriceElement = card.querySelector('.price');

        if (!priceValueElement || !basePriceElement) return;

        const basePrice = parseInt(basePriceElement.getAttribute('data-base-price') || '0');

        function updatePrice() {
            let additionalCost = 0;
            checkboxes.forEach(checkbox => {
                if (checkbox.checked) {
                    additionalCost += parseInt(checkbox.getAttribute('data-price') || '0');
                }
            });
            priceValueElement.textContent = basePrice + additionalCost;
        }

        checkboxes.forEach(checkbox => {
            checkbox.addEventListener('change', updatePrice);
        });
        updatePrice(); // Initial price calculation
    });





    // --- Story Section Improvement ---
    const storyPathContainer = document.querySelector('.story-path-container');
    const storyPath = storyPathContainer ? storyPathContainer.querySelector('.story-path') : null;
    const pathFill = storyPathContainer ? storyPathContainer.querySelector('.path-fill') : null;
    const glowPoint = storyPathContainer ? storyPathContainer.querySelector('.glow-point') : null;
    const timelineItemsWrapper = storyPathContainer ? storyPathContainer.querySelector('.timeline-items-wrapper') : null;
    const timelineItems = timelineItemsWrapper ? Array.from(timelineItemsWrapper.querySelectorAll('.timeline-item')) : [];

    let lastScrollY = window.scrollY;
    let ticking = false;

    function updateTimelineOnScroll(scrollY) {
        if (!storyPathContainer || !pathFill || !glowPoint || timelineItems.length === 0 || !timelineItemsWrapper) return;

        const viewportHeight = window.innerHeight;
        // Use timelineItemsWrapper as the reference for scroll progress within the story section
        const wrapperRect = timelineItemsWrapper.getBoundingClientRect();
        const wrapperTop = wrapperRect.top + scrollY; // Absolute top of the wrapper
        const wrapperHeight = timelineItemsWrapper.scrollHeight; // Total scrollable height of items

        // Calculate scroll progress relative to the timelineItemsWrapper
        // Start filling when top of wrapper is about to enter viewport, end when bottom of wrapper is about to leave
        const scrollStartOffset = viewportHeight * 0.7; // Start when 70% of viewport from top hits wrapper
        const scrollEndOffset = viewportHeight * 0.3;   // End when 30% of viewport from bottom hits wrapper bottom

        let progress = (scrollY - (wrapperTop - scrollStartOffset)) / (wrapperHeight - scrollStartOffset + scrollEndOffset);
        progress = Math.min(Math.max(progress, 0), 1);

        pathFill.style.height = `${progress * 100}%`;
        glowPoint.style.top = `${progress * 100}%`; // Position glowPoint based on fill percentage

        timelineItems.forEach((item) => {
            const itemRect = item.getBoundingClientRect();
            const itemTopRelativeToViewport = itemRect.top;
            const itemBottomRelativeToViewport = itemRect.bottom;
            const itemHeight = itemRect.height;

            // Consider an item "visible" if its top part is within a certain range of the viewport
            // e.g., from 20% from top of viewport to 80% from top of viewport
            const visibilityThresholdTop = viewportHeight * 0.15;
            const visibilityThresholdBottom = viewportHeight * 0.85;

            const connectorFill = item.querySelector('.connector-fill');

            if (itemTopRelativeToViewport < visibilityThresholdBottom && itemBottomRelativeToViewport > visibilityThresholdTop) {
                if (!item.classList.contains('visible')) {
                    item.classList.add('visible');
                }
            } else {
                // Optionally, remove 'visible' if you want items to fade out when scrolled past significantly
                // For now, let's keep them visible once they appear within the main scroll flow.
                // If you want them to disappear:
                // if (item.classList.contains('visible') && (itemBottomRelativeToViewport < 0 || itemTopRelativeToViewport > viewportHeight)) {
                //    item.classList.remove('visible');
                // }
            }
        });
    }

    function onScroll() {
        lastScrollY = window.scrollY;
        if (!ticking) {
            window.requestAnimationFrame(() => {
                updateTimelineOnScroll(lastScrollY);
                ticking = false;
            });
            ticking = true;
        }
    }


    // Initializations
    initializeActiveLink();
    if (storyPathContainer) { // Only add scroll listener if story section exists
        window.addEventListener('scroll', onScroll, { passive: true });
        updateTimelineOnScroll(window.scrollY); // Initial call
    }


    window.addEventListener('resize', () => {
        if (currentActiveLink && !currentActiveLink.getAttribute('href').endsWith('.html')) {
            updateIndicator(currentActiveLink, true);
        } else if (navIndicator) { // On resize, if current is external, try to reset to home or hide
            const homeLinkForIndicator = document.querySelector('.nav-links a[data-page="home"]');
            if (homeLinkForIndicator && window.location.hash === '' && (window.location.pathname === '/' || window.location.pathname.endsWith('index.html') || window.location.pathname.endsWith('Home.html'))) {
                updateIndicator(homeLinkForIndicator, true);
            } else {
                navIndicator.style.opacity = '0';
            }
        }

        if (storyPathContainer) {
            updateTimelineOnScroll(window.scrollY); // Update timeline on resize
        }
    });
}); document.addEventListener('DOMContentLoaded', function () {
    const faqItems = document.querySelectorAll('.faq-item');

    faqItems.forEach(item => {
        const question = item.querySelector('.faq-question');

        question.addEventListener('click', () => {
            // Close all other items
            faqItems.forEach(otherItem => {
                if (otherItem !== item && otherItem.classList.contains('active')) {
                    otherItem.classList.remove('active');
                }
            });

            // Toggle the clicked item
            item.classList.toggle('active');
        });
    });
});

// Enhanced footer interactions
document.addEventListener('DOMContentLoaded', function() {
  const footer = document.querySelector('.footer');
  const brandText = document.querySelector('.brand-text');
  const emailWrapper = document.querySelector('.email-wrapper');
  const emailLink = document.querySelector('.email-link');

  // Intersection Observer for footer animation
  const footerObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.style.animation = 'fadeInUp 1s ease-out';
        brandText.style.animationDelay = '0.3s';
        emailWrapper.style.animationDelay = '0.6s';
      }
    });
  }, {
    threshold: 0.1
  });

  if (footer) {
    footerObserver.observe(footer);
  }



  // Parallax effect for footer background
  window.addEventListener('scroll', function() {
    if (footer) {
      const scrolled = window.pageYOffset;
      const footerOffset = footer.offsetTop;
      const windowHeight = window.innerHeight;
      
      if (scrolled + windowHeight > footerOffset) {
        const parallaxValue = (scrolled - footerOffset) * 0.5;
        footer.style.backgroundPosition = `center ${parallaxValue}px`;
      }
    }
  });
});

// CSS keyframes for animations (injected via JavaScript)
const styleSheet = document.createElement('style');
styleSheet.textContent = `
  @keyframes fadeInUp {
    from {
      opacity: 0;
      transform: translateY(30px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
  
  @keyframes ripple {
    0% {
      transform: scale(0);
      opacity: 1;
    }
    100% {
      transform: scale(1);
      opacity: 0;
    }
  }
`;
document.head.appendChild(styleSheet);

// Portfolio Section JavaScript
document.addEventListener('DOMContentLoaded', function() {
    const portfolioCards = document.querySelectorAll('.portfolio-card');
    const portfolioCursor = document.getElementById('portfolioCursor');
    
    // Custom cursor functionality
    function initPortfolioCursor() {
        portfolioCards.forEach(card => {
            card.addEventListener('mouseenter', function() {
                portfolioCursor.classList.add('active');
            });
            
            card.addEventListener('mouseleave', function() {
                portfolioCursor.classList.remove('active');
            });
            
            card.addEventListener('mousemove', function(e) {
                portfolioCursor.style.left = e.clientX + 'px';
                portfolioCursor.style.top = e.clientY + 'px';
            });
        });
    }
    
    // Initialize cards
    portfolioCards.forEach((card, index) => {
        // Add click functionality
        card.addEventListener('click', function() {
            const url = this.getAttribute('data-url');
            if (url) {
                window.open(url, '_blank');
            }
        });
    });
    
    // Initialize cursor
    initPortfolioCursor();
    
    // Touch support for mobile
    portfolioCards.forEach(card => {
        let touchStartY = 0;
        
        card.addEventListener('touchstart', function(e) {
            touchStartY = e.touches[0].clientY;
        });
        
        card.addEventListener('touchend', function(e) {
            const touchEndY = e.changedTouches[0].clientY;
            const touchDiff = touchStartY - touchEndY;
            
            if (Math.abs(touchDiff) < 10) {
                const url = this.getAttribute('data-url');
                if (url) {
                    window.open(url, '_blank');
                }
            }
        });
    });
});

    // CTA Section JavaScript
document.addEventListener('DOMContentLoaded', function() {
    const ctaButton = document.querySelector('.cta-button');

    // Button click tracking
    if (ctaButton) {
        ctaButton.addEventListener('click', function(e) {
            // You can add calendar booking logic here
            // For example: open calendar modal, redirect to booking page, etc.
            console.log('CTA button clicked - redirect to calendar booking');
        });
    }
});

// Prevent pricing feature checkboxes from being unchecked
document.addEventListener('DOMContentLoaded', function() {
    const planFeatures = document.querySelectorAll('.plan-features .feature-checkbox input[type="checkbox"]');
    
    planFeatures.forEach(checkbox => {
        checkbox.addEventListener('click', function(e) {
            // Prevent unchecking - always keep it checked
            if (!this.checked) {
                e.preventDefault();
                this.checked = true;
            }
        });
    });
});

// Futuristic Custom Cursor
document.addEventListener('DOMContentLoaded', () => {
    if (window.innerWidth > 768) {
        const cursor = document.createElement('div');
        cursor.className = 'custom-cursor';
        const follower = document.createElement('div');
        follower.className = 'cursor-follower';
        document.body.appendChild(cursor);
        document.body.appendChild(follower);

        let mouseX = 0, mouseY = 0;
        let followerX = 0, followerY = 0;

        document.addEventListener('mousemove', (e) => {
            mouseX = e.clientX;
            mouseY = e.clientY;
            cursor.style.left = mouseX + 'px';
            cursor.style.top = mouseY + 'px';
            cursor.classList.add('active');
            follower.classList.add('active');
        });

        function animateFollower() {
            followerX += (mouseX - followerX) * 0.1;
            followerY += (mouseY - followerY) * 0.1;
            follower.style.left = followerX + 'px';
            follower.style.top = followerY + 'px';
            requestAnimationFrame(animateFollower);
        }
        animateFollower();

        const hoverElements = document.querySelectorAll('a, button, .action-btn, .learn-more, .cta-btn, .portfolio-card');
        hoverElements.forEach(el => {
            el.addEventListener('mouseenter', () => {
                cursor.classList.add('hover');
                follower.classList.add('hover');
            });
            el.addEventListener('mouseleave', () => {
                cursor.classList.remove('hover');
                follower.classList.remove('hover');
            });
        });
    }
});
