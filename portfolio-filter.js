document.addEventListener('DOMContentLoaded', () => {
    const filterButtons = document.querySelectorAll('.filter-btn');
    const portfolioCards = document.querySelectorAll('.portfolio-card');
    const filterContainer = document.querySelector('.portfolio-filters');
    const filterIndicator = document.querySelector('.filter-indicator');

    function updateFilterIndicator(targetBtn) {
        if (!filterIndicator || !targetBtn || !filterContainer) return;
        const containerRect = filterContainer.getBoundingClientRect();
        const btnRect = targetBtn.getBoundingClientRect();
        const left = btnRect.left - containerRect.left;
        const width = btnRect.width;
        filterIndicator.style.width = `${width}px`;
        filterIndicator.style.left = `${left}px`;
        filterIndicator.style.opacity = '1';
    }

    function applyFilter(filter) {
        portfolioCards.forEach(card => {
            const cardCategory = card.getAttribute('data-category');
            if (filter === 'all' || cardCategory === filter) {
                card.classList.remove('hidden');
                // Pulse appearance
                card.style.opacity = '0';
                card.style.transform = 'scale(0.98)';
                setTimeout(() => {
                    card.style.opacity = '1';
                    card.style.transform = 'scale(1)';
                }, 10);
            } else {
                card.classList.add('hidden');
            }
        });
    }

    if (filterButtons.length > 0) {
        // Initial setup
        const activeBtn = document.querySelector('.filter-btn.active') || filterButtons[0];
        const initialFilter = activeBtn.getAttribute('data-filter');

        // Use ResizeObserver for more accurate indicator positioning
        const ro = new ResizeObserver(() => {
            if (document.querySelector('.filter-btn.active')) {
                updateFilterIndicator(document.querySelector('.filter-btn.active'));
            }
        });
        if (filterContainer) ro.observe(filterContainer);

        // Apply initial filter
        applyFilter(initialFilter);
        setTimeout(() => updateFilterIndicator(activeBtn), 100);

        filterButtons.forEach(button => {
            button.addEventListener('mouseenter', () => updateFilterIndicator(button));

            button.addEventListener('click', () => {
                filterButtons.forEach(btn => btn.classList.remove('active'));
                button.classList.add('active');
                updateFilterIndicator(button);
                applyFilter(button.getAttribute('data-filter'));
            });
        });

        if (filterContainer) {
            filterContainer.addEventListener('mouseleave', () => {
                const activeBtn = document.querySelector('.filter-btn.active');
                if (activeBtn) updateFilterIndicator(activeBtn);
            });
        }

        // Mobile Custom Dropdown Logic
        const dropdown = document.getElementById('mobile-portfolio-dropdown');
        if (dropdown) {
            const header = dropdown.querySelector('.dropdown-header');
            const selectedText = dropdown.querySelector('.selected-text');
            const options = dropdown.querySelectorAll('.dropdown-option');

            // Toggle Dropdown
            header.addEventListener('click', (e) => {
                e.stopPropagation();
                dropdown.classList.toggle('open');
            });

            // Handle Option Selection
            options.forEach(option => {
                option.addEventListener('click', (e) => {
                    const value = option.getAttribute('data-value');
                    const text = option.textContent;

                    // Update UI
                    selectedText.textContent = text;
                    dropdown.classList.remove('open');

                    // Update Selected State
                    options.forEach(opt => opt.removeAttribute('data-selected'));
                    option.setAttribute('data-selected', 'true');

                    // Trigger Filter (Sync with Desktop Buttons)
                    const targetBtn = document.querySelector(`.filter-btn[data-filter="${value}"]`);
                    if (targetBtn) {
                        targetBtn.click();
                    }
                });
            });

            // Close when clicking outside
            document.addEventListener('click', (e) => {
                if (!dropdown.contains(e.target)) {
                    dropdown.classList.remove('open');
                }
            });

            // Sync initial state from active button
            if (activeBtn) {
                const initialValue = activeBtn.getAttribute('data-filter');
                const matchingOption = dropdown.querySelector(`.dropdown-option[data-value="${initialValue}"]`);
                if (matchingOption) {
                    selectedText.textContent = matchingOption.textContent;
                    matchingOption.setAttribute('data-selected', 'true');
                }
            }
        }
    }
});
