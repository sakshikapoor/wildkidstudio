// Replace every [data-lucide] placeholder with its SVG icon.
// Runs before the button border is measured below, so widths are final.
if (window.lucide) lucide.createIcons();

// Animated draw-on border for every .button (start a project, email).
(function () {
    const inset = 0.5; // keep the 1px stroke fully inside the box

    function setup(btn) {
        const svg = btn.querySelector('.btn-border');
        const path = svg.querySelector('path');

        function build() {
            const w = btn.clientWidth;
            const h = btn.clientHeight;
            if (!w || !h) return;
            svg.setAttribute('viewBox', `0 0 ${w} ${h}`);
            const cx = w / 2;
            // start at top-center, travel clockwise, return to top-center
            const d = `M ${cx} ${inset}`
                + ` L ${w - inset} ${inset}`
                + ` L ${w - inset} ${h - inset}`
                + ` L ${inset} ${h - inset}`
                + ` L ${inset} ${inset}`
                + ` L ${cx} ${inset}`;
            path.setAttribute('d', d);
            const len = path.getTotalLength();
            path.style.strokeDasharray = len;
            path.style.strokeDashoffset = btn.matches(':hover') ? 0 : len;
        }

        build();
        window.addEventListener('resize', build);
        if (document.fonts && document.fonts.ready) document.fonts.ready.then(build);

        btn.addEventListener('mouseenter', () => { path.style.strokeDashoffset = 0; });
        btn.addEventListener('mouseleave', () => {
            path.style.strokeDashoffset = path.getTotalLength();
        });
    }

    document.querySelectorAll('.button').forEach(setup);
})();

const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const els = document.querySelectorAll('.reveal');
if (reduced || !('IntersectionObserver' in window)) {
    els.forEach(el => el.classList.add('in'));
} else {
    const io = new IntersectionObserver(entries => {
        entries.forEach(e => {
            if (e.isIntersecting) {
                e.target.classList.add('in');
                io.unobserve(e.target);
            }
        });
    }, { threshold: 0.12 });
    els.forEach(el => io.observe(el));
}
