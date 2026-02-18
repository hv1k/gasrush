// GasRush — Mobile Support
// Hamburger menu + swipe to close sidebar

(function() {
    // Inject hamburger button if mobile
    function initMobile() {
        const sidebar = document.querySelector('.sidebar');
        if (!sidebar) return;

        // Create hamburger
        const btn = document.createElement('button');
        btn.className = 'hamburger';
        btn.innerHTML = '☰';
        btn.setAttribute('aria-label', 'Toggle menu');
        btn.addEventListener('click', () => sidebar.classList.toggle('open'));
        document.body.appendChild(btn);

        // Create backdrop
        const backdrop = document.createElement('div');
        backdrop.className = 'sidebar-backdrop';
        backdrop.addEventListener('click', () => sidebar.classList.remove('open'));
        document.body.appendChild(backdrop);

        // Close sidebar on nav click (mobile)
        sidebar.addEventListener('click', (e) => {
            if (e.target.closest('.nav-link')) {
                sidebar.classList.remove('open');
            }
        });

        // Swipe to close
        let startX = 0;
        sidebar.addEventListener('touchstart', (e) => { startX = e.touches[0].clientX; });
        sidebar.addEventListener('touchend', (e) => {
            const diff = startX - e.changedTouches[0].clientX;
            if (diff > 60) sidebar.classList.remove('open');
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initMobile);
    } else {
        initMobile();
    }
})();
